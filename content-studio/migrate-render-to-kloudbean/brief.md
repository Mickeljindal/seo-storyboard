# Brief — How to Migrate a Node.js App from Render to Kloudbean

Cluster: migration (task #4). High commercial intent ("migrate render to", "move off render", "export render postgres", "render alternative always on"). Grounded in render dossier + migration dossier. NOT interactive.

## Grounding + safety
- Render facts (per Render's docs, hedged): free web services spin down ~15 min idle, ~1 min cold start; paid don't spin down; free PostgreSQL expires ~30 days + grace period then deleted; External Database URL available in dashboard. Service-per-process model (web service, worker, cron job each its own service/price).
- Migration dossier: ReadMe's forced cross-region DB move used as a region-planning warning (attributed as "a documented Heroku-to-Render migration"); ~90 seconds hard downtime at cutover used as a realistic benchmark (attributed, hedged "documented migration of a mature app").
- Fair nod (one, measured): Render's Git deploys + clean service model genuinely pleasant; free tier legitimate for prototypes you don't mind sleeping. Then land: move when it stops being a prototype.
- REAL commands: pg_dump -Fc from Render external URL; pg_restore --no-owner; psql count verify. npm ci && npm run build carries over. ecosystem.config.js for web+worker.
- Kloudbean grounded: always-on PM2 (NO spin-down), managed PostgreSQL + automatic backups + NO expiry, managed Redis, env vars per app, cron from dashboard, GitHub deploys + live build logs, flat from $8/mo, NO egress metering, FREE MIGRATION assistance.
- No invented Render prices. No "scam". No claim of automatic speed improvement.

## Keywords
Primary: **migrate render to kloudbean** / **move off render** / **render migration guide node**. In H1/title/meta/first 100 words/H2. Secondary: export render postgres, render database expired migrate, render cold start fix migrate, render worker alternative, render to always-on host, render dns cutover.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (runbook led by the URGENT free-DB deadline, distinct from the Heroku article's shape)
Lead (3 real triggers) -> tldr -> FIRST: check your deadline (free tier, immediate pg_dump) -> Stage 1 inventory -> Stage 2 concept mapping table + ecosystem.config -> Stage 3 move DB (commands + region warning) -> launch-database screenshot -> Stage 4 env vars -> Stage 5 verify/cutover (6 steps + 90s benchmark) -> what changes for the better (+ fair Render nod) -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist)
render-free-database-expiry, render-cold-starts-fix, render-vs-railway-vs-kloudbean, managed-postgresql-hosting, environment-variables-done-right, fix-node-app-crashing-on-deploy, how-to-migrate-hosting-zero-downtime.

## Console screenshots
../assets/console/launch-database.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (-Fc -> "custom-format flag", --no-owner -> "no-owner flag"); && escaped &amp;&amp; in HTML prose; images resolve; 0 blurbs; html/md in sync.
