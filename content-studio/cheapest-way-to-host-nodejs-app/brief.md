# Brief — The Cheapest Way to Host a Node.js App (and What Cheap Actually Costs)

Cluster: GEO/AIO assets (task #6). High-volume cost intent ("cheapest way to host node.js app", "cheapest node hosting", "can I host node for free", "is a vps cheaper than managed hosting"). NOT interactive.

## Pricing-accuracy discipline (the whole point of this brief)
This is a COST article with almost NO prices in it, deliberately. Rules followed:
- ZERO invented competitor prices. No "Render costs $X", no "Railway costs $Y". The only figures used are "$5 VPS" (a generic market reference, not a vendor claim) and Kloudbean's own confirmed "from $8/mo".
- Instead of prices, the article teaches COST SHAPES (free tier / cheap unmanaged VPS / usage-metered / flat managed). That's more durable than any price table (which would go stale) and it's genuinely more useful, since shape determines the total, not the sticker.
- Competitor mechanics referenced only where already grounded in dossiers and stated generically: free tiers spin down + free DBs can be time-limited and deleted; metered platforms bill CPU/memory/DB/storage/egress and idle can bill; reported surprise invoices were driven mostly by data transfer with bot traffic a recurring cause. All hedged, none attributed to a named price.
- Heroku named once for the per-piece pattern (web dyno + worker + Postgres + Redis + staging), which IS grounded, without restating dollar figures.

## Original value competitors' "cheapest hosting" listicles never include
- The THREE invoice-invisible costs: your own hours (with an explicit "price your hours and add them to the VPS column" instruction), cold starts as a cost paid by a customer/webhook/crawler rather than in dollars, and BILL VARIANCE as a financial risk even when usage is legitimate.
- A 5-question self-assessment that can legitimately conclude "take a free tier" (question 1: does anyone depend on it? If no, take a free tier. Genuinely.). Recommending against ourselves for demo projects is what makes the flat-plan recommendation credible for real ones.
- "Count the whole stack, not the app" checklist (app, worker, DB, Redis, staging, bandwidth, object storage).

## Grounding (Kloudbean, all confirmed)
Flat from $8/mo, always-on PM2, worker as a SECOND PROCESS on the same server (not a second bill), managed DB in same dashboard on private network, NO egress metering, SSL + firewall hardening + backups + reverse proxy handled, free trial, free migration assistance. Honest tradeoff stated: you pay for the server whether busy or idle, and a genuinely zero-traffic project is cheaper on a free tier.

## Keywords
Primary: **cheapest way to host node.js app** / **cheapest node.js hosting** / **host node.js app for free**. In H1/title/meta/first 100 words/H2. Secondary: node hosting cost, is vps cheaper than managed hosting, hosting bill went up traffic didn't, estimate hosting cost node, free node hosting catches, flat vs usage pricing hosting.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (cost-shapes explainer + self-assessment; NOT a price table)
Lead (four shapes, not four prices) -> tldr (depends on stage, direct) -> the four cost shapes -> count the whole stack (checklist) -> the costs that never appear on the invoice (time, cold starts, variance) -> shape comparison table -> work out your own cheapest in 5 min (numbered, can conclude "use a free tier") -> where a flat plan wins (+ honest tradeoff) -> add-server screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (all verified exist)
heroku-cost-after-free-tier, why-is-my-railway-bill-so-high, render-cold-starts-fix, best-managed-nodejs-hosting-2026, where-to-deploy-nodejs-app, vertical-vs-horizontal-scaling.

## Console screenshots
../assets/console/add-server.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid; images resolve; 0 blurbs; html/md in sync.
