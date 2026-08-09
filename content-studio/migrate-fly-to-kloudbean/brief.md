# Brief — How to Migrate a Node.js App from Fly.io to Kloudbean

Cluster: migration (task #3). Fifth migration runbook, and deliberately the most different in shape because Fly exposes more infrastructure than Heroku/Render/Railway/Vercel. Grounded in the fly_io dossier. NOT interactive.

## Grounding — first-party Fly documentation and official warnings
- OFFICIAL Fly docs: volumes are LOCAL persistent storage and do NOT automatically replicate data; creating more Machines with volumes requires you to set replication up yourself first. Paraphrased (<30 words), attributed as "Fly's own documentation".
- OFFICIAL billing behaviour: volumes billed whether attached or unattached; volumes keep billing when Machines are stopped; stopped/suspended Machines still charged for root filesystem usage; snapshots billed on occupied storage; dedicated IPv4 billed per address.
- Real flyctl commands, all correct: fly apps list, fly machines list -a, fly volumes list -a, fly secrets list -a, fly ips list -a, fly proxy 5433:5432 -a, fly volumes destroy <id>, fly apps destroy.
- Fly secrets are WRITE-ONLY: `fly secrets list` returns names, not values. This is accurate and a genuinely important migration blocker nobody documents.
- fly.toml as the config source of truth.
- Operational surface Fly asks you to reason about (Machines lifecycle, process groups, regions, health checks, service discovery, Anycast, WireGuard/6PN, volumes pinned to hosts, replication/failover, flyctl+TOML): used to justify "you stop reasoning about X to ship a feature".
- Migration motive from the dossier: "Migration is often a decision to reduce operational burden and support risk", not a rejection of the technology. That framing drives the whole article.

## ORIGINAL VALUE (nothing else online does this)
1. STAGE 2 IS THE WHOLE POINT: "the volume conversation" as its own stage, with the uncomfortable discovery that a multi-region Fly deployment was never replicating data unless the team built it. Framed generously: "teams discover this during a migration rather than during an incident, which is the better of the two."
2. The write-only secrets trap: you CANNOT export values from Fly, so you need your own source of truth. Practical blocker that stops migrations mid-flight.
3. STAGE 6 CLEANUP as a named stage: "a migration you do not finish cleaning up keeps charging you for both platforms." Nobody puts teardown in a migration runbook, and on Fly specifically it is where the money is.
4. Volume triage taxonomy: uploads/assets need copying, self-run DB needs a dump not a file copy, caches can be discarded, unidentifiable volumes must be investigated before destruction.
5. "Budget more for the storage audit than for the deploy."

## Honest-trade discipline (strongest in this article of the five)
Explicitly names what the reader GIVES UP: Fly's regional placement, fast Machine starts, flexible networking. Says "if low latency in many geographies is the product, think carefully." Then states plainly that Kloudbean's 7-cloud provider/region choice plus built-in load balancer is "a smaller regional footprint than Fly's model, and being straight about that is more useful than pretending otherwise." No overclaim on regional parity.

## Safety framings honoured (dossier section 12)
- Reliability/outage material DELIBERATELY EXCLUDED from this article. The dossier's safe framing exists, but a migration runbook does not need it, and avoiding it keeps the piece uncontestable. No "Fly is unreliable".
- Managed Postgres credited (not dismissed); the self-managed-Postgres burden framed as "the actual reason they are migrating" for teams who chose unmanaged.
- No invented prices. The only figures are Fly's own billing behaviours (no dollar amounts in this article at all except Kloudbean's own $8/mo).
- Support-tier criticism left to the billing article, not repeated here.

## Keywords
Primary: **migrate fly.io to kloudbean** / **move off fly.io** / **fly.io migration guide node**. In H1/title/meta/first 100 words/H2. Secondary: export fly.io postgres, fly volumes migrate, fly secrets list values, fly.io alternative migration, fly proxy pg_dump, destroy fly volumes billing.
6 FAQ -> FAQPage JSON-LD.

## Shape (6-stage runbook with a dedicated volume stage AND a dedicated cleanup stage; distinct from the other four migration articles)
Lead -> tldr -> Stage 1 inventory (8 items + commands + check abandoned regions) -> Stage 2 THE VOLUME CONVERSATION (no auto-replication + triage + object storage destination) -> Stage 3 concept mapping table + ecosystem.config -> Stage 4 secrets (write-only trap) + data (fly proxy + pg_dump/pg_restore/verify) -> launch-database screenshot -> Stage 5 verify and cut over (7 steps) -> Stage 6 CLEANUP THAT SAVES MONEY (commands) -> what changes and what you give up (honest trade) -> related reading -> CTA -> 6 FAQ.

## Internal links (all verified to exist; why-is-my-fly-io-bill-so-high is same-batch)
fly-io-alternative, why-is-my-fly-io-bill-so-high (same batch), managed-postgresql-hosting, s3-compatible-object-storage, environment-variables-done-right, how-to-migrate-hosting-zero-downtime, nodejs-background-jobs-bullmq.

## Console screenshots
../assets/console/launch-database.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (<volume-id> escaped &lt;&gt; in HTML; commands paraphrased in JSON-LD to avoid raw quotes/flags); images resolve; 0 banned blurbs; html/md in sync.
