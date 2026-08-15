# Brief: self-hosted-supabase-vs-supabase-cloud

## Angle (knowledge-first comparison / decision guide, commercial intent)
Supabase is an open-source backend (Postgres, auth, storage, realtime, edge functions). There are
two ways to run it: Supabase Cloud (their fully managed hosted service) or self-hosting the
open-source stack yourself. This page compares the two hosting models fairly and honestly, so the
reader can pick the one that fits. It is explicitly NOT always-win: Supabase Cloud genuinely wins on
speed to start, zero ops, and getting the newest features first. Self-hosting wins on control, data
residency/compliance, avoiding per-project pricing climbing at steady scale, and keeping data on
your own infrastructure. The page is upfront about the real cost of self-hosting (you run Postgres,
upgrades, backups, and the several Supabase services yourself, unless a managed platform handles the
server layer).

## Target keyword
- **Primary:** self-hosted Supabase vs Supabase Cloud
- **Secondary:** should I self-host Supabase, Supabase Cloud vs self-hosted, is self-hosting Supabase
  worth it, Supabase self-hosting, managed vs self-hosted Supabase.

Volumes not asserted (owner rule: no invented numbers). Intent-grounded commercial-comparison query.
No prices, no free-tier limits by number, no percentages anywhere in the article.

## Intent
Commercial investigation / decision. A builder deciding between staying on Supabase Cloud and
self-hosting the stack. Payoff is a clear, honest decision, not a signup.

## Information gain (one sentence)
It reframes the choice as "same open-source software, the real question is who operates it and where
your data lives," then gives an explicit "Choose Supabase Cloud if..." and "Consider self-hosting
if..." with the real cost of self-hosting stated out loud, which the generic "self-host everything"
or "just use the cloud" takes never do.

## Honesty / fairness
Fair to Supabase Cloud: a dedicated "What Supabase Cloud does better" section (quickest start, zero
ops, newest features first) and a genuine "Choose Supabase Cloud if..." list. Never claims Kloudbean
beats Supabase Cloud; Kloudbean is positioned only as one place to run Supabase if the reader has
already chosen the self-host path.

## Product mention (one light touch + CTA, grounded ONLY in kloudbean-facts.md)
Supabase is a one-click app on a managed server; the OS, free SSL, patching, and server backups are
handled; managed PostgreSQL is available as its own product; you own your app and data; seven clouds.
No metrics, no prices, no private-networking-as-default, no autoscaling-for-all. Kloudbean appears
once (the "If you self-host, where does it run?" section) plus the CTA.

## Cannibalisation check (mandatory)
- self-host-supabase = the HOW-TO (stand the stack up, the keys that matter, migrate a project).
  This page links to it for the mechanics instead of repeating them.
- supabase-alternative = the OWN-YOUR-POSTGRES page (two paths to replace Supabase with your own
  managed Postgres). This page links to it instead of repeating the migration paths.
- This page owns a distinct intent: the Cloud-vs-self-host DECISION (which model, and why), fair to
  both, with explicit choose-if lists. Different question from both neighbours.

## Internal links used (6, all verified to exist via ls of content-studio)
self-host-supabase, supabase-alternative, managed-postgresql-hosting, managed-database-vs-self-managed,
pgvector-for-ai-apps, add-managed-database-to-your-app.
(CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first comparison/decision guide, ~1900 words. .tldr answer-first; 8 question-style H2s plus
FAQ; one required table.cmp (Cloud vs self-hosted); one teaching inline SVG (who operates what, navy
#000f27 / purple #4F1AF3 / green #40b75f); light CTA; 9-question FAQ mirrored to FAQPage JSON-LD;
clean Organization entity block. Near-zero em-dashes. No metrics or invented numbers.
Cluster: 4 - Comparisons. Byline: "Same backend, two very different jobs."
