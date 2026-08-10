# RAG Ingestion and Coverage Specification

> **STATUS: SPECIFICATION ONLY. NOT IMPLEMENTED.**
>
> This document describes what a permitted, licence-reviewed source-ingestion pipeline would
> have to do if one were built. Nothing in this repository currently crawls any third-party
> publisher, and nothing should be built to do so without a licence and Terms of Use review
> first. See `README.md` in this folder.
>
> The parts of this spec that are **already in force** are the authority-layer model (section 1)
> and the retrieval anti-patterns (section 6). Those are encoded in
> `.kiro/steering/seo-operating-system.md` and apply today. The rest is forward-looking design.

## Purpose

Close the gap between a *strategy playbook* and a system that has genuinely processed a body of
SEO knowledge. It covers how such a system would discover permitted source pages, extract
concepts without copying source prose, version its knowledge, retrieve the right guidance at
generation time, and prevent omissions.

---

## 1. Architecture: Two Knowledge Layers (IN FORCE)

Do **not** place external SEO practice material and Kloudbean product facts in one
undifferentiated store. They have different authority, freshness, and use.

```text
                         ┌──────────────────────────────┐
                         │  Source discovery + crawler   │
                         │ sitemap / hubs / URLs / feeds │
                         └──────────────┬───────────────┘
                                        │
              ┌─────────────────────────┴─────────────────────────┐
              │                                                   │
  ┌───────────▼───────────┐                           ┌───────────▼───────────┐
  │ External SEO library   │                           │ Kloudbean truth layer  │
  │ approved primary       │                           │ Product / customer /   │
  │ sources                │                           │ site / performance     │
  └───────────┬───────────┘                           └───────────┬───────────┘
              │                                                   │
              ▼                                                   ▼
    Concept extraction + evidence                       Structured factual records
    Source URL/date/version                             Owner/effective date/approval
              │                                                   │
              └───────────────────┬───────────────────────────────┘
                                  ▼
                    Strategy reasoning and retrieval layer
                    (intent + task + content role + freshness)
                                  │
                                  ▼
                         Brief / plan / draft / QA
```

### Authority policy

| Knowledge layer | May determine | May not determine |
|---|---|---|
| External SEO practice library | SEO workflows, research approaches, content and UX ideas, quality checks, link-earning patterns | Kloudbean features, pricing, service limits, client outcomes, security or compliance claims |
| Kloudbean product truth | Product claims, CTAs, plan details, supported stacks, service process | General ranking claims unless supported separately |
| Kloudbean customer truth | ICP language, pains, objections, use cases, conversion priorities | Factual claims about the broader market without validation |
| Live SERP and performance data | Intent, current ranking formats, opportunity, competitive context, refresh decisions | Timeless "SEO law" or product facts |
| Primary technical sources | Vendor, API, and framework behaviour and configuration | Kloudbean-specific support guarantees |

When layers conflict: current Kloudbean product truth wins for Kloudbean claims; current live
SERP data wins for intent and format; primary technical documentation wins for technical behaviour.

---

## 2. Complete Discovery Protocol (not implemented)

Any importer must use **multiple discovery paths**. Relying on a home page or a few search
results guarantees missed pages.

### Required discovery sources

1. `robots.txt` to locate sitemap declarations and respect disallow rules.
2. XML sitemap index and every child sitemap, collecting canonical URLs and modification dates.
3. Main navigation and hub pages.
4. Site search and paginated archives, to reach older material absent from current navigation.
5. RSS or Atom feeds and category archives where available.
6. Internal links from every permitted fetched page.
7. Redirect checks, preserving historic to canonical URL relationships without indexing duplicates.
8. Scheduled update monitoring of the sitemap and key hubs.

### Page inclusion policy

Include a URL only if it is public, crawl-permitted, canonical, and substantive. Exclude login,
account, checkout, duplicate print variants, empty tag archives, search-result pages, author
pages, and legal pages unless explicitly approved.

### Discovery record

```json
{
  "source": "",
  "url": "",
  "canonical_url": "",
  "title": "",
  "page_type": "guide|hub|template|tool|case_study|glossary|blog|archive",
  "discovered_from": ["sitemap", "hub", "internal_link", "rss"],
  "lastmod_source": "",
  "crawl_allowed": true,
  "fetch_status": "queued|fetched|skipped|failed",
  "content_hash": "",
  "fetched_at": ""
}
```

---

## 3. Concept Coverage Matrix

Track coverage at the concept level, not by counting pages. One page can populate many concepts.

| Domain | Required concepts | Strategy-engine use |
|---|---|---|
| SEO foundations | How search discovers, crawls, indexes, ranks, presents results; user intent | Diagnose whether a visibility issue is content, technical, authority, or SERP-fit |
| Keywords and demand | Seed research, modifiers, long tail, questions, trends, volume, difficulty, business value | Generate and prioritise realistic candidates |
| Search intent and SERPs | The four intent classes, mixed SERPs, format, PAA, snippets, video, forums | Select page type, outline, CTA, update decision |
| Audience research | Segments, jobs-to-be-done, awareness, pains, objections, language, decision criteria | Keep content buyer-relevant, not keyword-only |
| Content strategy | Goals, positioning, content roles, clusters, pillars, calendars, distribution | Build a coherent roadmap |
| Content ideation | Competitors, communities, customer sources, gaps, trends | Build an evidence-based backlog |
| Content writing | Hooks, outlines, clear writing, editing, readability, examples, evidence, CTAs | Generate useful original drafts and QA |
| On-page SEO | Title, meta, URLs, headings, copy, semantic coverage, images, alt text, links, UX | Page-level optimisation recommendations |
| Information quality | Original research, experience, expertise, trust, sources, accuracy, freshness | Require defensible information gain |
| Technical SEO | Crawlability, indexation, robots, sitemaps, canonicals, redirects, rendering, CWV, mobile | Stop technical blockers invalidating content spend |
| Site architecture | Navigation, hierarchy, click depth, orphan pages, silos, internal-link equity | Build the URL and link graph |
| Structured data | Schema eligibility, visible-content alignment, validation, constraints | Recommend accurate, not manipulative, schema |
| Link earning | Linkable assets, research, outreach, digital PR, resource pages, unlinked mentions | Plan ethical authority growth |
| Brand and AI visibility | Entity clarity, brand mentions, citable passages, answer-first chunks | Improve discovery beyond ten blue links |
| Vertical SEO | SaaS and B2B, ecommerce, local, international, video where relevant | Apply only relevant modules |
| Analytics and measurement | Search Console, analytics, CTR, conversion, assisted conversion, decay | Decide what to create, refresh, consolidate, stop |
| Competitive research | Competitor content map, gap analysis, positioning, SERP versus business competitors | Create a differentiated angle |
| Audits and operations | Baseline audits, checklists, workflow, governance, refresh cadence | Operate reliably at scale |
| Risk and policy | Spam avoidance, copyright, false claims, privacy, security and legal review | Produce safe, credible work |

### Completion gate

A domain counts as covered only when: a source has been ingested, classified and versioned; the
engine holds a principle, decision rule, implementation checklist and example task type; a
"when not to use" rule exists where relevant; a test query retrieves it when relevant and not
when irrelevant; and a human reviewer has approved it.

---

## 4. Ingestion Data Model

### Concept record (the durable unit)

```json
{
  "concept_id": "seo.on_page.semantic_chunking",
  "label": "Semantic content chunking",
  "domain": "on_page_seo",
  "definition": "",
  "principle": "",
  "when_to_apply": [],
  "when_not_to_apply": [],
  "implementation_steps": [],
  "quality_checks": [],
  "risks_limitations": [],
  "source_documents": [],
  "source_urls": [],
  "last_verified": "",
  "freshness_class": "evergreen",
  "confidence": "high",
  "approved_by": ""
}
```

### Kloudbean fact record

```json
{
  "fact_id": "kloudbean.product.supported_apps",
  "entity": "Kloudbean",
  "attribute": "supported_applications",
  "value": "",
  "effective_from": "",
  "verified_at": "",
  "owner": "product|support|legal|security",
  "source_of_truth_url_or_doc": "",
  "approval_status": "approved|draft|expired",
  "allowed_use": ["product_page", "blog", "comparison", "sales"],
  "required_disclaimer": ""
}
```

---

## 5. Chunking Rules That Preserve Meaning

Do not chunk by fixed token count alone. SEO advice is conditional, and separating a rule from
its caveat creates bad strategy.

```yaml
chunk_target_size: 450-900_tokens
chunk_overlap: 80-150_tokens
preserve:
  - title
  - heading_path
  - ordered_step_sequence
  - table_headers
  - caveats_and_exceptions
  - source_url
  - source_updated_date
never_split:
  - definition from limitation
  - instruction from safety condition
  - metric from methodology
  - comparison conclusion from its criteria
```

---

## 6. Retrieval Design (anti-patterns IN FORCE)

### Pipeline

```text
Request
  → classify: strategy | audit | brief | outline | draft | refresh | link plan | technical QA
  → extract constraints: ICP, product, page type, geography, funnel stage, topic, existing URL
  → retrieve Kloudbean truth records FIRST
  → retrieve current site / performance / SERP records
  → retrieve relevant SEO concepts and checklists
  → rerank: authority + task fit + freshness + explicit caveats + applicability
  → resolve conflicts and identify missing data
  → produce evidence-aware recommendation
```

### Retrieval rules

- A content brief must consider intent and SERP, content strategy, on-page, internal linking, information quality, and conversion.
- A technical audit must consider crawl and index, canonical and duplicate, performance and mobile, architecture, and structured data. It must not invent findings without crawl data.
- A link-earning plan must consider asset creation, outreach, brand mentions, and the relevant cluster.
- A product or article draft must consult approved Kloudbean facts before external SEO concepts.

### Retrieval anti-patterns (these apply today)

- Do not apply generic "write SEO content" guidance to a technical migration guide without product and technical context.
- Do not use a content-writing concept as evidence for a ranking-factor claim.
- Do not use third-party SEO guidance to state that Kloudbean supports a feature.
- Do not let surface similarity override freshness, source authority, or applicability.

---

## 7. Quality Gates

**Ingestion:** canonical URL resolved, dates stored, hierarchy and tables preserved, concepts
carry sources and caveats, no source text used beyond policy allowance, content hash saved,
page classified.

**Retrieval:** guidance matches the requested task and page type, product claims came from the
Kloudbean truth layer, current evidence used for current claims, contradictions surfaced rather
than silently averaged.

**Generation:** clear problem, audience, intent and business reason; one primary intent per URL
with a cannibalisation check; a real information-gain contribution; all product, statistical,
security and compliance claims verified or flagged; no keyword stuffing, copy-like paraphrase,
fake citations or ranking guarantees; internal links, CTA, visuals, metadata and measurement
plan present.

---

## 8. Freshness and Change Management

| Item | Frequency | Action if changed |
|---|---:|---|
| Source sitemap and hub index | Weekly | Queue newly discovered or modified permitted pages |
| Time-sensitive SEO guidance | Quarterly | Revalidate against current primary sources and SERP conditions |
| Kloudbean product facts | Every release, at least monthly | Expire affected content claims and reapprove |
| Live SERP snapshots for priority queries | Monthly, weekly for flagship commercial queries | Reassess intent, format, competitors, CTR framing |
| Search Console and conversion data | Weekly or monthly | Trigger optimise, upgrade, consolidate decisions |
| Published evergreen articles | 6 to 12 months, faster for technical and security topics | Refresh sources, screenshots, examples, claims, links |

When a source changes, compare semantically rather than only re-embedding: added or removed
headings, changed definitions, steps, dates, statistics, examples, new caveats, and changes that
invalidate existing engine rules. Mark affected concepts `review_required` until approved.

---

## 9. Validation Test Suite

| Test question | Expected behaviour |
|---|---|
| "Write 20 posts about cloud hosting." | Asks or infers business objective, ICP, site inventory and opportunity data; proposes a cluster roadmap, not random titles |
| "Create a Node.js hosting article." | Requests verified feature data and live SERP evidence; produces a brief before drafting |
| "Our page is not ranking." | Does not assume content is the issue; requests crawl, indexation, GSC, SERP, link and cannibalisation data |
| "Add a claim that Kloudbean is SOC 2 compliant." | Blocks unless an approved compliance fact exists |
| "Make this keyword-rich." | Optimises clarity, intent, entities, headings, links and usefulness; refuses stuffing |
| "What should we update first?" | Uses traffic, conversion, decay and strategic value to produce a prioritised refresh queue |
| "How do we earn links?" | Recommends a worthwhile asset plus relevant audience and ethical outreach; never suggests buying links |

---

## 10. Minimum Launch Checklist (if this is ever built)

- [ ] Permitted source-discovery method, licence and Terms of Use review completed
- [ ] All discovered source URLs catalogued, deduplicated, classified, versioned
- [ ] Concept-coverage matrix shows no unreviewed high-priority gaps
- [ ] Product-truth database has owner, effective date and approval status for every publishable claim
- [ ] Full Kloudbean crawl and URL inventory ingested
- [ ] Search Console, analytics, conversion and CRM data connected or documented as unavailable
- [ ] Live SERP collector works by target country, language and device
- [ ] Claim register and human approval workflow enabled
- [ ] Retrieval evaluation set passes for strategy, brief, draft, technical audit and refresh
- [ ] Publishing requires human approval until output accuracy is proven over a meaningful sample

---

## Core Principle

An external SEO-practice library should be **one input, not the engine's only brain**. It creates
impact only when combined with Kloudbean's verified product, customer and site data plus current
SERP and performance evidence, then governed by a workflow that favours original, useful,
trustworthy content over automatic volume.
