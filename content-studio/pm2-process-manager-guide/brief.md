# Brief — PM2 Process Manager: A Practical Guide for Node.js in Production

Slug: pm2-process-manager-guide
Cluster: Silo 2 — deployment fundamentals and Node in production.

## Keywords (hedged volumes; treat as approximate, verify in SEMrush/DataForSEO before relying)
- **Primary:** "PM2 process manager" (mid volume, roughly 1-3k/mo, low-to-mid difficulty). Also targets "PM2 Node.js" and "PM2 guide".
- **Secondary / long-tail:**
  - "PM2 cluster mode" (steady, ~500-1k/mo)
  - "pm2 start" (high, broad navigational/how-to intent)
  - "ecosystem.config.js" (steady dev query)
  - "pm2 reload zero downtime" / "pm2 reload vs restart" (low volume, high intent)
  - "pm2 startup" (steady, boot-persistence intent)
  - "pm2 logs" (steady)
  - "pm2 restart on crash" / "keep node app running" (mid, problem intent)
  - "pm2 max_memory_restart" (low volume, high intent)
- Placement: primary in H1, title, meta description, first 100 words, and the "PM2 cluster mode" + Kloudbean H2s. Long-tail mapped to sections and FAQ.

## Intent & audience
How-to, informational with commercial pull. Node developers moving an app from laptop to a real server: they can run `node app.js` but haven't set up a supervisor. They search for how to keep the process alive, use all cores, reload without downtime, and survive reboots. Some are on a VPS; some are evaluating managed hosting.

## Angle
Engineer-level, opinionated, hands-on. Teach PM2 properly with real commands and config, then land on Kloudbean's managed Node runtime (PM2 multi-process supported; CI/CD handles deploy). Distinct from the pm2-vs-systemd comparison: this is the "how to use PM2" guide, that one is "which supervisor to pick". Link to it once for the comparison, don't rehash.
Original value competitors miss: the workers x pool = total DB connections math; the reload-is-only-zero-downtime-if-you-handle-SIGINT gotcha (kill_timeout, wait_ready); cluster mode + in-memory session breakage; log files filling the disk; pm2 save ordering.

## Structure (no fixed template)
Lead + .tldr → why bare node app.js fails (concrete failure modes) → bespoke SVG (PM2 master load-balancing N workers per core behind one port, auto-restart on crash) → pm2 start → ecosystem.config.js → cluster mode / how many instances (pool math) → commands table (start/restart/reload distinction) → zero-downtime reload (SIGINT/graceful) → logs/monitoring/memory → survive reboots (startup + save) → Kloudbean managed runtime (3 real screenshots) → one-line PM2 vs systemd pointer → CTA → 8 FAQ → JSON-LD Article + FAQPage.

## Images
- Hero: images/hero.png (top).
- Real console screenshots: ../assets/console/add-application.png, ../assets/console/git-deployment.png, ../assets/console/server-health.png.
- 4 .img-slot placeholders: pm2 list, pm2 monit, pm2 reload rolling, pm2 startup + save.

## Internal links (verified slugs only)
database-connection-pooling, zero-downtime-deployments, ci-cd-auto-deploy-from-github, deploy-node-app-to-managed-cloud, deploy-express-app, pm2-vs-systemd.

## Byline
"By Kloudbean Engineering" · tagline "Keep the Node process up." (Unique, not "Faster Than Ever".)

## Honesty guardrails
Node is a supported managed runtime; PM2 multi-process (cluster across cores) is explicitly supported. Frame PM2 as standard PM2 the reader runs/configs; the managed runtime supervises the process and supports multi-process, CI/CD handles build/deploy. Do NOT invent a bespoke PM2 UI (no reload buttons etc.). Cluster mode uses existing server cores; it is NOT autoscaling (enterprise/custom only). FLB is built-in for load balancing across instances. Linux only; managed = server/stack/SSL/backups/patching handled, you own code + data. Pricing from $8/mo; free migration assistance + free trial approved. No SLA %, no customer/country counts, never "certified". No blurb clichés.
