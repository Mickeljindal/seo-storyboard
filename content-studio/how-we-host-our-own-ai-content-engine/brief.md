# Brief: how-we-host-our-own-ai-content-engine

## Target
- **Primary keyword:** hosting an AI app case study
- **Secondary / long-tail:** AI content engine, how we host our own AI app, AI app in production example, dogfooding AI app, deploy AI content engine, always-on Node app case study, running an AI app on managed cloud.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no figures are fabricated. Treat as a low-volume, high-trust query in the AI-deploy cluster: the intent is proof and credibility ("show me a real one"), not raw search volume. Grounding is intent-based per the SEO OS (relevance and topical-authority over volume). Re-pull real Volume + KD before scaling any case-study sub-cluster.

## Reader + business outcome
- **Reader:** a developer or founder who has read the cluster's how-to and architecture pieces and now wants proof we practise what we preach, plus a concrete template for their own always-on AI app.
- **Business outcome:** build trust through dogfooding. This is the credibility asset the cluster points back to. It converts skeptics ("does this actually work?") by showing our own system running on the reference architecture, then routes to an always-on Node app + managed Postgres on Kloudbean.

## Intent + format
- **Intent:** informational, trust/credibility-first (a first-person case study), with a light commercial tail.
- **Format:** narrative engineering case study / build log. Deliberately NOT the how-to shape of the reference pieces: no numbered steps, no cost table. One bespoke topology SVG (our real stack mapped to the reference), a stack bullet list, honest tradeoffs, one firm opinion, deep FAQ. Varies structure from host-ai-chatbot-in-production so the cluster does not read as one template.

## Cannibalisation check (mandatory)
- `ai-app-reference-architecture` = the generalized shape (theory). This page = one real instance of it (practice, our own). Links to it, does not compete: different intent (proof vs blueprint).
- `last-mile-of-vibe-coding` = the pillar/argument. This page links UP as the flagship; it is a case study under it, not a rival.
- `move-ai-app-off-serverless` = the always-on argument in general; this page cites it as the concrete reason our autopilot loop needs an always-on process. No overlap.
- `host-ai-chatbot-in-production` / `deploy-ai-built-app-to-production` = how-to guides for other people's apps. This page is a first-person case study of our own system. Distinct intent (we-run-this vs you-build-this). No fold.
- Decision: distinct intent (dogfooding proof + real instance of the reference), build it.

## Information gain (one sentence)
The only first-person, named-stack account on this blog of the actual engine that produces it (TanStack Start on Node, Postgres/Drizzle, OpenRouter, WordPress REST + custom plugin), mapped box-for-box onto our published reference architecture, with the honest PGlite-vs-managed-Postgres decision and the autopilot-needs-always-on reason.

## Accuracy firewall (what this article must NOT do)
- NO invented metrics: no traffic, rankings, revenue, cost savings, uptime %, "X% faster", time-to-publish, or precise article count. "Hundreds of guides" is the only volume phrasing used (vague-but-true). The honesty is the point; one FAQ explicitly says we did not publish figures.
- NO secrets reproduced: the model key is referenced only by env-var NAME (OPENAI_API_KEY-style), never a value. No key/token/password value anywhere.
- NO invented customer quotes, team members, dates, or founding story.
- Constraints disclosed: dogfooding (our own tool), file-based PGlite is lightweight vs managed Postgres as the robust choice, autopilot is gated by a min-score threshold + daily/weekly caps and human review (not an unattended firehose).

## Ground-truth facts used (the ONLY facts stated about the system)
What it is (drafts with a model, quality gates, publishes; built with AI assistance); stack (TanStack Start React+Node, PostgreSQL+Drizzle, OpenAI-compatible via OpenRouter, third-party SEO data APIs, WordPress REST API + small custom plugin); deploy on Kloudbean as always-on Node (build `npm ci && npm run build`, start `node dist/server/server.js`, Node 22, port, secrets as env vars, Git auto-deploy on push to main, Docker option exists); persistence (PGlite file-based for dev/light self-host, survives redeploys, must be backed up; managed Kloudbean PostgreSQL as robust option, IP allow-listing, public access off by default); autopilot loop on a schedule with daily/weekly caps + min quality-score threshold (why always-on). Maps onto the reference architecture (always-on Node API holds key, managed Postgres = system of record, model provider = one external hop, env vars in dashboard, Git deploy).

## Kloudbean grounding (positioning, facts only)
Always-on Node/Python; managed PostgreSQL; env vars in the dashboard; Git deploy; free SSL; automatic backups; IP allow-listing (NOT a default private network/VPC; VPC is Enterprise-only). Honest boundary: managed = server/stack/SSL/backups/patching; the model is an external API; our code + data stay ours. No invented numbers, uptime, benchmarks, customers, or "certified".

## Internal links used (9, all resolve)
Up/flagship: last-mile-of-vibe-coding. Reference it instantiates: ai-app-reference-architecture. Across: ai-app-production-readiness-checklist, move-ai-app-off-serverless, managed-postgresql-hosting, deploy-ai-agent-without-exposing-api-keys, ci-cd-auto-deploy-from-github, environment-variables-done-right, database-connection-pooling. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs how-we-host-our-own-ai-content-engine` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity (9), blurbs=0, internal links resolve, words >= 1400. (hero.png + H2-count warnings acceptable.)
