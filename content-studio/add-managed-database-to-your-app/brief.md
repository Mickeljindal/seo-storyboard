# Brief — Add a Managed Database to Your Vibe-Coded App

Cluster 1. Primary kw: add database to app. Secondary: managed Postgres for app, add database to Lovable app, database for vibe-coded app, connect app to managed database.
Intent: how-to, commercial. A builder whose deployed app needs a real, persistent database (or wants to move off a metered hosted DB onto one beside the app).
Angle: Practical how-to. Why a managed DB beside the app (persistence, ownership, latency, backups, no separate metered service). Steps: DBS -> Launch Database (Postgres/MySQL), get credentials, set as env vars (never hardcode), run migrations/import, verify, backups. Gotchas: connection string in env not code, connection pooling, run migrations on deploy, don't expose DB publicly. When external managed DB (e.g. Supabase) is fine vs consolidating.
Distinct: focused capability how-to (not a full deploy guide) — link pillar/deploy for full flow.
Slug: add-managed-database-to-your-app. Images: hero.png + ../assets/console/git-deployment.png (shows Runtime Config/env context). Links: pillar, env-vars article, pricing.
Honesty guardrails: Linux stacks, Postgres/MySQL managed; managed=backed up/secured by platform, you own schema/data; server-level backups default, daily+DR on Premium/Enterprise. No blurbs.
