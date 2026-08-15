# Brief: nextjs-fastapi-postgres-production-architecture

## Angle (knowledge-first architecture guide)
The concrete production architecture for the split-stack, polyglot case: a Next.js (JavaScript)
frontend, a FastAPI (Python) backend, and PostgreSQL. Because the two runtimes cannot share a
process, this stack forces decisions an all-Node stack never faces. The guide teaches those
decisions rather than listing steps: two processes not one, one origin vs two origins (and the
CORS + cross-origin auth that splitting brings), FastAPI as an ASGI app under Uvicorn/Gunicorn
workers, where Next.js should call the API (server-side vs client-side, secrets stay server-side),
PostgreSQL with connection pooling, background jobs (Celery) only when needed, and the SSL/domain/
backups layer. Opinionated but fair: colocate on one origin unless you have a reason to split. No
metrics, no invented numbers.

## Target keyword
- **Primary:** Next.js FastAPI PostgreSQL production architecture
- **Secondary:** Next.js FastAPI architecture, Next.js Python backend architecture, FastAPI Postgres
  production setup, how to structure a Next.js FastAPI SaaS, decouple Next.js frontend from a Python API.

Volumes not asserted (owner rule: no invented numbers, no fabricated volumes). Intent-grounded
architecture query. Primary keyword placed in H1, title, meta description, first 100 words, and the
"What the Next.js + FastAPI + PostgreSQL architecture looks like" H2.

## Intent
Informational / architecture. A developer who has a Next.js frontend and a FastAPI backend and needs
to know how to lay them out in production. Payoff is a clear mental model and the key decisions, not
a signup.

## Information gain (one sentence)
It names the decisions the JS-frontend/Python-backend split specifically forces (two processes, one
origin vs two, ASGI worker model, where Next.js calls the API, Postgres connection multiplication
across workers), which generic "deploy your app" content and single-runtime guides do not.

## Honesty / fairness / opinion
Takes a clear position (colocate on one origin unless there is a real reason to split) and lists the
legitimate reasons to split. Anti-patterns: uvicorn --reload in prod, secrets in NEXT_PUBLIC_,
new connection per request, heavy work in the request path, SQLite in a multi-worker prod API. No
metrics or benchmarks. Kloudbean appears once (lightly) plus the CTA; never framed as "winning".

## Product mention (one light touch + CTA, grounded in kloudbean-facts.md)
Managed server runs the Next.js and FastAPI processes (one server or separate servers), managed
PostgreSQL behind them, automatic backups, free SSL, Node/Python runtime config, one dashboard, IP
allow-listing on the database. No autoscaling-for-all, no VPC/private-networking-as-default, no
invented pricing. CTA feature line uses true defaults only (no "private networking").

## Cannibalisation check (read neighbour H2 sets / scopes first)
- nextjs-node-postgres-production-architecture (all-Node stack): different stack (one runtime). This
  page is explicitly the two-runtime/polyglot case and differentiates in prose + an FAQ. That folder
  does not exist yet, so it is NOT linked (would break link validation); differentiated conceptually.
- where-to-deploy-a-python-app: owns the Python hosting decision. Linked, not repeated.
- deploy-fastapi-app: owns the FastAPI deploy steps + myths. Linked, not repeated.
- ai-app-reference-architecture: owns the wider reference arch (vector store, queue, storage). Linked.
- do-i-need-separate-frontend-and-backend-servers: owns the split-or-not decision. Linked.
- host-app-api-and-database-on-one-server: owns the colocation how-to. Linked.
- fix-cors-error-node-production: owns the CORS fix. Linked (mechanism identical for FastAPI).
This page owns the architecture-decisions layer for the specific Next.js + FastAPI + Postgres combo.

## Internal links used (8, all verified to exist with ls)
fix-cors-error-node-production, do-i-need-separate-frontend-and-backend-servers,
host-app-api-and-database-on-one-server, ai-app-reference-architecture, deploy-fastapi-app,
where-to-deploy-a-python-app, deploy-nextjs-app-to-your-own-server, managed-postgresql-hosting.
(CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first architecture guide, ~2000 words. Answer-first .tldr, 10 H2s (9 content + FAQ), a
one-origin-vs-two-origins comparison table, a layer/production-concern table, one teaching inline SVG
(browser -> Next.js + FastAPI on one origin -> Postgres -> backups; navy #000f27 / purple #4F1AF3 /
green #40b75f), light CTA, 8-question FAQ mirrored to FAQPage JSON-LD, plus the clean Organization
entity block. Near-zero em-dashes. No metrics.
Cluster: 2 - Deployment Fundamentals.
Byline (top): "Two runtimes don't have to mean two origins."
Byline (bottom): "Two processes, one origin unless you have a reason to split, a managed database behind them."
