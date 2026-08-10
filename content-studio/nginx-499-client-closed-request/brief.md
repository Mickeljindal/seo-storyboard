# Brief: nginx-499-client-closed-request

## Target keyword and real search data

Source: `kloudgraph-semrush-export` competitor position exports plus the gap export, clustered by
`scripts/build-topic-queue.py`. Family `http-499`, priority score 66.5.

| Keyword | Volume | KD |
|---|---|---|
| 499 error code | 1,900 | 21 |
| 499 status code | 1,300 | 17 |
| http 499 | 1,300 | 40 |
| 499 error | 1,000 | 25 |
| status code 499 | 880 | 25 |
| error 499 | 590 | 22 |
| 499 http | 390 | 39 |

**Family volume 7,360 across 7 keywords, minimum KD 17.** Unusually clean family: no brand
contamination, and the two largest terms sit at KD 21 and 17. A prose scan of all 298 articles
confirms **no article mentions 499 at all**.

Primary: **499 status code**. Secondary: 499 error code, nginx 499, client closed request,
what does 499 mean, 499 vs 504.

## Cannibalisation check (mandatory, done against real H2 sets)

| Existing slug | What it owns | Verdict |
|---|---|---|
| `http-error-408-request-timeout` | Server gave up waiting for the **request** to arrive. H2s: "408 blames the sender", "Why your nginx log shows 408s nobody reported", "The 502 that is really a 408" | Opposite party quits. Must draw the line explicitly and cross-link. |
| `fix-504-gateway-timeout` | The **proxy** gave up waiting for the upstream | Different party again. Link. |
| `http-error-500-internal-server-error` | App ran and threw | Unrelated failure. Link as the 5xx hub. |
| `err-connection-reset` | Connection killed mid-flight at the transport layer | Adjacent, different layer. Link. |
| `fix-502-bad-gateway-node-nginx` | Proxy could not get an answer | Link only. |

**Distinct intent in one line:** 408, 504 and 502 are all codes where the *server side* stopped
waiting or failed. 499 is the only one in the family where **the client quit**. Nothing in the
library covers a client-initiated abort, and that reversal is the whole article.

## Information gain (the approval question)

Three things a reader cannot get from the generic answer:

1. **499 is usually not an error.** It is frequently a user navigating away, closing a tab, or a
   mobile client losing signal. Treating a 499 count as an error budget breach is a common
   misreading, so the article gives the test that separates noise from signal.
2. **A wave of 499s is a latency signal, not an error signal.** They cluster when the client's
   timeout is shorter than your response time. So the fix is almost never in nginx; it is the slow
   endpoint that made the client give up. That reframing is the highest-value idea on the page.
3. **`proxy_ignore_client_abort` is off by default, so nginx cancels the upstream request too.**
   Your application gets killed part-way through work it thought it was doing, which is how a 499
   turns into half-written data. This is the operationally serious detail and almost nothing
   ranking for the term explains it.

Angles used: *the status code names the layer* (here, names the party), *the popular fix cannot
work* (tuning nginx timeouts does not touch a client-side abort), and *the failure is invisible*
(the aborted upstream work leaves no error of its own).

## Verified technical claims

- **499 is not in any RFC.** It is nginx's own non-standard code, which is why it is absent from
  standard status code tables and from most browsers' vocabulary. It appears in logs, not on pages,
  because by definition there is no longer anyone to send a response to.
- `proxy_ignore_client_abort` defaults to `off`, meaning nginx closes the upstream connection when
  the client aborts. Setting it `on` lets the upstream finish.
- A load balancer in front will report its own code, so 499 in nginx can surface elsewhere as a
  different number, mirroring the 408 to 502 translation already documented in the 408 article.
- AWS ALB and similar report client-side disconnects with their own target codes rather than 499,
  since 499 is nginx-specific. Kept general, no vendor-specific number asserted.

## Product claims

Only from `kloudbean-facts.md`: managed reverse proxy, server metrics beside application and server
logs in one dashboard, seven clouds, managed Redis for caching, free SSL, free migration assistance.
Shared-responsibility boundary stated. No SLA or uptime figure.

## Format

Reframing guide, deliberately not a fix list, because the correct action for most 499s is to stop
treating them as failures. Opens by classifying noise against signal, then moves to the latency
reading, then to the upstream cancellation problem. Shorter than the 500 hub; this is a narrower
question and padding it would be worse.
