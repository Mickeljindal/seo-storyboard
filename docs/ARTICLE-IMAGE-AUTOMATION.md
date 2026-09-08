# Article image automation

How the `.img-slot` placeholders in `content-studio/*` get turned into real images,
what is already done, and the one command left to run.

## The idea

Every article carries `.img-slot` placeholders. Each one already contains the
description the editor wrote ("a redis-cli session running INCR, ZADD, then GET").
That description is the spec, so the images can be generated from it.

Three renderers, chosen per slot by what the description actually asks for:

| Renderer | Used for | Cost |
|---|---|---|
| **HTML/CSS + SVG**, rasterized by Playwright | terminals, graphs, comparison tables, config panels, flows, fan-outs | free. A **local** LLM writes the content, so no API and no credit |
| **Real support screenshots** | slots asking for the Kloudbean console | free, no model at all |
| **Local image model** (mflux on the Mac GPU) | genuinely pictorial slots | free, no API, ~11 min/image. Currently unused: the library has no purely pictorial slots |

Everything runs **on this machine**. Nothing calls a paid API.

The split is the important part. A raster image model garbles text, and garbled
labels are the clearest "this is AI" tell there is. So anything whose value is
EXACT TEXT (a command, an axis label, a table) is rendered as HTML/SVG at retina
scale instead, and the image model is reserved for textless illustration.

## The local model (this is what makes it free)

A local `mlx_lm.server` writes the specs. Start it before generating:

```
.venv-image/bin/mlx_lm.server --model mlx-community/Qwen2.5-7B-Instruct-4bit --port 8081
```

`spec-from-slot.mjs` probes `http://127.0.0.1:8081/v1/models` and prefers it
automatically, falling back to a hosted API only if the local server is not
running. Set `IMAGE_SPEC_FORCE_REMOTE=1` to skip the local path.

Qwen2.5-7B-4bit is ~4.3 GB and peaks around 4.4 GB of memory, so it sits
comfortably alongside everything else on 24 GB. A spec takes 3 to 14 seconds.

## What is already done

- **591 images generated locally** across 228 articles: 270 flows, 128 terminals,
  101 comparison tables, 51 config panels, 36 charts, 2 timelines, 2 fan-outs, 1 bar chart.
- **18 console slots** filled with real `support.kloudbean.com` screenshots.
- All 8 templates built, verified, and bug-fixed against real output.
- **All 396 unpublished articles pass the validator.**

Review what was produced: `content-studio/_generated-images-review.html`

## What is deliberately NOT generated

**Nothing generatable is left.** The only remaining placeholders need a camera, not
a renderer:

| Count | What | Why |
|---|---|---|
| 23 | browser windows (devtools, address bar, tab sprawl) | a generated browser is a lie a reader can spot |
| 15 | another product's UI (Open WebUI, Metabase, Strapi) | same reason, and we cannot fake someone else's product |
| 5 | console shots that are not actually ours | substituting a Kloudbean screen would mislead |

All 43 carry a written capture instruction (see below).

## Picking the right shape matters more than the render quality

The four charts that kept failing were not a model problem, they were a
CLASSIFICATION problem. Each one was being forced into a line chart when it was
really something else:

| Slot asked for | Was | Should have been |
|---|---|---|
| "a short storage bar next to a tall egress bar" | line chart | `bars` |
| "a before and after uptime timeline, one with a red outage gap" | line chart | `timeline` |
| "a naive deploy beside an overlapping deploy" | line chart | `timeline` |
| "a normal baseline, then a sharp wall of requests" | line chart | `graph`, but with a real baseline and a steep spike |

So `bars` and `timeline` were added. A line chart plots ONE quantity over time;
`bars` compares magnitude between named things; `timeline` shows two scenarios over
elapsed time so the reader can see one has a gap and the other does not.

If a generated chart looks unconvincing, check the classification first. Re-rolling
the same wrong shape will not help.

## Paste-ready prompts for doing it by hand

Every unfilled slot now carries a written prompt, so no one has to re-read the
article to make its image:

- **In the article**, as an HTML comment directly above the placeholder.
- **Collected** in `content-studio/_IMAGE-PROMPTS.md`, one section per article.

Regenerate them any time with `node scripts/write-image-prompts.mjs`.

Two kinds, and the difference matters:

| Kind | Count | Meaning |
|---|---|---|
| **GENERATE** | 593 | A diagram, chart, table, panel or terminal. Paste the prompt into ChatGPT, or let `generate-article-images.mjs` build it from HTML/CSS. |
| **CAPTURE** | 43 | A real browser window or another product's UI. **Do not generate these.** An invented screenshot of someone else's product is something a reader can catch, so the instruction says what to photograph and reminds you to blur credentials. |

Each GENERATE prompt already carries the brand palette, the aspect ratio, the
per-type art direction, and a "do not invent numbers, prices, or benchmarks" line.

## Running it

```
# start the local spec model first
.venv-image/bin/mlx_lm.server --model mlx-community/Qwen2.5-7B-Instruct-4bit --port 8081

node scripts/generate-article-images.mjs --all           # everything outstanding
node scripts/generate-article-images.mjs --all --limit 10 # a few at a time
node scripts/generate-article-images.mjs <slug>           # one article
node scripts/generate-article-images.mjs <slug> --dry     # show, change nothing
```

Safe to re-run: it only touches slots that still hold a placeholder, so a second
pass retries whatever failed. Published articles are skipped automatically
(`content-studio/_published.json`).

Throughput is roughly 200 images per hour on an M5 Pro.

## The scripts

| Script | Job |
|---|---|
| `scripts/plan-article-images.mjs` | inventory + classify every slot, writes `.local/image-plan.json` |
| `scripts/generate-article-images.mjs` | the orchestrator: generate, swap the slot for a real `<figure>`, sync the `.md` |
| `scripts/fill-console-slots.mjs` | fill console slots from the screenshot map (no AI) |
| `scripts/write-image-prompts.mjs` | write paste-ready prompts / capture instructions into every unfilled slot (no AI) |
| `scripts/gen-image-review.mjs` | build the visual review page |
| `scripts/lib/visual-templates.mjs` | the 5 templates (terminal, graph, comparison, panel, flow) |
| `scripts/lib/render-visual.mjs` | Playwright rasterizer, retina PNG |
| `scripts/lib/spec-from-slot.mjs` | asks the AI for CONTENT only, against a strict schema |
| `scripts/lib/local-image.mjs` | local model generation |

## Local model

Installed at `.venv-image` (Python 3.12 + mflux + MLX Metal).

Note: **FLUX.1-schnell is gated on HuggingFace** (401 without a licence
acceptance), so this uses **Tongyi-MAI/Z-Image-Turbo**, which is ungated and
MLX-native. Weights are ~31 GB in `~/.cache/huggingface`, already downloaded.

Roughly 8 minutes per 1200x672 image on an M5 Pro. Only 7 slots in the whole
library need it, so that is a one-off, not a bottleneck.

```
node -e 'import("./scripts/lib/local-image.mjs").then(m=>m.generateLocalImage({
  hint:"abstract illustration of data flowing into a secure server",
  outPath:"/tmp/test.png"}))'
```

## Design rules worth keeping

1. **The AI never writes markup.** It returns a small JSON spec; a fixed template
   renders it. That is why hundreds of images come out visually consistent and
   nothing can drift into broken HTML.
2. **Specs are sanitized before rendering** (`sanitizeSpec`). Over-long edge
   labels, wrong-length arrays, non-numeric series and placeholder headers are all
   corrected there rather than in the template.
3. **`max_tokens` uses a ladder** (650 → 400 → 300 → 220) and retries on HTTP 402,
   so a thin credit balance produces a terser diagram instead of a hard failure.
4. **Never substitute a Kloudbean screen for a third-party one.** See `NOT_OURS`
   in `fill-console-slots.mjs`.
5. **The `.md` mirror is matched on marker text, not position.** The markers and
   the HTML slots are not guaranteed to be in the same order, so positional
   replacement can drop an image in the wrong place.
