# Brief — How to Deploy a Fastify App to Production

Silo 2 (Deploy any app). Spoke under the `how-to-deploy-any-app` pillar. Sibling to `deploy-express-app`, `deploy-nestjs-app`, and `deploy-node-app-to-managed-cloud`.

## Keywords (ground the copy)
- **Primary:** deploy Fastify app (in H1, `<title>`, meta description, first 100 words, and the H2 "How to deploy a Fastify app on a managed server"). Also targeting **Fastify production** and **Fastify hosting**.
- **Secondary / long-tail woven through body + FAQ:**
  - Fastify listen 0.0.0.0 / what host should Fastify listen on
  - Fastify behind nginx / Fastify reverse proxy / trustProxy
  - Fastify environment variables (process.env.PORT, DATABASE_URL)
  - Fastify graceful shutdown (app.close, onClose, SIGTERM, return503OnClosing)
  - Fastify vs Express deploy
  - Fastify logging pino / pino-pretty
  - Fastify production checklist
  - Fastify PM2 / cluster mode
  - Fastify 502 unreachable in production
- **PAA-style questions answered (mirrored in FAQ + FAQPage JSON-LD):** How do I deploy a Fastify app to production? Why is my Fastify app unreachable / 502 in production? What host should Fastify listen on? Fastify vs Express: which is better for production? How do I run Fastify behind nginx? How do I do a graceful shutdown in Fastify? Do I need PM2 to run Fastify? How do I read environment variables in Fastify? How do I set up logging in Fastify for production? Do I need Docker to deploy a Fastify app?
- **Volumes:** not pulled from SEMrush/DataForSEO for this run, so no numbers are cited in the copy. "deploy Fastify app", "Fastify production", and "Fastify hosting" are steady long-tail dev-intent terms; "Fastify vs Express" carries the most volume of the set. Re-mine for precise volume/difficulty before any paid-placement decision. Do not invent numbers.

## Intent & angle
How-to, commercial-adjacent. Reader is a developer who built a Fastify API, runs it with `node server.js` locally, and needs the honest production path. Distinct from the Express and NestJS siblings: this piece leads with what is genuinely Fastify-specific rather than repeating general Node concerns.
- **Original value / the hook:** Fastify binds to `127.0.0.1` (localhost) by default, unlike Express which binds to all interfaces. That single default is the #1 cause of "works locally, 502 in prod" for Fastify. Fix: `app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' })`. Led with, diagrammed, and put first in the checklist and the "where it breaks" list.
- Other Fastify specifics: built-in pino logger (`logger: true`, JSON to stdout, pino-pretty is dev-only); `trustProxy: true` at construction (vs Express `app.set('trust proxy')`); async plugin/encapsulation boot (`await app.ready()`); graceful close via `app.close()` promise + `onClose` hooks + `return503OnClosing`; the v4/v5 options-object `listen({ port, host })` vs the deprecated positional form.

## Shape (not the fixed template)
Lead -> `.tldr` (answers "how do I deploy a Fastify app to production?") -> lead-with-the-gotcha H2 (host binding) + bespoke SVG -> production-ready server in one file (env, trustProxy, pino) with a "Coming from Express?" note -> graceful shutdown + plugin boot note -> PM2 / cluster + founder opinion -> managed database + pooling -> deploy on Kloudbean (screenshots) -> Fastify vs Express comparison table -> production checklist -> "where it breaks" anti-pattern beat -> what you own -> CTA -> 10-question FAQ. Opener and section order deliberately differ from the Express (two-band deploy/serve) and NestJS (dev-vs-prod build) pieces.

## Assets
- **Bespoke inline SVG:** a single left-to-right request path (browser HTTPS :443 -> reverse proxy TLS -> Fastify on 0.0.0.0:PORT with pino + graceful shutdown -> managed DB locked to the app server IP), with a highlighted fork at the bottom contrasting `listen({ port })` = 127.0.0.1 = 502 vs `listen({ port, host: '0.0.0.0' })` = reachable. Brand navy #000f27 / purple #4F1AF3 / green #40b75f, plus a muted warning stroke on the wrong-host box. Distinct from the Express two-band diagram and the NestJS dev-vs-prod lanes.
- **Real console screenshots:** `add-application`, `git-deployment` (both in ../assets/console/).
- **4 img-slots:** Fastify boot line terminal, pm2 list, runtime-config panel, live build logs.

## Internal links (9; all folder-verified to exist with `ls -d`)
deploy-express-app (Fastify vs Express + host-default contrast), deploy-nestjs-app (TypeScript framework sibling), environment-variables-done-right, nginx-reverse-proxy-for-node, pm2-vs-systemd, add-managed-database-to-your-app, database-connection-pooling, zero-downtime-deployments, ci-cd-auto-deploy-from-github. (The task offered `reverse-proxy-explained / nginx-reverse-proxy-for-node` as either/or; kept the Node-specific one to hold link density down.)

## Byline
By Kloudbean Engineering · Fast By Default, Live By Design. (Unique to this article. NOT "Faster Than Ever".)

## Honesty guardrails
Fastify is a Node framework, so it runs on Kloudbean's managed Node runtime; NOT claimed as a named one-click "Fastify runtime" (changelog lists Express/Angular/React/Vue for Node, not Fastify by name). PM2 multi-process supported; managed CI/CD from Git + live build logs; Node runtime config + env vars in UI; reverse proxy + free auto-renewing SSL handled; 7 clouds; 7 managed DB engines; private networking; Redis for shared state; object storage for uploads. From $8/mo, Enterprise custom. Autoscaling/k8s = enterprise/custom only, framed as "most apps do not need it", never "automatic for everyone". No Docker one-click claim. No customer/geo counts; never claim any certification is held. Fastify-vs-Express throughput stated qualitatively ("benchmarks higher"), no fabricated multiple, and hedged with "most apps are database-bound". Escape `<` `>` `&` inside `<pre>`; JSON-LD answers kept free of raw `< > &` and double quotes.

## Freshness / review notes
Fastify v4/v5 syntax (`listen({ port, host })`, `trustProxy`, `return503OnClosing`). Recheck on a future major (v6) for listen/close API changes. Node 20+ cited as the safe default; bump as LTS advances.
