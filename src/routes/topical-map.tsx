import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { ArticleSidePanel } from "@/components/ArticleSidePanel";
import { Button } from "@/components/ui/button";
import {
  getTopicalMapFn,
  rebuildSiloFn,
  reclusterArticlesFn,
  getLearningStatsFn,
} from "@/lib/topical-map.functions";
import { useState } from "react";
import {
  Network,
  Layers,
  FileText,
  Loader2,
  RefreshCw,
  Brain,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Circle,
  GitBranch,
  Swords,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/topical-map")({ component: TopicalMap });

type MapCluster = {
  cluster_id: number;
  cluster_name: string;
  hub: { id: string; title: string; status: string; opportunity: number } | null;
  supporting: { id: string; title: string; status: string; opportunity: number }[];
  article_count: number;
  published: number;
  competitor_gap: { count: number; topKeyword: string; topVolume: number } | null;
};

function statusColor(status: string): string {
  if (status === "published" || status === "promoted") return "var(--status-published)";
  if (status === "review") return "var(--status-review)";
  if (status === "writing") return "var(--status-writing)";
  if (status === "brief_generated") return "var(--status-brief)";
  if (status === "keyword_researched") return "var(--status-keyword)";
  return "var(--status-idea)";
}

function TopicalMap() {
  const qc = useQueryClient();
  const [panelId, setPanelId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggleExpanded = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const mapFn = useServerFn(getTopicalMapFn);
  const rebuildFn = useServerFn(rebuildSiloFn);
  const reclusterFn = useServerFn(reclusterArticlesFn);
  const learnFn = useServerFn(getLearningStatsFn);

  const {
    data: map,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["topical-map"],
    queryFn: () => mapFn({ data: {} }),
  });

  const { data: learning } = useQuery({
    queryKey: ["learning-stats"],
    queryFn: () => learnFn({}),
  });

  const rebuild = useMutation({
    mutationFn: () => rebuildFn({ data: {} }),
    onSuccess: (r: { hubs: number; supporting: number }) => {
      toast.success(`Silo rebuilt: ${r.hubs} hubs · ${r.supporting} supporting`);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const recluster = useMutation({
    mutationFn: () => reclusterFn({}),
    onSuccess: (r: { updated: number; total: number }) => {
      toast.success(`Re-clustered ${r.updated}/${r.total} articles`);
      refetch();
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clusters = (map?.clusters ?? []) as MapCluster[];
  const totalArticles = clusters.reduce((s, c) => s + c.article_count, 0);
  const totalPublished = clusters.reduce((s, c) => s + c.published, 0);
  const hubsSet = clusters.filter((c) => c.hub).length;

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1200px] px-8 py-8">
        <header className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Network className="h-3 w-3 text-primary" /> Topical Authority Map
          </div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">Your content silos</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every cluster has one hub article and supporting articles that link up to it. This dense
            internal mesh is how Kloudbean wins topical authority — no backlinks required.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={rebuild.isPending}
              onClick={() => rebuild.mutate()}
            >
              {rebuild.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Rebuild silo
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={recluster.isPending}
              onClick={() => recluster.mutate()}
            >
              {recluster.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GitBranch className="mr-2 h-4 w-4" />
              )}
              Re-cluster all articles
            </Button>
          </div>
        </header>

        {/* Summary stats */}
        <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          <Stat icon={Layers} label="Clusters" value={clusters.length} />
          <Stat icon={FileText} label="Articles" value={totalArticles} />
          <Stat icon={CheckCircle2} label="Published" value={totalPublished} accent />
          <Stat icon={Network} label="Hubs set" value={hubsSet} />
        </div>

        {/* Learning panel */}
        {learning && (
          <section className="mb-8 rounded-xl border border-border bg-card/60 p-5 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Brain className="h-4 w-4 text-primary" /> Self-learning loop
              </h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${learning.active ? "bg-[var(--lime)]/15 text-[var(--lime)]" : "bg-secondary text-muted-foreground"}`}
              >
                {learning.active ? "Active" : `Warming up (${learning.total}/5 signals)`}
              </span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              The engine records a reward signal each time an article is generated, selected, or
              published. Once it has enough signals, it re-prioritizes discovery toward the clusters
              and intents that historically won.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniPanel label="Total signals" value={learning.total} />
              <MiniPanel
                label="Clusters tracked"
                value={Object.keys(learning.byCluster ?? {}).length}
              />
              <MiniPanel label="Status" value={learning.active ? "Learning" : "Neutral"} />
            </div>
            {learning.recent && learning.recent.length > 0 && (
              <div className="mt-3 max-h-32 overflow-y-auto rounded-md border border-border bg-background/40 p-2">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Recent signals
                </div>
                <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                  {learning.recent.slice(0, 8).map((s: Record<string, unknown>, i: number) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="truncate">
                        <span className="text-primary">[{String(s.event)}]</span>{" "}
                        {String(s.keyword ?? "—")}
                      </span>
                      {s.reward != null && (
                        <span className="shrink-0 text-foreground/70">
                          +{Number(s.reward).toFixed(2)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Cluster silos */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading topical map…</div>
        ) : (
          <div className="space-y-5">
            {clusters.map((c) => (
              <section
                key={c.cluster_id}
                className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                      Cluster {String(c.cluster_id).padStart(2, "0")}
                    </span>
                    <h3 className="text-display text-lg font-semibold">{c.cluster_name}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{c.article_count} articles</span>
                    <span className="text-[var(--lime)]">{c.published} live</span>
                    {c.competitor_gap && c.competitor_gap.count > 0 && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-orange-400"
                        title={`Top: "${c.competitor_gap.topKeyword}" (~${c.competitor_gap.topVolume.toLocaleString()}/mo) — proven by competitors, Kloudbean doesn't rank yet.`}
                      >
                        <Swords className="h-3 w-3" /> {c.competitor_gap.count} competitor gaps
                      </span>
                    )}
                  </div>
                </div>

                {c.competitor_gap && c.competitor_gap.count > 0 && (
                  <div className="mb-3 rounded-md border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-[11px] text-orange-200/90">
                    Biggest opportunity here:{" "}
                    <strong>&ldquo;{c.competitor_gap.topKeyword}&rdquo;</strong> (~
                    {c.competitor_gap.topVolume.toLocaleString()} searches/mo) — competitors rank
                    for it, Kloudbean doesn&apos;t yet.{" "}
                    <a href="/kloudgraph" className="underline hover:text-orange-100">
                      See the full attack list →
                    </a>
                  </div>
                )}

                {c.article_count === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No articles yet — run the engine to populate this cluster.
                  </p>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                    {/* Hub */}
                    <div>
                      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Hub
                      </div>
                      {c.hub ? (
                        <button
                          onClick={() => {
                            setPanelId(c.hub!.id);
                            setOpen(true);
                          }}
                          className="group w-full rounded-lg border border-primary/40 bg-primary/10 p-3 text-left transition hover:border-primary"
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 shrink-0 text-primary" />
                            <span className="line-clamp-2 text-sm font-medium">{c.hub.title}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: statusColor(c.hub.status) }}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {c.hub.status}
                            </span>
                            <span className="ml-auto num text-[10px] text-muted-foreground">
                              opp {c.hub.opportunity}
                            </span>
                          </div>
                        </button>
                      ) : (
                        <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                          No hub assigned
                        </div>
                      )}
                    </div>

                    {/* Supporting */}
                    <div>
                      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Supporting ({c.supporting.length}) → link up to hub
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(expanded.has(c.cluster_id) ? c.supporting : c.supporting.slice(0, 8)).map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setPanelId(s.id);
                              setOpen(true);
                            }}
                            className="flex items-start gap-2 rounded-md border border-border bg-background/50 p-2.5 text-left transition hover:border-primary/40"
                          >
                            <Circle
                              className="mt-0.5 h-3 w-3 shrink-0"
                              style={{ color: statusColor(s.status) }}
                            />
                            <span className="line-clamp-2 text-xs">{s.title}</span>
                          </button>
                        ))}
                        {c.supporting.length > 8 && (
                          <button
                            onClick={() => toggleExpanded(c.cluster_id)}
                            className="flex items-center justify-center gap-1 rounded-md border border-dashed border-border p-2.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                          >
                            {expanded.has(c.cluster_id)
                              ? "Show less"
                              : `+${c.supporting.length - 8} more`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        <footer className="mt-12 flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <TrendingUp className="h-3 w-3" /> Hub + supporting mesh · the topical authority moat
        </footer>
      </div>
      <ArticleSidePanel articleId={panelId} open={open} onOpenChange={setOpen} />
    </AppLayout>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card/80 p-5">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-primary" : ""}`} />
      </div>
      <div className={`mt-3 num text-display text-3xl font-semibold ${accent ? "grad-text" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function MiniPanel({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-2">
      <div className="num text-lg font-semibold">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
