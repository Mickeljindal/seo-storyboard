# Brief — Postgres Full Text Search (capability + decision guide)

Silo 3 (managed databases). Spoke. Links UP to the DB pillar, ACROSS to the search + Postgres siblings.

## Keywords (grounded in cluster search intent; volumes hedged, NOT fabricated)
- **Primary:** Postgres full text search (also target "full-text search in PostgreSQL" and "Postgres search"). Higher-intent, mid volume, moderate difficulty. Treat any figure as an estimate; verify in SEMrush/DataForSEO before citing.
- **Secondary / weave:** tsvector, tsquery, GIN index, ts_rank, websearch_to_tsquery, setweight, `LIKE` vs full text search, Postgres search vs Elasticsearch, do I need Elasticsearch, search without Elasticsearch, trigram / pg_trgm fuzzy search, PostgreSQL fuzzy search, typo tolerance.
- **Long-tail:** how to index full-text search in Postgres, how to rank search results in Postgres, to_tsquery vs websearch_to_tsquery, generated tsvector column, is LIKE the same as full-text search, add typo tolerance to Postgres.
- Placement: primary kw in H1, `<title>`, meta description, first 100 words, and the H2 "How does Postgres full text search actually work?". Secondary/long-tail woven through body + FAQ.
- Volumes: not asserted numerically in the article (no fabricated numbers). If the owner supplies SEMrush/DataForSEO data, record real volume + difficulty here.

## PAA-style questions (mapped into the FAQ + JSON-LD)
- Can PostgreSQL do full-text search?
- What are tsvector and tsquery?
- Is LIKE the same as full-text search?
- How do I index full-text search in Postgres?
- How do I rank search results in Postgres?
- Should I use to_tsquery or websearch_to_tsquery?
- How do I add typo tolerance to Postgres search?
- Postgres full text search vs Elasticsearch, what's the difference?
- Do I need Elasticsearch for search?
- Can I run both managed PostgreSQL and Elasticsearch on Kloudbean?

## Format / shape (NOT a reused template)
Capability-teach + decision guide. Order: why LIKE isn't search (4 failure modes) -> how FTS works (tsvector/tsquery/@@/to_tsvector/websearch_to_tsquery) -> pipeline SVG -> ranking (ts_rank) -> speed (generated column + GIN index) -> fuzzy (pg_trgm) -> LIKE vs FTS vs ES table -> honest limits of Postgres FTS -> the decision + sync tax + founder opinion -> Kloudbean tie-in (both engines, one dashboard) -> CTA -> FAQ. Distinct from the Elasticsearch article (which is a "search engine, not your DB" architecture guide) and the Postgres pillar (extensions/JSONB/connections).

## Founder opinion (taken, not hedged)
If search is a feature of your app and the data already lives in Postgres, start with Postgres FTS. Move to Elasticsearch only when search becomes a core product surface or FTS visibly strains. Don't stand up an Elasticsearch cluster to search 500 blog posts.

## Anti-pattern / "where it breaks" beats
- Shipping full-text search with no GIN index, then blaming Postgres for being slow at scale.
- Feeding raw user input into `to_tsquery` (throws `syntax error in tsquery`); use `websearch_to_tsquery`.
- The sync tax: running Elasticsearch means a copy of Postgres data you must keep in sync forever (write path + reindex + reconciliation).

## Bespoke SVG (unique concept)
Left-to-right pipeline: Query text ("running cats", navy) --websearch_to_tsquery--> tsquery ('run' & 'cat', purple) --@@ match--> tsvector on a GIN index (dark navy) --ts_rank--> Ranked results (green, "best match first"). Brand navy #000f27 / purple #4F1AF3 / green #40b75f. Distinct from the ES "source of truth vs searchable copy" diagram and the Postgres pillar "core + extensions" hub.

## Console screenshots (both verified to exist)
- ../assets/console/launch-database.png (managed PostgreSQL now, managed Elasticsearch later)
- ../assets/console/server-health.png (CPU/RAM/disk; the "when FTS strains" cue)
- 3 img-slots: EXPLAIN ANALYZE Seq Scan on the ILIKE query; EXPLAIN Bitmap Index Scan after the GIN index; a did-you-mean suggestion driven by pg_trgm.

## Internal links (7, all folders verified with `ls -d`)
- managed-postgresql-hosting (source-of-truth pillar / money)
- managed-elasticsearch-hosting (the graduate-to engine; referenced twice)
- add-managed-database-to-your-app (env-var wiring)
- mysql-vs-postgresql (choose-the-tool sibling)
- when-to-use-redis-vs-postgres (add-when-needed judgment sibling)
- what-is-a-vpc (private network)
- server-backups-guide (automatic backups)
- NOT linked (folders do not exist yet): database-indexing-explained, pgvector-for-ai-apps.

## Byline
By Kloudbean Data Team · Search Without a Second Database. (NOT "Faster Than Ever")

## Fact grounding / honesty
- Kloudbean facts used: managed PostgreSQL AND managed Elasticsearch are both one-click managed engines among the 7 (MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB); private networking (VPC); automatic backups; controlled access; one dashboard; env vars for connection details; free migration + free trial; from $8/mo (not stated in body). No customer/geo counts, no SLA %, no provisioning-time metric.
- Postgres FTS technical specifics are real and checkable: `to_tsvector('english', 'The cats were running fast')` -> 'cat':2 'fast':5 'run':4; `websearch_to_tsquery` -> 'run' & 'cat'; `@@` match; `ts_rank` + `setweight`; generated tsvector column + GIN inverted index; `pg_trgm` trigram similarity with `%` and `similarity()`; `to_tsquery` raises `syntax error in tsquery` on bad input. No fabricated benchmarks or customer stories.
- Elasticsearch strengths stated fairly (BM25, analyzers, synonyms, facets, distributed scale) without dismissiveness.

Slug: full-text-search-postgres. Do NOT create images/hero.png (rendered by the hero pipeline).
