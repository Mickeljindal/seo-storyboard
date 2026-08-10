# Brief: http-error-408-request-timeout

## Keyword grounding (SEMrush gap export, 2026-08-01)

Mined with `python3 /tmp/kwlook.py "408"`.

**Family roughly 9,570 combined volume at KD 31 to 44.** Every ranking URL in the export points at one
competitor's single 408 page, so the whole family is currently served by one article.

| Keyword | Volume | KD |
|---|---|---|
| 408 error | 2,400 | 40 |
| error 408 | 1,900 | 31 |
| 408 error code | 1,300 | 37 |
| http 408 | 1,300 | 37 |
| 408 code | 880 | 44 |
| code 408 | 720 | 41 |
| 408 http | 590 | 38 |
| 408 status code | 480 | 34 |

Primary kw: **408 request timeout** (the descriptive phrase all of the above resolve to).
Secondary: 408 error, error 408, 408 error code, http 408, 408 status code, request timeout error.

## Cannibalisation check

Verified by extracting visible prose from all 294 articles and searching for the standalone token 408:
**zero mentions anywhere.** Genuinely uncovered.

Cluster fit: joins the status-code silo (400, 401, 402, 403, 405, 406, 409, 410, 415, 422, 429, 451).
Slug follows the `http-error-406-not-acceptable` pattern.

Boundaries to respect, because this is a crowded neighbourhood:

- `fix-504-gateway-timeout` owns the slow-response case, with H2s "Who is actually timing out?",
  "Read the log line that names the culprit", "The five real causes", and "When raising the timeout is
  legitimate". This page must own the opposite direction and link, not re-teach any of it.
- `cloudflare-error-522-connection-timed-out` owns the two-clocks distinction at the edge.
- `err-connection-reset` owns the browser-side reset and MTU.
- `fix-502-bad-gateway-node-nginx` owns 502 generally, which matters because of the load-balancer finding
  below. Link it rather than duplicating.

## Distinct angle (the spine)

**408 is the only timeout code that blames the client for being slow to SEND.** Everything else in the
timeout family blames the server for being slow to respond. 504 and 524 mean the response never came
back. 408 means the request never finished arriving. Same word, opposite direction, and confusing the
two sends people to tune the wrong timeouts.

Two original findings from nginx's own issue tracker, and they are the reason to write this page:

1. **In nginx, 408 is largely a log-only status.** On `client_header_timeout` or `client_body_timeout`
   nginx closes the connection with no response at all. The position quoted in nginx's tracker is that
   the 408 status is only used when writing logs, and that responding is considered a waste of resources.
   This is why `error_page 408` does not behave as people expect, and there is a long-standing nginx
   ticket titled to the effect that `client_body_timeout` does not send 408 as advertised. So a pile of
   408s in an access log may correspond to zero user-visible errors.
2. **Behind a cloud load balancer, that silent close surfaces as a 502.** The nginx feature request was
   filed precisely because a load balancer sees its backend connection terminated with no response and
   returns 502 to the client. A client-side slowness problem therefore gets reported as a server-side
   failure, which sends an entire team debugging the wrong layer. This is the highest-value thing on the
   page and almost nobody covers it.

Third angle: **Slowloris.** Holding many connections open with deliberately incomplete requests is the
canonical attack this timeout exists to defeat. That makes the timeout a security control, so raising it
is a real tradeoff rather than a free fix. A sudden spike in 408-class log lines can be an attack
signature rather than a bug.

## Grounding + accuracy (verified against primary sources)

- RFC 9110 section 15.5.9: 408 indicates the server did not receive a complete request message within the
  time it was prepared to wait. If the client has an outstanding request in transit it MAY repeat it, and
  if the connection is no longer usable a new connection will be used. Taken from the spec text directly.
- nginx GitHub issue 489 and the nginx Trac ticket it references, for the log-only behaviour and the
  load-balancer consequence. Attribute carefully: the log-only statement is nginx's own position as
  quoted in the tracker; the 502 consequence is what the feature request documents as the motivation, so
  describe it as the reason the request exists rather than as vendor documentation.
- Real directives only: nginx `client_header_timeout` and `client_body_timeout` (both default 60s) plus
  `keepalive_timeout`; Apache `Timeout` and `mod_reqtimeout`'s `RequestReadTimeout`; IIS
  `connectionTimeout`.
- No invented percentages and no claim about what share of 408s have which cause.

## Honest positioning

The concession that belongs here is specific rather than generic: **if a visitor is on a poor mobile
connection, no amount of server tuning fixes their upload.** What an operator controls is not setting
timeouts so tight that ordinary mobile uploads fail, and not setting them so loose that the server
becomes cheap to exhaust. Say that the tradeoff is real and has no universally correct answer.

Grounded Kloudbean facts to use: managed reverse proxy with maintained configuration, server health
metrics in the dashboard for spotting connection exhaustion, and both server and application logs in one
place, which is what the log-only finding makes valuable. Nothing about uptime, no invented figures.

## Structure

Field guide organised by direction, then by who is asking. Opens with the inversion because that is the
mistake to prevent. Inline SVG contrasting a slow request arriving with a slow response returning.
Then the nginx log-only section, then the 502-that-is-really-a-408 section, then user-side, then
operator-side, then Slowloris and the tradeoff. 8 FAQs mirrored to FAQPage JSON-LD. No double quotes in
FAQ questions.

Byline: "By Kloudbean Engineering · Every other timeout blames the server. This one blames the sender."
Unique, not "Faster Than Ever".

## Links out

fix-504-gateway-timeout, cloudflare-error-522-connection-timed-out, fix-502-bad-gateway-node-nginx,
err-connection-reset, nginx-reverse-proxy-for-node, cloud-load-balancer-explained,
http-error-415-unsupported-media-type, structured-logging-nodejs.
