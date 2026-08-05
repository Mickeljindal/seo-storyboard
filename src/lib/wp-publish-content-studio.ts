import "@tanstack/react-start/server-only";
import fs from "node:fs";
import path from "node:path";
import {
  buildPostPayload,
  createOrUpdateWpPost,
  getStoredWpPostId,
  getWpConfig,
  wpApiBase,
  wpAuthHeader,
  wpRequest,
  type WpConfig,
} from "./wordpress-client";

/**
 * Publish a content-studio article (whose content_html is a FULL standalone HTML
 * page with relative image paths) to WordPress, properly:
 *   1. extract just the <article> body (drop <head>, <style>, JSON-LD, author-only
 *      image slots, and the duplicate <h1> since WP uses the title field)
 *   2. upload every local image (images/hero.png, ../assets/console/*.png) to the
 *      WP media library, reusing existing uploads by name so we don't duplicate
 *   3. rewrite the <img src> to the uploaded WordPress URLs
 *   4. set the hero image as the post's featured image
 *   5. create/update the post
 *
 * This is what makes the images "just work" on WordPress instead of 404ing.
 */

function contentStudioDir(): string {
  return path.join(process.cwd(), "content-studio");
}

/** Extract the publish-ready body HTML from a full content-studio HTML document. */
export function extractArticleBody(fullHtml: string): string {
  const art = fullHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  let body = art
    ? art[1]
    : (fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? fullHtml);

  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, "") // JSON-LD etc. (WP meta handles schema)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<!--\s*ADD IMAGE[\s\S]*?-->/gi, "") // author hint comments
    .replace(/<figure class="img-slot"[\s\S]*?<\/figure>/gi, "") // empty author slots (no real img)
    .replace(/<span class="eyebrow"[^>]*>[\s\S]*?<\/span>/i, "")
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, ""); // WP renders the title from the title field

  return body.trim();
}

/** Pull the JSON-LD (@graph with Article + FAQPage) out of the full HTML for the plugin. */
export function extractJsonLd(fullHtml: string): unknown | null {
  const m = fullHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1].trim());
  } catch {
    return null;
  }
}

/** Map a relative image src in an article to its absolute file path on disk. */
export function resolveLocalImage(slug: string, src: string): string | null {
  if (!src || /^https?:\/\//i.test(src) || src.startsWith("data:")) return null;
  const root = contentStudioDir();
  const abs = path.normalize(path.join(root, slug, src));
  if (!abs.startsWith(root)) return null; // stay inside content-studio
  return fs.existsSync(abs) ? abs : null;
}

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

// Reuse uploads within a running server process so shared console screenshots
// (used by many articles) are only uploaded once.
const uploadCache = new Map<string, { id: number; url: string }>();

type WpMedia = { id?: number; source_url?: string; slug?: string };

async function uploadImageToWp(
  config: WpConfig,
  absPath: string,
): Promise<{ id: number; url: string } | null> {
  const cached = uploadCache.get(absPath);
  if (cached) return cached;

  const filename = path.basename(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const type = MIME[ext];
  if (!type) return null;

  // Reuse an existing media item with the same name if present (avoids dupes).
  const nameSlug = filename.replace(/\.[^.]+$/, "").toLowerCase();
  const found = await wpRequest<WpMedia[]>(
    config,
    `/media?search=${encodeURIComponent(nameSlug)}&per_page=10`,
  );
  if (found.ok && Array.isArray(found.data)) {
    const hit = found.data.find((m) => m?.slug === nameSlug && m?.id && m?.source_url);
    if (hit?.id && hit.source_url) {
      const v = { id: hit.id, url: hit.source_url };
      uploadCache.set(absPath, v);
      return v;
    }
  }

  const bytes = fs.readFileSync(absPath);
  const res = await fetch(`${wpApiBase(config.site)}/media`, {
    method: "POST",
    headers: {
      Authorization: wpAuthHeader(config.user, config.pass),
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
    body: new Uint8Array(bytes),
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as WpMedia | null;
  if (!data?.id || !data.source_url) return null;
  const v = { id: data.id, url: data.source_url };
  uploadCache.set(absPath, v);
  return v;
}

export type PublishResult = {
  ok: boolean;
  link?: string;
  postId?: number;
  images?: number;
  updated?: boolean;
  error?: string;
};

export async function publishContentStudioArticle(
  articleId: string,
  status: "draft" | "publish",
): Promise<PublishResult> {
  const { config, missing } = getWpConfig();
  if (!config) {
    return { ok: false, error: `WordPress not connected. Add to .env: ${missing.join(", ")}.` };
  }

  const articlesRepo = await import("@/server/db/repos/articles");
  const article = await articlesRepo.getArticleById(articleId);
  if (!article) return { ok: false, error: "Article not found" };

  const fullHtml = article.content_html ?? "";
  if (!fullHtml.trim()) return { ok: false, error: "This article has no stored HTML to publish." };
  const slug = article.url_slug ?? "";

  let body = extractArticleBody(fullHtml);

  // Upload + rewrite images.
  const srcs = new Set<string>();
  const imgRe = /<img\b[^>]*\bsrc="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(body))) srcs.add(m[1]);

  let imagesUploaded = 0;
  let featuredId: number | null = null;
  for (const src of srcs) {
    const abs = resolveLocalImage(slug, src);
    if (!abs) continue;
    const up = await uploadImageToWp(config, abs);
    if (!up) continue;
    body = body.split(`src="${src}"`).join(`src="${up.url}"`);
    imagesUploaded++;
    if (featuredId == null && /hero\.(png|jpe?g|webp)$/i.test(path.basename(abs))) {
      featuredId = up.id;
    }
  }

  // Publish the article EXACTLY as written — no TOC, no injected links, no
  // generated hero, no rewriting. Just the article's own body + its own images,
  // with the hand-made hero as the featured image. (The plugin's job is to ADD
  // those things; the local blogs are final, so we don't run it here.)
  const payload = buildPostPayload({ ...article, content_html: body }, status);
  if (featuredId != null) payload.featured_media = featuredId;

  const existingPostId = getStoredWpPostId(article.performance_data);
  let post: { id: number; link: string; status: string };
  try {
    post = await createOrUpdateWpPost(config, payload, existingPostId);
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e), images: imagesUploaded };
  }

  const perf = (article.performance_data as Record<string, unknown> | null) ?? {};
  await articlesRepo.updateArticle(articleId, {
    published_url: post.link,
    status: status === "publish" ? "published" : article.status,
    published_at: status === "publish" ? new Date() : (article.published_at ?? null),
    approval_status: status === "publish" ? "published" : article.approval_status ?? "none",
    performance_data: {
      ...perf,
      wordpress_post_id: post.id,
      wordpress_last_sync: new Date().toISOString(),
    },
  });

  return { ok: true, link: post.link, postId: post.id, images: imagesUploaded, updated: !!existingPostId };
}

/**
 * Build a fully self-contained HTML version of an article for reading INSIDE
 * the engine (iframe srcDoc): the article's own file, with its stylesheet and
 * images inlined so it renders exactly as written, with no file serving and no
 * changes to the article itself.
 */
export function buildReaderHtml(slug: string, fallbackHtml?: string | null): string {
  const dir = path.join(contentStudioDir(), slug);
  const file = path.join(dir, `${slug}.html`);
  let html = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : (fallbackHtml ?? "");
  if (!html.trim()) return "<!doctype html><meta charset='utf-8'><p style='font-family:sans-serif;padding:2rem'>Article file not found.</p>";

  // Inline the shared stylesheet so the reader looks exactly like the blog.
  const cssPath = path.join(contentStudioDir(), "assets", "article.css");
  const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";
  html = html.replace(
    /<link[^>]*href="\.\.\/assets\/article\.css"[^>]*>/i,
    css ? `<style>${css}</style>` : "",
  );

  // Inline every local image as a data URI (no file serving needed).
  html = html.replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/gi, (whole, pre, src, post) => {
    const abs = resolveLocalImage(slug, src);
    if (!abs) return whole;
    const type = MIME[path.extname(abs).toLowerCase()];
    if (!type) return whole;
    try {
      const b64 = fs.readFileSync(abs).toString("base64");
      return `${pre}data:${type};base64,${b64}${post}`;
    } catch {
      return whole;
    }
  });

  return html;
}
