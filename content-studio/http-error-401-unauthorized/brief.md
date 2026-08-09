# Brief: http-error-401-unauthorized

## Keyword grounding (SEMrush gap export, 2026-07-23)

| Keyword | Vol | KD |
|---|---|---|
| **http error 401** (primary) | **5,400** | **26** |
| error 401 | 4,400 | 30 |

Chosen partly as the natural counterpart to the 403 article written in the same batch, since the
401-versus-403 confusion is one of the most searched distinctions in the whole 4xx space and answering
it well strengthens both pages. Kinsta holds the SERP.

**Secondary terms woven in:** 401 unauthorized, 401 vs 403, www-authenticate, bearer token,
authorization header, jwt expired, exp claim, decode jwt, clock skew, ntp, underscores_in_headers,
nginx strips headers, basic auth, wordpress rest api 401, application passwords.

## Placement
Primary keyword in H1, title, meta, lead, TL;DR. The H1 carries the core correction ("it actually
means unauthenticated"). 8 FAQ entries.

## Original value competitors do not have
- **The naming correction as the lead**: 401 means unauthenticated, not unauthorized, and the
  distinction is the fork in the diagnosis rather than pedantry. A 401 means the credentials were
  missing, unreadable, expired, or never arrived; a 403 means they arrived and were not enough.
- **A five-row 401-versus-403 table** including the practical row "will logging in help?" and the spec
  requirement for `WWW-Authenticate`, plus the note that many APIs omit it and the reason that hurts
  clients.
- **THE STANDOUT: nginx silently discards headers containing underscores by default.** So `X_API_KEY`
  never reaches the app. No error, no log line, and the symptom is a 401 that works when you call the
  application directly and fails through the proxy with identical credentials. The recommendation goes
  beyond `underscores_in_headers on` to renaming the header with hyphens, so it cannot recur behind a
  different proxy.
- **The two-path curl comparison** (direct to the app versus through the proxy) that localises the
  problem in a single step.
- **A no-tooling JWT expiry check**: decode the middle segment with `cut -d. -f2 | base64 -d`, read
  `exp`, `iat`, `nbf`, compare against `date +%s`. Explicitly flagged as reading claims without
  verifying the signature, so it is a debugging step and not a security check.
- **The follow-through most guides skip**: an expired token in production is a bug in the refresh path,
  and re-issuing by hand hides it until next time.
- **Clock skew as a named cause** with its distinctive signature: intermittent auth, or failing on some
  servers in a pool but not others, or starting after a machine was suspended and resumed. Nothing
  about the token or the code is wrong, which is why it burns an afternoon.
- **The empty-variable habit**: `echo "[$TOKEN]"` before the request, because `Bearer` followed by
  nothing is the single most common cause and takes two seconds to rule out.
- **The reads-work-writes-fail row** flagged as the one place 401 and 403 genuinely blur, with the
  instruction to stop investigating authentication and go look at token scopes.
- Basic auth gates and the WordPress REST API handled as legitimate intentional 401s rather than faults.

## Internal links (7, verified)
403-forbidden-error, 400-bad-request, 429-too-many-requests, environment-variables-done-right,
nginx-reverse-proxy-for-node, wp-rest-api-guide, fix-cors-error-node-production, security-headers-guide

## Facts check
Kloudbean claims used: managed servers with nginx configured, per-application environment variables in
the dashboard, maintained servers including time synchronisation, Basic Auth gate for apps, IP Access
Control, one dashboard, free migration assistance. All in kloudbean-facts.md. Honest boundary stated
(nobody else can validate your tokens or write your refresh logic). Time synchronisation is framed as
part of ordinary server maintenance rather than as a named product feature.
