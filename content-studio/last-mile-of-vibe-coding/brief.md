# Brief - The Last Mile of Vibe Coding Is Production (AI-vertical flagship / manifesto hub)

Role: flagship category page for the AI-apps-in-production cluster (owner-provided plan). The hub
every AI deploy / security / database / hosting / migration page links back to. Intent: the wave
of Lovable/Bolt/Cursor/v0/Replit/Claude builders who shipped a preview and hit the production wall.

Angle (owner-specified): "own the infrastructure problems that appear once an AI app has users",
not another generic deploy-[tool] page. Thesis + MAP, not a how-to (the how-to is the existing
deploy-ai-built-app-to-production pillar, which this links to and does NOT duplicate).

Cannibalisation check: distinct from deploy-ai-built-app-to-production (that = step-by-step ship;
this = category thesis + what breaks after). Links to real existing spokes: add-managed-database,
why-my-ai-app-works-locally-but-not-in-production, secrets-management, environment-variables-done-right,
pgvector-for-ai-apps, managed-redis-hosting, nodejs-background-jobs-bullmq, store-user-uploads-in-object-storage,
ai-built-app-security-checklist, from-prototype-to-production-checklist, database-connection-pooling.

Keyword grounding: primary "vibe coding production" / "hosting AI-built apps" / "where to host a
Lovable app" (secondary). Volume/KD not pulled from a specific export for this pillar (it is a
category/entity page, not a single-keyword target); it earns citations by owning the journey.
Keep hedged; do not assert a specific volume.

Kloudbean facts used (grounded): one dashboard for server + managed DB + Redis + object storage +
backups + free SSL + Git deploy; always-on (no cold starts); IP allow-listing (whitelist app server
IP) as the DB lock-down default; pgvector for embeddings; honest boundary (managed = server/stack/
SSL/backups/patching; you own code + data + bugs). Dogfooding line kept true + light ("we run our
own tools this way") - the owner confirmed this project is built by prompting and hosted on Kloudbean.
NO invented uptime/numbers. Private networking/VPC NOT presented as a default.

Guardrails honoured: honest founder opinions (most apps don't need k8s; SQLite dev-not-prod; most
failures are config); no hype; near-zero em-dashes; answer-first; FAQ mirrors real PAA; reference-
architecture SVG (one of the owner's "most important missing assets").

URL note: owner proposed a /ai-app-hosting/ hub path; published under /blog/last-mile-of-vibe-coding/
in the current structure. Owner can map/redirect the hub path on the site if desired.
