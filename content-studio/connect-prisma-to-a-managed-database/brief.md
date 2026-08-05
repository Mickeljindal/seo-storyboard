# Brief — Connect Prisma to a Managed Database (Postgres or MySQL)

Silo 3 (databases / ORM wiring). Type: SPOKE. Practical how-to.

## Keywords (grounded; volumes hedged, verify in SEMrush/DataForSEO before publish)
- Primary: **connect Prisma to a managed database** (in H1, title, meta, first 100 words, one H2).
- Secondary woven: Prisma DATABASE_URL, prisma migrate deploy, Prisma PostgreSQL connection,
  Prisma production database, Prisma connection pooling.
- Long-tail / PAA answered in FAQ: migrate dev vs migrate deploy, prisma generate on deploy,
  "too many clients" / pool timeout fix, do I need PgBouncer with Prisma, Prisma Postgres vs
  MySQL provider, db push vs migrate deploy in prod, Prisma SSL / sslmode.
- Real error strings used as intent anchors: "@prisma/client did not initialize yet",
  "FATAL: sorry, too many clients already", "Timed out fetching a new connection from the
  connection pool".

## Intent
A Node/TypeScript dev whose Prisma app worked locally and now needs it wired to a real,
persistent Postgres or MySQL in production. Money terms sit in the DB engine pages linked out.

## Angle / shape (avoid the pillar template)
Wiring guide organized around "connecting is easy; keeping it healthy in prod is the content."
Order: datasource block -> DATABASE_URL in env -> how Prisma pools connections (diagram) ->
migrate dev vs deploy (diagram) -> generate on build -> real deploy order -> connection pooling
(the #1 issue, founder note) -> Postgres vs MySQL provider -> anti-patterns -> fits a managed DB.
Two bespoke SVGs (pool-per-instance math; migrate dev-vs-deploy flow). Console shots: env-vars,
launch-database. 3 img-slots.

## Founder / experience beat (grounded, no fabricated stats)
The #1 Prisma-in-prod failure is connection exhaustion, not the ORM. Config beats code in nearly
every incident. Opinions: cap connection_limit deliberately; long-lived instances beat serverless
for pooling; most single-server apps don't need PgBouncer.

## Byline
By Kloudbean Engineering · Prisma in production, minus the connection storms.

## Internal links (7; absolute)
- UP pillar: add-managed-database-to-your-app (exists)
- across: managed-postgresql-hosting (exists), environment-variables-done-right (exists),
  connect-drizzle-to-postgres (SIBLING being created alongside — keep link),
  database-connection-pooling (SIBLING being created alongside — keep link)
- money/engine: managed-postgresql-hosting + managed-mysql-hosting (exist)
- workflow: ci-cd-auto-deploy-from-github (exists)

## Accuracy guardrails
- Managed Postgres + MySQL are real Kloudbean engines; env vars in UI; private network; backups;
  from $8/mo, Enterprise custom. Linux stacks. Node runtime supported.
- Do NOT claim a built-in/managed connection pooler or built-in PgBouncer. Pooling is the reader's
  to control: connection_limit in the URL, or run PgBouncer yourself. Platform gives a real DB with
  a connection ceiling, not a pooler product.
- Prisma facts kept accurate: datasource url = env(DATABASE_URL); provider postgresql|mysql;
  migrate deploy (prod, idempotent, no reset) vs migrate dev (local, shadow DB, can reset);
  prisma generate on build; default pool (CPUs*2)+1; connection_limit; pgbouncer=true + directUrl;
  sslmode=require (Postgres) / sslaccept (MySQL); db push = prototyping only.
- No customer/geo counts. Escape &lt; &gt; &amp; in <pre>. Near-zero em-dashes.

## Hero
Do NOT create images/hero.png (rendered later by the hero pipeline).
