import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, Link2, ScanSearch, Zap, Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  scanSiteLinksFn,
  applySiteLinksFn,
  applyOneSiteLinkFn,
  rejectSiteLinkFn,
  siteLinksStatusFn,
  listSiteLinkSuggestionsFn,
} from "@/lib/site-link.functions";

export const Route = createFileRoute("/internal-links")({ component: InternalLinksPage });

function InternalLinksPage() {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const statusFn = useServerFn(siteLinksStatusFn);
  const listFn = useServerFn(listSiteLinkSuggestionsFn);
  const scanFn = useServerFn(scanSiteLinksFn);
  const applyBulkFn = useServerFn(applySiteLinksFn);
  const applyOneFn = useServerFn(applyOneSiteLinkFn);
  const rejectFn = useServerFn(rejectSiteLinkFn);

  const { data: status } = useQuery({
    queryKey: ["site-links-status"],
    queryFn: () => statusFn({}),
  });
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["site-link-suggestions"],
    queryFn: () => listFn({ data: { status: "pending", limit: 200 } }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["site-links-status"] });
    qc.invalidateQueries({ queryKey: ["site-link-suggestions"] });
  };

  const scanMut = useMutation({
    mutationFn: () => scanFn({ data: { maxPages: 30, minScore: 0.12, limit: 300 } }),
    onSuccess: (r) => {
      toast.success(
        `Scanned ${r.sync.synced} pages · found ${r.found} opportunities · saved ${r.saved} new suggestion(s)${
          r.skipped ? ` · ${r.skipped} already suggested` : ""
        }`,
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const applyBulkMut = useMutation({
    mutationFn: () => applyBulkFn({ data: { limit: 10 } }),
    onSuccess: (r) => {
      toast.success(`Applied ${r.applied} link(s) live${r.failed ? ` · ${r.failed} failed` : ""}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = suggestions?.items ?? [];
  const counts = status?.counts ?? {};

  const run = async (id: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(okMsg);
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Link2 className="h-3 w-3 text-primary" />
            Site-wide Auto Internal Linking
          </div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">Internal Links</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Scans the ENTIRE live WordPress site — every post and page, including ones this engine
            never wrote — and proposes natural links between topically related content. Nothing is
            applied automatically unless you turn that on in Autopilot; review and approve here.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <StatusPill ok={!!status?.pluginConfigured} label="WP Plugin" />
            <StatusPill ok={!!status?.pluginOk} label="Plugin reachable" />
            <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-muted-foreground">
              {status?.totalPages ?? 0} pages tracked
            </span>
            <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-muted-foreground">
              {status?.appliedLast24h ?? 0} applied (24h)
            </span>
            <Button
              onClick={() => scanMut.mutate()}
              disabled={scanMut.isPending}
              title="Pull every post/page from WordPress and find fresh link opportunities."
              style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            >
              {scanMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ScanSearch className="mr-2 h-4 w-4" />
              )}
              Scan whole site
            </Button>
            <Button
              variant="outline"
              onClick={() => applyBulkMut.mutate()}
              disabled={applyBulkMut.isPending || rows.length === 0}
              title="Apply the top 10 highest-scoring pending suggestions live."
            >
              {applyBulkMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Apply top 10
            </Button>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Pending" value={counts.pending ?? 0} />
          <Stat label="Applied" value={counts.applied ?? 0} accent />
          <Stat label="Rejected" value={counts.rejected ?? 0} />
          <Stat label="Skipped" value={counts.skipped ?? 0} />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Pending suggestions</h2>
              <p className="text-xs text-muted-foreground">Highest-scoring topical matches first</p>
            </div>
            <span className="text-xs text-muted-foreground">{rows.length} shown</span>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-dashed border-border bg-card/30 px-6 py-10 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/30 px-6 py-10 text-center text-sm text-muted-foreground">
              No pending suggestions. Click &ldquo;Scan whole site&rdquo; to find link opportunities
              across your live content.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card/60">
              <table className="w-full text-sm">
                <thead className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left">From</th>
                    <th className="px-4 py-2.5 text-left">To</th>
                    <th className="px-4 py-2.5 text-left">Anchor</th>
                    <th className="px-4 py-2.5 text-right">Score</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-t border-border/60">
                      <td className="max-w-[220px] px-4 py-3">
                        <div className="line-clamp-1 font-medium">{s.source_title}</div>
                        {s.source_url && (
                          <a
                            href={s.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                          >
                            view <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="max-w-[220px] px-4 py-3">
                        <div className="line-clamp-1 font-medium">{s.target_title}</div>
                        {s.target_url && (
                          <a
                            href={s.target_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                          >
                            view <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="max-w-[200px] px-4 py-3">
                        <div className="line-clamp-1 text-[12px] text-muted-foreground">
                          &ldquo;{s.anchor_text}&rdquo;
                        </div>
                        <div className="text-[10px] text-muted-foreground/70">{s.reason}</div>
                      </td>
                      <td className="num px-4 py-3 text-right font-semibold text-primary">
                        {s.score}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={busyId === s.id}
                            title="Apply this link now"
                            onClick={() =>
                              run(
                                s.id,
                                () => applyOneFn({ data: { suggestionId: s.id } }),
                                "Applied",
                              )
                            }
                          >
                            {busyId === s.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === s.id}
                            title="Reject (won't be re-suggested)"
                            onClick={() =>
                              run(
                                s.id,
                                () => rejectFn({ data: { suggestionId: s.id } }),
                                "Rejected",
                              )
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`num mt-1 text-2xl font-semibold ${accent ? "text-primary" : ""}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${
        ok
          ? "border-[var(--lime)]/30 bg-[var(--lime)]/10 text-[var(--lime)]"
          : "border-border bg-card/60 text-muted-foreground"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-[var(--lime)]" : "bg-muted-foreground"}`}
      />
      {label}
    </span>
  );
}
