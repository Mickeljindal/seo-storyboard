# Brief — How to Migrate a Node.js App from Railway to Kloudbean

Cluster: migration (task #4). High commercial intent ("migrate railway to", "move off railway", "export railway database", "railway alternative flat pricing"). Grounded in railway dossier + migration dossier. NOT interactive.

## Grounding + safety (railway dossier's own safe framings)
- Railway facts: plan fee + metered CPU/memory/database/storage/EGRESS; IDLE services still bill; plan fee vs included usage vs prepaid credit confusion is hard to forecast; connecting to DB over PUBLIC URL can count as egress (real, actionable pre-migration check).
- SAFE framing used verbatim per dossier: "It isn't overcharging, it's real metered usage that's genuinely difficult to forecast." No "scam", no invented Railway prices (didn't restate $5/$20 here, just "plan fee").
- Fair nod (one, measured): Railway's instant-provisioning DX genuinely good/great to get running fast; metered is DEFENSIBLE for prototypes with spiky usage. Then land on flat.
- Dossier caution respected: first-person Railway migration postmortems are NOT well documented, so this article makes NO fabricated migration-story claims about Railway (unlike the Heroku/Render articles which cite real ReadMe/Judoscale accounts). Zero invented case studies.
- ORIGINAL VALUE competitors lack: the VOLUME warning (volumes are NOT in a DB dump -> uploads lost), the public-URL-egress check, drain-the-queue-before-cutover, and "actually delete the project since idle bills".
- REAL commands: railway variables / railway variables --kv; pg_dump -Fc from Railway proxy URL (host.proxy.rlwy.net:PORT/railway = real Railway URL shape); pg_restore --no-owner; psql verify; mysqldump/mysql for MySQL.
- Kloudbean grounded: always-on PM2, managed PostgreSQL + MySQL + Redis (all real engines) w/ automatic backups, S3-compatible buckets with full AWS SDK/CLI compatibility (real, Mar 2025), env vars per app, GitHub deploys + live build logs, flat from $8/mo, NO egress metering (owner-confirmed), FREE MIGRATION.

## Keywords
Primary: **migrate railway to kloudbean** / **move off railway** / **railway migration guide node**. In H1/title/meta/first 100 words/H2. Secondary: export railway database, railway variables cli, railway volume migrate, railway egress, railway flat pricing alternative, railway idle billing.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (runbook led by the WHY/billing mechanics, distinct from Heroku's inventory-led and Render's deadline-led shapes)
Lead -> tldr -> why teams move (metered mechanics + public-URL egress check) -> Stage 1 inventory (volumes emphasized) -> Stage 2 mapping table + ecosystem.config -> Stage 3 export vars + DB (commands, Redis/queue decision) -> launch-database screenshot -> Stage 4 THE VOLUME (S3 object storage) -> Stage 5 verify/cutover (7 steps + delete project) -> what you gain + honest tradeoff -> related reading -> CTA -> 6 FAQ.

## Internal links (all verified exist)
why-is-my-railway-bill-so-high, render-vs-railway-vs-kloudbean, railway-alternative-for-vibe-coded-apps, s3-compatible-object-storage, managed-postgresql-hosting, environment-variables-done-right, nodejs-background-jobs-bullmq, how-to-migrate-hosting-zero-downtime.

## Console screenshots
../assets/console/launch-database.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (--kv/-Fc/--no-owner spelled out; > redirect escaped &gt; in HTML); images resolve; 0 blurbs; html/md in sync.
