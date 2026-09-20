#!/usr/bin/env node
/**
 * PACED AUTO-PUBLISHER — control the "one article every N hours" cadence.
 *
 *   node scripts/publish-cadence.mjs status      # what is booked, what is next up
 *   node scripts/publish-cadence.mjs start       # book the next run, one interval out
 *   node scripts/publish-cadence.mjs start --now # book it immediately
 *   node scripts/publish-cadence.mjs stop        # cancel the pending booking
 *   node scripts/publish-cadence.mjs run         # run one cycle here, then rebook
 *   node scripts/publish-cadence.mjs dry         # pick + gate, publish NOTHING
 *   node scripts/publish-cadence.mjs gate <slug> # explain the gate for one article
 *   node scripts/publish-cadence.mjs notify:test # prove the Slack/Pumble/WhatsApp wiring
 *
 * HOW THE CADENCE ACTUALLY RUNS. `start` writes one row into the durable `jobs`
 * table with `run_after = now + interval`. The always-on job runner claims it
 * when it comes due, publishes one article, notifies, and books the next row
 * before finishing. So the schedule lives in Postgres, not in this process:
 * close this terminal and the cadence continues, as long as the app server (or
 * `npm run autopilot`) is running to drain the queue.
 *
 * If NOTHING is draining the queue, `start` books a run that never fires. Use
 * `status` to see whether a booking is overdue.
 */
import { loadProjectEnv } from "../src/lib/load-env.ts";
loadProjectEnv();

const args = process.argv.slice(2);
const cmd = (args[0] ?? "status").toLowerCase();
const has = (f) => args.includes(`--${f}`);

const S = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};
const ok = (s) => `${S.green}${s}${S.reset}`;
const warn = (s) => `${S.yellow}${s}${S.reset}`;
const bad = (s) => `${S.red}${s}${S.reset}`;
const dim = (s) => `${S.dim}${s}${S.reset}`;
const head = (s) => `\n${S.bold}${s}${S.reset}`;

function when(iso) {
  if (!iso) return dim("not booked");
  const d = new Date(iso);
  const mins = Math.round((d.getTime() - Date.now()) / 60000);
  const stamp = d.toISOString().replace("T", " ").slice(0, 16) + "Z";
  if (mins < -1)
    return `${stamp} ${bad(`(overdue by ${Math.abs(mins)} min — is anything draining the queue?)`)}`;
  if (mins <= 0) return `${stamp} ${warn("(due now)")}`;
  const h = Math.floor(mins / 60);
  return `${stamp} ${dim(`(in ${h ? `${h}h ` : ""}${mins % 60}m)`)}`;
}

async function lib() {
  return await import("../src/lib/publish-scheduler.ts");
}

function printRun(r) {
  if (r.published) {
    console.log(
      `\n${r.dryRun ? warn("DRY RUN") : ok("PUBLISHED")}  ${S.bold}${r.published.title}${S.reset}`,
    );
    console.log(`  ${S.cyan}${r.published.url}${S.reset}`);
  } else {
    console.log(`\n${warn("nothing published")}  ${r.error ?? ""}`);
  }
  if (r.skipped?.length) {
    console.log(head("Skipped by the gate"));
    for (const s of r.skipped) {
      console.log(`  ${bad("blocked")} ${s.slug}`);
      for (const reason of s.reasons) console.log(`      ${dim("- " + reason)}`);
    }
  }
  if (r.notified?.length) {
    console.log(head("Notified"));
    for (const n of r.notified) {
      console.log(
        `  ${n.ok ? ok("sent") : bad("failed")} ${n.target}${n.error ? dim(" " + n.error) : ""}`,
      );
    }
  } else if (!r.dryRun && r.published) {
    console.log(`\n${dim("No notification channels configured (see NOTIFY_* in .env.example).")}`);
  }
  if (r.nextAt) console.log(`\nNext run: ${when(r.nextAt)}`);
  if (typeof r.remaining === "number") console.log(dim(`Remaining in the queue: ${r.remaining}`));
}

try {
  switch (cmd) {
    case "status": {
      const { publishCadenceStatus } = await lib();
      const s = await publishCadenceStatus();
      console.log(head("Publish cadence"));
      console.log(`  state            ${s.running ? ok("armed") : warn("not armed")}`);
      console.log(`  next run         ${when(s.nextAt)}`);
      console.log(
        `  interval         every ${Math.round(s.config.intervalMs / 3600000)}h` +
          (s.config.dryRun ? `  ${warn("DRY RUN mode")}` : ""),
      );
      console.log(
        `  daily cap        ${s.publishedLast24h} published in last 24h, cap ${s.config.maxPerDay}`,
      );
      console.log(`  min score        ${s.config.minScore || dim("off")}`);
      console.log(`  unpublished      ${s.remaining} article(s) left`);
      console.log(
        `  notifications    ${s.notifyTargets.length ? ok(s.notifyTargets.join(", ")) : warn("none configured")}`,
      );
      console.log(head("Next up (hub-first, most linked-to first)"));
      if (!s.nextUp.length) console.log(dim("  nothing eligible"));
      for (const n of s.nextUp) {
        const flag = n.gate.ok ? ok("pass") : bad("BLOCKED");
        console.log(`  ${flag}  ${n.slug} ${dim(`(${n.inbound} inbound links)`)}`);
        if (!n.gate.ok) for (const r of n.gate.reasons) console.log(`        ${dim("- " + r)}`);
      }
      console.log("");
      break;
    }

    case "start": {
      const { startPublishCadence, getCadenceConfig } = await lib();
      const cfg = getCadenceConfig();
      const r = await startPublishCadence(has("now"));
      if (r.alreadyRunning) {
        console.log(
          `\n${warn("already armed")} — a run is booked for ${when(r.nextAt)}\n` +
            dim("  Nothing was double-booked. Use `stop` first if you want to re-time it.\n"),
        );
      } else {
        console.log(
          `\n${ok("armed")} — one article every ${Math.round(cfg.intervalMs / 3600000)}h`,
        );
        console.log(`  first run: ${when(r.nextAt)}`);
        console.log(
          dim("  The app server or `npm run autopilot` must be running to drain the queue.\n"),
        );
      }
      break;
    }

    case "stop": {
      const { stopPublishCadence } = await lib();
      const r = await stopPublishCadence();
      console.log(
        `\n${ok("stopped")} — cancelled ${r.cancelled} pending booking(s).\n` +
          dim("  Already-published articles are untouched.\n"),
      );
      break;
    }

    case "run": {
      const { runPublishCadenceOnce } = await lib();
      printRun(await runPublishCadenceOnce());
      console.log("");
      break;
    }

    case "dry": {
      process.env.PUBLISH_CADENCE_DRY_RUN = "1";
      const { runPublishCadenceOnce } = await lib();
      // reschedule:false so a test cannot arm the cadence as a side effect
      printRun(await runPublishCadenceOnce({ reschedule: false }));
      console.log("");
      break;
    }

    case "gate": {
      const slug = args[1];
      if (!slug) {
        console.error("usage: node scripts/publish-cadence.mjs gate <slug>");
        process.exit(2);
      }
      const { gateArticleFile } = await lib();
      const g = gateArticleFile(slug);
      console.log(`\n${g.ok ? ok("PASS") : bad("BLOCKED")}  ${slug}`);
      for (const r of g.reasons) console.log(`  ${dim("- " + r)}`);
      console.log("");
      process.exit(g.ok ? 0 : 1);
    }

    case "notify:test": {
      const { notifyTest, configuredNotifyTargets } = await import("../src/lib/notify.ts");
      const targets = configuredNotifyTargets();
      if (!targets.length) {
        console.log(
          `\n${warn("no channels configured")}\n` +
            dim("  Set one of NOTIFY_SLACK_WEBHOOK_URL / NOTIFY_PUMBLE_WEBHOOK_URL /\n") +
            dim("  NOTIFY_DISCORD_WEBHOOK_URL / NOTIFY_WEBHOOK_URL / NOTIFY_WHATSAPP_* in .env\n"),
        );
        break;
      }
      console.log(`\nSending a test to: ${targets.join(", ")}`);
      for (const r of await notifyTest()) {
        console.log(
          `  ${r.ok ? ok("sent") : bad("failed")} ${r.target}${r.error ? dim(" " + r.error) : ""}`,
        );
      }
      console.log("");
      break;
    }

    default:
      console.error(`unknown command: ${cmd}`);
      console.error("try: status | start | stop | run | dry | gate <slug> | notify:test");
      process.exit(2);
  }
} catch (e) {
  console.error(`\n${bad("error")} ${e?.message ?? e}\n`);
  process.exit(1);
}

process.exit(0);
