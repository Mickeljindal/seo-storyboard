import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Clapperboard, Loader2, Sparkles, Film, Copy, Plus, Check, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  discoverReelIdeasFn,
  generateReelFn,
  listReelsFn,
  reelsStatusFn,
  addReelFn,
} from "@/lib/reels.functions";
import { ReelStoryboard, ReelScenePoster } from "@/components/ReelStoryboard";

export const Route = createFileRoute("/reels")({ component: ReelsPage });

type Beat = { seconds: string; narration: string; on_screen: string; visual_prompt: string };
type Reel = {
  id: string;
  title: string;
  topic: string | null;
  format: string;
  status: string;
  hook: string | null;
  hook_variations: string[];
  script: Beat[] | null;
  voiceover: string | null;
  caption: string | null;
  hashtags: string[];
  cta: string | null;
  duration_seconds: number | null;
  platform_prompts: { sora?: string; veo?: string; ai_studio?: string } | null;
};

const FORMAT_LABEL: Record<string, string> = {
  explainer: "Explainer",
  educational: "Educational",
  how_it_works: "How it works",
  viral: "Viral",
  comparison: "Comparison",
  listicle: "Listicle",
  myth_bust: "Myth-bust",
  tutorial: "Tutorial",
};

function ReelsPage() {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  // Progress of a "generate all scripts" run (n done of total pending ideas).
  const [bulkGen, setBulkGen] = useState<{ done: number; total: number } | null>(null);

  const statusFn = useServerFn(reelsStatusFn);
  const listFn = useServerFn(listReelsFn);
  const discoverFn = useServerFn(discoverReelIdeasFn);
  const genFn = useServerFn(generateReelFn);
  const addFn = useServerFn(addReelFn);

  const { data: status } = useQuery({ queryKey: ["reels-status"], queryFn: () => statusFn({}) });
  const { data: reels, isLoading } = useQuery({
    queryKey: ["reels"],
    queryFn: () => listFn({ data: { limit: 200 } }),
  });

  const items = (reels?.items ?? []) as Reel[];
  const ideas = items.filter((r) => r.status === "idea");
  const scripted = items.filter((r) => r.status !== "idea");
  const invalidate = () => qc.invalidateQueries({ queryKey: ["reels"] });

  const discoverMut = useMutation({
    mutationFn: () => discoverFn({ data: { limit: 12 } }),
    onSuccess: (r) => {
      toast.success(`Added ${r.saved} reel ideas`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Generate scripts for every pending idea, one at a time (each is an AI call).
  // Sequential keeps it gentle on rate limits and lets progress update live.
  const generateAll = async (pending: Reel[]) => {
    if (!pending.length || bulkGen) return;
    setBulkGen({ done: 0, total: pending.length });
    let ok = 0;
    for (let i = 0; i < pending.length; i++) {
      try {
        await genFn({ data: { reelId: pending[i].id } });
        ok++;
      } catch {
        /* skip failures, keep going */
      }
      setBulkGen({ done: i + 1, total: pending.length });
      invalidate();
    }
    setBulkGen(null);
    toast.success(`Generated ${ok}/${pending.length} scripts`);
  };

  const addMut = useMutation({
    mutationFn: () => addFn({ data: { title: newTitle.trim() } }),
    onSuccess: () => {
      toast.success("Reel idea added");
      setNewTitle("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generate = async (id: string) => {
    setBusyId(id);
    try {
      await genFn({ data: { reelId: id } });
      toast.success("Script + prompts generated");
      setOpenId(id);
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const open = scripted.find((r) => r.id === openId) ?? null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 py-8">
        <header className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Clapperboard className="h-3 w-3 text-primary" />
            Reels Studio
          </div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">
            Short-video ideas & scripts
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            From the same Kloudbean knowledge: educational, explainer and how-it-works reels with
            beat-by-beat scripts and ready-to-paste prompts for Sora, Google Veo, and Google AI
            Studio.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusPill ok={!!status?.aiReady} label="AI" />
            <span className="text-xs text-muted-foreground">{reels?.total ?? 0} reels</span>
            <Button
              className="ml-auto"
              onClick={() => discoverMut.mutate()}
              disabled={discoverMut.isPending}
              title="Suggest short-video ideas from what the engine knows about Kloudbean."
              style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}
            >
              {discoverMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Discover reel ideas
            </Button>
          </div>
        </header>

        {/* Add */}
        <div className="mb-8 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card/40 p-3">
          <div className="flex-1 min-w-[260px]">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
              Reel idea
            </label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. How CDN caching makes your site 5x faster"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => addMut.mutate()}
            disabled={addMut.isPending || newTitle.trim().length < 3}
          >
            {addMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add idea
          </Button>
        </div>

        {/* Ideas */}
        <SectionHead
          title="Ideas"
          desc={`${ideas.length} pending`}
          action={
            ideas.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                disabled={!!bulkGen}
                onClick={() => generateAll(ideas)}
                title="Write full scripts + AI-video prompts for every pending idea (one AI call each)."
              >
                {bulkGen ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                {bulkGen ? `Generating ${bulkGen.done}/${bulkGen.total}` : `Generate all (${ideas.length})`}
              </Button>
            ) : null
          }
        />
        {ideas.length === 0 ? (
          <Empty>Discover ideas from the knowledge graph or add one above.</Empty>
        ) : (
          <div className="mb-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ideas.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card/60 p-4">
                <div className="mb-1 inline-block rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] uppercase">
                  {FORMAT_LABEL[r.format] ?? r.format}
                </div>
                <div className="font-medium leading-snug">{r.title}</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                  disabled={busyId === r.id}
                  onClick={() => generate(r.id)}
                  title="Write the full video script, captions and ready-to-paste AI-video prompts."
                >
                  {busyId === r.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Film className="mr-2 h-4 w-4" />
                  )}
                  Generate script
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Scripted */}
        <SectionHead title="Scripted reels" desc={`${scripted.length} ready`} />
        {scripted.length === 0 ? (
          <Empty>Generate a script from an idea to see beats + AI-video prompts.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {scripted.map((r) => (
              <button
                key={r.id}
                onClick={() => setOpenId(r.id)}
                title="Open this reel to watch the animated preview + see the script and AI-video prompts."
                className={`flex gap-3 rounded-lg border bg-card/60 p-3 text-left transition-colors hover:border-primary/50 ${
                  openId === r.id ? "border-primary" : "border-border"
                }`}
              >
                <ReelScenePoster beats={r.script} className="h-24 w-[54px] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] uppercase">
                      {FORMAT_LABEL[r.format] ?? r.format}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {r.duration_seconds ?? 45}s · {r.script?.length ?? 0} beats
                    </span>
                  </div>
                  <div className="mt-1 font-medium leading-snug">{r.title}</div>
                  {r.hook && (
                    <div className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                      “{r.hook}”
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {isLoading && <div className="py-8 text-center text-muted-foreground">Loading reels…</div>}
      </div>

      {open && <ReelDetail reel={open} onClose={() => setOpenId(null)} />}
    </AppLayout>
  );
}

function ReelDetail({ reel, onClose }: { reel: Reel; onClose: () => void }) {
  const pp = reel.platform_prompts ?? {};
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-background p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-display text-xl font-semibold">{reel.title}</h2>
            <div className="mt-1 text-xs text-muted-foreground">
              {FORMAT_LABEL[reel.format] ?? reel.format} · {reel.duration_seconds ?? 45}s
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {reel.script?.length ? (
          <Block title="Animated preview">
            <p className="mb-3 text-[11px] text-muted-foreground">
              A shot-by-shot animation of the reel — watch the flow, timing and message before you
              send the prompts to Sora/Veo. Tap the left/right of the frame to step through beats.
            </p>
            <ReelStoryboard
              beats={reel.script}
              hook={reel.hook}
              formatLabel={FORMAT_LABEL[reel.format] ?? reel.format}
            />
          </Block>
        ) : null}

        {reel.hook && (
          <Block title="Hook">
            <p className="text-sm">“{reel.hook}”</p>
            {reel.hook_variations?.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {reel.hook_variations.map((h, i) => (
                  <li key={i}>· {h}</li>
                ))}
              </ul>
            )}
          </Block>
        )}

        {reel.script?.length ? (
          <Block title="Beat-by-beat script">
            <div className="space-y-2">
              {reel.script.map((b, i) => (
                <div key={i} className="rounded-md border border-border bg-card/50 p-3 text-xs">
                  <div className="mb-1 font-mono text-[10px] text-primary">{b.seconds}s</div>
                  <p className="text-foreground">{b.narration}</p>
                  {b.on_screen && (
                    <p className="mt-1 text-muted-foreground">On-screen: {b.on_screen}</p>
                  )}
                  {b.visual_prompt && (
                    <p className="mt-1 italic text-muted-foreground">🎬 {b.visual_prompt}</p>
                  )}
                </div>
              ))}
            </div>
          </Block>
        ) : null}

        {reel.voiceover && (
          <Block title="Voiceover (TTS)" copy={reel.voiceover}>
            <p className="text-xs leading-relaxed text-foreground/85">{reel.voiceover}</p>
          </Block>
        )}

        {pp.sora && (
          <Block title="Sora prompt" copy={pp.sora}>
            <Pre>{pp.sora}</Pre>
          </Block>
        )}
        {pp.veo && (
          <Block title="Google Veo prompt" copy={pp.veo}>
            <Pre>{pp.veo}</Pre>
          </Block>
        )}
        {pp.ai_studio && (
          <Block title="Google AI Studio brief" copy={pp.ai_studio}>
            <Pre>{pp.ai_studio}</Pre>
          </Block>
        )}

        {reel.caption && (
          <Block title="Caption" copy={reel.caption}>
            <p className="text-xs">{reel.caption}</p>
          </Block>
        )}
        {reel.hashtags?.length > 0 && (
          <Block title="Hashtags" copy={reel.hashtags.map((h) => `#${h}`).join(" ")}>
            <div className="flex flex-wrap gap-1">
              {reel.hashtags.map((h) => (
                <span key={h} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">
                  #{h}
                </span>
              ))}
            </div>
          </Block>
        )}
        {reel.cta && (
          <Block title="CTA">
            <p className="text-xs">{reel.cta}</p>
          </Block>
        )}
      </div>
    </div>
  );
}

function Block({
  title,
  children,
  copy,
}: {
  title: string;
  children: React.ReactNode;
  copy?: string;
}) {
  const [done, setDone] = useState(false);
  const doCopy = async () => {
    if (!copy) return;
    try {
      await navigator.clipboard.writeText(copy);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {copy && (
          <button
            onClick={doCopy}
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {done ? "Copied" : "Copy"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-card/50 p-3 text-[11px] leading-relaxed text-foreground/85">
      {children}
    </pre>
  );
}

function SectionHead({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-6 border-b border-border pb-3">
      <div className="flex items-baseline gap-4">
        <h2 className="text-display text-2xl font-semibold tracking-tight">{title}</h2>
        {desc && <span className="text-xs text-muted-foreground">{desc}</span>}
      </div>
      {action}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-10 rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
        ok ? "border-[var(--lime)]/40 text-[var(--lime)]" : "border-amber-500/40 text-amber-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-[var(--lime)]" : "bg-amber-400"}`} />
      {label}
    </span>
  );
}
