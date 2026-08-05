# Brief — Deploy a Node App to Managed Cloud

Cluster 1. Primary kw: deploy Node app to managed cloud. Secondary: host Node.js app, deploy Express app, Node app production hosting, managed cloud for Node.
Intent: framework how-to (most general). A dev with any Node app (Express/Fastify/Nest API, SSR app, websocket/real-time, bot/worker) who wants it on managed cloud.
Angle: The general Node deploy guide + capstone. What 'managed cloud' means (cloud infra + managed ops layer: OS/stack/process manager/SSL/backups). Breadth of Node app types it covers. Generic flow (repo -> server -> Deploy Code: package.json scripts, process.env.PORT, process manager keeps alive -> DB -> env -> domain/SSL/autodeploy). Node-specific reliability point: process manager restarts on crash. Real-time/websockets + long-running/background jobs work on a server (unlike serverless). 503 causes.
Distinct: most general Node deploy (nextjs=Next-specific, fullstack-react=SPA+API); this covers ANY Node app incl. non-web (workers/bots) and real-time.
Slug: deploy-node-app-to-managed-cloud. Images: hero.png + ../assets/console/git-deployment.png. Links: pillar, one-server, pricing.
Honesty guardrails: Linux/Node; managed=server/stack/SSL/backups, you own app; not Windows/.NET. No blurbs.
