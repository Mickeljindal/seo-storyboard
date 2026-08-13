/**
 * Per-blog social generator.
 *
 * For each content-studio article it writes, INTO the article's own folder:
 *   - social.md    (human, copy-paste: an X/Twitter post, a LinkedIn post, a short thread)
 *   - social.json  (machine-readable: same content, for a scheduler / API)
 * and an aggregate index under social-studio/output/blog-social/.
 *
 * ACCURACY: copy is assembled ONLY from the article's own front-matter (title,
 * meta_description) and its ".tldr / short version" text, which are already
 * validated + humanized. It invents no product claims, numbers, or facts. That
 * is what makes it safe to run automatically. Hashtags come from a fixed, safe
 * vocabulary keyed by the article's cluster, plus a couple sanitized from the
 * article's own keywords.
 *
 * Usage:
 *   node social-studio/blog-social.mjs --all         # (re)generate for every article
 *   node social-studio/blog-social.mjs --missing      # only articles without social.md (fast; used by the hook)
 *   node social-studio/blog-social.mjs <slug>         # one article by slug
 *   node social-studio/blog-social.mjs content-studio/<slug>/<slug>.md   # one by file path (hook passes this)
 */
import { readFile, writeFile, readdir, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT = join(ROOT, "content-studio");
const OUT = join(__dirname, "output", "blog-social");
const BLOG_BASE = "https://www.kloudbean.com/blog";
const X_LIMIT = 280;

// ---- hashtag vocabulary (safe, curated; never invented claims) --------------
const ALWAYS = ["Kloudbean"];
// order matters: the first match wins, so put the most specific angles first.
const CLUSTER_TAGS = [
  { match: /saudi|ksa|pdpl|dammam|arabic|riyadh|jeddah|nca/i, tags: ["SaudiArabia", "KSA", "DataResidency"] },
  { match: /wordpress|woocommerce/i, tags: ["WordPress", "WebHosting"] },
  { match: /vibe|\bai\b|ai-|-ai|llm|agent|rag/i, tags: ["AIapps", "VibeCoding", "DevOps"] },
  { match: /security|compliance/i, tags: ["DevSecOps", "CloudSecurity"] },
];
const DEFAULT_TAGS = ["CloudHosting", "DevOps", "WebDev"];
// keyword -> hashtag hints (only mapped, known-good ones become tags)
const KW_TAGS = [
  [/postgres|pgvector/i, "PostgreSQL"], [/redis/i, "Redis"], [/node\.?js/i, "NodeJS"],
  [/python|django|fastapi|flask/i, "Python"], [/next\.?js/i, "NextJS"], [/react/i, "React"],
  [/serverless/i, "Serverless"], [/rag|retrieval/i, "RAG"], [/llm|openai|claude|gemini/i, "LLM"],
  [/database|sqlite|mysql/i, "Database"], [/deploy/i, "Deployment"], [/agent/i, "AIagents"],
];

function pickTags(fm) {
  const hay = `${fm.cluster || ""} ${fm.slug} ${fm.title} ${(fm.secondary_keywords || []).join(" ")}`;
  const set = new Set(ALWAYS);
  let clusterTags = DEFAULT_TAGS;
  for (const c of CLUSTER_TAGS) if (c.match.test(hay)) { clusterTags = c.tags; break; }
  clusterTags.forEach((t) => set.add(t));
  for (const [re, tag] of KW_TAGS) { if (set.size >= 6) break; if (re.test(hay)) set.add(tag); }
  return [...set].slice(0, 6).map((t) => "#" + t);
}

// ---- front-matter + tldr parsing --------------------------------------------
function parseFrontMatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  const fm = {};
  if (!m) return fm;
  const block = m[1];
  const scalar = (k) => {
    const r = block.match(new RegExp(`^${k}:\\s*(.+)$`, "m"));
    if (!r) return undefined;
    return r[1].trim().replace(/^["']|["']$/g, "");
  };
  fm.title = scalar("title");
  fm.slug = scalar("slug");
  fm.meta_description = scalar("meta_description");
  fm.cluster = scalar("cluster");
  const skm = block.match(/secondary_keywords:\s*\n((?:\s*-\s*.+\n?)+)/);
  fm.secondary_keywords = skm
    ? skm[1].split("\n").map((l) => l.replace(/^\s*-\s*/, "").trim().replace(/^["']|["']$/g, "")).filter(Boolean)
    : [];
  return fm;
}

function extractTldr(md) {
  // Newer articles: a blockquote "> **The short version:** ...."
  const bq = md.match(/^>\s*\*\*The short version:?\*\*\s*([\s\S]*?)(?:\n\n|\n#|\n>)/m);
  if (bq && bq[1]) return bq[1].replace(/\n>\s?/g, " ").replace(/\s+/g, " ").trim();
  // Any leading blockquote after the H1
  const anyBq = md.match(/^>\s*(.+(?:\n>.*)*)/m);
  if (anyBq) return anyBq[1].replace(/^\*\*.*?\*\*\s*/, "").replace(/\n>\s?/g, " ").replace(/\s+/g, " ").trim();
  return null;
}

function firstParagraph(md) {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/^!\[[^\]]*\]\([^)]*\)\s*/m, "");
  const afterH1 = body.replace(/^#\s+.+\n/m, "");
  const para = afterH1.split(/\n\n/).map((s) => s.trim()).find((s) => s && !s.startsWith("#") && !s.startsWith(">") && !s.startsWith("!"));
  return para ? para.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*`]/g, "").replace(/\s+/g, " ").trim() : "";
}

function sentences(text) {
  return (text || "").split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);
}

function clip(s, n) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).replace(/\s+\S*$/, "") + "\u2026";
}

// ---- post builders ----------------------------------------------------------
function buildPosts(fm, tldr, lead) {
  const url = `${BLOG_BASE}/${fm.slug}/`;
  const tags = pickTags(fm);
  const tagLine = tags.join(" ");
  const sents = sentences(tldr || fm.meta_description || lead);
  // A question/how-to title is already a strong hook; otherwise use the first tldr sentence.
  const titleIsHook = /\?$/.test(fm.title || "") || /^(how|why|what|when|where)\b/i.test(fm.title || "");
  const hook = clip(((titleIsHook ? fm.title : sents[0]) || fm.title || "").replace(/\s+/g, " ").trim(), 160);

  // X / Twitter: hook + url + tags, kept under the limit.
  let x = `${hook}\n\n${url}\n${tagLine}`;
  if (x.length > X_LIMIT) x = `${clip(hook, X_LIMIT - url.length - tagLine.length - 4)}\n\n${url}\n${tagLine}`;

  // LinkedIn: hook + 2-3 sentence value + link + tags. Don't repeat the hook in the body.
  const bodySents = titleIsHook ? sents.slice(0, 3) : sents.slice(1, 4);
  const body = clip((bodySents.join(" ") || fm.meta_description || lead).trim(), 500);
  const linkedin = `${hook}\n\n${body}\n\nRead the full guide: ${url}\n\n${tagLine}`;

  // A short thread from the tldr sentences (each tweet under the limit).
  const thread = [];
  thread.push(clip(`${fm.title}\n\nQuick thread \u{1F9F5}`, X_LIMIT));
  for (const s of sents.slice(0, 4)) thread.push(clip(s, X_LIMIT));
  thread.push(clip(`Full walkthrough:\n${url}\n${tagLine}`, X_LIMIT));

  return { url, tags, x: x.trim(), linkedin: linkedin.trim(), thread };
}

function toMarkdown(fm, posts) {
  const L = [];
  L.push(`# Social posts: ${fm.title}`);
  L.push("");
  L.push(`> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.`);
  L.push(`> Article: ${posts.url}`);
  L.push("");
  L.push("## X / Twitter");
  L.push("```");
  L.push(posts.x);
  L.push("```");
  L.push("");
  L.push("## LinkedIn");
  L.push("```");
  L.push(posts.linkedin);
  L.push("```");
  L.push("");
  L.push("## X thread");
  posts.thread.forEach((t, i) => {
    L.push("```");
    L.push(`${i + 1}/${posts.thread.length}  ${t}`);
    L.push("```");
  });
  L.push("");
  return L.join("\n");
}

// ---- per-article generation --------------------------------------------------
async function generateForSlug(slug) {
  const dir = join(CONTENT, slug);
  const mdPath = join(dir, `${slug}.md`);
  if (!existsSync(mdPath)) return { slug, skipped: "no md" };
  const md = await readFile(mdPath, "utf8");
  const fm = parseFrontMatter(md);
  if (!fm.slug) fm.slug = slug;
  if (!fm.title) fm.title = slug.replace(/-/g, " ");
  const tldr = extractTldr(md);
  const lead = firstParagraph(md);
  const posts = buildPosts(fm, tldr, lead);
  await writeFile(join(dir, "social.md"), toMarkdown(fm, posts), "utf8");
  await writeFile(
    join(dir, "social.json"),
    JSON.stringify({ slug: fm.slug, title: fm.title, url: posts.url, tags: posts.tags, x: posts.x, linkedin: posts.linkedin, thread: posts.thread, generatedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
  return { slug: fm.slug, title: fm.title, url: posts.url };
}

async function listArticleSlugs() {
  const entries = await readdir(CONTENT, { withFileTypes: true });
  const slugs = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (existsSync(join(CONTENT, e.name, `${e.name}.md`))) slugs.push(e.name);
  }
  return slugs.sort();
}

function slugFromArg(a) {
  if (!a) return null;
  if (a.includes("/")) {
    // a file path like content-studio/<slug>/<slug>.md
    const parts = a.split("/").filter(Boolean);
    const i = parts.indexOf("content-studio");
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
    return basename(dirname(a));
  }
  return a.replace(/\.md$/, "");
}

async function main() {
  const args = process.argv.slice(2);
  await mkdir(OUT, { recursive: true });
  let slugs;
  if (args.includes("--all")) {
    slugs = await listArticleSlugs();
  } else if (args.includes("--missing")) {
    slugs = (await listArticleSlugs()).filter((s) => !existsSync(join(CONTENT, s, "social.md")));
  } else if (args[0]) {
    slugs = [slugFromArg(args[0])].filter(Boolean);
  } else {
    console.log("Usage: node blog-social.mjs [--all | --missing | <slug> | <path-to-md>]");
    process.exit(1);
  }

  const results = [];
  for (const s of slugs) {
    try {
      results.push(await generateForSlug(s));
    } catch (e) {
      results.push({ slug: s, error: String(e.message || e) });
    }
  }

  const ok = results.filter((r) => r.url);
  // Aggregate index for a scheduler / review.
  await writeFile(join(OUT, "blog-posts.json"), JSON.stringify(ok, null, 2), "utf8");
  console.log(`[blog-social] wrote social.md + social.json for ${ok.length} article(s)` + (slugs.length - ok.length ? `, skipped ${slugs.length - ok.length}` : ""));
}

main().catch((e) => { console.error(e); process.exit(1); });
