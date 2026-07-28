import "@tanstack/react-start/server-only";
import { generateText } from "ai";
import { createAiProvider, hasAiCredentials } from "./ai-provider";
import { KLOUDBEAN_PROMPT_CORE } from "./kloudbean-scope";
import type { IcpId, SceneKind, SocialPost, VideoScript, VideoBeat } from "./studio-content";

/**
 * STUDIO ENGINE — makes the in-app Media Studio DYNAMIC. Instead of only the
 * static curated library, it assembles fresh, on-brand social posts and video
 * scripts from the engine's REAL data:
 *   - KloudGraph opportunities (competitor-proven Semrush keyword demand)
 *   - the knowledge-graph entities + gaps (what the system knows matters)
 *   - article/topic ideas the discovery engine already produced
 *   - the keywords warehouse
 *
 * It uses AI (DeepSeek/OpenAI, same provider as the rest of the app) to turn
 * those real topics into polished copy in the EXACT shapes the studio renders
 * (SocialPost / VideoScript), and degrades gracefully to deterministic
 * templates when AI or data is unavailable — so "Generate more" always returns
 * something usable. No invented figures; grounded in Kloudbean's real scope.
 */

const ICPS: IcpId[] = [
  "vibecoder", "saas_founder", "ai_agency", "freelance_dev", "wp_agency", "enterprise_gov", "general",
];
const SCENES: SceneKind[] = [
  "deploy", "network", "speed", "database", "security", "cost",
  "compare", "cdn", "scale", "code", "cloud", "ai", "wordpress", "generic",
];

export type StudioKind = "social" | "video";
export type StudioVideoFormat = "reel" | "youtube";

export type StudioSeed = {
  term: string;
  source: "kloudgraph" | "article-idea" | "keyword" | "kg-gap" | "kg-entity" | "evergreen";
  volume?: number | null;
  difficulty?: number | null;
  clusterId?: number | null;
  competitors?: string[];
  entityType?: string;
};

/**
 * Evergreen Kloudbean core topics — always on-brand and accurate. They TOP UP a
 * batch (added last, after real data) so "Generate" produces useful output even
 * on a fresh install with no Semrush import / discovery yet. Not counted as a
 * "real data" source in the status readout.
 */
const EVERGREEN_TERMS = [
  "managed cloud hosting",
  "deploy a node app",
  "managed postgres database",
  "load balancer",
  "autoscaling for traffic spikes",
  "wordpress cloud hosting",
  "self-host n8n",
  "self-host supabase",
  "cdn caching",
  "ssl certificate setup",
  "ci/cd pipeline",
  "automatic database backups",
  "vps vs managed hosting",
  "cloud cost optimization",
  "staging environment",
  "deploy an AI app",
];

export type StudioSourceCounts = {
  opportunities: number;
  articleIdeas: number;
  keywords: number;
  kgEntities: number;
  aiReady: boolean;
};

const norm = (s: string) => s.trim().toLowerCase();
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const titleish = (s: string) =>
  s.replace(/\s+/g, " ").trim().replace(/\b\w/g, (m) => m.toUpperCase());

/** Split a phrase into a balanced 2-line headline (single \n). */
function twoLine(s: string): string {
  const words = s.trim().split(/\s+/);
  if (words.length < 3 || s.length <= 20) return s;
  let acc = 0;
  let bestIdx = 1;
  let bestDiff = Infinity;
  for (let i = 0; i < words.length - 1; i++) {
    acc += words[i].length + 1;
    const diff = Math.abs(acc - s.length / 2);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i + 1;
    }
  }
  return words.slice(0, bestIdx).join(" ") + "\n" + words.slice(bestIdx).join(" ");
}

/** Map a topic phrase to the closest brand scene motif. */
export function termToScene(term: string): SceneKind {
  const t = ` ${norm(term)} `;
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  if (has("wordpress", "woocommerce", "elementor", " wp ", "kinsta", "wp engine")) return "wordpress";
  if (has(" vs ", "versus", "alternative", "compare", "comparison")) return "compare";
  if (has("database", "postgres", "mysql", "mariadb", "mongo", "redis", " sql", "supabase")) return "database";
  if (has("security", "ssl", "backup", "compliance", "gdpr", "firewall", "ddos", "residency", "isolat")) return "security";
  if (has("speed", "fast", "performance", "cache", "caching", "core web", "latency", "optimize")) return "speed";
  if (has("cdn", "global", "edge", "worldwide")) return "cdn";
  if (has("scale", "autoscal", "traffic", "load balanc", "spike", "concurrent")) return "scale";
  if (has("cost", "price", "pricing", "cheap", "bill", "save", "budget", "egress")) return "cost";
  if (has(" ai ", "gpt", "llm", " ml ", "model", "lovable", "bolt", "cursor", "ollama", "langflow")) return "ai";
  if (has("deploy", "ship", "launch", "one-click", "one click", "release")) return "deploy";
  if (has("node", "react", "next", "laravel", "django", "python", "golang", " go ", "git", "ci/cd", "cicd", "pipeline", "code")) return "code";
  if (has("network", "proxy", "dns", "vpc", "load balancer", "nginx")) return "network";
  if (has("scal")) return "scale";
  if (has("cloud", "hosting", "server", "managed", "vps", "vm", "infrastructure")) return "cloud";
  return "generic";
}

/** Map a topic to the audience (ICP) it best serves. */
export function termToIcp(seed: StudioSeed): IcpId {
  const t = ` ${norm(seed.term)} `;
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  if (has("wordpress", "woocommerce", "elementor", " wp ", "kinsta", "wp engine")) return "wp_agency";
  if (has("agency", "agencies", "client", "white label", "white-label", "reseller")) return "ai_agency";
  if (has("freelance", "freelancer", "solo ")) return "freelance_dev";
  if (has("lovable", "bolt", "cursor", "replit", " v0", "vibe", "ai app", "ai-built")) return "vibecoder";
  if (has("saas", "founder", "startup", "self-host", "self host", "n8n", "supabase", "ghost", "indie")) return "saas_founder";
  if (has("ksa", "saudi", "compliance", "gitlab", "enterprise", "gov", "residency", "dammam", "sovereign")) return "enterprise_gov";
  if (seed.competitors && seed.competitors.length >= 2) return "ai_agency";
  return "general";
}

const coerceIcp = (x: unknown, fallback: IcpId): IcpId =>
  typeof x === "string" && (ICPS as string[]).includes(x) ? (x as IcpId) : fallback;
const coerceScene = (x: unknown, fallback: SceneKind): SceneKind =>
  typeof x === "string" && (SCENES as string[]).includes(x) ? (x as SceneKind) : fallback;

function stripFences(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
}
function extractJson<T>(raw: string): T | null {
  const s = stripFences(raw);
  try {
    return JSON.parse(s) as T;
  } catch {
    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(s.slice(a, b + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function hashtagsFor(term: string): string[] {
  const words = term
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w.replace(/\b\w/g, (m) => m.toUpperCase()));
  const tags = [...words.map((w) => w), "ManagedCloud", "KloudBean"];
  return Array.from(new Set(tags)).slice(0, 5);
}

/* ─────────────────────────── gather real sources ─────────────────────────── */

/** Pull real topics from every available signal, interleaved for variety. */
export async function gatherStudioSeeds(max = 40, geo = "global"): Promise<StudioSeed[]> {
  const buckets: StudioSeed[][] = [];

  // 1) KloudGraph opportunities — competitor-proven Semrush demand (strongest).
  try {
    const { getAggregatedOpportunities } = await import("./kloudgraph/opportunity-engine");
    const opps = await getAggregatedOpportunities({ limit: max, minRelevance: 0.5 });
    buckets.push(
      opps.map((o) => ({
        term: o.keyword,
        source: "kloudgraph" as const,
        volume: o.volume,
        difficulty: o.difficulty,
        clusterId: o.clusterId ?? null,
        competitors: o.competitors,
      })),
    );
  } catch {
    /* optional */
  }

  // 2) Article/topic ideas the discovery engine already produced.
  try {
    const articlesRepo = await import("@/server/db/repos/articles");
    const arts = await articlesRepo.listArticles({ limit: max });
    buckets.push(
      arts
        .map((a) => ({
          term: (a.target_keyword || a.title || "").trim(),
          source: "article-idea" as const,
          clusterId: a.cluster_id ?? null,
        }))
        .filter((s) => s.term.length > 2),
    );
  } catch {
    /* optional */
  }

  // 3) Keywords warehouse.
  try {
    const kwRepo = await import("@/server/db/repos/keywords");
    const kws = await kwRepo.listKeywords(geo, max);
    buckets.push(
      kws.map((k) => ({
        term: k.keyword,
        source: "keyword" as const,
        volume: k.monthly_volume,
        difficulty: k.difficulty,
      })),
    );
  } catch {
    /* optional */
  }

  // 4) Knowledge-graph gaps — important entities with thin coverage.
  try {
    const { getGraphGaps } = await import("./knowledge-graph");
    const gaps = await getGraphGaps(12);
    buckets.push(
      gaps.map((g) => ({ term: g.label, source: "kg-gap" as const, entityType: g.type })),
    );
  } catch {
    /* optional */
  }

  // 5) Knowledge-graph entities — products/apps/competitors/runtimes/regions.
  try {
    const kg = await import("@/server/db/repos/knowledge-graph");
    const nodes = await kg.listNodes({ limit: 40 });
    const keep = new Set(["product", "app", "competitor", "provider", "runtime", "region", "feature"]);
    buckets.push(
      nodes
        .filter((n) => keep.has(n.type))
        .map((n) => ({
          term: n.label,
          source: "kg-entity" as const,
          entityType: n.type,
          clusterId: n.cluster_id ?? null,
        })),
    );
  } catch {
    /* optional */
  }

  // Evergreen top-up (added last) — guarantees a usable batch even with no data.
  buckets.push(EVERGREEN_TERMS.map((term) => ({ term, source: "evergreen" as const })));

  // Interleave buckets (round-robin) so a batch draws from many sources.
  const out: StudioSeed[] = [];
  const seen = new Set<string>();
  let added = true;
  for (let i = 0; added; i++) {
    added = false;
    for (const b of buckets) {
      if (i < b.length) {
        added = true;
        const s = b[i];
        const key = norm(s.term);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(s);
      }
    }
  }
  return out;
}

export async function getStudioSourceCounts(geo = "global"): Promise<StudioSourceCounts> {
  const seeds = await gatherStudioSeeds(200, geo);
  const bySource = (s: StudioSeed["source"]) => seeds.filter((x) => x.source === s).length;
  return {
    opportunities: bySource("kloudgraph"),
    articleIdeas: bySource("article-idea"),
    keywords: bySource("keyword"),
    kgEntities: bySource("kg-gap") + bySource("kg-entity"),
    aiReady: hasAiCredentials(),
  };
}

/* ─────────────────────────── deterministic builders ─────────────────────────── */

function captionForScene(topic: string, scene: SceneKind): string {
  const T = cap(topic);
  const tail = "Start free at kloudbean.com.";
  switch (scene) {
    case "compare":
      return `A managed, predictable alternative for ${topic} — run it on Kloudbean with security, backups and scaling handled. ${tail}`;
    case "cost":
      return `Keep ${topic} predictable. Kloudbean is managed cloud at a flat price — no surprise bills. ${tail}`;
    case "security":
      return `${T}, done safely. Kloudbean handles hardening, backups and isolation on a server you own. ${tail}`;
    case "database":
      return `${T} without the babysitting — managed, backed up and running right next to your app. ${tail}`;
    case "speed":
      return `Make ${topic} fast: a tuned stack, caching and a global CDN, fully managed. ${tail}`;
    case "wordpress":
      return `${T} on managed cloud — WordPress and any modern stack, side by side, no visit caps. ${tail}`;
    case "scale":
      return `${T} that survives the spike. Load balancing and scaling, handled for you. ${tail}`;
    case "deploy":
      return `Ship ${topic} in one click. Kloudbean puts it on a managed server you own — no DevOps. ${tail}`;
    default:
      return `${T}, the managed way. Kloudbean runs it on a server you own, with the DevOps handled for you. ${tail}`;
  }
}

function buildSocialFromSeed(seed: StudioSeed, id: string): SocialPost {
  const scene = termToScene(seed.term);
  const icp = termToIcp(seed);
  const topic = seed.term.replace(/\s+/g, " ").trim();
  const headline =
    scene === "compare"
      ? twoLine(`A real ${titleish(topic)} alternative`)
      : twoLine(titleish(topic));
  return {
    id,
    icp,
    scene,
    platform: seed.competitors && seed.competitors.length ? "X" : "LinkedIn",
    headline,
    caption: captionForScene(topic, scene),
    tags: hashtagsFor(topic),
  };
}

function buildVideoFromSeed(seed: StudioSeed, id: string): VideoScript {
  const scene = termToScene(seed.term);
  const icp = termToIcp(seed);
  const topic = seed.term.replace(/\s+/g, " ").trim();
  const T = cap(topic);
  const beats: VideoBeat[] = [
    { dur: 4, on_screen: twoLine(titleish(topic)), narration: `Let's talk about ${topic}.`, scene },
    { dur: 5, on_screen: "The managed way", narration: `Kloudbean runs ${topic} on a fully managed server you own.`, scene },
    { dur: 5, on_screen: "Handled for you", narration: "Security, backups and scaling are handled, so you just build.", scene: "security" },
    { dur: 4, on_screen: "Own it", narration: "Your code, your data, your server — no lock-in.", scene: "cloud" },
    { dur: 4, on_screen: "Start free", narration: "Start free at kloudbean.com.", scene: "cloud" },
  ];
  return {
    id,
    icp,
    title: scene === "compare" ? `${T}: the honest take` : `${T}, explained`,
    hook: scene === "compare" ? "A fair, managed alternative." : `What ${topic} really takes.`,
    cta: "Start free at kloudbean.com",
    caption: captionForScene(topic, scene),
    tags: hashtagsFor(topic),
    beats,
  };
}

/* ─────────────────────────── AI builders ─────────────────────────── */

function seedLines(seeds: StudioSeed[]): string {
  return seeds
    .slice(0, 22)
    .map((s) => {
      const bits = [`- ${s.term} (source: ${s.source}`];
      if (s.volume) bits.push(`vol ${s.volume}`);
      if (s.difficulty != null) bits.push(`KD ${s.difficulty}`);
      if (s.competitors?.length) bits.push(`competitors: ${s.competitors.slice(0, 3).join(", ")}`);
      return bits.join(", ") + ")";
    })
    .join("\n");
}

type AiSocial = { icp?: string; scene?: string; platform?: string; headline?: string; caption?: string; tags?: unknown };
type AiVideo = {
  icp?: string; title?: string; hook?: string; cta?: string; caption?: string; tags?: unknown;
  beats?: { dur?: unknown; on_screen?: string; narration?: string; scene?: string }[];
};

const SOCIAL_SYSTEM = `You are a senior brand social copywriter for Kloudbean (kloudbean.com). Return STRICT JSON only.

${KLOUDBEAN_PROMPT_CORE}

Write scroll-stopping, on-brand social posts grounded ONLY in the real topics provided (they come from our SEO keyword, competitor and knowledge-graph data). Be accurate and within Kloudbean's real capabilities — never invent numbers or features.

Each post object:
- "icp": exactly one of [${ICPS.join(", ")}] — the audience this topic best fits.
- "scene": exactly one of [${SCENES.join(", ")}] — the visual motif that matches the topic.
- "platform": "X" | "LinkedIn" | "any".
- "headline": punchy, <= 6 words per line, use a single \\n to make it two lines (this goes ON the image). No hashtags in the headline.
- "caption": 1–2 sentences, ready to paste, resolving to kloudbean.com when natural.
- "tags": 4–8 hashtags WITHOUT the # symbol.

Return JSON EXACTLY: { "posts": [ { ... } ] } — nothing else.`;

const VIDEO_SYSTEM = `You are a short-form video scriptwriter for Kloudbean (kloudbean.com). Return STRICT JSON only.

${KLOUDBEAN_PROMPT_CORE}

Write tight, on-brand explainer scripts grounded ONLY in the real topics provided (from our SEO keyword, competitor and knowledge-graph data). Accurate, within real capabilities, no invented numbers.

Each video object:
- "icp": exactly one of [${ICPS.join(", ")}].
- "title": the video title.
- "hook": a <= 12-word opening hook.
- "cta": one line ending at kloudbean.com.
- "caption": a ready-to-post caption (1–2 sentences, no hashtags).
- "tags": 4–8 hashtags WITHOUT the # symbol.
- "beats": 5 beats, each { "dur": seconds (4 or 5), "on_screen": <= 6 words, "narration": one spoken sentence, "scene": one of [${SCENES.join(", ")}] }. The final beat is the CTA.

Return JSON EXACTLY: { "videos": [ { ... } ] } — nothing else.`;

async function aiSocial(seeds: StudioSeed[], count: number): Promise<SocialPost[] | null> {
  let model;
  try {
    model = createAiProvider();
  } catch {
    return null;
  }
  let raw: string;
  try {
    raw = (
      await generateText({
        model,
        system: SOCIAL_SYSTEM,
        prompt: `Create ${count} distinct social posts from these real topics (pick the best, one topic each, vary the audience):\n\n${seedLines(seeds)}`,
        temperature: 0.7,
        maxOutputTokens: 950,
      })
    ).text;
  } catch {
    return null;
  }
  const parsed = extractJson<{ posts?: AiSocial[] }>(raw);
  if (!parsed?.posts?.length) return null;
  return parsed.posts.map((p, i) => {
    const fallbackIcp = termToIcp({ term: p.headline ?? p.caption ?? "", source: "keyword" });
    const scene = coerceScene(p.scene, termToScene(p.headline ?? p.caption ?? ""));
    const tags = Array.isArray(p.tags) ? p.tags.map((t) => String(t).replace(/^#/, "")).slice(0, 8) : [];
    return {
      id: mkId("social", i),
      icp: coerceIcp(p.icp, fallbackIcp),
      scene,
      platform: p.platform === "X" || p.platform === "LinkedIn" ? p.platform : "any",
      headline: (p.headline ?? "").trim() || "Managed cloud,\nso you can just build",
      caption: (p.caption ?? "").trim(),
      tags: tags.length ? tags : ["ManagedCloud", "KloudBean"],
    };
  });
}

async function aiVideo(seeds: StudioSeed[], count: number): Promise<VideoScript[] | null> {
  let model;
  try {
    model = createAiProvider();
  } catch {
    return null;
  }
  let raw: string;
  try {
    raw = (
      await generateText({
        model,
        system: VIDEO_SYSTEM,
        prompt: `Create ${count} distinct explainer videos from these real topics (pick the best, one topic each, vary the audience):\n\n${seedLines(seeds)}`,
        temperature: 0.7,
        maxOutputTokens: 1150,
      })
    ).text;
  } catch {
    return null;
  }
  const parsed = extractJson<{ videos?: AiVideo[] }>(raw);
  if (!parsed?.videos?.length) return null;
  return parsed.videos
    .map((v, i) => {
      const fallbackIcp = termToIcp({ term: v.title ?? "", source: "keyword" });
      const beats: VideoBeat[] = Array.isArray(v.beats)
        ? v.beats.slice(0, 6).map((b) => ({
            dur: Math.min(8, Math.max(2, Number(b.dur) || 4)),
            on_screen: String(b.on_screen ?? "").trim(),
            narration: String(b.narration ?? "").trim(),
            scene: coerceScene(b.scene, termToScene(v.title ?? "")),
          }))
        : [];
      const tags = Array.isArray(v.tags) ? v.tags.map((t) => String(t).replace(/^#/, "")).slice(0, 8) : [];
      return {
        id: mkId("video", i),
        icp: coerceIcp(v.icp, fallbackIcp),
        title: (v.title ?? "").trim() || "What is managed cloud hosting?",
        hook: v.hook?.trim() || undefined,
        cta: v.cta?.trim() || "Start free at kloudbean.com",
        caption: (v.caption ?? "").trim(),
        tags: tags.length ? tags : ["ManagedCloud", "KloudBean"],
        beats,
      };
    })
    .filter((v) => v.beats.length >= 2);
}

/* ─────────────────────────── public API ─────────────────────────── */

let idCounter = 0;
function mkId(kind: string, i: number): string {
  idCounter += 1;
  return `gs-${kind}-${Date.now().toString(36)}-${idCounter}-${i}`;
}

export type StudioGenResult = {
  ok: boolean;
  usedAi: boolean;
  sources: StudioSourceCounts;
  posts?: SocialPost[];
  videos?: VideoScript[];
  log: string[];
};

/**
 * Generate a batch of dynamic studio content from the engine's real data.
 * `exclude` is a list of already-shown headlines/titles (normalized) so
 * "Generate more" keeps producing fresh items.
 */
export async function generateStudioContent(opts: {
  kind: StudioKind;
  count?: number;
  format?: StudioVideoFormat;
  exclude?: string[];
  geo?: string;
}): Promise<StudioGenResult> {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const count = Math.min(24, Math.max(1, opts.count ?? 8));
  const geo = opts.geo ?? "global";
  const log: string[] = [];
  const excluded = new Set((opts.exclude ?? []).map(norm));

  const seeds = await gatherStudioSeeds(count * 4, geo);
  const sources = await getStudioSourceCounts(geo);
  log.push(`gathered ${seeds.length} seeds (opps ${sources.opportunities}, ideas ${sources.articleIdeas}, kw ${sources.keywords}, kg ${sources.kgEntities})`);

  // Seeds not yet shown (dedupe against exclude), then a working set.
  const fresh = seeds.filter((s) => !excluded.has(norm(s.term)));
  const working = (fresh.length ? fresh : seeds).slice(0, Math.max(count * 2, count + 6));

  const dedupeKey = (item: SocialPost | VideoScript) =>
    norm("headline" in item ? item.headline.replace(/\n/g, " ") : item.title);

  const finalize = <T extends SocialPost | VideoScript>(items: T[]): T[] => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const it of items) {
      const k = dedupeKey(it);
      if (!k || seen.has(k) || excluded.has(k)) continue;
      seen.add(k);
      out.push(it);
      if (out.length >= count) break;
    }
    return out;
  };

  let usedAi = false;

  if (opts.kind === "social") {
    let posts: SocialPost[] = [];
    if (hasAiCredentials()) {
      const ai = await aiSocial(working, Math.min(count, 5));
      if (ai?.length) {
        posts = finalize(ai);
        usedAi = true;
        log.push(`AI produced ${posts.length} social posts`);
      }
    }
    if (posts.length < count) {
      const need = working.filter((s) => !posts.some((p) => norm(p.headline.replace(/\n/g, " ")).includes(norm(s.term))));
      const built = need.map((s, i) => buildSocialFromSeed(s, mkId("social", i)));
      posts = finalize([...posts, ...built]);
      if (!usedAi) log.push(`built ${posts.length} social posts from templates (no AI)`);
    }
    return { ok: posts.length > 0, usedAi, sources, posts, log };
  }

  // video
  let videos: VideoScript[] = [];
  if (hasAiCredentials()) {
    const ai = await aiVideo(working, Math.min(count, 3));
    if (ai?.length) {
      videos = finalize(ai);
      usedAi = true;
      log.push(`AI produced ${videos.length} video scripts`);
    }
  }
  if (videos.length < count) {
    const built = working.map((s, i) => buildVideoFromSeed(s, mkId("video", i)));
    videos = finalize([...videos, ...built]);
    if (!usedAi) log.push(`built ${videos.length} video scripts from templates (no AI)`);
  }
  return { ok: videos.length > 0, usedAi, sources, videos, log };
}
