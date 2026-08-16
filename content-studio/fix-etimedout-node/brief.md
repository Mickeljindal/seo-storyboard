# Brief — ETIMEDOUT in Node.js: How to Fix connect ETIMEDOUT

Cluster: Node error field guide / outbound connectivity. High AI-citation intent: people paste `connect ETIMEDOUT <ip>:<port>` straight into search and into assistants.

## Keywords
- Primary: **etimedout node** / **fix etimedout** (in H1, `<title>`, meta description, first 100 words, and the H2 "connect ETIMEDOUT is not the same as a Node request timeout").
- Variants woven through body + FAQ: connect ETIMEDOUT, ETIMEDOUT meaning, Node request timeout, etimedout postgres / database connection timeout, axios timeout of 5000ms exceeded, etimedout vs econnrefused, works locally times out on server.
- No volume/difficulty export was supplied for this term, so no figures are cited anywhere in the article. Grounding is intent-based (error-string paste behaviour) plus the cannibalisation map below. Re-mine before the next batch if volume data is needed.

## Cannibalisation check (mandatory, done against real neighbours' H2 sets)
- `fix-econnrefused-node` — owns the RST/refusal case: service not running, wrong port, the 127.0.0.1-in-prod trap, startup retry. Distinct intent: something answered and said no. Linked, not competed with. Its existing FAQ already contrasts ETIMEDOUT in one line; this article is the full treatment of the other side.
- `fix-504-gateway-timeout` — owns the inbound/proxy side: a gateway in front of YOUR app gave up. Mirror image, explicitly framed that way and linked.
- `http-error-408-request-timeout` — HTTP status semantics, client-took-too-long-to-send. Different layer entirely.
- `cloudflare-error-524-a-timeout-occurred` — Cloudflare edge waiting on origin. Again inbound.
- This page: the Node.js **outbound** path. Our app initiated, got total silence. No overlap with any of the four.

## Angle / information gain (one sentence)
A refusal proves something answered; a timeout proves nothing answered, so ETIMEDOUT is almost always a packet-level block rather than an application error — and the DROP-versus-REJECT firewall rule distinction is the mechanism that explains why.

Supporting gain competitors mostly miss:
- DROP produces a timeout, REJECT produces a refusal. Named explicitly, with the reason defaults drop.
- `connect ETIMEDOUT` (kernel, handshake never completed) vs a client-imposed request/socket timeout (axios `ECONNABORTED`, undici `HeadersTimeoutError`/`BodyTimeoutError`, `AbortError`). Told apart by reading `err.syscall === 'connect'`.
- Each diagnostic command framed by what it **rules out**, not just what it does. Includes the "you never sent the password, stop rotating credentials" beat.
- Two-knob timeout point: `https.request({ timeout })` covers connect only; `req.setTimeout()` covers the idle socket.

## Required beats
- Opinion: always set an explicit outbound timeout; a hung request is worse than a fast failure.
- Anti-pattern: raising the timeout until the error disappears — converts a fast failure into a slow outage and exhausts the pool.
- Sibling errors named once each as contrast: ECONNREFUSED, ECONNRESET.
- Commands: `nc -zv`, `/dev/tcp` fallback, `curl -v --max-time`, `telnet`, `dig +short`, `ss -tlnp`.

## Kloudbean positioning (one mention only)
Problem is fully solved before the product appears. Single sentence, in "Timeouts to a database are usually a rule, not a bug":
managed databases with controlled access, IP Access Control (allow/deny, CIDR), server + database in one dashboard, live logs. Immediately followed by the honest limit: it does not make timeouts impossible. All grounded in kloudbean-facts.md. No private-networking/VPC claim (Enterprise-only). No prevention claim. One short CTA at the end.

## Internal links (7, all verified folders exist)
fix-econnrefused-node, fix-504-gateway-timeout, database-connection-pooling, fix-slow-dns-lookup, what-is-an-ssh-tunnel, managed-postgresql-hosting, structured-logging-nodejs.

## Assets
Hero `images/hero.png` (to render). 3 `.img-slot` spacers with concrete hints (refused-vs-hanging terminal comparison, annotated stalled `curl -v`, handler-exhaustion diagram). No console screenshot used: none of the existing shots show IP Access Control, and inventing one would misrepresent the UI.

## Gate
0 em-dashes in body prose; 1600–2400 words; JSON-LD Article + FAQPage + Organization (`@id https://kloudbean.com/#organization`); 9 FAQ with exact `<h3>`-to-`name` parity; code escaped with `&lt;` `&gt;` `&amp;` in HTML, raw in .md; no banned claim class; no invented numbers, latency figures, or frequencies; `.md` and `.html` in sync.

## Freshness triggers
Node HTTP client timeout APIs (undici error names, `AbortSignal.timeout`), axios error codes, and any change to how Kloudbean surfaces database access control. Review if any of those move.
