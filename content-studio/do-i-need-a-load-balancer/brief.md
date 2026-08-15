# Brief: do-i-need-a-load-balancer

## Intent & audience
- **Primary keyword:** do I need a load balancer
- **Intent:** informational / decision. Reader runs a single server and is unsure whether a load balancer is needed. They want a clear verdict, not a sales pitch.
- **Named reader:** a solo dev or small team on one app server, second-guessed by "real setups have a load balancer" advice.
- **Business outcome:** builds infra-concepts topical authority and surfaces the built-in FLB naturally for readers who *do* hit a trigger, without pushing it on the majority who do not.

## Secondary / merged keywords
- when do I need a load balancer
- is a load balancer necessary
- when to add a load balancer
- single server vs load balancer
- load balancer for a small app

Two questions ("do I need one" + "when to add one") merged into ONE article per the one-intent rule.

## Information gain (the honest angle)
The honest verdict: **not yet, for most single-server apps.** Gain competitors rarely lead with:
- A load balancer in front of ONE server is not high availability (common false-safety anti-pattern).
- It adds no capacity by itself; it only distributes across the servers you give it.
- Vertical scaling (make the one box bigger) is the simpler step before a load balancer.
- Two real triggers, both requiring a second server: horizontal scaling (capacity) and high availability (uptime).
- Statelessness prerequisite (sessions + uploads off local disk) is the usual reason a freshly load-balanced app logs users out.
- Decision table matching situation -> move; teaching SVG contrasting single point of failure vs LB + two servers.

## Cannibalisation check (mandatory)
- `cloud-load-balancer-explained` owns mechanics (what it does, routing algorithms, SSL termination, sessions, vs CDN). This page owns the **decision** intent and LINKS there for mechanics instead of competing.
- `vertical-vs-horizontal-scaling` owns the scaling axes; linked as the "scale up first" depth.
- `high-availability-explained` owns HA; linked for the HA trigger.
- `host-multiple-apps-one-server` owns multi-app-on-one-box; linked as the "one server does a lot" aside.
Distinct intent confirmed. No overlap that warrants folding.

## Internal links used (all verified to exist)
- https://www.kloudbean.com/blog/cloud-load-balancer-explained/
- https://www.kloudbean.com/blog/host-multiple-apps-one-server/
- https://www.kloudbean.com/blog/vertical-vs-horizontal-scaling/
- https://www.kloudbean.com/blog/high-availability-explained/

## Kloudbean grounding (single mention + CTA)
Grounded ONLY in kloudbean-facts.md FLB section: the Flexible Load Balancer (FLB) is built in, enable on any account when needed, with application pools, SSL management, and access logs. No invented features. No private-networking-as-default. No metrics.

## Constraints honoured
- No invented numbers/metrics anywhere (owner rule).
- Near-zero em-dashes (target 0).
- No banned claim classes (guarantee, certified, unlimited, fastest, only provider, etc.).
- Word count target 1800-2400.
