import "@tanstack/react-start/server-only";
import { loadProjectEnv } from "./load-env";

/**
 * CLIENT for the Kloudbean SEO Engine WordPress plugin.
 *
 * Talks to /wp-json/kbseo/v1/* on the WP site. Handles publishing with full
 * on-page SEO (AIOSEO meta, featured image, categories, TOC, internal link
 * backfill, sitemap ping) in ONE call.
 *
 * Falls back to the basic WP REST API if the plugin isn't installed.
 */

export type PluginPublishPayload = {
  title: string;
  content: string;
  slug?: string;
  status: "draft" | "publish" | "future";
  publish_date?: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  secondary_keywords?: string[];
  canonical_url?: string;
  featured_image_url?: string;
  og_image_url?: string;
  category?: string;
  tags?: string[];
  schema_jsonld?: unknown;
  toc?: boolean;
  reading_time?: number;
  excerpt?: string;
  existing_post_id?: number | null;
};

export type PluginPublishResult = {
  ok: boolean;
  post_id?: number;
  link?: string;
  status?: string;
  created?: boolean;
  error?: string;
};

function getPluginConfig(): { url: string; key: string } | null {
  loadProjectEnv();
  const base = process.env.WP_PLUGIN_URL?.trim() || process.env.WP_SITE_URL?.trim();
  const key = process.env.WP_PLUGIN_API_KEY?.trim();
  if (!base || !key) return null;
  // Normalize: if base doesn't include /wp-json/kbseo/v1, add it
  const url = base.includes("kbseo/v1")
    ? base.replace(/\/$/, "")
    : `${base.replace(/\/$/, "")}/wp-json/kbseo/v1`;
  return { url, key };
}

export function hasPluginConfigured(): boolean {
  return !!getPluginConfig();
}

/** Check if the plugin is reachable and active. */
export async function pingPlugin(): Promise<{ ok: boolean; aioseo?: boolean; error?: string }> {
  const cfg = getPluginConfig();
  if (!cfg) return { ok: false, error: "WP_PLUGIN_URL and WP_PLUGIN_API_KEY not set in .env" };
  try {
    const res = await fetch(`${cfg.url}/health`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const json = (await res.json()) as { ok?: boolean; aioseo?: boolean };
    return { ok: !!json.ok, aioseo: json.aioseo };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

/** Publish/update a post via the plugin endpoint (full on-page SEO in one call). */
export async function publishViaPlugin(payload: PluginPublishPayload): Promise<PluginPublishResult> {
  const cfg = getPluginConfig();
  if (!cfg) return { ok: false, error: "Plugin not configured" };

  try {
    const res = await fetch(`${cfg.url}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KB-API-Key": cfg.key,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    });
    const text = await res.text();
    if (!res.ok) {
      let detail = text.slice(0, 300);
      try { detail = (JSON.parse(text) as { message?: string }).message ?? detail; } catch {}
      return { ok: false, error: `Plugin HTTP ${res.status}: ${detail}` };
    }
    const json = JSON.parse(text) as PluginPublishResult;
    return { ok: true, ...json };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

/** Trigger an on-page SEO audit via the plugin. */
export async function auditPost(postId: number): Promise<Record<string, unknown> | null> {
  const cfg = getPluginConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/audit/${postId}`, {
      headers: { "X-KB-API-Key": cfg.key },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Trigger internal link injection via the plugin. */
export async function injectLinks(links: { target_post_id: number; anchor: string; inject_into_post_ids: number[] }[]): Promise<boolean> {
  const cfg = getPluginConfig();
  if (!cfg || !links.length) return false;
  try {
    const res = await fetch(`${cfg.url}/inject-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-KB-API-Key": cfg.key },
      body: JSON.stringify({ links }),
      signal: AbortSignal.timeout(30_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
