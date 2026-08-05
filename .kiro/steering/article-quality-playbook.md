# Article Quality Playbook (how to generate ranking, converting articles)

Applies to ALL content-studio articles. Pair with kloudbean-facts.md (product truth + positioning).
Goal: comprehensive, SEO-optimized, developer-friendly guides that rank AND position Kloudbean as the
preferred choice — without templating (rotate formats/openers/headers) and without inventing features.

## Keyword strategy (target what people actually search)
- Name real tools/tech, not vague labels. Instead of only "vibe-coded app", also target the builders:
  Lovable, Bolt.new, Cursor, Windsurf, Replit Agent, v0, ChatGPT, Claude Code, Vercel AI.
- Weave the concrete money/intent terms for the topic: "managed PostgreSQL", "managed MySQL",
  "database hosting", "Postgres hosting", "<X> alternative" (e.g. Supabase alternative), "deploy AI apps",
  framework + ORM names (Prisma, Drizzle, Sequelize, TypeORM, Django, Laravel, Rails, Express, FastAPI, NestJS),
  and error strings people paste into Google.
- Put the primary keyword in the H1, title, meta description, first 100 words, and one H2.

## Structure of a strong how-to / capability guide
1. Lead (2–4 sentences): name the real tools/audience, state the problem, promise the outcome.
2. `.tldr` box right after the lead: a 2–3 sentence direct answer (wins featured snippets).
3. "Why / the problem" section grounded in concrete failure modes (e.g., SQLite loses data on redeploy).
4. Architecture/diagram section where it helps — inline SVG (User → App → DB → Backups style), brand colors
   (navy #000f27, purple #4F1AF3, green #40b75f), wrapped in a <figure> with a figcaption.
5. Comparison table(s) with `table.cmp` (X vs Y, or options matrix). Great for snippets + scannability.
6. Numbered steps with a real dashboard screenshot per major step (launch-database, env-vars, git-deployment,
   add-server, add-application, s3-buckets, flb-load-balancer in ../assets/console/).
7. Real, copy-paste code in `<pre><code>` blocks: connection strings, env vars, config, commands.
8. Framework/ORM coverage: show the 2–3 most common shapes as code, then a table covering the rest
   (framework → env var it reads → the exact command).
9. Dedicated Security section when relevant (never hard-code creds, never commit .env, private network,
   least-privilege users, rotate passwords, backups).
10. Performance/scaling section when relevant (pooling, indexing, EXPLAIN/query opt, sizing/resize,
    Redis caching, read scaling).
11. Migration/import section with real commands (pg_dump/psql, mysqldump/mysql) + the "<X> alternative" angle.
12. "Supported frameworks / how it fits your stack" with internal links.
13. Strong conversion CTA (see below).
14. Deep FAQ: 8–10 real questions people search, each answered in 2–4 sentences, mirrored into FAQPage JSON-LD.

## Visual + formatting building blocks (all styled in assets/article.css)
- `.tldr` (snippet box), `.note` (callout, e.g. "Coming from Supabase?"), `table.cmp` (comparisons),
  `<pre><code>` (dark code blocks), inline `<code>`, inline `<svg>` diagrams.
- Short paragraphs (2–4 sentences). Descriptive H2/H3 phrased as the questions users ask.
- Escape code in HTML: use &lt; &gt; &amp; inside <pre>. Keep JSON-LD answers plain (no raw < > & or unescaped quotes).

## Internal linking (every article links out to 4–8 related ones)
Link naturally to: deploy-ai-built-app-to-production, environment-variables-done-right,
s3-compatible-object-storage, managed-redis-hosting, server-backups-guide, ci-cd-auto-deploy-from-github,
mysql-vs-postgresql, managed-postgresql-hosting, managed-mysql-hosting, security-headers-guide, what-is-a-vpc,
and topic-adjacent pieces. Only link slugs that exist. Use absolute https://www.kloudbean.com/blog/<slug>/.

## Conversion CTA (end every article)
Lead with the outcome, then a scannable feature line drawn ONLY from confirmed facts, e.g.:
"One-click databases · Automatic backups · Private networking · Free migration · Free trial · Simple Git deploy".
Link kloudbean.com and /pricing/. Owner has approved featuring "free migration assistance" and "free trial".

## Accuracy guardrails (do not regress the trust fixes)
- Ground every Kloudbean claim in kloudbean-facts.md. 7 clouds, 7 DB engines (incl. Memcached), built-in FLB, managed Supabase,
  Cloudflare edge add-on, private networking/VPC, staging, UAC+MFA, audit trail (enterprise), k8s/autoscaling (enterprise).
- Do NOT invent features. Items still UNCONFIRMED — do not assert without owner sign-off: Docker build/run,
  one-click read replicas, a managed WAF (beyond Shorewall/Fail2ban + Cloudflare), BitNinja,
  white-label agency branding, container scanning, exact SLA %, exact plan prices. Frame these as general concepts
  or omit until confirmed.
- Competitors get at most ONE brief, measured nod, then pivot to Kloudbean. Never gush, never hedge Kloudbean.

## Validation (every article, before done)
Run `python3 /tmp/validate_article.py <slug>` from content-studio. Require: [OK], ≥1400 words (aim 1600–2600 for
guides), JSON-LD Article + FAQPage, images resolve, CSS linked. Blurb check must be 0:
`grep -ci '1,000+\|30+ countries\|two-minute\|~2-min\|24/7 human' <slug>/article.md <slug>/article.html`.
Keep article.md and article.html in sync. Unique byline per new article (cluster-1's 30 keep "Faster Than Ever").

## Humanization — write so it does NOT read as AI (readers are flagging this)

The single biggest fix. Our older articles have obvious AI tells; kill them.

AI tells to ELIMINATE:
- Em-dashes. This is the #1 giveaway. Cut them by ~90%. Use commas, periods, parentheses, or just two sentences. At most one em-dash every few hundred words, if that.
- Rule-of-three everywhere ("fast, simple, and reliable"). Break the pattern: use two items, or four, or one. Not every list needs three.
- "Not just X, it's Y" / "isn't about X, it's about Y" constructions. Overused. Rewrite plainly.
- Signpost/filler phrases: "Here's the thing", "Let's be clear", "The honest truth is", "That's the whole point", "when it comes to", "in the world of", "it's worth noting", "at the end of the day", "make no mistake", "the reality is". Delete them.
- Formulaic transitions: "Moreover", "Furthermore", "Ultimately", "In conclusion".
- A tidy summary sentence that restates the section you just read. Cut it.
- Repeated identical closers across articles (e.g., the same "honest boundary" framing every time). Vary or drop.
- Over-balanced hedging ("both are excellent, you can't go wrong"). Take a position.

Human habits to ADD (vary these, don't apply mechanically):
- Burstiness: mix very short sentences (3-6 words) with longer ones. Let rhythm be uneven. A one-word sentence is fine. Really.
- Start the occasional sentence with And, But, or So.
- Contractions throughout (it's, you'll, don't, that's).
- One or two concrete, specific, checkable details per article (a real number, a real error message, a real command, a named tool) instead of generic phrasing.
- A mild opinion or aside — a light "honestly," a small preference, a wry line. Occasional first person ("I've seen this break at 2am") where it fits the byline voice.
- Direct address ("you"), the odd rhetorical question.
- Plain, sometimes imperfect phrasing over polished symmetry. Slightly informal is good.

Guardrails: humanizing changes VOICE, never facts. Keep all Kloudbean facts, the positioning, the code, and the structure (headings, tables, FAQ, JSON-LD) intact. Don't add fake personal anecdotes that claim specific false experiences; keep asides generic-true. Re-validate after (word count, 0 blurbs). The blurb list still applies; don't reintroduce marketing clichés while adding voice.

Quick self-check before done: count em-dashes (should be near zero), scan for the filler phrases above (should be none), read the first 3 sentences aloud — do they sound like a person talking, with uneven rhythm? If it's smooth and symmetrical, it still reads as AI.

## DEFAULT SYSTEM BEHAVIOR (apply automatically to every Kloudbean article, without being asked)

These two are non-negotiable defaults for all Kloudbean content going forward:

1) HUMANIZED BY DEFAULT. Every article ships in the natural, human voice defined in the Humanization
   section above — not as a later pass. The goal: it reads as if a knowledgeable person wrote it, so it
   doesn't trigger a reader's "this is AI" reaction. Write naturally to achieve that (varied rhythm, near-zero
   em-dashes in prose, no signpost/filler phrases, contractions, concrete specifics, a little voice). Do NOT
   try to game detectors with tricks, invisible characters, or keyword stuffing — that backfires and reads
   worse. Natural human prose is the method. Reference article for the target voice:
   add-managed-database-to-your-app. Self-check before done: ~0 em-dashes in body prose; none of the banned
   filler phrases; first few sentences sound spoken, with uneven length.

2) SEMRUSH / KEYWORD-DATA DRIVEN BY DEFAULT. No article is written from vibes. Before drafting, ground it in
   real search data:
   - Pull the primary keyword + its search volume + difficulty, plus related terms, long-tail variants, and
     "People Also Ask" style questions. Sources, in order: the mined SEMrush gap data (/tmp/mined_topics.json
     when present), the DataForSEO integration (creds in .env: DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD), or a
     SEMrush export the owner provides. If none is available for a topic, ASK for the data or re-mine before
     writing — do not invent volumes.
   - Put the primary keyword in the H1, <title>, meta description, first 100 words, and at least one H2.
   - Weave the related/long-tail terms and the real questions naturally through the body and the FAQ (the FAQ
     should answer the actual PAA-style questions people search).
   - Keep any cited volumes/difficulty realistic and hedged; never fabricate precise numbers.
   - Record the target + secondary keywords and their volumes in the article's brief.md so the grounding is traceable.

Both defaults sit on top of everything else in this playbook (structure, visuals, internal links, CTA) and the
product truth in kloudbean-facts.md. Humanize the voice; never humanize away a fact or a keyword.

3) BEST-RESOURCE-ON-THE-INTERNET BY DEFAULT (depth + originality, not word count). The job is not to produce
   "a blog post." It's to make the single most useful page on the web for that query, written like an
   experienced engineer who has actually deployed hundreds of apps and answered thousands of support tickets.
   If a competitor (Cloudways, Render, Railway, Vercel, the tool's own docs) could publish the draft unchanged,
   it isn't done. Every article must carry something they don't have.

   - NO FIXED TEMPLATE. Do not reach for Intro → Why → Step 1..6 → Conclusion → FAQ every time. Choose the
     shape that fits the topic: audit/checklist, decision tree, troubleshooting field guide, migration guide,
     cost breakdown, myth-vs-reality, architecture breakdown, comparison, case study, before/after, buyer's
     guide, timeline. If someone reads 20 Kloudbean articles, they should not feel one author ran one template.
     Vary the opener, the section ordering, paragraph lengths, heading phrasing, CTA placement, and FAQ count.
   - WRITE LIKE AN ENGINEER. Explain WHY, not only what/how. For each real point: why it exists, what problem
     it solves, what breaks if you ignore it, when NOT to use it, the tradeoff. Prefer concrete, checkable
     specifics (a real error string, a real command, a real config line, a named tool/ORM) over generic prose.
   - WRITE LIKE A FOUNDER. Have opinions. "Most small apps don't need Kubernetes." "SQLite is great in dev,
     wrong in prod." Take a position instead of hedging both ways. Honest, never clickbait, never cocky.
   - ORIGINAL VALUE competitors can't copy: real failure modes we see, migration gotchas, deployment mistakes,
     anti-patterns, a decision cue, a diagram, a benchmark or cost note. Use Kloudbean support/engineering
     knowledge as lived experience ("a common mistake we see is...") ONLY when it's true and grounded in
     kloudbean-facts.md or provided context. Never fabricate experiences, numbers, or customer stories.
   - TEACH FIRST, SELL LAST. Solve the reader's problem completely before Kloudbean appears. The product should
     feel discovered, not advertised. Comparisons stay fair, then land on Kloudbean with real advantages.
   - GATE BEFORE DONE, in addition to the humanization/keyword self-checks: (a) Could a competitor publish this
     unchanged? If yes, add what only we know. (b) Would an experienced engineer bookmark it, and would it
     survive Hacker News / a subreddit without "this is thin SEO filler"? If no, deepen it. Depth means real
     information density, not more words.

   Reference rework that hits this bar: deploy-cursor-app (audit-first structure, AI-code failure modes, an
   original localhost-vs-production diagram, founder opinions, real console screenshots). All three defaults
   apply together: original + deep (this section) AND humanized voice (default 1) AND keyword-grounded (default 2),
   on top of the product truth in kloudbean-facts.md. Never trade away a fact or a keyword for any of them.

## IMAGE SPACERS (drop-in image slots for authors)

Every article should give the author obvious, safe places to add images. Use the shared `.img-slot`
pattern (defined in content-studio/assets/article.css; inline-styled articles carry the same rule in
their own <style>). Add 3 to 6 slots at natural spots (after a step, a code block, or the payoff moment),
each with a concrete hint about what image belongs there. Prefer a REAL console screenshot from
../assets/console/ (add-server, add-application, git-deployment, launch-database, env-vars, s3-buckets,
flb-load-balancer) where one fits; use an empty slot where the author needs to supply their own shot.

Slot markup (HTML articles):
`<figure class="img-slot"><span><b>Add image</b><em>Concrete hint: what to show here.</em><small>Optional note.</small></span></figure>`
Precede each with an HTML comment telling the author how to swap it, WITHOUT a double-quoted src="..."
(the validator flags any src="..." as a missing image, even inside a comment). Write the path as
`src -> images/your-file.png` instead. In the .md mirror, use `<!-- ADD IMAGE: hint -->` at the same spots.
Keep hint text em-dash-free. Slots add no real <img>, so they never break image validation.

## ENGINE PARITY (the generator enforces this protocol, not just humans)

The protocol is encoded in the build-in engine so generated output follows it by default:
- src/lib/content-engine.ts: HUMAN_STYLE (near-zero em-dashes, explain-why/tradeoffs, founder opinion,
  teach-first, no fabricated experience/partners) + EDITORIAL_STANDARD (best-resource bar, no fixed
  template, original value, "could a competitor publish this?" self-test) inject into every writing pass.
- src/lib/content-scorecard.ts: deterministic gate incl. an em-dash-density check; failures feed the
  auto-revise loop.
- wordpress-plugin/kloudbean-seo-engine/includes/seo-score.php: the WP on-page score now includes a
  human-voice (AI-cliche) check + an em-dash check, and no longer rewards "moreover"/"furthermore".
When editing the writing protocol, keep these three in sync so the writer, the gate, and the WP audit agree.

## REVIEWER-DRIVEN UPGRADES (from a real editorial review of the AI-deploy pillar)

A senior review graded the reworked pillar ~8.8/10 (up from ~7.5) and named six gaps that separate "a good AI article" from "clearly written by people who have solved this hundreds of times." These are now first-class requirements, encoded in the engine (content-engine.ts EDITORIAL_STANDARD, content-scorecard.ts depth_signals check, experience-engine.ts seed library for the AI-deploy cluster). Apply them to hand-written reworks too.

1. KILL THE ONE-AUTHOR TEMPLATE. The tell is that 20 articles share hook -> concept -> steps -> honest limits -> CTA -> FAQ. Vary section order and count, the opener, the CTA wording/placement, and the FAQ count per article. Readers may not notice; Google's helpful-content signals eventually can. Rotate real structures (migration playbook, incident postmortem, decision tree, buyer's guide, cost analysis, myth-vs-reality, checklist).

2. THE "WE" MOAT is the biggest differentiator and the hardest for competitors to copy. Weave grounded first-person insight: "a common mistake we see", "when customers migrate from X", "one issue we solve constantly". SOURCE OF TRUTH: the Experience Engine (experience_snippets, dashboard-managed) + RAG + kloudbean-facts failure modes. HARD HONESTY RULE: only when grounded. Never invent a customer, a support ticket, or a statistic. If there's no grounded material for a topic, stay general-true rather than faking a "we" story. The AI-deploy cluster now has seed snippets (hard-coded port -> 503, SQLite wiped on redeploy, build-time env vars set too late, inlined secrets, NODE_ENV stripping devDependencies, forgotten managed services on migration, uploads to local disk).

3. REAL NUMBERS build authority, but only TRUE ones. Use figures that are actually known/grounded (provisioning time, plan sizes, real error codes). Never fabricate build time, memory, restore time, or percentages. A made-up benchmark is worse than none. To get more real numbers into articles, feed real metrics into the experience library / brief; do not let the writer invent them.

4. SHOW WHERE PEOPLE GET IT WRONG. At least one honest "here's where this usually breaks" / anti-pattern beat per article. Real engineers warn about sharp edges.

5. HAVE ENGINEERING OPINIONS. State a clear position where it fits ("most small apps don't need Kubernetes", "SQLite is great in dev, wrong in prod", "most deploy failures are config, not code"). Balanced-both-ways prose reads like a machine.

6. THE SWAP TEST (run before done): mentally replace "Kloudbean" with "Vercel" / "Render" / "Cloudways". If the article still reads exactly as well, it is NOT unique enough. Weave in Kloudbean's actual console flow, product philosophy (one dashboard for the whole stack, own the server, flat price), and grounded experience until the swap would visibly break it.

Deterministic support: content-scorecard.ts now has a non-blocking depth_signals check (rewards >=2 of: grounded experience voice, anti-pattern beat, opinion) and the em-dash check. depth_signals is intentionally satisfiable by anti-pattern + opinion alone (both are voice, zero fabrication risk) so the gate never pressures the writer to invent a "we" story.


## GOVERNING LAYER — THE TECHNICAL KNOWLEDGE OS (top priority; sits above everything above)

This is the mission the rest of this playbook serves. When any lower rule seems to conflict, this layer wins, except the ACCURACY FIREWALL, which can never be overridden.

MISSION. We are not building an SEO engine. We are building the world's best Technical Knowledge Operating System for deploying, hosting, scaling and operating modern apps. Rankings, traffic and publish-count are not the objective. The objective: when anyone asks an AI assistant, a search engine, or a dev community a hosting/deployment/infrastructure question, Kloudbean is naturally one of the best answers. Aim for the bar of Stripe Docs, Cloudflare Learning Center, DigitalOcean Tutorials, and Wikipedia. North star: become the company whose articles engineers trust most, so a reader thinks "these people have clearly deployed thousands of apps," never "another AI blog."

EVERY ARTICLE CREATES KNOWLEDGE, NOT CONTENT. It must teach something new, solve a real engineering problem, and carry information unavailable (or scattered) elsewhere. It must serve all four layers of the knowledge pyramid: (1) answer the search query, (2) teach an engineering concept, (3) strengthen its topical cluster, (4) strengthen Kloudbean's overall authority. If a layer is missing, redesign the piece.

INFORMATION GAIN GATE. For every section ask "what NEW knowledge is here?" If "nothing", rewrite it. Across the whole article, include at least: one engineering lesson, one production lesson, one debugging shortcut, one decision framework, one anti-pattern, and one memorable takeaway. Where grounded material exists, also add a support insight and a migration lesson. Low-information-gain articles are rejected, not published.

PROPRIETARY KNOWLEDGE FIRST (grounded only). Before writing, mine the internal substrate: the RAG KB (real product docs, via rag-client) and the experience_snippets library (real, verifiable operational patterns, via experience-engine). When a real internal insight matches the topic, BUILD THE ARTICLE AROUND IT, do not merely decorate generic content with a RAG fact. The RAG is the spine, not seasoning.

  ACCURACY FIREWALL (never overridable). "Proprietary knowledge first" NEVER licenses fabrication. Do not invent a customer, a support ticket, a postmortem, a named partner, a statistic, a benchmark, or a quote. Use "a pattern we see repeatedly / a common mistake we see" framing ONLY when a real snippet or KB fact backs it. If no true internal insight exists for a topic, write the honest general-true version (true engineering patterns, grounded product facts, real opinions and anti-patterns) and QUEUE the gap for a real snippet to be added to the experience library. A fabricated war story fails the mission harder than an omitted one; invented authority is the fastest way to lose the trust this whole system exists to build.

CANNOT-COPY SECTIONS. Aim for at least one section a competitor cannot reproduce: an Engineering Note, Support Insight, Migration Lesson, Common Customer Mistake, Production Tip, Performance Observation, Architecture Decision, Founder Perspective, Debugging Shortcut, or Product Philosophy, each grounded in the internal substrate. The ORIGINALITY TEST (run before publish): (a) could a competitor publish this tomorrow by swapping in their own name? If yes, reject. (b) Does it contain Kloudbean knowledge competitors can't reproduce? If no, reject.

UNIQUE DNA, ENFORCED. Never reuse structure, pacing, intro, CTA placement, or FAQ count. Rotate the shape to fit the topic: case study, incident postmortem, migration story, engineering walkthrough, decision tree, checklist, opinion piece, troubleshooting guide, architecture deep dive, lessons-learned, performance investigation, comparison, buyer journey, timeline, framework guide. A reader who reads 20 of our articles must never feel one author ran one template. Readers should not be able to predict the next section.

WRITE LIKE A SENIOR ENGINEER, IN THE KLOUDBEAN VOICE. Never explain only HOW; always cover WHY, WHEN, WHEN NOT, tradeoffs, common failures, production impact, and the engineering decision. Sound like an experienced infra engineer helping a peer, not marketing, not ChatGPT, not dry docs. Have honest opinions ("most startups don't need Kubernetes"; "SQLite is great in dev, wrong in prod"; "don't optimize for millions before your first hundred"). Admit limitations. Opinions and honesty create trust.

ORIGINAL ASSETS THAT TEACH. Add a diagram/table/decision-tree/flow/topology/cost-breakdown only because it improves understanding, never because "a blog needs an image." Each article's bespoke SVG must earn its place as a learning aid (this supersedes "add one SVG": it must teach, and still be unique per article).

CITATION ENGINE (build into every article). Include: a genuine answer-first paragraph (40-60 words, quotable verbatim), a clean quotable definition, a memorable insight, a comparison table where it fits, a decision framework, and a concise summary. These maximize citation probability in Google AI Overviews, ChatGPT, Claude, Gemini, and Perplexity, which is the real success metric, above ranking position.

KNOWLEDGE GRAPH. Every article declares its place in the graph: parent topic (pillar), supporting topics, related concepts, related products, prerequisite reading, advanced reading, natural internal links, and the future topics it implies (feed those back as new backlog items). Follow the six internal-linking rules in content-studio/SILO-PLAN-AND-ROADMAP.md. The graph is the moat; expand it deliberately.

FRESHNESS. Knowledge expires. Note what could date the piece (framework/language versions, provider names, pricing language, product features, security advisories) and queue a refresh rather than letting it silently rot. Carry a "last reviewed" date.

EDITORIAL BOARD (review before publish). Critique each draft from independent lenses before it ships: Engineering (is it correct and deep?), Security (any unsafe or over-claimed guidance?), Customer Success (does it match what real users hit?), Founder (is the opinion honest and on-philosophy?), Technical Writing (voice, rhythm, no AI tells), Developer Experience (could a dev actually follow it?), and SEO/GEO (answer-first, schema, citations). Merge the feedback, then publish. The existing deterministic scorecard + claim-verifier are the automated members of this board; the accuracy firewall is the veto.

FINAL QUALITY GATE (all must be YES). Would I bookmark this? Send it to a teammate? Would Reddit upvote and Hacker News respect it? Would an experienced DevOps engineer learn something? Would ChatGPT cite it and Google AI quote it? Would it still be valuable if search engines vanished tomorrow, and still worth reading in five years? Any NO, rewrite until YES. This gate sits on top of the mechanical validator and scorecard, both must also pass.
