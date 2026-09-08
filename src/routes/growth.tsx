import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Flame,
  Loader2,
  MessageSquare,
  Users,
  Send,
  ExternalLink,
  Copy,
  Check,
  X,
  Mail,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Link2,
  BarChart3,
  Search,
  Pencil,
  Inbox,
  Play,
  Pause,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  crawlTrendsFn,
  listTrendsFn,
  updateTrendFn,
  crawlRedditFn,
  listRedditOpportunitiesFn,
  draftRedditReplyFn,
  updateRedditOpportunityFn,
  crawlCommunitiesFn,
  listVenuesFn,
  updateVenueFn,
  listChannelsFn,
  listBroadcastsFn,
  listProspectsFn,
  planVenuePostsFn,
  planTrendActionFn,
  runGrowthNowFn,
  growthStatusFn,
  linkPipelineFn,
  listLinkProspectsFn,
  getLinkPitchFn,
  listRepliesFn,
  markReplyHandledFn,
  rejectLinkProspectFn,
  runLinkPipelineNowFn,
  previewOutreachSendFn,
  linkWorkspaceFn,
  linkProspectDetailFn,
  saveLinkPitchFn,
  updateLinkContactFn,
  setLinkPitchStateFn,
  bulkLinkPitchStateFn,
  sendOneLinkPitchFn,
  addLinkNoteFn,
  setLinkStageFn,
  setLinkCampaignFn,
  verifyOneLinkFn,
  runLinkVerificationNowFn,
  listRecipesFn,
  runRecipeFn,
  inboxPoolFn,
  syncInboxesFn,
  addInboxFn,
  setInboxStatusFn,
  updateInboxFn,
  reassignInboxFn,
} from "@/lib/gtm.functions";

export const Route = createFileRoute("/growth")({ component: GrowthPage });

/**
 * GROWTH — the page for everything that happens after an article is written:
 * what is trending, which conversations to join, where to post, and how a
 * published piece gets distributed.
 *
 * Read and draft actions are one click. Nothing on this page posts to a community
 * or sends an email: those stay deliberate manual steps, which is why every action
 * here ends in a draft plus a copy button rather than a "publish" button.
 */

const CLUSTER_SHORT: Record<number, string> = {
  1: "Deploy AI Apps",
  2: "Self-host",
  3: "Deploy Stacks",
  4: "vs Competitors",
  5: "Agencies",
  6: "WordPress",
  7: "Data",
  8: "Pricing",
  9: "Security/Scale",
  10: "Enterprise",
};

function heatColor(heat: number): string {
  if (heat >= 50) return "#ef4444";
  if (heat >= 35) return "#f97316";
  if (heat >= 25) return "#eab308";
  return "#94a3b8";
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Clipboard is blocked in some browser contexts; a visible failure is
          // better than a button that silently does nothing.
          toast.error("Could not copy. Select the text and copy manually.");
          return;
        }
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
      {done ? "Copied" : label}
    </Button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

/**
 * A labelled list used for the why / how / what panels. The reasoning is shown
 * openly on purpose: a score nobody can interrogate is a score nobody should act
 * on, so every number here is accompanied by the words that produced it.
 */
function ReasonList({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "warn";
}) {
  if (!items.length) return null;
  return (
    <div>
      <div
        className={`mb-1.5 text-xs font-semibold uppercase tracking-wide ${
          tone === "warn" ? "text-amber-600" : "text-muted-foreground"
        }`}
      >
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="mt-[3px] text-muted-foreground">
              {tone === "warn" ? "!" : `${i + 1}.`}
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Why a trend surfaced, what to write, and where the finished piece goes. */
function TrendPlanPanel({ id }: { id: string }) {
  const planFn = useServerFn(planTrendActionFn);
  const { data, isLoading } = useQuery({
    queryKey: ["gtm-trend-plan", id],
    queryFn: () => planFn({ data: { id } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Working it out…</p>;
  const plan = data?.plan;
  if (!plan) return null;

  return (
    <div className="space-y-4 rounded-md border bg-muted/30 p-3">
      <ReasonList title="Why we picked this" items={plan.whyChosen} />
      <ReasonList title="What to write" items={plan.whatToWrite} />
      {plan.updateInstead.length > 0 && (
        <ReasonList
          title="We already have this. Update it instead"
          items={plan.updateInstead.map((s) => `${s} — add what changed.`)}
          tone="warn"
        />
      )}
      <ReasonList title="Where to post it after" items={plan.whereToPost} />
    </div>
  );
}

/** Why a community was chosen, how we may post there, and what we can post. */
function VenuePlanPanel({ id }: { id: string }) {
  const planFn = useServerFn(planVenuePostsFn);
  const { data, isLoading } = useQuery({
    queryKey: ["gtm-venue-plan", id],
    queryFn: () => planFn({ data: { id } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Reading the rules…</p>;
  const plan = data?.plan;
  if (!plan) return null;

  return (
    <div className="space-y-4 rounded-md border bg-muted/30 p-3">
      {plan.caveat && (
        <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
          <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
          {plan.caveat}
        </div>
      )}

      <ReasonList title="Why we picked this group" items={plan.whyChosen} />
      <ReasonList title="Rules here" items={plan.howToPost} />

      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Copy and paste one of these ({plan.whatToPost.length} found)
        </div>
        {plan.whatToPost.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None of our articles match this group closely. Answer questions here in your own words
            instead of forcing a link.
          </p>
        ) : (
          <div className="space-y-2">
            {plan.whatToPost.map((c) => (
              <div key={c.slug} className="rounded border bg-background p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{c.title}</span>
                  {c.linkFree ? (
                    <Badge variant="destructive">no link version</Badge>
                  ) : (
                    <Badge variant="outline">link allowed</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.reason}</p>
                <Textarea readOnly value={c.draft} className="mt-2 min-h-[110px] text-xs" />
                <div className="mt-2 flex gap-2">
                  <CopyButton text={c.draft} label="Copy post" />
                  <a href={c.url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Read article
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Trends */

function TrendsTab() {
  const crawl = useServerFn(crawlTrendsFn);
  const list = useServerFn(listTrendsFn);
  const update = useServerFn(updateTrendFn);
  const [openPlan, setOpenPlan] = useState<string | null>(null);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["gtm-trends"],
    queryFn: () => list({ data: { status: "new", limit: 40, freshHours: 96 } }),
  });

  const crawlMut = useMutation({
    mutationFn: () => crawl({ data: { minHeat: 22 } }),
    onSuccess: (r) => {
      toast.success(
        `Checked ${r.fetched} items. Kept ${r.stored} in our lane, dropped ${r.rejectedOffTopic} as off-topic.`,
      );
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "shortlisted" | "skipped" }) =>
      update({ data: { id: v.id, status: v.status } }),
    onSuccess: () => refetch(),
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Hot topics right now on Hacker News, DEV.to, Lobsters, GitHub and Reddit. Only topics we
          can write about honestly are kept. Popular but unrelated topics are dropped.
        </p>
        <Button onClick={() => crawlMut.mutate()} disabled={crawlMut.isPending}>
          {crawlMut.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Flame className="mr-2 h-4 w-4" />
          )}
          Find trends now
        </Button>
      </div>

      {isLoading ? (
        <EmptyState text="Loading…" />
      ) : items.length === 0 ? (
        <EmptyState text="Nothing in our lane is hot right now. That is a real answer: a marginal take on an unrelated trend costs more authority than it gains. Click Find trends now to check again." />
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded px-2 py-0.5 text-xs font-bold text-white"
                    style={{ background: heatColor(t.heat) }}
                  >
                    heat {Math.round(t.heat)}
                  </span>
                  <Badge variant="secondary">{t.source}</Badge>
                  {t.cluster_id != null && (
                    <Badge variant="outline">{CLUSTER_SHORT[t.cluster_id] ?? `cluster ${t.cluster_id}`}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t.points} pts · {t.comments} comments · {t.velocity.toFixed(1)}/h
                  </span>
                </div>

                <div className="font-medium">{t.title}</div>

                {t.covered_by_slugs.length > 0 && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                    We already cover this: {t.covered_by_slugs.join(", ")}. Update that piece instead
                    of writing a second one.
                  </div>
                )}

                {t.angle && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Angle ({t.angle_kind}):</span>{" "}
                    {t.angle}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {t.discussion_url && (
                    <a href={t.discussion_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Open discussion
                      </Button>
                    </a>
                  )}
                  <Button
                    size="sm"
                    onClick={() => statusMut.mutate({ id: t.id, status: "shortlisted" })}
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Shortlist
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => statusMut.mutate({ id: t.id, status: "skipped" })}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Not for us
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setOpenPlan(openPlan === t.id ? null : t.id)}
                  >
                    <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
                    {openPlan === t.id ? "Hide" : "Why this / what to write"}
                  </Button>
                </div>

                {openPlan === t.id && <TrendPlanPanel id={t.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Reddit */

function RedditTab() {
  const crawl = useServerFn(crawlRedditFn);
  const list = useServerFn(listRedditOpportunitiesFn);
  const draft = useServerFn(draftRedditReplyFn);
  const update = useServerFn(updateRedditOpportunityFn);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["gtm-reddit"],
    queryFn: () => list({ data: { limit: 40 } }),
  });

  const crawlMut = useMutation({
    mutationFn: () => crawl({ data: { minRelevance: 35 } }),
    onSuccess: (r) => {
      toast.success(`Scanned ${r.scanned} threads, kept ${r.stored} worth a look.`);
      if (r.errors?.length) toast.message(r.errors[0]);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const draftMut = useMutation({
    mutationFn: (id: string) => draft({ data: { id } }),
    onSuccess: () => {
      toast.success("Draft written. Read it before posting.");
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const actionMut = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "skip" }) =>
      update({ data: { id: v.id, action: v.action, reason: "not a fit" } }),
    onSuccess: () => refetch(),
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];
  const needsDraft = items.filter((i) => !i.draft_reply && i.status !== "skipped").slice(0, 8);

  /**
   * Write every missing reply in one go. Sequential rather than parallel: each one
   * is an AI call, and firing eight at once is how you hit a rate limit and get
   * eight failures instead of eight drafts.
   */
  const draftAllMut = useMutation({
    mutationFn: async () => {
      let done = 0;
      const failed: string[] = [];
      for (const item of needsDraft) {
        try {
          await draft({ data: { id: item.id } });
          done++;
        } catch (e) {
          failed.push(String((e as Error)?.message ?? e));
        }
      }
      return { done, failed };
    },
    onSuccess: (r) => {
      if (r.done) toast.success(`Wrote ${r.done} repl${r.done === 1 ? "y" : "ies"}. Read each one before posting.`);
      if (r.failed.length) toast.error(r.failed[0]);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Real posts where we can help. Press <span className="font-medium">Write all replies</span>,
          then copy each reply and paste it. Read it first. Where a group bans links, the reply has
          no link in it.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => crawlMut.mutate()} disabled={crawlMut.isPending}>
            {crawlMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            Find threads
          </Button>
          <Button
            variant="secondary"
            onClick={() => draftAllMut.mutate()}
            disabled={draftAllMut.isPending || needsDraft.length === 0}
            title="Writes a reply for every thread that does not have one yet"
          >
            {draftAllMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Write all replies{needsDraft.length ? ` (${needsDraft.length})` : ""}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <EmptyState text="Loading…" />
      ) : items.length === 0 ? (
        <EmptyState text="No threads yet. Click Find threads to scan the communities marked post or participate." />
      ) : (
        <div className="space-y-3">
          {items.map((o) => (
            <Card key={o.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">
                    {Math.round(o.relevance)}
                  </span>
                  <Badge variant="secondary">r/{o.subreddit}</Badge>
                  {o.intent && <Badge variant="outline">{o.intent}</Badge>}
                  <Badge
                    variant={o.self_promo_allowed === "no" ? "destructive" : "outline"}
                    title="What the community allows"
                  >
                    {o.self_promo_allowed === "no"
                      ? "answer only, no link"
                      : `self-promo: ${o.self_promo_allowed}`}
                  </Badge>
                  <Badge variant={o.status === "new" ? "outline" : "secondary"}>{o.status}</Badge>
                </div>

                <div className="font-medium">{o.title}</div>

                {o.matched_article_slugs.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Why us: we already cover {o.matched_article_slugs.join(", ")}
                    {o.matched_terms.length ? ` · matched on ${o.matched_terms.slice(0, 5).join(", ")}` : ""}
                  </p>
                )}

                {/* One short line, not a lecture. It is read at the moment of posting. */}
                <p
                  className={`text-xs ${
                    o.self_promo_allowed === "no" || o.self_promo_allowed === "unknown"
                      ? "font-medium text-amber-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {o.self_promo_allowed === "no"
                    ? "Rule here: no link, no product mention. Just answer."
                    : o.self_promo_allowed === "unknown"
                      ? "Rule here: unknown. Check the sidebar before adding a link."
                      : "Rule here: answer first, one link at the end, say you work at Kloudbean."}
                </p>

                {o.draft_reply && (
                  <div className="space-y-2 rounded-lg border-2 border-primary/40 bg-primary/5 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">Copy this and paste it as your reply</span>
                      {o.draft_grounded && <Badge variant="outline">checked against our docs</Badge>}
                    </div>
                    <Textarea readOnly value={o.draft_reply} className="min-h-[190px] text-sm" />
                    <div className="flex flex-wrap gap-2">
                      <CopyButton text={o.draft_reply} label="Copy reply" />
                      <a href={o.permalink} target="_blank" rel="noreferrer">
                        <Button size="sm">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Open thread and paste
                        </Button>
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a href={o.permalink} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Open thread
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    onClick={() => draftMut.mutate(o.id)}
                    disabled={draftMut.isPending}
                  >
                    {draftMut.isPending ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    {o.draft_reply ? "Re-draft" : "Draft reply"}
                  </Button>
                  {o.draft_reply && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => actionMut.mutate({ id: o.id, action: "approve" })}
                    >
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => actionMut.mutate({ id: o.id, action: "skip" })}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Communities */

const RECO_STYLE: Record<string, { label: string; className: string }> = {
  post: { label: "POST", className: "bg-emerald-600 text-white" },
  participate: { label: "PARTICIPATE", className: "bg-blue-600 text-white" },
  watch: { label: "WATCH", className: "bg-amber-500 text-white" },
  avoid: { label: "AVOID", className: "bg-slate-400 text-white" },
};

function CommunitiesTab() {
  const crawl = useServerFn(crawlCommunitiesFn);
  const list = useServerFn(listVenuesFn);
  const update = useServerFn(updateVenueFn);
  const [openPlan, setOpenPlan] = useState<string | null>(null);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["gtm-venues"],
    queryFn: () => list({ data: { limit: 60 } }),
  });

  const crawlMut = useMutation({
    mutationFn: () => crawl({ data: {} }),
    onSuccess: (r) => {
      toast.success(`Evaluated ${r.evaluated} communities from ${r.queriesRun} searches.`);
      if (r.errors?.length) toast.message(r.errors[0]);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected" }) =>
      update({ data: { id: v.id, status: v.status } }),
    onSuccess: () => {
      toast.success("Saved. The thread finder targets approved communities.");
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Groups where we should show up. Approving one tells the thread finder to watch it.{" "}
          <span className="font-medium text-foreground">Participate</span> means answer questions
          there but do not share links.
        </p>
        <Button onClick={() => crawlMut.mutate()} disabled={crawlMut.isPending}>
          {crawlMut.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          Discover communities
        </Button>
      </div>

      {isLoading ? (
        <EmptyState text="Loading…" />
      ) : items.length === 0 ? (
        <EmptyState text="No communities yet. Click Discover communities to search Reddit and score what comes back." />
      ) : (
        <div className="space-y-2">
          {items.map((v) => {
            const style = RECO_STYLE[v.recommendation] ?? RECO_STYLE.watch;
            return (
              <Card key={v.id}>
                <CardContent className="space-y-2 pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${style.className}`}>
                      {style.label}
                    </span>
                    <span className="font-medium">r/{v.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {v.subscribers > 0
                        ? `${v.subscribers.toLocaleString()} members · ${v.active_users} online`
                        : "size unknown"}{" "}
                      · fit {Math.round(v.topical_fit)}/100
                    </span>
                    <Badge variant={v.status === "approved" ? "secondary" : "outline"}>
                      {v.status}
                    </Badge>
                  </div>

                  {v.reasoning && <p className="text-sm text-muted-foreground">{v.reasoning}</p>}
                  {v.submission_notes && (
                    <p className="text-xs text-amber-700">Posting notes: {v.submission_notes}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {v.url && (
                      <a href={v.url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Visit
                        </Button>
                      </a>
                    )}
                    <Button
                      size="sm"
                      onClick={() => statusMut.mutate({ id: v.id, status: "approved" })}
                    >
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => statusMut.mutate({ id: v.id, status: "rejected" })}
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant={openPlan === v.id ? "secondary" : "default"}
                      onClick={() => setOpenPlan(openPlan === v.id ? null : v.id)}
                    >
                      <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
                      {openPlan === v.id ? "Hide" : "Why / how / what to post"}
                    </Button>
                  </div>

                  {openPlan === v.id && <VenuePlanPanel id={v.id} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Distribution */

function DistributionTab() {
  const channelsFn = useServerFn(listChannelsFn);
  const broadcastsFn = useServerFn(listBroadcastsFn);
  const prospectsFn = useServerFn(listProspectsFn);

  const { data: channels } = useQuery({
    queryKey: ["gtm-channels"],
    queryFn: () => channelsFn({}),
  });
  const { data: broadcasts } = useQuery({
    queryKey: ["gtm-broadcasts"],
    queryFn: () => broadcastsFn({ data: { limit: 20 } }),
  });
  const { data: outreach } = useQuery({
    queryKey: ["gtm-prospects"],
    queryFn: () => prospectsFn({ data: { limit: 1 } }),
  });

  const sendingOn = broadcasts?.sendingEnabled ?? false;

  return (
    <div className="space-y-5">
      <div
        className={`rounded-lg border p-3 text-sm ${
          sendingOn ? "border-amber-400 bg-amber-50 text-amber-900" : "bg-muted/40"
        }`}
      >
        <Mail className="mr-1.5 inline h-4 w-4" />
        {sendingOn ? (
          <>
            <span className="font-semibold">Live sending is ON.</span> Provider:{" "}
            {broadcasts?.provider}. Daily cap {broadcasts?.dailyCap}. Real emails will go out.
          </>
        ) : (
          <>
            <span className="font-semibold">Sending is off.</span> Everything is drafted and dry-run
            only. Provider: {broadcasts?.provider ?? "none"}. To send for real you need a provider
            key and <code className="rounded bg-background px-1">EMAIL_SEND_ENABLED=1</code>.
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outreach pipeline</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm">
          <div>
            <div className="text-2xl font-semibold">{outreach?.total ?? 0}</div>
            <div className="text-muted-foreground">prospects</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{outreach?.sentToday ?? 0}</div>
            <div className="text-muted-foreground">sent today (cap {outreach?.dailyCap ?? 0})</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{outreach?.suppressed ?? 0}</div>
            <div className="text-muted-foreground">unsubscribed</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email drafts</CardTitle>
        </CardHeader>
        <CardContent>
          {(broadcasts?.items?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              No email drafts yet. One is created automatically when an article is published.
            </p>
          ) : (
            <div className="space-y-2">
              {broadcasts!.items.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                  <Badge variant="outline">{b.status}</Badge>
                  {b.dry_run && <Badge variant="secondary">dry run</Badge>}
                  <span className="text-sm font-medium">{b.subject}</span>
                  <div className="ml-auto">
                    <CopyButton text={b.text_body} label="Copy email" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where each published article goes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            On publish, a draft is built for every channel below from copy the article already
            passed review with. Open any article in the Publish Tracker to copy its posts.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(channels?.channels ?? []).map((c) => (
              <div key={c.id} className="rounded-md border p-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.label}</span>
                  <Badge variant="outline">{c.kind}</Badge>
                  {c.selfPromo === "forbidden" || c.selfPromo === "restricted" ? (
                    <Badge variant="destructive">{c.selfPromo}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------ Auto status */

/**
 * The automation strip. Shows that the work already happened on a schedule, so the
 * page is not a set of buttons you have to remember to press.
 */
function AutoStatusBar() {
  const statusFn = useServerFn(growthStatusFn);
  const runFn = useServerFn(runGrowthNowFn);

  const { data, refetch } = useQuery({
    queryKey: ["gtm-growth-status"],
    queryFn: () => statusFn({}),
    // While jobs are queued, poll so the counts move without a manual refresh.
    refetchInterval: (q) => ((q.state.data?.pendingJobs ?? 0) > 0 ? 5000 : false),
  });

  const runMut = useMutation({
    mutationFn: () => runFn({}),
    onSuccess: (r) => {
      toast.success(
        r.queued.length
          ? `Started ${r.queued.length} task${r.queued.length === 1 ? "" : "s"}. This runs in the background, come back in a minute.`
          : "Nothing to run.",
      );
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const c = data?.counts;
  const working = (data?.pendingJobs ?? 0) > 0;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm">
        {working ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <Check className="h-4 w-4 text-emerald-500" />
        )}
        <span className="font-medium">
          {working ? `Working… ${data?.pendingJobs} task(s) left` : "Up to date"}
        </span>
        {/* Name the current task. A Reddit crawl can take minutes, and an
            unlabelled spinner for that long reads as broken. */}
        {working && data?.running?.length ? (
          <span className="text-xs text-muted-foreground">
            {data.running[0]?.replace(/^Growth: /, "")}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          <b className="text-foreground">{c?.trends ?? 0}</b> topics
        </span>
        <span>
          <b className="text-foreground">{c?.threads ?? 0}</b> posts to reply to
        </span>
        <span>
          <b className="text-foreground">{c?.threadsWithReply ?? 0}</b> replies already written
        </span>
        <span>
          <b className="text-foreground">{c?.communities ?? 0}</b> groups
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {data?.enabled ? "Runs by itself every few hours" : "Automatic runs are off"}
        </span>
        <Button size="sm" variant="outline" onClick={() => runMut.mutate()} disabled={runMut.isPending}>
          {runMut.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Run everything now
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Links tab */

const TYPE_LABEL: Record<string, string> = {
  listicle: "They list options",
  guest_post: "They take guest posts",
  resource_page: "Resource list",
  broken_link: "Dead link to fix",
  editorial_mention: "They wrote about this",
  homepage_reference: "Homepage credit",
  directory_listing: "Directory listing",
};

const STATUS_LABEL: Record<string, string> = {
  needs_contact: "Looking for who to write to",
  ready: "Ready to write",
  queued: "Pitch written, waiting",
  contacted: "Emailed",
  replied: "They replied",
  won: "Got the link",
  lost: "No",
  suppressed: "Do not contact",
  rejected: "Not worth it",
};

/**
 * The link-building tab.
 *
 * Written to answer three questions in order: is anything blocking sending, who is
 * worth writing to, and has anybody replied. The reply list comes first among the
 * lists, because a reply is the only thing here that genuinely needs a person and
 * the only thing that gets worse if it waits.
 */
/* -------------------------------------------------------- Recipes panel */

/** Plain-English names for the stages a recipe run can be in. */
const RUN_STATUS: Record<string, string> = {
  queued: "waiting",
  running: "working",
  done: "finished",
  failed: "did not work",
};

/**
 * FIND MORE WEBSITES — five different ways to look, in one panel.
 *
 * Each recipe asks a different question, so each gets its own input rather than one
 * generic search box. The panel is honest up front about which ones need a paid
 * search account and which read the backlink files already on disk, because
 * discovering that after typing is how somebody concludes the tool is broken when
 * the real answer is "top up the account, or use one of the other two".
 */
function RecipesPanel({ onFound }: { onFound: () => void }) {
  const listRecipes = useServerFn(listRecipesFn);
  const runRecipe = useServerFn(runRecipeFn);

  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string>("skyscraper");
  const [input, setInput] = useState("");
  const [campaign, setCampaign] = useState("");
  const [months, setMonths] = useState("24");
  const [last, setLast] = useState<{
    ok: boolean;
    readout: string;
    stored: number;
    samples: { domain: string; title: string | null; value: number }[];
  } | null>(null);

  const q = useQuery({
    queryKey: ["recipes"],
    queryFn: () => listRecipes({}),
  });

  const runMut = useMutation({
    mutationFn: (v: { recipe: string; input: string; withinMonths?: number; campaign?: string }) =>
      runRecipe({
        data: {
          recipe: v.recipe as "skyscraper",
          input: v.input,
          withinMonths: v.withinMonths,
          campaign: v.campaign,
        },
      }),
    onSuccess: (r) => {
      setLast({ ok: r.ok, readout: r.readout, stored: r.stored, samples: r.samples });
      if (r.ok) toast.success(r.readout, { duration: 11000 });
      else toast.error(r.readout, { duration: 13000 });
      q.refetch();
      if (r.stored > 0) onFound();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const recipes = q.data?.recipes ?? [];
  const current = recipes.find((r) => r.name === picked);
  /** A key exists. Whether the account can pay for a search is a separate question. */
  const searchReady = q.data?.searchReady ?? false;
  /** What actually went wrong the last time a search recipe ran, if it did. */
  const lastSearchError = q.data?.searchLastError ?? null;
  /**
   * A missing key is a hard block: nothing can happen. An empty account is a
   * WARNING, because the obvious response to reading it is to top up, and the next
   * click has to be allowed to work.
   */
  const blocked = !!current?.needsSearch && !searchReady;
  const warned = !!current?.needsSearch && searchReady && !!lastSearchError;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          Find more websites
          <Button
            size="sm"
            variant={open ? "secondary" : "outline"}
            className="ml-auto"
            onClick={() => setOpen(!open)}
          >
            {open ? "Hide" : "Show the five ways"}
          </Button>
        </CardTitle>
      </CardHeader>
      {open ? (
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Five different questions, five different lists. Whatever comes back joins the list below
            and gets an email written for it, in wording that matches how it was found.
          </p>

          {/* Which one */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => {
              const isOn = r.name === picked;
              const needsKey = r.needsSearch && !searchReady;
              return (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => {
                    setPicked(r.name);
                    setInput("");
                    setLast(null);
                  }}
                  className={`rounded-md border p-3 text-left transition ${
                    isOn ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.label}</span>
                    {r.needsSearch ? (
                      <Badge
                        variant={needsKey ? "destructive" : lastSearchError ? "destructive" : "outline"}
                        className="text-xs"
                      >
                        {needsKey ? "no search key" : lastSearchError ? "search failed last time" : "uses search"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        free
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.outputs}</p>
                </button>
              );
            })}
          </div>

          {blocked ? (
            <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                This one looks things up on Google and there is no search key set, so it cannot return
                anything. Add a SERPER_API_KEY, or use one of the two marked "free" which read the
                competitor backlink files already on this machine.
              </span>
            </div>
          ) : warned ? (
            <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                Heads up: the last time a search recipe ran it failed. {lastSearchError?.readout}{" "}
                You can still try, in case that has been sorted since. The two marked "free" read the
                backlink files on this machine and need no search account at all.
              </span>
            </div>
          ) : null}

          {/* The input */}
          {current ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="recipe-input">
                {current.inputLabel}
              </label>
              <Textarea
                id="recipe-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={current.inputHint}
                rows={picked === "skyscraper" || picked === "podcast" ? 2 : 3}
                className="text-sm"
              />
              <div className="flex flex-wrap items-end gap-2">
                {picked === "product_review" ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Reviewed in the last</p>
                    <Select value={months} onValueChange={setMonths}>
                      <SelectTrigger className="h-9 w-[150px]" aria-label="How recent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="24">2 years</SelectItem>
                        <SelectItem value="60">5 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Campaign name (optional)</p>
                  <Input
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    placeholder="e.g. Heroku push"
                    className="h-9 w-[190px]"
                    aria-label="Campaign name for this run"
                  />
                </div>
                <Button
                  onClick={() =>
                    runMut.mutate({
                      recipe: picked,
                      input,
                      withinMonths: picked === "product_review" ? Number(months) : undefined,
                      campaign: campaign.trim() || undefined,
                    })
                  }
                  disabled={!input.trim() || runMut.isPending || blocked}
                >
                  {runMut.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Go and look
                </Button>
              </div>
              {picked === "product_review" && q.data?.rivals?.length ? (
                <p className="text-xs text-muted-foreground">
                  We hold backlink data for: {q.data.rivals.join(", ")}
                </p>
              ) : null}
              {current.needsSearch && searchReady ? (
                <p className="text-xs text-muted-foreground">
                  Uses up to {q.data?.maxQueries ?? 12} Google searches per run.
                </p>
              ) : null}
            </div>
          ) : null}

          {/* What came back */}
          {last ? (
            <div className={`rounded-md border p-3 ${last.ok ? "bg-muted/40" : "border-destructive/40 bg-destructive/5"}`}>
              <p className="text-sm">{last.readout}</p>
              {last.samples.length ? (
                <div className="mt-2 space-y-1">
                  {last.samples.map((s) => (
                    <div key={s.domain} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-muted-foreground">{Math.round(s.value)}</span>
                      <a
                        href={`https://${s.domain}/`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-medium hover:underline"
                      >
                        {s.domain}
                      </a>
                      {s.title ? <span className="text-muted-foreground">{s.title.slice(0, 90)}</span> : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {last.stored > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Finding out who to write to has already started in the background.
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Past runs, so a run can be repeated without retyping */}
          {q.data?.runs?.length ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent looks
              </p>
              <div className="space-y-1">
                {q.data.runs.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant={r.status === "done" ? "secondary" : r.status === "failed" ? "destructive" : "outline"}>
                      {RUN_STATUS[r.status] ?? r.status}
                    </Badge>
                    <span className="font-medium">{r.recipe.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">"{r.input_text.slice(0, 40)}"</span>
                    <span className="text-muted-foreground">
                      {r.found} found, {r.stored} new
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => {
                        setPicked(r.recipe);
                        setInput(r.input_text);
                        setLast(null);
                      }}
                    >
                      Use again
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

/* -------------------------------------------------------- Inboxes panel */

/**
 * SENDING ADDRESSES — the pool, its limits, and each address's health.
 *
 * The number that matters most is at the top: how many emails can go out today.
 * Everything under it explains that number. Adding addresses spreads the same daily
 * limit rather than raising it, which the panel says out loud, because the natural
 * assumption is the opposite and acting on that assumption is how a sending domain
 * gets burned.
 */
function InboxesPanel() {
  const poolFn = useServerFn(inboxPoolFn);
  const syncFn = useServerFn(syncInboxesFn);
  const addFn = useServerFn(addInboxFn);
  const statusFn = useServerFn(setInboxStatusFn);
  const capFn = useServerFn(updateInboxFn);
  const moveFn = useServerFn(reassignInboxFn);

  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [moveFrom, setMoveFrom] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["inbox-pool"], queryFn: () => poolFn({}), refetchInterval: 60000 });
  const after = (msg: string) => (r: unknown) => {
    const res = r as { ok?: boolean; error?: string } | null;
    if (res && res.ok === false) {
      toast.error(res.error ?? "That did not work.");
      return;
    }
    toast.success(msg);
    q.refetch();
  };
  const onErr = (e: Error) => toast.error(e.message);

  const syncMut = useMutation({
    mutationFn: () => syncFn({}),
    onSuccess: (r) => {
      const bits = [`${r.total} address${r.total === 1 ? "" : "es"} in the pool`];
      if (r.added) bits.push(`${r.added} new`);
      if (r.pausedNow?.length) bits.push(`paused ${r.pausedNow.join(", ")}`);
      if (r.missingCredentials?.length) bits.push(`missing settings: ${r.missingCredentials.join("; ")}`);
      toast.success(bits.join(". "), { duration: 11000 });
      if (r.notes?.length) toast.message(r.notes.join(" "), { duration: 13000 });
      q.refetch();
    },
    onError: onErr,
  });
  const addMut = useMutation({
    mutationFn: () => addFn({ data: { fromEmail: newEmail.trim(), fromName: newName.trim() || undefined } }),
    onSuccess: (r) => {
      setNewEmail("");
      setNewName("");
      after(r.wasExisting ? "That address was already here, so its settings were updated." : "Address added.")(r);
    },
    onError: onErr,
  });
  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "active" | "paused"; reason?: string }) =>
      statusFn({ data: v }),
    onSuccess: after("Done."),
    onError: onErr,
  });
  const capMut = useMutation({
    mutationFn: (v: { id: string; dailyCap: number }) => capFn({ data: v }),
    onSuccess: after("Daily limit changed."),
    onError: onErr,
  });
  const moveMut = useMutation({
    mutationFn: (v: { fromId: string; toId: string }) => moveFn({ data: v }),
    onSuccess: (r) => {
      setMoveFrom(null);
      if (r.ok) toast.success(`${r.moved} conversation(s) moved to ${r.to}.`, { duration: 9000 });
      else toast.error(r.error ?? "Could not move them.");
      q.refetch();
    },
    onError: onErr,
  });

  const d = q.data;
  const boxes = d?.inboxes ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Inbox className="h-4 w-4" />
          Sending addresses
          <Badge variant="outline">{d?.configured ?? 0} set up</Badge>
          {d?.paused ? <Badge variant="destructive">{d.paused} paused</Badge> : null}
          <Button
            size="sm"
            variant={open ? "secondary" : "outline"}
            className="ml-auto"
            onClick={() => setOpen(!open)}
          >
            {open ? "Hide" : "Manage"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{d?.reason ?? "Checking…"}</p>

        {!d?.configured ? (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            Everything currently sends from one address. To spread it across several, put them in
            your settings file on one line, then press "Look for new addresses":
            <pre className="mt-2 overflow-x-auto rounded bg-background p-2 text-xs">
              OUTREACH_INBOX_ADDRESSES=you@kloudbean.com|Your Name, hello@kloudbean.com
            </pre>
          </div>
        ) : null}

        {d?.stranded ? (
          <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <span>
              {d.stranded} conversation{d.stranded === 1 ? "" : "s"} are waiting because the address
              that started them is paused. Follow-ups always come from the address that sent the first
              email, so they wait rather than arriving from a stranger. Un-pause it, or move them
              across below.
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
            {syncMut.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Look for new addresses
          </Button>
        </div>

        {open ? (
          <>
            {/* Add one */}
            <div className="flex flex-wrap items-end gap-2 rounded-md border p-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Add an address</p>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="you@kloudbean.com"
                  className="h-9 w-[240px]"
                  aria-label="New sending address"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Name shown to them</p>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Vikram"
                  className="h-9 w-[160px]"
                  aria-label="Name shown on the email"
                />
              </div>
              <Button
                size="sm"
                onClick={() => addMut.mutate()}
                disabled={!newEmail.trim() || addMut.isPending}
              >
                Add
              </Button>
              <p className="w-full text-xs text-muted-foreground">
                This adds an address that uses your existing email provider. An address with its own
                password has to go in the settings file instead, because passwords are never stored
                here.
              </p>
            </div>

            {/* The pool */}
            {boxes.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Today</TableHead>
                    <TableHead className="text-right">Limit</TableHead>
                    <TableHead className="text-right">Sent ever</TableHead>
                    <TableHead className="text-right">Conversations</TableHead>
                    <TableHead className="text-right">Bounced</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boxes.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.fromEmail}</TableCell>
                      <TableCell className="text-right">{b.sentToday}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          defaultValue={b.configuredCap}
                          className="ml-auto h-7 w-[70px] text-right"
                          aria-label={`Daily limit for ${b.fromEmail}`}
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (v > 0 && v !== b.configuredCap) capMut.mutate({ id: b.id, dailyCap: v });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">{b.sentTotal}</TableCell>
                      <TableCell className="text-right">{b.conversations}</TableCell>
                      <TableCell className="text-right">
                        {b.bounceRate == null ? (
                          <span className="text-muted-foreground">too early</span>
                        ) : (
                          <span className={b.bounceRate > (d?.maxBounceRate ?? 5) ? "text-destructive" : ""}>
                            {b.bounceRate}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{b.reason}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {b.status === "active" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Stop using this address"
                              onClick={() =>
                                statusMut.mutate({ id: b.id, status: "paused", reason: "paused by hand" })
                              }
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Start using it again"
                              onClick={() => statusMut.mutate({ id: b.id, status: "active" })}
                            >
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {b.conversations > 0 ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => setMoveFrom(moveFrom === b.id ? null : b.id)}
                            >
                              Move
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}

            {/* Move conversations */}
            {moveFrom ? (
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm">
                  Move every conversation from{" "}
                  <b>{boxes.find((b) => b.id === moveFrom)?.fromEmail}</b> to another address. Their
                  next email will come from the new address, which the person will notice, so only do
                  this when the old one is out of action for good.
                </p>
                <div className="flex flex-wrap gap-2">
                  {boxes
                    .filter((b) => b.id !== moveFrom && b.status === "active")
                    .map((b) => (
                      <Button
                        key={b.id}
                        size="sm"
                        variant="outline"
                        onClick={() => moveMut.mutate({ fromId: moveFrom, toId: b.id })}
                        disabled={moveMut.isPending}
                      >
                        {b.fromEmail}
                      </Button>
                    ))}
                  <Button size="sm" variant="ghost" onClick={() => setMoveFrom(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              Adding addresses spreads the same daily total across more of them. It does not raise the
              total, which stays at {d?.globalCap ?? 0} a day. Each address also starts slowly on
              purpose and works up, because a brand new address sending twenty cold emails on its
              first day is what a hijacked account looks like.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** The eight stages a link opportunity can sit in, mirroring the server enum. */
type LinkStage =
  | "needs_contact"
  | "ready"
  | "queued"
  | "contacted"
  | "replied"
  | "won"
  | "lost"
  | "rejected";

function LinksTab() {
  const workspace = useServerFn(linkWorkspaceFn);
  const listProspects = useServerFn(listLinkProspectsFn);
  const detailFn = useServerFn(linkProspectDetailFn);
  const savePitch = useServerFn(saveLinkPitchFn);
  const updateContact = useServerFn(updateLinkContactFn);
  const setState = useServerFn(setLinkPitchStateFn);
  const bulkState = useServerFn(bulkLinkPitchStateFn);
  const sendOne = useServerFn(sendOneLinkPitchFn);
  const addNote = useServerFn(addLinkNoteFn);
  const setStage = useServerFn(setLinkStageFn);
  const verifyOne = useServerFn(verifyOneLinkFn);
  const runVerify = useServerFn(runLinkVerificationNowFn);
  const runPipeline = useServerFn(runLinkPipelineNowFn);
  const preview = useServerFn(previewOutreachSendFn);
  const listReplies = useServerFn(listRepliesFn);
  const markHandled = useServerFn(markReplyHandledFn);
  const setCampaignName = useServerFn(setLinkCampaignFn);

  /* ------------------------------ view state ----------------------------- */
  const [campaign, setCampaign] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("actionable");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"value" | "authority" | "recent">("value");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; subject: string; body: string } | null>(null);
  const [contactDraft, setContactDraft] = useState<{ email: string; name: string } | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [campaignDraft, setCampaignDraft] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  /* -------------------------------- data --------------------------------- */
  const wsQ = useQuery({
    queryKey: ["links-workspace", campaign],
    queryFn: () => workspace({ data: campaign === "all" ? {} : { campaign } }),
    refetchInterval: 30000,
  });

  const STAGE_SETS: Record<string, string[] | undefined> = {
    actionable: ["ready", "queued", "contacted", "replied"],
    all: undefined,
    ready: ["ready"],
    queued: ["queued"],
    contacted: ["contacted"],
    replied: ["replied"],
    won: ["won"],
    lost: ["lost"],
    needs_contact: ["needs_contact"],
  };

  const listQ = useQuery({
    queryKey: ["links-list", stageFilter, typeFilter],
    queryFn: () =>
      listProspects({
        data: {
          statuses: STAGE_SETS[stageFilter],
          opportunityType: typeFilter === "all" ? undefined : typeFilter,
          limit: 200,
        },
      }),
  });

  const detailQ = useQuery({
    queryKey: ["links-detail", openId],
    queryFn: () => detailFn({ data: { id: openId! } }),
    enabled: !!openId,
  });

  /**
   * Replies stay a separate query rather than part of the workspace call, because
   * this is the one list that must be right this second. Everything else can be a
   * few seconds stale without costing anything.
   */
  const repliesQ = useQuery({
    queryKey: ["links-replies"],
    queryFn: () => listReplies({ data: { needsHuman: true, limit: 20 } }),
  });

  const refreshAll = () => {
    wsQ.refetch();
    listQ.refetch();
    repliesQ.refetch();
    if (openId) detailQ.refetch();
  };

  /* ------------------------------ mutations ------------------------------ */
  /**
   * Every write here behaves the same way: complain if the server said no, confirm
   * in plain words if it said yes, then refresh the screen. These are plain
   * functions, not a hook wrapper, because a helper that itself called useMutation
   * would be calling a hook outside a component body and React would break.
   */
  const okHandler =
    (okMsg: string) =>
    (r: unknown) => {
      const res = r as { ok?: boolean; error?: string } | null;
      if (res && res.ok === false) {
        toast.error(res.error ?? "That did not work.");
        return;
      }
      toast.success(okMsg);
      refreshAll();
    };
  const failHandler = (e: Error) => toast.error(e.message);

  const saveMut = useMutation({
    mutationFn: (v: { messageId: string; subject: string; body: string }) => savePitch({ data: v }),
    onSuccess: (r) => {
      // Close the editor so what you see next is what was actually stored, not
      // the box you were typing in. Leaving it open makes a failed save look
      // like a successful one.
      setEditing(null);
      okHandler("Saved. The system will not rewrite your wording.")(r);
    },
    onError: failHandler,
  });
  const contactMut = useMutation({
    mutationFn: (v: { id: string; email: string; name?: string }) => updateContact({ data: v }),
    onSuccess: (r) => {
      setContactDraft(null);
      okHandler("Contact updated.")(r);
    },
    onError: failHandler,
  });
  const stateMut = useMutation({
    mutationFn: (v: { messageId: string; state: "approved" | "skipped" | "draft" }) =>
      setState({ data: v }),
    onSuccess: okHandler("Done."),
    onError: failHandler,
  });
  const stageMut = useMutation({
    mutationFn: (v: { id: string; status: LinkStage; wonUrl?: string }) => setStage({ data: v }),
    onSuccess: okHandler("Stage changed."),
    onError: failHandler,
  });
  const noteMut = useMutation({
    mutationFn: (v: { id: string; note: string }) => addNote({ data: v }),
    onSuccess: okHandler("Note saved."),
    onError: failHandler,
  });
  const handledMut = useMutation({
    mutationFn: (id: string) => markHandled({ data: { id } }),
    onSuccess: okHandler("Marked as dealt with."),
    onError: failHandler,
  });
  const campaignMut = useMutation({
    mutationFn: (v: { ids: string[]; campaign: string }) => setCampaignName({ data: v }),
    onSuccess: okHandler("Campaign label applied."),
    onError: failHandler,
  });
  const verifyMut = useMutation({
    mutationFn: (id: string) => verifyOne({ data: { id } }),
    onSuccess: (r) => {
      toast.success(
        r.found
          ? r.nofollow
            ? "Link is there, but marked nofollow so it passes no credit."
            : `Link is live${r.anchor ? ` on "${r.anchor}"` : ""}.`
          : r.lost
            ? "The link has gone. It was there before."
            : "No link on that page yet.",
        { duration: 8000 },
      );
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkMut = useMutation({
    mutationFn: (v: { ids: string[]; state: "approved" | "skipped" }) =>
      bulkState({ data: { messageIds: v.ids, state: v.state } }),
    onSuccess: (r) => {
      const heldNote = r.held.length
        ? ` ${r.held.length} held back: ${[...new Set(r.held.map((h) => h.why))].join(", ")}.`
        : "";
      toast.success(`${r.changed} updated.${heldNote}`, { duration: 9000 });
      setSelected(new Set());
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMut = useMutation({
    mutationFn: (v: { messageId: string; forReal: boolean }) => sendOne({ data: v }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.error ?? "Could not send.");
        return;
      }
      toast.success(
        r.dryRun
          ? `Test run only, nothing was sent. It would go to ${r.to}.`
          : `Sent to ${r.to}.`,
        { duration: 8000 },
      );
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runMut = useMutation({
    mutationFn: () => runPipeline({}),
    onSuccess: (r) => {
      toast.success(r.queued.length ? `Started ${r.queued.length} step(s) in the background.` : "Already running.");
      refreshAll();
    },
  });
  const verifyAllMut = useMutation({
    mutationFn: () => runVerify({}),
    onSuccess: (r) =>
      toast.success(r.queued ? "Checking pages in the background." : "Already checking."),
  });
  const previewMut = useMutation({
    mutationFn: () => preview({}),
    onSuccess: (r) =>
      toast.success(
        `Would send ${r.wouldSend}, hold ${r.wouldThrottle} until tomorrow, skip ${r.wouldCap} over the limit. ${r.budget.reason}`,
        { duration: 10000 },
      ),
  });

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied.");
    setTimeout(() => setCopied(null), 1600);
  };

  /* ------------------------------ derived -------------------------------- */
  const ws = wsQ.data;
  const cfg = ws?.config;
  const m = ws?.metrics;

  const rows = (listQ.data?.items ?? [])
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.domain.toLowerCase().includes(q) ||
        (r.contact_email ?? "").toLowerCase().includes(q) ||
        (r.best_source_title ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === "authority") return b.authority - a.authority;
      if (sort === "recent") return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      return b.value_score - a.value_score;
    });

  const detail = detailQ.data?.ok ? detailQ.data : null;
  const openRow = rows.find((r) => r.id === openId);
  const draftMsg = detail?.messages.find((x) => x.status === "draft" || x.status === "approved");
  const selectableIds = rows
    .filter((r) => r.status === "queued")
    .map((r) => r.id);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  /**
   * Turn the selected rows into the draft message ids the bulk action needs.
   * Capped at 100 to match the server's own cap, so the UI can never ask for more
   * than the server will accept and then report a confusing partial result.
   */
  const resolveSelectedMessages = async () => {
    const ids: string[] = [];
    for (const id of [...selected].slice(0, 100)) {
      const d = await detailFn({ data: { id } });
      if (d.ok) {
        const msg = d.messages.find((x) => x.status === "draft");
        if (msg) ids.push(msg.id);
      }
    }
    return ids;
  };

  const linkState = (r: { link_found: boolean | null; link_is_followed: boolean | null; link_lost_at: string | null }) => {
    if (r.link_lost_at) return { label: "Link gone", tone: "destructive" as const };
    if (r.link_found === true && r.link_is_followed === false)
      return { label: "Nofollow", tone: "secondary" as const };
    if (r.link_found === true) return { label: "Link live", tone: "default" as const };
    if (r.link_found === false) return { label: "No link yet", tone: "outline" as const };
    return { label: "Not checked", tone: "outline" as const };
  };

  /* -------------------------------- render ------------------------------- */
  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm">
          This finds websites that already write about hosting and mention our competitors, works out
          who to email, writes the email, and then checks whether the link actually appeared. It runs
          on its own. You can change anything before it goes out, and nothing is emailed unless you
          turn sending on.
        </p>
      </div>

      {/* What the numbers actually say. Refuses to show a rate from a tiny sample. */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            How it is going
            {ws?.campaigns?.length ? (
              <Select value={campaign} onValueChange={setCampaign}>
                <SelectTrigger className="ml-auto h-8 w-[190px]" aria-label="Campaign">
                  <SelectValue placeholder="All campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All campaigns</SelectItem>
                  {ws.campaigns.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name} ({c.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{m?.readout ?? "Loading…"}</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { label: "Sites found", value: m?.funnel.found ?? 0 },
              { label: "Have an email", value: m?.funnel.withContact ?? 0 },
              { label: "Pitch written", value: m?.funnel.pitchWritten ?? 0 },
              { label: "Emailed", value: m?.funnel.emailed ?? 0 },
              { label: "Replied", value: m?.funnel.replied ?? 0 },
              { label: "Links live", value: m?.funnel.linksLive ?? 0, good: true },
              { label: "Links gone", value: m?.funnel.linksLost ?? 0, bad: true },
            ].map((c) => (
              <div key={c.label} className="rounded-md border p-3">
                <div
                  className={`text-2xl font-semibold ${
                    c.good && c.value > 0 ? "text-emerald-600 dark:text-emerald-400" : ""
                  } ${c.bad && c.value > 0 ? "text-destructive" : ""}`}
                >
                  {c.value}
                </div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              Reply rate: <b>{m?.funnel.replyRate.label ?? "-"}</b>
            </span>
            <span>
              Link rate: <b>{m?.funnel.linkRate.label ?? "-"}</b>
            </span>
            {m?.funnel.linksNofollow ? (
              <span className="text-muted-foreground">
                {m.funnel.linksNofollow} nofollow (no credit)
              </span>
            ) : null}
            {ws?.verification?.neverChecked ? (
              <span className="text-muted-foreground">
                {ws.verification.neverChecked} never checked for a link
              </span>
            ) : null}
          </div>

          {m?.byType?.length ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Which kind of page earns links
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kind of page</TableHead>
                    <TableHead className="text-right">Emailed</TableHead>
                    <TableHead className="text-right">Replied</TableHead>
                    <TableHead className="text-right">Links</TableHead>
                    <TableHead className="text-right">Link rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.byType.map((t) => (
                    <TableRow key={t.opportunityType}>
                      <TableCell>{TYPE_LABEL[t.opportunityType] ?? t.opportunityType}</TableCell>
                      <TableCell className="text-right">{t.emailed}</TableCell>
                      <TableCell className="text-right">{t.replied}</TableCell>
                      <TableCell className="text-right">{t.linksLive}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {t.linkRate.pct == null ? "too early" : `${t.linkRate.pct}%`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Five ways to find more, before the list they feed */}
      <RecipesPanel onFound={refreshAll} />

      {/* Sending status + the warnings that matter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{ws?.budget?.reason ?? "Checking…"}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant={cfg?.sendingEnabled ? "default" : "secondary"}>
              {cfg?.sendingEnabled ? "Sending on" : "Sending off"}
            </Badge>
            <Badge variant={cfg?.autoSend ? "default" : "secondary"}>
              {cfg?.autoSend ? "Sends by itself" : "Will not send by itself"}
            </Badge>
            <Badge variant={cfg?.autoApprove ? "default" : "secondary"}>
              {cfg?.autoApprove ? "Approves by itself" : "You approve each one"}
            </Badge>
            <Badge variant={cfg?.imapConfigured ? "default" : "outline"}>
              {cfg?.imapConfigured ? "Reads replies" : "Cannot read replies"}
            </Badge>
            <Badge variant="outline">
              {cfg?.provider === "none" ? "No email provider" : `Via ${cfg?.provider}`}
            </Badge>
            <Badge variant="outline">
              {cfg?.maxTouches} email max, {cfg?.followUpDays} days apart
            </Badge>
          </div>

          {!cfg?.imapConfigured ? (
            <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                Replies cannot be read yet, so do not switch on automatic sending. A follow-up would
                go to people who already answered. Set IMAP_HOST, IMAP_USER and IMAP_PASSWORD, and
                install imapflow.
              </span>
            </div>
          ) : null}
          {!cfg?.unsubscribeSecretSet ? (
            <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                Unsubscribe links are not signed. They still work, but anyone could unsubscribe
                someone else by editing the web address. Set UNSUBSCRIBE_SECRET.
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => runMut.mutate()} disabled={runMut.isPending}>
              {runMut.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Find and write now
            </Button>
            <Button size="sm" variant="outline" onClick={() => previewMut.mutate()} disabled={previewMut.isPending}>
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              What would go out?
            </Button>
            <Button size="sm" variant="outline" onClick={() => verifyAllMut.mutate()} disabled={verifyAllMut.isPending}>
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Check for links now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Who it goes out from */}
      <InboxesPanel />

      {/* Replies come before the working list. A reply is the only thing on this
          page that genuinely needs a person, and the only thing that gets worse
          the longer it waits. */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Replies for you to read
            {ws?.replies?.needsHuman ? (
              <Badge variant="destructive">{ws.replies.needsHuman}</Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            The system never answers anyone. When somebody replies it stops emailing them and puts
            the reply here.
          </p>
          {repliesQ.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : !repliesQ.data?.items?.length ? (
            <p className="text-sm text-muted-foreground">Nothing waiting.</p>
          ) : (
            <div className="space-y-2">
              {repliesQ.data.items.map((r) => (
                <div key={r.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        r.classification === "interested"
                          ? "default"
                          : r.classification === "complaint"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {r.classification === "interested"
                        ? "Sounds positive"
                        : r.classification === "question"
                          ? "Asked a question"
                          : r.classification === "complaint"
                            ? "Complaint"
                            : "Not sure, please read"}
                    </Badge>
                    <span className="text-sm font-medium">{r.from_email}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => handledMut.mutate(r.id)}
                      disabled={handledMut.isPending}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Dealt with
                    </Button>
                  </div>
                  {r.subject ? <p className="mt-1 text-sm font-medium">{r.subject}</p> : null}
                  {r.snippet ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {r.snippet.slice(0, 400)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* The working list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Websites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search a site, email or page title"
                className="h-9 w-[260px] pl-8"
                aria-label="Search websites"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="h-9 w-[190px]" aria-label="Stage filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actionable">Still to work on</SelectItem>
                <SelectItem value="ready">Ready to write</SelectItem>
                <SelectItem value="queued">Pitch written</SelectItem>
                <SelectItem value="contacted">Emailed</SelectItem>
                <SelectItem value="replied">They replied</SelectItem>
                <SelectItem value="won">Got the link</SelectItem>
                <SelectItem value="lost">Lost or no</SelectItem>
                <SelectItem value="needs_contact">Need an email</SelectItem>
                <SelectItem value="all">Everything</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-[190px]" aria-label="Kind of page filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any kind of page</SelectItem>
                <SelectItem value="listicle">They list options</SelectItem>
                <SelectItem value="guest_post">They take guest posts</SelectItem>
                <SelectItem value="resource_page">Resource list</SelectItem>
                <SelectItem value="editorial_mention">They wrote about this</SelectItem>
                <SelectItem value="broken_link">Dead link to fix</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="h-9 w-[160px]" aria-label="Sort order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value">Best first</SelectItem>
                <SelectItem value="authority">Best known first</SelectItem>
                <SelectItem value="recent">Newest first</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{rows.length} shown</span>
          </div>

          {/* Bulk bar. Only appears with a selection, so it cannot be clicked by accident. */}
          {selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 p-2">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <Button
                size="sm"
                onClick={async () => {
                  const ids = await resolveSelectedMessages();
                  if (!ids.length) {
                    toast.error("None of those have a pitch waiting.");
                    return;
                  }
                  bulkMut.mutate({ ids, state: "approved" });
                }}
                disabled={bulkMut.isPending}
              >
                {bulkMut.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                )}
                Approve selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const ids = await resolveSelectedMessages();
                  if (ids.length) bulkMut.mutate({ ids, state: "skipped" });
                }}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Skip selected
              </Button>
              <div className="flex items-center gap-1">
                <Input
                  value={campaignDraft}
                  onChange={(e) => setCampaignDraft(e.target.value)}
                  placeholder="Campaign name"
                  className="h-8 w-[150px]"
                  aria-label="Campaign name to apply"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!campaignDraft.trim() || campaignMut.isPending}
                  onClick={() => {
                    campaignMut.mutate({
                      ids: [...selected].slice(0, 200),
                      campaign: campaignDraft.trim(),
                    });
                    setCampaignDraft("");
                  }}
                >
                  Label
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
              <span className="text-xs text-muted-foreground">
                Up to 100 at a time. Anything that fails a check is held back and told to you.
              </span>
            </div>
          ) : selectableIds.length ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set(selectableIds.slice(0, 100)))}
            >
              Select the {Math.min(selectableIds.length, 100)} with a pitch waiting
            </Button>
          ) : null}

          {/* Rows */}
          {listQ.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : !rows.length ? (
            <p className="text-sm text-muted-foreground">
              Nothing here. Try "Everything", or press "Find and write now" above.
            </p>
          ) : (
            <div className="space-y-2">
              {rows.slice(0, 60).map((r) => {
                const ls = linkState(r);
                const isOpen = openId === r.id;
                return (
                  <div key={r.id} className={`rounded-md border p-3 ${isOpen ? "bg-muted/30" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      {r.status === "queued" ? (
                        <Checkbox
                          checked={selected.has(r.id)}
                          onCheckedChange={() => toggle(r.id)}
                          aria-label={`Select ${r.domain}`}
                        />
                      ) : null}
                      <span className="font-mono text-xs text-muted-foreground">
                        {Math.round(r.value_score)}
                      </span>
                      <a
                        href={r.homepage_url ?? `https://${r.domain}/`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm font-medium hover:underline"
                      >
                        {r.domain}
                      </a>
                      <Badge variant="outline">{TYPE_LABEL[r.opportunity_type] ?? r.opportunity_type}</Badge>
                      <Badge variant="secondary">{STATUS_LABEL[r.status] ?? r.status}</Badge>
                      <Badge variant={ls.tone}>{ls.label}</Badge>
                      {r.accepts_guest_posts ? <Badge>Guest posts</Badge> : null}
                      {r.campaign_name ? <Badge variant="outline">{r.campaign_name}</Badge> : null}
                      <span className="ml-auto text-xs text-muted-foreground">
                        authority {r.authority}
                      </span>
                      <Button
                        size="sm"
                        variant={isOpen ? "secondary" : "outline"}
                        onClick={() => {
                          setOpenId(isOpen ? null : r.id);
                          setEditing(null);
                          setContactDraft(null);
                          setNoteDraft("");
                        }}
                      >
                        {isOpen ? "Close" : "Open"}
                      </Button>
                      {r.status !== "rejected" && r.status !== "won" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Drop this site from the list"
                          onClick={() => stageMut.mutate({ id: r.id, status: "rejected" })}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">Not worth it</span>
                        </Button>
                      ) : null}
                    </div>

                    {r.best_source_title ? (
                      <p className="mt-1.5 text-sm">
                        Their page:{" "}
                        <a
                          href={r.best_source_url ?? "#"}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline decoration-dotted"
                        >
                          {r.best_source_title.slice(0, 120)}
                        </a>
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {r.contact_email ? <span>{r.contact_email}</span> : <span>No email found yet</span>}
                      {r.links_to?.length ? <span>Mentions {r.links_to.join(", ")}</span> : null}
                      {r.link_anchor ? <span>Anchor: "{r.link_anchor}"</span> : null}
                      {r.last_checked_at ? (
                        <span>Checked {new Date(r.last_checked_at).toLocaleDateString()}</span>
                      ) : null}
                    </div>

                    {/* ------------------------- detail panel ------------------------- */}
                    {isOpen ? (
                      <div className="mt-3 space-y-4 border-t pt-3">
                        {detailQ.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : !detail ? (
                          <p className="text-sm text-muted-foreground">Could not load this one.</p>
                        ) : (
                          <>
                            {/* Contact, editable in place */}
                            <div className="space-y-2">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Who we write to
                              </p>
                              {contactDraft ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <Input
                                    value={contactDraft.email}
                                    onChange={(e) => setContactDraft({ ...contactDraft, email: e.target.value })}
                                    placeholder="editor@theirsite.com"
                                    className="h-8 w-[260px]"
                                    aria-label="Contact email"
                                  />
                                  <Input
                                    value={contactDraft.name}
                                    onChange={(e) => setContactDraft({ ...contactDraft, name: e.target.value })}
                                    placeholder="Their name (optional)"
                                    className="h-8 w-[190px]"
                                    aria-label="Contact name"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      contactMut.mutate({
                                        id: r.id,
                                        email: contactDraft.email.trim(),
                                        name: contactDraft.name.trim() || undefined,
                                      })
                                    }
                                  >
                                    Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setContactDraft(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span>{r.contact_email ?? "nobody found yet"}</span>
                                  {r.contact_name ? <span className="text-muted-foreground">({r.contact_name})</span> : null}
                                  {r.contact_source ? (
                                    <Badge variant="outline" className="text-xs">
                                      from {r.contact_source}
                                    </Badge>
                                  ) : null}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setContactDraft({
                                        email: r.contact_email ?? "",
                                        name: r.contact_name ?? "",
                                      })
                                    }
                                  >
                                    <Pencil className="mr-1 h-3.5 w-3.5" />
                                    {r.contact_email ? "Change" : "Add one"}
                                  </Button>
                                  {r.contact_page_url ? (
                                    <Button size="sm" variant="ghost" asChild>
                                      <a href={r.contact_page_url} target="_blank" rel="noreferrer noopener">
                                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                        Their contact page
                                      </a>
                                    </Button>
                                  ) : null}
                                  {r.guidelines_url ? (
                                    <Button size="sm" variant="ghost" asChild>
                                      <a href={r.guidelines_url} target="_blank" rel="noreferrer noopener">
                                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                        Their rules
                                      </a>
                                    </Button>
                                  ) : null}
                                </div>
                              )}
                            </div>

                            {/* The email, editable */}
                            {draftMsg ? (
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    The email
                                  </p>
                                  <Badge variant="secondary">{draftMsg.status}</Badge>
                                  {draftMsg.edited_by_human ? (
                                    <Badge variant="outline">you edited this</Badge>
                                  ) : null}
                                </div>

                                {editing?.id === draftMsg.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={editing.subject}
                                      onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                                      className="h-9"
                                      aria-label="Subject"
                                    />
                                    <Textarea
                                      value={editing.body}
                                      onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                                      rows={14}
                                      className="font-mono text-xs"
                                      aria-label="Email body"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Keep the unsubscribe line. The sender refuses any email without one.
                                    </p>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          saveMut.mutate({
                                            messageId: editing.id,
                                            subject: editing.subject,
                                            body: editing.body,
                                          })
                                        }
                                      >
                                        Save my wording
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">{draftMsg.subject}</p>
                                    <Textarea
                                      readOnly
                                      value={draftMsg.body_text}
                                      rows={10}
                                      className="font-mono text-xs"
                                      aria-label="Email body"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setEditing({
                                            id: draftMsg.id,
                                            subject: draftMsg.subject,
                                            body: draftMsg.body_text,
                                          })
                                        }
                                      >
                                        <Pencil className="mr-1 h-3.5 w-3.5" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copy(`${draftMsg.subject}\n\n${draftMsg.body_text}`, draftMsg.id)}
                                      >
                                        {copied === draftMsg.id ? (
                                          <Check className="mr-1 h-3.5 w-3.5" />
                                        ) : (
                                          <Copy className="mr-1 h-3.5 w-3.5" />
                                        )}
                                        Copy
                                      </Button>
                                      {draftMsg.status === "draft" ? (
                                        <Button
                                          size="sm"
                                          onClick={() => stateMut.mutate({ messageId: draftMsg.id, state: "approved" })}
                                        >
                                          <Check className="mr-1 h-3.5 w-3.5" />
                                          Approve
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => stateMut.mutate({ messageId: draftMsg.id, state: "draft" })}
                                        >
                                          Un-approve
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => stateMut.mutate({ messageId: draftMsg.id, state: "skipped" })}
                                      >
                                        <X className="mr-1 h-3.5 w-3.5" />
                                        Skip
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => sendMut.mutate({ messageId: draftMsg.id, forReal: false })}
                                      >
                                        Test send
                                      </Button>
                                      {cfg?.sendingEnabled ? (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => sendMut.mutate({ messageId: draftMsg.id, forReal: true })}
                                        >
                                          <Send className="mr-1 h-3.5 w-3.5" />
                                          Send now, for real
                                        </Button>
                                      ) : null}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No email written for this one yet.
                              </p>
                            )}

                            {/* The conversation */}
                            {detail.thread.length ? (
                              <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  The conversation
                                </p>
                                {detail.thread.map((t) => (
                                  <div
                                    key={`${t.kind}-${t.id}`}
                                    className={`rounded-md border p-2 text-sm ${
                                      t.kind === "theirs" ? "border-primary/40 bg-primary/5" : ""
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <Badge variant={t.kind === "theirs" ? "default" : "outline"}>
                                        {t.kind === "theirs" ? "They said" : t.step === 1 ? "We sent" : "Follow-up"}
                                      </Badge>
                                      <span className="text-muted-foreground">{t.status}</span>
                                      {t.at ? (
                                        <span className="text-muted-foreground">
                                          {new Date(t.at).toLocaleString()}
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="mt-1 font-medium">{t.subject}</p>
                                    <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                                      {t.body.slice(0, 500)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {/* Link verification */}
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Did the link appear?
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => verifyMut.mutate(r.id)}
                                  disabled={verifyMut.isPending}
                                >
                                  {verifyMut.isPending ? (
                                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Search className="mr-1 h-3.5 w-3.5" />
                                  )}
                                  Check their page now
                                </Button>
                              </div>
                              {detail.checks.length ? (
                                <div className="space-y-1 text-xs">
                                  {detail.checks.slice(0, 4).map((c) => (
                                    <div key={c.id} className="flex flex-wrap gap-2">
                                      <Badge variant={c.found ? "default" : "outline"}>
                                        {c.found ? (c.is_followed ? "found, followed" : `found, ${c.rel_attributes}`) : "not found"}
                                      </Badge>
                                      <span className="text-muted-foreground">
                                        {new Date(c.checked_at).toLocaleString()}
                                      </span>
                                      {c.notes ? <span className="text-muted-foreground">{c.notes}</span> : null}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">Not checked yet.</p>
                              )}
                            </div>

                            {/* Stage + note */}
                            <div className="flex flex-wrap items-end gap-2">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Move this to</p>
                                <Select
                                  value={r.status}
                                  onValueChange={(v) =>
                                    stageMut.mutate({ id: r.id, status: v as LinkStage })
                                  }
                                >
                                  <SelectTrigger className="h-8 w-[180px]" aria-label="Move to stage">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                                      <SelectItem key={k} value={k}>
                                        {v}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-xs text-muted-foreground">Add a note</p>
                                <div className="flex gap-2">
                                  <Input
                                    value={noteDraft}
                                    onChange={(e) => setNoteDraft(e.target.value)}
                                    placeholder="Anything worth remembering"
                                    className="h-8"
                                    aria-label="Note"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!noteDraft.trim()}
                                    onClick={() => {
                                      noteMut.mutate({ id: r.id, note: noteDraft.trim() });
                                      setNoteDraft("");
                                    }}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {r.notes ? (
                              <p className="text-xs text-muted-foreground">Latest note: {r.notes}</p>
                            ) : null}

                            {/* History */}
                            {detail.activity.length ? (
                              <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  What has happened
                                </p>
                                <div className="space-y-0.5 text-xs text-muted-foreground">
                                  {detail.activity.slice(0, 8).map((h) => (
                                    <div key={h.id}>
                                      {new Date(h.created_at).toLocaleString()} — {h.action.replace(/_/g, " ")}
                                      {h.actor === "automation" ? " (automatic)" : ""}
                                      {h.detail ? `: ${h.detail.slice(0, 120)}` : ""}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {rows.length > 60 ? (
                <p className="text-sm text-muted-foreground">
                  Showing the first 60 of {rows.length}. Narrow it down with the filters.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent activity across everything, so the automation is not a black box. */}
      {ws?.activity?.length ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recently, across everything</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              {ws.activity.slice(0, 15).map((h) => (
                <div key={h.id}>
                  {new Date(h.created_at).toLocaleString()} — {h.domain ? `${h.domain}: ` : ""}
                  {h.action.replace(/_/g, " ")}
                  {h.actor === "automation" ? " (automatic)" : ""}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------- Page */

function GrowthPage() {
  return (
    <AppLayout>
      <div className="space-y-5 p-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Flame className="h-6 w-6" style={{ color: "var(--brand, #4F1AF3)" }} />
            Growth
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This runs on its own. Topics, posts to reply to, and the replies themselves are all
            ready when you open this page. You read them and paste them. Nothing is ever posted or
            emailed for you.
          </p>
        </div>

        <AutoStatusBar />

        <Tabs defaultValue="trends">
          <TabsList>
            <TabsTrigger value="trends">
              <Flame className="mr-1.5 h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="reddit">
              <MessageSquare className="mr-1.5 h-4 w-4" />
              Reddit threads
            </TabsTrigger>
            <TabsTrigger value="communities">
              <Users className="mr-1.5 h-4 w-4" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="links">
              <Link2 className="mr-1.5 h-4 w-4" />
              Backlinks
            </TabsTrigger>
            <TabsTrigger value="distribution">
              <Send className="mr-1.5 h-4 w-4" />
              Distribution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="mt-4">
            <TrendsTab />
          </TabsContent>
          <TabsContent value="reddit" className="mt-4">
            <RedditTab />
          </TabsContent>
          <TabsContent value="communities" className="mt-4">
            <CommunitiesTab />
          </TabsContent>
          <TabsContent value="links" className="mt-4">
            <LinksTab />
          </TabsContent>
          <TabsContent value="distribution" className="mt-4">
            <DistributionTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
