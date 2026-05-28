import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runAutonomousEngine, getEngineRuns } from "@/lib/authority-engine.functions";
import { CLUSTERS } from "@/lib/pillars";
import { useState } from "react";
import { Bot, Loader2, Play, Database, Search, FileText, PenLine, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/engine")({ component: EnginePage });

const STEPS = [
  { id: "discover", icon: Search, label: "DataForSEO harvests live keywords + semantic clusters (core_keyword)" },
  { id: "filter", icon: Search, label: "Bulk volume/intent validation — only high-traffic, Kloudbean-scoped hubs" },
  { id: "create", icon: Database, label: "Hub articles + supporting keywords saved to database" },
  { id: "research", icon: Search, label: "Full SERP, PAA, related keywords, meta title & description" },
  { id: "briefs", icon: FileText, label: "AI briefs grounded in live search data + semantic cluster" },
  { id: "content", icon: PenLine, label: "AI writes draft Markdown (optional)" },
];

function EnginePage() {
  const qc = useQueryClient();
  const [geo, setGeo] = useState("sa");
  const [topicsPerCluster, setTopicsPerCluster] = useState(5);
  const [minVolume, setMinVolume] = useState(80);
  const [semanticClustering, setSemanticClustering] = useState(true);
  const [competitor, setCompetitor] = useState("cloudways.com");
  const [includeCompetitor, setIncludeCompetitor] = useState(true);
  const [generateBriefs, setGenerateBriefs] = useState(true);
  const [generateContent, setGenerateContent] = useState(false);
  const [lastLog, setLastLog] = useState<{ phase: string; message: string }[]>([]);

  const runFn = useServerFn(runAutonomousEngine);
  const runsFn = useServerFn(getEngineRuns);

  const { data: history, refetch: refetchRuns } = useQuery({
    queryKey: ["engine-runs"],
    queryFn: () => runsFn({ data: { limit: 8 } }),
  });

  const run = useMutation({
    mutationFn: () =>
      runFn({
        data: {
          geo: geo as "sa" | "in" | "ae" | "global",
          topicsPerCluster,
          minMonthlyVolume: minVolume,
          useSemanticClustering: semanticClustering,
          includeCompetitorGap: includeCompetitor,
          competitorDomain: competitor,
          generateBriefs,
          generateContent,
        },
      }),
    onSuccess: (r) => {
      setLastLog(r.log.map((l) => ({ phase: l.phase, message: l.message })));
      toast.success(
        `Engine done: ${r.stats.articles_created} articles · ${r.stats.keywords_researched} researched · ${r.stats.briefs_generated} briefs`,
      );
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["keywords"] });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["cluster-authority"] });
      refetchRuns();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const estTopics = CLUSTERS.length * topicsPerCluster;
  const estMinutes = Math.ceil(
    estTopics * 0.5 + (generateBriefs ? estTopics * 0.4 : 0) + (generateContent ? estTopics * 1.2 : 0),
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-8 py-8">
        <header className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Bot className="h-3 w-3 text-primary" />
            Autonomous pipeline
          </div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">SEO Authority Engine</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Data-first pipeline: pulls real search data from DataForSEO, groups keywords into semantic clusters
            (DataForSEO <code>core_keyword</code>), validates monthly volume, then creates hub articles only for
            keywords people are actually searching — scoped to Kloudbean topical authority.
          </p>
        </header>

        <section className="mb-8 rounded-xl border border-border bg-card/60 p-6 backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold">Pipeline steps</h2>
          <ol className="space-y-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = run.isPending;
              return (
                <li key={s.id} className="flex items-start gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[10px]">
                    {active ? <Loader2 className="h-3 w-3 animate-spin" /> : i + 1}
                  </span>
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className={active ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mb-8 rounded-xl border border-border bg-card/60 p-6 backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold">Configuration</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Geo market</Label>
              <Select value={geo} onValueChange={setGeo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sa">Saudi Arabia</SelectItem>
                  <SelectItem value="in">India</SelectItem>
                  <SelectItem value="ae">UAE</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hub topics per cluster (×10 clusters)</Label>
              <Input
                type="number"
                min={1}
                max={15}
                value={topicsPerCluster}
                onChange={(e) => setTopicsPerCluster(Number(e.target.value) || 5)}
              />
              <p className="mt-1 text-xs text-muted-foreground">~{estTopics} hub articles max · ~{estMinutes} min</p>
            </div>
            <div>
              <Label>Min monthly search volume</Label>
              <Input
                type="number"
                min={0}
                max={50000}
                value={minVolume}
                onChange={(e) => setMinVolume(Number(e.target.value) || 80)}
              />
              <p className="mt-1 text-xs text-muted-foreground">Filters low-traffic keywords — SA default ~80/mo</p>
            </div>
            <div className="sm:col-span-2">
              <Label>Competitor domain (gap analysis)</Label>
              <Input value={competitor} onChange={(e) => setCompetitor(e.target.value)} placeholder="cloudways.com" />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={semanticClustering} onCheckedChange={(v) => setSemanticClustering(!!v)} />
              Semantic keyword clustering (DataForSEO core_keyword → 1 hub article per group)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeCompetitor} onCheckedChange={(v) => setIncludeCompetitor(!!v)} />
              Include competitor keyword gap (DataForSEO ranked keywords)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={generateBriefs} onCheckedChange={(v) => setGenerateBriefs(!!v)} />
              Generate AI briefs (meta, outline, FAQ, schema) — requires DEEPSEEK_API_KEY or OPENAI_API_KEY
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={generateContent} onCheckedChange={(v) => setGenerateContent(!!v)} disabled={!generateBriefs} />
              Generate full draft content (Markdown) — slower, more AI credits
            </label>
          </div>
          <Button
            className="mt-6 w-full sm:w-auto"
            size="lg"
            disabled={run.isPending}
            onClick={() => run.mutate()}
            style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
          >
            {run.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run full autonomous engine
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Requires <code>DATABASE_URL</code>, <code>DATAFORSEO_LOGIN</code>, <code>DATAFORSEO_PASSWORD</code>
            {generateBriefs && ", DEEPSEEK_API_KEY or OPENAI_API_KEY"} in .env
          </p>
        </section>

        {lastLog.length > 0 && (
          <section className="mb-8 rounded-xl border border-border bg-card/60 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Last run log
            </h2>
            <ul className="max-h-48 space-y-1 overflow-y-auto font-mono text-[11px] text-muted-foreground">
              {lastLog.map((l, i) => (
                <li key={i}>
                  <span className="text-primary">[{l.phase}]</span> {l.message}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/strategy">View strategy queue</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/briefs">View briefs</Link>
              </Button>
            </div>
          </section>
        )}

        {history?.runs && history.runs.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Run history</h2>
            <div className="space-y-2">
              {history.runs.map((r: Record<string, unknown>) => {
                const stats = (r.stats ?? {}) as Record<string, number>;
                return (
                  <div key={r.id as string} className="rounded-md border border-border px-3 py-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-mono text-primary">{r.status as string}</span>
                      <span className="text-muted-foreground">{new Date(r.started_at as string).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {stats.articles_created ?? 0} articles · {stats.keywords_researched ?? 0} researched ·{" "}
                      {stats.briefs_generated ?? 0} briefs · {stats.content_generated ?? 0} drafts
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
