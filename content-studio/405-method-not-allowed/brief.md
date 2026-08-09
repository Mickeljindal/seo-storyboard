# Brief: 405-method-not-allowed

## Keyword grounding (SEMrush gap export, 2026-07-23)

Family totals **25,470 across 18 keywords**, KD 26 to 39. Zero prior coverage.

| Keyword | Vol | KD |
|---|---|---|
| error 405 | 5,400 | 35 |
| 405 error | 4,400 | 39 |
| http error 405 | 4,400 | 35 |
| **http 405** | **2,900** | **29** |
| **405 method not allowed** (primary) | **1,900** | **26** |
| 405 status code | 1,300 | 38 |

Kinsta holds the SERP. Primary set to "405 method not allowed" at KD 26, the softest entry, with
"http 405" at KD 29 as the secondary target rather than chasing "error 405" at KD 35.

**Secondary terms woven in:** method not allowed, Allow header, OPTIONS preflight, CORS preflight 405,
access-control-request-method, 404 vs 405, 307 308 preserve method, trailing slash redirect,
nginx static file POST, limit_except, error_page 405, X-HTTP-Method-Override, wordpress rest api
delete 405, PATCH vs PUT.

## Placement
Primary keyword in H1, title, meta, lead, TL;DR. The H1 leads with the CORS angle because that is the
highest-value discovery in the article. 8 FAQ entries.

## Original value competitors do not have
- **THE HEADLINE INSIGHT: your CORS error might actually be a 405.** Browsers send an OPTIONS preflight
  before most cross-origin requests; an unhandled OPTIONS returns 405; the browser reports a missing
  Access-Control-Allow-Origin header. So developers configure CORS headers repeatedly with no effect,
  because the preflight was rejected before any CORS logic ran. Includes the exact curl command to test
  the preflight with Origin, Access-Control-Request-Method and Access-Control-Request-Headers. This is
  a genuine diagnostic that resolves a very common dead end, and it is the reason the article leads
  with it rather than burying it as cause four.
- **"ORDERING MATTERS MORE THAN THE CONFIGURATION"** — CORS middleware registered after the router, or
  a catch-all answering first, means the preflight is handled by something that does not understand it.
- **A 405 IS PARTIAL SUCCESS**, framed positively: it confirms the path exists and your routing and
  spelling are correct, so the typo hunt can stop. Nobody frames it as useful information.
- **THE `Allow` HEADER as required-and-usually-missing**, with the note that sending it turns the error
  into its own documentation and costs one line.
- **THE REDIRECT-CONVERTS-POST-TO-GET CAUSE**, which produces a 405 that looks impossible because the
  endpoint definitely accepts POST. Includes the trailing-slash version where one character decides
  whether the request works. Cross-links to 302-found-vs-301-redirect, where 307/308 exist precisely to
  prevent this, so the two articles reinforce one real mechanism.
- **nginx RETURNS 405 FOR A POST TO A STATIC FILE**, and the diagnostic tell that the request never
  appears in application logs because the application never saw it. Names `error_page 405 =200 $uri;`
  as a workaround that hides a routing bug rather than fixing it.
- **`X-HTTP-Method-Override` AS A DIAGNOSTIC, not just a workaround**: if the override succeeds where
  the real verb fails, something in the path is filtering methods rather than your permissions being
  wrong. That inference is the valuable part.
- **A VERB CONVENTION TABLE with an "also seen" column**, acknowledging that REST conventions are not
  universal, plus the specific note that PATCH is most likely to be unimplemented so a full PUT is the
  first thing to try.
- **THE REVERSE MISTAKE NAMED**: returning 405 for a resource that does not exist is worse than the
  404-to-hide-routing habit, because the status code is actively lying and sends people to inspect
  their verb when the path is wrong.

## Internal links (7, verified)
fix-cors-error-node-production, 302-found-vs-301-redirect, 400-bad-request,
http-422-unprocessable-entity, 403-forbidden-error, 409-conflict-error, nginx-reverse-proxy-for-node,
wp-rest-api-guide

## Facts check
Kloudbean claims used: managed nginx with routing configured, SSH access, managed WordPress with the
REST API working, one dashboard, flat from $8/mo, free migration assistance. All in
kloudbean-facts.md. Honest boundary stated (nobody else decides which verbs your routes accept or
handles your preflight). nginx static-file method behaviour and WordPress method-override support are
documented behaviours of third-party software, not Kloudbean features.
