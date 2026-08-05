# Brief — How to Deploy Strapi to Production Without Losing Your Content

Silo 2 (deployment fundamentals + frameworks). Spoke under the pillar `how-to-deploy-any-app`, Node/headless-CMS branch, sibling to `deploy-express-app` and `deploy-node-app-to-managed-cloud`.

**Primary keyword:** deploy Strapi (also "deploy Strapi to production", "Strapi hosting"). Placed in H1, `<title>`, meta description, first 100 words, and the H2 "How to deploy Strapi on a managed server (step by step)". "deploy Strapi to production" also opens the `.tldr`.

**Secondary / long-tail (woven through body + FAQ):** Strapi production database, Strapi Postgres, Strapi MySQL, Strapi environment variables, Strapi admin panel build, Strapi APP_KEYS, self-host Strapi, Strapi upload provider S3, headless CMS hosting, Strapi behind nginx, Strapi config/server.js url, NODE_ENV=production npm run build, Strapi SQLite production.

**PAA-style questions (mapped to the FAQ + JSON-LD):** How do I deploy Strapi to production? What database should Strapi use in production? Why not SQLite in production? What environment variables does Strapi need? How do I build the Strapi admin panel? Where do Strapi uploads go? How do I run Strapi behind nginx? What causes the "App keys are required" error? Can I host Strapi on Kloudbean? Do I need Node in production or can I export a static site?

Volumes are directional, grounded in the deploy-* cluster demand rather than a fresh export. Re-pull from the SEMrush gap data / DataForSEO (`/tmp/mined_topics.json`, or the DATAFORSEO creds in `.env`) before any volume is cited in copy. None are cited in the article.

**Intent:** how-to, commercial. A Node dev who built a Strapi CMS on the default SQLite in dev and now needs it live: what to change, in what order, and why the first deploy breaks.

**Angle (distinct from the Node/Express siblings):** the Express sibling owns the generic Node first-deploy config story (PORT/host/trust-proxy/502). This piece is Strapi-specific and CMS-shaped: the SQLite-loses-your-content trap, the five secrets Strapi refuses to boot without (with the real `Middleware "strapi::session": App keys are required.` error), the admin-panel React build (`NODE_ENV=production npm run build` then `npm run start`), the uploads-to-local-disk trap fixed with an S3 upload provider, and the reverse-proxy `url` + `proxy: true` in `config/server.js`. Lands on Kloudbean's Node runtime + managed Postgres/MySQL + S3 buckets + Git CI/CD.

**Shape:** production-readiness field guide, not the pillar's six-step template. Concept (what Strapi needs) -> the #1 mistake (SQLite) -> topology SVG -> database + config -> the five secrets -> admin build -> uploads -> reverse proxy -> a checklist table -> then the console deploy walkthrough -> save-you-later habits -> CTA -> FAQ. Deploy steps come late, after the reader understands why.

**Founder POV / original value:** "SQLite is great in dev, wrong in prod, don't ship it past a demo." Most Strapi deploy failures are a missing secret, a forgotten build, or SQLite, not a code bug (grounded general-true pattern, no invented ticket). Real checkable details: default SQLite at `.tmp/data.db`, port 1337, the exact App keys error string, changing `config/server` requires rebuilding the admin, Strapi 5 also expects `ENCRYPTION_KEY`, `openssl rand -base64 32`.

**SVG (bespoke, unique):** production topology. Browser/client -> HTTPS -> reverse proxy :443 (TLS, sets public URL) -> Strapi Node :1337 container split into "Admin panel (built React bundle)" + "REST + GraphQL API" -> branches to managed Postgres/MySQL (private net + backups) and S3-compatible object storage (uploads/media). Navy #000f27 / purple #4F1AF3 / green #40b75f. Distinct from the DB article's linear User->App->DB->Backups chain and the Express two-band deploy/serve figure (this one branches to two data stores and splits the Strapi process internally).

**Console screenshots (4 real):** `../assets/console/launch-database.png` (managed Postgres/MySQL), `env-vars.png` (the secrets + DB connection), `add-application.png` (Node app), `git-deployment.png` (CI/CD). Plus 4 author img-slots: content-type builder, runtime config panel (build/start), media library on object storage, live admin login over HTTPS.

**Byline:** "By Kloudbean Engineering · Headless, Not Homeless." (unique; not "Faster Than Ever"). Closing byline: "Kloudbean · Own your headless CMS, from the admin build to the backups."

**Internal links (7, all folders verified to exist):** `add-managed-database-to-your-app`, `managed-postgresql-hosting` (the single managed-X money page), `environment-variables-done-right`, `ci-cd-auto-deploy-from-github`, `store-user-uploads-in-object-storage`, `nginx-reverse-proxy-for-node`, `deploy-express-app` (sibling). Kept to one money page per the linking rule; `s3-compatible-object-storage` and `server-backups-guide` were dropped as near-duplicate targets to stay at 7.

**Honesty guardrails / grounded facts used:** managed Node.js runtime; managed PostgreSQL/MySQL/MariaDB one-click; built-in S3-compatible object storage with AWS S3 SDK compatibility; managed CI/CD from Git (GitHub) with live build logs; runtime config + env vars in the dashboard; free auto-renewing SSL; reverse proxy handled by the managed stack; automatic backups; private networking (DB not public); 7 clouds; from $8/mo, Enterprise custom; free migration help. "Managed" = platform runs server/stack/SSL/backups, you own app + data. No customer/geo counts, no invented features (no Docker one-click, no autoscaling for normal users, no read-replica claims). Escaped `&lt; &gt; &amp;` in `<pre>`; JSON-LD answers plain (no `<` `>` `&` or quotes). Near-zero em-dashes in prose.

**[CONFIRM] facts omitted from copy:** none needed for this topic. Strapi version framed as "recent Strapi 5" only where the `ENCRYPTION_KEY` note applies; no exact SLA %, no enterprise dollar figures, no customer counts.

**Freshness:** references Strapi 5, `ENCRYPTION_KEY`, Node runtime, 2026 UI labels, port 1337. Re-check Strapi major version, the required-secrets set, and any console label changes on next review.
