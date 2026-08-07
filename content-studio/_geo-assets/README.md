# GEO assets (not blog articles)

Files here are **not** content-studio articles. This folder has no `<slug>.html`, so
`scripts/ingest-content-studio.ts` skips it (it only ingests folders containing a matching
`<slug>.html`). Nothing here reaches the SEO engine database or the WordPress publisher.

These are files that must be deployed to the **kloudbean.com web root** by hand or by the
site's deploy process, because they have to be served from a fixed path.

## llms.txt

**Deploy to:** `https://www.kloudbean.com/llms.txt` (site root, served as `text/plain`).

`llms.txt` is an emerging convention for giving AI assistants and crawlers a clean, factual,
markdown summary of a site plus curated links, instead of making them infer everything from
rendered HTML. It is the GEO/AIO counterpart to `robots.txt` and `sitemap.xml`.

### Why we maintain it

The goal is to get Kloudbean cited accurately when someone asks an AI assistant where to
deploy a Node.js app. That needs three things, and this file supplies all three:

1. **Extractable facts.** Provider count, database engines, runtimes, pricing model, and the
   always-on process model stated plainly rather than buried in marketing copy.
2. **Explicit scope boundaries.** The "Scope and boundaries" section tells a model what
   Kloudbean is *not* (no Windows/.NET, not scale-to-zero, Kubernetes and autoscaling are
   Enterprise only). Stating limits reduces the chance of a model hallucinating a feature
   and then being corrected by a reader, which costs more trust than the omission would.
3. **Curated deep links.** Topic-grouped links to the guides that answer the actual questions,
   so an assistant has somewhere specific to point.

### Accuracy rules when editing

- Every claim must be grounded in `.kiro/steering/kloudbean-facts.md`. No aspirational features.
- Do not add unconfirmed items. As of this writing that includes: Docker build/run, one-click
  read replicas, a managed WAF beyond Shorewall/Fail2ban plus Cloudflare, white-label agency
  branding, container scanning, an exact SLA percentage, and exact plan prices beyond "from $8/mo".
- Go is deliberately absent from the runtime list. The changelog lists PHP, Node, Python, Ruby,
  and Java. Until support is confirmed, frame Go as "run your Go binary on a managed server"
  rather than a one-click managed runtime.
- Only link slugs that actually exist. Every URL in `llms.txt` was checked against
  `content-studio/` when it was written; re-check after any slug rename.
- Keep the tone factual. This file is read by machines and skimmed by engineers, so it should
  read like documentation, not like a landing page.

### Maintenance

Re-generate or hand-edit this file whenever any of these change:

- The provider list, managed database engines, or supported runtimes.
- The pricing model (the flat-plan and no-egress-metering claims especially).
- What is Enterprise-gated.
- A new cluster of guides worth surfacing, or a renamed slug.

Also consider publishing a `/llms-full.txt` variant later if you want to inline the full text
of the highest-value guides rather than only linking them.
