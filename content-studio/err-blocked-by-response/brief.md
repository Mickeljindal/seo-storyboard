# Brief: err-blocked-by-response

## Keyword grounding (competitor organic.Positions export, 2026-08-01 mine)

Mined with `python3 /tmp/compmine.py cloudways,kinsta,heroku,netlify,pressable,wpvip 700 34 6`.

| Keyword | Volume | KD | Competitor position |
|---|---|---|---|
| err_blocked_by_response | 1,300 | 29 | cloudways 5 |

Primary kw: **err_blocked_by_response**. Secondary: err blocked by response,
ERR_BLOCKED_BY_RESPONSE.NotSameOrigin, NotSameOriginAfterDefaultedToSameOriginByCoep,
CoepFrameResourceNeedsCoepHeader, cross-origin-resource-policy, cross-origin-embedder-policy.

## Cannibalisation check

Prose extracted from all 295 articles: **zero mentions of err_blocked_by_response.** And a decisive
second finding, `security-headers-guide` contains **zero** mentions of CORP, COEP, COOP or CORS. Its H2s
cover the paste-this header set, HTTPS as a precondition, the headers one by one, cookies, CSP rollout,
grading, and where to set them. So the entire cross-origin isolation family is a genuine gap in the
security silo rather than something to avoid duplicating.

Cluster fit: joins the browser-error family alongside `err-connection-reset`, `err-ssl-protocol-error`,
`err-cache-miss`, `err-too-many-redirects`, `err-name-not-resolved`, `pr-end-of-file-error` and
`this-site-cant-be-reached`.

Boundary: `security-headers-guide` owns the standard header set and the CSP rollout method. Link it for
both rather than re-teaching either. Reuse its Report-Only rollout idea by reference, not by repetition.

## Distinct angle (the spine)

**The error name is Chrome telling you it applied a default you never wrote.** The longest sub-reason,
`NotSameOriginAfterDefaultedToSameOriginByCoep`, says exactly that in its own words, and nobody reads it.
Without COEP, cross-origin resources load as though they carried a permissive CORP value. The moment you
set `Cross-Origin-Embedder-Policy: require-corp`, that effective default flips to same-origin and every
cross-origin no-cors resource must opt in explicitly. You changed one header and silently changed the
rule for every image, script and font you load from elsewhere.

Second angle, and the practical one: **the usual trigger is adding a security middleware.** Helmet on an
Express app sets COEP, so cross-origin images break immediately after a change that looked purely
protective. That is a real, extremely common, checkable failure mode.

Third: **read the suffix.** One code, three distinct sub-reasons, each with a different fix. Same proven
pattern as the Chrome router article, applied within a single code rather than across many.

Fourth, worth its own line because it is so easy to miss: **a blocked resource can return HTTP 200.**
The response was fine. A policy refused to let the document use it. That is why treating this as a server
error sends people to the wrong logs.

## Grounding + accuracy (verified against MDN, the primary reference)

Read MDN's Cross-Origin-Embedder-Policy reference in full. Facts to use exactly:

- COEP values are `unsafe-none` (the default), `require-corp`, and `credentialless`, plus an optional
  `report-to` parameter.
- With neither CORP nor CORS set, resources load by default as though they had a CORP value of
  `cross-origin`.
- Under `require-corp`, a cross-origin no-cors resource is blocked unless it sends a permitting CORP
  header, or the request is made in cors mode.
- **Requests made in cors mode are not blocked by COEP and do not trigger COEP violations**, but must
  still be permitted by CORS. Precise and important.
- `credentialless` loads cross-origin no-cors resources without needing CORP, but sends no credentials:
  cookies are omitted from the request and ignored in the response.
- **Setting the header more than once, or with multiple tokens, is equivalent to `unsafe-none`.** A
  genuine gotcha, since a duplicated header silently disables the protection.
- COEP does not override CORP. If CORP restricts a resource to same-origin it will not load cross-origin
  whatever the COEP value.
- Cross-origin isolation needs COEP `require-corp` or `credentialless` **and** COOP `same-origin`. It
  gates `SharedArrayBuffer` and unthrottled `Performance.now()`, and is checkable at runtime via
  `crossOriginIsolated`.
- Violation reports have type `coep` with a body carrying `blockedURL`, `destination`, `type: "corp"`
  and `disposition`, delivered via `Reporting-Endpoints` and the `report-to` parameter. There is a
  `Cross-Origin-Embedder-Policy-Report-Only` variant for safe rollout.
- Fixes for a CORS-capable third-party resource: add the `crossorigin` attribute in HTML, or
  `{ mode: 'cors' }` in JavaScript. Where the third party supports neither, `credentialless` is the
  documented alternative at the cost of credentials.

Sub-reason strings confirmed in the wild: `.NotSameOrigin`, `.NotSameOriginAfterDefaultedToSameOriginByCoep`,
`.CoepFrameResourceNeedsCoepHeader`. Do not invent others; if a reader's suffix differs, say so rather
than guessing.

## Honest positioning

The concession is specific and genuinely useful: **if the blocked resource lives on a third-party origin
you do not control, you cannot make them send CORP.** That leaves exactly three options, all of which
have a cost: request it in cors mode if they support CORS, switch to `credentialless` and lose cookies on
those requests, or proxy the resource through your own origin and own the bandwidth and caching. Say that
plainly instead of implying a header on your side fixes someone else's server.

Grounded Kloudbean facts: managed reverse proxy where response headers are set and maintained, free SSL
issued and renewed (relevant because HTTPS is a precondition for this whole family), seven providers, one
dashboard, free migration assistance. Nothing about uptime, no invented figures.

## Structure

Field guide organised by sub-reason, then by fix. Opens with the suffix table because that is the
diagnosis. Inline SVG of a document under `require-corp` showing which resources load and which do not.
Then the defaulting insight, then the four unblock routes, then the iframe case, then Report-Only rollout
and the duplicate-header gotcha, then a short visitor-side section. 8 FAQs mirrored to FAQPage JSON-LD.
No double quotes in any FAQ question.

Byline: "By Kloudbean Engineering · The response was fine. A policy refused it."
Unique, not "Faster Than Ever".

## Links out

security-headers-guide, err-connection-reset, this-site-cant-be-reached, err-cache-miss,
err-ssl-protocol-error, custom-domain-and-ssl-for-your-app, nginx-reverse-proxy-for-node,
s3-compatible-object-storage.
