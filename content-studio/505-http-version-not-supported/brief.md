# Brief: 505-http-version-not-supported

Full analysis and build order in `content-studio/_competitor-gap-research.md` (tier 1).

## Target keyword and real search data

Source: `kloudgraph-semrush-export` gap.keywords exports.

| Keyword | Volume | KD |
|---|---|---|
| 505 error | 3,600 | 17 |

Six competitors rank this term (Heroku, Kinsta, Netlify, Pressable, Railway, WPVIP), and kloudbean
already sat at roughly position 16 with no dedicated page, which is the strongest single "position
beats gap" signal in the whole export. Primary: **505 error**. Secondary: http 505, 505 http version
not supported, 505 error code.

## Cannibalisation check (done against live H2 sets)

No 505 slug existed. The 5xx silo (500, 502, 503, 504, Cloudflare 520 to 525) was otherwise complete,
so this closes it. Differentiated in-body from 400 (malformed), 431 (headers too large), 426 (Upgrade
Required), and 501 (method or feature not implemented). Links to 501 as its nearest twin.

## Information gain (one sentence)

A genuine 505 from an origin is rare, so the useful move is to classify which layer (client, CDN, WAF,
reverse proxy, load balancer) actually rejected the HTTP version or request line, then split it with a
`curl --http1.1` versus `--http2` test, rather than editing the app.

## Product claims

Only from `kloudbean-facts.md`: managed and patched reverse proxy, app and server logs in one
dashboard, seven clouds, free SSL, staging, automatic backups, free migration. Honest managed/your-code
boundary stated once. No SLA, uptime, or certification claims.

## Format

Classify-the-layer field guide, section order varied from the sibling 500 page.
