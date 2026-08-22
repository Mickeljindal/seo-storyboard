# Brief — Cloudways Velocity Alternative (competitive / GEO, time-sensitive)

Cluster 4 (vs Competitors) + Node/GEO. Cloudways renamed its managed Node.js product to "Cloudways Velocity". TIME-SENSITIVE: own the "Cloudways Velocity alternative" and "cloudways velocity pricing" queries before general availability, dated Aug 31 on their pricing page.

## Revision history
- **v1**: led with "Cloudways is a mature managed host", framed the difference as scope. Owner rejected: it credited the parent company's maturity to an unreleased product and buried the real constraints.
- **v2**: rebuilt boundaries-first (4 boundaries) with a verified pricing table and Kloudbean's own limits stated.
- **v3, current**: owner supplied 5 more constraints. Re-verified all of them against Cloudways' pages. Three of the five were confirmed and are now the spine of the article; two needed correcting before publication (see below). Also caught that v2's central availability claim had gone stale.

## Corrections made in v3 (important, do not regress)
1. **v2 said "private preview, invite-only". That is now WRONG.** Their product page shows Public Preview: "Public Preview is open... no invite required", GA dated Aug 31. Fixed everywhere including tldr, table, FAQ, JSON-LD. Lesson: a preview-stage competitor's status is a freshness trigger, not a fact.
2. **Owner's claim "no managed DB, customers must outsource the DB" is not accurate as stated.** Velocity does provision PostgreSQL in-environment, and Redis runs as a stack service (documented restart controls). Publishing "no database" would have been false and easily disproved. The TRUE and stronger version is now in the article: their own two pages disagree on engines, and the Postgres install is irreversible.
3. **Owner's claim "no cloud selection" is right, with a nuance**: the launch flow has a "Select Server Location" step, so you choose a location within DigitalOcean, not a provider. Article says exactly that.

## v4: the maturity argument, flipped (owner request) with two numbers refused

Owner asked to claim Kloudbean maturity here: "almost 4 years" and "thousands of users". Both were declined and replaced with stronger, defensible substitutes. The section is now "Maturity, measured properly" instead of "Why 'Cloudways is mature' isn't the argument here", so maturity works FOR us rather than being dismissed.

**Refused: "almost 4 years".** The changelog says launch was November 2023. As of August 2026 that is 2 years 9 months, not 4 years. `kloudbean-facts.md` explicitly resolves this: the changelog dates are authoritative and copy should say "since 2023". A reviewer, a competitor or an AI summariser can subtract, and being caught inflating a founding date would cost more than the claim is worth.

**Refused: "thousands of users".** `kloudbean-facts.md` lists the customer-count figure under "Still to confirm" as `[CONFIRM]`. Used the approved qualitative phrasing "a large and active customer base" instead. If the owner supplies a substantiable number, it can go in.

**Used instead, and it is a better argument:** the metric that decides risk for a hosting comparison is how long the product you'd actually run your app on has been generally available. That is checkable from the changelog and it is devastating without any inflation:
- Platform launched November 2023, shipping in most months since.
- Managed Node.js August 2024 (Express, Angular); React and Vue December 2024; managed CI/CD from Git April 2025; PM2 multi-process June 2025; live build logs August 2025; Node runtime config in the UI September 2025.
- Generally available throughout. No waitlist, no invite, no preview terms.
- So: roughly two years of GA Node hosting versus zero, since Velocity's GA is dated Aug 31.
- Reinforcing point: multi-app servers, shell access and object storage were not roadmap items here, they were early. Velocity lists multi-app as a post-GA fast-follow.

The section closes by declining to oversell ("a 2023 platform, not a decade-old institution"), which is what makes the rest of it land. Also added to the tldr, the "So which one" section and the best-alternative FAQ.

## Verified competitor facts (source: Cloudways' own pages, all rephrased or short-quoted)
Sources: cloudways.com/en/managed-nodejs-hosting.php (pricing + FAQ), cloudways.com/blog/cloudways-managed-node-js-hosting-is-here/ (launch), support.cloudways.com articles 15550368 (launch flow), 15550860 (app overview), 16188001 (database), 16160257 (manage services), cloudways.com/en/pricing.php (Flexible), feedback.cloudways.com (customer voice portal).

**The five boundaries (the article's spine)**
1. **Language**: "Velocity is a JavaScript runtime". 12 framework presets per their FAQ: NextJS, Remix, TanStack, React, Astro, Nuxt, Svelte, Vite, Express, Fastify, Angular, n8n. Node LTS 22.x / 24.x. No PHP, Python, Ruby, Java, Go, WordPress.
2. **One app per server**, verbatim from their pricing FAQ: "Can I host multiple apps on one server? Not at GA. Logged in customer feedback as a post-GA fast-follow. Each app runs on its own isolated server." STRONGEST fact in the article: it confirms the owner's point in Cloudways' own words AND confirms it survives GA.
3. **Cloud**: "It runs on the Cloudways Lightning Stack on DigitalOcean infrastructure." Launch flow has "Select Server Location" (region, not provider). Cloudways is a DigitalOcean subsidiary; article frames that as a likely explanation, explicitly flagged as inference not roadmap.
4. **No documented shell.** No SSH/SFTP section in any Velocity doc; the Velocity app menu is Overview, Monitoring, Database, Backup and Restore, Deployment Management, Settings. All Cloudways SSH docs (master vs application credentials, browser terminal, SSH keys) cover Flexible/Autonomous only. Their launch post frames the terminal as unnecessary 4 times; services guide adds "without running server commands". CAREFUL: they have NOT published a statement that shell is unavailable, so the article says "not documented" and tells readers to ask Cloudways. Do not upgrade this to a flat "they do not provide shell access".
5. **No object storage anywhere on Cloudways.** No product on any plan. What exists: DigitalOcean Block Storage one-click (a disk, not a bucket) and off-site backup at $0.033/GB. Their own feedback portal has an open request for native 1-click S3 object storage integration, in the Flexible product-improvements forum. Article explains why block storage is not a substitute.

**Velocity pricing (published ladder, per application)**
Starter $20 / 2GB / 2 vCPU / 100GB CDN bandwidth · Professional $30 / 4GB / 2 vCPU / 200GB · Growth $50 / 8GB / 4 vCPU / 300GB · Scale $100 / 16GB / 8 vCPU / 400GB · Plus $150 / 32GB / 8 vCPU / 500GB.
Overages: $0.02/GB CDN bandwidth beyond allocation, $0.033/GB off-site backup. So not purely flat.
DISCREPANCY: launch post says "Pricing starts from $21/month at General Availability"; pricing page lists Starter at $20. Article reports both and calls the entry figure unsettled.
Trial: free during Public Preview; from GA, 3 days on Starter and Professional only.

**Velocity databases (the contradiction)**
- Pricing page FAQ: "PostgreSQL, MySQL, and MongoDB can all be provisioned from the dashboard."
- Support article 16188001 (more recent): only two options, PostgreSQL installed inside the Cloudways environment, or Supabase hosted externally. No MySQL, no MongoDB.
- Same article: "Can PostgreSQL be removed after installation? No." Installation is irreversible. Combined with one-app-per-server this is a permanent decision per server.
- Same article: installing PostgreSQL "only creates the database. It does not automatically update your application code." Env vars apply on next deploy.
- Redis IS a stack service (article 16160257 Manage Services: Imunify360, NGINX, PM2, Redis), restartable from the dashboard, and their FAQ warns it may hold sessions or queues. Conceded in the article.
- Security on every plan: WAF, DDoS, Imunify360 malware protection, Enterprise CDN. Round-the-clock support on all plans per their FAQ.

**Cloudways Flexible** (for the maturity contrast)
From $11/mo (2GB, 1 vCPU, 50GB storage, 2TB bandwidth); 8XL $342/mo. 5 clouds. Pricing FAQ verbatim: "There is no restriction on the number of applications you can launch on a single server." Documented SSH, SFTP, master/application credentials, browser terminal. 3-day trial, no card.

## Verified Kloudbean facts (support.kloudbean.com /docs/getting-started/subscription-tier, via crawled KB)
- Standard from $8/month; Premium custom; Enterprise $7,500/month (NOT published in the article).
- **Application Limit: "Standard Limits" on Standard and Premium; unlimited only on Enterprise.** Stated openly in body, SVG caption and FAQ. Article criticises our own docs for giving a label instead of a number, and asserts only that it is "comfortably more than one" (safe: the platform is per-server multi-app by design).
- 7 clouds; 8 server configuration options; 1GB to 128+GB.
- "9+ Managed Databases: MySQL, PostgreSQL, MongoDB, Redis, MariaDB, ElasticSearch, and more".
- BitNinja Pro: Premium and Enterprise only. Standard baseline Shorewall + Fail2ban.
- Free migration: 1 per server Standard, up to 10 Premium, unlimited Enterprise.
- Free 3-day trial, servers only; databases and load balancers bill from creation.
- Managed PostgreSQL: Starter 1GB $18/mo, S1 2GB $30/mo, S2 4GB $60/mo.
- Logs: Application Administration then Logs Viewer, App Errors tab.
- kloudbean.com/pricing/ is JS-rendered and returns no per-size server prices, so none were invented.

## Original analysis competitors do not have
- **The $60 arithmetic**: 3 modest Node services (API, worker, SSR front end) = 3 isolated servers = 3 Starter plans = $60/mo, each wanting its own irreversible Postgres. The same 3 apps on one Cloudways Flexible server would be $11, except Flexible will not run Node. So Cloudways' Node product forbids packing while their PHP product explicitly allows it.
- **Staging is the sharpest edge**: on per-app billing a staging copy is a full-price application serving nobody.
- **Anti-pattern beat** (uploads): local-disk uploads look fine for months, then a rebuild, restore or resize loses them, because nothing in the deploy pipeline treated that directory as data. Advice given regardless of platform choice.
- **Why block storage is not object storage**: a disk attached to one machine versus an HTTP API with its own durability and access control. You cannot serve a public avatar URL from a block device without the app in the request path.
- **The shell list**: five concrete tasks a dashboard cannot do (one-off migration, npm ls on transitive deps, inspecting build output, heap snapshot, anything in a 2am runbook that is not a restart).

## Keywords
- Primary: **Cloudways Velocity alternative** (H1, title, meta, first 100 words).
- Secondary now carrying real intent: cloudways velocity pricing, can i host multiple apps on one cloudways server, cloudways velocity ssh, does cloudways support wordpress on velocity, cloudways velocity databases, cloudways object storage.
- Volumes: brand-new brand term, no reliable export. Play is early ownership plus the long-tail constraint questions, which are exactly what an evaluator searches. No volumes invented.
- 12 FAQ questions mirror those constraint queries and are mirrored to FAQPage JSON-LD.

## Structure (13 H2s, boundaries-first, not a standard comparison template)
Lead -> tldr -> five boundaries table -> one app per server -> cost SVG -> maturity measured properly -> no shell -> nowhere for uploads -> the database contradiction -> real pricing (ladder + 3-way) -> what three services cost -> where Kloudbean has limits too -> which one and when -> migration -> internal links -> CTA -> 12 FAQ.

## Positioning rules honoured
- Every Cloudways claim traceable to a Cloudways page; nothing characterised beyond what they publish; the one inference (DigitalOcean ownership explaining single cloud) is labelled as inference.
- Contradictions in their material reported honestly rather than resolved in our favour.
- Redis and isolation conceded as genuine Velocity strengths; Postgres bundling conceded as a real cost advantage for one small app.
- Kloudbean's own limits stated in body, SVG and FAQ. No Enterprise dollar figure, no SLA percentage, no banned blurbs, no support-superiority claim, Cloudflare not used as an edge (parity with Cloudways).

## Assets
Hero images/hero.png (author supplies). Real console screenshot ../assets/console/s3-buckets.png. Bespoke cost SVG (3 apps 3 servers $60 versus 3 apps 1 server). 1 img-slot: Velocity plan picker.

## Internal links (9, verified to resolve)
where-to-deploy-nodejs-app, deploy-node-app-to-managed-cloud, deploy-express-app, deploy-nestjs-app, s3-compatible-object-storage, kloudbean-vs-cloudways, cloudways-alternatives, managed-postgresql-hosting.

## Gate
`node _val.mjs cloudways-velocity-alternative` -> [OK]. words=4373, em-dash html=0, md=0, FAQ parity 12, H2 count 13, blurbs 0, 9 internal links resolve.

## Freshness triggers (this page dates faster than anything else in the library)
GA on Aug 31: preview language, trial terms and the $20 versus $21 entry price all change. Multi-app-per-server shipping as the post-GA fast-follow they logged. CI/CD, multi-region or extra clouds shipping. Shell access appearing in their docs. Object storage appearing. The database contradiction being resolved either way. Kloudbean publishing a numeric application limit per tier.

## Open questions for the owner
1. The numeric application limit per Kloudbean tier, so "Standard Limits" can be replaced with a real figure here and in the docs.
2. Whether to re-check Velocity right after Aug 31, since roughly a third of this article is preview-stage fact.
3. A substantiable customer-count figure, to replace "a large and active customer base" with a number. Still `[CONFIRM]` in kloudbean-facts.md.
4. Confirm the founding-date framing. Copy says "since 2023" per the changelog, which puts the platform at 2 years 9 months as of August 2026. The owner referred to almost 4 years, which the changelog does not support. If there is earlier trading history the changelog does not cover, say so and the copy can change.
