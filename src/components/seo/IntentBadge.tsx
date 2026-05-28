import type { SearchIntent } from "@/lib/seo-types";

const STYLES: Record<SearchIntent, string> = {
  informational: "bg-sky-500/15 text-sky-400",
  commercial: "bg-amber-500/15 text-amber-400",
  transactional: "bg-emerald-500/15 text-emerald-400",
  navigational: "bg-violet-500/15 text-violet-400",
  mixed: "bg-zinc-500/15 text-zinc-400",
};

export function IntentBadge({ intent }: { intent: SearchIntent | null | undefined }) {
  if (!intent) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STYLES[intent]}`}>
      {intent}
    </span>
  );
}

export function OpportunityBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-emerald-400" : score >= 45 ? "text-amber-400" : "text-muted-foreground";
  return (
    <span className={`num font-mono text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}
