import "@tanstack/react-start/server-only";
import { generateText } from "ai";
import { createAiProvider } from "./ai-provider";
import { KLOUDBEAN_PROMPT_CORE } from "./kloudbean-scope";

/**
 * REEL ENGINE — turns the Kloudbean knowledge into short-video ideas + full,
 * production-ready scripts with ready-to-paste prompts for text-to-video tools
 * (Sora, Veo, Google AI Studio). Tuned for educational / explainer / "how it
 * works" content that earns saves and shares, not hype.
 */

export type ReelFormat = "explainer" | "educational" | "how_it_works" | "viral" | "comparison";

export type ReelIdea = {
  title: string;
  topic: string;
  format: ReelFormat;
  angle: string;
  cluster_id?: number | null;
  source: string;
  demand_score?: number;
};

export type ReelBeat = {
  seconds: string; // e.g. "0-3"
  narration: string; // voiceover line
  on_screen: string; // on-screen text / caption
  visual_prompt: string; // what the AI video tool should render for this beat
};

export type GeneratedReel = {
  ok: boolean;
  hook: string;
  hook_variations: string[];
  script: ReelBeat[];
  voiceover: string;
  caption: string;
  hashtags: string[];
  cta: string;
  duration_seconds: number;
  platform_prompts: { sora: string; veo: string; ai_studio: string };
  error?: string;
  log: string[];
};

const FORMAT_GUIDE: Record<ReelFormat, string> = {
  explainer: "Explain ONE concept simply in ~40s. Clear, calm, confident. Analogy in the first 5s.",
  educational: "Teach a concrete skill/step set viewers can act on. Show the steps on screen.",
  how_it_works:
    "Open the hood on how a system/feature works under the hood. Diagram-style visuals.",
  viral: "Pattern-interrupt hook, fast pacing, a surprising fact or myth-bust, strong loop ending.",
  comparison:
    "Fair head-to-head (Kloudbean vs X) on real criteria with an on-screen table; no trash talk.",
};

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
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

const REEL_SYSTEM = `You are a short-form video producer + scriptwriter for Kloudbean (kloudbean.com). You write vertical (9:16) reels for YouTube Shorts, Instagram Reels, and TikTok aimed at developers, founders, and agencies. Return STRICT JSON only.

${KLOUDBEAN_PROMPT_CORE}

PRINCIPLES:
- Educate first. The best Kloudbean reels explain how cloud/hosting/devops things actually work, then show Kloudbean as the easy way to do it. No hype, no "game-changer", no fake urgency.
- Hook in the first 2 seconds (a question, a surprising number, a myth to bust). Loop or pay-off at the end.
- Keep narration tight: ~2.2 words/second. A 45s reel ≈ 100 words of voiceover total.
- On-screen text is short (≤6 words per beat). Visual prompts must be concrete and renderable by an AI video model (subject, setting, motion, style, camera) — NO text-heavy scenes, NO real logos/brand faces.
- Be technically accurate and within Kloudbean's real capabilities. Never invent features.

Return JSON with EXACTLY this shape:
{
  "hook": "the spoken+on-screen hook line (<= 12 words)",
  "hook_variations": ["3 alternative hooks"],
  "duration_seconds": 45,
  "script": [
    { "seconds": "0-3", "narration": "…", "on_screen": "…", "visual_prompt": "concrete AI-video shot description incl. style + camera" }
    // 6–9 beats covering the full duration
  ],
  "voiceover": "the full narration as one clean paragraph for TTS",
  "caption": "platform caption (1–2 sentences, no hashtags here)",
  "hashtags": ["6–10 relevant hashtags without the # symbol"],
  "cta": "one-line call to action ending at kloudbean.com"
}
Return ONLY the JSON object.`;

function buildPlatformPrompts(input: {
  title: string;
  format: ReelFormat;
  script: ReelBeat[];
  voiceover: string;
}): { sora: string; veo: string; ai_studio: string } {
  const shotList = input.script
    .map((b, i) => `${i + 1}. [${b.seconds}s] ${b.visual_prompt}`)
    .join("\n");
  const common = `Vertical 9:16 short video, ~${input.script.length} shots, clean modern tech aesthetic, soft gradient backgrounds with #6c47ff accents, smooth motion, no on-screen logos or real people's faces, no readable brand text. Topic: "${input.title}".`;

  const sora = `${common}

SHOT LIST (one continuous edit, each shot 3–6s):
${shotList}

Style: cinematic but minimal, shallow depth of field, subtle camera moves (slow push-in, parallax). Mood: confident, educational. Leave headroom at top/bottom for captions.`;

  const veo = `Google Veo prompt — vertical 9:16, ${input.script.length} sequential clips.
${common}

Per-clip prompts:
${shotList}

Camera: gentle dolly/orbit; Lighting: soft studio; Pacing: snappy cuts on the beat; Audio: subtle ambient tech bed (no copyrighted music).`;

  const ai_studio = `Google AI Studio (Gemini) video/image-gen brief.
Goal: produce b-roll for a ${input.script.length}-beat explainer reel titled "${input.title}".
For EACH beat, generate a 9:16 clip from its visual prompt below; keep a consistent palette (deep navy + #6c47ff). Then assemble in order with the provided voiceover.
${shotList}

Voiceover to time against:
"${input.voiceover}"`;

  return { sora, veo, ai_studio };
}

export async function generateReel(
  idea: ReelIdea,
  opts: { useRag?: boolean } = {},
): Promise<GeneratedReel> {
  const log: string[] = [];
  let model;
  try {
    model = createAiProvider();
  } catch (e) {
    return emptyReel(`AI not configured: ${String((e as Error)?.message ?? e)}`);
  }

  // Ground in real Kloudbean facts so the script stays accurate.
  let grounding = "";
  if (opts.useRag !== false) {
    try {
      const { ragGroundingForTopic } = await import("./rag-client");
      const g = await ragGroundingForTopic(idea.title, idea.topic, "global", 2200);
      grounding = g.block;
      if (grounding) log.push(`RAG grounding: ${g.sources.length} sources`);
    } catch {
      /* grounding optional */
    }
  }

  let parsed: Omit<GeneratedReel, "ok" | "platform_prompts" | "log"> | null = null;
  try {
    const raw = (
      await generateText({
        model,
        system: REEL_SYSTEM,
        prompt: `Reel title: ${idea.title}
Topic: ${idea.topic}
Format: ${idea.format} — ${FORMAT_GUIDE[idea.format]}
Angle: ${idea.angle}

${grounding}`,
        temperature: 0.8,
        maxOutputTokens: 2200,
      })
    ).text;
    parsed = extractJson(raw);
  } catch (e) {
    return emptyReel(`Reel generation failed: ${String((e as Error)?.message ?? e)}`);
  }

  if (!parsed || !Array.isArray(parsed.script) || !parsed.script.length) {
    return emptyReel("Reel generation returned no script");
  }

  const script: ReelBeat[] = parsed.script.map((b) => ({
    seconds: String(b.seconds ?? ""),
    narration: String(b.narration ?? ""),
    on_screen: String(b.on_screen ?? ""),
    visual_prompt: String(b.visual_prompt ?? ""),
  }));
  const duration = Number(parsed.duration_seconds) || 45;
  const voiceover = parsed.voiceover?.trim() || script.map((b) => b.narration).join(" ");

  const platform_prompts = buildPlatformPrompts({
    title: idea.title,
    format: idea.format,
    script,
    voiceover,
  });
  log.push(`reel: ${script.length} beats, ${duration}s`);

  return {
    ok: true,
    hook: parsed.hook?.trim() || idea.title,
    hook_variations: Array.isArray(parsed.hook_variations)
      ? parsed.hook_variations.slice(0, 3)
      : [],
    script,
    voiceover,
    caption: parsed.caption?.trim() || "",
    hashtags: Array.isArray(parsed.hashtags)
      ? parsed.hashtags.map((h) => String(h).replace(/^#/, "")).slice(0, 10)
      : [],
    cta: parsed.cta?.trim() || "Start free at kloudbean.com",
    duration_seconds: duration,
    platform_prompts,
    log,
  };
}

function emptyReel(error: string): GeneratedReel {
  return {
    ok: false,
    hook: "",
    hook_variations: [],
    script: [],
    voiceover: "",
    caption: "",
    hashtags: [],
    cta: "",
    duration_seconds: 0,
    platform_prompts: { sora: "", veo: "", ai_studio: "" },
    error,
    log: [error],
  };
}

// --- idea discovery from the knowledge graph + content ----------------------

function formatForEntity(type: string): ReelFormat {
  if (type === "competitor") return "comparison";
  if (type === "product" || type === "feature") return "how_it_works";
  if (type === "app" || type === "runtime") return "educational";
  if (type === "region") return "explainer";
  return "explainer";
}

/**
 * Derive reel ideas from the knowledge graph (top entities + gaps) and clusters,
 * deduped against existing reels. The graph's learned weights mean the ideas
 * lean toward what's working.
 */
export async function discoverReelIdeas(limit = 8): Promise<ReelIdea[]> {
  const ideas: ReelIdea[] = [];
  const seen = new Set<string>();

  const push = (idea: ReelIdea) => {
    const key = idea.title.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    ideas.push(idea);
  };

  try {
    const kg = await import("@/server/db/repos/knowledge-graph");
    const { getGraphGaps } = await import("./knowledge-graph");

    // Gaps first — high-value, under-covered entities make great explainers.
    const gaps = await getGraphGaps(10);
    for (const g of gaps) {
      const fmt = formatForEntity(g.type);
      push({
        title:
          fmt === "comparison"
            ? `Kloudbean vs ${g.label}: which should you deploy on?`
            : fmt === "how_it_works"
              ? `How ${g.label} actually works (in 45s)`
              : `${g.label}, explained simply`,
        topic: g.label,
        format: fmt,
        angle: `Teach ${g.label} clearly, then show Kloudbean as the simplest way to run it.`,
        source: "kg-gap",
      });
    }

    // Then top-weighted entities (what the system thinks matters most).
    const nodes = await kg.listNodes({ limit: 40 });
    for (const n of nodes) {
      if (ideas.length >= limit * 2) break;
      if (!["product", "app", "runtime", "competitor", "region", "feature"].includes(n.type))
        continue;
      const fmt = formatForEntity(n.type);
      push({
        title:
          fmt === "comparison"
            ? `Kloudbean vs ${n.label}: the honest take`
            : `${n.label} on Kloudbean — how it works`,
        topic: n.label,
        format: fmt,
        angle: `Explain ${n.label} and how Kloudbean hosts/runs it. Keep it concrete and accurate.`,
        cluster_id: n.cluster_id,
        source: "kg-entity",
      });
    }
  } catch {
    /* graph optional */
  }

  // Fallback evergreen ideas if the graph is empty.
  if (!ideas.length) {
    const evergreen: { title: string; topic: string; format: ReelFormat }[] = [
      {
        title: "What is managed cloud hosting? (explained in 45s)",
        topic: "managed cloud hosting",
        format: "explainer",
      },
      {
        title: "How a load balancer keeps your app online",
        topic: "load balancer",
        format: "how_it_works",
      },
      { title: "Deploy an AI app in 60 seconds", topic: "deploy ai app", format: "how_it_works" },
      {
        title: "Cloud egress fees, explained (why your bill exploded)",
        topic: "cloud egress costs",
        format: "educational",
      },
    ];
    for (const e of evergreen) {
      push({
        title: e.title,
        topic: e.topic,
        format: e.format,
        angle: "Educational explainer that resolves to hosting it on Kloudbean.",
        source: "evergreen",
      });
    }
  }

  return ideas.slice(0, limit);
}
