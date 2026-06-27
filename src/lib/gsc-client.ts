import "@tanstack/react-start/server-only";
import crypto from "node:crypto";
import { loadProjectEnv } from "./load-env";

/**
 * GOOGLE SEARCH CONSOLE CLIENT — our own analytics (free, first-party data).
 *
 * This is the "single source of truth" for what actually ranks and gets clicked.
 * It replaces any need for a paid third-party (e.g. ClickRank) ranking layer:
 * the Search Analytics API is free, and the data feeds our self-learning ranker
 * directly so discovery prioritises clusters/intents/formats that win in reality.
 *
 * AUTH: service account (no OAuth dance, no user interaction). Steps:
 *   1. Google Cloud → create a service account → create a JSON key.
 *   2. In Search Console → Settings → Users and permissions → add the service
 *      account email as a (restricted) user on the kloudbean.com property.
 *   3. Put these in .env:
 *        GSC_CLIENT_EMAIL   = the service account email
 *        GSC_PRIVATE_KEY    = the private_key from the JSON (keep the \n escapes)
 *        GSC_SITE_URL       = https://www.kloudbean.com/   (or sc-domain:kloudbean.com)
 *
 * Scope: webmasters.readonly. We never write — read-only by design.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export type GscRow = {
  page: string;
  query?: string;
  clicks: number;
  impressions: number;
  ctr: number; // 0..1
  position: number; // avg position (1 = top)
};

export type GscConfig = { clientEmail: string; privateKey: string; siteUrl: string };

export function getGscConfig(): GscConfig | null {
  loadProjectEnv();
  const clientEmail = process.env.GSC_CLIENT_EMAIL?.trim();
  // .env stores the key with literal \n — normalise back to real newlines.
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const siteUrl = process.env.GSC_SITE_URL?.trim();
  if (!clientEmail || !privateKey || !siteUrl) return null;
  return { clientEmail, privateKey, siteUrl };
}

export function hasGscCredentials(): boolean {
  return getGscConfig() !== null;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** Build + sign a JWT and exchange it for a short-lived access token. */
async function getAccessToken(cfg: GscConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: cfg.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  let signature: string;
  try {
    signature = base64url(signer.sign(cfg.privateKey));
  } catch (e) {
    throw new Error(
      `GSC private key is invalid (${String((e as Error)?.message ?? e)}). ` +
        "Ensure GSC_PRIVATE_KEY is the full private_key from the JSON, with \\n escapes preserved.",
    );
  }
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 300);
    try {
      detail = (JSON.parse(text) as { error_description?: string }).error_description ?? detail;
    } catch {
      /* raw */
    }
    throw new Error(`GSC auth failed (${res.status}): ${detail}`);
  }
  const token = (JSON.parse(text) as { access_token?: string }).access_token;
  if (!token) throw new Error("GSC auth returned no access_token.");
  return token;
}

/** YYYY-MM-DD, N days before today (UTC). */
export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
}

/**
 * Query the Search Analytics API. Returns per-page rows for the window.
 * dimensions defaults to ["page"]; pass ["page","query"] for query-level detail.
 */
export async function querySearchAnalytics(opts: {
  startDate: string;
  endDate: string;
  dimensions?: ("page" | "query" | "date")[];
  rowLimit?: number;
}): Promise<GscRow[]> {
  const cfg = getGscConfig();
  if (!cfg) {
    throw new Error(
      "Google Search Console not configured. Add GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_SITE_URL in .env.",
    );
  }
  const token = await getAccessToken(cfg);
  const dimensions = opts.dimensions ?? ["page"];
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    cfg.siteUrl,
  )}/searchAnalytics/query`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      startDate: opts.startDate,
      endDate: opts.endDate,
      dimensions,
      rowLimit: opts.rowLimit ?? 1000,
      dataState: "all",
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 300);
    try {
      detail = (JSON.parse(text) as { error?: { message?: string } }).error?.message ?? detail;
    } catch {
      /* raw */
    }
    throw new Error(`GSC query failed (${res.status}): ${detail}`);
  }

  const data = JSON.parse(text) as {
    rows?: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }[];
  };
  const pageIdx = dimensions.indexOf("page");
  const queryIdx = dimensions.indexOf("query");

  return (data.rows ?? []).map((r) => ({
    page: pageIdx >= 0 ? r.keys?.[pageIdx] ?? "" : "",
    query: queryIdx >= 0 ? r.keys?.[queryIdx] : undefined,
    clicks: Math.round(r.clicks ?? 0),
    impressions: Math.round(r.impressions ?? 0),
    ctr: r.ctr ?? 0,
    position: Number((r.position ?? 0).toFixed(2)),
  }));
}

/** Quick connectivity test for Settings/health. */
export async function testGscConnection(): Promise<{ ok: boolean; message: string }> {
  if (!hasGscCredentials()) {
    return {
      ok: false,
      message: "Set GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_SITE_URL in .env (Google Search Console service account).",
    };
  }
  try {
    const rows = await querySearchAnalytics({
      startDate: isoDaysAgo(28),
      endDate: isoDaysAgo(1),
      dimensions: ["page"],
      rowLimit: 5,
    });
    return { ok: true, message: `Search Console connected · ${rows.length} pages with data (last 28 days)` };
  } catch (e) {
    return { ok: false, message: String((e as Error)?.message ?? e) };
  }
}
