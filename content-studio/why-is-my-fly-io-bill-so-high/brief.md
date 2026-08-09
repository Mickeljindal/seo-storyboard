# Brief — Why Is My Fly.io Bill So High? The Resources That Keep Charging

Cluster: pain-point / cost (task #3). Mirrors the successful why-is-my-railway-bill-so-high shape for a different platform. Grounded in Competitors Scraped/fly_io_negative_review_intelligence_rag.txt. NOT interactive.

## Grounding — deliberately almost ALL first-party Fly documentation
This is the safest possible cost article because nearly every claim is Fly's own published statement, not a user complaint:
- "If you create a volume, you will be charged for it." (Fly billing docs)
- "You're billed for volumes that aren't attached to Machines." (Fly billing docs)
- "Volumes don't stop billing when your machines do." (Fly cost-management docs)
- The forgotten-volume-in-a-distant-region example is Fly's OWN illustration in their cost-management guidance. Paraphrased, not quoted verbatim.
- Stopped or suspended Machines still charged for ROOT FILESYSTEM usage. (Fly billing docs)
- Running Machines billed by CPU/RAM preset + running time.
- Snapshots billed on occupied snapshot storage.
- Outbound bandwidth billed, rates VARY BY REGION; Fly's guidance flags media serving, large dataset syncing, and cross-region replication.
- Dedicated public IPv4 ~$2/month.
- Managed Postgres priced separately from application Machines.
- Managed Postgres pricing (Fly's published figures, all hedged with "per Fly's published pricing" + "check current pricing"): 1GB ~$38, 2GB ~$72, 8GB ~$282, storage ~$0.28/provisioned GB/30-day month. Includes HA, backups, connection pooling.
- Support: community included for all; documented email support via PAID packages, Standard $29/mo, Premium $199/mo, Enterprise from $2,500/mo.
Real commands: fly volumes list -a <app>, fly volumes destroy <id>. Correct flyctl syntax.

## Safety framings honoured (dossier section 12 explicitly)
- NEVER "Fly is unreliable" — this article deliberately avoids the reliability topic entirely and stays on billing, where the evidence is first-party and uncontestable.
- NOT "Fly charges for stopped servers" -> used the precise "stopped or suspended Machines are still charged for root filesystem usage" wording.
- NOT "Fly has no managed database" -> credited Managed Postgres as genuinely more managed, with HA/backups/pooling, and framed the price step as STRUCTURAL rather than a criticism.
- NOT "Fly has no support" -> community included, email via paid tiers.
- Competitor prices are used ONLY because they are Fly's own published figures, always attributed and hedged. No invented numbers.

## Fair nod (required, one, substantial)
"Fly's regional placement is genuinely excellent, Machines start fast, and the networking flexibility is real. If your product depends on running close to users in many specific regions and you have the operational appetite for Machines, volumes, and private networking, that capability is worth paying a metered bill for." Then lands on flat pricing for teams wanting predictability. Also notes flat pricing suits "most teams rather than all of them" (no absolutism).

## ORIGINAL VALUE
1. Ordered by likelihood: volumes FIRST because they are usually the answer. Most cost articles list line items alphabetically or by size; this one triages.
2. The multi-region irony: the architecture that makes Fly attractive is the one that generates the most inter-region transfer. Genuine insight, not a dig.
3. Support tier as a real budget line: "the realistic cost of running production on Fly includes whichever support tier you would want available at 3am".
4. "Delete old test apps rather than stopping them" — actionable and non-obvious given the filesystem charge.
5. The audit is RECURRING, not a one-time cleanup (calendar reminder), consistent with the calendar-problem insight used in the CSCC cluster.

## Keywords
Primary: **why is my fly.io bill so high** / **fly.io volumes billing** / **fly.io cost**. In H1/title/meta/first 100 words/H2. Secondary: fly.io charged when stopped, unattached volume billing fly, fly.io managed postgres price, fly.io bandwidth cost, fly.io support pricing, reduce fly.io bill, fly volumes destroy.
6 FAQ -> FAQPage JSON-LD.

## Shape (cost triage, ordered by likelihood; distinct from the Railway article's mechanics-first shape)
Lead -> tldr (all first-party items listed) -> volumes first (3 doc statements + commands) -> stopped Machines cheaper not free -> snapshots -> bandwidth + the multi-region irony -> smaller items -> Managed Postgres step-change (fair credit + price table in prose) -> support is a separate purchase -> 7-step predictability list -> the flat alternative + fair nod -> add-server screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified to exist; migrate-fly-to-kloudbean is same-batch)
fly-io-alternative, migrate-fly-to-kloudbean (same batch), why-is-my-railway-bill-so-high, heroku-cost-after-free-tier, cheapest-way-to-host-nodejs-app, best-managed-nodejs-hosting-2026.

## Console screenshots
../assets/console/add-server.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid ($ -> "dollars", <volume-id> escaped &lt;&gt; in HTML, `fly volumes list` paraphrased in JSON-LD); images resolve; 0 banned blurbs; html/md in sync.
