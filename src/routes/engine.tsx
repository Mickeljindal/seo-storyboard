import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runAutonomousEngine, getEngineRuns } from "@/lib/authority-engine.functions";
import { runContentAutomation } from "@/lib/automation.functions";
import {
  getAutopilotStatusFn,
  saveAutopilotSettingsFn,
  runAutopilotOnceFn,
} from "@/lib/autopilot.functions";
import { CLUSTERS } from "@/lib/pillars";
import { useState, useEffect } from "react";
import {
  Bot,
  Loader2,
  Play,
  Database,
  Search,
  FileText,
  PenLine,
  CheckCircle2,
  Wand2,
  Power,
  Swords,
  ShieldCheck,
  Zap,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/engine")({ component: EnginePage });

const STEPS = [
  {
    id: "discover",
    icon: Search,
    label: "DataForSEO harvests live keywords + semantic clusters (core_keyword)",
  },
  {
    id: "filter",
    icon: Search,
    label: "Bulk volume/intent validation — only high-traffic, Kloudbean-scoped hubs",
  },
  { id: "create", icon: Database, label: "Hub articles + supporting keywords saved to database" },
  {
    id: "research",
    icon: Search,
    label: "Full SERP, PAA, related keywords, meta title & description",
  },
  {
    id: "briefs",
    icon: FileText,
    label: "AI briefs grounded in live search data + semantic cluster",
  },
  { id: "content", icon: PenLine, label: "AI writes draft Markdown (optional)" },
];

function EnginePage() {
  const qc = useQueryClient();
  const [geo, setGeo] = useState("global");
  const [topicsPerCluster, setTopicsPerCluster] = useState(5);
  const [minVolume, setMinVolume] = useState(30);
  const [semanticClustering, setSemanticClustering] = useState(true);
  const [competitor, setCompetitor] = useState("cloudways.com");
  const [includeCompetitor, setIncludeCompetitor] = useState(true);
  const [generateBriefs, setGenerateBriefs] = useState(true);
  const [generateContent, setGenerateContent] = useState(false);
  const [discoverySource, setDiscoverySource] = useState<"serper" | "dataforseo" | "auto">(
    "serper",
  );
  const [lastLog, setLastLog] = useState<{ phase: string; message: string }[]>([]);

  const runFn = useServerFn(runAutonomousEngine);
  const runsFn = useServerFn(getEngineRuns);
  const automateFn = useServerFn(runContentAutomation);

  const [autoPublish, setAutoPublish] = useState(false);
  const [autoLimit, setAutoLimit] = useState(5);

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
          discoverySource,
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

  const automate = useMutation({
    mutationFn: () =>
      automateFn({
        data: {
          limit: autoLimit,
          geo: geo as "sa" | "in" | "ae" | "global",
          doResearch: true,
          doBriefs: true,
          doContent: true,
          autoPublish,
          publishStatus: autoPublish ? "publish" : "draft",
          publishMinScore: 88,
        },
      }),
    onSuccess: (r) => {
      toast.success(
        `Automation: ${r.written} written · ${r.published} published · ${r.blocked} blocked · ${r.skippedLowScore} low-score`,
      );
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const estTopics = CLUSTERS.length * topicsPerCluster;
  const estMinutes = Math.ceil(
    estTopics * 0.5 +
      (generateBriefs ? estTopics * 0.4 : 0) +
      (generateContent ? estTopics * 1.2 : 0),
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-8 py-8">
        <header className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Bot className="h-3 w-3 text-primary" />
            Autonomous pipeline
          </div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">
            SEO Authority Engine
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Data-first pipeline: pulls real search data from DataForSEO, groups keywords into
            semantic clusters (DataForSEO <code>core_keyword</code>), validates monthly volume, then
            creates hub articles only for keywords people are actually searching — scoped to
            Kloudbean topical authority.
          </p>
        </header>

        <AutopilotPanel />

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
                  <span className={active ? "text-foreground" : "text-muted-foreground"}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mb-8 rounded-xl border border-border bg-card/60 p-6 backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold">Configuration</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Discovery source</Label>
              <Select
                value={discoverySource}
                onValueChange={(v) => setDiscoverySource(v as typeof discoverySource)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="serper">Serper.dev (cheap — recommended)</SelectItem>
                  <SelectItem value="dataforseo">DataForSEO (volume data, costly)</SelectItem>
                  <SelectItem value="auto">Auto (Serper if available)</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Serper uses autocomplete + SERP signals — far cheaper than DataForSEO.
              </p>
            </div>
            <div>
              <Label>Geo market</Label>
              <Select value={geo} onValueChange={setGeo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <p className="mt-1 text-xs text-muted-foreground">
                ~{estTopics} hub articles max · ~{estMinutes} min
              </p>
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
              <p className="mt-1 text-xs text-muted-foreground">
                Filters noise — SA default 30/mo; lowers automatically if too strict
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label>Competitor domain (gap analysis)</Label>
              <Input
                value={competitor}
                onChange={(e) => setCompetitor(e.target.value)}
                placeholder="cloudways.com"
              />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={semanticClustering}
                onCheckedChange={(v) => setSemanticClustering(!!v)}
              />
              Semantic keyword clustering (DataForSEO core_keyword → 1 hub article per group)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeCompetitor}
                onCheckedChange={(v) => setIncludeCompetitor(!!v)}
              />
              Include competitor keyword gap (DataForSEO ranked keywords)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={generateBriefs} onCheckedChange={(v) => setGenerateBriefs(!!v)} />
              Generate AI briefs (meta, outline, FAQ, schema) — requires DEEPSEEK_API_KEY or
              OPENAI_API_KEY
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={generateContent}
                onCheckedChange={(v) => setGenerateContent(!!v)}
                disabled={!generateBriefs}
              />
              Generate full draft content (Markdown) — slower, more AI credits
            </label>
          </div>
          <Button
            className="mt-6 w-full sm:w-auto"
            size="lg"
            disabled={run.isPending}
            onClick={() => run.mutate()}
            title="Find in-demand topics, group them into clusters, and create article ideas — automatically."
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
            Requires <code>DATABASE_MODE=pglite</code> (local) or Postgres vars, plus{" "}
            <code>DATAFORSEO_LOGIN</code>, <code>DATAFORSEO_PASSWORD</code>
            {generateBriefs && ", DEEPSEEK_API_KEY or OPENAI_API_KEY"} in .env. Run{" "}
            <code>npm run fix</code> if the app or database fails to start.
          </p>
        </section>

        <section className="mb-8 rounded-xl border border-border bg-card/60 p-6 backdrop-blur">
          <div className="mb-2 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">
              Content Quality Engine — write &amp; score existing ideas
            </h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Advances articles that have no draft yet: DataForSEO research → AI brief → multi-pass
            writing (section-by-section + editor pass) → quality scorecard. Grounded in the live
            Kloudbean knowledge base. Optionally auto-publishes drafts scoring ≥ 88 with no banned
            claims. Runs a bounded batch each click; schedule <code>npm run automate</code> with
            cron for hands-off operation.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Articles per run</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={autoLimit}
                onChange={(e) => setAutoLimit(Number(e.target.value) || 5)}
              />
            </div>
            <label className="flex items-center gap-2 self-end text-sm">
              <Checkbox checked={autoPublish} onCheckedChange={(v) => setAutoPublish(!!v)} />
              Auto-publish drafts scoring ≥ 88 to WordPress (live)
            </label>
          </div>
          <Button
            className="mt-4"
            disabled={automate.isPending}
            onClick={() => automate.mutate()}
            title="Write and quality-score the next batch of article ideas (research → brief → draft → score)."
          >
            {automate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate &amp; score content
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Requires AI key{autoPublish && " and WordPress credentials"}. The quality gate blocks
            publishing of any draft with false/unsupported-provider claims.
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
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Run history
            </h2>
            <div className="space-y-2">
              {history.runs.map((r: Record<string, unknown>) => {
                const stats = (r.stats ?? {}) as Record<string, number>;
                return (
                  <div
                    key={r.id as string}
                    className="rounded-md border border-border px-3 py-2 text-xs"
                  >
                    <div className="flex justify-between">
                      <span className="font-mono text-primary">{r.status as string}</span>
                      <span className="text-muted-foreground">
                        {new Date(r.started_at as string).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {stats.articles_created ?? 0} articles · {stats.keywords_researched ?? 0}{" "}
                      researched · {stats.briefs_generated ?? 0} briefs ·{" "}
                      {stats.content_generated ?? 0} drafts
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

/**
 * AUTOPILOT CONTROL PANEL — the "set and forget" switch. Turns on/off the
 * fully autonomous cycle (discover → write → score → publish → refresh →
 * learn) without touching .env or the terminal. Settings save to the DB and
 * take effect immediately, including starting/stopping the live scheduler.
 */
function AutopilotPanel() {
  const qc = useQueryClient();
  const statusFn = useServerFn(getAutopilotStatusFn);
  const saveFn = useServerFn(saveAutopilotSettingsFn);
  const runOnceFn = useServerFn(runAutopilotOnceFn);

  const { data: status, refetch } = useQuery({
    queryKey: ["autopilot-status"],
    queryFn: () => statusFn({}),
    refetchInterval: 30_000,
  });

  const [intervalMinutes, setIntervalMinutes] = useState(360);
  const [maxPerDay, setMaxPerDay] = useState(2);
  const [minScore, setMinScore] = useState(85);
  const [topicsPerRun, setTopicsPerRun] = useState(5);
  const [kloudgraphPerRun, setKloudgraphPerRun] = useState(5);
  const [autoPublish, setAutoPublish] = useState(true);
  const [autoDiscover, setAutoDiscover] = useState(true);
  const [kloudgraphEnabled, setKloudgraphEnabled] = useState(true);
  const [reviewHoldHours, setReviewHoldHours] = useState(24);
  const [autoApproveAfterHold, setAutoApproveAfterHold] = useState(false);
  const [siteLinksEnabled, setSiteLinksEnabled] = useState(false);
  const [siteLinksApplyPerRun, setSiteLinksApplyPerRun] = useState(0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!status?.config || initialized) return;
    setIntervalMinutes(Math.round(status.config.intervalMs / 60_000));
    setMaxPerDay(status.config.maxPublishPerDay);
    setMinScore(status.config.minPublishScore);
    setTopicsPerRun(status.config.topicsPerRun);
    setKloudgraphPerRun(status.config.kloudgraphPerRun);
    setAutoPublish(status.config.autoPublish);
    setAutoDiscover(status.config.autoDiscover);
    setKloudgraphEnabled(status.config.kloudgraphEnabled);
    setReviewHoldHours(status.config.reviewHoldHours ?? 24);
    setAutoApproveAfterHold(status.config.autoApproveAfterHold ?? false);
    setSiteLinksEnabled(status.config.siteLinksEnabled ?? false);
    setSiteLinksApplyPerRun(status.config.siteLinksApplyPerRun ?? 0);
    setInitialized(true);
  }, [status, initialized]);

  const toggleMut = useMutation({
    mutationFn: (enabled: boolean) => saveFn({ data: { enabled } }),
    onSuccess: (r) => {
      toast.success(r.running ? "Autopilot is now running" : "Autopilot stopped");
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          intervalMinutes,
          maxPublishPerDay: maxPerDay,
          minPublishScore: minScore,
          topicsPerRun,
          kloudgraphEnabled,
          kloudgraphPerRun,
          autoPublish,
          autoDiscover,
          reviewHoldHours,
          autoApproveAfterHold,
          siteLinksEnabled,
          siteLinksApplyPerRun,
        },
      }),
    onSuccess: () => {
      toast.success("Autopilot settings saved");
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runOnceMut = useMutation({
    mutationFn: () => runOnceFn({}),
    onSuccess: (r) => {
      toast.success(
        `Cycle done: ${r.kloudgraphSent} from KLOUDGRAPH, ${r.written} written, ${r.published} published`,
      );
      qc.invalidateQueries({ queryKey: ["articles"] });
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const running = status?.running ?? false;
  const last = status?.lastRun;

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-primary/30 bg-card/60 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-primary/[0.04] px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full ${running ? "bg-[var(--lime)]/15" : "bg-secondary"}`}
          >
            <Power
              className={`h-4 w-4 ${running ? "text-[var(--lime)]" : "text-muted-foreground"}`}
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Autopilot — full auto-gen system</h2>
            <p className="text-xs text-muted-foreground">
              {running
                ? "Running on its own: finds topics, writes, scores, and publishes automatically."
                : "Off. Turn on to let the engine run itself on a schedule."}
            </p>
          </div>
        </div>
        <Button
          size="lg"
          disabled={toggleMut.isPending}
          onClick={() => toggleMut.mutate(!running)}
          title={
            running
              ? "Stop the automatic cycle."
              : "Start the automatic cycle — it will keep running on its own from now on, even after a restart."
          }
          style={
            running ? {} : { background: "var(--gradient-brand)", color: "var(--brand-foreground)" }
          }
          variant={running ? "destructive" : "default"}
        >
          {toggleMut.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Power className="mr-2 h-4 w-4" />
          )}
          {running ? "Turn off" : "Turn on autopilot"}
        </Button>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            How often & how much
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Run every (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={1440}
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value) || 360)}
              />
            </div>
            <div>
              <Label className="text-xs">Max publishes / day</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label className="text-xs">Min quality score to publish</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value) || 85)}
              />
            </div>
            <div>
              <Label className="text-xs">New topics / cycle</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={topicsPerRun}
                onChange={(e) => setTopicsPerRun(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <Checkbox checked={autoDiscover} onCheckedChange={(v) => setAutoDiscover(!!v)} />
            Auto-discover new generic topics each cycle (fills remaining quota after KLOUDGRAPH)
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <Checkbox checked={autoPublish} onCheckedChange={(v) => setAutoPublish(!!v)} />
            Queue finished articles for review when quality passes (off = drafts only, nothing
            queued)
          </label>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-400">
            <Swords className="h-3.5 w-3.5" /> KLOUDGRAPH — competitor-proven topics
          </h3>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <Checkbox
              checked={kloudgraphEnabled}
              onCheckedChange={(v) => setKloudgraphEnabled(!!v)}
            />
            Prioritize keywords real competitors already rank for (from your Semrush import)
          </label>
          <div className="max-w-[200px]">
            <Label className="text-xs">Competitor-proven topics / cycle</Label>
            <Input
              type="number"
              min={0}
              max={30}
              value={kloudgraphPerRun}
              onChange={(e) => setKloudgraphPerRun(Number(e.target.value) || 0)}
              disabled={!kloudgraphEnabled}
            />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            These take priority over generic keyword research each cycle — they're backed by real
            data, not a guess.{" "}
            <Link to="/kloudgraph" className="text-primary underline">
              See the attack list
            </Link>
          </p>
        </div>

        <div className="lg:col-span-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Pre-publish review queue
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Nothing goes straight to WordPress. Finished articles wait here for a hold window so you
            can preview everything first.{" "}
            <Link to="/publish-queue" className="text-primary underline">
              Open the review queue
            </Link>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Hold window before publish (hours)</Label>
              <Input
                type="number"
                min={1}
                max={168}
                value={reviewHoldHours}
                onChange={(e) => setReviewHoldHours(Number(e.target.value) || 24)}
              />
            </div>
            <label className="flex items-end gap-2 pb-1.5 text-sm">
              <Checkbox
                checked={autoApproveAfterHold}
                onCheckedChange={(v) => setAutoApproveAfterHold(!!v)}
              />
              <span>
                Auto-publish once the hold elapses (off = waits for you to approve, no matter how
                long)
              </span>
            </label>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-lg border border-border bg-card/40 p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" /> Site-wide auto internal linking
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Scans the ENTIRE live WordPress site (any page, any origin) and proposes natural links
            between related content. Scanning is read-only and safe; applying edits it.{" "}
            <Link to="/internal-links" className="text-primary underline">
              Review suggestions
            </Link>
          </p>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <Checkbox
              checked={siteLinksEnabled}
              onCheckedChange={(v) => setSiteLinksEnabled(!!v)}
            />
            Enable this phase (off by default)
          </label>
          <div className="max-w-[240px]">
            <Label className="text-xs">
              Auto-apply links per cycle (0 = suggest only, never write)
            </Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={siteLinksApplyPerRun}
              onChange={(e) => setSiteLinksApplyPerRun(Number(e.target.value) || 0)}
              disabled={!siteLinksEnabled}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-4">
        <Button
          size="sm"
          disabled={saveMut.isPending}
          onClick={() => saveMut.mutate()}
          title="Save these settings — takes effect on the next cycle."
        >
          {saveMut.isPending ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
          )}
          Save settings
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={runOnceMut.isPending}
          onClick={() => runOnceMut.mutate()}
          title="Run one cycle right now, without waiting for the schedule."
        >
          {runOnceMut.isPending ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="mr-2 h-3.5 w-3.5" />
          )}
          Run one cycle now
        </Button>
        {status?.lastRunAt && (
          <span className="text-xs text-muted-foreground">
            Last ran {new Date(status.lastRunAt).toLocaleString()}
          </span>
        )}
      </div>

      {last && (
        <div className="border-t border-border bg-background/40 px-6 py-4">
          <div className="mb-2 text-xs font-semibold text-muted-foreground">Last cycle result</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            <MiniStat label="KLOUDGRAPH" value={last.kloudgraphSent} accent />
            <MiniStat label="Discovered" value={last.discovered} />
            <MiniStat label="Briefed" value={last.briefed} />
            <MiniStat label="Written" value={last.written} />
            <MiniStat label="Queued" value={last.queued} />
            <MiniStat label="Published" value={last.published} />
            <MiniStat label="Refreshed" value={last.refreshed} />
            <MiniStat label="Tools" value={last.toolsGenerated} />
            <MiniStat label="Links found" value={last.siteLinksFound} />
            <MiniStat label="Links applied" value={last.siteLinksApplied} />
            <MiniStat label="Errors" value={last.errors.length} warn={last.errors.length > 0} />
          </div>
          {last.log.length > 0 && (
            <ul className="mt-3 max-h-32 space-y-0.5 overflow-y-auto font-mono text-[11px] text-muted-foreground">
              {last.log.slice(-10).map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function MiniStat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-center">
      <div
        className={`num text-lg font-semibold ${warn ? "text-destructive" : accent ? "text-orange-400" : ""}`}
      >
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
