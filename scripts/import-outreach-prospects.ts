#!/usr/bin/env -S npx tsx
/**
 * Import agency/studio prospects from a CSV into the outreach pipeline.
 *
 *   npx tsx scripts/import-outreach-prospects.ts prospects.csv
 *   npx tsx scripts/import-outreach-prospects.ts prospects.csv --source "conference list" --segment agency
 *
 * Expected columns (header row required, order free, extras ignored):
 *   email, name, company, role, website, country, segment,
 *   stack_signals   (semicolon or pipe separated, e.g. "lovable;nextjs")
 *   pain_hypothesis, personal_note, source, consent_basis, notes
 *
 * ABOUT `personal_note`: this is the one specific, TRUE line about their actual
 * work, and it is what separates outreach from spam. Nothing invents it. Rows
 * without one still import, but they draft with a segment-level opener and are
 * reported separately so you can see how much of your list is thin.
 *
 * ABOUT `consent_basis`: record why it is lawful and reasonable to email this
 * person (opt-in | legitimate-interest | customer). Imports without one default
 * to legitimate-interest, which for B2B outreach also requires that the message
 * be relevant to their job and easy to opt out of. Both are enforced elsewhere:
 * every send carries an unsubscribe link and checks the suppression list.
 */
import fs from "node:fs";
import { loadProjectEnv } from "../src/lib/load-env";

/** Minimal CSV reader: handles quoted fields, embedded commas, and CRLF. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else if (c !== "\r") field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);

  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}

const splitList = (v: string): string[] =>
  (v ?? "")
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter(Boolean);

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

async function main() {
  loadProjectEnv();
  const file = process.argv[2];
  if (!file || file.startsWith("--")) {
    console.error("Usage: npx tsx scripts/import-outreach-prospects.ts <file.csv> [--source S] [--segment S]");
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`No such file: ${file}`);
    process.exit(1);
  }

  const defaultSource = arg("--source");
  const defaultSegment = arg("--segment");
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  if (!rows.length) {
    console.error("No data rows found. Is the header row present?");
    process.exit(1);
  }

  const repo = await import("../src/server/db/repos/outreach");
  const { scoreProspect } = await import("../src/lib/outreach-engine");
  const { isValidEmail } = await import("../src/lib/email-sender");

  let imported = 0;
  let invalid = 0;
  let suppressed = 0;
  let withoutNote = 0;
  let withoutConsent = 0;

  for (const r of rows) {
    const email = (r.email ?? "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      invalid++;
      continue;
    }
    if (await repo.isSuppressed(email)) {
      suppressed++;
      continue;
    }
    if (!r.personal_note?.trim()) withoutNote++;
    if (!r.consent_basis?.trim() && !defaultSource) withoutConsent++;

    const input = {
      email,
      name: r.name || null,
      company: r.company || null,
      role: r.role || null,
      website: r.website || null,
      country: r.country || null,
      segment: r.segment || defaultSegment || "agency",
      stackSignals: splitList(r.stack_signals),
      painHypothesis: r.pain_hypothesis || null,
      personalNote: r.personal_note || null,
      source: r.source || defaultSource || null,
      consentBasis: r.consent_basis || "legitimate-interest",
      notes: r.notes || null,
    };
    const saved = await repo.upsertProspect(input);
    await repo.upsertProspect({
      email: saved.email,
      score: scoreProspect({ id: saved.id, ...input }),
    });
    imported++;
  }

  console.log(`imported / updated       : ${imported}`);
  console.log(`invalid addresses skipped: ${invalid}`);
  console.log(`already suppressed       : ${suppressed}`);
  console.log(`no personal note         : ${withoutNote}  <- these will read generic; add a real line before sending`);
  if (withoutConsent) console.log(`no consent basis recorded: ${withoutConsent}  <- set --source or a consent_basis column`);
  console.log(`\nNext: npx tsx scripts/run-outreach.ts --draft   then review before anything sends.`);
}

// PGlite keeps the event loop alive, so exit explicitly once the work is done.
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
