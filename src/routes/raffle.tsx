import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { countArticles, promoteArticlePriority } from "@/lib/articles.functions";
import { getRafflePool, logRaffleDraw } from "@/lib/raffle.functions";
import { seedArticles } from "@/lib/seed.functions";
import { AppLayout } from "@/components/AppLayout";
import { ArticleSidePanel } from "@/components/ArticleSidePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLUSTERS, ANCHORS, clusterMeta } from "@/lib/pillars";
import { Dices, Sparkles, RefreshCw, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/raffle")({ component: Raffle });

type Article = {
  id: string;
  title: string;
  cluster_id: number | null;
  cluster_name: string | null;
  anchor: string | null;
  status: string;
  priority: string | null;
  idea_index: number | null;
};

function pickRandom<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function Raffle() {
  const [cluster, setCluster] = useState<string>("all");
  const [anchor, setAnchor] = useState<string>("all");
  const [count, setCount] = useState(10);
  const [picked, setPicked] = useState<Article[]>([]);
  const [excludeWritten, setExcludeWritten] = useState(true);
  const [panelId, setPanelId] = useState<string | null>(null);

  const poolFn = useServerFn(getRafflePool);
  const countFn = useServerFn(countArticles);
  const logDrawFn = useServerFn(logRaffleDraw);
  const promoteFn = useServerFn(promoteArticlePriority);
  const seedFn = useServerFn(seedArticles);

  const { data: pool, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["raffle-pool", cluster, anchor, excludeWritten],
    queryFn: () =>
      poolFn({
        data: { cluster, anchor, excludeWritten },
      }) as Promise<Article[]>,
  });

  const totalAll = useQuery({
    queryKey: ["articles-total"],
    queryFn: async () => {
      const r = await countFn({});
      return r.count;
    },
  });

  const stats = useMemo(() => {
    const byCluster: Record<number, number> = {};
    (pool ?? []).forEach((a) => {
      if (a.cluster_id != null) byCluster[a.cluster_id] = (byCluster[a.cluster_id] ?? 0) + 1;
    });
    return { poolSize: pool?.length ?? 0, byCluster };
  }, [pool]);

  const drawMut = useMutation({
    mutationFn: async () => {
      if (!pool || pool.length === 0) throw new Error("Pool is empty — relax filters or seed ideas.");
      const n = Math.min(count, pool.length);
      const drawn = pickRandom(pool, n);
      // Log the draw
      await logDrawFn({
        data: {
          draw_count: n,
          filters: { cluster, anchor, excludeWritten },
          picked_ids: drawn.map((d) => d.id),
        },
      });
      return drawn;
    },
    onSuccess: (drawn) => {
      setPicked(drawn);
      toast.success(`Drew ${drawn.length} idea${drawn.length === 1 ? "" : "s"}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const seedMut = useMutation({
    mutationFn: () => seedFn({ data: { force: false } }),
    onSuccess: (r: { skipped?: boolean; existing?: number; inserted?: number; backfilled?: number }) => {
      if (r.backfilled) toast.success(`Fixed ${r.backfilled} articles for raffle clusters`);
      else if (r.skipped) toast.info(`Already have ${r.existing} articles — refreshing pool`);
      else toast.success(`Seeded ${r.inserted} ideas`);
      refetch();
      totalAll.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const promote = useMutation({
    mutationFn: async (id: string) => {
      await promoteFn({ data: { id } });
    },
    onSuccess: () => toast.success("Locked in — priority set to High"),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1280px] px-10 py-10">
        <header className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Dices className="h-3 w-3 text-primary" /> KloudBean · Idea Raffle
          </div>
          <h1 className="text-display text-[56px] leading-[0.95] tracking-tighter">
            Spin the wheel.<br />
            <span className="grad-text">Build topical authority.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] text-muted-foreground">
            {(totalAll.data ?? 0).toLocaleString()} candidate articles across 10 clusters.
            Pull a random batch, drop them into the pipeline, and let the engine brief +
            publish them. Random sampling beats decision paralysis — and consistent
            cluster coverage is how you win Google without backlinks.
          </p>
        </header>

        {(totalAll.data === 0 || isError) && (
          <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
            <p className="text-sm text-amber-100">
              {isError ? (
                <>
                  <strong>Database error:</strong> {(error as Error)?.message}. Run{" "}
                  <code className="font-mono text-xs">npm run setup</code> then restart the dev server.
                </>
              ) : (
                <>
                  <strong>No ideas in the database yet.</strong> Seed the 59-article Kloudbean roadmap to fill the raffle pool.
                </>
              )}
            </p>
            <Button
              className="mt-3"
              size="sm"
              disabled={seedMut.isPending}
              onClick={() => seedMut.mutate()}
              style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {seedMut.isPending ? "Seeding…" : "Seed 59 ideas"}
            </Button>
          </div>
        )}

        {/* Controls */}
        <section className="mb-8 rounded-xl border border-border bg-card/60 p-6 backdrop-blur">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Cluster</label>
              <Select value={cluster} onValueChange={setCluster}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All 10 clusters</SelectItem>
                  {CLUSTERS.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.id}. {c.short}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Anchor page</label>
              <Select value={anchor} onValueChange={setAnchor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any anchor</SelectItem>
                  {ANCHORS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">How many?</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              />
            </div>
            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2 text-sm">
                <span>Only un-written</span>
                <input
                  type="checkbox"
                  checked={excludeWritten}
                  onChange={(e) => setExcludeWritten(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Pool: <span className="num font-semibold text-foreground">{stats.poolSize.toLocaleString()}</span> ideas match these filters.
              {anchor !== "all" && stats.poolSize === 0 && !isError && (
                <span className="ml-2 text-amber-400">Try anchor “Any anchor” or seed ideas first.</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh pool
              </Button>
              <Button
                size="lg"
                disabled={isLoading || drawMut.isPending || stats.poolSize === 0}
                onClick={() => drawMut.mutate()}
                style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
              >
                <Dices className="mr-2 h-4 w-4" />
                {drawMut.isPending ? "Spinning…" : `Spin · draw ${Math.min(count, stats.poolSize)}`}
              </Button>
            </div>
          </div>
        </section>

        {/* Cluster coverage */}
        <section className="mb-10">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Cluster coverage in the current pool</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {CLUSTERS.map((c) => {
              const n = stats.byCluster[c.id] ?? 0;
              return (
                <button
                  key={c.id}
                  onClick={() => setCluster(String(c.id))}
                  className={`rounded-lg border p-3 text-left transition ${
                    cluster === String(c.id) ? "border-primary bg-primary/5" : "border-border bg-card/60 hover:border-primary/40"
                  }`}
                >
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">C{String(c.id).padStart(2, "0")}</div>
                  <div className="mt-1 text-[12px] leading-tight text-foreground/85 line-clamp-2">{c.short}</div>
                  <div className="num mt-2 text-xl font-semibold">{n}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Drawn results */}
        <section>
          <div className="mb-4 flex items-end justify-between border-b border-border pb-3">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Drawn</span>
              <h2 className="text-display text-2xl font-semibold tracking-tight">
                {picked.length ? `${picked.length} winning ideas` : "Press Spin to draw"}
              </h2>
            </div>
            {picked.length > 0 && (
              <span className="text-xs text-muted-foreground">Click a row to open the brief panel.</span>
            )}
          </div>

          {picked.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card/30 py-20 text-center">
              <Sparkles className="mb-3 h-8 w-8 text-primary/60" />
              <p className="text-sm text-muted-foreground">
                {stats.poolSize > 0
                  ? `${stats.poolSize.toLocaleString()} ideas are ready. Spin to pick your next batch.`
                  : "Pool is empty — seed ideas above or turn off “Only un-written” if everything was drafted already."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-foreground/[0.02] font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left w-12">#</th>
                    <th className="px-4 py-2.5 text-left">Title</th>
                    <th className="px-4 py-2.5 text-left">Cluster</th>
                    <th className="px-4 py-2.5 text-left">Anchor</th>
                    <th className="px-4 py-2.5 text-right w-32">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {picked.map((a, i) => (
                    <tr
                      key={a.id}
                      className="cursor-pointer border-t border-border/60 transition hover:bg-foreground/[0.03]"
                      onClick={() => setPanelId(a.id)}
                    >
                      <td className="px-4 py-3 num text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-4 py-3">
                        <div className="line-clamp-2 text-foreground/90">{a.title}</div>
                        {a.idea_index && <div className="font-mono text-[10px] text-muted-foreground">idea #{a.idea_index}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{clusterMeta(a.cluster_id).short}</td>
                      <td className="px-4 py-3"><code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px]">{a.anchor}</code></td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); promote.mutate(a.id); }}
                        >
                          <Lock className="mr-1.5 h-3 w-3" /> Lock in
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <ArticleSidePanel articleId={panelId} open={!!panelId} onOpenChange={(o) => !o && setPanelId(null)} />
    </AppLayout>
  );
}
