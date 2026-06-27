/**
 * PORTAL KNOWLEDGE BASE
 *
 * Documentation about THIS platform (the Kloudbean SEO Engine portal) — how to
 * set it up and operate it. It powers the /help docs page and grounds the in-app
 * AI assistant so answers are accurate and specific to this tool.
 *
 * Keep articles short, task-focused, and in plain language.
 */

export type KbArticle = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  body: string; // markdown
};

export const PORTAL_KB: KbArticle[] = [
  {
    id: "overview",
    title: "What this platform does",
    category: "Getting started",
    tags: ["overview", "intro", "what is"],
    body: `The Kloudbean SEO Engine is an autonomous content + SEO system for kloudbean.com. It:
- Discovers demand-validated topics and writes/scores/publishes SEO articles.
- Generates and publishes interactive **tool pages** (calculators, generators) as Elementor pages, and optimizes existing ones (slug-safe).
- Can turn any free tool into a **signup magnet** for console.kloudbean.com.
- Maintains a **self-learning knowledge graph** of what Kloudbean is and the topics around it.
- Produces **short-video (reels) scripts** with ready-to-paste prompts for Sora, Google Veo, and Google AI Studio.
- Runs hands-free on a schedule (Autopilot) and learns from real Google Search Console results.

Main tabs: Dashboard, Strategy, Topical Map, Engine, Tool Pages, Knowledge, Reels Studio, Performance, Settings, Help.`,
  },
  {
    id: "first-run",
    title: "First-run checklist",
    category: "Getting started",
    tags: ["setup", "first run", "getting started", "checklist"],
    body: `Do these once after deploying:
1. Open **Settings** and confirm AI, WordPress, and the WP plugin show connected.
2. Make sure the WordPress plugin "Kloudbean SEO Engine" (v1.1.0) is uploaded and active, and AIOSEO is installed.
3. Open **Knowledge** → click "Rebuild & learn" to seed the knowledge graph.
4. Open **Tool Pages** → "Sync from WordPress" to import your existing tool pages.
5. (Optional) Enable Autopilot in your .env once you trust the output.

If something shows "not connected", check the matching keys in your .env and restart the app (env is read at startup).`,
  },
  {
    id: "env",
    title: "Environment variables (.env)",
    category: "Setup",
    tags: ["env", "config", "api keys", "database", "settings"],
    body: `Required: a database (DATABASE_MODE=pglite for a file DB, or DATABASE_HOST/USER/PASSWORD for Postgres) and an AI key (DEEPSEEK_API_KEY recommended, or OPENAI_API_KEY).

To publish to WordPress: WP_SITE_URL, WP_USERNAME, WP_APP_PASSWORD, plus WP_PLUGIN_URL and WP_PLUGIN_API_KEY (from WP Admin → Settings → KB SEO Engine).

Research + learning: SERPER_API_KEY (cheap SERP research), DATAFORSEO_LOGIN/PASSWORD (real search volumes), and GSC_CLIENT_EMAIL/GSC_PRIVATE_KEY/GSC_SITE_URL (Google Search Console — feeds the learning loop).

Signup gate: TOOL_SIGNUP_URL (default https://console.kloudbean.com), TOOL_GATE_MODE (soft|hard), TOOL_GATE_FREE, TOOL_GATE_DEFAULT.

Autopilot: AUTOPILOT_ENABLED=1 plus AUTOPILOT_TOOLS=1 and the AUTOPILOT_TOOLS_* knobs.

Always restart the app after editing .env.`,
  },
  {
    id: "tools-optimize",
    title: "Optimizing existing tool pages",
    category: "Tool pages",
    tags: ["tools", "optimize", "aioseo", "elementor", "existing", "slug"],
    body: `Goal: raise the SEO score of tool pages you already have, without breaking rankings.
1. Tool Pages → "Sync from WordPress" (pulls pages, worst AIOSEO score first).
2. Click **Preview** on a page — a dry run that shows exactly what would be added, with zero changes.
3. Click **Optimize** to apply. It ADDS an intro, FAQ, and schema, and sets the focus keyword.

Guarantees: the URL slug is never changed, the existing tool widget is never modified, and changes are additive only. The optimizer uses H2 (not a second H1) so ranking pages stay safe. AIOSEO recalculates its score on its next pass, so the new score shows up after a later sync.`,
  },
  {
    id: "tools-new",
    title: "Creating new tool pages",
    category: "Tool pages",
    tags: ["tools", "new", "generate", "publish", "idea bringer"],
    body: `1. Tool Pages → "Discover tool ideas" (ranked by real demand) or type one into the add box.
2. Click **Generate tool** — builds the interactive tool HTML + SEO wrapper (H1, intro, how-to, FAQ) + schema.
3. Click **Draft** to publish as a WordPress draft for review, or the rocket to publish live.

New tools are published as Elementor pages in the Developer Tools category, so you can still edit them by hand in Elementor.`,
  },
  {
    id: "signup-gate",
    title: "The signup gate (turn tools into signups)",
    category: "Tool pages",
    tags: ["gate", "signup", "lead gen", "console", "soft", "hard", "lock"],
    body: `The gate makes visitors create a free console.kloudbean.com account to use a tool.
- On a published tool, click the **Open/Gated** pill to toggle it, and the **soft/hard** pill to switch mode.
- **Soft** (recommended): the tool works for one free use, then a modal asks them to sign up. Keeps SEO and most signups.
- **Hard**: the tool is locked immediately behind the signup modal. Maximum capture, higher bounce.

It is crawler-safe — search engines are never gated, so rankings are protected. It's a client-side gate (localStorage), best for free top-of-funnel tools. To remove it, click Gated → it turns Open and the gate widget is stripped from the page.`,
  },
  {
    id: "knowledge-graph",
    title: "The self-learning knowledge graph",
    category: "Knowledge",
    tags: ["knowledge graph", "brain", "gaps", "learning", "entities"],
    body: `The Knowledge tab is the system's evolving understanding of Kloudbean. It seeds from the product knowledge base (products, providers, competitors, personas, clusters, regions, apps), ingests every article and tool you create as topics, and re-weights itself from real quality + Google Search Console rewards.

Use it to:
- Read the "current understanding" summary.
- See the **biggest content gaps** — important entities with thin coverage. These are your best next topics/tools.
- Click "Rebuild & learn" to refresh (Autopilot also does this each cycle).`,
  },
  {
    id: "reels",
    title: "Reels Studio (short-video scripts)",
    category: "Reels",
    tags: ["reels", "video", "sora", "veo", "ai studio", "shorts", "script"],
    body: `Turns the same knowledge into short-form video.
1. Reels Studio → "Discover reel ideas" (pulled from the knowledge graph's gaps) or add your own.
2. Click **Generate script** on an idea.
3. Open the reel to see the hook + variations, a beat-by-beat script (timecode, narration, on-screen text, visual prompt), the voiceover, caption, and hashtags.
4. Copy the **Sora**, **Google Veo**, or **Google AI Studio** prompt and generate the video in that tool, then post.

Formats: explainer, educational, how-it-works, comparison, viral. Scripts are grounded in real Kloudbean facts so they stay accurate.`,
  },
  {
    id: "autopilot",
    title: "Autopilot (hands-free mode)",
    category: "Automation",
    tags: ["autopilot", "automation", "schedule", "cron", "hands-free"],
    body: `With AUTOPILOT_ENABLED=1, the engine runs on an interval (default 6h) and: discovers topics, writes + scores articles, auto-publishes ones above the score threshold (within daily/weekly caps), refreshes stale content, syncs Search Console, and rebuilds the knowledge graph.

Turn on the tool phase with AUTOPILOT_TOOLS=1: it discovers + generates tools, publishes them (draft by default), and optimizes the worst-scoring existing pages each cycle. Tune with AUTOPILOT_TOOLS_DISCOVER / _GENERATE / _PUBLISH / _OPTIMIZE.

Safe rollout: start with AUTOPILOT_TOOLS_PUBLISH=draft and a small AUTOPILOT_TOOLS_OPTIMIZE, watch results for a week, then increase.`,
  },
  {
    id: "articles",
    title: "Articles, strategy & the publishing pipeline",
    category: "Content",
    tags: ["articles", "blog", "strategy", "brief", "publish", "clusters"],
    body: `Articles flow: idea → research → brief → write + score → publish. The Strategy and Topical Map tabs organize topics into 10 authority clusters. The content engine writes section-by-section, humanizes the draft, scores it against a quality scorecard, and auto-revises until it passes. Publishing pushes to WordPress with AIOSEO meta, schema, internal links, and a featured image. The quality gate blocks anything with banned/false claims.`,
  },
  {
    id: "performance",
    title: "Performance & the learning loop",
    category: "Content",
    tags: ["performance", "search console", "gsc", "learning", "ranking"],
    body: `Connect Google Search Console (GSC_* env) to pull real clicks, impressions, and positions per URL. This is the system's source of truth for what actually wins. The learning ranker turns those outcomes into rewards that nudge discovery toward clusters/intents that earn traffic — and the knowledge graph folds the same rewards into entity weights. The Performance tab shows the headline numbers and top pages.`,
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    category: "Help",
    tags: ["troubleshooting", "errors", "not connected", "plugin", "fix"],
    body: `- "WP plugin not configured/reachable": set WP_PLUGIN_URL + WP_PLUGIN_API_KEY, confirm the plugin is active, and that permalinks aren't set to Plain.
- AIOSEO score not changing after optimize: AIOSEO recalculates on its own pass; re-sync later to see it.
- Tool's interactive part stopped working after an edit: never run the tool HTML through a sanitizer — it must stay raw in the Elementor HTML widget.
- AI errors: check DEEPSEEK_API_KEY / OPENAI_API_KEY and restart.
- New tables missing (tools/reels/knowledge graph): restart so the patch migration runs, or run npm run db:migrate on Postgres.
- Always restart the app after .env changes.`,
  },
];

const STOP = new Set([
  "the",
  "a",
  "an",
  "to",
  "of",
  "and",
  "or",
  "for",
  "in",
  "on",
  "is",
  "it",
  "how",
  "do",
  "i",
  "my",
  "with",
  "what",
  "this",
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length > 1 && !STOP.has(t));
}

/** Lightweight keyword retriever — returns the most relevant KB articles for a query. */
export function retrieveKb(
  query: string,
  k = 4,
): { article: KbArticle; score: number; snippet: string }[] {
  const terms = tokenize(query);
  if (!terms.length) return [];
  const scored = PORTAL_KB.map((article) => {
    const title = article.title.toLowerCase();
    const tags = article.tags.join(" ").toLowerCase();
    const body = article.body.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (title.includes(t)) score += 5;
      if (tags.includes(t)) score += 3;
      const occurrences = body.split(t).length - 1;
      score += Math.min(occurrences, 4);
    }
    return { article, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored.map(({ article, score }) => {
    // Pull the first sentence/paragraph that mentions a query term, as a snippet.
    const para = article.body
      .split("\n")
      .find((line) => terms.some((t) => line.toLowerCase().includes(t)));
    return { article, score, snippet: (para ?? article.body.split("\n")[0]).slice(0, 240) };
  });
}

export function listKbCategories(): {
  category: string;
  articles: { id: string; title: string }[];
}[] {
  const map = new Map<string, { id: string; title: string }[]>();
  for (const a of PORTAL_KB) {
    if (!map.has(a.category)) map.set(a.category, []);
    map.get(a.category)!.push({ id: a.id, title: a.title });
  }
  return [...map.entries()].map(([category, articles]) => ({ category, articles }));
}
