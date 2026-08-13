# Brief: deploy-long-running-ai-task-without-timeout

## Target
- **Primary keyword:** long running task timeout (also "AI task times out")
- **Secondary / long-tail:** request timeout long AI generation, 504 gateway timeout AI, background job long task, poll for job status, 202 accepted pattern, agent run timeout, batch embedding timeout, function timeout AI.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no fabricated figures are recorded. Treat as a mid-tail, pattern/how-to query in the AI-deploy cluster; re-pull real Volume + KD before scaling the sub-cluster. Grounding is intent-based, not volume-based (per the SEO OS: relevance over raw volume).

## Reader + business outcome
- **Reader:** a developer whose AI feature (a long model generation, a multi-step agent run, or a batch embedding job) works locally but dies with a 504 or a dead request in production because a proxy or serverless function times out first.
- **Business outcome:** capture the "my long AI task times out" intent for the "Deploy AI / Vibe-Coded Apps" cluster and route to Kloudbean's always-on server + background worker/cron + managed Redis (queue) + managed Postgres (job state), landing on the honest managed boundary.

## Intent + format
- **Intent:** informational, pattern/how-to (how do I run work that outlives a request), with a commercial tail (where do I run the always-on server + worker).
- **Format:** diagnosis then pattern. Why it times out (the layer that gives up) -> why bumping the timeout fails (anti-pattern) -> the 202 accept-then-background pattern (SVG) -> the three result-delivery methods (poll/stream/webhook table) -> real code (202 endpoint + client poll) -> streaming exception -> worker/queue -> Kloudbean. Varied from the reference (host-ai-chatbot) shape.

## Cannibalisation check (mandatory)
- `why-ai-apps-fail-in-production` = the map of many failure modes, request timeouts being one. THIS page owns the fix for that one failure (the 202/background-job pattern) and links back. No overlap worth folding.
- `nodejs-background-jobs-bullmq` = the queue-library how-to (worker, retries, concurrency). Linked for the mechanics; this page is the architectural pattern, not the library tutorial.
- `llm-streaming-in-production` = token streaming deep dive. Linked as the streaming path and clearly distinguished: streaming solves perceived-wait / incremental output; the job pattern solves truly-long / no-partial-output work.
- `move-ai-app-off-serverless` = the serverless-timeout argument. Linked; this page references the hard function limit but does not re-argue the whole serverless case.
- `ai-app-reference-architecture` = the full app shape (API + worker + queue + store). Linked UP; this page zooms into one pattern within it.
- `host-ai-chatbot-in-production` = chatbot request path (uses streaming). Linked as the streaming example.
- Decision: distinct intent (the long-task-timeout pattern), build it. Did NOT link run-ai-app-api-worker-database (does not exist yet).

## Information gain (one sentence)
The one place that turns "my long AI task times out" into a concrete fix: the status code names the layer that gave up, bumping the proxy timeout only relocates the ceiling and pins a web worker, and the durable answer is the 202-accept-then-work-in-background pattern with poll/stream/webhook delivery, shown with a two-path SVG and copy-paste endpoint + client code.

## Kloudbean grounding (facts only)
Always-on server (no serverless function timeout cutting the job); managed reverse proxy layer; background worker + cron jobs from the dashboard; managed Redis (queue); managed Postgres (job state); Git deploy; free SSL; one dashboard. NOT claimed: automatic autoscaling for normal users (Enterprise/custom only, stated honestly). The 30 to 60 second figures are framed as common proxy/function defaults ("often", "commonly"), never as a specific Kloudbean limit. No invented numbers, uptime, benchmarks, customers, or "certified". Honest managed boundary: server/stack/proxy/SSL/backups/patching are managed; job code, queue logic, and data stay the customer's.

## Internal links used (7, all resolve)
Up: last-mile-of-vibe-coding (required), ai-app-reference-architecture. Across: why-ai-apps-fail-in-production, move-ai-app-off-serverless, nodejs-background-jobs-bullmq, llm-streaming-in-production, host-ai-chatbot-in-production. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs deploy-long-running-ai-task-without-timeout` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity (9), blurbs=0, internal links resolve, words >= 1400. (hero.png + H2-count off-by-one warnings acceptable; the CTA heading is an H2 in .md but a styled paragraph in the .cta div in .html.)
