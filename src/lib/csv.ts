/**
 * CSV parsing, shared.
 *
 * Extracted from scripts/import-outreach-prospects.ts so the backlink miner does
 * not become a second hand-rolled parser that drifts from the first. This matters
 * more than it sounds for the SEMrush exports: `Source title` regularly contains
 * commas ("UGURUS – Elite Training & Mentorship For Digital Agencies, and more"),
 * so splitting on commas silently shifts every later column. An early probe of
 * the data did exactly that and reported nonsense.
 *
 * Handles quoted fields, escaped "" inside quotes, embedded commas and newlines,
 * and CRLF.
 */

/** Parse to rows of raw cells. */
export function parseCsvRows(text: string): string[][] {
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
  return rows;
}

/**
 * Parse to objects keyed by a normalised header ("Page ascore" -> "page_ascore").
 * Column order is irrelevant and extra columns are ignored, so a re-export with
 * a changed layout does not break the caller.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = parseCsvRows(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}

/**
 * Stream a large CSV row-by-row without holding the parsed result in memory.
 * The six usable competitor exports are 94,000 link rows and the refdomain files
 * are 30,000 rows each; materialising all of them as objects at once is wasteful
 * when the miner only aggregates.
 */
export async function forEachCsvRow(
  filePath: string,
  onRow: (row: Record<string, string>) => void,
): Promise<number> {
  const fs = await import("node:fs");
  const readline = await import("node:readline");

  const stream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let header: string[] | null = null;
  let pending = "";
  let count = 0;

  for await (const line of rl) {
    // A quoted field may contain a newline, so a "line" is not always a row.
    // Join lines until the quote count is even.
    pending = pending ? `${pending}\n${line}` : line;
    const quotes = (pending.match(/"/g) ?? []).length;
    if (quotes % 2 !== 0) continue;

    const cells = parseCsvRows(pending)[0];
    pending = "";
    if (!cells) continue;

    if (!header) {
      header = cells.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      continue;
    }
    const o: Record<string, string> = {};
    header.forEach((h, i) => (o[h] = (cells[i] ?? "").trim()));
    onRow(o);
    count++;
  }
  return count;
}
