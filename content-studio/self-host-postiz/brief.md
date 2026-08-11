# Brief: self-host-postiz

## Role in the cluster
Silo 7 (Self-hosted tools). Pillar: best-self-hosted-tools. Siblings: self-host-penpot,
self-host-supabase, self-host-n8n. Money page: add-managed-database-to-your-app.
Cross-silo: hosting-for-agencies-playbook (agencies managing many client social accounts).

## Keyword grounding (honest)
Topical-authority + real-interest spoke. Real intent: self host postiz, postiz self hosted, postiz
docker, open source buffer alternative, self hosted social media scheduler. No fabricated volume.

Primary: **self-host Postiz**. Secondary: open-source Buffer alternative, self-hosted social media
scheduler, Postiz Docker, own your posting schedule.

## Cannibalisation
No live social-scheduling article. Category uncovered. Distinct from every live self-host-* tool.

## Verified facts (Railway deploy page, ProductHunt, ENISA EUVD)
- Postiz: open-source social media scheduling tool, a self-hosted Buffer / Hootsuite alternative.
- One calendar for ~20 platforms (X, LinkedIn, Instagram, Threads, TikTok, YouTube, Bluesky,
  Mastodon, Reddit, Discord, Slack, Telegram, and more).
- Features: AI copilot for drafting, media library, analytics, team workspace, public API.
- Tech: PostgreSQL + Redis behind it; Docker deployment upstream. Open source (AGPL-3.0).
- SECURITY (checkable): an advisory catalogued as EUVD-2026-54488 in the EU Vulnerability Database
  described a path-traversal issue in the route that serves locally stored media, which normalised
  no path and required no authentication. Use responsibly as a concrete lesson about patching an
  internet-facing self-hosted app, NOT as FUD; such issues get fixed, the lesson is "keep it current".

## Grounded Kloudbean fact
Postiz is a ONE-CLICK app on Kloudbean (kloudbean-facts.md smart-apps list; changelog Feb 2025).
Same as Penpot. State honestly as the product advantage (skip the Docker Compose route).

## Information gain (the honest angle)
1. The real catch nobody mentions: self-hosting a social scheduler means YOU register a developer
   app and provide OAuth API credentials for each platform (X, LinkedIn, etc.). Hosted Buffer hides
   this behind its own pre-approved API access. That per-platform credential setup, not the install,
   is the actual work. Name it up front. (the-real-work-is-elsewhere angle)
2. It holds OAuth tokens to your entire social presence, so it is security-sensitive and must be kept
   patched and access-controlled. The 2026 EUVD advisory is the concrete, checkable reminder.
3. Cost angle: Buffer/Hootsuite bill per channel or per seat, which stings for creators with many
   accounts and agencies running social for many clients. Flat-cost self-hosting flips that.
4. Concede-the-limit: one or two personal accounts, posting occasionally? Hosted free tiers are fine.
   Self-hosting earns its place at many accounts, a team, or a data/cost reason.

## Claims (facts files only)
Postiz one-click app; managed PostgreSQL; managed Redis; free auto-renewing SSL; automatic backups;
S3-compatible object storage (media library); managed reverse proxy; 7 clouds; one dashboard. Honest
boundary: platform runs server, DB, SSL, backups; your social API credentials, your content, and
keeping the app updated stay yours.

## Format
Match live self-host article shape. What it is, why self-host + who shouldn't, the OAuth/API catch,
security (patching, the advisory), what it needs to run (one-click vs Docker), backups, where hosting
fits, related reading, FAQ.
