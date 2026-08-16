# Brief — npm ERR Peer Dep: How to Read and Fix ERESOLVE Properly

Cluster: Node/npm error field guide. High AI-citation intent: people paste the raw ERESOLVE block into
search and into chat assistants. Angle: **the error is a report, not a verdict.** The information gain is
(a) teaching the reader to decode `Found:` vs `peer ... from`, which makes the fix self-evident, and
(b) ranking the fixes by correctness instead of leading with `--legacy-peer-deps` like most results do.

## Cannibalisation check (done)
- `fix-cannot-find-module-node` owns **runtime module resolution** (package vs path, devDependencies trap,
  case sensitivity on Linux, missing build output). Different layer: that one is `node` failing to resolve
  an import at run time. This one is `npm install` failing at **resolution time** on a peer range conflict.
  No H2 overlap. Linked twice instead of competing.
- `fix-node-app-crashing-on-deploy` owns boot-time crashes; linked, not overlapped.
- `fix-javascript-heap-out-of-memory-node` owns build OOM; linked for the "build dies mid-install" adjacency.
- No existing slug covers ERESOLVE / peer dependencies. Distinct intent, safe to build.

## Keywords
Primary: **npm ERR peer dep** / **fix ERESOLVE**. Placed in H1, `<title>`, meta description, first 100 words,
and the H2 "Fix npm ERR peer dep in order of correctness".
Secondary / long-tail woven through body + FAQ: ERESOLVE unable to resolve dependency tree, npm peer
dependency conflict, npm legacy-peer-deps, legacy-peer-deps vs force, npm overrides peer dependency,
could not resolve dependency peer, npm ci vs npm install, npm peer dependency error in CI.
No invented volume/KD figures recorded: none supplied for this term.

## Shape (troubleshooting field guide, deliberately not the step-1..6 template)
Lead -> tldr -> "report not verdict" -> why npm 7 changed the rules -> **decode the block line by line**
-> ranked fixes 1..5 with a correctness table -> opinion (permanent legacy-peer-deps is timed debt)
-> CI trap (warm node_modules vs clean install) -> npm ci vs npm install table -> anti-pattern (deleting
the lockfile) -> checklist -> one grounded product note -> related reading -> CTA -> 9 FAQ.

## Accuracy notes
- npm 7 onward: installs peer dependencies automatically and enforces them in resolution. No release dates
  asserted, no version-history claims beyond that.
- `--legacy-peer-deps` = skip peer checks, install anyway (npm 6 behaviour). `--force` = broader override of
  resolution, can produce a genuinely broken tree. Kept distinct throughout, including in the FAQ.
- Package/version names in the example block (`react-fancy-widget@2.1.0`) are illustrative, not claims.
- No frequencies, percentages, or benchmark numbers anywhere.

## Kloudbean grounding (one mention only, kloudbean-facts.md)
Managed CI/CD from a Git repo, deployment history, **live build logs streamed in the console** (Aug 2025).
Framed as "you can read the failing install output", explicitly NOT as fixing dependency conflicts. Pricing
stated as from $8/mo. CTA feature line uses true defaults only, no private networking.

## Internal links (5-7, all verified to exist)
fix-cannot-find-module-node (x2), fix-node-app-crashing-on-deploy, ci-cd-auto-deploy-from-github,
fix-javascript-heap-out-of-memory-node, environment-variables-done-right, deploy-node-app-to-managed-cloud.

## Assets
3 `.img-slot` spacers (annotated ERESOLVE block, local-vs-CI install, fix decision tree) plus the real
console screenshot ../assets/console/git-deployment.png. Hero images/hero.png to render.

## Gate
0 em-dashes; word count above 1400; JSON-LD Article + FAQPage + Organization (@id) valid; FAQ h3 parity
with FAQPage names (9); HTML code escaped; 0 blurbs; banned-claim grep clean; html/md in sync.
