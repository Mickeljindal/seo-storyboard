import "@tanstack/react-start/server-only";
import fs from "node:fs";
import path from "node:path";
import {
  buildPostPayload,
  createOrUpdateWpPost,
  getStoredWpPostId,
  getWpConfig,
  resolveCategoryId,
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
  let body = art ? art[1] : (fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? fullHtml);

  body = body
    // Strip scripts EXCEPT interactive widgets explicitly marked data-kb-widget,
    // so a calculator/quiz survives to WordPress while JSON-LD/analytics do not.
    .replace(/<script(?![^>]*\bdata-kb-widget\b)[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<!--\s*ADD IMAGE[\s\S]*?-->/gi, "") // author hint comments
    .replace(/<figure class="img-slot"[\s\S]*?<\/figure>/gi, "") // empty author slots (no real img)
    .replace(/<span class="eyebrow"[^>]*>[\s\S]*?<\/span>/i, "")
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, ""); // WP renders the title from the title field

  return body.trim();
}

/* ------------------------------------------------------------------ *
 * HTML -> Gutenberg blocks
 *
 * WordPress stores raw HTML as a single "Classic/HTML" lump in the block
 * editor. To make a published post open as NORMAL, editable blocks, we wrap
 * each top-level element in its Gutenberg block delimiter. Text, headings,
 * lists, tables, images and code become native blocks; anything without a
 * native equivalent (the inline SVG diagrams, the styled .tldr/.note/.cta
 * callouts) goes in as an HTML block so it still renders but stays contained.
 * ------------------------------------------------------------------ */

const VOID_TAGS = new Set([
  "img",
  "br",
  "hr",
  "input",
  "meta",
  "link",
  "source",
  "area",
  "base",
  "col",
  "embed",
  "param",
  "track",
  "wbr",
]);

/** Split a run of HTML into its top-level nodes (elements + loose text runs). */
function splitTopLevel(html: string): string[] {
  const out: string[] = [];
  let i = 0;
  const n = html.length;
  while (i < n) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      const text = html.slice(i).trim();
      if (text) out.push(text);
      break;
    }
    if (lt > i) {
      const text = html.slice(i, lt).trim();
      if (text) out.push(text);
    }
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt);
      i = end === -1 ? n : end + 3;
      continue;
    }
    const openMatch = /^<([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/.exec(html.slice(lt));
    if (!openMatch) {
      const gt = html.indexOf(">", lt);
      i = gt === -1 ? n : gt + 1;
      continue;
    }
    const tag = openMatch[1].toLowerCase();
    const openEnd = lt + openMatch[0].length;
    if (openMatch[2] === "/" || VOID_TAGS.has(tag)) {
      out.push(html.slice(lt, openEnd));
      i = openEnd;
      continue;
    }
    const elEnd = findMatchingClose(html, tag, openEnd);
    out.push(html.slice(lt, elEnd));
    i = elEnd;
  }
  return out;
}

/** Find the index just past the matching close tag for `tag`, starting at `from`. */
function findMatchingClose(html: string, tag: string, from: number): number {
  const re = new RegExp(`<${tag}\\b[^>]*?(\\/?)>|</${tag}\\s*>`, "gi");
  re.lastIndex = from;
  let depth = 1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const isClose = m[0].startsWith("</");
    if (isClose) {
      depth--;
      if (depth === 0) return re.lastIndex;
    } else if (m[1] !== "/") {
      depth++;
    }
  }
  return html.length;
}

/** Strip the outer tag of a single element, returning its inner HTML. */
function innerOf(el: string, tag: string): string {
  return el
    .replace(new RegExp(`^<${tag}\\b[^>]*>`, "i"), "")
    .replace(new RegExp(`</${tag}\\s*>$`, "i"), "")
    .trim();
}

function classOf(openTag: string): string {
  return openTag.match(/\bclass="([^"]*)"/i)?.[1] ?? "";
}

function paragraphBlock(inner: string): string {
  const t = inner.trim();
  return t ? `<!-- wp:paragraph -->\n<p>${t}</p>\n<!-- /wp:paragraph -->` : "";
}

function listBlock(inner: string, ordered: boolean): string {
  const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1].trim());
  if (!items.length)
    return `<!-- wp:html -->\n<${ordered ? "ol" : "ul"}>${inner}</${ordered ? "ol" : "ul"}>\n<!-- /wp:html -->`;
  const lis = items
    .map((it) => `<!-- wp:list-item -->\n<li>${it}</li>\n<!-- /wp:list-item -->`)
    .join("\n");
  const tag = ordered ? "ol" : "ul";
  const attr = ordered ? ' {"ordered":true}' : "";
  return `<!-- wp:list${attr} -->\n<${tag}>\n${lis}\n</${tag}>\n<!-- /wp:list -->`;
}

function tableBlock(inner: string): string {
  return `<!-- wp:table -->\n<figure class="wp-block-table"><table>${inner}</table></figure>\n<!-- /wp:table -->`;
}

function figureBlock(el: string, inner: string): string {
  if (/<img\b/i.test(inner)) {
    const img = inner.match(/<img\b[^>]*>/i)?.[0] ?? "";
    const cap = inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1]?.trim();
    const capHtml = cap ? `<figcaption class="wp-element-caption">${cap}</figcaption>` : "";
    return `<!-- wp:image {"sizeSlug":"large"} -->\n<figure class="wp-block-image size-large">${img}${capHtml}</figure>\n<!-- /wp:image -->`;
  }
  // SVG diagram or anything else visual -> keep verbatim in an HTML block.
  return `<!-- wp:html -->\n${el}\n<!-- /wp:html -->`;
}

function htmlBlock(el: string): string {
  return `<!-- wp:html -->\n${el}\n<!-- /wp:html -->`;
}

/** Convert one top-level element (or text run) to its Gutenberg block. */
function elementToBlock(el: string): string {
  const openMatch = /^<([a-zA-Z][\w-]*)\b([^>]*)>/.exec(el);
  if (!openMatch) return paragraphBlock(el); // loose text
  const tag = openMatch[1].toLowerCase();
  const inner = innerOf(el, tag);
  switch (tag) {
    case "p":
      return paragraphBlock(inner);
    case "h1":
    case "h2":
      return `<!-- wp:heading -->\n<h2>${inner}</h2>\n<!-- /wp:heading -->`;
    case "h3":
      return `<!-- wp:heading {"level":3} -->\n<h3>${inner}</h3>\n<!-- /wp:heading -->`;
    case "h4":
      return `<!-- wp:heading {"level":4} -->\n<h4>${inner}</h4>\n<!-- /wp:heading -->`;
    case "ul":
      return listBlock(inner, false);
    case "ol":
      return listBlock(inner, true);
    case "table":
      return tableBlock(inner);
    case "pre":
      return `<!-- wp:code -->\n<pre class="wp-block-code">${inner}</pre>\n<!-- /wp:code -->`;
    case "blockquote":
      return `<!-- wp:quote -->\n<blockquote class="wp-block-quote">${inner}</blockquote>\n<!-- /wp:quote -->`;
    case "figure":
      return figureBlock(el, inner);
    case "div": {
      // Flatten known text containers (the FAQ) into native blocks; keep the
      // small styled callouts (tldr/note/cta) as a single editable HTML block.
      const cls = classOf(openMatch[0]);
      if (/\bfaq\b/.test(cls)) return htmlToGutenbergBlocks(inner);
      return htmlBlock(el);
    }
    default:
      return htmlBlock(el);
  }
}

/** Turn a body of article HTML into Gutenberg block markup (editable in the WP post editor). */
export function htmlToGutenbergBlocks(bodyHtml: string): string {
  return splitTopLevel(bodyHtml).map(elementToBlock).filter(Boolean).join("\n\n");
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
  category?: string;
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

  const slug = article.url_slug ?? "";
  // Prefer the CURRENT file on disk (exactly what the "Read" view shows) over the
  // engine DB copy, so publish/republish always ships your latest edits even when
  // the DB has not been re-synced. Fall back to the stored HTML if the file is gone.
  const diskFile = slug ? path.join(contentStudioDir(), slug, `${slug}.html`) : "";
  const diskHtml = diskFile && fs.existsSync(diskFile) ? fs.readFileSync(diskFile, "utf8") : "";
  const fullHtml = diskHtml.trim() ? diskHtml : (article.content_html ?? "");
  if (!fullHtml.trim()) return { ok: false, error: "This article has no HTML to publish." };

  // Title + meta come from the same current file (DB fields can be stale).
  const fileTitle = fullHtml
    .match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?.replace(/<[^>]+>/g, "")
    .trim();
  const fileMetaTitle = fullHtml.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const fileDesc = fullHtml.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]?.trim();

  let body = extractArticleBody(fullHtml);

  // Upload + rewrite images.
  const srcs = new Set<string>();
  const imgRe = /<img\b[^>]*\bsrc="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(body))) srcs.add(m[1]);

  let imagesUploaded = 0;
  let featuredId: number | null = null;
  // Upload images in parallel (the slow part of publishing). The srcs within one
  // article are distinct, so there is no duplicate-upload race here; shared console
  // screenshots are still de-duped across articles by the module-level uploadCache.
  const uploads = await Promise.all(
    [...srcs].map(async (src) => {
      const abs = resolveLocalImage(slug, src);
      if (!abs) return null;
      const up = await uploadImageToWp(config, abs);
      if (!up) return null;
      return { src, url: up.url, id: up.id, hero: /hero\.(png|jpe?g|webp)$/i.test(path.basename(abs)) };
    }),
  );
  for (const u of uploads) {
    if (!u) continue;
    body = body.split(`src="${u.src}"`).join(`src="${u.url}"`);
    imagesUploaded++;
    if (featuredId == null && u.hero) featuredId = u.id;
  }

  // Convert the article's own body into native Gutenberg blocks so the post
  // opens as normal, editable blocks in the WordPress editor instead of one raw
  // HTML lump. Still published AS WRITTEN: no TOC, no injected links, no
  // generated hero. Text, headings, lists, tables, images and code become real
  // blocks; the SVG diagrams and styled callouts stay as editable HTML blocks.
  const blocks = htmlToGutenbergBlocks(body);
  const payload = buildPostPayload(
    {
      title: fileTitle || article.title,
      url_slug: slug,
      meta_title: fileMetaTitle || article.meta_title,
      meta_description: fileDesc || article.meta_description,
      // Ignore the (possibly stale) stored brief so the current file always wins.
      brief: null,
      content_html: blocks,
      cluster_name: article.cluster_name,
    },
    status,
  );
  if (featuredId != null) payload.featured_media = featuredId;

  // File the post under the category the article already has (its cluster).
  // Reuses a matching WordPress category, creating it only if it doesn't exist.
  let categoryName: string | undefined;
  const clusterName = (article.cluster_name ?? "").trim();
  if (clusterName) {
    try {
      const catId = await resolveCategoryId(config, clusterName);
      if (catId != null) {
        payload.categories = [catId];
        categoryName = clusterName;
      }
    } catch {
      // non-fatal: publish without a category rather than failing the post
    }
  }

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
    approval_status: status === "publish" ? "published" : (article.approval_status ?? "none"),
    performance_data: {
      ...perf,
      wordpress_post_id: post.id,
      wordpress_last_sync: new Date().toISOString(),
    },
  });

  return {
    ok: true,
    link: post.link,
    postId: post.id,
    images: imagesUploaded,
    updated: !!existingPostId,
    category: categoryName,
  };
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
  if (!html.trim())
    return "<!doctype html><meta charset='utf-8'><p style='font-family:sans-serif;padding:2rem'>Article file not found.</p>";

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
