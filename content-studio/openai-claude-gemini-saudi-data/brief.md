# Brief: openai-claude-gemini-saudi-data

## Target
- **Primary keyword:** OpenAI Claude Gemini Saudi data
- **Also targeting the natural query:** "where does your data go when you call OpenAI" (in the lead, first 100 words) and "OpenAI, Claude, or Gemini from Saudi Arabia" (title, H1, one H2).
- **Secondary / long-tail:** does OpenAI store my data, cross-border data transfer Saudi Arabia, PDPL cross-border transfer, LLM API data residency, does Claude train on API data, keep prompts in Saudi Arabia, redact PII before sending to LLM, in-Kingdom LLM alternative, API data processing terms.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied in-session for this exact phrase, so no figures are fabricated. Treat as a mid-tail, high-intent query in the "Deploy AI / Vibe-Coded Apps" cluster and the KSA sub-cluster; re-pull real Volume + KD before scaling. Grounding is intent-based (per the SEO OS: relevance over raw volume), and this is a genuine, recurring builder question with a real business tie to the in-Kingdom data-sovereignty wedge.

## Reader + business outcome
- **Reader:** a developer or founder in KSA (or building for a Saudi audience) who calls a foreign hosted model (OpenAI, Claude, Gemini) and now has to answer "where does the data physically go?" for a security review, a client, or their own peace of mind.
- **Business outcome:** own the AI-prompt-specific crossing question, route the reader to the in-Kingdom home for everything that does not have to leave (GCP Dammam app + 7 managed DBs + pgvector + object storage), land on Kloudbean's qualified data-sovereignty positioning without overclaiming.

## Intent + format
- **Intent:** informational, a data-flow map + decision guide (not a legal explainer, not a how-to-deploy).
- **Format:** varied from the reference. Boundary explainer -> payload audit (table) -> provider due-diligence (table + firm opinion) -> minimization playbook (before/after + code) -> in-Kingdom alternative -> PDPL orientation -> payload anti-pattern -> Kloudbean -> deep FAQ. One bespoke inline SVG (prompt crossing a redact/minimize gate; DB/logs/embeddings stay inside). ~2000-2600 words.

## Cannibalisation check (mandatory, against real neighbours' H2 sets)
- `hosting-ai-apps-saudi-arabia` (PILLAR, exists) owns the overall in-Kingdom AI architecture: sort-your-data table, hosted-API-vs-self-host table, worked chatbot example, latency, "Dammam theatre" infra anti-pattern. This page LINKS UP to it and does NOT repeat those. My distinct territory: what is *inside* the prompt payload, what the *provider* does with it (and the verify-not-trust rule), and a payload-level minimization playbook with before/after redaction. Different question ("what crosses and how do I shrink it" vs "how do I architect the whole thing").
- `data-residency-saudi-arabia` owns general residency vs sovereignty, where data leaks (backup/CDN), verification. Linked, not repeated; I own the AI-prompt crossing specifically.
- `pdpl-compliance-hosting` owns PDPL hosting depth + certification honesty. Linked; my PDPL treatment is a short *orientation* (regulates != bans) with an explicit "not legal advice", not a re-teach.
- `saudi-pdpl-for-ai-apps` (does NOT exist yet) will own app-level PDPL obligations. Referenced in prose only ("their own topic"), deliberately NOT linked so validation passes.
- My anti-pattern ("a full customer record in every system prompt") is payload-level and distinct from the pillar's infra-level "Dammam theatre"; they reinforce, they don't duplicate.
- Decision: distinct intent, build it, link up to the pillar twice.

## Information gain (one sentence)
It makes the border concrete at the payload level: the five things inside a prompt that can carry personal data, a verify-don't-trust rule (plus the questions to ask each provider) instead of fabricated provider policies, and a real before/after redaction so a KSA builder can measurably shrink what crosses the border.

## Kloudbean grounding (facts only)
GCP Dammam (me-central2) in-Kingdom; always-on (no cold starts); Node/Python; 7 managed DB engines (MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB); pgvector where the plan enables it; S3-compatible object storage with no egress fees; automatic backups; free SSL; Git deploy; one dashboard; DB locked down by IP allow-listing (private VPC is Enterprise-only, not default). Qualified positioning: "few managed-cloud platforms pair fully managed databases with true in-Kingdom data sovereignty, and Kloudbean is one of them" (never bare "only provider"). Compliance = "aligned with / supports" PDPL and NCA, never "certified" or "makes you compliant"; shared responsibility. Explicitly NO GPU/model-inference hosting (self-hosting an open model is a general option, not a Kloudbean feature). No invented numbers, retention windows, prices, uptime, benchmarks, or customer counts.

## Internal links used (8, all resolve)
Up: last-mile-of-vibe-coding, hosting-ai-apps-saudi-arabia (pillar, x2). Across: data-residency-saudi-arabia, pdpl-compliance-hosting, managed-databases-saudi-data-sovereignty, gcp-dammam-region-guide, deploy-ai-agent-without-exposing-api-keys, rag-in-production. Money: kloudbean.com + /pricing/. Deliberately NOT linked (do not exist / self): saudi-hosted-rag, saudi-pdpl-for-ai-apps, arabic-ai-applications, openai-claude-gemini-saudi-data.

## Accuracy / guardrails honoured
- No provider's current training/retention/region policy asserted as fixed fact; framed as "read their current API terms / DPA" + the durable consumer-vs-API-tier rule.
- PDPL: regulates, does not ban, cross-border transfer; explicit "not legal advice" + advisor pointer.
- Providers get neutral, fair treatment; no disparagement, no overstated protections.
- No banned claim classes (certified, makes-you-compliant, guaranteed, 100% secure, best/fastest/most-secure/industry-leading).
- Near-zero em-dashes (commas/periods/parentheses). PII in the example uses obvious placeholders (1XXXXXXXXX, +9665XXXXXXXX, example.com).

## Validation
`node _val.mjs openai-claude-gemini-saudi-data` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity (10), Article + FAQPage JSON-LD, blurbs=0, internal links resolve, words >= 1400. Acceptable warnings: H2 count off-by-one (CTA is an H2 in md, a styled div in html), hero.png absent (render later).
