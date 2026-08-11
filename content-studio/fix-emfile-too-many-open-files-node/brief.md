# Brief: fix-emfile-too-many-open-files-node

## Role
Cluster 2 (Node.js and deployment). Pillar + money best-managed-nodejs-hosting-2026. High-GEO error page.

## Keyword grounding (honest)
Primary: **EMFILE too many open files** (Node). Secondary: EMFILE error node, too many open files nodejs,
ulimit -n node, LimitNOFILE, node file descriptor limit, node open files leak.

## Cannibalisation (content-grep confirmed UNOWNED)
"too many open files" and "EMFILE" = 0 hits. DISTINCT from fix-javascript-heap-out-of-memory-node
(RAM vs file descriptors) - explicitly differentiated + forward-linked as the resource-exhaustion sibling.

## Grounding (verified general OS/Node knowledge)
- EMFILE = hit the open file-descriptor ulimit; sockets + DB connections count as fds. Decision table:
  immediate/dev = watcher+low default; only-under-load = concurrency; climbing = LEAK. Raise limit
  (ulimit -n / systemd LimitNOFILE) ONLY when usage is real; find leak with lsof -p. Leak causes:
  per-request DB connections (link database-connection-pooling), unclosed HTTP agents/streams/listeners.
- KB angle: PM2 restarts cleanly (safety net, not cure); sensible system limits. Honest: the leak is in your code.

## Information gain
1. Decision table leak-vs-concurrency-vs-watcher - diagnose before touching config.
2. Opinion/anti-pattern: raising the limit on a leak is a countdown, not a fix.
3. lsof-by-descriptor-type triage (DB sockets vs external sockets vs files) points at the culprit.

## Format
fix-page: answer-first TL;DR, what-it-means (fds not files), which-EMFILE table, raise-limit-when-right,
find-the-leak, honest KB fit, 8 FAQ. em-dash 0/0.
