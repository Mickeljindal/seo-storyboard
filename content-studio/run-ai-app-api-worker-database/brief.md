# Brief: run-ai-app-api-worker-database

## Target
- **Primary keyword:** API worker and database (weave "run an AI app with a worker" alongside it).
- **Secondary / long-tail:** background worker AI app, web process and worker process, multi-service app, job queue worker, separate worker from API, run two processes one app, AI app architecture worker, do I need a separate worker process, how do the API and worker communicate, what backs the job queue.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no figures are fabricated. Treat it as a mid-tail, architecture-intent query in the AI-deploy cluster; re-pull real Volume + KD before scaling a sub-cluster around it. Grounding here is intent-based, not volume-based (per the SEO OS: relevance over raw volume).

## Reader + business outcome
- **Reader:** someone whose AI app works on localhost but starts timing out or hanging once it does slow work (long model calls, indexing for retrieval, batch jobs, email). They've heard "add a worker" and need the actual shape.
- **Business outcome:** capture architecture-stage intent in the "Deploy AI / Vibe-Coded Apps" cluster and route to Kloudbean's always-on server (a real home for the worker) + managed Redis (the queue) + managed PostgreSQL (shared state) + cron, landing on the honest managed boundary.

## Intent + format
- **Intent:** informational, architecture how-to (how do I structure this), with a commercial tail (where do I run an always-on worker).
- **Format:** architecture walkthrough. Varies the shape from the reference: a four-piece table, a request-vs-worker table, a numbered request walkthrough, a bespoke request-path SVG, minimal producer/worker/start-command code, one firm opinion (no microservices), two anti-patterns (slow work inline; setInterval worker inside the web process). Not a "what is a queue" 101.

## Cannibalisation check (mandatory)
- `ai-app-reference-architecture` owns the full generalized architecture (every box). This page zooms into the API + worker + queue + database slice and links UP to it. Distinct depth, not a duplicate.
- `nodejs-background-jobs-bullmq` owns the queue-library how-to (defining jobs, retries, concurrency). This page keeps code minimal and links to it for the mechanics. No overlap.
- `move-ai-app-off-serverless` owns the always-on argument. Linked because a worker needs an always-on process; not re-argued here.
- `managed-redis-hosting` owns Redis; linked as the queue backing. `managed-postgresql-hosting` owns Postgres; linked as the shared DB.
- `last-mile-of-vibe-coding` is the breadth map; linked UP as the parent context.
- `why-ai-apps-fail-in-production` owns the failure catalogue; linked from the inline-slow-work anti-pattern.
- Did NOT link `deploy-long-running-ai-task-without-timeout` (does not exist yet).
- Decision: distinct intent (the API-plus-worker-plus-database shape and how to run two processes from one repo), build it.

## Information gain (one sentence)
The common multi-process shape an AI app grows into, in one place: why slow work moves off the request path, the four pieces (API, worker, Redis-backed queue, shared DB) and how they share state without calling each other, the request-to-result flow in a custom diagram, minimal producer/worker/start-command code, and the honest "provision more processes, the platform doesn't autoscale a standard app" scaling note.

## Kloudbean grounding (facts only)
Always-on Node/Python (a real home for the worker); managed Redis (queue backing); managed PostgreSQL (shared system of record); cron jobs from the dashboard (no SSH); Git deploy; free SSL; one dashboard; DB locked down by whitelisting the app server's IP (NOT a default private network/VPC; VPC is Enterprise-only). Autoscaling and Kubernetes are Enterprise/custom only, so scaling = provisioning more processes you control, never "the platform autoscales your worker". Honest boundary: managed = server/stack/SSL/backups/patching; customer owns code + data. $8/mo is the only confirmed price. No invented numbers, uptime, benchmarks, or customers.

## Internal links used (all resolve)
Up: last-mile-of-vibe-coding, ai-app-reference-architecture. Across: nodejs-background-jobs-bullmq, managed-redis-hosting, managed-postgresql-hosting, move-ai-app-off-serverless, why-ai-apps-fail-in-production. Money: kloudbean.com + /pricing/. (7 internal, within the 5 to 7 range.)

## Validation
`node _val.mjs run-ai-app-api-worker-database` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity (9), Article + FAQPage schema, blurbs=0, internal links resolve, words >= 1400. (hero.png absent + H2 count off-by-one warnings are acceptable: the CTA is an H2 in the .md but a div.cta in the .html.)
