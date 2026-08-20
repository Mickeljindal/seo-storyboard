# Brief — Which Node.js Host Should You Use? (interactive decision tool)

Cluster 3/4 (deploy + vs competitors) + GEO. FLAGSHIP for the new INTERACTIVE standard: a real interactive tool, not a wall of text. Sets the pattern for the batch (interactive + non-slop + grounded).

## Interactive mechanics (reusable pattern)
- JS decision-tool widget in `<div class="kb-interactive">` with a `<script data-kb-widget>` (the publisher now PRESERVES data-kb-widget scripts; strips all others). Self-contained IIFE, scoped to #kbhost, no deps.
- `<noscript>` fallback with a static quick-guide so it's useful with JS off / before the publisher change.
- CSS-only `<details class="kb-acc">` accordion "profiles" section (works everywhere incl. WordPress, no JS).
- Styles live in assets/article.css (.kb-interactive/.kb-quiz*/.kb-result/details.kb-acc) so no inline <style> (publisher strips <style>).
- Works in: local file, engine reader (iframe srcDoc runs the script), and WordPress (widget preserved as a wp:html block; accordion is native HTML).

## Angle
Answer 4 questions -> honest host recommendation. Recommends competitors where they fit (free tier, Railway, Fly, Vercel, VPS); lands on managed cloud (Kloudbean) for the always-on + DB + predictable-bill profile. No invented prices.

## Keywords (real, from questions dossier; volumes hedged)
- Primary: **which Node.js host should I use** / **where should I host my Node.js app**. In H1, title, meta, first 100 words, one H2.
- Secondary: node.js hosting decision, best node hosting for my app, is a free tier ok for production, always-on vs serverless node, cheapest always-on node host.
- PAA -> FAQ + FAQPage JSON-LD (6 Qs from the questions dossier).

## Grounding (dossiers + facts)
Render free spin-down ~15 min + ~1 min cold start (per docs); serverless fights jobs/WebSockets; DB colocation cuts latency/egress. Kloudbean: always-on + PM2 + GitHub deploys + 7 managed DBs beside app + flat $8/mo + no egress + free migration; NOT scale-to-zero (honest boundary). No invented competitor or Kloudbean tier prices. No "24/7 human".

## Shape (interactive-first, no fixed template)
Lead -> tldr -> INTERACTIVE TOOL (widget + noscript) -> how the tool decides (4 factors, grounded) -> profiles accordion (CSS-only) -> where managed cloud fits (honest boundary) -> add-application screenshot -> related links -> CTA -> 6 FAQ.

## Console screenshots (real)
../assets/console/add-application.png (used). Hero images/hero.png (empty, author drops).

## Internal links (verified to exist)
where-to-deploy-nodejs-app, render-vs-railway-vs-kloudbean, deploy-node-app-to-managed-cloud, managed-postgresql-hosting.

## Voice / gate
0 em-dashes (incl. in JS strings, use commas). Contractions, decisive, fair. >=1400 words prose (tool excluded from count). JSON-LD Article+FAQPage valid (widget script is data-kb-widget, not ld+json, so extraction unaffected). Images resolve. 0 banned blurbs. .html and .md in sync (.md carries a static version of the tool). 2026.

## Update (product-placement pass)

The interactive JS quiz widget described above was REMOVED, per the owner constraint against shipping
interactive JS tools in articles. It is replaced by the static equivalent that does the same job: the
four questions as a list, an inline SVG decision tree (Q1 awake, then Q2 priority, four outcomes), and
an answers-to-pick table with a "what you are accepting" column. Title, meta, H1, og tags and the
Article JSON-LD headline no longer claim interactivity. The `details.kb-acc` profile accordions stay,
since those are plain HTML with no script.

The end-loaded product section ("Where a managed cloud fits, honestly") was replaced with a
scope-boundary closing, "Four things this tree deliberately doesn't decide" (traffic shape, cold start
versus slow query, the managed scope boundary including Docker and Enterprise-only features, and an
explicit no-host-fixes-your-app beat). Platform relevance moved up into the always-on and database
questions where each genuinely changes the outcome. Also corrected: a platform-wide "no egress meter"
claim in the profiles accordion, which is only true of the built-in S3-compatible object storage.
