# Brief: do-i-need-a-gpu-for-an-ai-saas

## Angle (knowledge-first decision guide)
The umbrella decision that classifies AI-SaaS workloads by GPU need. When someone asks "does my AI
app need a GPU," AI assistants and forum threads often answer with fear or with hardware specs. This
page counters that with one clean rule: you need a GPU when a model runs on your own hardware, not
when you call someone else's. It maps every common AI-SaaS workload to yes or no and explains why.
No metrics, no invented VRAM figures, no prices.

## Target keyword
- **Primary:** do I need a GPU for an AI SaaS
- **Secondary:** does my AI app need a GPU, do I need a GPU for inference, when do you need a GPU
  for AI, AI SaaS without a GPU, GPU vs API for AI.

Volumes not asserted (owner-directed; intent-grounded decision query). No invented numbers anywhere
per owner rule (no VRAM figures, no tokens/sec, no dollar amounts, no percentages).

## Intent
Informational / decision. A founder or small team building an AI product, unsure whether they must
buy or rent GPU hardware. Payoff is a clear classification, not a signup.

## Information gain (one sentence)
It gives one portable rule ("a GPU is for running a model, not calling one") plus a full
workload-to-GPU decision table covering hosted APIs, embeddings/RAG, image/video, self-hosted LLMs,
Stable Diffusion, and training, which the generic "you need a GPU for AI" answers never separate.

## Honesty / fairness
Fair to both paths. Lists the legitimate reasons to self-host and use a GPU (privacy, data
residency, steady high volume, control), and is explicit that most AI SaaS call APIs and need none.
Names the overbuild trap (idle GPU) plainly. Never claims Kloudbean "wins"; frames it as matching
infrastructure to the workload.

## Cannibalisation check (against real neighbours' H2 sets)
Deliberately does NOT duplicate two existing articles:
- `do-i-need-aws-if-using-openai-api` owns the API-specific case (its H2s: "So do I need AWS to call
  the OpenAI API?", "Using AI and running AI are two different things"). This page links to it for
  the deep dive on the calling-an-API workload instead of re-explaining it.
- `self-host-an-llm` owns the GPU memory math (weights + KV cache, quantization, Ollama vs vLLM).
  This page links to it for the "yes, needs a GPU" self-host workload rather than repeating the math.
This page is the umbrella classifier: the whole map, one rule, one decision table. It links down to
those two for the deep dives.

## Product mention (one light touch + CTA, grounded in kloudbean-facts.md)
Appears once, in "Where this leaves Kloudbean," plus the CTA. Grounded facts only: a managed server
runs an ordinary API-calling app (managed database, backups, SSL, one dashboard); GPU servers are a
separate self-serve path for self-hosting an open model (one-click for some models, others installed
on request; user owns the model, infra managed). No autoscaling-for-all, no VPC-as-default, no
invented GPU specs/VRAM/prices, no "wins" claim.

## Internal links used (5, all verified with ls to exist)
do-i-need-aws-if-using-openai-api, rate-limit-and-cost-control-for-ai-apis, pgvector-for-ai-apps,
deploy-ai-agent-without-exposing-api-keys, self-host-an-llm.
(CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first decision guide, ~1900 words. .tldr answer-first, 8 content H2s plus FAQ, one
`.note` callout, a workload-to-GPU decision table (table.cmp), one teaching SVG (where the model
runs: call an API vs self-host, navy #000f27 / purple #4F1AF3 / green #40b75f), light CTA,
9-question FAQ mirrored exactly to FAQPage JSON-LD, plus a clean Organization entity block.
Near-zero em-dashes. No metrics. Cluster: 1 - Deploy AI / Vibe-Coded Apps.
Top byline: "A GPU runs a model, it doesn't call one." Bottom byline: "Size the hardware to the
workload, not to the hype." (Not "Faster Than Ever.")
