# Brief: self-host-directus

## Role in the cluster
Silo 7 (Self-hosted tools). Pillar: best-self-hosted-tools. Cousin: self-host-strapi (headless CMS,
DISTINCT intent, cross-link). Money page: add-managed-database-to-your-app.

## Keyword grounding (honest)
Branded per-tool spoke. Real intent: self host directus, directus self hosted, directus docker,
directus vs strapi, directus headless cms, open data platform. No fabricated volume.

Primary: **self-host Directus**. Secondary: database-first headless CMS, Directus vs Strapi, wrap
existing SQL database with an API, self-hosted open data platform.

## Cannibalisation (mandatory)
Live self-host-strapi = CONTENT-FIRST headless CMS (owns/creates the schema). Directus = DATABASE-
FIRST (wraps an existing SQL DB without modifying it). Different architecture -> different reader
decision -> distinct branded query ("self host directus" != "self host strapi"). Cross-link Strapi
for the "which should I choose" comparison; do not re-teach generic "what is a headless CMS".

## Verified facts (Directus docs, Strapi comparison pages, meetrix/elest.io/markaicode)
- Directus: open-source "open data platform" / headless CMS that WRAPS an existing SQL database
  without modifying it (database-first). Works with new OR existing databases, no migration.
- Supports PostgreSQL, MySQL, MariaDB, SQLite, OracleDB, CockroachDB, MS-SQL.
- Auto-generates REST + GraphQL APIs over the DB; no-code admin/data studio; ships WebSockets and
  GraphQL subscriptions natively (Strapi does not natively).
- LICENSE (crucial, checkable): Directus uses the Business Source License (BSL). Self-hosting is free
  for organisations under a revenue/funding threshold (reported at US$5M); above that a commercial
  licence applies. HEDGE: say "currently reported around US$5M, check current terms" - do NOT assert
  a permanent figure. This is real, decision-changing info gain for a "self host directus" reader.
- Strapi (cousin, for contrast): content-first, Node.js, DEFINES and owns the schema, syncs to
  Postgres/MySQL/MariaDB/SQLite, REST + GraphQL.

## Information gain (the honest angle)
1. Database-first is THE reason to choose Directus: your data stays a normal SQL database usable by
   other services, Directus is a layer not a silo, and the data outlives the CMS. Decision cue that
   replaces the generic "pick a headless CMS" advice.
2. The BSL license threshold: a self-hoster MUST know self-hosting is free only under a revenue cap.
   Volunteering this honest gap/caveat is the strongest credibility move.
3. Because it wraps a real SQL DB, a managed Postgres/MySQL is the natural backend (KB grounded), and
   backing up that DB backs up the product.

## Claims (facts files only)
Managed server; managed PostgreSQL / MySQL / MariaDB (Directus's backend, and it gets backed up);
free auto-renewing SSL; automatic backups; S3-compatible object storage (file library); managed
reverse proxy; 7 clouds; one dashboard. NOT one-click. Honest boundary: platform runs server + DB +
SSL + backups; the Directus app, your schema/content, and license compliance are yours.

## Format
Match live self-host shape. What it is (database-first), the database-first difference vs Strapi
(table), the license you must know, what it takes to run, Directus-vs-Strapi decision, backups +
data portability, where hosting fits, related reading, FAQ. Server-based (not one-click).
