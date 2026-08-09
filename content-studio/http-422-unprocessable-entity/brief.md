# Brief: http-422-unprocessable-entity

## Keyword grounding (SEMrush gap export, 2026-07-23)

Family totals **26,250 across 15 keywords**, KD 31 to 40. Zero prior coverage.

| Keyword | Vol | KD |
|---|---|---|
| 422 | 8,100 | 39 |
| **422 error** (primary) | **5,400** | **34** |
| 422 error code | 3,600 | 37 |
| http 422 | 2,400 | 38 |
| 422 status code | 1,900 | **31** |
| status code 422 | 880 | 40 |

Kinsta holds the SERP with one 422 page. Primary set to "422 error" at KD 34 rather than the bare
"422" at KD 39, since the difficulty is lower and the intent is clearer.

**Secondary terms woven in:** unprocessable entity, 400 vs 422, validation error, rails
unprocessable_entity, laravel ValidationException, fastapi pydantic 422, loc msg type, field errors,
iso 8601, webhook retry, dead letter.

## Placement
Primary keyword in title, meta, TL;DR and the comparison table; the H1 leads with the full status
name plus the article's argument. 8 FAQ entries.

## Original value competitors do not have
- **THE TITLE IS THE ARGUMENT.** A 422 whose body does not name the failing field has thrown away the
  only advantage it has over a 400, so you spent a more precise status code and delivered no more
  precision. Competing articles explain the code; this one makes a claim about how to use it.
- **A FRAMEWORK DEFAULTS TABLE** (Rails, Laravel, FastAPI, Express) with the point that your framework
  probably chose 422 for you, so the status may not reflect any deliberate decision. Useful because
  readers often assume an API author picked it.
- **THE FastAPI `loc` PATH EXPLAINED AS THE MOST VALUABLE PART OF THE RESPONSE**: `["body","user","email"]`
  is a path rather than a name, which for nested payloads is the difference between reading an error
  and finding the bug. Nobody highlights this.
- **THE THREE-STATE PROBLEM**: empty string, null, and missing key are different states and validators
  treat them differently. That is the concrete cause behind "my JSON looks correct".
- **DO NOT RETRY, WITH THE OPERATIONAL CONSEQUENCE NAMED**: in background jobs a deterministic failure
  treated as transient retries to exhaustion and then looks like an infrastructure problem in your
  dashboards. Consistent with the retry-column thinking from the 409 article.
- **THE WEBHOOK INVERSION**, which is the most original section: returning 422 for a permanently
  invalid webhook payload is usually wrong, because many senders retry any non-2xx, so you create
  recurring noise that can never resolve. Better to accept, return 2xx, and dead-letter it. Reserve a
  rejection for when you want the sender to stop and a human there will read it. That is the opposite
  of the intuitive advice and it is correct.
- **THREE NAMED PROPERTIES OF A GOOD 422 BODY**: all failures at once (so a form highlights everything
  in one pass), a machine-readable code alongside the human message (so clients branch without
  string-matching prose), and field names matching the request rather than internal column names.
- **A SECURITY NOTE ON VALIDATION MESSAGES**: a database error naming your table and constraint is an
  information disclosure and an unhelpful message simultaneously.
- **"Using 400 for both is acceptable; using them inconsistently in one API is not."** A fair,
  defensible position rather than pretending there is one right answer.

## Honest scope
States plainly that a 422 is your validation working, so it is application logic and there is no
hosting setting that changes it, and that any article claiming otherwise is stretching. Only two
adjacent ties are claimed: database constraints sitting under validation rules, and the worker
capacity burned by queues retrying deterministic failures.

## Internal links (6, verified)
400-bad-request, 409-conflict-error, http-error-401-unauthorized, 403-forbidden-error,
429-too-many-requests, nodejs-background-jobs-bullmq, postgresql-performance-tuning

## Facts check
Kloudbean claims used: managed PostgreSQL / MySQL / MariaDB / Redis, private networking, automatic
backups, server metrics, one dashboard, flat from $8/mo, free migration assistance. All in
kloudbean-facts.md. 422's WebDAV origin stated as history without citing an RFC number.
