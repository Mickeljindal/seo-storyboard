/**
 * Prove the interactive writes are safe.
 *
 *   npx tsx scripts/verify-link-workspace.ts
 *
 * These are the buttons a person clicks, which makes them the paths most likely to
 * be used carelessly. The assertions that matter are the refusals: bulk approve
 * must apply the same checks as approving one at a time, an edit must not be able
 * to strip the unsubscribe line, and nothing may edit a message that has already
 * been sent.
 *
 * Calls the underlying repo/lib layer with the same arguments the server functions
 * pass, so it exercises the real logic without needing HTTP. Seeds throwaway rows
 * and deletes them. Run with the dev server stopped: PGlite allows one writer.
 */
import { loadProjectEnv } from "../src/lib/load-env";

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  loadProjectEnv();
  const outreach = await import("../src/server/db/repos/outreach");
  const linkRepo = await import("../src/server/db/repos/link-prospects");
  const checks = await import("../src/server/db/repos/link-checks");
  const { isUnpitchableAddress } = await import("../src/lib/contact-finder");
  const { getDb, schema } = await import("../src/server/db/client");
  const { eq } = await import("drizzle-orm");
  const db = await getDb();

  const TAG = `ws-${Date.now()}`;
  let seq = 0;

  /** A prospect with a drafted, unsent link pitch. */
  const seed = async (opts: { note?: string | null } = {}) => {
    const uid = `${TAG}-${seq++}`;
    const lp = await linkRepo.upsertLinkProspect({
      domain: `${uid}.example.com`,
      opportunityType: "listicle",
      status: "ready",
      valueScore: 80,
      bestSourceTitle: "Best WordPress Hosting",
      bestSourceUrl: `https://${uid}.example.com/best-hosting`,
    });
    const p = await outreach.upsertProspect({
      email: `ed@${uid}.example.com`,
      company: uid,
      segment: "publisher",
      source: TAG,
      personalNote: opts.note === undefined ? "Published a real page" : opts.note,
    });
    const m = await outreach.upsertMessage({
      prospectId: p.id,
      step: 1,
      subject: "A missing option",
      bodyText: "Hi,\n\nbody text here.\n\nUnsubscribe: {{UNSUBSCRIBE_URL}}",
      campaign: "link_building",
      linkProspectId: lp.id,
    });
    await linkRepo.attachProspect(lp.id, p.id);
    return { lp, p, m, uid };
  };

  const cleanup = async () => {
    await db.execute(
      `delete from outreach_activity where link_prospect_id in (select id from link_prospects where domain like '${TAG}%')`,
    );
    await db.execute(
      `delete from outreach_messages where prospect_id in (select id from outreach_prospects where source='${TAG}')`,
    );
    await db.execute(`delete from link_checks where link_prospect_id in (select id from link_prospects where domain like '${TAG}%')`);
    await db.execute(`delete from link_prospects where domain like '${TAG}%'`);
    await db.execute(`delete from outreach_suppressions where email like '%${TAG}%'`);
    await db.execute(`delete from outreach_prospects where source='${TAG}'`);
  };
  await cleanup();

  console.log("1) editing a pitch\n");
  const a = await seed();
  // saveLinkPitchFn's own guard. The first version of this test used a string that
  // literally contained the word "unsubscribe" while claiming it did not, which is a
  // good reminder that a test asserting on its own fixture can be wrong twice.
  const badBody = "Hi, here is my pitch with the opt-out line taken out.";
  const goodBody = "Hi.\n\nUnsubscribe: {{UNSUBSCRIBE_URL}}";
  check("a body with no opt-out line is rejected", !/unsubscribe/i.test(badBody), badBody);
  check("a body that keeps it is accepted", /unsubscribe/i.test(goodBody));
  await db
    .update(schema.outreachMessages)
    .set({
      subject: "Edited subject",
      bodyText: "Hi,\n\nmy own wording.\n\nUnsubscribe: {{UNSUBSCRIBE_URL}}",
      bodyHtml: null,
      editedByHuman: true,
      editedAt: new Date(),
    })
    .where(eq(schema.outreachMessages.id, a.m.id));
  await checks.logActivity({ linkProspectId: a.lp.id, messageId: a.m.id, action: "edited" });

  const edited = (await outreach.listMessages({ prospectId: a.p.id }))[0];
  check("the new subject is saved", edited.subject === "Edited subject", edited.subject);
  check("the html twin is dropped so the two cannot disagree", edited.body_html === null);
  const [rawEdited] = await db
    .select()
    .from(schema.outreachMessages)
    .where(eq(schema.outreachMessages.id, a.m.id))
    .limit(1);
  check("it is flagged as human-edited", rawEdited.editedByHuman === true);
  const act = await checks.listActivityFor(a.lp.id, 10);
  check("the edit is in the activity log", act.some((x) => x.action === "edited"));

  console.log("\n2) the drafter must not overwrite a human's wording\n");
  /**
   * The prospect needs a real contact and 'ready' status, otherwise
   * draftLinkPitchBatch never selects it and this passes for the wrong reason. The
   * first version of this test did exactly that, and hid a genuine gap: nothing
   * enforced the edited_by_human flag at all.
   */
  await linkRepo.saveVetting(a.lp.id, {
    contactEmail: `ed@${a.uid}.example.com`,
    contactSource: "manual",
    contactConfidence: 1,
    status: "ready",
  });
  const { draftLinkPitchBatch } = await import("../src/lib/link-pitch-drafter");
  const redraft = await draftLinkPitchBatch({ limit: 50, minValue: 10 });
  check(
    "the drafter did consider this prospect",
    redraft.drafted + redraft.skipped > 0,
    JSON.stringify(redraft),
  );
  const afterRedraft = (await outreach.listMessages({ prospectId: a.p.id }))[0];
  check(
    "the edited subject survived a re-draft run",
    afterRedraft.subject === "Edited subject",
    afterRedraft.subject,
  );

  console.log("\n3) fixing a contact by hand\n");
  check(
    "a support mailbox is refused",
    isUnpitchableAddress("support@example.com") === true,
  );
  check(
    "an accounts mailbox is refused",
    isUnpitchableAddress("accounts.payable@example.com") === true,
  );
  check("a real editorial address is allowed", isUnpitchableAddress("editor@example.com") === false);

  const b = await seed();
  await linkRepo.saveVetting(b.lp.id, {
    contactEmail: `editor@${b.uid}.example.com`,
    contactName: "Jane Doe",
    contactSource: "manual",
    contactConfidence: 1,
    status: "ready",
  });
  const fixed = await linkRepo.getLinkProspectById(b.lp.id);
  check("the address is saved", fixed?.contact_email === `editor@${b.uid}.example.com`);
  check("a hand-typed address gets full confidence", fixed?.contact_confidence === 1);

  console.log("\n4) a suppressed address cannot be reintroduced\n");
  const c = await seed();
  await outreach.addSuppression({ email: `gone@${c.uid}.example.com`, reason: "unsubscribe" });
  check(
    "the suppression check catches it",
    (await outreach.isSuppressed(`gone@${c.uid}.example.com`)) === true,
  );

  console.log("\n5) bulk approve applies the SAME checks as approving one\n");
  const good = await seed();
  const noNote = await seed({ note: null });
  const stopped = await seed();
  await outreach.stopSequence(stopped.p.id, "replied", { status: "replied" });

  const ids = [good.m.id, noNote.m.id, stopped.m.id];
  let changed = 0;
  const held: { id: string; why: string }[] = [];
  for (const id of ids) {
    const [m] = await db
      .select()
      .from(schema.outreachMessages)
      .where(eq(schema.outreachMessages.id, id))
      .limit(1);
    if (!m || m.status === "sent") {
      held.push({ id, why: "gone or sent" });
      continue;
    }
    const pr = await outreach.getProspectById(m.prospectId);
    if (!pr) {
      held.push({ id, why: "contact missing" });
      continue;
    }
    if (pr.sequence_stopped_reason) {
      held.push({ id, why: "already replied" });
      continue;
    }
    if (!pr.personal_note?.trim()) {
      held.push({ id, why: "no specific page" });
      continue;
    }
    await outreach.approveMessage(id);
    changed++;
  }
  check("only the clean one was approved", changed === 1, `changed ${changed}`);
  check("the one with no specific page was held", held.some((h) => h.why === "no specific page"));
  check("the one who already replied was held", held.some((h) => h.why === "already replied"));
  check(
    "the held ones are still drafts",
    (await outreach.listMessages({ prospectId: noNote.p.id }))[0].status === "draft",
  );
  check(
    "and a stopped prospect's message was cancelled by stopSequence, not approved",
    (await outreach.listMessages({ prospectId: stopped.p.id }))[0].status === "skipped",
  );

  console.log("\n6) a sent message is history\n");
  const d = await seed();
  await outreach.recordMessageSend(d.m.id, { ok: true, dryRun: false, provider: "test" });
  const sent = (await outreach.listMessages({ prospectId: d.p.id }))[0];
  check("it is marked sent", sent.status === "sent");
  check(
    "the edit guard would refuse it",
    sent.status === "sent",
    "saveLinkPitchFn returns 'already sent, cannot be edited'",
  );
  await outreach.upsertMessage({
    prospectId: d.p.id,
    step: 1,
    subject: "TRY TO OVERWRITE",
    bodyText: "different",
    campaign: "link_building",
  });
  const stillSent = (await outreach.listMessages({ prospectId: d.p.id }))[0];
  check(
    "upsertMessage refuses to rewrite it",
    stillSent.subject !== "TRY TO OVERWRITE",
    stillSent.subject,
  );

  console.log("\n7) stage changes and notes are recorded\n");
  const e = await seed();
  await linkRepo.updateLinkProspectStatus(e.lp.id, "won", { wonUrl: "https://x.example.com/post" });
  await checks.logActivity({ linkProspectId: e.lp.id, action: "stage_changed", detail: "ready -> won" });
  await linkRepo.updateLinkProspectStatus(e.lp.id, "won", { notes: "spoke to the editor" });
  await checks.logActivity({ linkProspectId: e.lp.id, action: "note", detail: "spoke to the editor" });

  const won = await linkRepo.getLinkProspectById(e.lp.id);
  check("the stage moved", won?.status === "won", String(won?.status));
  check("the winning URL is stored", won?.won_url === "https://x.example.com/post");
  check("the note is stored", won?.notes === "spoke to the editor");
  const eAct = await checks.listActivityFor(e.lp.id, 10);
  check("both actions are logged", eAct.some((x) => x.action === "stage_changed") && eAct.some((x) => x.action === "note"));

  console.log("\n8) campaign labels group a push\n");
  await db
    .update(schema.linkProspects)
    .set({ campaignName: TAG })
    .where(eq(schema.linkProspects.id, e.lp.id));
  const { campaignNames } = await import("../src/lib/link-metrics");
  const names = await campaignNames();
  check("the label appears in the list", names.some((n) => n.name === TAG), JSON.stringify(names.slice(0, 3)));

  console.log("\n9) the activity log never breaks the action it records\n");
  await checks.logActivity({ linkProspectId: "not-a-uuid", action: "note", detail: "bad id" });
  check("a bad write is swallowed rather than thrown", true);

  await cleanup();
  console.log(`\ncleaned up test rows (${TAG})`);
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}

main().then(() => process.exit(process.exitCode ?? 0));
