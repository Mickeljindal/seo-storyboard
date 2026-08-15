# Brief: nextjs-node-postgres-production-architecture

## Angle (knowledge-first reference architecture)
A concrete, opinionated reference architecture for one specific, very common stack: a Next.js
frontend, a Node API, and PostgreSQL. Not a generic "here is a diagram" post. It teaches the real
decisions layer by layer, where the API should live (colocated in Next.js route handlers vs a
separate Node service), running the Node API as a persistent process, managed Postgres with a
connection pool, secrets/env, background jobs, uploads/static assets, SSL/domain, and backups.
Opinionated but fair: start colocated, split only when there is a nameable reason. No metrics, no
invented numbers.

## Target keyword
- **Primary:** Next.js Node.js PostgreSQL production architecture
- **Secondary:** Next.js Node Postgres architecture, production architecture for a Next.js app,
  how to structure a Next.js Node Postgres SaaS, Next.js backend architecture, Node Postgres
  production setup.

Volumes not asserted (owner rule: no invented numbers, no percentages, no dollar figures, no
benchmarks). Intent-grounded architecture query. Primary keyword placed in the H1, title, meta
description, first 100 words, and the opening H2.

## Intent
Informational / architecture. A developer or small SaaS team deciding how to structure this exact
stack for production. Payoff is a clear reference architecture and the decisions behind it, not a
signup.

## Information gain (one sentence)
It gives a stack-specific, opinionated production architecture (the colocated-vs-split API call,
why Node needs a pool against Postgres max_connections, the persistent-process requirement, and a
layer-by-layer job/production-concern table) that a generic "Next.js + Postgres" post never spells
out, and it takes a clear position instead of hedging.

## Honesty / fairness
Opinionated but honest: the recommendation to start colocated is stated as an opinion, with a real
"split when you can name the reason" section and a named anti-pattern (splitting too early into
premature microservices). No metrics, no invented numbers, no superlatives.

## Product mention (one light touch + CTA, grounded in kloudbean-facts.md)
One "Where Kloudbean fits" paragraph plus the CTA. Grounded only: a managed server runs Node/Next.js
as a persistent process (PM2 supported), managed PostgreSQL beside it, environment variables and
runtime config in the dashboard, free SSL, automatic backups, one dashboard. No autoscaling-for-all,
no VPC/private-networking as default (DB access framed via IP allow-listing elsewhere in the
library), no invented pricing, no SLA number. Never claims Kloudbean "wins".

## Cannibalisation check (read neighbours' H2 sets first)
- ai-app-reference-architecture owns the AI-app-specific architecture (model/inference, edge, key).
  Different stack focus. Linked, not duplicated.
- host-app-api-and-database-on-one-server owns the colocation how-to (one-server setup, when to
  split). This owns the full Next.js+Node+Postgres reference architecture and links there for the
  colocation detail.
- deploy-nextjs-app-to-your-own-server owns the deploy steps for Next.js. This is architecture, not
  deploy steps. Linked for the how-to.
- do-i-need-separate-frontend-and-backend-servers owns the split decision in general. This covers
  the split as one layer decision and links there for the full treatment.
Distinct intent confirmed: the stack-specific production architecture reference.

## Internal links used (7, all verified with ls to exist)
deploy-nextjs-app-to-your-own-server, deploy-node-app-to-managed-cloud, managed-postgresql-hosting,
database-connection-pooling, host-app-api-and-database-on-one-server,
do-i-need-separate-frontend-and-backend-servers, ai-app-reference-architecture.
(CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first reference architecture, ~2000 words. .tldr answer-first, question-style H2s, one
comparison-style table (layer -> job -> production concern), one teaching inline SVG (browser ->
Next.js -> Node API -> Postgres, optional cache/queue, backups; navy #000f27 / purple #4F1AF3 /
green #40b75f), light CTA, 9-question FAQ mirrored to FAQPage JSON-LD, plus the clean Organization
entity block. Near-zero em-dashes. No metrics. Cluster: 2 - Deployment Fundamentals.
Byline: "Boring architecture is the kind that sleeps through the night."
