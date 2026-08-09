# Brief: 304-not-modified

## Keyword grounding (SEMrush gap export, 2026-07-23)

| Keyword | Vol | KD |
|---|---|---|
| **304 error** (primary) | **4,400** | **28** |
| 304 status code | 1,900 | 40 |

Roughly **6,300 combined**, from the same redirect and status-code family (134,410 across 282
keywords). Kinsta holds the SERP with a dedicated page.

**Note on the primary keyword.** People search "304 error" even though a 304 is not an error. The
article uses that phrasing in the meta description and answers it directly in the first FAQ ("Is 304
Not Modified an error?"), while the H1 corrects it. That way the page matches the query and still
teaches the right thing.

**Secondary terms woven in:** 304 not modified, etag, last-modified, if-none-match,
if-modified-since, conditional request, cache-control immutable, max-age, fingerprinting, cache
busting, FileETag MTime Size, apache etag inode, vary header, no-store vs no-cache.

## Placement
Primary term in title and meta, corrected framing in H1, TL;DR answers the misconception directly.
8 FAQ entries.

## Original value competitors do not have
- **Leads with the correction: a 304 is a success and seeing lots of them is good.** Reframes the
  reader's whole question, since they arrived believing they had an error.
- **Walks the actual conditional-request conversation** with real headers on both sides, so the
  mechanism is understood rather than described. Then gives a two-command curl test to watch it
  happen, including the diagnostic conclusion if the second request returns 200 instead of 304.
- **THE APACHE INODE ETAG PROBLEM, which is the standout.** Apache's default ETag includes the file's
  inode, which differs per server, so identical files produce different ETags across a load-balanced
  pool and browsers re-download everything on every server change. Nothing breaks, the site is just
  silently slower and more expensive, which is why it goes unnoticed for years. One-line fix
  (`FileETag MTime Size`). Includes the note that nginx is not affected, which is honest and also
  happens to favour the platform.
- **Identifies what the reader is actually searching for**: they deployed and users see old files.
  Names 304 as the messenger, then argues against the instinctive fix (disabling caching) with the
  cost stated: you pay full transfer on every visit forever to solve a problem that occurs on deploys.
- **The fingerprinting pattern explained as a system, not a tip**: hashed filenames plus
  `immutable, max-age=31536000` on assets and `no-cache` on HTML, with the logic spelled out. Cheap
  HTML check names the current assets, assets cached for a year are safe because a new build produces
  new names. No purging, no hard-refresh instructions.
- **The `immutable` directive** as a way to skip even the 304 round trip, with the caveat that it is
  only safe on fingerprinted files.
- **A six-row problem table** distinguishing the genuine failure modes, including the security row:
  a validator that ignores what varies per user lets a cache serve one visitor's page to another.
  Covers `private` and `Vary` as the fix. That is a real exposure rather than a performance nuisance
  and it is absent from competing coverage.
- **Two awk one-liners for reading your own access log**, including the one that lists static assets
  repeatedly returning 200, which turns an abstract recommendation into a measurable finding.
- **ETag vs Last-Modified table with the "catches a revert" row**, which is the concrete reason ETag
  is the stronger validator.

## Internal links (7, verified)
cdn-explained, redis-caching-guide, redis-caching-patterns, err-cache-miss,
302-found-vs-301-redirect, security-headers-guide, how-to-clear-wordpress-cache, speed-up-wordpress,
managed-redis-hosting

## Facts check
Kloudbean claims used: managed nginx configured, Cloudflare paid add-on and free for enterprise
(edge caching), managed Redis, staging sites, one dashboard, free migration assistance. All in
kloudbean-facts.md. Honest boundary stated (nobody else can fingerprint your assets, that is your
build config). The nginx-versus-Apache ETag point is a factual difference between the two servers,
not an invented advantage.
