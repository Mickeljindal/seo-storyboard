# Brief — Secrets Management (Store Secrets & Manage API Keys Securely)

Silo: Application security. Byline: "By Kloudbean · Keep Your Secrets Secret." (unique; NOT "Faster Than Ever").
Slug: secrets-management. Images: hero.png (rendered later) + ../assets/console/env-vars.png + ../assets/console/subusers-uac.png.

## Keywords (grounding)

Keyword volumes were NOT pulled from SEMrush/DataForSEO for this piece (no /tmp/mined_topics.json entry for
this topic at write time). Volumes below are hedged intent-tiers only, VERIFY on the pricing/keyword tool before
publish. Do not cite these as hard numbers in copy.

- Primary: **secrets management** (high intent, competitive; broad head term). Also targeted as head phrases:
  **how to store secrets**, **manage API keys securely**.
  Placement done: H1, `<title>`, meta description, first 100 words (lead), and an H2 ("What is secrets management?").
- Secondary / long-tail (woven through body + FAQ):
  - API keys security / how to store API keys
  - don't commit .env / .gitignore .env
  - environment variables secrets / inject secrets at deploy time
  - rotate secrets / secret rotation / how often to rotate secrets
  - leaked API key / what to do if I leaked a key / secret in Git history
  - database password security / connection string in env
  - least privilege keys / scoped API tokens
  - secrets manager vs environment variables / do I need Vault

## PAA-style questions (mirrored into on-page FAQ + FAQPage JSON-LD)

1. What is secrets management?
2. What counts as a secret versus config?
3. Where should I store API keys?
4. Can I commit .env if my repo is private?
5. What should I do if I leaked an API key?
6. How often should I rotate secrets?
7. What does least privilege mean for API keys?
8. Do I need a secrets manager like Vault?
9. How does Kloudbean handle secrets?
10. How do I manage API keys securely across dev, staging, and production?

## Angle / shape (non-templated)

Principles + field-guide, NOT the sibling's "two kinds / steps" template. Define secret vs config (one-question
test), then cardinal rules each with the WHY, then the original-value leaked-key playbook (rotate FIRST; force-push
is not enough), then where-secrets-live tradeoff table, then least privilege / scoped tokens, then a precise,
non-over-claimed Kloudbean tie-in, then a short "habit that ties it together" close (no restate-summary).

## Internal links (6 used; all folders confirmed to exist via `ls -d`)

- environment-variables-done-right (sibling, the config/secret split)
- ci-cd-auto-deploy-from-github (build-time secrets in the pipeline)
- security-headers-guide (HttpOnly / XSS-CSRF reasoning)
- add-managed-database-to-your-app (DB password / reset after a committed .env)
- secure-compliant-hosting (shared-responsibility line)
- what-is-a-managed-server (managed context)
NOT linked (folders absent at write time): ssl-tls-explained, server-hardening-checklist.

## Original SVG

Bespoke inline SVG: "A secret's journey: kept safe vs leaked." Safe lane (green #40b75f): .env gitignored ->
runtime config in dashboard -> injected at runtime (process.env) -> never in Git / rotate anytime. Leak lane
(red #d64545): hard-coded or committed .env -> pushed to Git (forever) -> scraped by bots in minutes -> key
burned / rotate now. Brand navy #000f27 + purple #4F1AF3 arrows. Distinct from the sibling's "two kinds" split.

## Honesty guardrails (grounded in kloudbean-facts.md)

- DO NOT invent a Kloudbean "secrets manager / vault" product. It has none. Frame secrets as environment
  variables + runtime config set in the dashboard, injected at runtime, kept out of the repo.
- Grounded Kloudbean facts used: env vars / Node+Python runtime config in the UI; scoped personal API tokens
  (Platform API read-only v1); HttpOnly cookie sessions (XSS/CSRF); Basic Auth gate + IP Access Control (CIDR);
  subusers + UAC (granular per-resource/per-action); social login (Google/GitHub/LinkedIn); Shorewall + Fail2ban
  baseline; free auto-renewing SSL; managed databases with controlled access; shared-responsibility compliance.
- Vault / cloud secret managers named only as a general category, NOT as something Kloudbean ships.
- No invented metrics. "Bots find keys within minutes" and "crypto-mining before coffee" are stated as
  general, well-known industry patterns, not as Kloudbean customer stats. No fabricated customers/tickets.
- [CONFIRM] items omitted from copy: customer-count figures, SLA %, exact Cloudflare add-on pricing, Go runtime.
- Linux stacks only; "managed" = server/stack/SSL/backups/patching handled, you own app code + data.

## Voice / gate

Humanized default: 0 em-dashes in prose, contractions, bursty rhythm, mild founder opinions ("most apps don't
need Vault", "a private repo is not a vault", "rotating in a panic is not a strategy"), anti-pattern beats,
teach-first. No blurb cliches. Target 2300-2700 words. Validate: `python3 /tmp/validate_article.py
secrets-management` ([OK] except the expected images/hero.png miss).
