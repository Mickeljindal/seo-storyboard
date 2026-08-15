# Brief: do-i-need-microservices-for-my-saas

## Angle (knowledge-first decision guide)
The honest answer to a question the whole industry answers with fashion instead of judgement. Ask
a conference talk or an architecture thread "should my SaaS use microservices" and the vibe is that
services are the mature choice. This page counters that for the reader it hurts most: a solo founder
or small team. Position: a new SaaS should start as a well-structured (modular) monolith. Microservices
solve an organisational problem (many teams shipping and scaling independently) that a small team does
not have, and they hand you a distributed system in return. Fair to microservices (an explicit "when you
genuinely do need microservices" section with two real signals). No metrics, no invented numbers.

## Target keyword
- **Primary:** do I need microservices for my SaaS
- **Secondary:** microservices vs monolith for startups, is a monolith fine, when do you need
  microservices, microservices for a small SaaS, monolith first.

Volumes not asserted (owner-directed; intent-grounded decision query). No invented numbers anywhere
per owner rule (no percentages, no dollar figures, no benchmarks).

## Intent
Informational / decision. A founder or small team deciding whether to start on microservices or a
monolith. Payoff is a clear, defensible decision, not a signup.

## Information gain (one sentence)
It separates what microservices actually solve (independent teams and independent scaling of a
component with a different profile) from the fashion, lists the concrete costs of a distributed
system when you are small, defines the modular monolith, gives honest "split later" signals, and a
three-question decision framework by team size and scaling shape, which the generic "just use
microservices" takes never do.

## Honesty / fairness
Explicit "when you genuinely do need microservices" (multiple teams stepping on each other; one
component with a wildly different scaling or resource profile). States that starting as a monolith is
reversible and is in fact the easiest base to peel services off later. Never claims Kloudbean "wins";
frames the product as the shape that fits both the simple start and the later split.

## Product mention (one light touch + CTA, grounded in kloudbean-facts.md)
A single managed server can host app + API + managed database together; automatic backups; free SSL;
simple Git deploys; add another server when a component genuinely needs its own. No autoscaling-for-all,
no private-networking-as-default, no invented pricing. Kloudbean appears once near the end plus the CTA.

## Cannibalisation check
No "do-i-need-microservices" article exists. host-app-api-and-database-on-one-server owns the
single-server how-to, ai-app-reference-architecture owns the production-app reference architecture,
host-multiple-apps-one-server owns running several apps on one box, when-to-use-redis-vs-postgres owns
the datastore-choice decision. This owns the specific "monolith vs microservices for a new SaaS"
decision and links to those rather than repeating them. Sibling to do-i-need-aws-to-launch-a-saas
(different question: which cloud/complexity vs which architecture).

## Internal links used (4, all verified to exist via ls)
host-app-api-and-database-on-one-server, ai-app-reference-architecture, host-multiple-apps-one-server,
when-to-use-redis-vs-postgres. (CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first decision guide, ~2000 words. .tldr answer-first, 8 content H2s plus FAQ, one comparison
table (modular monolith vs microservices), one teaching SVG (microservices distributed system vs one
deployable monolith, brand colours navy #000f27 / purple #4F1AF3 / green #40b75f), light CTA, 9-question
FAQ mirrored to FAQPage JSON-LD, plus the clean Organization entity block. Near-zero em-dashes. No metrics.
Cluster: 8 - Infra Concepts. Byline: "Start as a monolith, split only when it hurts."
