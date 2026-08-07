# Brief — Structured Logging in Node.js: Stop Using console.log in Production

Cluster: production-ops / GEO (task #3, final of 5). High AI-citation intent ("structured logging node", "pino tutorial", "console.log vs logger production", "node request id logging", "node log secrets redact"). Teach-first, real code, security-conscious. NOT interactive.

## Grounding + accuracy (real Pino/Node knowledge, verified)
- Why console.log fails: no levels, unqueryable, interleaved concurrent requests, inconsistent object stringification ([object Object]), and CAN be synchronous depending on destination -> may block event loop (real, documented Node behavior; framed hedged with "can/depending"). Genuine perf argument, not style.
- Real Pino API: pino({ level, redact: [...] }); logger.info(obj, msg) object-first-message-second; levels trace/debug/info/warn/error/fatal; logger.child({reqId}) inherits config + attaches context. Correct.
- Request IDs: middleware with randomUUID from crypto, honor incoming x-request-id, echo back in response header, req.log child logger. Correct + highest-value habit.
- SECURITY: redact authorization/password/token/*.secret; never log whole req.body/user object (card details/passwords leak into aggregators forever). Aligns with safety guidance on secrets.
- stdout not files (no rotation/disk mgmt in app; ephemeral server = logs vanish; platforms/process managers capture stdout; pino-pretty only piped in dev). Correct 12-factor practice.
- Kloudbean grounded + honest: always-on PM2 with output captured, logs in console, live build logs (real Aug 2025 feature), persistent process = reqId follows a full request. Explicitly says ship to an external aggregator later if you want dashboards (does NOT invent a Kloudbean log-aggregation/search product).

## Keywords
Primary: **structured logging node.js** / **pino logging node** / **console.log vs structured logging production**. In H1/title/meta/first 100 words/H2. Secondary: node json logging, pino request id, node log levels, redact secrets logs node, node log to stdout, pino vs winston, trace request through logs.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (production-ops guide, before/after framing)
Lead -> tldr -> why console.log fails (concrete, incl. event-loop) -> what a structured log looks like (unstructured vs JSON, side by side) -> setting up Pino (code) -> log levels + opinionated rule of thumb -> request IDs (middleware code, child logger) -> never log secrets (security) -> stdout not files (pino-pretty piped) -> console.log vs Pino comparison table -> reading logs on Kloudbean (honest) -> git-deployment screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist + same-batch)
nodejs-health-checks (same batch), uptime-monitoring, environment-variables-done-right, pm2-app-keeps-restarting, fix-node-app-crashing-on-deploy.

## Console screenshots
../assets/console/git-deployment.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (logger.info(req.body) paraphrased to "logging an entire request body" in JSON-LD; no raw quotes/brackets); code has no raw < >; images resolve; 0 blurbs; html/md in sync.
