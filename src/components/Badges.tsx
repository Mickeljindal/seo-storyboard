import { STATUSES, statusLabel, pillarMeta } from "@/lib/pillars";

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUSES.find((s) => s.id === status);
  const color = meta?.tokenVar ?? "var(--muted)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2 py-0.5 text-[11px] font-medium"
      title={statusLabel(status)}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {statusLabel(status)}
    </span>
  );
}

export function PillarBadge({ pillar }: { pillar: number }) {
  const p = pillarMeta(pillar);
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: `color-mix(in oklab, ${p.color} 22%, transparent)`, color: p.color }}
    >
      {p.short}
    </span>
  );
}

export function PriorityDot({ priority }: { priority?: string | null }) {
  const c = priority === "high" ? "bg-rose-500" : priority === "low" ? "bg-zinc-500" : "bg-amber-500";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${c}`} />;
}
