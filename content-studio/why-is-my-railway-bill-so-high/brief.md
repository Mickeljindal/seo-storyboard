# Brief — Why Is My Railway Bill So High? (pain-point, interactive)

Cluster: pain-point / GEO (batch task #1). Very high intent ("why is my railway bill", "is railway expensive"). Grounded in Competitors Scraped/railway_reddit_negative_review_intelligence_rag.txt. Interactive via CSS-only accordion (details.kb-acc) of the real surprise causes -> fixes (works everywhere incl. WordPress, no JS).

## Grounding + safety (from the Railway dossier's own rules)
- Facts used: plan fee (~$5 Hobby / ~$20 Pro seat) + included usage + metered CPU/RAM/DB/storage/egress; idle containers bill; egress from public DB URL; prepaid credit vs plan fee vs included usage confusion; services pause when relevant balance exhausted; memory leak/oversize inflates.
- Real examples paraphrased + attributed + hedged (NOT verbatim, <30 words): "$30 for a tiny test service", "$466 invoice", "no users but bill climbing", "sleep at night" migration sentiment.
- SAFE framings only: explicitly say "not a scam / real metered usage / hard to predict" (the dossier's recommended safe version). Do NOT assert overcharging/data-loss. Fair: Railway's DX is genuinely great for prototypes.
- No invented Kloudbean tier prices beyond "from $8/mo"; no "24/7 human".

## Keywords (real; volumes hedged)
Primary: **why is my Railway bill so high** / **is Railway expensive**. In H1/title/meta/first 100 words/one H2. Secondary: railway idle billing, railway egress, railway credits, railway spending limit, railway vs flat pricing, railway hobby plan cost.
PAA -> FAQ + FAQPage JSON-LD (7 Qs straight from the dossier's exact-question library).

## Interactive
CSS-only accordion (5 causes). No JS needed -> zero publishing risk. (JS widgets reserved for tool pages like the decision tool.)

## Shape (pain-point, no fixed template)
Lead -> tldr -> what you're paying for (2 layers) -> usual suspects (accordion) -> how to make it predictable (list) -> metered vs flat table -> when flat fits (honest boundary + Kloudbean) -> launch-database screenshot -> fits-stack links -> CTA -> 7 FAQ.

## Kloudbean facts used (grounded)
Flat from $8/mo, no egress metering (owner-confirmed), always-on Node + PM2 + GitHub deploys, managed DB in same dashboard, free migration + trial. Honest: metered platforms fit prototypes/spiky.

## Internal links (verified to exist)
render-vs-railway-vs-kloudbean, nodejs-hosting-decision-tool, where-to-deploy-nodejs-app, fix-javascript-heap-out-of-memory-node.

## Console screenshots
../assets/console/launch-database.png (used). Hero images/hero.png (empty, author drops).

## Gate
0 em-dashes; contractions; decisive; fair. >=1400 words. JSON-LD Article+FAQPage valid. Images resolve. 0 banned blurbs (incl. no "24/7 human"). .html and .md in sync. 2026.
