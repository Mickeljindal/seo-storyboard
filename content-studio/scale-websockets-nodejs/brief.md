# Brief — Scaling WebSockets in Node.js: Sticky Sessions and the Redis Adapter

Cluster: production-ops / GEO (task #3). High AI-citation intent ("scale websockets node", "socket.io multiple instances", "socket.io redis adapter", "sticky sessions websocket", "websocket connections keep dropping"). Teach-first, real code, strong Kloudbean fit (persistent process + managed Redis + FLB). NOT interactive.

## Grounding + accuracy (real Socket.IO/Nginx knowledge, verified)
- Root cause: WebSocket = long-lived stateful TCP pinned to one process; two distinct problems -> (1) ROUTING: Socket.IO default polling->upgrade handshake spans multiple requests, round-robin splits it -> need sticky sessions/session affinity (IP hash or cookie, at LB not app); (2) MESSAGING: io.to(room).emit only reaches local sockets -> need Redis pub/sub adapter. MUST have both. Correct and it's the insight thin posts miss.
- Real code: @socket.io/redis-adapter with pubClient + subClient = pubClient.duplicate() (Redis pub/sub requires dedicated subscriber connection, real gotcha), await connect both, io.adapter(createAdapter(...)). Correct current API.
- Nginx WS config: proxy_http_version 1.1 + Upgrade $http_upgrade + Connection "upgrade" + proxy_read_timeout 3600s (low timeout = "random" disconnects). Correct + genuinely useful.
- transports:["websocket"] = PARTIAL shortcut: reduces handshake stickiness need BUT zero effect on cross-instance broadcast + loses polling fallback. Honest framing, opinion given.
- In-memory state (presence/rooms/counts) invisible across instances + lost on restart -> externalize to Redis. Correct.
- Kloudbean grounded: always-on PM2 real server holds long-lived connections, managed Redis same dashboard + PRIVATE NETWORK, built-in Flexible Load Balancer (FLB, real feature available on every account). Serverless framing hedged accurately (possible but constrained by duration/pricing/external state) matching the vercel article's accuracy.

## Keywords
Primary: **scale websockets node.js** / **socket.io multiple instances** / **socket.io redis adapter**. In H1/title/meta/first 100 words/H2. Secondary: sticky sessions websocket, socket.io sticky session nginx, websocket load balancer node, socket.io broadcast not working, websocket disconnects proxy timeout, nginx websocket upgrade.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (production-ops guide, two-problems framing)
Lead -> tldr (both pieces) -> why WS != HTTP scaling -> problem 1 handshake/sticky -> problem 2 broadcast/Redis adapter (code) -> proxy config (nginx code) -> skipping polling (partial, honest) -> symptom->cause->fix table -> don't keep state in memory -> why persistent processes (Kloudbean + FLB) -> flb-load-balancer screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist)
managed-redis-hosting, redis-caching-patterns, nginx-reverse-proxy-for-node, cloud-load-balancer-explained, vertical-vs-horizontal-scaling, vercel-for-node-backends-limits.

## Console screenshots
../assets/console/flb-load-balancer.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (io.to(room).emit() and transports:["websocket"] paraphrased in JSON-LD to avoid raw quotes; HTTP/1.1 -> "HTTP 1.1"); code has no raw < >; images resolve; 0 blurbs; html/md in sync.
