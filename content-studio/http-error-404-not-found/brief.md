# Brief: http-error-404-not-found

## Role
Cluster 8 (HTTP status codes). Pillar deploy-static-site. Money best-managed-cloud-hosting.
Completes the HTTP-code cluster (403/405/410/451/500/502/503/504 all had pages; 404 did not).

## Keyword grounding (honest)
Primary: **404 not found** (deploy angle). Secondary: 404 after deploy, works locally 404 production,
404 on refresh react, SPA 404, case sensitivity linux 404, 404 vs 410.

## Cannibalisation (content-grep confirmed)
No dedicated general 404 page (only codeigniter-404 framework-specific; "404" appears incidentally in
~33 deploy pages as passing mentions). DISTINCT ANGLE = 404-AFTER-DEPLOY (routing/case/SPA), NOT generic
SEO "make a nice 404 page". Case-sensitivity ties to fix-cannot-find-module-node (import side) - cross-linked.

## Grounding (verified general web knowledge)
- 404 = server reachable + answered, resource not found (rules out down-server 502/503 and DNS). Deploy
  causes: CASE SENSITIVITY on Linux (works Mac/Windows, 404 on server) = the killer insight; SPA needs
  try_files /index.html fallback on refresh; wrong build output dir; base-path mismatch; front-controller
  rewrite; trailing slash. Brief soft-404/SEO note (404 vs 410).
- KB angle: web server pre-configured for the stack (SPA fallback + front-controller rewrite handled);
  runs on Linux so case-sensitivity is still the user's filenames. Honest boundary kept.

## Information gain
1. Case-sensitivity-on-Linux as the #1 production-only 404 (can't reproduce locally) - high-value, rarely led with.
2. "What a 404 rules out" (server up, DNS fine) - narrows the search, GEO-quotable.
3. SPA-404-on-refresh one-liner fix (try_files /index.html) + the deploy checklist.

## Format
HTTP-error-page pattern (match http-error-500 "what it rules out" shape): answer-first TL;DR,
what-it-rules-out, case-sensitivity, SPA-fallback, deploy-checklist (ul), honest KB fit, 8 FAQ. em-dash 0/0.
