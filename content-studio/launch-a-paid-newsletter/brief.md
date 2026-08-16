# Brief: launch-a-paid-newsletter

## Angle (decision guide + ownership economics)
The reader is a writer or operator about to launch a paid newsletter, stuck at the fork between an
all-in-one platform (Substack, Ghost Pro, beehiiv) and running it themselves. Most pages on this
query are written by a platform that wants the signup, so the information gain is the neutral
version: the cost SHAPE (a percentage of subscription revenue versus a flat infrastructure bill),
list ownership as the actual asset, and the deliverability reality that quietly kills self-hosting
plans. Fair to the platforms on purpose: they remove the hardest operational work.

## Target keyword
- **Primary:** launch a paid newsletter
- **Secondary:** paid newsletter platform, self-hosted newsletter, Substack alternative,
  newsletter subscription business, paywall newsletter content.

Primary keyword placed in H1, `<title>`, meta description, first 100 words, and an H2. No volumes
asserted (none supplied for this topic); intent-grounded decision query. No invented numbers, no
platform fee percentages, no revenue or subscriber figures anywhere.

## Intent
Commercial investigation shading into informational. The payoff is a decision, not a signup.

## Information gain (one sentence)
It names the three responsibilities you are really choosing between (list, payments, sending),
prices the platform-versus-self-hosted question as a cost shape rather than a number, and makes
deliverability (SPF, DKIM, DMARC, sending reputation, blocked port 25) the centre of the decision
instead of a footnote.

## Opinion + anti-pattern (required beats)
- Opinion: start on a platform, move only when the economics or a real control requirement justify
  it. Your list matters more than your platform.
- Anti-pattern: running your own SMTP server on a cloud VM to avoid per-email costs, then landing
  in spam with zero sending reputation, since outbound port 25 is commonly blocked.
- Volunteered gap: deliverability and sending reputation remain the customer's responsibility
  wherever the app runs. A managed server cannot make an inbox provider trust your domain.

## Product mention (once, at the point of need)
Kloudbean appears in a single sentence in "What you actually run if you self-host," immediately
after the reader's own requirement (a persistent app plus a database holding the subscriber list
you cannot afford to lose). Grounded claims used: one-click Listmonk and Ghost on a managed server,
free SSL, always-on process, cron jobs from the dashboard without SSH, managed PostgreSQL/MySQL
with automatic backups, $8/mo entry pricing in the CTA. Nothing else. No adjective stacking.

## Cannibalisation check
- `self-host-listmonk` owns the how-to for one tool (its H2s: what Listmonk is, it does not send
  email, why self-host, Listmonk or Ghost, what it takes to run, deliverability, backups). This page
  is the business/decision layer above it and LINKS to it twice instead of repeating the install.
- `self-host-ghost` owns the Ghost install. Linked, not duplicated.
- `port-25-blocked-smtp-ports` owns the port/SMTP mechanics. Referenced and linked; the mechanics
  are summarised in one paragraph, not re-explained.
- `cost-of-running-a-side-project` owns generic side-project cost. This one is newsletter-specific
  revenue-share economics.

## Internal links used (6, all verified to exist)
self-host-listmonk, self-host-ghost, port-25-blocked-smtp-ports, managed-postgresql-hosting,
server-backups-guide, best-self-hosted-tools, cost-of-running-a-side-project.
(CTA links kloudbean.com and /pricing/.)

## Format
Decision guide, ~2000 words. `.tldr` answer-first (40-60 words), 10 H2s, one `table.cmp` mapping
each option to when it wins, one H3 anti-pattern beat, 3 `.img-slot` spacers, related-reading list,
light CTA at the very end, 9-question FAQ mirrored exactly into FAQPage JSON-LD, plus the clean
Organization entity block. Near-zero em-dashes. No banned claim classes.
Byline: "Your list is the business. The platform is plumbing."
