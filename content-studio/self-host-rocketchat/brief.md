# Brief — Self-Host Rocket.Chat (production deploy guide)

Cluster 2 (Self-Hosted Tools). Intent: how-to / consideration for teams leaving per-seat SaaS chat.

## Format
Deploy-guide + "the-requirement-people-miss" centerpiece. Distinct from the tutorial shape used in self-host-supabase and the decision-guide/listicle shapes elsewhere in the cluster. Opener leads with the Slack-bill pain, then pivots to Rocket.Chat as the open-source self-hosted alternative, then makes the MongoDB replica set the spine of the piece (that's the original, cannot-copy value: most generic guides skip why the replica set is mandatory). Lands on running the Rocket.Chat Node app on the managed Node runtime + managed MongoDB.

## Keywords (grounding — volumes are rough industry estimates, hedged, not scraped for this run; re-mine before scaling)
- Primary: **self-host Rocket.Chat** (also "self-hosted Rocket.Chat", "Rocket.Chat hosting"). Mid volume, low-to-mid difficulty, strong commercial intent (leaving Slack/Teams). In H1, title, meta, first 100 words, and the "Why self-host Rocket.Chat" H2.
- Secondary / long-tail: Rocket.Chat MongoDB, Rocket.Chat replica set, Rocket.Chat MONGO_URL, Rocket.Chat ROOT_URL, self-hosted Slack alternative, open source team chat, deploy Rocket.Chat, how much RAM does Rocket.Chat need.
- PAA-style questions mapped into the FAQ: is Rocket.Chat a good Slack alternative, does Rocket.Chat need MongoDB, why does it need a replica set, is it free, how much RAM, how do I deploy it, what is MONGO_URL, ROOT_URL breaking websockets, single-node replica set, migrate from Slack.

## Ground truth used (kloudbean-facts)
- Node.js is a supported managed runtime. Rocket.Chat = Node/Meteor app -> framed as "run the Rocket.Chat Node app on the managed Node runtime", NOT one-click Rocket.Chat, NOT Docker one-click. It is NOT in the one-click app list.
- MongoDB is a managed engine (one-click provision, backups, private networking, controlled access). Rocket.Chat REQUIRES MongoDB, and requires it as a REPLICA SET (change streams / oplog). Replica set framed as a MongoDB concept the reader arranges at the DB layer, NOT a one-click Kloudbean toggle.
- Env vars in UI (Runtime Configuration -> Environment Variables); managed CI/CD from GitHub; private networking/VPC; automatic backups; Shorewall + Fail2ban; free SSL.
- Managed = server/stack/SSL/backups/patching handled, you own code + data. Linux only. Pricing from $8/mo. Owner-approved: free migration assistance + free trial. No SLA %, no customer/country counts, never "certified".

## Rocket.Chat technical truth (external, kept accurate)
- Realtime relies on MongoDB change streams (modern) or oplog tailing (older), both requiring a replica set. Single-node replica set is valid.
- Key env: MONGO_URL (must include ?replicaSet=rs0), optional MONGO_OPLOG_URL (points at `local` db), ROOT_URL (public https URL, drives links + websockets), PORT (3000). Entry point main.js in the built server bundle.
- Reverse proxy must forward websocket upgrade headers or realtime silently breaks.
- Meteor app -> memory-hungry; 2 GB floor for small team, 4 GB+ with real traffic. Community Edition free/open source; Enterprise add-ons optional.

## Assets
Screenshots: launch-database.png (managed MongoDB), add-application.png (Node app), env-vars.png (MONGO_URL + ROOT_URL), ssl-certificate.png (SSL for chat domain). One bespoke inline SVG: clients -> Rocket.Chat Node app (HTTPS/WSS via proxy) -> managed MongoDB replica set (oplog + change streams) over private network. 2 .img-slot placeholders (rs.status() shell, devtools wss connection). Hero: images/hero.png (author supplies).

## Internal links (verified slugs only)
managed-mongodb-hosting, connect-mongoose-to-mongodb, deploy-node-app-to-managed-cloud, environment-variables-done-right, server-backups-guide, best-self-hosted-tools, self-host-supabase.

## Byline
"By Kloudbean Engineering" · tagline "Own your team chat" (unique, not "Faster Than Ever").

## Target length
2400–2900 words.

## Voice
Humanized by default: near-zero em-dashes in prose, contractions, varied sentence length, direct "you", one mild opinion ("skip the standalone MongoDB, Rocket.Chat wants a replica set and will tell you so"). No blurb cliches.

Slug: self-host-rocketchat.
