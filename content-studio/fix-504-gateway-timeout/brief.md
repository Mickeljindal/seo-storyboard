# Brief: fix-504-gateway-timeout

## Keyword grounding (SEMrush gap export, 2026-07-23)

The 504 family totals roughly **58,540 volume across 64 keywords**, KD 23 to 43. Head terms sit at
KD 31 to 35, which is reachable, and the long tail is easier.

| Keyword | Vol | KD |
|---|---|---|
| **504 gateway timeout** (primary) | **6,600** | **35** |
| error 504 | 6,600 | 31 |
| 504 error code | 4,400 | 43 |
| 504 gateway time-out | 4,400 | 41 |
| http 504 | 3,600 | 33 |
| http error 504 | 3,600 | 33 |
| 504 gateway timeout meaning | 1,900 | 25 |
| what is a 504 error | 1,900 | 32 |
| gateway time-out error code 504 | 1,600 | 30 |
| 504 gateway time-out meaning | 1,300 | 23 |
| 504 gateway timeout error | 1,300 | 29 |
| what does 504 gateway timeout mean | 1,300 | 23 |

Kinsta holds the SERP. Intent is diagnostic and urgent.

**Secondary terms woven in:** upstream timed out, proxy_read_timeout, fastcgi_read_timeout,
max_execution_time, request_terminate_timeout, pm.max_children, 502 vs 504, nginx 504,
php-fpm timeout, slow query, EXPLAIN, SHOW FULL PROCESSLIST, pg_stat_activity, connection pool.

## Placement
Primary keyword in H1, title, meta description, lead, and TL;DR. 8 FAQ entries including the two
highest-intent ones ("what is the difference between 502 and 504", "should I just increase the
timeout").

## Why this topic is legitimately ours
A 504 is an origin and upstream problem: nginx waiting on PHP-FPM or Node, slow queries, exhausted
worker pools. That is hosting territory. It also completes the gateway-error silo alongside the
existing fix-502-bad-gateway-node-nginx and fix-503-after-deploying-your-app, and links to the new
Cloudflare cluster for the 524 case.

## Original value competitors do not have
- **A six-layer timeout table with the settings and defaults**, and the governing principle stated:
  the shortest timeout in the chain wins. Competing articles name one or two settings without the
  chain.
- **The 500-vs-504 inference**: if PHP's own `max_execution_time` fires first you get a 500 with a
  fatal error, because PHP stopped itself. A 504 therefore proves something IN FRONT of PHP gave up,
  which narrows where to look before you change anything.
- **Reading the actual nginx log line field by field**, including that `while reading response
  header` means the app never started replying rather than stalling mid-response. That is a real
  diagnostic distinction nobody explains.
- **`$upstream_response_time` alongside `$request_time`** in the log format, so you can separate time
  spent in your app from time spent connecting.
- **`server reached pm.max_children` named as the single most valuable log line**, because it turns a
  vague "504 under load" into a stated capacity problem. This is the cause that makes a site look
  randomly broken while every query looks fine in isolation.
- **Outbound calls without timeouts framed as an uptime ceiling**: "your uptime is capped by your
  slowest vendor." With real code for both Node (`AbortSignal.timeout`) and PHP (cURL connect and
  read timeouts).
- **A concrete rule for what belongs in a background job**: if a task can ever exceed about ten
  seconds, it should not block a response.
- **When raising the timeout IS legitimate, scoped to one nginx location block**, plus the reason
  global timeouts are dangerous: a stuck request holds a worker for the full duration, so one slow
  endpoint becomes a site-wide outage.
- **The consistency point**: raising `proxy_read_timeout` to 300s while `max_execution_time` stays at
  30 achieves nothing. Whichever limit is lowest decides.
- **"Started without a deploy" explained as data growth outrunning an index**, which is why 504s
  appear months after launch with no code change.
- **Founder position stated plainly**: most 504s are not timeout configuration problems, they are
  slow work finally noticed. Timeout changes come last.
- **"Does a 504 mean my server is down?"** answered with the observation that your server returned
  the 504, so it is up, and that restarting services appears to help only because it clears stuck
  workers.

## Internal links (8, verified)
fix-502-bad-gateway-node-nginx, fix-503-after-deploying-your-app, cloudflare-5xx-error-codes,
mysql-performance-tuning, postgresql-performance-tuning, database-connection-pooling,
nodejs-background-jobs-bullmq, celery-with-redis, nginx-reverse-proxy-for-node

## Facts check
Kloudbean claims used: managed servers with nginx and PHP-FPM configured, managed databases, managed
Redis, server metrics, server resize, one dashboard, free migration assistance. All in
kloudbean-facts.md. Honest limit stated (cannot index your tables, cannot stop an unbounded call to
a slow third party). No SLA figure. No autoscaling claim.
