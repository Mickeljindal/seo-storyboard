import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import {
  Clapperboard,
  Image as ImageIcon,
  Film,
  Copy,
  X,
  Sparkles,
  Loader2,
  Database,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { downloadStagePng } from "@/lib/download-image";
import {
  SOCIAL_POSTS,
  VIDEO_SCRIPTS,
  ICP_NAMES,
  type IcpId,
  type SocialPost,
  type VideoScript,
} from "@/lib/studio-content";
import { generateStudioContentFn, studioSourcesStatusFn } from "@/lib/studio.functions";
import { BrandCard } from "@/components/studio/BrandCard";
import { BrandStoryboard } from "@/components/studio/BrandStoryboard";

export const Route = createFileRoute("/studio")({ component: StudioPage });

type Tab = "social" | "reel" | "youtube";

const ICP_FILTERS: (IcpId | "all")[] = [
  "all",
  "vibecoder",
  "saas_founder",
  "ai_agency",
  "freelance_dev",
  "wp_agency",
  "enterprise_gov",
  "general",
];

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Copy failed"),
  );
}

const isDynamic = (id: string) => id.startsWith("gs-");

function dedupeById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

/** Ready-to-post caption for a video: the generated one, else derived from beats. */
function videoCaption(v: VideoScript): string {
  if (v.caption && v.caption.trim()) return v.caption.trim();
  const first = v.beats[0]?.narration ?? "";
  const last = v.beats[v.beats.length - 1]?.narration ?? "";
  return [first, last].filter(Boolean).join(" ") || v.cta;
}
function videoTags(v: VideoScript): string[] {
  return v.tags && v.tags.length ? v.tags : ["ManagedCloud", "KloudBean"];
}

function StudioPage() {
  const [tab, setTab] = useState<Tab>("social");
  const [icp, setIcp] = useState<IcpId | "all">("all");
  const [openSocial, setOpenSocial] = useState<string | null>(null);
  const [openVideo, setOpenVideo] = useState<string | null>(null);
  const [dynSocial, setDynSocial] = useState<SocialPost[]>([]);
  const [dynVideos, setDynVideos] = useState<VideoScript[]>([]);
  const socialRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadRender = async (ref: React.RefObject<HTMLDivElement | null>, name: string) => {
    if (!ref.current) return;
    setDownloading(true);
    try {
      await downloadStagePng(ref.current, name);
      toast.success("Image downloaded");
    } catch (e) {
      toast.error(`Download failed: ${(e as Error).message}`);
    } finally {
      setDownloading(false);
    }
  };

  const sourcesFn = useServerFn(studioSourcesStatusFn);
  const { data: sourcesData } = useQuery({
    queryKey: ["studio-sources"],
    queryFn: () => sourcesFn({}),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const sources = sourcesData?.sources;

  const genFn = useServerFn(generateStudioContentFn);
  const gen = useMutation({
    mutationFn: (vars: { kind: "social" | "video"; exclude: string[] }) =>
      genFn({ data: { kind: vars.kind, count: 8, exclude: vars.exclude } }),
    onSuccess: (res) => {
      if (!res?.ok) {
        toast.error("No source data yet — import SEMrush or run discovery, then try again.");
        return;
      }
      if (res.posts?.length) setDynSocial((prev) => dedupeById([...res.posts!, ...prev]));
      if (res.videos?.length) setDynVideos((prev) => dedupeById([...res.videos!, ...prev]));
      const n = res.posts?.length ?? res.videos?.length ?? 0;
      toast.success(
        `Generated ${n} ${res.usedAi ? "AI" : "template"} ${n === 1 ? "item" : "items"} from your data`,
      );
    },
    onError: (e: Error) => toast.error(`Generation failed: ${e.message}`),
  });

  const allPosts = useMemo(() => [...dynSocial, ...SOCIAL_POSTS], [dynSocial]);
  const allVideos = useMemo(() => [...dynVideos, ...VIDEO_SCRIPTS], [dynVideos]);

  const posts = useMemo(
    () => allPosts.filter((p) => icp === "all" || p.icp === icp),
    [allPosts, icp],
  );
  const videos = useMemo(
    () => allVideos.filter((v) => icp === "all" || v.icp === icp),
    [allVideos, icp],
  );

  const selPost = allPosts.find((p) => p.id === openSocial) ?? null;
  const selVideo = allVideos.find((v) => v.id === openVideo) ?? null;
  const fmt = tab === "reel" ? "reel" : "youtube";

  const kind: "social" | "video" = tab === "social" ? "social" : "video";
  const generatedCount = kind === "social" ? dynSocial.length : dynVideos.length;
  const onGenerate = () => {
    const exclude =
      kind === "social"
        ? allPosts.map((p) => p.headline.replace(/\n/g, " "))
        : allVideos.map((v) => v.title);
    gen.mutate({ kind, exclude });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 py-8">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Clapperboard className="h-3 w-3 text-primary" />
            Media Studio
          </div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">
            Brand social & video studio
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            On-brand social posts and videos — reels (9:16) and YouTube (16:9) — built from the same
            Kloudbean brand system. Generate fresh content from your live SEO data (competitor
            keywords, topics and the knowledge graph), preview it with voiceover, and copy the
            caption, hashtags or voiceover script.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(["social", "reel", "youtube"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "social" ? <ImageIcon className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                {t === "social" ? "Social posts" : t === "reel" ? "Reels · 9:16" : "YouTube · 16:9"}
                <span className="font-mono text-[11px] opacity-70">
                  {t === "social" ? posts.length : videos.length}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            {ICP_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setIcp(f)}
                className={`rounded-full border px-2.5 py-1 ${icp === f ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {f === "all" ? "All audiences" : ICP_NAMES[f]}
              </button>
            ))}
          </div>

          {/* Dynamic generation toolbar — draws from the engine's real data. */}
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-3">
            <Database className="h-4 w-4 shrink-0 text-primary" />
            <div className="text-xs text-muted-foreground">
              {sources ? (
                <span>
                  Drawing from <b className="text-foreground">{sources.opportunities}</b> competitor
                  keywords · <b className="text-foreground">{sources.articleIdeas}</b> topic ideas ·{" "}
                  <b className="text-foreground">{sources.keywords}</b> keywords ·{" "}
                  <b className="text-foreground">{sources.kgEntities}</b> graph entities
                  {" · "}
                  {sources.aiReady ? (
                    <span className="text-[var(--lime)]">AI ready</span>
                  ) : (
                    <span className="text-amber-400">AI off — using templates</span>
                  )}
                </span>
              ) : (
                <span>Checking your data sources…</span>
              )}
            </div>
            <button
              onClick={onGenerate}
              disabled={gen.isPending}
              className="ml-auto inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
              title="Generate on-brand content from your live SEO data"
            >
              {gen.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {gen.isPending
                ? "Generating…"
                : generatedCount > 0
                  ? `Generate more ${kind === "social" ? "posts" : "videos"}`
                  : `Generate ${kind === "social" ? "posts" : "videos"} from your data`}
            </button>
          </div>
        </header>

        {tab === "social" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {posts.map((p) => (
              <button
                key={p.id}
                onClick={() => setOpenSocial(p.id)}
                className="group relative overflow-hidden rounded-xl border border-border transition-colors hover:border-primary/50"
                title="Open preview"
              >
                <BrandCard post={p} radius={0} />
                {isDynamic(p.id) && <NewBadge />}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((v) => (
              <button
                key={v.id}
                onClick={() => setOpenVideo(v.id)}
                className="group relative rounded-xl border border-border p-2 text-left transition-colors hover:border-primary/50"
                title="Open animated preview"
              >
                <BrandStoryboard script={v} format={fmt} poster />
                {isDynamic(v.id) && <NewBadge />}
                <div className="px-1 pt-2">
                  <div className="line-clamp-1 text-sm font-medium">{v.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {ICP_NAMES[v.icp]} · {v.beats.length} beats
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selPost && (
        <Modal onClose={() => setOpenSocial(null)} title={ICP_NAMES[selPost.icp]}>
          <div className="mx-auto w-full max-w-[440px]" ref={socialRef}>
            <BrandCard post={selPost} />
          </div>
          <div className="mt-4 space-y-3">
            <Field
              label="Caption"
              value={selPost.caption}
              onCopy={() => copy(selPost.caption, "Caption")}
            />
            <Field
              label="Hashtags"
              value={selPost.tags.map((t) => `#${t}`).join(" ")}
              onCopy={() => copy(selPost.tags.map((t) => `#${t}`).join(" "), "Hashtags")}
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  copy(
                    `${selPost.caption}\n\n${selPost.tags.map((t) => `#${t}`).join(" ")}`,
                    "Post",
                  )
                }
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Copy className="h-4 w-4" /> Copy full post
              </button>
              <button
                onClick={() => downloadRender(socialRef, `kloudbean-${selPost.icp}-post`)}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary/50 disabled:opacity-60"
                title="Download this post as a 1080x1080 PNG"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}{" "}
                Download PNG
              </button>
            </div>
          </div>
        </Modal>
      )}

      {selVideo && (
        <Modal
          onClose={() => setOpenVideo(null)}
          title={`${selVideo.title} · ${fmt === "reel" ? "Reel 9:16" : "YouTube 16:9"}`}
        >
          <div
            ref={videoRef}
            className={`mx-auto w-full ${fmt === "reel" ? "max-w-[300px]" : "max-w-[720px]"}`}
          >
            <BrandStoryboard script={selVideo} format={fmt} />
          </div>
          <div className="mt-4 space-y-3">
            <Field
              label="Caption"
              value={videoCaption(selVideo)}
              onCopy={() => copy(videoCaption(selVideo), "Caption")}
              multiline
            />
            <Field
              label="Hashtags"
              value={videoTags(selVideo)
                .map((t) => `#${t}`)
                .join(" ")}
              onCopy={() =>
                copy(
                  videoTags(selVideo)
                    .map((t) => `#${t}`)
                    .join(" "),
                  "Hashtags",
                )
              }
            />
            <Field
              label="Voiceover script"
              value={selVideo.beats.map((b) => b.narration).join(" ")}
              onCopy={() => copy(selVideo.beats.map((b) => b.narration).join(" "), "Voiceover")}
              multiline
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  copy(
                    `${videoCaption(selVideo)}\n\n${videoTags(selVideo)
                      .map((t) => `#${t}`)
                      .join(" ")}`,
                    "Post",
                  )
                }
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Copy className="h-4 w-4" /> Copy caption + hashtags
              </button>
              <button
                onClick={() => downloadRender(videoRef, `kloudbean-${selVideo.id}-${fmt}-frame`)}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary/50 disabled:opacity-60"
                title="Download the current frame as a PNG (step through beats to pick the frame)"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}{" "}
                Download frame
              </button>
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Beats
              </div>
              <ol className="space-y-1 text-xs">
                {selVideo.beats.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono text-primary">{b.on_screen}</span>
                    <span className="text-muted-foreground">— {b.narration}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}

function NewBadge() {
  return (
    <span className="absolute right-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
      New
    </span>
  );
}

function Field({
  label,
  value,
  onCopy,
  multiline,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          <Copy className="h-3 w-3" /> Copy
        </button>
      </div>
      <div className={`text-sm text-foreground/90 ${multiline ? "leading-relaxed" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
