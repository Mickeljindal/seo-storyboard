# Brief: self-host-vaultwarden

## Role in the cluster
Silo 7 (Self-hosted tools). Pillar: best-self-hosted-tools. Siblings: self-host-nextcloud, other
self-host-* guides. Money page: add-managed-database-to-your-app.

## Keyword grounding (honest)
Topical-authority + real-interest spoke. Real intent: self host vaultwarden, self hosted password
manager, vaultwarden setup, bitwarden self hosted, self host bitwarden. No fabricated volume.

Primary: **self-host Vaultwarden**. Secondary: self-hosted password manager, self host Bitwarden,
Vaultwarden setup, own your password vault.

## Cannibalisation
No live password-manager article. Category uncovered. Distinct from every live self-host-* tool.

## Verified facts (GitHub dani-garcia/vaultwarden + wiki)
- Vaultwarden: unofficial Bitwarden-COMPATIBLE server, written in Rust, formerly bitwarden_rs.
  Works with the official Bitwarden client apps.
- Lightweight: official Bitwarden self-host stack is heavy (built around MS SQL Server + several
  services); Vaultwarden collapses it into a single lightweight service. SQLite by DEFAULT, with
  MySQL and PostgreSQL supported (Diesel storage layer) for bigger deployments.
- Config surface: admin page gated by an admin token (can be disabled), option to disable new-user
  registration and invitations, WebSocket notifications, HTTPS strongly required.
- Trust model (Bitwarden): zero-knowledge / end-to-end encrypted vault. The server stores an
  ENCRYPTED blob; the master password is never sent to the server and decryption happens in the
  client. So self-hosting the vault does not mean the server can read your passwords.

## Information gain (the honest angle)
This is the highest-trust thing you can self-host: the one service that holds the keys to everything
else. So the article leads with the two truths that follow:
1. It is LESS scary than it sounds, because of the zero-knowledge model: the server only ever holds an
   encrypted blob, so a server compromise does not hand over readable passwords (assuming a strong
   master password).
2. It is MORE demanding than other self-hosted tools on exactly one axis: availability + backups. If
   you lose the server AND its backups, you lose every password with no recovery, because nobody else
   has a copy. So backup discipline here is not best-practice, it is existential.
Plus: HTTPS is non-negotiable (you are transmitting an encrypted vault, but still), lock down the admin
page, and an honest "when NOT to self-host this" (if you cannot commit to backups + uptime, hosted
Bitwarden is the right call — concede it).

Angles: concede-the-limit (don't self-host if you can't back up), the-failure-is-invisible (lost
backups = silent total loss), name-the-tradeoff (control vs responsibility for the keys).

## Claims (facts files only)
Managed server, free auto-renewing SSL (directly serves the HTTPS-mandatory point), automatic backups
(the existential safety net this tool specifically needs), managed PostgreSQL/MariaDB (the DB option),
managed reverse proxy, 7 clouds, one dashboard. Honest boundary: platform runs the server + SSL +
backups; the master password, the client apps, and the decision to self-host the keys are yours.

## Format
Match live self-host article shape. What it is, why self-host it + honest caveat, the zero-knowledge
trust model, the setup shape (DB choice, HTTPS, admin token, reverse proxy), the three security musts,
backups-are-existential, when NOT to, where hosting fits, related reading, FAQ.
