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

## v5: the Kloudbean application-limit claim was WRONG and is removed (owner-confirmed)

**What I got wrong.** v2 to v4 asserted that Kloudbean caps application count below Enterprise, sourced from the support docs row "Application Limit: Standard Limits [Standard] / Standard Limits [Premium] / Unlimited [Enterprise]". I read "Standard Limits" as an undisclosed numeric cap and then wrote it into the tldr, the pricing table, the cost section, the limits section, the SVG and the FAQ, and even criticised our own docs for not publishing the number.

**The truth, owner-confirmed.** There is no limit on the number of applications or tools on a single server, on any plan, whether it's an $8 server or a $1,000 one. The tiers differ by FEATURES, not by limits: VPC and VPN, Kubernetes, autoscaling, audit trail, enterprise support, dedicated account managers, BitNinja Pro, migration volume. Moving up a tier buys capability, never permission to run more apps. The real ceiling is the server's RAM, CPU and disk, which is a sizing judgement rather than a product limit.

**Why this mattered more than a normal error.** It was self-inflicted damage in the one section designed to build credibility. The article was attacking Velocity's one-app-per-server rule while inventing a competing limitation for us, which weakened the single strongest point on the page.

**Blast radius: contained.** Grepped the whole library. The claim existed only in this article. Every other article already states it correctly: `deploy-express-app`, `deploy-fastify-app`, `deploy-nestjs-app` and `how-to-deploy-any-app` all say multiple apps per server is a first-class feature and not a hack, `what-is-sni` uses "Many apps per server" in its CTA line, and `how-agencies-host-20-client-apps` already gives the correct answer in full: there's no magic number, watch memory first, twenty-plus light-to-moderate sites on one properly sized machine is realistic.

**What replaced it**, and it's a better section than what it replaced:
- Pricing table row now reads "No cap on any plan. The ceiling is the server's RAM and CPU".
- The cost section states the number of apps is not a billing lever at any tier, on an $8 server or a $1,000 one.
- The limits section opens by naming what is NOT on the list, then makes the tier point explicitly: moving up buys capability, never permission to run more apps.
- The remaining limit is honest and genuinely useful: the box is the ceiling, nobody can give you the number in advance, a dozen cached brochure sites fit where one busy Laravel app with workers will not, watch memory first.
- The FAQ answer flipped from "Yes, and it's worth knowing" to "No", with the features-not-limits explanation.

**v5b, second pass after the owner reinforced the point.** The facts were right after v5 but the framing still invited the misread, because a resource-sizing note was sitting inside a section headed "Where Kloudbean has limits too". Three further changes:
- That section is now "What Kloudbean charges extra for, and what it leaves to you". It contains only genuine cost and tier facts. The sizing note was removed from it entirely, because server capacity is physics on every host, not a Kloudbean limit, and listing it under "limits" read like a concession on app count.
- New closing beat in the one-app-per-server section names the real distinction: "a product rule versus physics. Velocity permits one application per plan, and no amount of money changes that number. A per-server platform permits as many as the machine will hold, then hands you the memory graph and lets you decide. One of those is a decision somebody else made about your architecture."
- Added `how-agencies-host-20-client-apps` as an internal link and as evidence, since we have already published where the real capacity ceiling lands. Internal links now 10.

The FAQ question "Does Kloudbean have application limits too?" is deliberately kept, because people search that objection, and the answer now opens with "No."

## v6: tier section rewritten on owner corrections. Two of these contradict our own docs and steering.

Section renamed from "What Kloudbean charges extra for, and what it leaves to you" to **"What the tiers actually change"**, because the owner's point is that tiers are capability plus service level, never permission or quota.

**1. "Databases cost extra" was overstated. VERIFIED against our own docs.** `/docs/application-deployment/deploying-nextjs` states that by default a new server gives you `Node 20.X, NPM 10.X, NVM (latest), MariaDB > 10.6 (optional)`. So the server stack already carries MariaDB and a JS app can use it with no second subscription. Managed databases are an OPTIONAL separate product for when you want the DB sized, backed up and scaled independently. The $18/$30/$60 PostgreSQL figures stay, correctly scoped. Velocity's bundled Postgres is still conceded as fair for one small app, but the framing "theirs included, ours extra" was wrong and is gone. Also fixed in the tldr, the pricing table row and the final FAQ.

**2. BitNinja: our steering and the tier docs were wrong, or at least misleading.** `kloudbean-facts.md` says BitNinja is "not the baseline" and the subscription-tier doc shows `❌ [Standard] · ✅ Free ($24/month value) [Premium/Ent]`. Owner states it is available on Standard, Premium and Enterprise. Checked `/docs/server-management/enabling-bitninja-security`: it contains NO plan gating and NO pricing at all, just how to enable it on your server plus resource guidance. Reconciled honestly as: available on any plan, enabled from server management, included at no cost on Premium and Enterprise, with Shorewall plus Fail2ban as the Standard baseline. The `✅ Free` marker is about inclusion, not availability.

**3. New information gain from that same doc**, and it's the kind of thing no competitor publishes: BitNinja needs resource headroom. Check memory and CPU before enabling and keep memory under roughly 80 to 85 percent after, because a security layer that starves the app is not a win. Straight from our docs, genuinely useful, and it makes the section read like operators wrote it.

**4. Cloudflare stated as parity, explicitly.** Both Cloudways and Kloudbean resell a Cloudflare Enterprise add-on, so it is NOT presented as an edge, per the standing rule in `kloudbean-facts.md`. Free for Kloudbean Enterprise users. Noted that Velocity includes Cloudflare CDN in-plan with metered bandwidth beyond allocation.

**5. Trial scoping made two-sided instead of a one-way concession.** Ours covers servers only. Velocity's own GA trial is 3 days on Starter and Professional only, which is verified from their pricing FAQ. Neither is generous, neither is unusual.

**6. The tier difference is reframed as SERVICE LEVEL, and this is the strongest addition.** On Standard nothing is restricted and the architecture is the customer's to run: resize, add nodes behind the load balancer, decide when to split. On Premium and Enterprise the Kloudbean team implements, manages and monitors alongside the customer's developers, in their Slack or on WhatsApp, closer to an extended in-house infrastructure team than a support queue. Owner-stated, and consistent with the in-house-team positioning in `kloudbean-enterprise-compliance.md`. No SLA percentage, response time or outcome promised.

**Steering updated** (`kloudbean-facts.md`, left unstaged): BitNinja availability corrected, MariaDB-in-the-stack recorded, and the tiers-are-capability-and-service rule written down.

**Docs action for the owner:** the support-docs row "Application Limit: Standard Limits" reads as a cap to anyone outside the company, including AI summarisers ingesting the docs. It should say unlimited, or state that the constraint is server resources. It misled this article and it will mislead customers.

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
- **Redis. SOURCE: support.cloudways.com article 16160257, "How to Manage Services for Your Cloudways Velocity Application".** That page lists the Velocity services as Imunify360, NGINX, PM2 and Redis, with Restart and Stop controls, and its FAQ says verbatim that Redis "may also be used for sessions, queues, or temporary application data". Both of those are quotable.
  - **CORRECTED (owner challenged the sourcing, rightly).** An earlier draft added "So sessions and BullMQ are covered without a third-party vendor." That was NOT in any Cloudways source. BullMQ is never named by them, and more importantly nothing in the Velocity docs shows how you obtain Redis connection details: the Velocity Database section documents only in-environment PostgreSQL or external Supabase. The Redis Access screen with key prefix, username and password (article 5124164) is documented for the FLEXIBLE platform, not Velocity. So "covered" was an unsupported inference built on top of two supported facts.
  - The article now credits what is sourced (Redis runs in the stack, restart and stop controls, their sensible warning) and stops explicitly at the unknown, telling the reader to ask Cloudways whether credentials are exposed. The database FAQ answer carries the same caveat.
  - LESSON for this file: the pattern to watch is a true fact plus a plausible consequence presented as one claim. "Redis is running" is sourced. "Therefore your queues are covered" is a product-capability claim and needs its own source.
- Security on every plan: WAF, DDoS, Imunify360 malware protection, Enterprise CDN. Round-the-clock support on all plans per their FAQ.

**Cloudways Flexible** (for the maturity contrast)
From $11/mo (2GB, 1 vCPU, 50GB storage, 2TB bandwidth); 8XL $342/mo. 5 clouds. Pricing FAQ verbatim: "There is no restriction on the number of applications you can launch on a single server." Documented SSH, SFTP, master/application credentials, browser terminal. 3-day trial, no card.

## Verified Kloudbean facts (support.kloudbean.com /docs/getting-started/subscription-tier, via crawled KB)
- Standard from $8/month; Premium custom; Enterprise $7,500/month (NOT published in the article).
- **NO application-count limit on any plan (owner-confirmed, Aug 2026). Do not regress this.** See the v5 correction block below. The support docs' "Application Limit: Standard Limits" row is a misleading label, not a numeric cap.
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

## Internal links (10, verified to resolve)
where-to-deploy-nodejs-app, deploy-node-app-to-managed-cloud, deploy-express-app, deploy-nestjs-app, s3-compatible-object-storage, how-agencies-host-20-client-apps, kloudbean-vs-cloudways, cloudways-alternatives, managed-postgresql-hosting.

## Gate
`node _val.mjs cloudways-velocity-alternative` -> [OK]. words=4927, em-dash html=0, md=0, FAQ parity 12, H2 count 13, blurbs 0, 10 internal links resolve.

## Freshness triggers (this page dates faster than anything else in the library)
GA on Aug 31: preview language, trial terms and the $20 versus $21 entry price all change. Multi-app-per-server shipping as the post-GA fast-follow they logged. CI/CD, multi-region or extra clouds shipping. Shell access appearing in their docs. Object storage appearing. The database contradiction being resolved either way. Kloudbean publishing a numeric application limit per tier.

## Open questions for the owner
1. The numeric application limit per Kloudbean tier, so "Standard Limits" can be replaced with a real figure here and in the docs.
2. Whether to re-check Velocity right after Aug 31, since roughly a third of this article is preview-stage fact.
3. A substantiable customer-count figure, to replace "a large and active customer base" with a number. Still `[CONFIRM]` in kloudbean-facts.md.
4. Confirm the founding-date framing. Copy says "since 2023" per the changelog, which puts the platform at 2 years 9 months as of August 2026. The owner referred to almost 4 years, which the changelog does not support. If there is earlier trading history the changelog does not cover, say so and the copy can change.
