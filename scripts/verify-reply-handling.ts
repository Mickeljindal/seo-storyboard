/**
 * Prove the reply classifier reads real emails correctly.
 *
 *   npx tsx scripts/verify-reply-handling.ts
 *
 * The classifier is what makes automatic follow-ups safe: every follow-up is gated
 * on "has this person already answered". These cases are written the way real
 * replies actually arrive, quoted original included, because that is where the
 * naive version fails.
 *
 * Pure functions only for the classifier section, so no database is touched there.
 * The ingest section uses throwaway @example.com rows and cleans up after itself.
 */
import { loadProjectEnv } from "../src/lib/load-env";
import { classifyReply, stripQuotedReply, stopReasonFor } from "../src/lib/reply-classifier";

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

/** A realistic reply: a short answer on top of our own quoted email. */
const quoted = `
On Tue, 25 Aug 2026 at 09:12, Kloudbean <hello@kloudbean.com> wrote:
> I was reading your "Best WordPress Hosting" piece.
> We run Kloudbean, a managed cloud, and there is one specific reason it
> belongs on that kind of list. Happy to help, sounds great, let's do it.
> If you think it earns a slot, everything you'd need is on kloudbean.com
`;

async function main() {
  loadProjectEnv();

  console.log("1) quoted-original stripping (the highest-impact detail)\n");
  const stripped = stripQuotedReply(`No thanks, not for us.${quoted}`);
  check("the quoted original is removed", !/belongs on that kind of list/.test(stripped), stripped.slice(0, 60));
  check("the actual reply survives", /No thanks/.test(stripped));

  const naive = classifyReply({
    fromEmail: "editor@example.com",
    subject: "Re: A missing option",
    body: `No thanks, not for us.${quoted}`,
  });
  check(
    "a 'no thanks' on top of our enthusiastic quoted email reads as NOT interested",
    naive.classification === "not_interested",
    naive.classification,
  );

  console.log("\n2) the cases that must stop the sequence\n");
  const cases: [string, Parameters<typeof classifyReply>[0], string, boolean][] = [
    [
      "a clear yes",
      { fromEmail: "editor@example.com", subject: "Re: A missing option", body: "Sounds good, send it over and I'll add it." },
      "interested",
      true,
    ],
    [
      "a clear no",
      { fromEmail: "editor@example.com", subject: "Re:", body: "Not interested, we don't accept these." },
      "not_interested",
      true,
    ],
    [
      "an unsubscribe request",
      { fromEmail: "editor@example.com", subject: "Re:", body: "Please remove me from your list and do not contact me again." },
      "unsubscribe",
      true,
    ],
    [
      "a spam accusation",
      { fromEmail: "editor@example.com", subject: "Re:", body: "This is unsolicited spam. I am reporting you." },
      "complaint",
      true,
    ],
    [
      "a hard bounce from mailer-daemon",
      {
        fromEmail: "MAILER-DAEMON@mx.example.com",
        subject: "Undelivered Mail Returned to Sender",
        body: "550 5.1.1 <editor@target.com>: Recipient address rejected: User unknown in local recipient table",
      },
      "bounce",
      true,
    ],
    [
      "a question",
      { fromEmail: "editor@example.com", subject: "Re:", body: "Interesting. What's your pricing and how much traffic do you get?" },
      "question",
      true,
    ],
    [
      "a request for payment",
      { fromEmail: "editor@example.com", subject: "Re:", body: "We do charge for this. Our rates are $300 per sponsored post." },
      "not_interested",
      true,
    ],
    [
      "something unreadable still stops the sequence",
      { fromEmail: "editor@example.com", subject: "Re:", body: "hm" },
      "unknown",
      true,
    ],
  ];

  for (const [label, input, expected, shouldStop] of cases) {
    const c = classifyReply(input);
    check(`${label} -> ${expected}`, c.classification === expected, `got ${c.classification}`);
    check(`  ...and it stops the sequence`, c.stopsSequence === shouldStop);
  }

  console.log("\n3) the ONE case that must NOT stop the sequence\n");
  const oof = classifyReply({
    fromEmail: "editor@example.com",
    subject: "Automatic reply: A missing option",
    body: "I am currently out of the office and will be back on 3 September.",
  });
  check("out-of-office is recognised", oof.classification === "auto_reply", oof.classification);
  check("out-of-office does NOT stop the sequence", oof.stopsSequence === false);
  check("out-of-office suppresses nobody", oof.suppress === null);

  console.log("\n4) suppression is applied only where it should be\n");
  const unsub = classifyReply({ fromEmail: "a@b.com", body: "unsubscribe" });
  check("an unsubscribe suppresses the address", unsub.suppress === "unsubscribe");
  const complaint = classifyReply({ fromEmail: "a@b.com", body: "this is spam, blacklist" });
  check("a complaint suppresses the address", complaint.suppress === "complaint");
  const soft = classifyReply({
    fromEmail: "mailer-daemon@x.com",
    subject: "Delivery delayed",
    body: "452 4.2.2 Mailbox full, quota exceeded. Message deferred.",
  });
  check("a FULL mailbox is a bounce", soft.classification === "bounce", soft.classification);
  check(
    "a full mailbox does NOT suppress forever (it is temporary)",
    soft.suppress === null,
    String(soft.suppress),
  );
  const yes = classifyReply({ fromEmail: "a@b.com", body: "Sounds great, happy to add it." });
  check("a positive reply suppresses nobody", yes.suppress === null);

  console.log("\n5) provider events are trusted over text\n");
  const ev = classifyReply({
    fromEmail: "editor@target.com",
    body: "Sounds great, happy to add it!",
    providerEvent: "email.bounced",
  });
  check(
    "a provider bounce event beats positive-sounding text",
    ev.classification === "bounce",
    ev.classification,
  );
  const evc = classifyReply({ fromEmail: "e@t.com", body: "hello", providerEvent: "email.complained" });
  check("a provider complaint event is a complaint", evc.classification === "complaint");

  console.log("\n6) stop reasons map correctly\n");
  check("bounce -> bounced", stopReasonFor(classifyReply({ fromEmail: "m@x.com", subject: "Undeliverable", body: "550 user unknown" })) === "bounced");
  check("unsubscribe -> unsubscribed", stopReasonFor(classifyReply({ fromEmail: "a@b.com", body: "unsubscribe me" })) === "unsubscribed");
  check("complaint -> complained", stopReasonFor(classifyReply({ fromEmail: "a@b.com", body: "spam, reporting you" })) === "complained");
  check("interested -> replied", stopReasonFor(classifyReply({ fromEmail: "a@b.com", body: "yes please" })) === "replied");
  check("out-of-office -> null", stopReasonFor(oof) === null);

  console.log("\n7) pulling the failed address out of a bounce report\n");
  const { extractOriginalRecipient } = await import("../src/lib/reply-ingest");
  const addr = extractOriginalRecipient(
    "Final-Recipient: rfc822; editor@target.com\nAction: failed\nStatus: 5.1.1",
    "Undelivered Mail Returned to Sender",
  );
  check("the original recipient is recovered", addr === "editor@target.com", String(addr));
  const addr2 = extractOriginalRecipient("<hello@site.com>: host mx.site.com said: 550 no such user", "");
  check("the angle-bracket form is recovered", addr2 === "hello@site.com", String(addr2));

  console.log("\n8) end to end: a reply stops a real sequence and suppresses\n");
  const repo = await import("../src/server/db/repos/outreach");
  const { ingestReply } = await import("../src/lib/reply-ingest");
  const { getDb } = await import("../src/server/db/client");
  const db = await getDb();
  const TAG = `replytest-${Date.now()}`;

  const p = await repo.upsertProspect({
    email: `editor.${TAG}@example.com`,
    company: "Reply Test",
    segment: "publisher",
    source: TAG,
    personalNote: "Published a test page",
  });
  await repo.upsertMessage({ prospectId: p.id, step: 1, subject: "s", bodyText: "b unsubscribe" });
  const m = (await repo.listMessages({ prospectId: p.id }))[0];
  await repo.approveMessage(m.id);

  const r = await ingestReply({
    fromEmail: `editor.${TAG}@example.com`,
    subject: "Re: A missing option",
    body: `Please remove me from your list.${quoted}`,
    providerMessageId: `${TAG}-1`,
  });
  check("the reply was matched to the prospect", r.matchedProspect);
  check("it was read as an unsubscribe", r.classification === "unsubscribe", r.classification);
  check("the sequence was stopped", r.stoppedSequence);
  check("the address was suppressed", r.suppressed);

  const after = await repo.getProspectById(p.id);
  check("the stop reason is 'unsubscribed'", after?.sequence_stopped_reason === "unsubscribed", String(after?.sequence_stopped_reason));
  check("the address is now on the suppression list", await repo.isSuppressed(`editor.${TAG}@example.com`));
  const due = await repo.listDueMessages({ limit: 500 });
  check("their approved message is no longer due to send", !due.some((x) => x.id === m.id));

  const dup = await ingestReply({
    fromEmail: `editor.${TAG}@example.com`,
    subject: "Re: A missing option",
    body: "Please remove me from your list.",
    providerMessageId: `${TAG}-1`,
  });
  check("re-polling the same message is ignored", dup.duplicate, JSON.stringify(dup));

  console.log("\n9) a reply from a colleague's address still matches the company\n");
  const p2 = await repo.upsertProspect({
    email: `editorial.${TAG}@testpub.example.com`,
    company: "Test Pub",
    segment: "publisher",
    source: TAG,
  });
  await db.execute(`update outreach_prospects set last_contacted_at = now() where id = '${p2.id}'`);
  const r2 = await ingestReply({
    fromEmail: `jane.smith.${TAG}@testpub.example.com`,
    subject: "Re: A missing option",
    body: "Thanks, not for us right now.",
    providerMessageId: `${TAG}-2`,
  });
  check("matched by domain when the exact address is unknown", r2.matchedProspect, JSON.stringify(r2));
  check("and it stopped that prospect's sequence", r2.stoppedSequence);

  // Cleanup.
  await db.execute(
    `delete from outreach_replies where from_email like '%${TAG}%' or provider_message_id like '${TAG}%'`,
  );
  await db.execute(
    `delete from outreach_messages where prospect_id in (select id from outreach_prospects where source = '${TAG}')`,
  );
  await db.execute(`delete from outreach_suppressions where email like '%${TAG}%'`);
  await db.execute(`delete from outreach_prospects where source = '${TAG}'`);
  console.log(`\ncleaned up test rows (${TAG})`);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}

main().then(() => process.exit(process.exitCode ?? 0));
