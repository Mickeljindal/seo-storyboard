/** WordPress REST API helpers (Application Passwords auth). */

export type WpConfig = {
  site: string;
  user: string;
  pass: string;
};

export function getWpConfig(): { config: WpConfig | null; missing: string[] } {
  const site = process.env.WP_SITE_URL?.trim();
  const user = process.env.WP_USERNAME?.trim();
  const pass = normalizeAppPassword(process.env.WP_APP_PASSWORD);
  const missing: string[] = [];
  if (!site) missing.push("WP_SITE_URL");
  if (!user) missing.push("WP_USERNAME");
  if (!pass) missing.push("WP_APP_PASSWORD");
  if (missing.length) return { config: null, missing };
  return { config: { site: normalizeSiteUrl(site!), user: user!, pass }, missing: [] };
}

/** Application passwords are often copied with spaces — WordPress expects no spaces. */
export function normalizeAppPassword(raw: string | undefined): string {
  return (raw ?? "").replace(/\s+/g, "").trim();
}

export function normalizeSiteUrl(url: string): string {
  let u = url.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}

export function wpApiBase(site: string): string {
  return `${normalizeSiteUrl(site)}/wp-json/wp/v2`;
}

export function wpAuthHeader(user: string, pass: string): string {
  return "Basic " + Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal Markdown → HTML for AI content drafts. */
export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flushList();
      out.push(`<h3>${inlineMd(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      flushList();
      out.push(`<h2>${inlineMd(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      flushList();
      out.push(`<h1>${inlineMd(trimmed.slice(2))}</h1>`);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inlineMd(trimmed.slice(2))}</li>`);
    } else {
      flushList();
      out.push(`<p>${inlineMd(trimmed)}</p>`);
    }
  }
  flushList();
  return out.join("\n");
}

function inlineMd(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\[([^\]]+)\]\(internal:([^)]+)\)/g, '<a href="/$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  return s;
}

export function articleToHtml(article: {
  title: string;
  brief?: unknown;
  content_draft?: string | null;
  content_html?: string | null;
  meta_description?: string | null;
  cluster_name?: string | null;
}): string {
  // Prefer pre-rendered HTML from the content engine (includes tables + JSON-LD).
  if (article.content_html?.trim()) {
    return article.content_html.trim();
  }
  // Otherwise render the markdown draft now (rich renderer with tables + schema).
  if (article.content_draft?.trim()) {
    const { renderArticleHtml } = requireRender();
    return renderArticleHtml(
      article.content_draft.trim(),
      article.brief as Record<string, unknown> | null,
      {
        clusterName: article.cluster_name ?? null,
      },
    );
  }
  return briefToHtml(article.brief, article.meta_description);
}

// Lazy require to avoid a hard import cycle in some bundler setups.
function requireRender(): typeof import("./content-render") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./content-render");
}

export function briefToHtml(brief: unknown, fallbackExcerpt?: string | null): string {
  const b = (brief ?? {}) as Record<string, unknown>;
  const parts: string[] = [];

  if (typeof b.tldr === "string" && b.tldr) {
    parts.push(`<p><strong>TL;DR:</strong> ${escapeHtml(b.tldr)}</p>`);
  } else if (fallbackExcerpt) {
    parts.push(`<p><em>${escapeHtml(fallbackExcerpt)}</em></p>`);
  } else if (typeof b.meta_description === "string") {
    parts.push(`<p><em>${escapeHtml(b.meta_description)}</em></p>`);
  }

  if (Array.isArray(b.outline)) {
    for (const h2 of b.outline as {
      h2?: string;
      description?: string;
      h3?: { title?: string; description?: string }[];
    }[]) {
      if (h2.h2) parts.push(`<h2>${escapeHtml(h2.h2)}</h2>`);
      if (h2.description) parts.push(`<p>${escapeHtml(h2.description)}</p>`);
      if (Array.isArray(h2.h3)) {
        for (const h3 of h2.h3) {
          if (h3.title) parts.push(`<h3>${escapeHtml(h3.title)}</h3>`);
          if (h3.description) parts.push(`<p>${escapeHtml(h3.description)}</p>`);
        }
      }
    }
  }

  const faq = normalizeFaq(b.faq, b.paa_questions);
  if (faq.length) {
    parts.push("<h2>Frequently Asked Questions</h2>");
    for (const { q, a } of faq) {
      parts.push(`<h3>${escapeHtml(q)}</h3><p>${escapeHtml(a || "—")}</p>`);
    }
  }

  if (typeof b.cta === "string" && b.cta) {
    const url = typeof b.cta_url === "string" && b.cta_url ? b.cta_url : "https://kloudbean.com";
    parts.push(`<p><strong><a href="${escapeHtml(url)}">${escapeHtml(b.cta)}</a></strong></p>`);
  }

  if (parts.length === 0) {
    parts.push("<p><!-- Content generated by Kloudbean SEO Engine --></p>");
  }

  return parts.join("\n");
}

function normalizeFaq(faq: unknown, paa?: unknown): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  if (Array.isArray(faq)) {
    for (const item of faq) {
      if (typeof item === "string") out.push({ q: item, a: "" });
      else if (item && typeof item === "object") {
        const o = item as { q?: string; a?: string; question?: string; answer?: string };
        const q = o.q ?? o.question ?? "";
        const a = o.a ?? o.answer ?? "";
        if (q) out.push({ q, a });
      }
    }
  }
  if (out.length === 0 && Array.isArray(paa)) {
    for (const q of paa) {
      if (typeof q === "string") out.push({ q, a: "" });
    }
  }
  return out;
}

export type WpPostPayload = {
  title: string;
  slug?: string;
  status: "draft" | "publish" | "future" | "pending" | "private";
  content: string;
  excerpt: string;
  meta?: Record<string, string>;
  /** WordPress media ID to set as the post's featured image (optional). */
  featured_media?: number;
  /** WordPress category term IDs to file the post under (optional). */
  categories?: number[];
};

export function buildPostPayload(
  article: {
    title: string;
    url_slug?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    brief?: unknown;
    content_draft?: string | null;
    content_html?: string | null;
    cluster_name?: string | null;
  },
  status: "draft" | "publish",
): WpPostPayload {
  const b = (article.brief ?? {}) as Record<string, unknown>;
  const title = String(b.h1 ?? article.title);
  const slug = String(b.url_slug ?? article.url_slug ?? "").trim() || undefined;
  const excerpt = String(b.meta_description ?? article.meta_description ?? "").slice(0, 300);
  const metaTitle = String(b.meta_title ?? article.meta_title ?? title).slice(0, 60);
  const metaDesc = String(b.meta_description ?? article.meta_description ?? excerpt).slice(0, 160);

  return {
    title,
    slug,
    status,
    content: articleToHtml(article),
    excerpt,
    meta: {
      _yoast_wpseo_title: metaTitle,
      _yoast_wpseo_metadesc: metaDesc,
      // Rank Math (if installed)
      rank_math_title: metaTitle,
      rank_math_description: metaDesc,
    },
  };
}

export async function wpRequest<T = unknown>(
  config: WpConfig,
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  const url = `${wpApiBase(config.site)}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: wpAuthHeader(config.user, config.pass),
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    let data: T;
    try {
      data = text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
      data = { raw: text } as T;
    }
    if (!res.ok) {
      const errBody = data as { message?: string; code?: string };
      return {
        ok: false,
        status: res.status,
        data,
        error: errBody.message ?? errBody.code ?? text.slice(0, 200) ?? `HTTP ${res.status}`,
      };
    }
    return { ok: true, status: res.status, data };
  } catch (e: unknown) {
    return { ok: false, status: 0, data: {} as T, error: String((e as Error)?.message ?? e) };
  }
}

/** Create or update a post; retries without SEO meta if the site rejects custom fields. */
export async function createOrUpdateWpPost(
  config: WpConfig,
  payload: WpPostPayload,
  existingPostId?: number | null,
): Promise<{ id: number; link: string; status: string }> {
  const featured = payload.featured_media ? { featured_media: payload.featured_media } : {};
  const cats = payload.categories?.length ? { categories: payload.categories } : {};
  const bodyWithMeta = {
    title: payload.title,
    slug: payload.slug,
    status: payload.status,
    content: payload.content,
    excerpt: payload.excerpt,
    meta: payload.meta,
    ...featured,
    ...cats,
  };

  const attempt = async (includeMeta: boolean, targetId: number | null) => {
    const body = includeMeta
      ? bodyWithMeta
      : {
          title: payload.title,
          slug: payload.slug,
          status: payload.status,
          content: payload.content,
          excerpt: payload.excerpt,
          ...featured,
          ...cats,
        };
    if (targetId) {
      return wpRequest<{ id: number; link: string; status: string }>(config, `/posts/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    return wpRequest<{ id: number; link: string; status: string }>(config, "/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  let res = await attempt(true, existingPostId ?? null);
  // The stored post was deleted on WordPress (e.g. removed by hand): the update
  // 404s, so republish by creating a fresh post instead of failing.
  if (!res.ok && (res.status === 404 || res.status === 410) && existingPostId) {
    res = await attempt(true, null);
  }
  // Some sites reject custom SEO meta with a 400 — retry without it (same delete-fallback).
  if (!res.ok && res.status === 400 && payload.meta) {
    res = await attempt(false, existingPostId ?? null);
    if (!res.ok && (res.status === 404 || res.status === 410) && existingPostId) {
      res = await attempt(false, null);
    }
  }
  if (!res.ok) {
    throw new Error(
      res.error ??
        `WordPress API failed (${res.status}). Check WP_SITE_URL, application password, and that REST API is enabled.`,
    );
  }
  const post = res.data;
  if (!post?.id) throw new Error("WordPress returned no post ID");
  return { id: post.id, link: post.link, status: post.status };
}

export async function testWordPressConnection(config: WpConfig): Promise<{
  connected: boolean;
  site: string;
  user?: string;
  canPublish?: boolean;
  error?: string;
  hint?: string;
}> {
  const me = await wpRequest<{
    name?: string;
    slug?: string;
    capabilities?: Record<string, boolean>;
  }>(config, "/users/me?context=edit");
  if (!me.ok) {
    let hint = "Verify site URL, username, and application password (no spaces).";
    if (me.status === 401) hint = "Invalid username or application password.";
    if (me.status === 404) hint = "REST API not found — check permalink settings (not Plain).";
    return { connected: false, site: config.site, error: me.error, hint };
  }
  const canPublish = !!me.data.capabilities?.publish_posts;
  return {
    connected: true,
    site: config.site,
    user: me.data.name ?? config.user,
    canPublish,
    hint: canPublish ? undefined : "User can connect but may lack publish_posts capability.",
  };
}

/** Stable, URL-safe slug for a category name (so renames in WP don't create dupes). */
export function categorySlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "uncategorized"
  );
}

/**
 * Resolve a category NAME to a WordPress category ID: reuse an existing category
 * (matched by stable slug first, then by name), else create it. Returns null if
 * the category can't be resolved or created (e.g. the user lacks
 * manage_categories) so publishing can proceed without a category.
 */
export async function resolveCategoryId(config: WpConfig, name: string): Promise<number | null> {
  const clean = name.trim();
  if (!clean) return null;
  const slug = categorySlug(clean);

  const bySlug = await wpRequest<Array<{ id?: number }>>(
    config,
    `/categories?slug=${encodeURIComponent(slug)}`,
  );
  if (bySlug.ok && Array.isArray(bySlug.data) && bySlug.data[0]?.id) return bySlug.data[0].id!;

  const byName = await wpRequest<Array<{ id?: number; name?: string }>>(
    config,
    `/categories?search=${encodeURIComponent(clean)}&per_page=50`,
  );
  if (byName.ok && Array.isArray(byName.data)) {
    const hit = byName.data.find(
      (c) => c?.name?.trim().toLowerCase() === clean.toLowerCase() && c.id,
    );
    if (hit?.id) return hit.id;
  }

  const created = await wpRequest<{ id?: number }>(config, "/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: clean, slug }),
  });
  if (created.ok && created.data?.id) return created.data.id;
  return null;
}

export function getStoredWpPostId(performanceData: unknown): number | null {
  if (!performanceData || typeof performanceData !== "object") return null;
  const id = (performanceData as { wordpress_post_id?: number }).wordpress_post_id;
  return typeof id === "number" && id > 0 ? id : null;
}
