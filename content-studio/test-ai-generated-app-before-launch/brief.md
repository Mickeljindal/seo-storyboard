# Brief: test-ai-generated-app-before-launch

## Target
- **Primary keyword:** test an AI-generated app
- **Secondary / long-tail:** test AI-written code, smoke test before launch, does my AI app work, verify AI-generated code, pre-launch testing checklist, trust AI code, AI wrote a passing test, how many tests before launch, what is a smoke test, should I let AI write my tests.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no fabricated figures are recorded. Treat as a mid-tail, how-to intent query in the "Deploy AI / Vibe-Coded Apps" cluster (question-shaped, PAA-heavy). Re-pull real Volume + KD before scaling the sub-cluster. Grounding is intent-based per the SEO OS (relevance over raw volume).

## Reader + business outcome
- **Reader:** someone who built an app with an AI builder (Lovable, Bolt, Cursor) or by prompting, has it working in the preview, and is nervous about launching code they did not write line by line. Not a test engineer.
- **Business outcome:** capture pre-launch, confidence-seeking intent in the AI-deploy cluster and route to Kloudbean's staging environment + real managed database + Git deploy, landing on the honest managed boundary (Kloudbean hosts and gives a realistic place to test; the tests are the customer's code).

## Intent + format
- **Intent:** informational how-to (how do I gain confidence in AI-written code before launch), with a light commercial tail (where do I test it under production-like conditions).
- **Format:** practical how-to / field guide. Varies from the reference (host-ai-chatbot) shape: opens on the "looks done vs is correct" problem, a demo-proved-vs-still-to-test comparison table, a hand-run smoke-test list, a short security-path section that defers to the security checklist, a tiny five-test harness with real code, an anti-pattern section (AI grading its own homework), a production-like testing section, then Kloudbean + FAQ. One teaching SVG, one comparison table, one code block, one note callout.

## Cannibalisation check (mandatory, done against real neighbours' H2 sets)
- `ai-built-app-security-checklist` = owns the security checklist item by item. This page does NOT rebuild it; it links to it for the security-path tests and only makes the point that security must be verified by hand. No overlap.
- `from-prototype-to-production-checklist` = owns the general prototype-to-prod list (data, config, security, reliability, performance, ops). Linked as the general list. This page is about the act of testing/verifying, not the readiness list.
- `ai-app-production-readiness-checklist` = owns the launch-readiness checklist (what must be in place). Linked as the broader companion. This page is narrower and distinct: how to test that it actually works, including a test harness and the AI-writes-its-own-tests trap, which none of the checklists cover.
- `why-my-ai-app-works-locally-but-not-in-production` = owns the local-vs-prod gap. Linked for the "test where it will actually run" point; not duplicated.
- `why-ai-apps-fail-in-production` = owns the failure-mode catalogue. Linked, not rebuilt.
- `last-mile-of-vibe-coding` = the pillar/map. Linked UP.
- Decision: distinct intent (testing/verifying AI-generated code before launch, with a harness and the AI-tests anti-pattern). Build it.

## Information gain (one sentence)
A pre-launch testing method built for code you did not write: separate what the demo proved from what it never exercised, run a seven-item manual smoke test on the untested paths (auth, bad input, error handling, post-redeploy state), write five real tests instead of chasing coverage, and avoid the trap of letting the same AI generate tests that assert its own bugs.

## Kloudbean grounding (facts only)
Staging environment (available for WordPress and Laravel); real managed database (Postgres/MySQL) to test against production-like conditions; Git deploy so a fix and re-test is one push; one dashboard (server, database, staging, SSL); automatic backups; free SSL; free migration; free trial. Honest boundary: Kloudbean hosts the app and gives a realistic place to test; the tests are the customer's code. No invented numbers, uptime, benchmarks, customers, or "certified". No overstated testing tooling. Private networking/VPC not mentioned (Enterprise-only, not relevant here).

## Internal links used (all resolve)
Up: last-mile-of-vibe-coding. Across: ai-built-app-security-checklist, ai-app-production-readiness-checklist, from-prototype-to-production-checklist, why-my-ai-app-works-locally-but-not-in-production, why-ai-apps-fail-in-production. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs test-ai-generated-app-before-launch` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity (9), blurbs=0, internal links resolve, words >= 1400. (hero.png + H2-count off-by-one warnings acceptable.)
