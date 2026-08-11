# Brief: fix-eacces-permission-denied-node

## Role
Cluster 2 (Node.js and deployment). Pillar + money best-managed-nodejs-hosting-2026. High-GEO error page.

## Keyword grounding (honest)
Primary: **listen EACCES permission denied** (Node). Secondary: EACCES port 80, node permission denied port,
bind privileged port node, listen EACCES 0.0.0.0:80, node port 443 permission.

## Cannibalisation (content-grep confirmed UNOWNED)
"EACCES" = 0 hits. DISTINCT from fix-eaddrinuse-port-already-in-use-node (occupancy vs permission) -
explicitly differentiated + cross-linked both ways (forward link to eaddrinuse; note bidirectional intent).

## Grounding (verified general OS/Node knowledge)
- EACCES = permission refusal, usually binding a privileged port (<1024) as non-root. Fix: run app on a
  high port behind a reverse proxy (the managed pattern), NOT run-as-root (security risk). setcap
  cap_net_bind_service noted as least-bad alternative. High-port EACCES = file/socket perms branch.
- KB angle: app runs non-root under PM2 on a high port; web server owns 80/443 + SSL. Honest: file/socket
  perms in your own code stay yours.

## Information gain
1. Permission-vs-occupancy reframe (vs EADDRINUSE) - the key diagnostic split.
2. Opinion/anti-pattern: running Node as root to bind :80 is wrong; let the proxy own low ports.
3. The high-port EACCES branch (file/socket/SELinux) so readers aren't misled by the same word.

## Format
fix-page: answer-first TL;DR, permission-not-occupancy, privileged-port mechanism, clean-fix (proxy),
what-not-to-do (root), high-port branch, honest KB fit, 8 FAQ. em-dash 0/0.
