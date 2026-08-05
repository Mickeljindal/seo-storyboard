# Brief — Self-Host Umami (production deploy guide)

Cluster 2 — Self-Hosted Tools. Format: production how-to / engineer walkthrough (database-first ordering), distinct from the decision-guide and stack-explainer shapes already used in the cluster. Opener leads with the Google Analytics pain, not a definition.

## Keywords (grounded, hedged volumes)
Primary: **self-host Umami** (also "self-hosted Umami", "Umami analytics"). Mid-intent, how-to + commercial. Rough volume band low-hundreds/mo global, difficulty moderate; treat as directional, verify in SEMrush/DataForSEO before quoting anywhere.
Secondary / long-tail (weave through body + FAQ):
- Umami database, Umami PostgreSQL, Umami DATABASE_URL, Umami APP_SECRET (money/config terms, low volume, low difficulty)
- Google Analytics alternative self-hosted, privacy-friendly analytics, cookieless analytics (higher volume, higher difficulty; supporting relevance)
- deploy Umami, Umami tracking script, "does Umami need a cookie banner", "is Umami GDPR compliant" (PAA-style, answered in FAQ)
Placement: primary kw in H1, <title>, meta description, first 100 words, and >=1 H2 ("Why self-host Umami", "What you're running when you self-host Umami", "Deploy Umami on a managed Node server"). Volumes are directional only; none fabricated as precise figures.

## Audience / intent
Developers, indie hackers, and privacy-minded site owners who want to leave Google Analytics and own their visitor data. They can run a Node app and a database but want the production must-dos spelled out (real DB, env vars, migrations, tracking script). Intent: how-to with a consideration edge (self-host vs Umami Cloud vs GA4).

## Angle / what makes it non-generic (swap test)
Kloudbean-specific console flow (launch-database -> add-application -> env-vars -> git-deployment), managed-Node + managed-PostgreSQL framing, private-network DB, free SSL, Shorewall/Fail2ban baseline. Original value competitors can't copy unchanged: DB-first deploy ordering; the APP_SECRET-derived-from-DATABASE_URL gotcha (tokens break on password rotation); the default admin/umami login anti-pattern; the "throwaway local DB wipes your history" failure mode; first-party script dodging ad blockers. Honest one-line nod to GA4 (free + Google Ads integration) and Umami Cloud (free hobby tier), then land on ownership.

## Accuracy guardrails (kloudbean-facts)
- Node is a supported managed runtime; frame as "run the Umami Node app on managed Node", NOT one-click Umami and NOT Docker one-click. Umami is not in the one-click app list.
- PostgreSQL + MySQL are managed engines (one-click, backups, private networking). Umami needs Postgres or MySQL; use managed PostgreSQL. Umami ships Prisma migrations run at build.
- Env vars in UI, managed CI/CD from GitHub with live build logs, private networking/VPC, automatic backups, Shorewall + Fail2ban, free SSL.
- Managed = server/stack/SSL/backups/patching handled; you own code + data. Linux only. Pricing from $8/mo; free migration assistance + free trial approved. No SLA %, no customer/country counts, never "certified". No blurb cliches.

## Internal-link plan (absolute /blog/<slug>/, verified slugs only)
deploy-node-app-to-managed-cloud, environment-variables-done-right, ci-cd-auto-deploy-from-github, server-backups-guide, best-self-hosted-tools, self-host-supabase, managed-postgresql-hosting (7 links).

## Assets
hero.png (top <img>, author supplies) + 4 real console screenshots (launch-database, add-application, env-vars, git-deployment). One bespoke inline SVG: visitor browser + script.js -> Umami Node app -> managed PostgreSQL over private network, "your server, your data" boundary (navy #000f27, purple #4F1AF3, green #40b75f). 3 .img-slot placeholders. .tldr + .note (Coming from Google Analytics?) + table.cmp (self-hosted Umami vs GA4 vs Umami Cloud).

## Byline
By Kloudbean Engineering — "Analytics that stay yours". (Unique; not "Faster Than Ever".)

Slug: self-host-umami. Target length 2400-2900 words. JSON-LD Article + FAQPage (10 Qs).
