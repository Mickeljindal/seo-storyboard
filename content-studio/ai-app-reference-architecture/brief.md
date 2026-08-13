# Brief: ai-app-reference-architecture

## Target
- **Primary keyword:** AI app reference architecture
- **Secondary / long-tail:** production AI app architecture, LLM app architecture, AI application stack, how to structure an AI app, AI app components, RAG architecture, AI SaaS architecture diagram, do I need a separate vector database, do I need a message queue for my AI app, can I run an AI app on serverless, what is the architecture of an AI app.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no fabricated figures are recorded. Treat as a mid-tail, architecture-intent hub query in the "Deploy AI / Vibe-Coded Apps" cluster; re-pull real Volume + KD before scaling. Grounding is intent + cluster-position based, not volume (per the SEO OS: relevance over raw volume, and a hub earns its place by strengthening the cluster).

## Reader + business outcome
- **Reader:** a developer or founder who has one or more AI apps (chatbot, agent, RAG tool, AI SaaS) working locally or half-deployed, and wants the canonical mental model of the production shape so they can map their own app onto it and know what they're missing.
- **Business outcome:** a citable cluster HUB. It answers the architecture question completely, routes to every spoke (the "how" articles), and lands on the fact that Kloudbean runs every owned box in one dashboard. Proof asset for AI Overviews / assistant citations, not a hard-sell page.

## Intent + format
- **Intent:** informational, reference/architecture. Light commercial tail (where to run it).
- **Format:** reference doc anchored by ONE large original inline SVG (generalized topology, viewBox 0 0 820 560, brand colours), then a citable component table (component / role / what breaks without it / deep-dive link), then component prose grouped by tier (edge, heart, state, jobs, observability), a "start smaller" MVP section, an anti-pattern, an optional residency overlay, Kloudbean fit, and a 10-question FAQ. Shape deliberately varied from host-ai-chatbot-in-production (which walks a single request path; this leads with the map and is broader).

## Cannibalisation check (mandatory)
- `host-ai-chatbot-in-production` OWNS the chatbot-specific request path + its own diagram. This page is the GENERALIZED reference a chatbot is one instance of; it links down to it as "the chatbot version of this" and its scope is broader (queue, object storage, vector store, observability, residency as first-class boxes). No overlap of primary intent.
- `last-mile-of-vibe-coding` (flagship) OWNS the narrative manifesto. This page links UP to it and is the full architecture reference that piece gestures at. Distinct.
- Each component spoke (`managed-postgresql-hosting`, `pgvector-for-ai-apps`, `managed-redis-hosting`, `nodejs-background-jobs-bullmq`, `store-user-uploads-in-object-storage`, `ai-app-observability`, `rate-limit-and-cost-control-for-ai-apis`, `move-ai-app-off-serverless`, `llm-streaming-in-production`, `deploy-ai-agent-without-exposing-api-keys`, `why-ai-apps-fail-in-production`, `reverse-proxy-explained`, `production-database-design-for-ai-apps`, `database-connection-pooling`, `rag-in-production`, `hosting-ai-apps-saudi-arabia`) OWNS its own "how". This page links, it does not re-teach.
- `best-hosting-for-ai-saas` owns the buyer's-guide angle; linked once from the "start smaller" section, not duplicated.
- Decision: distinct intent (the generalized reference + one teaching diagram that ties the cluster together). Build it as the hub.

## Information gain (one sentence)
One original, labelled diagram plus a citable table that generalize every production AI app into twelve boxes (client, proxy, always-on API, model hop, relational DB, pgvector, Redis, queue+worker, object storage, observability, security/cost gate, optional residency), each with what it is, why it's there, what breaks without it, and when to skip it on day one, anchored by the opinion that you almost never need a separate vector DB and can skip the queue until real work blocks the request.

## Kloudbean grounding (facts only)
One dashboard for the owned boxes: always-on server (Node/Python, no cold starts); 7 managed DB engines incl PostgreSQL with pgvector where the plan supports it, and Redis; built-in S3-compatible object storage with no egress fees (built-in buckets only); automatic backups; free SSL; Git deploy; cron jobs + background worker; staging; env vars in the dashboard; managed DB locked down by IP allow-listing (private VPC is Enterprise-only, NOT a default). Optional in-Kingdom GCP Dammam region, qualified as "aligned with (not certified for)". Model provider box is explicitly external (no GPU/inference hosting claim). Honest managed boundary stated. No invented numbers, uptime, benchmarks, customers, or "certified".

## Internal links used (14 outbound, all verified to resolve)
Deliberately focused as a hub map: one primary deep-dive per component (the citable table) plus the two required prose links, rather than stacking 2-3 links per component (which would have hit ~19 and read as overlinking). The candidate list suggested multiple spokes per component; I picked the single best one for each and cut the prose-only overlaps (why-ai-apps-fail-in-production, rag-in-production, production-database-design-for-ai-apps, database-connection-pooling, best-hosting-for-ai-saas) so the count sits close to the 8-12 target while every component still has a deep-dive.
- UP (required): last-mile-of-vibe-coding.
- The chatbot instance (required): host-ai-chatbot-in-production.
- Table deep-dives (12, one per component): deploy-ai-agent-without-exposing-api-keys, reverse-proxy-explained, move-ai-app-off-serverless, llm-streaming-in-production, managed-postgresql-hosting, pgvector-for-ai-apps, managed-redis-hosting, nodejs-background-jobs-bullmq, store-user-uploads-in-object-storage, ai-app-observability, rate-limit-and-cost-control-for-ai-apis, hosting-ai-apps-saudi-arabia.
- Money: https://www.kloudbean.com/ + https://www.kloudbean.com/pricing/.

## Validation
`node _val.mjs ai-app-reference-architecture` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity (10), Article + FAQPage JSON-LD, blurbs=0, internal links resolve, words >= 1400. hero.png absent + H2-count off-by-one warnings acceptable.
