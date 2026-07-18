import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { ArticleSidePanel } from "@/components/ArticleSidePanel";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  listPublishQueueFn,
  approveAndPublishFn,
  rejectFromQueueFn,
  snoozeQueueItemFn,
} from "@/lib/publish-queue.functions";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  ShieldCheck,
  Rocket,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/publish-queue")({ component: PublishQueuePage });

function formatCountdown(hours: number | null): { label: string; urgent: boolean } {
  if (hours == null) return { label: "—", urgent: false };
  if (hours <= 0) return { label: "Due now", urgent: true };
  if (hours < 1) return { label: `${Math.round(hours * 60)} min`, urgent: true };
  if (hours < 24) return { label: `${hours.toFixed(1)} hrs`, urgent: hours < 4 };
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  return { label: `${days}d ${rem}h`, urgent: false };
}

function PublishQueuePage() {
  const qc = useQueryClient();
  const [panelId, setPanelId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const listFn = useServerFn(listPublishQueueFn);
  const approveFn = useServerFn(approveAndPublishFn);
  const rejectFn = useServerFn(rejectFromQueueFn);
  const snoozeFn = useServerFn(snoozeQueueItemFn);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["publish-queue"],
    queryFn: () => listFn({}),
    refetchInterval: 60_000, // countdown stays roughly live
  });

  const approveMut = useMutation({
    mutationFn: (articleId: string) => approveFn({ data: { articleId } }),
    onSuccess: (r) => {
      toast.success(r.link ? `Published → ${r.link}` : "Published to WordPress");
      refetch();
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: (vars: { articleId: string; reason: string }) =>
      rejectFn({ data: { articleId: vars.articleId, reason: vars.reason } }),
    onSuccess: () => {
      toast.success("Removed from queue — kept as a draft, not published");
      setRejectingId(null);
      setRejectReason("");
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const snoozeMut = useMutation({
    mutationFn: (articleId: string) => snoozeFn({ data: { articleId, extraHours: 24 } }),
    onSuccess: () => {
      toast.success("Pushed back another 24 hours");
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-primary" />
            Pre-publish review queue
          </div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">
            Nothing goes live without a look first
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Autopilot queues finished articles here instead of publishing them straight to
            WordPress. Everything sits for a full hold window (default 24 hours) so you can review
            the title, meta, quick answer, quality score, and distribution drafts before it goes
            live. Approve to publish now, snooze for another day, or reject to keep it as a draft.
          </p>
        </header>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading queue…</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Nothing is queued right now. Articles land here automatically once Autopilot writes
              and scores them — nothing publishes until you (or the hold timer) release it.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const countdown = formatCountdown(item.hours_until_publish);
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{item.title}</h3>
                        {item.quality_score != null && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              item.quality_score >= 85
                                ? "bg-emerald-500/15 text-emerald-500"
                                : "bg-amber-500/15 text-amber-500"
                            }`}
                          >
                            {item.quality_score}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px]">
                          {item.target_keyword}
                        </code>
                        {item.cluster_name && <span>· {item.cluster_name}</span>}
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                        countdown.urgent
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                          : "border-border bg-background/40 text-muted-foreground"
                      }`}
                      title={
                        item.scheduled_publish_at
                          ? `Auto-publishes at ${new Date(item.scheduled_publish_at).toLocaleString()} if auto-approve is on, otherwise waits for you.`
                          : ""
                      }
                    >
                      <Timer className="h-3.5 w-3.5" /> {countdown.label}
                    </div>
                  </div>

                  {rejectingId === item.id ? (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        autoFocus
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Why reject? (optional)"
                        className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            rejectMut.mutate({ articleId: item.id, reason: rejectReason });
                        }}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={rejectMut.isPending}
                        onClick={() =>
                          rejectMut.mutate({ articleId: item.id, reason: rejectReason })
                        }
                      >
                        Confirm reject
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPanelId(item.id)}
                        title="Open the full preview — title, meta, quick answer, FAQ, quality score, distribution drafts."
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview everything
                      </Button>
                      <Button
                        size="sm"
                        disabled={approveMut.isPending}
                        onClick={() => approveMut.mutate(item.id)}
                        title="Publish to WordPress right now."
                        style={{
                          background: "var(--gradient-brand)",
                          color: "var(--brand-foreground)",
                        }}
                      >
                        {approveMut.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Rocket className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Approve & publish now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={snoozeMut.isPending}
                        onClick={() => snoozeMut.mutate(item.id)}
                        title="Not ready to decide — push the hold window back another 24 hours."
                      >
                        <Clock className="mr-1.5 h-3.5 w-3.5" /> Snooze 24h
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRejectingId(item.id)}
                        title="Keep as a draft — do not publish this."
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {items.length} article{items.length === 1 ? "" : "s"} waiting for review.
          </div>
        )}
      </div>
      <ArticleSidePanel
        articleId={panelId}
        open={!!panelId}
        onOpenChange={(o) => !o && setPanelId(null)}
      />
    </AppLayout>
  );
}
