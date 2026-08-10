# SEO & Content Writing Knowledge Graph

> **Purpose:** A practical knowledge graph for planning, publishing, scaling, and measuring
> content that earns organic visibility, qualified demand, links, brand mentions, and AI citations.
>
> **Scope and provenance:** An independent operating model synthesised from publicly available
> SEO strategy, on-page SEO, content-writing, and link-building guidance, adapted for a cloud
> hosting SaaS. It is not a crawl or reproduction of any publisher's pages. See `README.md`
> in this folder for the restriction that governs use of this material.

---

## 1. Master Knowledge Graph

```mermaid
flowchart TD
    A[Business outcomes] --> B[SEO strategy]
    B --> C[Audience intelligence]
    B --> D[Topic & keyword opportunity]
    C --> D
    D --> E[Intent & SERP analysis]
    E --> F[SEO content brief]
    F --> G[Authority-driven content production]
    G --> H[On-page + AI visibility optimization]
    H --> I[Publish & technical readiness]
    I --> J[Distribution & promotion]
    J --> K[Links, mentions & co-citations]
    K --> L[Authority & discoverability]
    L --> M[Rankings, AI citations & qualified traffic]
    M --> N[Conversions, revenue & brand demand]
    N --> O[Measurement & learning]
    O --> P[Optimize, upgrade, rewrite, consolidate]
    P --> E

    C --> C1[Sales calls]
    C --> C2[Support tickets]
    C --> C3[Reviews]
    C --> C4[Communities & social]
    C --> C5[Surveys & interviews]

    D --> D1[Seed topics]
    D --> D2[Competitor pages]
    D --> D3[Autocomplete & PAA]
    D --> D4[Reddit / YouTube / LLM prompts]
    D --> D5[Volume, difficulty, CPC & intent]

    E --> E1[Dominant format]
    E --> E2[Depth & subtopics]
    E --> E3[SERP features]
    E --> E4[Content gaps]
    E --> E5[Evidence & UX gaps]

    G --> G1[First-hand experience]
    G --> G2[Original data / research]
    G --> G3[Expert input]
    G --> G4[Frameworks / tools / templates]
    G --> G5[Clear writing & brand voice]

    H --> H1[Title, H1, URL & meta]
    H --> H2[Semantic structure]
    H --> H3[Internal links]
    H --> H4[Images, alt text & rich media]
    H --> H5[Schema]
    H --> H6[Answer-first quotable chunks]

    I --> I1[Crawlability]
    I --> I2[Indexability]
    I --> I3[Mobile UX & Core Web Vitals]
    I --> I4[Site architecture & sitemap]

    J --> J1[Native social posts]
    J --> J2[Email / audience]
    J --> J3[Permission-based outreach]
    J --> J4[Content curation]

    K --> K1[Digital PR]
    K --> K2[Original research pitching]
    K --> K3[Resource pages]
    K --> K4[Strategic guest contributions]
    K --> K5[Expert commentary]
    K --> K6[Free tools & visual assets]

    O --> O1[Qualified organic visits]
    O --> O2[CTR]
    O --> O3[Engagement & conversion]
    O --> O4[Rankings & indexed pages]
    O --> O5[Links / mentions / citations]
    O --> O6[Share of voice & brand search]
```

---

## 2. Entity Model

| Entity | Core attributes | Key relationships | Decision rule |
|---|---|---|---|
| **Business outcome** | Revenue, qualified demos, sales, CAC, awareness | Determines goals, keyword priorities, conversion pages, measurement | Start here, not with rankings |
| **Audience segment** | Job, sophistication, pain, desired outcome, objections, language | Produces queries; informs voice, examples, CTA, format | Use direct customer language whenever possible |
| **Topic cluster** | Core topic, subtopics, entities, questions, funnel stage | Contains pages; linked internally; maps to a business goal | Build topical depth without creating duplicate intent pages |
| **Keyword / query** | Intent, volume, difficulty, CPC, modifiers, SERP features | Maps to one primary page and supporting passages | Choose based on business value plus realistic ability to win |
| **Search intent** | Informational, commercial investigation, transactional, navigational; task to complete | Determines content type, scope, CTA and page design | Let dominant SERP format guide the primary format |
| **Content asset** | URL, format, target intent, unique angle, author, freshness, conversion role | Earns rankings, citations, links; connects via internal links | One page should have one clear primary job |
| **Information gain** | Original data, experience, examples, templates, tools, unique framing | Raises usefulness, citations, shares, links | Add something competitors cannot simply paraphrase |
| **Evidence** | Source, method, date, expert, case study, screenshot | Supports claims and E-E-A-T | Prefer verifiable, current, first-party proof |
| **On-page element** | Title, H1, headings, URL, copy, meta, links, images, schema | Helps machines and people interpret content | Optimize after the content's value and intent are right |
| **Authority signal** | Editorial backlinks, brand mentions, co-citations, expert coverage | Strengthens domain/entity association and discoverability | Relevance and editorial quality beat raw link counts |
| **Technical foundation** | Crawlability, indexation, speed, mobile usability, architecture, canonicals | Enables content discovery and user experience | Fix blockers before scaling content production |
| **Performance signal** | Impressions, CTR, positions, visits, engagement, leads, revenue, citations | Triggers optimization, upgrade, rewrite, or consolidation | Evaluate value to the business, not vanity traffic alone |

---

## 3. Production Graph: From Idea to Asset

```mermaid
flowchart LR
    A[Customer problem] --> B[Topic hypothesis]
    B --> C{Business fit?}
    C -- No --> X[Park or reject]
    C -- Yes --> D[Research demand across Google, communities, video and AI]
    D --> E[Score opportunity]
    E --> F{Can we create a better answer?}
    F -- No --> X
    F -- Yes --> G[Analyze SERP & cited sources]
    G --> H[Write content brief]
    H --> I[Define unique angle / information gain]
    I --> J[Collect evidence & SME input]
    J --> K[Build detailed outline]
    K --> L[Draft answer-first content]
    L --> M[Add visuals, examples, tools or templates]
    M --> N[Edit for clarity, accuracy, voice and conversion]
    N --> O[On-page / LLM optimization]
    O --> P[Technical QA and publish]
    P --> Q[Promote and pitch]
    Q --> R[Measure and improve]
```

### Opportunity score

Use a weighted score rather than choosing topics by volume alone. Score each factor 1 to 5:

```
Opportunity = Business Value + Intent Fit + Demand + Achievability
            + Differentiation Potential + Authority Leverage
```

For a SaaS business, **business value**, **intent fit**, and **differentiation potential**
should usually outweigh raw volume.

### Minimum viable SEO brief

- Target audience, customer stage, and job-to-be-done
- Primary query plus semantic and long-tail query set
- Intent, dominant SERP format, expected depth, SERP features
- Business purpose and next action / CTA
- Top competitor patterns and specific gaps
- Information-gain promise: data, benchmark, case study, tool, framework, template, or firsthand insight
- Evidence plan and SME contributor
- Required sections, visuals, internal links, external citations, and update date

---

## 4. Content Quality Graph

```mermaid
mindmap
  root((Content that earns visibility))
    Relevance
      Search intent match
      Audience language
      Correct format
      Clear task completion
    Originality
      Information gain
      First-hand experience
      Original data
      Distinct point of view
      Useful tool or template
    Trust
      Evidence
      Transparent methodology
      Expert review
      Accurate and current examples
      Honest limitations
    Comprehension
      Answer first
      Descriptive headings
      Logical outline
      Short paragraphs
      Plain language
    Engagement
      Strong hook
      Scannable layout
      Screenshots and visuals
      Stories and examples
      Outcome-oriented writing
    Discoverability
      Keyword context
      Internal links
      Metadata
      Image optimization
      Schema and technical access
    Citation-worthiness
      Quotable statements
      Clear statistics
      Citable charts
      Named frameworks
      Definitive explanation
```

### The information-gain test

Before approving a draft, ask:

1. What would a reader learn here that the current top results do not give them?
2. What proof makes this claim credible?
3. What could a journalist, creator, buyer, or AI system extract and cite without needing extra context?
4. What practical output can the reader use immediately?

If the answers are weak, do not compensate by adding more generic words. Improve the research,
evidence, angle, or utility.

---

## 5. On-Page and AI Citation Graph

| Layer | Human goal | Search / AI interpretation goal | Implementation |
|---|---|---|---|
| Page promise | Instantly confirm relevance | Establish topic | Clear title tag, one descriptive H1, direct introduction |
| Answer layer | Solve the question fast | Create extractable answer passages | Give a concise answer immediately below relevant headings |
| Section layer | Let readers skim and act | Define semantic chunks | Descriptive H2/H3s, short paragraphs, lists, tables |
| Topic layer | Provide complete guidance | Establish semantic coverage | Natural related entities, subquestions, examples, context |
| Trust layer | Reduce risk | Demonstrate experience and credibility | Author expertise, citations, methods, case studies, original screenshots |
| Navigation layer | Help users continue | Distribute context and discovery | Contextual internal links with descriptive anchors |
| Visual layer | Make difficult ideas understandable | Add context and image-search eligibility | Useful diagrams, charts, screenshots; descriptive filenames and alt text |
| SERP layer | Earn the click without misleading | Improve result comprehension | Unique title/meta, concise URL, appropriate structured data |
| Performance layer | Avoid friction | Preserve crawlability and user experience | Mobile-first design, optimized media, indexable pages, fast rendering |

### LLM-ready passage pattern

```text
## How to [complete a specific task]

[One- to two-sentence direct answer that is complete on its own.]

1. [Action with a concrete condition or example]
2. [Action with a concrete condition or example]
3. [Action with a concrete condition or example]

Why it matters: [brief evidence, limitation, or tradeoff].
```

Use this only where it serves the reader. The objective is clarity and contextual
completeness, not writing mechanically for models.

---

## 6. Authority and Link-Earning Graph

```mermaid
flowchart TD
    A[Useful, distinctive asset] --> B{Linkable hook}
    B --> B1[Original research]
    B --> B2[Statistic set + charts]
    B --> B3[Free tool]
    B --> B4[Template / checklist]
    B --> B5[Visual framework]
    B --> B6[Expert insight]
    B --> B7[Focused definitive guide]
    B1 --> C[Relevant prospect list]
    B2 --> C
    B3 --> C
    B4 --> C
    B5 --> C
    B6 --> C
    B7 --> C
    C --> D[Segment by publisher need]
    D --> E[Personalized pitch]
    E --> F[Editorial link]
    E --> G[Unlinked brand mention]
    E --> H[Co-citation with trusted entities]
    F --> I[Authority + discovery]
    G --> I
    H --> I
    I --> J[Traditional & AI visibility]
```

### Outreach principles

- Pitch only credible, topically relevant publications, resource pages, journalists, and communities.
- Lead with the recipient's audience benefit: a useful stat, visual, quote, explanation, or resource.
- Personalize the opening and make **one** explicit ask.
- Keep the pitch concise; for research, put the strongest finding near the top.
- Track prospects, opens, replies, earned links, mention quality, authority/relevance, and time-to-placement.

Avoid paid or manipulative link schemes, mass generic outreach, and guest-post farms. A relevant
editorial mention can have strategic value even when it is unlinked or nofollowed.

---

## 7. Measurement and Refresh Loop

| Signal | What it diagnoses | Typical response |
|---|---|---|
| Impressions rising, CTR weak | Snippet or intent mismatch | Test clearer titles/meta, improve promise alignment |
| Rankings 6 to 20 with strong intent fit | Authority, completeness, or on-page gap | Add evidence, sections, internal links, visuals; earn relevant mentions |
| Traffic high, conversions weak | Wrong audience, weak commercial bridge, or page UX | Improve CTA, product context, comparison/case-study support, next-step path |
| Rankings or traffic declining | Freshness, competitor improvement, technical issue, SERP shift | Run a content health check and choose optimize, upgrade, rewrite, or consolidate |
| Multiple pages compete | Cannibalization / fragmented authority | Merge strategically, redirect where appropriate, re-map intent |
| Little indexing or discovery | Technical or architecture blocker | Check crawl paths, canonicals, sitemap, robots directives, internal links |
| Links or mentions absent | Asset lacks a reference-worthy hook or outreach fit | Create original data, tool, visual, template, or sharper angle |
| AI citations absent | Weak entity authority, unclear chunks, no distinctive evidence | Improve answer-first sections, evidence, brand mentions, and citation-worthy assets |

### Update hierarchy

1. **Optimization:** Small changes. Internal links, metadata, CTA, image, wording, missing subquestion.
2. **Upgrade:** Meaningful refresh. New examples or data, added sections, better visuals, stronger proof.
3. **Rewrite:** Rebuild the angle, structure, or intent fit when the old page no longer serves the query.
4. **Consolidation:** Combine overlapping pages into one stronger asset when a single page better satisfies the intent.

---

## 8. SaaS Application: Kloudbean

### Cluster architecture

```mermaid
flowchart TD
    A[Commercial pillar] --> A1[Managed cloud hosting]
    A --> A2[Node.js deployment]
    A --> A3[WordPress performance]
    A --> A4[Compliance-ready hosting]

    A1 --> B1[How-to guides]
    A1 --> B2[Hosting comparisons]
    A1 --> B3[Migration checklists]
    A2 --> C1[Deployment tutorials]
    A2 --> C2[Architecture explainers]
    A2 --> C3[Platform comparisons]
    A3 --> D1[Speed optimization]
    A3 --> D2[Security checklists]
    A3 --> D3[WooCommerce guides]
    A4 --> E1[Control readiness]
    A4 --> E2[Data-residency explainers]
    A4 --> E3[Security architecture]

    B1 --> G[Product / solution page]
    B2 --> G
    B3 --> G
    C1 --> G
    C2 --> G
    C3 --> G
    D1 --> G
    D2 --> G
    D3 --> G
    E1 --> G
    E2 --> G
    E3 --> G
```

### High-leverage asset types

- **Original benchmark:** Cloud or Node.js deployment performance study with transparent methodology and downloadable data.
- **Interactive tool:** Hosting-cost, migration-risk, or compliance-readiness calculator.
- **Decision framework:** Managed hosting versus self-managed cloud matrix with scenarios, trade-offs, and owner effort.
- **Operational template:** Deployment checklist, WordPress hardening checklist, or recovery playbook.
- **First-hand case study:** Before and after reliability, page-speed, deployment time, or support-load outcome, with constraints and method disclosed.

> **Kloudbean note on interactive tools.** The owner has directed that we do not ship
> interactive JS tools in articles, particularly anything that recommends competitors. Treat
> "interactive tool" in this framework as a *linkable-asset category to consider*, not a
> standing instruction. Static checklists, tables, and diagrams serve the same purpose here.

---

## 9. Editorial Gate Checklist

A page is ready only when it can answer **yes** to all applicable questions:

- Is there a clear business outcome and reader job-to-be-done?
- Does the page match the dominant search intent and format?
- Does it contain information gain beyond a generic AI summary?
- Are important claims supported with current, verifiable evidence or firsthand experience?
- Is the primary answer visible quickly, and is every section easy to scan?
- Are headings descriptive enough to function as a table of contents?
- Are target and related terms used naturally in meaningful places?
- Are internal links helpful, contextual, and directed toward priority pages?
- Do visuals explain something rather than decorate the page?
- Are title, URL, meta description, H1, images, schema, mobile UX, and indexation checked?
- Is there a non-intrusive but clear next step for the appropriate reader stage?
- Is there a promotion or outreach plan proportional to the asset's value?
- Is an owner and review date assigned?

---

## Operating Principle

**SEO is an evidence-driven visibility system, not a publishing volume contest.** Start with
business outcomes and customer reality; create the clearest, most useful, most credible answer
to a specific intent; make it technically accessible and easy to interpret; then earn
recognition across the web and continuously improve what works.
