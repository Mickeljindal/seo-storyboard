# Brief: http-error-413-content-too-large

## Target keyword and real search data

Source: `kloudgraph-semrush-export` competitor position exports plus the gap export, clustered by
`scripts/build-topic-queue.py`. Family `http-413`, priority score 65.0.

| Keyword | Volume | KD |
|---|---|---|
| 413 error | 2,900 | 26 |
| error 413 | 1,900 | 26 |
| http 413 | 1,000 | 30 |
| google error 413 | 720 | 21 |
| 413 error code | 480 | 33 |
| 413 status code | 390 | 30 |
| 413 http | 320 | 34 |
| status code 413 | 320 | 30 |

**Family volume 8,030 across 8 keywords, KD 21 to 34.** No brand contamination and a tight KD band,
which makes this more evenly winnable than the 500 family.

Primary: **413 content too large**. Secondary: 413 error, http 413, 413 request entity too large,
client_max_body_size, upload_max_filesize, 413 payload too large.

Note on naming: RFC 9110 renamed this code from Payload Too Large to **Content Too Large**, and older
material still calls it Request Entity Too Large. All three names need to appear in the body, because
readers arrive with whichever one their server printed.

## Cannibalisation check (mandatory, done against real H2 sets)

A prose scan found 413 mentioned in four articles, all in passing, with no page owning it:

| Existing slug | How it mentions 413 | Verdict |
|---|---|---|
| `http-error-408-request-timeout` | One line: a body over the maximum returns 413, not 408 | My own cross-reference. Completes it rather than competes. |
| `http-error-415-unsupported-media-type` | One line drawing the size versus type boundary | Same. |
| `http-error-431-request-header-fields-too-large` | Headers versus body distinction | Adjacent code, must cross-link both ways. |
| `nginx-reverse-proxy-for-node` | `client_max_body_size` appears in a config example | Config context only, not a diagnosis. |

Two of those four mentions are ones I wrote myself while building the 4xx cluster, each promising that
413 is the size code. Writing the page they point at closes the loop. No existing article has a
heading, a diagnosis, or a fix path for 413.

## Information gain (the approval question)

In one sentence: **the upload limit is not one setting, it is a stack of independent ceilings, and the
smallest one silently wins.** That is why the single most common experience with this error is raising
`upload_max_filesize`, restarting, and seeing no change at all: nginx rejected the request at 1 MB
before PHP was ever consulted.

Two further pieces of gain that competing pages miss:

- **PHP has two limits that interact.** `post_max_size` must be at least as large as
  `upload_max_filesize`, because the file arrives inside the POST body. Raise one and not the other
  and the upload still fails, with no useful message.
- **A 413 frequently disguises itself as a CORS error.** When nginx rejects the body itself, the
  response never reaches your application, so it carries none of the CORS headers your app would have
  added. The browser reports a cross-origin failure and the real status is hidden. Developers then
  debug CORS for an afternoon. This is the highest-value insight on the page.

Angles used: *the fix is structural, not a command* (find the smallest ceiling rather than raising
things at random), *whose error is it* (which layer rejected it), and *the failure is invisible*
(the CORS masking).

## Verified technical claims

- nginx `client_max_body_size` defaults to **1 MB**, which is well below a modern phone photo. This is
  the most common single cause.
- Apache uses `LimitRequestBody`.
- PHP: `upload_max_filesize`, `post_max_size`, and `max_file_uploads` for multi-file posts.
- Express: `express.json()` defaults to a **100 kb** limit, which is a frequent surprise for JSON APIs
  receiving base64 payloads.
- Django: `DATA_UPLOAD_MAX_MEMORY_SIZE`, default 2.5 MB.
- RFC 9110 name change to Content Too Large, with Request Entity Too Large as the legacy name.
- Edge and load balancer caps are described as existing and plan-dependent. **No specific Cloudflare
  size number asserted**, since it varies by plan and is a moving target.

## Product claims

Only from `kloudbean-facts.md`: managed reverse proxy, S3-compatible object storage with full AWS SDK
and CLI compatibility, application and server logs in one dashboard, seven clouds, free SSL, free
migration assistance. The direct-to-storage upload pattern is presented as general architecture and
tied to the confirmed S3 capability, not to any unconfirmed feature.

## Format

Layer-by-layer audit, deliberately not a step list, because the reader's problem is not knowing which
ceiling they hit. Opens with the diagnostic that identifies the rejecting layer, then a table of every
limit by layer, then the two traps, then the architectural point that large uploads should bypass the
web request entirely.
