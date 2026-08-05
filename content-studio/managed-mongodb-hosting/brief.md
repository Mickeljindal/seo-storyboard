# Brief — Managed MongoDB Hosting (engine guide, "when NOT to use it" spine)

Silo 3 (Managed databases). Spoke. Slug: managed-mongodb-hosting.

## Keywords (ground the copy; hedge any volumes, don't fabricate precise numbers)
- Primary: **managed MongoDB hosting** (in H1, title, meta description, first 100 words, and the H2 "What does managed MongoDB hosting actually manage?").
- Secondary / weave: MongoDB hosting, managed MongoDB, MongoDB Atlas alternative, MongoDB connection string, self-hosted MongoDB.
- Long-tail / PAA answered in FAQ: when should I use MongoDB vs a relational database; is MongoDB free / what does managed cost; how do I connect my app to MongoDB; is this a MongoDB Atlas alternative; do I need a schema with MongoDB; what is the 16MB document limit; how does MongoDB scale; can I move my data out later; MongoDB or PostgreSQL.
- Intent: informational + commercial (engine explainer that also captures the Atlas-alternative money intent).

## Format / shape (avoid the one-template feel)
Engine guide built around an honest decision spine, not Intro -> Step 1..6. Order: what MongoDB is (document/BSON/collections + a real document example) -> when to use / when NOT (cmp table + plain founder opinion) -> anti-pattern beat (the "trap") -> what managed handles -> launch -> connect (mongodb:// + drivers) -> modeling (embed vs reference) -> indexing -> migrate off Atlas -> security/backups -> scaling -> CTA -> FAQ.

## Depth signals (playbook)
- Founder opinion, stated plainly: don't reach for MongoDB by default; pick it for document-shaped data, not because it's trendy.
- Anti-pattern beat: relational data on Mongo -> $lookup everywhere; the 16MB BSON document limit + unbounded embedded arrays; "flexible schema" drifting into "inconsistent schema."
- Real checkable specifics: default port 27017, 16MB per-document BSON limit, `_id` auto-indexed, COLLSCAN, `explain("executionStats")`, `$lookup`, mongodump/mongorestore.
- No fabricated customers/numbers. "Teams get burned" framed as general engineering truth, not an invented support story.

## SVG concept
Bespoke inline diagram: "Same data, two shapes." Left = normalized relational users/orders tables joined on user_id (navy). Right = one nested MongoDB document with orders embedded inside the customer (green). Divider "vs" (purple). Teaches document-vs-relational directly.

## Screenshots + image slots
Real console: launch-database (MongoDB in the engine list), env-vars (connection string). Plus 3 img-slots: a Compass collection with varying docs; explain() index-scan vs COLLSCAN; mongodump -> mongorestore terminal.

## Internal links (7 in body, all folders confirmed to exist)
- UP: add-managed-database-to-your-app
- ACROSS: managed-postgresql-hosting, mysql-vs-postgresql, managed-database-vs-self-managed
- server-backups-guide
- MONEY: digitalocean-vs-kloudbean (linked in the "what does managed manage" section, cloud-choice pivot)
- managed-redis-hosting (caching aside; the 7th link)

## Fact constraints honored
7 managed engines incl MongoDB (MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB). Managed = provisioned/patched/private-network/backups; you own schema + data (mongodump export) -> real Atlas alternative. Pricing from $8/mo, Enterprise custom (verify on pricing page). Linux stacks. MongoDB Community is free to run (avoided the SSPL "open source" label debate). No customer/geo counts. Replica sets/sharding framed as MongoDB concepts you grow into, NOT Kloudbean one-click features. Escaped code where needed; zero em-dashes in prose.

Byline: "By Kloudbean Database Team · Pick MongoDB for documents, not for hype." (NOT "Faster Than Ever")
