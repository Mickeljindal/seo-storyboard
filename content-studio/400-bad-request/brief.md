# Brief: 400-bad-request

## Keyword grounding (SEMrush gap export, 2026-07-23)

Family totals **86,320 across 71 keywords**. The entry points are unusually soft for a family this
size: "error 400" carries 12,100 at KD 25.

| Keyword | Vol | KD |
|---|---|---|
| **error 400** (primary) | **12,100** | **25** |
| 400 error | 6,600 | 38 |
| http error 400 | 6,600 | 35 |
| 400 bad request | 5,400 | 34 |
| error code 400 | 4,400 | 23 |
| 400 bad request error | 3,600 | 50 |
| 400 status code | 2,900 | 59 |
| status code 400 | 2,900 | 52 |

Kinsta holds the SERP. Intent is diagnostic.

**Secondary terms woven in:** client sent too long header line, large_client_header_buffers,
client_header_buffer_size, cookie too large, 400 bad request cookies, incognito, the plain HTTP
request was sent to HTTPS port, host header, encodeURIComponent, malformed json, content-type,
400 vs 422.

## Placement
Primary keyword in H1, title, meta, lead, TL;DR. 8 FAQ entries including "why does a 400 disappear
in incognito", which is the highest-intent real-world question and is not answered well anywhere.

## Original value competitors do not have
- **The two-kinds-of-400 split as the opening structure**, with a six-row comparison table. Either
  the web server rejected the raw request before your code ran, or your app's validation refused the
  payload. Competing articles mix both into one list of tips, which is why readers check their JSON
  payload while nginx is discarding the request over a header.
- **The response body as an instant tell**: a plain HTML error page you did not write means the web
  server answered; a JSON object naming a field means your app did.
- **Cookie bloat given top billing with the mechanism explained.** New visitors and private windows
  are fine, long-term logged-in users fail, because cookies accumulate per browser. Everyone blames
  the login system. Includes a reproducible `curl` that sends a deliberately oversized cookie.
- **Both halves of the cookie fix**, with the reasoning: raise the buffers so you are not locking out
  customers today, AND reduce what you send, because raising a limit to accommodate uncontrolled
  growth just moves the wall. Plus the user-facing workaround (clear cookies) to buy deploy time.
- **"The plain HTTP request was sent to HTTPS port"** given its own section as a verbatim string,
  with the note that it commonly appears right after putting a load balancer or CDN in front.
- **Fix URL encoding at the point of construction**, with the URL/searchParams and http_build_query
  APIs, rather than loosening the server. Framed as preventing bugs you have not hit yet.
- **The monitoring-check 400** from a missing Host header, and the warning NOT to silence it with a
  catch-all server block, because that changes which site answers unmatched requests.
- **Content-Type as a distinct cause**: the payload was fine, the label was wrong, so the framework
  parsed JSON as form data and reported missing fields.
- **A "what not to do" section** on why enormous header buffers are the wrong instinct (allocated per
  connection, so it is real memory at concurrency, and you never find what is filling the cookies).
- **400 vs 422 distinguished precisely** in the FAQ, including the honest note that many APIs use 400
  for both.
- Cross-links the same oversized-header root cause to the Cloudflare 520 article, where it surfaces
  as a different status code entirely.

## Internal links (7, verified)
403-forbidden-error, fix-504-gateway-timeout, fix-502-bad-gateway-node-nginx, cloudflare-error-520,
managed-redis-hosting, nginx-reverse-proxy-for-node, fix-cors-error-node-production, ssl-tls-explained

## Facts check
Kloudbean claims used: managed servers with nginx configured, free SSL, managed Redis, one dashboard,
free migration assistance. All in kloudbean-facts.md. Honest limit stated (does not validate your
JSON or encode your URLs). No SLA figure, no WAF claim.
