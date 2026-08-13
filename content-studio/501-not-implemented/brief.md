# Brief: 501-not-implemented

Full analysis and build order in `content-studio/_competitor-gap-research.md` (tier 1).

## Target keyword and real search data

Source: `kloudgraph-semrush-export` gap.keywords exports.

| Keyword | Volume | KD |
|---|---|---|
| 501 error | 1,600 | 25 |
| error 501 | 590 | 26 |

Completes the 5xx set beside 500, 502, 503, 504, 505. Primary: **501 error**. Secondary: error 501,
http 501, 501 not implemented.

## Cannibalisation check (done against live H2 sets)

No 501 slug existed. The key neighbour is the live `405-method-not-allowed`. Differentiated explicitly:
501 means the server does not support the method or functionality at all, versus 405 which means the
method is understood but not allowed on that resource. Links to 405 and 505.

## Information gain (one sentence)

A 501 on a normal REST verb almost always comes from a proxy or a static host in front of the app that
was never configured to pass that method, not from the app framework, so the fix is to find which layer
emitted it with a `curl -X` method sweep, not to change the app.

## Product claims

Only from `kloudbean-facts.md`: managed and patched reverse proxy, logs in one dashboard, seven clouds,
free SSL, staging, automatic backups, free migration. Honest boundary stated once. No SLA or uptime
claims.

## Format

Classify-first field guide, section order varied from the sibling 5xx pages.
