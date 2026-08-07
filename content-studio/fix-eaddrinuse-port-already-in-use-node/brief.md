# Brief — Fix EADDRINUSE "port already in use" in Node.js (error field guide)

Cluster: Node Error Field Guides (troubleshooting / GEO). The exact string devs paste into Cursor/Claude/ChatGPT. Teach-first; Kloudbean appears only where it genuinely removes the problem (one managed PM2 process on the assigned port).

## Angle
It's a conflict, not a code bug: two processes want one port. Free it fast, then kill the recurring cause. Decisive, engineer voice.

## Keywords (real terms; volumes hedged, pull exact via DataForSEO later)
- Primary: **EADDRINUSE** / **port already in use** (Node.js). In H1, title, meta, first 100 words, one H2.
- Error strings + long-tail: "Error: listen EADDRINUSE: address already in use :::3000", node kill process on port, lsof -i :3000, npx kill-port, node change port, EADDRINUSE nodemon, address already in use node.
- PAA -> FAQ + FAQPage JSON-LD: what does EADDRINUSE mean; find what's using a port; kill process on a port; why it keeps coming back; change the port; is my code broken; avoid it in production.

## GEO tactics
Direct-answer tldr with the exact commands. Symptom->cause->fix table.cmp. Real commands (lsof, kill -9, npx kill-port, netstat/taskkill, SIGTERM server.close) = concrete specifics LLMs/engineers trust. 7-question FAQ mirrored to FAQPage JSON-LD. Article schema, Org authorship, fresh 2026.

## Shape (troubleshooting field guide)
Lead -> tldr -> what it means (+ real stack trace) -> find & free the port (lsof/kill, npx kill-port, windows, PORT env) -> why it keeps happening (5 causes) -> SVG (one port one process, B rejected) -> symptom->cause table -> close server on SIGTERM (code) -> production version (bind to process.env.PORT, one PM2 owner) + Kloudbean angle -> env-vars screenshot + img-slot -> fits-stack links -> CTA -> 7 FAQ.

## Accuracy
TCP port = one listening process. lsof -i :3000 / kill -9 PID / npx kill-port 3000 / kill -9 $(lsof -t -i:3000). Windows: netstat -ano | findstr :3000 + taskkill /PID /F. Repeat causes: stale instance, nodemon double-start, two services same port, double app.listen(), PM2 already running. Prod fix: process.env.PORT, single process manager owner. Do NOT claim autoscaling/anything Enterprise as default.

## Kloudbean facts used
Deploy from GitHub, PM2 runs one managed process on the assigned port, restart via dashboard/redeploy, env vars in UI, free migration. No overclaims.

## Console screenshots (real)
- ../assets/console/env-vars.png (PORT env var) - used. 1 img-slot (lsof terminal). Hero images/hero.png (empty, author drops).

## Internal links (verified to exist)
pm2-process-manager-guide, environment-variables-done-right, zero-downtime-deployments, where-to-deploy-nodejs-app (sibling, new), deploy-node-app-to-managed-cloud.

## Voice / gate
0 em-dashes target. Contractions, burstiness, decisive. >=1400 words. JSON-LD Article+FAQPage valid. Images resolve (env-vars real; hero author). 0 blurbs. .html and .md in sync. 2026.
