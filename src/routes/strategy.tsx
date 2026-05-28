import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { ArticleSidePanel } from "@/components/ArticleSidePanel";
import { IntentBadge, OpportunityBadge } from "@/components/seo/IntentBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getArticleOpportunities, getClusterAuthority, bulkResearchArticles } from "@/lib/seo-strategy.functions";
import { useState } from "react";
import { Brain, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { CLUSTERS } from "@/lib/pillars";

export const Route = createFileRoute("/strategy")({ component: Strategy });

function Strategy() {
  const [geo, setGeo] = useState("sa");
  const [panelId, setPanelId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const oppFn = useServerFn(getArticleOpportunities);
  const clusterFn = useServerFn(getClusterAuthority);
  const bulkFn = useServerFn(bulkResearchArticles);

  const { data: opp, isLoading: oppLoading } = useQuery({
    queryKey: ["opportunities", geo],
    queryFn: () => oppFn({ data: { geo: geo as "sa" | "in" | "ae" | "global", limit: 30 } }),
  });

  const { data: clusters, isLoading: clusterLoading } = useQuery({
    queryKey: ["cluster-authority"],
    queryFn: () => clusterFn({}),
  });

  const bulkMut = useMutation({
    mutationFn: (clusterId?: number) =>
      bulkFn({ data: { onlyMissing: true, limit: 15, clusterId } }),
    onSuccess: (r) => {
      toast.success(`Researched ${r.success}/${r.total} articles with DataForSEO`);
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["cluster-authority"] });
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const opportunities = opp?.opportunities ?? [];
  const clusterReports = clusters?.clusters ?? [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 py-8">
        <header className="mb-10">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Brain className="h-3 w-3 text-primary" />
            SEO Intelligence
          </div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">Topical Authority Command Center</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            DataForSEO drives keyword decisions, search intent, meta titles/descriptions, and which topics to publish first —
            organized into 10 authority clusters so Kloudbean wins without backlinks.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Select value={geo} onValueChange={setGeo}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sa">Saudi Arabia</SelectItem>
                <SelectItem value="in">India</SelectItem>
                <SelectItem value="ae">UAE</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" asChild>
              <Link to="/engine">Full autonomous engine →</Link>
            </Button>
            <Button
              onClick={() => bulkMut.mutate(undefined)}
              disabled={bulkMut.isPending}
              style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            >
              {bulkMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Research top 15 with DataForSEO
            </Button>
          </div>
        </header>

        {/* How search intent maps to content */}
        <section className="mb-10 rounded-xl border border-border bg-card/50 p-6 backdrop-blur">
          <h2 className="text-display mb-4 text-lg font-semibold">How people search → what we publish</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <IntentCard
              intent="informational"
              desc="Guides, definitions, how-tos — own PAA & AI Overviews with TL;DR + FAQ schema."
              examples={["what is managed cloud", "NCA compliance guide"]}
            />
            <IntentCard
              intent="commercial"
              desc="Comparisons & alternatives — Kloudbean vs AWS/Cloudways with pricing tables."
              examples={["cloudways alternative", "managed aws pricing"]}
            />
            <IntentCard
              intent="transactional"
              desc="Trial, deploy, enterprise — short path to CTA with trust (MISA, migration)."
              examples={["deploy n8n cloud", "enterprise hosting KSA"]}
            />
            <IntentCard
              intent="navigational"
              desc="Brand + product pages — clear entity signals for Kloudbean properties."
              examples={["kloudbean pricing", "kloudgpt deploy"]}
            />
          </div>
        </section>

        {/* Cluster authority */}
        <section className="mb-10">
          <SectionHead kicker="01" title="Topical authority clusters" desc="10 clusters · depth before breadth · internal mesh" />
          {clusterLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading clusters…</div>
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {clusterReports.map((c) => (
                <div key={c.cluster_id} className="rounded-lg border border-border bg-card/60 p-4 backdrop-blur">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[10px] text-primary">Cluster {String(c.cluster_id).padStart(2, "0")}</div>
                      <div className="font-medium">{c.cluster_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="num text-2xl font-semibold">{c.avg_opportunity}</div>
                      <div className="text-[10px] text-muted-foreground">avg opportunity</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    <MiniStat label="Articles" value={c.total_articles} />
                    <MiniStat label="Researched" value={c.researched} />
                    <MiniStat label="Briefed" value={c.briefed} />
                    <MiniStat label="Live" value={c.published} />
                  </div>
                  {c.hub_keyword && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Hub keyword: <code className="text-foreground">{c.hub_keyword}</code>
                    </div>
                  )}
                  {c.gaps.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-[11px] text-amber-400/90">
                      {c.gaps.slice(0, 2).map((g) => (
                        <li key={g}>· {g}</li>
                      ))}
                    </ul>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    disabled={bulkMut.isPending}
                    onClick={() => bulkMut.mutate(c.cluster_id)}
                  >
                    Research this cluster
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Priority queue */}
        <section>
          <SectionHead
            kicker="02"
            title="Publish priority queue"
            desc={`${opp?.total ?? 0} articles · sorted by opportunity score · meta pre-filled from SERP`}
          />
          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-foreground/[0.02] font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left">Score</th>
                  <th className="px-4 py-2.5 text-left">Article</th>
                  <th className="px-4 py-2.5 text-left">Keyword</th>
                  <th className="px-4 py-2.5 text-left">Intent</th>
                  <th className="px-4 py-2.5 text-right">Vol</th>
                  <th className="px-4 py-2.5 text-right">KD</th>
                  <th className="px-4 py-2.5 text-left">Meta title</th>
                  <th className="px-4 py-2.5 text-left">Next action</th>
                </tr>
              </thead>
              <tbody>
                {oppLoading && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!oppLoading && opportunities.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Seed articles first, then run bulk research</td></tr>
                )}
                {opportunities.map((a) => (
                  <tr
                    key={a.id}
                    className="cursor-pointer border-t border-border/60 hover:bg-foreground/[0.03]"
                    onClick={() => { setPanelId(a.id); setOpen(true); }}
                  >
                    <td className="px-4 py-3"><OpportunityBadge score={a.opportunity_score} /></td>
                    <td className="max-w-[200px] px-4 py-3">
                      <div className="line-clamp-2 font-medium">{a.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {CLUSTERS.find((c) => c.id === a.cluster_id)?.short ?? `P${a.cluster_id ?? "?"}`} · {a.status}
                      </div>
                    </td>
                    <td className="px-4 py-3"><code className="text-[11px]">{a.target_keyword ?? "—"}</code></td>
                    <td className="px-4 py-3"><IntentBadge intent={a.intent} /></td>
                    <td className="px-4 py-3 text-right num">{a.volume?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-3 text-right num">{a.difficulty ?? "—"}</td>
                    <td className="max-w-[180px] px-4 py-3 text-xs text-muted-foreground line-clamp-2">
                      {a.meta_title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-primary">{a.recommended_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <ArticleSidePanel articleId={panelId} open={open} onOpenChange={setOpen} />
    </AppLayout>
  );
}

function SectionHead({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
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

function IntentCard({
  intent,
  desc,
  examples,
}: {
  intent: "informational" | "commercial" | "transactional" | "navigational";
  desc: string;
  examples: string[];
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <IntentBadge intent={intent} />
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {examples.map((e) => (
          <span key={e} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px]">{e}</span>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="num font-semibold">{value}</div>
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
