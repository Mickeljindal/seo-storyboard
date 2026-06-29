import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listArticles } from "@/lib/articles.functions";
import { AppLayout } from "@/components/AppLayout";
import { ArticleSidePanel } from "@/components/ArticleSidePanel";
import { PillarBadge, StatusBadge } from "@/components/Badges";
import { Button } from "@/components/ui/button";
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
import { bulkGenerateBriefs } from "@/lib/ai.functions";
import { useState } from "react";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/briefs")({ component: Briefs });

function Briefs() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const listFn = useServerFn(listArticles);
  const { data: allArticles } = useQuery({
    queryKey: ["articles"],
    queryFn: () => listFn({ data: { orderBy: "updated_at" } }),
  });

  const articles = (allArticles ?? []).filter((a: any) => a.brief != null);
  const missing = (allArticles ?? []).filter((a: any) => a.brief == null).length;
  const total = allArticles?.length ?? 0;

  const bulkFn = useServerFn(bulkGenerateBriefs);
  const bulk = useMutation({
    mutationFn: () => bulkFn({ data: { onlyMissing: true } }),
    onSuccess: (r: any) => {
      toast.success(
        `Generated ${r.success}/${r.total} briefs${r.failed ? ` · ${r.failed} failed` : ""}`,
      );
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Bulk generation failed"),
  });

  const estCost = (missing * 0.005).toFixed(2);
  const estMinutes = Math.max(1, Math.ceil(missing / 30));

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Content Briefs</h1>
            <p className="text-sm text-muted-foreground">
              {articles.length} of {total} ready · {missing} missing
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={bulk.isPending || missing === 0}
                title="Create detailed content briefs (outline, keywords, FAQ) for every article still missing one."
              >
                {bulk.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate all {missing} missing
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Generate {missing} briefs in bulk?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-sm">
                    <p>
                      This calls your configured OpenAI-compatible model once per article, up to 3
                      in parallel.
                    </p>
                    <ul className="ml-4 list-disc text-muted-foreground">
                      <li>
                        <b>~{missing} AI calls</b> against your API key
                      </li>
                      <li>
                        <b>Estimated cost: ~${estCost}</b> (model-dependent)
                      </li>
                      <li>
                        <b>Estimated time: ~{estMinutes} min</b>
                      </li>
                      <li>Existing briefs are skipped — only missing articles run</li>
                    </ul>
                    <p className="text-xs">
                      If you hit a 429 (rate limit) or 402 (out of credits), retry the bulk run
                      later.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => bulk.mutate()}>
                  Generate {missing}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {(articles?.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No briefs yet. Open any article in the Calendar and click "Generate Brief".
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {articles!.map((a) => {
              const b: any = a.brief;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    setActiveId(a.id);
                    setOpen(true);
                  }}
                  className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <PillarBadge pillar={a.pillar} />
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="font-medium">{b?.h1 ?? a.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {b?.meta_description ?? a.target_keyword}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(b?.secondary_keywords ?? []).slice(0, 4).map((k: string) => (
                      <span key={k} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">
                        {k}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <ArticleSidePanel articleId={activeId} open={open} onOpenChange={setOpen} />
    </AppLayout>
  );
}
