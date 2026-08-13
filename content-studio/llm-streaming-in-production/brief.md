# Brief: llm-streaming-in-production

## Target
- **Primary keyword:** LLM streaming in production
- **Secondary / long-tail:** SSE vs WebSockets, Server-Sent Events for LLM, stream LLM responses, proxy_buffering off SSE, X-Accel-Buffering no, streaming works locally but not in production, SSE read timeout / stream cuts off after 60s, EventSource reconnect / Last-Event-ID, serverless streaming caveats, stream tokens Node Express + FastAPI, disable gzip on SSE, backpressure streaming.
- **Volume / difficulty:** no live SEMrush / DataForSEO export was supplied for this exact term in-session, so no figures are fabricated here. Treat as a mid-tail, high-intent engineering query in the AI-deploy cluster (developers debugging a broken production stream). Grounding is intent-based per the SEO OS (relevance over raw volume); re-pull real Volume + KD before scaling a streaming sub-cluster. The strongest demand signal is the recurring "streaming works locally but not in prod" question, which is a real, painful support-shaped query.

## Reader + business outcome
- **Reader:** an engineer who built a streaming chat/LLM feature that works on localhost and broke on deploy (arrives as one lump, cuts off mid-answer, or won't stream at all). Wants the transport-level truth, not a chatbot 101.
- **Business outcome:** own the streaming-mechanics intent in the "Deploy AI / Vibe-Coded Apps" cluster, and route to Kloudbean's always-on process + managed reverse proxy/SSL as the honest fit for long-lived streams (vs serverless). Teach-first, land last.

## Intent + format
- **Intent:** informational, deeply technical (debug + implement), with a light commercial tail (where a long-lived stream is happiest to run).
- **Format:** transport deep dive. Lead + tldr, ~9 answer-first H2s, one comparison table (SSE vs WebSocket vs wait-for-full), real Node/Express + FastAPI SSE endpoints + client EventSource + an nginx config block, ONE bespoke SVG (token flow browser<->proxy<->app<->model marking the buffering choke point), one opinion (default to SSE for chat; WebSockets only for genuine two-way), one anti-pattern (faking a stream with a polling loop), deep FAQ (9). Not a listicle, not a "what is SSE" 101.

## Cannibalisation check (mandatory, against real neighbours' H2 sets)
- `host-ai-chatbot-in-production` = full chatbot architecture; streaming is ONE section (SSE vs WS table + one X-Accel-Buffering line). This page goes far deeper on the transport: the nginx directives, read timeouts, backpressure, reconnection/resume, serverless. Links across, does not repeat.
- `why-ai-apps-fail-in-production` = triage catalogue; "Streaming works locally but breaks in production" and "request times out on long model calls" are single rows. This page is the full treatment of exactly those two rows. Links across.
- `scale-websockets-nodejs` = scaling WS across instances (sticky sessions, cross-instance broadcast). Different question (how do I run many sockets), not the SSE-vs-WS decision or the proxy/timeout mechanics. Referenced twice for the scale case, does not compete.
- `reverse-proxy-explained` = general reverse-proxy concept (what/why, forward vs reverse, 502s, config). This page is the streaming-specific edge case of proxy buffering. Links to it as the primer, stays in the streaming lane.
- Decision: distinct intent (streaming transport mechanics deep dive). Build it, link to all four.

## Information gain (one sentence)
The whole transport-level truth of production LLM streaming in one place: SSE-vs-WebSocket decision with a clear default, copy-paste Node + Python SSE endpoints and the client, the buffering reverse-proxy bug explained with the exact nginx directives (proxy_buffering off, gzip off, X-Accel-Buffering: no) and a diagram of where it breaks, read/idle timeouts on long streams, backpressure, EventSource reconnect/Last-Event-ID resume, and why serverless fights all of it.

## Kloudbean grounding (facts only)
Always-on process (no cold starts) suits long-lived SSE/WebSocket connections; Node + Python runtimes; managed stack incl. reverse proxy + free SSL in front of the app; Git deploy; automatic backups; free migration; managed DB locked down by whitelisting the app server's IP (NOT a default private network/VPC; VPC is Enterprise-only). Honest boundary stated: managed = server/stack/SSL/backups/patching; the streaming endpoint, headers (X-Accel-Buffering, buffering off, read timeout), and app code stay the customer's. No invented numbers, uptime, benchmarks, customers, or "certified". The 800ms/12s/60s figures used are generic illustrative engineering values, not Kloudbean metrics.

## Internal links used (all resolve, verified)
Up: last-mile-of-vibe-coding. Across: host-ai-chatbot-in-production, why-ai-apps-fail-in-production, scale-websockets-nodejs (x2), reverse-proxy-explained. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs llm-streaming-in-production` must print [OK]: em-dash html=0, em-dash md=0, Article + FAQPage schema, FAQ parity (9), blurbs=0, no placeholders, internal links resolve, words >= 1500. (hero.png absent + H2-count html/md warnings are acceptable: CTA is an H2 in the md mirror only, matching the house pattern.)
