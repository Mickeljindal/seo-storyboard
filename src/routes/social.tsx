import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Share2, Loader2, Plus, Trash2, Send, CalendarClock, FileEdit, CheckCircle2,
  XCircle, Radio, Zap, Link2, Wand2, PenLine, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  listSocialChannelsFn, saveSocialChannelFn, deleteSocialChannelFn, testSocialChannelFn,
  createSocialPostFn, listSocialPostsFn, publishSocialPostNowFn, cancelSocialPostFn, deleteSocialPostFn,
  listSourceArticlesFn, generateSocialFromSourceFn, getSocialProviderFieldsFn,
} from "@/lib/social.functions";

type ProviderField = { tokenLabel: string; tokenHelp: string; meta: { key: string; label: string; placeholder?: string; help?: string }[]; note?: string };

export const Route = createFileRoute("/social")({ component: SocialPublisher });

const PLATFORMS = ["linkedin", "x", "facebook", "instagram", "threads", "mastodon", "webhook"] as const;

function SocialPublisher() {
  const qc = useQueryClient();
  const listChannels = useServerFn(listSocialChannelsFn);
  const saveChannel = useServerFn(saveSocialChannelFn);
  const delChannel = useServerFn(deleteSocialChannelFn);
  const testChannel = useServerFn(testSocialChannelFn);
  const createPost = useServerFn(createSocialPostFn);
  const listPosts = useServerFn(listSocialPostsFn);
  const publishNow = useServerFn(publishSocialPostNowFn);
  const cancelPost = useServerFn(cancelSocialPostFn);
  const delPost = useServerFn(deleteSocialPostFn);
  const listSources = useServerFn(listSourceArticlesFn);
  const genFromSource = useServerFn(generateSocialFromSourceFn);

  const { data: channelsData, refetch: refetchChannels } = useQuery({
    queryKey: ["social-channels"],
    queryFn: () => listChannels({}),
  });
  const { data: postsData, refetch: refetchPosts } = useQuery({
    queryKey: ["social-posts"],
    queryFn: () => listPosts({}),
    refetchInterval: 8000,
  });

  const channels = channelsData?.channels ?? [];
  const armed = channelsData?.armed ?? false;

  // --- add-channel form ---
  const providerFields = useServerFn(getSocialProviderFieldsFn);
  const { data: fieldsData } = useQuery({ queryKey: ["social-fields"], queryFn: () => providerFields({}) });
  const fields = (fieldsData?.fields ?? {}) as Record<string, ProviderField>;

  const [ch, setCh] = useState<{
    platform: string; label: string; mode: "api" | "webhook"; webhookUrl: string; apiToken: string; meta: Record<string, string>; persona: string;
  }>({ platform: "linkedin", label: "", mode: "api", webhookUrl: "", apiToken: "", meta: {}, persona: "" });

  const resetCh = () => setCh({ platform: "linkedin", label: "", mode: "api", webhookUrl: "", apiToken: "", meta: {}, persona: "" });
  const effMode: "api" | "webhook" = ch.platform === "webhook" ? "webhook" : ch.mode;
  const pf = fields[ch.platform];

  const addCh = useMutation({
    mutationFn: () =>
      saveChannel({
        data: {
          platform: ch.platform as (typeof PLATFORMS)[number],
          label: ch.label || ch.platform,
          mode: effMode,
          webhookUrl: effMode === "webhook" ? ch.webhookUrl : "",
          apiToken: effMode === "api" ? ch.apiToken : "",
          meta: effMode === "api" ? ch.meta : undefined,
          persona: ch.persona || "",
          enabled: true,
        },
      }),
    onSuccess: () => { toast.success("Channel connected"); resetCh(); refetchChannels(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const canConnect = effMode === "webhook" ? !!ch.webhookUrl : !!ch.apiToken;
  const removeCh = useMutation({
    mutationFn: (id: string) => delChannel({ data: { id } }),
    onSuccess: () => { refetchChannels(); qc.invalidateQueries({ queryKey: ["social-posts"] }); },
  });
  const pingCh = useMutation({
    mutationFn: (id: string) => testChannel({ data: { id } }),
    onSuccess: (r: { ok: boolean; dryRun?: boolean; error?: string }) => {
      if (r.ok) toast.success("Test sent");
      else if (r.dryRun) toast.message("Dry-run: not armed, so nothing was actually sent");
      else toast.error(r.error ?? "Test failed");
      refetchChannels();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- composer ---
  const [mode, setMode] = useState<"manual" | "content">("content");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [when, setWhen] = useState(""); // datetime-local
  const [sourceId, setSourceId] = useState("");
  const [sourceTopic, setSourceTopic] = useState("");
  const [stagger, setStagger] = useState(0);

  const { data: sourcesData } = useQuery({ queryKey: ["social-sources"], queryFn: () => listSources({}) });
  const sources = sourcesData?.articles ?? [];

  const toggle = (id: string) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () => setSelected(new Set(channels.map((c) => c.id)));

  const generate = useMutation({
    mutationFn: (m: "draft" | "schedule" | "post") =>
      genFromSource({
        data: {
          articleId: sourceId || undefined,
          topic: sourceId ? undefined : sourceTopic || undefined,
          channelIds: [...selected],
          mode: m,
          at: m === "schedule" && when ? new Date(when).toISOString() : undefined,
          staggerMinutes: stagger,
        },
      }),
    onSuccess: (r: { ok: boolean; created: number; published?: number; error?: string }) => {
      if (r.ok) {
        toast.success(r.published ? `Posted to ${r.published}/${r.created} channels` : `Generated ${r.created} platform-tailored post(s)`);
        refetchPosts();
      } else toast.error(r.error ?? "Could not generate");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const canGenerate = (!!sourceId || sourceTopic.trim().length > 0) && selected.size > 0;

  // Default to "everywhere": select all connected channels once they load.
  const [didInit, setDidInit] = useState(false);
  useEffect(() => {
    if (!didInit && channels.length) { setSelected(new Set(channels.map((c) => c.id))); setDidInit(true); }
  }, [channels, didInit]);

  const submitPost = useMutation({
    mutationFn: (mode: "now" | "schedule" | "draft") => {
      const channelIds = [...selected];
      const scheduledAt = mode === "schedule" && when ? new Date(when).toISOString() : undefined;
      return createPost({ data: { body, link: link || undefined, channelIds, scheduledAt, publishNow: mode === "now" } });
    },
    onSuccess: (r: { status: string }) => {
      toast.success(r.status === "publishing" || r.status === "posted" ? "Publishing now" : r.status === "scheduled" ? "Scheduled" : "Saved as draft");
      setBody(""); setLink(""); setWhen("");
      refetchPosts();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doPublishNow = useMutation({ mutationFn: (id: string) => publishNow({ data: { id } }), onSuccess: () => refetchPosts(), onError: (e: Error) => toast.error(e.message) });
  const doCancel = useMutation({ mutationFn: (id: string) => cancelPost({ data: { id } }), onSuccess: () => refetchPosts() });
  const doDelete = useMutation({ mutationFn: (id: string) => delPost({ data: { id } }), onSuccess: () => refetchPosts() });

  const canPost = body.trim().length > 0 && selected.size > 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1100px] px-8 py-8">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Share2 className="h-3 w-3 text-primary" /> Social Publishing
          </div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">One prompt. Posted everywhere.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Connect any number of accounts (CEO, employees, company — each with its own voice), then just give a
            prompt or a blog idea. The engine writes a distinct, genuinely useful post for every account, grounded
            in Kloudbean's real facts, and posts or schedules it to all of them. Dry-run until you arm live sending.
          </p>
          <div className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${armed ? "border-[var(--lime)]/40 bg-[var(--lime)]/10 text-[var(--lime)]" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
            <Radio className="h-3.5 w-3.5" />
            {armed ? "Live sending is ARMED — posts will actually publish." : "Dry-run — set SOCIAL_AUTOPOST_ENABLED=1 to publish for real."}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Channels */}
          <section className="rounded-xl border border-border bg-card/40 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Link2 className="h-4 w-4 text-primary" /> Connected channels</h2>

            <div className="space-y-2">
              {channels.length === 0 && <p className="text-xs text-muted-foreground">No channels yet. Add one below.</p>}
              {channels.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2.5">
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">{c.platform}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{c.label}{c.persona ? <span className="ml-1 text-[10px] text-muted-foreground">· {c.persona}</span> : null}</span>
                  {c.lastError ? <span title={c.lastError}><XCircle className="h-3.5 w-3.5 text-red-400" /></span>
                    : c.lastOkAt ? <CheckCircle2 className="h-3.5 w-3.5 text-[var(--lime)]" /> : null}
                  <span className="text-[10px] text-muted-foreground">{c.hasWebhook ? "webhook" : "no URL"}</span>
                  <button onClick={() => pingCh.mutate(c.id)} disabled={pingCh.isPending} className="rounded p-1 text-muted-foreground hover:text-primary" title="Send test">
                    <Zap className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => removeCh.mutate(c.id)} className="rounded p-1 text-muted-foreground hover:text-red-400" title="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <details className="mt-4 rounded-lg border border-border bg-background/40 p-3 text-xs">
              <summary className="flex cursor-pointer items-center gap-1.5 font-medium text-foreground/90">
                <HelpCircle className="h-3.5 w-3.5 text-primary" /> How to connect an account
              </summary>
              <div className="mt-2 space-y-2 text-muted-foreground">
                <p>Direct integration: connect each account with its own <b>access token</b> and post straight to the platform's API. To get a token you register an app once per platform and run its OAuth:</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li><b>Mastodon</b> (easiest): your instance → Preferences → Development → New application, scope <code className="rounded bg-secondary px-1">write:statuses</code>. Paste the token + instance URL.</li>
                  <li><b>X</b>: developer.x.com → app with OAuth 2.0, scope <code className="rounded bg-secondary px-1">tweet.write</code>. Paste the user access token.</li>
                  <li><b>LinkedIn</b>: developer.linkedin.com → app, scope <code className="rounded bg-secondary px-1">w_member_social</code>. Paste the token + your author URN.</li>
                  <li><b>Facebook / Instagram / Threads</b>: Meta app + long-lived token; paste the token and the page/IG/Threads ID.</li>
                </ul>
                <p>Tokens are stored on the server for this workspace. Meta, LinkedIn, and X require posting-scope app review before they'll accept live posts.</p>
              </div>
            </details>

            <div className="mt-4 space-y-2 rounded-lg border border-dashed border-border p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Connect a channel</div>
              <div className="flex gap-2">
                <select value={ch.platform} onChange={(e) => setCh({ ...ch, platform: e.target.value, meta: {}, apiToken: "" })}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm">
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input value={ch.label} onChange={(e) => setCh({ ...ch, label: e.target.value })} placeholder="Label (e.g. Kloudbean LinkedIn)"
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
              </div>

              {ch.platform !== "webhook" && (
                <div className="flex items-center gap-1 rounded-md border border-border bg-background/50 p-0.5 text-[11px]">
                  <button onClick={() => setCh({ ...ch, mode: "api" })} className={`flex-1 rounded px-2 py-1 ${effMode === "api" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>Direct API</button>
                  <button onClick={() => setCh({ ...ch, mode: "webhook" })} className={`flex-1 rounded px-2 py-1 ${effMode === "webhook" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>Webhook (advanced)</button>
                </div>
              )}

              {effMode === "api" ? (
                <>
                  {pf?.meta.map((f) => (
                    <input key={f.key} value={ch.meta[f.key] ?? ""} placeholder={f.label + (f.placeholder ? ` — ${f.placeholder}` : "")}
                      onChange={(e) => setCh({ ...ch, meta: { ...ch.meta, [f.key]: e.target.value } })}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                  ))}
                  <input type="password" value={ch.apiToken} onChange={(e) => setCh({ ...ch, apiToken: e.target.value })}
                    placeholder={pf?.tokenLabel || "Access token"}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                  {pf?.tokenHelp && <p className="text-[10px] leading-relaxed text-muted-foreground">{pf.tokenHelp}</p>}
                  {pf?.note && <p className="text-[10px] leading-relaxed text-amber-400/90">{pf.note}</p>}
                </>
              ) : (
                <input value={ch.webhookUrl} onChange={(e) => setCh({ ...ch, webhookUrl: e.target.value })}
                  placeholder="Webhook URL"
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
              )}

              <input value={ch.persona} onChange={(e) => setCh({ ...ch, persona: e.target.value })}
                placeholder="Voice / persona (optional) — e.g. CEO, founder POV, first person"
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />

              <Button size="sm" disabled={!canConnect || addCh.isPending} onClick={() => addCh.mutate()}>
                {addCh.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Connect channel
              </Button>
            </div>
          </section>

          {/* Composer */}
          <section className="rounded-xl border border-border bg-card/40 p-5">
            <div className="mb-3 flex items-center gap-1 rounded-lg border border-border bg-background/50 p-1 text-xs">
              <button onClick={() => setMode("content")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${mode === "content" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                <Wand2 className="h-3.5 w-3.5" /> From a blog idea
              </button>
              <button onClick={() => setMode("manual")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${mode === "manual" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                <PenLine className="h-3.5 w-3.5" /> Write manually
              </button>
            </div>

            {/* shared: channel selection */}
            <div className="mb-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Publish to</span>
                {channels.length > 0 && (
                  <button onClick={selectAll} className="text-[10px] text-primary hover:underline">select all</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {channels.length === 0 && <span className="text-xs text-muted-foreground">Connect a channel first.</span>}
                {channels.map((c) => (
                  <button key={c.id} onClick={() => toggle(c.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${selected.has(c.id) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "content" ? (
              <>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Source: a blog idea / article</div>
                <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm">
                  <option value="">— pick an article / idea —</option>
                  {sources.map((s) => <option key={s.id} value={s.id}>{s.status === "published" ? "● " : "○ "}{s.title}</option>)}
                </select>
                <div className="my-2 text-center text-[10px] uppercase tracking-wide text-muted-foreground">or a topic</div>
                <input value={sourceTopic} onChange={(e) => setSourceTopic(e.target.value)} disabled={!!sourceId}
                  placeholder="e.g. why managed Postgres beats DIY"
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm disabled:opacity-50" />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                  <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    stagger
                    <input type="number" min={0} value={stagger} onChange={(e) => setStagger(Number(e.target.value) || 0)}
                      className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm" /> min apart
                  </label>
                </div>

                <p className="mt-2 text-[11px] text-muted-foreground">
                  One tailored post is written per selected channel, in that platform's voice, then dropped into the queue to review.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={!canGenerate || generate.isPending} onClick={() => generate.mutate("post")}>
                    {generate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Post to all now
                  </Button>
                  <Button size="sm" variant="outline" disabled={!canGenerate || !when || generate.isPending} onClick={() => generate.mutate("schedule")}>
                    <CalendarClock className="mr-2 h-4 w-4" /> Schedule to all
                  </Button>
                  <Button size="sm" variant="ghost" disabled={!canGenerate || generate.isPending} onClick={() => generate.mutate("draft")}>
                    <Wand2 className="mr-2 h-4 w-4" /> Generate drafts
                  </Button>
                </div>
              </>
            ) : (
              <>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="What do you want to post? (same text to every selected channel)"
                  className="w-full resize-none rounded-lg border border-border bg-background/60 p-3 text-sm outline-none focus:border-primary/50" />
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional)"
                  className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                <div className="mt-3 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                  <span className="text-[11px] text-muted-foreground">set a time to schedule</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" disabled={!canPost || submitPost.isPending} onClick={() => submitPost.mutate("now")}>
                    {submitPost.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Publish now
                  </Button>
                  <Button size="sm" variant="outline" disabled={!canPost || !when || submitPost.isPending} onClick={() => submitPost.mutate("schedule")}>
                    <CalendarClock className="mr-2 h-4 w-4" /> Schedule
                  </Button>
                  <Button size="sm" variant="ghost" disabled={!canPost || submitPost.isPending} onClick={() => submitPost.mutate("draft")}>
                    <FileEdit className="mr-2 h-4 w-4" /> Save draft
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>

        {/* Queue & history */}
        <section className="mt-6 rounded-xl border border-border bg-card/40 p-5">
          <h2 className="mb-3 text-sm font-semibold">Queue &amp; history</h2>
          <div className="space-y-2">
            {(postsData?.posts ?? []).length === 0 && <p className="text-xs text-muted-foreground">Nothing yet.</p>}
            {(postsData?.posts ?? []).map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-background/50 p-3">
                <div className="flex items-start gap-3">
                  <StatusPill status={p.status} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm">{p.body}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{p.channelIds.length} channel(s)</span>
                      {p.scheduledAt && <span>· scheduled {new Date(p.scheduledAt).toLocaleString()}</span>}
                      {p.postedAt && <span>· posted {new Date(p.postedAt).toLocaleString()}</span>}
                      {p.results?.some((r) => r.dryRun) && <span className="text-amber-400">· dry-run</span>}
                    </div>
                    {p.results && p.results.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.results.map((r, i) => (
                          <span key={i} className={`rounded px-1.5 py-0.5 text-[10px] ${r.ok && !r.dryRun ? "bg-[var(--lime)]/15 text-[var(--lime)]" : r.dryRun ? "bg-amber-500/15 text-amber-300" : r.skipped ? "bg-secondary text-muted-foreground" : "bg-red-500/15 text-red-400"}`}
                            title={r.error ?? ""}>
                            {r.platform ?? r.label}{r.ok && !r.dryRun ? " ✓" : r.dryRun ? " (dry)" : r.skipped ? " (skip)" : " ✕"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {p.status !== "posted" && p.status !== "canceled" && (
                      <button onClick={() => doPublishNow.mutate(p.id)} className="rounded p-1 text-muted-foreground hover:text-primary" title="Publish now"><Send className="h-3.5 w-3.5" /></button>
                    )}
                    {p.status === "scheduled" && (
                      <button onClick={() => doCancel.mutate(p.id)} className="rounded p-1 text-muted-foreground hover:text-amber-400" title="Cancel"><XCircle className="h-3.5 w-3.5" /></button>
                    )}
                    <button onClick={() => doDelete.mutate(p.id)} className="rounded p-1 text-muted-foreground hover:text-red-400" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-secondary text-muted-foreground",
    scheduled: "bg-primary/15 text-primary",
    publishing: "bg-amber-500/15 text-amber-300",
    posted: "bg-[var(--lime)]/15 text-[var(--lime)]",
    partial: "bg-amber-500/15 text-amber-300",
    failed: "bg-red-500/15 text-red-400",
    canceled: "bg-secondary text-muted-foreground",
  };
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[status] ?? "bg-secondary"}`}>{status}</span>;
}
