import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Network,
  Download,
  Database,
  Target,
  RefreshCw,
  Users,
  Swords,
  Link2,
  Rocket,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import {
  seedCompetitorsFn,
  importSemrushFn,
  kloudgraphStatsFn,
  listKgCompetitorsFn,
  listScoredOpportunitiesFn,
  listLinkTargetsFn,
  listCompetitorStrengthFn,
  listMarketMapFn,
  sendOpportunitiesToContentFn,
} from "@/lib/kloudgraph.functions";

export const Route = createFileRoute("/kloudgraph")({ component: KloudgraphPage });

const TIER_LABEL: Record<number, string> = {
  1: "Direct",
  2: "Control panel",
  3: "PaaS",
  4: "Infra",
  5: "Broad host",
};

function KloudgraphPage() {
  const qc = useQueryClient();
  const seedFn = useServerFn(seedCompetitorsFn);
  const importFn = useServerFn(importSemrushFn);
  const statsFn = useServerFn(kloudgraphStatsFn);
  const compsFn = useServerFn(listKgCompetitorsFn);
  const oppsFn = useServerFn(listScoredOpportunitiesFn);
  const linksFn = useServerFn(listLinkTargetsFn);
  const strengthFn = useServerFn(listCompetitorStrengthFn);
  const marketMapFn = useServerFn(listMarketMapFn);
  const sendFn = useServerFn(sendOpportunitiesToContentFn);

  const stats = useQuery({ queryKey: ["kg-stats"], queryFn: () => statsFn({}) });
  const comps = useQuery({ queryKey: ["kg-comps"], queryFn: () => compsFn({}) });
  const opps = useQuery({
    queryKey: ["kg-opps"],
    queryFn: () => oppsFn({ data: { limit: 150, minRelevance: 0.5 } }),
  });
  const links = useQuery({
    queryKey: ["kg-links"],
    queryFn: () => linksFn({ data: { limit: 60 } }),
  });
  const strength = useQuery({ queryKey: ["kg-strength"], queryFn: () => strengthFn({}) });
  const marketMap = useQuery({ queryKey: ["kg-market-map"], queryFn: () => marketMapFn({}) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["kg-stats"] });
    qc.invalidateQueries({ queryKey: ["kg-comps"] });
    qc.invalidateQueries({ queryKey: ["kg-opps"] });
    qc.invalidateQueries({ queryKey: ["kg-links"] });
    qc.invalidateQueries({ queryKey: ["kg-strength"] });
    qc.invalidateQueries({ queryKey: ["kg-market-map"] });
  };

  const seedMut = useMutation({
    mutationFn: () => seedFn({}),
    onSuccess: (r) => {
      toast.success(`Competitor registry seeded (${r.seeded} domains)`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importMut = useMutation({
    mutationFn: () => importFn({ data: {} }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.error ?? "Import failed");
        return;
      }
      const imported = r.files.filter((f) => !f.skipped && !f.error);
      const skipped = r.files.filter((f) => f.skipped);
      const errored = r.files.filter((f) => f.error);
      toast.success(
        `Imported ${r.totalRows.toLocaleString()} rows from ${imported.length} file(s) across ${r.competitors.length} competitor(s)` +
          (skipped.length ? ` · ${skipped.length} skipped` : "") +
          (errored.length ? ` · ${errored.length} errored` : ""),
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMut = useMutation({
    mutationFn: () => sendFn({ data: { limit: 25, minRelevance: 0.6 } }),
    onSuccess: (r) => {
      if (r.created === 0) {
        toast.info("All top opportunities are already in your content pipeline.");
      } else {
        toast.success(
          `Sent ${r.created} keyword opportunit${r.created === 1 ? "y" : "ies"} to the content pipeline as article ideas.`,
        );
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const counts = stats.data?.counts;
  const competitors = comps.data?.competitors ?? [];
  const opportunities = opps.data?.opportunities ?? [];
  const linkTargets = links.data?.targets ?? [];
  const competitorStrength = strength.data?.competitors ?? [];
  const marketSegments = marketMap.data?.segments ?? [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 py-8">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Network className="h-3 w-3 text-primary" />
            KLOUDGRAPH — Competitor Intelligence
          </div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">Competitor Graph</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your private Semrush replacement. Every competitor keyword, backlink and referring
            domain, turned into a single attack list: what to write next, who to get links from, and
            who&apos;s actually winning.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => seedMut.mutate()}
              disabled={seedMut.isPending}
              title="Add the tracked competitor list to the registry."
            >
              {seedMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Users className="mr-2 h-4 w-4" />
              )}
              Seed competitors
            </Button>
            <Button
              onClick={() => importMut.mutate()}
              disabled={importMut.isPending}
              title="Read every CSV in the kloudgraph-semrush-export folder into the database."
              style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            >
              {importMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Import Semrush exports
            </Button>
            <Button
              variant="secondary"
              onClick={() => sendMut.mutate()}
              disabled={sendMut.isPending}
              title="Turn the top-scored opportunities into article ideas in your content pipeline."
            >
              {sendMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-2 h-4 w-4" />
              )}
              Send top opportunities to content pipeline
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => invalidate()}
              title="Refresh the numbers on this page."
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        {/* STAT CARDS */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Users} label="Competitors" value={counts?.competitors} />
          <StatCard icon={Target} label="Ranking keywords" value={counts?.rankings} />
          <StatCard icon={Database} label="Gap keywords" value={counts?.gap} />
          <StatCard icon={Network} label="Backlinks" value={counts?.backlinks} />
        </div>

        {/* COMPETITOR STRENGTH — who's actually winning */}
        <Section
          title="Competitor strength"
          desc="Ranked by real measured strength — ranking keywords + backlinks + referring domains (log-scaled)"
        >
          {competitorStrength.length === 0 ? (
            <Empty>Import data to see who&apos;s strongest in the niche.</Empty>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {competitorStrength.slice(0, 12).map((c, i) => (
                <div
                  key={c.domain}
                  className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2.5"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-medium">
                      {i === 0 && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                      {c.domain}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {c.rankingKeywords.toLocaleString()} kw · {c.backlinkCount.toLocaleString()}{" "}
                      bl · {c.referringDomainCount.toLocaleString()} rd
                    </div>
                  </div>
                  <div className="num text-lg font-semibold text-primary">{c.strengthScore}</div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* MARKET MAP — which segment is winnable right now */}
        <Section
          title="Market map"
          desc="Competitor segments ranked by winnability — real unclaimed demand vs how strong the incumbents in that segment actually are"
        >
          {marketSegments.length === 0 ? (
            <Empty>Import data to see which market segment is most winnable.</Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {marketSegments.map((s, i) => (
                <div key={s.category} className="rounded-lg border border-border bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-medium">
                      {i === 0 && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                      {s.category}
                    </div>
                    <div className="num text-lg font-semibold text-primary">
                      {s.winnabilityScore}
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {s.competitorCount} competitor{s.competitorCount !== 1 ? "s" : ""} · avg
                    strength {s.avgStrength}
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {s.opportunityKeywords} unclaimed keyword(s) ·{" "}
                    {s.opportunityVolume.toLocaleString()} combined volume
                  </div>
                  {s.topKeywords.length > 0 && (
                    <div className="mt-2 line-clamp-2 text-[10px] text-muted-foreground">
                      Top: {s.topKeywords.map((k) => k.keyword).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* SCORED OPPORTUNITIES — the attack list */}
        <Section
          title="Attack list — top content opportunities"
          desc="Relevance-filtered, cluster-classified, and ranked by volume + ease + how many rivals already prove the demand"
          action={
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] text-muted-foreground">
              <Swords className="h-3 w-3" />
              {opportunities.length} opportunities
            </div>
          }
        >
          {opportunities.length === 0 ? (
            <Empty>Import a keyword-gap export to build the attack list.</Empty>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card/60">
              <table className="w-full text-sm">
                <thead className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Keyword</th>
                    <th className="px-4 py-2.5 text-left">Cluster</th>
                    <th className="px-4 py-2.5 text-right">Volume</th>
                    <th className="px-4 py-2.5 text-right">KD</th>
                    <th className="px-4 py-2.5 text-right">Rivals</th>
                    <th className="px-4 py-2.5 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.slice(0, 100).map((o, i) => (
                    <tr key={`${o.keyword}-${i}`} className="border-t border-border/60">
                      <td className="max-w-[300px] px-4 py-3">
                        <div className="line-clamp-1 font-medium">{o.keyword}</div>
                        <div className="line-clamp-1 text-[10px] text-muted-foreground">
                          {o.competitors.slice(0, 3).join(", ")}
                          {o.competitors.length > 3 ? ` +${o.competitors.length - 3}` : ""} · best
                          pos {o.bestCompetitorPosition ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">
                        {o.clusterName ?? "—"}
                      </td>
                      <td className="num px-4 py-3 text-right font-semibold text-primary">
                        {o.volume ? o.volume.toLocaleString() : "—"}
                      </td>
                      <td className="num px-4 py-3 text-right">{o.difficulty ?? "—"}</td>
                      <td className="num px-4 py-3 text-right">{o.competitorCount}</td>
                      <td className="num px-4 py-3 text-right font-semibold">{o.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* LINK BUILDING TARGETS */}
        <Section
          title="Link-building targets"
          desc="Domains already linking to 2+ of your tracked competitors — proven outreach targets in this niche"
        >
          {linkTargets.length === 0 ? (
            <Empty>Import a referring-domains export to see shared link opportunities.</Empty>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card/60">
              <table className="w-full text-sm">
                <thead className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Domain</th>
                    <th className="px-4 py-2.5 text-left">Links to</th>
                    <th className="px-4 py-2.5 text-right">Authority</th>
                    <th className="px-4 py-2.5 text-right">Total links</th>
                  </tr>
                </thead>
                <tbody>
                  {linkTargets.slice(0, 40).map((t) => (
                    <tr key={t.referringDomain} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">
                        <div className="inline-flex items-center gap-1.5">
                          <Link2 className="h-3 w-3 text-muted-foreground" />
                          {t.referringDomain}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">
                        {t.competitors.slice(0, 4).join(", ")}
                        {t.competitors.length > 4 ? ` +${t.competitors.length - 4}` : ""}
                      </td>
                      <td className="num px-4 py-3 text-right">{t.bestAuthority ?? "—"}</td>
                      <td className="num px-4 py-3 text-right">
                        {t.totalBacklinks.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* COMPETITORS COVERAGE */}
        <Section title="Tracked competitors" desc="Data coverage per domain">
          {competitors.length === 0 ? (
            <Empty>
              Click &ldquo;Seed competitors&rdquo; to add the tracked list, then &ldquo;Import
              Semrush exports&rdquo; to load the data.
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card/60">
              <table className="w-full text-sm">
                <thead className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Domain</th>
                    <th className="px-4 py-2.5 text-left">Tier</th>
                    <th className="px-4 py-2.5 text-left">Category</th>
                    <th className="px-4 py-2.5 text-right">Rankings</th>
                    <th className="px-4 py-2.5 text-right">Gap kw</th>
                    <th className="px-4 py-2.5 text-right">Backlinks</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c) => (
                    <tr key={c.domain} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">{c.domain}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {TIER_LABEL[c.tier ?? 1] ?? c.tier}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.category ?? "—"}</td>
                      <td className="num px-4 py-3 text-right">
                        {c.rankings ? c.rankings.toLocaleString() : "—"}
                      </td>
                      <td className="num px-4 py-3 text-right">
                        {c.gapKeywords ? c.gapKeywords.toLocaleString() : "—"}
                      </td>
                      <td className="num px-4 py-3 text-right">
                        {c.backlinks ? c.backlinks.toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="num mt-1 text-2xl font-semibold">
        {value == null ? "—" : value.toLocaleString()}
      </div>
    </div>
  );
}

function Section({
  title,
  desc,
  action,
  children,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {desc ? <p className="text-xs text-muted-foreground">{desc}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/30 px-6 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
