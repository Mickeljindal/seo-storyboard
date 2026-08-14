# Brief: self-host-an-llm

## Angle (rewritten knowledge-first, Aug 2026)
Reworked after owner feedback that the first draft read salesy (feature assertions, a
"ways to run it on Kloudbean" table, product mid-article). This version teaches the real
engineering and lets Kloudbean be discovered once at the end.

## Target keyword
- **Primary:** self-host an LLM
- **Secondary (by intent):** self-hosted LLM, how much GPU memory to run an LLM, Ollama vs vLLM,
  LLM quantization, run your own AI model, GPU server for AI.

Volumes not asserted. The `kloudgraph-semrush-export/` gap data does not cover GPU-cloud /
self-hosted-model demand (its tracked competitors are managed hosts, not GPU clouds or inference
platforms), so this is owner-directed + intent-grounded, not gap-scored. No invented volumes.

## Intent
Knowledge-first field guide for an engineer deciding whether and how to self-host an open model.
The payoff is understanding, not a signup. Useful to a reader who never touches Kloudbean.

## Information gain (one sentence)
It teaches the arithmetic that actually decides a self-hosted LLM setup, GPU memory = weights
(params x bytes/param) + KV cache, quantization as the lever that moves the floor, why decode is
memory-bandwidth-bound, Ollama vs vLLM as different tools, and a cost METHOD (not a made-up
number), which scattered tool docs and forum threads never assemble in one place.

## Knowledge it delivers (the "magic", all checkable)
- Memory math: 7B ~14GB at 16-bit, ~4GB at 4-bit; 13B and 70B by the same rule; KV cache grows
  with context length and concurrency.
- Quantization: FP16/INT8/4-bit bytes-per-weight, GGUF vs GPTQ/AWQ, the quality tradeoff, and the
  "bigger model at 4-bit beats smaller at full precision" rule.
- Ollama (llama.cpp, GGUF, CPU offload, single-user) vs vLLM (PagedAttention, continuous batching,
  concurrency, wants full model in VRAM).
- Serving: OpenAI-compatible endpoint, backend-not-browser, stream, keep key server-side.
- Why slow / why it fails: decode is memory-bandwidth-bound; OOM and its fixes; the 70B-on-24GB trap.
- Cost method: flat GPU vs per-token API, compute your own crossover; no invented figure.

## Product mention (deliberately minimal)
Kloudbean appears only in "Where to run it" (one sentence: managed GPU servers across clouds/regions,
DeepSeek one-click if you want the fastest start) and a short low-key CTA. No feature-line blurb, no
one-click/support/VPC drumbeat through the body. VPC not asserted here; region pinning stated plainly.
No SLA/"no limits"/"certified"/"unlimited". GPU sizing kept to real arithmetic, no invented
GPU models, VRAM per card, tokens/sec, or prices.

## Cannibalisation check
- self-host-ollama-open-webui owns the concrete Ollama + Open WebUI walkthrough. This page is the
  knowledge/decision layer (memory, quantization, engine choice, cost) and links to it for the build.
- rag-in-production / pgvector-for-ai-apps / ai-app-reference-architecture own the surrounding stack;
  linked, not duplicated.
- llm-streaming-in-production / rate-limit-and-cost-control-for-ai-apis own serving concerns; linked.

## Internal links used (7)
self-host-ollama-open-webui, pgvector-for-ai-apps, ai-app-reference-architecture,
llm-streaming-in-production, rate-limit-and-cost-control-for-ai-apis, deploy-ai-agent-without-exposing-api-keys,
(plus the CTA links to kloudbean.com and /pricing/).

## Format
Knowledge-first field guide. ~2000 words prose. .tldr, three tables (memory-by-precision,
Ollama-vs-vLLM, and the model-size math), one teaching SVG (what fills GPU memory), code blocks
(OpenAI-compatible curl + .env), a light "Where to run it" + CTA, and a 9-question knowledge FAQ.
Byline: "The constraint is memory, and memory is arithmetic."
