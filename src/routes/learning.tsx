import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Brain, Loader2, TrendingUp, Quote, Clock, Trophy, DollarSign } from "lucide-react";
import { learningDashboardFn } from "@/lib/learning.functions";

export const Route = createFileRoute("/learning")({ component: LearningPage });

type ClusterRow = {
  cluster_id: number;
  name: string;
  avg_reward: number;
  n: number;
  published: number;
};
type IntentRow = { intent: string; avg_reward: number; n: number };
type EngineStat = { engine: string; total: number; cited: number; mentioned: number };
type Data = {
  totalSignals: number;
  byCluster: ClusterRow[];
  byIntent: IntentRow[];
  performance: { pages: number; clicks: number; impressions: number; avgPosition: number };
  topPages: { page: string; clicks: number; impressions: number; position: number }[];
  citations: {
    total: number;
    cited: number;
    mentioned: number;
    citationRate: number;
    byEngine: EngineStat[];
  };
  freshness: {
    totalLive: number;
    fresh: number;
    due: number;
    intervalDays: number;
    oldestDays: number;
  };
  conversions: {
    total: number;
    signups: number;
    paid: number;
    value: number;
    currency: string;
    bySource: { source: string; surface: string; signups: number; paid: number; value: number }[];
  };
};

const ENGINE_LABEL: Record<string, string> = {
  perplexity: "Perplexity",
  gemini: "Gemini",
  openai: "ChatGPT",
};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function rewardColor(r: number): string {
  if (r >= 0.6) return "bg-emerald-500";
  if (r >= 0.3) return "bg-sky-500";
  if (r > 0) return "bg-amber-500";
  return "bg-muted-foreground/30";
}

function LearningPage() {
  const dashFn = useServerFn(learningDashboardFn);
  const { data, isLoading } = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: () => dashFn({}),
  });

  const d = data as Data | undefined;
  const maxReward = Math.max(0.001, ...(d?.byCluster.map((c) => c.avg_reward) ?? [0.001]));

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Brain className="h-6 w-6" /> Learning Loop
          </h1>
          <p className="text-sm text-muted-foreground">
            What the engine has learned actually wins — reward by cluster and intent, real Search
            Console outcomes, AI-citation rate, and content freshness.
          </p>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          </div>
        ) : !d ? (
          <p className="text-sm text-muted-foreground">No learning data yet.</p>
        ) : (
          <>
            {/* Headline stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat
                icon={<Brain className="h-4 w-4" />}
                label="Learning signals"
                value={String(d.totalSignals)}
              />
              <Stat
                icon={<TrendingUp className="h-4 w-4" />}
                label="GSC clicks (28d)"
                value={d.performance.clicks.toLocaleString()}
                sub={`${d.performance.impressions.toLocaleString()} impr · avg pos ${d.performance.avgPosition || "—"}`}
              />
              <Stat
                icon={<Quote className="h-4 w-4" />}
                label="AI citation rate"
                value={d.citations.total ? pct(d.citations.citationRate) : "—"}
                sub={`${d.citations.cited}/${d.citations.total} cited (30d)`}
              />
              <Stat
                icon={<Clock className="h-4 w-4" />}
                label="Content fresh"
                value={
                  d.freshness.totalLive
                    ? pct((d.freshness.totalLive - d.freshness.due) / d.freshness.totalLive)
                    : "—"
                }
                sub={`${d.freshness.due} due · oldest ${d.freshness.oldestDays}d`}
              />
            </div>

            {/* Conversions — the ultimate outcome */}
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4" /> Conversions (90d)
                <span className="font-normal text-muted-foreground">
                  — signups & revenue attributed to pages (weighs heaviest in learning)
                </span>
              </h2>
              <div className="mb-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Signups"
                  value={String(d.conversions.signups)}
                />
                <Stat
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Paid"
                  value={String(d.conversions.paid)}
                />
                <Stat
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Attributed value"
                  value={`${d.conversions.value.toLocaleString()} ${d.conversions.currency}`}
                />
                <Stat
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Total events"
                  value={String(d.conversions.total)}
                />
              </div>
              {d.conversions.bySource.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No conversions yet. Tag console links are live; connect the console webhook (POST
                  /wp-json/kbseo/v1/conversion) to attribute signups to pages.
                </p>
              ) : (
                <div className="divide-y">
                  {d.conversions.bySource.map((s) => (
                    <div
                      key={s.source + s.surface}
                      className="flex items-center justify-between gap-4 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                          {s.surface}
                        </span>
                        {s.source}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {s.paid} paid · {s.signups} signups
                        {s.value ? ` · ${s.value.toLocaleString()} ${d.conversions.currency}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reward by cluster */}
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-4 w-4" /> Reward by cluster
                <span className="font-normal text-muted-foreground">
                  — what the discovery ranker now favours
                </span>
              </h2>
              {d.byCluster.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No signals yet. Publish + sync performance/citations to start learning.
                </p>
              ) : (
                <div className="space-y-2">
                  {d.byCluster.map((c) => (
                    <div key={c.cluster_id} className="flex items-center gap-3 text-sm">
                      <div className="w-32 shrink-0 truncate" title={c.name}>
                        {c.name}
                      </div>
                      <div className="h-3 flex-1 overflow-hidden rounded bg-muted">
                        <div
                          className={`h-full ${rewardColor(c.avg_reward)}`}
                          style={{ width: `${Math.max(2, (c.avg_reward / maxReward) * 100)}%` }}
                        />
                      </div>
                      <div className="w-28 shrink-0 text-right text-xs text-muted-foreground">
                        {c.avg_reward.toFixed(2)} · {c.published}/{c.n}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Reward by intent */}
              <div className="rounded-lg border p-4">
                <h2 className="mb-3 text-sm font-medium">Reward by intent</h2>
                {d.byIntent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No intent signals yet.</p>
                ) : (
                  <div className="space-y-2">
                    {d.byIntent.map((it) => (
                      <div key={it.intent} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{it.intent}</span>
                        <span className="text-muted-foreground">
                          {it.avg_reward.toFixed(2)} · {it.n} signals
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Citation by engine */}
              <div className="rounded-lg border p-4">
                <h2 className="mb-3 text-sm font-medium">AI citations by engine (30d)</h2>
                {d.citations.byEngine.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No citation checks yet — run them on the AI Citations page.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {d.citations.byEngine.map((e) => (
                      <div key={e.engine} className="flex items-center justify-between text-sm">
                        <span>{ENGINE_LABEL[e.engine] ?? e.engine}</span>
                        <span className="text-muted-foreground">
                          {e.cited}/{e.total} cited · {e.mentioned} mentioned
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top pages */}
            <div className="rounded-lg border">
              <div className="border-b px-4 py-3 text-sm font-medium">
                Top pages by clicks (Search Console)
              </div>
              {d.topPages.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No Search Console data yet. Connect GSC in Settings and sync.
                </div>
              ) : (
                <div className="divide-y">
                  {d.topPages.map((p) => (
                    <div
                      key={p.page}
                      className="flex items-center justify-between gap-4 px-4 py-2 text-sm"
                    >
                      <a
                        href={p.page}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 truncate text-muted-foreground hover:text-foreground"
                      >
                        {p.page.replace(/^https?:\/\/[^/]+/, "")}
                      </a>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {p.clicks} clk · {p.impressions} impr · pos {p.position.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
