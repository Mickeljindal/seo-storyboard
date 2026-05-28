import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listArticles, updateArticle } from "@/lib/articles.functions";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge, PillarBadge, PriorityDot } from "@/components/Badges";
import { ArticleSidePanel } from "@/components/ArticleSidePanel";
import { useMemo, useState } from "react";
import { PILLARS, STATUSES } from "@/lib/pillars";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/calendar")({ component: Calendar });

function Calendar() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pillar, setPillar] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const listFn = useServerFn(listArticles);
  const updateFn = useServerFn(updateArticle);
  const { data: articles } = useQuery({
    queryKey: ["articles"],
    queryFn: () => listFn({ data: {} }),
  });

  const filtered = useMemo(() => {
    return (articles ?? []).filter((a) =>
      (pillar === "all" || a.pillar === Number(pillar)) &&
      (status === "all" || a.status === status)
    );
  }, [articles, pillar, status]);

  const byWeek = useMemo(() => {
    const m = new Map<number, typeof filtered>();
    for (let w = 1; w <= 12; w++) m.set(w, []);
    for (const a of filtered) {
      const w = a.scheduled_week ?? 1;
      m.get(w)?.push(a);
    }
    return m;
  }, [filtered]);

  async function moveTo(articleId: string, week: number) {
    try {
      await updateFn({ data: { id: articleId, patch: { scheduled_week: week } } });
      toast.success(`Moved to week ${week}`);
      qc.invalidateQueries({ queryKey: ["articles"] });
    } catch (e: unknown) {
      toast.error(String((e as Error)?.message ?? e));
    }
  }

  return (
    <AppLayout>
      <div className="px-6 py-6">
        <header className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Content Calendar</h1>
            <p className="text-sm text-muted-foreground">Drag any card to reschedule across the 12-week sprint</p>
          </div>
          <div className="flex gap-2">
            <Select value={pillar} onValueChange={setPillar}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Pillar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All pillars</SelectItem>
                {PILLARS.map((p) => <SelectItem key={p.id} value={String(p.id)}>P{p.id} · {p.short}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="flex gap-3 overflow-x-auto pb-4">
          {Array.from({ length: 12 }).map((_, i) => {
            const week = i + 1;
            const items = byWeek.get(week) ?? [];
            return (
              <div
                key={week}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/article-id");
                  if (id) moveTo(id, week);
                }}
                className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-card"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <span className="text-sm font-semibold">Week {week}</span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex-1 space-y-2 p-2">
                  {items.map((a) => (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/article-id", a.id)}
                      onClick={() => { setActiveId(a.id); setOpen(true); }}
                      className="cursor-grab rounded-md border border-border bg-background/40 p-2.5 hover:border-primary/50 active:cursor-grabbing"
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <PillarBadge pillar={a.pillar} />
                        <PriorityDot priority={a.priority} />
                      </div>
                      <div className="text-[13px] font-medium leading-snug line-clamp-3">{a.title}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge status={a.status} />
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-[11px] text-muted-foreground">Drop articles here</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ArticleSidePanel articleId={activeId} open={open} onOpenChange={setOpen} />
    </AppLayout>
  );
}
