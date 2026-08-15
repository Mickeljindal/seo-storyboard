# Brief: where-to-deploy-a-python-app

## Angle (knowledge-first decision guide)
The Python sibling to where-to-deploy-nodejs-app. A fair, neutral decision guide across the three
real kinds of home for a Python web app (Django, FastAPI, Flask): a managed platform, a raw VPS you
run yourself, or serverless functions. The reframe: don't pick by brand, pick by how your app runs.
The Python-specific insight that decides it: a web app is a long-running process behind a WSGI
(Django, Flask) or ASGI (FastAPI) server, run by Gunicorn or Uvicorn workers, with a database and
often Celery/RQ background workers alongside. Serverless has cold starts and request timeouts that
hurt long requests, streaming, and background work. No metrics anywhere (no prices, no cold-start
milliseconds, no percentages). Never claims Kloudbean wins.

## Target keyword
- **Primary:** where to deploy a Python app
- **Secondary:** where to deploy a Django app, where to deploy a FastAPI app, best hosting for a
  Python web app (used in-copy as the safe variant "best host for a Python web app" to avoid the
  banned superlative phrase), Python app hosting, deploy a Python web app.

Volumes not asserted (owner rule: no invented numbers). Intent-grounded decision query, the Python
counterpart to the existing Node decision guide. Primary keyword placed in H1, title, meta
description, first 100 words, and the "A quick way to decide where to deploy a Python app" H2.

## Intent
Informational / decision. A developer who has built a Django, FastAPI, or Flask app and is deciding
where it should live. Payoff is a clear category choice, not a signup. Links out to the how-to
guides for the actual steps.

## Information gain (one sentence)
It teaches the Python-specific fact that decides hosting, that a web app is a persistent WSGI/ASGI
process (with a database and Celery/RQ workers), then maps managed platform vs raw VPS vs serverless
to who each fits, with honest "choose serverless if" and "choose a persistent server if" cases that
the generic "best Python hosting" listicles skip.

## Honesty / fairness
Explicit, fair serverless case (light, bursty, stateless endpoints, scale-to-zero) before the
catch. Persistent-server case is workload-based, not vendor-based. Managed vs VPS framed as "who
runs the server," not "which is better." Kloudbean appears once near the end plus the CTA, and the
closing line explicitly says the reader may choose Kloudbean, another managed platform, or a VPS.

## Product mention (one light touch + CTA, grounded ONLY in kloudbean-facts.md)
Managed server runs Python (Django/Flask/FastAPI) with runtime config in the UI; managed database
beside it; automatic backups; free SSL; cron jobs from the dashboard; one dashboard across several
clouds. No autoscaling-for-all, no VPC-as-default, no prices, no invented numbers, no "wins."

## Cannibalisation check
- where-to-deploy-nodejs-app owns the Node hosting decision (brand-by-brand). This owns the Python
  decision and is category-based (managed / VPS / serverless), so no overlap; it references the Node
  one as the sibling instead of competing.
- deploy-django-app / deploy-fastapi-app / deploy-flask-app own the how-to steps. This is the
  decision layer and links to them rather than duplicating any steps.
- do-i-need-a-vps-for-my-saas owns the VPS ownership tradeoff; linked, not repeated.
- managed-postgresql-hosting owns the database home; best-hosting-for-ai-saas owns the AI buyer view.

## Internal links used (7, all verified with ls -d to exist)
deploy-django-app, deploy-fastapi-app, deploy-flask-app, where-to-deploy-nodejs-app,
do-i-need-a-vps-for-my-saas, managed-postgresql-hosting, best-hosting-for-ai-saas.
(CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first decision guide, ~2000+ words. Matches the do-i-need-aws-to-launch-a-saas template:
.tldr answer-first, question-style H2s, one options table.cmp (three columns), one teaching inline
SVG (persistent WSGI/ASGI server with warm workers + Celery + database vs serverless cold-start /
per-request / timeout), light CTA, 9-question FAQ mirrored to FAQPage JSON-LD, plus the clean
Organization entity block (copied verbatim from the template). Near-zero em-dashes. No metrics.
Cluster: 2 - Deployment Fundamentals. Byline: "A Python web app is a long-running process. Give it
a home that keeps it running."
