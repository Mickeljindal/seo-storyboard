# SEO Operating System — the decision layer

Companion to `article-quality-playbook.md` and the product-truth files. Source research lives in
`docs/seo-knowledge-base/`.

**Division of labour, so these files never contradict each other:**

| File | Owns |
|---|---|
| `kloudbean-facts.md` + `kloudbean-enterprise-compliance.md` | Product truth. The ONLY thing allowed to decide what Kloudbean does. |
| **this file** | **Whether a page should exist, why, what it may claim, and when to change it.** |
| `article-quality-playbook.md` | How it is written: voice, structure, humanisation, visuals, links, validation. |

If this file and the playbook seem to disagree, this one decides *whether and what*, the playbook
decides *how*.

---

## 1. Authority layers (the most important rule here)

Different kinds of knowledge are allowed to decide different things. Mixing them is the single
biggest cause of confidently wrong AI content.

| Layer | MAY decide | MAY NOT decide |
|---|---|---|
| General SEO practice | Method: research approach, page structure, quality checks, link-earning patterns | Anything about what Kloudbean does |
| Kloudbean product truth | Product claims, plan details, supported stacks, CTAs | General ranking claims |
| Customer/support evidence | ICP language, real pains, objections, recurring problems | Market-wide factual claims |
| Live SERP evidence | Intent, current format, competitive context, refresh triggers | Timeless "SEO law", product facts |
| Primary vendor docs | Technical behaviour and configuration | Kloudbean support scope |

**Conflict resolution:** product truth wins for product claims. Live SERP wins for intent and
format. Primary documentation wins for technical behaviour.

Never use an SEO source to justify a product capability. Never use a vendor's docs to imply we
support something.

---

## 2. Create / don't create

**Create a page only if all four hold:**

1. It maps to a distinct audience need or search intent.
2. It serves a business outcome or a real topical-authority goal.
3. We can give a meaningfully better, more current, or more credible answer than what ranks now.
4. It does not substantially duplicate an existing URL.

**Do not create when:**

- Intent is unclear and no SERP or keyword evidence has been supplied.
- It would cannibalise a stronger existing page.
- It needs technical, legal, pricing, performance, security, or compliance claims we cannot verify.
- The only differentiator is different wording or more length.

**When uncertain:** ask, or mark the gap. Never invent product features, benchmarks, prices,
customer outcomes, certifications, integrations, or statistics.

### The cannibalisation check is mandatory, and it is not optional judgement

Before writing anything, list existing slugs and read the H2 set of every near neighbour. This
step has changed real decisions on this project:

- `npm error code ENOENT` (2,400/KD 22) was dropped mid-batch after reading
  `fix-cannot-find-module-node`, which already owned "File not found: paths, case, and ESM
  extensions" plus "The build-output trap".
- `gitlab-vs-github` shipped only after confirming `self-host-gitlab` answers a different
  question ("how do I run it" vs "which do I choose"). It links there twice instead of competing.
- `wordpress-user-roles` was scoped to the CMS layer because `agency-wordpress-hosting` already
  owned hosting-account access control.
- A dedicated cert-validity article was refused because `fix-ssl-certificate-errors` already had
  H2s for every browser cert message.

If a neighbour exists, the options are: pick a genuinely different intent and link to it, fold the
idea into the existing page, or drop it. Two pages chasing one intent is a self-inflicted wound.

### Package-name and variant families: one article, not ten

When a query family is the same error with different nouns (`no module named 'flask'`, `'yaml'`,
`'psycopg2'`), write ONE article organised by root cause, with the specific names as evidence.
Ten thin pages cannibalise each other and each answers less than the forum thread it competes with.

---

## 3. Opportunity scoring

Score 1 to 5 per component, then multiply the weighted total by 20 for a score out of 100.

```
0.25 business_value      Will this attract a customer we want, or assist a real conversion path?
0.20 intent_fit          Do query intent, page format, CTA, and funnel stage agree?
0.15 achievability       Can we realistically win, given our authority and who ranks now?
0.15 information_gain    Can we add experience, data, a diagram, a decision cue, a real failure mode?
0.10 authority_leverage  Do related pages, internal links, and product capability support it?
0.10 demand              Search volume and/or recurring customer demand. Useful, not decisive.
0.05 linkability         Would anyone cite or link this on its own merits?
```

| Score | Action |
|---|---|
| 80-100 | Prioritise. Flagship or conversion-supporting page. |
| 65-79 | Build. Schedule by cluster dependency. |
| 50-64 | Validate further. Narrow the audience, sharpen the angle, or make it a support page. |
| Below 50 | Defer, merge, or reject. |

**Volume is not the deciding input.** Two live examples: `port-25-blocked-smtp-ports` was written
at only ~5,500 because it is a top genuine support question; `alibaba vs aliexpress` was rejected
at 12,100/KD 30 because it would dilute topical authority. Relevance beat volume both times.

---

## 4. Intent, and what each implies

| Intent | Reader wants | Format that fits | CTA weight |
|---|---|---|---|
| Informational | Understand, diagnose, fix | Explainer, troubleshooting guide, comparison of concepts | Light. Earn trust, sell later. |
| Commercial investigation | Evaluate options, cost, vendors | Comparison, alternatives, decision guide, buyer's guide | Medium. Be fair, then land. |
| Transactional | Sign up, migrate, deploy | Step-by-step guide, migration guide, product page | Direct. |
| Navigational | A named brand or destination | Usually not ours to chase | None. |

Let the dominant format on the live SERP guide the primary format. If every ranking page is a
troubleshooting guide, do not publish a listicle.

### SERP fields to capture when evidence is available

Dominant format; dominant angle and audience sophistication; recurring headings, questions and
entities; SERP features (snippets, PAA, video, discussions); content gaps (missing explanation,
outdated advice, missing evidence, weak UX, missing audience segment); real difficulty based on
who actually ranks, not just a difficulty number.

**Position data beats gap data.** A competitor sitting at #1-5 proves a term is both winnable and
worth having. That is how the largest remaining cluster on this project was found after the gap
export looked exhausted.

---

## 5. Information gain

**Definition:** what the page gives beyond a competent generic summary.

**The approval question:** what can a reader learn, decide, implement, or cite here that they
cannot get from a generic AI answer or the current top results?

Acceptable sources of gain, in rough order of strength: a real failure mode and its fix; a
concrete command, config line, or error string; an original diagram; a decision cue that replaces
a rule of thumb; a named trade-off; grounded operational experience; a verified number.

If the answer is weak, **do not add words.** Improve the research, the angle, or the utility.

### Angles that have repeatedly produced real gain here

Reusable, and worth reaching for before inventing something new:

- **Whose error is it?** When two layers produce the same message, make the reader classify first,
  then give one decisive command that splits it.
- **Open by ruling things out.** "This error proves your server was never contacted" beats a fix list.
- **The popular fix cannot work.** Explain the mechanism that makes it useless, then give the real fix.
- **The status code names the layer.** The error text identifies which component's ceiling you hit.
- **The failure is invisible.** Problems that produce no error at all are scarier and more useful.
- **The fix is structural, not a command.** Naming the practice that retires a whole bug class.
- **Concede the main point up front** when the product genuinely cannot help, then claim only the
  narrower thing that is true. This is the strongest credibility move available.
- **Volunteer an honest gap in our own product** where it is relevant.

---

## 6. Drafting constraints

1. **Label or source every externally verifiable statistic or technical claim** when source data
   exists. Verify anything checkable rather than recalling it. Two catches on this project: a draft
   had the Node 24 ABI number wrong until checked against `nodejs/node`; the CodeIgniter 4
   auto-routing default was confirmed against the official user guide before being asserted.
2. **Use `[VERIFY WITH PRODUCT TEAM]` instead of inventing a missing product fact.** A placeholder
   is a task. A guess is a liability. The article validator treats placeholders as blocking, so
   they cannot reach publication by accident.
3. **State the dependency** when a recommendation turns on stack, traffic, region, budget, risk
   tolerance, or compliance requirements.
4. **Never promise** ranking, traffic, uptime, compliance certification, security, or revenue
   outcomes.
5. **Rules, not fabricated dates.** Where a fact is a moving target, teach the rule and the
   recognisable signature instead of asserting a specific date or figure. Example: LTS releases
   arrive in April of even years with five years of support, and the signature of an end-of-life
   release is `apt update` returning 404s. No invented EOL dates.
6. **Hedge volumes honestly.** Cite real figures from real data, never precise-sounding invented ones.

### Claim classes

Already enforced in code by `OVERPROMISE_PATTERNS` (`src/lib/kloudbean-plans.ts`), so these block
a draft automatically: compliance certification claims, 100% uptime/secure/guaranteed, "never
fails", guaranteed rankings, "makes you compliant".

Watch these yourself, because they are easy to write and harder to detect:

- Unverifiable superlatives: best, fastest, most secure, most reliable, unbeatable, industry-leading.
- Fabricated precision: a specific percentage, build time, or restore time nobody measured.
- Borrowed authority: implying a partnership, certification, or ingestion that does not exist.
- Fake experience: a customer story, ticket, or "we've seen" claim not grounded in supplied context.

The honest boundary, always available: managed covers the server, stack, SSL, backups, and
patching; application code and data stay the customer's. Compliance is shared.

---

## 7. When something is already published

Do not default to writing something new. Choose deliberately:

| Signal | Diagnosis | Action |
|---|---|---|
| Impressions up, CTR weak | Snippet or intent mismatch | **Optimise:** title, meta, opening promise |
| Position 6-20, intent fits | Depth, evidence, or authority gap | **Upgrade:** add evidence, sections, internal links |
| Traffic high, conversion weak | Wrong audience or weak commercial bridge | **Optimise CTA** and product context. Traffic is not success |
| Rankings declining | Freshness, competitor moved, SERP shifted, technical | Audit first, then choose |
| Several of our pages compete | Cannibalisation | **Consolidate** and redirect |
| Not indexed | Technical or architecture blocker | Fix crawl path, canonical, internal links |
| No links or citations | No reference-worthy hook | Build a real asset, do not pad the page |

Ladder: **optimise → upgrade → rewrite → consolidate → retire.** Reach for the smallest step that
addresses the actual diagnosis.

**Never claim a technical diagnosis without technical data.** If asked why a page is not ranking,
do not assume it is the content. Ask for crawl, indexation, Search Console, SERP, link, and
cannibalisation data, and say which of those you do not have.

---

## 8. Pre-publish gate

Every item must pass. Anything unverifiable must be marked, not smoothed over.

- [ ] Named business outcome and named reader.
- [ ] Owns a distinct intent; cannibalisation check done against real neighbours' H2 sets.
- [ ] Format matches the dominant SERP format and audience sophistication.
- [ ] Defensible information gain, statable in one sentence.
- [ ] Every product claim traceable to the product-truth files. Every checkable number verified.
- [ ] No banned claim class. No invented experience, partnership, or figure.
- [ ] Answer-first under meaningful headings; scannable; complete.
- [ ] Metadata, URL, headings, internal links, alt text, schema reflecting visible content.
- [ ] Proportionate CTA, after the value.
- [ ] Recorded grounding: target keyword, volume/difficulty where known, and the reasoning, in `brief.md`.
- [ ] Validator clean: word count, JSON-LD, FAQ parity, em-dash count, zero banned blurbs, links resolve.

---

## 9. Authority and links

Earn recognition because an asset is genuinely useful. Never buy links, run schemes, automate
deceptive outreach, or trade at scale. Lead outreach with the asset and one honest ask.

Linkable asset types worth building: original research with a transparent method; a statistics page
with charts and downloadable data; an operational template or checklist; original diagrams and
frameworks; a first-hand case study with its constraints disclosed.

**Owner constraint that overrides the generic advice:** do not ship interactive JS tools in
articles, especially anything that recommends competitors. Static checklists, comparison tables,
and inline SVG diagrams serve the same purpose and are what this library uses.

---

## 10. Engine parity

The writing standard lives in four places. Change one, change all, or the writer aims at a bar the
gate does not measure:

- `src/lib/content-engine.ts` — `HUMAN_STYLE`, `EDITORIAL_STANDARD`, `STRATEGY_CONTRACT` injected into every pass.
- `src/lib/content-scorecard.ts` — deterministic gate. New checks need a matching
  `buildRevisionInstructions` case or they never get auto-fixed.
- `wordpress-plugin/kloudbean-seo-engine/includes/seo-score.php` — the on-page score in WordPress.
- These steering files.

---

## Operating principle

SEO here is a compounding visibility system, not a publishing-volume contest. Start from the
customer's real problem and a business outcome. Build the clearest, most useful, most credible
answer to one specific intent. Make it accessible and easy to interpret. Then improve what works
and retire what does not.

When the honest answer is "we should not write this", say so. That answer has improved this
library more than any single article.


---

## HARD RULE — never delete or remove an existing article (owner, Aug 2026)

Never delete, remove, or blank an already-built article (its `<slug>/` folder, `.md`, `.html`, or
its published post). The library only grows or gets improved in place. When two pages overlap, the
allowed moves are: differentiate, fold one into the other by EDITING (keeping a page live), or
add a canonical/redirect at the site layer, never delete the file. "Retire" in the optimise ->
upgrade -> rewrite -> consolidate ladder means redirect/merge at the site level, not file deletion.
If deletion ever seems necessary, stop and ask the owner first.
