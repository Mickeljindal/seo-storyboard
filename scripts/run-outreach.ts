#!/usr/bin/env -S npx tsx
/**
 * Draft, review, and (only when you really mean it) send the outreach queue.
 *
 *   npx tsx scripts/run-outreach.ts --draft                  # write drafts, send nothing
 *   npx tsx scripts/run-outreach.ts --draft --segment agency --limit 25
 *   npx tsx scripts/run-outreach.ts --review                 # print drafts for reading
 *   npx tsx scripts/run-outreach.ts --approve <messageId>    # approve one
 *   npx tsx scripts/run-outreach.ts --approve-all            # approve every personalised draft
 *   npx tsx scripts/run-outreach.ts --send                   # DRY RUN by default
 *   npx tsx scripts/run-outreach.ts --send --for-real        # actually sends
 *
 * `--for-real` still refuses unless EMAIL_SEND_ENABLED=1 is set in .env and a
 * provider is configured. Two independent switches, because email is the one
 * channel you cannot take back.
 */
import { loadProjectEnv } from "../src/lib/load-env";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const has = (name: string) => process.argv.includes(name);

async function main() {
  loadProjectEnv();
  const repo = await import("../src/server/db/repos/outreach");
  const engine = await import("../src/lib/outreach-engine");
  const sender = await import("../src/lib/email-sender");

  if (has("--draft")) {
    const r = await engine.draftOutreachBatch({
      segment: arg("--segment"),
      limit: Number(arg("--limit", "50")),
      step: Number(arg("--step", "1")),
    });
    console.log(`drafted                 : ${r.drafted}`);
    console.log(`skipped                 : ${r.skipped}`);
    console.log(`generic opener (no note): ${r.weakPersonalisation}`);
    if (r.errors.length) for (const e of r.errors.slice(0, 10)) console.log(`  ! ${e}`);
    console.log("\nNothing sent. Read them with --review before approving.");
    return;
  }

  if (has("--review")) {
    const msgs = await repo.listMessages({ status: "draft", limit: Number(arg("--limit", "10")) });
    if (!msgs.length) {
      console.log("No drafts. Run --draft first.");
      return;
    }
    for (const m of msgs) {
      const p = await repo.getProspectById(m.prospect_id);
      console.log("\n" + "=".repeat(78));
      console.log(`to      : ${p?.name ? `${p.name} <${p.email}>` : p?.email}`);
      console.log(`company : ${p?.company ?? "(unknown)"} · ${p?.segment ?? ""} · score ${p?.score ?? 0}`);
      console.log(`consent : ${p?.consent_basis} · source: ${p?.source ?? "(not recorded)"}`);
      console.log(`note    : ${p?.personal_note ? "real, supplied" : "MISSING (generic opener used)"}`);
      console.log(`id      : ${m.id}`);
      console.log(`subject : ${m.subject}`);
      console.log("-".repeat(78));
      console.log(m.body_text);
    }
    console.log("\nApprove with --approve <id>, or --approve-all for every personalised draft.");
    return;
  }

  if (has("--approve")) {
    const id = arg("--approve");
    if (!id) {
      console.error("Usage: --approve <messageId>");
      process.exit(1);
    }
    await repo.approveMessage(id);
    console.log(`approved ${id}`);
    return;
  }

  if (has("--approve-all")) {
    const msgs = await repo.listMessages({ status: "draft", limit: 500 });
    let approved = 0;
    let heldBack = 0;
    for (const m of msgs) {
      const p = await repo.getProspectById(m.prospect_id);
      // A generic opener is not ready to send to a real person.
      if (!p?.personal_note?.trim()) {
        heldBack++;
        continue;
      }
      await repo.approveMessage(m.id);
      approved++;
    }
    console.log(`approved             : ${approved}`);
    console.log(`held back (no note)  : ${heldBack}  <- add a real personal note, then re-draft`);
    return;
  }

  if (has("--send")) {
    const forReal = has("--for-real");
    if (forReal && !sender.sendingEnabled()) {
      console.error(
        "Refusing to send: EMAIL_SEND_ENABLED=1 is not set in .env. That switch exists so --for-real alone cannot mail anyone.",
      );
      process.exit(1);
    }
    if (forReal && sender.activeProvider() === "none") {
      console.error("Refusing to send: no provider configured. Set RESEND_API_KEY or SMTP_HOST.");
      process.exit(1);
    }
    const r = await engine.sendApprovedOutreach({
      dryRun: !forReal,
      max: Number(arg("--max", "25")),
    });
    console.log(`mode      : ${r.dryRun ? "DRY RUN (nothing left the building)" : "LIVE SEND"}`);
    console.log(`attempted : ${r.attempted}`);
    console.log(`sent      : ${r.sent}`);
    console.log(`failed    : ${r.failed}`);
    console.log(`suppressed: ${r.suppressed}`);
    console.log(`capped    : ${r.capped} (daily cap ${sender.dailyCap()})`);
    if (r.errors.length) for (const e of r.errors.slice(0, 10)) console.log(`  ! ${e}`);
    return;
  }

  // Default: status.
  const [total, queued, contacted, replied, suppressed, sentToday] = await Promise.all([
    repo.countProspects(),
    repo.countProspects("queued"),
    repo.countProspects("contacted"),
    repo.countProspects("replied"),
    repo.countSuppressions(),
    repo.countSentToday(),
  ]);
  console.log("OUTREACH PIPELINE");
  console.log(`  prospects        : ${total}`);
  console.log(`  queued           : ${queued}`);
  console.log(`  contacted        : ${contacted}`);
  console.log(`  replied          : ${replied}`);
  console.log(`  suppressed       : ${suppressed}`);
  console.log(`  real sends today : ${sentToday} / ${sender.dailyCap()}`);
  console.log(`  provider         : ${sender.activeProvider()}`);
  console.log(`  sending enabled  : ${sender.sendingEnabled() ? "yes" : "no (drafts and dry runs only)"}`);
  console.log("\nCommands: --draft | --review | --approve-all | --send [--for-real]");
}

// PGlite keeps the event loop alive, so exit explicitly once the work is done.
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
