# Brief: self-host-mattermost

## Role in the cluster
Silo 7 (Self-hosted tools). Pillar: best-self-hosted-tools. Cousin: self-host-rocketchat (Slack
alt, DISTINCT positioning, cross-link). Money page: add-managed-database-to-your-app.

## Keyword grounding (honest)
Branded per-tool spoke. Real intent: self host mattermost, mattermost self hosted, mattermost vs
rocket.chat, self hosted slack alternative, mattermost postgresql, air-gapped team chat. No fabricated
volume.

Primary: **self-host Mattermost**. Secondary: Mattermost vs Rocket.Chat, self-hosted Slack
alternative, air-gapped team chat, data-sovereign messaging.

## Cannibalisation (mandatory)
Live self-host-rocketchat = Slack alternative, broad/omnichannel positioning. Mattermost = internal
team chat built for security-conscious/DevOps/air-gapped/regulated teams. Different positioning ->
different reader decision -> distinct branded query. Cross-link Rocket.Chat for the "vs"; do not
re-teach generic "what is a self-hosted Slack alternative".

## Verified facts (mattermost.com, meetrix/canadianwebhosting/rocket.chat comparisons, wz-it)
- Mattermost: open-source, self-hosted team chat (Slack alternative). Written in Go, backed by
  PostgreSQL (production guidance separates the Postgres DB from the app). ~2GB RAM minimum.
- Positioning: internal team collaboration with channels/threads/search; strong DevOps/ChatOps
  angle; self-sovereign infrastructure, deployable ANYWHERE including AIR-GAPPED environments; audit
  logging; favoured in regulated/security-conscious settings.
- Rocket.Chat (cousin, contrast): broader/omnichannel (WhatsApp, SMS, live-chat CUSTOMER
  conversations in the same tool), MIT license, more extensibility around conversations, ~1GB min.

## Information gain (the honest angle)
1. The decision cue: choose Mattermost when internal team chat + data control + compliance/air-gapped
   is the whole requirement and you want a lighter, focused stack; choose Rocket.Chat when you also
   need customer-facing omnichannel (WhatsApp/SMS/livechat). This replaces "which self-hosted Slack".
2. The air-gapped / data-sovereignty angle: Mattermost is the tool when internal conversations cannot
   leave infrastructure you control (regulated, government, security-conscious). Genuinely tool-
   specific and aligns with an enterprise/government audience.
3. What it takes: Go app + separate Postgres, ~2GB, so managed Postgres is the natural backend.

## Claims (facts files + enterprise-compliance CAPABILITY statements only, NO client, NO certs)
Managed server; managed PostgreSQL (backed up); free auto-renewing SSL; automatic backups; managed
reverse proxy; IP allow-listing (VPC on Enterprise) available (capability statement, grounded); 7 clouds incl.
regions for data residency (GCP Dammam is a public fact but keep generic - do NOT tie to a sector/
client); one dashboard. NOT one-click. Honest boundary: platform runs server + DB + SSL + backups +
network isolation; the Mattermost app, your conversations, and org-level compliance are yours.
DO NOT claim any certification, SLA %, or name any client/sector/region-workload combo.

## Format
Match live self-host shape. What it is, Mattermost-vs-Rocket.Chat (the decision, table), why self-host
team chat + who shouldn't, what it takes to run, backups + access control, where hosting fits (light
enterprise/data-residency nod, capability only), related reading, FAQ. Server-based (not one-click).
