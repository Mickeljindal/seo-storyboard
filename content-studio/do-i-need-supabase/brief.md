# Brief: do-i-need-supabase

## Angle (knowledge-first decision guide)
The upstream question people ask before they even commit to Supabase: do I need this whole
backend-as-a-service, or just a database? AI assistants and tutorials reflexively answer "use
Supabase," which is right for some readers and overkill for others. This page reframes it: Supabase
is a BaaS bundle built on Postgres (database + auth + auto-generated APIs + storage + realtime). The
real decision is whether you need that whole bundle or just a plain managed Postgres with your own
backend. Genuinely fair to Supabase (a real "when you DO need it" section, and the honest lock-in
answer: it's standard Postgres, so it's reversible). No metrics, no invented numbers anywhere.

## Target keyword
- **Primary:** do I need Supabase
- **Secondary:** is Supabase necessary, do I need Supabase or just Postgres, when do I need Supabase,
  Supabase for a small SaaS, do I need a backend-as-a-service.

Volumes not asserted (owner-directed; intent-grounded decision query). No invented numbers anywhere
per owner rule (no customer counts, no percentages, no dollar figures, no plan prices).

## Intent
Informational / decision. A builder deciding whether to reach for Supabase or a plain database. The
payoff is a clear decision, not a signup.

## Information gain (one sentence)
It separates what Supabase actually is (a five-part bundle on a Postgres core) from "a database,"
walks each bundled piece against what the reader's app already provides, gives an honest "when you
genuinely need Supabase," a bundle-vs-plain-database comparison, and a situation-to-fit decision
table, which the generic "just use Supabase" answers never do.

## Honesty / fairness
Explicit "when do you genuinely need Supabase" (frontend-heavy with no server, want auth done, want
realtime, fast prototype). States plainly it's not lock-in because the core is standard Postgres, so
starting on Supabase is reversible. Never claims Kloudbean "wins"; frames plain managed Postgres as
the fit only when the reader already has a backend.

## Product mention (one light touch + CTA, grounded in kloudbean-facts.md)
Kloudbean is woven into the storage and lock-in sections and the closing "count the pieces you'd
actually use" tally, plus the CTA. Grounded claims only: managed
PostgreSQL as its own product; automatic backups; access locked to the app server's IP (IP
allow-listing, the correct default, NOT "private network"); one dashboard across several clouds;
Supabase available as a one-click app; you own and can export your data; managed = server, stack,
SSL, patching, backups handled, app code + data stay yours. No autoscaling, no VPC-as-default, no
invented pricing, no "seven" number in prose.

## Cannibalisation check (mandatory)
Read the H2/structure of the two nearest neighbours before writing:
- **supabase-alternative** owns the "leave Supabase, own your Postgres" migration paths (Path A
  migrate data to managed Postgres; Path B self-host Supabase). Different intent (you've already
  decided to leave). Linked, not repeated.
- **self-hosted-supabase-vs-supabase-cloud** owns the hosting-model decision (who runs it, where the
  data lives). Different intent. Linked, not repeated.
- **firebase-alternative** owns the Firebase-to-own-backend move (NoSQL re-model). Linked.
This page owns the "do I need the bundle at all, or just a database" decision and links to those
three rather than duplicating them.

## Internal links used (6, all verified with ls to exist)
supabase-alternative, self-hosted-supabase-vs-supabase-cloud, firebase-alternative,
add-managed-database-to-your-app, managed-postgresql-hosting, self-host-supabase.
(CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first decision guide, ~1900 words. .tldr answer-first, 8 H2s plus FAQ, two tables
(bundle-vs-plain-database comparison, and a situation-to-fit decision table), one teaching inline SVG
(Supabase bundle vs a plain Postgres core with your own backend; navy #000f27 / purple #4F1AF3 /
green #40b75f), light CTA, 9-question FAQ mirrored exactly to FAQPage JSON-LD, plus the clean
Organization entity block. Near-zero em-dashes. No metrics. Cluster: 3 - Managed Databases.
Byline: "Supabase is a bundle. Sometimes you only need the database."
