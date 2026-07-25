import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  discoverToolPoolFn,
  discoverKloudgraphIdeasFn,
  dismissToolFn,
  generateToolFn,
  publishToolFn,
  syncExistingToolsTrackedFn,
  auditToolFn,
  optimizeToolFn,
  listToolsFn,
  toolsStatusFn,
  runToolsCycleFn,
  setToolGateFn,
  addToolFn,
  syncToolPerformanceFn,
  revertToolFn,
  listToolCategoriesFn,
  getToolsCategoryFn,
  setToolsCategoryFn,
  pluginDiagnosticFn,
  fixToolHtmlFn,
  scanToolHtmlFn,
  enqueueFixAllHtmlFn,
  getProcessRunFn,
} from "@/lib/tools.functions";
import { ProcessRunPanel } from "@/components/ProcessRunPanel";
import {
  enqueueToolJobsFn,
  drainJobsFn,
  jobsSummaryFn,
  batchProgressFn,
  batchItemsFn,
} from "@/lib/jobs.functions";

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
  meta_description: string | null;
  word_count: number | null;
  published_url: string | null;
  demand_score: number | null;
  volume: number | null;
  difficulty: number | null;
  aioseo_score_before: number | null;
  optimize_report: {
    dry_run?: boolean;
    before?: {
      aioseo_score?: number | null;
      has_faq?: boolean;
      has_schema?: boolean;
      word_count?: number;
    };
    after?: { aioseo_score?: number | null; meta_title?: string; focus_keyword?: string };
    changes?: string[];
  } | null;
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
    competitors?: string[];
    bestCompetitorPosition?: number | null;
  } | null;
  engine_source: string | null;
};

type PoolSort = "score" | "volume" | "audience" | "kd";

type OptimizeReport = {
  dry_run?: boolean;
  before?: {
    aioseo_score?: number | null;
    readability_score?: number | null;
    has_faq?: boolean;
    has_schema?: boolean;
    word_count?: number;
    has_elementor?: boolean;
  };
  after?: {
    aioseo_score?: number | null;
    readability_score?: number | null;
    sections?: number | null;
    meta_title?: string;
    meta_description?: string;
    focus_keyword?: string;
    schema_injected?: boolean;
  };
  changes?: string[];
};

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
  const syncFn = useServerFn(syncExistingToolsTrackedFn);
  const runFn = useServerFn(getProcessRunFn);
  const auditFn = useServerFn(auditToolFn);
  const optFn = useServerFn(optimizeToolFn);
  const cycleFn = useServerFn(runToolsCycleFn);
  const gateFn = useServerFn(setToolGateFn);
  const addFn = useServerFn(addToolFn);
  const poolFn = useServerFn(discoverToolPoolFn);
  const kgIdeasFn = useServerFn(discoverKloudgraphIdeasFn);
  const dismissFn = useServerFn(dismissToolFn);
  const perfFn = useServerFn(syncToolPerformanceFn);
  const revertFn = useServerFn(revertToolFn);
  const enqueueFn = useServerFn(enqueueToolJobsFn);
  const drainFn = useServerFn(drainJobsFn);
  const jobsFn = useServerFn(jobsSummaryFn);
  const batchProgressFn2 = useServerFn(batchProgressFn);
  const batchItemsFn2 = useServerFn(batchItemsFn);
  const catsFn = useServerFn(listToolCategoriesFn);
  const getCatFn = useServerFn(getToolsCategoryFn);
  const setCatFn = useServerFn(setToolsCategoryFn);
  // Bulk run progress: { done, total, label } while a batch is QUEUEING
  // (the brief window between clicking the button and the jobs landing in
  // the DB). Once queued, live progress comes from activeBatchId below.
  const [bulk, setBulk] = useState<{ done: number; total: number; label: string } | null>(null);
  // The most recent batch this tab kicked off — drives the live progress bar
  // + log panel until it finishes. Persisted to localStorage so a page
  // refresh mid-run doesn't lose track of it.
  const [activeBatchId, setActiveBatchId] = useState<string | null>(() =>
    typeof window !== "undefined" ? window.localStorage.getItem("kbseo-active-batch") : null,
  );
  const [activeBatchLabel, setActiveBatchLabel] = useState<string | null>(() =>
    typeof window !== "undefined" ? window.localStorage.getItem("kbseo-active-batch-label") : null,
  );
  const [showBatchLog, setShowBatchLog] = useState(false);

  const setActiveBatch = (id: string | null, label: string | null) => {
    setActiveBatchId(id);
    setActiveBatchLabel(label);
    if (typeof window !== "undefined") {
      if (id) {
        window.localStorage.setItem("kbseo-active-batch", id);
        window.localStorage.setItem("kbseo-active-batch-label", label ?? "");
      } else {
        window.localStorage.removeItem("kbseo-active-batch");
        window.localStorage.removeItem("kbseo-active-batch-label");
      }
    }
  };

  const { data: batchProgress } = useQuery({
    queryKey: ["batch-progress", activeBatchId],
    queryFn: () => batchProgressFn2({ data: { batchId: activeBatchId! } }),
    enabled: !!activeBatchId,
    refetchInterval: (query) => {
      const p = query.state.data?.progress;
      // Stop polling once nothing is pending/running for this batch.
      if (p && p.pending === 0 && p.running === 0) return false;
      return 2000;
    },
  });
  const { data: batchLog } = useQuery({
    queryKey: ["batch-items", activeBatchId],
    queryFn: () => batchItemsFn2({ data: { batchId: activeBatchId! } }),
    enabled: !!activeBatchId && showBatchLog,
    refetchInterval: 2500,
  });

  const progress = batchProgress?.progress;
  const batchFinished = progress && progress.pending === 0 && progress.running === 0;
  // Auto-clear the tracked batch a short while after it finishes, but leave
  // it visible long enough for the user to see the final state.
  const dismissBatch = () => {
    setActiveBatch(null, null);
    setShowBatchLog(false);
  };
  // Before/after optimization report being viewed in the modal.
  const [reportView, setReportView] = useState<{ name: string; report: OptimizeReport } | null>(
    null,
  );
  // Legacy "full HTML document pasted into a widget" bug scan result.
  const [htmlScan, setHtmlScan] = useState<{
    totalOnWp: number;
    totalScanned: number;
    totalAffected: number;
    affectedSlugs: { slug: string; title: string; affected_widgets: number }[];
  } | null>(null);

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

  // Which WordPress category to work on (persisted; default Developer Tools).
  const { data: catData } = useQuery({
    queryKey: ["tools-category"],
    queryFn: () => getCatFn({}),
  });
  const selectedCategory = catData?.category ?? "Developer Tools";
  const { data: catsData } = useQuery({
    queryKey: ["wp-categories"],
    queryFn: () => catsFn({}),
  });
  const categories = (catsData?.categories ?? []) as {
    id: number;
    name: string;
    slug: string;
    taxonomy?: string;
    page_count: number;
  }[];
  const setCatMut = useMutation({
    mutationFn: (category: string) => setCatFn({ data: { category } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["tools-category"] });
      toast.success(
        `Category set to “${r.category}”. Click “Sync from WordPress” to pull its pages.`,
      );
    },
  });

  // New-tool sections (idea pool, built tools) are always Developer Tools — that's
  // the only category the engine GENERATES tools for. The existing-pages optimizer
  // works on whichever WordPress category is selected.
  const allRows = (tools?.items ?? []) as ToolRow[];
  const devToolRows = allRows.filter(
    (t) => (t.category ?? "Developer Tools") === "Developer Tools",
  );

  const poolAll = devToolRows.filter((t) => t.status === "pool" || t.status === "idea");
  const generated = devToolRows.filter(
    (t) => ["generated", "review", "published"].includes(t.status) && t.origin !== "existing",
  );
  const existingAll = allRows.filter(
    (t) => t.origin === "existing" && (t.category ?? "Developer Tools") === selectedCategory,
  );

  const liveCount = devToolRows.filter(
    (t) => t.status === "published" || t.status === "optimized",
  ).length;
  const gatedCount = devToolRows.filter((t) => t.gate_enabled === "yes").length;
  const needsOpt = existingAll.filter((t) => (t.aioseo_score_before ?? 0) < 70).length;
  const totalClicks = [...devToolRows, ...existingAll].reduce((s, t) => s + (t.gsc_clicks ?? 0), 0);

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

  const kgIdeasMut = useMutation({
    mutationFn: () => kgIdeasFn({ data: { limit: 40, minAudience: 12, minVolume: 5 } }),
    onSuccess: (r) => {
      if (r.stats.scanned === 0) {
        toast.info(
          "No KLOUDGRAPH data found — import competitor Semrush exports on the KLOUDGRAPH page first.",
        );
      } else {
        toast.success(
          `Competitor keyword mining: ${r.saved} new tool ideas (from ${r.stats.toolIntent} tool-intent keywords competitors already rank for)`,
        );
      }
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [syncRunId, setSyncRunId] = useState<string | null>(null);
  const [showSyncLog, setShowSyncLog] = useState(false);
  const { data: syncRun } = useQuery({
    queryKey: ["sync-run", syncRunId],
    queryFn: () => runFn({ data: { id: syncRunId! } }),
    enabled: !!syncRunId,
    refetchInterval: (query) => (query.state.data?.run?.status === "running" ? 1500 : false),
  });
  const syncFinished = syncRun?.run?.status === "done" || syncRun?.run?.status === "error";
  const syncRefreshedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!syncFinished || !syncRunId) return;
    if (syncRefreshedRef.current === syncRunId) return;
    syncRefreshedRef.current = syncRunId;
    invalidate();
    const r = syncRun?.run?.result as
      | {
          imported?: number;
          totalOnWp?: number;
          removedStale?: number;
          skipped?: number;
          avgAioseoScore?: number | null;
          categoryFound?: boolean;
          pluginStale?: boolean;
        }
      | undefined;
    if (syncRun?.run?.status === "error") {
      toast.error(syncRun?.run?.error ?? "Sync failed");
    } else if (r?.pluginStale) {
      toast.error(
        "WordPress plugin is serving stale code (multiple PHP workers, mixed versions). Sync aborted so wrong pages aren't imported. Delete + reinstall the plugin and clear PHP OPcache — details on the amber banner above.",
      );
    } else if (r?.categoryFound === false) {
      toast.error(
        `Category "${selectedCategory}" not found in WordPress — pick another category or check the spelling.`,
      );
    } else if (r?.imported === 0 && (r?.totalOnWp ?? 0) === 0) {
      toast.info(
        `WordPress has 0 pages in "${selectedCategory}". If you expect pages here, they may not be assigned to this category on WP.`,
      );
    } else if (r) {
      toast.success(
        `Synced ${r.imported}/${r.totalOnWp ?? r.imported} pages in "${selectedCategory}"${
          r.removedStale ? ` · removed ${r.removedStale} stale` : ""
        }${r.skipped ? ` · skipped ${r.skipped}` : ""} · avg AIOSEO ${r.avgAioseoScore ?? "?"}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncFinished, syncRunId]);

  const syncMut = useMutation({
    mutationFn: () => syncFn({ data: { category: selectedCategory, maxPages: 40, perPage: 50 } }),
    onSuccess: (r) => {
      toast.success(`Sync started for "${selectedCategory}" — watch the progress bar below.`);
      setSyncRunId(r.processRunId);
      setShowSyncLog(true);
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

  // Like run(), but captures the optimize/preview report so we can show a
  // before/after panel of exactly what was (or will be) implemented.
  const runReport = async (id: string, name: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusyId(id);
    try {
      const r = (await fn()) as { report?: OptimizeReport };
      toast.success(okMsg);
      if (r?.report) setReportView({ name, report: r.report });
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
  // The server dedupes against pages that already have a pending/running job,
  // so clicking twice never stacks duplicate work.
  const enqueue = async (
    type: "generate_tool" | "optimize_tool",
    rows: ToolRow[],
    batchLabel?: string,
  ) => {
    if (!rows.length) {
      toast.info("Nothing to queue — every matching page is already optimized or in the queue.");
      return;
    }
    setBulk({ done: 0, total: rows.length, label: "Queueing" });
    try {
      const r = (await enqueueFn({
        data: { type, toolIds: rows.map((t) => t.id), batchLabel },
      })) as {
        queued: number;
        skipped?: number;
        batchId: string | null;
        batchLabel: string;
        alreadyQueued?: boolean;
      };
      if (!r.queued) {
        toast.info(
          `Already in the queue — skipped ${r.skipped ?? rows.length} page(s) that already have a pending or running job. Nothing new added.`,
        );
      } else {
        toast.success(
          `Queued ${r.queued} job(s) — running in the background${
            r.skipped ? ` · skipped ${r.skipped} already queued` : ""
          }`,
        );
        if (r.batchId) {
          setActiveBatch(r.batchId, r.batchLabel);
          setShowBatchLog(true);
        }
      }
      qc.invalidateQueries({ queryKey: ["tool-jobs"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBulk(null);
    }
  };

  const bulkBuild = () =>
    enqueue("generate_tool", pool.slice(0, 200), `Building ${Math.min(pool.length, 200)} tools`);

  // Only queue pages that aren't already optimized — re-running the optimizer on
  // a page that's already been optimized is redundant work. Use the per-row
  // "Optimize" button to explicitly re-optimize a single page.
  const optimizable = (rows: ToolRow[]) => rows.filter((t) => t.status !== "optimized");

  const bulkOptimize = () => {
    const targets = optimizable(existing).slice(0, 500);
    enqueue("optimize_tool", targets, `Optimizing ${targets.length} filtered pages`);
  };
  const bulkOptimizeAll = () => {
    const targets = optimizable(existingAll).slice(0, 2000);
    const alreadyOptimized = existingAll.length - optimizable(existingAll).length;
    if (!targets.length) {
      toast.info(
        `All ${existingAll.length} pages in "${selectedCategory}" are already optimized — nothing to do.`,
      );
      return;
    }
    if (
      !window.confirm(
        `Optimize ${targets.length} page(s) in "${selectedCategory}"${
          alreadyOptimized ? ` (skipping ${alreadyOptimized} already optimized)` : ""
        }? This adds SEO content (intro, FAQ, schema, meta) to each page — nothing is removed and slugs never change, but it does write to every live page. Runs in the background; pages already in the queue are skipped automatically.`,
      )
    ) {
      return;
    }
    enqueue(
      "optimize_tool",
      targets,
      `Optimize ALL — ${targets.length} pages in "${selectedCategory}"`,
    );
  };

  const drainMut = useMutation({
    mutationFn: () => drainFn({ data: { max: 10 } }),
    onSuccess: (r) => {
      toast.success(`Ran ${r.processed} jobs (${r.done} done, ${r.failed} failed/retry)`);
      qc.invalidateQueries({ queryKey: ["tool-jobs"] });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const scanHtmlFn = useServerFn(scanToolHtmlFn);
  const fixHtmlFn = useServerFn(fixToolHtmlFn);
  const enqueueFixAllFn = useServerFn(enqueueFixAllHtmlFn);

  const scanHtmlMut = useMutation({
    mutationFn: () => scanHtmlFn({ data: { category: selectedCategory, maxPages: 20 } }),
    onSuccess: (r) => {
      setHtmlScan(r);
      toast[r.totalAffected > 0 ? "error" : "success"](
        r.totalAffected > 0
          ? `Found ${r.totalAffected} of ${r.totalScanned} pages with a broken nested-HTML-document bug`
          : `No pages affected — scanned ${r.totalScanned} of ${r.totalOnWp}`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fixAllHtmlMut = useMutation({
    mutationFn: () => {
      if (
        !window.confirm(
          `Fix the nested-HTML-document bug on all ${htmlScan?.totalAffected ?? 0} affected pages in "${selectedCategory}"? This only removes the redundant <!DOCTYPE>/<html>/<head> wrapper — the tool itself, its styling, and the slug are never touched. Runs in the background.`,
        )
      ) {
        return Promise.reject(new Error("cancelled"));
      }
      return enqueueFixAllFn({ data: { category: selectedCategory } });
    },
    onSuccess: (r) => {
      toast.success(`Queued ${r.queued} page(s) to fix — running in the background`);
      if (r.batchId) {
        setActiveBatch(r.batchId, r.batchLabel);
        setShowBatchLog(true);
      }
      qc.invalidateQueries({ queryKey: ["tool-jobs"] });
    },
    onError: (e: Error) => {
      if (e.message !== "cancelled") toast.error(e.message);
    },
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
            <StatusPill
              ok={isPluginAtLeast(status?.pluginVersion, "1.7.0")}
              label={`Plugin v${status?.pluginVersion ?? "?"}`}
            />
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

        <PluginHealthBanner
          pluginVersion={status?.pluginVersion}
          pluginConfigured={!!status?.pluginConfigured}
        />

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

        {/* ACTIVE BATCH — live progress bar + per-item log for the run this
            tab most recently kicked off (bulk build/optimize/fix-html). */}
        {activeBatchId && progress && progress.total > 0 && (
          <BatchProgressPanel
            label={activeBatchLabel ?? "Running…"}
            progress={progress}
            finished={!!batchFinished}
            showLog={showBatchLog}
            onToggleLog={() => setShowBatchLog((v) => !v)}
            onDismiss={dismissBatch}
            items={batchLog?.items ?? []}
          />
        )}

        {/* JOB QUEUE / ACTIVITY */}
        {jobs && (jobs.counts.pending > 0 || jobs.counts.running > 0 || jobs.recent.length > 0) && (
          <div className="mb-8 rounded-xl border border-border bg-card/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Background queue (all runs)
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
              and the queue drains itself automatically in the background (no need to enable
              Autopilot). Watch progress on the{" "}
              <a href="/activity" className="text-primary underline">
                Activity
              </a>{" "}
              page; use “Run now” only if you want to nudge it immediately.
            </p>
          </div>
        )}

        {/* IDEA POOL */}
        <Section
          kicker="01"
          title="Idea pool"
          desc="Real demand · audience-fit · you choose what to build"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => kgIdeasMut.mutate()}
                disabled={kgIdeasMut.isPending}
                title="Mine our own KLOUDGRAPH/Semrush warehouse for tool-intent keywords competitors already rank for — the strongest signal, since it's real traffic a rival is already getting."
              >
                {kgIdeasMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Ideas from competitor data
              </Button>
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
            </div>
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
                          {t.engine_source === "kloudgraph" && t.idea_data?.competitors?.length ? (
                            <div
                              className="mt-1 line-clamp-1 text-[10px] text-amber-600"
                              title={`Competitors already ranking: ${t.idea_data.competitors.join(", ")}`}
                            >
                              {t.idea_data.competitors.length} competitor
                              {t.idea_data.competitors.length > 1 ? "s" : ""} already rank
                              {t.idea_data.bestCompetitorPosition
                                ? ` (best #${t.idea_data.bestCompetitorPosition})`
                                : ""}
                            </div>
                          ) : null}
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
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setCatMut.mutate(e.target.value)}
                title="Choose which WordPress category of pages to sync and optimize."
                className="rounded-md border border-border bg-background px-2.5 py-2 text-sm"
              >
                {/* Ensure the current value is always present even before categories load */}
                {!categories.some((c) => c.name === selectedCategory) && (
                  <option value={selectedCategory}>{selectedCategory}</option>
                )}
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.page_count})
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => scanHtmlMut.mutate()}
                disabled={scanHtmlMut.isPending}
                title="Check how many pages have a full HTML document (DOCTYPE/head/title) accidentally pasted inside the tool widget — a legacy bug from before this engine existed."
              >
                {scanHtmlMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Scan for broken HTML
              </Button>
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
                disabled={syncMut.isPending || syncRun?.run?.status === "running"}
                title={`Load all pages in the “${selectedCategory}” category from WordPress so you can optimize them.`}
              >
                {syncMut.isPending || syncRun?.run?.status === "running" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync from WordPress
              </Button>
            </div>
          }
        >
          {syncRunId && syncRun?.run && (
            <ProcessRunPanel
              run={syncRun.run}
              showLog={showSyncLog}
              onToggleLog={() => setShowSyncLog((v) => !v)}
              onDismiss={() => setSyncRunId(null)}
            />
          )}
          {htmlScan && (
            <div
              className={`mb-4 rounded-lg border p-4 text-sm ${
                htmlScan.totalAffected > 0
                  ? "border-red-500/40 bg-red-500/10"
                  : "border-[var(--lime)]/30 bg-[var(--lime)]/10"
              }`}
            >
              {htmlScan.totalAffected > 0 ? (
                <>
                  <div className="mb-1 font-semibold text-red-300">
                    {htmlScan.totalAffected} page(s) have a broken nested-HTML-document bug
                  </div>
                  <p className="mb-3 text-xs text-red-200/80">
                    These pages have the AI&apos;s full HTML output (with its own{" "}
                    <code>&lt;!DOCTYPE&gt;</code>/<code>&lt;head&gt;</code>/
                    <code>&lt;title&gt;</code>) pasted whole into the tool widget instead of just
                    the inner content — this breaks page layout and confuses SEO meta. Fixing only
                    removes that redundant wrapper; the tool itself, its styling, and the slug are
                    never touched.
                  </p>
                  <Button
                    size="sm"
                    disabled={fixAllHtmlMut.isPending}
                    onClick={() => fixAllHtmlMut.mutate()}
                    style={{
                      background: "var(--gradient-brand)",
                      color: "var(--brand-foreground)",
                    }}
                  >
                    {fixAllHtmlMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    Fix all {htmlScan.totalAffected} affected page(s)
                  </Button>
                  <ul className="mt-3 max-h-32 space-y-0.5 overflow-y-auto font-mono text-[11px] text-red-200/70">
                    {htmlScan.affectedSlugs.slice(0, 20).map((a) => (
                      <li key={a.slug}>
                        /{a.slug} — {a.affected_widgets} widget(s)
                      </li>
                    ))}
                    {htmlScan.affectedSlugs.length > 20 && (
                      <li>…and {htmlScan.affectedSlugs.length - 20} more</li>
                    )}
                  </ul>
                </>
              ) : (
                <div className="text-[var(--lime)]">
                  No broken pages found in this category ({htmlScan.totalScanned} scanned).
                </div>
              )}
            </div>
          )}
          {existingAll.length === 0 ? (
            <Empty>
              Pick a category above, then click “Sync from WordPress” to pull its pages.
            </Empty>
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
                  title="Queue only the pages matching your current search/score filter"
                >
                  {bulk?.label === "Queueing" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Queue filtered ({Math.min(existing.length, 500)})
                </Button>
                <Button
                  size="sm"
                  disabled={!!bulk || existingAll.length === 0}
                  onClick={bulkOptimizeAll}
                  title="Queue EVERY page in this category, ignoring search/score filters — runs in the background."
                  style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
                >
                  {bulk?.label === "Queueing" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Optimize ALL ({existingAll.length})
                </Button>
              </div>
              <ToolTable
                rows={existing.slice(0, 150)}
                busyId={busyId}
                showScore
                showMeta
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
                        runReport(
                          t.id,
                          t.name,
                          () => optFn({ data: { toolId: t.id, dryRun: true } }),
                          "Preview ready — see what will be implemented",
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
                        runReport(
                          t.id,
                          t.name,
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
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === t.id}
                      title="Fix a legacy bug: remove a full HTML document (DOCTYPE/head/title) accidentally pasted inside this page's tool widget. Doesn't touch the tool itself or the slug."
                      onClick={() =>
                        run(
                          t.id,
                          () => fixHtmlFn({ data: { toolId: t.id, dryRun: false } }),
                          "Checked/fixed HTML wrapper",
                        )
                      }
                    >
                      Fix HTML
                    </Button>
                    {t.optimize_report && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="See the before/after and exactly what was implemented on this page."
                        onClick={() =>
                          setReportView({
                            name: t.name,
                            report: t.optimize_report as OptimizeReport,
                          })
                        }
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    )}
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

      {reportView && (
        <OptimizeReportModal
          name={reportView.name}
          report={reportView.report}
          onClose={() => setReportView(null)}
        />
      )}
    </AppLayout>
  );
}

/**
 * Live progress bar + scrollable per-item log for a running bulk batch
 * (build/optimize/fix-html). Polls the server every couple seconds while
 * anything is pending/running, and shows a clear done/error summary once
 * finished — so the user can see exactly what completed and what didn't
 * without guessing from a single end-of-run toast.
 */
function BatchProgressPanel({
  label,
  progress,
  finished,
  showLog,
  onToggleLog,
  onDismiss,
  items,
}: {
  label: string;
  progress: { total: number; pending: number; running: number; done: number; error: number };
  finished: boolean;
  showLog: boolean;
  onToggleLog: () => void;
  onDismiss: () => void;
  items: { id: string; label: string | null; status: string; error: string | null }[];
}) {
  const { total, done, error, pending, running } = progress;
  const settled = done + error;
  const pct = total > 0 ? Math.min(100, Math.round((settled / total) * 100)) : 0;

  return (
    <div
      className={`mb-8 rounded-xl border p-4 ${
        finished
          ? error > 0
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-[var(--lime)]/30 bg-[var(--lime)]/5"
          : "border-primary/40 bg-primary/5"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!finished && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onToggleLog}>
            {showLog ? "Hide log" : "Show log"}
          </Button>
          {finished && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: error > 0 ? "var(--gradient-brand)" : "var(--gradient-brand)",
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="num font-medium text-foreground">
          {settled} of {total} complete ({pct}%)
        </span>
        {pending > 0 && <span className="text-amber-400">{pending} pending</span>}
        {running > 0 && <span className="text-primary">{running} running</span>}
        <span className="text-[var(--lime)]">{done} done</span>
        {error > 0 && <span className="text-red-400">{error} failed</span>}
      </div>

      {showLog && (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border bg-background/60 font-mono text-[11px]">
          {items.length === 0 ? (
            <div className="p-3 text-muted-foreground">Waiting for jobs to start…</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((it) => (
                <li key={it.id} className="flex items-start gap-2 px-3 py-1.5">
                  <StatusDot status={it.status} />
                  <span className="flex-1 truncate text-foreground/90">{it.label ?? it.id}</span>
                  {it.status === "error" && it.error && (
                    <span className="max-w-[280px] truncate text-red-400" title={it.error}>
                      {it.error}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "done"
      ? "bg-[var(--lime)]"
      : status === "error"
        ? "bg-red-400"
        : status === "running"
          ? "bg-primary animate-pulse"
          : "bg-amber-400";
  const label =
    status === "done"
      ? "done"
      : status === "error"
        ? "error"
        : status === "running"
          ? "running"
          : "pending";
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${color}`} title={label} />;
}

function OptimizeReportModal({
  name,
  report,
  onClose,
}: {
  name: string;
  report: OptimizeReport;
  onClose: () => void;
}) {
  const before = report.before ?? {};
  const after = report.after ?? {};
  const changes = report.changes ?? [];
  const preview = report.dry_run;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{name}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {preview
            ? "Preview — these changes will be applied when you click optimize. Nothing changed yet."
            : "Optimization applied. The page URL was not changed; changes are additive."}
        </p>

        {/* Before / After scores — computed by our own engine (no AIOSEO Pro). */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Before · SEO score
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {before.aioseo_score ?? "—"}
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {before.readability_score != null ? `readability ${before.readability_score} · ` : ""}
              {before.has_faq ? "FAQ ✓" : "no FAQ"} · {before.has_schema ? "schema ✓" : "no schema"}{" "}
              · {before.word_count ?? 0} words
            </div>
          </div>
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              After{preview ? " (expected)" : ""} · SEO score
            </div>
            <div className="mt-1 text-2xl font-semibold text-primary">
              {after.aioseo_score ?? (preview ? "↑" : "—")}
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {after.readability_score != null ? `readability ${after.readability_score}` : ""}
              {after.readability_score != null && after.focus_keyword ? " · " : ""}
              {after.focus_keyword ? `keyword: ${after.focus_keyword}` : ""}
            </div>
          </div>
        </div>

        {/* Changes list */}
        <div className="mb-2 text-sm font-medium">
          {preview ? "What will be implemented" : "What was implemented"}
        </div>
        {changes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Meta/SEO refresh only.</p>
        ) : (
          <ul className="space-y-1.5">
            {changes.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        )}

        {after.meta_title && (
          <div className="mt-4 rounded-lg border border-border bg-background/60 p-3 text-xs">
            <div className="text-muted-foreground">New meta title</div>
            <div className="font-medium">{after.meta_title}</div>
            {after.meta_description && (
              <>
                <div className="mt-2 text-muted-foreground">New meta description</div>
                <div>{after.meta_description}</div>
              </>
            )}
          </div>
        )}

        <p className="mt-3 text-[11px] text-muted-foreground">
          This SEO score is computed by the Kloudbean SEO Engine itself — a real weighted on-page +
          readability analysis, no AIOSEO Pro license needed. It moves as the fixes above are
          applied.
        </p>

        {!preview && (after.aioseo_score ?? 0) === 0 && (
          <p className="mt-2 text-[11px] text-amber-500">
            The score is still reading 0 after optimizing — this means the WordPress plugin is out
            of date. Upload the latest <code>kloudbean-seo-engine.zip</code> (v1.13.0+) and activate
            it, then re-sync. The SEO fixes above (title, description, focus keyword, schema,
            content, links) were still applied regardless.
          </p>
        )}
      </div>
    </div>
  );
}

/** Shared table for tool rows with a gate toggle + custom actions. */
function ToolTable({
  rows,
  busyId,
  showScore,
  showMeta,
  onGate,
  onGateMode,
  actions,
}: {
  rows: ToolRow[];
  busyId: string | null;
  showScore?: boolean;
  /** Show a "Meta & Content" column with current title/description/word count + an expand toggle. */
  showMeta?: boolean;
  onGate: (t: ToolRow) => void;
  onGateMode: (t: ToolRow, mode: "soft" | "hard") => void;
  actions: (t: ToolRow) => React.ReactNode;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/60">
      <table className="w-full text-sm">
        <thead className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            {showScore && (
              <th
                className="px-4 py-2.5 text-left"
                title="Real on-page SEO score computed by the Kloudbean SEO Engine — no AIOSEO Pro needed."
              >
                SEO
              </th>
            )}
            <th className="px-4 py-2.5 text-left">Tool</th>
            {showMeta && <th className="px-4 py-2.5 text-left">Meta &amp; content</th>}
            <th className="px-4 py-2.5 text-left">Status</th>
            <th className="px-4 py-2.5 text-right">Traffic</th>
            <th className="px-4 py-2.5 text-left">Gate</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <Fragment key={t.id}>
              <tr className="border-t border-border/60">
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
                {showMeta && (
                  <td className="max-w-[280px] px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      className="text-left"
                      title="Click to see the full meta title, description, and content stats"
                    >
                      <div className="line-clamp-1 text-[11px] font-medium text-foreground/90">
                        {t.meta_title || (
                          <span className="text-muted-foreground">no title set</span>
                        )}
                      </div>
                      <div className="line-clamp-1 text-[10px] text-muted-foreground">
                        {t.meta_description || "no description set"}
                      </div>
                      <div className="mt-0.5 text-[10px] text-primary underline">
                        {expandedId === t.id ? "hide" : "view"} · {t.word_count ?? "—"} words
                      </div>
                    </button>
                  </td>
                )}
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
              {showMeta && expandedId === t.id && (
                <tr key={`${t.id}-expanded`} className="border-t border-border/60 bg-background/40">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Meta title
                        </div>
                        <div className="mt-0.5 text-sm">
                          {t.meta_title || <span className="text-muted-foreground">not set</span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {t.meta_title?.length ?? 0} characters
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Meta description
                        </div>
                        <div className="mt-0.5 text-sm">
                          {t.meta_description || (
                            <span className="text-muted-foreground">not set</span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {t.meta_description?.length ?? 0} characters
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Content
                        </div>
                        <div className="mt-0.5 text-sm">
                          {t.word_count != null ? `${t.word_count} words` : "not synced yet"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Focus keyword
                        </div>
                        <div className="mt-0.5 text-sm">
                          {t.target_keyword || (
                            <span className="text-muted-foreground">not set</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {t.published_url && (
                      <a
                        href={t.published_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-xs text-primary underline"
                      >
                        Open live page →
                      </a>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
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

function PluginHealthBanner({
  pluginVersion,
  pluginConfigured,
}: {
  pluginVersion?: string;
  pluginConfigured: boolean;
}) {
  const diagFn = useServerFn(pluginDiagnosticFn);
  const [result, setResult] = useState<Awaited<ReturnType<typeof diagFn>> | null>(null);
  const [busy, setBusy] = useState(false);
  const outdated = pluginConfigured && !isPluginAtLeast(pluginVersion, "1.7.1");
  if (!pluginConfigured) return null;

  const run = async () => {
    setBusy(true);
    try {
      setResult(await diagFn({ data: { category: "Developer Tools" } }));
    } catch (e) {
      toast.error(String((e as Error)?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const inconsistent = !!result?.inconsistent;
  const banner = outdated || inconsistent;
  if (!banner && !result) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
      <div className="mb-1 font-semibold">
        Multiple plugin folders on WordPress — clean up in the file manager
      </div>
      <p className="mb-2 text-xs text-amber-200/90">
        Your WordPress is running <b>several copies of the plugin at once</b> from different folders
        in <code>wp-content/plugins/</code>. WordPress loads all of them and they fight each other —
        that's why `/health` reports v{pluginVersion ?? "?"} but different endpoints behave like
        different versions. Deactivating and reinstalling in WP admin only removes the one folder WP
        admin shows you; the others stay on disk and keep loading.
      </p>
      <div className="mb-2 text-xs font-medium text-amber-200/90">
        Do this on the WordPress server (5 minutes):
      </div>
      <ol className="ml-4 list-decimal space-y-0.5 text-xs text-amber-200/90">
        <li>
          Open <b>Kloudbean panel → your WordPress app → File Manager</b> (or connect via SFTP).
        </li>
        <li>
          Go to <code>wp-content/plugins/</code>.
        </li>
        <li>
          Delete <b>every</b> folder whose name starts with <code>kloudbean-seo-engine</code> (there
          may be <code>kloudbean-seo-engine</code>, <code>kloudbean-seo-engine-1</code>,{" "}
          <code>kloudbean-seo-engine-2</code>, etc.). All of them.
        </li>
        <li>
          Back in WordPress admin → <b>Plugins → Add New → Upload Plugin</b> → pick{" "}
          <code>wordpress-plugin/kloudbean-seo-engine.zip</code> from your project → Install →
          Activate.
        </li>
        <li>
          If your host has a <b>"Purge OPcache"</b> or <b>"Restart PHP-FPM"</b> button, click it.
        </li>
        <li>
          Click <b>Diagnose plugin</b> below — both probes should agree on <b>v1.7.1</b> and the
          same total.
        </li>
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={run}
          disabled={busy}
          title="Hit the WordPress plugin twice and show what each request returned, so you can see whether workers agree."
        >
          {busy ? (
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
          ) : (
            <Search className="mr-1.5 h-3 w-3" />
          )}
          Diagnose plugin
        </Button>
      </div>

      {result && (
        <pre className="mt-3 max-h-72 overflow-auto rounded bg-black/30 p-3 text-[10px] leading-tight text-amber-100/90">
          {JSON.stringify(
            {
              pings: result.pings,
              probes: result.listChecks,
              inconsistent: result.inconsistent,
              versionsSeen: result.versionsSeen,
              totalsSeen: result.totalsSeen,
            },
            null,
            2,
          )}
        </pre>
      )}
    </div>
  );
}

function isPluginAtLeast(current: string | undefined, minimum: string): boolean {
  if (!current) return false;
  const parts = (s: string) => s.split(".").map((n) => parseInt(n, 10) || 0);
  const [a, b, c] = parts(current);
  const [x, y, z] = parts(minimum);
  if (a !== x) return a > x;
  if (b !== y) return b > y;
  return c >= z;
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
