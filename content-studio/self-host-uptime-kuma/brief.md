# Brief — Self-Host Uptime Kuma (production deploy guide)

Cluster 2 — Self-Hosted Tools. Format: reliability field-guide / engineer walkthrough that leads with the failure mode (the monitor dying with the app), not a definition. Deliberately not the generic Intro -> Why -> Step 1..6 -> FAQ template used elsewhere in the cluster: the original "mistake that makes your monitor useless" beat comes before the architecture and drives the whole piece.

## Keywords (grounded, hedged volumes)
Primary: **self-host Uptime Kuma** (also "self-hosted Uptime Kuma", "Uptime Kuma"). How-to + commercial intent. Rough volume band low-hundreds to low-thousands/mo global (Uptime Kuma is a high-star project, so branded interest is real); difficulty moderate. Treat as directional, verify in SEMrush/DataForSEO before quoting anywhere. No precise figures fabricated in the article.
Secondary / long-tail (woven through body + FAQ):
- Uptime Kuma status page, Uptime Kuma MariaDB, Uptime Kuma SQLite, Uptime Kuma notifications, deploy Uptime Kuma (money/config terms, low volume, low difficulty)
- self-hosted uptime monitoring, UptimeRobot alternative, Pingdom alternative self-hosted (higher volume, higher difficulty; supporting relevance and the comparison table)
- PAA-style, answered in FAQ: "Is Uptime Kuma free?", "What database does Uptime Kuma use?", "Should I run Uptime Kuma on the same server as my app?", "How do I get alerts from Uptime Kuma?", "Can Uptime Kuma make a status page?", "Do I need Docker to self-host Uptime Kuma?"
Placement: primary kw in H1, <title>, meta description, first 100 words, and multiple H2s ("Why self-host Uptime Kuma", "What you're running when you self-host Uptime Kuma"). Volumes directional only.

## Audience / intent
Developers, indie hackers, and small ops teams who want to leave a paid monitor (UptimeRobot/Pingdom) or stand up real monitoring for the first time. They can run a Node app and a database but need the production must-dos spelled out: durable storage, SSL, notifications, and above all where to host the monitor. Intent: how-to with a consideration edge (self-hosted vs hosted monitor).

## Angle / what makes it non-generic (swap test)
The cannot-copy spine is the architectural insight competitors bury: a monitor on the same server or provider region as the apps it watches goes down with them and tells you nothing ("theatre, not monitoring"). Built around that, plus the SQLite-on-ephemeral-disk history-wipe trap, the keyword-monitor "up but broken" catch, and the untested-notification failure. Kloudbean-specific console flow (launch-database -> add-application -> env-vars -> git-deployment -> ssl-certificate, plus server-health for the independent box) and managed-Node + managed-MariaDB framing. Swap test: replace Kloudbean with a rival and the console-flow steps, private-network MariaDB framing, and one-dashboard positioning break.

## Accuracy guardrails (kloudbean-facts)
- Node is a supported managed runtime; frame as "run the Uptime Kuma Node app on managed Node", NOT one-click Uptime Kuma and NOT Docker one-click. Uptime Kuma is not in the one-click app list (n8n, Supabase, OpenWebUI+DeepSeek, Postiz, Penpot).
- MariaDB/MySQL/PostgreSQL are managed engines (one-click, backups, IP allow-listing). Uptime Kuma defaults to a local SQLite file and supports an external MariaDB; recommend managed MariaDB (or a persistent volume) so history survives redeploys. SQLite-on-ephemeral-disk is the trap.
- Env vars in UI, managed CI/CD from GitHub with live build logs, IP allow-listing (VPC on Enterprise), automatic backups, Shorewall + Fail2ban, free SSL, FLB built-in.
- Managed = server/stack/SSL/backups/patching handled; you own code + data. Linux only. Pricing from $8/mo; free migration assistance + free trial approved. No SLA %, no customer/country counts, never "certified". No blurb cliches.

## Verified Uptime Kuma facts used (checked against project docs/repo)
- Single Node.js app (Vue frontend), default port 3001, data in DATA_DIR / kuma.db (SQLite) by default.
- External MariaDB via env vars: UPTIME_KUMA_DB_TYPE=mariadb, UPTIME_KUMA_DB_HOSTNAME, UPTIME_KUMA_DB_PORT (3306), UPTIME_KUMA_DB_NAME, UPTIME_KUMA_DB_USERNAME, UPTIME_KUMA_DB_PASSWORD.
- Monitor types created in the web UI (HTTP(s), HTTP(s) keyword, TCP port, ping, DNS, DB); minimum interval ~20s; 90+ notification channels (Slack, email/SMTP, Telegram, Discord, webhooks). Open source and free.

## Internal-link plan (absolute /blog/<slug>/, verified slugs ONLY — 7 links)
uptime-monitoring, best-self-hosted-tools, deploy-node-app-to-managed-cloud, managed-mariadb-hosting, environment-variables-done-right, server-backups-guide, self-host-supabase.

## Assets
hero.png (top <img>, author supplies) + 6 real console screenshots (launch-database, add-application, env-vars, git-deployment, ssl-certificate, server-health). One bespoke inline SVG: Uptime Kuma on its own independent host, a dashed divider to the app server/website/API it checks (green HTTP/keyword/TCP arrows), purple "alerts when down" arrow to Slack/email/Telegram. Brand navy #000f27, purple #4F1AF3, green #40b75f, in <figure> + <figcaption>. 3 .img-slot placeholders (dashboard payoff, alert-in-Slack, plus the comparison-section slot) with em-dash-free hints; each preceded by an HTML comment using `src -> images/your-file.png` (no quoted src anywhere). .tldr + table.cmp (self-hosted Uptime Kuma vs hosted monitor).

## Voice / byline
Humanized by default: near-zero em-dashes in body prose, contractions, varied rhythm, direct "you", one mild opinion ("a monitor on the same box as your app is theatre, not monitoring"). No banned filler or blurb cliches.
Byline (unique, NOT "Faster Than Ever"): **By Kloudbean Engineering — "Know before your users do".**

Slug: self-host-uptime-kuma. Target length 2300-2800 words. JSON-LD Article + FAQPage (10 Qs), mirrored to the visible FAQ.
