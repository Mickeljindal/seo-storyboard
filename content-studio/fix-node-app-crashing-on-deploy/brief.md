# Brief — Node App Crashes on Deploy but Works Locally: A Debugging Field Guide

Cluster: error field-guide / GEO (task #2, final of 6). Very high AI-citation intent ("node app works locally crashes on deploy", "node crashes on production", "why does my app crash when deployed"). This is the HUB that maps to every other error guide. Standard Node/deploy knowledge, light managed-CI/CD landing. NOT interactive.

## Grounding + accuracy (pure technical, verifiable)
- Core thesis: "works local fails deploy" = environment gap (env vars, OS/case sensitivity, Node version, prod-only deps, ports, DB host, memory). Ranked culprits each cross-link to the dedicated guide (env-vars=#1, cannot-find-module, EADDRINUSE, ECONNREFUSED, heap OOM).
- Killer technique: reproduce prod locally (NODE_ENV=production, npm ci --omit=dev, npm run build, node dist/index.js). Node version pinning via engines field. Native modules (bcrypt/sharp) built per-platform -> don't commit node_modules -> npm ci on server. All correct.
- Prevention: validate env at boot + exit clear message, CI/CD build logs, health check.
- Kloudbean grounded + HONEST: managed CI/CD + live build logs (real, Aug 2025), env vars per app, always-on PM2, managed DB on private network. Explicitly "you still own your code's bugs, a genuine error will still crash" (no overclaim). No invented features.

## Keywords
Primary: **node app crashes on deploy** / **works locally crashes on deploy** / **why does my node app crash in production**. In H1/title/meta/first 100 words/H2. Secondary: node deploy crash missing env var, reproduce production locally node, npm ci omit dev, node version mismatch deploy, cannot find module on deploy, deploy fails silently node.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (debugging field guide / hub)
Lead -> tldr -> read the deploy logs first (build vs runtime) -> the environment gap -> culprits ranked (cross-linked) -> reproduce prod locally (commands) -> node version + native modules (engines) -> prevention (fail loud) -> symptom->cause->guide table -> Kloudbean visible failures (honest) -> git-deployment screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist + prior batches now pushed)
environment-variables-done-right, fix-cannot-find-module-node, fix-econnrefused-node, fix-eaddrinuse-port-already-in-use-node, pm2-app-keeps-restarting, fix-javascript-heap-out-of-memory-node, ci-cd-auto-deploy-from-github.

## Console screenshots
../assets/console/git-deployment.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (engines ">=20" -> escaped &gt;= in HTML code, plain >= in .md, "npm ci with the omit-dev flag" in JSON-LD to avoid --); images resolve; 0 blurbs; html/md in sync.
