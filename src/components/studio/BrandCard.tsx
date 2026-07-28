import { Fragment } from "react";
import { ACCENT, EYEBROW, ICP_NAMES, type SocialPost } from "@/lib/studio-content";
import { KbLogo, SceneMotif } from "./BrandScenes";
import { ScaledStage } from "./ScaledStage";

function subline(caption: string) {
  const first = caption.split(/(?<=[.!?])\s/)[0].trim();
  if (!first || first.length < 12) return "";
  return first.length > 104 ? first.slice(0, 101).trim() + "…" : first;
}

/** 1080×1080 brand social card (matches social-studio/card.mjs), responsive. */
export function BrandCard({ post, radius = 14 }: { post: SocialPost; radius?: number }) {
  const a = ACCENT[post.icp];
  const lines = post.headline.split("\n");
  const flat = post.headline.replace(/\n/g, " ");
  const hlSize = flat.length > 46 ? 68 : flat.length > 30 ? 82 : 94;
  const sub = subline(post.caption);

  return (
    <ScaledStage w={1080} h={1080} radius={radius}>
      <div style={{ position: "absolute", inset: 0, background: "#000f27", color: "#fff", fontFamily: "Poppins, sans-serif", ["--acc" as string]: a.c }}>
        {/* background */}
        <div style={{ position: "absolute", width: 820, height: 820, right: -160, top: -220, borderRadius: "50%", background: `radial-gradient(closest-side, ${a.glow}55, transparent 70%)`, filter: "blur(24px)" }} />
        <div style={{ position: "absolute", width: 720, height: 720, left: -200, bottom: -260, borderRadius: "50%", background: "radial-gradient(closest-side, #4F1AF345, transparent 70%)", filter: "blur(24px)" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.45, backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)", backgroundSize: "60px 60px", WebkitMaskImage: "radial-gradient(120% 90% at 72% 12%, #000 20%, transparent 78%)", maskImage: "radial-gradient(120% 90% at 72% 12%, #000 20%, transparent 78%)" }} />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 260px 70px rgba(0,5,18,.6)" }} />
        {/* faint corner motif */}
        <svg viewBox="0 0 100 100" style={{ position: "absolute", right: -70, bottom: -90, width: 520, height: 520, opacity: 0.06, overflow: "visible" }}>
          <SceneMotif kind={post.scene} />
        </svg>

        <div style={{ position: "absolute", inset: 0, padding: "84px 88px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <KbLogo height={44} />
            <div style={{ marginLeft: "auto", fontSize: 22, fontWeight: 500, color: "#cdd6f4", border: "1px solid #ffffff26", background: "#ffffff0d", padding: "9px 20px", borderRadius: 999 }}>
              {ICP_NAMES[post.icp]}
            </div>
          </div>
          <div style={{ marginTop: "auto", marginBottom: "auto", maxWidth: 850 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, color: a.c, fontWeight: 600, fontSize: 23, letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 26 }}>
              <span style={{ width: 46, height: 3, background: a.c, borderRadius: 3 }} />
              {EYEBROW[post.icp]}
            </div>
            <div style={{ fontWeight: 700, fontSize: hlSize, lineHeight: 1.08, letterSpacing: "-.02em", color: "#fff" }}>
              {lines.map((l, i) => (
                <Fragment key={i}>
                  {l}
                  {i < lines.length - 1 && <br />}
                </Fragment>
              ))}
            </div>
            {sub && <div style={{ marginTop: 28, fontSize: 29, lineHeight: 1.45, color: "#aeb6d4", fontWeight: 400, maxWidth: 770 }}>{sub}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", paddingTop: 26, borderTop: "1px solid #ffffff1f" }}>
            <div style={{ fontSize: 25, fontWeight: 500, color: "#cdd6f4" }}>@kloudbean</div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 25, fontWeight: 600 }}>
              <span style={{ color: a.c }}>→</span> kloudbean.com
            </div>
          </div>
        </div>
      </div>
    </ScaledStage>
  );
}
