# ECONNREFUSED in Node.js: What It Means and How to Fix It

*By Kloudbean Engineering · The connection wasn't dropped. It was refused. That distinction is the fix.*

You run your app and it dies with something like `Error: connect ECONNREFUSED 127.0.0.1:5432`. Frustrating, but this is one of the most diagnosable errors in Node.js, because it tells you exactly what happened: your code tried to open a TCP connection to a host and port, and nothing there accepted it. Not a timeout, not DNS, a refusal. Once you read it that way, the fix is almost always one of a short list. Let's walk through what it means and how to clear it fast.

> **How do I fix ECONNREFUSED in Node.js?**
> ECONNREFUSED means nothing is listening at the host and port your app tried to reach, or a firewall blocked it. Check three things in order: is the target service (database, Redis, API) actually running; do the host and port in your config match where it's really listening; and in production, are you using the correct database hostname instead of `127.0.0.1`. Confirm with `pg_isready` or `redis-cli ping`, fix the address, and open the port if a firewall is in the way.

## What ECONNREFUSED actually means

ECONNREFUSED is an operating-system level signal, not a Node.js quirk. When your app opens a socket to, say, `127.0.0.1:5432`, the OS on the other side responds that no process is accepting connections on that port. The machine is reachable, it answered, but the door is shut. That's different from a timeout (nothing answered at all, often a wrong host or a firewall dropping packets silently) and different from `ENOTFOUND` (DNS couldn't resolve the hostname). Knowing you got a refusal, not a timeout, already narrows the problem to "the service isn't there, or it's not where I think it is."

## The usual causes, ranked

In practice, ECONNREFUSED comes from a handful of things, roughly in this order of likelihood:

1. **The service isn't running.** Postgres, Redis, MySQL, or the API you're calling simply isn't up. Most common in local dev after a reboot.
2. **Wrong host or port.** You're pointing at `5432` but the DB is on `5433`, or at `localhost` when the service lives elsewhere.
3. **The `127.0.0.1` trap in production.** Your code hardcodes localhost, but in a container or managed platform the database is a separate host with its own name. Covered below, because it's the sneaky one.
4. **Service bound to localhost only.** The service is running but listening on `127.0.0.1`, so nothing outside its own machine can reach it.
5. **Firewall or security group.** The port isn't open between your app and the service.
6. **Startup race.** The app booted and tried to connect before the database finished starting.

## Fix it step by step

Work the list from the top. First, confirm the target is actually accepting connections. These commands answer that directly:

```bash
# Is Postgres up and accepting connections?
pg_isready -h 127.0.0.1 -p 5432

# Is Redis responding?
redis-cli -h 127.0.0.1 -p 6379 ping    # expect: PONG

# What is actually listening on the port?
lsof -i :5432
# or on Linux
ss -tlnp | grep 5432
```

If nothing is listening, start the service (or fix why it crashed). If something is listening but on a different port than your app expects, line up the port. Next, check the address your app is using. Print the value you're actually connecting with, not the one you think you set:

```js
console.log("DB target:", process.env.DATABASE_URL || "using default localhost:5432");
```

Nine times out of ten the mismatch is right there. If the service is up and the address is correct but the connection is still refused, suspect a firewall or a bind-address problem, and confirm the service is listening on an interface your app can actually reach.

## The localhost trap in production

This deserves its own section because it catches so many people moving from laptop to production. On your machine, the app and the database share one host, so `127.0.0.1:5432` works. Deploy that same code to a container or a platform where the database is a separate managed service, and `127.0.0.1` now means "this container," where no database is running. Refused. The fix is to never hardcode the host. Read it from an environment variable and set it to the real database hostname in production:

```bash
# Local
DATABASE_URL=postgres://user:pass@127.0.0.1:5432/appdb

# Production (point at the actual DB host, not localhost)
DATABASE_URL=postgres://user:pass@db-internal-host:5432/appdb
```

If you've ever seen an app work perfectly in dev and throw ECONNREFUSED the moment it deploys, this is almost always why.

## Handle startup races with a retry

Sometimes everything is configured correctly and the app just started a beat before the database was ready. Rather than crashing on the first attempt, retry the connection with a short backoff:

```js
async function connectWithRetry(pool, retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.connect();
      return;
    } catch (err) {
      if (err.code !== "ECONNREFUSED" || attempt === retries) throw err;
      console.warn(`DB not ready (attempt ${attempt}), retrying...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
```

This turns a fatal boot error into a few seconds of patience. Just don't use retries to paper over a genuinely wrong host, you'll only delay the same failure.

| What you see | Most likely cause | Fix |
|---|---|---|
| ECONNREFUSED 127.0.0.1:5432 | Postgres not running or wrong host in prod | Start it, or use the real DB hostname |
| ECONNREFUSED 127.0.0.1:6379 | Redis not running | Start Redis, verify REDIS_URL |
| ECONNREFUSED on a remote host | Firewall or service bound to localhost | Open the port, bind to the right interface |
| Works in dev, refused in prod | Hardcoded 127.0.0.1 | Read host from an env var |

## How managed infrastructure sidesteps this

A lot of ECONNREFUSED pain is really "my app and my database can't find each other." That mostly disappears when they live together. On Kloudbean your Node app and its managed database run in the same dashboard, right next to each other, so the app reaches the database with a supplied connection string, locked down so only your app server's IP can connect, no exposing the database to the public internet and no guessing at hostnames. The database is managed, so "is it even running" stops being your problem. It doesn't make the error impossible (a typo in an env var is still a typo), but it removes the most common structural causes.

## Related reading

Connection issues and configuration go hand in hand. See [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/) to stop the localhost trap for good, [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/) for stable connections under load, and [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) for the database side. For neighboring errors, there's [EADDRINUSE: port already in use](https://www.kloudbean.com/blog/fix-eaddrinuse-port-already-in-use-node/), and to place your app overall, [where to deploy a Node.js app](https://www.kloudbean.com/blog/where-to-deploy-nodejs-app/).

## Keep your app and database right next to each other

Run your Node app and a managed database in one dashboard, side by side, connected with a supplied connection string and locked to your app server's IP, so the usual causes of ECONNREFUSED never come up. Deploy from GitHub on flat pricing from $8/mo. Start at [kloudbean.com](https://www.kloudbean.com/).

Managed database · Env vars per environment · GitHub deploys · Flat from $8/mo

## FAQ

**What does ECONNREFUSED mean in Node.js?**
It means your app opened a TCP connection to a host and port, and the other side actively refused it because nothing is listening there. It's not a timeout or a DNS failure. The machine answered and said "no service here," which points you straight at a stopped service or a wrong address.

**How do I fix ECONNREFUSED when connecting to Postgres?**
Confirm Postgres is running with `pg_isready -h host -p 5432`, then verify the host and port your app uses actually match. In production, make sure you're pointing at the real database hostname rather than `127.0.0.1`. If it's up and correct but still refused, check the firewall and the database's listen address.

**Why does my app get ECONNREFUSED only in production?**
Almost always because the code hardcodes `127.0.0.1`. Locally the app and database share a host, so localhost works; in production the database is a separate host, so localhost points at nothing. Read the connection host from an environment variable and set it to the correct database hostname per environment.

**Is ECONNREFUSED a firewall problem?**
It can be, but check the simpler causes first. A firewall or security group blocking the port will cause it, yet more often the service just isn't running or the address is wrong. Verify the service is up and the host and port match before you go digging in firewall rules.

**How do I handle ECONNREFUSED during startup?**
If the app sometimes boots before the database is ready, wrap the initial connection in a retry with a short backoff so it tries a few times before giving up. That fixes the race cleanly. Don't use retries to hide a genuinely wrong host, though, since it'll just fail slower.

**What's the difference between ECONNREFUSED and ETIMEDOUT?**
ECONNREFUSED means the target actively rejected the connection because nothing is listening, so it fails fast. ETIMEDOUT means nothing answered at all within the time limit, which usually points to a wrong host, a dropped-packet firewall, or a network path problem. The refusal is the easier of the two to chase down.

*Kloudbean Engineering · Read the error literally, and it tells you the fix.*
