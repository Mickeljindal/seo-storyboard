# How to Migrate a Node.js App from Railway to Kloudbean

*By Kloudbean Engineering · Trading a meter you can't predict for a number you can.*

Most people who move off Railway aren't unhappy with the product, they're unhappy with not knowing what next month costs. Railway's developer experience is genuinely good and it's a great place to get something running fast. The friction shows up later, when a plan fee plus metered CPU, memory, database, and egress adds up in ways that are hard to forecast, and idle services still bill. If you've decided you want a flat number instead, here's the runbook for moving a Node app across without drama.

> **How do I migrate from Railway to Kloudbean?**
> Inventory every Railway service in your project (app, workers, databases, cron), your variables, and any volumes holding data. Create the equivalents on Kloudbean: one always-on server running your app and workers under PM2, plus managed PostgreSQL and Redis. Export variables with `railway variables`, dump your database with `pg_dump` using Railway's public connection URL, restore into the managed database, verify on the temporary URL, then cut DNS over in a quiet window and keep Railway up briefly for rollback.

## Why teams make this move

Worth being precise, because it shapes what you should check before migrating. Railway charges a plan fee plus metered usage across CPU, memory, databases, storage, and egress. Two things follow. First, a service that's up but idle still consumes resources and bills, so a forgotten staging environment or a test service quietly costs money. Second, developers frequently report that the combination of plan fee, included usage, and prepaid credit is hard to reason about, which is why "why is my Railway bill so high" is such a common question. It isn't overcharging, it's real metered usage that's genuinely difficult to forecast. We walked through the mechanics in [why is my Railway bill so high](https://www.kloudbean.com/blog/why-is-my-railway-bill-so-high/).

One more billing detail worth knowing before you migrate: if your app connects to its database over a public URL rather than the private network, that traffic can count as egress. Check that now, because it's often a chunk of an unexplained bill.

## Stage 1: inventory the project

Railway projects hold several services, and the data-bearing ones need care:

- **Every service**: the Node app, any worker services, and their start commands.
- **Databases**: Postgres, MySQL, Redis, Mongo, whichever you provisioned.
- **Volumes**: any persistent disk holding uploads or generated files. This is the one people forget, and it does not come across in a database dump.
- **Variables**, including references between services.
- **Cron jobs** and scheduled services.
- **Custom domains**, DNS records, and TTLs.
- **Environments** (production, staging, PR environments) so you know what to recreate and what to retire.

Note anything on a volume separately. Files on disk need their own copy step, and losing user uploads because you only migrated the database is a genuinely bad day.

## Stage 2: how Railway concepts map to Kloudbean

| On Railway | On Kloudbean |
|---|---|
| Node service (metered CPU + RAM) | Node app always-on under PM2, flat plan |
| Second service for a worker | A second PM2 process on the same server |
| Postgres / MySQL plugin | Managed PostgreSQL or MySQL, automatic backups |
| Redis plugin | Managed Redis |
| Volume for persistent files | Server disk, or S3-compatible object storage |
| Variables (per service) | Environment variables per app |
| Deploy on push | GitHub deploys with live build logs |
| Plan fee plus metered usage and egress | Flat from $8/mo, no egress metering |

Your processes go into a PM2 ecosystem file instead of being separate metered services:

```js
// ecosystem.config.js
module.exports = {
  apps: [
    { name: "web",    script: "dist/server.js" },
    { name: "worker", script: "dist/worker.js" },
  ],
};
```

## Stage 3: export variables and data

Pull your variables out with the Railway CLI so nothing is missed:

```bash
# List variables for the current service
railway variables

# Or, if you prefer piping into a file to review
railway variables --kv > railway-vars.txt
```

Then move the database. Railway exposes a connection URL for each database service; use it to dump, then restore into your new managed instance:

```bash
# Dump from Railway Postgres
pg_dump "postgres://user:pass@host.proxy.rlwy.net:PORT/railway" -Fc -f railway.dump

# Restore into the managed database
pg_restore --no-owner -d "postgres://user:pass@new-host:5432/appdb" railway.dump

# Verify a couple of tables
psql "postgres://user:pass@new-host:5432/appdb" -c "SELECT count(*) FROM users;"
```

For MySQL it's the same shape with `mysqldump` and `mysql`. If you have Redis data that matters (sessions, a job queue), decide deliberately whether to migrate it or drain the queue before cutover, most teams find it cleaner to let workers finish the queue on Railway, then start fresh.

## Stage 4: don't forget the volume

If a Railway volume holds user uploads or generated files, copy that content across before cutover. Two sensible destinations: the server's own disk if the volume is small and single-instance, or S3-compatible object storage if you'd rather your files not live on the same box as the app. Object storage is the better long-term answer, since it survives server changes and scales past one instance. Kloudbean includes S3-compatible buckets with full AWS SDK and CLI compatibility, so if you're already using the AWS SDK in your code, pointing it at a new endpoint and bucket is a config change rather than a rewrite. More in [S3-compatible object storage](https://www.kloudbean.com/blog/s3-compatible-object-storage/).

## Stage 5: verify and cut over

1. Lower your DNS TTL to 300 seconds a day ahead of the switch.
2. Deploy from GitHub, set your variables, and test on the temporary URL while Railway serves production.
3. Exercise everything: auth, the endpoints that matter, a background job end to end, a cron command by hand.
4. In a quiet window, drain your queue on Railway, then take the final `pg_dump` and restore.
5. Point DNS at Kloudbean and issue SSL.
6. Watch logs and error rates for the first hour.
7. Leave the Railway project running for a few days, then delete it so it stops billing. Rollback until then is a DNS change.

That last point matters on a metered platform specifically: an idle Railway service still bills, so once you're confident, actually tear the project down rather than leaving it parked.

## What you gain, and the honest tradeoff

The main thing you get is predictability. One flat plan from $8/mo covering the app, its worker, and the managed database and Redis in a single dashboard, with no egress metering, so a traffic spike or a chatty database connection doesn't rewrite your invoice. The app runs always-on under PM2, which suits background workers, WebSockets, and long-running jobs. And migration assistance is included if you'd like us to run the inventory and cutover with you.

The honest tradeoff: Railway's instant-provisioning developer experience is excellent, and for a prototype where you genuinely want spiky usage-based pricing and don't care about forecasting, metered billing is a defensible choice. Flat pricing wins when the app is real and you'd rather know the number. Pick based on which of those you are, not on which platform markets harder.

## Related reading

Useful next reads: [why is my Railway bill so high](https://www.kloudbean.com/blog/why-is-my-railway-bill-so-high/) for the billing mechanics, [Render vs Railway vs Kloudbean](https://www.kloudbean.com/blog/render-vs-railway-vs-kloudbean/) for the model comparison, and [a Railway alternative](https://www.kloudbean.com/blog/railway-alternative-for-vibe-coded-apps/) for the platform view. On the mechanics: [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/), [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/), [background jobs with BullMQ](https://www.kloudbean.com/blog/nodejs-background-jobs-bullmq/), and [migrating with zero downtime](https://www.kloudbean.com/blog/how-to-migrate-hosting-zero-downtime/).

## Swap the meter for a flat number

Run your Node app, worker, managed database, and Redis in one dashboard on a flat plan from $8/mo with no egress metering, deployed from GitHub. Free migration assistance included. Start at [kloudbean.com](https://www.kloudbean.com/), see plans on [pricing](https://www.kloudbean.com/pricing/).

Flat from $8/mo · No egress metering · Managed Postgres and Redis · Always-on under PM2 · Free migration

## FAQ

**Why do developers migrate off Railway?**
Mostly for cost predictability. Railway charges a plan fee plus metered CPU, memory, database, storage, and egress usage, idle services still bill, and the interaction of plan fee, included usage, and credits is hard to forecast. It's real metered usage rather than overcharging, but teams often prefer a flat number once an app is in production.

**How do I export my Railway database?**
Use the connection URL Railway provides for the database service and run `pg_dump` with the custom-format flag, then restore into your new managed database with `pg_restore --no-owner`. For MySQL use `mysqldump` and `mysql`. Verify by comparing row counts on a few important tables before you cut over.

**How do I get my environment variables out of Railway?**
Use the Railway CLI's `railway variables` command to list them for a service, and repeat per service since variables are scoped that way. Then set them on your new app, changing the database and Redis URLs to the new managed instances. Verify nothing is missing before deploying, since an unset variable is the usual cause of a first-boot crash.

**What about my Railway volume and uploaded files?**
Volumes aren't included in a database dump, so copy that content separately. Either move it to the server's disk if it's small, or better, to S3-compatible object storage so files survive server changes and can be shared across instances. If your code already uses the AWS SDK, that's a config change rather than a rewrite.

**Will my Node app need code changes?**
Rarely. If your app reads its config from environment variables, the main change is pointing `DATABASE_URL` and `REDIS_URL` at the new managed instances. Processes that were separate Railway services become entries in a PM2 ecosystem file. The build and start commands generally carry over unchanged.

**Should I delete my Railway project after migrating?**
Yes, once you've verified the new setup and no longer need rollback. On a metered platform an idle service still consumes resources and bills, so leaving the old project parked keeps costing you. Keep it for a few days as a rollback path, take a final database dump, then tear it down deliberately.

*Kloudbean Engineering · Inventory the volumes, drain the queue, then switch DNS.*
