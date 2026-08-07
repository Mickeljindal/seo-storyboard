# Brief — Vercel for Node.js Backends: The Limits That Actually Bite

Cluster: pain-point / GEO (batch task #1). High intent ("can you run a node backend on vercel", "vercel function timeout", "vercel websockets", "vercel serverless limits", "vercel surprise bill"). Grounded in Competitors Scraped/vercel_node_backend_negative_review_intelligence_rag.txt. NOT interactive: standard article + vercel.json code block + comparison table + FAQ + JSON-LD.

## Grounding + safety (STRICT per dossier RAG rules — this competitor changed limits over time)
- Timeouts: used CURRENT limits (per Vercel docs): ~300s default, Pro up to 800s, extended ~1800s with Fluid Compute; memory Hobby 2GB/1vCPU, Pro/Ent up to 4GB/2vCPU. Tagged old 10s Hobby / 60s Pro as HISTORICAL, explicitly. Did NOT assert "always times out at 10s".
- WebSockets: did NOT say "unsupported". Said current docs support via Functions + Fluid Compute BUT within duration/pricing limits + external state for rooms/presence/pubsub + reconnect handling. Contrasted with persistent ws/Socket.IO+Redis.
- Cold starts: Fluid Compute reduced; cited Vercel's own "99.37% zero cold starts" AS a vendor stat, not independent benchmark; noted low-traffic endpoints most exposed.
- Billing: framed as "hard to forecast" (combines invocations/active CPU/provisioned memory/fast data transfer/fast origin transfer/edge requests/build minutes), NOT "always surprise bills". Real reported example attributed: one dev's $1,141.89 (mostly fast transfer + edge requests); bot traffic. Noted spend management exists but is opt-in Pro.
- DB connections: per-invocation connection -> pool exhaustion under bursts; Prisma/Sequelize/Mongoose/Drizzle/TypeORM. True serverless issue.
- Framing: architectural MISMATCH, not defect. Vercel genuinely excellent for Next.js frontends. Honest split recommended: frontend on Vercel + backend on persistent server. No "scam".
- Kloudbean grounded: always-on Node under PM2 (no duration ceiling on own handlers), workers + managed Redis (BullMQ), WebSockets on real process, managed DB same dashboard/region (stable pool), flat from $8/mo, NO egress metering, free migration.

## Keywords (real; volumes hedged, pull exact via DataForSEO later)
Primary: **vercel node.js backend limits** / **can you run a node backend on vercel** / **vercel serverless function timeout**. In H1/title/meta/first 100 words/one H2 ("The execution-duration limit").
Secondary: vercel websockets, vercel background jobs, vercel cold start, vercel surprise bill, vercel maxDuration, vercel database connections serverless, vercel vs persistent server, move api off vercel.
PAA -> FAQ + FAQPage JSON-LD (6 Qs: can you run a backend, function timeout, websockets now, big bill, cold starts, should I move API off).

## Shape (limits field-guide / architecture, no fixed template)
Lead -> tldr (direct + current numbers) -> how Vercel runs your backend (serverless, not persistent) -> duration limit (current numbers + vercel.json code + historical tag) -> cold starts (Fluid Compute + vendor-stat caveat) -> long-running/background jobs (external queue needed) -> WebSockets (accurate current nuance) -> billing hard to forecast (meters + $1,141.89 example) -> DB connections under serverless -> comparison table -> when to use a real server (Kloudbean + honest frontend-stays-on-Vercel split) -> add-application screenshot -> fits-stack links -> CTA -> 6 FAQ.

## Internal links (verified to exist)
vercel-alternative-for-full-stack-apps, best-vercel-alternative-for-databases, database-connection-pooling, where-to-deploy-nodejs-app, deploy-express-app.

## Console screenshots
../assets/console/add-application.png (used). Hero images/hero.png (empty, author drops).

## Gate
0 em-dashes; contractions; decisive; fair. >=1400 words. JSON-LD Article+FAQPage valid ($1,141.89 -> "about 1,141 dollars" in JSON-LD; avoid "1,000+" banned token -> used "1,141.89"/"about 1,141 dollars", NOT "1,000+"). Code escaped (no raw < >). Images resolve. 0 banned blurbs. .html/.md in sync. 2026.
