# Brief — Graceful Shutdown in Node.js: Handling SIGTERM Without Dropping Requests

Cluster: production-ops / GEO (task #3). High AI-citation intent ("node graceful shutdown", "handle sigterm node", "node drops requests on deploy", "server.close express"). Teach-first, real code, honest shared-responsibility landing. NOT interactive.

## Grounding + accuracy (real Node/OS knowledge, verified)
- SIGTERM (orchestrator, catchable) vs SIGINT (Ctrl+C, catchable) vs SIGKILL (uncatchable). Pattern: process.on(SIGTERM) -> server.close() drains in-flight -> pool.end()/redis.quit() -> process.exit(0), with setTimeout(...).unref() force-exit safety net (slightly under platform kill grace). Correct semantics (server.close stops new conns, lets existing finish, fires callback).
- Load-balancer drain: flip readiness to failing first so LB stops routing, then drain (cross-link health-checks). Correct pattern.
- Common mistakes: no handler (default immediate exit), exit too early, no timeout, forgot resources, keep-alive sockets. All accurate.
- Kloudbean grounded + HONEST: always-on PM2 + reload signals process; zero-downtime is SHARED responsibility (platform rolls, your handler drains). Explicitly framed as your side of it, no overclaim that platform does it for you. All real facts.

## Keywords
Primary: **graceful shutdown node.js** / **handle sigterm node** / **node drop requests on deploy**. In H1/title/meta/first 100 words/H2. Secondary: server.close express, node sigterm sigint, node shutdown timeout, drain requests node, zero downtime node deploy, process.on SIGTERM.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (production-ops guide, teach-first)
Lead -> tldr -> why it matters (deploy drops requests) -> signals (SIGTERM/SIGINT/SIGKILL) -> the pattern (full code) -> always add a timeout -> drain LB first (readiness, cross-link) -> common mistakes -> signal->source->catchable->action table -> enables zero-downtime (Kloudbean shared responsibility) -> git-deployment screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist + same-batch)
zero-downtime-deployments, pm2-process-manager-guide, database-connection-pooling, fix-502-bad-gateway-node-nginx, nodejs-health-checks (same batch).

## Console screenshots
../assets/console/git-deployment.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (process.on("SIGTERM", ...) -> "process.on for SIGTERM" in JSON-LD to avoid raw quotes/parens issues); code has no raw < > (${signal} template literal fine); images resolve; 0 blurbs; html/md in sync.
