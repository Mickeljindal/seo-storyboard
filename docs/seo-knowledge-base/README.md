# SEO Knowledge Base

Owner-supplied SEO and content-strategy research, stored here as the reference layer for
the content engine and for anyone (human or agent) planning content for Kloudbean.

## Provenance and restriction

These documents are an **independent operational framework** synthesised by the Kloudbean
owner from publicly available SEO guidance. They are stored here on that basis.

Carried over verbatim from the source policy file, because it governs how this material may
be used:

> Do not reproduce, paraphrase closely, or claim to have ingested proprietary or copyrighted
> Backlinko content. Treat this document as an independent operational framework.

So, concretely:

- Do **not** state or imply anywhere in published content, commit messages, or product copy
  that Kloudbean has crawled, ingested, licensed, or partnered with Backlinko or any other
  publisher.
- Do **not** reproduce long passages from any third-party SEO publisher.
- Treat the principles here as our own operating rules, expressed in our own words. That is
  what they are.
- The third document is a *specification for a hypothetical future ingestion pipeline*. It
  describes what a permitted, licence-reviewed crawl would have to do. Nothing in this repo
  currently performs such a crawl, and none should be built without a licence review first.

## Files

| File | What it is |
|---|---|
| `01-seo-engine-policy.json` | The operational policy. Priority order, content decision rules, opportunity scoring formula, intent classes, on-page policy, generation contract, pre-publish gate. This is the machine-readable core. |
| `02-knowledge-graph.md` | The conceptual model. Entity relationships, the idea-to-asset production flow, content quality dimensions, on-page and AI-citation layers, authority earning, the measurement and refresh loop. |
| `03-rag-ingestion-spec.md` | A specification for a future permitted-source ingestion pipeline: two-layer authority model, discovery protocol, concept coverage matrix, chunking rules, retrieval design, quality gates. Aspirational, not implemented. |
| `04-library-audit.md` | The 288 published articles measured against the standard, 2026-08-01. What was clean, what was actually broken, and the three findings that turned out to be measurement errors. Rerun the truthfulness portion with `npm run audit:claims`. |

## How this is actually wired into the repo

Storing research in a folder changes nothing on its own. These are the four places the
material is enforced, and they must stay in agreement:

| Where | What it enforces | Applies to |
|---|---|---|
| `.kiro/steering/seo-operating-system.md` | The decision layer. Whether a page should exist at all, opportunity scoring, authority precedence between knowledge layers, drafting constraints, refresh decisions, the pre-publish gate. | The agent, automatically, on every content task |
| `.kiro/steering/article-quality-playbook.md` | Voice, structure, humanisation, visual building blocks, internal linking, validation. | The agent, automatically |
| `.kiro/steering/kloudbean-facts.md` + `kloudbean-enterprise-compliance.md` | Product truth. The only source allowed to determine what Kloudbean does. | The agent, automatically |
| `src/lib/content-engine.ts` | `HUMAN_STYLE`, `EDITORIAL_STANDARD`, `STRATEGY_CONTRACT` injected into every generation pass. | The automated writer |
| `src/lib/content-scorecard.ts` | Deterministic pass/fail gate. Failures feed the auto-revise loop; banned claims block publishing outright. | The automated writer |
| `wordpress-plugin/kloudbean-seo-engine/includes/seo-score.php` | The on-page score shown in WordPress. | Published pages |

**Rule:** if you change the writing standard in one of those places, change it in all of them.
A writer that aims at one bar while the gate measures another produces drafts that fail for
reasons the writer was never told about.

## The single most important idea in here

The authority-layer separation. Different kinds of knowledge are allowed to decide different
things, and mixing them is how AI-generated SEO content becomes confidently wrong:

- General SEO practice may decide **how we work**: research approach, page structure, quality
  checks, link-earning patterns.
- It may **never** decide what Kloudbean does. Only the product truth files can do that.
- Live SERP evidence decides **intent and format**, not timeless SEO law.
- Primary vendor documentation decides **technical behaviour**, not Kloudbean support scope.

When two layers disagree: product truth wins for product claims, live SERP data wins for
intent and format, primary documentation wins for technical behaviour.
