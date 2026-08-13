# Brief: persistent-storage-for-ai-apps

## Target
- **Primary keyword:** persistent storage for AI apps
- **Secondary / long-tail:** where to store data AI app, database vs object storage, store files AI app, ephemeral disk, AI app data storage, store embeddings, store uploads AI app, do I need object storage, where do embeddings go, why does my AI app lose data on redeploy, do I need a separate vector database, is SQLite fine for an AI app in production.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no figures are fabricated. Treat as a mid-tail, decision-intent query in the AI-deploy cluster; re-pull real Volume + KD before scaling the sub-cluster. Grounding is intent-based (per the SEO OS: relevance over raw volume).

## Reader + business outcome
- **Reader:** someone who built an AI app (Lovable, Cursor, or the OpenAI/Anthropic SDK), has it working locally, and now has data (records, files, sessions, embeddings) and doesn't know which store each kind belongs in.
- **Business outcome:** capture the storage-decision stage of the "Deploy AI / Vibe-Coded Apps" cluster and route to Kloudbean's one-dashboard managed Postgres (pgvector) + Redis + built-in S3 object storage, landing on the honest managed boundary.

## Intent + format
- **Intent:** informational, decision-guide (which store for which data), with a commercial tail (where do I run all of it).
- **Format:** decision guide. Mental model (four kinds of state) + a unique boundary SVG + per-store sections + a decision matrix table + an anti-over-engineering "how many stores" section + deep FAQ. Deliberately varied from the reference (host-ai-chatbot-in-production), which is a request-path walkthrough. Shape here is model -> each bucket -> lookup table -> how-many -> Kloudbean.

## Organizing idea (information gain, one sentence)
The four kinds of state an AI app has (structured records incl. embeddings, files, ephemeral/fast, scratch) mapped to the one right store each (managed Postgres+pgvector, S3 object storage, Redis, and the local disk you must never trust), with a decision table whose payoff column is "what breaks if you use local disk instead."

## Cannibalisation check (mandatory)
- `production-database-design-for-ai-apps` owns schema design INSIDE the database. This page is the higher-level "which store for which data" decision; links there for the schema, does not rebuild it.
- `store-user-uploads-in-object-storage` owns the object-storage how-to (presigned URLs, bucket setup). This page only makes the routing decision (files go to a bucket) and links there.
- `pgvector-for-ai-apps` owns the vector mechanics. This page only says "embeddings live in Postgres via pgvector, you usually don't need a separate vector DB" and links there.
- `last-mile-of-vibe-coding` is the pillar (breadth of everything AI builders skip). This page links UP to it and is one depth piece under it.
- `managed-postgresql-hosting` / `managed-redis-hosting` / `database-connection-pooling` = component how-tos; this page ties them together at the decision layer and links across.
- Did NOT link `why-sqlite-data-disappears-on-redeploy` or `migrate-ai-app-sqlite-to-postgres` (do not exist yet). Verified each linked slug with `ls content-studio/<slug>`.
- Decision: distinct intent (the routing decision across all four data kinds), build it.

## Kloudbean grounding (facts only)
One dashboard; 7 managed DB engines incl. PostgreSQL (pgvector where the plan enables it), Redis, Memcached; built-in S3-compatible object storage with no egress fees on that built-in storage; automatic backups; free SSL; Git deploy; DB locked down by whitelisting the app server's IP (NOT a default private network/VPC; VPC is Enterprise-only). Honest boundary: managed = server/stack/SSL/backups/patching; customer owns code + data. No GPU/inference hosting claim. No invented numbers, uptime, benchmarks, customers, or "certified". $8/mo is the only confirmed price (not needed here).

## Internal links used (all resolve)
Up: last-mile-of-vibe-coding (required). Across: managed-postgresql-hosting, pgvector-for-ai-apps, store-user-uploads-in-object-storage, managed-redis-hosting, production-database-design-for-ai-apps, database-connection-pooling. Money: kloudbean.com + /pricing/. (7 internal cluster links.)

## Validation
`node _val.mjs persistent-storage-for-ai-apps` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity (10), blurbs=0, internal links resolve, words >= 1400. (hero.png + H2-count warnings acceptable.)
