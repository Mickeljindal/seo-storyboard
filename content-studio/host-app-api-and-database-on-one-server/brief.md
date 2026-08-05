# Brief — Host Your App, API, and Database on One Server

Cluster 1. Primary kw: app api and database on one server. Secondary: full stack on one server, host frontend backend database together, single server architecture, consolidate app and database.
Intent: architecture how-to. A builder deciding how to arrange a full-stack app; make the case for (and show how to run) the whole stack on one owned server.
Angle: The modern default scatters front end (edge), API (serverless), DB (hosted) across 3 services/bills. For most apps, ONE owned server holding front end + API + database is simpler, lower-latency (local network to DB), one bill, one place to debug, owned + backed up together. How to set it up (server -> Deploy Code -> DBS Launch Database -> env vars -> one domain -> autodeploy). Front+API: same process (monolith) or two apps — both fine. Local-network DB advantage. When to split (scale: DB own server, load balancer) — honest. 
Distinct: architecture/consolidation how-to (not tool-specific deploy). Use git-deployment.png.
Slug: host-app-api-and-database-on-one-server. Images: hero.png + ../assets/console/git-deployment.png. Links: pillar, add-db article, pricing.
Honesty guardrails: Linux stacks; one server has limits (single point of failure until you scale; backups mitigate); scale by resize/split/LB when needed; managed=server/stack/SSL/backups, you own app+data. No blurbs.
