/**
 * Generate src/lib/studio-content.ts from the local studios so the in-app Media
 * Studio (/studio) mirrors the FULL library the CLI studios produce:
 *   - social-studio/content.mjs  -> every social post (card + caption)
 *   - video-studio/ideas.mjs     -> every explainer video script (beats)
 *
 * The app never imports the sibling studio folders at build/runtime; it only
 * imports the generated .ts. This script is the (dev-time) bridge, so there's a
 * single source of truth for the content and no cross-folder coupling ships.
 *
 * Run:  npm run gen:studio   (or: node scripts/gen-studio-content.mjs)
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { VIDEOS } from "../video-studio/ideas.mjs";
import { POSTS } from "../social-studio/content.mjs";

// ── Allowed unions (must match the exported TS types below) ────────────────────
const ICP_IDS = [
  "vibecoder", "saas_founder", "ai_agency", "freelance_dev", "wp_agency", "enterprise_gov", "general",
];
const SCENE_KINDS = [
  "deploy", "network", "speed", "database", "security", "cost",
  "compare", "cdn", "scale", "code", "cloud", "ai", "wordpress", "generic",
];

// ── Brand maps (canonical — kept in sync with the studios' brand kit) ──────────
const ICP_NAMES = {
  vibecoder: "Vibecoders / AI builders",
  saas_founder: "SaaS founders",
  ai_agency: "AI / dev agencies",
  freelance_dev: "Freelance developers",
  wp_agency: "WordPress / agencies",
  enterprise_gov: "Enterprise / gov (KSA)",
  general: "Kloudbean",
};
// Brand-approved accents only (Primary Purple lightened for on-navy contrast).
const ACCENT = {
  vibecoder: { c: "#7C5CFF", glow: "#4F1AF3" },
  saas_founder: { c: "#40B75F", glow: "#40B75F" },
  ai_agency: { c: "#7C5CFF", glow: "#4F1AF3" },
  freelance_dev: { c: "#40B75F", glow: "#40B75F" },
  wp_agency: { c: "#7C5CFF", glow: "#4F1AF3" },
  enterprise_gov: { c: "#E4B32F", glow: "#E4B32F" },
  general: { c: "#7C5CFF", glow: "#4F1AF3" },
};
const EYEBROW = {
  vibecoder: "For AI builders",
  saas_founder: "For SaaS founders",
  ai_agency: "For agencies",
  freelance_dev: "For freelance devs",
  wp_agency: "For WordPress teams",
  enterprise_gov: "Enterprise · KSA",
  general: "Managed cloud",
};

// ── Validation helpers ─────────────────────────────────────────────────────────
const errors = [];
function checkIcp(icp, where) {
  if (!ICP_IDS.includes(icp)) errors.push(`${where}: unknown icp "${icp}"`);
}
function checkScene(scene, where) {
  if (!SCENE_KINDS.includes(scene)) errors.push(`${where}: unknown scene "${scene}"`);
}

// ── Map social posts -> SocialPost[] ───────────────────────────────────────────
const social = POSTS.map((p, i) => {
  const id = `s${String(i + 1).padStart(3, "0")}`;
  checkIcp(p.icp, `social ${id}`);
  checkScene(p.scene, `social ${id}`);
  return {
    id,
    icp: p.icp,
    scene: p.scene,
    platform: p.platform ?? "any",
    headline: p.headline,
    caption: p.caption,
    tags: p.tags ?? [],
  };
});

// ── Map video scripts -> VideoScript[] ─────────────────────────────────────────
const videos = VIDEOS.map((v, i) => {
  const id = `v${String(i + 1).padStart(2, "0")}`;
  checkIcp(v.icp, `video ${id}`);
  const beats = (v.beats ?? []).map((b, bi) => {
    checkScene(b.scene, `video ${id} beat ${bi + 1}`);
    return { dur: b.dur, on_screen: b.on_screen, narration: b.narration, scene: b.scene };
  });
  return {
    id,
    icp: v.icp,
    title: v.title,
    ...(v.hook ? { hook: v.hook } : {}),
    cta: v.cta ?? "Start free at kloudbean.com",
    beats,
  };
});

if (errors.length) {
  console.error("gen-studio-content: content drift detected —");
  for (const e of errors) console.error("  - " + e);
  console.error("Fix the source (ideas.mjs / content.mjs) or extend the TS unions, then re-run.");
  process.exit(1);
}

// ── Emit the TypeScript module ─────────────────────────────────────────────────
const J = (v) => JSON.stringify(v, null, 2);

const file = `/**
 * AUTO-GENERATED — do not edit by hand.
 * Source: social-studio/content.mjs + video-studio/ideas.mjs
 * Regenerate: npm run gen:studio  (node scripts/gen-studio-content.mjs)
 *
 * Full in-app mirror of the local studios so the Media Studio (/studio) shows the
 * ENTIRE library: ${social.length} social posts + ${videos.length} video scripts.
 * Grounded in Kloudbean's real capabilities + ICPs. No invented figures.
 */

export type IcpId =
  | "vibecoder"
  | "saas_founder"
  | "ai_agency"
  | "freelance_dev"
  | "wp_agency"
  | "enterprise_gov"
  | "general";

export type SceneKind =
  | "deploy" | "network" | "speed" | "database" | "security" | "cost"
  | "compare" | "cdn" | "scale" | "code" | "cloud" | "ai" | "wordpress" | "generic";

export type SocialPost = {
  id: string;
  icp: IcpId;
  scene: SceneKind;
  platform: string;
  headline: string; // \\n for line breaks (goes on the card)
  caption: string; // ready-to-paste copy
  tags: string[];
};

export type VideoBeat = { dur: number; on_screen: string; narration: string; scene: SceneKind };
export type VideoScript = {
  id: string;
  icp: IcpId;
  title: string;
  hook?: string;
  cta: string;
  /** Ready-to-paste post caption (dynamic/AI items set this; static ones derive it). */
  caption?: string;
  /** Hashtags without the # symbol. */
  tags?: string[];
  beats: VideoBeat[];
};

export const ICP_NAMES: Record<IcpId, string> = ${J(ICP_NAMES)};

/** Brand-approved accents only (Primary Purple lightened for on-navy contrast). */
export const ACCENT: Record<IcpId, { c: string; glow: string }> = ${J(ACCENT)};

export const EYEBROW: Record<IcpId, string> = ${J(EYEBROW)};

export const SOCIAL_POSTS: SocialPost[] = ${J(social)};

export const VIDEO_SCRIPTS: VideoScript[] = ${J(videos)};
`;

const outPath = fileURLToPath(new URL("../src/lib/studio-content.ts", import.meta.url));
writeFileSync(outPath, file);

// ── Summary ─────────────────────────────────────────────────────────────────────
const byIcp = (arr) =>
  ICP_IDS.map((id) => `${id}:${arr.filter((x) => x.icp === id).length}`).join("  ");
console.log(`gen-studio-content: wrote ${outPath}`);
console.log(`  social posts : ${social.length}   (${byIcp(social)})`);
console.log(`  video scripts: ${videos.length}   (${byIcp(videos)})`);
