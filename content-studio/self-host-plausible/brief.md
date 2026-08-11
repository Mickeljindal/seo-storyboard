# Brief: self-host-plausible

## Role in the cluster
Silo 7 (Self-hosted tools). Pillar: best-self-hosted-tools. Cousin: self-host-umami (privacy
analytics, DISTINCT tech + philosophy, cross-link). Money page: add-managed-database-to-your-app.

## Keyword grounding (honest)
Branded per-tool spoke. Real intent: self host plausible, plausible community edition, plausible CE
self hosted, plausible vs umami, self hosted google analytics alternative, plausible clickhouse.
No fabricated volume.

Primary: **self-host Plausible**. Secondary: Plausible Community Edition, Plausible vs Umami,
self-hosted privacy analytics, cookieless Google Analytics alternative.

## Cannibalisation (mandatory)
Live self-host-umami = privacy analytics, LIGHT (single Postgres/MySQL), shows individual visits.
Plausible = ClickHouse-backed (heavier, scales), aggregate-only philosophy, self-hosted as "Plausible
Community Edition". Genuinely different tech + philosophy -> different reader decision -> distinct
branded query. Cross-link Umami for the "vs"; do not re-teach generic "why privacy analytics".

## Verified facts (plausible.io self-hosting page, hashnode/loopwerk/openpanel comparisons)
- Plausible: privacy-first web analytics built in Elixir. Cookieless, GDPR/CCPA friendly, small
  tracking script (docs claim under 1KB).
- Self-hosted release is "Plausible Community Edition (CE)", free and AGPL-3.0 licensed; the managed
  cloud is a separate paid service whose subscriptions fund development.
- Uses ClickHouse as the analytics data store (events) alongside PostgreSQL for configuration.
  ClickHouse makes it HEAVIER to run but fast at querying large datasets.
- Philosophy: shows AGGREGATE stats; it does not give you individual-visitor drill-down. (Umami, by
  contrast, lets you inspect individual visit paths - a real, checkable difference.)

## Information gain (the honest angle)
1. THE operational fact most guides skip: self-hosting Plausible means running ClickHouse + Postgres,
   which is heavier than Umami's single database. That is the decision-changing point. Fast at scale
   because of ClickHouse, but more to run. Name it loudly.
2. "Plausible CE" clarity: what you self-host is the Community Edition (AGPL); the paid cloud is
   separate and funds development. Honest, and searchers for "plausible CE" need this.
3. Aggregate-only philosophy vs Umami's individual-visit inspection: a genuine decision cue/tradeoff.
4. Concede: for a small site wanting the lightest possible self-host, Umami's single DB is simpler.

## Claims (facts files only)
Managed server; managed PostgreSQL (Plausible's config DB, backed up); free auto-renewing SSL;
automatic backups; managed reverse proxy; 7 clouds; one dashboard. NOT one-click. IMPORTANT: Kloudbean
does NOT offer managed ClickHouse (its 6 managed DBs are MySQL/MariaDB/PostgreSQL/Redis/Elasticsearch/
MongoDB) -> ClickHouse runs on the server as part of Plausible's own stack; do NOT imply managed
ClickHouse. Honest boundary: platform runs server + Postgres + SSL + backups; ClickHouse, the Plausible
app, and your analytics data are yours to run/own.

## Format
Match live self-host shape. What it is, the ClickHouse reality (key operational point), Plausible CE
vs cloud, Plausible-vs-Umami (table), what it takes to run + backups, where hosting fits (Postgres
managed, ClickHouse on the server), related reading, FAQ. Server-based (not one-click).
