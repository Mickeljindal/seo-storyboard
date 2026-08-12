# Brief — Redis vs Postgres (when to use each, and when both)

Cluster: databases & caching. Intent: comparison / decision + "do I need Redis" buyer question.

PRIMARY KEYWORD: "Redis vs Postgres" (also target the question form "when to use Redis vs PostgreSQL").
Placed in: H1, &lt;title&gt;, meta description, first 100 words (lead + tldr), and an H2 ("Redis vs Postgres: two different jobs, not a contest"; plus "When to use Redis vs PostgreSQL: a decision guide").

SECONDARY / long-tail (from cluster reasoning + PAA patterns):
"Redis or Postgres", "use Redis with Postgres", "caching layer", "session store Redis" / "Redis session store",
"Postgres as cache", "Redis persistence" / "is Redis persistent", "Postgres UNLOGGED tables",
"rate limiting Redis", "queue Redis vs Postgres", "do I need Redis", "Redis vs Postgres for sessions",
"is Redis a database", "Redis vs Memcached".

PAA-style questions answered (mirrored into FAQ + FAQPage JSON-LD):
- Do I need Redis if I have Postgres?
- Can Postgres be used as a cache?
- Is Redis persistent, or does it lose data on restart?
- Redis vs Postgres for sessions: which should I use?
- Which is faster, Redis or Postgres, and why?
- Can I use Redis and Postgres together?
- When should I add Redis to my app?
- Is Redis a database or just a cache?
- Can Postgres handle a job queue without Redis?
- Redis vs Memcached: which cache should I pick?

VOLUME SIGNALS (hedged, not cited in copy): "Redis vs Postgres" / "when to use Redis vs PostgreSQL" are steady,
mid-interest dev-comparison terms; "do I need Redis" and "session store Redis" are lower-volume high-intent
long-tail. No precise volumes asserted anywhere in the article. Re-mine SEMrush / DataForSEO before citing any number.

ANGLE (best-resource bar): NOT "which is better." They solve different jobs, and most real apps run BOTH:
Postgres as the durable system of record, Redis as the fast ephemeral/hot layer. Teach the mental model first,
give a real decision guide (reach for Postgres / reach for Redis / use both), and take positions:
don't add Redis before a measured hot path; Postgres can fake a queue (SKIP LOCKED) and fast scratch storage
(UNLOGGED tables) at small scale, so you may not need Redis on day one; once you're hammering the same rows or
need TTLs / atomic counters, Redis earns its place. Land Kloudbean late and light: both are one-click managed
engines in one account.

STRUCTURE (distinct from siblings; mysql-vs uses a decision TREE, redis-caching uses a read-path diagram):
lead -> .tldr -> "two different jobs" mental model -> UNIQUE two-lane SVG (durable vs ephemeral) -> at-a-glance
table.cmp -> what Postgres is for -> what Redis is for -> decision guide (3 H3s) -> "do you actually need Redis?"
(SKIP LOCKED + UNLOGGED, founder opinion) -> patterns (cache-aside, session store, rate limiting, queue Redis vs
Postgres) -> common mistakes -> Kloudbean tie-in (launch-database + env-vars screenshots) -> CTA -> FAQ (10) -> byline.

SVG: bespoke two-lane "system of record vs ephemeral layer" diagram (app feeds both; top lane Postgres durable/ACID/
survives restart, bottom lane Redis in-memory/volatile/TTL), footer teaching line "Lose Redis and the app gets slow.
Lose Postgres and you lose data." Brand navy #000f27 / purple #4F1AF3 / green #40b75f. Visually distinct from the
mysql-vs decision tree and the redis-caching read-path diagram.

BYLINE (UNIQUE, not "Faster Than Ever"): "By Kloudbean Engineering · Right Tool, Right Job." (closer: "Kloudbean · Right tool, right job.")

SCREENSHOTS: ../assets/console/launch-database.png (provision, captioned), ../assets/console/env-vars.png (DATABASE_URL + REDIS_URL).
IMAGE SLOTS (4): redis-cli data structures; redis-cli MONITOR on cache-aside; Redis maxmemory eviction; dashboard with both engines.

INTERNAL LINKS (7 live slugs, all folders confirmed to exist / resolve):
- https://www.kloudbean.com/blog/mysql-vs-postgresql/ (adjacent comparison)
- https://www.kloudbean.com/blog/redis-caching-patterns/ (cache-aside deep dive)
- https://www.kloudbean.com/blog/database-connection-pooling/ (connection reuse / private network)
- https://www.kloudbean.com/blog/add-managed-database-to-your-app/ (how-to, up-link)
- https://www.kloudbean.com/blog/managed-postgresql-hosting/ (money page)
- https://www.kloudbean.com/blog/managed-redis-hosting/ (money page)
- https://www.kloudbean.com/blog/managed-memcached-hosting/ (sibling cache engine, linked from the Kloudbean engines list)

HONESTY / FACTS (grounded in kloudbean-facts.md):
- 7 managed engines: PostgreSQL, MySQL, MariaDB, Redis, Memcached, Elasticsearch, MongoDB. Both Postgres and Redis
  are one-click, backed up, with IP allow-listing; run both in one account. Managed = provision/patch/backups,
  data stays yours + exportable. Linux stacks.
- Do NOT claim autoscaling for standard accounts (enterprise/custom only) — stated explicitly in the article.
- No invented benchmark numbers; latency hedged as "sub-millisecond in-memory vs disk-backed."

FRESHNESS: revisit if Redis licensing/naming or Postgres major version changes materially. Facts sourced from
kloudbean-facts.md changelog; no version numbers asserted.
