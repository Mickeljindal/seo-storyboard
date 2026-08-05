# Brief — How to Deploy an Express App to Production

Silo 2 (deployment fundamentals + frameworks). Spoke under the pillar `how-to-deploy-any-app`.

**Primary keyword:** deploy Express app (mid volume, medium difficulty; a builder query with clear commercial intent). Placed in H1, title, meta description, first 100 words, and the H2 "How to deploy an Express app on a managed server".

**Secondary / long-tail (woven through body + FAQ):** deploy Express.js to production, Express Node hosting, host an Express API, Express production deployment, Express app listen process.env.PORT, Express trust proxy behind Nginx, Express 502 / 503 after deploy, PM2 Express, connect database to Express app, health check route Express.

Volumes are directional (grounded in the deploy-* cluster demand, not a fresh export). Re-pull from the SEMrush gap data / DataForSEO before any volume is cited in copy; none are cited in the article.

**Intent:** how-to, commercial. A Node/Express developer who runs fine locally and now needs Express live on a server: what code to change, how to deploy, and why it 502s.

**Angle (what makes it distinct from the Node sibling):** the Node sibling `deploy-node-app-to-managed-cloud` owns the general process story (PM2 crash-restart, SIGTERM, cluster/cores, workers vs serverless). This piece stays Express-specific: the four code changes that break the first deploy (read `process.env.PORT`, bind `0.0.0.0` not localhost, `app.set('trust proxy', 1)` behind Nginx, a `/healthz` route), then the console deploy path, a managed DB for an Express API, and the 502/503 port/host fix. It links to the sibling for the deep PM2 detail instead of repeating it.

**Shape:** practical deploy how-to. Prod-readiness code changes → console deploy (Add Application, Git deploy + live logs, PM2, env vars + NODE_ENV gotcha, domain + SSL) → managed database → 502/503 triage + founder note. Not the pillar's six-move template.

**Founder POV / original value:** most Express deploy failures are config (port/host/env), not code, so check the four config things before rereading controllers. Real gotcha: `NODE_ENV=production` makes `npm ci` skip `devDependencies`, so a build tool in devDependencies fails with a misleading "command not found". Trust-proxy breaking secure cookies/rate-limit behind SSL is the quiet one.

**SVG (bespoke, unique):** two-band diagram. Top band DEPLOY (git push → npm ci/build with live logs → PM2 reload, `-i max`); bottom band SERVE (Browser HTTPS → Nginx :443 TLS + X-Forwarded-For → Express 0.0.0.0:PORT, trust proxy → `/healthz` 200), with a dashed "manages + restarts" link from PM2 to the process. Brand navy #000f27, purple #4F1AF3, green #40b75f. Distinct from the pillar's single pipeline and the Node sibling's crash-loop/cluster figure.

**Console screenshots:** `../assets/console/add-application.png`, `git-deployment.png`, `env-vars.png`. Plus 4 author img-slots (runtime config panel, `pm2 list`, domain/SSL panel; env slot covered by real shot).

**Byline:** "By Kloudbean Engineering · Getting Express from `node app.js` to a live URL, without the guesswork." (Not "Faster Than Ever".)

**Internal links (7):** UP `how-to-deploy-any-app`; across `deploy-node-app-to-managed-cloud`, `ci-cd-auto-deploy-from-github`, `environment-variables-done-right`, `fix-503-after-deploying-your-app`, `add-managed-database-to-your-app`; money `heroku-alternative-for-modern-apps`. All folders verified to exist.

**Honesty guardrails:** Node/Express on Linux; PM2 multi-process supported; managed CI/CD from Git with live build logs; Node runtime config + env vars in the UI; free auto-renewing SSL; seven managed DB engines; cron from UI; from $8/mo, Enterprise custom. "Managed" = platform runs the server/stack/SSL/backups, you own the app + data. No customer/geo counts, no invented features (no Docker one-click, no autoscaling for normal users). Escape `&lt; &gt; &amp;` in `<pre>`; JSON-LD answers stay plain.

**Freshness:** references Node 20+, 2026, Nginx, PM2, `npm ci`. Re-check Node LTS version and any UI label changes on next review.
