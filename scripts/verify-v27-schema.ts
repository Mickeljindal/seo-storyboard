import { loadProjectEnv } from "../src/lib/load-env";
loadProjectEnv();
const { getDb } = await import("../src/server/db/client");
const db = await getDb();

const cols = async (t: string) =>
  (
    (await db.execute(
      `select column_name from information_schema.columns where table_name='${t}' order by column_name`,
    )) as unknown as { rows: { column_name: string }[] }
  ).rows.map((r) => r.column_name);

const idx = async (t: string) =>
  (
    (await db.execute(
      `select indexname from pg_indexes where tablename='${t}' order by indexname`,
    )) as unknown as { rows: { indexname: string }[] }
  ).rows.map((r) => r.indexname);

let fails = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  if (!cond) fails++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
};

const rr = await cols("recipe_runs");
ok("recipe_runs exists", rr.length > 0, `${rr.length} cols`);
for (const c of [
  "id", "recipe", "input_text", "input_json", "campaign_name", "status", "found",
  "stored", "duplicates", "rejected", "queries_used", "readout", "error",
  "started_at", "finished_at", "created_at",
]) ok(`recipe_runs.${c}`, rr.includes(c));

const ib = await cols("outreach_inboxes");
ok("outreach_inboxes exists", ib.length > 0, `${ib.length} cols`);
for (const c of [
  "id", "label", "from_email", "from_name", "reply_to", "provider", "credential_ref",
  "daily_cap", "warmup_started_at", "status", "paused_reason", "bounces",
  "complaints", "last_sent_at", "notes", "created_at", "updated_at",
]) ok(`outreach_inboxes.${c}`, ib.includes(c));
ok(
  "outreach_inboxes stores NO secret",
  !ib.some((c) => /password|secret|api_key|token/i.test(c)),
  ib.filter((c) => /password|secret|api_key|token/i.test(c)).join(",") || "none",
);
ok(
  "outreach_inboxes does NOT denormalise sent_today",
  !ib.some((c) => /sent_today|sent_total/i.test(c)),
);

const lp = await cols("link_prospects");
for (const c of ["source_recipe", "recipe_run_id", "recipe_evidence"])
  ok(`link_prospects.${c}`, lp.includes(c));
ok("link_prospects keeps every v26 column", ["link_found", "link_lost_at", "campaign_name", "check_count"].every((c) => lp.includes(c)));

const op = await cols("outreach_prospects");
ok("outreach_prospects.inbox_id", op.includes("inbox_id"));
const om = await cols("outreach_messages");
ok("outreach_messages.inbox_id", om.includes("inbox_id"));
ok("outreach_messages keeps edited_by_human", om.includes("edited_by_human"));

const wanted: Record<string, string[]> = {
  recipe_runs: ["idx_recipe_runs_recipe", "idx_recipe_runs_status", "idx_recipe_runs_when"],
  outreach_inboxes: [
    "idx_outreach_inboxes_email", "idx_outreach_inboxes_status", "idx_outreach_inboxes_lru",
  ],
  link_prospects: ["idx_link_prospects_recipe", "idx_link_prospects_recipe_run"],
  outreach_prospects: ["idx_outreach_prospects_inbox"],
  outreach_messages: ["idx_outreach_messages_inbox", "idx_outreach_messages_inbox_sent"],
};
for (const [t, list] of Object.entries(wanted)) {
  const have = await idx(t);
  for (const i of list) ok(`index ${i}`, have.includes(i));
}

// The unique index has to actually refuse a duplicate address, case-insensitively.
await db.execute(
  `insert into outreach_inboxes (label, from_email) values ('t1','V27Check@Example.com')`,
);
let dupRefused = false;
try {
  await db.execute(
    `insert into outreach_inboxes (label, from_email) values ('t2','v27check@example.com')`,
  );
} catch {
  dupRefused = true;
}
ok("one address cannot be added twice, whatever the casing", dupRefused);
await db.execute(`delete from outreach_inboxes where label in ('t1','t2')`);

console.log(`\n${fails === 0 ? "v27 SCHEMA OK" : `${fails} FAILED`}`);
process.exit(fails === 0 ? 0 : 1);
