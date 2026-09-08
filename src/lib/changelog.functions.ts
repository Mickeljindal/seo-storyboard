import { createServerFn } from "@tanstack/react-start";

/**
 * CHANGELOG reader — parses the repo's CHANGELOG.md (single source of truth) into
 * structured entries for the in-app /changelog page. No second copy to drift.
 */

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  status: string;
  visibility: string;
  items: string[];
};

function parseChangelog(md: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = md.split("\n");
  let cur: ChangelogEntry | null = null;

  const push = () => {
    if (cur) entries.push(cur);
    cur = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    // "## vX.Y.Z — YYYY-MM-DD — Title"
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      push();
      const parts = h[1].split(/\s+—\s+|\s+-\s+/); // em-dash or hyphen separators
      const version = (parts[0] ?? "").trim();
      const date = (parts[1] ?? "").trim();
      const title = parts.slice(2).join(" — ").trim() || version;
      cur = { version, date, title, status: "", visibility: "", items: [] };
      continue;
    }
    if (!cur) continue;
    const s = line.match(/^Status:\s*(.+)$/i);
    if (s) {
      // "Shipped · Visibility: Internal"
      const rest = s[1];
      const vis = rest.match(/Visibility:\s*(.+)$/i);
      cur.visibility = vis ? vis[1].trim() : "";
      cur.status = rest.replace(/·?\s*Visibility:.*/i, "").replace(/·\s*$/, "").trim();
      continue;
    }
    const b = line.match(/^[-*]\s+(.+)$/);
    if (b) cur.items.push(b[1].trim());
  }
  push();
  return entries.filter((e) => /^v?\d/.test(e.version));
}

export const getChangelogFn = createServerFn({ method: "GET" }).handler(async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  try {
    const file = path.join(process.cwd(), "CHANGELOG.md");
    const md = fs.readFileSync(file, "utf8");
    return { ok: true as const, entries: parseChangelog(md) };
  } catch (e) {
    return { ok: false as const, entries: [] as ChangelogEntry[], error: String((e as Error)?.message ?? e) };
  }
});
