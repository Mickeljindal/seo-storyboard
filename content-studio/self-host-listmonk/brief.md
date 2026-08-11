# Brief: self-host-listmonk

## Role in the cluster
Silo 7 (Self-hosted tools). Pillar: best-self-hosted-tools. Neighbours: self-host-ghost (distinct
intent, link it), self-host-postiz, self-host-nextcloud. Money page: add-managed-database-to-your-app.

## Keyword grounding (honest)
Topical-authority + real-interest spoke. Real intent: self host listmonk, listmonk self hosted,
listmonk docker, open source mailchimp alternative, self hosted newsletter / mailing list manager.
No fabricated volume.

Primary: **self-host Listmonk**. Secondary: self-hosted newsletter manager, open-source Mailchimp
alternative, self-hosted mailing list manager, listmonk SMTP / SES.

## Cannibalisation (mandatory)
Live self-host-ghost = PUBLISHING platform (site + membership + newsletter bundled). Listmonk =
standalone mailing-list + campaign manager, NO CMS, bring-your-own-SMTP. Different intent. Own the
"I have a big list and want to send campaigns cheaply at scale" query; link Ghost for "I want a
site with a newsletter". Include a Ghost-vs-Listmonk table to make the split explicit.

## Verified facts (ProductHunt + Buttondown + general)
- Listmonk: self-hosted newsletter and mailing list manager. High-performance, feature-packed, open
  source, written in Go (Golang), released as a SINGLE BINARY, backed by PostgreSQL.
- PostgreSQL is effectively the only dependency (no Redis). Very light and fast, handles large lists.
- It sends email campaigns / newsletters and manages lists, subscribers, templates, from its own
  self-hosted dashboard. Has an API.
- CRUCIAL: listmonk does NOT deliver mail itself. It connects to an SMTP server or Amazon SES to do
  the actual sending. So it manages the list and builds the campaign; the sending path is separate.
- License: open source (AGPL-3.0).
- NOT a one-click Kloudbean app (only n8n/Supabase/OpenWebUI/Penpot/Postiz are). Frame as server-based.

## Information gain (the honest angle)
1. THE headline gain (popular-assumption-cannot-work): people think "self-host listmonk = free email".
   Wrong. Listmonk manages the list; it hands mail to SMTP/SES. Deliverability (SPF/DKIM/DMARC, IP
   reputation, warmup, bounce/complaint handling) is still the hard part and listmonk does not solve
   it. Trying to blast from a fresh VPS's own mail server = straight to spam. Name this loudly.
2. Positive differentiator: it is refreshingly simple to run. Go single binary + Postgres, no Redis,
   no cluster. Genuinely light and fast even at large list sizes. Contrast with the heavier tools.
3. Cost angle: hosted ESPs (Mailchimp etc.) bill per subscriber, which is brutal at scale; listmonk +
   SES = pay per email sent (cheap), so big lists save a lot. Real money angle.
4. Concede-the-limit: small list on a free ESP tier, or you want a website+newsletter combined (that
   is Ghost), do not self-host listmonk. It shines for large lists + high-volume sending + ownership.

## Claims (facts files only)
Managed server; managed PostgreSQL (its only dependency, and gets backed up); free auto-renewing SSL;
automatic backups; S3-compatible object storage (campaign media); managed reverse proxy; 7 clouds;
one dashboard. NOT one-click. Honest boundary: platform runs server + Postgres + SSL + backups; the
SENDING path (SES/SMTP relay), deliverability reputation, and list consent/compliance are yours.

## Format
Match live self-host shape. What it is, the "it doesn't send mail" truth, why self-host + who
shouldn't, Ghost-vs-Listmonk table, what it takes to run (Go binary + Postgres, light), deliverability
done right, backups + list-consent responsibility, where hosting fits, related reading, FAQ.
