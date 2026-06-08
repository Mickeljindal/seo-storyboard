import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listArticles } from "@/lib/articles.functions";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge, PillarBadge, PriorityDot } from "@/components/Badges";
import { ArticleSidePanel } from "@/components/ArticleSidePanel";
import { Button } from "@/components/ui/button";
import { seedArticles } from "@/lib/seed.functions";
import { useState, useMemo } from "react";
import {
  Sparkles, Search, FileText, CheckCircle2, BookOpen,
  Lightbulb, Pencil, Eye, Send, Megaphone, ArrowRight, Plug, Bot, Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { pillarMeta, STATUSES } from "@/lib/pillars";

export const Route = createFileRoute("/")({ component: Dashboard });

const PIPELINE = [
  { id: "idea", label: "Idea", icon: Lightbulb },
  { id: "keyword_researched", label: "Keyword", icon: Search },
  { id: "brief_generated", label: "Brief", icon: FileText },
  { id: "writing", label: "Draft", icon: Pencil },
  { id: "review", label: "Review", icon: Eye },
  { id: "published", label: "Publish", icon: Send },
  { id: "promoted", label: "Promote", icon: Megaphone },
] as const;

function Dashboard() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const listFn = useServerFn(listArticles);
  const { data: articles, refetch, isLoading, isError, error } = useQuery({
    queryKey: ["articles"],
    queryFn: () => listFn({ data: { orderBy: "scheduled_week" } }),
  });

  const seedFn = useServerFn(seedArticles);
  const seedMut = useMutation({
    mutationFn: () => seedFn({ data: { force: false } }),
    onSuccess: (r: any) => { toast.success(r.skipped ? `Already have ${r.existing} articles` : `Seeded ${r.inserted} articles`); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const total = articles?.length ?? 0;
    const published = articles?.filter((a) => a.status === "published" || a.status === "promoted").length ?? 0;
    const briefs = articles?.filter((a) => a.brief).length ?? 0;
    const review = articles?.filter((a) => a.status === "review").length ?? 0;
    const monthlyTraffic = articles?.reduce((sum, a) => {
      const v = (a.keyword_data as any)?.monthly_volume ?? 0;
      return sum + Math.round(v * 0.05);
    }, 0) ?? 0;
    const pct = total ? Math.round((published / total) * 100) : 0;
    return { total, published, briefs, review, monthlyTraffic, pct };
  }, [articles]);

  const empty = !isLoading && (articles?.length ?? 0) === 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1280px] px-10 py-10">
        {isError && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <strong>Cannot load articles:</strong> {(error as Error)?.message ?? "Database error"}.
            Local mode: run <code className="font-mono text-xs">npm run db:up</code> then{" "}
            <code className="font-mono text-xs">npm run setup</code> then restart{" "}
            <code className="font-mono text-xs">npm run dev</code> (or use <code className="font-mono text-xs">npm run dev:local</code>).
          </div>
        )}
        {/* HERO — mission */}
        <header className="mb-12 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
              <Bot className="h-3 w-3 text-primary" />
              Autonomous SEO Engine · v1
            </div>
            <h1 className="text-display text-[68px] leading-[0.95] tracking-tighter">
              Ranking <span className="font-serif italic text-muted-foreground">kloudbean.com</span>
              <br />
              on <span className="grad-text">autopilot.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              10 topical-authority clusters built for Kloudbean's real buyers — vibecoders deploying Lovable & Bolt apps, agencies hosting many client sites, SaaS founders self-hosting n8n & Supabase, and enterprises that need data residency.
              Spin the <span className="font-mono text-foreground">Idea Raffle</span>, generate the brief, auto-publish to{" "}
              <span className="font-mono text-foreground">kloudbean.com</span> — and win Google + AI search without waiting for backlinks.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {empty ? (
                <Button onClick={() => seedMut.mutate()} disabled={seedMut.isPending} size="lg">
                  <Sparkles className="mr-2 h-4 w-4" /> Seed 59-article roadmap
                </Button>
              ) : (
                <Button size="lg" style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }} asChild>
                  <Link to="/engine">
                    <Rocket className="mr-2 h-4 w-4" /> Run autonomous engine
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link to="/settings">
                  <Plug className="h-4 w-4" /> Connect integrations
                </Link>
              </Button>
            </div>
          </div>

          {/* Mission stat block */}
          <div className="col-span-12 lg:col-span-4">
            <div className="relative h-full overflow-hidden rounded-xl border border-border bg-card/60 p-6 backdrop-blur">
              <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-brand)", maskImage: "radial-gradient(circle at 100% 0%, black, transparent 60%)" }} />
              <div className="relative">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Mission progress</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="num text-display text-6xl font-semibold">{stats.pct}</span>
                  <span className="text-2xl text-muted-foreground">%</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{stats.published} of {stats.total} published</div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full" style={{ width: `${stats.pct}%`, background: "var(--gradient-brand)" }} />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <Mini label="Briefs" value={stats.briefs} />
                  <Mini label="Review" value={stats.review} />
                  <Mini label="Weeks" value={12} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* AUTOMATION PIPELINE */}
        <section className="mb-12">
          <SectionLabel kicker="01" title="The pipeline" desc="Every article moves through these seven stages — automated by the engine." />
          <div className="mt-6 flex items-stretch gap-2 overflow-x-auto rounded-xl border border-border bg-card/40 p-3 backdrop-blur">
            {PIPELINE.map((stage, i) => {
              const count = articles?.filter((a) => a.status === stage.id).length ?? 0;
              const Icon = stage.icon;
              const isWordpress = stage.id === "published";
              return (
                <div key={stage.id} className="flex flex-1 items-center gap-2">
                  <div className="group relative flex-1 rounded-lg border border-border bg-background/60 p-3 transition hover:border-primary/40">
                    <div className="flex items-center justify-between">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="mt-3 num text-2xl font-semibold">{count}</div>
                    <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{stage.label}</div>
                    {isWordpress && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-sm bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-400">
                        <Plug className="h-2.5 w-2.5" /> WP
                      </div>
                    )}
                  </div>
                  {i < PIPELINE.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
                </div>
              );
            })}
          </div>
        </section>

        {/* KPI ROW */}
        <section className="mb-12">
          <SectionLabel kicker="02" title="Engine telemetry" desc="Live counters from your content roadmap." />
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-5">
            <KPI icon={BookOpen} label="Roadmap" value={stats.total} suffix="articles" />
            <KPI icon={CheckCircle2} label="Published" value={stats.published} suffix={`/ ${stats.total}`} accent />
            <KPI icon={Search} label="Est. traffic" value={stats.monthlyTraffic.toLocaleString()} suffix="/ mo" />
            <KPI icon={FileText} label="Briefs ready" value={stats.briefs} suffix="generated" />
            <KPI icon={Bot} label="AI calls" value="—" suffix="this week" />
          </div>
        </section>

        {/* 12-week + status */}
        <section className="mb-12 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <SectionLabel kicker="03" title="12-week sprint" desc="Click any article to open the brief & keyword panel." />
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => {
                const week = i + 1;
                const items = articles?.filter((a) => a.scheduled_week === week) ?? [];
                return (
                  <div key={week} className="rounded-lg border border-border bg-card/60 p-3 backdrop-blur transition hover:border-primary/40">
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Week</span>
                      <span className="num text-lg font-semibold">{String(week).padStart(2, "0")}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{items.length} articles</div>
                    <div className="mt-2 space-y-1">
                      {items.slice(0, 3).map((a) => (
                        <button key={a.id} onClick={() => { setActiveId(a.id); setOpen(true); }} className="flex w-full items-start gap-1.5 rounded px-1 py-1 text-left text-[11px] leading-tight hover:bg-foreground/5">
                          <PillarBadge pillar={a.pillar} />
                          <span className="line-clamp-2 text-foreground/80">{a.title}</span>
                        </button>
                      ))}
                      {items.length > 3 && <div className="px-1 text-[10px] text-muted-foreground">+{items.length - 3} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <SectionLabel kicker="04" title="By status" desc="Where the roadmap stands right now." />
            <div className="mt-6 space-y-1.5">
              {STATUSES.map((s) => {
                const count = articles?.filter((a) => a.status === s.id).length ?? 0;
                const max = articles?.length ?? 1;
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={s.id} className="rounded-md border border-border bg-card/60 px-3 py-2 backdrop-blur">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.tokenVar }} />
                        {s.label}
                      </span>
                      <span className="num font-semibold">{count}</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.tokenVar }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recent table */}
        <section>
          <SectionLabel kicker="05" title="Recent activity" desc="Latest from the roadmap." />
          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-foreground/[0.02] font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left">#</th>
                  <th className="px-4 py-2.5 text-left">Title</th>
                  <th className="px-4 py-2.5 text-left">Pillar</th>
                  <th className="px-4 py-2.5 text-left">Keyword</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Wk</th>
                </tr>
              </thead>
              <tbody>
                {(articles ?? []).slice(0, 12).map((a, i) => (
                  <tr key={a.id} className="cursor-pointer border-t border-border/60 transition hover:bg-foreground/[0.03]" onClick={() => { setActiveId(a.id); setOpen(true); }}>
                    <td className="px-4 py-3 num text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><PriorityDot priority={a.priority} /><span className="line-clamp-1">{a.title}</span></div></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1.5"><PillarBadge pillar={a.pillar} /><span className="text-xs text-muted-foreground">{pillarMeta(a.pillar).short}</span></div></td>
                    <td className="px-4 py-3"><code className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px]">{a.target_keyword}</code></td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 num text-xs text-muted-foreground">W{a.scheduled_week ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-16 flex items-center justify-between border-t border-border pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>kloudbean / seo-engine</span>
          <span>10 clusters · Kloudbean-only topics · deploy · compliance · self-hosted on Kloudbean</span>
        </footer>
      </div>
      <ArticleSidePanel articleId={activeId} open={open} onOpenChange={setOpen} />
    </AppLayout>
  );
}

function SectionLabel({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-border pb-3">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">{kicker}</span>
        <h2 className="text-display text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      {desc && <p className="hidden text-xs text-muted-foreground md:block">{desc}</p>}
    </div>
  );
}

function KPI({ icon: Icon, label, value, suffix, accent }: { icon: any; label: string; value: number | string; suffix?: string; accent?: boolean }) {
  return (
    <div className="bg-card/80 p-5">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-primary" : ""}`} />
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={`num text-display text-3xl font-semibold ${accent ? "grad-text" : ""}`}>{value}</span>
        {suffix && <span className="text-[11px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-2 py-2">
      <div className="num text-base font-semibold">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
