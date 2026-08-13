# Brief: ai-app-production-readiness-checklist

## Target
- **Primary keyword:** AI app production readiness checklist (in h1, title, meta description, first 100 words, and one H2).
- **Secondary / long-tail:** AI app launch checklist, is my AI app production ready, deploy AI app checklist, LLM app pre-launch, ship AI app to production, AI app go-live checklist, production checklist for AI, what's the minimum before launching an AI app, do I need all this for a side project, where should my AI app's API key live.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no figures are fabricated. Treat as a mid-tail, hub/checklist-intent query that ties the "Deploy AI / Vibe-Coded Apps" cluster together. Grounding is intent + cluster-authority based (per the SEO OS: relevance over raw volume). Re-pull real Volume + KD before scaling further.

## Reader + business outcome
- **Reader:** someone who built an AI app (Lovable, Cursor, the OpenAI/Anthropic SDK), has it working locally, and wants a fast, scannable go-live checklist of what's *different* about shipping an AI app, not another manifesto.
- **Business outcome:** act as the actionable hub / proof asset for the cluster. Route readers to the deep spokes (the "how") and land on Kloudbean's always-on server + managed Postgres/Redis + pgvector + backups + env vars, on the honest managed boundary. A citable checklist is a linkable asset.

## Intent + format
- **Intent:** informational, checklist. The do-this companion to the flagship manifesto.
- **Format (varied from the chatbot reference on purpose):** short lead + tldr, a how-to-use section, an at-a-glance comparison table, eight grouped checklist H2s with checkbox-glyph items, a readiness-by-stakes triage section with a bespoke SVG staircase, one firm opinion, one anti-pattern, Kloudbean fit, deep FAQ. No numbered step walkthrough (the spokes own the how).

## Cannibalisation check (mandatory)
- `last-mile-of-vibe-coding` (flagship) OWNS the "why production is different" manifesto. This page links UP to it and is the checkbox version, not another essay.
- `from-prototype-to-production-checklist` OWNS the GENERAL app checklist (domain, TLS, error pages, the baseline any web app needs). This page explicitly defers there for the general list and owns only the AI-SPECIFIC readiness items.
- `ai-built-app-security-checklist` OWNS the security-only deep checklist. Linked for the security pass, not rebuilt.
- The individual spokes (managed DB, pgvector, pooling, API-key safety, streaming, rate/cost control, agent memory, Redis, secrets, env vars, observability, off-serverless, 503, Saudi hosting, PDPL, why-AI-apps-fail) each OWN their "how". This page links to each once and does not re-teach them.
- Decision: distinct intent (an AI-specific, triage-aware go-live checklist that hubs the cluster). Build it.

## Information gain (one sentence)
The AI-specific production checklist in one scannable place, grouped by concern and routed to each deep spoke, with a stakes-based triage (a weekend demo is honestly told it needs only three items) that no generic "deploy your app" list gives.

## Original value (not competitor-swappable)
- Firm opinion: if you do only three things, put the key behind your backend, set a hard spend cap, and move off SQLite.
- Anti-pattern: treating a demo as production because it "works" (key in the frontend, in-memory store, no cap).
- Triage: scale the checklist to the stakes (SVG staircase: weekend demo / internal tool / funded or regulated).
- Kloudbean's actual one-dashboard flow (always-on, IP allow-listing, env vars, Dammam residency) woven so the swap test breaks.

## Kloudbean grounding (facts only)
One dashboard; always-on Node/Python (no cold starts); managed Postgres (pgvector where the plan enables it) + managed Redis; built-in S3-compatible object storage (no egress fees); automatic backups; free SSL; env vars in the dashboard; Git deploy; staging (WordPress + Laravel); DB locked by IP allow-listing (private VPC is Enterprise-only, not default); optional in-Kingdom GCP Dammam residency (qualified: "one of the few managed-cloud platforms delivering managed databases with in-Kingdom data sovereignty"); aligned with / supports (never certified / makes-you-compliant); no GPU/inference hosting; plans from $8/mo. Honest managed boundary: server/stack/SSL/backups/patching handled; code, prompts, data stay the customer's. No invented numbers, uptime, benchmarks, or customers.

## Internal links used (all resolve; hub, 21 unique)
Up: last-mile-of-vibe-coding. General/security: from-prototype-to-production-checklist, ai-built-app-security-checklist. Spokes: add-managed-database-to-your-app, managed-postgresql-hosting, pgvector-for-ai-apps, production-database-design-for-ai-apps, database-connection-pooling, deploy-ai-agent-without-exposing-api-keys, llm-streaming-in-production, why-ai-apps-fail-in-production, rate-limit-and-cost-control-for-ai-apis, ai-agent-memory-production, managed-redis-hosting, secrets-management, environment-variables-done-right, ai-app-observability, move-ai-app-off-serverless, fix-503-after-deploying-your-app, hosting-ai-apps-saudi-arabia, saudi-pdpl-for-ai-apps. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs ai-app-production-readiness-checklist` must print [OK]: em-dash html=0, em-dash md=0, Article + FAQPage schema, FAQ parity (9), blurbs=0, no placeholders, all internal links resolve, words >= 1400. (hero.png absent + H2-count warnings acceptable.)
