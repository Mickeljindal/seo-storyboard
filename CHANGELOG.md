# Kloudbean SEO Engine — Changelog

Every shipped feature is logged here with its date, a short feature list, and its
visibility (Internal = used by the Kloudbean team; Public = customer-facing output).
Newest first. This file is the single source of truth; the in-app **Changelog** page
(`/changelog`) renders it.

Format per entry:

```
## vX.Y.Z — YYYY-MM-DD — Title
Status: Shipped | Beta | Planned · Visibility: Internal | Public
- feature line
```

---

## v1.11.0 — 2026-09-08 — Portable SEO engine bootstrap prompt
Status: Shipped · Visibility: Internal
- **`SEO-ENGINE-BOOTSTRAP-PROMPT.md`** — a product-agnostic, copy-paste prompt that rebuilds this engine's decision layer for a different digital service. Interview-first, so no copy gets written before a product-truth file exists.
- Carries over the transferable parts: authority layers, create/don't-create, the mandatory cannibalisation check, opportunity scoring, information gain, the accuracy firewall, humanisation, product placement, no competitor hand-offs, and the cross-article template-slop audit.
- Phased setup (product truth → steering set → writing standard → gates → first batch) with a stop-and-approve point after the first single article.

## v1.12.0 — 2026-09-07 — Conversion-focused CTAs with region-aware pricing
Status: Shipped · Visibility: Public
- **Every CTA now states a price.** All 396 end-of-article CTAs carried a headline, features and buttons but **no price and no trust signal**, which is the single biggest conversion gap in a bottom-of-page CTA. Each now ends with a note line: the entry price, free migration assistance, and the free trial.
- **Pricing is region-aware, because it has to be.** Kloudbean provisions across 7 clouds at different prices: **$8/mo is the Linode entry point, and Linode has no Saudi data centre**, so in-Kingdom hosting runs on Google Cloud Dammam and starts at **$36/mo**. Quoting $8 on a Saudi article is a promise the pricing page would break. 18 in-Kingdom articles now show the Dammam price, 5 enterprise articles show the enterprise figure with its dedicated onboarding manager and DevOps engineer, and 3 provider comparisons that genuinely weigh the region show both so neither number misleads.
- Recorded the per-provider pricing rule in `kloudbean-facts.md`, since a single global price was the underlying error.
- **Premium visual layer across all 11 topic variants** (ai, move, fix, run, db, sec, wp, agency, gov, ksa, ent), matching the hand-built reference CTAs: a drifting background grid, a floating ambient glow, a pulsing status dot in the eyebrow, and a shine sweep across the button. All of it disabled under `prefers-reduced-motion`, and all CSS scoped per variant so nothing leaks into the theme.
- The existing per-article CTA copy and topic matching were left intact; this adds what was missing rather than rewriting 396 CTAs.
- New script: `upgrade-ctas.mjs`, idempotent so it can be re-run safely.

## v1.11.1 — 2026-09-07 — Right shape per diagram, and a clean validator across the library
Status: Shipped · Visibility: Public
- **Two new visual types, because four charts kept failing for the right reason.** They were not a rendering problem, they were the wrong shape: "a short storage bar next to a tall egress bar" is not a line chart, and "a naive deploy beside an overlapping deploy" is not one either. Added **`bars`** (magnitude between named things) and **`timeline`** (two scenarios over elapsed time, so a reader sees one has an outage gap and the other does not).
- Chart shapes are now checked, not just accepted: a series must use the vertical space, a baseline is never drawn on the axis, and a spike must actually be steep. A chart that would render nearly empty is rejected and regenerated.
- **Every generatable slot in the library is now done.** The only placeholders left are 43 that need a camera rather than a renderer: 23 browser windows, 15 other products' UIs, 5 console shots that are not ours.
- **All 396 unpublished articles pass the validator, zero failures** (was 15). Fixed three real issues found along the way, none of them cosmetic:
  - **FAQ schema that did not match the visible page.** 7 questions across 6 articles had JSON-LD text differing from the visible heading, which is a structured-data violation Google can penalise. The visible copy is the source of truth, so the schema was corrected to match it. Two of those articles are already live.
  - **FAQ questions quoting an error string with double quotes**, which breaks the JSON-LD `name` field and made the parity rule unsatisfiable. Converted to single quotes in the heading, the markdown, and the schema, so both rules pass and the reader still sees it is a literal error string.
  - Frontmatter `cluster:` lines carrying an em-dash, which tripped the prose em-dash check on metadata that is not prose.
- New maintenance scripts: `fix-faq-parity.mjs`, `fix-faq-quotes.mjs`.

## v1.11.0 — 2026-09-07 — Article images generate fully offline, 591 shipped
Status: Shipped · Visibility: Public
- **591 article images generated on this machine**, across 228 articles: 270 architecture flows, 128 terminal sessions, 101 comparison tables, 51 config panels, 36 charts, 2 timelines, 2 fan-outs, 1 bar chart.
- **The whole pipeline is now local.** A local `mlx_lm.server` (Qwen2.5-7B-4bit on Apple MLX) writes the diagram specs, so there is **no API key, no per-image cost, and nothing to run out of**. Credit exhaustion was the only thing blocking the batch before; it can't block it now. The hosted API remains a fallback if the local server isn't running.
- Roughly **200 images per hour** on an M5 Pro, and nothing leaves the machine.
- **New fan-out diagram type**, because the linear flow template misrepresented one-to-many topologies: drawing a load balancer and two backends in a row claimed the second backend was downstream of the first. Fan-outs now render as true parallel siblings, with failing nodes coloured red.
- Quality guards added after reviewing real output: correct tool replies (Redis returns `(integer) 1`, not invented text), colour-coded comparison pills inferred when the model omits them, placeholder headings like "SECTION LABEL" caught before they render, edge labels that restate node names stripped, truncated JSON repaired instead of discarded, and **degenerate charts rejected** (a flat line with one spike is worse than no chart).
- **47 slots deliberately left for a human**, each with a written capture instruction: 23 browser windows, 15 other products' UIs, 5 non-Kloudbean console shots, and 4 charts whose data would not carry a story. Generating any of those would be inaccurate.
- Honest limitation recorded in the docs: charts are the weakest category, because many slots that sound like a graph are not really time-series data.

## v1.10.0 — 2026-09-07 — Automatic article images (diagrams, terminals, charts)
Status: Beta · Visibility: Public
- **Article images generate themselves from the slot description.** Every `.img-slot` placeholder already held the brief an editor would paste into ChatGPT; the engine now reads that brief and produces the image, so the manual round-trip is gone.
- **Five real visual types**, rendered as HTML/CSS + inline SVG and rasterized at retina scale: **terminal sessions, line charts, comparison tables, config panels, and architecture flows**. Text stays crisp and on-brand, which a raster image model cannot do.
- **The right renderer per slot.** A classifier reads all 739 slots and routes them: 708 structural (SVG), 24 console (real support screenshots), 7 pictorial (local model). Anything whose value is exact text never goes near an image model, because garbled labels are the clearest "this is AI" tell.
- **18 console slots filled with real dashboard screenshots**, matched to the screen each slot actually asks for (launch database, git deploy, env vars, domain aliases, staging, IP access control, and more). 5 slots deliberately left alone because they ask for a non-Kloudbean screen (a third-party admin panel, a browser Network tab).
- **Local image generation on the Mac GPU** for pictorial slots: mflux + MLX, no API key, no per-image cost, nothing leaves the machine.
- The AI only ever returns a small JSON spec; fixed templates own layout and brand, and specs are sanitized before rendering, so hundreds of images stay visually consistent and no draft can ship broken markup.
- **Every remaining slot now carries a paste-ready prompt**, written into the article as a comment right above the placeholder and collected in `content-studio/_IMAGE-PROMPTS.md`. Each one includes the brand palette, aspect ratio, per-type art direction, and a "do not invent numbers" guard, so making an image by hand no longer means re-reading the article.
- **Prompts are split honestly: 593 GENERATE and 43 CAPTURE.** The CAPTURE ones show a real browser window or another product's UI (Open WebUI, Metabase, a devtools Network tab) and are explicitly marked "do not generate", because a faked screenshot of someone else's product is something a reader can catch. Those say what to photograph and remind you to blur credentials.
- Two pilot articles fully generated and validated. Docs: `docs/ARTICLE-IMAGE-AUTOMATION.md`. Review page: `content-studio/_generated-images-review.html`.
- Remaining structural slots need AI credit to finish (roughly $0.10 to $0.30 for all of them); one command picks up where this left off.

## v1.9.0 — 2026-09-05 — Real dashboard screenshots + auto AIOSEO on publish
Status: Shipped · Visibility: Public
- **Real console screenshots across the library.** Replaced the synthetic HTML/CSS dashboard renders with the actual Kloudbean screenshots from support.kloudbean.com. Rolled across **257 unpublished articles** (553 image swaps); published articles left untouched.
- **Framework- and engine-aware.** A Next.js article shows the Next.js launch + env screens, a Django article shows Django's, and `launch-database` shows the right engine (Postgres/MySQL/MariaDB/MongoDB/Redis/Elasticsearch).
- **Step sequences, not just navigation.** Feature deep-dives (S3, load balancer, backups, SSL, UAC, staging, git) now show the full real dashboard flow as a captioned sequence; passing mentions use a single representative shot. 17 articles auto-expanded.
- Mapping is data-driven: `scripts/build-screenshot-map.mjs` (downloads real shots + writes `screenshot-map.json`), `apply-screenshot-map.mjs` (rolls it out), and a visual review page. Cloudflare deliberately skipped until its new UI ships; cron-jobs has no doc yet.
- **Publish automation (removes manual steps in AIOSEO):** on publish the engine now writes the AIOSEO **meta title + description** (chosen automatically, with H1/first-paragraph fallback so it is never blank), the **focus keyword**, the **canonical**, and sets the **featured image as the OG image** — no more setting these by hand.
- **No more double hero image.** The hero is set as the post's featured image and removed from the body, so it no longer appears twice.
- Requires the WordPress plugin updated to **v1.16.0** (adds the `/set-post-seo` route).

## v1.8.0 — 2026-09-04 — CRM + prompt-to-email ("vibe emailing")
Status: Beta · Visibility: Internal
- **CRM contacts** (`/crm`): upload your customer list from **CSV** (Excel → export CSV first). Import is an **upsert by email**, so re-uploading a fuller list updates people in place instead of duplicating them.
- **Lifecycle segments**: every contact carries a status — **paying**, **abandoned checkout** (tried to buy, never finished), **registered** (signed up, never bought), **lead**, or unknown. Segment tiles show live counts; status is editable inline.
- **Attach sending accounts** (`/email`): a **Resend** or **Brevo** API key (both send over HTTPS, no install), or a **Gmail / generic SMTP** account. Credentials are stored for the internal admin tool; test any sender with one click.
- **One prompt → an email**: describe the email in a sentence, pick a segment and a sender, and the engine writes an **on-brand, grounded** email (subject + HTML), shows a live preview and the recipient count, then sends to that segment.
- **Safety first (unchanged posture)**: every send is a **dry run** unless `EMAIL_SEND_ENABLED=1` is set. Mandatory unsubscribe link, per-recipient suppression check at send time, daily cap, and paced sending all still apply. A clear banner shows whether a click will really deliver.
- Honesty guardrails carried into the email composer: no invented numbers, no "certified", no guarantees; copy stays inside Kloudbean's grounded facts.

## v1.7.0 — 2026-09-04 — One-prompt broadcast + per-account voices
Status: Beta · Visibility: Internal
- Connect **multiple accounts per platform** (CEO, employees, company page), each with its own **persona/voice**.
- **One-prompt broadcast**: give a prompt (or a blog idea) and "Post to all now" — the engine writes a **distinct, valuable post per account**, tailored to the platform's style AND that account's voice, then posts everywhere. No manual write/post/fact-check.
- Value + honesty built into the composer: every post must carry a concrete takeaway, and stays inside Kloudbean's grounded facts (the fact-check) — no generic AI slop, no overclaims.
- Channels are auto-selected ("everywhere" by default); "Schedule to all" and "Generate drafts" also available; the scheduler publishes due posts automatically.

## v1.6.0 — 2026-09-04 — Native social integrations (no middle-man)
Status: Beta · Visibility: Internal
- Direct, native posting to each platform's own API — no n8n/Zapier required: LinkedIn, X, Facebook, Instagram, Threads, and Mastodon (`social-native.ts`).
- Connect a channel by pasting its access token + the platform's ids (author URN, Page ID, IG/Threads user ID, Mastodon instance); the connect form shows exactly what each platform needs.
- Webhook mode kept as an advanced fallback; Direct API is the default.
- Note: Meta, LinkedIn, and X require you to register an app and pass posting-scope review; the poster works the moment a valid token is connected. Click-to-authorize OAuth flows are the next step.

## v1.5.1 — 2026-09-04 — Social Publisher: repurpose from blog ideas
Status: Shipped · Visibility: Internal
- Compose from a **blog idea / article** (or a topic): the engine writes a **unique post per platform** in each channel's native voice and length (LinkedIn ≠ X ≠ Instagram), then drops them in the queue.
- Optional **staggered scheduling** — space the per-platform posts N minutes apart.
- In-app **"How to connect an account"** guide with the exact webhook payload and n8n/Zapier/Make steps.
- Source picker lists your articles/ideas; manual write-once mode still available.

## v1.5.0 — 2026-09-04 — Social Publisher: connect, schedule, auto-publish
Status: Shipped · Visibility: Internal
- New **Social Publisher** page (`/social`): connect channels, compose once, and schedule or publish to all of them.
- Channel connections stored in the DB (`social_channels`): LinkedIn, X, Facebook, Instagram, Threads, Mastodon, or a generic webhook, each with a test-ping and enable/disable.
- Post queue (`social_posts`) with draft / scheduled / publishing / posted / partial / failed states and per-channel results.
- Built-in **scheduler** (`social-scheduler.ts`): an always-on tick publishes scheduled posts when their time arrives (also swept by autopilot).
- Webhook publishing works today (point a channel at your own n8n / Zapier / Make / Buffer flow); native per-platform OAuth is a documented follow-up.
- Safe by default: nothing transmits until `SOCIAL_AUTOPOST_ENABLED=1`; a persistent banner shows armed vs dry-run.

## v1.4.0 — 2026-09-04 — Marketing Command: prompts that act
Status: Shipped · Visibility: Internal
- New **Command** console (`/command`): type a plain-English marketing request; the engine plans it into typed steps and runs them on the durable job queue with a live activity log and progress bar.
- Grounded planner: turns a request into an in-scope plan using Kloudbean's real product truth; honestly lists anything out of scope (ads, CRM, WhatsApp/SMS, bookings) instead of faking it.
- Reuses existing generators, no duplication: article pipeline (research → brief → multi-pass content), studio social/video drafts, hero images.
- **Acting steps** that can transmit: `post_social` (composes and publishes a post via a configured webhook — n8n / Zapier / Make / Buffer) and `send_email` (marketing broadcast through the guarded sender).
- Safety by default: acting steps run **dry-run** and only go live when explicitly armed (`SOCIAL_AUTOPOST_ENABLED` + `SOCIAL_WEBHOOK_URL`, or `EMAIL_SEND_ENABLED` + a provider + `BROADCAST_RECIPIENTS`). The UI shows a persistent arming banner; articles still route to the review queue for approval.

## v1.3.0 — 2026-09-04 — Company Profile & Portfolio deck
Status: Shipped · Visibility: Public
- Premium 14-slide, 16:9 company profile in Kloudbean brand (`company-profile/`), exportable to a pixel-accurate PDF.
- Cover with a dotted world-map and the Kloudbean icon hub; self-serve → managed → enterprise spectrum; enterprise infrastructure and SIEM/mission-critical-database slides grounded in the support docs.
- Selected-portfolio logo wall (permission-safe wording), client segments (governments → developers), and an Official Partners slide (AWS, GCP, Linode, Vultr, DigitalOcean, UpCloud, Cloudflare, BitNinja).
- One-command PDF export via headless Chrome.

## v1.2.0 — 2026-09-04 — Own analytics: Google Search Console
Status: Shipped · Visibility: Internal
- First-party Search Console integration (`gsc-client.ts`): pulls real clicks, impressions, CTR, and position per URL, no paid third-party tool.
- `search_performance` table + repo; matches metrics to the articles that produced them.
- Feeds the self-learning ranker with real outcomes (weighted above internal quality scores), and the Performance page shows live top pages; autopilot syncs it each cycle.

## v1.1.0 — 2026-09-04 — Autonomous SEO platform (foundation)
Status: Shipped · Visibility: Internal
- Content pipeline: Serper-driven discovery + demand gate, brief generation, multi-pass humanized content engine, deterministic quality scorecard, claim verifier, internal-link/topical-silo builder.
- Publishing: WordPress plugin (AIOSEO meta, featured image, TOC, internal links, sitemap ping) with a human review/approval queue.
- Autopilot scheduler + durable job queue + always-on runner; KLOUDGRAPH competitor intelligence; growth and link-outreach modules (draft-first, send gated).
- Media: in-app social/video studio, reels engine, image generation; brand grounding via product-truth modules + RAG.

---

<!-- New features go ABOVE this line. Keep newest first. Always include: version, date (YYYY-MM-DD), title, Status, Visibility, and a short bullet list. -->
