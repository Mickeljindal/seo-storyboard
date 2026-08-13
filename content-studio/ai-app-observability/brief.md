# Brief: ai-app-observability

## Target
- **Primary keyword:** AI app observability
- **Secondary / long-tail:** LLM observability, monitor AI application, log LLM requests, time to first token (TTFT), token usage tracking, AI cost monitoring, tracing LLM requests, redact prompts logging, LLM metrics, observability for AI apps, what to log in an AI app, don't log user prompts.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no fabricated figures are recorded. Treat as an emerging, intent-rich engineering query in the AI-deploy cluster (LLM observability is a fast-growing search space). Re-pull real Volume + KD before scaling the sub-cluster. Grounding is intent-based per the SEO OS (relevance over raw volume).

## Reader + business outcome
- **Reader:** an engineer whose AI app (Lovable/Cursor build or hand-written with the OpenAI/Anthropic SDK) now has real users, and who needs to see cost, latency, and failures without leaking user data through logs.
- **Business outcome:** own the "seeing your AI app" lane in the Deploy AI cluster and route to Kloudbean's always-on process + streamed console logs + managed Postgres for self-owned metrics, landing on the honest managed boundary. Not a "what is observability 101" piece.

## Intent + format
- **Intent:** informational engineering how-to (what to measure, how to log safely), with a light commercial tail (where to run it).
- **Format:** organizing-idea explainer ("measure the metadata, not the message"), a signals table, a keep/hash/drop table, a bespoke request-path SVG with a REDACT gate, a good-log-line JSON example, one firm opinion (never log raw prompts by default), one anti-pattern section (PII lake / mean hides p95 / dashboard with no alert), deep FAQ. Section order/count deliberately varied from the reference (host-ai-chatbot-in-production).

## Cannibalisation check (mandatory)
- `structured-logging-nodejs` = general Node logging setup (Pino, levels, request IDs, stdout, never log secrets). This page builds ON it and links twice for the mechanics; it does not re-teach Pino. Distinct: this is what an AI app specifically measures + the prompt-privacy discipline.
- `uptime-monitoring` = availability, 99.9% math, health checks, LB probes. Linked once to distinguish "is it up" from "what is it doing." No overlap.
- `why-ai-apps-fail-in-production` = failure triage (fixing). This page = the instrumentation layer (seeing). Linked and distinguished explicitly.
- `host-ai-chatbot-in-production` = has a short "logging without storing prompts" section. This page is the long version of that discipline; links up.
- `deploy-ai-agent-without-exposing-api-keys` = key security / log the caller not the key. Linked for the credential-in-logs angle.
- `last-mile-of-vibe-coding` = the flagship map of everything AI builders leave for production. Linked UP (required).
- Decision: distinct intent (observe behaviour + cost + the prompt-privacy problem), build it.

## Information gain (one sentence)
The full AI-app instrumentation discipline in one place: exactly which signals to measure (TTFT vs total, tokens, cost/request, model+version, route, cache, retrieval quality, refusal + 429 rates) mapped to the decision each drives, plus a keep/hash/drop field table and a redact-gate diagram that make "log the metadata, not the message" concrete.

## Kloudbean grounding (facts only)
Always-on process (Node/Python); streamed application logs read in the console; deployment history + live build logs; log to stdout (12-factor) and it's captured; one dashboard. Managed Postgres on the same platform for storing your own aggregated metrics / event log; DB locked down by whitelisting the app server's IP (NOT a default VPC/private network; VPC is Enterprise-only). No built-in APM/metrics-dashboard product; instrumentation is the customer's code. Enterprise-only (framed lightly): immutable searchable account-wide Audit Trail with CSV export, managed monitoring alert policies, longer log retention. Honest boundary: managed = server/stack/SSL/backups/patching; instrumentation, log-content decisions, prompts, and data stay the customer's. No invented numbers, retention days, uptime, benchmarks, customers, or "certified/compliant."

## Internal links used (all resolve)
Up: last-mile-of-vibe-coding. Across: structured-logging-nodejs (x2), uptime-monitoring (x2), why-ai-apps-fail-in-production, host-ai-chatbot-in-production, deploy-ai-agent-without-exposing-api-keys, managed-postgresql-hosting. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs ai-app-observability` must print [OK]: em-dash html=0, em-dash md=0, Article + FAQPage JSON-LD, FAQ parity (9), blurbs=0, internal links resolve, words >= 1400. Acceptable warnings: H2 count html=9 md=10 (CTA is an H2 in md, a div in html) and hero.png absent.
