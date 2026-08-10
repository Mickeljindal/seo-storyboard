# Brief: error-410-gone

## Keyword grounding (gap export + organic.Positions)

The 408 and 410 families together are 19,400 across 29 keywords, and they split cleanly by difficulty.
**410 is the soft half** and the one taken here.

| Keyword | Vol | KD | Holder |
|---|---|---|---|
| **410 error** (primary) | **2,400** | **25** | kinsta |
| error 410 | 1,900 | 23 | kinsta |
| 410 redirect | 880 | 18 | kinsta |
| http 410 | 720 | 23 | kinsta |
| 410 error code | 590 | 28 | kinsta |
| 410 errors | 390 | 17 | kinsta |

410 side roughly 6,900 at KD 17-28. The 408 side is larger (~12,500) and materially harder: "408 error"
2,400/KD 40, "408 error code" 1,300/KD 37, "http 408" 1,300/KD 37, "408 code" 880/KD 44. Left for now,
recorded rather than forgotten.

**Secondary terms woven in:** 410 vs 404, 410 gone status code, soft 410, 410 redirect, nginx return 410,
Redirect gone apache, RewriteRule G flag, HttpResponseGone, deindex removed page, expired job listing seo.

## Why this completes something
The 4xx silo now reads 400, 401, 402, 403, 405, 406, 409, 410, 422, 429, 431. That comprehensiveness is
worth having for topical authority independent of any single article's volume, and 410 was the last soft
gap in it.

## Placement
Primary keyword in H1 context, title, meta description, TL;DR, and the first FAQ. The
comparison intent ("410 vs 404") is served by the second H2 and its own FAQ entry, since that is what
most of these queries actually mean.

## Cannibalisation check
Zero dedicated coverage; only single incidental mentions of 410 elsewhere. `302-found-vs-301-redirect`
covers the four redirect codes (301/302/307/308) and does not touch 410, so the two are complementary and
cross-linked. The article deliberately opens its decision table with the 301 row and links out there,
because for a large share of readers a redirect is the correct answer and sending them away is more useful
than keeping them.

## Structure choice
Decision-first, then mechanism. The table comes before the explanation because most readers arrive needing
to pick a code, not to understand HTTP semantics. Shorter than the batch average at 2,312 words, on
purpose: the topic does not support more without padding.

## Original value competitors do not have
- **LEADS THE DECISION TABLE WITH 301, NOT 410.** The most common correct answer for someone researching
  410 is a redirect, and saying so first costs the page nothing and saves the reader from the expensive
  mistake. Competing pages sell 410 because 410 is the topic.
- **Frames the two codes as statements with different scope**: 404 is a claim about the present only, so a
  crawler is entitled to keep checking; 410 is a claim about the past and the future, which is why it
  carries more weight. That explains the behaviour rather than asserting it.
- **DELIBERATELY DEFLATES THE SEO CLAIM**, which is where this topic's writing is worst. States plainly
  that 410 is a clearer signal and not a magic deindexing button, that both codes eventually drop a URL,
  and that the tool for urgent removal is a search console rather than a status code. Being the page that
  refuses to overpromise is the differentiator on this query.
- **Names the volume threshold where it actually matters**: expired listings on a job board or classifieds
  site, where the count is high enough for crawl efficiency to be real. Then the counterpoint most pages
  would never print: "If you have twelve broken links, fix the links."
- **The post-compromise use case**, which is genuinely useful and absent from competing coverage: injected
  spam URLs from a hack are indexed and getting traffic, and 410 states they are gone more clearly than a
  404 that reads as maybe-a-mistake.
- **SOFT 410 named as the same bug as a soft 404**, with the line that makes it stick: "The status code is
  the message; the words on the page are not." Plus the curl output showing the 200 that should be a 410.
- **Says the browser cannot show you this.** Your error page may look identical either way, so `curl -sI`
  is the only verification, which is the step people skip.
- **The blanket-410-after-migration warning**, which is the realistic way this goes wrong at scale: most
  old URLs have a successor and mapping them to 301s preserves traffic and rankings.
- **Forgetting the internal links** as a named mistake: a correct 410 does not fix the menu item still
  pointing at it, so you have built a deliberate dead end into your own navigation.
- **Reframes a 4xx-heavy log report**: expired listings returning 410 are a healthy site working as
  designed, while hundreds of 404s from internal links are a maintenance problem. Same shape in a report,
  opposite meanings.
- **Five stacks in the code section** (nginx, Apache both ways, Express, Django, Laravel) plus the
  WordPress-plugin note, so the reader can act regardless of stack.

## Facts discipline
Deliberately modest, because this is a config topic and any host supports it. The article says so
outright. Kloudbean claims limited to: staging for WordPress and Laravel (correctly scoped), automatic
backups, managed servers on 7 clouds with the web server maintained, free SSL issued and renewed, one
dashboard, from $8/mo, free migration assistance. All confirmed.

The genuinely useful product angle is the access log, framed as how you discover which removed URLs are
still being requested. No claim about log retention specifics, no analytics product claimed, no SEO
outcome promised.

## Internal links (7, all verified)
302-found-vs-301-redirect (x2), fix-503-after-deploying-your-app (x2), secure-wordpress-hosting (x2),
err-too-many-redirects, 403-forbidden-error, 405-method-not-allowed, 304-not-modified

## Left for a future batch
The 408 Request Timeout family (~12,500 at KD 31-44). Harder, and 408 pairs more naturally with the
timeout material in fix-504-gateway-timeout than with 410, so if written it should cross-link there and
lead on the distinction that a 408 blames the client for being slow to SEND, unlike a 504 where the server
was slow to respond.
