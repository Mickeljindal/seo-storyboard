# Competitor gap research: what Kinsta, Netlify and Cloudways rank for that we do not

Companion to `_topic-queue.md`. That file is a keyword-demand proxy. This file is the
**decision layer**: it reads the competitors' actually-indexed pages, checks every candidate
against our live H2 sets, and says write / fold / reject with the reasoning attached.

Data: `kloudgraph-semrush-export/<comp>/gap.keywords_*.csv` (direct competitor-vs-us position
rows) and `*-organic.PagesV3-*.csv` (their indexed pages by traffic). 29 competitor folders,
~46k gap rows scanned. Live coverage checked against all 381 slugs in `content-studio/`.

> Headline finding, stated plainly: our error-code and DNS/SSL silos are already close to
> complete. Most of the high-volume "gaps" in the raw export are Kinsta's generic-dev and
> consumer noise that would dilute our topical authority, not build it. The genuine remaining
> wins are narrow and specific. This document is mostly a list of things **not** to write, and a
> short list of things worth writing. That is the honest result.

---

## 1. What the competitors' architecture actually tells us

From `PagesV3` (traffic-ranked indexed pages):

**Kinsta: 3,125 indexed pages, and `/blog/` alone drives about 52,000 monthly organic
visits.** It is a broad knowledgebase. Its top pages are `javascript-libraries`,
`google-search-operators`, `check-ubuntu-version`, `responsive-web-design`,
`content-management-system`. That is generic developer education, not hosting. Kinsta wins by
sheer topical breadth backed by a very strong domain.

**Netlify: 5,341 pages, but the traffic is product-led.** The homepage pulls ~105k, and
`/platform/functions/` alone pulls ~17,900. Netlify ranks for its own entity (serverless
functions), not a knowledgebase.

**Cloudways: PagesV3 was not exported** (only `gap.keywords` is present), so architecture is
inferred from its gap rows: WordPress install/how-to, CMS comparisons, and email-product terms.

**The strategic read.** We cannot and should not out-breadth Kinsta on generic dev tutorials.
Chasing "python comments", "check ubuntu version" or "javascript libraries" would make us look
like a worse Kinsta and dilute the hosting authority we are building. This is the same call the
operating system already made when it rejected `alibaba vs aliexpress` at 12,100 volume: relevance
beats volume. Where we *should* match a knowledgebase competitor is the narrow band where hosting
authority is real: server errors, connection and DNS errors, database operation. One data point
makes this concrete: Kinsta's `/blog/dns_probe_finished_nxdomain/` page pulls ~1,463 visits on its
own. Error-string pages are a real traffic channel, and they are on-topic for a host.

---

## 2. The cannibalisation audit (why most "gaps" are already ours)

The raw miner flagged ~80 error-code keywords and ~32 DNS/SSL keywords as gaps. It was wrong,
because it token-matches slugs and "422 error code" does not share tokens with
`http-422-unprocessable-entity`. Reading the live slugs directly tells the true story.

**Already live, do not rewrite (HTTP status codes):** 302, 304, 400, 401, 402, 403, 404, 405,
406, 408, 409, 410, 413, 415, 422, 429, 431, 451, 499, 500, 502, 503, 504, plus Cloudflare 520,
521, 522, 523, 525, plus `codeigniter-404`, `briefly-unavailable-for-scheduled-maintenance` (the
WordPress 503) and `err-too-many-redirects`.

**Already live, do not rewrite (connection / DNS / SSL):** `dns-explained`, `fix-slow-dns-lookup`,
`flush-dns-cache`, `fix-ssl-certificate-errors`, `ssl-tls-explained`, `err-ssl-protocol-error`,
`err-blocked-by-response`, `err-cache-miss`, `err-connection-reset`, `err-name-not-resolved`,
`custom-domain-and-ssl-for-your-app`.

So the export's biggest "opportunities" (400 error, 402 error, 422 error code, 429 error code,
http 302, 304 error, 503 error meaning, flush dns, clear dns) are all already answered.

### High-volume strings that belong on an EXISTING page, not a new one

These would cannibalise a page we already rank with. The right move is to widen the existing page
to name the exact string (an optimise/upgrade step), not to publish a competitor to ourselves.

| String people search | Vol / KD | Fold into | Why fold, not write |
|---|---|---|---|
| `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` | 3,600 / 26 | `err-ssl-protocol-error` | That page already has H2s "no shared cipher" and "the server is too old for current browsers", which are exactly this error's causes. A second page would split the same diagnosis. |
| `DNS_PROBE_FINISHED_NXDOMAIN` (+ `_NO_INTERNET`, `_BAD_CONFIG`) | 2,400+ / 16-34 | `err-name-not-resolved` | That page already has an H2 "NXDOMAIN, SERVFAIL, and a timeout are three different diagnoses". Kinsta ranks a dedicated page here (~1,463 tr), but for us the intent is identical to one we own. |
| `you don't have permission to access this resource` / `your client does not have permission to get url` | KD 11-13 | `403-forbidden-error` | It already has an H2 titled "The specific case of your client does not have permission to get URL". Fully covered. Nothing to do beyond confirming the Apache wording appears in-body. |
| `upload_max_filesize` / increase max upload size | 1,900 / 13 | `http-error-413-content-too-large` | It already has an H2 "The PHP trap: two limits that must move together". A WordPress-specific how-to FAQ could be added, but no standalone page. |

Recommended edits (small, high-return, no new URLs):
- `err-ssl-protocol-error`: add a short section and one FAQ that names `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` explicitly, so the 3,600-volume string resolves to the page that already explains it.
- `err-name-not-resolved`: add a section/FAQ naming the `DNS_PROBE_FINISHED_*` family so those strings resolve here.

---

## 3. Genuine net-new (write these)

Every row below survived the H2-level cannibalisation check and maps to hosting authority. Volumes,
KD and competitor coverage are from the gap exports (`/tmp/evidence.txt` working notes).

### Tier 1: complete the status-code silo (highest confidence)

**`505-http-version-not-supported`** — the strongest single find.
- Evidence: "505 error" volume 3,600, KD 17. Six competitors rank it (Heroku, Kinsta, Netlify,
  Pressable, Railway, WPVIP). We already sit at position ~16 with no dedicated page, which proves
  it is winnable and that a real page would move us up. Position beats gap data.
- Descriptive angle: a true 505 is genuinely rare, so the useful page opens by ruling out the
  literal meaning. In practice a "505" a visitor sees is almost always a proxy, ModSecurity or CDN
  rule rejecting the request line or HTTP version, not the origin app. Classify first (is the
  origin even reached?), then give the one check that splits it.
- How to beat: the competitors define the code and stop. We show the mechanism (where the version
  negotiation actually fails: client, edge, reverse proxy, origin) and the decisive `curl
  --http1.1` / `--http2` test.
- Cannibalisation: none. No 505 slug; sits cleanly beside 500/502/503/504.

**`cloudflare-error-524-a-timeout-occurred`** — closes a hole in our own silo.
- Evidence: "a timeout occurred error code 524" volume 1,000, KD 21. We publish Cloudflare 520,
  521, 522, 523 and 525 but not 524, which is one of the most common of the set (origin took
  longer than Cloudflare's 100s proxy limit to send a response).
- Descriptive angle: 524 is not "the site is down", it is "the origin is alive but slow". That
  distinction is the whole article. Long request, missing timeout tuning, a slow query, a
  worker that should have been a background job.
- How to beat: tie it to the real fix pattern (move long work off the request path), which the
  generic definitions never do. Links naturally to our long-running-task and worker articles.
- Cannibalisation: none. Completes the 52x Cloudflare cluster.

**`501-not-implemented`** — completes the 5xx set.
- Evidence: "501 error" volume 1,600, KD 25 (plus "error 501" 590).
- Descriptive angle: 501 means the server does not support the method at all (often a proxy or a
  static host seeing `PUT`/`PATCH`/`DELETE` it was never configured to pass), versus 405 which
  means "known method, not allowed here". The 501-vs-405 distinction is the hook, and we already
  own 405 to link to.
- Cannibalisation: none; explicitly differentiated from the live `405-method-not-allowed`.

### Tier 2: worth doing, slightly harder or lower demand

**`407-proxy-authentication-required`**
- Evidence: "http error 407" volume 2,900, but KD 37-48 (harder than tier 1), Kinsta ranks.
- Angle: 407 is the proxy's version of 401. Most searchers hit it behind a corporate or forward
  proxy, or via a misconfigured `Proxy-Authorization`. Differentiate from 401 (origin auth).
- Note: higher KD means schedule after tier 1; still completes the 4xx silo.

**`psql-list-databases-and-tables`** (one page, organised by task)
- Evidence: a family, not one term: "postgres list tables" 1,300, "list tables in psql" 1,000,
  "postgres list databases" 1,000, "psql list databases" 1,000, "create database postgresql psql"
  1,300, more at 480-880. KD 27-41. Kinsta owns most of them.
- Angle: a real psql reference organised by task (`\l`, `\dt`, `\dn`, `\d table`, `CREATE
  DATABASE`, `\c`), written for someone connected to a managed Postgres. Natural, honest product
  bridge: how to connect psql to a Kloudbean managed Postgres. This is on-entity (managed
  databases) rather than generic-dev, which is why it passes where "python comments" fails.
- Cannibalisation: low. Our Postgres pages are hosting, tuning and full-text; none is a CLI
  reference. Follow the variant-family rule: one page, the specific commands as the evidence.

**`mysql-default-port-and-show-databases`** (one page)
- Evidence: "mysql port" 1,300, "port 3306" 880 (KD 21), "mysql show databases" 880, "mysql
  default port" 480, plus variants. Kinsta ranks several.
- Angle: the MySQL counterpart. Default port 3306 and why it should not be public, `SHOW
  DATABASES` / `SHOW TABLES`, connecting over a socket versus TCP. Product bridge: managed MySQL
  keeps 3306 on the private network, reachable from the app tier, not the open internet (grounded
  in `database-private-access-control`).
- Cannibalisation: low, same reasoning as psql. Consider whether one "connect to your managed
  database from the command line" page covering both engines is stronger than two; leaning two,
  because the search strings are engine-specific.

### Tier 3: optional silo-completion (low volume, do only if closing the set)

`cloudflare-error-526-invalid-ssl-certificate` (completes CF with 525), `cloudflare-error-520`
depth check. Lower demand; write only to finish the cluster, not for traffic.

---

## 4. Deliberately rejected (write-nothing, with reasons)

These have real volume and Kinsta ranks them. We still decline, because they pull us off the
hosting entity and into a breadth contest we cannot and should not win. Precedent:
`alibaba vs aliexpress` rejected at 12,100.

| Rejected family | Example volumes | Why we decline |
|---|---|---|
| Python language tutorials | "python comments" 2,400, "is python object oriented" 1,600 | Language education, not hosting. Pure dilution. |
| Browser / consumer cache | "clear browser cache firefox" 2,900, "chrome vs edge" 1,900 | End-user browser help, unrelated to our reader or product. |
| People-search | "how to find someone's email" and ~12 variants, 590-2,400 each | Not email hosting at all. Wrong audience entirely. |
| Docker command references | "docker remove image" 2,400, "docker volume" 1,300 | Docker build/run is UNCONFIRMED in product truth. Do not build a silo we cannot honestly anchor to the product. |
| Git tool tutorials | "git vs github" 2,400, "rename a git branch" 2,400 | Generic VCS education; risks colliding with the existing `gitlab-vs-github`. Low product fit. |
| Video / download errors | "youtube error" 3,600, "download video data" 2,400 | Consumer, off-topic. |
| Adult / malformed SSL strings | "www.xnxx.com ... err_ssl_protocol_error" 14,800 | Junk. The clean SSL-error intent is already served by `err-ssl-protocol-error`. |
| "how to install wordpress" | 12,100, KD 43 | Generic, high-difficulty, Cloudways-owned, and already served by our managed-WordPress cluster. Achievability is poor and gain is thin. |

---

## 5. Build order

1. `505-http-version-not-supported` (tier 1, strongest signal).
2. `cloudflare-error-524-a-timeout-occurred` (tier 1, closes our own silo).
3. `501-not-implemented` (tier 1, completes 5xx, links to live 405).
4. Two small edits (no new URLs): fold `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` into
   `err-ssl-protocol-error`; fold the `DNS_PROBE_FINISHED_*` family into `err-name-not-resolved`.
5. `psql-list-databases-and-tables`, then `mysql-default-port-and-show-databases` (tier 2).
6. `407-proxy-authentication-required` (tier 2, higher KD, schedule last of the codes).
7. Tier 3 only if we want the Cloudflare set closed for completeness.

Each new article: house quality bar (answer-first, near-zero em-dash, FAQ mirrored to FAQPage
JSON-LD, reference diagram), product claims only from the steering files, validate to `[OK]`,
safety-grep, then commit. Social generates automatically via the Stop hook.

---

## 6. The honest summary for the owner

We have not "missed every topic". On the two clusters where a host has real authority (server
errors and connection/DNS errors) we are already close to complete, and the audit proves it slug
by slug. The export's remaining high-volume terms are mostly a broad-knowledgebase play
(Kinsta's) that would cost us focus. The right expansion is small and sharp: finish the status
silo (505, 524, 501, later 407), add two honest database CLI references that bridge to managed
databases, and widen two existing pages to catch the SSL-cipher and NXDOMAIN strings without
publishing a competitor to ourselves. Quality and topical focus win here, not page count.
