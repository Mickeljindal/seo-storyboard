# Brief: nginx-vs-apache

## Role
Cluster 8 (Infrastructure concepts). Pillar how-cloud-hosting-works. Money managed-vs-unmanaged-hosting.
SEMrush-driven (owner-greenlit).

## Keyword grounding (SEMrush _topic-queue.md)
Primary: **nginx vs apache** (~1,300/mo, KD35). Secondary: apache vs nginx, nginx vs apache
performance, htaccess nginx, which web server, nginx vs apache wordpress/memory. UNCOVERED
(clean grep confirmed).

## Cannibalisation (checked, grep-first)
Distinct from: reverse-proxy-explained (the concept), nginx-reverse-proxy-for-node (the how-to for
Node), how-cloud-hosting-works (pillar). THIS = the head-to-head web-server comparison. Links all
three; reverse-linked from reverse-proxy-explained.

## Grounding (general web knowledge + kloudbean-facts)
- Core: event-driven (Nginx, few workers) vs process/thread-per-connection (Apache; event MPM exists).
  Everything else (memory, static speed, .htaccess vs central config, reverse-proxy strength) follows.
- Kloudbean: nginx-based managed stack, tuned for you (worker counts/proxy/caching/TLS); front-Nginx
  pattern set up by default. Honest boundary: platform runs/tunes the web server; your app config
  (routes/rewrites/framework) stays yours. .htaccess migration caveat flagged.
- FAIR to Apache (mature, right for module/.htaccess-bound apps; "Apache is not dead"). No overclaim.

## Information gain
1. One architectural choice (event-driven vs process-per-connection) explains EVERY difference - the
   mental model, not a benchmark war.
2. The .htaccess migration snag (rules don't auto-port to Nginx) - real gotcha.
3. Opinion: it's often NOT either-or (Nginx front + PHP-FPM/Node/Apache behind); and on managed
   hosting you rarely choose at all - go build instead of benchmarking. Decision table.

## Format
Comparison/concept: core-difference -> where-each-wins -> .htaccess -> table -> does-it-matter(opinion)
-> honest KB fit -> related -> CTA -> 8 FAQ. em-dash 0/0.
