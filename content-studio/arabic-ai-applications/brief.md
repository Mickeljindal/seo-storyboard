# Brief: arabic-ai-applications

## Target
- **Primary keyword:** Arabic AI applications
- **Secondary / long-tail:** Arabic LLM, Arabic chatbot, Arabic NLP, RTL chat UI, Arabic tokenization cost, Arabic embeddings, dialectal Arabic AI, store Arabic text in a database, Arabic language model, Arabic retrieval, why does my AI app work in English but not Arabic, does Arabic cost more tokens, which model is best for Arabic, MSA vs dialect.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no fabricated figures are recorded. Treat as a mid-tail engineering-intent query in the AI-deploy cluster, with a KSA/MENA slant that overlaps the Saudi hosting pillar. Grounding is intent-based, not volume-based (per the SEO OS: relevance over raw volume). Re-pull real Volume + KD before scaling an Arabic sub-cluster.

## Reader + business outcome
- **Reader:** a developer or team building an AI app (chatbot, RAG assistant, agent) that has to actually work in Arabic for a Saudi or wider MENA audience. They built and tested in English, and Arabic is quietly degrading (cost, dialect quality, RTL UI, storage, retrieval).
- **Business outcome:** own the AI-specific Arabic engineering intent, route to Kloudbean's always-on Node/Python + managed Postgres/MySQL (Unicode storage) + pgvector + in-Kingdom GCP Dammam region, and cross-link the Saudi hosting pillar and the WordPress/RTL display piece. Land on the honest managed boundary and the qualified sovereignty line.

## Intent + format
- **Intent:** informational engineering guide (what breaks in Arabic and how to fix it), with a commercial tail (where to host it for Saudi users).
- **Format:** field-guide / "where it degrades" shape (varied from the chatbot template): stakes + a degrade-map table, tokenization/cost with a unique tokenization SVG, MSA-vs-dialect table + firm opinion, RTL streaming bidi section, charset storage (brief, links out), Arabic retrieval normalization, in-Kingdom latency, Kloudbean grounding, deep FAQ. Not a "what is Arabic NLP 101" piece.

## Cannibalisation check (mandatory)
- `arabic-wordpress-hosting` OWNS the CMS/WordPress RTL display story, fonts, RTL caching, and the charset-question-marks bug for a CMS. This page LINKS there for the CMS version and the font/charset display bug, and OWNS the AI-app engineering: tokenization/cost, model/dialect choice, Arabic retrieval normalization, and streaming RTL chat. Charset is referenced briefly (app connection layer) and pointed there, not re-taught.
- `llm-streaming-in-production` OWNS the general SSE/WebSocket streaming mechanics. Linked; this page owns only the RTL/bidi-specific streaming concern.
- `pgvector-for-ai-apps` OWNS the vector mechanics. Linked; this page owns Arabic normalization for retrieval.
- `saudi-hosted-rag` OWNS the Saudi-hosted RAG build; linked for the retrieval + residency case.
- `hosting-ai-apps-saudi-arabia` (pillar) and `low-latency-hosting-riyadh-jeddah` OWN the hosting/latency story. Linked UP, not re-taught.
- `last-mile-of-vibe-coding` = the map of what AI builders leave for production. Linked UP.
- Decision: distinct intent (AI-specific Arabic engineering), build it.

## Information gain (one sentence)
The AI-specific Arabic failure map in one place: more tokens per word (measure, do not assume), MSA-vs-dialect evaluation on real user input, bidi/RTL streaming that does not jump, Unicode-charset storage, and normalize-before-you-embed retrieval, each with the fix and where the WordPress/streaming/vector/hosting deep dives live.

## Kloudbean grounding (facts only)
Always-on Node/Python; 7 managed databases incl PostgreSQL (UTF-8 by default), MySQL and MariaDB (utf8mb4) that store Arabic/Unicode text fine when the charset is set end to end; managed Redis; pgvector for embeddings where the plan enables it; object storage; free SSL; Git deploy; one dashboard. Can provision on GCP Dammam, Saudi Arabia (me-central2) for low latency to Saudi users and in-Kingdom residency. DB lockdown = IP allow-listing (VPC/private networking is Enterprise-only, not default). Sovereignty line QUALIFIED: "one of the only managed-cloud platforms delivering managed databases with in-Kingdom data sovereignty." Compliance = aligned with / supports, never certified. NOT claimed: an Arabic model, an NLP/translation product, or GPU/inference hosting. Kloudbean hosts your app and data; the Arabic model and app logic are yours. No invented numbers, uptime, benchmarks, or customers.

## Internal links used (all resolve)
Up: last-mile-of-vibe-coding, hosting-ai-apps-saudi-arabia (pillar). Across: arabic-wordpress-hosting, llm-streaming-in-production, pgvector-for-ai-apps, saudi-hosted-rag, low-latency-hosting-riyadh-jeddah, host-ai-chatbot-in-production. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs arabic-ai-applications` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity, blurbs=0, internal links resolve, words >= 1400. (hero.png + H2-count warnings acceptable.)
