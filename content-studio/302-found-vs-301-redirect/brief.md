# Brief: 302-found-vs-301-redirect

## Keyword grounding (SEMrush gap export, 2026-07-23)

The 302 cluster within a redirect family of **134,410 across 282 keywords**. Entry point is unusually
soft for the volume.

| Keyword | Vol | KD |
|---|---|---|
| **302 found** (primary) | **4,400** | **17** |
| 302 error | 4,400 | 27 |
| http 302 | 5,400 | 38 |
| error 302 | 2,400 | 32 |
| 302 error code | 2,400 | 39 |
| 302 redirect | 1,900 | 35 |

Roughly **20,900 combined** for the cluster. Primary set to "302 found" at KD 17, the softest entry,
rather than the higher-volume "http 302" at KD 38. Kinsta holds the SERP.

**Secondary terms woven in:** 301 vs 302, 301 moved permanently, 307 temporary redirect, 308 permanent
redirect, 303 see other, redirect status codes, is 302 bad for seo, $request_uri, return 301 nginx,
redirect chain, num_redirects, url_effective, hsts.

## Placement
Primary keyword in H1, title, meta, lead, TL;DR. 8 FAQ entries covering the real PAA set.

## Original value competitors do not have
- **INVERTS THE STANDARD ADVICE.** Everyone says prefer 301 for SEO. This article argues 302 is the
  safer default while a redirect is new or uncertain, because of caching: a wrong 301 persists in
  browser caches after you fix the server and you cannot recall it, while a wrong 302 self-corrects
  on the next request. That is a genuine, checkable, founder-level position and it is the article's spine.
- **The concrete scenario that makes the risk real**: you 301 to the wrong place, notice in an hour,
  fix it, and everyone who hit it in that hour is permanently misdirected. Options are to make the
  wrong destination work or ask people to clear their cache, which at scale is not a plan.
- **A four-code table including the method-preservation column**, with the history that explains why
  307 and 308 exist: clients converting POST to GET on 301/302 became so common it was effectively
  standard. Turns a lookup into an understanding.
- **"Silently converting a POST to a GET turns a redirect into a data loss bug"** as the reason to use
  307/308 on any endpoint receiving POST, PUT, or DELETE.
- **The SEO folklore corrected without overclaiming**: Google has said 3xx generally pass signals, so
  the difference is about canonicalisation rather than leaked value. Hedged, not asserted as a precise
  algorithmic fact.
- **A single decisive test replacing the rule-of-thumb**: "which URL do you want in search results in
  six months?" That decides it correctly nearly every time and is more useful than any ranking-transfer
  rule.
- **An eleven-row situation table** including the rows people get wrong: maintenance pages (reversal
  must be instant), geographic routing (destination varies per visitor), and post-form 303.
- **`$request_uri` called out as the character that saves a migration.** Losing the path in a domain
  move is common and expensive, and the fix is one variable. Includes a curl command specifically to
  verify the path and query survived, which is the check people skip.
- **`return` preferred over `rewrite`** with three reasons: faster, unambiguous, and cannot accidentally
  match its own destination.
- **A cache-lifetime header on a 301** as a way to keep a permanent redirect on a shorter leash.
- **"Browsers cache redirects, which makes them poor test instruments"**, so use curl.
- **404 or 410 rather than redirecting everything to the homepage**, with the reason stated from the
  visitor's side rather than only the SEO side.

## Internal links (6, verified)
err-too-many-redirects, err-cache-miss, 304-not-modified, custom-domain-and-ssl-for-your-app,
fix-ssl-certificate-errors, security-headers-guide, nginx-reverse-proxy-for-node

## Facts check
Kloudbean claims used: free SSL issued and renewed, one-click staging, managed nginx, one dashboard,
flat from $8/mo, free migration assistance. All in kloudbean-facts.md. Product claim is deliberately
modest because redirects are configuration the reader writes; overreaching would weaken a page whose
argument is about judgement rather than tooling.
