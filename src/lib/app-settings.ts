import "@tanstack/react-start/server-only";

/**
 * DASHBOARD-MANAGED INTEGRATION SETTINGS.
 *
 * Lets users configure integrations (currently Google Search Console) from the
 * Settings page instead of editing .env. Values are stored in the app_settings
 * DB table and loaded into process.env at runtime, so the existing clients
 * (which read process.env) keep working unchanged. DB values take precedence
 * over .env, and .env still works as a fallback when nothing is saved.
 */

/** Integration keys that can be managed from the dashboard. */
export const MANAGED_ENV_KEYS = [
  "GSC_CLIENT_EMAIL",
  "GSC_PRIVATE_KEY",
  "GSC_SITE_URL",
  "BING_API_KEY",
  "BING_SITE_URL",
] as const;

let lastHydrated = 0;
const HYDRATE_TTL_MS = 15_000;

/**
 * Load managed settings from the DB into process.env (DB overrides env).
 * Cheap + cached for a few seconds; pass force=true right after saving.
 */
export async function hydrateEnvFromSettings(force = false): Promise<void> {
  if (!force && Date.now() - lastHydrated < HYDRATE_TTL_MS) return;
  try {
    const { getSettings } = await import("@/server/db/repos/app-settings");
    const values = await getSettings([...MANAGED_ENV_KEYS]);
    for (const key of MANAGED_ENV_KEYS) {
      const v = values[key];
      if (typeof v === "string" && v.trim()) process.env[key] = v;
    }
    lastHydrated = Date.now();
  } catch {
    /* DB not ready — env fallback still applies */
  }
}

/** Parse a Google service-account JSON to extract client_email + private_key. */
export function parseServiceAccountJson(raw: string): {
  clientEmail?: string;
  privateKey?: string;
  error?: string;
} {
  const text = (raw ?? "").trim();
  if (!text) return {};
  try {
    const j = JSON.parse(text) as { client_email?: string; private_key?: string };
    if (!j.client_email || !j.private_key) {
      return { error: "JSON is missing client_email or private_key." };
    }
    return { clientEmail: j.client_email.trim(), privateKey: j.private_key };
  } catch {
    return { error: "That doesn't look like valid JSON. Paste the whole key file contents." };
  }
}

/** Save GSC credentials to the DB + hydrate the running process immediately. */
export async function saveGscSettings(input: {
  serviceAccountJson?: string;
  clientEmail?: string;
  privateKey?: string;
  siteUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  let clientEmail = input.clientEmail?.trim();
  let privateKey = input.privateKey;

  if (input.serviceAccountJson?.trim()) {
    const parsed = parseServiceAccountJson(input.serviceAccountJson);
    if (parsed.error) return { ok: false, error: parsed.error };
    clientEmail = parsed.clientEmail ?? clientEmail;
    privateKey = parsed.privateKey ?? privateKey;
  }

  const siteUrl = input.siteUrl?.trim();
  const { setSettings } = await import("@/server/db/repos/app-settings");
  const patch: Record<string, string | null> = {};
  if (clientEmail !== undefined) patch.GSC_CLIENT_EMAIL = clientEmail || null;
  if (privateKey !== undefined) patch.GSC_PRIVATE_KEY = privateKey || null;
  if (siteUrl !== undefined) patch.GSC_SITE_URL = siteUrl || null;

  if (!Object.keys(patch).length) return { ok: false, error: "Nothing to save." };
  await setSettings(patch);
  await hydrateEnvFromSettings(true);
  return { ok: true };
}

/** Current GSC config status for the dashboard (never returns the private key). */
export async function getGscStatus(): Promise<{
  configured: boolean;
  clientEmail: string | null;
  siteUrl: string | null;
  hasPrivateKey: boolean;
  source: "dashboard" | "env" | "none";
}> {
  const { getSettings } = await import("@/server/db/repos/app-settings");
  const db = await getSettings([...MANAGED_ENV_KEYS]);

  const clientEmail = db.GSC_CLIENT_EMAIL || process.env.GSC_CLIENT_EMAIL || null;
  const siteUrl = db.GSC_SITE_URL || process.env.GSC_SITE_URL || null;
  const hasPrivateKey = !!(db.GSC_PRIVATE_KEY || process.env.GSC_PRIVATE_KEY);
  const fromDb = !!(db.GSC_CLIENT_EMAIL || db.GSC_PRIVATE_KEY || db.GSC_SITE_URL);

  return {
    configured: !!(clientEmail && siteUrl && hasPrivateKey),
    clientEmail,
    siteUrl,
    hasPrivateKey,
    source: fromDb ? "dashboard" : clientEmail || hasPrivateKey ? "env" : "none",
  };
}

/** Save Bing Webmaster credentials from the dashboard (stored in DB). */
export async function saveBingSettings(input: {
  apiKey?: string;
  siteUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const patch: Record<string, string | null> = {};
  if (input.apiKey !== undefined) patch.BING_API_KEY = input.apiKey.trim() || null;
  if (input.siteUrl !== undefined) patch.BING_SITE_URL = input.siteUrl.trim() || null;
  if (!Object.keys(patch).length) return { ok: false, error: "Nothing to save." };
  const { setSettings } = await import("@/server/db/repos/app-settings");
  await setSettings(patch);
  await hydrateEnvFromSettings(true);
  return { ok: true };
}

/** Current Bing config status for the dashboard (never returns the key). */
export async function getBingStatus(): Promise<{
  configured: boolean;
  siteUrl: string | null;
  hasApiKey: boolean;
  source: "dashboard" | "env" | "none";
}> {
  const { getSettings } = await import("@/server/db/repos/app-settings");
  const db = await getSettings(["BING_API_KEY", "BING_SITE_URL"]);
  const siteUrl = db.BING_SITE_URL || process.env.BING_SITE_URL || null;
  const hasApiKey = !!(db.BING_API_KEY || process.env.BING_API_KEY);
  const fromDb = !!(db.BING_API_KEY || db.BING_SITE_URL);
  return {
    configured: !!(siteUrl && hasApiKey),
    siteUrl,
    hasApiKey,
    source: fromDb ? "dashboard" : siteUrl || hasApiKey ? "env" : "none",
  };
}
