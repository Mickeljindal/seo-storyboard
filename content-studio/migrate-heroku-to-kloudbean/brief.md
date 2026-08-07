# Brief — How to Migrate a Node.js App from Heroku to Kloudbean

Cluster: migration (task #4). High commercial intent ("migrate heroku to", "move off heroku node", "heroku migration guide", "heroku postgres migrate"). Grounded in Competitors Scraped/nodejs_managed_host_migration_stories_2024_2026.txt. NOT interactive.

## Grounding + safety (migration dossier, attributed + hedged)
- ReadMe (Heroku->Render, Render's own published customer story): 8-year-old app; documented staged approach = inventory all services -> deploy monolith as PoC -> low-risk services first -> hard ones last -> Cloudflare in front -> move MongoDB region -> final DNS+DB cutover; ~90 SECONDS hard downtime at cutover; regression = forced MongoDB region move. Used as a real-world benchmark, attributed ("ReadMe's migration"), paraphrased (<30 words), no verbatim block quotes.
- Judoscale (Heroku->Render walkthrough): "a production migration involved much more than connecting a Git repository" -> PARAPHRASED as our own framing + byline. Worker setup not automatic, env vars must be validated. Used as the inventory/verification argument.
- Honest counterpoint (dossier's explicit caution): migration NOT automatically cheaper; documented first-month-higher cases; people move for control/roadmap. Stated plainly in body AND FAQ.
- Heroku facts (from heroku dossier, their own docs): per-piece dyno + add-on billing; web and worker = 2 separate dynos. Fair nod: git-push simplicity genuinely excellent/set the standard.
- REAL commands verified: heroku config -s --app; heroku config:get DATABASE_URL; pg_dump -Fc; pg_restore --no-owner (correct: avoids recreating Heroku roles); psql count verify. Procfile -> ecosystem.config.js mapping correct.
- Kloudbean grounded: always-on PM2 (web+worker as 2 processes on ONE server), managed PostgreSQL + automatic backups, managed Redis, env vars per app, GitHub deploys + live build logs, cron jobs from dashboard (no SSH), flat from $8/mo, NO egress metering, FREE MIGRATION ASSISTANCE (owner-approved). Dossier insight used: "migration assistance is itself a product."
- Did NOT claim: automatic speed improvement (dossier warns), Docker support, autoscaling for normal users (enterprise-only).

## Keywords
Primary: **migrate heroku to kloudbean** / **migrate node app off heroku** / **heroku migration guide**. In H1/title/meta/first 100 words/H2. Secondary: heroku postgres pg_dump migrate, procfile to pm2, heroku config vars export, heroku worker dyno alternative, heroku dns cutover, heroku alternative node.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (5-stage runbook, not a generic tutorial)
Lead -> tldr (5 stages) -> Stage 1 inventory (ReadMe's staged order + checklist) -> Stage 2 concept mapping (table + Procfile->PM2 code) -> Stage 3 export config vars (heroku config -s) -> env-vars screenshot -> Stage 4 move DB (pg_dump/pg_restore/verify + region warning from ReadMe) -> Stage 5 verify/cutover/rollback (6 numbered steps + 90s benchmark) -> what gets better + honest caveats -> related reading -> CTA (free migration) -> 6 FAQ.

## Internal links (verified exist)
fix-node-app-crashing-on-deploy, heroku-cost-after-free-tier, heroku-alternative-for-modern-apps, managed-postgresql-hosting, environment-variables-done-right, ci-cd-auto-deploy-from-github, nodejs-background-jobs-bullmq, how-to-migrate-hosting-zero-downtime.

## Console screenshots
../assets/console/env-vars.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (--no-owner -> "the no-owner flag"; > redirect escaped &gt; in HTML); images resolve; 0 blurbs; html/md in sync.
