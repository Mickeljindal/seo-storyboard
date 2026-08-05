# Brief — Zero Downtime Deployment: How to Ship Without an Outage

Cluster: Deployments and reliability. Intent: informational + how-to, with commercial pull to the managed platform. Reader: a developer or small team shipping updates to a live app who keeps causing brief outages on deploy, or who has heard "blue-green" and "rolling" and wants to know which they actually need.

## Keywords (hedge all volumes; never fabricate precise numbers)
- Primary: **zero downtime deployment** (in H1, title, meta description, first 100 words, one H2). Solid, steady developer-intent term; mid-to-high competition from cloud vendor docs and DevOps blogs.
- Also targeted as H2s: **blue-green vs rolling deployment**, **deploy without downtime**.
- Secondary / long-tail woven through body + FAQ:
  - blue-green deployment
  - rolling deployment
  - canary deployment
  - health check deploy gating / readiness vs liveness
  - database migration zero downtime / expand and contract / backward-compatible migration
  - connection draining
  - graceful shutdown (SIGTERM handling)
  - rollback strategy / instant rollback
  - pm2 reload zero downtime
- Note on volumes: treat these as directional, not exact. If precise SEMrush/DataForSEO figures are needed, pull them (creds in .env) and record here before relying on them. Do not invent numbers in the copy.

## PAA-style questions answered (mirrored into FAQPage JSON-LD)
- What is a zero downtime deployment?
- What is the difference between blue-green, rolling, and canary?
- How do I deploy without downtime?
- How do I handle database migrations during a zero downtime deploy?
- What is connection draining and graceful shutdown?
- Why does a health check matter so much for zero downtime?
- How do I roll back a bad deploy?
- Do I need blue-green for a small app?
- Does zero downtime deployment require Kubernetes?
- Can I do zero downtime deployments on a single server?

## Angle / what makes this the best page on the query
Teach-first. Start with WHY naive stop-then-start deploys cause an outage (the gap, slow boots, crash-on-boot). Then the three strategies with a comparison table and per-strategy how/why/tradeoff. The differentiators competitors skip: (1) the health check must be an honest readiness check, not a bare 200; (2) graceful shutdown + connection draining with a real Node/Express SIGTERM snippet; (3) the big one, DATABASE MIGRATIONS via expand/contract with a concrete column-rename example and the CREATE INDEX CONCURRENTLY / batched-backfill lock gotcha. Anti-pattern beat: the most common zero-downtime failure is a migration written as if only the new code were running. Founder opinion: most apps don't need blue-green/canary on day one; rolling + LB + health check + backward-compatible migrations covers ~95%.

## Kloudbean tie-in (grounded ONLY in kloudbean-facts.md — no invented one-click blue-green/zero-downtime feature)
- Managed CI/CD from Git: build & deploy on push, deployment history, live build logs -> rollback = redeploy last good commit; run migrations as part of deploy.
- Built-in Flexible Load Balancer (FLB): application pools + health checks + SSL management + access logs. The horizontal primitive for health-gated rolling / blue-green cutover. (Health checks are already stated in the published cloud-load-balancer-explained article.)
- PM2 multi-process: `pm2 reload` as a genuine single-server zero-downtime reload for Node.
- Staging (WordPress & Laravel) to verify first; other stacks use a staging app on the same server.
- Honesty: autoscaling + Kubernetes are enterprise/custom only. Explicitly say there is NO magic zero-downtime button; it's a sequence, and the platform supplies primitives.

## Structure (varied on purpose, not the sibling template)
Lead -> tldr -> Why deploys cause downtime -> What is a ZDD (clean definition) -> strategies + comparison table -> bespoke SVG (blue-green flip) -> health check -> graceful shutdown + code -> database migrations (expand/contract + SQL) -> rollback -> founder opinion -> Kloudbean primitives + 2 screenshots -> checklist note -> takeaway -> CTA -> FAQ (10).

## Byline (unique)
By Kloudbean · Ship Without the Outage.

## SVG concept
Bespoke inline blue-green flip: Users -> load balancer -> Blue (previous, idle, warm rollback target, dashed no-traffic arrow) and Green (new, verified, live, solid arrow), with a purple flip=rollback arrow between them, and a caption that the DB is shared so migrations still must be backward compatible. Brand colors navy #000f27 / purple #4F1AF3 / green #40b75f. Distinct from the fan-out LB diagram in cloud-load-balancer-explained.

## Visuals
Real screenshots: ../assets/console/git-deployment.png (deploy on push, history, live logs) and ../assets/console/flb-load-balancer.png (pool + health checks). Plus 3 .img-slot spacers (deploy-gap timeline, drain log, deployment-history list) with em-dash-free hints; hero rendered later.

## Internal links (all confirmed to exist)
- https://www.kloudbean.com/blog/cloud-load-balancer-explained/ (health checks / LB)
- https://www.kloudbean.com/blog/deploy-express-app/ (graceful shutdown, Node)
- https://www.kloudbean.com/blog/database-connection-pooling/ (closing the pool / draining)
- https://www.kloudbean.com/blog/database-migration-pg_dump-mysqldump/ (migrations)
- https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/ (deploy on push / rollback)
- https://www.kloudbean.com/blog/environment-variables-done-right/ (crash-on-boot / missing env var)
- https://www.kloudbean.com/blog/host-multiple-apps-one-server/ (staging as another app)
- NOT linked (folders do not exist yet): uptime-monitoring, high-availability-explained.

## Honesty guardrails
Linux stacks only. "Managed" = platform runs server/stack/SSL/backups, you own app + data. No invented one-click blue-green or zero-downtime button. FLB framed as the primitive (pools + health checks), not an automated deploy orchestrator. Autoscaling/k8s enterprise-only. No customer/geo/CSAT numbers, no invented benchmarks or SLA %. Length target 2400-2800 words. Near-zero em-dashes in prose.
