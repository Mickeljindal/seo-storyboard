# Brief — Vertical vs Horizontal Scaling: Scale Up or Scale Out?

Cluster: Scaling & growth. Sibling to autoscaling-explained, cloud-load-balancer-explained.
Byline (unique): **Scale Up, Then Out.**

## Keywords (hedge volumes; never fabricate exact numbers)
- **Primary:** vertical vs horizontal scaling (also target: scale up vs scale out).
  High-intent evergreen infra term, solid steady search volume, moderate difficulty (lots of
  generic definitional pages, few that give a real recommendation + honest limits). We win on
  depth + a clear order + the stateless prerequisite.
- **Secondary / long-tail:** scaling a web app, when to add a server, resize a server,
  stateless app scaling, load balancer scaling, database scaling, read replicas,
  scaling bottlenecks, single point of failure, PM2 multi-process.
- Primary keyword placed in: H1, `<title>`, meta description, first 100 words, and the
  first H2 ("Scale up vs scale out: what each one means"). "scale up vs scale out" in title.

## Search intent
Informational, decision-oriented. Reader has a slow or busy server and is choosing between a
bigger box and more boxes, or is just learning the two terms. Wants a plain definition, a real
recommendation, and to avoid over-engineering. Commercial-adjacent: many are on a host and
weighing how to grow.

## PAA-style questions in the FAQ (8, mirrored into FAQPage JSON-LD)
- What's the difference between vertical and horizontal scaling?
- Which should I do first, scale up or scale out?
- What is scaling out?
- Do I need a load balancer to scale horizontally?
- Why does my app break when I add a second server?
- How do I scale the database?
- What's a scaling bottleneck, and how do I find it?
- Does Kloudbean autoscale my app?

Also answered in the body prose (kept out of the FAQ to hold length): "is horizontal always
better than vertical" (covered in the table + "which should you scale first") and "how many
servers do I need" (covered in the ladder + redundancy discussion).

## Angle / shape (avoid the one-template feel)
Concrete-scenario opener (server pinned at 95% CPU), then define both, comparison table, a
bespoke SVG (scale-up box growing vs scale-out load-balancer fan-out), a founder opinion
(scale up FIRST), the stateless prerequisite with a real failure story + Express/Redis code,
the database-is-a-separate-axis section, the "scaling the wrong tier" bottleneck trap, the
Kloudbean tie-in, then a 6-rung ladder, CTA, deep FAQ. Distinct from autoscaling-explained
(which is a should-you-autoscale decision guide with a load-over-time SVG).

## Bespoke SVG concept
Two panels, brand colors (navy #000f27, purple #4F1AF3, green #40b75f): left = one server box
with a dashed larger outline + "+CPU +RAM" up-arrow (scale up); right = a load-balancer pill
fanning to three identical app boxes (scale out). Distinct from the read-replica topology and
the autoscaling time-series charts.

## Internal links used (all folders confirmed to exist)
1. cloud-load-balancer-explained — what the balancer does
2. host-app-api-and-database-on-one-server — one server carries you far
3. redis-caching-patterns — sessions/cache to Redis (statelessness)
4. s3-compatible-object-storage — uploads to object storage (statelessness)
5. autoscaling-explained — automating horizontal scaling (later)
6. database-connection-pooling — take load off the DB
7. database-read-replicas-scaling — read replicas as a concept
8. best-managed-cloud-hosting — money page (managed cloud hosting)

## Screenshots referenced
- ../assets/console/add-server.png (vertical = resize)
- ../assets/console/flb-load-balancer.png (horizontal = FLB + app pool)
- Hero images/hero.png rendered later by the hero pipeline (do not create).

## Honesty guardrails (grounded in kloudbean-facts.md)
- Vertical = resize a server; every account, 7 clouds. Horizontal = built-in Flexible Load
  Balancer (on every account, off by default, not a separate product) + app pool. PM2
  multi-process for using all cores on one box (Node).
- **Autoscaling framed as enterprise/custom ONLY, NOT automatic on a standard plan.** k8s and
  custom architectures are also enterprise/custom. Stated explicitly so no reader expects
  auto-scaling on a regular account.
- **No one-click read-replica claim.** Read replicas described as a general database-scaling
  concept (with replication-lag caveat); practical levers are pooling + Redis caching + resize.
- 7 managed DB engines available (concept only; not enumerated here). "Managed" = server/
  stack/SSL/backups/patching handled, you own app + data. Linux stacks only.
- No customer/geo/CSAT numbers, no invented benchmarks or metrics, no SLA %. No blurb cliches.

## [CONFIRM] items omitted from copy
- No specific enterprise pricing figure (custom / contact sales only).
- No uptime SLA %; framed as "infrastructure from the world's largest cloud providers".
- No fabricated scaling metrics (no fake "resize takes N seconds", no memory/throughput numbers).
