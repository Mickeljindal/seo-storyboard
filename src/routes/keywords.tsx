import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  researchKeyword,
  bulkResearch,
  getKeywordIdeas,
  getCompetitorKeywords,
  testDataForSeoConnection,
} from "@/lib/dataforseo.functions";
import { listKeywords } from "@/lib/keywords.functions";
import { getStoredCompetitorRankingsFn } from "@/lib/kloudgraph.functions";
import { AppLayout } from "@/components/AppLayout";
import { IntentBadge, OpportunityBadge } from "@/components/seo/IntentBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Lightbulb, Globe, CheckCircle2, XCircle, Database } from "lucide-react";
import { toast } from "sonner";
import type { KeywordResearch } from "@/lib/seo-types";

export const Route = createFileRoute("/keywords")({ component: Keywords });

function Keywords() {
  const [kw, setKw] = useState("");
  const [geo, setGeo] = useState("sa");
  const [bulk, setBulk] = useState("");
  const [seed, setSeed] = useState("managed cloud hosting");
  const [competitor, setCompetitor] = useState("cloudways.com");
  const [lastResult, setLastResult] = useState<KeywordResearch | null>(null);

  const research = useServerFn(researchKeyword);
  const bulkFn = useServerFn(bulkResearch);
  const ideasFn = useServerFn(getKeywordIdeas);
  const compFn = useServerFn(getCompetitorKeywords);
  const testFn = useServerFn(testDataForSeoConnection);
  const storedFn = useServerFn(getStoredCompetitorRankingsFn);

  const { data: conn } = useQuery({ queryKey: ["dfs-conn"], queryFn: () => testFn({}) });

  const listKwFn = useServerFn(listKeywords);
  const { data: saved, refetch } = useQuery({
    queryKey: ["keywords", geo],
    queryFn: () => listKwFn({ data: { geo, limit: 50 } }),
  });

  const single = useMutation({
    mutationFn: () =>
      research({ data: { keyword: kw, geo: geo as "sa" | "in" | "ae" | "global" } }),
    onSuccess: (r) => {
      setLastResult(r.data as KeywordResearch);
      toast.success(
        r.mock
          ? "Mock data (add DataForSEO credentials)"
          : r.cached
            ? "Loaded from cache"
            : "Live SERP + intent data",
      );
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkM = useMutation({
    mutationFn: () =>
      bulkFn({
        data: {
          keywords: bulk
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 50),
          geo: geo as "sa" | "in" | "ae" | "global",
        },
      }),
    onSuccess: () => {
      toast.success("Bulk research done");
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ideasM = useMutation({
    mutationFn: () =>
      ideasFn({ data: { seed, geo: geo as "sa" | "in" | "ae" | "global", limit: 25 } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const compM = useMutation({
    mutationFn: () =>
      compFn({
        data: { domain: competitor, geo: geo as "sa" | "in" | "ae" | "global", limit: 40 },
      }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Free alternative: read from the KLOUDGRAPH warehouse (already-imported
  // Semrush data) instead of paying for a live DataForSEO lookup.
  const storedM = useMutation({
    mutationFn: () => storedFn({ data: { domain: competitor, limit: 60 } }),
    onSuccess: (r) => {
      if (r.keywords.length === 0) {
        toast.info(`No stored KLOUDGRAPH data for ${competitor} — import it on Competitor Graph.`);
      } else {
        toast.success(`${r.keywords.length} keywords from your KLOUDGRAPH warehouse (free)`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Keyword Intelligence</h1>
            <p className="text-sm text-muted-foreground">
              DataForSEO: volume, difficulty, search intent, PAA, SERP titles → meta title &
              description recommendations
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs">
            {conn?.ok ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-400">API connected</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">{conn?.message ?? "Checking…"}</span>
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="research">
          <TabsList>
            <TabsTrigger value="research">Deep research</TabsTrigger>
            <TabsTrigger value="ideas">Keyword ideas</TabsTrigger>
            <TabsTrigger value="bulk">Bulk</TabsTrigger>
            <TabsTrigger value="competitor">Competitor gap</TabsTrigger>
          </TabsList>

          <TabsContent value="research" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Target keyword…"
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && kw && single.mutate()}
              />
              <GeoSelect geo={geo} setGeo={setGeo} />
              <Button
                onClick={() => single.mutate()}
                disabled={!kw || single.isPending}
                title="Look up real search volume, difficulty and intent for this keyword."
              >
                {single.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Research
              </Button>
            </div>
            {lastResult && <ResearchPanel data={lastResult} />}
          </TabsContent>

          <TabsContent value="ideas" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Seed keyword…"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
              <GeoSelect geo={geo} setGeo={setGeo} />
              <Button
                onClick={() => ideasM.mutate()}
                disabled={ideasM.isPending}
                title="Get related keyword ideas from one seed word."
              >
                {ideasM.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb className="mr-2 h-4 w-4" />
                )}
                Get ideas
              </Button>
            </div>
            {ideasM.data && (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Keyword</th>
                      <th className="px-3 py-2 text-right">Volume</th>
                      <th className="px-3 py-2 text-right">KD</th>
                      <th className="px-3 py-2 text-left">Intent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ideasM.data.ideas.map(
                      (row: {
                        keyword: string;
                        volume: number | null;
                        difficulty: number | null;
                        intent: string | null;
                      }) => (
                        <tr key={row.keyword} className="border-t border-border">
                          <td className="px-3 py-2">
                            <button
                              className="text-left hover:text-primary"
                              onClick={() => {
                                setKw(row.keyword);
                                setLastResult(null);
                              }}
                            >
                              {row.keyword}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {row.volume?.toLocaleString() ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-right">{row.difficulty ?? "—"}</td>
                          <td className="px-3 py-2">
                            <IntentBadge intent={row.intent as any} />
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
                {ideasM.data.mock && (
                  <p className="px-3 py-2 text-xs text-amber-400">
                    Mock ideas — configure DataForSEO in Settings
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bulk" className="mt-4">
            <Textarea
              rows={8}
              placeholder="One keyword per line…"
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
            />
            <div className="mt-2 flex gap-2">
              <GeoSelect geo={geo} setGeo={setGeo} />
              <Button
                onClick={() => bulkM.mutate()}
                disabled={bulkM.isPending}
                title="Research many keywords at once (up to 50)."
              >
                {bulkM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run bulk (max 50)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="competitor" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              See what competitors rank for — find gaps Kloudbean should cover in topical clusters.
            </p>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="competitor.com"
                value={competitor}
                onChange={(e) => setCompetitor(e.target.value)}
              />
              <GeoSelect geo={geo} setGeo={setGeo} />
              <Button
                variant="outline"
                onClick={() => storedM.mutate()}
                disabled={storedM.isPending || !competitor}
                title="Free — reads from your already-imported KLOUDGRAPH warehouse (Semrush data), no API cost."
              >
                {storedM.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                Stored data (free)
              </Button>
              <Button
                onClick={() => compM.mutate()}
                disabled={compM.isPending || !competitor}
                title="Live DataForSEO lookup — costs API credits, always up to date."
              >
                {compM.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="mr-2 h-4 w-4" />
                )}
                Live lookup
              </Button>
            </div>

            {storedM.data && storedM.data.keywords.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="flex items-center gap-1.5 border-b border-border bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-400">
                  <Database className="h-3 w-3" /> From your KLOUDGRAPH warehouse (free, no API
                  call)
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-secondary/90 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Keyword</th>
                        <th className="px-3 py-2 text-right">Pos</th>
                        <th className="px-3 py-2 text-right">Volume</th>
                        <th className="px-3 py-2 text-right">KD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storedM.data.keywords.map((row) => (
                        <tr key={row.keyword} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{row.keyword}</td>
                          <td className="px-3 py-2 text-right">{row.position ?? "—"}</td>
                          <td className="px-3 py-2 text-right">
                            {row.volume?.toLocaleString() ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-right">{row.difficulty ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {compM.data && (
              <div className="overflow-hidden rounded-lg border border-border max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-secondary/90 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Keyword</th>
                      <th className="px-3 py-2 text-right">Pos</th>
                      <th className="px-3 py-2 text-right">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compM.data.keywords.map(
                      (row: {
                        keyword: string;
                        position: number | null;
                        volume: number | null;
                      }) => (
                        <tr key={row.keyword} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{row.keyword}</td>
                          <td className="px-3 py-2 text-right">{row.position ?? "—"}</td>
                          <td className="px-3 py-2 text-right">
                            {row.volume?.toLocaleString() ?? "—"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Saved keywords ({geo})
          </h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Keyword</th>
                  <th className="px-3 py-2 text-right">Opp</th>
                  <th className="px-3 py-2 text-right">Volume</th>
                  <th className="px-3 py-2 text-left">Intent</th>
                  <th className="px-3 py-2 text-left">Meta title</th>
                </tr>
              </thead>
              <tbody>
                {(saved ?? []).map((k) => {
                  const td = (k.trend_data ?? {}) as Record<string, unknown>;
                  return (
                    <tr key={k.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{k.keyword}</td>
                      <td className="px-3 py-2 text-right">
                        <OpportunityBadge score={(td.opportunity_score as number) ?? 0} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {k.monthly_volume?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <IntentBadge intent={td.search_intent as any} />
                      </td>
                      <td className="max-w-xs px-3 py-2 text-xs text-muted-foreground truncate">
                        {(td.meta_title as string) ?? "—"}
                      </td>
                    </tr>
                  );
                })}
                {(saved?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      No keywords yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function GeoSelect({ geo, setGeo }: { geo: string; setGeo: (v: string) => void }) {
  return (
    <Select value={geo} onValueChange={setGeo}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sa">Saudi Arabia</SelectItem>
        <SelectItem value="in">India</SelectItem>
        <SelectItem value="ae">UAE</SelectItem>
        <SelectItem value="global">Global</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ResearchPanel({ data }: { data: KeywordResearch }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold">{data.keyword}</h3>
        <IntentBadge intent={data.search_intent} />
        <span className="text-xs text-muted-foreground">Opportunity</span>
        <OpportunityBadge score={data.opportunity_score} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
        <Stat label="Volume / mo" value={data.monthly_volume?.toLocaleString() ?? "—"} />
        <Stat label="Difficulty" value={data.difficulty != null ? `${data.difficulty}/100` : "—"} />
        <Stat label="CPC" value={data.cpc != null ? `$${Number(data.cpc).toFixed(2)}` : "—"} />
        <Stat
          label="Intent conf."
          value={
            data.intent_probability != null ? `${Math.round(data.intent_probability * 100)}%` : "—"
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border bg-background/50 p-3">
          <div className="text-xs font-medium text-muted-foreground">
            Recommended meta title ({data.meta_title.length}/60)
          </div>
          <div className="mt-1 text-sm">{data.meta_title}</div>
        </div>
        <div className="rounded-md border border-border bg-background/50 p-3">
          <div className="text-xs font-medium text-muted-foreground">
            Recommended meta description ({data.meta_description.length}/160)
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{data.meta_description}</div>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground">Content angle</div>
        <p className="mt-1 text-sm">{data.content_angle}</p>
      </div>

      {data.topic_recommendations.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground">Topics to cover</div>
          <ul className="mt-1 space-y-0.5 text-sm">
            {data.topic_recommendations.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </div>
      )}

      {data.paa_questions.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground">
            People Also Ask (answer in FAQ)
          </div>
          <ul className="mt-1 space-y-0.5 text-sm">
            {data.paa_questions.map((q) => (
              <li key={q}>· {q}</li>
            ))}
          </ul>
        </div>
      )}

      {data.related_keywords.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground">
            Related keywords (secondary targets)
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.related_keywords.map((r) => (
              <span key={r.keyword} className="rounded bg-secondary px-2 py-0.5 text-[11px]">
                {r.keyword}{" "}
                {r.volume != null && <span className="text-muted-foreground">({r.volume})</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="num mt-0.5 font-semibold">{value}</div>
    </div>
  );
}
