/**
 * Builds a 1080x1080 branded social card (HTML) for one post, reusing the same
 * animated scene visuals as the video studio (../video-studio/scenes.mjs) so
 * the video + social look is one consistent system. Also builds the caption
 * text that goes with each post.
 */
import { PALETTE, SCENE_KINDS, sceneMarkup, SCENE_CSS } from "../video-studio/scenes.mjs";
import { ICP_NAMES } from "./content.mjs";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function slugify(s) {
  return String(s)
    .replace(/\n/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** The ready-to-paste caption: post copy + a hashtag line. */
export function buildCaption(post) {
  const tags = (post.tags ?? []).map((t) => `#${t.replace(/^#/, "")}`).join(" ");
  const parts = [post.caption.trim()];
  if (tags) parts.push("", tags);
  return parts.join("\n") + "\n";
}

const DIMS = { square: [1080, 1080], portrait: [1080, 1350], wide: [1200, 630] };

export function buildPostHtml(post, shape = "square") {
  const [w, h] = DIMS[shape] ?? DIMS.square;
  const kind = SCENE_KINDS.includes(post.scene) ? post.scene : "generic";
  const headline = esc(post.headline).replace(/\n/g, "<br>");
  const badge = esc(ICP_NAMES[post.icp] ?? "Kloudbean");
  const hlSize = post.headline.length > 42 ? 66 : 84;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${esc(post.headline).replace(/<br>/g, " ")} — Kloudbean</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#05060f}
  #card{position:relative;width:${w}px;height:${h}px;overflow:hidden;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  ${SCENE_CSS}
  .scrim{position:absolute;inset:0;background:
    linear-gradient(180deg, rgba(5,6,15,.35), rgba(5,6,15,.15) 32%, rgba(5,6,15,.35) 60%, rgba(5,6,15,.82))}
  .top{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:16px;padding:48px 56px;z-index:5}
  .brand{display:flex;align-items:center;gap:14px;color:#fff;font-weight:800;font-size:34px;letter-spacing:-.01em}
  .brand .dot{width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,#4F1AF3,#6c47ff);box-shadow:0 0 22px #6c47ff}
  .badge{margin-left:auto;color:#fff;font-size:24px;font-weight:600;background:rgba(255,255,255,.14);
    padding:9px 20px;border-radius:999px}
  .headline{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);
    padding:0 64px;z-index:5;color:#fff;font-weight:800;line-height:1.06;letter-spacing:-.02em;
    font-size:${hlSize}px;text-shadow:0 6px 34px rgba(0,0,0,.5);text-wrap:balance}
  .bottom{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;
    padding:44px 56px;z-index:5;color:#fff}
  .handle{font-size:28px;font-weight:600;opacity:.92}
  .cta{margin-left:auto;font-size:26px;font-weight:700;color:#fff;
    background:linear-gradient(135deg,#4F1AF3,#6c47ff);padding:12px 26px;border-radius:999px;
    box-shadow:0 16px 40px -12px rgba(79,26,243,.7)}
</style></head>
<body>
  <div id="card">
    ${sceneMarkup(kind)}
    <div class="scrim"></div>
    <div class="top">
      <div class="brand"><span class="dot"></span>Kloudbean</div>
      <div class="badge">${badge}</div>
    </div>
    <div class="headline">${headline}</div>
    <div class="bottom">
      <div class="handle">@kloudbean</div>
      <div class="cta">kloudbean.com</div>
    </div>
  </div>
</body></html>`;
}
