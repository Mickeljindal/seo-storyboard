# Brief — Managed Memcached Hosting (decision + how-to guide)

Cluster: Databases & storage (cache sub-cluster, sibling to managed-redis-hosting / redis-caching-patterns).
Format: decision-first guide (fork: Memcached vs Redis) then how-to. Deliberately NOT the same
template as the Redis article: leads with a decision fork, comparison table up top, "when NOT to"
before "when to", then launch + connect + patterns. Opener = scenario (busy PHP/WordPress app,
DB is the bottleneck).

## Keywords (ground grounding, do not fabricate precise volumes)
- Primary: **managed Memcached hosting** — placed in H1, <title>, meta description, first 100 words,
  and the H2 "How managed Memcached hosting works on Kloudbean".
- Secondary / long-tail woven through body + FAQ: managed Memcached, Memcached hosting,
  Memcached vs Redis, when to use Memcached, Memcached caching, session store, PHP object cache
  Memcached, Memcached on cloud, distributed cache, Memcached port 11211, Memcached max value size,
  is Memcached persistent, Memcached for sessions, WordPress Memcached object cache.
- No search volumes are cited in copy. "Memcached vs Redis", "Memcached vs Redis which is faster",
  "what port does memcached use", and "wordpress memcached" are known steady-interest queries
  (informational + comparison intent); treat any specific volume as unverified unless pulled from
  SEMrush/DataForSEO. Re-mine before asserting numbers.

## PAA-style questions answered (mirrored into FAQPage JSON-LD)
- What is managed Memcached hosting?
- Memcached vs Redis: which should I use?
- Is Memcached persistent / does it save to disk?
- What port does Memcached use? (11211)
- Can I use Memcached for session storage?
- Does WordPress support a Memcached object cache?
- What is the maximum value size in Memcached? (~1 MB, keys 250 bytes)
- Is Memcached a distributed cache?
- Is Memcached faster than Redis?
- Do I still need a database if I use Memcached?

## Kloudbean grounding (from kloudbean-facts.md — nothing invented)
- Memcached is one of the 7 managed engines (MySQL, MariaDB, PostgreSQL, Redis, Memcached,
  Elasticsearch, MongoDB). One-click launch from the DBS section.
- Private networking / VPC so the cache isn't public; controlled access.
- One dashboard for the whole stack (cache + DB + app), one server, one bill.
- Honest note: a pure volatile cache has nothing meaningful to back up (data is rebuildable from
  the DB) — stated as an honest engineering point, not a product gap.
- NOT claimed: autoscaling for normal users (enterprise-only), any "since <date>" for Memcached
  (Memcached is NOT in the dated changelog timeline, so no launch date asserted), no invented
  metrics/benchmarks, Linux stacks only.

## Byline
By Kloudbean · Notes From the Cache Layer.  (unique; not "Faster Than Ever")

## SVG concept
Bespoke decision fork (visually distinct from the Redis article's horizontal cache-aside flow):
question node "Do you need more than a plain key/value cache?" → NO (green) → Memcached card,
YES (purple) → Redis card. Brand colors navy #000f27, purple #4F1AF3, green #40b75f.

## Internal links used (6; all target folders confirmed to exist)
- add-managed-database-to-your-app
- managed-redis-hosting
- environment-variables-done-right
- database-connection-pooling
- speed-up-wordpress
- redis-caching-patterns
(Not linked: when-to-use-redis-vs-postgres — folder does not exist yet, so omitted to keep links resolving.)

## Screenshots
- ../assets/console/launch-database.png (launch step, real)
- ../assets/console/dashboard.png (one-dashboard point, real)
- 4 .img-slot placeholders (telnet stats, DBS list with Memcached, WP object cache setting; hint text em-dash-free)

## Honesty / [CONFIRM] notes
- No Memcached launch date asserted (not in the dated changelog).
- No specific SLA %, plan price, or benchmark numbers.
- "About 1 MB" default value / "250 bytes" key are Memcached defaults (well-established), not KB claims.
