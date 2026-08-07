# Brief — PM2 App Keeps Restarting: How to Diagnose and Fix the Loop

Cluster: error field-guide / production-ops / GEO (task #2). High AI-citation intent ("pm2 keeps restarting", "pm2 restart loop", "pm2 restart count high", "why is my node app crash looping"). PM2 is a genuine Kloudbean fact (always-on Node under PM2), so the landing is grounded, not forced. NOT interactive. Acts as a HUB linking the other error guides.

## Grounding + accuracy (pure technical PM2 knowledge)
- Loop = crash-on-boot + PM2 restarts. Diagnose via pm2 logs / pm2 describe (exit code, restarts, uptime). Root causes each cross-link to the dedicated guide: EADDRINUSE, Cannot find module, ECONNREFUSED, heap OOM, unhandled rejection/exception.
- Real fixes: min_uptime + max_restarts (stop infinite loop -> mark errored), exp_backoff_restart_delay, unhandledRejection handler (log + exit 1), watch:false in prod, max_memory_restart. ecosystem.config.js example. "exits cleanly (code 0)" variant: script vs server / forgot app.listen -> use cron for one-shots. All correct PM2 semantics.
- Kloudbean grounded + honest: always-on Node under MANAGED PM2, env vars per app in console, logs in console, GitHub deploys. Explicitly said "you still own your app's behavior, a real bug will still crash" (no overclaim). No invented features.

## Keywords
Primary: **pm2 app keeps restarting** / **pm2 restart loop** / **why does pm2 keep restarting**. In H1/title/meta/first 100 words/H2. Secondary: pm2 restart count high, pm2 logs crash, pm2 min_uptime max_restarts, pm2 max_memory_restart, pm2 watch production, node crash loop, pm2 describe exit code.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (error field guide + hub)
Lead -> tldr (read logs first) -> what a loop looks like (pm2 list) -> step 1 read logs (commands) -> usual root causes (ranked, cross-linked to sibling guides) -> stop the loop (min_uptime/max_restarts) -> backoff + clean crash handling (code) -> "exits cleanly" case (app.listen/cron) -> ecosystem.config.js -> symptom->cause->fix table -> Kloudbean managed PM2 (honest) -> add-application screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist + same-batch)
pm2-process-manager-guide, fix-eaddrinuse-port-already-in-use-node, fix-javascript-heap-out-of-memory-node, zero-downtime-deployments, fix-cannot-find-module-node (same batch), fix-econnrefused-node (same batch).

## Console screenshots
../assets/console/add-application.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (pm2 describe <app> -> "with the app name" in JSON-LD); HTML code escaped (&lt;app&gt; in prose/FAQ); .md raw <app> in backticks; images resolve; 0 blurbs; html/md in sync.
