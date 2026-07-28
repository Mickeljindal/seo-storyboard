import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { ACCENT, EYEBROW, ICP_NAMES, type VideoScript } from "@/lib/studio-content";
import { KbLogo, SceneMotif } from "./BrandScenes";
import { ScaledStage } from "./ScaledStage";

export type VideoFormat = "reel" | "youtube";

/**
 * Brand-consistent animated storyboard, matching video-studio/template.mjs.
 * Two formats: youtube (16:9, text left / motif right) and reel (9:16, stacked).
 * Autoplays through the beats; optional voiceover via the browser SpeechSynthesis
 * API (a real spoken preview in the dashboard — the exported MP4s bake in TTS
 * via the local studio).
 */
export function BrandStoryboard({ script, format, poster = false }: { script: VideoScript; format: VideoFormat; poster?: boolean }) {
  const [w, h] = format === "reel" ? [1080, 1920] : [1920, 1080];
  const vertical = format === "reel";
  const a = ACCENT[script.icp];
  const beats = script.beats;
  const n = beats.length;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(!poster);
  const [voiceOn, setVoiceOn] = useState(false);

  useEffect(() => {
    setIndex(0);
    setPlaying(!poster);
  }, [script, format, poster]);

  // Voiceover: speak the active beat's narration (browser TTS).
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    if (!playing || !voiceOn) {
      synth.cancel();
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(beats[index]?.narration ?? "");
    u.rate = 1;
    synth.speak(u);
    return () => synth.cancel();
  }, [index, playing, voiceOn, beats]);

  const b = beats[index];
  const durMs = Math.max(1500, (b?.dur ?? 4) * 1000);
  const next = () => setIndex((i) => (i + 1) % n);
  const prev = () => setIndex((i) => (i - 1 + n) % n);
  const hlSize = (b?.on_screen.length ?? 0) > 46 ? (vertical ? 56 : 60) : (b?.on_screen.length ?? 0) > 28 ? (vertical ? 62 : 72) : (vertical ? 74 : 84);
  const isLast = index === n - 1;

  return (
    <div>
      <ScaledStage w={w} h={h} radius={14}>
        <div style={{ position: "absolute", inset: 0, background: "#000f27", color: "#fff", fontFamily: "Poppins, sans-serif", ["--acc" as string]: a.c }}>
          {/* background */}
          <div style={{ position: "absolute", width: 900, height: 900, right: -180, top: -260, borderRadius: "50%", background: `radial-gradient(closest-side, ${a.glow}55, transparent 70%)`, filter: "blur(26px)" }} />
          <div style={{ position: "absolute", width: 760, height: 760, left: -220, bottom: -280, borderRadius: "50%", background: "radial-gradient(closest-side, #4F1AF340, transparent 70%)", filter: "blur(26px)" }} />
          <div style={{ position: "absolute", inset: 0, opacity: 0.4, backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)", backgroundSize: "64px 64px", WebkitMaskImage: "radial-gradient(120% 100% at 78% 12%, #000 20%, transparent 76%)", maskImage: "radial-gradient(120% 100% at 78% 12%, #000 20%, transparent 76%)" }} />
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 280px 80px rgba(0,5,18,.6)" }} />

          {/* progress */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", gap: 6, padding: "14px 18px 0" }}>
            {beats.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 5, background: "rgba(255,255,255,.24)", borderRadius: 99, overflow: "hidden" }}>
                {i < index && <div style={{ height: "100%", width: "100%", background: "#fff", borderRadius: 99 }} />}
                {i === index && (
                  <div
                    key={`bar-${index}`}
                    className="rs-progressbar"
                    style={{ animationDuration: `${durMs}ms`, animationPlayState: playing ? "running" : "paused" }}
                    onAnimationEnd={next}
                  />
                )}
              </div>
            ))}
          </div>

          {/* topbar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, display: "flex", alignItems: "center", padding: vertical ? "40px 48px" : "48px 64px" }}>
            <KbLogo height={vertical ? 40 : 46} />
            <div style={{ marginLeft: "auto", fontSize: vertical ? 22 : 24, fontWeight: 500, color: "#cdd6f4", border: "1px solid #ffffff26", background: "#ffffff0d", padding: "9px 22px", borderRadius: 999 }}>
              {ICP_NAMES[script.icp]}
            </div>
          </div>

          {/* beat (keyed so entrance + motif replay each beat) */}
          <div
            key={index}
            style={{
              position: "absolute", inset: 0, zIndex: 10, display: "flex",
              flexDirection: vertical ? "column-reverse" : "row",
              alignItems: "center", padding: vertical ? "150px 64px" : "0 64px 0 88px",
            }}
          >
            <div style={{ flex: vertical ? "0 0 auto" : "1.12", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: vertical ? "center" : "left", alignItems: vertical ? "center" : "flex-start" }}>
              <div className="rs-textin" style={{ display: "flex", alignItems: "center", gap: 16, color: a.c, fontWeight: 600, fontSize: vertical ? 22 : 24, letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 26 }}>
                <span style={{ width: 46, height: 3, background: a.c, borderRadius: 3 }} />
                {EYEBROW[script.icp]}
              </div>
              <h1 className="rs-textin" style={{ fontWeight: 700, fontSize: hlSize, lineHeight: 1.06, letterSpacing: "-.02em", color: "#fff", maxWidth: vertical ? "100%" : 980, animationDelay: "60ms" }}>
                {b?.on_screen}
              </h1>
              <div className="rs-textin" style={{ marginTop: vertical ? 24 : 30, fontSize: vertical ? 28 : 30, lineHeight: 1.45, color: "#aeb6d4", fontWeight: 400, maxWidth: vertical ? "100%" : 820, animationDelay: "140ms" }}>
                {b?.narration}
              </div>
              {isLast && script.cta && (
                <div className="rs-textin" style={{ marginTop: 36, alignSelf: vertical ? "center" : "flex-start", background: "linear-gradient(135deg,#4F1AF3,#6c47ff)", color: "#fff", fontWeight: 700, fontSize: 30, padding: "16px 32px", borderRadius: 999, animationDelay: "260ms" }}>
                  {script.cta}
                </div>
              )}
            </div>
            <div style={{ flex: vertical ? "0 0 auto" : ".88", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: vertical ? 40 : 0 }}>
              <div style={{ position: "relative", width: vertical ? 440 : 520, height: vertical ? 440 : 520, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", width: "78%", height: "78%", borderRadius: "50%", background: `radial-gradient(closest-side, ${a.glow}3d, transparent 72%)`, filter: "blur(10px)" }} />
                <svg viewBox="0 0 100 100" style={{ position: "relative", width: "88%", height: "88%", overflow: "visible" }}>
                  <SceneMotif kind={b?.scene ?? "generic"} />
                </svg>
              </div>
            </div>
          </div>

          {/* footer */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 20, display: "flex", alignItems: "center", padding: vertical ? "40px 48px" : "44px 64px", color: "#cdd6f4" }}>
            <div style={{ fontSize: vertical ? 22 : 25, fontWeight: 500 }}>@kloudbean</div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: vertical ? 22 : 25, fontWeight: 600, color: "#fff" }}>
              <span style={{ color: a.c }}>→</span> kloudbean.com
            </div>
          </div>
        </div>
      </ScaledStage>

      {/* controls */}
      {poster ? null : (
      <div className="mt-3 flex items-center gap-2">
        <button onClick={prev} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" title="Previous beat">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => setPlaying((v) => !v)} className="rounded-full p-2.5 text-white" style={{ background: "var(--gradient-brand)" }} title={playing ? "Pause" : "Play"}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button onClick={() => { setIndex(0); setPlaying(true); }} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" title="Restart">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button onClick={next} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" title="Next beat">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => setVoiceOn((v) => !v)}
          className={`ml-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${voiceOn ? "border-[var(--lime)]/40 text-[var(--lime)]" : "border-border text-muted-foreground hover:text-foreground"}`}
          title="Toggle spoken voiceover (browser text-to-speech)"
        >
          {voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          Voiceover
        </button>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {index + 1}/{n} · {format === "reel" ? "9:16" : "16:9"}
        </span>
      </div>
      )}
    </div>
  );
}
