import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Activity as ActivityIcon,
  Loader2,
  RefreshCw,
  RotateCw,
  Wrench,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Ban,
  Download,
  Bot,
  Database,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  getActivityFeedFn,
  getActivityRunFn,
  getActivityBatchItemsFn,
  retryOperationFn,
  fixStuckFn,
  cancelActivityRunFn,
  drainQueueNowFn,
} from "@/lib/activity.functions";

export const Route = createFileRoute("/activity")({ component: ActivityPage });

type ActivityLog = { at: string; level: string; message: string };
type ActivityOp = {
  source: "run" | "batch";
  id: string;
  kind: string;
  label: string;
  status: string;
  total: number;
  pending: number;
  running: number;
  done: number;
  failed: number;
  pct: number;
  startedAt: string | null;
  updatedAt: string | null;
  error: string | null;
  stuck: boolean;
  retryable: boolean;
  canCancel: boolean;
  logPreview: ActivityLog[];
};

function kindIcon(kind: string) {
  switch (kind) {
    case "semrush_import":
      return Download;
    case "sync_tools":
    case "fix_tool_html":
    case "fix_html":
      return RefreshCw;
    case "autopilot_cycle":
      return Bot;
    case "generate_tool":
    case "bulk_generate":
      return Wrench;
    case "optimize_tool":
    case "bulk_optimize":
      return Zap;
    case "kg_rebuild":
      return Database;
    default:
      return ActivityIcon;
  }
}

function ActivityPage() {
  const qc = useQueryClient();
  const feedFn = useServerFn(getActivityFeedFn);
  const retryFn = useServerFn(retryOperationFn);
  const fixStuckFn2 = useServerFn(fixStuckFn);
  const cancelFn = useServerFn(cancelActivityRunFn);
  const drainFn = useServerFn(drainQueueNowFn);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["activity-feed"],
    queryFn: () => feedFn({ data: { limit: 40 } }),
    // Poll fast while anything is live, slow to a gentle background refresh otherwise.
    refetchInterval: (query) => (query.state.data?.hasActive ? 2000 : 10000),
  });

  const ops = (data?.ops ?? []) as ActivityOp[];
  const summary = data?.summary;
  const invalidate = () => qc.invalidateQueries({ queryKey: ["activity-feed"] });

  const retryMut = useMutation({
    mutationFn: (op: ActivityOp) => retryFn({ data: { source: op.source, id: op.id } }),
    onSuccess: (r) => {
      if (r.ok) toast.success("message" in r && r.message ? r.message : "Retrying…");
      else toast.error(r.error ?? "Could not retry");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setBusy(null),
  });

  const fixStuckMut = useMutation({
    mutationFn: () => fixStuckFn2({ data: { staleMinutes: data?.staleMinutes ?? 15 } }),
    onSuccess: (r) => {
      toast.success(
        `Fixed stuck work: ${r.runsCleared} run(s) cleared, ${r.jobsRequeued} job(s) re-queued.`,
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const drainMut = useMutation({
    mutationFn: () => drainFn({ data: { max: 10 } }),
    onSuccess: (r) => {
      toast.success(`Ran ${r.processed} queued job(s) (${r.done} done, ${r.failed} failed/retry).`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: (op: ActivityOp) => cancelFn({ data: { id: op.id } }),
    onSuccess: () => {
      toast.success("Cancelled.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setBusy(null),
  });

  const doRetry = (op: ActivityOp) => {
    setBusy(`${op.source}:${op.id}`);
    retryMut.mutate(op);
  };
  const doCancel = (op: ActivityOp) => {
    setBusy(`${op.source}:${op.id}`);
    cancelMut.mutate(op);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <ActivityIcon className="h-3 w-3 text-primary" />
            Activity Center
          </div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">
            Everything running, in one place
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Live progress and logs for every long-running task — Semrush imports, WordPress syncs,
            Autopilot cycles, and bulk build/optimize jobs. See what&apos;s done, what&apos;s still
            going, and what got stuck — then retry anything that failed so nothing slips through.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              title="Refresh the feed now."
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => drainMut.mutate()}
              disabled={drainMut.isPending || !(summary && summary.pendingItems > 0)}
              title="Nudge the queue to process waiting jobs immediately (it also drains itself automatically in the background)."
            >
              {drainMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Run queued now{summary?.pendingItems ? ` (${summary.pendingItems})` : ""}
            </Button>
            {summary && summary.stuck > 0 && (
              <Button
                size="sm"
                onClick={() => fixStuckMut.mutate()}
                disabled={fixStuckMut.isPending}
                title="Sweep tasks that have been stuck too long: mark crashed runs as failed and re-queue stuck jobs."
                style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
              >
                {fixStuckMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-2 h-4 w-4" />
                )}
                Fix {summary.stuck} stuck
              </Button>
            )}
          </div>
        </header>

        {/* SUMMARY STRIP */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            label="Running"
            value={summary?.running ?? 0}
            hint={summary?.runningItems ? `${summary.runningItems} items` : "live now"}
            tone="primary"
            spinning={(summary?.running ?? 0) > 0}
          />
          <SummaryCard
            label="Completed"
            value={summary?.done ?? 0}
            hint="finished ok"
            tone="lime"
          />
          <SummaryCard
            label="Failed"
            value={summary?.failed ?? 0}
            hint="need a retry"
            tone={(summary?.failed ?? 0) > 0 ? "red" : "muted"}
          />
          <SummaryCard
            label="Stuck"
            value={summary?.stuck ?? 0}
            hint={(summary?.stuck ?? 0) > 0 ? "no recent activity" : "none"}
            tone={(summary?.stuck ?? 0) > 0 ? "amber" : "muted"}
          />
        </div>

        {/* FEED */}
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">Loading activity…</div>
        ) : ops.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/30 px-6 py-16 text-center text-sm text-muted-foreground">
            Nothing has run yet. Start a Semrush import, a WordPress sync, a bulk build/optimize, or
            an Autopilot cycle and it&apos;ll show up here with a live progress bar and log.
          </div>
        ) : (
          <div className="space-y-3">
            {ops.map((op) => {
              const key = `${op.source}:${op.id}`;
              return (
                <OperationCard
                  key={key}
                  op={op}
                  expanded={expanded === key}
                  busy={busy === key}
                  onToggle={() => setExpanded(expanded === key ? null : key)}
                  onRetry={() => doRetry(op)}
                  onCancel={() => doCancel(op)}
                />
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function OperationCard({
  op,
  expanded,
  busy,
  onToggle,
  onRetry,
  onCancel,
}: {
  op: ActivityOp;
  expanded: boolean;
  busy: boolean;
  onToggle: () => void;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const Icon = kindIcon(op.kind);
  const live = op.status === "running";
  const tone = op.stuck
    ? "border-amber-500/40 bg-amber-500/[0.04]"
    : op.status === "error"
      ? "border-red-500/30 bg-red-500/[0.04]"
      : op.status === "done"
        ? "border-[var(--lime)]/25 bg-[var(--lime)]/[0.03]"
        : op.status === "cancelled"
          ? "border-border bg-card/40"
          : "border-primary/30 bg-primary/[0.03]";

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {live && !op.stuck ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : (
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{op.label}</span>
              <StatusPill status={op.status} stuck={op.stuck} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              <span className="font-mono uppercase tracking-wider">{op.source}</span>
              {op.startedAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(op.startedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {op.retryable && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              disabled={busy}
              title="Run this again with the same settings."
            >
              {busy ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Retry
            </Button>
          )}
          {op.canCancel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={busy}
              title="Stop this run."
            >
              <Ban className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onToggle}>
            {expanded ? "Hide log" : "Log"}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-all duration-500 ${live && !op.stuck ? "animate-pulse" : ""}`}
          style={{
            width: `${op.pct}%`,
            background:
              op.status === "error" || op.stuck
                ? "linear-gradient(90deg,#f59e0b,#ef4444)"
                : "var(--gradient-brand)",
          }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="num font-medium text-foreground">
          {op.total > 0 ? `${op.done + op.failed} of ${op.total} (${op.pct}%)` : statusWord(op)}
        </span>
        {op.pending > 0 && <span className="text-amber-400">{op.pending} pending</span>}
        {op.running > 0 && <span className="text-primary">{op.running} running</span>}
        {op.done > 0 && <span className="text-[var(--lime)]">{op.done} done</span>}
        {op.failed > 0 && <span className="text-red-400">{op.failed} failed</span>}
      </div>

      {op.error && (
        <div className="mt-2 rounded-md border border-red-500/20 bg-red-500/[0.06] px-2.5 py-1.5 text-[11px] text-red-300">
          {op.error}
        </div>
      )}

      {expanded && <OperationLog op={op} />}
    </div>
  );
}

/** On expand: full run log (process runs) or per-item list (job batches). */
function OperationLog({ op }: { op: ActivityOp }) {
  const runFn = useServerFn(getActivityRunFn);
  const itemsFn = useServerFn(getActivityBatchItemsFn);
  const live = op.status === "running";

  const runQ = useQuery({
    queryKey: ["activity-run", op.id],
    queryFn: () => runFn({ data: { id: op.id } }),
    enabled: op.source === "run",
    refetchInterval: live ? 2000 : false,
  });
  const itemsQ = useQuery({
    queryKey: ["activity-batch", op.id],
    queryFn: () => itemsFn({ data: { batchId: op.id, limit: 500 } }),
    enabled: op.source === "batch",
    refetchInterval: live ? 2500 : false,
  });

  if (op.source === "run") {
    const runData = runQ.data as { run?: { logs?: ActivityLog[] } | null } | undefined;
    const logs = (runData?.run?.logs ?? op.logPreview ?? []) as ActivityLog[];
    return (
      <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-border bg-background/60 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="p-3 text-muted-foreground">No log lines yet…</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {logs
              .slice()
              .reverse()
              .map((l, i) => (
                <li key={i} className="flex items-start gap-2 px-3 py-1.5">
                  <LogDot level={l.level} />
                  <span className="shrink-0 text-muted-foreground/70">
                    {new Date(l.at).toLocaleTimeString()}
                  </span>
                  <span className="flex-1 break-words text-foreground/90">{l.message}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    );
  }

  const items = itemsQ.data?.items ?? [];
  return (
    <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-border bg-background/60 font-mono text-[11px]">
      {items.length === 0 ? (
        <div className="p-3 text-muted-foreground">Waiting for items…</div>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((it) => (
            <li key={it.id} className="flex items-start gap-2 px-3 py-1.5">
              <LogDot level={it.status === "done" ? "success" : it.status} />
              <span className="flex-1 truncate text-foreground/90">{it.label ?? it.id}</span>
              {it.status === "error" && it.error && (
                <span className="max-w-[260px] truncate text-red-400" title={it.error}>
                  {it.error}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function statusWord(op: ActivityOp): string {
  if (op.stuck) return "Stuck — no recent activity";
  switch (op.status) {
    case "running":
      return "Running…";
    case "done":
      return "Complete";
    case "error":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return op.status;
  }
}

function StatusPill({ status, stuck }: { status: string; stuck: boolean }) {
  const cfg = stuck
    ? { label: "stuck", cls: "border-amber-500/40 text-amber-400", Icon: AlertTriangle }
    : status === "running"
      ? { label: "running", cls: "border-primary/40 text-primary", Icon: Loader2 }
      : status === "done"
        ? { label: "done", cls: "border-[var(--lime)]/40 text-[var(--lime)]", Icon: CheckCircle2 }
        : status === "error"
          ? { label: "failed", cls: "border-red-500/40 text-red-400", Icon: XCircle }
          : status === "cancelled"
            ? { label: "cancelled", cls: "border-border text-muted-foreground", Icon: Ban }
            : { label: status, cls: "border-border text-muted-foreground", Icon: ActivityIcon };
  const Icon = cfg.Icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${cfg.cls}`}
    >
      <Icon className={`h-3 w-3 ${status === "running" && !stuck ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

function LogDot({ level }: { level: string }) {
  const color =
    level === "success"
      ? "bg-[var(--lime)]"
      : level === "error"
        ? "bg-red-400"
        : level === "warn"
          ? "bg-amber-400"
          : level === "running"
            ? "bg-primary animate-pulse"
            : level === "pending"
              ? "bg-amber-400"
              : "bg-muted-foreground";
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${color}`} title={level} />;
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
  spinning,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "primary" | "lime" | "red" | "amber" | "muted";
  spinning?: boolean;
}) {
  const color =
    tone === "lime"
      ? "text-[var(--lime)]"
      : tone === "red"
        ? "text-red-400"
        : tone === "amber"
          ? "text-amber-400"
          : tone === "primary"
            ? "text-primary"
            : "";
  return (
    <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {spinning && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
      </div>
      <div className={`num mt-1 text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </div>
  );
}
