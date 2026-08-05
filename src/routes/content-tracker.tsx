import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { listArticles, updateArticle } from "@/lib/articles.functions";
import { syncContentStudioFn } from "@/lib/content-studio.functions";
import { AppLayout } from "@/components/AppLayout";
import { ArticleSidePanel } from "@/components/ArticleSidePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ListChecks, RefreshCw, ExternalLink, Loader2 } from "lucide-react";

export const Route = createFileRoute("/content-tracker")({ component: ContentTracker });

type Article = {
  id: string;
  title: string;
  url_slug: string | null;
  status: string;
  cluster_name: string | null;
  word_count_target: number | null;
  published_url: string | null;
  published_at: string | null;
  internal_link_targets: string[];
  engine_source: string | null;
};

const todayISO = () => format(new Date(), "yyyy-MM-dd");

function ContentTracker() {
  const qc = useQueryClient();
  const listFn = useServerFn(listArticles);
  const updateFn = useServerFn(updateArticle);
  const syncFn = useServerFn(syncContentStudioFn);

  const [panelId, setPanelId] = useState<string | null>(null);
  const [perDay, setPerDay] = useState(5);
  const [startDate, setStartDate] = useState(todayISO());
  const [hidePublished, setHidePublished] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: () => listFn({ data: {} }),
  });

  const cs = useMemo(
    () => ((data ?? []) as Article[]).filter((a) => a.engine_source === "content-studio"),
    [data],
  );

  // Cadence order: cornerstone/hub content first (most inbound internal links),
  // then longer pieces, then alphabetical. Purely for visualization.
  const ordered = useMemo(() => {
    const inbound = new Map<string, number>();
    for (const a of cs)
      for (const t of a.internal_link_targets ?? []) inbound.set(t, (inbound.get(t) ?? 0) + 1);
    return [...cs].sort(
      (a, b) =>
        (inbound.get(b.url_slug ?? "") ?? 0) - (inbound.get(a.url_slug ?? "") ?? 0) ||
        (b.word_count_target ?? 0) - (a.word_count_target ?? 0) ||
        a.title.localeCompare(b.title),
    );
  }, [cs]);

  const publishedCount = cs.filter((a) => a.status === "published").length;
  const pct = cs.length ? Math.round((publishedCount / cs.length) * 100) : 0;

  const days = useMemo(() => {
    const rate = Math.max(1, perDay);
    const start = new Date(`${startDate}T00:00:00`);
    const buckets: { date: Date; items: Article[] }[] = [];
    ordered.forEach((a, i) => {
      const d = Math.floor(i / rate);
      (buckets[d] ??= { date: addDays(start, d), items: [] }).items.push(a);
    });
    return buckets;
  }, [ordered, perDay, startDate]);

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; published: boolean }) =>
      updateFn({
        data: {
          id: v.id,
          patch: v.published
            ? { status: "published", published_at: new Date().toISOString(), approval_status: "published" }
            : { status: "review", published_at: null, approval_status: "none" },
        },
      }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["articles"] });
      const prev = qc.getQueryData<Article[]>(["articles"]);
      qc.setQueryData<Article[]>(["articles"], (old) =>
        (old ?? []).map((a) =>
          a.id === v.id
            ? { ...a, status: v.published ? "published" : "review", published_at: v.published ? new Date().toISOString() : null }
            : a,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["articles"], ctx.prev);
      toast.error("Could not update — try again");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  });

  const syncMut = useMutation({
    mutationFn: () => syncFn({ data: { mode: "upsert" } }),
    onSuccess: (r) => {
      toast.success(`Synced content-studio — ${r.inserted} new, ${r.updated} updated`);
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="px-6 py-6">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <ListChecks className="h-3 w-3 text-primary" /> Publish tracker
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Content-studio publishing tracker</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              A suggested cadence for the {cs.length} locally-generated articles (cornerstone pages first).
              The schedule is just for planning. Publish each one by hand, then tick it off here so you always
              know what's live and what's left.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
            title="Re-scan content-studio and pull in any new or edited articles."
          >
            {syncMut.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-4 w-4" />
            )}
            Sync content-studio
          </Button>
        </header>

        {/* Progress + controls */}
        <div className="mb-5 rounded-xl border border-border bg-card/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[220px] flex-1">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{publishedCount} of {cs.length} published</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-brand)" }} />
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-muted-foreground">
                Start date
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 h-9 w-40" />
              </label>
              <label className="text-xs text-muted-foreground">
                Per day
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={perDay}
                  onChange={(e) => setPerDay(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1 h-9 w-24"
                />
              </label>
              <label className="flex items-center gap-2 pb-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={hidePublished} onChange={(e) => setHidePublished(e.target.checked)} />
                Hide published
              </label>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {days.length} day{days.length === 1 ? "" : "s"} at {perDay}/day. Ticking a box saves instantly
            (status → published) and survives reloads.
          </p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading articles…</div>
        ) : cs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/30 px-6 py-16 text-center text-sm text-muted-foreground">
            No content-studio articles in the engine yet. Click “Sync content-studio” to ingest them.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {days.map((day, di) => {
              const visible = hidePublished ? day.items.filter((a) => a.status !== "published") : day.items;
              const donePerDay = day.items.filter((a) => a.status === "published").length;
              if (hidePublished && visible.length === 0) return null;
              return (
                <div key={di} className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <span className="text-sm font-semibold">{format(day.date, "EEE, MMM d")}</span>
                    <span className="text-xs text-muted-foreground">{donePerDay}/{day.items.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 p-2">
                    {visible.map((a) => {
                      const published = a.status === "published";
                      return (
                        <div
                          key={a.id}
                          className={`rounded-md border p-2.5 transition-colors ${
                            published ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-background/40"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
                              checked={published}
                              onChange={(e) => toggleMut.mutate({ id: a.id, published: e.target.checked })}
                              title={published ? "Mark as not published" : "Mark as published"}
                            />
                            <div className="min-w-0 flex-1">
                              <button
                                onClick={() => setPanelId(a.id)}
                                className={`block text-left text-[13px] font-medium leading-snug line-clamp-3 hover:underline ${
                                  published ? "text-muted-foreground line-through" : ""
                                }`}
                              >
                                {a.title}
                              </button>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                {a.cluster_name && (
                                  <span className="rounded bg-secondary/60 px-1.5 py-0.5">{a.cluster_name}</span>
                                )}
                                {a.word_count_target ? <span>{a.word_count_target}w</span> : null}
                                <a
                                  href={`https://www.kloudbean.com/blog/${a.url_slug}/`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-0.5 hover:text-foreground"
                                  title="Intended live URL (once published)"
                                >
                                  /{a.url_slug}/ <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ArticleSidePanel articleId={panelId} open={!!panelId} onOpenChange={(o) => !o && setPanelId(null)} />
    </AppLayout>
  );
}
