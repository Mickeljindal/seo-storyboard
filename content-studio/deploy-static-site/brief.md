# Brief — How to Deploy a Static Site (and What Static Really Means)

Slug: deploy-static-site
Byline: By Kloudbean Engineering · Just Files, Served Fast.
Cluster: Deploy / hosting fundamentals. Shape: concept explainer + capability how-to hybrid (not the fixed step-by-step template).

## Keywords (ground in real search intent; volumes hedged, never fabricated)
- Primary: **deploy a static site** (in H1, title, meta description, first 100 words, and one H2).
  Also target **static site hosting** and **host a static website**. These are steady, high-intent
  hosting terms; treat any specific volume figure as approximate unless pulled from DataForSEO/SEMrush.
- Secondary / long-tail:
  - static site generator, deploy HTML site, host a Vite / React build, dist folder
  - Astro deploy, Hugo deploy, Eleventy deploy, Jekyll deploy, Next.js static export (out/), Nuxt generate
  - custom domain static site, free static hosting, SSL for a static site, HTTPS static site
  - static vs dynamic site, is a React app static, single page app 404 on refresh
  - deploy dist folder, npm run build output, publish directory
- Volume note: I did NOT have a live DataForSEO/SEMrush pull for this run (no /tmp/mined_topics.json for
  this slug). Keywords chosen from intent + the topic brief. If exact volume/difficulty is needed,
  re-mine via DataForSEO (.env creds) before publish and record numbers here. No invented volumes in copy.

## PAA-style questions (mirrored into the on-page FAQ + FAQPage JSON-LD)
- What is a static site?
- How do I deploy a static site?
- Is a React app a static site?
- Do I need a server to host a static website?
- How do I add a custom domain and SSL to a static site?
- Why does my single-page app return a 404 when I refresh a deep link?
- What is the difference between a static site and a dynamic site?
- Can a static site talk to a database or an API?
- Is static site hosting free on Kloudbean?

## Angle / original value (best page on the web for this query)
- Define static vs dynamic precisely: static = files served as-is (no PHP/Node per request);
  dynamic = code runs each request. "Static" describes the server, not the page. A React/Vue SPA is
  static files; an SSR app is not. Kill that confusion head-on.
- What produces a static site: hand-written HTML; a bundler build (Vite/CRA -> dist/ or build/);
  an SSG (Astro/Hugo/Eleventy/Jekyll, plus Next static export -> out/ and Nuxt generate). Real build
  commands in code blocks + a tool -> command -> output-folder table.
- How static hosting works: web server serves files, CDN caches at edge, SSL on top. No app process,
  near-zero attack surface, fast because it's just files.
- Original gotcha: SPA deep-link 404 on refresh, and the rewrite-to-index fallback rule
  (Nginx try_files ... /index.html; and the _redirects `/*  /index.html  200` equivalent). Prerendered
  SSG sites don't hit it.
- Honest boundary: a static front end that calls an API still needs that API hosted (managed app + DB)
  and CORS configured. Static hosting covers the front end, not the backend. Never ship secrets in the bundle.

## Kloudbean tie-in (grounded ONLY in kloudbean-facts.md)
- FREE static site hosting: custom domain + free auto-renewing SSL + built-in visit analytics (Jan 2025).
- Grow into a full app on the same dashboard: managed apps (Node/Python/PHP/Ruby/Java + more),
  7 managed databases (MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB),
  built-in object storage. Managed CI/CD from Git with live build logs.
- Cloudflare edge caching mentioned lightly as a PAID add-on (not part of the free tier). No CDN claim
  baked into the free static tier (facts don't state one). No invented metrics, no SLA %.

## Visuals
- Bespoke inline SVG (navy #000f27, purple #4F1AF3, green #40b75f): source -> build -> static files
  (dist/public: HTML/CSS/JS) -> web server + CDN -> browser, with a STATIC vs DYNAMIC contrast strip.
  Distinct from other deploy diagrams (this is a pipeline + contrast, not a decision tree).
- Real console screenshots: ../assets/console/git-deployment.png (build + deploy from Git) and
  ../assets/console/ssl-certificate.png (free SSL on the custom domain).
- 3 .img-slot spacers (em-dash-free hints): build-output terminal, SPA 404 vs fixed, static-site analytics.
- Hero images/hero.png rendered later by the hero pipeline (do NOT create it here).

## Internal links (7, all confirmed to exist; absolute https://www.kloudbean.com/blog/<slug>/)
- how-to-deploy-any-app (pillar / mental model, link UP)
- deploy-fullstack-react-app-to-production (when the SPA grows a real backend)
- add-managed-database-to-your-app (growing into a full app)
- ci-cd-auto-deploy-from-github (build + deploy from Git)
- cdn-explained (CDN / edge caching)
- ssl-tls-explained (the HTTPS layer)
- what-is-a-managed-server (the backend side, managed server concept)
- environment-variables-done-right (pointing the front end at the API URL)

## Voice / honesty guardrails
- Humanized by default: near-zero em-dashes in prose, contractions, bursty sentences, one founder aside,
  teach-first. No banned blurbs (1,000+, 30+ countries, two-minute, 24/7 human).
- Linux stacks; "managed" = server/stack/SSL/backups/patching handled, you own code + data.
- Static hosting is free; app/DB plans start from $8/mo (verify on pricing page). No enterprise dollar figure.

## [CONFIRM] facts omitted from copy (not asserted)
- No customer/geo/CSAT numbers, no SLA %, no specific enterprise pricing.
- Did not claim the free static tier bundles a CDN (facts don't state it); framed CDN as a general concept
  and Cloudflare edge as a paid add-on only.
- Length target 2200-2600 words.
