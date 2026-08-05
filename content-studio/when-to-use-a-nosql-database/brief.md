# Brief: when-to-use-a-nosql-database

## Slug
`when-to-use-a-nosql-database` → https://www.kloudbean.com/blog/when-to-use-a-nosql-database/

## Silo / cluster
Databases & storage. Sits alongside the mysql-vs-postgresql / managed-mongodb-hosting decision cluster.
Angle: an honest, teach-first decision guide (not a NoSQL sales pitch). Real position taken:
most apps should start relational; reach for a document store only when data is truly
document-shaped; JSONB in Postgres is the underrated middle path.

## Byline (unique)
By Kloudbean Database Team · Document or Table?

## Keyword targets
Volumes are hedged estimates from typical search-tool ranges, NOT exact figures. Verify against
DataForSEO / SEMrush before treating as precise. Never publish a fabricated number.

### Primary
- **when to use a NoSQL database** (informational, mid volume, low-to-mid difficulty)
  - Also targeting the higher-volume head terms it answers: **SQL vs NoSQL**, **NoSQL vs relational**
  - Placement: H1, <title>, meta description, first 100 words, and an H2
    ("So, when should you actually use a NoSQL database?"). "SQL vs NoSQL" also in an H2.

### Secondary
- SQL vs NoSQL (head term, higher volume, higher difficulty)
- NoSQL vs relational database
- document database
- MongoDB vs PostgreSQL
- when to use MongoDB
- do I need NoSQL

### Long-tail / supporting
- key-value store / key-value database
- schema flexibility / flexible schema
- denormalization
- ACID vs BASE
- eventual consistency
- JSONB in Postgres / can Postgres store JSON documents
- polyglot persistence
- when to use a document database
- is MongoDB better than PostgreSQL

## People-Also-Ask style questions (mapped into the on-page FAQ + FAQPage JSON-LD)
1. When should I use a NoSQL database?
2. What is the difference between SQL and NoSQL?
3. Is MongoDB better than PostgreSQL?
4. Do I need NoSQL to scale?
5. Can PostgreSQL store JSON documents?
6. What is polyglot persistence?
7. Should I start with SQL or NoSQL?
8. What does NoSQL actually mean?
9. What is the difference between ACID and BASE?
10. Is NoSQL faster than SQL?

## Structure (intentionally NOT the standard how-to template)
Concept + decision-guide shape:
1. Lead + TLDR (answer-first).
2. "NoSQL isn't one thing" — the four families (document, key-value, wide-column, graph).
3. SQL vs NoSQL differences + comparison table.cmp (schema, joins, transactions, query
   flexibility, scaling, typical fit).
4. Bespoke SVG decision fork (relational shape vs document shape → default vs document-when,
   with a JSONB middle-path callout). Distinct from the mongodb "two shapes" diagram and the
   mysql-vs-postgresql vertical decision tree.
5. When to actually use NoSQL (document fits + denormalization + a document JSON example).
6. When relational is the better default (founder position, the $lookup anti-pattern).
7. The middle path: JSONB in Postgres (original value + real SQL example).
8. ACID vs BASE (concept + honesty: MongoDB added multi-doc ACID in 2018).
9. Polyglot persistence and when NOT to add a second DB.
10. Kloudbean tie-in (start relational, add later), CTA, FAQ.

## Internal links (7, all folders confirmed to exist)
- mysql-vs-postgresql
- managed-postgresql-hosting
- managed-mongodb-hosting
- managed-redis-hosting
- when-to-use-redis-vs-postgres
- managed-elasticsearch-hosting
- add-managed-database-to-your-app

## Screenshots
- ../assets/console/launch-database.png (relational + document engines in one list)
- ../assets/console/dashboard.png (whole-stack / polyglot on one dashboard)
Plus 3 .img-slot spacers (families sketch, JSONB query result, polyglot architecture diagram).

## SVG concept
Horizontal decision fork: one question node "What shape is your data?" splitting into a
relational-shape card (purple) → "Default: Postgres / MySQL" and a document-shape card
(green) → "Document store (MongoDB)", with a dashed JSONB middle-path box bridging them.
Brand colors navy #000f27 / purple #4F1AF3 / green #40b75f.

## Grounding / honesty notes (kloudbean-facts.md)
- Kloudbean facts used: 7 managed engines (PostgreSQL, MySQL, MariaDB, MongoDB, Redis,
  Memcached, Elasticsearch), one dashboard, private networking (VPC), automatic backups,
  connection via env var, free migration, free trial, from $8/mo, one-click launch.
- NO invented metrics, customer counts, SLA %, or benchmarks.
- ACID/BASE + "MongoDB added multi-document ACID transactions in 2018" is a general,
  verifiable industry fact, not a Kloudbean claim.
- [CONFIRM] facts deliberately OMITTED: none needed for this topic. No read-replica one-click
  claim (framed generically as "read replicas when reads pile up"). No autoscaling claim.
```
