# Brief — Background Jobs in Node.js with BullMQ and Redis: A Practical Guide

Cluster: production-ops / GEO (task #3). High intent + AI-citation ("node background jobs", "bullmq tutorial", "bullmq redis", "node job queue", "run worker in production"). Teach-first, real code, grounded managed-Redis landing. NOT interactive (has one inline SVG flow diagram).

## Grounding + accuracy (real BullMQ knowledge, verified)
- 3 pieces: producer (Queue.add) -> Redis (durable) -> worker (separate process). Real code: IORedis with maxRetriesPerRequest:null (BullMQ's documented requirement), Queue + Worker, concurrency, worker.on('failed'), attempts + exponential backoff, repeat cron pattern, delay. ecosystem.config.js running web + worker separately. All correct BullMQ v5 API.
- Correct architectural point: needs persistent Redis + long-running worker -> serverless can't host durable workers (cross-link vercel-for-node-backends-limits, accurate).
- Kloudbean grounded: managed Redis one-click + backups (Redis is owner-confirmed engine), same dashboard, PRIVATE NETWORK, REDIS_URL supplied, worker under PM2 always-on. All real facts. No invented features (didn't claim a hosted BullMQ dashboard UI).

## Keywords
Primary: **node.js background jobs** / **bullmq redis** / **bullmq tutorial**. In H1/title/meta/first 100 words/H2. Secondary: node job queue, run bullmq worker production, bullmq retries backoff, bullmq scheduled jobs cron, redis queue node, background tasks node.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (practical guide, teach-first)
Lead -> tldr -> why background jobs (event loop) -> how BullMQ works (SVG producer->Redis->worker) -> producer setup (code) -> worker (code, separate process) -> retries/backoff/scheduled (code) -> run worker as own process (PM2 ecosystem) -> why persistent Redis+worker (serverless limit, cross-link) -> Kloudbean fit (managed Redis + PM2) -> launch-database screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist)
managed-redis-hosting, run-a-cron-job-without-ssh, environment-variables-done-right, pm2-process-manager-guide, where-to-deploy-nodejs-app, vercel-for-node-backends-limits.

## Console screenshots
../assets/console/launch-database.png. Hero images/hero.png (empty). Inline SVG flow diagram (navy/purple/green).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid; code has no raw < > (all fine); images resolve; 0 blurbs; html/md in sync. NOTE: .md omits raw SVG (describes it in prose instead) so md stays clean.
