# Brief — Self-Host NocoDB (production tutorial)

Cluster: self-hosted tools. Format: production how-to built around one original insight (the two databases NocoDB touches). Distinct from the Supabase tutorial (full-backend) and the listicle roundup. Byline: **By Kloudbean Engineering** — tagline "A UI on your own database" (unique, not "Faster Than Ever").

## Keyword grounding
Volumes below are directional estimates (no fresh SEMrush/DataForSEO pull was supplied for this slug); treat as hedged, not exact. Re-mine before relying on precise numbers.

- **Primary:** "self-host NocoDB" / "self-hosted NocoDB" (low-mid volume, low-mid difficulty, high intent). In H1, title, meta description, first 100 words, and the H2 "Self-hosted NocoDB vs Airtable".
- **Secondary / long-tail (woven through body + FAQ):**
  - "NocoDB Airtable alternative" / "open source Airtable"
  - "NocoDB metadata database"
  - "NocoDB PostgreSQL" / "NocoDB MySQL"
  - "NC_DB env" (NC_DB environment variable)
  - "deploy NocoDB"
  - "NocoDB data source"
- **PAA-style questions mirrored into FAQ + FAQPage JSON-LD:** Is NocoDB a good Airtable alternative? What database does NocoDB need? Why not use the default SQLite? Can NocoDB connect to my existing database? What is NC_DB? Does NocoDB support Postgres and MySQL? Is self-hosted NocoDB free? How do I deploy NocoDB? How do I back up NocoDB?

## Original value (competitors can't copy this cleanly)
The two-database clarity: NocoDB's **metadata store** (bases/views/users/config — belongs on a managed MySQL/Postgres, NOT the default `noco.db` SQLite that gets wiped on redeploy) vs its **data sources** (your existing SQL databases it puts a spreadsheet UI on). Framed as the #1 self-host mistake. Bespoke SVG shows both edges over the internal connection.

## Ground-truth guardrails (kloudbean-facts)
- NocoDB = a Node app on Kloudbean's **managed Node runtime**. NOT a one-click app (one-click list is n8n, Supabase, OpenWebUI+DeepSeek, Postiz, Penpot). No one-click/Docker-one-click NocoDB claim.
- Managed engines used: MySQL, MariaDB, PostgreSQL (one-click, backups, IP allow-listing).
- Env vars in UI (Runtime Configuration), managed CI/CD from GitHub, IP allow-listing (VPC on Enterprise), automatic backups, Shorewall + Fail2ban, free SSL, FLB built-in.
- Managed = server/stack/SSL/backups/patching; you own code + data. Linux only. From $8/mo. Free migration + free trial approved. No SLA %, no customer/country counts, never "certified".

## Real config surfaced
`NC_DB=pg://host:5432?u=..&p=..&d=..` (and `mysql2://` variant), `NC_AUTH_JWT_SECRET`, `PORT=8080`, `NC_PUBLIC_URL`. SQLite fallback (`noco.db`) called out as the prod trap. Node bootstrap snippet (Noco.init + express).

## Assets
Real console screenshots: launch-database.png, add-application.png, env-vars.png, git-deployment.png. 4 `.img-slot` placeholders (NocoDB grid, live sign-in, SSL cert, add-data-source dialog). Hero: images/hero.png (author supplies).

## Internal links (verified slugs only)
environment-variables-done-right, deploy-node-app-to-managed-cloud, ci-cd-auto-deploy-from-github, server-backups-guide, managed-postgresql-hosting, managed-mysql-hosting, best-self-hosted-tools, self-host-supabase.

## Voice
Humanized default: near-zero em-dashes in prose, contractions, varied rhythm, one mild opinion ("the SQLite default is fine for a look, wrong for anything you'd miss"), direct "you". No blurb cliches. Target 2400-2900 words.
