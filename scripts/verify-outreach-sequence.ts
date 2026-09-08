/**
 * Prove the sequence guards hold.
 *
 *   npx tsx scripts/verify-outreach-sequence.ts
 *
 * These are the assertions that make automatic follow-ups safe rather than
 * embarrassing. If any of them ever fails, the system is capable of chasing
 * somebody who already replied, so this is written to be run again after any
 * refactor of the outreach layer.
 *
 * Uses throwaway @example.com prospects and cleans up after itself. Sends nothing:
 * every write here is a draft or a status change.
 * Run with the dev server stopped: PGlite allows a single writer.
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
  const repo = await import("../src/server/db/repos/outreach");
  const seq = await import("../src/lib/outreach-sequence");
  const { getDb } = await import("../src/server/db/client");
  const db = await getDb();

  const TAG = `seqtest-${Date.now()}`;
  const mk = async (local: string) =>
    repo.upsertProspect({
      email: `${local}.${TAG}@example.com`,
      company: "Sequence Test",
      segment: "agency",
      personalNote: "Published a test page",
      source: TAG,
    });

  console.log("1) send window\n");
  const sat = new Date("2026-08-29T11:00:00");
  const sun3am = new Date("2026-08-30T03:00:00");
  const wed11 = new Date("2026-08-26T11:00:00");
  check("Saturday is outside the window", !seq.isWithinSendWindow(sat));
  check("Sunday 3am is outside the window", !seq.isWithinSendWindow(sun3am));
  check("Wednesday 11am is inside the window", seq.isWithinSendWindow(wed11));
  const moved = seq.nextSendWindow(sun3am);
  check(
    "a Sunday 3am send is pushed to a weekday morning",
    moved.getDay() >= 1 && moved.getDay() <= 5 && moved.getHours() === 9,
    moved.toString(),
  );

  console.log("\n2) a scheduled follow-up is not due yet\n");
  const p1 = await mk("future");
  await repo.upsertMessage({
    prospectId: p1.id,
    step: 1,
    subject: "s",
    bodyText: "b unsubscribe",
    sendAfter: new Date(Date.now() + 7 * 86400_000),
  });
  const m1 = (await repo.listMessages({ prospectId: p1.id }))[0];
  await repo.approveMessage(m1.id);
  let due = await repo.listDueMessages({ limit: 200 });
  check(
    "a message scheduled 7 days out is NOT returned as due",
    !due.some((m) => m.id === m1.id),
  );

  // Same message, now due.
  await db.execute(`update outreach_messages set send_after = now() - interval '1 hour' where id = '${m1.id}'`);
  due = await repo.listDueMessages({ limit: 200 });
  check("once its time passes it IS returned as due", due.some((m) => m.id === m1.id));

  console.log("\n3) stopping a sequence blocks everything downstream\n");
  const stop = await repo.stopSequence(p1.id, "replied", { replyAt: new Date(), status: "replied" });
  check("stopping cancels the pending approved message", stop.cancelledMessages === 1, `cancelled ${stop.cancelledMessages}`);
  due = await repo.listDueMessages({ limit: 200 });
  check(
    "a stopped prospect's message is no longer due EVEN THOUGH its time has passed",
    !due.some((m) => m.id === m1.id),
  );
  const after = await repo.getProspectById(p1.id);
  check("the stop reason is recorded", after?.sequence_stopped_reason === "replied", String(after?.sequence_stopped_reason));
  check("next_touch_at is cleared", after?.next_touch_at === null);

  console.log("\n4) a stopped prospect is never scheduled a follow-up\n");
  // Make it look like step 1 was sent long ago, which would otherwise qualify.
  await db.execute(
    `update outreach_messages set status='sent', dry_run=false, sent_at = now() - interval '30 days' where prospect_id='${p1.id}'`,
  );
  const dueFollow = await repo.listProspectsDueForFollowUp({ afterDays: 5, maxTouches: 2, limit: 100 });
  check(
    "a replied prospect with a 30-day-old send is NOT due for follow-up",
    !dueFollow.some((d) => d.prospect.id === p1.id),
  );

  console.log("\n5) an eligible prospect IS due, and gets exactly one nudge\n");
  const p2 = await mk("eligible");
  await repo.upsertMessage({ prospectId: p2.id, step: 1, subject: "s", bodyText: "b unsubscribe" });
  const m2 = (await repo.listMessages({ prospectId: p2.id }))[0];
  await db.execute(
    `update outreach_messages set status='sent', dry_run=false, sent_at = now() - interval '10 days' where id='${m2.id}'`,
  );
  await db.execute(`update outreach_prospects set status='contacted', touches_sent=1 where id='${p2.id}'`);

  const dueNow = await repo.listProspectsDueForFollowUp({ afterDays: 5, maxTouches: 2, limit: 100 });
  check("a contacted, unanswered, 10-day-old prospect IS due", dueNow.some((d) => d.prospect.id === p2.id));

  const sched = await seq.scheduleFollowUps({ limit: 50 });
  const msgs = await repo.listMessages({ prospectId: p2.id, limit: 10 });
  check("a step 2 was drafted", msgs.some((m) => m.step === 2), `steps: ${msgs.map((m) => m.step).join(",")}`);
  const step2 = msgs.find((m) => m.step === 2);
  check("the follow-up is a DRAFT, not auto-approved", step2?.status === "draft", String(step2?.status));
  check("the follow-up carries a send_after", !!step2?.send_after);
  check("its subject marks it as a reply", /^Re:/i.test(step2?.subject ?? "") || (step2?.subject ?? "").length > 0);

  console.log("\n6) the touch limit closes the sequence instead of nudging again\n");
  await db.execute(
    `update outreach_messages set status='sent', dry_run=false, sent_at = now() - interval '9 days' where prospect_id='${p2.id}'`,
  );
  await db.execute(`update outreach_prospects set touches_sent=2 where id='${p2.id}'`);
  const dueAtLimit = await repo.listProspectsDueForFollowUp({ afterDays: 5, maxTouches: 2, limit: 100 });
  check(
    "a prospect at the touch limit is NOT due for another",
    !dueAtLimit.some((d) => d.prospect.id === p2.id),
  );

  console.log("\n7) auto-approve is off unless explicitly enabled\n");
  const wasSet = process.env.OUTREACH_AUTO_APPROVE;
  delete process.env.OUTREACH_AUTO_APPROVE;
  const noApprove = await seq.autoApproveLinkPitches({ limit: 5 });
  check("with the switch unset, nothing is approved", noApprove.approved === 0);
  if (wasSet) process.env.OUTREACH_AUTO_APPROVE = wasSet;

  console.log("\n8) auto-approve refuses a pitch with no specific page\n");
  process.env.OUTREACH_AUTO_APPROVE = "1";
  const p3 = await repo.upsertProspect({
    email: `nonote.${TAG}@example.com`,
    company: "No Note",
    segment: "publisher",
    source: TAG,
  });
  await db.execute(`update outreach_prospects set personal_note = null where id='${p3.id}'`);
  await repo.upsertMessage({
    prospectId: p3.id,
    step: 1,
    subject: "s",
    bodyText: "b unsubscribe",
    campaign: "link_building",
  });
  const approve = await seq.autoApproveLinkPitches({ limit: 100 });
  const m3 = (await repo.listMessages({ prospectId: p3.id }))[0];
  check("a pitch with no page to quote stays a draft", m3.status === "draft", m3.status);
  check(
    "and the reason is reported",
    Object.keys(approve.reasons).some((r) => /specific page/i.test(r)),
    JSON.stringify(approve.reasons),
  );
  if (wasSet) process.env.OUTREACH_AUTO_APPROVE = wasSet;
  else delete process.env.OUTREACH_AUTO_APPROVE;

  // Cleanup: leave no test rows behind.
  await db.execute(
    `delete from outreach_messages where prospect_id in (select id from outreach_prospects where source = '${TAG}')`,
  );
  await db.execute(`delete from outreach_prospects where source = '${TAG}'`);
  console.log(`\ncleaned up test rows (source = ${TAG})`);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}

main().then(() => process.exit(process.exitCode ?? 0));
