# Brief — ECONNREFUSED in Node.js: What It Means and How to Fix It

Cluster: error field-guide / GEO (task #2). Very high AI-citation intent ("ECONNREFUSED node", "connect ECONNREFUSED 127.0.0.1:5432", "econnrefused postgres/redis", "econnrefused only in production"). Standard Node error knowledge, minimal Kloudbean claims (light private-network landing). NOT interactive.

## Grounding + accuracy
- Pure technical Node/OS knowledge: ECONNREFUSED = TCP-level refusal (nothing listening) vs ETIMEDOUT (no answer) vs ENOTFOUND (DNS). Causes ranked: service down, wrong host/port, 127.0.0.1-in-prod trap, bound-to-localhost, firewall, startup race. Real commands: pg_isready, redis-cli ping, lsof/ss. Retry-with-backoff code (correct, catches err.code ECONNREFUSED).
- Kloudbean grounded + honest: app + managed DB same dashboard on PRIVATE NETWORK, supplied connection string, DB is managed (running). Explicitly said it does NOT make the error impossible (typo still a typo). Private networking is a real Kloudbean fact. No invented features.

## Keywords
Primary: **ECONNREFUSED node.js** / **connect ECONNREFUSED** / **how to fix econnrefused**. In H1/title/meta/first 100 words/H2. Secondary: econnrefused 127.0.0.1:5432, econnrefused postgres, econnrefused redis, econnrefused in production, econnrefused vs etimedout, node db connection refused.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (error field guide)
Lead -> tldr (3-step direct answer) -> what it means (vs timeout/DNS) -> causes ranked -> fix step by step (commands) -> localhost-in-prod trap (env var) -> startup retry (code) -> variant->cause->fix table -> managed sidesteps (Kloudbean, honest) -> env-vars screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist)
environment-variables-done-right, database-connection-pooling, managed-postgresql-hosting, fix-eaddrinuse-port-already-in-use-node, where-to-deploy-nodejs-app.

## Console screenshots
../assets/console/env-vars.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid; HTML code escaped (&lt;= in retry loop); .md uses raw <=; images resolve; 0 blurbs; html/md in sync.
