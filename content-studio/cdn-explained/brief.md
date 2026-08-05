# Brief — CDN Explained (answer-first concept explainer)

Silo 8 (infra concepts). Spoke under how-cloud-hosting-works (link UP to the pillar).
FORMAT: answer-first concept explainer. NOT a how-to/numbered-steps template. Opener = the physics of distance/latency, not the LB article's "2am" scenario. Vary section order, heading phrasing, FAQ count (10) so it does not read like one template shared with the sibling.

## Keywords (grounded in intent; volumes hedged, not fabricated)
- Primary: "CDN explained" (informational). In H1, <title>, meta description, first 100 words, and one H2.
- Secondary / weave: "what is a CDN", "content delivery network", "edge caching", "how does a CDN work", "do I need a CDN", "cache hit vs cache miss", "CDN vs load balancer", "will a CDN fix my slow website", "TTL / Cache-Control".
- PAA-style questions drive the FAQ (what is a CDN in simple terms / how does it work / CDN vs origin host / does it speed up a logged-in site / small-site need / what is edge caching / CDN vs load balancer / will it fix a slow site / cache hits and misses / does Kloudbean include a CDN).
- Note: no live SEMrush/DataForSEO export was supplied for this slug; volumes intentionally omitted rather than invented.

## Shape / sections
Lead (distance = latency, physics) -> .tldr (40-60w answer-first definition) -> What is a CDN? (edge servers, PoPs, origin) -> bespoke SVG edge map -> How does a CDN work? (cache hit / miss / origin pull, X-Cache header) -> TTL & cache headers (Cache-Control, s-maxage, ETag, fingerprinting) -> What a CDN speeds up vs can't (cmp table + cache-poisoning anti-pattern) -> CDN vs load balancer (differentiate sibling) -> Do I need a CDN? (global/static-heavy vs tiebreaker; put origin in the right region first) -> The honest limit (founder note) -> How the edge fits on Kloudbean (Cloudflare add-on) -> CTA -> FAQ (10) -> byline.

## Bespoke SVG
CDN edge map: Visitor -> nearest edge PoP; cache HIT (green) returns the cached copy; cache MISS (purple dashed) pulls from the distant origin, which then fills the edge. Two generic PoPs imply the global network. Brand navy #000f27, purple #4F1AF3, green #40b75f. Unique vs the LB fan-out and the pillar pipeline.

## Console screenshots (real, in ../assets/console/)
- cloudflare.png (Cloudflare edge caching add-on) in the Kloudbean section.
- dashboard.png (whole stack, one login) in the Kloudbean section.
- 3 img-slots: X-Cache HIT header in DevTools; Cache-Control/ETag response headers; cache-vs-origin analytics.

## Founder note / original value
"A CDN makes a far static asset fast. It does not make a far database fast." Anti-pattern: caching a logged-in HTML page and leaking User A's account page to User B. Real specifics: X-Cache HIT/MISS, Cache-Control max-age/s-maxage, ETag/304, filename fingerprinting, light in fiber ~200,000 km/s so an ocean round trip is tens of ms.

## Fact constraints honored
Cloudflare Enterprise edge caching = real PAID add-on, FREE for Enterprise. Do NOT claim Kloudbean runs its own global CDN network. CDN concepts general/accurate. from $8/mo, Enterprise custom (verify on pricing page). Linux stacks. No customer/geo counts, no SLA %. Escape entities in <pre>.

## Internal links (6, all folders confirmed to exist)
UP: how-cloud-hosting-works. ACROSS: cloud-load-balancer-explained, speed-up-wordpress, data-residency-explained, ddos-protection-explained. MONEY: best-managed-cloud-hosting.

## Byline
"By Kloudbean Edge · Cache it close, and the distance stops mattering." (NOT "Faster Than Ever".)

## Slug
cdn-explained
