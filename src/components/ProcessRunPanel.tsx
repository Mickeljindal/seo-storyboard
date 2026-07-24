import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Live progress bar + scrollable log for a background process_runs row
 * (Semrush import, WordPress sync, idea discovery, etc). Poll the run with
 * a query (see usage in tools.tsx / kloudgraph.tsx) and pass its data here —
 * this component is purely presentational.
 */
export type ProcessRunData = {
  id: string;
  kind: string;
  label: string;
  status: string; // running | done | error | cancelled
  total: number;
  completed: number;
  failed: number;
  logs: { at: string; level: string; message: string }[];
  error?: string | null;
};

export function ProcessRunPanel({
  run,
  showLog,
  onToggleLog,
  onDismiss,
}: {
  run: ProcessRunData;
  showLog: boolean;
  onToggleLog: () => void;
  onDismiss: () => void;
}) {
  const finished = run.status !== "running";
  const settled = run.completed + run.failed;
  const pct =
    run.total > 0 ? Math.min(100, Math.round((settled / run.total) * 100)) : finished ? 100 : 0;
  const errored = run.status === "error" || run.failed > 0;

  return (
    <div
      className={`mb-8 rounded-xl border p-4 ${
        finished
          ? errored
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-[var(--lime)]/30 bg-[var(--lime)]/5"
          : "border-primary/40 bg-primary/5"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!finished && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <span className="text-sm font-medium">{run.label}</span>
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

      <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "var(--gradient-brand)" }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="num font-medium text-foreground">
          {run.total > 0
            ? `${settled} of ${run.total} complete (${pct}%)`
            : finished
              ? "Complete"
              : "Starting…"}
        </span>
        {run.failed > 0 && <span className="text-red-400">{run.failed} failed</span>}
        {run.status === "error" && run.error && (
          <span className="max-w-[380px] truncate text-red-400" title={run.error}>
            {run.error}
          </span>
        )}
      </div>

      {showLog && (
        <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-border bg-background/60 font-mono text-[11px]">
          {run.logs.length === 0 ? (
            <div className="p-3 text-muted-foreground">Waiting for activity…</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {run.logs
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
      )}
    </div>
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
          : "bg-muted-foreground";
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${color}`} title={level} />;
}
