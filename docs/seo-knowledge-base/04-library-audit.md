# Library audit — 288 published articles vs the new standard

Run date: 2026-08-01. Scope: every folder in `content-studio/` that has a `<slug>.html`, which is
288 articles. Measured against `.kiro/steering/seo-operating-system.md` (section 8, the pre-publish
gate) and `article-quality-playbook.md`.

**Method note, because it changes how to read this.** Everything below is deterministic and was
scripted, not sampled by eye. Three of the five findings I first measured turned out to be errors in
my own measurement rather than problems in the library, and they are documented as such. Information
gain is deliberately absent: it cannot be measured with a regex, and pretending otherwise would put
a number on the one thing that actually needs a human.

Reproduce the truthfulness check any time with `npm run audit:claims`.

---

## Summary

| Tier | What was checked | Result |
|---|---|---|
| 1 | Truthfulness / banned claims | **0 of 288** flagged, after fixing 4 defects in the gate |
| 2 | Authored schema reaching production | **Real gap.** 288 of 288 lose their JSON-LD at publish |
| 3 | Keyword grounding recorded in `brief.md` | **0 real gaps.** 288 of 288 grounded, 5 naming conventions |
| 4 | Humanisation | HTML clean. 2 `.md` mirrors missed the de-em-dash pass. 13 filler phrases |
| 5 | Structural differentiators | 4 thin articles, 2 with no table, diagram, or code |

The headline is tier 2, and it is not a content problem. The articles are fine. The publishing
pipeline drops work the articles already did.

---

## Tier 1 — Truthfulness: clean, but the gate was not

Final state: **0 of 288** articles trip the claim gate.

Getting there mattered more than the number. The first run flagged **11 articles, and all 11 were
false positives.** Every single one came from the compliance cluster, which is the enterprise and
government silo. They were flagged for sentences like these, all verbatim from shipped pages:

- "Storing EU data in an EU region does not make you GDPR-compliant on its own."
- "What it won't do, because no honest host can, is make you PCI compliant on its own."
- "Is Kloudbean GDPR, PCI, or SOC 2 certified?" (an FAQ question, answered no)
- "We go deeper in SOC 2 compliant hosting." (an internal link)
- "The framework is explicit that continuous ECC compliance is required in order to be fully
  compliant with CSCC." (a neutral description of a published framework)

In other words, the gate was flagging the honest half of the library as the violation. That is the
worst possible failure, because a flagged claim is fed to `buildRevisionInstructions()` as a
mandatory fix, so the auto-revise loop would have rewritten carefully hedged, correct sentences
into something less accurate. A gate that punishes the disclaimer trains writers to delete it.

Four defects caused it, all now fixed:

1. **No sentence context.** Patterns ran against the whole document with `pattern.test(md)`, so a
   claim and its denial were indistinguishable. Matches are now evaluated per sentence, and a match
   is excused when the sentence negates it or is a question. The negation cue has to sit outside the
   matched span, otherwise a pattern like `never fails` or `no other host` excuses itself.
2. **Compliance vocabulary is topic vocabulary.** "SOC 2 compliant hosting" is a target keyword, an
   H1, and a link anchor throughout that cluster. Those patterns now require a first-party
   *assertion*, subject plus linking verb ("Kloudbean **is** SOC 2 certified"), not a keyword hit.
   A bare mention of "we" is not enough, because "we go deeper in X" is authorial voice.
3. **Match windows crossed newlines.** `[^.]{0,40}` swallowed the secondary-keyword list in a file's
   frontmatter and read it as one long claim. Now `[^.\n]`.
4. **The unsupported-provider check had no word boundaries.** `we` matched inside "lowest", which is
   how `hetzner-vs-kloudbean` got flagged for the sentence "...lowest bill and enjoy the ops?
   Hetzner...". It also had no comparison-frame guard, so a "X vs Kloudbean" page was penalised for
   naming X, even though the unsupported-*tech* check immediately below it already allowed exactly
   that. Both fixed.

A fifth defect surfaced while writing tests: `guaranteed rankings`, the natural plural, never
matched. The pattern ended `(ranking|...)\b`, and the `\b` fails before the "s". The gate had a
hole in it the whole time.

All 13 real sentences are now regression cases in `scripts/test-claim-gate.ts`, which is at 33
cases and covers both directions: violations must block *and* produce a fix instruction, and real
prose must not block.

**Nothing in the library needs editing for tier 1.**

---

## Tier 2 — The real gap: authored schema never reaches production

Every one of the 288 articles contains hand-authored JSON-LD: an `Article` object with `author` and
`publisher`, plus a `FAQPage` with 8 to 10 question and answer pairs. That is a deliberate
requirement in the playbook, and it is the mechanism behind FAQ rich results and AI citation.

It does not survive publishing.

- In all 288 files the JSON-LD sits **outside `<head>`**, in the body region.
- `extractArticleBody()` in `src/lib/wp-publish-content-studio.ts` strips every `<script>` except
  ones marked `data-kb-widget`. Its own comment states the intent: JSON-LD and analytics do not
  survive.
- Nothing re-attaches it. `publishContentStudioArticle()` builds its payload through
  `buildPostPayload` and never passes schema.
- `extractJsonLd()` exists in the same file, is exported, is documented as "pull the JSON-LD
  (@graph with Article + FAQPage) out of the full HTML **for the plugin**", and **is called from
  nowhere.** The wiring was started and never finished.

So published posts carry whatever AIOSEO generates by default, not the FAQPage that was written for
them. The other publish path does this correctly: `publishOne()` passes `schema_jsonld` to
`publishViaPlugin`. The content-studio path does not.

Related, and secondary: no source file sets `datePublished` or `dateModified` (0 of 288). The
plugin path injects both at publish time. The content-studio path cannot, because it discards the
schema object entirely. Fix the pass-through and the dates question resolves with it.

**This needs a decision, not a guess.** Attaching schema means choosing how it reaches AIOSEO,
either post meta through REST or the plugin's `schema_jsonld` field, and that has to be verified
against the live WordPress install. I have not changed it, because I cannot test a publish against
production from here and a wrong guess writes bad schema to 288 live URLs.

Recommended: route the content-studio publisher through the plugin path with `extractJsonLd()`
supplying `schema_jsonld`, and inject `datePublished`/`dateModified` there the same way
`publishOne()` already does. Worth confirming on one article before running the rest.

---

## Related fix already applied: the queue published the wrong body

Found while tracing tier 2, and more urgent, so it is fixed.

The 288 articles are sitting in the review queue. The Approve button on `/publish-queue` calls
`approveAndPublish()` → `publishOne()`, and `publishOne()` rebuilt the body from
`article.content_draft`, which is the **markdown mirror**.

The markdown mirror does not contain the hand-built markup. Measured: 222 articles have an inline
SVG diagram in their HTML and **zero** have one in their markdown. The `.md` files run roughly half
the byte size of the `.html` files. Publishing through that path would have silently dropped the
diagrams, the styled callouts, and the console screenshots.

Meanwhile `wp-publish-content-studio.ts` was written for precisely these articles and keeps the SVG
and callouts as editable Gutenberg blocks. The manual content-tracker route already used it. The
queue did not, so the same article published differently depending on which button you pressed.

`publishOne()` now detects a full standalone page in `content_html` and delegates to the
content-studio publisher. The doctype test is a clean discriminator: all 288 content-studio files
are standalone documents, and `renderArticleHtml()` returns a fragment.

This was latent rather than active, since auto-approve is off and `scheduled_publish_at` is null,
so nothing publishes without a click. But the click was one button away.

---

## Tier 3 — Grounding: no gap. My first measurement was wrong

First pass reported 209 of 288 briefs missing a target keyword. That was my regex, not the library.
I searched for `target keyword` / `primary keyword` and the actual convention is `Primary kw:`.

Corrected, then corrected again:

| Convention used in `brief.md` | Count |
|---|---|
| `Primary kw:` style | 240 |
| `## Keyword grounding` section | 39 |
| Both | 6 |
| Neither | 3 |

The 3 with neither were read individually. All three record grounding under different headings
(`## Keywords`, `## Primary keyword`, `## Keyword targets`), and all three explicitly hedge instead
of inventing figures: "No SEMrush/DataForSEO export was supplied for this exact topic, so no precise
volumes are asserted here", "volumes hedged, not fabricated".

**288 of 288 briefs record their grounding. There is no gap here.** The articles without volume
figures state why they have none, which is the steering rule being followed rather than broken.

The only real observation is that there are at least five heading conventions, so this gate item
cannot be checked automatically. Worth standardising on `## Keyword grounding` for new briefs, but
this is housekeeping, not a content risk.

---

## Tier 4 — Humanisation: clean in the HTML, and 2 markdown mirrors were missed

Em-dashes in the **HTML**: 29 of 288 contain any at all, and not one exceeds 1 per 1000 words. The
worst is 0.54 per 1000, a single dash in an 1,843-word article.

That was almost the whole finding, until the validator reported 27 em-dashes in
`soc2-compliant-hosting` whose HTML contains zero. They are in the `.md` mirror. Measuring both:

| | HTML | Markdown |
|---|---|---|
| Articles with any em-dash | 29 | 35 |
| Articles above 1 per 1000 words | 0 | 9 |
| Total em-dashes across the library | 29 | 104 |

The de-em-dash pass was applied to the HTML and not carried back to the markdown. Four articles
drifted, two of them badly:

| Article | Markdown | HTML |
|---|---|---|
| `scalable-wordpress-hosting` | 28 (20.4 per 1k) | 0 |
| `soc2-compliant-hosting` | 21 (18.8 per 1k) | 0 |
| `custom-domain-and-ssl-for-your-app` | 4 | 1 |
| `ci-cd-auto-deploy-from-github` | 4 | 1 |

This is not cosmetic. `content_draft` **is** the markdown, so it is what the engine scorecard's
`em_dashes` check scores and what `renderArticleHtml()` would render in the default publish path.
The playbook's "keep article.md and article.html in sync" exists for exactly this.

Fixing it means rewriting those sentences, not swapping the character for a hyphen, so the two
significant articles need a short editing pass rather than a script.

Banned filler phrases: 13 of 288, concentrated in one phrase.

| Phrase | Articles |
|---|---|
| "that's the whole point" | 7 |
| "unlock" | 3 |
| "here's the thing" | 2 |
| "the honest truth is" | 1 |
| "let's be clear" | 1 |

All five are on the playbook's explicit kill list. 13 single-phrase edits, low effort, no structural
change. Worth doing on the next touch of each article rather than as a dedicated pass.

---

## Tier 5 — Structural differentiators

These are proxies, not quality judgements. A short article can be excellent and a long one can be
filler. Read them as "worth a look", not "broken".

Under the 1,400-word floor, 4 articles:

| Article | Words |
|---|---|
| `fix-502-bad-gateway-node-nginx` | 1,344 |
| `graceful-shutdown-nodejs` | 1,356 |
| `fix-cannot-find-module-node` | 1,385 |
| `nodejs-background-jobs-bullmq` | 1,390 |

All four are error and troubleshooting pages, where short and decisive is often correct. The
question for each is not "add words" but "is a real failure mode missing".

Carrying no comparison table, no diagram, and no code block, 2 articles:

- `critical-systems-hosting-checklist` (1,851 words)
- `nodejs-hosting-decision-tool` (1,451 words)

Also: 66 of 288 have no SVG diagram, 73 have no code block, 23 have no comparison table, 1 has no
TL;DR box. Every article has at least one image.

`nodejs-hosting-decision-tool` remains flagged separately from this audit: it is an interactive JS
tool that recommends competitors, which contradicts the no-JS-tools directive. That is a delete or
rewrite decision, not an audit finding.

---

## What to do, in order

1. **Wire schema pass-through at publish.** Tier 2. The only finding that costs real search
   visibility, and it affects all 288 URLs. Needs a decision on how schema reaches AIOSEO, then a
   test on one article.
2. **Verify the queue publish fix** against one real article before approving in bulk, since the
   routing change is untested against a live WordPress install.
3. **Re-edit the markdown of `scalable-wordpress-hosting` and `soc2-compliant-hosting`** to match
   their already-clean HTML. Roughly 49 sentences between them. Needs rewriting, not a find and
   replace.
4. **Strip the 13 filler phrases.** Cheap, do it opportunistically.
5. **Review the 4 thin troubleshooting pages** for a missing failure mode. Do not pad them.
6. **Decide on `nodejs-hosting-decision-tool`.** Standing question, unrelated to this audit.
7. **Standardise new briefs** on `## Keyword grounding` so the gate item becomes checkable.

Nothing here requires rewriting an article for truthfulness. That was the thing most at risk, and
the library is clean on it.
