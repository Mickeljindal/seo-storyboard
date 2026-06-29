import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Quote, Loader2, Play, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import {
  citationStatusFn,
  citationsSummaryFn,
  runCitationCheckFn,
} from "@/lib/citations.functions";

export const Route = createFileRoute("/citations")({ component: CitationsPage });

type EngineStat = { engine: string; total: number; cited: number; mentioned: number };
type Summary = {
  total: number;
  cited: number;
  mentioned: number;
  citationRate: number;
  byEngine: EngineStat[];
  topCompetitors: { domain: string; count: number }[];
};
type CitationRow = {
  id: string;
  query: string;
  engine: string;
  geo: string | null;
  mentioned: boolean;
  cited: boolean;
  position: number | null;
  cited_url: string | null;
  competitors: string[];
  created_at?: string;
};

const ENGINE_LABEL: Record<string, string> = {
  perplexity: "Perplexity",
  gemini: "Gemini",
  openai: "ChatGPT",
};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function CitationsPage() {
  const qc = useQueryClient();
  const [customQuery, setCustomQuery] = useState("");

  const statusFn = useServerFn(citationStatusFn);
  const summaryFn = useServerFn(citationsSummaryFn);
  const runFn = useServerFn(runCitationCheckFn);

  const { data: status } = useQuery({
    queryKey: ["citation-status"],
    queryFn: () => statusFn({}),
  });
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["citations-summary"],
    queryFn: () => summaryFn({ data: { days: 30 } }),
  });

  const summary = (summaryData?.summary ?? null) as Summary | null;
  const recent = (summaryData?.recent ?? []) as CitationRow[];
  const engines = (status?.engines ?? []) as string[];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["citations-summary"] });

  const runMut = useMutation({
    mutationFn: (queries: string[]) => runFn({ data: { queries, geo: "global" } }),
    onSuccess: (r) => {
      toast.success(`Checked ${r.ran} engine-answers — cited ${r.cited}, mentioned ${r.mentioned}`);
      invalidate();
    },
    onError: (e) => toast.error(String((e as Error)?.message ?? e)),
  });

  const noEngines = engines.length === 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <Quote className="h-6 w-6" /> AI Citations
            </h1>
            <p className="text-sm text-muted-foreground">
              Are we the cited source when AI engines answer relevant questions? This is the GEO/AIO
              outcome metric.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {noEngines ? (
              <span className="rounded bg-amber-100 px-2 py-1 text-amber-800">
                No engines configured — add PERPLEXITY_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY
              </span>
            ) : (
              engines.map((e) => (
                <span key={e} className="rounded bg-muted px-2 py-1">
                  {ENGINE_LABEL[e] ?? e}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Answers checked (30d)" value={summary ? String(summary.total) : "—"} />
          <Stat
            label="Citation rate"
            value={summary ? pct(summary.citationRate) : "—"}
            accent="text-emerald-600"
          />
          <Stat label="Cited" value={summary ? String(summary.cited) : "—"} />
          <Stat label="Mentioned" value={summary ? String(summary.mentioned) : "—"} />
        </div>

        {/* Run controls */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => runMut.mutate([])}
              disabled={noEngines || runMut.isPending}
              title="Auto-build questions from recently published articles"
            >
              {runMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run auto check
            </Button>
            <span className="text-xs text-muted-foreground">
              Builds buyer questions from your published topics and asks each engine.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Ask a specific question, e.g. best managed cloud hosting in Saudi Arabia"
                className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customQuery.trim().length > 3) {
                    runMut.mutate([customQuery.trim()]);
                    setCustomQuery("");
                  }
                }}
              />
            </div>
            <Button
              variant="outline"
              disabled={noEngines || runMut.isPending || customQuery.trim().length < 4}
              onClick={() => {
                runMut.mutate([customQuery.trim()]);
                setCustomQuery("");
              }}
            >
              Check
            </Button>
          </div>
        </div>

        {/* By engine + competitors */}
        {summary && (summary.byEngine.length > 0 || summary.topCompetitors.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 text-sm font-medium">By engine</h2>
              <div className="space-y-2">
                {summary.byEngine.map((e) => (
                  <div key={e.engine} className="flex items-center justify-between text-sm">
                    <span>{ENGINE_LABEL[e.engine] ?? e.engine}</span>
                    <span className="text-muted-foreground">
                      {e.cited}/{e.total} cited · {e.total ? pct(e.cited / e.total) : "0%"} ·{" "}
                      {e.mentioned} mentioned
                    </span>
                  </div>
                ))}
                {!summary.byEngine.length && (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                )}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 text-sm font-medium">Competitors cited instead</h2>
              <div className="flex flex-wrap gap-2">
                {summary.topCompetitors.map((c) => (
                  <span key={c.domain} className="rounded bg-muted px-2 py-1 text-xs">
                    {c.domain} · {c.count}
                  </span>
                ))}
                {!summary.topCompetitors.length && (
                  <p className="text-sm text-muted-foreground">None recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent results */}
        <div className="rounded-lg border">
          <div className="border-b px-4 py-3 text-sm font-medium">Recent checks</div>
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No checks yet. Run an auto check to see where AI engines cite (or skip) Kloudbean.
            </div>
          ) : (
            <div className="divide-y">
              {recent.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm">{r.query}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {ENGINE_LABEL[r.engine] ?? r.engine}
                      </span>
                      {r.cited ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                          Cited{r.position ? ` · #${r.position}` : ""}
                        </span>
                      ) : r.mentioned ? (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700">
                          Mentioned
                        </span>
                      ) : (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-700">
                          Not cited
                        </span>
                      )}
                      {r.competitors.slice(0, 3).map((c) => (
                        <span key={c}>{c}</span>
                      ))}
                    </div>
                  </div>
                  {r.cited_url && (
                    <a
                      href={r.cited_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
