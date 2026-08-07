# Brief — Render's Free Postgres Expires in 30 Days: How to Not Lose Your Data

Cluster: pain-point / GEO (batch task #1). Very high intent + fear-driven ("render database expired", "render deleted my database", "how long does render free postgres last", "back up render postgres"). Grounded in Competitors Scraped/render dossier. NOT interactive: standard article + one inline SVG lifecycle diagram + real pg_dump/pg_restore commands.

## Grounding + safety (from the Render dossier)
- Facts used: free PostgreSQL instances are time-limited, expire ~30 days after creation; warnings + grace period; deleted (with data) if not upgraded/migrated. Framed "per Render's docs" and hedged ("around", "roughly").
- Render provides an external connection string for free DBs (used in backup step). True.
- SAFE framings: documented behavior, not a scam or bug; free tier is a legitimate prototype choice. No invented Render paid prices. No claim Render deletes maliciously.
- Kloudbean grounded: managed PostgreSQL, automatic backups, same dashboard as app, runs as long as plan kept, flat from $8/mo, free migration. No expiry clock. (Did NOT claim point-in-time recovery or read replicas, which are unconfirmed.)

## Keywords (real; volumes hedged, pull exact via DataForSEO later)
Primary: **render free database expiry** / **render database deleted** / **how long does render free postgres last**. In H1/title/meta/first 100 words/one H2 ("Why your Render database expires").
Secondary: back up render postgres, pg_dump render, migrate render database, render postgres expired recover, persistent postgres hosting, render database 30 days.
PAA -> FAQ + FAQPage JSON-LD (6 Qs straight from search intent: how long lasts, why deleted, can I recover, how to back up, where to host that doesn't expire, how to migrate).

## Shape (data-loss warning + migration how-to, no fixed template)
Lead -> tldr (direct yes + fix) -> why it expires (documented) -> how to check expiry -> back up NOW (pg_dump commands) -> SVG lifecycle diagram (created->30d->grace->deleted vs persistent) -> where to move it (Kloudbean + pg_restore command) -> comparison table -> migrate without downtime (5 steps) -> launch-database screenshot -> fits-stack links -> CTA -> 6 FAQ.

## Internal links (verified to exist)
managed-postgresql-hosting, environment-variables-done-right, deploy-node-app-to-managed-cloud, render-vs-railway-vs-kloudbean, where-to-deploy-nodejs-app.

## Console screenshots
../assets/console/launch-database.png (used). Hero images/hero.png (empty, author drops). Inline SVG lifecycle diagram (brand colors navy/purple/green + red for deletion).

## Gate
0 em-dashes; contractions; decisive; fair. >=1400 words. JSON-LD Article+FAQPage valid. Images resolve. 0 banned blurbs. .html/.md in sync. Code escaped in HTML (&lt; for psql redirect). 2026.
