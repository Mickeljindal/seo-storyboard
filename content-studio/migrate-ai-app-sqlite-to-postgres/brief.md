# Brief: migrate-ai-app-sqlite-to-postgres

## Target
- **Primary keyword:** migrate SQLite to PostgreSQL
- **Secondary / long-tail:** SQLite to Postgres migration, move off SQLite, convert SQLite database to Postgres, pgloader, SQLite vs Postgres types, migrate database without losing data, AI app database migration, reset Postgres sequence after import, SQLite AUTOINCREMENT to SERIAL, migrate SQLite with Prisma / Drizzle / Django.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no figures are fabricated here. Treat as a mid-tail, migration-intent query in the AI-deploy cluster (a natural next step after `why-sqlite-data-disappears-on-redeploy`). Re-pull real Volume + KD before scaling the sub-cluster. Grounding is intent-based, not volume-based (per the SEO OS: relevance over raw volume).

## Reader + business outcome
- **Reader:** someone who built an app with an AI builder (Lovable, Cursor, Bolt, Replit) or by hand, shipped it on SQLite, and is now watching data vanish on every redeploy. They need to move to a managed Postgres cleanly, without losing rows.
- **Business outcome:** capture migration-stage intent in the "Deploy AI / Vibe-Coded Apps" cluster and route to Kloudbean managed PostgreSQL + free migration assistance, landing on the honest managed boundary.

## Intent + format
- **Intent:** transactional/how-to (I have decided to move; show me how), with an informational tail (the type gotchas).
- **Format:** a real migration playbook. Plan-at-a-glance, an original migration-flow SVG, a SQLite-vs-Postgres type table, two honest paths (pgloader and the ORM route) with real commands, a safe cutover with a rollback note, one opinion, one anti-pattern, deep FAQ. Deliberately NOT the same section order as the reference chatbot article.

## Cannibalisation check (mandatory)
- `why-sqlite-data-disappears-on-redeploy` owns WHY SQLite loses data (the mechanism). This page links to it for the why and does NOT re-argue it; it owns the HOW of moving off.
- `add-managed-database-to-your-app` owns first-time wiring of a managed DB. Linked for the provision/repoint step, not duplicated.
- `managed-postgresql-hosting` owns running Postgres. Linked, not duplicated.
- `persistent-storage-for-ai-apps` owns the which-store decision. Linked once.
- `database-connection-pooling` owns pooling. Linked where connection limits come up (production load after cutover).
- `production-database-design-for-ai-apps` owns schema design. Linked from the types section.
- `last-mile-of-vibe-coding` is the pillar. Linked UP.
- Decision: distinct intent (the migration itself), build it.

## Information gain (one sentence)
A real SQLite-to-Postgres migration walkthrough for AI-built apps: the exact type-and-dialect gotchas (AUTOINCREMENT to SERIAL, loose typing, 0/1 booleans, TEXT dates, sequence reset), two honest paths (pgloader vs your ORM) with copy-paste commands, and a safe cutover that verifies row counts before repointing DATABASE_URL and keeps the old .db as rollback.

## Kloudbean grounding (facts only)
Managed PostgreSQL runs outside the app, provisioned from one dashboard, reached via a connection string; access locked down by IP allow-listing (whitelist the app server's IP; public access off by default; private VPC is Enterprise-only, not the default). Automatic backups, free SSL, Git deploy. Free migration assistance is owner-approved to feature. $8/mo is the only confirmed price. Honest managed boundary: platform runs the server/stack/SSL/backups/patching; customer owns code + data. No invented numbers, uptime, benchmarks, or customers. No banned claims.

## Internal links used (all resolve)
Up: last-mile-of-vibe-coding. Across: why-sqlite-data-disappears-on-redeploy, add-managed-database-to-your-app, managed-postgresql-hosting, persistent-storage-for-ai-apps, database-connection-pooling, production-database-design-for-ai-apps. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs migrate-ai-app-sqlite-to-postgres` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity, blurbs=0, internal links resolve, words >= 1400. (hero.png + H2-count off-by-one warnings acceptable.)
