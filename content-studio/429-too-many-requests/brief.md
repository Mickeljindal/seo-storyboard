# Brief: 429-too-many-requests

## Keyword grounding (SEMrush gap export, 2026-07-23)

Family totals **45,460 across 66 keywords**, KD 29 to 44.

| Keyword | Vol | KD |
|---|---|---|
| **error code 429** (primary, best entry) | **4,400** | **29** |
| 429 error | 6,600 | 44 |
| 429 error code | 5,400 | 34 |
| http 429 | 3,600 | 36 |
| too many requests error | 2,900 | 29 |
| http error 429 | 2,400 | 33 |
| 429 status code | 1,900 | 37 |
| http 429 error | 1,900 | 38 |

Primary chosen as "error code 429" rather than the higher-volume "429 error" because KD 29 versus 44
is the difference between winnable now and aspirational. Kinsta holds the SERP.

**Secondary terms woven in:** retry-after, exponential backoff, jitter, thundering herd,
x-ratelimit-remaining, limit_req_zone, limit_req, limit_req_status, burst, nodelay,
binary_remote_addr, rate limiting nginx, wordpress rest api 429, 429 vs 403.

## Placement
Primary keyword in H1, title, meta, lead, TL;DR. 8 FAQ entries. Structure deliberately splits into
two labelled parts so both search intents are served on one page.

## Original value competitors do not have
- **THE STRUCTURAL SPLIT: receiving 429s versus sending them.** Two genuinely different audiences with
  opposite jobs, and competing articles only cover the first. The second half is where the outages
  come from, and it is close to unserved.
- **`Retry-After` promoted to the lead**, framed as an instruction rather than a suggestion, with the
  point that retrying immediately burns quota and on some platforms extends the block.
- **Jitter explained by its failure mode, not as a best practice.** Without it, all clients limited at
  the same instant wait the same interval and retry in unison, producing a synchronised burst that
  trips the limit again, giving failures at regular intervals. Working code included with the cap and
  attempt ceiling, and the reason for each.
- **THE BIG ONE: `limit_req_zone $binary_remote_addr` behind a CDN counts your whole audience as a few
  clients.** Legitimate users get blocked seemingly at random while server load looks fine. Same root
  cause as the Fail2ban self-ban in the 521 article, cross-linked, so the silo reinforces one real
  insight from two directions.
- **nginx returns 503, not 429, for rate limits unless you set `limit_req_status 429`.** A genuinely
  valuable, verifiable detail that most guides miss, and it actively misleads every client debugging
  your API, since 503 means "down" and 429 means "slow down".
- **`burst` and `nodelay` explained rather than pasted**: without a burst allowance a strict rate feels
  broken, because one page load fires several requests and normal browsing looks like a flood.
- **Which endpoints deserve limits** (login, password reset, email/SMS senders, search, exports) and
  which do not (static assets, where the same limit makes the site feel broken).
- **"429s with a clean nginx log means the limit is somewhere else"**, with the definitive
  `limiting requests, excess:` log line as the test. Routes readers to plugins, CDN, or WAF.
- **Reducing calls presented as the real fix**, not just better retries: cache, batch, queue.
- **Founder position**: rate limiting is a behavioural rule you tune, not a security checkbox you
  enable, and a limit set without knowing normal traffic is either useless or harmful. The harmful
  case is invisible because affected users just leave.

## Internal links (8, verified)
403-forbidden-error, 400-bad-request, fix-503-after-deploying-your-app,
cloudflare-error-521-web-server-is-down, cloudflare-5xx-error-codes, redis-caching-patterns,
managed-redis-hosting, nodejs-background-jobs-bullmq, nginx-reverse-proxy-for-node

## Facts check
Kloudbean claims used: managed servers with nginx configured, Cloudflare paid add-on and free for
enterprise, IP Access Control with allow/deny and CIDR, managed Redis, one dashboard, free migration
assistance. All in kloudbean-facts.md. Honest limit stated (cannot tell you your correct request rate,
cannot stop a third party throttling your key). No managed-WAF claim; WAFs referenced only as
something the reader may have in front of their site.
