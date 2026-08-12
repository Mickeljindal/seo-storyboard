# Brief — How to Self-Host Metabase in Production

**Slug:** self-host-metabase
**Byline:** By Kloudbean Engineering · Dashboards you actually own (unique; NOT "Faster Than Ever")
**Target length:** 2400-2900 words.

## Keywords (hedged volumes; treat as directional, not exact)

**Primary:** "self-host Metabase" (also "self-hosted Metabase", "Metabase hosting"). Mid volume, rising with the self-hosting/own-your-data trend; low-to-moderate difficulty. Placed in H1, `<title>`, meta description, first 100 words, and the H2 "Why self-host Metabase at all".

**Secondary / long-tail (each woven into body + FAQ):**
- "Metabase application database" — the core technical hook; low volume, high intent.
- "Metabase H2 to Postgres" — migration searchers; low volume, very high intent (error/how-to).
- "Metabase MB_DB env" / "MB_DB environment variables" — config searchers; low volume, high intent.
- "Metabase Java heap memory" / "Metabase OutOfMemoryError" — troubleshooting; low volume, high intent.
- "Metabase open source BI" — category term; moderate volume.
- "deploy Metabase" — moderate volume, how-to intent.
- "Metabase Postgres data source" — connecting data; low volume.
- "Metabase self-hosted vs cloud" — comparison intent; low-moderate volume.

Volumes are directional (no live SEMrush/DataForSEO pull was available for this exact topic in-session). Re-mine or confirm before quoting any precise number publicly.

## Audience & intent
Engineers, data/analytics folks, and technical founders who like Metabase and want to run it themselves for ownership, cost control, and keeping business data on their own infra. Intent: how-to + commercial. They already know what Metabase is; they need the production plumbing (app DB, heap, SSL, private network) done right.

## Angle (why this beats generic "install Metabase" posts)
Most guides stop at "download the JAR and run it." This one leads with the thing that actually breaks in production: the two-database distinction (application DB vs data sources) and the H2 default that quietly loses dashboards. Original value: bespoke SVG showing the two DB jobs, real MB_DB_ config, the documented heap guidance (leave 1-2 GB for the OS), the load-from-h2 migration with its version-match + filename gotchas, and an honest "Metabase is NOT a one-click app here, it's a Java app on a managed server" framing.

## Structure (non-template shape)
Lead -> tldr -> "two database jobs" (concept + SVG) -> why self-host + tradeoff + cmp table -> the H2 mistake (failure modes + heap/disk/SSL) -> real MB_DB config + heap + MB_JETTY_PORT -> 4 numbered deploy steps (managed Postgres, add Java app, env vars, SSL) -> H2->Postgres migration -> connect data sources -> security & backups -> where it fits -> CTA -> 10-question FAQ.

## Ground truth used (kloudbean-facts)
Java is a supported managed runtime; Metabase framed as "run the Java JAR on a managed server", NOT one-click, NOT Docker one-click. Managed PostgreSQL/MySQL (one-click, backups, private networking) for the app DB, not H2. Env vars in the UI (Runtime Configuration), IP allow-listing (VPC on Enterprise), automatic backups, Shorewall + Fail2ban, free SSL, FLB built-in. Managed = server/stack/SSL/backups/patching handled, you own code + data. Linux only. Pricing from $8/mo; free migration assistance + free trial. No SLA %, no customer/country counts, never "certified".

Metabase facts verified against metabase.com docs: H2 not recommended for production; PostgreSQL recommended app DB; migrate via `load-from-h2` (same version that wrote the file, Metabase stopped, path is metabase.db not the .mv.db); runs as a JAR needing a JRE; default port 3000 via MB_JETTY_PORT; heap guidance = leave 1-2 GB for the OS.

## Internal links (7; absolute, verified slugs only)
- managed-postgresql-hosting, managed-mysql-hosting (app DB choice)
- environment-variables-done-right (MB_DB in env)
- deploy-node-app-to-managed-cloud (running a long-lived app process)
- server-backups-guide (backing up the app DB)
- best-self-hosted-tools, self-host-supabase (sibling own-your-data pieces)

## Images
`images/` starts empty; hero referenced as `images/hero.png` (author supplies). Real console screenshots: launch-database, add-application, env-vars, ssl-certificate. Plus one bespoke inline SVG (two-DB diagram) and 4 `.img-slot` placeholders.

## Voice
Humanized: near-zero em-dashes in prose, contractions, varied rhythm, direct "you", one mild opinion ("the H2 default is a demo convenience, treat it as a trap for anything real"). No AI filler, no blurb cliches.

## Freshness / to-review
Java supported-version number moves; kept hedged ("check Metabase docs"). Metabase Cloud pricing model hedged ("seats or usage, depending on the plan"). Last reviewed: at creation.
