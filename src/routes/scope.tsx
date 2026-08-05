import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getScopeFn, saveScopeFn, testScopeFn } from "@/lib/scope.functions";
import { useEffect, useState } from "react";
import { ShieldCheck, ShieldX, Loader2, Check, X, FlaskConical, Save, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/scope")({ component: ScopePage });

const GROUP_LABELS: Record<string, string> = {
  os: "Operating system",
  web_server: "Web servers",
  runtime: "Runtimes",
  framework: "Frameworks",
  database: "Managed databases",
  app_type: "App types",
  tool: "Tools",
};

type Supported = { id: string; label: string; group: string };
type Unsupported = { label: string; why: string };

function ScopePage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getScopeFn);
  const saveFn = useServerFn(saveScopeFn);
  const testFn = useServerFn(testScopeFn);

  const { data, isLoading } = useQuery({ queryKey: ["scope"], queryFn: () => getFn({}) });

  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [allowed, setAllowed] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState<{ label: string; terms: string[]; why: string }[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newTerms, setNewTerms] = useState("");
  const [newWhy, setNewWhy] = useState("");
  const [testKw, setTestKw] = useState("");
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (data?.config) {
      setDisabled(new Set(data.config.disabledSupported ?? []));
      setAllowed(new Set(data.config.allowedUnsupported ?? []));
      setExtra(data.config.extraUnsupported ?? []);
    }
  }, [data?.config?.updatedAt]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { disabledSupported: [...disabled], allowedUnsupported: [...allowed], extraUnsupported: extra } }),
    onSuccess: () => {
      toast.success("Scope saved — applies to all new content");
      qc.invalidateQueries({ queryKey: ["scope"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const test = useMutation({
    mutationFn: () => testFn({ data: { keyword: testKw, geo: "global" } }),
    onSuccess: (r) => setTestResult(r as Record<string, unknown>),
    onError: (e: Error) => toast.error(e.message),
  });

  const supported = (data?.supported ?? []) as Supported[];
  const unsupported = (data?.unsupported ?? []) as Unsupported[];
  const groups = [...new Set(supported.map((s) => s.group))];

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-8 py-8">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Lock className="h-3 w-3 text-primary" /> Capability scope
          </div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">What Kloudbean can (and can't) run</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            This is the hard boundary for every idea and article. Kloudbean is Linux-based managed hosting — it does not run
            Windows Server, IIS, classic .NET, or MSSQL. Toggle what's in scope, and the engine will refuse to generate
            anything outside it.
          </p>
        </header>

        {/* Keyword tester */}
        <section className="mb-8 rounded-xl border border-border bg-card/60 p-5 backdrop-blur">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FlaskConical className="h-4 w-4 text-primary" /> Test a topic against scope
          </h2>
          <div className="flex gap-2">
            <Input
              value={testKw}
              onChange={(e) => setTestKw(e.target.value)}
              placeholder="e.g. deploy nextjs on iis server"
              onKeyDown={(e) => e.key === "Enter" && testKw && test.mutate()}
            />
            <Button disabled={!testKw || test.isPending} onClick={() => test.mutate()}>
              {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
            </Button>
          </div>
          {testResult && (
            <div className={`mt-3 rounded-lg border p-3 text-sm ${testResult.inScope ? "border-[var(--lime)]/40 bg-[var(--lime)]/10" : "border-destructive/40 bg-destructive/10"}`}>
              <div className="flex items-center gap-2 font-medium">
                {testResult.inScope ? <Check className="h-4 w-4 text-[var(--lime)]" /> : <X className="h-4 w-4 text-destructive" />}
                {testResult.inScope ? "In scope" : "Rejected"} · relevance {String(testResult.score)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{String(testResult.reason)}</p>
            </div>
          )}
        </section>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading capability graph…</div>
        ) : (
          <>
            {/* Supported */}
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-[var(--lime)]" /> Supported — click to toggle off
              </h2>
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g}>
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{GROUP_LABELS[g] ?? g}</div>
                    <div className="flex flex-wrap gap-2">
                      {supported.filter((s) => s.group === g).map((s) => {
                        const off = disabled.has(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              const n = new Set(disabled);
                              off ? n.delete(s.id) : n.add(s.id);
                              setDisabled(n);
                            }}
                            className={`rounded-md border px-2.5 py-1 text-xs transition ${
                              off
                                ? "border-border bg-secondary/40 text-muted-foreground line-through"
                                : "border-[var(--lime)]/40 bg-[var(--lime)]/10 text-foreground"
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Unsupported */}
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ShieldX className="h-4 w-4 text-destructive" /> Not supported — blocked everywhere
              </h2>
              <div className="space-y-2">
                {unsupported.map((u) => {
                  const unblocked = allowed.has(u.label);
                  return (
                    <div key={u.label} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card/40 px-3 py-2.5">
                      <div className="min-w-0">
                        <div className={`text-sm font-medium ${unblocked ? "text-muted-foreground line-through" : ""}`}>{u.label}</div>
                        <div className="text-xs text-muted-foreground">{u.why}</div>
                      </div>
                      <button
                        onClick={() => {
                          const n = new Set(allowed);
                          unblocked ? n.delete(u.label) : n.add(u.label);
                          setAllowed(n);
                        }}
                        className={`shrink-0 rounded-md border px-2 py-1 text-[11px] ${
                          unblocked ? "border-amber-500/40 bg-amber-500/10 text-amber-400" : "border-border text-muted-foreground hover:bg-foreground/5"
                        }`}
                      >
                        {unblocked ? "Allowed (override)" : "Allow"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Only click "Allow" if Kloudbean genuinely adds support later. By default these stay blocked.
              </p>
            </section>

            {/* Custom exclusions — user-defined banned tech/topics */}
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ShieldX className="h-4 w-4 text-destructive" /> Your custom exclusions — always blocked
              </h2>
              {extra.length > 0 && (
                <div className="mb-3 space-y-2">
                  {extra.map((c, i) => (
                    <div key={`${c.label}-${i}`} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card/40 px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{c.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.why || "Excluded by you"} · terms: {c.terms.join(", ")}
                        </div>
                      </div>
                      <button
                        onClick={() => setExtra(extra.filter((_, j) => j !== i))}
                        className="shrink-0 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-foreground/5"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (e.g. Kafka)" />
                <Input value={newTerms} onChange={(e) => setNewTerms(e.target.value)} placeholder="Match terms, comma-separated" />
                <Input value={newWhy} onChange={(e) => setNewWhy(e.target.value)} placeholder="Why (optional)" />
                <Button
                  variant="outline"
                  disabled={!newLabel.trim() || !newTerms.trim()}
                  onClick={() => {
                    const terms = newTerms.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
                    if (!newLabel.trim() || !terms.length) return;
                    setExtra([...extra, { label: newLabel.trim(), terms, why: newWhy.trim() || "Excluded by scope settings." }]);
                    setNewLabel("");
                    setNewTerms("");
                    setNewWhy("");
                  }}
                >
                  Add
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Add any tech, product, or topic you never want written about. Matching keywords get rejected by topic discovery and the writer. Click "Save scope" to apply.
              </p>
            </section>

            <Button size="lg" disabled={save.isPending} onClick={() => save.mutate()} style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}>
              {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save scope
            </Button>
          </>
        )}
      </div>
    </AppLayout>
  );
}
