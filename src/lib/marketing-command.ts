import "@tanstack/react-start/server-only";
import { generateText } from "ai";
import { createAiProvider } from "./ai-provider";
import { KLOUDBEAN_PROMPT_CORE } from "./kloudbean-scope";

/**
 * MARKETING COMMAND LAYER — "one prompt, marketing handled."
 *
 * Turns a plain-English marketing request into a grounded, in-scope PLAN of
 * typed steps, then fans those steps out onto the existing durable job queue so
 * they run server-side (survive a closed tab) using the engine's real
 * generators. Nothing here reimplements generation — it orchestrates:
 *   create_article   -> research + brief + multi-pass content (ai.functions)
 *   generate_social  -> studio-engine social posts
 *   generate_video   -> studio-engine video scripts
 *   hero_image       -> image-generator
 *
 * Publishing is NEVER auto: created articles land in the review pipeline, and
 * social/video are drafts. The planner refuses out-of-scope asks (ads, CRM,
 * email/WhatsApp blasts, bookings) rather than pretending Kloudbean does them.
 */

export type PlanStepType =
  | "create_article"
  | "generate_social"
  | "generate_video"
  | "hero_image"
  | "post_social"
  | "send_email";

export type PlanStep = {
  type: PlanStepType;
  title: string;
  topic: string;
  keyword?: string;
  count?: number;
  geo?: string;
  /** Target channel for post_social (e.g. "linkedin", "x", "facebook"). */
  channel?: string;
};

/** Steps that can transmit externally (post publicly / email people). */
export const ACTING_STEP_TYPES: PlanStepType[] = ["post_social", "send_email"];
export function isActingStep(t: PlanStepType): boolean {
  return ACTING_STEP_TYPES.includes(t);
}

export type MarketingPlan = {
  summary: string;
  steps: PlanStep[];
  outOfScope: { request: string; reason: string }[];
};

const STEP_TYPES: PlanStepType[] = [
  "create_article",
  "generate_social",
  "generate_video",
  "hero_image",
  "post_social",
  "send_email",
];

/** Map a plan step type to its durable job type. */
export function jobTypeForStep(t: PlanStepType): string {
  return (
    {
      create_article: "mc_create_article",
      generate_social: "mc_generate_social",
      generate_video: "mc_generate_video",
      hero_image: "mc_hero_image",
      post_social: "mc_post_social",
      send_email: "mc_send_email",
    } as const
  )[t];
}

const PLANNER_SYSTEM = `You are the marketing operations planner for Kloudbean's in-house AI content engine. A teammate types a plain-English marketing request. You turn it into a concrete PLAN of executable steps that THIS engine can actually perform, and you honestly flag anything it cannot do.

WHAT THIS ENGINE CAN DO (the ONLY allowed step types):
- "create_article": research a topic, write a full SEO/GEO article grounded in Kloudbean's real facts, and place it in the review pipeline (a human approves before it publishes). Use for "write/publish an article/blog/guide/comparison about X".
- "generate_social": DRAFT on-brand social posts (not posted). Use for "make/draft social posts about X" when the user does NOT ask to actually publish them.
- "generate_video": generate short video / reel script drafts. Use for "make a video/reel about X".
- "hero_image": generate a branded hero image for a topic.
- "post_social": compose AND actually publish a social post to a channel. Use ONLY when the user explicitly says to post/publish/share to social (e.g. "post it on LinkedIn", "share this on X"). Set "channel" (linkedin | x | facebook). Emit one step per channel.
- "send_email": compose AND actually send a marketing email to the configured list. Use ONLY when the user explicitly says to email/send to the list/newsletter.

IMPORTANT ABOUT ACTING STEPS (post_social, send_email): these transmit publicly. They are safe to include when asked, because the system runs them in DRY-RUN (simulated) unless the owner has separately armed live sending. So honor an explicit "post it / email it" with the right acting step; do not refuse it and do not move it to outOfScope.

WHAT IT CANNOT DO (put these in outOfScope with a short honest reason, do NOT invent a step):
- Paid ads (Google/Meta), WhatsApp/SMS campaigns, CRM, bookings/scheduling, or live two-way customer replies. This engine does SEO content, social, visuals, and email broadcasts only.

RULES:
- Break the request into 1 to 6 steps. Prefer the smallest plan that satisfies the intent.
- Every step needs a specific "topic" (the concrete subject, e.g. "managed PostgreSQL hosting", not "databases"). Infer a good "keyword" for articles. For social/video, set "count" (default 4, max 10).
- Only use post_social / send_email when the user clearly asks to publish/send. If they just say "make/draft", use generate_social.
- Stay on Kloudbean's real capabilities and honesty guardrails. Never propose content that overclaims (no "certified", no invented benchmarks, no client names).
- "geo" is optional; only set it if the request names a market (e.g. "sa" for Saudi Arabia, else omit).
- Write a one-sentence "summary" of what the plan will do.

Return ONLY strict JSON, no markdown fences, matching:
{
  "summary": "string",
  "steps": [{ "type": "create_article|generate_social|generate_video|hero_image|post_social|send_email", "title": "short human label", "topic": "string", "keyword": "string (articles only)", "count": 4, "channel": "linkedin (post_social only)", "geo": "sa" }],
  "outOfScope": [{ "request": "the part we can't do", "reason": "why" }]
}`;

/** Strip code fences and isolate the outermost JSON object. */
function extractJson(text: string): unknown {
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("no JSON object in model output");
  return JSON.parse(t.slice(first, last + 1));
}

function normalizePlan(raw: unknown, prompt: string): MarketingPlan {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const rawSteps = Array.isArray(obj.steps) ? obj.steps : [];
  const steps: PlanStep[] = [];
  for (const s of rawSteps.slice(0, 6)) {
    const step = (s ?? {}) as Record<string, unknown>;
    const type = String(step.type ?? "") as PlanStepType;
    if (!STEP_TYPES.includes(type)) continue;
    const topic = String(step.topic ?? "").trim();
    if (!topic) continue;
    const isContent = type === "generate_social" || type === "generate_video";
    const rawChannel = step.channel ? String(step.channel).toLowerCase().trim() : "";
    const channel = type === "post_social" ? (rawChannel || "linkedin").slice(0, 20) : undefined;
    steps.push({
      type,
      topic,
      title: String(step.title ?? topic).slice(0, 100),
      keyword: step.keyword ? String(step.keyword).slice(0, 120) : undefined,
      count: isContent ? Math.min(10, Math.max(1, Number(step.count) || 4)) : undefined,
      channel,
      geo: step.geo ? String(step.geo).slice(0, 8) : undefined,
    });
  }
  const outRaw = Array.isArray(obj.outOfScope) ? obj.outOfScope : [];
  const outOfScope = outRaw.slice(0, 6).map((o) => {
    const r = (o ?? {}) as Record<string, unknown>;
    return { request: String(r.request ?? "").slice(0, 140), reason: String(r.reason ?? "").slice(0, 200) };
  }).filter((o) => o.request);

  return {
    summary: String(obj.summary ?? "").slice(0, 200) || `Plan for: ${prompt.slice(0, 120)}`,
    steps,
    outOfScope,
  };
}

/** Ask the model to turn a request into a grounded, in-scope plan. Degrades to a single article step. */
export async function planMarketingCommand(prompt: string): Promise<MarketingPlan> {
  const clean = prompt.trim().slice(0, 1000);
  if (!clean) return { summary: "Nothing to plan.", steps: [], outOfScope: [] };

  try {
    const model = createAiProvider();
    const { text } = await generateText({
      model,
      system: `${PLANNER_SYSTEM}\n\nKLOUDBEAN CONTEXT (ground every step in this, never contradict it):\n${KLOUDBEAN_PROMPT_CORE}`,
      prompt: `Marketing request:\n"""${clean}"""\n\nReturn the JSON plan now.`,
      temperature: 0.2,
    });
    const plan = normalizePlan(extractJson(text), clean);
    // If the model produced no runnable steps and nothing out of scope, fall back.
    if (!plan.steps.length && !plan.outOfScope.length) {
      return fallbackPlan(clean);
    }
    return plan;
  } catch {
    return fallbackPlan(clean);
  }
}

/** When AI is unavailable or returns junk: treat the request as one article topic. */
function fallbackPlan(prompt: string): MarketingPlan {
  const topic = prompt.replace(/^(write|create|make|do|publish)\s+(an?\s+)?(article|blog|post|guide)\s+(about|on|for)\s+/i, "").trim() || prompt;
  return {
    summary: `Write an article about "${topic.slice(0, 80)}".`,
    steps: [{ type: "create_article", title: `Article: ${topic.slice(0, 60)}`, topic, keyword: topic }],
    outOfScope: [],
  };
}

/**
 * Enqueue an approved plan: one durable job per step under a single batch, plus
 * a process_run for a live activity log. Returns identifiers the UI polls.
 */
export async function enqueueMarketingPlan(
  prompt: string,
  plan: MarketingPlan,
): Promise<{ ok: boolean; runId: string; batchId: string; steps: number; error?: string }> {
  if (!plan.steps.length) {
    return { ok: false, runId: "", batchId: "", steps: 0, error: "This plan has no runnable steps." };
  }
  const { randomUUID } = await import("node:crypto");
  const runs = await import("@/server/db/repos/process-runs");
  const jobsRepo = await import("@/server/db/repos/jobs");

  const label = plan.summary.slice(0, 100);
  const run = await runs.createProcessRun({
    kind: "marketing_command",
    label,
    total: plan.steps.length,
    input: { prompt, plan },
  });
  const batchId = randomUUID();

  await jobsRepo.enqueueJobs(
    plan.steps.map((step) => ({
      type: jobTypeForStep(step.type),
      payload: { ...step, runId: run.id },
      label: step.title,
    })),
    { batchId, batchLabel: label },
  );

  await runs.appendProcessLog(run.id, `Command accepted — ${plan.steps.length} step(s) queued.`, "info");

  // Kick the always-on drainer so work starts immediately.
  try {
    const { ensureJobRunner } = await import("./job-runner");
    ensureJobRunner();
  } catch {
    /* best-effort */
  }

  return { ok: true, runId: run.id, batchId, steps: plan.steps.length };
}

/** Append a step outcome to the command's process run (best-effort). Used by the job processor. */
export async function marketingCommandLog(
  runId: string | undefined,
  message: string,
  level: "info" | "success" | "warn" | "error" = "info",
  countCompleted = true,
): Promise<void> {
  if (!runId) return;
  try {
    const runs = await import("@/server/db/repos/process-runs");
    await runs.appendProcessLog(runId, message, level, countCompleted ? { completed: 1 } : undefined);
  } catch {
    /* logging must never break a job */
  }
}
