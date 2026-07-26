import { useEffect, useMemo, useState } from "react";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * REEL STORYBOARD — an animated 9:16 preview that PLAYS a reel's beats so you
 * can watch the idea instead of reading it. Each beat is turned into an
 * animated "scene" (deploy / network / speed / database / security / cost /
 * comparison / CDN / scale / code / cloud / AI) chosen from the beat's own
 * on-screen text + visual prompt. Story-style segmented progress, autoplay +
 * loop, tap-to-navigate, and a clickable scene strip.
 *
 * Pure front-end + CSS (keyframes live in styles.css, rs-* prefixed). No video
 * is generated here — this demonstrates the shot flow, timing and message so
 * you can judge/refine a reel before sending the prompts to Sora/Veo.
 */

export type StoryBeat = {
  seconds: string;
  narration: string;
  on_screen: string;
  visual_prompt: string;
};

type SceneKind =
  | "deploy"
  | "network"
  | "speed"
  | "database"
  | "security"
  | "cost"
  | "compare"
  | "cdn"
  | "scale"
  | "code"
  | "cloud"
  | "ai"
  | "generic";

const PALETTE: Record<SceneKind, { from: string; to: string; accent: string; label: string }> = {
  deploy: { from: "#4F1AF3", to: "#ec4899", accent: "#f9a8d4", label: "Deploy" },
  network: { from: "#2563eb", to: "#6c47ff", accent: "#93c5fd", label: "Network" },
  speed: { from: "#0d9488", to: "#40B75F", accent: "#6ee7b7", label: "Speed" },
  database: { from: "#4338ca", to: "#6c47ff", accent: "#c4b5fd", label: "Data" },
  security: { from: "#0e7490", to: "#40B75F", accent: "#5eead4", label: "Security" },
  cost: { from: "#b45309", to: "#6c47ff", accent: "#fcd34d", label: "Cost" },
  compare: { from: "#6c47ff", to: "#2563eb", accent: "#a5b4fc", label: "Compare" },
  cdn: { from: "#0284c7", to: "#22d3ee", accent: "#67e8f9", label: "Global CDN" },
  scale: { from: "#7c3aed", to: "#ec4899", accent: "#d8b4fe", label: "Scale" },
  code: { from: "#334155", to: "#6c47ff", accent: "#a5b4fc", label: "Code" },
  cloud: { from: "#0ea5e9", to: "#6c47ff", accent: "#bae6fd", label: "Cloud" },
  ai: { from: "#a21caf", to: "#7c3aed", accent: "#f0abfc", label: "AI" },
  generic: { from: "#4F1AF3", to: "#6c47ff", accent: "#c4b5fd", label: "Kloudbean" },
};

/** Choose a scene kind from a beat's text (on-screen + visual prompt + narration). */
export function pickScene(text: string): SceneKind {
  const t = (text || "").toLowerCase();
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  if (has("vs", "versus", "compar", "alternative", "better than", "head-to-head")) return "compare";
  if (has("deploy", "ship", "launch", "rocket", "push live", "one click", "pipeline", "ci/cd"))
    return "deploy";
  if (has("secur", "ssl", "tls", "encrypt", "firewall", "ddos", "protect", "lock", "vulnerab"))
    return "security";
  if (has("cdn", "edge", "global", "worldwide", "region", "geo", "nearest"))
    return "cdn";
  if (has("speed", "fast", "latency", "millisecond", "performance", "faster", "cache", "optimi"))
    return "speed";
  if (has("scale", "autoscal", "spike", "replica", "traffic surge", "grow", "container", "pods"))
    return "scale";
  if (has("cost", "price", "bill", "cheap", "save money", "egress", "budget", "expensive"))
    return "cost";
  if (has("database", "postgres", "mysql", "sql", "backup", "storage", "query", "table"))
    return "database";
  if (has("network", "load balanc", "traffic", "route", "request", "dns", "node", "packet"))
    return "network";
  if (has("ai", "ml", "model", "gpu", "inference", "llm", "gpt", "neural"))
    return "ai";
  if (has("code", "terminal", "command", "git", "function", "api", "script", "cli"))
    return "code";
  if (has("cloud", "server", "host", "vps", "infrastructure", "vm", "instance", "datacenter"))
    return "cloud";
  return "generic";
}

function beatMs(seconds: string, fallback = 3200): number {
  const m = String(seconds).match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
  if (m) {
    const d = Math.abs(parseFloat(m[2]) - parseFloat(m[1]));
    if (d > 0) return Math.min(9000, Math.max(1500, d * 1000));
  }
  const single = String(seconds).match(/(\d+(?:\.\d+)?)/);
  if (single) return Math.min(9000, Math.max(1500, parseFloat(single[1]) * 1000 || fallback));
  return fallback;
}

/* =========================================================================
 * Scene visuals — animated motifs. `poster` renders a lighter, still-ish
 * version for the small card thumbnails.
 * ========================================================================= */

function Backdrop({ kind }: { kind: SceneKind }) {
  const p = PALETTE[kind];
  return (
    <>
      <div className="rs-scene" style={{ background: `linear-gradient(150deg, ${p.from}, ${p.to})` }} />
      <div
        className="rs-bgblob"
        style={{ width: "70%", height: "40%", left: "-10%", top: "8%", background: p.accent, opacity: 0.25 }}
      />
      <div
        className="rs-bgblob"
        style={{ width: "60%", height: "38%", right: "-12%", bottom: "6%", background: "#fff", opacity: 0.12, animationDelay: "1.2s" }}
      />
      <div
        className="rs-scene"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.10) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(circle at 50% 45%, #000 30%, transparent 75%)",
          opacity: 0.5,
        }}
      />
    </>
  );
}

function SceneMotif({ kind, poster }: { kind: SceneKind; poster?: boolean }) {
  const p = PALETTE[kind];
  const a = p.accent;
  const anim = (cls: string) => (poster ? "" : cls);

  switch (kind) {
    case "deploy":
      return (
        <g>
          <g className={anim("rs-rise")} style={{ transformOrigin: "50% 50%" }}>
            <path d="M50 18 C61 30 61 52 50 64 C39 52 39 30 50 18 Z" fill="#fff" opacity="0.95" />
            <circle cx="50" cy="38" r="6" fill={p.from} />
            <path d="M43 60 L50 74 L57 60 Z" className={anim("rs-exhaust")} fill={a} />
          </g>
          {[20, 30, 72, 80].map((x, i) => (
            <circle key={i} className={anim("rs-float")} style={{ animationDelay: `${i * 0.4}s` }} cx={x} cy={20 + i * 12} r="1.6" fill="#fff" opacity="0.8" />
          ))}
        </g>
      );
    case "network":
      return (
        <g fill="none" stroke={a} strokeWidth="1.4">
          <g className={anim("rs-flow")} stroke="#fff" opacity="0.85">
            <line x1="50" y1="50" x2="22" y2="24" />
            <line x1="50" y1="50" x2="80" y2="26" />
            <line x1="50" y1="50" x2="24" y2="78" />
            <line x1="50" y1="50" x2="78" y2="76" />
          </g>
          <circle cx="50" cy="50" r="9" fill="#fff" stroke="none" className={anim("rs-pulse")} />
          {[[22, 24], [80, 26], [24, 78], [78, 76]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill={p.from} stroke="#fff" className={anim("rs-pulse")} style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </g>
      );
    case "speed":
      return (
        <g>
          <path d="M22 66 A30 30 0 0 1 78 66" fill="none" stroke="#fff" strokeWidth="6" opacity="0.35" strokeLinecap="round" />
          <path d="M22 66 A30 30 0 0 1 78 66" fill="none" stroke={a} strokeWidth="6" strokeLinecap="round" className={anim("rs-draw")} />
          <g className={anim("rs-needle")} style={{ transformOrigin: "50px 66px" }}>
            <line x1="50" y1="66" x2="50" y2="34" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </g>
          <circle cx="50" cy="66" r="4" fill="#fff" />
        </g>
      );
    case "database":
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i} className={anim("rs-stack")} style={{ animationDelay: `${i * 0.18}s`, transformOrigin: "50% 50%" }}>
              <ellipse cx="50" cy={34 + i * 14} rx="20" ry="6" fill="#fff" opacity={0.95 - i * 0.12} />
              <rect x="30" y={34 + i * 14} width="40" height="10" fill="#fff" opacity={0.6 - i * 0.1} />
            </g>
          ))}
          <circle className={anim("rs-ping")} cx="50" cy="34" r="8" fill="none" stroke={a} strokeWidth="2" />
        </g>
      );
    case "security":
      return (
        <g>
          <path d="M50 22 L72 32 V50 C72 64 62 74 50 78 C38 74 28 64 28 50 V32 Z" fill="#fff" opacity="0.95" className={anim("rs-float-slow")} />
          <rect x="43" y="46" width="14" height="12" rx="2" fill={p.from} />
          <path d="M46 46 V42 a4 4 0 0 1 8 0 V46" fill="none" stroke={p.from} strokeWidth="2" />
          <circle className={anim("rs-ping")} cx="50" cy="50" r="20" fill="none" stroke={a} strokeWidth="2" />
        </g>
      );
    case "cost":
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={26 + i * 13}
              y={30 + i * 8}
              width="9"
              height={44 - i * 8}
              rx="2"
              fill={i === 3 ? PALETTE.speed.accent : "#fff"}
              opacity={0.9}
              className={anim("rs-grow")}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
          <path d="M24 34 L74 58" stroke={PALETTE.speed.accent} strokeWidth="2.5" fill="none" className={anim("rs-draw")} />
        </g>
      );
    case "compare":
      return (
        <g>
          <rect x="24" y="30" width="20" height="44" rx="3" fill="#fff" opacity="0.35" />
          <rect x="24" y="46" width="20" height="28" rx="3" fill="#fff" className={anim("rs-grow")} />
          <rect x="56" y="20" width="20" height="54" rx="3" fill="#fff" opacity="0.35" />
          <rect x="56" y="26" width="20" height="48" rx="3" fill={a} className={anim("rs-grow")} style={{ animationDelay: "0.2s" }} />
          <text x="34" y="84" textAnchor="middle" fontSize="7" fill="#fff" opacity="0.8">A</text>
          <text x="66" y="84" textAnchor="middle" fontSize="7" fill="#fff">KB</text>
        </g>
      );
    case "cdn":
      return (
        <g>
          <circle cx="50" cy="50" r="24" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.6" />
          <ellipse cx="50" cy="50" rx="24" ry="9" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.4" />
          <ellipse cx="50" cy="50" rx="9" ry="24" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.4" />
          <g className={anim("rs-orbit")} style={{ transformOrigin: "50px 50px" }}>
            {[0, 120, 240].map((deg) => (
              <circle key={deg} cx={50 + 24 * Math.cos((deg * Math.PI) / 180)} cy={50 + 24 * Math.sin((deg * Math.PI) / 180)} r="3.5" fill={a} />
            ))}
          </g>
          <circle cx="50" cy="50" r="5" fill="#fff" className={anim("rs-pulse")} />
        </g>
      );
    case "scale":
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={24 + (i % 3) * 18}
              y={30 + Math.floor(i / 3) * 20}
              width="14"
              height="14"
              rx="3"
              fill="#fff"
              opacity="0.92"
              className={anim("rs-stack")}
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
          <circle className={anim("rs-ping")} cx="42" cy="44" r="10" fill="none" stroke={a} strokeWidth="2" />
        </g>
      );
    case "code":
      return (
        <g>
          <rect x="22" y="26" width="56" height="48" rx="4" fill="#0b1020" opacity="0.85" />
          <rect x="22" y="26" width="56" height="9" rx="4" fill="#fff" opacity="0.15" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="28" y={42 + i * 8} width={i === 3 ? 18 : 30 - i * 4} height="3" rx="1.5" fill={i === 3 ? a : "#fff"} opacity={i === 3 ? 1 : 0.7} className={anim("rs-textin")} style={{ animationDelay: `${i * 0.25}s` }} />
          ))}
          <rect x="47" y="66" width="4" height="4" fill={a} className={anim("rs-blink")} />
        </g>
      );
    case "cloud":
      return (
        <g>
          <g className={anim("rs-float-slow")}>
            <path d="M34 56 a12 12 0 0 1 2 -23 a16 16 0 0 1 30 4 a10 10 0 0 1 -2 19 Z" fill="#fff" opacity="0.96" />
          </g>
          {[38, 50, 62].map((x, i) => (
            <rect key={x} x={x - 4} y="60" width="8" height="12" rx="1.5" fill={a} className={anim("rs-float")} style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </g>
      );
    case "ai":
      return (
        <g>
          <g className={anim("rs-spin-slow")} style={{ transformOrigin: "50px 50px" }}>
            {[0, 60, 120].map((deg) => (
              <ellipse key={deg} cx="50" cy="50" rx="26" ry="10" fill="none" stroke="#fff" strokeWidth="1.3" opacity="0.55" transform={`rotate(${deg} 50 50)`} />
            ))}
          </g>
          <circle cx="50" cy="50" r="7" fill="#fff" className={anim("rs-pulse")} />
          {[[30, 30], [70, 32], [32, 70], [70, 68]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.6" fill={a} className={anim("rs-float")} style={{ animationDelay: `${i * 0.35}s` }} />
          ))}
        </g>
      );
    default:
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={34 + i * 16} cy={50} r={8 - i} fill="#fff" opacity={0.9 - i * 0.2} className={anim("rs-float")} style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
          <circle className={anim("rs-ping")} cx="50" cy="50" r="16" fill="none" stroke={a} strokeWidth="2" />
        </g>
      );
  }
}

/** A single animated scene filling its container (9:16 recommended). */
export function ReelScene({ kind, poster }: { kind: SceneKind; poster?: boolean }) {
  return (
    <div className="rs-scene">
      <Backdrop kind={kind} />
      <svg viewBox="0 0 100 100" className="rs-scene" preserveAspectRatio="xMidYMid meet" style={{ padding: "18%" }}>
        <SceneMotif kind={kind} poster={poster} />
      </svg>
    </div>
  );
}

/** Small still-ish scene poster for cards (first meaningful beat). */
export function ReelScenePoster({ beats, className }: { beats: StoryBeat[] | null; className?: string }) {
  const kind = useMemo(() => {
    const b = beats?.find((x) => (x.on_screen || x.visual_prompt)?.trim()) ?? beats?.[0];
    return pickScene(`${b?.on_screen ?? ""} ${b?.visual_prompt ?? ""} ${b?.narration ?? ""}`);
  }, [beats]);
  return (
    <div className={`relative overflow-hidden rounded-md ${className ?? ""}`}>
      <ReelScene kind={kind} poster />
    </div>
  );
}

/* =========================================================================
 * Player
 * ========================================================================= */

export function ReelStoryboard({
  beats,
  hook,
  formatLabel,
}: {
  beats: StoryBeat[] | null | undefined;
  hook?: string | null;
  formatLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const list = beats ?? [];
  const n = list.length;

  useEffect(() => {
    // Reset when the reel (beat set) changes.
    setIndex(0);
    setPlaying(true);
  }, [beats]);

  if (!n) return null;
  const clamp = (i: number) => ((i % n) + n) % n;
  const goto = (i: number) => setIndex(clamp(i));
  const next = () => setIndex((i) => clamp(i + 1));
  const prev = () => setIndex((i) => clamp(i - 1));

  const cur = list[index];
  const kind = pickScene(`${cur.on_screen} ${cur.visual_prompt} ${cur.narration}`);
  const durMs = beatMs(cur.seconds);
  const p = PALETTE[kind];

  return (
    <div>
      {hook ? (
        <div className="mb-2 text-center text-[11px] text-muted-foreground">
          Hook: <span className="text-foreground/90">“{hook}”</span>
        </div>
      ) : null}

      <div className="flex flex-col items-center">
        {/* Phone frame */}
        <div
          className="relative w-full max-w-[288px] overflow-hidden rounded-[26px] border border-white/15 shadow-2xl"
          style={{ aspectRatio: "9 / 16", boxShadow: "0 24px 60px -20px rgba(79,26,243,.55)" }}
        >
          {/* Scene (keyed by index so entrance animations replay each beat) */}
          <div key={index} className="rs-scene">
            <ReelScene kind={kind} />
          </div>

          {/* Top gradient + progress segments */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
          <div className="absolute inset-x-2 top-2 z-20 flex gap-1">
            {list.map((_, i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                {i < index && <div className="h-full w-full rounded-full bg-white" />}
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

          {/* Format + time badge */}
          <div className="absolute right-2 top-5 z-20 rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur">
            {formatLabel ? `${formatLabel} · ` : ""}
            {p.label}
          </div>

          {/* On-screen text (keyed → re-animates each beat) */}
          {cur.on_screen ? (
            <div key={`os-${index}`} className="rs-textin absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-5 text-center">
              <div
                className="inline-block text-balance text-[22px] font-extrabold leading-tight text-white"
                style={{ textShadow: "0 2px 14px rgba(0,0,0,.45)" }}
              >
                {cur.on_screen}
              </div>
            </div>
          ) : null}

          {/* Narration subtitle */}
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
            <div key={`nr-${index}`} className="rs-textin text-center text-[11px] leading-snug text-white/95">
              {cur.narration}
            </div>
            <div className="mt-1 text-center font-mono text-[9px] text-white/60">{cur.seconds}s</div>
          </div>

          {/* Tap zones: left = prev, right = next */}
          <button
            aria-label="Previous beat"
            className="absolute inset-y-0 left-0 z-30 w-1/3 cursor-default focus:outline-none"
            onClick={prev}
          />
          <button
            aria-label="Next beat"
            className="absolute inset-y-0 right-0 z-30 w-2/3 cursor-default focus:outline-none"
            onClick={next}
          />
        </div>

        {/* Controls */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={prev}
            className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground"
            title="Previous beat"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPlaying((v) => !v)}
            className="rounded-full p-2.5 text-white"
            style={{ background: "var(--gradient-brand)" }}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              setIndex(0);
              setPlaying(true);
            }}
            className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground"
            title="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground"
            title="Next beat"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-1 font-mono text-[11px] text-muted-foreground">
            {index + 1}/{n}
          </span>
        </div>

        {/* Scene strip */}
        <div className="mt-4 flex w-full max-w-md gap-1.5 overflow-x-auto pb-1">
          {list.map((b, i) => {
            const k = pickScene(`${b.on_screen} ${b.visual_prompt} ${b.narration}`);
            return (
              <button
                key={i}
                onClick={() => goto(i)}
                title={b.on_screen || b.narration}
                className={`relative h-16 w-9 shrink-0 overflow-hidden rounded-md border ${
                  i === index ? "border-primary ring-1 ring-primary" : "border-white/10 opacity-70 hover:opacity-100"
                }`}
              >
                <ReelScene kind={k} poster />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
