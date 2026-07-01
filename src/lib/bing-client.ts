import "@tanstack/react-start/server-only";
import { loadProjectEnv } from "./load-env";

/**
 * BING WEBMASTER TOOLS CLIENT.
 *
 * ChatGPT Search and Microsoft Copilot are backed by Bing's index — so Bing
 * rankings and impressions are a very direct proxy for AI-answer visibility.
 * This client hits the public Bing Webmaster JSON endpoints:
 *   https://ssl.bing.com/webmaster/api.svc/json/<Method>?apikey=...&siteUrl=...
 *
 * Two credentials required (both managed in the dashboard, not .env):
 *   BING_API_KEY   — from Bing Webmaster → Settings → API Access → API Key
 *   BING_SITE_URL  — exact site URL as verified in Bing Webmaster
 *                    (e.g. "https://www.kloudbean.com/")
 */

const BASE = "https://ssl.bing.com/webmaster/api.svc/json";

export type BingConfig = { apiKey: string; siteUrl: string };

export function getBingConfig(): BingConfig | null {
  loadProjectEnv();
  const apiKey = process.env.BING_API_KEY?.trim();
  const siteUrl = process.env.BING_SITE_URL?.trim();
  if (!apiKey || !siteUrl) return null;
  return { apiKey, siteUrl };
}

export function hasBingCredentials(): boolean {
  return getBingConfig() !== null;
}

async function bingGet<T>(method: string, params: Record<string, string> = {}): Promise<T> {
  const cfg = getBingConfig();
  if (!cfg) {
    throw new Error("Bing Webmaster not configured. Add BING_API_KEY + BING_SITE_URL in Settings.");
  }
  const q = new URLSearchParams({ apikey: cfg.apiKey, siteUrl: cfg.siteUrl, ...params });
  const url = `${BASE}/${method}?${q.toString()}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 200);
    try {
      detail = (JSON.parse(text) as { Message?: string }).Message ?? detail;
    } catch {
      /* keep raw */
    }
    throw new Error(`Bing HTTP ${res.status}: ${detail}`);
  }
  return JSON.parse(text) as T;
}

export type BingQueryStat = {
  Query: string;
  Impressions: number;
  Clicks: number;
  AvgImpressionPosition: number;
  AvgClickPosition: number;
};

export type BingPageStat = {
  Page: string;
  Impressions: number;
  Clicks: number;
  AvgImpressionPosition: number;
  AvgClickPosition: number;
};

/** Top queries the site appears for on Bing (last ~6 months). */
export async function getBingQueryStats(): Promise<BingQueryStat[]> {
  const r = await bingGet<{ d: BingQueryStat[] }>("GetQueryStats");
  return Array.isArray(r?.d) ? r.d : [];
}

/** Top pages by impressions/clicks on Bing. */
export async function getBingPageStats(): Promise<BingPageStat[]> {
  const r = await bingGet<{ d: BingPageStat[] }>("GetPageStats");
  return Array.isArray(r?.d) ? r.d : [];
}

/** Queries a given page ranks for on Bing (per-URL striking-distance mining). */
export async function getBingPageQueryStats(page: string): Promise<BingQueryStat[]> {
  const r = await bingGet<{ d: BingQueryStat[] }>("GetPageQueryStats", { page });
  return Array.isArray(r?.d) ? r.d : [];
}

/** Live connectivity test — used by the Settings card. */
export async function testBingConnection(): Promise<{ ok: boolean; message: string }> {
  if (!hasBingCredentials()) {
    return {
      ok: false,
      message: "Add your Bing Webmaster API key and site URL, then Save & connect.",
    };
  }
  try {
    const rows = await getBingQueryStats();
    return {
      ok: true,
      message: `Bing Webmaster connected · ${rows.length} tracked queries in the last window`,
    };
  } catch (e) {
    return { ok: false, message: String((e as Error)?.message ?? e) };
  }
}
