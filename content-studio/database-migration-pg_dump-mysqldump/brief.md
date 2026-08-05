# Brief — Database Migration with pg_dump and mysqldump

Cluster: Databases & storage. Slug: `database-migration-pg_dump-mysqldump`.
Byline (unique): **By Kloudbean · Moving Data Without Downtime.**
Intent: how-to + commercial. A developer mid-migration, moving an existing PostgreSQL or MySQL
database onto managed hosting (leaving a metered managed service or a platform they've outgrown).
This is the "X alternative" migration money page: the reader already has data and wants it moved
safely. Teach the whole job first, land on Kloudbean's one-click managed DBs + free migration help.

## Keywords

Primary: **database migration** (specifically with pg_dump and mysqldump).
Also primary-tier: **migrate PostgreSQL database**, **migrate MySQL database**.
Placed in: H1, `<title>`, meta description, first 100 words, and the H2 "The shape of every database migration".

Secondary / long-tail (woven through body + FAQ):
- pg_dump, pg_restore, pg_dump custom format (-Fc), pg_dump plain SQL, pg_dumpall vs pg_dump
- mysqldump, mysqldump --single-transaction, mysqldump --routines --triggers --events
- migrate database to managed hosting, move database to cloud, export import database
- dump and restore Postgres, dump and restore MySQL
- zero downtime database migration, database migration without downtime
- utf8mb4 migration, latin1 to utf8mb4, character set / collation drift, mojibake
- definer error (ERROR 1449), pg_restore role does not exist / --no-owner --no-privileges
- connection string change after migration, sslmode=require after migration
- migrate from Supabase / PlanetScale / RDS / Heroku Postgres (framed generically, no invented specifics)

Volume/difficulty note (hedge, never fabricate precise numbers): "database migration" is a broad,
high-intent head term with meaningful but competitive volume; the tool-specific long-tails
("pg_dump", "mysqldump --single-transaction", "definer error", "latin1 to utf8mb4") are lower
volume, lower difficulty, and very high intent (people mid-migration pasting an error into Google).
No exact volumes claimed here; re-pull from the mined SEMrush gap data / DataForSEO before relying
on figures.

## People-Also-Ask style questions (mirrored into the FAQ + FAQPage JSON-LD)

- How do I migrate a PostgreSQL database with pg_dump?
- What's the difference between pg_dump and pg_dumpall?
- Does mysqldump lock tables during the dump?
- How do I migrate a database without downtime?
- Why does my restore fail with a definer or owner error?
- How do I fix character set issues after a MySQL migration?
- pg_dump plain SQL or custom format, which should I use?
- How do I verify a database migration worked?
- Can Kloudbean help migrate my database?

## Structure (migration field-guide shape, NOT the standard how-to template)

Lead -> tldr -> "shape of every migration" (bespoke SVG pipeline) -> version-match warning ->
Postgres workflow (plain + custom, owner flags, clean/if-exists, schema/data split) ->
MySQL workflow (single-transaction/routines/triggers/events, utf8mb4, GTID note) ->
gotchas (charset drift, definer/owner, giant dumps, FK/sequence, extensions, timezone, "app can't
connect") -> scenario/flags/gotcha table -> cutover (dry run, read-only, verify, flip env var,
rollback, honest downtime note) -> verify -> Kloudbean target DB + backups + free migration ->
CTA -> FAQ.

## Visuals

- Bespoke inline SVG: 6-stage migration pipeline (Old DB -> Dump -> Transfer -> Restore -> Verify ->
  Cutover) in a snaking 2-row layout with numbered badges + a dashed green rollback loop
  (old DB stays read-only). Brand colors navy #000f27 / purple #4F1AF3 / green #40b75f. Visually
  distinct from the horizontal 4-node sibling diagram and the hub-and-spoke Postgres diagram.
- Real console screenshots: `../assets/console/launch-database.png` (provision target DB),
  `../assets/console/manage-backups.png` (immediate restore point / safety net).
- 3 `.img-slot` spacers (pg_dump/pg_restore terminal; mysqldump flags terminal; connection-details panel).

## Internal links (7, all live folders, absolute https://www.kloudbean.com/blog/<slug>/)

- add-managed-database-to-your-app (brand-new DB path; also the verify/wiring pattern)
- managed-postgresql-hosting (extensions + PG deep dive)
- managed-mysql-hosting (MySQL deep dive)
- mysql-vs-postgresql (engine choice for a fresh start)
- environment-variables-done-right (flip the connection string at cutover)
- server-backups-guide (automatic backups safety net)
- database-connection-pooling ("too many connections" after cutover)

## Honesty guardrails (grounded in kloudbean-facts.md)

- Managed engines stated: PostgreSQL, MySQL, MariaDB among 7 (Redis, Memcached, Elasticsearch,
  MongoDB). Private networking/VPC. Automatic backups. Free migration assistance + free trial
  (owner-approved to feature). Linux stacks only.
- NO invented metrics, NO customer/geo/CSAT numbers, NO autoscaling-for-normal-users claim,
  no one-click read replicas, no exact SLA. Competitors referenced only generically (managed
  platform / Postgres cloud service / WordPress MySQL), no fabricated specifics.
- Downtime told honestly: dump-and-restore = write-freeze window; true zero downtime = logical
  replication, out of scope for most small apps (stated as a founder opinion, not sold).

## [CONFIRM] facts intentionally omitted

- No customer-count / trust-number blurb.
- No exact plan price beyond linking /pricing/ (entry "from $8/mo" not needed for this topic; omitted).
- No claim that Kloudbean auto-migrates or does zero-downtime CDC; only "free migration assistance"
  (owner-approved) is stated.
- Go runtime not referenced (irrelevant to this topic).
