# Brief: ai-agent-memory-production

## Target
- **Primary keyword:** AI agent memory
- **Secondary / long-tail:** types of AI agent memory, short-term vs long-term memory, conversation history storage, vector search for agents, pgvector for AI memory, Redis for chat context, LLM context window cost, delete user AI memory (right to be forgotten), managed Postgres for AI, do I need a vector database for my agent, where to store agent conversation history.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no figures are fabricated. Treat as a mid-tail, architecture/decision-intent query in the AI-deploy cluster (agent/memory is a fast-growing 2025-2026 topic). Re-pull real Volume + KD before scaling the sub-cluster. Grounding is intent-based, not volume-based (per the SEO OS: relevance over raw volume).

## Reader + business outcome
- **Reader:** a builder who added "memory" to an agent (via Cursor/Lovable/Bolt or the OpenAI/Anthropic SDK), has it working locally, and now hits real-user questions: cross-session recall, rising cost/latency, and deletion requests.
- **Business outcome:** capture architecture-stage intent in the "Deploy AI / Vibe-Coded Apps" cluster and route to Kloudbean's always-on server + managed Postgres/Redis + pgvector, landing on the honest managed boundary (you own the memory logic + data, including honouring deletions).

## Intent + format
- **Intent:** informational, decision-first (which kind of memory / which store do I need), with a commercial tail (where do I run all three).
- **Format:** decision guide, not a listicle. Answer-first H2s, one three-way comparison table (the memory types), one bespoke SVG (three stores feeding one agent), three real code blocks (Postgres schema, pgvector query, cross-store deletion + context assembly), one anti-pattern (whole-transcript-every-turn), one firm opinion (no dedicated vector DB on day one), deep FAQ (10).

## Cannibalisation check (mandatory)
- `host-ai-chatbot-in-production` = full chatbot request path (streaming, cost, reliability); memory is one section there. This page = memory as its own decision (three kinds, three stores, retention, deletion). Links across, does not compete.
- `last-mile-of-vibe-coding` = the breadth map of what AI builders leave for production; "AI memory" is one bullet. This page is the depth on that one bullet. Links UP.
- `pgvector-for-ai-apps` = embeddings/vector-search deep dive; referenced for the long-term layer, not duplicated (this page only decides when you need it and points there).
- `managed-redis-hosting` / `add-managed-database-to-your-app` = component how-tos; this page is the decision layer that ties them together and links across.
- Decision: distinct intent (which memory + which store, retention, deletion), build it.

## Information gain (one sentence)
It reframes "AI agent memory" as three separate jobs with three homes (Redis short-term, Postgres durable, pgvector long-term), gives a decision guide for which you actually need, and adds the two things most guides skip: a cross-store deletion (right-to-be-forgotten) path and the whole-transcript-every-turn cost anti-pattern.

## Kloudbean grounding (facts only)
One dashboard; always-on Node/Python (no cold starts); managed Postgres (pgvector where available for the Postgres version/setup, hedged); managed Redis; automatic backups; free SSL; Git deploy. DB locked down by whitelisting the app server's IP (IP Access Control), NOT a default private network/VPC; VPC is Enterprise-only. Honest boundary: managed = server/stack/SSL/backups/patching; customer owns memory logic + data, including honouring deletion requests. No invented numbers, uptime, benchmarks, customers, or "certified". CTA feature line uses true defaults only (no "private networking").

## Internal links used (all resolve)
Up: last-mile-of-vibe-coding. Across: add-managed-database-to-your-app, managed-redis-hosting, pgvector-for-ai-apps, host-ai-chatbot-in-production. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs ai-agent-memory-production` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity (10), blurbs=0, internal links resolve, words >= 1500. (hero.png absent + H2-count warnings acceptable: the CTA is an H2 in the md mirror and a div.cta in the html, matching the house pattern.)
