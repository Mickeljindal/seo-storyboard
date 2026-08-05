# Brief — Managed Elasticsearch Hosting (managed search-engine guide)

Silo 3 (managed databases). Spoke. Links UP to the DB pillar.

## Keywords (grounded in cluster search intent; volumes hedged, not fabricated)
- **Primary:** managed Elasticsearch hosting (how-to / capability intent)
- **Secondary / weave:** Elasticsearch hosting, managed Elasticsearch, Elasticsearch cluster, full-text search, Elasticsearch alternative to database search
- Placement: primary kw in H1, `<title>`, meta description, first 100 words, and the H2 "What managed Elasticsearch hosting actually is". Secondary terms woven through body + FAQ (which mirrors real PAA-style questions: "is Elasticsearch a database", "text vs keyword field", "do I need Elasticsearch or is Postgres FTS enough", "why does Elasticsearch use so much memory", "can I use it for logs").

## Format / shape
Managed search-engine guide (NOT the pillar's numbered-steps template; NOT the Redis cache-aside shape). Order: define -> the core teaching point (ES is a search engine, not your DB) -> decision (do you need it yet) -> use cases -> index-a-copy architecture -> connect (9200 + clients) -> indexing/mapping example (text vs keyword) -> memory/self-host reality -> managed vs self-host -> CTA -> FAQ.

Crucial teaching point up front: Elasticsearch is a search and analytics engine, not the primary database. Keep the source of truth in Postgres/MySQL and index a copy for search.

## Founder opinion (requested)
Most apps should start with Postgres full-text search (tsvector/tsquery/GIN/ts_rank) or MySQL FULLTEXT, and only add Elasticsearch when search is genuinely a first-class feature. Stated plainly, "it might cost us a sale."

## Anti-pattern / "where it breaks" beat
- Treating Elasticsearch as the only copy of data (nothing to rebuild from after a bad reindex / lost node).
- The text-vs-keyword mapping mistake (facets fragment, filters/sorts misbehave). Framed as the single most common ES bug.

## Bespoke SVG
Architecture: User -> App; App read/write -> Primary DB (navy, "source of truth"); Primary DB --green "index a copy"--> Elasticsearch (purple, "search index · a copy"); App --purple "search query"--> Elasticsearch. Brand navy #000f27 / purple #4F1AF3 / green #40b75f. Unique concept (source-of-truth vs searchable-copy), distinct from Redis cache-aside and pillar left-to-right diagram.

## Console screenshots
- ../assets/console/launch-database.png (Elasticsearch among the managed engines)
- ../assets/console/env-vars.png (connection details out of code)
- 3 img-slots: faceted search results page; a _search JSON response with _score; cluster health + JVM heap.

## Internal links (6, all folders verified to exist)
- UP (pillar): add-managed-database-to-your-app
- ACROSS: managed-redis-hosting, managed-postgresql-hosting, database-read-replicas-scaling
- support: server-backups-guide, what-is-a-vpc
- MONEY: digitalocean-vs-kloudbean

## Byline
By Kloudbean Data Team · Search belongs in a search engine, not a LIKE query. (NOT "Faster Than Ever")

## Fact grounding / honesty
- 7 managed DB engines incl Elasticsearch (MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB). Managed = provisioned/patched/private network/automatic backups; you own indices + data.
- Pricing "from $8/mo", Enterprise custom (not detailed here). Linux stacks. No customer/geo counts.
- Kept to "managed Elasticsearch" only. No managed OpenSearch claim, no specific ES version claim, no invented features.
- Real, checkable specifics only: REST on 9200, BM25 default relevance, JVM heap <=50% RAM and under ~32GB (documented guidance), text vs keyword, ELK stack. No fabricated benchmarks or customer stories.

Slug: managed-elasticsearch-hosting. Do NOT create images/hero.png (rendered by the hero pipeline).
