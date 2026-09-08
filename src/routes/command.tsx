import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Loader2, Wand2, Play, FileText, Share2, Clapperboard, Image as ImageIcon,
  CheckCircle2, XCircle, AlertTriangle, Terminal, Send, Mail, Radio,
} from "lucide-react";
import { toast } from "sonner";
import {
  planMarketingCommandFn, runMarketingCommandFn, marketingRunStatusFn, recentCommandsFn,
  commandChannelsStatusFn,
} from "@/lib/marketing-command.functions";

export const Route = createFileRoute("/command")({ component: CommandConsole });

type StepType = "create_article" | "generate_social" | "generate_video" | "hero_image" | "post_social" | "send_email";
type PlanStep = {
  type: StepType;
  title: string; topic: string; keyword?: string; count?: number; channel?: string; geo?: string;
};
type Plan = { summary: string; steps: PlanStep[]; outOfScope: { request: string; reason: string }[] };

const ACTING: StepType[] = ["post_social", "send_email"];

const EXAMPLES = [
  "Write an article on managed PostgreSQL hosting",
  "Create a comparison guide: Kloudbean vs Cloudways",
  "Make 4 LinkedIn posts about our Flexible Load Balancer",
  "Write a Saudi data-residency guide, then post it on LinkedIn and email our list",
];

const STEP_META: Record<StepType, { icon: any; label: string; tint: string }> = {
  create_article: { icon: FileText, label: "Article", tint: "text-[var(--cyan)]" },
  generate_social: { icon: Share2, label: "Social draft", tint: "text-[var(--lime)]" },
  generate_video: { icon: Clapperboard, label: "Video", tint: "text-primary" },
  hero_image: { icon: ImageIcon, label: "Image", tint: "text-[var(--violet-soft,#8b5cff)]" },
  post_social: { icon: Send, label: "Post live", tint: "text-amber-400" },
  send_email: { icon: Mail, label: "Email send", tint: "text-amber-400" },
};

function CommandConsole() {
  const planFn = useServerFn(planMarketingCommandFn);
  const runFn = useServerFn(runMarketingCommandFn);
  const statusFn = useServerFn(marketingRunStatusFn);
  const recentFn = useServerFn(recentCommandsFn);

  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [run, setRun] = useState<{ runId: string; batchId: string } | null>(null);

  const planM = useMutation({
    mutationFn: () => planFn({ data: { prompt } }),
    onSuccess: (r: { plan: Plan }) => setPlan(r.plan),
    onError: (e: Error) => toast.error(e.message),
  });

  const runM = useMutation({
    mutationFn: () => runFn({ data: { prompt, plan: plan ?? undefined } }),
    onSuccess: (r: { ok: boolean; runId?: string; batchId?: string; error?: string; plan: Plan }) => {
      setPlan(r.plan);
      if (r.ok && r.runId && r.batchId) {
        setRun({ runId: r.runId, batchId: r.batchId });
        toast.success(`Running ${r.plan.steps.length} step(s). Watch the activity below.`);
      } else {
        toast.error(r.error ?? "Nothing to run.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: status } = useQuery({
    queryKey: ["mc-status", run?.runId],
    enabled: !!run,
    refetchInterval: (q) => {
      const s = (q.state.data as { status?: string } | undefined)?.status;
      return s === "done" || s === "error" ? false : 2000;
    },
    queryFn: () => statusFn({ data: { runId: run!.runId, batchId: run!.batchId } }),
  });

  const { data: recent } = useQuery({
    queryKey: ["mc-recent", run?.runId, status?.status],
    queryFn: () => recentFn({}),
  });

  const { data: channels } = useQuery({
    queryKey: ["mc-channels"],
    queryFn: () => commandChannelsStatusFn({}),
  });

  const planHasActing = !!plan?.steps.some((s) => ACTING.includes(s.type));

  const progress = status?.progress;
  const pct = progress && progress.total ? Math.round(((progress.done + progress.error) / progress.total) * 100) : 0;
  const running = !!run && status?.status !== "done" && status?.status !== "error";

  const submit = (p?: string) => {
    const text = (p ?? prompt).trim();
    if (!text) return;
    if (p) setPrompt(p);
    setPlan(null);
    setRun(null);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1000px] px-8 py-8">
        <header className="mb-7">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Marketing Command
          </div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">Describe it. The engine does it.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Type a marketing request in plain English. The engine plans it, grounds it in Kloudbean's real
            facts, and runs it across content, social, and visuals. Nothing publishes on its own, articles land
            in the review queue for your approval.
          </p>
        </header>

        {/* Prompt box */}
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Write an article on managed PostgreSQL hosting and make 4 LinkedIn posts about it"
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background/60 p-3 text-sm outline-none focus:border-primary/50"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={!prompt.trim() || planM.isPending} onClick={() => { submit(); planM.mutate(); }}>
              {planM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Preview plan
            </Button>
            <Button size="sm" variant="outline" disabled={!prompt.trim() || runM.isPending}
              onClick={() => { submit(); runM.mutate(); }}>
              {runM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Plan &amp; run
            </Button>
            <span className="text-[11px] text-muted-foreground">or try:</span>
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => submit(ex)}
                className="rounded-full border border-border bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Channel arming status */}
        {channels && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Send className="h-3 w-3" /> Social auto-post:
              <b className={channels.social?.armed ? "text-[var(--lime)]" : "text-amber-400"}>
                {channels.social?.armed ? "armed" : "dry-run"}
              </b>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Email send:
              <b className={channels.email?.armed ? "text-[var(--lime)]" : "text-amber-400"}>
                {channels.email?.armed ? "armed" : "dry-run"}
              </b>
              {channels.email?.recipients ? <span className="text-muted-foreground">· {channels.email.recipients} recipient(s)</span> : null}
            </span>
            <span className="text-muted-foreground/70">Arm live sending with env switches (see docs).</span>
          </div>
        )}

        {/* Plan preview */}
        {plan && (
          <section className="mt-6 rounded-xl border border-border bg-card/40 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">The plan</div>
                <p className="mt-1 text-sm">{plan.summary}</p>
              </div>
              {!run && plan.steps.length > 0 && (
                <Button size="sm" disabled={runM.isPending} onClick={() => runM.mutate()}>
                  {runM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Run it
                </Button>
              )}
            </div>

            {planHasActing && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                <Radio className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="text-amber-100/90">
                  This plan includes steps that can transmit publicly (post / email).{" "}
                  {channels ? (
                    <>
                      Social auto-post is <b>{channels.social?.armed ? "ARMED (will post live)" : "OFF (dry-run)"}</b>;
                      email send is <b>{channels.email?.armed ? "ARMED (will send live)" : "OFF (dry-run)"}</b>.
                    </>
                  ) : (
                    <>They run in dry-run until you arm the switches.</>
                  )}{" "}
                  {!(channels?.social?.armed && channels?.email?.armed) && (
                    <span className="text-amber-200/80">Nothing goes out while off — steps simulate and log a preview.</span>
                  )}
                </div>
              </div>
            )}

            {plan.steps.length > 0 ? (
              <ol className="space-y-2">
                {plan.steps.map((s, i) => {
                  const m = STEP_META[s.type];
                  const Icon = m.icon;
                  const acting = ACTING.includes(s.type);
                  return (
                    <li key={i} className={`flex items-center gap-3 rounded-lg border p-3 ${acting ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-background/50"}`}>
                      <span className="num text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <Icon className={`h-4 w-4 shrink-0 ${m.tint}`} />
                      <span className="flex-1 text-sm">{s.title}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${acting ? "border-amber-500/40 text-amber-300" : "border-border text-muted-foreground"}`}>
                        {m.label}{s.channel ? ` · ${s.channel}` : ""}{s.count ? ` ×${s.count}` : ""}{s.geo ? ` · ${s.geo}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground">No runnable steps for this request.</p>
            )}

            {plan.outOfScope.length > 0 && (
              <div className="mt-4 rounded-lg border border-[var(--line-2,rgba(255,255,255,.14))] bg-[rgba(255,168,60,.06)] p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#ffd8a6]">
                  <AlertTriangle className="h-3.5 w-3.5" /> Outside this engine
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {plan.outOfScope.map((o, i) => (
                    <li key={i}><span className="text-foreground">{o.request}</span> — {o.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Live run */}
        {run && (
          <section className="mt-6 rounded-xl border border-border bg-card/40 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Terminal className="h-4 w-4 text-primary" /> Activity
              </h2>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                status?.status === "done" ? "bg-[var(--lime)]/15 text-[var(--lime)]"
                : status?.status === "error" ? "bg-red-500/15 text-red-400"
                : "bg-secondary text-muted-foreground"}`}>
                {running ? <Loader2 className="h-3 w-3 animate-spin" /> : status?.status === "error" ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {running ? "Running" : status?.status === "error" ? "Finished with errors" : "Done"}
              </span>
            </div>

            {progress && (
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>{progress.done} done{progress.error ? ` · ${progress.error} failed` : ""} of {progress.total}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary/40">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border bg-background/40 p-3">
              {(status?.logs ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Queued, work will start in a moment…</p>
              ) : (
                (status?.logs ?? []).slice().reverse().map((l: { at: string; level: string; message: string }, i: number) => (
                  <div key={i} className="flex gap-2 text-[12px]">
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{(l.at ?? "").slice(11, 19)}</span>
                    <span className={l.level === "success" ? "text-[var(--lime)]" : l.level === "error" ? "text-red-400" : "text-foreground/80"}>
                      {l.message}
                    </span>
                  </div>
                ))
              )}
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              Articles appear in the <a href="/publish-queue" className="text-primary hover:underline">Publish Queue</a> for approval.
              Social and video drafts are on <a href="/studio" className="text-primary hover:underline">Media Studio</a>.
            </p>
          </section>
        )}

        {/* Recent commands */}
        {recent?.runs && recent.runs.length > 0 && (
          <section className="mt-8">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Recent commands</div>
            <div className="space-y-1.5">
              {recent.runs.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2 text-xs">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.status === "done" ? "bg-[var(--lime)]" : r.status === "error" ? "bg-red-400" : "bg-primary"}`} />
                  <span className="flex-1 truncate">{r.label}</span>
                  <span className="num text-muted-foreground">{r.completed}/{r.total}</span>
                  <span className="text-muted-foreground">{r.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
