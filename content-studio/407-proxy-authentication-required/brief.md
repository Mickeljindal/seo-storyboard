# Brief: 407-proxy-authentication-required

Full analysis and build order in `content-studio/_competitor-gap-research.md` (tier 2).

## Target keyword and real search data

Source: `kloudgraph-semrush-export` gap.keywords exports.

| Keyword | Volume | KD |
|---|---|---|
| http error 407 | 2,900 | 37 |
| 407 error | 1,300 | 47 |
| error 407 | 590 | 38 |
| 407 proxy authentication required | 320 | 37 |

Higher difficulty than the tier 1 codes, scheduled after them. Kinsta ranks it. Primary: **http error
407**. Secondary: 407 error, error 407, 407 proxy authentication required.

## Cannibalisation check (done against live H2 sets)

No 407 slug existed. The twin is the live `http-error-401-unauthorized`. Differentiated: 407 is a proxy
asking for credentials (Proxy-Authenticate, answered with Proxy-Authorization), versus 401 which is the
origin asking (WWW-Authenticate). Also separated from 403, 429, and 502. Links to 401, 403, 405, 429,
502.

## Information gain (one sentence)

A 407 in production almost always means a forward or corporate proxy in the client's network, so the
fix is client-side proxy configuration (curl, npm, git, pip, apt), and the article shows how to pass
those credentials without leaking them into shell history, logs, or committed config.

## Product claims

Only from `kloudbean-facts.md`: managed and patched reverse proxy, logs in one dashboard, IP Access
Control (allow/deny by CIDR), a Basic Auth gate that returns 401 not 407, Shorewall and Fail2ban, seven
clouds, free SSL, free migration. Honest boundary stated once. No SLA or uptime claims.

## Format

Proxy-versus-origin field guide with a client-side fix matrix. Own section order, not a clone of 401.
