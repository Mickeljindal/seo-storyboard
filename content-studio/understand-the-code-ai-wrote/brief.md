# Brief: understand-the-code-ai-wrote

## Target keyword
- **understand the code AI wrote** (informational; how-to / skill guide). In H1, title, meta description, first 100 words, and one H2.

## Secondary keywords (by intent)
- read AI-generated code (informational)
- understand my Lovable code / understand my Cursor code (informational, tool-specific)
- what did the AI build (informational, comprehension)
- audit AI code (informational, leaning security-adjacent)
- read a codebase as a non-developer (informational, audience-defining)
- how to read a stack trace (informational, long-tail woven into a section + FAQ)
- frontend vs backend code (informational, woven into a section + FAQ)

Volumes not asserted (no verified export pulled for this slug; grounded by the vibe-coder cluster's existing demand and the sibling security article). If precise volume/KD is needed later, pull from the SEMrush gap data or DataForSEO before quoting figures.

## Cannibalisation check
- No existing article teaches reading/understanding AI-generated code as a comprehension skill. Confirmed by scanning the content-studio slug list.
- Closest neighbour is **ai-built-app-security-checklist**, which is a fix-the-holes SECURITY checklist (secrets, DB exposure, auth, CORS, CVEs, HTTPS, rate limits, backups). This article is a COMPREHENSION skill guide (folder map, entry point, request flow, frontend vs backend, reading a stack trace, getting the AI to narrate its code). It complements, does not duplicate: the "where the money and risk hide" section is about *finding* those spots, then links to the security checklist for the *fix*.
- Also distinct from **why-my-ai-app-works-locally-but-not-in-production** (an env/deploy troubleshooting piece) and **last-mile-of-vibe-coding** (going-live gaps). This one is upstream of all of them: literacy in your own codebase.
- Decision: build. Different intent, links to neighbours instead of competing.

## Information gain (one sentence)
Teaches a non-developer a repeatable navigation method (folder map, entry point, follow-one-request, frontend/backend boundary, stack-trace reading, and AI-narration-with-verification) plus a copy-paste red-flag search, so they can read and audit their own AI-built app rather than depending on the tool.

## Format
Practical skill guide, ~2000+ words. answer-first .tldr, 3 comparison tables (folder/file map, frontend vs backend tells, red-flags-to-search), one teaching SVG (request flow browser -> route -> handler -> DB with the server boundary marked), real code (package.json snippet, a grep search command, an "explain this file" prompt, a sample stack trace), 4 image slots, 9-question FAQ. Knowledge-first tone: purely educational, host-agnostic; Kloudbean appears once lightly near the end (logs) plus the CTA.

## Internal links used (5, all resolve)
- environment-variables-done-right
- ai-built-app-security-checklist
- deploy-ai-agent-without-exposing-api-keys
- why-my-ai-app-works-locally-but-not-in-production
- last-mile-of-vibe-coding

(Additional cluster neighbours available if more links are wanted later: why-ai-apps-fail-in-production, deploy-ai-built-app-to-production, ai-app-production-readiness-checklist.)
