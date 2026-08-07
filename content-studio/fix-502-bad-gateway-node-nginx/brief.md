# Brief — 502 Bad Gateway with Node.js and Nginx: How to Fix It

Cluster: error field-guide / GEO (task #2). High AI-citation intent ("502 bad gateway node nginx", "nginx 502 node app", "connect() failed connection refused upstream", "upstream timed out"). Standard Nginx+Node knowledge, light managed-proxy landing. NOT interactive.

## Grounding + accuracy (pure technical, verifiable)
- 502 = reverse proxy got no valid upstream response. Two log signatures: "connect() failed (111: Connection refused)" = app down/wrong port; "upstream timed out (110)" = app too slow. Real fixes: curl localhost:port, pm2 list, match proxy_pass to app port, bind interface (127.0.0.1/0.0.0.0), nginx -t && reload, proxy_read_timeout for slow (with honest "bandage not cure -> move to background job"). Flickering 502 under load = crash/OOM/restart-loop (cross-link).
- Real config block (proxy_pass, proxy_http_version, headers, timeout), real error log lines, real /var/log/nginx/error.log path. All correct.
- Kloudbean grounded + honest: managed reverse proxy + free SSL in front of always-on Node under PM2; removes wrong-port/forgot-reload class. Explicitly said "a genuine app crash can still cause a 502, that's your code" (no overclaim). Reverse proxy + free SSL are real Kloudbean facts.

## Keywords
Primary: **502 bad gateway node nginx** / **nginx 502 node** / **how to fix 502 bad gateway node**. In H1/title/meta/first 100 words/H2. Secondary: connection refused upstream nginx, upstream timed out node, proxy_pass wrong port, nginx error log 502, 502 under load node, node behind nginx.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (error field guide, log-driven)
Lead -> tldr (3 checks + read error log) -> what 502 means (reverse proxy) -> step 1 read nginx error log (2 signatures) -> fix connection-refused (curl/pm2 + proxy_pass config + bind/reload) -> fix upstream-timed-out (raise timeout, honest: fix latency) -> when it's really a crash (cross-link) -> log->meaning->fix table -> managed hosting removes proxy guesswork (Kloudbean, honest) -> add-application screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist)
nginx-reverse-proxy-for-node, reverse-proxy-explained, pm2-app-keeps-restarting, fix-econnrefused-node, fix-javascript-heap-out-of-memory-node, uptime-monitoring.

## Console screenshots
../assets/console/add-application.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (no raw < >, no literal path issues); HTML: no angle brackets in config; && escaped as &amp;&amp; in HTML prose; .md raw &&; images resolve; 0 blurbs; html/md in sync.
