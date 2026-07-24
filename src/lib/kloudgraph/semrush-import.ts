import "@tanstack/react-start/server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getDb, schema } from "@/server/db/client";

/**
 * KLOUDGRAPH — Semrush CSV importer.
 *
 * Reads the `kloudgraph-semrush-export/<competitor>/*.csv` folder the user
 * exports from Semrush and normalizes every report into the kg_* tables.
 *
 * Design:
 *   - Report type is auto-detected from Semrush's native filename.
 *   - Re-importing a file REPLACES that competitor's rows for that report
 *     (delete-then-insert), so running it twice never creates duplicates.
 *   - Every import is recorded in kg_import_log.
 *   - The Positions report must be CSV (Semrush also offers .xlsx which we
 *     can't parse without a dependency — those files are skipped + reported).
 */

const {
  kgCompetitors,
  kgOrganicRankings,
  kgKeywordGap,
  kgOrganicCompetitors,
  kgSubdomains,
  kgBacklinks,
  kgBacklinkAnchors,
  kgBacklinkPages,
  kgReferringDomains,
  kgImportLog,
} = schema;

export type ReportType =
  | "positions"
  | "keyword_gap"
  | "organic_competitors"
  | "subdomains"
  | "backlinks"
  | "backlink_anchors"
  | "backlink_pages"
  | "referring_domains"
  | "pages"
  | "unknown";

export type FileImportResult = {
  file: string;
  competitor: string;
  reportType: ReportType;
  rows: number;
  skipped?: boolean;
  reason?: string;
  error?: string;
};

export type FolderImportResult = {
  ok: boolean;
  root: string;
  competitors: string[];
  files: FileImportResult[];
  totalRows: number;
  error?: string;
};

// ---------------------------------------------------------------------------
// CSV parsing (handles quoted fields, embedded commas/newlines, "" escapes)
// ---------------------------------------------------------------------------

function detectDelimiter(headerLine: string): string {
  const counts: Record<string, number> = {
    ",": (headerLine.match(/,/g) ?? []).length,
    ";": (headerLine.match(/;/g) ?? []).length,
    "\t": (headerLine.match(/\t/g) ?? []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/** Parse CSV text into an array of header-keyed row objects. */
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const firstLineEnd = text.indexOf("\n");
  const headerLine = firstLineEnd === -1 ? text : text.slice(0, firstLineEnd);
  const delim = detectDelimiter(headerLine);

  // Single-pass parse: build row objects directly (no intermediate matrix) to
  // keep memory low on large exports.
  let headers: string[] | null = null;
  const rows: Record<string, string>[] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  const endRecord = () => {
    record.push(field);
    field = "";
    if (!headers) {
      headers = record.map((h) => h.trim());
    } else if (!(record.length === 1 && record[0].trim() === "")) {
      const obj: Record<string, string> = {};
      for (let c = 0; c < headers.length; c++) {
        // Strip NUL bytes: Postgres text columns reject them outright (some
        // scraped/multilingual Semrush exports contain a stray NUL in an
        // anchor/URL field), and they can't legitimately appear in real text.
        obj[headers[c]] = (record[c] ?? "").split("\0").join("").trim();
      }
      rows.push(obj);
    }
    record = [];
  };

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
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      record.push(field);
      field = "";
    } else if (c === "\n") {
      endRecord();
    } else if (c === "\r") {
      // ignore; handled by \n
    } else {
      field += c;
    }
  }
  // trailing field/record
  if (field.length > 0 || record.length > 0) endRecord();

  return { headers: headers ?? [], rows };
}

// ---------------------------------------------------------------------------
// Field coercion helpers
// ---------------------------------------------------------------------------

function pick(row: Record<string, string>, keys: string[]): string | undefined {
  for (const k of keys) {
    // exact match first
    if (row[k] !== undefined) return row[k];
  }
  // case-insensitive fallback
  const lowerMap = new Map(Object.keys(row).map((k) => [k.toLowerCase(), k]));
  for (const k of keys) {
    const hit = lowerMap.get(k.toLowerCase());
    if (hit) return row[hit];
  }
  return undefined;
}

function toInt(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseInt(v.replace(/[, ]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function toNum(v: string | undefined): string | null {
  if (v == null || v === "") return null;
  const n = Number(v.replace(/[, ]/g, ""));
  return Number.isFinite(n) ? String(n) : null;
}

function toBool(v: string | undefined): boolean | null {
  if (v == null || v === "") return null;
  const s = v.trim().toLowerCase();
  if (["true", "yes", "1"].includes(s)) return true;
  if (["false", "no", "0"].includes(s)) return false;
  return null;
}

function toDate(v: string | undefined): string | null {
  if (v == null || v === "") return null;
  const m = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

/** Derive a snapshot date from the Semrush filename, else today. */
function snapshotFromFilename(fileName: string): string {
  const iso = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const compact = fileName.match(/(20\d{2})(\d{2})(\d{2})/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Report-type detection from Semrush's native filenames
// ---------------------------------------------------------------------------

export function detectReportType(fileName: string): ReportType {
  const f = fileName.toLowerCase();
  // Backlink-gap "matrix" exports are two-domain files we don't import here.
  if (f.includes("_matrix")) return "unknown";
  // Position-changes exports aren't imported.
  if (f.includes("positionchanges")) return "unknown";
  if (f.endsWith(".xlsx")) {
    // Positions is often exported as xlsx; caller reports it as needs-csv.
    if (f.includes("position")) return "positions";
    return "unknown";
  }
  if (!f.endsWith(".csv")) return "unknown";
  if (f.includes("gap")) return "keyword_gap";
  if (f.includes("organic.competitors") || f.includes("-competitors")) return "organic_competitors";
  if (f.includes("organic.subdomains") || f.includes("-subdomains")) return "subdomains";
  // Pages report (top pages by traffic) — different shape, handled separately.
  if (f.includes("organic.pages") || f.includes("pagesv3")) return "pages";
  if (f.includes("organic.positions") || f.includes("-positions")) return "positions";
  if (f.includes("backlinks_anchors") || f.includes("anchors")) return "backlink_anchors";
  if (f.includes("backlinks_refdomains") || f.includes("referring") || f.includes("refdomains"))
    return "referring_domains";
  if (f.includes("backlinks_pages")) return "backlink_pages";
  if (f.includes("backlinks")) return "backlinks";
  return "unknown";
}

const OUR_DOMAIN = "kloudbean.com";

/** Extract a leading domain from a Semrush filename, if present. */
export function extractFileDomain(fileName: string): string | null {
  const https = fileName.match(/^https?___([a-z0-9.-]+?)_?-/i);
  if (https) return https[1].toLowerCase().replace(/_$/, "");
  const m = fileName.match(/^([a-z0-9-]+(?:\.[a-z0-9-]+)+)-/i);
  if (m && /\.[a-z]{2,}$/i.test(m[1])) return m[1].toLowerCase();
  return null;
}

/** Second-level label of a domain (e.g. "pantheon.io" → "pantheon"). */
export function sld(domain: string): string {
  const parts = domain
    .toLowerCase()
    .replace(/^www\./, "")
    .split(".");
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

// ---------------------------------------------------------------------------
// Per-report row mappers → returns rows ready for insert
// ---------------------------------------------------------------------------

function mapPositions(rows: Record<string, string>[], domain: string, snap: string) {
  return rows
    .map((r) => {
      const keyword = pick(r, ["Keyword"]);
      if (!keyword) return null;
      return {
        competitorDomain: domain,
        keyword,
        position: toInt(pick(r, ["Position"])),
        previousPosition: toInt(pick(r, ["Previous position", "Previous Position"])),
        volume: toInt(pick(r, ["Search Volume", "Volume"])),
        difficulty: toInt(pick(r, ["Keyword Difficulty", "Difficulty"])),
        cpc: toNum(pick(r, ["CPC"])),
        url: pick(r, ["URL"]) ?? null,
        traffic: toInt(pick(r, ["Traffic"])),
        trafficPct: toNum(pick(r, ["Traffic (%)"])),
        trafficCost: toNum(pick(r, ["Traffic Cost"])),
        intents: pick(r, ["Keyword Intents", "Intents"]) ?? null,
        serpFeatures: pick(r, ["SERP Features by Keyword", "SERP Features"]) ?? null,
        results: toNum(pick(r, ["Number of Results", "Results"])),
        snapshotDate: snap,
      };
    })
    .filter(Boolean) as (typeof kgOrganicRankings.$inferInsert)[];
}

function mapKeywordGap(
  rows: Record<string, string>[],
  headers: string[],
  domain: string,
  snap: string,
) {
  // Position columns are headers that look like a domain (contain a dot) and
  // are NOT "(pages)" columns. One is the competitor, one is kloudbean.
  const domainCols = headers.filter((h) => /\.[a-z]{2,}$/i.test(h.trim()) && !/\(pages\)/i.test(h));
  const ourCol = domainCols.find((h) => h.toLowerCase().includes("kloudbean"));
  const compCol = domainCols.find((h) => h !== ourCol) ?? domain;
  const compPagesCol = headers.find(
    (h) => /\(pages\)/i.test(h) && !h.toLowerCase().includes("kloudbean"),
  );
  const ourPagesCol = headers.find(
    (h) => /\(pages\)/i.test(h) && h.toLowerCase().includes("kloudbean"),
  );
  return rows
    .map((r) => {
      const keyword = pick(r, ["Keyword"]);
      if (!keyword) return null;
      return {
        competitorDomain: domain,
        keyword,
        intents: pick(r, ["Intents", "Keyword Intents"]) ?? null,
        volume: toInt(pick(r, ["Volume", "Search Volume"])),
        difficulty: toInt(pick(r, ["Keyword Difficulty", "Difficulty"])),
        cpc: toNum(pick(r, ["CPC"])),
        competitionDensity: toNum(pick(r, ["Competition Density", "Competition"])),
        competitorPosition: toInt(compCol ? r[compCol] : undefined),
        ourPosition: toInt(ourCol ? r[ourCol] : undefined),
        competitorUrl: (compPagesCol ? r[compPagesCol] : "") || null,
        ourUrl: (ourPagesCol ? r[ourPagesCol] : "") || null,
        results: toNum(pick(r, ["Results", "Number of Results"])),
        snapshotDate: snap,
      };
    })
    .filter(Boolean) as (typeof kgKeywordGap.$inferInsert)[];
}

function mapOrganicCompetitors(rows: Record<string, string>[], domain: string, snap: string) {
  return rows
    .map((r) => {
      const comp = pick(r, ["Domain"]);
      if (!comp) return null;
      return {
        forDomain: domain,
        competitorDomain: comp,
        relevance: toNum(pick(r, ["Competitor Relevance", "Relevance"])),
        commonKeywords: toInt(pick(r, ["Common Keywords"])),
        organicKeywords: toInt(pick(r, ["Organic Keywords"])),
        organicTraffic: toNum(pick(r, ["Organic Traffic"])),
        organicCost: toNum(pick(r, ["Organic Cost"])),
        adwordsKeywords: toInt(pick(r, ["Adwords Keywords", "Paid Keywords"])),
        snapshotDate: snap,
      };
    })
    .filter(Boolean) as (typeof kgOrganicCompetitors.$inferInsert)[];
}

function mapSubdomains(rows: Record<string, string>[], domain: string, snap: string) {
  return rows
    .map((r) => {
      const url = pick(r, ["URL", "Subdomain"]);
      if (!url) return null;
      return {
        competitorDomain: domain,
        subdomainUrl: url,
        traffic: toInt(pick(r, ["Traffic"])),
        trafficPct: toNum(pick(r, ["Traffic (%)"])),
        keywords: toInt(pick(r, ["Number of Keywords", "Keywords"])),
        snapshotDate: snap,
      };
    })
    .filter(Boolean) as (typeof kgSubdomains.$inferInsert)[];
}

function mapBacklinks(rows: Record<string, string>[], domain: string, snap: string) {
  return rows.map((r) => ({
    competitorDomain: domain,
    pageAscore: toInt(pick(r, ["Page ascore", "Page Ascore"])),
    sourceTitle: pick(r, ["Source title", "Source Title"]) ?? null,
    sourceUrl: pick(r, ["Source url", "Source URL"]) ?? null,
    targetUrl: pick(r, ["Target url", "Target URL"]) ?? null,
    anchor: pick(r, ["Anchor"]) ?? null,
    externalLinks: toInt(pick(r, ["External links", "External Links"])),
    internalLinks: toInt(pick(r, ["Internal links", "Internal Links"])),
    nofollow: toBool(pick(r, ["Nofollow"])),
    sponsored: toBool(pick(r, ["Sponsored"])),
    ugc: toBool(pick(r, ["Ugc", "UGC"])),
    isText: toBool(pick(r, ["Text"])),
    isFrame: toBool(pick(r, ["Frame"])),
    isForm: toBool(pick(r, ["Form"])),
    isImage: toBool(pick(r, ["Image"])),
    sitewide: toBool(pick(r, ["Sitewide"])),
    firstSeen: toDate(pick(r, ["First seen", "First Seen"])),
    lastSeen: toDate(pick(r, ["Last seen", "Last Seen"])),
    newLink: toBool(pick(r, ["New link", "New Link"])),
    lostLink: toBool(pick(r, ["Lost link", "Lost Link"])),
    snapshotDate: snap,
  })) as (typeof kgBacklinks.$inferInsert)[];
}

function mapAnchors(rows: Record<string, string>[], domain: string, snap: string) {
  return rows
    .map((r) => {
      const anchor = pick(r, ["Anchor"]);
      if (anchor === undefined) return null;
      return {
        competitorDomain: domain,
        anchor,
        domains: toInt(pick(r, ["Domains"])),
        backlinks: toNum(pick(r, ["Backlinks"])),
        firstSeen: toDate(pick(r, ["First seen", "First Seen"])),
        lastSeen: toDate(pick(r, ["Last seen", "Last Seen"])),
        snapshotDate: snap,
      };
    })
    .filter(Boolean) as (typeof kgBacklinkAnchors.$inferInsert)[];
}

function mapBacklinkPages(rows: Record<string, string>[], domain: string, snap: string) {
  return rows.map((r) => ({
    competitorDomain: domain,
    sourceUrl: pick(r, ["Source url", "Source URL"]) ?? null,
    sourceTitle: pick(r, ["Source title", "Source Title"]) ?? null,
    responseCode: toInt(pick(r, ["Response code", "Response Code"])),
    backlinks: toNum(pick(r, ["Backlinks"])),
    domains: toInt(pick(r, ["Domains"])),
    externalLinks: toInt(pick(r, ["External links", "External Links"])),
    internalLinks: toInt(pick(r, ["Internal links", "Internal Links"])),
    lastSeen: toDate(pick(r, ["Last seen", "Last Seen"])),
    snapshotDate: snap,
  })) as (typeof kgBacklinkPages.$inferInsert)[];
}

function mapReferringDomains(rows: Record<string, string>[], domain: string, snap: string) {
  return rows
    .map((r) => {
      const ref = pick(r, ["Domain", "Referring Domain"]);
      if (!ref) return null;
      return {
        competitorDomain: domain,
        referringDomain: ref,
        domainAscore: toInt(pick(r, ["Domain ascore", "Domain Ascore", "AS"])),
        backlinks: toNum(pick(r, ["Backlinks"])),
        firstSeen: toDate(pick(r, ["First seen", "First Seen"])),
        lastSeen: toDate(pick(r, ["Last seen", "Last Seen"])),
        snapshotDate: snap,
      };
    })
    .filter(Boolean) as (typeof kgReferringDomains.$inferInsert)[];
}

// ---------------------------------------------------------------------------
// Insert helpers (chunked, with delete-then-insert per competitor+report)
// ---------------------------------------------------------------------------

async function chunkedInsert<T extends Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  values: T[],
  chunk = 200,
): Promise<number> {
  if (!values.length) return 0;
  const db = await getDb();
  let n = 0;
  for (let i = 0; i < values.length; i += chunk) {
    const slice = values.slice(i, i + chunk);
    await db.insert(table).values(slice);
    n += slice.length;
  }
  return n;
}

// ---------------------------------------------------------------------------
// Public: import a single file
// ---------------------------------------------------------------------------

export async function importSemrushFile(
  filePath: string,
  competitorDomain: string,
): Promise<FileImportResult> {
  const fileName = path.basename(filePath);
  const reportType = detectReportType(fileName);
  const base: FileImportResult = {
    file: fileName,
    competitor: competitorDomain,
    reportType,
    rows: 0,
  };

  if (reportType === "unknown") {
    return { ...base, skipped: true, reason: "unrecognized report type" };
  }
  if (reportType === "pages") {
    return {
      ...base,
      skipped: true,
      reason: "Pages report — not imported yet (Positions covers keywords).",
    };
  }
  if (fileName.toLowerCase().endsWith(".xlsx")) {
    return {
      ...base,
      skipped: true,
      reason: "Positions is an .xlsx file — re-export it as CSV so it can be imported.",
    };
  }

  try {
    const text = fs.readFileSync(filePath, "utf8");
    const fileHash = crypto.createHash("sha1").update(text).digest("hex");

    const db = await getDb();
    const { eq, and } = await import("drizzle-orm");

    // Idempotency: if this exact file (name + hash) was already imported, skip.
    const prior = await db
      .select({ id: kgImportLog.id })
      .from(kgImportLog)
      .where(and(eq(kgImportLog.fileName, fileName), eq(kgImportLog.fileHash, fileHash)))
      .limit(1);
    if (prior.length) {
      return { ...base, skipped: true, reason: "already imported (unchanged)" };
    }

    const { headers, rows } = parseCsv(text);
    const snap = snapshotFromFilename(fileName);
    let inserted = 0;

    switch (reportType) {
      case "positions": {
        await db
          .delete(kgOrganicRankings)
          .where(eq(kgOrganicRankings.competitorDomain, competitorDomain));
        inserted = await chunkedInsert(
          kgOrganicRankings,
          mapPositions(rows, competitorDomain, snap),
        );
        break;
      }
      case "keyword_gap": {
        await db.delete(kgKeywordGap).where(eq(kgKeywordGap.competitorDomain, competitorDomain));
        inserted = await chunkedInsert(
          kgKeywordGap,
          mapKeywordGap(rows, headers, competitorDomain, snap),
        );
        break;
      }
      case "organic_competitors": {
        await db
          .delete(kgOrganicCompetitors)
          .where(eq(kgOrganicCompetitors.forDomain, competitorDomain));
        inserted = await chunkedInsert(
          kgOrganicCompetitors,
          mapOrganicCompetitors(rows, competitorDomain, snap),
        );
        break;
      }
      case "subdomains": {
        await db.delete(kgSubdomains).where(eq(kgSubdomains.competitorDomain, competitorDomain));
        inserted = await chunkedInsert(kgSubdomains, mapSubdomains(rows, competitorDomain, snap));
        break;
      }
      case "backlinks": {
        await db.delete(kgBacklinks).where(eq(kgBacklinks.competitorDomain, competitorDomain));
        inserted = await chunkedInsert(kgBacklinks, mapBacklinks(rows, competitorDomain, snap));
        break;
      }
      case "backlink_anchors": {
        await db
          .delete(kgBacklinkAnchors)
          .where(eq(kgBacklinkAnchors.competitorDomain, competitorDomain));
        inserted = await chunkedInsert(kgBacklinkAnchors, mapAnchors(rows, competitorDomain, snap));
        break;
      }
      case "backlink_pages": {
        await db
          .delete(kgBacklinkPages)
          .where(eq(kgBacklinkPages.competitorDomain, competitorDomain));
        inserted = await chunkedInsert(
          kgBacklinkPages,
          mapBacklinkPages(rows, competitorDomain, snap),
        );
        break;
      }
      case "referring_domains": {
        await db
          .delete(kgReferringDomains)
          .where(eq(kgReferringDomains.competitorDomain, competitorDomain));
        inserted = await chunkedInsert(
          kgReferringDomains,
          mapReferringDomains(rows, competitorDomain, snap),
        );
        break;
      }
    }

    await db.insert(kgImportLog).values({
      competitorDomain,
      fileName,
      reportType,
      rowsImported: inserted,
      fileHash,
    });

    return { ...base, rows: inserted };
  } catch (e) {
    return { ...base, error: String((e as Error)?.message ?? e) };
  }
}

// ---------------------------------------------------------------------------
// Public: import the whole export folder (all competitors)
// ---------------------------------------------------------------------------

/** Guess the competitor domain from a folder name (e.g. "cloudways" → cloudways.com). */
function domainFromFolder(folder: string): string {
  const f = folder.trim().toLowerCase();
  if (f.includes(".")) return f; // already a domain
  return `${f}.com`;
}

export async function importSemrushFolder(
  rootDir: string,
  onFile?: (
    result: FileImportResult,
    fileIndex: number,
    totalFiles: number,
  ) => void | Promise<void>,
): Promise<FolderImportResult> {
  const abs = path.isAbsolute(rootDir) ? rootDir : path.join(process.cwd(), rootDir);
  if (!fs.existsSync(abs)) {
    return {
      ok: false,
      root: abs,
      competitors: [],
      files: [],
      totalRows: 0,
      error: `Folder not found: ${abs}`,
    };
  }

  const files: FileImportResult[] = [];
  const competitors: string[] = [];
  const entries = fs.readdirSync(abs, { withFileTypes: true });
  const competitorDirs = entries.filter((e) => e.isDirectory());

  // Pre-count total files across all competitor folders so onFile can report
  // an accurate "N of TOTAL" — without this the caller only learns the total
  // after the whole import finishes.
  let totalFiles = 0;
  for (const entry of competitorDirs) {
    const compDir = path.join(abs, entry.name);
    totalFiles += fs
      .readdirSync(compDir)
      .filter((n) => n.toLowerCase().endsWith(".csv") || n.toLowerCase().endsWith(".xlsx")).length;
  }
  let fileIndex = 0;

  for (const entry of competitorDirs) {
    const folderSld = sld(domainFromFolder(entry.name));
    const compDir = path.join(abs, entry.name);
    const compFiles = fs
      .readdirSync(compDir)
      .filter((n) => n.toLowerCase().endsWith(".csv") || n.toLowerCase().endsWith(".xlsx"));

    // Resolve the canonical competitor domain from the files whose leading
    // domain matches this folder's brand (handles folders named without a TLD,
    // e.g. "pantheon" → pantheon.io). Falls back to <folder>.com.
    const domainVotes = new Map<string, number>();
    for (const name of compFiles) {
      const fd = extractFileDomain(name);
      if (fd && sld(fd) === folderSld) domainVotes.set(fd, (domainVotes.get(fd) ?? 0) + 1);
    }
    const domain =
      [...domainVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
      domainFromFolder(entry.name);
    competitors.push(domain);
    await ensureCompetitor(domain);

    for (const name of compFiles) {
      fileIndex++;
      const fd = extractFileDomain(name);
      let result: FileImportResult;
      // Skip files that clearly belong to a DIFFERENT domain (misfiled here, or
      // kloudbean matrix files dropped into a competitor folder).
      if (fd && sld(fd) !== folderSld && sld(fd) !== sld(OUR_DOMAIN)) {
        result = {
          file: name,
          competitor: domain,
          reportType: detectReportType(name),
          rows: 0,
          skipped: true,
          reason: `belongs to ${fd}, not ${domain} — misfiled, skipped`,
        };
      } else if (fd && sld(fd) === sld(OUR_DOMAIN) && folderSld !== sld(OUR_DOMAIN)) {
        result = {
          file: name,
          competitor: domain,
          reportType: detectReportType(name),
          rows: 0,
          skipped: true,
          reason: `kloudbean file inside ${domain} folder — skipped`,
        };
      } else {
        result = await importSemrushFile(path.join(compDir, name), domain);
      }
      files.push(result);
      if (onFile) await onFile(result, fileIndex, totalFiles);
    }
  }

  const totalRows = files.reduce((a, f) => a + f.rows, 0);
  return { ok: true, root: abs, competitors, files, totalRows };
}

/**
 * Insert (or backfill) a competitor into the registry. Explicit `meta` wins;
 * otherwise falls back to the known-competitor catalog (tier + market
 * segment) so every import — including domains auto-detected from a folder
 * name that isn't in SEED_COMPETITORS — gets tagged with a real segment
 * instead of sitting as "tier 1 / category null" forever. Existing rows with
 * a missing category/name are backfilled (never overwrites a category that's
 * already set, so hand-edited categories survive re-imports).
 */
export async function ensureCompetitor(
  domain: string,
  meta?: { name?: string; tier?: number; category?: string },
): Promise<void> {
  const db = await getDb();
  try {
    const { metaForDomain } = await import("./competitor-catalog");
    const catalog = metaForDomain(domain);
    const tier = meta?.tier ?? catalog?.tier ?? 1;
    const category = meta?.category ?? catalog?.category ?? null;
    const name = meta?.name ?? domain.replace(/\.[a-z]+$/i, "");

    await db.insert(kgCompetitors).values({ domain, name, tier, category }).onConflictDoNothing();

    // Backfill category/tier on a row that already existed without one
    // (e.g. auto-registered from a folder name before the catalog knew it).
    if (category) {
      const { eq, isNull, and, or } = await import("drizzle-orm");
      await db
        .update(kgCompetitors)
        .set({ category, tier })
        .where(and(eq(kgCompetitors.domain, domain), or(isNull(kgCompetitors.category))));
    }
  } catch {
    /* registry insert best-effort */
  }
}
