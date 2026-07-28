import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Clapperboard, Image as ImageIcon, Film, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { SOCIAL_POSTS, VIDEO_SCRIPTS, ICP_NAMES, type IcpId } from "@/lib/studio-content";
import { BrandCard } from "@/components/studio/BrandCard";
import { BrandStoryboard } from "@/components/studio/BrandStoryboard";

export const Route = createFileRoute("/studio")({ component: StudioPage });

type Tab = "social" | "reel" | "youtube";

const ICP_FILTERS: (IcpId | "all")[] = [
  "all", "vibecoder", "saas_founder", "ai_agency", "freelance_dev", "wp_agency", "enterprise_gov", "general",
];

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Copy failed"),
  );
}

function StudioPage() {
  const [tab, setTab] = useState<Tab>("social");
  const [icp, setIcp] = useState<IcpId | "all">("all");
  const [openSocial, setOpenSocial] = useState<string | null>(null);
  const [openVideo, setOpenVideo] = useState<string | null>(null);

  const posts = useMemo(() => SOCIAL_POSTS.filter((p) => icp === "all" || p.icp === icp), [icp]);
  const videos = useMemo(() => VIDEO_SCRIPTS.filter((v) => icp === "all" || v.icp === icp), [icp]);

  const selPost = SOCIAL_POSTS.find((p) => p.id === openSocial) ?? null;
  const selVideo = VIDEO_SCRIPTS.find((v) => v.id === openVideo) ?? null;
  const fmt = tab === "reel" ? "reel" : "youtube";

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 py-8">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Clapperboard className="h-3 w-3 text-primary" />
            Media Studio
          </div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">Brand social & video studio</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            On-brand social posts and videos — reels (9:16) and YouTube (16:9) — built from the same
            Kloudbean brand system. Preview them live (with voiceover), copy the caption or
            voiceover script, and export finished files from the local studios.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(["social", "reel", "youtube"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "social" ? <ImageIcon className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                {t === "social" ? "Social posts" : t === "reel" ? "Reels · 9:16" : "YouTube · 16:9"}
                <span className="font-mono text-[11px] opacity-70">{t === "social" ? posts.length : videos.length}</span>
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
        </header>

        {tab === "social" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {posts.map((p) => (
              <button key={p.id} onClick={() => setOpenSocial(p.id)} className="group overflow-hidden rounded-xl border border-border transition-colors hover:border-primary/50" title="Open preview">
                <BrandCard post={p} radius={0} />
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((v) => (
              <button key={v.id} onClick={() => setOpenVideo(v.id)} className="group rounded-xl border border-border p-2 text-left transition-colors hover:border-primary/50" title="Open animated preview">
                <BrandStoryboard script={v} format={fmt} poster />
                <div className="px-1 pt-2">
                  <div className="line-clamp-1 text-sm font-medium">{v.title}</div>
                  <div className="text-[11px] text-muted-foreground">{ICP_NAMES[v.icp]} · {v.beats.length} beats</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selPost && (
        <Modal onClose={() => setOpenSocial(null)} title={ICP_NAMES[selPost.icp]}>
          <div className="mx-auto w-full max-w-[440px]">
            <BrandCard post={selPost} />
          </div>
          <div className="mt-4 space-y-3">
            <Field label="Caption" value={selPost.caption} onCopy={() => copy(selPost.caption, "Caption")} />
            <Field label="Hashtags" value={selPost.tags.map((t) => `#${t}`).join(" ")} onCopy={() => copy(selPost.tags.map((t) => `#${t}`).join(" "), "Hashtags")} />
            <button
              onClick={() => copy(`${selPost.caption}\n\n${selPost.tags.map((t) => `#${t}`).join(" ")}`, "Post")}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Copy className="h-4 w-4" /> Copy full post
            </button>
          </div>
        </Modal>
      )}

      {selVideo && (
        <Modal onClose={() => setOpenVideo(null)} title={`${selVideo.title} · ${fmt === "reel" ? "Reel 9:16" : "YouTube 16:9"}`}>
          <div className={`mx-auto w-full ${fmt === "reel" ? "max-w-[300px]" : "max-w-[720px]"}`}>
            <BrandStoryboard script={selVideo} format={fmt} />
          </div>
          <div className="mt-4 space-y-3">
            <Field label="Voiceover script" value={selVideo.beats.map((b) => b.narration).join(" ")} onCopy={() => copy(selVideo.beats.map((b) => b.narration).join(" "), "Voiceover")} multiline />
            <div className="rounded-lg border border-border bg-card/50 p-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Beats</div>
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

function Field({ label, value, onCopy, multiline }: { label: string; value: string; onCopy: () => void; multiline?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <button onClick={onCopy} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
          <Copy className="h-3 w-3" /> Copy
        </button>
      </div>
      <div className={`text-sm text-foreground/90 ${multiline ? "leading-relaxed" : ""}`}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
