# Brief — Migrate Hosts With Zero Downtime (checklist / playbook)

Cluster 4. Primary kw: migrate hosting zero downtime / move website new host no downtime / migrate from heroku. Intent: how-to.
Real data: heroku migrate/migration (50 each), "migrate from heroku to aws" (50) — migration is a strong intent. Generic playbook applies to leaving any host.
FORMAT: Checklist/playbook (phases). Fresh format for C4 (used head-to-head/decision/Q&A/listicle/cost/teardown). Opener = the fear ("migrations feel scary because of downtime").
Phases: 0 prep (inventory, LOWER DNS TTL first) / 1 stand up new home (provision, deploy code, set env — SCREENSHOT git-deployment.png) / 2 move data (initial DB+files sync) / 3 test on new host via hosts-file/temp domain BEFORE cutover / 4 cutover (final delta sync, flip DNS, monitor) / 5 after (keep old host until propagation, then decommission). Common mistakes.
Key correct concepts: lower TTL beforehand, final delta sync, keep old host live during propagation.
Honesty woven: Linux; managed=server/stack/SSL/backups, you own app+data.
Dashboard: git-deployment.png. Byline: "Kloudbean · Land the migration, skip the downtime."
Slug: how-to-migrate-hosting-zero-downtime. Links: managed-vs-unmanaged-hosting, kloudbean-vs-cloudways, add-managed-database, heroku-alternative (cluster 1).
