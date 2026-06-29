import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DollarSign, Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  conversionsSummaryFn,
  recordConversionFn,
  syncConversionsFn,
} from "@/lib/conversions.functions";

export const Route = createFileRoute("/conversions")({ component: ConversionsPage });

type Summary = {
  total: number;
  signups: number;
  paid: number;
  value: number;
  currency: string;
  bySource: { source: string; surface: string; signups: number; paid: number; value: number }[];
};
type Conversion = {
  id: string;
  event: string;
  source_slug: string | null;
  surface: string | null;
  plan: string | null;
  value: number | null;
  currency: string | null;
  created_at?: string;
};

const EVENT_LABEL: Record<string, string> = {
  signup: "Signup (free account)",
  paid: "Paid (became a customer)",
  lead: "Lead",
  view: "View",
};

function ConversionsPage() {
  const qc = useQueryClient();
  const summaryFn = useServerFn(conversionsSummaryFn);
  const recordFn = useServerFn(recordConversionFn);
  const syncFn = useServerFn(syncConversionsFn);

  const { data, isLoading } = useQuery({
    queryKey: ["conversions-summary"],
    queryFn: () => summaryFn({ data: { days: 90 } }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["conversions-summary"] });

  const summary = (data?.summary ?? null) as Summary | null;
  const recent = (data?.recent ?? []) as Conversion[];

  // form state
  const [event, setEvent] = useState("signup");
  const [surface, setSurface] = useState("tool");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("");
  const [value, setValue] = useState("");

  const addMut = useMutation({
    mutationFn: () =>
      recordFn({
        data: {
          event: event as "signup" | "paid" | "lead" | "view",
          surface,
          source_slug: slug.trim() || null,
          plan: plan.trim() || null,
          value: value.trim() ? Number(value) : null,
          currency: "USD",
        },
      }),
    onSuccess: () => {
      toast.success("Conversion logged");
      setSlug("");
      setPlan("");
      setValue("");
      invalidate();
    },
    onError: (e) => toast.error(String((e as Error)?.message ?? e)),
  });

  const syncMut = useMutation({
    mutationFn: () => syncFn({}),
    onSuccess: (r) => {
      if (r.error) toast.error(r.error);
      else
        toast.success(
          `Synced from website: ${r.stored} new (${r.signups} signups, ${r.paid} paid)`,
        );
      invalidate();
    },
    onError: (e) => toast.error(String((e as Error)?.message ?? e)),
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <DollarSign className="h-6 w-6" /> Conversions
            </h1>
            <p className="text-sm text-muted-foreground">
              Real signups & customers, attributed to the page that drove them. Log a few by hand to
              see it working, or pull what your website has collected.
            </p>
          </div>
          <Button variant="outline" onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
            {syncMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync from website
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Signups (90d)" value={summary ? String(summary.signups) : "—"} />
          <Stat
            label="Paid customers"
            value={summary ? String(summary.paid) : "—"}
            accent="text-emerald-600"
          />
          <Stat
            label="Attributed value"
            value={summary ? `${summary.value.toLocaleString()} ${summary.currency}` : "—"}
          />
          <Stat label="Total events" value={summary ? String(summary.total) : "—"} />
        </div>

        {/* Manual add form */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-1 text-sm font-medium">Log a conversion by hand</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Use this to test the feature, or to record signups you know came from a page. The “page
            slug” is the last part of the page address — e.g. for kloudbean.com/
            <b>a-b-test-calculator</b>/ the slug is <b>a-b-test-calculator</b>.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="What happened">
              <select
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="signup">Signup (free account)</option>
                <option value="paid">Paid (became a customer)</option>
                <option value="lead">Lead</option>
              </select>
            </Field>
            <Field label="Page type">
              <select
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="tool">Tool page</option>
                <option value="article">Article</option>
              </select>
            </Field>
            <Field label="Page slug">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="a-b-test-calculator"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Plan (optional)">
              <input
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Standard"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Value $ (optional)">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                inputMode="decimal"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <div className="mt-3">
            <Button onClick={() => addMut.mutate()} disabled={addMut.isPending}>
              {addMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Log conversion
            </Button>
          </div>
        </div>

        {/* By source */}
        {summary && summary.bySource.length > 0 && (
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-sm font-medium">Which pages drive conversions</h2>
            <div className="divide-y">
              {summary.bySource.map((s) => (
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
                    {s.value ? ` · ${s.value.toLocaleString()} ${summary.currency}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent */}
        <div className="rounded-lg border">
          <div className="border-b px-4 py-3 text-sm font-medium">Recent conversions</div>
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nothing yet. Log one above, or click “Sync from website”.
            </div>
          ) : (
            <div className="divide-y">
              {recent.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-4 px-4 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    <span
                      className={`mr-2 rounded px-1.5 py-0.5 text-[10px] ${
                        c.event === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {EVENT_LABEL[c.event] ?? c.event}
                    </span>
                    {c.surface ? `${c.surface} · ` : ""}
                    {c.source_slug ?? "unknown page"}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.value ? `${c.value.toLocaleString()} ${c.currency ?? "USD"}` : ""}
                    {c.plan ? ` · ${c.plan}` : ""}
                  </span>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
