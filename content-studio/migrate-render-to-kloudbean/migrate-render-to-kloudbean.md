# How to Migrate a Node.js App from Render to Kloudbean

*By Kloudbean Engineering · If your free database has an expiry date, that's your deadline.*

People leave Render for three fairly specific reasons: free services that spin down and cold-start on the first visitor, a free Postgres instance with an expiry clock on it, or a bill that grew as they added a worker and a paid database. If any of those is your situation, the move is straightforward, Render's model is close enough to a normal server that there's no rearchitecting involved. This is the runbook: what to inventory, how services map to processes, the database commands, and the cutover.

> **How do I migrate from Render to Kloudbean?**
> Inventory your Render services (web service, workers, cron jobs), your environment variables, and your database. Create the equivalents on Kloudbean: one always-on server running your app and workers under PM2, plus a managed PostgreSQL database. Copy env vars over, changing `DATABASE_URL` to the new instance. Dump and restore your data with `pg_dump` and `pg_restore`, verify on the temporary URL, then switch DNS. If you're on Render's free Postgres, do the dump now rather than near the expiry date.

## First, if you're on the free tier: check your deadline

Two Render free-tier behaviors are time-sensitive, so deal with them before anything else. Free web services spin down after roughly 15 minutes of inactivity and take about a minute to cold-start on the next request, per Render's docs. Annoying, but not urgent. The urgent one is the database: free PostgreSQL instances expire around 30 days after creation and are deleted after a grace period. If that's your setup, take a backup today, before you plan anything:

```bash
# Do this first if you're on free Postgres
pg_dump "postgres://user:pass@host.oregon-postgres.render.com/dbname" -Fc -f render.dump
```

Now you have a copy off the platform and the clock stops being scary. We covered that expiry in detail in [Render's free Postgres expiry](https://www.kloudbean.com/blog/render-free-database-expiry/), and the cold-start behavior in [Render cold starts](https://www.kloudbean.com/blog/render-cold-starts-fix/).

## Stage 1: inventory what you're running

Render splits an app into separate services, so list them all before you move:

- **Web services**: your Node app, its build command, start command, and instance type.
- **Background workers**: any separate worker services and what they consume.
- **Cron jobs**: scheduled tasks and their commands.
- **Environment variables**, per service. Note which are shared.
- **Databases**: Postgres, plus Redis or Key Value if you use it, and their regions.
- **Custom domains and SSL**, plus current DNS records and TTLs.
- **Disks** or persistent storage, if any, and what writes to them.

The value here is catching the things that aren't your main app. A worker or a cron job that nobody thinks about until it silently stops running is the classic post-migration bug.

## Stage 2: how Render concepts map to Kloudbean

Render gives you a service per process, each with its own instance and price. On Kloudbean you get a server that runs multiple processes under PM2, with managed data services alongside:

| On Render | On Kloudbean |
|---|---|
| Web service (paid, to avoid spin-down) | Node app always-on under PM2, no spin-down |
| Background worker service | A second PM2 process on the same server |
| Cron job service | Cron jobs from the dashboard |
| Render Postgres (free one expires) | Managed PostgreSQL, no expiry, automatic backups |
| Key Value / Redis | Managed Redis |
| Environment variables per service | Environment variables per app |
| Auto-deploy from Git | GitHub deploys with live build logs |

The build and start commands carry over almost unchanged, which is why this migration is one of the easier ones. Your `npm ci && npm run build` stays the same; the start command becomes a PM2 process:

```js
// ecosystem.config.js
module.exports = {
  apps: [
    { name: "web",    script: "dist/server.js" },
    { name: "worker", script: "dist/worker.js" },
  ],
};
```

## Stage 3: move the database

Create your managed PostgreSQL database, then dump from Render and restore. Grab Render's External Database URL from its dashboard page:

```bash
# Dump from Render
pg_dump "postgres://user:pass@host.oregon-postgres.render.com/dbname" -Fc -f render.dump

# Restore into the new managed database
pg_restore --no-owner -d "postgres://user:pass@new-host:5432/appdb" render.dump

# Verify: compare counts on your biggest tables
psql "postgres://user:pass@new-host:5432/appdb" -c "SELECT count(*) FROM users;"
```

Keep the app and database in the same region. A documented Heroku-to-Render migration had to move its database between regions because of where the new platform ran, which added unplanned latency work. Choosing matching regions up front avoids that entirely.

## Stage 4: environment variables

Copy each service's environment variables from the Render dashboard into your Kloudbean app, then change two things: point `DATABASE_URL` (and `REDIS_URL` if you have one) at the new managed instances, and drop anything Render-specific you no longer need. Do this before you deploy. A missing variable is the most common reason an app crashes on its first boot somewhere new, which is the whole subject of our [deploy crash field guide](https://www.kloudbean.com/blog/fix-node-app-crashing-on-deploy/).

## Stage 5: verify, then cut over

Deploy from GitHub and test on the temporary URL while Render still serves production. Then:

1. Lower your DNS TTL to 300 seconds a day ahead.
2. Exercise the app properly: log in, hit the endpoints that matter, trigger a job, confirm the worker consumes it, run a cron command by hand.
3. In a quiet window, take a final `pg_dump` from Render and restore, so writes during testing aren't lost.
4. Point DNS at Kloudbean and issue SSL for your domain.
5. Watch logs and errors for the first hour.
6. Leave the Render service up for a few days so rollback is just a DNS change.

Sequenced like this, real downtime is measured in seconds, not hours. One well-documented migration of a mature app reported roughly 90 seconds of hard downtime at final cutover, which is a reasonable expectation when you do the final dump inside a maintenance window.

## What changes for the better

The headline difference is that nothing sleeps. Your Node app runs always-on under PM2, so the first request of the morning is as fast as the hundredth, and there's no keep-warm cron to maintain. Your database has no expiry clock and takes automatic backups. The app, its worker, the database, and Redis all sit in one dashboard on one flat plan from $8/mo rather than a service-per-process bill, and there's no egress metering. Migration help is included if you'd rather we ran the steps above with you.

Fair credit: Render's Git-based deploys and clean service model are genuinely pleasant, and its free tier is a legitimate way to prototype something you don't mind sleeping. The reason to move is when the app stops being a prototype, at which point always-on and a database that doesn't expire are worth more than a free tier.

## Related reading

Context and companions: [Render vs Railway vs Kloudbean](https://www.kloudbean.com/blog/render-vs-railway-vs-kloudbean/) for the model comparison, [Render cold starts](https://www.kloudbean.com/blog/render-cold-starts-fix/) and [free Postgres expiry](https://www.kloudbean.com/blog/render-free-database-expiry/) for the two triggers, plus [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/), [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/), and [how to migrate hosting with zero downtime](https://www.kloudbean.com/blog/how-to-migrate-hosting-zero-downtime/).

## Move to a server that never sleeps

Run your Node app and worker always-on under PM2 with managed PostgreSQL that doesn't expire, all in one dashboard on a flat plan from $8/mo. Free migration assistance included. Start at [kloudbean.com](https://www.kloudbean.com/), see plans on [pricing](https://www.kloudbean.com/pricing/).

No spin-down · Managed Postgres with backups, no expiry · Free migration · GitHub deploys · Flat from $8/mo

## FAQ

**Why do people migrate off Render?**
Three common triggers: free web services spinning down and cold-starting on the first request, free PostgreSQL instances expiring after about 30 days and then being deleted, and a bill that grows once you add a paid instance, a worker, and a database. Teams also move to consolidate a service-per-process setup onto one plan.

**How do I export my database from Render?**
Copy the External Database URL from the database's page in the Render dashboard and run `pg_dump` with the `-Fc` flag to produce a compressed dump, then restore it with `pg_restore --no-owner`. If you're on a free instance, do this now rather than near the expiry date, since the database is deleted after its grace period.

**Do I need to change my code to migrate off Render?**
Usually not. Your build and start commands carry over, and the app should already read config from environment variables. The main changes are pointing `DATABASE_URL` at the new managed database and defining your processes in a PM2 ecosystem file instead of separate Render services.

**What happens to my Render workers and cron jobs?**
Worker services become extra PM2 processes on the same server, so you're not paying per service, and Render cron jobs become cron jobs you configure in the dashboard. Test both explicitly after deploying: a worker that isn't consuming or a cron that never fires is the classic thing missed during a migration.

**Will migrating stop the cold starts?**
Yes, if you move to an always-on process. Cold starts exist because a free service scales to zero; on Kloudbean the Node app runs continuously under PM2, so there's no spin-down and no keep-warm ping to maintain. The first request after an idle period is as fast as any other.

**How much downtime should I expect?**
Seconds to a couple of minutes if you sequence it well. Keep Render serving traffic while you deploy and test, lower your DNS TTL beforehand, then take a final database dump and switch DNS in a quiet window. A documented migration of a mature production app reported around 90 seconds of hard downtime at cutover.

*Kloudbean Engineering · Back up first, test on the temp URL, switch DNS last.*
