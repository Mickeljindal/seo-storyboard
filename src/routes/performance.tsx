import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  MousePointerClick,
  Eye,
  MapPin,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAnalyticsDashboardFn,
  syncSearchConsoleFn,
  testGscConnectionFn,
} from "@/lib/analytics.functions";

export const Route = createFileRoute("/performance")({ component: Performance });

type TopPage = {
  page: string;
  articleId: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

function Performance() {
  const dashboardFn = useServerFn(getAnalyticsDashboardFn);
  const syncFn = useServerFn(syncSearchConsoleFn);
  const testFn = useServerFn(testGscConnectionFn);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => dashboardFn({}),
  });

  const sync = useMutation({
    mutationFn: () => syncFn({ data: { days: 28 } }),
    onSuccess: (r: {
      ok: boolean;
      stored?: number;
      matched?: number;
      window?: string;
      error?: string;
    }) => {
      if (r.ok) {
        toast.success(`Synced ${r.stored} pages (${r.matched} matched to articles) · ${r.window}`);
        refetch();
      } else {
        toast.error(r.error ?? "Sync failed");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const test = useMutation({
    mutationFn: () => testFn({}),
    onSuccess: (r: { ok: boolean; message: string }) =>
      r.ok ? toast.success(r.message) : toast.error(r.message),
    onError: (e: Error) => toast.error(e.message),
  });

  const configured = data?.configured ?? false;
  const totals = data?.totals ?? { pages: 0, clicks: 0, impressions: 0, avgPosition: 0 };
  const topPages = (data?.topPages ?? []) as TopPage[];
  const hasData = totals.pages > 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1200px] px-8 py-8">
        <header className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-primary" /> Own Analytics · Google Search Console
          </div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">
            Real search performance
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            First-party ranking data pulled straight from Google Search Console — no paid
            third-party tool. Real clicks, impressions, and positions feed the self-learning ranker,
            so discovery prioritises the clusters that actually win.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={sync.isPending}
              onClick={() => sync.mutate()}
              title="Pull the latest Google clicks, impressions and rankings for your pages."
            >
              {sync.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync from Search Console
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={test.isPending}
              onClick={() => test.mutate()}
              title="Check that the Google Search Console connection is working."
            >
              {test.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Test connection
            </Button>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                configured
                  ? "bg-[var(--lime)]/15 text-[var(--lime)]"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {configured ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {configured ? "Connected" : "Not configured"}
            </span>
          </div>
        </header>

        {!configured && (
          <div className="mb-8 rounded-xl border border-border bg-card/60 p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="h-4 w-4 text-primary" /> Connect Google Search Console (free)
            </h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs text-muted-foreground">
              <li>Google Cloud Console → create a service account → create a JSON key.</li>
              <li>
                Search Console → Settings → Users and permissions → add the service account email
                (Restricted is fine).
              </li>
              <li>
                Add to <code className="rounded bg-secondary px-1">.env</code>:{" "}
                <code className="rounded bg-secondary px-1">GSC_CLIENT_EMAIL</code>,{" "}
                <code className="rounded bg-secondary px-1">GSC_PRIVATE_KEY</code>,{" "}
                <code className="rounded bg-secondary px-1">GSC_SITE_URL</code>.
              </li>
              <li>Restart, then click “Test connection” and “Sync”.</li>
            </ol>
          </div>
        )}

        {/* Headline stats */}
        <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
          <Stat
            icon={MousePointerClick}
            label="Clicks"
            value={hasData ? totals.clicks.toLocaleString() : "—"}
            accent
          />
          <Stat
            icon={Eye}
            label="Impressions"
            value={hasData ? totals.impressions.toLocaleString() : "—"}
          />
          <Stat icon={MapPin} label="Avg position" value={hasData ? totals.avgPosition : "—"} />
          <Stat icon={TrendingUp} label="Pages tracked" value={hasData ? totals.pages : "—"} />
        </div>

        {/* Top pages */}
        <section className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold">Top pages by real clicks</h2>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading analytics…</div>
          ) : !hasData ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              {configured
                ? "No data yet — click “Sync from Search Console”. (New URLs can take a few days to appear in GSC.)"
                : "Connect Search Console above to populate this table."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3">Page</th>
                    <th className="pb-2 px-3 text-right">Clicks</th>
                    <th className="pb-2 px-3 text-right">Impr.</th>
                    <th className="pb-2 px-3 text-right">CTR</th>
                    <th className="pb-2 pl-3 text-right">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((p) => (
                    <tr key={p.page} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          {p.articleId && (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                              title="Matched to an article"
                            />
                          )}
                          <a
                            href={p.page}
                            target="_blank"
                            rel="noreferrer"
                            className="line-clamp-1 max-w-[420px] hover:text-primary"
                          >
                            {p.page.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      </td>
                      <td className="num py-2.5 px-3 text-right font-medium">
                        {p.clicks.toLocaleString()}
                      </td>
                      <td className="num py-2.5 px-3 text-right text-muted-foreground">
                        {p.impressions.toLocaleString()}
                      </td>
                      <td className="num py-2.5 px-3 text-right text-muted-foreground">
                        {(p.ctr * 100).toFixed(1)}%
                      </td>
                      <td className="num py-2.5 pl-3 text-right">
                        <span
                          className={
                            p.position <= 3
                              ? "text-[var(--lime)]"
                              : p.position <= 10
                                ? "text-foreground"
                                : "text-muted-foreground"
                          }
                        >
                          {p.position.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="mt-12 flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <TrendingUp className="h-3 w-3" /> Real outcomes → self-learning ranker · the long-term
          moat
        </footer>
      </div>
    </AppLayout>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card/80 p-5">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-primary" : ""}`} />
      </div>
      <div className={`mt-3 num text-display text-3xl font-semibold ${accent ? "grad-text" : ""}`}>
        {value}
      </div>
    </div>
  );
}
