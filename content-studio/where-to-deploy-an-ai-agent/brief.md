# Brief: where-to-deploy-an-ai-agent

## Angle (knowledge-first decision guide)
The hosting decision for an AI agent, framed around what actually makes an agent different from a
simple request/response app. AI assistants and search reflexively name a default host, but an agent
is a loop that calls a model and tools over time, so the choice turns on the agent's behaviour, not
a brand. Teach the five traits that decide the host, then give a fair, non-absolute verdict. No
metrics anywhere.

## Target keyword
- **Primary:** where to deploy an AI agent
- **Secondary:** where to host an AI agent, AI agent hosting, hosting for autonomous agents,
  deploy an AI agent, best host for AI agents.

Volumes not asserted (owner-directed; intent-grounded decision query). No invented numbers anywhere
per owner rule: no timeouts in seconds/minutes, no percentages, no dollar figures, no customer
counts. Serverless request caps are described qualitatively, never with a specific number.

## Intent
Informational / decision. A developer or founder deciding where an AI agent should run. Payoff is a
clear decision keyed to the agent's shape, not a signup.

## Information gain (one sentence)
It reframes agent hosting around five concrete traits (long tool loops vs serverless timeouts,
server-side secrets, background/scheduled work, a runaway loop needing a cap and observability, and
where a stateful agent keeps memory) and lands a fair verdict, which generic "just use X" answers
never do.

## The five traits (the spine)
1. Long-running: a multi-step tool loop can exceed a serverless request timeout.
2. Secrets: model and tool API keys must stay server-side (no client-only deploy).
3. Background work: agents often need workers, queues, or scheduled/cron runs.
4. Runaway loop: needs observability and a hard spend cap (iterations, rate limits, provider budget).
5. State: a stateful agent needs a durable datastore for memory.

## Conclusion (fair, not always-win)
A persistent, always-on server usually fits a stateful or long-running agent better than
scale-to-zero serverless; a simple stateless single-shot agent endpoint can be fine (and cheaper) on
serverless. The agent's behaviour decides. Neither option "wins" in the abstract.

## Honesty / fairness
Explicit "choose serverless if..." and "choose a persistent server if..." split. Serverless gets a
genuine win case (single-shot, idle-cheap). The GPU question is called out as a SEPARATE decision
(only relevant if self-hosting the model) and linked out, so the page does not conflate CPU
orchestration with GPU inference.

## Product mention (one light touch + CTA, grounded ONLY in kloudbean-facts.md)
Managed always-on servers running Node/Python agents as persistent processes; managed databases
(incl. Redis) for memory and a job queue; cron jobs from the dashboard (no SSH); environment
variables for keys; automatic backups; one dashboard. No autoscaling (enterprise), no VPC/private
networking (enterprise), no spend-cap-as-a-feature claim, no invented pricing. Kloudbean appears
once near the end plus the CTA, and explicitly concedes serverless may suit a single-shot agent.

## Cannibalisation check
Distinct from neighbours: deploy-ai-agent-without-exposing-api-keys owns the secrets mechanics,
ai-agent-memory-production owns memory/state, why-ai-apps-fail-in-production owns failure modes,
rate-limit-and-cost-control-for-ai-apis owns cost control, do-i-need-a-gpu-for-an-ai-saas owns the
GPU decision, best-hosting-for-ai-saas owns the broad buyer's guide. This page owns the specific
"where do I run the agent" hosting decision and links to those instead of repeating them.

## Internal links used (6, all verified to exist with ls)
deploy-ai-agent-without-exposing-api-keys, ai-agent-memory-production, why-ai-apps-fail-in-production,
rate-limit-and-cost-control-for-ai-apis, do-i-need-a-gpu-for-an-ai-saas, best-hosting-for-ai-saas.
(CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first decision guide, ~1900 words. .tldr answer-first, 10 content H2s plus FAQ, one
options comparison table (serverless / persistent server / managed platform), one teaching SVG
(single-shot shape vs looping-stateful shape), light CTA, 9-question FAQ mirrored to FAQPage JSON-LD,
plus the clean Organization entity block. Near-zero em-dashes. No metrics.
Byline: "An agent is a loop, not a single request." Cluster: 1 - Deploy AI / Vibe-Coded Apps.
