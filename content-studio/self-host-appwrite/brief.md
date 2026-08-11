# Brief: self-host-appwrite

## Role in the cluster
Silo 7 (Self-hosted tools). Pillar: best-self-hosted-tools. Cousin: self-host-supabase (BaaS,
DISTINCT model, cross-link). Money page: add-managed-database-to-your-app.

## Keyword grounding (honest)
Branded per-tool spoke. Real intent: self host appwrite, appwrite self hosted, appwrite docker,
appwrite vs supabase, open source firebase alternative, self hosted backend. No fabricated volume.

Primary: **self-host Appwrite**. Secondary: open-source Firebase alternative, Appwrite vs Supabase,
self-hosted backend server, document-style BaaS.

## Cannibalisation (mandatory)
Live self-host-supabase = Postgres-first BaaS (real Postgres, SQL you own). Appwrite = document-style
Firebase-like BaaS (abstractions over a relational DB, bundled console). Different model -> different
reader decision -> distinct branded query. Cross-link Supabase for the "vs" comparison; do not
re-teach generic "what is a BaaS".

## Verified facts (Appwrite blog/docs, gartsolutions, generalistprogrammer, hashnode comparisons)
- Appwrite: open-source backend server / BaaS, Firebase alternative. Server under BSD 3-Clause.
- Wraps a relational database in a SIMPLIFIED, DOCUMENT-STYLE API. Bundles auth, databases, storage,
  functions, messaging, and hosting into ONE console. Built-in realtime across services; GraphQL
  support; broad function runtimes; scoped API keys.
- Under the hood: a relational database (MariaDB) with Redis alongside for caching/realtime.
- Self-hosting is Docker-based and notably STRAIGHTFORWARD (a single console/stack), described as
  easier to self-host than Supabase's multi-service Postgres setup. Good for data sovereignty /
  air-gapped.
- Supabase (cousin, contrast): real PostgreSQL, SQL-first, you write and own the SQL; more services
  to run when self-hosted.

## Information gain (the honest angle)
1. The model IS the decision: Appwrite gives Firebase-style document/collection abstractions + bundled
   services in one console; Supabase gives a real Postgres and SQL you own. Choose by which model you
   want, not by feature checklists. Decision cue.
2. Self-hosting Appwrite is simpler than Supabase (Docker stack, one console) - a real, tool-specific,
   decision-changing point.
3. Name the tradeoff: document-style abstractions = faster to build, less raw SQL control; you talk to
   it through SDKs/API, not psql. Honest, not a knock.
4. Concede: if you specifically want Postgres + SQL, that is Supabase, not Appwrite.

## Claims (facts files only)
Managed server; managed MariaDB + managed Redis (its data layer, and they get backed up); free auto-
renewing SSL; automatic backups; S3-compatible object storage; managed reverse proxy; 7 clouds; one
dashboard. NOT one-click (Appwrite self-hosts via its own Docker stack). Honest boundary: platform
runs server + DB + SSL + backups; the Appwrite app, your data, and your app code are yours.

## Format
Match live self-host shape. What it is, the model difference vs Supabase (the whole decision, table),
the simple self-host story, the tradeoff, what it takes to run, backups, where hosting fits, related
reading, FAQ. Server-based (not one-click).
