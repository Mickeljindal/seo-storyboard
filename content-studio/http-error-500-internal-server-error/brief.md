# Brief: http-error-500-internal-server-error

## Target keyword and real search data

Source: `kloudgraph-semrush-export` competitor position exports plus the gap export, clustered by
`scripts/build-topic-queue.py`. Family `http-500`, priority score 83.4, the highest in the queue.

| Keyword | Volume | KD |
|---|---|---|
| status code 500 | 1,900 | 31 |
| error 500 meaning | 1,900 | 44 |
| 500 internal server error nginx | 1,300 | 30 |
| 500 internal error | 1,000 | 44 |
| 500: error | 1,000 | 43 |
| 500 fatal error | 720 | 35 |
| 500 error means | 720 | 37 |

**Family volume 19,830 across 27 keywords. Honest correction to that number:** roughly 4,760 of it is
`wplace` / `wplace.live` branded, which is a third-party site's outage rather than our intent. The
brand filter in the queue builder did not catch that name. True addressable demand is around
**15,000**, still the largest uncovered family in the dataset.

**Honest correction to the difficulty, too.** The queue reports `min_kd` for a family, which flatters
it: that 18 comes from a low-volume long tail. The head terms are **KD 30 to 44**. The most on-brand
and most winnable head term is `500 internal server error nginx` at 1,300 and KD 30, so nginx gets
real estate in the title area and its own section rather than a passing mention.

Primary: **500 internal server error**. Secondary: status code 500, error 500 meaning, 500 internal
server error nginx, 500 fatal error, what causes a 500 error, 500 vs 502.

## Cannibalisation check (mandatory, done against real H2 sets)

The 5xx cluster is otherwise complete, which is exactly why this page is worth writing. Read the H2s
of all four neighbours:

| Existing slug | What it owns | Verdict |
|---|---|---|
| `fix-502-bad-gateway-node-nginx` | Proxy could not connect, or upstream refused. "Fix: connection refused", "Fix: upstream timed out" | Different layer. Link, do not overlap. |
| `fix-503-after-deploying-your-app` | App not up after a deploy. PORT binding, missing env var, crash on boot | Different trigger. Link. |
| `fix-504-gateway-timeout` | Upstream too slow. "Who is actually timing out?" | Different failure. Link. |
| `cloudflare-5xx-error-codes` | Cloudflare's own 520 to 527 edge codes | Different origin of the code. Link. |
| `http-error-408-request-timeout` | Slow request inbound | Adjacent only. |

A prose-level scan of all 297 articles (`/tmp/verify_top.py`) confirms **no article mentions 500
Internal Server Error at all**. So this is the missing hub of a complete spoke set, not a competitor
to any of them.

**The distinct intent, stated in one line:** every neighbour is a page about the proxy failing to get
an answer. A 500 is the one 5xx where the application actually ran and threw. That is a different
diagnosis with a different first move, and it makes this page the natural hub the other four link up to.

## Information gain (the approval question)

In one sentence: **a 500 is the only 5xx that proves your application code executed and failed, which
means the fix never starts in the browser and always starts by making a deliberately hidden exception
visible.** The page gives the exact log path and the specific config change that surfaces the real
message per stack, plus the mechanism that explains why the popular fixes cannot work.

Angles used, from the reusable set: *the status code names the layer*, *the popular fix cannot work*
(a browser cache clear cannot touch an exception that was raised server-side before any cached byte
mattered), and *open by ruling things out* (a 500 rules out a dead process, because a dead process
gives you 502 or 503 instead).

## Verified technical claims

- RFC 9110 section 15.6.1: 500 means the server encountered an unexpected condition that prevented it
  from fulfilling the request. Deliberately generic.
- **Express 5 forwards rejected promises automatically.** Verified against the official docs at
  expressjs.com/en/guide/error-handling/: route handlers and middleware returning a Promise call
  `next(value)` on rejection or throw. Express 4 does not, which is why an async rejection there
  escapes the handler. Version-dependent, so stated with the version attached.
- Express's default error handler sets 500 and includes the stack only when `NODE_ENV` is not
  production, which is a reason to write a real handler rather than lean on the default.
- Django with `DEBUG = False` returns a plain 500 and routes detail through `LOGGING`. Note the
  neighbouring trap deliberately: an `ALLOWED_HOSTS` mismatch returns **400**, not 500.
- `.htaccess` syntax errors produce a 500 on Apache. Classic cause, mentioned because it is one of the
  few 500s with a genuinely instant fix.
- suexec and similar guards reject group or world-writable files, which is why `chmod 777` can cause
  the 500 it is being used to fix.

## Product claims

Only from `kloudbean-facts.md`: managed reverse proxy, application and server logs in one dashboard,
seven clouds, free SSL, staging for WordPress and Laravel, automatic backups, free migration
assistance. The shared-responsibility boundary is stated. No SLA figure, no uptime promise.

## Format

Retrieval-first troubleshooting guide, deliberately not the shape of the other four 5xx pages. Those
run decision trees and cause lists. This one opens by ruling out, then spends its middle on getting
the hidden message out of the server, because that single step resolves the query for most readers.
