# Redis vs Postgres: When to Use Each, and When You Need Both

*By Kloudbean Engineering · Right Tool, Right Job.*

You're building on Express, Django, Laravel, or whatever your AI tool handed you, and someone on a forum told you to add Redis. So now you're stuck on **Redis vs Postgres**, trying to work out whether you need both, or one, or which does what. Good news. They aren't rivals. Postgres is the durable database that holds your real data. Redis is a fast in-memory store that sits beside it for the throwaway stuff.

This is the decision made the way engineers actually make it. Not "which is better," but "which job is this."

> **Short answer:** **Redis vs Postgres** is the wrong framing for most apps. Postgres is your durable source of truth: ACID, joins, the data you can't afford to lose. Redis is a fast in-memory layer for caching, sessions, rate limits, and queues. Small apps often need only Postgres on day one. Reach for Redis once you've measured a hot path, or you need TTLs, atomic counters, or a shared session store. Plenty of production stacks run both, and that's normal.

## Redis vs Postgres: two different jobs, not a contest

Here's the mental model that makes the rest obvious. Postgres writes to disk and guarantees your data survives a crash, a restart, a power cut. Redis keeps everything in RAM so it answers in a fraction of the time, and treats most of that data as disposable.

One keeps the truth. The other keeps things fast. Every question about your data lands in one lane. Is this the only copy of something a user would hate to lose? Postgres. A cheap-to-rebuild accelerator, a counter, a short-lived token? Redis.

The classic slip is treating Redis like a smaller, faster Postgres. It isn't. Once you see two jobs, "do I need Redis" stops being a versus question and becomes "do I have a job that fits Redis yet."

<!-- ADD IMAGE: a two-lane diagram, Postgres as durable system of record on top, Redis as ephemeral hot layer below, with the app feeding both -->

*Same request, two stores. Postgres keeps the truth on disk. Redis keeps the hot bits fast in memory. Lose Redis and the app gets slow. Lose Postgres and you lose data.*

## Redis vs Postgres at a glance

Before the code, the whole comparison on one screen.

| Dimension | Redis | PostgreSQL |
| --- | --- | --- |
| **Data model** | Key/value plus data structures (strings, hashes, lists, sets, sorted sets, streams) | Relational tables and rows, rich types (JSONB, arrays), foreign keys |
| **Where data lives** | In memory (RAM) | On disk, cached in RAM |
| **Durability** | Volatile by default; optional persistence via RDB snapshots or the AOF log | Durable and ACID, backed by a write-ahead log |
| **Query power** | Fast structure ops, no joins, no ad-hoc SQL | Full SQL: joins, aggregates, transactions, window functions |
| **Latency profile** | Sub-millisecond in-memory reads | Disk-backed, quick with the right indexes, more work per query |
| **Typical role** | Cache, sessions, rate limits, queues, leaderboards, pub/sub | Source of truth, relationships, reporting, anything you can't lose |
| **Survives a restart** | Only if persistence is on, and a small recent window can still be lost | Yes, that's the entire point |

## What Postgres is built for

Postgres is a relational database, and the one I'd put at the center of almost any app. It writes every committed change to a write-ahead log before acknowledging it, so a crash mid-write can't corrupt your data. That property, durability, is the whole reason a system of record exists.

On top of durability, Postgres models real relationships and answers hard questions:

- **ACID transactions.** Wrap several writes in one transaction and they all land or none do. An order and its line items commit together, or roll back together.
- **Joins and constraints.** Foreign keys, unique, and check constraints let the database enforce your rules, so bad data can't sneak in through a buggy code path.
- **Real query power.** Aggregations, window functions, and CTEs, with a planner that turns a hard question into an efficient plan. Reporting and analytics live here.
- **Rich types.** JSONB, arrays, ranges, and extensions like PostGIS and pgvector for when you grow into geo or AI search.

Choosing between the relational engines themselves is a separate call, covered in [MySQL vs PostgreSQL](https://www.kloudbean.com/blog/mysql-vs-postgresql/). Treat Postgres here as the stand-in for "your durable relational database." The Redis story is the same whether the truth lives in Postgres or MySQL.

## What Redis is built for

Redis keeps its whole dataset in memory, which is why it answers in well under a millisecond. And it isn't just a key/value bin. It ships real data structures, which make it feel like a Swiss Army knife once you know them. A few jobs it's genuinely great at:

- **Caching.** Put Redis in front of an expensive Postgres query and serve the repeat reads from memory. The number one reason teams add it.
- **Sessions.** A shared store so users stay logged in across more than one app server. A **session store in Redis** is close to mandatory the day you run a second instance.
- **Rate limiting.** Atomic counters with a TTL make per-user or per-IP limits trivial. Postgres can do it, just not this cheaply.
- **Queues and jobs.** Lists and streams give you a fast work queue for background jobs like email or processing an upload.
- **Leaderboards and counters.** Sorted sets rank things in real time. Live view counts, "top 10 today," presence.
- **Pub/sub.** Lightweight fan-out messaging between parts of your system.

The thread through all of these: the data is either a copy of something durable (a cache) or cheap to lose (a counter, a session, a retryable job). When it doesn't fit that shape, Redis is a loaded gun pointed at your data.

<!-- ADD IMAGE: a redis-cli session running INCR, ZADD, then GET, so the reader sees the data structures are real -->

## When to use Redis vs PostgreSQL: a decision guide

The part you came for. Three buckets: reach for Postgres, reach for Redis, or use both. Most apps end up in the third, but you get there by understanding the first two.

### Reach for Postgres when

Default here. If the data has to survive, has relationships, or you'll query it in ways you can't fully predict, it belongs in Postgres. Orders, users, invoices, posts, anything a person created and would miss. Anything you'll report on later, too, because SQL is built for exactly that. Not sure where a piece of data goes? It goes in Postgres.

### Reach for Redis when

Add Redis when you have a specific, measured problem it solves. You're reading the same rows thousands of times and the database is feeling it. You need atomic counters for rate limits, a shared session store across servers, or a fast queue for background work. These are jobs, not "I heard Redis is fast." The trigger is a real symptom.

### Use both when (the common case)

Here's where most production apps land, and it's the honest recommendation. Postgres is the source of truth, Redis a thin fast layer in front of the hot paths. A read checks Redis, and on a miss falls through to Postgres and caches the result. Writes go to Postgres, then drop the matching Redis key so the next read refreshes it. The two aren't fighting. Redis does the reps Postgres shouldn't have to.

> **Founder's take.** Don't add Redis on day one out of habit. I've watched too many small apps carry a Redis instance that caches nothing hot and just adds a moving part to break. Ship on Postgres, watch your slow query log, and add Redis the moment a real hot path shows up. Doing it later is a config change and a few lines of code, not a rewrite.

## Do you actually need Redis? Postgres can fake it at small scale

Something people rarely say out loud: for a while, Postgres can do several of Redis's jobs well enough that you don't need a second system yet. Fewer moving parts is a feature. Two tricks worth knowing.

**Postgres as a simple job queue.** You don't need Redis or a broker for background jobs at low volume. Postgres has `SELECT ... FOR UPDATE SKIP LOCKED`, which lets many workers pull jobs off a table without colliding. One grabs a row, the others skip the locked ones:

```sql
-- One worker claims a job, others skip the locked row and move on
DELETE FROM job_queue
WHERE id = (
  SELECT id FROM job_queue
  ORDER BY id
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING payload;
```

That's a real, production-grade queue for thousands of jobs a day. It only strains at high throughput or when you want blocking pops and fan-out, which is exactly when Redis or a proper broker earns its place.

**Postgres as fast ephemeral storage.** Need a scratch table written to constantly that doesn't need to survive a crash? An **UNLOGGED table** skips the write-ahead log, so writes are noticeably faster. The catch is in the name: not crash-safe, and truncated on crash recovery. Perfect for throwaway data, wrong for anything you'd miss.

```sql
-- Faster writes because it skips the WAL; NOT crash-safe
CREATE UNLOGGED TABLE cache_kv (
  k text PRIMARY KEY,
  v jsonb NOT NULL,
  expires_at timestamptz
);
```

So, do you need Redis? Not always, and not always yet. But the moment you're hammering the same rows, need real TTLs, or want sub-millisecond atomic counters, stop bending Postgres into a cache.

## The patterns you'll actually reach for

When you do run both, four patterns cover almost everything.

### Cache-aside: Redis in front of a Postgres read

The workhorse. Check Redis first, and on a miss read Postgres, then store the result with a TTL so the next request is a fast hit. Keep the connection in an environment variable, never in code.

```js
import Redis from "ioredis";
import { pool } from "./db.js";              // node-postgres
const redis = new Redis(process.env.REDIS_URL);

async function getProduct(id) {
  const key = `product:${id}`;
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);           // Redis answered

  const { rows } = await pool.query(
    "SELECT * FROM products WHERE id = $1", [id]);   // Postgres is the truth
  await redis.set(key, JSON.stringify(rows[0]), "EX", 120);  // cache 2 min
  return rows[0];
}
```

When the product changes, write Postgres first, then delete the key so the next read repopulates it. There's real depth here (TTL choices, invalidation, cache stampede), all covered in [Redis caching patterns](https://www.kloudbean.com/blog/redis-caching-patterns/).

<!-- ADD IMAGE: a terminal running redis-cli MONITOR while the app serves traffic, showing GET on a hit and SET on a miss -->

### Session store: one shared login state

By default many frameworks keep sessions on one server's disk or memory. That breaks the moment you run a second instance: a user's session lives on a machine they might not hit next. Point sessions at Redis and every server shares one fast store. Usually a one-line change:

```bash
# Laravel .env
SESSION_DRIVER=redis

# Django settings.py
SESSION_ENGINE = "django.contrib.sessions.backends.cache"

# Express: connect-redis wired into express-session
```

Sessions fit Redis perfectly. They're short-lived (a TTL is literally a session timeout), and losing one just means logging in again.

### Rate limiting: atomic counters with a TTL

Here's where Redis quietly wins over Postgres. A counter that increments atomically and expires on its own is a couple of commands. `INCR` bumps the count, `EXPIRE` starts the clock on the first hit:

```python
import time, redis
r = redis.from_url(os.environ["REDIS_URL"])

# Fixed window: 100 requests per IP per minute
def allow(ip):
    key = f"rl:{ip}:{int(time.time() // 60)}"
    count = r.incr(key)
    if count == 1:
        r.expire(key, 60)         # start the 60s clock on first request
    return count <= 100
```

Doing this in Postgres means a row per counter, an update per request, and a cleanup job for expired rows. It works, but you're paying disk writes for something Redis does in memory and forgets on its own.

### A job queue: Redis vs Postgres, side by side

You saw the Postgres version above with `SKIP LOCKED`. The Redis version uses a list and a worker that blocks until a job arrives, no polling:

```python
# Producer pushes a job
r.lpush("jobs:email", json.dumps(payload))

# Worker blocks on BRPOP until there's something to do
_, raw = r.brpop("jobs:email")
job = json.loads(raw)
send_email(job)
```

Redis gives you instant blocking pops and scales to high throughput. Postgres gives you durability and transactions for free, since the job lives in the same database as everything else. Low-volume queue? Postgres is often simpler. High-volume? Redis or a real broker earns the extra moving part. That's the **queue: Redis vs Postgres** call in one line.

## Common mistakes with Redis and Postgres

These come up constantly, and every one is avoidable once you've named it.

- **Using Redis as the system of record.** The big one. Someone stores the only copy of real data in Redis because it's fast, then a restart or eviction wipes it. Persistence (RDB, AOF) reduces the risk but doesn't make it a database. If you'd cry when it's lost, it lives in Postgres.
- **Caching without a TTL.** A key with no expiry can be stale forever. Always set a TTL, even when you also delete on write. It's your backstop for the invalidation you forgot to wire up.
- **Cache invalidation traps.** Update Postgres but forget to drop the Redis key, and reads serve the old value until the TTL saves you. Write the database first, then delete the key. Don't overwrite the cached value in place, it invites races.
- **Double source-of-truth drift.** Writing "the truth" to both stores and letting them disagree. Pick one source of truth (Postgres) and treat Redis as a derived copy you can always rebuild.
- **Adding Redis with nothing hot to cache.** A cache that never gets a hit is just latency and one more thing to monitor. Measure first, then cache the path that's actually slow.

The unifying rule fits in one sentence. If Redis disappeared this second, your app should get slow, not lose data. If that isn't true, something durable is in the wrong lane.

<!-- ADD IMAGE: a Redis memory graph reaching maxmemory and evicting keys, so the volatility point is visible -->

## Running Postgres and Redis together on Kloudbean

The patterns above run anywhere. What changes is how much babysitting is yours. On Kloudbean, PostgreSQL and Redis are both managed engines, two of the seven on offer (alongside MySQL, MariaDB, [Memcached](https://www.kloudbean.com/blog/managed-memcached-hosting/), Elasticsearch, and MongoDB). Launch each from the same place, and the platform patches and backs them up while you use them.

![The Kloudbean console launching a managed database, with PostgreSQL, Redis, MySQL, MariaDB, and more as one-click choices](../assets/console/launch-database.png)

Because each is a one-click launch, running both is just two launches in one account, right next to your app. Your app reaches Postgres and Redis by their connection strings, each locked to your app server's IP so nothing else can connect, which erases a class of connection and firewall headaches and keeps connection reuse cheap (the same reason an always-on server makes [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/) simpler than serverless).

You wire both the same way: one connection value each, read from the environment, so rotating a password is a config change, not a code change.

![The Kloudbean console environment variables screen holding DATABASE_URL and REDIS_URL for the app to read](../assets/console/env-vars.png)

```bash
# Both connections as environment variables, in the same account
DATABASE_URL=postgresql://appuser:secret@10.0.0.5:5432/appdb
REDIS_URL=redis://:secret@10.0.0.6:6379/0
```

<!-- ADD IMAGE: the dashboard with a managed Postgres and a managed Redis in the same account, to show both engines living together -->

Managed means the platform provisions, patches, and backs up the engine, locked to your app server's IP, while your schema and data stay yours to export anytime. Both run on Linux. Setting up the durable side first? [Adding a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/) walks the full flow, and adding Redis after is the same pattern with one more env var. For engine details, see [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) and [managed Redis hosting](https://www.kloudbean.com/blog/managed-redis-hosting/). One honest note: Kloudbean doesn't autoscale a standard app. Autoscaling and Kubernetes are enterprise and custom setups, not a toggle on a normal account.

---

**Run the truth and the fast layer side by side.** Launch managed PostgreSQL for your source of truth and managed Redis for the hot paths, both one click, both locked to your app server's IP, both backed up. Start free at [kloudbean.com](https://www.kloudbean.com/); see plans on [pricing](https://www.kloudbean.com/pricing/).

One-click Postgres and Redis · Automatic backups · Free migration · Free trial · Simple Git deploy

## FAQ

**Do I need Redis if I have Postgres?**
Not always, and rarely on day one. Postgres alone handles most small and mid-size apps and can even fake a simple queue or cache at low scale. Add Redis once you hit a measured hot path, need atomic counters, or want a shared session store.

**Can Postgres be used as a cache?**
Yes, at small scale. An UNLOGGED table makes cache-in-a-table writes faster by skipping the write-ahead log. Once you're hammering the same data thousands of times, reach for an in-memory store like Redis.

**Is Redis persistent, or does it lose data on restart?**
Redis is in memory and volatile by default, but offers persistence through RDB snapshots and the AOF log. Even with it on, a crash can lose the most recent writes. Treat it as a recovery safety net, not your only copy of the data.

**Redis vs Postgres for sessions: which should I use?**
Use Redis once you run more than one app server, so a user stays logged in whatever instance they hit. Sessions fit Redis naturally: short-lived and cheap to lose. On a single server, the default store is fine.

**Which is faster, Redis or Postgres, and why?**
Redis is faster for simple key lookups because it answers from memory in well under a millisecond, while Postgres reads from disk and does more work per query. But that only matters for the repetitive reads a cache absorbs. For complex queries and anything you can't lose, Postgres wins.

**Can I use Redis and Postgres together?**
Yes, and it's the common production setup. Postgres is the durable source of truth; Redis sits in front of the hot paths for caching, sessions, counters, and queues. Reads check Redis first and fall through to Postgres on a miss.

**When should I add Redis to my app?**
When you can name the problem it solves: a slow endpoint reading the same rows repeatedly, per-user rate limits, a shared session store, or a fast background queue. Adding Redis with no hot path just adds a moving part with nothing to do.

**Is Redis a database or just a cache?**
It's a real in-memory data store, so more than a cache, but treat it as a fast helper, not a system of record. It's great for caching, sessions, rate limits, queues, and leaderboards. Durable data belongs in Postgres.

**Can Postgres handle a job queue without Redis?**
Yes. Postgres supports SELECT FOR UPDATE SKIP LOCKED, letting multiple workers pull jobs off a table without colliding, with durability for free. That handles low to moderate volume. Move to Redis or a broker for blocking pops, fan-out, or high throughput.

**Redis vs Memcached: which cache should I pick?**
Both are fast in-memory caches. Memcached is simpler and does plain key/value well, while Redis adds data structures, optional persistence, and pub/sub, which is why most teams pick it. Kloudbean offers both as managed engines, so choose per project.

---

*Kloudbean · Right tool, right job.*
