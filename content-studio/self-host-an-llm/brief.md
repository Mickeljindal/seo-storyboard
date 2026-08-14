# Brief: self-host-an-llm

## Target keyword
- **Primary:** self-host an LLM
- **Secondary (by intent):**
  - self-hosted LLM (informational, decision)
  - run your own AI model (informational)
  - self-host AI model (informational)
  - private LLM (privacy/sovereignty intent)
  - GPU server for AI (capability/what-you-need intent)
  - host an LLM (informational)

Volumes not asserted. Honest note on data: the `kloudgraph-semrush-export/` gap data does
not cover GPU-cloud / self-hosted-model demand, because its tracked competitors are managed
hosts (Cloudways and similar), not GPU clouds or inference platforms. So keyword volume/KD for
this topic is not in that export. This page is owner-directed (the Aug 2026 GPU + self-hosted
LLM capability confirmation) and intent-grounded (a real, recurring build-vs-buy question for
teams shipping AI features). No invented volumes.

## Intent
Decision + capability hub. Reader is an engineer or founder deciding whether to self-host an
open model or call a hosted API, and, if self-hosting, what they need and how to run it on
Kloudbean. Not a step-by-step.

## Cannibalisation check (mandatory)
- **self-host-ollama-open-webui** already OWNS the concrete step-by-step: what Ollama vs Open
  WebUI each do, the one-click Open WebUI + DeepSeek deploy, the private-vs-public topology, the
  team-access walkthrough. This pillar must NOT repeat those steps. Resolution: this page is the
  broader hub (the decision, GPU sizing, the *ways* to run a model, serving it to your app, the
  sovereignty/VPC angle, cost). It links DOWN to self-host-ollama-open-webui as "the concrete
  Ollama and Open WebUI walkthrough" instead of duplicating it.
- **host-ai-chatbot-in-production** owns the production chatbot architecture (request path,
  Postgres history, Redis, auth). Distinct: that assumes you call a model; this decides whether
  the model is self-hosted at all. Not linked to avoid over-linking; different intent.
- **rag-in-production / pgvector-for-ai-apps / ai-agent-memory-production** own retrieval and
  memory. This page treats the model as one component and links out to those for the surrounding
  stack (pgvector + reference architecture linked). No overlap.
- **hosting-ai-apps-saudi-arabia / what-is-a-vpc / data-residency-saudi-arabia** own the
  residency/VPC concepts. This page uses the sovereignty angle lightly and links to them rather
  than re-explaining. VPC scoped as Enterprise, never default.
- Distinct hub intent confirmed: "should I self-host, and how do the options compare" vs the
  Ollama page's "here is how to stand up Ollama + Open WebUI".

## Information gain (one sentence)
An honest self-host-vs-hosted-API decision framework (privacy, residency, and cost-at-volume,
with a clear founder position and an undersized-GPU anti-pattern) tied to the concrete ways to
run an open model on Kloudbean and serve it to an app, which the scattered forum answers and
tool docs don't assemble in one place.

## Product claims note
All claims trace to kloudbean-facts.md (GPU / one-click / support-install / Enterprise-VPC all
owner-confirmed Aug 2026):
- GPU servers, self-serve, run ANY open model.
- One-click DeepSeek (r1-1.5b) + Open WebUI from the console tool picker; any other or custom
  model installed by support on request (start a chat).
- Model runs on a GPU server the user provisions. Enterprise: private VPC + region pinning
  (Dammam or any). VPC scoped Enterprise; region pinning general across the 7 clouds.
- 7 clouds listed. Enterprise/bigger workloads standardize on AWS or GCP, "no fixed product-tier
  ceiling, scales with your plan and the underlying AWS/GCP capacity" (NOT a bare "no limits").
- Managed boundary: server, stack, free SSL, patching, server backups + can install the model;
  user owns model, prompts, data, and ongoing GPU sizing/cost. NOT a per-token API vendor; does
  not fine-tune/build the model.
- Managed Postgres + pgvector for RAG; IP allow-listing as the standard default lock-down. Free
  migration. Standard plans from $8/mo, verify current pricing on the pricing page.
- Sizing kept qualitative only (7B modest GPU / 13B more / 30B+ serious). No invented GPU
  models, VRAM, tokens/sec, prices, benchmarks, or customers.
- Banned-claim classes avoided (no guaranteed uptime/SLA %, no "certified", "100% secure",
  "never fails", "industry-leading", "most secure", "only provider", "makes you compliant",
  "unlimited", or bare "no limits").

## Internal links used (8, all from the approved list)
1. self-host-ollama-open-webui (link DOWN, the concrete walkthrough)
2. llm-streaming-in-production (serving)
3. rate-limit-and-cost-control-for-ai-apis (serving/cost)
4. deploy-ai-agent-without-exposing-api-keys (key safety)
5. hosting-ai-apps-saudi-arabia (sovereignty)
6. what-is-a-vpc (VPC angle, Enterprise-scoped)
7. pgvector-for-ai-apps (RAG / bigger app)
8. ai-app-reference-architecture (bigger app)

## Format
Decision-guide / capability-hub (NOT step-by-step). ~2000 words. .tldr, three tables
(self-host-vs-API decision, model sizing, ways to run a model), one bespoke inline SVG decision
flow, 5 image references (2 real console screenshots: add-server, launch-database; 3 empty
img-slots), a "Where hosting fits, honestly" boundary section, CTA, and a 10-question FAQ.
Byline tagline: "By Kloudbean Engineering · You own the model, we run the box it lives on."
