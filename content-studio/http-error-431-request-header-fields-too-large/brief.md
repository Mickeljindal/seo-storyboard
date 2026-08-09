# Brief: http-error-431-request-header-fields-too-large

## Keyword grounding (SEMrush gap export, 2026-07-23)

Family totals **11,880 across 11 keywords**, KD 18 to 30. Zero prior coverage.

| Keyword | Vol | KD |
|---|---|---|
| **http error 431** (primary) | **5,400** | **30** |
| bad message 431 reason: request header fields too large | 1,600 | **18** |
| 431 error | 1,000 | 25 |
| error 431 | 1,000 | 20 |

Kinsta holds the SERP. That second keyword at KD 18 is the softest entry in the family and it is a
verbatim Jetty error string, which the article identifies explicitly.

**Secondary terms woven in:** request header fields too large, large_client_header_buffers,
client_header_buffer_size, max-http-header-size, NODE_OPTIONS, requestHeaderSize, jetty,
cookie too large, jwt too large, jwt claims, set-cookie audit, cookie scope, cookie expiry.

## Placement
Primary keyword in H1, title, meta, lead, TL;DR. 8 FAQ entries, one of which answers the KD 18
Jetty string directly and verbatim.

## Why this article completes a thread
This is the deliberate payoff for the cookie-accumulation mechanism already established in
400-bad-request (oversized REQUEST headers rejected by nginx) and cloudflare-error-520 (oversized
RESPONSE headers rejected by a proxy). Three articles, one real root cause, three different status
codes. The cross-links make the relationship explicit rather than repeating the explanation.

## Original value competitors do not have
- **THE STATUS CODE IDENTIFIES THE LAYER.** A four-row table: nginx returns 400 for oversized headers,
  Node returns 431, Jetty returns a distinctive "Bad message 431 reason:" string, and 413/414 are
  different limits entirely. So the code you received tells you which component's ceiling you hit,
  before you change anything. That framing appears nowhere in competing coverage.
- **THE SMALLEST LIMIT DECIDES, AND FIXING ONE REVEALS THE NEXT.** nginx's 8k buffers usually fire
  before Node's 16 KB, so you see 400 and never 431. Raise nginx and the same requests start
  returning 431 from Node. Explicitly framed as progress rather than a new bug, because that
  transition confuses people who thought they had finished.
- **IDENTIFYING THE STACK FROM THE ERROR TEXT.** The "Bad message 431 reason:" phrasing is Jetty, so
  the wording alone tells you to look at a Java application server and `requestHeaderSize`. That is
  the KD 18 keyword answered precisely.
- **MEASURE FIRST, WITH INTERPRETATION BANDS.** An awk one-liner summing request header bytes, plus
  what the number means: under 2 KB normal, 4 to 8 KB approaching defaults, above 8 KB something is
  genuinely wrong and raising limits is treating a symptom.
- **THE JWT BLOAT SECTION**, which is the most valuable original content here. Explains WHY tokens
  grow (self-containment is the feature, so claims keep getting added to avoid lookups), gives the
  4 KB threshold, and names the trade honestly: past that size you are paying bytes on every request
  from every user to save a sub-millisecond cached read, which is a bad exchange. Notes easier
  revocation as a side benefit of moving to server-side lookup.
- **A `Set-Cookie` SIZE AUDIT one-liner** sorted by length, which turns "reduce your cookies" into a
  concrete list.
- **COOKIE SCOPING as a fix nobody mentions**: an apex-domain cookie travels with every request to
  every subdomain including static assets, so scoping domain and path removes bytes from requests
  that never needed them.
- **THE MEMORY WARNING ON RAISING LIMITS**: these buffers are per connection, so a very large value
  multiplied by concurrency turns a header problem into a memory problem. Plus the point that a
  raised limit removes your only signal that cookies are still growing.
- **Real config for all three stacks** (nginx, Node flag and NODE_OPTIONS form, Jetty Java), rather
  than one and a hand-wave.
- Founder position in the byline and closing: a cookie should carry an identifier, not a payload.
  And 431 is usually a prompt to make a design decision rather than a limit to raise.

## Internal links (7, verified)
400-bad-request, cloudflare-error-520, managed-redis-hosting, redis-caching-patterns,
http-error-401-unauthorized, environment-variables-done-right, nginx-reverse-proxy-for-node,
302-found-vs-301-redirect

## Facts check
Kloudbean claims used: managed nginx configured for real workloads, managed Redis on a private
network, automatic backups, one dashboard, flat from $8/mo, free migration assistance. All in
kloudbean-facts.md. Honest boundary stated (no platform can decide which cookies matter or trim your
token claims). Node, nginx, and Jetty defaults presented as common values rather than guaranteed
constants.
