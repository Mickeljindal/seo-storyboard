import "@tanstack/react-start/server-only";
import fs from "node:fs";
import path from "node:path";
import {
  buildAllChannelAssets,
  CHANNEL_IDS,
  pointsFromSummary,
  type ArticleSource,
  type ChannelAsset,
} from "./distribution-channels";

/**
 * DISTRIBUTION PLAN — turn one published article into a full set of channel-ready
 * assets, and store them.
 *
 * Why this sits next to `distribution-engine.ts` rather than replacing it: that
 * module asks a model for three creative drafts, which is the right tool when you
 * want a fresh angle. This one is the workhorse. It assembles copy for every
 * channel from material that already passed the article's own review gates, so it
 * is free, instant, repeatable, and cannot introduce a claim the article did not
 * make. Run it on every publish; reach for the LLM version when you want variety.
 *
 * It reads `content-studio/<slug>/social.json` when present, because that copy was
 * generated from the article's front matter and short-version box and is already
 * humanised. 435 articles already have one.
 */

function contentStudioDir(): string {
  return path.join(process.cwd(), "content-studio");
}

/** Pull the short-version text out of an article's markdown, if it has one. */
function extractShortVersion(md: string): string {
  const bq = md.match(/^>\s*\*\*(?:The short version|Short version|Short answer)[:\s]*\*\*\s*([\s\S]*?)(?:\n\n|\n#|\n>)/im);
  if (bq?.[1]) return bq[1].replace(/\n>\s?/g, " ").replace(/\s+/g, " ").trim();
  const any = md.match(/^>\s*(.+(?:\n>.*)*)/m);
  if (any?.[1]) {
    return any[1]
      .replace(/^\*\*.*?\*\*\s*/, "")
      .replace(/\n>\s?/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return "";
}

/** Strip markdown noise so a sentence reads cleanly as social copy. */
function plain(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*`_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Assemble the source material for one article, preferring the files on disk
 * (what the site actually shipped) over the DB copy, same precedence the
 * publisher uses.
 */
export function buildArticleSource(input: {
  slug: string;
  title: string;
  url: string;
  metaDescription?: string | null;
  tldr?: string | null;
}): ArticleSource {
  const dir = path.join(contentStudioDir(), input.slug);
  const mdPath = path.join(dir, `${input.slug}.md`);
  const socialPath = path.join(dir, "social.json");

  let social: ArticleSource["social"] = null;
  let tags: string[] = [];
  try {
    if (fs.existsSync(socialPath)) {
      const raw = JSON.parse(fs.readFileSync(socialPath, "utf8")) as {
        x?: string;
        linkedin?: string;
        thread?: string[];
        tags?: string[];
      };
      social = { x: raw.x, linkedin: raw.linkedin, thread: raw.thread };
      tags = raw.tags ?? [];
    }
  } catch {
    /* a malformed social.json must not stop distribution */
  }

  let summary = (input.tldr ?? "").trim() || (input.metaDescription ?? "").trim();
  if (!summary && fs.existsSync(mdPath)) {
    try {
      summary = extractShortVersion(fs.readFileSync(mdPath, "utf8"));
    } catch {
      /* ignore */
    }
  }
  summary = plain(summary);

  const points = pointsFromSummary(summary).map(plain).filter(Boolean);

  return {
    slug: input.slug,
    title: input.title,
    url: input.url,
    summary,
    points,
    tags: tags.length ? tags : ["#Kloudbean"],
    social,
  };
}

export type PlanResult = {
  ok: boolean;
  slug: string;
  url: string;
  assets: ChannelAsset[];
  saved: number;
  error?: string;
};

/**
 * Build and persist every channel asset for an article.
 *
 * Each asset lands in `distributions` as its own row with status 'draft', which
 * is what the dashboard lists. Nothing is posted: that stays a human action, and
 * the guidance string travels with the draft so whoever posts it sees the rule
 * for that destination at the moment they need it.
 */
export async function planDistribution(
  articleId: string,
  opts: { channels?: string[]; url?: string } = {},
): Promise<PlanResult> {
  const articlesRepo = await import("@/server/db/repos/articles");
  const article = await articlesRepo.getArticleById(articleId);
  if (!article) {
    return { ok: false, slug: "", url: "", assets: [], saved: 0, error: "Article not found" };
  }

  const slug = article.url_slug ?? "";
  const url =
    opts.url ||
    article.published_url ||
    (slug ? `https://www.kloudbean.com/blog/${slug}/` : "https://www.kloudbean.com/");

  const brief = (article.brief ?? {}) as Record<string, unknown>;
  const source = buildArticleSource({
    slug,
    title: article.title,
    url,
    metaDescription: article.meta_description,
    tldr: typeof brief.tldr === "string" ? brief.tldr : null,
  });

  const requested = opts.channels?.length
    ? opts.channels.filter((c) => CHANNEL_IDS.includes(c))
    : CHANNEL_IDS;
  const assets = buildAllChannelAssets(source, requested);

  const repo = await import("@/server/db/repos/distributions");
  let saved = 0;
  for (const asset of assets) {
    try {
      await repo.upsertDistribution({
        // The registry is the source of truth for channel ids; the repo's union
        // mirrors it, so this narrowing is safe and keeps typos compile-time.
        articleId,
        channel: asset.channel as import("@/server/db/repos/distributions").DistributionChannel,
        content: {
          body: asset.body,
          subject: asset.subject,
          parts: asset.parts,
          hashtags: asset.hashtags,
          canonical_url: asset.canonicalUrl,
          guidance: asset.guidance,
          built_by: "distribution-plan",
          built_at: new Date().toISOString(),
        },
      });
      saved++;
    } catch (e) {
      console.warn(`[distribution] could not save ${asset.channel}:`, (e as Error)?.message);
    }
  }

  return { ok: true, slug, url, assets, saved };
}

/**
 * Create the email broadcast record for an article.
 *
 * Draft only, dry-run by default. Sending is a separate, explicit action, since
 * an email is the one channel you cannot delete after the fact.
 */
export async function planEmailBroadcast(
  articleId: string,
  opts: { audience?: string; url?: string } = {},
): Promise<{ ok: boolean; broadcastId?: string; subject?: string; error?: string }> {
  const articlesRepo = await import("@/server/db/repos/articles");
  const article = await articlesRepo.getArticleById(articleId);
  if (!article) return { ok: false, error: "Article not found" };

  const slug = article.url_slug ?? "";
  const url =
    opts.url ||
    article.published_url ||
    (slug ? `https://www.kloudbean.com/blog/${slug}/` : "https://www.kloudbean.com/");
  const brief = (article.brief ?? {}) as Record<string, unknown>;
  const source = buildArticleSource({
    slug,
    title: article.title,
    url,
    metaDescription: article.meta_description,
    tldr: typeof brief.tldr === "string" ? brief.tldr : null,
  });

  const { renderArticleEmail } = await import("./email-templates");
  const rendered = renderArticleEmail(source);

  const repo = await import("@/server/db/repos/broadcasts");
  const row = await repo.insertBroadcast({
    articleId,
    subject: rendered.subject,
    preview: rendered.preview,
    htmlBody: rendered.html,
    textBody: rendered.text,
    audience: opts.audience ?? "newsletter",
  });
  return { ok: true, broadcastId: row.id, subject: row.subject };
}
