# Brief — Node.js Health Checks: Liveness, Readiness, and What to Actually Check

Cluster: production-ops / GEO (task #3). High AI-citation intent ("node health check", "liveness vs readiness", "healthz readyz express", "should health check test database"). Teach-first with a strong founder opinion (the liveness-DB anti-pattern). NOT interactive.

## Grounding + accuracy (real ops knowledge, verified)
- Liveness = "is process alive" -> failure triggers RESTART. Readiness = "can it serve now" -> failure stops ROUTING, keeps process. Booting-and-connecting app = alive but not ready. Correct.
- ANTI-PATTERN (the original value here): DB check inside liveness -> DB blip fails all instances' liveness simultaneously -> platform restarts everything -> restart storm from a 2s hiccup. Rule stated: a liveness probe should never fail due to something outside the process. This is genuine engineering insight competitors' thin posts skip.
- Codes: 200 healthy/ready, 503 Service Unavailable for not-ready (conventional, LB-understood). Real code: /healthz trivial; /readyz with pool.query("SELECT 1") + redis.ping() in try/catch -> 503 with message.
- Cheap + fast: probes hit every few seconds; short timeout; cache result 1-2s to avoid probe stampede on DB. Correct.
- Readiness during shutdown: flip readiness failing FIRST so LB drains, then close in-flight (pairs with graceful-shutdown article, consistent ordering across both articles).
- Kloudbean grounded + HONEST: always-on under PM2 (process manager acts on liveness), uptime monitoring pairing. Explicitly "the endpoints are yours to write, that's application logic". No invented platform health-check UI feature.

## Keywords
Primary: **node.js health check** / **liveness vs readiness** / **healthz readyz node**. In H1/title/meta/first 100 words/H2. Secondary: express health check endpoint, health check database, 503 not ready, kubernetes liveness readiness node, health check best practices node, readiness probe shutdown.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (production-ops guide, opinionated)
Lead -> tldr (two endpoints) -> what a health check is for (two different questions) -> liveness vs readiness -> THE BIG MISTAKE (DB in liveness, restart storm) -> what to check in each -> the code (both endpoints) -> keep cheap/fast (probe stampede, caching) -> readiness + graceful shutdown ordering -> liveness/readiness comparison table -> hosting + monitoring fit (honest) -> add-application screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist + same-batch)
graceful-shutdown-nodejs (same batch), zero-downtime-deployments, uptime-monitoring, pm2-app-keeps-restarting, database-connection-pooling.

## Console screenshots
../assets/console/add-application.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (quoted phrases inside answers unquoted to keep JSON clean); code has no raw < >; images resolve; 0 blurbs; html/md in sync.
