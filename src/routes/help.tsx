import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { useMemo, useState } from "react";
import { BookOpen, Search, MessageCircle } from "lucide-react";
import { listKbFn } from "@/lib/assistant.functions";

export const Route = createFileRoute("/help")({ component: HelpPage });

type Article = { id: string; title: string; category: string; tags: string[]; body: string };

function HelpPage() {
  const listFn = useServerFn(listKbFn);
  const { data } = useQuery({ queryKey: ["kb"], queryFn: () => listFn({}) });
  const articles = useMemo(() => (data?.articles ?? []) as Article[], [data]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.tags.some((t) => t.includes(term)) ||
        a.body.toLowerCase().includes(term),
    );
  }, [articles, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, Article[]>();
    for (const a of filtered) {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    }
    return [...map.entries()];
  }, [filtered]);

  const active = articles.find((a) => a.id === activeId) ?? filtered[0] ?? articles[0] ?? null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <BookOpen className="h-3 w-3 text-primary" />
            Help & Docs
          </div>
          <h1 className="text-display text-4xl font-semibold tracking-tight">
            How to use the platform
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Guides for every part of the SEO engine. Prefer to ask? Use the{" "}
            <span className="inline-flex items-center gap-1 text-primary">
              <MessageCircle className="h-3 w-3" /> Ask AI
            </span>{" "}
            button (bottom-right) for grounded answers.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the docs…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <aside className="space-y-4">
            {grouped.map(([category, list]) => (
              <div key={category}>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {category}
                </div>
                <div className="space-y-0.5">
                  {list.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setActiveId(a.id)}
                      className={`block w-full rounded-md px-3 py-1.5 text-left text-[13px] transition-colors ${
                        active?.id === a.id
                          ? "bg-foreground/[0.06] text-foreground"
                          : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                      }`}
                    >
                      {a.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <div className="text-sm text-muted-foreground">No matches.</div>
            )}
          </aside>

          <article className="rounded-xl border border-border bg-card/40 p-6">
            {active ? (
              <>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-primary">
                  {active.category}
                </div>
                <h2 className="text-display mb-4 text-2xl font-semibold">{active.title}</h2>
                <Markdown body={active.body} />
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">Select a topic.</div>
            )}
          </article>
        </div>
      </div>
    </AppLayout>
  );
}

/** Minimal markdown renderer for KB bodies (headings, lists, bold, paragraphs). */
function Markdown({ body }: { body: string }) {
  const lines = body.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  let ordered: string[] = [];

  const flush = () => {
    if (list.length) {
      out.push(
        <ul
          key={`ul-${out.length}`}
          className="my-2 list-disc space-y-1 pl-5 text-sm text-foreground/85"
        >
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
    if (ordered.length) {
      out.push(
        <ol
          key={`ol-${out.length}`}
          className="my-2 list-decimal space-y-1 pl-5 text-sm text-foreground/85"
        >
          {ordered.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ol>,
      );
      ordered = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^- /.test(line)) {
      if (ordered.length) flush();
      list.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      if (list.length) flush();
      ordered.push(line.replace(/^\d+\.\s/, ""));
    } else {
      flush();
      out.push(
        <p key={`p-${out.length}`} className="my-2 text-sm leading-relaxed text-foreground/85">
          {inline(line)}
        </p>,
      );
    }
  }
  flush();
  return <div>{out}</div>;
}

/** Inline **bold** + `code` rendering. */
function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <code key={key++} className="rounded bg-secondary px-1 py-0.5 font-mono text-[12px]">
          {tok.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
