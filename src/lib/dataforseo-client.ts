import type { GeoCode, SearchIntent } from "./seo-types";
import { loadProjectEnv } from "./load-env";

export const GEO_LOCATION: Record<GeoCode, number> = {
  sa: 2682,
  in: 2356,
  ae: 2784,
  global: 2840,
};

export function hasDataForSeoCredentials(): boolean {
  loadProjectEnv();
  return !!(process.env.DATAFORSEO_LOGIN?.trim() && process.env.DATAFORSEO_PASSWORD?.trim());
}

export function dataForSeoAuthHeader(): string | null {
  const u = process.env.DATAFORSEO_LOGIN;
  const p = process.env.DATAFORSEO_PASSWORD;
  if (!u || !p) return null;
  return "Basic " + Buffer.from(`${u}:${p}`).toString("base64");
}

export async function dfsPost(path: string, body: unknown) {
  loadProjectEnv();
  const auth = dataForSeoAuthHeader();
  if (!auth) throw new Error("DataForSEO credentials not configured. Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in Settings.");
  let res: Response;
  try {
    res = await fetch(`https://api.dataforseo.com${path}`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (msg.includes("fetch failed") || msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED")) {
      throw new Error(
        `Cannot reach api.dataforseo.com (${msg}). Check internet/VPN/firewall, then restart: npm run dev`,
      );
    }
    throw e;
  }
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 400);
    try {
      const j = JSON.parse(text) as { status_message?: string; tasks?: { status_message?: string }[] };
      detail = j.status_message ?? j.tasks?.[0]?.status_message ?? detail;
    } catch {
      /* use raw text */
    }
    throw new Error(`DataForSEO ${res.status}: ${detail}`);
  }
  const json = JSON.parse(text) as { status_code?: number; status_message?: string };
  if (json.status_code && json.status_code !== 20000) {
    throw new Error(`DataForSEO API: ${json.status_message ?? "request failed"} (code ${json.status_code})`);
  }
  return json;
}

export function locCode(geo: string): number {
  return GEO_LOCATION[geo as GeoCode] ?? GEO_LOCATION.sa;
}

export function parseIntent(raw: unknown): { intent: SearchIntent; probability: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const main = (o.main_intent ?? o.intent ?? o.primary_intent) as string | undefined;
  const prob = Number(o.probability ?? o.confidence ?? o.intent_probability ?? 0);
  if (!main) return null;
  const normalized = main.toLowerCase();
  if (["informational", "commercial", "transactional", "navigational"].includes(normalized)) {
    return { intent: normalized as SearchIntent, probability: prob || 0.5 };
  }
  if (normalized === "mixed") return { intent: "mixed", probability: prob || 0.5 };
  return { intent: "informational", probability: prob || 0.4 };
}

export function inferIntentFromSerp(features: string[], titles: string[]): SearchIntent {
  const f = features.map((x) => x.toLowerCase());
  const t = titles.join(" ").toLowerCase();
  if (f.some((x) => x.includes("shopping") || x.includes("paid"))) return "transactional";
  if (t.match(/\b(price|pricing|cost|buy|plan|vs|alternative|best)\b/)) return "commercial";
  if (t.match(/\b(how to|what is|guide|tutorial|meaning|definition)\b/)) return "informational";
  if (t.match(/\b(login|official|website)\b/)) return "navigational";
  return "informational";
}

export function opportunityScore(volume: number | null, difficulty: number | null, intent: SearchIntent | null): number {
  const v = Math.min(volume ?? 0, 10000) / 10000;
  const d = difficulty != null ? 1 - Math.min(difficulty, 100) / 100 : 0.5;
  const intentBoost =
    intent === "commercial" ? 1.15 : intent === "transactional" ? 1.1 : intent === "informational" ? 1.0 : 0.9;
  return Math.round(Math.min(100, v * 45 + d * 45) * intentBoost);
}

/** Prioritize real search demand — volume weighted heavily for topic selection. */
export function trafficPriorityScore(
  volume: number | null,
  difficulty: number | null,
  intent: SearchIntent | null,
  clusterTotalVolume?: number,
): number {
  const v = volume ?? 0;
  const volScore = Math.min(100, (Math.log10(Math.max(v, 1)) / 5) * 100);
  const clusterBonus = clusterTotalVolume
    ? Math.min(25, (Math.log10(Math.max(clusterTotalVolume, 1)) / 6) * 25)
    : 0;
  const d = difficulty != null ? 1 - Math.min(difficulty, 100) / 100 : 0.55;
  const intentBoost =
    intent === "commercial" ? 1.12 : intent === "transactional" ? 1.08 : intent === "informational" ? 1.0 : 0.92;
  return Math.round(Math.min(100, volScore * 0.62 + d * 22 + clusterBonus) * intentBoost);
}
