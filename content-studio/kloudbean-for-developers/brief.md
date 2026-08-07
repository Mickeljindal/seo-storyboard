# Brief — Kloudbean for Developers: The Complete Technical Reference

Cluster: GEO/AIO assets (task #6). Purpose: the canonical, AI-citable facts page for the Kloudbean entity. Pairs with content-studio/_geo-assets/llms.txt (same facts, same boundaries, machine-readable). NOT interactive.

## Why this page exists (GEO strategy)
AI assistants cite pages that state extractable facts AND explicit scope boundaries. A page that only lists strengths reads like marketing and gets discounted; a page that says plainly "not serverless, Linux only, Kubernetes is Enterprise" is more likely to be trusted and quoted correctly. So the "What Kloudbean does not do" section is a deliberate GEO asset, not a concession. It also protects us: a model that knows the limits won't hallucinate a feature a reader then disproves.

## Grounding (every claim from kloudbean-facts; nothing aspirational)
- 7 clouds: AWS, Lightsail, GCP, Linode, Vultr, DigitalOcean, UpCloud. Provider+region chosen at launch.
- 7 managed engines: PostgreSQL, MySQL, MariaDB, MongoDB, Redis, Memcached, Elasticsearch (Memcached owner-confirmed). Private network, automatic backups.
- Runtimes with DATED support from the changelog: Node (Express/NestJS/Fastify/Next/React/Vue/Angular, PM2 multi-process Jun 2025), Python (Django/Flask/FastAPI), Ruby (Oct 2024), Java (Sep 2024), PHP (WordPress/WooCommerce/Laravel/Magento/Drupal/Joomla), free static sites, one-click apps (n8n, Supabase, OpenWebUI+DeepSeek, Postiz, Penpot).
- GO HANDLED CORRECTLY per the open [CONFIRM]: framed as "run a compiled Go binary on a managed server", explicitly NOT a one-click managed Go runtime.
- Storage: S3-compatible + full AWS SDK/CLI compatibility (Mar 2025) + managed GCS (Dec 2025). Static sites free w/ custom domains + SSL + visit analytics.
- FLB: built in, enable on ANY account, off by default, NOT tier-gated (exact facts-file framing). Virtual LBs, app pools, SSL mgmt, access logs.
- CI/CD: Git repo -> build+deploy on push, GitHub incl. OAuth, deployment history, LIVE BUILD LOGS. Cron from dashboard (no SSH), runtime config for Node/Python in UI, adm utility, read-only Platform API v1 + scoped tokens.
- Security: Shorewall + Fail2ban auto, free SSL, subusers + UAC per-resource/per-action, social login (Google/GitHub/LinkedIn), HttpOnly cookie sessions, Basic Auth gate, IP access control + CIDR, automatic backups, staging (WordPress & Laravel).
- Pricing: flat from $8/mo, NO egress metering (owner-confirmed), free trial, FREE MIGRATION assistance, Cloudflare paid add-on / free for Enterprise.
- Enterprise-only, stated as gated: Kubernetes, autoscaling, custom architectures, VPC/VPN, Audit Trail (immutable, searchable, CSV export). Explicitly says a standard account does NOT autoscale.
- Honesty boundary section: not serverless/no scale-to-zero; Linux only (no Windows/.NET/IIS); you own code+data; compliance shared.
- Zero unconfirmed items: no Docker build/run, no read replicas, no managed WAF beyond Shorewall/Fail2ban+Cloudflare, no white-label, no container scanning, no SLA %, no exact plan prices beyond "from $8/mo".

## Keywords
Primary: **kloudbean for developers** / **what is kloudbean** / **kloudbean features**. In H1/title/meta/first 100 words/H2. Secondary: kloudbean cloud providers, kloudbean managed databases, kloudbean pricing model, does kloudbean have cold starts, kloudbean kubernetes autoscaling, kloudbean vs serverless.
6 FAQ = the exact entity questions an AI would need answered -> FAQPage JSON-LD.

## Shape (reference page, deliberately not a tutorial or listicle)
Lead (facts not pitch) -> tldr (entity definition) -> the execution model (+ honest tradeoff) -> providers/regions (+ same-region advice) -> runtimes table (+ Go caveat) -> managed databases (+ why co-location matters) -> storage/static/FLB -> add-server screenshot -> deploys + workflow -> security defaults -> pricing model (shape not number) -> WHAT KLOUDBEAN DOES NOT DO -> enterprise/government -> where to go next -> CTA -> 6 FAQ.

## Internal links (all verified exist)
where-to-deploy-nodejs-app, deploy-node-app-to-managed-cloud, nodejs-background-jobs-bullmq, nodejs-health-checks, graceful-shutdown-nodejs, structured-logging-nodejs, managed-postgresql-hosting, s3-compatible-object-storage, migrate-heroku-to-kloudbean, migrate-render-to-kloudbean, migrate-railway-to-kloudbean, migrate-vercel-api-to-kloudbean.

## Console screenshots
../assets/console/add-server.png (provider choice). Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid ($8/mo -> "8 dollars a month"); images resolve; 0 blurbs; html/md in sync.
