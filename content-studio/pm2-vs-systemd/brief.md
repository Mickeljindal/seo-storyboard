# Brief — PM2 vs systemd: Keeping a Node.js App Running in Production

Silo 2 (deployment fundamentals / Node in production). Decision-guide shape, not the step-by-step deploy template.

## Keywords
- **Primary:** PM2 vs systemd (in H1, `<title>`, meta description, first 100 words, and the H2 "PM2 vs systemd for Node: the honest comparison").
- **Secondary / long-tail:** keep Node app running, Node process manager, run Node in production, PM2 cluster mode, systemd service for Node, PM2 startup on boot, restart Node on crash, PM2 vs systemd for Node, zero downtime reload Node, ecosystem.config.js, systemd unit file Node.
- Volume/difficulty: no verified SEMrush/DataForSEO pull was available for this exact query at write time, so no numbers are cited. "PM2 vs systemd" reads as a mid-intent developer comparison term with strong long-tail support ("keep node app running after ssh", "pm2 restart on reboot"). Re-mine before asserting any volume; do not fabricate.

## PAA-style questions (mirrored into the on-page FAQ + FAQPage JSON-LD)
- What is PM2?
- What is a systemd service for Node?
- PM2 vs systemd for Node: which is better?
- How do I keep a Node app running after I close SSH?
- Does PM2 restart my app on server reboot?
- What is PM2 cluster mode?
- Can I run PM2 under systemd?
- How do I see logs with PM2 vs systemd?
- Do I need PM2 on managed hosting?
- Is systemd better than PM2 for a single Node app?

## Angle / intent
How do you keep a Node.js app running in production (survives crashes, restarts on boot, uses all cores)? The two standard answers are PM2 and systemd. Frame the real problem first (`node server.js` in SSH dies, no restart, no reboot recovery, one core), teach both tools with real config (ecosystem.config.js + a systemd unit), compare them in a table, give an honest recommendation including the PM2-under-systemd combo, list the gotchas, then land on managed hosting doing this for you.

## Distinct value (the swap test)
- Real, copy-paste `ecosystem.config.js` and a minimal `/etc/systemd/system/node-api.service` unit.
- The enable-vs-start distinction and journalctl, explained.
- The PM2-under-systemd combo explained honestly (pm2 startup writes a systemd unit).
- Anti-pattern beats: skipped `pm2 startup`/`pm2 save`, running as root, cluster mode with in-memory state, memory leaks + `max_memory_restart`, no log rotation.
- Founder opinion on when to pick which, plus the "reboot on purpose to prove it" rule.

## Internal links (6, all live folders confirmed, absolute /blog/<slug>/)
- environment-variables-done-right (gotchas: secrets out of repo)
- what-is-a-managed-server (managed boundary)
- deploy-express-app (framework sibling)
- deploy-nestjs-app (framework sibling)
- ci-cd-auto-deploy-from-github (auto-deploy)
- reverse-proxy-explained (proxy in front of the process)
- NOT linked (folders don't exist yet): nginx-reverse-proxy-for-node, run-a-cron-job-without-ssh. Add once written.

## Visuals
- Bespoke inline SVG: fragile `node server.js` (one process, one core, dies on SSH close / crash / reboot) vs supervised (PM2 or systemd; cluster workers across cores, auto-restart, starts on boot). Brand navy #000f27, purple #4F1AF3, green #40b75f, muted danger red for failure chips.
- Real screenshots: ../assets/console/add-application.png (Node runtime/start command), ../assets/console/server-health.png (process staying up, resource use).
- 4 `.img-slot` spacers: pm2 list, systemctl status + journalctl, PM2-under-systemd, Node runtime config panel.

## Byline
"Keeping Node Alive" (unique; not "Faster Than Ever").

## Honesty guardrails
- Grounded facts only: PM2 multi-process supported for Node; Node runtime config set in dashboard UI; managed stack supervises the process (crash restart, reboot recovery). Linux stacks.
- Do NOT claim autoscaling for normal users (enterprise/custom only). Cluster mode uses existing cores, explicitly not autoscaling.
- No invented metrics (restart times, memory, benchmarks). Config example values (400M, RestartSec=2) are illustrative, not performance claims.
- No blurb cliches.

## [CONFIRM] facts omitted
- None needed for this topic. Autoscaling deliberately framed as enterprise/custom-only and explicitly not automatic for normal apps.
