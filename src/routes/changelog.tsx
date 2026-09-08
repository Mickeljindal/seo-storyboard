import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { History, Globe, Lock } from "lucide-react";
import { getChangelogFn, type ChangelogEntry } from "@/lib/changelog.functions";

export const Route = createFileRoute("/changelog")({ component: Changelog });

function Changelog() {
  const fn = useServerFn(getChangelogFn);
  const { data, isLoading } = useQuery({ queryKey: ["changelog"], queryFn: () => fn({}) });
  const entries = (data?.entries ?? []) as ChangelogEntry[];

  return (
    <AppLayout>
      <div className="mx-auto max-w-[860px] px-8 py-8">
        <header className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <History className="h-3 w-3 text-primary" /> Changelog
          </div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">What we've shipped</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every feature, with its date and visibility. Source of truth is <code className="rounded bg-secondary px-1">CHANGELOG.md</code>; this page renders it.
          </p>
        </header>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">No entries yet.</div>
        ) : (
          <div className="relative space-y-6 border-l border-border pl-6">
            {entries.map((e) => {
              const isPublic = /public/i.test(e.visibility);
              return (
                <section key={e.version} className="relative">
                  <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  <div className="rounded-xl border border-border bg-card/50 p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="num rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">{e.version}</span>
                      <span className="text-xs text-muted-foreground">{e.date}</span>
                      {e.status && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{e.status}</span>
                      )}
                      {e.visibility && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${isPublic ? "bg-[var(--lime)]/15 text-[var(--lime)]" : "bg-secondary text-muted-foreground"}`}>
                          {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />} {e.visibility}
                        </span>
                      )}
                    </div>
                    <h2 className="text-display text-lg font-semibold">{e.title}</h2>
                    <ul className="mt-3 space-y-1.5">
                      {e.items.map((it, i) => (
                        <li key={i} className="flex gap-2 text-sm text-foreground/85">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
