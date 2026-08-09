# Brief: cloudflare-error-520

## Keyword grounding (SEMrush gap export, 2026-07-23)

Roughly **13,100 combined volume** across the 520 variants at KD 16 to 32.

| Keyword | Vol | KD |
|---|---|---|
| **error code 520** (primary) | **4,400** | **16** |
| error 520 | 2,900 | 16 |
| 520 error | 2,400 | 20 |
| web server is returning an unknown error error code 520 | 1,000 | 19 |
| 520 error code | 720 | 20 |
| http error 520 | 720 | 23 |
| cloudflare error code 520 | 320 | 32 |
| error code 520 cloudflare | 320 | 31 |
| http 520 | 320 | 36 |

Kinsta holds this SERP. Intent is urgent diagnostic.

**Secondary terms woven in:** web server returned an unknown error, cloudflare 520 fix, CF-Ray,
ray id, empty response, allowed memory size exhausted, php-fpm, response header too large,
large cookies, set-cookie, reset by peer, display_errors, redirect loop, 520 vs 502.

## Placement
Primary keyword plus Cloudflare's exact wording in H1, title, meta, lead, and TL;DR. 7 FAQ entries.

## Original value competitors do not have
- **The reframe: 520 is the fallback code**, meaning the connection succeeded and the *response* was
  unusable. Therefore Cloudflare settings are the wrong place to look, and the evidence is in your
  own logs. Stated explicitly in its own section, because competing articles send readers into the
  Cloudflare dashboard.
- **Ray ID correlation as the headline technique.** Cloudflare passes `CF-Ray` to the origin; log it
  in the nginx `log_format` and you can match a user-reported error to one exact log line. Includes
  the working log_format snippet and the grep. This is the difference between minutes and an
  afternoon on an intermittent error, and it is essentially absent from competing coverage.
- **Oversized response headers from accumulated cookies**, with the explanation of *why it affects
  only some visitors*: cookies accumulate per browser, so new visitors never hit the limit while
  long-term logged-in users do. That "works for most people, fails for some" signature is the single
  most confusing version of 520 and nobody explains the mechanism.
- **Fix hierarchy for the cookie cause**: move data to server-side session storage (Redis),
  consolidate Set-Cookie headers, trim unused JWT claims, check third-party scripts.
- **"Allowed memory size exhausted" named as the tell-tale log line**, plus the honest follow-up
  that raising memory_limit treats the symptom and the request is probably loading far too many rows.
- **A "what will not help" section** naming the three things people try first (purge cache,
  development mode, security level) and why none of them touch any real cause. Includes the one
  genuine use for development mode: stopping a cached error page from confusing your testing.
- **Symptom table keyed on distribution and timing** (logged-in users only, one URL, intermittent,
  after a deploy, every request, large pages only).
- **520 vs 502 distinction** made precisely: 502 can come from either Cloudflare or your web server,
  520 is always Cloudflare-generated and specifically means unparseable response.

## Internal links (6, verified)
cloudflare-5xx-error-codes, cloudflare-error-521-web-server-is-down,
cloudflare-error-525-ssl-handshake-failed, fix-502-bad-gateway-node-nginx,
nginx-reverse-proxy-for-node, managed-redis-hosting, nodejs-background-jobs-bullmq

## Facts check
Kloudbean claims used: managed servers with PHP/FPM/nginx configured, server health metrics,
managed Redis, server resize, one dashboard, free migration assistance. All in kloudbean-facts.md.
Honest limit stated (cannot stop your code loading 50k rows or remove a fatal error). Cloudflare
behaviour limited to documented facts: CF-Ray header, header size limits, SSL modes.
