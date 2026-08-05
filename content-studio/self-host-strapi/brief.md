# Brief — How to Self-Host Strapi in Production

Cluster: Self-Hosted Tools. Format: production how-to / anti-pattern field guide (opens on the dev-to-prod gap, not the generic "what is Strapi"). Distinct from self-host-supabase (stack/keys tutorial) by centering on the three pieces of prod state: real DB, shared object storage, stable secrets.

## Keywords (grounded; hedge all volumes, verify in DataForSEO/SEMrush before publish)
- **Primary:** "self-host Strapi" / "self-hosted Strapi" / "deploy Strapi to production". Mid-volume, low-to-mid difficulty; strong developer/how-to intent. Placed in H1, <title>, meta description, first 100 words, and the first H2 ("Why self-host Strapi in the first place?").
- **Secondary / long-tail** (approximate monthly volumes, treat as estimates, not exact):
  - "Strapi production database" (~low hundreds)
  - "Strapi PostgreSQL" (~few hundred)
  - "Strapi S3 upload provider" (~low hundreds)
  - "Strapi APP_KEYS" (~low hundreds, high-intent error/config search)
  - "Strapi environment variables" (~few hundred)
  - "Strapi headless CMS hosting" (~low hundreds)
  - "Strapi SQLite production" (~low hundreds, pain-point search)
  - "deploy Strapi to production" (~few hundred)
- **PAA-style questions** woven into the FAQ: can I self-host Strapi; what database in production; why not SQLite; where to store uploads; what are APP_KEYS; how to deploy from GitHub; do I build the admin; is it free; multiple instances behind a load balancer; SQLite to Postgres migration.

## Audience
Developers and small teams running the open-source Strapi Node headless CMS who have it working locally (SQLite + local uploads) and now need a real production deploy that survives redeploys and scale. Intent: how-to + commercial.

## Angle / structure (no fixed template)
Lead on the dev-to-prod gap. `.tldr` direct answer. Why self-host (own data, no per-seat SaaS fees, custom plugins, API on your terms) + one honest tradeoff line. Bespoke SVG (Strapi Node app -> managed Postgres over private net; uploads -> S3). Anti-pattern section: SQLite in prod, local-disk uploads, missing/rotated APP_KEYS, NODE_ENV, unbuilt admin. cmp table: self-hosted Strapi vs hosted headless SaaS. Real config: config/database.js (postgres), env vars (APP_KEYS + salts + DATABASE_URL + NODE_ENV), build/start, config/plugins.js S3 provider + CSP note. Numbered deploy steps with 4 real console shots (launch-database, add-application, env-vars, git-deployment) + FLB shot for scaling. Security + scaling sections. CTA. 10-Q FAQ + FAQPage JSON-LD.

## Kloudbean framing (ground truth)
Strapi is NOT a one-click app (one-click list is n8n, Supabase, OpenWebUI+DeepSeek, Postiz, Penpot). Frame as: deploy the Strapi Node app on the managed Node runtime (PM2). Managed PostgreSQL (one-click, backups, private net). Built-in S3-compatible storage for uploads. Managed CI/CD from GitHub + env vars in UI. FLB built in for multiple instances. Managed = OS/stack/SSL/backups/patching; you own code + data. Linux only. From $8/mo; free migration assistance + free trial. No SLA %, no customer/country counts, no "certified", no Docker one-click, no one-click read replicas.

## Internal links (verified slugs only)
best-self-hosted-tools, self-host-supabase, managed-postgresql-hosting, deploy-node-app-to-managed-cloud, environment-variables-done-right, ci-cd-auto-deploy-from-github, server-backups-guide.

## Byline
By Kloudbean Engineering · Own your content layer (unique; not "Faster Than Ever").

## Assets
hero.png (top img, author-supplied). 4 img-slots: media library on S3, openssl generating APP_KEYS, admin login on own domain, admin roles/permissions.
