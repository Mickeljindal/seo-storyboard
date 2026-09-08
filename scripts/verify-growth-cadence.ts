/**
 * Prove the growth automation does not re-crawl on every cycle.
 *
 * The Autopilot calls runGrowthCycle() on each of its cycles, which can be every
 * few minutes. If cadence checking were broken, that would mean a Reddit and
 * community sweep every few minutes: fast route to a rate-limit ban. This asserts
 * the opposite, so a future refactor cannot quietly remove the guard.
 *
 * Run with the dev server STOPPED (PGlite allows one writer).
 */
import { loadProjectEnv } from "../src/lib/load-env";

async function main() {
  loadProjectEnv();
  const { runGrowthCycle } = await import("../src/lib/growth-autopilot");
  const jobsRepo = await import("../src/server/db/repos/jobs");
  const { getDb } = await import("../src/server/db/client");
  const db = await getDb();

  /**
   * Every job type the growth cycle can enqueue.
   *
   * Derived from a single list so adding a task cannot leave this test half-blind.
   * An earlier version hard-coded the five original growth types, so when the six
   * link-building tasks were added the cleanup left their jobs in the queue and the
   * next run's in-flight dedupe silently changed what the test was measuring.
   */
  const ALL_JOB_TYPES = [
    "crawl_trends", "crawl_reddit_threads", "draft_reddit_replies",
    "crawl_communities", "prune_trends",
    "mine_backlinks", "crawl_link_contacts", "draft_link_pitches",
    "schedule_followups", "poll_replies", "send_outreach", "verify_links",
    "tend_inboxes",
  ];
  const clearQueue = async () => {
    await db.execute(
      `delete from jobs where type in (${ALL_JOB_TYPES.map((t) => `'${t}'`).join(",")})`,
    );
  };

  // Start from a clean queue so in-flight dedupe is not what we are measuring.
  await clearQueue();

  /**
   * Warm the cadence stamps before measuring anything.
   *
   * Stamps are written on ATTEMPT, so a task that has never run has no stamp and
   * will legitimately queue on the first cycle. The test then reads that as a
   * broken cadence guard. This bit the suite the moment a thirteenth task was
   * added: everything passed until the new task appeared, then step 1 reported a
   * failure that was really just a first run. One unforced cycle plus a queue
   * clear makes the assertions independent of whatever ran before.
   */
  await runGrowthCycle();
  await clearQueue();

  const stamps: any = await db.execute(
    `select key, value from app_settings where key like 'growth.%'
        or key like 'links.%' or key like 'inboxes.%' order by key`,
  );
  console.log("cadence stamps currently on record:");
  for (const r of stamps.rows ?? stamps) {
    const hrs = ((Date.now() - new Date(r.value).getTime()) / 3_600_000).toFixed(2);
    console.log(`   ${r.key} = ${hrs}h ago`);
  }

  console.log("\n1) normal cycle (what Autopilot calls) — everything ran minutes ago:");
  const a = await runGrowthCycle();
  console.log(`   queued : ${a.queued.length ? a.queued.join(", ") : "(nothing)"}`);
  console.log(`   skipped: ${a.skipped.map((s) => `${s.task} ${s.hoursAgo}h ago`).join(", ")}`);

  // Count the tasks rather than assuming a number, so growth does not break this.
  const taskCount = a.skipped.length;
  const pass1 = a.queued.length === 0 && taskCount > 0;
  console.log(
    `   => ${pass1 ? "PASS" : "FAIL"} (expected 0 queued, all ${taskCount} skipped by cadence)`,
  );

  console.log("\n2) forced cycle (the 'Run everything now' button):");
  const b = await runGrowthCycle({ force: true });
  console.log(`   queued : ${b.queued.join(", ")}`);
  const pass2 = b.queued.length === taskCount;
  console.log(
    `   => ${pass2 ? "PASS" : "FAIL"} (expected all ${taskCount} queued, got ${b.queued.length})`,
  );

  console.log("\n3) forced again while those 5 are still queued (double-click):");
  const c = await runGrowthCycle({ force: true });
  console.log(`   queued : ${c.queued.length ? c.queued.join(", ") : "(nothing — deduped)"}`);
  const pass3 = c.queued.length === 0;
  console.log(`   => ${pass3 ? "PASS" : "FAIL"} (expected 0: no duplicate crawls)`);

  const pending = await jobsRepo.countActiveJobs();
  console.log(`\nqueue depth: ${pending} (should be ${taskCount}, not ${taskCount * 2})`);

  // Leave the queue clean so the next dev boot does not start a long sweep.
  await clearQueue();
  console.log("queue cleared again (test left no work behind)");

  const ok = pass1 && pass2 && pass3 && pending === taskCount;
  console.log(`\n${ok ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}`);
  if (!ok) process.exitCode = 1;
}

main().then(() => process.exit(process.exitCode ?? 0));
