# Brief — Nginx Reverse Proxy for Node (practical config guide)

Silo: Node.js deployment / reverse proxy. SPOKE off the concept pillar reverse-proxy-explained,
sibling to deploy-express-app and deploy-nestjs-app.
Primary kw: **nginx reverse proxy for Node** (also targets **nginx reverse proxy Node.js**).
Intent: how-to / config (someone with a Node app who needs a real nginx server block).
Placed in H1, `<title>`, meta description, first 100 words, and the H2 "The nginx reverse proxy for Node config, line by line".

## Keywords woven (grounded; hedge any volumes, no fabricated numbers)
Primary: nginx reverse proxy for Node / nginx reverse proxy Node.js.
Secondary + long-tail (each earns a real spot in the body or FAQ):
- nginx proxy_pass Node / proxy_pass localhost 3000 (config + FAQ "What does proxy_pass do")
- run Node behind nginx / why put nginx in front of Node (H2 "Why not just expose Node on port 3000?" + FAQ)
- nginx config for Node app (the full server block)
- nginx SSL Node (TLS termination reasons + config + managed SSL section)
- WebSocket nginx Node / Upgrade headers / socket.io 400 (H2 "How do I proxy WebSockets through nginx?")
- X-Forwarded-For Node / real client IP behind nginx / trust proxy (H3 + FAQ)
- serve static files nginx Node (H2 "Can nginx serve static files for my Node app?")
- multiple Node apps one nginx / server_name routing / upstream (H2)
- 502 Bad Gateway nginx Node / 413 client_max_body_size / redirect loop X-Forwarded-Proto (errors section + FAQ)

## PAA-style questions (answered on-page + mirrored in FAQPage JSON-LD)
- Why put nginx in front of Node?
- What does proxy_pass do in nginx?
- How do I proxy WebSockets through nginx for a Node app?
- How do I get the real client IP behind nginx in Node?
- Why do I get a 502 Bad Gateway with nginx and Node?
- Do I need nginx on managed hosting?
- Can nginx serve static files for my Node app?
- Should Node listen on localhost or 0.0.0.0 behind nginx?
- What is client_max_body_size and why did my upload fail?
- How do I run multiple Node apps behind one nginx?

## Shape (config field guide; deliberately NOT the reverse-proxy-explained concept-explainer template)
Why-expose-Node -> bespoke SVG (nginx-vs-Node split) -> full server block -> per-header WHY -> trust proxy in
Express/NestJS -> static files -> WebSockets (the #1 mistake) -> multiple apps (server_name + upstream) ->
safe reload + the 3 real errors -> founder note (toil) -> what the managed platform does for you -> CTA -> FAQ.
Distinct from reverse-proxy-explained (concept/502 payoff) and deploy-express-app (app code changes + deploy steps).

## SVG (bespoke, unique)
Single left-to-right request flow: Internet :443 HTTPS -> nginx (public edge, :80/:443) -> proxy_pass plain HTTP
-> Node app 127.0.0.1:3000. Two columns below split the work: "nginx handles the edge" (TLS, static files,
gzip/brotli, buffer slow clients, X-Forwarded headers, route many apps) vs "Node handles the app" (routes/logic,
JSON/templates, sessions/auth, database, reads PORT, private port). Footnote: public 80/443 stable, Node port
private. Navy #000f27 / purple #4F1AF3 (nginx) / green #40b75f (Node). Different from the reverse-proxy-explained
two-panel forward-vs-reverse diagram.

## Screenshots (../assets/console/) + slots
Real: add-application (platform wires the proxy to the app's port + domain), ssl-certificate (free auto-renewing
SSL terminated at the proxy). 3 img-slots: nginx -t "test successful" terminal; devtools WebSocket 101 Switching
Protocols; dashboard with multiple apps behind the managed proxy. Em-dash-free hints; HTML comments use
`src -> images/...` (no quoted src) so the validator doesn't flag them.

## Internal links (6, all folders confirmed to exist)
UP: reverse-proxy-explained (concept pillar). ACROSS: deploy-express-app, deploy-nestjs-app,
environment-variables-done-right, cloud-load-balancer-explained. MONEY/adjacent: what-is-a-managed-server.
NOTE: pm2-vs-systemd was requested but its folder does NOT exist yet, so it was intentionally NOT linked
(validator + link-resolution rule). Add it later when the sibling ships.

## Fact grounding (kloudbean-facts.md)
- nginx/Node config kept general and technically accurate (universal, not Kloudbean-specific).
- Kloudbean runs the reverse proxy in front of your app and terminates SSL there; you don't hand-edit nginx for a
  normal app. Free auto-renewing SSL is in facts. Framed as platform-managed ("what the platform is doing for you").
- Built-in Flexible Load Balancer on every account, off by default; virtual LBs + app pools + SSL management +
  access logs. Framed as the multi-backend extension of the upstream idea.
- One dashboard for the whole stack (servers, apps, managed DBs, load balancer); Git deploy; IP allow-listing;
  Linux stacks (Node). Pricing from $8/mo; Enterprise custom. Free migration + free trial approved.
- NOT claimed: users editing Kloudbean's nginx config (not in facts); autoscaling for normal users (enterprise-only);
  any customer/geo counts; any invented benchmark/metric; no certification claim.

## [CONFIRM] facts omitted
- No specific uptime SLA %, no customer-count, no enterprise dollar figure (all [CONFIRM] / MUST-NOT).
- NestJS is referenced as a Node framework that follows the same trust-proxy rule (true, it runs on Node); NOT
  claimed as a one-click managed runtime, since facts list Express/Angular/React/Vue for Node.

## Founder note
Hand-rolling and hardening nginx per app (renewing certs, new server blocks, client_max_body_size, deprecated
ciphers) is repeat toil a managed platform should absorb. Knowing the config is what the platform does for you.

## Byline (unique; NOT "Faster Than Ever")
By Kloudbean Platform Engineering · The Proxy Out Front: what nginx does for your Node app, and what you'd
otherwise maintain by hand.  (Closing byline varies: "The proxy out front, so your Node app can stay on localhost.")

## Length target
2400-2700 words. Answer-first .tldr (~60 words). Em-dash-in-prose target: 0.
