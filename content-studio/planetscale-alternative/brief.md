# Brief — PlanetScale Alternative (honest alternative / decision guide)

Silo 4 (comparisons & conversion). Spoke. Converts toward managed-mysql-hosting.

## Keywords (ground the article)
- Primary: **PlanetScale alternative** (commercial/decision intent). In H1, title, meta description, first 100 words, and one H2 ("Why look for a PlanetScale alternative?").
- Secondary woven through body + FAQ:
  - managed MySQL alternative to PlanetScale
  - PlanetScale pricing alternative
  - own your MySQL database
  - PlanetScale vs managed MySQL (used as an H2 for the comparison table)
- PAA-style questions mirrored into the FAQ + FAQPage JSON-LD: does PlanetScale use real MySQL, why did PlanetScale discourage foreign keys, can I migrate from PlanetScale to managed MySQL, is managed MySQL cheaper, do I lose schema branching.
- Volumes: none supplied for this run. Do NOT invent numbers. If SEMrush/DataForSEO data is pulled later, record target + secondary volumes here.

## Shape (no fixed template)
Honest alternative/decision guide. Order: lead + tldr → fair nod (what PlanetScale is) → why seek an alternative → comparison table (PlanetScale vs managed MySQL) → what owning your MySQL gets you (launch-database shot) → connection string (env-vars shot) → migration (SVG + mysqldump/mysql code) → when PlanetScale is still right (honest note) → how it fits the stack → CTA → 10-question FAQ.

## SVG concept
Migration path, horizontal flow: PlanetScale (serverless MySQL on Vitess) --mysqldump--> appdb.sql (standard MySQL dump) --import--> Managed MySQL (on infra you own, backed up daily) --mysql://--> Your app (private network). Brand navy #000f27 / purple #4F1AF3 / green #40b75f. Point: it's MySQL underneath, so the exit is a normal export, not a rewrite. Unique to this article.

## Console screenshots
- ../assets/console/launch-database.png (launch managed MySQL/MariaDB)
- ../assets/console/env-vars.png (connection string as env var)
- 4 img-slots: connection-details panel, migration terminal, one-dashboard overview (+ the two above cover the rest).

## Internal links (7, all folders exist except sibling noted)
- UP (pillar): best-managed-cloud-hosting
- ACROSS: managed-mysql-hosting, mysql-vs-postgresql, managed-mariadb-hosting, add-managed-database-to-your-app
- SIBLING: supabase-alternative (being created alongside; link kept per task)
- MONEY: cloud-hosting-pricing-explained

## Byline
Top: "By Kloudbean Database Team · Own the MySQL, not someone else's workflow."
Sign-off: "Kloudbean · A database you can dump, move, and keep." (NOT "Faster Than Ever")

## Competitor accuracy (strict)
- PlanetScale = MySQL-compatible serverless database platform built on Vitess; known for schema branching + horizontal scaling. Acknowledge that strength once, fairly.
- No specific PlanetScale prices/tiers/free-tier history (they change). Keep to stable facts (MySQL/Vitess, branching, sharding). No invented flaws.
- Foreign keys: framed as historically discouraged/off by default because of Vitess sharding, hedged with "historically" — not a current hard flaw.
- Migration is real because it's MySQL underneath (mysqldump/mysql).

## Kloudbean facts used (grounded)
Managed MySQL + MariaDB (among 7 engines), standard mysql:// connection, one dashboard, 7 clouds, from $8/mo + Enterprise custom, automatic backups, private networking, free SSL, free migration assistance (approved), free trial. Linux stacks. No customer/geo counts. "Managed" = provisioning/patching/backups/tuning/monitoring; you own schema/queries/data.

## Freshness / review
Could date: PlanetScale pricing model + foreign-key stance (they've evolved), Kloudbean entry price. Keep price language hedged ("verify current pricing"). Last reviewed: at creation.
