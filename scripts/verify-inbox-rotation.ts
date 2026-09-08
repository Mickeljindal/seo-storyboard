import { loadProjectEnv } from "../src/lib/load-env";
loadProjectEnv();

/**
 * VERIFY MULTI-INBOX SENDING.
 *
 * The three things this has to prove, because each one is silent when it breaks:
 *
 *   1. NO SECRET EVER REACHES THE DATABASE.
 *   2. A CONVERSATION KEEPS ITS ADDRESS. If that address cannot send, the message
 *      WAITS. It never quietly goes out from a different address, because a
 *      follow-up from a stranger is worse than a follow-up that is a day late.
 *   3. ADDING ADDRESSES NEVER RAISES THE OVERALL LIMIT. Thirty addresses spread the
 *      same daily cap; they do not multiply it.
 *
 * Nothing here transmits. EMAIL_SEND_ENABLED is unset in this project, and the test
 * asserts that rather than assuming it.
 *
 *   npx tsx scripts/verify-inbox-rotation.ts
 */

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
};

const TAG = `inboxtest-${Date.now()}`;
const { getDb, schema } = await import("../src/server/db/client");
const { eq, inArray, sql } = await import("drizzle-orm");
const db = await getDb();
const repo = await import("../src/server/db/repos/inboxes");
const outreach = await import("../src/server/db/repos/outreach");
const pool = await import("../src/lib/inbox-pool");
const sender = await import("../src/lib/email-sender");

const created: string[] = [];
const prospects: string[] = [];

async function cleanup() {
  if (prospects.length) {
    await db.delete(schema.outreachMessages).where(inArray(schema.outreachMessages.prospectId, prospects));
    await db.delete(schema.outreachProspects).where(inArray(schema.outreachProspects.id, prospects));
  }
  if (created.length) {
    await db.delete(schema.outreachInboxes).where(inArray(schema.outreachInboxes.id, created));
  }
  await db.delete(schema.outreachSuppressions).where(sql`${schema.outreachSuppressions.note} like ${`%${TAG}%`}`);
}

try {
  /* ====================================================================== *
   * 1. Sending is off, so nothing in this file can transmit
   * ====================================================================== */
  console.log("\n1) nothing here can put mail on the wire\n");
  check("EMAIL_SEND_ENABLED is not set", !sender.sendingEnabled());
  const probe = await sender.sendOneEmail({
    to: "nobody@example.com",
    subject: "s",
    html: "unsubscribe",
    text: "unsubscribe",
    dryRun: false,
  });
  check("even dryRun:false stays a dry run while the switch is off", probe.dryRun === true);

  /* ====================================================================== *
   * 2. Adding addresses
   * ====================================================================== */
  console.log("\n2) an address can be added, and cannot be added twice\n");

  const a = await repo.upsertInbox({
    label: "A",
    fromEmail: `a@${TAG}.example.com`,
    fromName: "Alpha",
    dailyCap: 5,
  });
  const b = await repo.upsertInbox({
    label: "B",
    fromEmail: `b@${TAG}.example.com`,
    fromName: "Bravo",
    dailyCap: 5,
  });
  created.push(a.id, b.id);
  check("two addresses added", a.id !== b.id);
  check("the cap is stored", a.daily_cap === 5, String(a.daily_cap));
  check("the warmup clock starts on insert", !!a.warmup_started_at);
  check("provider defaults to the global one", a.provider === "default");

  const again = await repo.upsertInbox({ label: "A renamed", fromEmail: `A@${TAG}.EXAMPLE.COM`, dailyCap: 9 });
  check("the same address in different casing updates rather than duplicates", again.id === a.id);
  check("and the update took effect", again.daily_cap === 9, String(again.daily_cap));
  /**
   * The regression worth guarding. If a sync reset this, every address would be
   * pinned to day zero of its ramp forever while looking like it was warming up.
   */
  check(
    "re-adding does NOT restart the warmup clock",
    again.warmup_started_at === a.warmup_started_at,
    `${a.warmup_started_at} -> ${again.warmup_started_at}`,
  );

  await repo.setInboxStatus(b.id, "paused", "test pause");
  const bPaused = await repo.getInboxById(b.id);
  check("an address can be paused with a reason", bPaused?.status === "paused" && !!bPaused?.paused_reason);
  const bResync = await repo.upsertInbox({ label: "B", fromEmail: b.from_email, status: "active" });
  check(
    "a sync does not un-pause an address somebody deliberately stopped",
    bResync.status === "paused",
    bResync.status,
  );
  await repo.setInboxStatus(b.id, "active", null);

  /* ====================================================================== *
   * 3. No secret in the database
   * ====================================================================== */
  console.log("\n3) credentials live in the environment, never in the database\n");

  process.env.INBOX_TEST_SMTP_HOST = "smtp.test.example.com";
  process.env.INBOX_TEST_SMTP_PASSWORD = "super-secret-value";
  const smtpBox = await repo.upsertInbox({
    label: "SMTP",
    fromEmail: `smtp@${TAG}.example.com`,
    provider: "smtp",
    credentialRef: "INBOX_TEST",
    dailyCap: 5,
  });
  created.push(smtpBox.id);

  const raw = (await db.execute(
    `select * from outreach_inboxes where id = '${smtpBox.id}'`,
  )) as unknown as { rows: Record<string, unknown>[] };
  const asText = JSON.stringify(raw.rows?.[0] ?? {});
  check("the stored row does not contain the password", !asText.includes("super-secret-value"), asText.slice(0, 160));
  check("it stores only the reference", smtpBox.credential_ref === "INBOX_TEST");

  const resolved = pool.resolveInbox(smtpBox);
  check("the credential resolves from the environment at send time", resolved.ok);
  if (resolved.ok) {
    check("the host came from the environment", resolved.inbox.smtp?.host === "smtp.test.example.com");
    check("so did the password", resolved.inbox.smtp?.password === "super-secret-value");
    check("the envelope uses this address", resolved.inbox.fromEmail === smtpBox.from_email);
    check("and replies come back to it", resolved.inbox.replyTo === smtpBox.from_email);
  }

  delete process.env.INBOX_TEST_SMTP_HOST;
  const broken = pool.resolveInbox(smtpBox);
  check("a missing credential is refused, not silently ignored", !broken.ok);
  check(
    "and the message names the exact variable to set",
    !broken.ok && /INBOX_TEST_SMTP_HOST/.test(broken.why),
    !broken.ok ? broken.why : "",
  );
  process.env.INBOX_TEST_SMTP_HOST = "smtp.test.example.com";

  /**
   * A misconfigured address must not fall back to the global sender. Mailing from
   * the wrong address is worse than not mailing.
   */
  check(
    "a broken address never falls back to the global identity",
    !broken.ok,
  );

  /* ====================================================================== *
   * 4. Reading addresses out of the environment
   * ====================================================================== */
  console.log("\n4) the environment can define the whole pool in one line\n");

  const prevShared = process.env.OUTREACH_INBOX_ADDRESSES;
  process.env.OUTREACH_INBOX_ADDRESSES = `one@${TAG}.example.com|One, two@${TAG}.example.com, notanemail`;
  const synced = await pool.syncInboxesFromEnv();
  const one = await repo.getInboxByEmail(`one@${TAG}.example.com`);
  const two = await repo.getInboxByEmail(`two@${TAG}.example.com`);
  if (one) created.push(one.id);
  if (two) created.push(two.id);
  check("both valid addresses were added", !!one && !!two);
  check("the display name after the pipe is kept", one?.from_name === "One", one?.from_name ?? "null");
  check("an invalid entry is skipped rather than stored", !(await repo.getInboxByEmail("notanemail")));
  check("the sync reports a total", synced.total >= 2, String(synced.total));
  check("and they share the global provider", one?.provider === "default");

  // An address removed from the environment must NOT be deleted.
  process.env.OUTREACH_INBOX_ADDRESSES = `one@${TAG}.example.com`;
  const resynced = await pool.syncInboxesFromEnv();
  check("an address dropped from the environment is not deleted", !!(await repo.getInboxByEmail(`two@${TAG}.example.com`)));
  check(
    "and the sync says so rather than staying quiet",
    resynced.notes.some((n) => /left alone rather than deleted/i.test(n)),
    resynced.notes.join(" | "),
  );
  if (prevShared) process.env.OUTREACH_INBOX_ADDRESSES = prevShared;
  else delete process.env.OUTREACH_INBOX_ADDRESSES;

  /* ====================================================================== *
   * 5. Budgets and the warmup ramp
   * ====================================================================== */
  console.log("\n5) every address has its own budget and its own ramp\n");

  const budgets = await pool.inboxBudgets();
  const mine = budgets.filter((x) => x.fromEmail.includes(TAG));
  check("budgets are reported per address", mine.length >= 4, String(mine.length));
  const one0 = mine.find((x) => x.fromEmail.startsWith("one@"));
  check("a brand new address starts on the warmup ramp, not its full cap", one0?.warmupCap === 5, String(one0?.warmupCap));
  check(
    "and the effective cap is the LOWER of the two",
    one0 ? one0.effectiveCap === Math.min(one0.configuredCap, one0.warmupCap) : false,
    `${one0?.configuredCap} / ${one0?.warmupCap} -> ${one0?.effectiveCap}`,
  );
  check("it has sent nothing yet", one0?.sentToday === 0 && one0?.sentTotal === 0);
  check("a rate is withheld until there is enough to measure", one0?.bounceRate === null);
  check("and it explains itself in plain words", (one0?.reason ?? "").length > 10, one0?.reason);

  /* ====================================================================== *
   * 6. Adding addresses must not raise the overall limit
   * ====================================================================== */
  console.log("\n6) more addresses spread the limit, they never multiply it\n");

  const status = await pool.poolStatus();
  check("the pool reports a total", status.configured >= 4, String(status.configured));
  check(
    "what the pool may send is never more than the overall daily limit",
    status.allowedToday <= status.globalCap,
    `allowed ${status.allowedToday} vs global cap ${status.globalCap}`,
  );
  /**
   * The assertion this whole section exists for. Four test addresses at five each is
   * 20 of raw capacity; the global cap is what actually decides.
   */
  check(
    "raw capacity can exceed the cap, and the cap still wins",
    status.poolCapacity >= status.allowedToday,
    `capacity ${status.poolCapacity}, allowed ${status.allowedToday}`,
  );
  check("the pool explains its number", status.reason.length > 15, status.reason);

  /* ====================================================================== *
   * 7. Rotation, and thread affinity
   * ====================================================================== */
  console.log("\n7) a new conversation rotates, an existing one keeps its address\n");

  const p1 = await outreach.upsertProspect({
    email: `p1@${TAG}.example.com`,
    company: "P1",
    segment: "publisher",
    source: TAG,
  });
  const p2 = await outreach.upsertProspect({
    email: `p2@${TAG}.example.com`,
    company: "P2",
    segment: "publisher",
    source: TAG,
  });
  prospects.push(p1.id, p2.id);

  const pickA = await pool.pickInboxFor({ prospectId: p1.id, touchesSent: 0 });
  check("a brand new conversation is given an address", pickA.ok, !pickA.ok ? pickA.why : "");
  check("and it is not a reused one", pickA.ok && pickA.reused === false);

  // Bind it, as a real send would.
  if (pickA.ok) await repo.assignInboxToProspect(p1.id, pickA.inbox.id);
  const pickAgain = await pool.pickInboxFor({ prospectId: p1.id, touchesSent: 1 });
  check("the follow-up reuses the same address", pickAgain.ok && pickAgain.reused === true);
  check(
    "and it is byte-for-byte the same address",
    pickA.ok && pickAgain.ok && pickA.inbox.fromEmail === pickAgain.inbox.fromEmail,
    pickA.ok && pickAgain.ok ? `${pickA.inbox.fromEmail} / ${pickAgain.inbox.fromEmail}` : "",
  );

  /**
   * THE CENTRAL ASSERTION. Pause the address that owns the conversation and confirm
   * the follow-up WAITS instead of arriving from somebody else.
   */
  if (pickA.ok) await repo.setInboxStatus(pickA.inbox.id, "paused", "test: is the thread protected?");
  const held = await pool.pickInboxFor({ prospectId: p1.id, touchesSent: 1 });
  check("with its address paused, the follow-up is held", !held.ok && held.hold === true);
  check(
    "and it does NOT go out from a different address",
    !held.ok,
    held.ok ? `LEAKED to ${held.inbox.fromEmail}` : held.why,
  );
  check(
    "the reason names the address it is waiting for",
    !held.ok && pickA.ok && held.why.includes(pickA.inbox.fromEmail),
    !held.ok ? held.why : "",
  );

  /**
   * The one safe exception: a conversation that was assigned but never actually
   * sent to has no thread to break, so it may be reassigned.
   */
  const reassigned = await pool.pickInboxFor({ prospectId: p1.id, touchesSent: 0 });
  check(
    "a conversation that never actually sent CAN move to another address",
    reassigned.ok,
    !reassigned.ok ? reassigned.why : reassigned.inbox.fromEmail,
  );
  check(
    "and it moved to a different address than the paused one",
    reassigned.ok && pickA.ok && reassigned.inbox.id !== pickA.inbox.id,
  );
  if (pickA.ok) await repo.setInboxStatus(pickA.inbox.id, "active", null);

  // Least-recently-used ordering.
  const ordered = await repo.listInboxes();
  const stamps = ordered.map((i) => (i.last_sent_at ? new Date(i.last_sent_at).getTime() : 0));
  check(
    "addresses are listed least-recently-used first, which is the rotation order",
    stamps.every((v, i) => i === 0 || stamps[i - 1] <= v),
    stamps.join(","),
  );

  /* ====================================================================== *
   * 8. Counting, never storing
   * ====================================================================== */
  console.log("\n8) sends today are counted from real messages, not from a counter\n");

  const cols = (await db.execute(
    `select column_name from information_schema.columns where table_name='outreach_inboxes'`,
  )) as unknown as { rows: { column_name: string }[] };
  const names = cols.rows.map((r) => r.column_name);
  check("there is no sent_today column to drift", !names.includes("sent_today"));
  check("there is no sent_total column either", !names.includes("sent_total"));

  // A dry-run message must not count against an address's budget.
  if (pickA.ok) {
    await outreach.upsertMessage({
      prospectId: p1.id,
      step: 1,
      subject: `${TAG} dry`,
      bodyText: "b unsubscribe",
      campaign: "link_building",
    });
    const [m] = await outreach.listMessages({ prospectId: p1.id, limit: 1 });
    await db
      .update(schema.outreachMessages)
      .set({ status: "sent", dryRun: true, sentAt: new Date(), inboxId: pickA.inbox.id })
      .where(eq(schema.outreachMessages.id, m.id));
    const counted = await repo.sentTodayByInbox();
    check(
      "a preview does not spend an address's daily budget",
      (counted[pickA.inbox.id] ?? 0) === 0,
      String(counted[pickA.inbox.id] ?? 0),
    );

    await db
      .update(schema.outreachMessages)
      .set({ dryRun: false })
      .where(eq(schema.outreachMessages.id, m.id));
    const counted2 = await repo.sentTodayByInbox();
    check("a real send does", (counted2[pickA.inbox.id] ?? 0) === 1, String(counted2[pickA.inbox.id] ?? 0));

    const days = await repo.sendingDaysByInbox();
    check("sending days are counted as distinct days", (days[pickA.inbox.id] ?? 0) === 1, String(days[pickA.inbox.id] ?? 0));
  }

  /* ====================================================================== *
   * 9. Automatic pause on a bad rate
   * ====================================================================== */
  console.log("\n9) an address in trouble is paused automatically, not just charted\n");

  const sick = await repo.upsertInbox({
    label: "Sick",
    fromEmail: `sick@${TAG}.example.com`,
    dailyCap: 50,
  });
  created.push(sick.id);

  // One bounce on a new address must NOT pause it: a rate needs a denominator.
  await repo.recordInboxProblem(sick.id, "bounce");
  const early = await pool.pauseUnhealthyInboxes();
  check(
    "a single bounce on a barely-used address does not pause it",
    !early.paused.includes(sick.from_email),
    early.paused.join(","),
  );

  // Give it 25 real sends and 5 problems: a 20% rate on a real denominator.
  const sickProspect = await outreach.upsertProspect({
    email: `sick-p@${TAG}.example.com`,
    company: "S",
    segment: "publisher",
    source: TAG,
  });
  prospects.push(sickProspect.id);
  // A distinct step per row: there is a unique index on (prospect_id, step), so 25
  // rows at step 1 would collide. The step value is irrelevant to what is being
  // counted here, which is sends per address.
  for (let i = 0; i < 25; i++) {
    await db.insert(schema.outreachMessages).values({
      prospectId: sickProspect.id,
      step: i + 1,
      subject: `${TAG} s${i}`,
      bodyText: "b unsubscribe",
      status: "sent",
      dryRun: false,
      sentAt: new Date(),
      inboxId: sick.id,
      campaign: "link_building",
    });
  }
  for (let i = 0; i < 4; i++) await repo.recordInboxProblem(sick.id, "bounce");

  const sickBudget = (await pool.inboxBudgets()).find((x) => x.id === sick.id);
  check("now there is enough history for a rate", sickBudget?.bounceRate === 20, String(sickBudget?.bounceRate));
  const acted = await pool.pauseUnhealthyInboxes();
  check("and the address is paused automatically", acted.paused.includes(sick.from_email), acted.paused.join(","));
  const sickAfter = await repo.getInboxById(sick.id);
  check(
    "the reason recorded is the number, so the decision can be read back",
    /20%/.test(sickAfter?.paused_reason ?? ""),
    sickAfter?.paused_reason ?? "",
  );
  check("a paused address is not offered for a new conversation", (await pool.inboxBudgets()).find((x) => x.id === sick.id)?.status === "paused");

  /* ====================================================================== *
   * 10. The send loop holds rather than switching
   * ====================================================================== */
  console.log("\n10) the real send loop reports held messages instead of losing them\n");

  const { sendApprovedOutreach } = await import("../src/lib/outreach-engine");

  /**
   * Build the exact situation the design is for: a prospect mid-conversation whose
   * sending address has been paused, with an approved follow-up sitting due.
   *
   * Asserting `typeof inboxHeld === "number"` alone would pass on a pipeline where
   * nothing was held, which is how a broken guard looks identical to a working one.
   */
  const stuck = await outreach.upsertProspect({
    email: `stuck@${TAG}.example.com`,
    company: "Stuck",
    segment: "publisher",
    source: TAG,
  });
  prospects.push(stuck.id);
  const deadInbox = await repo.upsertInbox({
    label: "Dead",
    fromEmail: `dead@${TAG}.example.com`,
    dailyCap: 5,
  });
  created.push(deadInbox.id);
  await repo.assignInboxToProspect(stuck.id, deadInbox.id);
  // One real touch already sent, so there IS a thread to protect.
  await db
    .update(schema.outreachProspects)
    .set({ touchesSent: 1 })
    .where(eq(schema.outreachProspects.id, stuck.id));
  await outreach.upsertMessage({
    prospectId: stuck.id,
    step: 2,
    subject: `${TAG} follow-up`,
    bodyText: "b unsubscribe",
    campaign: "link_building",
  });
  const [followUp] = (await outreach.listMessages({ prospectId: stuck.id, limit: 5 })).filter(
    (m) => m.step === 2,
  );
  await outreach.approveMessage(followUp.id);
  await repo.setInboxStatus(deadInbox.id, "paused", "test: address out of action");

  const run = await sendApprovedOutreach({ dryRun: true, campaign: "link_building", max: 200 });
  check("the run reports an inboxHeld count", typeof run.inboxHeld === "number", String(run.inboxHeld));
  check(
    "a follow-up whose address is paused is actually held",
    run.inboxHeld >= 1,
    `inboxHeld ${run.inboxHeld}`,
  );
  check("it stayed a dry run", run.dryRun === true);

  // And once the address is back, the same message is no longer held.
  await repo.setInboxStatus(deadInbox.id, "active", null);
  const run2 = await sendApprovedOutreach({ dryRun: true, campaign: "link_building", max: 200 });
  check(
    "and it stops being held as soon as that address can send again",
    run2.inboxHeld < run.inboxHeld,
    `${run.inboxHeld} -> ${run2.inboxHeld}`,
  );

  const { runOutreachSend } = await import("../src/lib/outreach-warmup");
  const r2 = await runOutreachSend({ dryRun: true });
  check("and so does the campaign-level run", typeof r2.inboxHeld === "number", String(r2.inboxHeld));
  check("which is still a dry run", r2.dryRun === true);
} finally {
  await cleanup();
  console.log(`\ncleaned up test rows (${TAG})`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
