# Brief — ECONNRESET in Node.js: What It Means and How to Fix It

Cluster: Node error field guide / GEO. Companion to `fix-econnrefused-node`, deliberately scoped to the opposite fact pattern so the two do not compete.

## Cannibalisation check (done)
Read `fix-econnrefused-node`'s H2 set: "What ECONNREFUSED actually means", "The usual causes, ranked", "Fix it step by step", "The localhost trap in production", "Handle startup races with a retry", "How managed infrastructure sidesteps this". That page owns **the connection never opened** (nothing listening, wrong host/port, 127.0.0.1-in-prod, startup race).

This page owns **the connection existed and was torn down**: TCP RST on an established socket. Zero overlap in causes or fixes. It links to the ECONNREFUSED page twice (contrast in the body, and related reading) rather than restating it. Kept, not merged.

## Angle / information gain
Organised by WHO sent the reset, because that is the actual diagnostic fork and nobody structures it that way. Gain competitors do not carry:
- `read` vs `write ECONNRESET` as a real signal (syscall field), plus the `EPIPE` relationship.
- The rule instead of a magic number: your idle timeout must be shorter than the peer's. Named the real knobs (`idleTimeoutMillis`, `server.keepAliveTimeout` default 5s, MySQL `wait_timeout`, nginx `keepalive_timeout`).
- Node 19+ enabling keep-alive on the global agent by default, so readers inherit the idle-socket problem unasked.
- Why an unhandled socket `error` event ends the process (EventEmitter semantics), with the handler pattern and the `clientError` hook.
- Opinion: most ECONNRESET reports are idle connection reuse, not a network fault. Check the pool first.
- Anti-patterns: empty catch (throws away `code` and `syscall`), and blanket retry of non-idempotent writes creating duplicates.

## Accuracy
- ECONNRESET = peer sent a TCP RST on an established connection. Named ECONNREFUSED (nothing listening) and ETIMEDOUT (no answer) once each as contrast, plus EPIPE. `errno: -104` is the real libuv value on Linux.
- No invented numbers, frequencies, benchmarks or percentages. No "X% of the time".
- Kloudbean: ONE sentence, grounded only in kloudbean-facts (live streamed app/build logs, deployment history, persistent Node processes under PM2, managed databases with controlled access) plus one short CTA. Does NOT claim the product prevents ECONNRESET; framed as "you can see the restart". $8/mo entry price with a pricing-page link.

## Keywords
Primary: **econnreset node** / **fix econnreset** / **ECONNRESET meaning**. In H1, `<title>`, meta description, first 100 words, and the H2 "What ECONNRESET actually means" plus "read ECONNRESET vs write ECONNRESET".
Secondary and long-tail woven through body + FAQ: read ECONNRESET, write ECONNRESET, socket hang up, econnreset node js axios, econnreset postgres pool, econnreset vs econnrefused, econnreset load balancer, ECONNRESET crashing node process, econnreset retry idempotent, aborted connection.
No volumes cited: no SEMrush export was supplied for this term, so nothing is asserted. Re-mine before any refresh.

## Shape (troubleshooting field guide, ordered by suspect)
Lead -> tldr -> what it means -> read vs write (error object) -> comparison table (RESET/REFUSED/TIMEDOUT/EPIPE) -> "who reset it?" list -> six suspects as H3s (stale pool, proxy/LB, crash-restart, body size, TLS, client hung up) -> unhandled socket error crashes the process -> two anti-patterns -> symptom-to-cause-to-fix matrix -> production evidence (one Kloudbean note) -> related reading -> CTA -> 9 FAQ.

Structure deliberately differs from `fix-econnrefused-node` (suspect-oriented H3 tree, two tables, anti-pattern section, no "causes ranked / step by step" spine).

## Internal links (7, all verified to exist)
fix-econnrefused-node, database-connection-pooling, fix-502-bad-gateway-node-nginx, graceful-shutdown-nodejs, fix-node-app-crashing-on-deploy, structured-logging-nodejs, managed-postgresql-hosting.

## Images
Hero `images/hero.png` (to render). Three `.img-slot` spacers: annotated stack trace, who-sent-the-RST diagram, live logs beside deployment history.

## Gate
0 em-dashes; word count in range; JSON-LD Article + FAQPage + clean Organization `@id`; 9 FAQ h3s match JSON-LD names exactly, no double quotes in names; HTML code escaped; internal links resolve; 0 blurbs; no banned claim class; .md and .html in sync.
