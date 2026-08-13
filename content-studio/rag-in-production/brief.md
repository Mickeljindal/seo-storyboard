# Brief - RAG in Production: What You Need Beyond a Vector Database

Cluster: 1 - Deploy AI / Vibe-Coded Apps. Intent: informational leading to commercial (managed
Postgres + Redis + object storage). Reader: an engineer or founder who built a RAG demo (Cursor,
Lovable, LangChain tutorial, a weekend script) and is now trying to run it for real users.

## Angle / format (deliberately NOT the fixed template)
Practical architecture + operations field guide. Thesis: everyone starts RAG thinking "add a vector
database," but the vector store is ~10% of the work. The article walks the production tail: ingestion
+ chunking, a background embeddings pipeline (NOT in a web request), index sync on document change,
per-user permission filters, retries/idempotency on provider calls, observability, and cost control.
Opener = the "picked a vector DB, demo worked by lunchtime, then it met real users" reframe. Shape is
reframe -> two-pipeline mental model (SVG) -> prototype-vs-production table -> failure-mode sections ->
honest product landing. No "Step 1..6" scaffold.

## Cannibalisation check (mandatory)
Read the H2 set of pgvector-for-ai-apps before writing. That page OWNS the vector-store how-to: what
is pgvector, do I need a dedicated vector DB, Postgres vs Pinecone, HNSW vs IVFFlat, storing/querying
embeddings, distance operators, scale. This page must NOT re-explain any of that. Resolution: a .note
callout up top explicitly hands the vector-store question to pgvector-for-ai-apps and links it; this
page covers only the wiring AROUND the store (ingest, chunk, sync, permissions, reliability, cost).
Distinct intent -> link, don't compete. Also distinct from last-mile-of-vibe-coding (that = the whole
category map of what breaks in prod; this = one deep sub-problem, RAG specifically). Links UP to it.

## Keywords (grounding)
NOTE ON VOLUMES: no verified SEMrush/DataForSEO export was pulled for this exact slug at draft time, so
no numeric volume/KD is asserted anywhere in the copy. "RAG in production" is a rising, high-intent
developer query with clear commercial pull (people asking it are building, and need managed infra).
Re-mine or confirm in the keyword tool before quoting any figure.

- Primary: **RAG in production**. Placed in H1, <title>, meta description, first 100 words
  ("Taking RAG in production seriously..."), and the H2 "What RAG in production actually needs."
- Secondary: production RAG architecture, RAG pipeline, document chunking, embeddings pipeline,
  keep vector index in sync, RAG multi-tenant permissions / RAG data leak, RAG cost control.
- Long-tail / PAA woven into body + FAQ: "do I need a vector database for RAG", "best chunk size for
  RAG", "why should embeddings run as a background job", "keep RAG index in sync when documents
  change", "stop RAG leaking one user's data to another", "why are my RAG answers wrong", "control
  RAG costs", "production RAG on Postgres pgvector", "RAG vs fine-tuning".

## Original value / cannot-copy angle
- Two-pipeline mental model (offline indexing vs online query) as the spine, taught by a bespoke SVG.
  This reframes the "RAG timeout" as slow work landing on the fast path.
- Real failure modes named and explained: stale index that silently lies (cites a price you don't
  charge), chunk too big (blurry averaged vector) / too small (orphaned fragments), cross-tenant
  retrieval leak (a breach with a friendly tone).
- ONE opinion: most bad RAG answers are a retrieval problem, not a model problem; fix chunking/filters
  before reaching for a bigger model.
- ONE anti-pattern: generating embeddings inside the HTTP upload request. Explained mechanically
  (hundreds of embed calls -> timeout -> half-indexed doc -> double-index on retry) then fixed.
- Concrete, checkable specifics (general engineering truth, hedged, no fabricated benchmarks): the
  ~200-500 tokens/10-15% overlap starting point; the 429 rate-limit; backoff+jitter, timeouts,
  idempotency, checkpointing; a correct pgvector permission query using `<=>` with WHERE tenant_id
  FIRST. No invented latency/recall/cost numbers.

## Bespoke SVG (distinct from siblings)
Two-row pipeline: INDEXING (background worker) documents -> chunk -> embed -> vector store, and QUERY
(inside the web request) question -> embed query -> retrieve (top-k + filter) -> LLM -> answer, with a
green "search: top-k" connector from the store down to retrieve. Brand navy #000f27, purple #4F1AF3,
green #40b75f. Different from pgvector's two-DB-sync panel and last-mile's whole-stack box diagram.

## Screenshots + image slots
- No console screenshot forced into the body (the topic is architecture, not a click-path); one
  .img-slot for an ingest-queue shot (jobs waiting/in-progress/failed). MD mirror carries the same
  slots as HTML comments with `src -> images/...` (no quoted src, so the validator can't misread it).
- Hero images/hero.png referenced (author renders later; hero-absent warn is acceptable per task).

## Internal links (all confirmed to exist as content-studio folders)
UP: last-mile-of-vibe-coding. ACROSS: pgvector-for-ai-apps (vector-store how-to),
managed-postgresql-hosting, nodejs-background-jobs-bullmq (embedding queue),
store-user-uploads-in-object-storage (documents), managed-redis-hosting (queue backend + cache).
Money: kloudbean.com + /pricing/. 6 unique internal links (within the 4-8 rule).

## Honesty / accuracy guardrails (grounded in kloudbean-facts.md)
- Kloudbean claims only from real facts: managed PostgreSQL (one of 7 engines) to keep vectors beside
  app data; pgvector = the standard Postgres extension, explicitly HEDGED ("enabling it depends on
  your Postgres version and setup, check availability") - NOT claimed as pre-installed/one-click and
  NO invented "Kloudbean vector database" product; managed Redis for the queue + cache; S3-compatible
  object storage for documents; background worker runs as its own long-lived process beside the app on
  the managed Node/Python runtime; Git deploy on every push; automatic backups; free SSL.
- DB lock-down = whitelist the app server's IP (IP Access Control). NOT framed as a private
  network/VPC by default. VPC stays Enterprise-only and isn't invoked here.
- Honest boundary (RAG-specific, not the generic template line): managed = server/stack/SSL/backups/
  patching; you own the code, the data, and the retrieval logic (chunking, prompts, permission
  filters). "Kloudbean can't make your chunking smart or your tenant filter correct." Builds trust.
- NO invented numbers/benchmarks/customers/uptime, no "certified", no hype, no banned blurbs.

## Voice
Humanized: near-zero em-dashes (0 in body and md), contractions throughout, varied rhythm (short
punchy lines mixed with longer), no filler/signpost phrases, one clear opinion, direct address.

## Byline (unique)
Kloudbean · The vector database was the easy part.

Slug: rag-in-production
