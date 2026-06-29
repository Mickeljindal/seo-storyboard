/**
 * RICH PUBLISHING RENDERER
 *
 * Converts the engine's Markdown into clean WordPress-ready HTML that keeps the
 * SEO-critical parts the old renderer dropped:
 *   - Tables (comparison tables for "vs competitor" articles)
 *   - FAQ sections
 *   - Lists, blockquotes, code, bold/italic/links
 *   - Injected JSON-LD structured data (Article + FAQPage + Breadcrumb) so the
 *     content is eligible for AI Overviews / rich results.
 *
 * This does NOT auto-publish anything — it only builds HTML used when the user
 * clicks publish.
 */

import { organizationJsonLd } from "./entity-boilerplate";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMd(text: string): string {
  let s = escapeHtml(text);
  // links: [text](url) and [text](internal:slug) (internal should already be rewritten)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\[([^\]]+)\]\(\/([^)]+)\)/g, '<a href="/$2">$1</a>');
  s = s.replace(/\[([^\]]+)\]\(internal:([^)]+)\)/g, '<a href="/$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  return s;
}

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}
function isTableSeparator(line: string): boolean {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

/** Markdown → HTML supporting headings, lists, tables, blockquotes, code, paragraphs. */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code fence
    if (trimmed.startsWith("```")) {
      closeLists();
      const lang = trimmed.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      out.push(
        `<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ""}>${escapeHtml(buf.join("\n"))}</code></pre>`,
      );
      continue;
    }

    // Table
    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      closeLists();
      const header = parseTableRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${header.map((h) => `<th>${inlineMd(h)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${inlineMd(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      out.push(`<figure class="wp-block-table"><table>${thead}${tbody}</table></figure>`);
      continue;
    }

    if (!trimmed) {
      closeLists();
      i++;
      continue;
    }

    // Headings
    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      closeLists();
      const level = hMatch[1].length;
      out.push(`<h${level}>${inlineMd(hMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      closeLists();
      out.push(`<blockquote><p>${inlineMd(trimmed.slice(2))}</p></blockquote>`);
      i++;
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inOl) {
        closeLists();
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inlineMd(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inUl) {
        closeLists();
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inlineMd(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
      i++;
      continue;
    }

    // Paragraph
    closeLists();
    out.push(`<p>${inlineMd(trimmed)}</p>`);
    i++;
  }
  closeLists();
  return out.join("\n");
}

type FaqItem = { q?: string; a?: string; question?: string; answer?: string };

function extractFaqFromBrief(
  brief: Record<string, unknown> | null | undefined,
): { q: string; a: string }[] {
  const faq = brief?.faq;
  const out: { q: string; a: string }[] = [];
  if (Array.isArray(faq)) {
    for (const item of faq as FaqItem[]) {
      const q = item.q ?? item.question ?? "";
      const a = item.a ?? item.answer ?? "";
      if (q && a) out.push({ q, a });
    }
  }
  return out;
}

/** Build JSON-LD: Article + (FAQPage if FAQ) + BreadcrumbList. */
export function buildJsonLd(
  brief: Record<string, unknown> | null | undefined,
  opts: { title?: string; url?: string; description?: string; clusterName?: string | null } = {},
): object[] {
  const blocks: object[] = [];
  const b = brief ?? {};
  const title = opts.title ?? String(b.h1 ?? b.meta_title ?? "Kloudbean");
  const description = opts.description ?? String(b.meta_description ?? b.tldr ?? "");

  // Prefer an explicit schema from the brief if present and valid-looking.
  if (
    b.schema_jsonld &&
    typeof b.schema_jsonld === "object" &&
    Object.keys(b.schema_jsonld).length > 0
  ) {
    blocks.push(b.schema_jsonld as object);
  } else {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      publisher: {
        "@type": "Organization",
        name: "Kloudbean",
        url: "https://kloudbean.com",
      },
      ...(opts.url ? { mainEntityOfPage: { "@type": "WebPage", "@id": opts.url } } : {}),
    });
  }

  const faq = extractFaqFromBrief(brief);
  if (faq.length) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  blocks.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://kloudbean.com" },
      ...(opts.clusterName ? [{ "@type": "ListItem", position: 2, name: opts.clusterName }] : []),
      { "@type": "ListItem", position: opts.clusterName ? 3 : 2, name: title },
    ],
  });

  // Entity boilerplate: stable Organization block (+ sameAs) on every page so
  // AI engines build a consistent Kloudbean entity → higher citation odds.
  try {
    blocks.push(organizationJsonLd());
  } catch {
    /* entity block is additive — never break rendering */
  }

  return blocks;
}

function jsonLdScriptTags(blocks: object[]): string {
  return blocks
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join("\n");
}

/**
 * Render final WordPress HTML from Markdown + brief.
 * Includes JSON-LD structured data at the end of content (WP strips <head>,
 * so inlining in content is the reliable way to ship schema without a plugin).
 */
export function renderArticleHtml(
  markdown: string,
  brief: Record<string, unknown> | null | undefined,
  opts: { url?: string; clusterName?: string | null } = {},
): string {
  const body = markdownToHtml(markdown);
  const jsonLd = buildJsonLd(brief, {
    url: opts.url,
    clusterName: opts.clusterName,
    title: String(brief?.h1 ?? ""),
    description: String(brief?.meta_description ?? ""),
  });
  return `${body}\n\n${jsonLdScriptTags(jsonLd)}`;
}
