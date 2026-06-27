import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, RefreshCw, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { rebuildKnowledgeGraphFn, getKnowledgeGraphFn, getKgInsightsFn } from "@/lib/kg.functions";

export const Route = createFileRoute("/knowledge")({ component: KnowledgePage });

const TYPE_COLORS: Record<string, string> = {
  concept: "#6c47ff",
  product: "#22c55e",
  provider: "#0ea5e9",
  competitor: "#f43f5e",
  persona: "#f59e0b",
  cluster: "#a855f7",
  region: "#14b8a6",
  app: "#eab308",
  runtime: "#64748b",
  topic: "#94a3b8",
  keyword: "#cbd5e1",
};

function KnowledgePage() {
  const qc = useQueryClient();
  const rebuildFn = useServerFn(rebuildKnowledgeGraphFn);
  const graphFn = useServerFn(getKnowledgeGraphFn);
  const insightsFn = useServerFn(getKgInsightsFn);

  const { data: graph, isLoading } = useQuery({
    queryKey: ["kg-graph"],
    queryFn: () => graphFn({}),
  });
  const { data: insights } = useQuery({ queryKey: ["kg-insights"], queryFn: () => insightsFn({}) });

  const rebuildMut = useMutation({
    mutationFn: () => rebuildFn({}),
    onSuccess: (r) => {
      toast.success(`Graph rebuilt: ${r.totals.nodes} nodes · ${r.totals.edges} links`);
      qc.invalidateQueries({ queryKey: ["kg-graph"] });
      qc.invalidateQueries({ queryKey: ["kg-insights"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const byType = graph?.byType ?? {};

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 py-8">
        <header className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Brain className="h-3 w-3 text-primary" />
            Self-learning knowledge graph
          </div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">
            What the system understands
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A living map of Kloudbean — products, providers, competitors, personas and the topics
            around them. It grows from your content and re-weights itself from real ranking signals,
            then points at the biggest gaps to fill.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              <Stat label="Entities" value={graph?.totals.nodes ?? 0} />
              <Stat label="Connections" value={graph?.totals.edges ?? 0} />
            </div>
            <Button
              className="ml-auto"
              onClick={() => rebuildMut.mutate()}
              disabled={rebuildMut.isPending}
              style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            >
              {rebuildMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Rebuild & learn
            </Button>
          </div>
        </header>

        {/* Understanding summary */}
        {insights?.understanding && (
          <div className="mb-8 rounded-xl border border-border bg-card/50 p-6">
            <h2 className="text-display mb-2 text-lg font-semibold">Current understanding</h2>
            <p className="text-sm leading-relaxed text-foreground/85">
              {insights.understanding.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {insights.understanding.topEntities.map((e) => (
                <span
                  key={e.label}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
                  style={{
                    borderColor: (TYPE_COLORS[e.type] ?? "#888") + "66",
                    color: TYPE_COLORS[e.type] ?? "#aaa",
                  }}
                >
                  {e.label}
                  {e.reward > 0 && <span className="text-[var(--lime)]">+{e.reward}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Type legend */}
        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(byType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, n]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 rounded-md bg-card/60 px-2.5 py-1 text-[11px]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: TYPE_COLORS[type] ?? "#888" }}
                />
                {type} <span className="text-muted-foreground">{n}</span>
              </span>
            ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Radial graph */}
          <div className="lg:col-span-2 overflow-hidden rounded-xl border border-border bg-card/40 p-4">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Loading graph…</div>
            ) : graph && graph.nodes.length ? (
              <RadialGraph nodes={graph.nodes} edges={graph.edges} />
            ) : (
              <div className="py-20 text-center text-sm text-muted-foreground">
                No graph yet. Click “Rebuild & learn”.
              </div>
            )}
          </div>

          {/* Gaps */}
          <div className="rounded-xl border border-border bg-card/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <h2 className="text-display text-lg font-semibold">Biggest content gaps</h2>
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Important entities with thin coverage — write or build these next.
            </p>
            <div className="space-y-2">
              {(insights?.gaps ?? []).map((g) => (
                <div key={g.id} className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{g.label}</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] uppercase"
                      style={{
                        background: (TYPE_COLORS[g.type] ?? "#888") + "22",
                        color: TYPE_COLORS[g.type] ?? "#aaa",
                      }}
                    >
                      {g.type}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{g.reason}</div>
                </div>
              ))}
              {!insights?.gaps?.length && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Rebuild to compute gaps.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function RadialGraph({
  nodes,
  edges,
}: {
  nodes: { id: string; type: string; label: string; weight: number; degree: number }[];
  edges: { source: string; target: string }[];
}) {
  const W = 720;
  const H = 560;
  const cx = W / 2;
  const cy = H / 2;

  // Center the brand concept; ring the rest by weight.
  const center = nodes.find((n) => n.type === "concept") ?? nodes[0];
  const ring = nodes.filter((n) => n.id !== center?.id).slice(0, 40);
  const R = 230;
  const pos: Record<string, { x: number; y: number }> = {};
  if (center) pos[center.id] = { x: cx, y: cy };
  ring.forEach((n, i) => {
    const a = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
    pos[n.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  const maxW = Math.max(1, ...nodes.map((n) => n.weight));
  const radius = (w: number) => 5 + Math.round((w / maxW) * 16);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {edges.map((e, i) => {
        const a = pos[e.source];
        const b = pos[e.target];
        if (!a || !b) return null;
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#ffffff"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        );
      })}
      {[center, ...ring].filter(Boolean).map((n) => {
        const p = pos[n!.id];
        if (!p) return null;
        const color = TYPE_COLORS[n!.type] ?? "#888";
        const r = radius(n!.weight);
        return (
          <g key={n!.id}>
            <circle cx={p.x} cy={p.y} r={r} fill={color} fillOpacity={0.85} />
            <text
              x={p.x}
              y={p.y + r + 11}
              textAnchor="middle"
              fontSize={n!.type === "concept" ? 13 : 10}
              fill="#cbd5e1"
            >
              {n!.label.length > 22 ? n!.label.slice(0, 21) + "…" : n!.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 px-4 py-2">
      <div className="num text-xl font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
