# Brief — Cloudways Velocity Alternative (competitive / GEO, time-sensitive)

Cluster 4 (vs Competitors) + Node/GEO. Cloudways renamed its managed Node.js product to "Cloudways Velocity". TIME-SENSITIVE: own the "Cloudways Velocity alternative" and "what is Cloudways Velocity" queries while their pages are new, so we rank and get cited before the term settles.

**REWRITE, Aug 2026.** The first version led with "Cloudways is a mature managed host" and framed the difference as scope only. Owner rejected that framing: it credited the parent company's maturity to a product that is still in invite-only private preview, and it buried the four hard boundaries that actually decide the evaluation. Rewritten around the boundaries, with a real verified pricing table and Kloudbean's own limits stated openly.

## Angle (one line)
Read what Velocity refuses to run before you read what it runs well. It is JavaScript only, on one cloud, with one database, invite-only, and billed per application. If your stack is mixed, it is not a candidate, and that is Cloudways' own published position rather than our characterisation.

## Verified competitor facts (source: Cloudways' own pages)
Sources: cloudways.com/blog/cloudways-managed-node-js-hosting-is-here/, support.cloudways.com articles 15550368 and 15550860, cloudways.com/en/pricing.php. All rephrased or short-quoted for compliance.

**Cloudways Velocity**
- "Velocity is a JavaScript runtime" for web applications, APIs and backend services. Named workloads: Astro, React, Angular, Express, Fastify. Node 22.x and 24.x.
- "It runs on the Cloudways Lightning Stack on DigitalOcean infrastructure." One cloud.
- "Provision PostgreSQL alongside your application." Postgres only; external or no database also allowed.
- "Currently in Private Preview", invite-only, waitlist. Still "on the way" at GA: broader cloud provider support, CI/CD pipelines, multi-region.
- "Pricing starts from $21/month at General Availability." Complimentary during preview, terms apply.
- Plan is chosen PER APPLICATION: "click Add Application if you want to launch another Velocity application", each with its own plan, database credentials, monitoring and backups.
- Includes WAF, DDoS protection, Imunify360, Cloudflare CDN.
- Renamed from "Cloudways Node.js"; their docs describe it as a product name change.

**Cloudways Flexible** (the WordPress/PHP product, for the maturity contrast)
- From $11/mo (2GB RAM, 1 vCPU, 50GB storage, 2TB bandwidth). Top tier 8XL $342/mo (128GB, 24 vCPU).
- 5 clouds: DigitalOcean, Vultr, Linode, AWS, Google Cloud.
- Pricing FAQ, verbatim: "There is no restriction on the number of applications you can launch on a single server."
- 3-day trial, no card. Cloudflare Enterprise CDN is a paid add-on. Bandwidth overage varies by cloud; offsite backup $0.033/GB.
- NOTE: their pricing page rendered Micro and Small both at $11/2GB, likely a toggle artifact, so cite only "from $11/mo".

## Verified Kloudbean facts (source: support.kloudbean.com /docs/getting-started/subscription-tier, via the crawled support KB)
- Standard from $8/month; Premium custom; Enterprise listed at $7,500/month (NOT published in the article).
- **Application Limit: "Standard Limits" on Standard and Premium; unlimited only on Enterprise.** Stated openly in the article and in the FAQ.
- 7 IaaS cloud providers; 8 server configuration options; sizes 1GB to 128+GB.
- "9+ Managed Databases: MySQL, PostgreSQL, MongoDB, Redis, MariaDB, ElasticSearch, and more". Article says "9+ documented" rather than the older "seven engines" line.
- BitNinja Pro: not on Standard; free on Premium and Enterprise. Standard baseline is Shorewall plus Fail2ban.
- Free migration: one per server on Standard, up to 10 on Premium, unlimited on Enterprise.
- Free 3-day trial, servers only. Databases and load balancers bill from creation.
- Managed PostgreSQL pricing (kloudbean.com/managed-databases-postgresql/): Starter 1GB $18/mo, S1 2GB $30/mo, S2 4GB $60/mo. Conceded as a real cost point in Velocity's favour for a single small app, since Velocity bundles Postgres.
- kloudbean.com/pricing/ is JS-rendered and returns no per-size server prices to a fetcher. Per-size Kloudbean server prices were therefore NOT invented; the table compares entry price plus billing unit, which is the decision-relevant axis anyway.

## Keywords
- Primary: **Cloudways Velocity alternative**. In H1, title, meta description, first 100 words. Secondary informational capture: **what is Cloudways Velocity**.
- Secondary: cloudways velocity pricing, cloudways node.js, does cloudways support node, cloudways velocity vs, managed node.js hosting, cloudways alternative for node.
- Volumes: no reliable export for this term yet; it is a brand-new brand term, so demand is low today and the play is early ownership rather than volume. No volumes invented.
- PAA to FAQ (10, mirrored to FAQPage JSON-LD): what is Velocity; does it support WordPress; can it run PHP/Python/Ruby; how much does it cost; is it generally available; how many apps per plan; which clouds; which database; best alternative; does Kloudbean have app limits too.

## Structure (boundaries-first, not the standard comparison template)
Lead (what it will not do) -> tldr -> the four boundaries table -> gate SVG -> "why Cloudways is mature isn't the argument here" -> the per-application billing inversion -> verified 3-way pricing table -> **where Kloudbean has limits too** -> so which one and when -> migration -> internal links -> CTA -> 10 FAQ.

## Positioning rules honoured
- Clouds: Kloudbean 7 is a strict superset of Cloudways Flexible's 5. Velocity is 1.
- Cloudflare is parity with Cloudways, so it is NOT used as a Kloudbean edge here.
- No support-superiority claim, no "24/7 human", no banned blurbs. Enterprise dollar figure not published. No SLA percentage claimed.
- Kloudbean's own limits are stated in the body AND in the final FAQ. Postgres bundling conceded to Velocity. Both were deliberate credibility moves, not hedging.
- Every Cloudways claim is traceable to a Cloudways page. Nothing about Velocity is characterised beyond what they publish.

## Assets
Hero images/hero.png (author supplies). Real console screenshot ../assets/console/add-application.png. Bespoke gate SVG (four boundaries as gates, pass vs turned away). 2 img-slots: Velocity plan picker, Logs Viewer App Errors tab.

## Internal links (verified to resolve)
where-to-deploy-nodejs-app, deploy-node-app-to-managed-cloud, deploy-express-app, deploy-nestjs-app, kloudbean-vs-cloudways, cloudways-alternatives, managed-postgresql-hosting.

## Gate
`node _val.mjs cloudways-velocity-alternative` -> [OK]. words=2656, em-dash html=0, md=0, FAQ parity 10, H2 count 9, blurbs 0, 8 internal links resolve.

## Freshness triggers (re-check before publish and quarterly)
Velocity reaching general availability; the $21 GA price changing; CI/CD, multi-region or extra clouds shipping; Velocity gaining a second database engine; Cloudways Flexible entry price moving; Kloudbean publishing the numeric application limit per tier.

## Follow-ups
Cloudways Velocity vs Kloudbean (direct head-to-head), best-managed-nodejs-hosting-2026, migrate-from-render, migrate-from-railway. Ask the owner for the numeric application limit per tier so "Standard Limits" can be replaced with a real number.
