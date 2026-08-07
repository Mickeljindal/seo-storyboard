# Brief — Vercel vs Kloudbean for APIs: Serverless Functions or a Persistent Server?

Cluster: head-to-head (task #5, final of 3). High intent ("vercel vs kloudbean", "is vercel good for apis", "vercel function timeout", "serverless vs persistent server api"). Grounded in vercel dossier. NOT interactive.

## Angle (differentiated from the two existing Vercel articles)
- vercel-for-node-backends-limits = the LIMITS field guide (what bites).
- migrate-vercel-api-to-kloudbean = the HOW-TO (runbook + code conversion).
- THIS one = the DECISION comparison (criterion-by-criterion + side-by-side table + a 1-minute decision rule). No overlap in shape; each cross-links the others.

## Grounding + safety (STRICT, per dossier RAG rules)
- Reframed as EXECUTION MODEL comparison, not company rivalry: "request-shaped vs process-shaped". Repeatedly concedes Vercel is genuinely excellent for spiky stateless traffic + Next.js frontends, and says "if your slowest endpoint is inside the limit, this criterion is a tie and you should ignore it" (real fairness, builds citability).
- Duration: CURRENT limits (~300s default, Pro up to 800s, extended ~1800s Fluid Compute) per Vercel docs; old 10s/60s explicitly labelled HISTORICAL.
- Cold starts: credited Fluid Compute improvement; cited 99.37% zero-cold-start AS a vendor-reported stat, NOT an independent benchmark; noted it doesn't promise a quiet endpoint never cold-starts.
- WebSockets: supported via Functions + Fluid Compute BUT within duration/pricing limits + reconnects + external state. Never "unsupported".
- Background jobs: waitUntil-style background processing exists but is limit-bound + metered and NOT a durable queue w/ retries + DLQ; teams add Inngest/Trigger.dev/QStash/cloud queue. Accurate.
- DB connections: per-invocation connection -> pool exhaustion; Prisma/Sequelize/Mongoose/Drizzle/TypeORM. Accurate.
- Billing: lists the real meters (invocations, active CPU, provisioned memory, fast data transfer, fast origin transfer, edge requests); the ~$1,141 bill cited as ONE reported developer example dominated by transfer; spend management exists but is opt-in Pro. Explicitly says "Neither model is dishonest" (no smear).
- Kloudbean grounded: always-on PM2, no platform duration limit on OWN handlers (careful wording, not "unlimited"), workers + managed Redis + BullMQ, native WebSockets, one stable pool, managed PostgreSQL/Redis, resize or add load balancer for scaling, flat from $8/mo, NO egress metering, free migration.
- Founder opinion included: "the moment a queue enters the design, the persistent server has already won."

## Keywords
Primary: **vercel vs kloudbean for apis** / **is vercel good for apis** / **serverless vs persistent server node api**. In H1/title/meta/first 100 words/H2. Secondary: vercel function duration limit 2026, vercel background workers, vercel websockets limits, vercel database connections serverless, vercel api cost bot traffic, move api off vercel.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (criterion-by-criterion decision comparison)
Lead (two execution models, not two companies) -> tldr (dividing line) -> the one difference everything comes from -> duration limits -> cold starts -> background jobs + WebSockets -> database connections -> side-by-side 9-row table -> cost shape honestly -> add-application screenshot -> how to decide in a minute (rule + opinion + the split option) -> related reading -> CTA -> 6 FAQ.

## Internal links (all verified exist)
migrate-vercel-api-to-kloudbean, vercel-for-node-backends-limits, vercel-alternative-for-full-stack-apps, best-managed-nodejs-hosting-2026 (same batch), database-connection-pooling, nodejs-background-jobs-bullmq, scale-websockets-nodejs, fix-cors-error-node-production.

## Console screenshots
../assets/console/add-application.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid ($1,141 -> "1,141 dollars"; avoided the banned "1,000+" token); images resolve; 0 blurbs; html/md in sync. Fixed "A architecture" -> "An architecture" in byline.
