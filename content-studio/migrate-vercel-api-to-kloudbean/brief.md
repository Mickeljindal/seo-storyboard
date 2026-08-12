# Brief — Move Your API Off Vercel: Migrating Serverless Functions to a Node Server

Cluster: migration (task #4, final of 4). High intent ("move api off vercel", "vercel to express migration", "vercel api alternative", "next.js api route to express"). Grounded in vercel dossier + migration dossier (Trophy + migrate-by-feature). NOT interactive.

## Grounding + safety (STRICT — Vercel limits changed over time)
- Framing: this is a SPLIT, not "leave Vercel". Frontend stays on Vercel (genuinely excellent at that), API moves to persistent server. Dossier's own safer statement: architectural mismatch, not defect. Stated twice (teach-first + closing).
- Vercel accuracy: current limits "far more generous than the old 10-second days, but a hard ceiling still exists" (does NOT assert 10s as current). WebSockets = "supported now with Fluid Compute, but bound by function limits and requiring external state" (accurate, not "unsupported"). Billing = combines invocations/active CPU/provisioned memory/data transfer, "hard to forecast" + bot exposure (not "always surprise bills").
- Trophy (Vercel->DigitalOcean, DEV first-person): trigger PARAPHRASED + attributed as "a founder at an API company" — per-request pricing wouldn't work long term for heavy ingest; wanted to pay for CPU/bandwidth/memory not request count. DELIBERATELY OMITTED the $1,000-2,000 vs $130,000/mo projection (dossier: must stay attributed to author, not usable as a price comparison) — safest to omit entirely. Also omitted "Don't use Vercel for APIs" (too aggressive for our voice).
- Migrate-by-feature Reddit lead: used the SAFE indexed details only (a process running past 30 seconds, a library that didn't build well in the serverless env), attributed vaguely as "someone who migrated by feature". No invented outcome/perf claims (dossier caution).
- ORIGINAL VALUE competitors lack: the THREE THINGS THAT BREAK (CORS, cross-origin cookies SameSite=None/Secure vs shared parent domain, DB connection string) — the cookie/auth one is the real killer nobody documents. Plus the route-handler->Express before/after conversion, and endpoint-by-endpoint strategy via NEXT_PUBLIC_API_BASE_URL.
- REAL code: Next.js App Router route handler (export async function POST(request), Response.json) -> Express router.post with req.body/res.status().json(). cors() with env-driven allowlist + credentials. pg_dump/pg_restore/psql. All correct.
- Kloudbean grounded: always-on PM2 (no duration ceiling on own handlers), real workers + managed Redis for BullMQ, WebSockets on persistent process, stable connection pool, managed PostgreSQL, object storage, IP allow-listing, flat from $8/mo, NO egress metering, FREE MIGRATION.

## Keywords
Primary: **move api off vercel** / **migrate vercel api to node server** / **vercel serverless to express**. In H1/title/meta/first 100 words/H2. Secondary: next.js api route to express, vercel api timeout migrate, cors after splitting frontend api, samesite none cookies api subdomain, vercel api cost high traffic, persistent node api.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (split-migration guide, deliberately different from the other 3 runbooks: decision-first + code-conversion + "what breaks")
Lead (the split thesis) -> tldr -> decide what actually needs to move (5 categories, incl. "if none apply, stay put") -> converting a route handler (before/after code) -> THE THREE THINGS THAT BREAK (CORS code, cookies/SameSite, DB connection) -> migrate endpoint by endpoint (env base URL) -> add-application screenshot -> moving the data (commands) -> what you get -> fair Vercel credit -> related reading -> CTA -> 6 FAQ.

## Internal links (all verified exist)
fix-cors-error-node-production, database-connection-pooling, vercel-for-node-backends-limits, vercel-alternative-for-full-stack-apps, deploy-express-app, deploy-nestjs-app, nodejs-background-jobs-bullmq, scale-websockets-nodejs, environment-variables-done-right.

## Console screenshots
../assets/console/add-application.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (req.body/request.json()/res.status().json()/Response paraphrased in JSON-LD; SameSite=None -> "SameSite None"; no raw < > or unescaped quotes); images resolve; 0 blurbs; html/md in sync.
