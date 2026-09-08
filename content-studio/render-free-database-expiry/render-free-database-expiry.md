# Render's Free Postgres Expires in 30 Days: How to Not Lose Your Data

*By Kloudbean Engineering · A database with an expiry date is a deadline, so treat it like one.*

If you spun up a free PostgreSQL database on Render, there's a clock on it that's easy to miss. Render's free Postgres instances are time-limited: they expire around 30 days after creation, and once a grace period runs out, the database and its data are removed. That surprises people who treated it as a permanent home. The good news is this is completely avoidable. Back your data up today, move it to a persistent managed database, and the deadline stops mattering. Here's exactly how.

> **Does Render's free database get deleted?**
> Yes. Per Render's docs, free PostgreSQL instances expire roughly 30 days after they're created; you get warnings and a short grace period, and if you don't upgrade or migrate, the database is deleted along with its data. The fix: run `pg_dump` now to get a backup, then restore into a persistent managed database that doesn't expire. Don't wait for the last warning email.

## Why your Render database expires

This is documented behavior, not a glitch. Render offers free PostgreSQL so you can prototype without paying, and to keep that sustainable the free instances are time-limited rather than permanent. Per Render's docs, a free database expires about 30 days after creation. Render sends warnings as the date approaches and gives a grace period to act; if you don't upgrade to a paid instance or move the data out, the database is deleted.

For a weekend experiment, fair enough. The pain lands when a free database has quietly become the backing store for something real, a side project with actual users, a client demo, an internal tool, and the expiry arrives before anyone notices. At that point it's not a slow request like a cold start, it's data that's gone. So the mindset shift is simple: a free trial database is temporary storage. Anything you'd be upset to lose needs a permanent home.

## How to tell when yours expires

Check the database's page in the Render dashboard, which shows its status and expiry, and watch the email tied to your account for expiry warnings. If you honestly don't remember when you created it, assume the deadline is sooner than you'd like and back up today. There's no downside to holding a fresh dump, and every downside to needing one you don't have.

## Back up your data right now

Before anything else, get a copy off the platform. Grab the external connection string from the Render dashboard (the "External Database URL"), then run `pg_dump` from your machine. The custom format (`-Fc`) is compact and restores cleanly:

```bash
# Take a backup from Render (custom format, compressed)
pg_dump "postgres://user:pass@host.oregon-postgres.render.com/dbname" -Fc -f render_backup.dump

# Or a plain SQL file if you prefer something readable
pg_dump "postgres://user:pass@host.oregon-postgres.render.com/dbname" -f render_backup.sql
```

That file is your safety net. Store it somewhere durable, not just your Downloads folder. If the only copy of your data currently lives on a database with an expiry date, you don't really have a backup yet, you have a countdown.

## Where to move it: a persistent managed database

The real fix isn't a bigger free tier, it's a database that doesn't expire and backs itself up. On Kloudbean you launch a managed PostgreSQL database in a few clicks, with automatic backups, and it sits in the same dashboard as the Node app that uses it. No 30-day clock, no deletion email. You keep it as long as you keep the plan, on flat pricing from $8/mo. Restoring your dump into it is one command:

```bash
# Restore the custom-format dump into your new managed database
pg_restore --no-owner -d "postgres://user:pass@new-host/dbname" render_backup.dump

# Or, if you took a plain SQL dump
psql "postgres://user:pass@new-host/dbname" < render_backup.sql
```

Then point your app at the new database by updating the `DATABASE_URL` environment variable and redeploy. That's the whole migration for most apps.

| | Render free Postgres | Persistent managed Postgres (Kloudbean) |
|---|---|---|
| Lifespan | Expires ~30 days after creation | Runs as long as you keep the plan |
| Deletion risk | Deleted after grace period | None from an expiry clock |
| Backups | Your responsibility before expiry | Automatic backups included |
| Lives with your app? | Separate | Same dashboard as the Node app |
| Cost shape | Free, time-limited | Flat from $8/mo |

## Migrating without downtime

You don't have to take the app offline to move databases. The safe order:

1. Create the new managed PostgreSQL database and copy its connection string.
2. Run `pg_dump` from Render, then `pg_restore` (or `psql`) into the new database.
3. Verify row counts and a few key tables match on both sides.
4. Update `DATABASE_URL` to the new database and redeploy the app.
5. Once traffic is happily on the new database, let the old Render one expire.

If your data changes constantly, do the final dump during a quiet window so you don't miss writes made between the dump and the switch. For most small apps the whole thing takes minutes, not a maintenance weekend.

## Should you just upgrade the Render database instead?

Fair question, and sometimes the answer is yes. Upgrading to a paid Render instance removes the expiry, so if your app already lives happily on Render and you just want the clock gone, that's a legitimate move. Weigh two things before you do. First, a paid managed database is a real monthly cost either way, so you're now comparing hosts, not free-versus-paid. Second, think about where the rest of your stack lives: if your app, database, storage, and backups are scattered across separate dashboards and bills, a single place to run all of it is worth something. That's the case for consolidating on Kloudbean, where the app and its database sit together on one flat plan, rather than upgrading a database in isolation.

## Neighbouring decisions

Moving off a trial database is a good moment to get the fundamentals right. See [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) for what "managed" should include, keep secrets clean with [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/), and if you're moving the app too, [deploy a Node app to a managed cloud](https://www.kloudbean.com/blog/deploy-node-app-to-managed-cloud/) walks the full path. Weighing platforms overall? [Render vs Railway vs Kloudbean](https://www.kloudbean.com/blog/render-vs-railway-vs-kloudbean/) and [where to deploy a Node.js app](https://www.kloudbean.com/blog/where-to-deploy-nodejs-app/) lay out the tradeoffs.

<!-- cta:start -->
**Managed, backed up, and still yours.**

Seven managed engines, provisioned and patched for you, with access controlled and backups running automatically. Your schema, your queries, and your data stay exportable with the standard tools.

- Seven managed engines
- One-click launch
- Automatic backups
- Controlled access
- Standard connection strings
- Free migration assistance

[Start free](https://console.kloudbean.com/register) · [See plans](https://www.kloudbean.com/pricing/)
<!-- cta:end -->

## FAQ

**How long does a free Render Postgres database last?**
Per Render's docs, a free PostgreSQL instance expires about 30 days after it's created. Render warns you as the date nears and gives a grace period, but if you don't upgrade or migrate, the database is removed. Treat the free database as temporary storage from day one.

**Why did Render delete my database?**
Free Render databases are time-limited by design. Once the roughly 30-day lifespan and the grace period pass without an upgrade or migration, the instance is deleted along with its data. It's documented behavior rather than an error, which is exactly why an early backup matters.

**Can I recover a deleted Render database?**
Once a free database is deleted and you don't have your own backup, recovery is unlikely. That's the whole reason to run `pg_dump` well before the expiry date. If you still have access, take a dump immediately, before the grace period ends.

**How do I back up a Render Postgres database?**
Copy the external connection string from the Render dashboard and run `pg_dump "your-connection-url" -Fc -f backup.dump` from your machine. That produces a compressed dump you can restore anywhere with `pg_restore`. Store it somewhere durable, not only on your laptop.

**Where can I host Postgres that doesn't expire?**
Any persistent managed PostgreSQL service. On Kloudbean you launch a managed Postgres database with automatic backups that runs as long as you keep the plan, in the same dashboard as your app, on flat pricing from $8/mo. There's no expiry clock and no deletion email.

**How do I move my data from Render to another host?**
Dump from Render with `pg_dump`, create the new managed database, restore with `pg_restore` or `psql`, verify the row counts match, then update your app's `DATABASE_URL` and redeploy. For most small apps it takes minutes, and Kloudbean will help you do the move for free.

*Kloudbean Engineering · Back up before the deadline, not after.*
