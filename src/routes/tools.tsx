import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
  discoverToolIdeasFn,
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
} from "@/lib/tools.functions";

export const Route = createFileRoute("/tools")({ component: ToolsPage });

type ToolRow = {
  id: string;
  name: string;
  url_slug: string | null;
  status: string;
  origin: string | null;
  target_keyword: string | null;
  meta_title: string | null;
  published_url: string | null;
  demand_score: number | null;
  volume: number | null;
  aioseo_score_before: number | null;
  gate_enabled: string | null;
  gate_mode: string | null;
};

function ToolsPage() {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  const statusFn = useServerFn(toolsStatusFn);
  const listFn = useServerFn(listToolsFn);
  const discoverFn = useServerFn(discoverToolIdeasFn);
  const genFn = useServerFn(generateToolFn);
  const pubFn = useServerFn(publishToolFn);
  const syncFn = useServerFn(syncExistingToolsFn);
  const auditFn = useServerFn(auditToolFn);
  const optFn = useServerFn(optimizeToolFn);
  const cycleFn = useServerFn(runToolsCycleFn);
  const gateFn = useServerFn(setToolGateFn);
  const addFn = useServerFn(addToolFn);

  const { data: status } = useQuery({ queryKey: ["tools-status"], queryFn: () => statusFn({}) });
  const { data: tools, isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: () => listFn({ data: { limit: 400 } }),
  });

  const items = (tools?.items ?? []) as ToolRow[];
  const ideas = items.filter((t) => t.status === "idea");
  const generated = items.filter(
    (t) => ["generated", "review", "published"].includes(t.status) && t.origin !== "existing",
  );
  const existing = items
    .filter((t) => t.origin === "existing")
    .sort((a, b) => (a.aioseo_score_before ?? 999) - (b.aioseo_score_before ?? 999));

  const liveCount = items.filter(
    (t) => t.status === "published" || t.status === "optimized",
  ).length;
  const gatedCount = items.filter((t) => t.gate_enabled === "yes").length;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tools"] });

  const discoverMut = useMutation({
    mutationFn: () => discoverFn({ data: { geo: "global", limit: 10, persist: true } }),
    onSuccess: (r) => {
      toast.success(`Found ${r.ideas.length} ideas (${r.saved} new saved)`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const syncMut = useMutation({
    mutationFn: () => syncFn({ data: { category: "Developer Tools", maxPages: 10, perPage: 50 } }),
    onSuccess: (r) => {
      toast.success(
        `Synced ${r.imported} pages · avg AIOSEO ${r.avgAioseoScore ?? "?"} · ${r.lowScorers} below 70`,
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
        `Cycle: ${r.discovered} ideas · ${r.generated} generated · ${r.published} drafts · ${r.optimized} optimized`,
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMut = useMutation({
    mutationFn: () =>
      addFn({ data: { name: newName.trim(), targetKeyword: newKeyword.trim() || undefined } }),
    onSuccess: () => {
      toast.success("Tool idea added");
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

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 py-8">
        <header className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Wrench className="h-3 w-3 text-primary" />
            Free Tool Pages
          </div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">Tool Page Engine</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Discover, generate and publish interactive tool pages, optimize existing ones
            (slug-safe), and turn any tool into a signup magnet for console.kloudbean.com.
          </p>

          {/* Summary bar */}
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat label="Total tools" value={tools?.total ?? 0} />
            <Stat label="Live" value={liveCount} />
            <Stat label="Ideas" value={ideas.length} />
            <Stat label="Existing pages" value={existing.length} />
            <Stat label="Gated" value={gatedCount} accent />
          </div>

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

        {/* IDEA BRINGER + ADD */}
        <Section
          kicker="01"
          title="Idea bringer"
          action={
            <Button
              onClick={() => discoverMut.mutate()}
              disabled={discoverMut.isPending}
              style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            >
              {discoverMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Discover tool ideas
            </Button>
          }
        >
          {/* Manual add */}
          <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card/40 p-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                Tool name
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Kubernetes Cost Calculator"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                Focus keyword (optional)
              </label>
              <input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="kubernetes cost calculator"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => addMut.mutate()}
              disabled={addMut.isPending || newName.trim().length < 2}
            >
              {addMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add tool
            </Button>
          </div>

          {ideas.length === 0 ? (
            <Empty>No pending ideas. Discover ideas or add one above.</Empty>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {ideas.map((t) => (
                <div key={t.id} className="rounded-lg border border-border bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <code className="text-[11px] text-muted-foreground">{t.target_keyword}</code>
                    </div>
                    <div className="text-right">
                      <div className="num text-lg font-semibold">{t.demand_score ?? "—"}</div>
                      <div className="text-[9px] uppercase text-muted-foreground">demand</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    Vol {t.volume?.toLocaleString() ?? "n/a"} · /{t.url_slug}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    disabled={busyId === t.id}
                    onClick={() =>
                      run(t.id, () => genFn({ data: { toolId: t.id } }), `Generated ${t.name}`)
                    }
                  >
                    {busyId === t.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wrench className="mr-2 h-4 w-4" />
                    )}
                    Generate tool
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* GENERATED / NEW TOOLS */}
        <Section kicker="02" title="Generated tools (publish as draft first)">
          {generated.length === 0 ? (
            <Empty>Generate a tool from an idea above.</Empty>
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
                    variant="outline"
                    disabled={busyId === t.id}
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
          title="Optimize existing tool pages"
          desc="Slug-safe · additive only"
          action={
            <Button variant="outline" onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
              {syncMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync from WordPress
            </Button>
          }
        >
          {existing.length === 0 ? (
            <Empty>Click “Sync from WordPress” to pull your Developer Tools pages.</Empty>
          ) : (
            <ToolTable
              rows={existing}
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
                    onClick={() => run(t.id, () => auditFn({ data: { toolId: t.id } }), "Audited")}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === t.id}
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
                </>
              )}
            />
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
                <div className="line-clamp-1 font-medium">{t.name}</div>
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

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
      <div className={`num text-2xl font-semibold ${accent ? "text-[var(--lime)]" : ""}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
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
