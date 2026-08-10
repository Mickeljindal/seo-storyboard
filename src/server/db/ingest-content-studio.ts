/**
 * Ingest the local `content-studio/` article folders into the engine's articles
 * table. Each folder (<slug>/<slug>.html + optional brief.md + <slug>.md) becomes
 * one row, tagged engine_source = "content-studio".
 *
 * Used by:
 *   - scripts/ingest-content-studio.ts  (CLI: full upsert; also the git-hook entry)
 *   - pglite-init.ts                     (boot: "new-only" sync so newly-committed
 *                                         articles auto-appear when the app starts)
 *
 * Idempotent: matches on url_slug. No RAG side effects here — this only writes the
 * articles table; a RAG rebuild (separate) is what would surface them to Support/Sales.
 */
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { CLUSTERS } from "../../lib/pillars";
import * as schema from "./schema";

const { articles } = schema;

export const ENGINE_SOURCE = "content-studio";

/** cluster id -> pillar id (inverse of the seed's PILLAR_CLUSTER_IDS). */
const CLUSTER_PILLAR: Record<number, number> = {
  1: 1, 4: 1, 9: 1, 10: 1, // pillar 1 (hosting/enterprise/security)
  2: 2, // self-host AI
  6: 3, // wordpress/frontend
  5: 4, // agencies
  3: 5, 7: 5, 8: 5, // deploy stacks / data / pricing
  0: 1,
};

const CLUSTER_NAME: Record<number, string> = Object.fromEntries(
  CLUSTERS.map((c) => [c.id, c.name]),
);

/** Slug-keyword fallback when a brief has no numbered "Cluster N"/"Silo N". */
function inferCluster(slug: string): number {
  const s = slug.toLowerCase();
  const rules: [RegExp, number][] = [
    [/connect-|prisma|drizzle|sequelize|typeorm|mongoose|sqlalchemy|pg_dump|mysqldump/, 7],
    [/-vs-|alternative|cloudways|vercel|render|railway|heroku|netlify|bluehost|siteground|hostinger|kinsta|wp-?engine/, 4],
    [/lovable|bolt|cursor|claude|replit|v0|vibe|ai-built|ai-app|chatgpt|windsurf/, 1],
    [/n8n|supabase|gitlab|ghost|plausible|self-?host|open-?webui|penpot|postiz/, 2],
    [/wordpress|woocommerce|wp-|elementor/, 6],
    [/next|nuxt|node|laravel|django|flask|fastapi|express|rails|fastify|nestjs|vue|react|angular|svelte|remix|astro|golang|deploy-/, 3],
    [/agency|reseller|multi-app|white-?label|client-/, 5],
    [/pricing|cost|cheap|price|budget/, 8],
    [/security|ssl|firewall|scal|load-?balanc|backup|ddos|waf|fail2ban/, 9],
    [/enterprise|compliance|nca|dammam|ksa|residency|gov|hipaa|gdpr|soc-?2|audit/, 10],
    [/database|postgres|mysql|mongo|redis|elasticsearch|mariadb|memcached|s3|storage|celery|bucket/, 7],
  ];
  for (const [re, id] of rules) if (re.test(s)) return id;
  return 0;
}

function detectGeo(text: string): "sa" | "global" {
  return /saudi|ksa|dammam|me-central|riyadh|jeddah|\bnca\b|cscc|sama|misa|in-kingdom|data residency/i.test(text)
    ? "sa"
    : "global";
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type ParsedArticle = {
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  clusterId: number;
  pillar: number;
  targetKeyword: string | null;
  secondaryKeywords: string[];
  internalLinkTargets: string[];
  wordCount: number;
  contentHtml: string;
  contentDraft: string | null;
  briefText: string | null;
  geo: "sa" | "global";
};

/** Parse one content-studio folder into an article record (pure; no DB). */
export function parseArticleFolder(dir: string, slug: string): ParsedArticle | null {
  const htmlPath = path.join(dir, `${slug}.html`);
  if (!fs.existsSync(htmlPath)) return null;
  const html = fs.readFileSync(htmlPath, "utf8");

  const mdPath = path.join(dir, `${slug}.md`);
  const contentDraft = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf8") : null;

  const briefPath = path.join(dir, "brief.md");
  const briefText = fs.existsSync(briefPath) ? fs.readFileSync(briefPath, "utf8") : null;

  let title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
  if (!title) title = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
  const metaTitle = title || slug;
  title = title.replace(/\s*[—|]\s*Kloudbean.*$/i, "").trim() || slug;

  const metaDescription =
    html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i)?.[1]?.trim() || null;

  // cluster: numbered "Cluster N"/"Silo N" first, else keyword inference.
  let clusterId = 0;
  if (briefText) {
    const m = briefText.match(/(?:cluster|silo)\D{0,4}(\d{1,2})/i);
    if (m && +m[1] >= 1 && +m[1] <= 10) clusterId = +m[1];
  }
  if (!clusterId) clusterId = inferCluster(slug);
  const pillar = CLUSTER_PILLAR[clusterId] ?? 1;

  // keywords from the brief
  let targetKeyword: string | null = null;
  const secondaryKeywords: string[] = [];
  if (briefText) {
    const pk = briefText.match(/primary(?:\s+kw|\s+keyword)?\s*:?\s*\**\s*([^\n.]+)/i);
    if (pk) targetKeyword = pk[1].replace(/\*+/g, "").trim().slice(0, 160) || null;
    const sk = briefText.match(/secondary(?:\s+kw|\s+keywords?)?\s*:?\s*\**\s*([^\n]+)/i);
    if (sk) {
      for (const t of sk[1].split(/[,;]/)) {
        const v = t.replace(/\*+/g, "").trim();
        if (v && v.length < 80) secondaryKeywords.push(v);
      }
    }
  }

  // internal links -> other corpus slugs (dedup, exclude self)
  const links = new Set<string>();
  const re = /href="https:\/\/www\.kloudbean\.com\/blog\/([a-z0-9-]+)\/?"/gi;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(html))) links.add(mm[1]);
  links.delete(slug);

  const bodyText = stripTags(html);
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;

  return {
    slug,
    title,
    metaTitle: metaTitle.slice(0, 200),
    metaDescription: metaDescription ? metaDescription.slice(0, 320) : null,
    clusterId,
    pillar,
    targetKeyword,
    secondaryKeywords: secondaryKeywords.slice(0, 12),
    internalLinkTargets: [...links],
    wordCount,
    contentHtml: html,
    contentDraft,
    briefText,
    geo: detectGeo(`${title} ${slug} ${targetKeyword ?? ""}`),
  };
}

/** List content-studio slugs that have a rendered <slug>.html. */
export function listContentStudioSlugs(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) return [];
  return fs
    .readdirSync(rootDir)
    .filter((n) => !n.startsWith(".") && n !== "assets" && n !== "images")
    .filter((n) => {
      const p = path.join(rootDir, n);
      return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, `${n}.html`));
    });
}

export type IngestResult = { inserted: number; updated: number; skipped: number; total: number };

/**
 * Ingest content-studio into the articles table using the given PGlite client.
 * mode "upsert" updates existing rows too; "new-only" (boot) inserts only slugs
 * not already present (fast, safe for every app start).
 */
export async function ingestContentStudio(
  client: PGlite,
  opts: { root?: string; mode?: "upsert" | "new-only"; log?: (m: string) => void } = {},
): Promise<IngestResult> {
  const mode = opts.mode ?? "upsert";
  const log = opts.log ?? (() => {});
  const rootDir = opts.root ?? path.join(process.cwd(), "content-studio");
  const db = drizzle(client, { schema });

  const slugs = listContentStudioSlugs(rootDir);
  const result: IngestResult = { inserted: 0, updated: 0, skipped: 0, total: slugs.length };
  if (!slugs.length) return result;

  // Existing content-studio slugs (one query) so new-only can skip fast.
  const existingRows = await db
    .select({ id: articles.id, slug: articles.urlSlug })
    .from(articles);
  const existing = new Map<string, string>();
  for (const r of existingRows) if (r.slug) existing.set(r.slug, r.id);

  for (const slug of slugs) {
    const existingId = existing.get(slug);
    if (existingId && mode === "new-only") {
      result.skipped++;
      continue;
    }

    const a = parseArticleFolder(path.join(rootDir, slug), slug);
    if (!a) {
      result.skipped++;
      continue;
    }

    // Everything derived from the files on disk. Safe to refresh on every
    // ingest, because the files are the source of truth for all of it.
    const contentValues = {
      title: a.title,
      targetKeyword: a.targetKeyword,
      secondaryKeywords: a.secondaryKeywords,
      pillar: a.pillar,
      metaTitle: a.metaTitle,
      metaDescription: a.metaDescription,
      urlSlug: a.slug,
      brief: a.briefText ? { text: a.briefText, source: ENGINE_SOURCE } : null,
      geoTarget: a.geo,
      clusterId: a.clusterId || null,
      clusterName: a.clusterId ? (CLUSTER_NAME[a.clusterId] ?? null) : null,
      internalLinkTargets: a.internalLinkTargets,
      contentDraft: a.contentDraft,
      contentHtml: a.contentHtml,
      engineSource: ENGINE_SOURCE,
      wordCountTarget: a.wordCount || 2500,
    };

    // Workflow state belongs to the user, NOT to the files, so it is only ever
    // written when a row is first created. Including these in the update was
    // resetting status to "review" on every upsert, which silently un-published
    // everything the publish tracker had ticked off.
    const initialState = {
      status: "review",
      priority: "medium",
      entities: [],
    };

    if (existingId) {
      await db
        .update(articles)
        .set({ ...contentValues, updatedAt: new Date() })
        .where(eq(articles.id, existingId));
      result.updated++;
    } else {
      await db.insert(articles).values({ ...contentValues, ...initialState });
      result.inserted++;
    }
  }

  log(
    `content-studio ingest (${mode}): +${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped of ${result.total}`,
  );
  return result;
}
