import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { contacts } = schema;

/**
 * CRM — the customer list behind prompt-to-email.
 *
 * The list is uploaded by an admin from a CSV export, never scraped, and every
 * row carries a lifecycle STATUS that the segments filter on. Import is an UPSERT
 * on the email address, so re-uploading a fuller export updates people in place
 * instead of duplicating them, and a person who unsubscribed stays unsubscribed
 * across re-imports (we never flip `subscribed` back to true on import).
 */

export type ContactStatus = "paying" | "abandoned" | "registered" | "lead" | "unknown";

export const SEGMENTS: { key: string; label: string; hint: string }[] = [
  { key: "all", label: "Everyone subscribed", hint: "Every contact who has not unsubscribed" },
  { key: "paying", label: "Paying customers", hint: "Existing paying customers" },
  { key: "abandoned", label: "Abandoned checkout", hint: "Tried to buy, never completed the purchase" },
  { key: "registered", label: "Registered, never bought", hint: "Signed up but did not buy or try to buy" },
  { key: "lead", label: "Leads", hint: "Early interest, not yet registered" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Map loose CSV header/status words onto our five statuses. */
function normaliseStatus(raw: string | undefined): ContactStatus {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return "unknown";
  if (/(pay|paid|customer|active|subscri)/.test(s)) return "paying";
  if (/(abandon|cart|checkout|incomplete|unpaid|failed)/.test(s)) return "abandoned";
  if (/(regist|signup|sign-up|signed|trial|user)/.test(s)) return "registered";
  if (/(lead|prospect|interest)/.test(s)) return "lead";
  if (["paying", "abandoned", "registered", "lead", "unknown"].includes(s)) return s as ContactStatus;
  return "unknown";
}

/**
 * A small RFC-4180-ish CSV parser. Quote and comma aware, handles escaped quotes
 * (""), and \r\n or \n line endings. Deliberately hand-rolled so the engine takes
 * no CSV dependency; Excel users export to CSV first.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const text = input.replace(/^\uFEFF/, ""); // strip BOM
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // handled by the \n branch; ignore standalone \r
    } else {
      field += c;
    }
  }
  // last field/row if the file did not end with a newline
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export type ParsedContact = {
  email: string;
  name?: string;
  company?: string;
  status: ContactStatus;
  tags: string[];
  meta: Record<string, string>;
};

/**
 * Turn CSV text into contact rows. Recognises common header names for email /
 * name / company / status; every other column is kept verbatim in `meta` so no
 * uploaded data is silently dropped. A `status` column value wins; if there is no
 * status column, the whole import can be stamped with a default status instead.
 */
export function csvToContacts(
  csv: string,
  opts?: { defaultStatus?: ContactStatus },
): { rows: ParsedContact[]; skipped: number; headers: string[] } {
  const table = parseCsv(csv);
  if (table.length === 0) return { rows: [], skipped: 0, headers: [] };
  const headers = table[0].map((h) => h.trim());
  const lower = headers.map((h) => h.toLowerCase());

  const findCol = (...names: string[]) =>
    lower.findIndex((h) => names.some((n) => h === n || h.includes(n)));

  const emailCol = findCol("email", "e-mail", "mail");
  const nameCol = findCol("name", "full name", "first name", "customer");
  const companyCol = findCol("company", "organisation", "organization", "business");
  const statusCol = findCol("status", "type", "segment", "stage", "lifecycle");

  const rows: ParsedContact[] = [];
  let skipped = 0;
  for (let r = 1; r < table.length; r++) {
    const cells = table[r];
    const email = (emailCol >= 0 ? cells[emailCol] : cells[0] ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      skipped++;
      continue;
    }
    const status =
      statusCol >= 0 && cells[statusCol]?.trim()
        ? normaliseStatus(cells[statusCol])
        : (opts?.defaultStatus ?? "unknown");
    const meta: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (i === emailCol || i === nameCol || i === companyCol || i === statusCol) return;
      const v = cells[i]?.trim();
      if (h && v) meta[h] = v;
    });
    rows.push({
      email,
      name: nameCol >= 0 ? cells[nameCol]?.trim() || undefined : undefined,
      company: companyCol >= 0 ? cells[companyCol]?.trim() || undefined : undefined,
      status,
      tags: [],
      meta,
    });
  }
  return { rows, skipped, headers };
}

export type ImportResult = { inserted: number; updated: number; skipped: number; total: number };

/**
 * Upsert contacts by email. New addresses are inserted; known ones are updated
 * with any non-empty new value, and their status is upgraded to the imported one.
 * Never re-subscribes someone who opted out.
 */
export async function importContacts(
  parsed: ParsedContact[],
  source = "csv",
): Promise<ImportResult> {
  const db = await getDb();
  let inserted = 0;
  let updated = 0;
  for (const c of parsed) {
    const [existing] = await db
      .select()
      .from(contacts)
      .where(sql`lower(${contacts.email}) = ${c.email}`)
      .limit(1);
    if (existing) {
      await db
        .update(contacts)
        .set({
          name: c.name ?? existing.name,
          company: c.company ?? existing.company,
          // Upgrade status when the import knows something more specific.
          status: c.status !== "unknown" ? c.status : existing.status,
          meta: { ...(existing.meta as Record<string, unknown> | null), ...c.meta },
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, existing.id));
      updated++;
    } else {
      await db.insert(contacts).values({
        email: c.email,
        name: c.name ?? null,
        company: c.company ?? null,
        status: c.status,
        tags: c.tags,
        source,
        meta: c.meta,
      });
      inserted++;
    }
  }
  return { inserted, updated, skipped: 0, total: parsed.length };
}

export async function listContacts(opts?: {
  segment?: string;
  search?: string;
  limit?: number;
}) {
  const db = await getDb();
  const conds = [];
  if (opts?.segment && opts.segment !== "all") {
    conds.push(eq(contacts.status, opts.segment));
  }
  if (opts?.search?.trim()) {
    const q = `%${opts.search.trim().toLowerCase()}%`;
    conds.push(sql`(lower(${contacts.email}) like ${q} or lower(coalesce(${contacts.name}, '')) like ${q} or lower(coalesce(${contacts.company}, '')) like ${q})`);
  }
  let query = db.select().from(contacts).$dynamic();
  if (conds.length) query = query.where(and(...conds));
  return query.orderBy(desc(contacts.createdAt)).limit(opts?.limit ?? 200);
}

/** Subscribed recipients for a segment, the exact list a send iterates. */
export async function segmentRecipients(segment: string): Promise<
  { id: string; email: string; name: string | null }[]
> {
  const db = await getDb();
  const conds = [eq(contacts.subscribed, true)];
  if (segment && segment !== "all") conds.push(eq(contacts.status, segment));
  const rows = await db
    .select({ id: contacts.id, email: contacts.email, name: contacts.name })
    .from(contacts)
    .where(and(...conds));
  return rows;
}

/** Count per status + total + subscribed, for the dashboard tiles. */
export async function contactCounts(): Promise<{
  total: number;
  subscribed: number;
  byStatus: Record<string, number>;
}> {
  const db = await getDb();
  const [tot] = await db.select({ c: sql<number>`count(*)` }).from(contacts);
  const [sub] = await db
    .select({ c: sql<number>`count(*)` })
    .from(contacts)
    .where(eq(contacts.subscribed, true));
  const rows = await db
    .select({ status: contacts.status, c: sql<number>`count(*)` })
    .from(contacts)
    .groupBy(contacts.status);
  const byStatus: Record<string, number> = {};
  for (const r of rows) byStatus[r.status] = Number(r.c);
  return { total: Number(tot?.c ?? 0), subscribed: Number(sub?.c ?? 0), byStatus };
}

export async function updateContactStatus(id: string, status: ContactStatus) {
  const db = await getDb();
  await db.update(contacts).set({ status, updatedAt: new Date() }).where(eq(contacts.id, id));
}

export async function setSubscribed(id: string, subscribed: boolean) {
  const db = await getDb();
  await db.update(contacts).set({ subscribed, updatedAt: new Date() }).where(eq(contacts.id, id));
}

/** Opt someone out by address. Called when an unsubscribe is processed. */
export async function unsubscribeByEmail(email: string) {
  const db = await getDb();
  await db
    .update(contacts)
    .set({ subscribed: false, updatedAt: new Date() })
    .where(sql`lower(${contacts.email}) = ${email.trim().toLowerCase()}`);
}

export async function deleteContact(id: string) {
  const db = await getDb();
  await db.delete(contacts).where(eq(contacts.id, id));
}

export async function deleteContacts(ids: string[]) {
  if (!ids.length) return;
  const db = await getDb();
  await db.delete(contacts).where(inArray(contacts.id, ids));
}

/** Stamp last-emailed on a batch after a send. */
export async function markEmailed(ids: string[]) {
  if (!ids.length) return;
  const db = await getDb();
  await db.update(contacts).set({ lastEmailedAt: new Date() }).where(inArray(contacts.id, ids));
}
