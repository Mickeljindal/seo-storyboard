import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getArticle, updateArticle } from "@/lib/articles.functions";
import { generateBrief, generateContent } from "@/lib/ai.functions";
import { applyResearchToArticle } from "@/lib/dataforseo.functions";
import { IntentBadge, OpportunityBadge } from "@/components/seo/IntentBadge";
import type { KeywordResearch } from "@/lib/seo-types";
import { publishToWordPress, markArticlePublished } from "@/lib/wordpress.functions";
import { STATUSES, pillarMeta, statusLabel } from "@/lib/pillars";
import { StatusBadge, PillarBadge } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Sparkles,
  Search,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
  PenLine,
  CheckCircle2,
  Gauge,
  Share2,
  Linkedin,
  Twitter,
  Mail,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { getUnifiedScoreFn } from "@/lib/unified-score.functions";
import { listDistributionsFn, generateDistributionFn } from "@/lib/distribution.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type QualityCheck = {
  id: string;
  label: string;
  weight: number;
  earned: number;
  pass: boolean;
  detail: string;
};
type QualityReport = {
  score: number;
  grade: string;
  summary: string;
  blocking: boolean;
  banned_claims: string[];
  checks: QualityCheck[];
  passes: number;
  internal_links?: { resolved: number; total: number };
  rag_sources?: { title: string; url: string }[];
};

export function ArticleSidePanel({
  articleId,
  open,
  onOpenChange,
}: {
  articleId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const getFn = useServerFn(getArticle);
  const updateFn = useServerFn(updateArticle);
  const { data: article, refetch } = useQuery({
    enabled: !!articleId,
    queryKey: ["article", articleId],
    queryFn: () => getFn({ data: { id: articleId! } }),
  });

  const [notes, setNotes] = useState("");
  useEffect(() => {
    setNotes(article?.notes ?? "");
  }, [article?.id]);

  const briefFn = useServerFn(generateBrief);
  const contentFn = useServerFn(generateContent);
  const researchFn = useServerFn(applyResearchToArticle);
  const publishFn = useServerFn(publishToWordPress);
  const markPublishedFn = useServerFn(markArticlePublished);

  const briefMut = useMutation({
    mutationFn: () => briefFn({ data: { articleId: articleId! } }),
    onSuccess: () => {
      toast.success("Brief generated");
      refetch();
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const researchMut = useMutation({
    mutationFn: () => researchFn({ data: { articleId: articleId! } }),
    onSuccess: (r: { mock?: boolean }) => {
      toast.success(
        r.mock ? "Research complete (mock — add SERPER_API_KEY)" : "Live SERP research applied",
      );
      refetch();
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  const contentMut = useMutation({
    mutationFn: () => contentFn({ data: { articleId: articleId! } }),
    onSuccess: () => {
      toast.success("Draft content generated");
      refetch();
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  const publishMut = useMutation({
    mutationFn: (status: "draft" | "publish") =>
      publishFn({ data: { articleId: articleId!, status } }),
    onSuccess: (r: { link?: string; message?: string; updated?: boolean }) => {
      toast.success(
        r.link
          ? `${r.updated ? "Updated" : "Published"} → ${r.link}`
          : (r.message ?? "Sent to WordPress"),
      );
      refetch();
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e: any) => toast.error(e.message ?? "WordPress publish failed"),
  });

  const markPublishedMut = useMutation({
    mutationFn: () => markPublishedFn({ data: { articleId: articleId! } }),
    onSuccess: () => {
      toast.success("Marked as published — system updated & learning recorded");
      refetch();
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["topical-map"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to mark published"),
  });

  async function updateField(patch: Record<string, unknown>) {
    await updateFn({ data: { id: articleId!, patch } });
    refetch();
    qc.invalidateQueries({ queryKey: ["articles"] });
  }

  const scoreFn = useServerFn(getUnifiedScoreFn);
  const { data: unifiedScore } = useQuery({
    enabled: !!articleId,
    queryKey: ["unified-score", articleId],
    queryFn: () => scoreFn({ data: { articleId: articleId! } }),
  });

  const distFn = useServerFn(listDistributionsFn);
  const genDistFn = useServerFn(generateDistributionFn);
  const { data: distributions, refetch: refetchDist } = useQuery({
    enabled: !!articleId,
    queryKey: ["distributions", articleId],
    queryFn: () => distFn({ data: { articleId: articleId! } }),
  });
  const distMut = useMutation({
    mutationFn: () => genDistFn({ data: { articleId: articleId! } }),
    onSuccess: () => {
      toast.success("Distribution drafts generated — review before posting");
      refetchDist();
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });

  if (!article)
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent />
      </Sheet>
    );
  const p = pillarMeta(article.pillar);
  const kd = article.keyword_data as KeywordResearch | null;
  const brief: Record<string, unknown> | null = article.brief as Record<string, unknown> | null;
  const quality = article.quality_report as QualityReport | null;
  const blocked = !!quality?.blocking;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <PillarBadge pillar={article.pillar} />
            <span className="text-xs text-muted-foreground">
              Pillar {article.pillar} · {p.name}
            </span>
          </div>
          <SheetTitle className="text-pretty leading-snug">{article.title}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-secondary px-2 py-0.5 text-xs">
              {article.target_keyword}
            </code>
            <StatusBadge status={article.status} />
            <span className="text-xs text-muted-foreground">
              Week {article.scheduled_week ?? "—"}
            </span>
          </div>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Select value={article.status} onValueChange={(v) => updateField({ status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={article.priority ?? "medium"}
            onValueChange={(v) => updateField({ priority: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High priority</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={researchMut.isPending || !article.target_keyword}
            onClick={() => researchMut.mutate()}
          >
            {researchMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            SERP Research
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" disabled={briefMut.isPending}>
                {briefMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {brief ? "Regenerate Brief" : "Generate Brief"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Generate AI brief?</AlertDialogTitle>
                <AlertDialogDescription>
                  Uses your configured AI model (DeepSeek or OPENAI_API_KEY). The result is saved to
                  the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => briefMut.mutate()}>Generate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            size="sm"
            variant="secondary"
            disabled={!brief || contentMut.isPending}
            onClick={() => contentMut.mutate()}
          >
            {contentMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PenLine className="mr-2 h-4 w-4" />
            )}
            {article.content_draft ? "Regenerate draft" : "Write draft"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={!brief || publishMut.isPending || blocked}
            onClick={() => publishMut.mutate("draft")}
          >
            {publishMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send to WP (Draft)
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="default"
                disabled={!brief || publishMut.isPending || blocked}
              >
                <Send className="mr-2 h-4 w-4" /> Auto-Publish to WordPress
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Publish to kloudbean.com now?</AlertDialogTitle>
                <AlertDialogDescription>
                  This pushes the article to your WordPress site as a <b>live published</b> post via
                  the WP REST API. Make sure WordPress credentials are configured in Settings.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => publishMut.mutate("publish")}>
                  Publish live
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            size="sm"
            variant={article.status === "published" ? "secondary" : "outline"}
            disabled={markPublishedMut.isPending}
            onClick={() => markPublishedMut.mutate()}
          >
            {markPublishedMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {article.status === "published" ? "Published ✓" : "Mark as published"}
          </Button>
        </div>

        {article.published_url && (
          <div className="mt-3 rounded-md border border-border bg-card p-2 text-xs">
            Published URL:{" "}
            <a
              className="text-primary hover:underline"
              href={article.published_url}
              target="_blank"
              rel="noreferrer"
            >
              {article.published_url}
            </a>
          </div>
        )}

        {(kd || article.meta_title) && (
          <section className="mt-6 rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">SEO Intelligence</h3>
            {kd && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <IntentBadge intent={kd.search_intent} />
                <span className="text-xs text-muted-foreground">Opportunity</span>
                <OpportunityBadge score={kd.opportunity_score ?? 0} />
              </div>
            )}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Stat label="Volume / mo" value={kd?.monthly_volume?.toLocaleString() ?? "—"} />
              <Stat label="CPC" value={kd?.cpc != null ? `$${Number(kd.cpc).toFixed(2)}` : "—"} />
              <Stat
                label="Difficulty"
                value={kd?.difficulty != null ? `${kd.difficulty}/100` : "—"}
              />
            </div>
            {(article.meta_title || kd?.meta_title) && (
              <div className="mt-4 space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Meta title ({(article.meta_title ?? kd?.meta_title ?? "").length}/60)
                  </div>
                  <div className="text-sm font-medium">{article.meta_title ?? kd?.meta_title}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Meta description (
                    {(article.meta_description ?? kd?.meta_description ?? "").length}/160)
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {article.meta_description ?? kd?.meta_description}
                  </div>
                </div>
              </div>
            )}
            {kd?.content_angle && (
              <div className="mt-3 text-xs">
                <span className="font-medium text-muted-foreground">Angle: </span>
                {kd.content_angle}
              </div>
            )}
            {kd?.topic_recommendations && kd.topic_recommendations.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Topics to cover
                </div>
                <ul className="space-y-0.5 text-xs">
                  {kd.topic_recommendations.slice(0, 6).map((t) => (
                    <li key={t}>· {t}</li>
                  ))}
                </ul>
              </div>
            )}
            {kd?.serp_features && kd.serp_features.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {kd.serp_features.map((f) => (
                  <span key={f} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">
                    {f}
                  </span>
                ))}
              </div>
            )}
            {kd?.paa_questions && kd.paa_questions.length > 0 && (
              <div className="mt-4">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  People Also Ask
                </div>
                <ul className="space-y-1 text-sm">
                  {kd.paa_questions.slice(0, 8).map((q, i) => (
                    <li key={i}>· {q}</li>
                  ))}
                </ul>
              </div>
            )}
            {kd?.top_10_urls && kd.top_10_urls.length > 0 && (
              <div className="mt-4">
                <div className="mb-1 text-xs font-medium text-muted-foreground">Top SERP URLs</div>
                <ul className="space-y-1 text-xs">
                  {kd.top_10_urls.slice(0, 5).map((u) => (
                    <li key={u} className="truncate">
                      <a
                        className="text-primary hover:underline"
                        href={u}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {u}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => researchMut.mutate()}>
              <RefreshCw className="mr-1.5 h-3 w-3" /> Refresh SERP data
            </Button>
          </section>
        )}

        {brief && (
          <section className="mt-4 rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Content Brief</h3>
            <div className="space-y-3 text-sm">
              {brief.h1 && (
                <div>
                  <div className="text-xs text-muted-foreground">H1</div>
                  <div className="font-medium">{brief.h1}</div>
                </div>
              )}
              {brief.search_intent && (
                <div>
                  <span className="text-xs text-muted-foreground">Intent: </span>
                  {brief.search_intent} · target {brief.word_count ?? 2500} words
                </div>
              )}
              {brief.meta_title && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Meta title ({brief.meta_title.length}/60)
                  </div>
                  <div>{brief.meta_title}</div>
                </div>
              )}
              {brief.meta_description && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Meta description ({brief.meta_description.length}/160)
                  </div>
                  <div>{brief.meta_description}</div>
                </div>
              )}
              {Array.isArray(brief.outline) && (
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">Outline</div>
                  <ol className="space-y-2">
                    {brief.outline.map((h2: any, i: number) => (
                      <li key={i}>
                        <div className="font-medium">H2. {h2.h2}</div>
                        {h2.description && (
                          <div className="text-xs text-muted-foreground">{h2.description}</div>
                        )}
                        {Array.isArray(h2.h3) && (
                          <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs">
                            {h2.h3.map((h3: any, j: number) => (
                              <li key={j}>
                                <span className="font-medium">{h3.title}</span>
                                {h3.description && <> — {h3.description}</>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {Array.isArray(brief.competing_urls) && brief.competing_urls.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground">Competing URLs</div>
                  <ul className="space-y-0.5 text-xs">
                    {brief.competing_urls.map((u: string) => (
                      <li key={u}>
                        <a
                          className="text-primary hover:underline"
                          href={u}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {u} <ExternalLink className="ml-1 inline h-3 w-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {brief.cta && (
                <div>
                  <span className="text-xs text-muted-foreground">CTA: </span>
                  {brief.cta}
                </div>
              )}
            </div>
          </section>
        )}

        {quality && (
          <section className="mt-4 rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Quality Scorecard</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-md text-sm font-bold ${
                    quality.score >= 80
                      ? "bg-emerald-500/15 text-emerald-500"
                      : quality.score >= 70
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {quality.score}
                </span>
                <span className="text-xs text-muted-foreground">{quality.grade}</span>
              </div>
            </div>
            <p className={`mb-3 text-xs ${blocked ? "text-destructive" : "text-muted-foreground"}`}>
              {quality.summary}
            </p>

            {blocked && quality.banned_claims?.length > 0 && (
              <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                <div className="mb-1 font-semibold">Publishing blocked — fix these claims:</div>
                <ul className="list-disc space-y-0.5 pl-4">
                  {quality.banned_claims.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                <div className="mt-2">
                  Regenerate the draft after the engine corrects these, or edit the source facts.
                </div>
              </div>
            )}

            <div className="space-y-1">
              {quality.checks?.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={c.pass ? "text-emerald-500" : "text-amber-500"}>
                      {c.pass ? "✓" : "○"}
                    </span>
                    {c.label}
                  </span>
                  <span className="text-muted-foreground">{c.detail}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              {quality.internal_links && (
                <span>
                  Internal links: {quality.internal_links.resolved}/{quality.internal_links.total}
                </span>
              )}
              {typeof quality.passes === "number" && <span>Editor passes: {quality.passes}</span>}
              {quality.rag_sources && quality.rag_sources.length > 0 && (
                <span>KB sources: {quality.rag_sources.length}</span>
              )}
            </div>
          </section>
        )}

        {unifiedScore && (
          <section className="mt-4 rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                <Gauge className="h-4 w-4 text-primary" /> Unified Score (revenue-aware)
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-md text-sm font-bold ${
                    unifiedScore.score >= 70
                      ? "bg-emerald-500/15 text-emerald-500"
                      : unifiedScore.score >= 45
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {unifiedScore.score}
                </span>
                <span className="text-xs text-muted-foreground">{unifiedScore.grade}</span>
              </div>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">{unifiedScore.summary}</p>
            <div className="space-y-1.5">
              {Object.entries(unifiedScore.breakdown).map(([key, b]) => (
                <div key={key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="w-20 shrink-0 capitalize text-muted-foreground">
                    {key} ({b.weight}%)
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${b.score}%` }}
                    />
                  </div>
                  <span className="w-40 shrink-0 truncate text-right text-muted-foreground">
                    {b.detail}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-4 rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <Share2 className="h-4 w-4 text-primary" /> Distribution
            </h3>
            <Button
              size="sm"
              variant="outline"
              disabled={distMut.isPending}
              onClick={() => distMut.mutate()}
              title="Draft a LinkedIn post, X thread, and newsletter blurb from this article. You review and post manually."
            >
              {distMut.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              )}
              {distributions?.items?.length ? "Regenerate" : "Generate drafts"}
            </Button>
          </div>
          {!distributions?.items?.length ? (
            <p className="text-xs text-muted-foreground">
              No drafts yet. Generates a LinkedIn post, an X thread, and a newsletter blurb —
              nothing is posted automatically, you copy and post it yourself.
            </p>
          ) : (
            <div className="space-y-3">
              {distributions.items.map((d) => (
                <DistributionCard key={d.id} distribution={d} />
              ))}
            </div>
          )}
        </section>

        {article.content_draft && (
          <section className="mt-4 rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold">Draft content</h3>
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap text-xs text-muted-foreground">
              {article.content_draft.slice(0, 4000)}
              {article.content_draft.length > 4000 ? "\n\n…" : ""}
            </pre>
          </section>
        )}

        <section className="mt-4">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Notes</div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => updateField({ notes })}
            placeholder="Internal notes…"
          />
        </section>
      </SheetContent>
    </Sheet>
  );
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error("Could not copy — select and copy manually"));
}

function DistributionCard({
  distribution,
}: {
  distribution: { id: string; channel: string; content: Record<string, unknown>; status: string };
}) {
  const c = distribution.content;
  if (distribution.channel === "linkedin") {
    const post = String(c.post ?? "");
    const hashtags = Array.isArray(c.hashtags) ? (c.hashtags as string[]) : [];
    return (
      <div className="rounded-md border border-border bg-background/50 p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" /> LinkedIn
          </span>
          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(post, "LinkedIn post")}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <p className="whitespace-pre-wrap text-xs text-muted-foreground">{post}</p>
        {hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {hashtags.map((h) => (
              <span key={h} className="rounded bg-secondary/60 px-1.5 py-0.5 text-[10px]">
                {h.startsWith("#") ? h : `#${h}`}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (distribution.channel === "x_thread") {
    const tweets = Array.isArray(c.tweets) ? (c.tweets as string[]) : [];
    return (
      <div className="rounded-md border border-border bg-background/50 p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <Twitter className="h-3.5 w-3.5" /> X thread ({tweets.length} tweets)
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(tweets.join("\n\n"), "Thread")}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <ol className="space-y-1.5">
          {tweets.map((t, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              <span className="mr-1 font-mono text-[10px] text-primary">{i + 1}.</span>
              {t}
            </li>
          ))}
        </ol>
      </div>
    );
  }
  // newsletter
  const subject = String(c.subject ?? "");
  const preview = String(c.preview ?? "");
  const body = String(c.body ?? "");
  return (
    <div className="rounded-md border border-border bg-background/50 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <Mail className="h-3.5 w-3.5" /> Newsletter
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => copyToClipboard(`${subject}\n${preview}\n\n${body}`, "Newsletter blurb")}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <div className="text-xs font-medium">{subject}</div>
      <div className="text-[11px] text-muted-foreground">{preview}</div>
      <p className="mt-1.5 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-base font-semibold">{value}</div>
    </div>
  );
}
