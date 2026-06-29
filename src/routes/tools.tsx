import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import {
  Loader2,
  Wrench,
  Sparkles,
  RefreshCw,
  Search,
  Rocket,
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  discoverToolPoolFn,
  dismissToolFn,
  generateToolFn,
  publishToolFn,
  syncExistingToolsFn,
  auditToolFn,
  optimizeToolFn,
  listToolsFn,
  toolsStatusFn,
  runToolsCycleFn,
  setToolGateFn,
  addToolFn,
  syncToolPerformanceFn,
  revertToolFn,
} from "@/lib/tools.functions";
import { enqueueToolJobsFn, drainJobsFn, jobsSummaryFn } from "@/lib/jobs.functions";

export const Route = createFileRoute("/tools")({ component: ToolsPage });

type ToolRow = {
  id: string;
  name: string;
  url_slug: string | null;
  status: string;
  origin: string | null;
  category: string | null;
  target_keyword: string | null;
  meta_title: string | null;
  published_url: string | null;
  demand_score: number | null;
  volume: number | null;
  difficulty: number | null;
  aioseo_score_before: number | null;
  quality_score: number | null;
  quality_report: { grade?: string; blocking?: boolean; issues?: string[] } | null;
  gsc_clicks: number | null;
  gsc_impressions: number | null;
  gsc_position: number | null;
  gate_clicks: number | null;
  gate_enabled: string | null;
  gate_mode: string | null;
  idea_data: {
    audience_score?: number;
    opportunity_score?: number;
    difficulty?: number | null;
    volume?: number | null;
  } | null;
};

type PoolSort = "score" | "volume" | "audience" | "kd";

function ToolsPage() {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  // Idea-pool filters
  const [poolSearch, setPoolSearch] = useState("");
  const [minVolume, setMinVolume] = useState(0);
  const [minAudience, setMinAudience] = useState(0);
  const [poolSort, setPoolSort] = useState<PoolSort>("score");

  // Existing-pages filters
  const [exSearch, setExSearch] = useState("");
  const [exBand, setExBand] = useState<"all" | "low" | "mid" | "high">("all");

  const statusFn = useServerFn(toolsStatusFn);
  const listFn = useServerFn(listToolsFn);
  const genFn = useServerFn(generateToolFn);
  const pubFn = useServerFn(publishToolFn);
  const syncFn = useServerFn(syncExistingToolsFn);
  const auditFn = useServerFn(auditToolFn);
  const optFn = useServerFn(optimizeToolFn);
  const cycleFn = useServerFn(runToolsCycleFn);
  const gateFn = useServerFn(setToolGateFn);
  const addFn = useServerFn(addToolFn);
  const poolFn = useServerFn(discoverToolPoolFn);
  const dismissFn = useServerFn(dismissToolFn);
  const perfFn = useServerFn(syncToolPerformanceFn);
  const revertFn = useServerFn(revertToolFn);
  const enqueueFn = useServerFn(enqueueToolJobsFn);
  const drainFn = useServerFn(drainJobsFn);
  const jobsFn = useServerFn(jobsSummaryFn);
  // Bulk run progress: { done, total, label } while a batch is running.
  const [bulk, setBulk] = useState<{ done: number; total: number; label: string } | null>(null);

  const { data: status } = useQuery({ queryKey: ["tools-status"], queryFn: () => statusFn({}) });
  const { data: tools, isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: () => listFn({ data: { limit: 1000 } }),
  });
  const { data: jobs } = useQuery({
    queryKey: ["tool-jobs"],
    queryFn: () => jobsFn({}),
    refetchInterval: 5000,
  });

  // Scope strictly to the Developer Tools category.
  const items = ((tools?.items ?? []) as ToolRow[]).filter(
    (t) => (t.category ?? "Developer Tools") === "Developer Tools",
  );

  const poolAll = items.filter((t) => t.status === "pool" || t.status === "idea");
  const generated = items.filter(
    (t) => ["generated", "review", "published"].includes(t.status) && t.origin !== "existing",
  );
  const existingAll = items.filter((t) => t.origin === "existing");

  const liveCount = items.filter(
    (t) => t.status === "published" || t.status === "optimized",
  ).length;
  const gatedCount = items.filter((t) => t.gate_enabled === "yes").length;
  const needsOpt = existingAll.filter((t) => (t.aioseo_score_before ?? 0) < 70).length;
  const totalClicks = items.reduce((s, t) => s + (t.gsc_clicks ?? 0), 0);

  const metric = (t: ToolRow) => ({
    vol: t.volume ?? t.idea_data?.volume ?? 0,
    aud: t.idea_data?.audience_score ?? 0,
    kd: t.difficulty ?? t.idea_data?.difficulty ?? null,
    score: t.idea_data?.opportunity_score ?? t.demand_score ?? 0,
  });

  // Filter + sort the idea pool.
  const pool = useMemo(() => {
    const q = poolSearch.trim().toLowerCase();
    const rows = poolAll.filter((t) => {
      const m = metric(t);
      if (m.vol < minVolume) return false;
      if (m.aud < minAudience) return false;
      if (q && !`${t.name} ${t.target_keyword ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows.sort((a, b) => {
      const ma = metric(a);
      const mb = metric(b);
      if (poolSort === "volume") return mb.vol - ma.vol;
      if (poolSort === "audience") return mb.aud - ma.aud;
      if (poolSort === "kd") return (ma.kd ?? 999) - (mb.kd ?? 999);
      return mb.score - ma.score;
    });
    return rows;
  }, [poolAll, poolSearch, minVolume, minAudience, poolSort]);

  // Filter + sort existing pages (worst score first).
  const existing = useMemo(() => {
    const q = exSearch.trim().toLowerCase();
    const rows = existingAll.filter((t) => {
      const s = t.aioseo_score_before ?? 0;
      if (exBand === "low" && s >= 50) return false;
      if (exBand === "mid" && (s < 50 || s >= 80)) return false;
      if (exBand === "high" && s < 80) return false;
      if (q && !`${t.name} ${t.url_slug ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows.sort((a, b) => (a.aioseo_score_before ?? 999) - (b.aioseo_score_before ?? 999));
    return rows;
  }, [existingAll, exSearch, exBand]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tools"] });

  const discoverMut = useMutation({
    mutationFn: () => poolFn({ data: { geo: "global", limit: 60, minAudience: 25 } }),
    onSuccess: (r) => {
      toast.success(`Idea pool: ${r.saved} new ideas (${r.stats.withVolume} with search volume)`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const syncMut = useMutation({
    mutationFn: () => syncFn({ data: { category: "Developer Tools", maxPages: 12, perPage: 50 } }),
    onSuccess: (r) => {
      toast.success(
        `Synced ${r.imported} pages · avg AIOSEO ${r.avgAioseoScore ?? "?"} · ${r.lowScorers} below 70`,
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const perfMut = useMutation({
    mutationFn: () => perfFn({}),
    onSuccess: (r) => {
      toast.success(
        `Performance synced · ${r.matched} tools matched (${r.withClicks} earning clicks)`,
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cycleMut = useMutation({
    mutationFn: () =>
      cycleFn({
        data: {
          geo: "global",
          sync: true,
          discover: true,
          discoverCount: 5,
          generateCount: 1,
          publishStatus: "draft",
          optimizeCount: 3,
        },
      }),
    onSuccess: (r) => {
      toast.success(
        `Cycle: ${r.discovered} ideas · ${r.generated} built · ${r.published} drafts · ${r.optimized} optimized`,
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMut = useMutation({
    mutationFn: () =>
      addFn({ data: { name: newName.trim(), targetKeyword: newKeyword.trim() || undefined } }),
    onSuccess: () => {
      toast.success("Tool idea added to pool");
      setNewName("");
      setNewKeyword("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const run = async (id: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(okMsg);
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleGate = (t: ToolRow) => {
    const enable = t.gate_enabled !== "yes";
    return run(
      t.id,
      () =>
        gateFn({
          data: { toolId: t.id, enable, mode: (t.gate_mode as "soft" | "hard") || "soft" },
        }),
      enable ? "Signup gate enabled" : "Signup gate removed",
    );
  };

  const toggleGateMode = (t: ToolRow, mode: "soft" | "hard") =>
    run(t.id, () => gateFn({ data: { toolId: t.id, enable: true, mode } }), `Gate set to ${mode}`);

  // Bulk actions enqueue durable server-side jobs (survive a closed tab).
  const enqueue = async (type: "generate_tool" | "optimize_tool", rows: ToolRow[]) => {
    if (!rows.length) return;
    setBulk({ done: 0, total: rows.length, label: "Queueing" });
    try {
      const r = await enqueueFn({ data: { type, toolIds: rows.map((t) => t.id) } });
      toast.success(`Queued ${r.queued} jobs — running in the background`);
      qc.invalidateQueries({ queryKey: ["tool-jobs"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBulk(null);
    }
  };

  const bulkBuild = () => enqueue("generate_tool", pool.slice(0, 200));
  const bulkOptimize = () => enqueue("optimize_tool", existing.slice(0, 500));

  const drainMut = useMutation({
    mutationFn: () => drainFn({ data: { max: 10 } }),
    onSuccess: (r) => {
      toast.success(`Ran ${r.processed} jobs (${r.done} done, ${r.failed} failed/retry)`);
      qc.invalidateQueries({ queryKey: ["tool-jobs"] });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 py-8">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Wrench className="h-3 w-3 text-primary" />
            Developer Tools — Process Manager
          </div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">Tool Page Engine</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pick demand-validated ideas from the pool, build branded tool pages, optimize the ones
            you already have, and gate any of them for signups — all in the Developer Tools
            category.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <StatusPill ok={!!status?.aiReady} label="AI" />
            <StatusPill ok={!!status?.pluginConfigured} label="WP Plugin" />
            <StatusPill ok={!!status?.pluginOk} label="Plugin reachable" />
            <StatusPill ok={!!status?.aioseo} label="AIOSEO" />
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => cycleMut.mutate()}
              disabled={cycleMut.isPending}
              title="Do everything once now: find ideas, build tools, publish, optimize old pages, and sync stats."
              style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            >
              {cycleMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Run full cycle
            </Button>
          </div>
        </header>

        {/* PIPELINE OVERVIEW */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-7">
          <Stage label="Idea pool" value={poolAll.length} hint="ready to build" />
          <Stage
            label="Building"
            value={generated.filter((t) => t.status !== "published").length}
            hint="drafts/review"
          />
          <Stage label="Live" value={liveCount} hint="published" accent />
          <Stage label="Existing" value={existingAll.length} hint="synced pages" />
          <Stage label="Needs opt." value={needsOpt} hint="AIOSEO < 70" warn />
          <Stage label="Clicks" value={totalClicks} hint="GSC, 28d" accent />
          <Stage label="Gated" value={gatedCount} hint="signup wall" />
        </div>

        {/* JOB QUEUE / ACTIVITY */}
        {jobs && (jobs.counts.pending > 0 || jobs.counts.running > 0 || jobs.recent.length > 0) && (
          <div className="mb-8 rounded-xl border border-border bg-card/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Background queue
                </span>
                <span className="text-amber-400">{jobs.counts.pending ?? 0} pending</span>
                <span className="text-primary">{jobs.counts.running ?? 0} running</span>
                <span className="text-[var(--lime)]">{jobs.counts.done ?? 0} done</span>
                {jobs.counts.error ? (
                  <span className="text-red-400">{jobs.counts.error} error</span>
                ) : null}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => drainMut.mutate()}
                disabled={drainMut.isPending || (jobs.counts.pending ?? 0) === 0}
                title="Process the waiting background jobs right now, instead of waiting for autopilot."
              >
                {drainMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Run now
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bulk build/optimize run here server-side — they keep going after you close this tab,
              and autopilot drains the queue automatically.
            </p>
          </div>
        )}

        {/* IDEA POOL */}
        <Section
          kicker="01"
          title="Idea pool"
          desc="Real demand · audience-fit · you choose what to build"
          action={
            <Button
              onClick={() => discoverMut.mutate()}
              disabled={discoverMut.isPending}
              title="Find fresh developer-tool ideas people are actually searching for (live demand data)."
              style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            >
              {discoverMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Refresh idea pool
            </Button>
          }
        >
          {/* Add + filters */}
          <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card/40 p-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add a tool idea (e.g. Kubernetes Cost Calculator)"
              className="min-w-[220px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="focus keyword (optional)"
              className="min-w-[160px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              onClick={() => addMut.mutate()}
              disabled={addMut.isPending || newName.trim().length < 2}
              title="Add your own tool idea to the pool so you can build it."
            >
              {addMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add
            </Button>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={poolSearch}
                onChange={(e) => setPoolSearch(e.target.value)}
                placeholder="Search ideas…"
                className="w-40 bg-transparent outline-none"
              />
            </div>
            <NumFilter label="Min volume" value={minVolume} onChange={setMinVolume} step={100} />
            <NumFilter
              label="Min audience"
              value={minAudience}
              onChange={setMinAudience}
              step={10}
              max={100}
            />
            <label className="flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-2.5 py-1.5">
              <span className="text-muted-foreground">Sort</span>
              <select
                value={poolSort}
                onChange={(e) => setPoolSort(e.target.value as PoolSort)}
                className="bg-transparent outline-none"
              >
                <option value="score">Score</option>
                <option value="volume">Volume</option>
                <option value="audience">Audience fit</option>
                <option value="kd">Easiest (KD)</option>
              </select>
            </label>
            <span className="text-muted-foreground">
              {pool.length} of {poolAll.length}
            </span>
            <Button
              size="sm"
              className="ml-auto"
              variant="outline"
              disabled={!!bulk || pool.length === 0}
              onClick={bulkBuild}
              title="Queue the filtered ideas to build server-side"
            >
              {bulk?.label === "Queueing" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wrench className="mr-2 h-4 w-4" />
              )}
              Queue build ({Math.min(pool.length, 200)})
            </Button>
          </div>

          {pool.length === 0 ? (
            <Empty>
              {poolAll.length
                ? "No ideas match your filters."
                : "Click “Refresh idea pool” to pull demand-validated ideas, or add one above."}
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card/60">
              <table className="w-full text-sm">
                <thead className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Tool idea</th>
                    <th className="px-4 py-2.5 text-right">Volume</th>
                    <th className="px-4 py-2.5 text-right">KD</th>
                    <th className="px-4 py-2.5 text-right">Audience</th>
                    <th className="px-4 py-2.5 text-right">Score</th>
                    <th className="px-4 py-2.5 text-right">Build</th>
                  </tr>
                </thead>
                <tbody>
                  {pool.slice(0, 100).map((t) => {
                    const m = metric(t);
                    return (
                      <tr
                        key={t.id}
                        className="border-t border-border/60 hover:bg-foreground/[0.02]"
                      >
                        <td className="max-w-[320px] px-4 py-3">
                          <div className="line-clamp-1 font-medium">{t.name}</div>
                          <code className="text-[10px] text-muted-foreground">
                            {t.target_keyword}
                          </code>
                        </td>
                        <td className="num px-4 py-3 text-right">
                          {m.vol ? m.vol.toLocaleString() : "—"}
                        </td>
                        <td className="num px-4 py-3 text-right">{m.kd ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <AudienceBadge score={m.aud || null} />
                        </td>
                        <td className="num px-4 py-3 text-right font-semibold text-primary">
                          {m.score}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={busyId === t.id}
                              title="Build this tool now — creates the working tool, SEO content and FAQ."
                              onClick={() =>
                                run(
                                  t.id,
                                  () => genFn({ data: { toolId: t.id } }),
                                  `Building ${t.name}`,
                                )
                              }
                            >
                              {busyId === t.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wrench className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busyId === t.id}
                              title="Dismiss (won't be proposed again)"
                              onClick={() =>
                                run(t.id, () => dismissFn({ data: { toolId: t.id } }), "Dismissed")
                              }
                            >
                              ✕
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* GENERATED / NEW TOOLS */}
        <Section kicker="02" title="Built tools (publish as draft first)">
          {generated.length === 0 ? (
            <Empty>Build a tool from the pool above.</Empty>
          ) : (
            <ToolTable
              rows={generated}
              busyId={busyId}
              onGate={toggleGate}
              onGateMode={toggleGateMode}
              actions={(t) => (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === t.id}
                    title="Regenerate in the latest branded template"
                    onClick={() =>
                      run(t.id, () => genFn({ data: { toolId: t.id } }), "Regenerated in new style")
                    }
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === t.id}
                    title="Save to WordPress as a hidden draft so you can review it before it goes live."
                    onClick={() =>
                      run(
                        t.id,
                        () => pubFn({ data: { toolId: t.id, status: "draft" } }),
                        "Published as draft",
                      )
                    }
                  >
                    Draft
                  </Button>
                  <Button
                    size="sm"
                    disabled={busyId === t.id}
                    title="Publish this tool live on the website now."
                    onClick={() =>
                      run(
                        t.id,
                        () => pubFn({ data: { toolId: t.id, status: "publish" } }),
                        "Published live",
                      )
                    }
                  >
                    {busyId === t.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Rocket className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            />
          )}
        </Section>

        {/* EXISTING PAGE OPTIMIZER */}
        <Section
          kicker="03"
          title="Existing tool pages"
          desc="Slug-safe · additive only"
          action={
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => perfMut.mutate()}
                disabled={perfMut.isPending}
                title="Pull the latest Google Search Console clicks/positions for these tool pages."
              >
                {perfMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Sync performance
              </Button>
              <Button
                variant="outline"
                onClick={() => syncMut.mutate()}
                disabled={syncMut.isPending}
                title="Load your existing Developer Tools pages from WordPress so you can optimize them."
              >
                {syncMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync from WordPress
              </Button>
            </div>
          }
        >
          {existingAll.length === 0 ? (
            <Empty>Click “Sync from WordPress” to pull your Developer Tools pages.</Empty>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-2.5 py-1.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={exSearch}
                    onChange={(e) => setExSearch(e.target.value)}
                    placeholder="Search pages…"
                    className="w-44 bg-transparent outline-none"
                  />
                </div>
                {(["all", "low", "mid", "high"] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setExBand(b)}
                    className={`rounded-full border px-2.5 py-1 ${
                      exBand === b
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {b === "all" ? "All" : b === "low" ? "< 50" : b === "mid" ? "50–79" : "80+"}
                  </button>
                ))}
                <span className="text-muted-foreground">
                  {existing.length} of {existingAll.length}
                </span>
                <Button
                  size="sm"
                  className="ml-auto"
                  variant="outline"
                  disabled={!!bulk || existing.length === 0}
                  onClick={bulkOptimize}
                  title="Queue the filtered pages to optimize server-side (slug-safe)"
                >
                  {bulk?.label === "Queueing" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Queue optimize ({Math.min(existing.length, 500)})
                </Button>
              </div>
              <ToolTable
                rows={existing.slice(0, 150)}
                busyId={busyId}
                showScore
                onGate={toggleGate}
                onGateMode={toggleGateMode}
                actions={(t) => (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === t.id}
                      title="Check this page's SEO health and see what could be improved."
                      onClick={() =>
                        run(t.id, () => auditFn({ data: { toolId: t.id } }), "Audited")
                      }
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === t.id}
                      title="See the proposed improvements without changing the live page yet."
                      onClick={() =>
                        run(
                          t.id,
                          () => optFn({ data: { toolId: t.id, dryRun: true } }),
                          "Dry-run complete (no changes)",
                        )
                      }
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      disabled={busyId === t.id}
                      title="Apply the SEO improvements to the live page now (keeps the same web address)."
                      onClick={() =>
                        run(
                          t.id,
                          () => optFn({ data: { toolId: t.id, dryRun: false } }),
                          "Optimized (slug unchanged)",
                        )
                      }
                    >
                      {busyId === t.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                    </Button>
                    {t.status === "optimized" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === t.id}
                        title="Undo — restore the page to its pre-optimize snapshot"
                        onClick={() =>
                          run(
                            t.id,
                            () => revertFn({ data: { toolId: t.id } }),
                            "Reverted to snapshot",
                          )
                        }
                      >
                        ↩︎
                      </Button>
                    )}
                  </>
                )}
              />
            </>
          )}
        </Section>

        {isLoading && <div className="py-8 text-center text-muted-foreground">Loading tools…</div>}
      </div>
    </AppLayout>
  );
}

/** Shared table for tool rows with a gate toggle + custom actions. */
function ToolTable({
  rows,
  busyId,
  showScore,
  onGate,
  onGateMode,
  actions,
}: {
  rows: ToolRow[];
  busyId: string | null;
  showScore?: boolean;
  onGate: (t: ToolRow) => void;
  onGateMode: (t: ToolRow, mode: "soft" | "hard") => void;
  actions: (t: ToolRow) => React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/60">
      <table className="w-full text-sm">
        <thead className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            {showScore && <th className="px-4 py-2.5 text-left">AIOSEO</th>}
            <th className="px-4 py-2.5 text-left">Tool</th>
            <th className="px-4 py-2.5 text-left">Status</th>
            <th className="px-4 py-2.5 text-right">Traffic</th>
            <th className="px-4 py-2.5 text-left">Gate</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t border-border/60">
              {showScore && (
                <td className="px-4 py-3">
                  <ScoreBadge score={t.aioseo_score_before} />
                </td>
              )}
              <td className="max-w-[240px] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="line-clamp-1 font-medium">{t.name}</span>
                  {t.quality_score != null && (
                    <span
                      title={(t.quality_report?.issues ?? []).join(", ") || "quality score"}
                      className={`rounded px-1 py-0.5 text-[9px] font-semibold ${
                        t.quality_report?.blocking
                          ? "bg-red-500/15 text-red-400"
                          : t.quality_score >= 80
                            ? "bg-[var(--lime)]/15 text-[var(--lime)]"
                            : t.quality_score >= 70
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {t.quality_report?.grade ?? t.quality_score}
                    </span>
                  )}
                </div>
                {t.published_url ? (
                  <a
                    href={t.published_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary"
                  >
                    /{t.url_slug}
                  </a>
                ) : (
                  <code className="text-[10px] text-muted-foreground">/{t.url_slug}</code>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge>{t.status}</Badge>
              </td>
              <td
                className="px-4 py-3 text-right"
                title={t.gsc_position ? `avg position ${t.gsc_position}` : undefined}
              >
                {t.gsc_clicks != null ? (
                  <span className="num">
                    <span className="font-semibold text-[var(--lime)]">{t.gsc_clicks}</span>
                    <span className="text-[10px] text-muted-foreground"> clk</span>
                    {t.gate_clicks ? (
                      <span className="ml-1 text-[10px] text-primary">· {t.gate_clicks}🔒</span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === t.id || !t.published_url}
                    onClick={() => onGate(t)}
                    title={t.published_url ? "Toggle signup gate" : "Publish the tool first"}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-40 ${
                      t.gate_enabled === "yes"
                        ? "border-[var(--lime)]/40 text-[var(--lime)]"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.gate_enabled === "yes" ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                    {t.gate_enabled === "yes" ? "Gated" : "Open"}
                  </button>
                  {t.gate_enabled === "yes" && (
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => onGateMode(t, t.gate_mode === "hard" ? "soft" : "hard")}
                      title="Switch gate mode — soft: 1 free use then sign up · hard: locked immediately"
                      className="rounded-full border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground hover:text-foreground disabled:opacity-40"
                    >
                      {t.gate_mode ?? "soft"}
                    </button>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">{actions(t)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({
  kicker,
  title,
  desc,
  action,
  children,
}: {
  kicker: string;
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between gap-6 border-b border-border pb-3">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
            {kicker}
          </span>
          <h2 className="text-display text-2xl font-semibold tracking-tight">{title}</h2>
          {desc && <span className="text-xs text-muted-foreground">{desc}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stage({
  label,
  value,
  hint,
  accent,
  warn,
}: {
  label: string;
  value: number;
  hint: string;
  accent?: boolean;
  warn?: boolean;
}) {
  const color = accent ? "text-[var(--lime)]" : warn && value > 0 ? "text-amber-400" : "";
  return (
    <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
      <div className={`num text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-[11px] font-medium">{label}</div>
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function NumFilter({
  label,
  value,
  onChange,
  step,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  max?: number;
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-2.5 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-16 bg-transparent text-right outline-none"
      />
    </label>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase">
      {children}
    </span>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
        ok ? "border-[var(--lime)]/40 text-[var(--lime)]" : "border-amber-500/40 text-amber-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-[var(--lime)]" : "bg-amber-400"}`} />
      {label}
    </span>
  );
}

function AudienceBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  const color =
    score >= 70 ? "text-[var(--lime)]" : score >= 40 ? "text-amber-400" : "text-red-400";
  return <span className={`num font-semibold ${color}`}>{score}</span>;
}

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  const color =
    score >= 80 ? "text-[var(--lime)]" : score >= 50 ? "text-amber-400" : "text-red-400";
  return (
    <span className={`num text-lg font-semibold ${color}`}>
      {score}
      <span className="text-[10px] text-muted-foreground">/100</span>
    </span>
  );
}
