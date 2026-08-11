# Brief: self-host-penpot

## Role in the cluster
Silo 7 (Self-hosted tools). Pillar: best-self-hosted-tools. Siblings: self-host-nextcloud,
self-host-vaultwarden, self-host-supabase. Money page: add-managed-database-to-your-app.

## Keyword grounding (honest)
Topical-authority + real-interest spoke. Real intent: self host penpot, penpot self hosted, penpot
docker, open source figma alternative, self hosted design tool. No fabricated volume.

Primary: **self-host Penpot**. Secondary: open-source Figma alternative, self-hosted design tool,
Penpot Docker, own your design files.

## Cannibalisation
No live design-tool article. Category uncovered. Distinct from every live self-host-* tool.

## Verified facts (penpot.app + GitHub tokens-studio/penpot + docs)
- Penpot: the first open-source design and prototyping platform for cross-domain teams (designers
  AND developers). Web-based, OS-independent, works in any browser.
- Built on open web standards: SVG and CSS. Design-to-code is a first-class feature (CSS Grid, Flex
  layout, ready-to-use code), aimed at removing dev handoff friction.
- Self-hostable. Upstream method is Docker / Docker Compose; the docs note it needs Docker, DNS, and
  proxy config knowledge. It runs several services (frontend, backend, exporter) with PostgreSQL and
  Redis behind them, so it is NOT a few-hundred-MB tool.
- License: open source (MPL-2.0).
- Positioned as a Figma alternative: no per-seat/per-editor licensing when self-hosted, full data
  sovereignty over design files.

## Grounded Kloudbean fact (the real differentiator)
Penpot is a ONE-CLICK app on Kloudbean (kloudbean-facts.md: smart apps one-click; changelog Feb
2025). So unlike server-based tools (GitLab, Nextcloud), you skip the Docker Compose file. State this
as the product advantage, honestly.

## Information gain (the honest angle)
1. The design-to-code differentiator: Penpot is built on SVG/CSS and outputs real code, so it is not
   just "open-source Figma", it is the design tool that a developer or an agency can actually own end
   to end. That is the reusable, competitor-can't-copy angle.
2. Honest weight: concede that Penpot is heavier than the light tools (several services + Postgres +
   Redis). Name the real RAM reality instead of pretending it is tiny.
3. The invisible gotcha: SMTP. Self-hosted Penpot needs email configured for registration
   confirmation and team invites, and people miss it and think the install is broken. Name it.
4. Concede-the-limit: a solo designer is fine on hosted Penpot's free tier; self-hosting earns its
   place for teams/agencies with per-seat pain or a data-residency reason.

Angles: the-failure-is-invisible (SMTP not set = invites silently fail), concede-the-main-point
(solo? use hosted), name-the-tradeoff (control + no seats vs more to run).

## Claims (facts files only)
Penpot one-click app; managed PostgreSQL; managed Redis; free auto-renewing SSL; automatic backups;
S3-compatible object storage for assets; managed reverse proxy; 7 clouds; one dashboard. Honest
boundary: platform runs the server, DB, SSL, backups; your design files, fonts, and the SMTP account
are yours.

## Format
Match live self-host article shape. What it is, why self-host + who shouldn't, the design-to-code
differentiator, honest weight, setup shape (one-click vs compose, SMTP gotcha, HTTPS), backups, where
hosting fits, related reading, FAQ.
