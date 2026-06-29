import "@tanstack/react-start/server-only";
import crypto from "node:crypto";
import { loadProjectEnv } from "./load-env";

/**
 * INSTANT INDEXING CLIENT (B1) — push new/updated URLs to search engines the
 * moment we publish, instead of waiting for a crawl.
 *
 * Two channels:
 *   1. IndexNow (Bing, Yandex, Seznam, Naver) — keyless protocol; we host a key
 *      file on the WordPress site (served by the plugin at /indexnow-key) and
 *      POST the URL list to api.indexnow.org.
 *   2. Google Indexing API — uses the SAME service account as Search Console
 *      (GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY) but the read/write `indexing` scope.
 *      The service account must be added as an OWNER of the property and the
 *      Indexing API enabled in the Google Cloud project. Gated behind
 *      GOOGLE_INDEXING_ENABLED=1 since it needs that extra setup.
 *
 * Both are best-effort and never throw into the publish path.
 */

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";
const GOOGLE_PUBLISH_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";

export type IndexSubmitResult = {
  ok: boolean;
  channel: "indexnow" | "google";
  submitted: number;
  skipped?: boolean;
  detail: string;
};

export type IndexPingReport = {
  urls: string[];
  results: IndexSubmitResult[];
};

function siteBase(): string | null {
  loadProjectEnv();
  const raw = (process.env.WP_SITE_URL || process.env.WP_PLUGIN_URL || "").trim();
  if (!raw) return null;
  return raw.replace(/\/wp-json\/.*$/, "").replace(/\/$/, "");
}

function hostFrom(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

/** Fetch the IndexNow key from the WordPress plugin (it owns + hosts it). */
async function getIndexNowKey(): Promise<{ key: string; keyLocation: string } | null> {
  loadProjectEnv();
  // Allow an explicit override; otherwise pull from the plugin.
  const envKey = process.env.INDEXNOW_KEY?.trim();
  const base = siteBase();
  if (!base) return null;
  if (envKey) {
    return { key: envKey, keyLocation: `${base}/${envKey}.txt` };
  }
  const { hasPluginConfigured, getIndexNowKey: pluginKey } = await import("./wp-plugin-client");
  if (!hasPluginConfigured()) return null;
  const k = await pluginKey();
  if (!k) return null;
  return { key: k.key, keyLocation: k.keyLocation };
}

/** Submit URLs to IndexNow (Bing/Yandex/etc.). Best-effort. */
export async function submitIndexNow(urls: string[]): Promise<IndexSubmitResult> {
  const clean = [...new Set(urls.filter(Boolean))];
  if (!clean.length) {
    return { ok: true, channel: "indexnow", submitted: 0, skipped: true, detail: "no urls" };
  }
  if (process.env.INDEXNOW_DISABLED === "1") {
    return { ok: true, channel: "indexnow", submitted: 0, skipped: true, detail: "disabled" };
  }
  const keyInfo = await getIndexNowKey();
  if (!keyInfo) {
    return {
      ok: false,
      channel: "indexnow",
      submitted: 0,
      skipped: true,
      detail: "no IndexNow key (set INDEXNOW_KEY or configure the WP plugin)",
    };
  }
  const host = hostFrom(clean[0]);
  if (!host) {
    return { ok: false, channel: "indexnow", submitted: 0, detail: "could not derive host" };
  }
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: keyInfo.key,
        keyLocation: keyInfo.keyLocation,
        urlList: clean.slice(0, 10000),
      }),
      signal: AbortSignal.timeout(20_000),
    });
    // IndexNow returns 200/202 on success; 4xx on key/host issues.
    const ok = res.status === 200 || res.status === 202;
    return {
      ok,
      channel: "indexnow",
      submitted: ok ? clean.length : 0,
      detail: ok ? `accepted ${clean.length} url(s) (HTTP ${res.status})` : `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      ok: false,
      channel: "indexnow",
      submitted: 0,
      detail: String((e as Error)?.message ?? e),
    };
  }
}

// --- Google Indexing API ---

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function googleCreds(): { clientEmail: string; privateKey: string } | null {
  loadProjectEnv();
  const clientEmail = process.env.GSC_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!clientEmail || !privateKey) return null;
  return { clientEmail, privateKey };
}

export function hasGoogleIndexingConfigured(): boolean {
  return process.env.GOOGLE_INDEXING_ENABLED === "1" && googleCreds() !== null;
}

async function googleAccessToken(): Promise<string> {
  const creds = googleCreds();
  if (!creds) throw new Error("Google indexing creds missing (GSC_CLIENT_EMAIL/GSC_PRIVATE_KEY).");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: GOOGLE_INDEXING_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = base64url(signer.sign(creds.privateKey));
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google auth failed (${res.status}): ${text.slice(0, 200)}`);
  const token = (JSON.parse(text) as { access_token?: string }).access_token;
  if (!token) throw new Error("Google auth returned no access_token.");
  return token;
}

/** Notify the Google Indexing API of URL updates/deletions. Best-effort. */
export async function submitGoogleIndexing(
  urls: string[],
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED",
): Promise<IndexSubmitResult> {
  const clean = [...new Set(urls.filter(Boolean))];
  if (!clean.length) {
    return { ok: true, channel: "google", submitted: 0, skipped: true, detail: "no urls" };
  }
  if (!hasGoogleIndexingConfigured()) {
    return {
      ok: true,
      channel: "google",
      submitted: 0,
      skipped: true,
      detail: "disabled (set GOOGLE_INDEXING_ENABLED=1 + owner service account)",
    };
  }
  try {
    const token = await googleAccessToken();
    let submitted = 0;
    const errors: string[] = [];
    // The API takes one URL per call; cap to avoid quota blowups (200/day default).
    for (const url of clean.slice(0, 180)) {
      const res = await fetch(GOOGLE_PUBLISH_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, type }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) submitted++;
      else if (errors.length < 3) errors.push(`HTTP ${res.status}`);
    }
    return {
      ok: submitted > 0 || clean.length === 0,
      channel: "google",
      submitted,
      detail: submitted
        ? `published ${submitted}/${clean.length} url(s)${errors.length ? ` (errors: ${errors.join(", ")})` : ""}`
        : `0 published (${errors.join(", ") || "unknown"})`,
    };
  } catch (e) {
    return {
      ok: false,
      channel: "google",
      submitted: 0,
      detail: String((e as Error)?.message ?? e),
    };
  }
}

/** Configured if either channel can run. */
export function hasIndexingConfigured(): boolean {
  loadProjectEnv();
  const indexNow =
    process.env.INDEXNOW_DISABLED !== "1" &&
    (!!process.env.INDEXNOW_KEY?.trim() ||
      !!process.env.WP_SITE_URL?.trim() ||
      !!process.env.WP_PLUGIN_URL?.trim());
  return indexNow || hasGoogleIndexingConfigured();
}

/**
 * Ping all configured channels for a set of URLs. Never throws — returns a
 * report the caller can log. Safe to call from any publish path.
 */
export async function pingUrlsForIndexing(
  urls: string[],
  opts: { type?: "URL_UPDATED" | "URL_DELETED" } = {},
): Promise<IndexPingReport> {
  const clean = [...new Set(urls.filter(Boolean))];
  const results = await Promise.all([
    submitIndexNow(clean),
    submitGoogleIndexing(clean, opts.type ?? "URL_UPDATED"),
  ]);
  return { urls: clean, results };
}
