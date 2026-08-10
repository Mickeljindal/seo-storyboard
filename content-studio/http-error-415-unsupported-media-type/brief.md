# Brief: http-error-415-unsupported-media-type

## Keyword grounding (SEMrush gap export, 2026-08-01)

Mined with `python3 /tmp/kwlook.py "415"`.

**Family roughly 3,900 combined volume at KD 13 to 32.** Low difficulty across the board, and every
ranking URL in the export belongs to one competitor's blog, so the family is held by a single player.

| Keyword | Volume | KD |
|---|---|---|
| 415 error | 1,000 | 17 |
| 415 unsupported media type | 590 | 13 |
| 415 error code | 590 | 20 |
| error 415 | 590 | 20 |
| 415 http | 480 | 21 |
| 415 status code | 390 | 32 |
| error code 415 | 260 | 24 |

Primary kw: **415 unsupported media type** (lowest difficulty at KD 13, and the most descriptive).
Secondary: 415 error, 415 error code, error 415, 415 status code, 415 http, unsupported media type error,
content-type 415.

## Cluster fit and cannibalisation check

Completes the status-code cluster, which already holds `400-bad-request`, `http-error-401-unauthorized`,
`402-payment-required`, `403-forbidden-error`, `405-method-not-allowed`, `http-error-406-not-acceptable`,
`409-conflict-error`, `error-410-gone`, `http-422-unprocessable-entity`, `429-too-many-requests`.
Slug follows the `http-error-406-not-acceptable` pattern.

Checked directly: neither the 406 article nor the 422 article contains the string "415" anywhere, so
nothing is competing for this. Their H2 sets were read, and the boundary is drawn deliberately:

- `http-422-unprocessable-entity` owns "422 or 400? The line is real" and the API-builder view of
  semantic validation. This page must own the 415/422 line from the other side and link, not re-teach it.
- `http-error-406-not-acceptable` owns content negotiation and the security-rule 406 that accounts for
  most real ones. This page needs 406 only as the mirror-image case, one paragraph plus a link.

## Distinct angle (the spine)

**The direction of the header is the whole distinction, and it is in the spec.** 415 is about what you
sent. 406 is about what you asked to receive. 422 is about content that was understood and still wrong.
400 is about content that was malformed. Four codes, four different headers, one reference table that
nobody in this cluster has built yet.

RFC 9110 draws the 415/422 line itself, which is worth quoting in substance: 422 explicitly means the
server understood the content type, so 415 would have been inappropriate. That is the spec telling you
these are not interchangeable, and it settles arguments.

**Second original point, and the one almost no article mentions: RFC 9110 says a 415 response should
tell the client what would have worked, using `Accept` or `Accept-Encoding` as RESPONSE headers.**
Everyone thinks of `Accept` as a request header, so seeing it in a response feels wrong, which is
probably why nearly no API does it. It is the single highest-value thing an API author can take away.

**Third: a 415 does not prove your header was wrong.** The spec allows the refusal to come from
inspecting the data directly, not just from the declared `Content-Type` or `Content-Encoding`. So
"I definitely set the right Content-Type" does not clear you, and upload endpoints that check magic
bytes are a real and under-documented source of these.

## Grounding + accuracy (verified against the primary source)

All of the following comes from RFC 9110, HTTP Semantics, and is cited in the article:

- 415 means the origin server refuses because the content is in a format not supported by this method
  on the target resource. Section 15.5.16.
- The format problem may be due to the request's `Content-Type`, its `Content-Encoding`, **or** the
  result of inspecting the data directly.
- On an unsupported content coding, `Accept-Encoding` ought to be sent in the response. On an
  unsupported media type, `Accept` can be sent in the response.
- 422 means the content type was understood and the syntax was correct, but the instructions could not
  be processed. Section 15.5.21.
- 406 is about proactive negotiation header fields received in the request. Section 15.5.7.
- 400 is for malformed request syntax. Section 15.5.1.
- Naming note to handle carefully: RFC 9110 renamed 422 to "Unprocessable Content" and 413 to
  "Content Too Large". Mention by number, do not contradict the sibling article's older title.

Real, checkable specifics rather than invented ones: curl defaults to
`application/x-www-form-urlencoded` when you use `-d` without setting a type, which is the single most
common cause of a 415 while testing. The `+json` structured suffix cases (`application/merge-patch+json`,
`application/json-patch+json`) are a real trap on PATCH endpoints.

## Honest positioning

This is where the honest concession is unusually strong, because it is nearly total: **a 415 is an
application-level decision and no hosting change fixes it.** Say that plainly and early. What the
infrastructure layer genuinely touches is narrow and worth naming precisely:

- a reverse proxy or WAF that rewrites, strips, or rejects `Content-Type` before the app sees it
- request body limits, which produce 413 rather than 415, so ruling that out is useful
- being able to read the access and application logs to see the header as it actually arrived

Grounded Kloudbean facts to use: managed reverse proxy, server and application logs, seven cloud
providers, one dashboard, free SSL, free migration assistance. Nothing about uptime or fixing app code.

## Structure

Reference guide, not a numbered how-to. Opens with the four-way table because that is what the reader
came for. Inline SVG showing `Content-Type` travelling one way and `Accept` the other, with the code
each mismatch produces. Then receiving-a-415, then the exact-match traps, then the content-inspection
case, then the API-author section carrying the response-header point. 8 FAQs mirrored to FAQPage
JSON-LD. No double quotes in any FAQ question.

Byline: "By Kloudbean Engineering · 415 is about what you sent. 406 is about what you asked for."
Unique, not "Faster Than Ever".

## Links out

http-422-unprocessable-entity, http-error-406-not-acceptable, 400-bad-request,
405-method-not-allowed, http-error-401-unauthorized, 409-conflict-error,
nginx-reverse-proxy-for-node, structured-logging-nodejs.
