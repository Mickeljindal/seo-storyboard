import type { CSSProperties } from "react";
import type { SceneKind } from "@/lib/studio-content";
// Vite raw import of the official white Kloudbean wordmark (dark-bg variant).
import logoRaw from "@/assets/kb-logo.svg?raw";

/** Official Kloudbean logo, sized via CSS height. */
export function KbLogo({ height = 40 }: { height?: number }) {
  const svg = logoRaw
    .replace(/<\?xml[^>]*\?>/i, "")
    .replace(/<!DOCTYPE[^>]*>/i, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\swidth="[^"]*"/i, "")
    .replace(/\sheight="[^"]*"/i, "");
  return (
    <span
      style={{ display: "inline-block", height, lineHeight: 0 }}
      // logo is trusted local asset
      dangerouslySetInnerHTML={{ __html: svg.replace("<svg", `<svg style="height:${height}px;width:auto;display:block"`) }}
    />
  );
}

const d = (delay: number): CSSProperties => ({ animationDelay: `${delay}s` });
const org = (v: string): CSSProperties => ({ transformOrigin: v });

/** Animated scene motif (0..100 viewBox). White + var(--acc); reuses rs-* keyframes in styles.css. */
export function SceneMotif({ kind }: { kind: SceneKind }) {
  switch (kind) {
    case "deploy":
      return (
        <>
          <g className="rs-rise" style={org("50px 50px")}>
            <path d="M50 18 C61 30 61 52 50 64 C39 52 39 30 50 18 Z" fill="#fff" opacity="0.96" />
            <circle cx="50" cy="38" r="6" fill="var(--acc)" />
            <path d="M43 60 L50 74 L57 60 Z" className="rs-exhaust" fill="var(--acc)" />
          </g>
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} className="rs-float" style={d(i * 0.4)} cx={18 + i * 20} cy={22 + i * 12} r="1.7" fill="#fff" opacity="0.7" />
          ))}
        </>
      );
    case "network":
      return (
        <>
          <g fill="none" stroke="var(--acc)" strokeWidth="1.6" className="rs-flow" opacity="0.9">
            <line x1="50" y1="50" x2="22" y2="24" /><line x1="50" y1="50" x2="80" y2="26" />
            <line x1="50" y1="50" x2="24" y2="78" /><line x1="50" y1="50" x2="78" y2="76" />
          </g>
          <circle cx="50" cy="50" r="9" fill="#fff" className="rs-pulse" />
          {[[22, 24], [80, 26], [24, 78], [78, 76]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="var(--acc)" className="rs-pulse" style={d(i * 0.3)} />
          ))}
        </>
      );
    case "speed":
      return (
        <>
          <path d="M22 66 A30 30 0 0 1 78 66" fill="none" stroke="#fff" strokeWidth="6" opacity="0.25" strokeLinecap="round" />
          <path d="M22 66 A30 30 0 0 1 78 66" fill="none" stroke="var(--acc)" strokeWidth="6" strokeLinecap="round" className="rs-draw" />
          <g className="rs-needle" style={org("50px 66px")}>
            <line x1="50" y1="66" x2="50" y2="34" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </g>
          <circle cx="50" cy="66" r="4" fill="#fff" />
        </>
      );
    case "database":
      return (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i} className="rs-stack" style={d(i * 0.18)}>
              <ellipse cx="50" cy={34 + i * 14} rx="20" ry="6" fill="#fff" opacity={0.95 - i * 0.14} />
              <rect x="30" y={34 + i * 14} width="40" height="10" fill="#fff" opacity={0.5 - i * 0.1} />
            </g>
          ))}
          <circle className="rs-ping" cx="50" cy="34" r="8" fill="none" stroke="var(--acc)" strokeWidth="2" />
        </>
      );
    case "security":
      return (
        <>
          <path d="M50 22 L72 32 V50 C72 64 62 74 50 78 C38 74 28 64 28 50 V32 Z" fill="#fff" opacity="0.95" className="rs-float-slow" />
          <path d="M43 50 l5 5 9 -10" fill="none" stroke="var(--acc)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle className="rs-ping" cx="50" cy="50" r="20" fill="none" stroke="var(--acc)" strokeWidth="2" />
        </>
      );
    case "cost":
      return (
        <>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={26 + i * 13} y={30 + i * 8} width="9" height={44 - i * 8} rx="2" fill={i === 3 ? "var(--acc)" : "#fff"} opacity="0.92" className="rs-grow" style={d(i * 0.15)} />
          ))}
          <path d="M24 34 L74 58" stroke="var(--acc)" strokeWidth="2.5" fill="none" className="rs-draw" />
        </>
      );
    case "compare":
      return (
        <>
          <rect x="24" y="30" width="20" height="44" rx="3" fill="#fff" opacity="0.28" />
          <rect x="24" y="48" width="20" height="26" rx="3" fill="#fff" className="rs-grow" />
          <rect x="56" y="20" width="20" height="54" rx="3" fill="#fff" opacity="0.28" />
          <rect x="56" y="26" width="20" height="48" rx="3" fill="var(--acc)" className="rs-grow" style={d(0.2)} />
        </>
      );
    case "cdn":
      return (
        <>
          <circle cx="50" cy="50" r="24" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.65" />
          <ellipse cx="50" cy="50" rx="24" ry="9" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.4" />
          <ellipse cx="50" cy="50" rx="9" ry="24" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.4" />
          <g className="rs-orbit" style={org("50px 50px")}>
            {[0, 120, 240].map((deg) => {
              const x = 50 + 24 * Math.cos((deg * Math.PI) / 180);
              const y = 50 + 24 * Math.sin((deg * Math.PI) / 180);
              return <circle key={deg} cx={x} cy={y} r="3.6" fill="var(--acc)" />;
            })}
          </g>
          <circle cx="50" cy="50" r="5" fill="#fff" className="rs-pulse" />
        </>
      );
    case "scale":
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={24 + (i % 3) * 18} y={30 + Math.floor(i / 3) * 20} width="14" height="14" rx="3" fill={i === 4 ? "var(--acc)" : "#fff"} opacity="0.92" className="rs-stack" style={d(i * 0.16)} />
          ))}
          <circle className="rs-ping" cx="42" cy="44" r="10" fill="none" stroke="var(--acc)" strokeWidth="2" />
        </>
      );
    case "code":
      return (
        <>
          <rect x="20" y="26" width="60" height="48" rx="5" fill="#0a1630" stroke="#ffffff30" strokeWidth="1" />
          <rect x="20" y="26" width="60" height="10" rx="5" fill="#ffffff14" />
          <circle cx="27" cy="31" r="1.6" fill="var(--acc)" /><circle cx="33" cy="31" r="1.6" fill="#ffffff55" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="27" y={44 + i * 8} width={i === 3 ? 18 : 34 - i * 5} height="3" rx="1.5" fill={i === 3 ? "var(--acc)" : "#fff"} opacity={i === 3 ? 1 : 0.65} />
          ))}
          <rect x="48" y="68" width="4" height="4" fill="var(--acc)" className="rs-blink" />
        </>
      );
    case "cloud":
      return (
        <>
          <g className="rs-float-slow">
            <path d="M34 58 a13 13 0 0 1 2 -25 a17 17 0 0 1 32 4 a11 11 0 0 1 -2 21 Z" fill="#fff" opacity="0.96" />
          </g>
          {[40, 50, 60].map((x, i) => (
            <rect key={x} x={x - 4} y="62" width="8" height="13" rx="1.5" fill="var(--acc)" className="rs-float" style={d(i * 0.3)} />
          ))}
        </>
      );
    case "ai":
      return (
        <>
          <g className="rs-spin-slow" style={org("50px 50px")}>
            {[0, 60, 120].map((deg) => (
              <ellipse key={deg} cx="50" cy="50" rx="27" ry="10.5" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.55" transform={`rotate(${deg} 50 50)`} />
            ))}
          </g>
          <circle cx="50" cy="50" r="7" fill="var(--acc)" className="rs-pulse" />
          {[[30, 30], [70, 32], [32, 70], [70, 68]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.8" fill="#fff" className="rs-float" style={d(i * 0.35)} />
          ))}
        </>
      );
    case "wordpress":
      return (
        <>
          <circle cx="50" cy="50" r="26" fill="none" stroke="#fff" strokeWidth="2.4" opacity="0.9" className="rs-float-slow" />
          <text x="50" y="62" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff" fontFamily="Poppins, sans-serif">W</text>
          <circle className="rs-ping" cx="50" cy="50" r="26" fill="none" stroke="var(--acc)" strokeWidth="1.6" />
        </>
      );
    default:
      return (
        <>
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={34 + i * 16} cy="50" r={9 - i * 2} fill={i === 1 ? "var(--acc)" : "#fff"} opacity={0.95 - i * 0.15} className="rs-float" style={d(i * 0.4)} />
          ))}
          <circle className="rs-ping" cx="50" cy="50" r="16" fill="none" stroke="var(--acc)" strokeWidth="2" />
        </>
      );
  }
}
