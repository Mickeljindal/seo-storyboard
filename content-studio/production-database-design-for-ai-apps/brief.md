# Brief - Production Database Design for AI Apps: The Schema a Real SaaS Needs

Cluster: 1 - Deploy AI / Vibe-Coded Apps. Intent: informational leading to commercial (managed
PostgreSQL + managed Redis). Reader: an engineer or founder who prompted an AI app into existence
(Cursor, Lovable, Bolt, a LangChain tutorial) and is now trying to design a schema that survives real
users, billing, and a "delete my account" request. They can write SQL; they haven't run a SaaS DB before.

## Angle / format (deliberately NOT the fixed template)
Practical schema field guide for a real AI SaaS, table by table, with the WHY for each. Thesis: the
model gets the attention; the schema is what actually outlives the code. Shape: what-makes-it-different
framing -> ER picture (bespoke SVG) -> walk each table group (users/conversations/messages ->
documents/embeddings -> usage/billing -> audit -> deletion) -> indexing strategy -> Postgres vs Redis
split -> honest product landing. No "Step 1..6" scaffold; it reads as a schema walkthrough.

## Cannibalisation check (mandatory)
Read the H2 set of pgvector-for-ai-apps and add-managed-database-to-your-app before writing.
- pgvector-for-ai-apps OWNS the vector-store how-to: what is pgvector, choosing a vector DB, HNSW vs
  IVFFlat, distance operators, storing/querying embeddings at depth. This page must NOT re-teach that.
  Resolution: a .note up top explicitly hands the vector-store deep dive to pgvector-for-ai-apps and
  links it. Here embeddings appear only as ONE table group in a bigger schema (documents + doc_chunks),
  to show WHY vectors can sit beside relational data, not how to tune an index.
- add-managed-database-to-your-app OWNS the plumbing (connect an app to a managed DB, connection string,
  env vars). This page is schema DESIGN, not wiring. Distinct intent -> link across.
- database-connection-pooling OWNS pooling. Referenced once, not re-explained.
- last-mile-of-vibe-coding = the whole category map of what breaks in prod; this = one deep sub-problem
  (the data model). Links UP to it. No two pages chase one intent.

## Keywords (grounding)
NOTE ON VOLUMES: no verified SEMrush/DataForSEO export was pulled for this exact slug at draft time, so
no numeric volume/KD is asserted anywhere in the copy. "database design for AI apps" is a rising,
high-intent developer/builder query with clear commercial pull (people asking it are building and need
managed Postgres + Redis). Re-mine or confirm in the keyword tool before quoting any figure.

- Primary: **database design for AI apps**. Placed in H1/<title>, meta description, first 100 words
  ("Good database design for AI apps..."), and the H2 "What database design for AI apps really comes down to".
- Secondary: AI SaaS database schema, storing embeddings in Postgres (pgvector), usage and token
  metering, soft delete vs hard delete, audit log table, Postgres vs Redis.
- Long-tail / PAA woven into body + FAQ: "what tables does an AI SaaS need", "store embeddings in the
  same Postgres database", "soft delete vs hard delete", "how do I let a user delete all their data",
  "build the usage table on day one", "which columns should I index", "what belongs in Redis instead of
  Postgres", "do I need a separate vector database".

## Original value / cannot-copy angle
- A complete, opinionated starter schema for an AI SaaS in copy-paste SQL: users, conversations,
  messages, documents, doc_chunks (embedding vector), usage_events, billing_records, audit_log. Most
  articles show one table; this shows how they fit together and cascade.
- Bespoke ER SVG showing the relationships (a user has many conversations has many messages; a document
  has many chunks; usage rolls up to billing; audit references the actor). Different from siblings'
  pipeline/box diagrams.
- ONE opinion: build the usage/token table on day one. Retrofitting metering after launch means
  reconstructing history you never recorded, and you cannot bill or rate-limit on data you don't have.
- ONE anti-pattern: no deletion path. A schema with no soft-delete column and no FK cascades turns a
  "delete my account" request into manual surgery across a dozen tables, and it's the moment you discover
  which tables you forgot. Shown mechanically, then fixed with ON DELETE CASCADE + a one-transaction erase.
- Concrete, checkable specifics (general engineering truth, hedged, no fabricated benchmarks): a
  denormalized user_id on doc_chunks so the permission filter is one column; the filter-first pgvector
  query using `<=>`; keeping billing/usage rows after deletion by nulling the user_id (anonymize, not
  delete) for accounting; index the FK/created_at/vector columns you actually query, not everything.

## Bespoke SVG (distinct from siblings)
ER-style sketch. users hub (navy fill) on the left; three branches right: conversational
(conversations -> messages), knowledge (documents -> doc_chunks/embeddings, green stroke = the
AI-specific, pgvector bit), money (usage_events -> billing_records, dashed "rolls up"); audit_log at the
bottom with a dashed "writes to" line from users/actors. Arrows purple #4F1AF3, brand navy #000f27,
green #40b75f. figcaption teaches the one-to-many reading. Different from rag-in-production's two-pipeline
diagram and last-mile's whole-stack box diagram.

## Tables (>=1 required; using 2)
1. Soft delete vs hard delete (what happens, reversible, query cost, right for, risk).
2. Postgres (system of record) vs Redis (fast, ephemeral) - what data lives where, and the rule: if
   losing it is a disaster it's Postgres, if losing it is an inconvenience it can be Redis.

## Screenshots + image slots
- No console screenshot forced into the body (topic is schema design, not a click-path). One .img-slot
  for an optional ER/dbdiagram screenshot. MD mirror carries the same slot as an HTML comment with
  `src -> images/...` (no quoted src, so the validator can't misread it).
- Hero images/hero.png referenced (author renders later; hero-absent warn is acceptable per task).

## Internal links (all confirmed to exist as content-studio folders)
UP: last-mile-of-vibe-coding. ACROSS: add-managed-database-to-your-app, managed-postgresql-hosting,
pgvector-for-ai-apps (vector-store how-to), database-connection-pooling. Money: kloudbean.com + /pricing/.
5 unique internal links (within the 4-8 rule).

## Honesty / accuracy guardrails (grounded in kloudbean-facts.md)
- Kloudbean claims only from real facts: managed PostgreSQL / MySQL / MariaDB (7 engines total);
  pgvector = the standard Postgres extension, explicitly HEDGED ("depends on your Postgres version and
  setup, check availability") - NOT claimed as pre-installed/one-click, NO invented "Kloudbean vector
  database"; managed Redis for the fast layer; automatic backups; Git deploy on every push; free SSL.
- DB lock-down = whitelist the app server's IP (IP Access Control). NOT a private network/VPC by
  default. VPC stays Enterprise-only and isn't invoked here.
- Deletion / erasure framed as general engineering + the app's responsibility. NO "Kloudbean makes you
  GDPR compliant"; the right-to-erasure logic is yours. Honest boundary: managed = server/stack/SSL/
  backups/patching; you own the schema, the data, and the deletion logic.
- NO invented numbers/benchmarks/customers/uptime, no "certified", no hype, no banned blurbs. vector(1536)
  is an illustrative embedding dimension (a common real value), not a Kloudbean claim.

## Voice
Humanized: near-zero em-dashes (0 in body and md), contractions throughout, varied rhythm (short punchy
lines mixed with longer), no filler/signpost phrases, one clear opinion, direct address.

## Byline (unique)
Kloudbean · The schema outlives the code.

Slug: production-database-design-for-ai-apps
