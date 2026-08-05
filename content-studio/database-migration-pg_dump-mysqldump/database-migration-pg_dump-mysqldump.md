---
title: "Database Migration with pg_dump and mysqldump: A Field Guide"
description: "A practical database migration guide: move a PostgreSQL or MySQL database with pg_dump and mysqldump, plus the charset, owner, and cutover gotchas that quietly bite."
slug: database-migration-pg_dump-mysqldump
canonical: https://www.kloudbean.com/blog/database-migration-pg_dump-mysqldump/
eyebrow: Databases & storage
byline: By Kloudbean · Moving Data Without Downtime.
---

# Database Migration with pg_dump and mysqldump: A Field Guide

![Database migration with pg_dump and mysqldump: moving a PostgreSQL or MySQL database onto managed hosting](images/hero.png)

A database migration sounds scary until you've done a few. You're moving a PostgreSQL or MySQL database from one home to another. Off a platform you're outgrowing, away from a pricey managed service, onto hosting you actually control.

The tools haven't changed in years. `pg_dump` and `mysqldump` still do the heavy lifting, and they're rock solid. What trips people up isn't the dump. It's the charset that arrives scrambled, the owner role that doesn't exist on the new server, the app that swears the database is down when it's really pointed at the old host. This is the field guide: the exact commands to migrate a PostgreSQL database and a MySQL database, the gotchas nobody writes down, and how to cut over without losing a write.

> **The short version**
>
> Export with `pg_dump` (Postgres) or `mysqldump` (MySQL), copy the dump to the new server, restore with `pg_restore`/`psql` or the `mysql` client, verify row counts, then flip your app's connection string. A plain dump and restore means a short write-freeze window, not true zero downtime. Test the whole run in staging first, and keep the old database read-only for a day as your rollback.

## The shape of every database migration

Strip away the specifics and every database migration is the same six moves. Take a consistent copy of the source. Move that copy to where it's going. Load it. Check it landed intact. Point the app at the new database. Keep a way back if something's wrong.

Draw it once and the rest of this guide just fills in the flags:

<!-- Bespoke inline SVG in the HTML: migration pipeline. Old database -> Dump -> Transfer -> Restore -> Verify -> Cutover, in a snaking 2-row layout with numbered badges and a dashed green rollback loop (old DB stays read-only). Caption below. -->

_Old database, dump, transfer, restore, verify, cutover. Writes are frozen from the final dump through verify. The old database stays read-only afterwards so you can roll back._

Standing up a brand-new database instead of moving one? The companion guide on [adding a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/) covers that. This one assumes you already have data and want it somewhere else.

## One check before you start: tool versions

Version skew is the quietest cause of a failed restore. For Postgres, run `pg_dump` and `pg_restore` from a client at least as new as the destination server. `pg_dump` reads older servers fine; the failure is the reverse, an old `pg_dump` against a newer one. For MySQL, dump with a `mysqldump` that matches your target, and remember MariaDB and MySQL are close cousins, not identical, so a dump from one can need a tweak to load into the other.

## Migrate a PostgreSQL database with pg_dump

Two formats are worth knowing, and they solve different problems.

**Plain SQL** is human-readable and dead simple: a text file of `CREATE TABLE` and `INSERT` that you load with `psql`. Great for small databases, or when you want to grep the dump.

```
# dump to a plain .sql file
pg_dump "postgresql://user:pass@old-host:5432/appdb" > appdb.sql

# restore by piping the file into psql on the new server
psql "postgresql://user:pass@new-host:5432/appdb" < appdb.sql
```

**Custom format** (`-Fc`) is the one I reach for on anything real. It's compressed, restores in parallel, and restores selectively (one table, schema only, whatever). You load it with `pg_restore`, not `psql`.

```
# dump in compressed custom format
pg_dump -Fc "postgresql://user:pass@old-host:5432/appdb" -f appdb.dump

# restore with pg_restore (-j runs 4 parallel jobs)
pg_restore -j 4 -d "postgresql://user:pass@new-host:5432/appdb" appdb.dump
```

### The owner and privileges flags you'll almost always want

Here's the classic. Your source has tables owned by a role called `appuser`. The new server has never heard of `appuser`. So the restore throws:

```
pg_restore: error: could not execute query: ERROR:  role "appuser" does not exist
```

Two flags make that go away. `--no-owner` skips the `ALTER ... OWNER TO` lines, so objects end up owned by whoever runs the restore. `--no-privileges` skips the `GRANT`/`REVOKE` lines. On a fresh database where your app connects as one user, that's exactly what you want:

```
pg_dump -Fc --no-owner --no-privileges "$OLD_DATABASE_URL" -f appdb.dump
pg_restore --no-owner --no-privileges -j 4 -d "$NEW_DATABASE_URL" appdb.dump
```

### Reloading into a database that isn't empty

Restoring on top of existing objects? `--clean --if-exists` drops each object before recreating it, and the guard stops it erroring on things that aren't there yet. Handy for a repeatable dry run. The tradeoff is real: `--clean` is destructive, so never aim it at data you care about.

```
pg_restore --clean --if-exists --no-owner -d "$NEW_DATABASE_URL" appdb.dump
```

You can also split the job. `-s` dumps schema only, `-a` dumps data only. Loading schema first, then data, gives you a clean point to fix anything before the rows land:

```
pg_dump -s "$OLD_DATABASE_URL" > schema.sql   # structure only
pg_dump -a "$OLD_DATABASE_URL" > data.sql     # rows only
```

<!-- ADD IMAGE: a terminal showing pg_dump on the old database, then pg_restore into the new one. -->

## Migrate a MySQL database with mysqldump

The MySQL equivalent is `mysqldump`, and the naive version works for a tiny database:

```
mysqldump -h old-host -u root -p appdb > appdb.sql
mysql -h new-host -u root -p appdb < appdb.sql
```

But that naive version locks your tables and drops your stored routines. For anything on InnoDB (nearly everything today) use this shape instead:

```
mysqldump --single-transaction --routines --triggers --events \
  --default-character-set=utf8mb4 \
  -h old-host -u root -p appdb > appdb.sql
```

What each flag buys you:

- **`--single-transaction`** takes a consistent snapshot in one transaction, so InnoDB tables aren't locked and your app keeps writing during the dump. This flag is the difference between a frozen site and a smooth export.
- **`--routines`** includes stored procedures and functions. Leave it off and they silently vanish.
- **`--triggers`** is on by default with a full dump, but naming it makes the intent obvious.
- **`--events`** brings scheduled events along. Easy to forget, annoying to notice missing later.
- **`--default-character-set=utf8mb4`** makes the dump speak full UTF-8. More on that below.

Create the target database with the right charset first, then load into it:

```
-- on the new server, before restoring
CREATE DATABASE appdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```
mysql --default-character-set=utf8mb4 -h new-host -u root -p appdb < appdb.sql
```

One note on GTIDs, kept light because most migrations don't need them. If your dump carries GTID metadata and the restore complains about it, add `--set-gtid-purged=OFF` for a plain move. You only want that GTID state when you're setting up replication, not when you're doing a one-time dump and restore.

Choosing between the two engines for a fresh start rather than moving an existing one? The [MySQL vs PostgreSQL](https://www.kloudbean.com/blog/mysql-vs-postgresql/) breakdown is the honest side-by-side.

<!-- ADD IMAGE: a terminal running mysqldump with single-transaction, routines, and utf8mb4 flags. -->

## The gotchas nobody documents

The commands above are the easy 80%. This section is the other 20%, the part that turns a 20-minute job into a lost evening. Read it before you start, not after.

### Character set drift: latin1, utf8, and the emoji that becomes garbage

This one bites MySQL migrations constantly. Older databases were often created as `latin1`, and MySQL's confusingly named `utf8` is only three bytes wide, so it can't hold an emoji or some CJK characters. The encoding you want is `utf8mb4`, the real four-byte UTF-8.

When the source's storage encoding and the dump's declared encoding disagree, you get mojibake. An accented name like `café` arrives as `cafÃ©`. Arabic and other non-Latin scripts turn into question marks. The fix: dump with `--default-character-set` set to what the source actually stored, create the target as `utf8mb4`, then check a known row after the restore. Pick a record with an accent, an emoji, or some Arabic and look at it. Row counts won't catch a charset problem. Only reading the data will.

### Definer errors on views, triggers, and procedures

MySQL stamps a `DEFINER` onto views, triggers, and stored routines, usually something like `root@localhost`. Restore that on a server where the user doesn't exist and you hit:

```
ERROR 1449 (HY000): The user specified as a definer ('someuser'@'somehost') does not exist
```

Two ways out. Create that user on the new server before restoring, or strip the `DEFINER` clauses from the dump. It's the MySQL cousin of the Postgres owner error, the same mistake: assuming the source's users exist on the destination. They don't until you make them.

### Giant dumps: don't write a 40GB file to disk

On a large database a plain `.sql` file can be enormous, and writing it then copying it wastes time and disk. Compress it, or skip the file and stream straight from old to new:

```
# compress on the way out
pg_dump -Fc "$OLD_DATABASE_URL" | gzip > appdb.dump.gz
mysqldump --single-transaction appdb | gzip > appdb.sql.gz

# or stream directly, no intermediate file at all
pg_dump "$OLD_DATABASE_URL" | psql "$NEW_DATABASE_URL"
```

Streaming is fast, but it ties both ends together for the whole run. Network drops halfway? You start over. On a flaky link, a compressed file you can resume copying is safer. On a solid private network, streaming wins.

### Foreign keys, load order, and sequences that fall behind

A full dump restores objects in dependency order, so foreign keys generally just work. Trouble starts with partial or data-only loads. In MySQL, loading rows in the wrong order trips constraints, so wrap a data-only load:

```
SET FOREIGN_KEY_CHECKS=0;
-- load your data here
SET FOREIGN_KEY_CHECKS=1;
```

Postgres has a sharper edge with **sequences**. A full `pg_dump` sets each one with `setval`, so auto-incrementing IDs pick up where they left off. Do a data-only load, though, and the sequences can sit at 1, so your next insert collides with an existing primary key. Loaded data only? Reset the sequences afterwards. MySQL has the same problem with `AUTO_INCREMENT` on a partial load. Full dumps handle it, partial dumps make it your job.

### Extensions, and the schema that references something that isn't installed

If your Postgres source uses PostGIS, pgvector, `uuid-ossp`, or any other extension, the target has to have it available before the restore can create the objects that depend on it:

```
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
```

Managed Postgres services enable a curated set of popular extensions. If your app leans on one, confirm it's supported on the destination before you commit. More in [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/).

### Timezones and timestamp columns

Postgres `timestamptz` stores a real instant and travels safely. Plain `timestamp` doesn't, and neither does MySQL's `DATETIME`. MySQL's `TIMESTAMP` converts to and from the session timezone, so servers set to different zones can shift those values by hours. For timezone-naive columns, set the same timezone on both ends, and spot-check a few known dates after.

### "The restore worked but the app can't connect"

This one sends people into a panic for no reason. The dump loaded, counts match, and the app throws connection errors. Nine times out of ten it isn't the database. It's one of these:

- The app is still pointed at the **old host**. The connection string never got updated.
- The new database requires **SSL** and the connection string is missing `sslmode=require` (Postgres) or the equivalent MySQL SSL setting.
- The **port or username** differs from the old setup, so auth quietly fails.
- You've opened **more connections** than the new database allows and hit its limit, which is really a [connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/) problem, not a migration one.

Fix the environment variable, not the database. This is why the connection belongs in config, and [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/) goes deeper.

## Source scenario, the flags to use, the gotcha to watch

Most migrations fall into a handful of shapes. Find yours, use the flags, watch the thing most likely to bite:

| Source scenario | Recommended tool & flags | The one gotcha to watch |
| --- | --- | --- |
| **Hosted Postgres (managed platform, Postgres cloud service, another host)** | `pg_dump -Fc --no-owner --no-privileges`, restore with `pg_restore` | Source owner roles don't exist on the target. Use `--no-owner`. |
| **Self-hosted Postgres, large database** | `pg_dump -Fc` piped through gzip, or stream with `| psql` | Version skew. Dump with the newer `pg_dump`. |
| **Managed or legacy MySQL** | `mysqldump --single-transaction --routines --triggers --events` | Charset drift from latin1. Set `--default-character-set`. |
| **WordPress or old MySQL with emoji / Arabic** | `mysqldump --default-character-set=utf8mb4`, target created as utf8mb4 | Double-encoding. Eyeball a known row after restore. |
| **MySQL with views, procedures, events** | dump with `--routines --triggers --events` | `DEFINER` user missing. Recreate it or strip the clause. |
| **Postgres using PostGIS / pgvector** | standard dump; `CREATE EXTENSION` on target first | Extension not installed on the destination. |

## The cutover: flipping without losing writes

Copying the data is the easy half. Switching production onto the new database without dropping a write is where the care goes.

**Do a full dry run first.** Migrate into the new database while the old one is still live, then run your app against it in **staging**. Sign in, create a record, run your tests. This flushes out the charset, owner, and extension problems above while nothing's at stake. Never let the production cutover be the first time your dump has been restored.

When staging looks right, the real cutover goes like this:

1. Put the old database into **read-only** mode (or take a short maintenance window) so no new writes sneak in while you copy.
2. Take a **final dump** and restore it into the new database.
3. **Verify** row counts and spot-check a few records (next section).
4. **Flip the connection string** in your environment variables and redeploy.
5. **Monitor** logs and error rates for a few minutes. Watch for connection and auth errors first.
6. Leave the old database **read-only** for a day or two. That's your rollback: if something's wrong, point the connection string back and you've lost nothing.

Making a database read-only is a one-liner on either engine:

```
-- Postgres
ALTER DATABASE appdb SET default_transaction_read_only = on;

-- MySQL
SET GLOBAL read_only = ON;
```

> **Honest about downtime.** A dump-and-restore migration always has a write-freeze window, as long as the final dump, restore, and verify take. For a small database that's minutes. True zero downtime means logical replication that streams changes to the new database until you cut over, and that's a real project with real moving parts. My take: for most small and medium apps, a short maintenance window at a quiet hour beats building a replication pipeline you'll run exactly once. Reach for replication when a few frozen minutes genuinely isn't acceptable, not by default.

## Verify before you trust it

A restore that exits with status zero is not proof the data is intact. Check it properly.

**Compare row counts.** Approximate counts are quick and catch a table that didn't load at all:

```
-- Postgres, per-table live row estimate
SELECT relname, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- MySQL, per-table estimate
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'appdb'
ORDER BY table_rows DESC;
```

Those are estimates, so for the tables that really matter, run an exact `SELECT count(*)` on both databases and confirm they match.

**Spot-check the actual data.** Open a handful of specific rows, especially anything with accents, emoji, or non-Latin text. This is the only check that catches charset damage.

**Run the app against it in staging.** Point your staging app at the new database and exercise the real flows: sign up, log in, place an order, whatever your app does. If the app is happy and the counts match, you're clear to cut over. The connection wiring lives in [adding a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/).

## Where the target database comes from

All of this needs somewhere to land. On Kloudbean you launch the destination from one dashboard: managed **PostgreSQL, MySQL, and MariaDB** are three of seven engines (Redis, Memcached, Elasticsearch, and MongoDB round out the set). Pick one, name it, create it. A minute or two later it's provisioned, patched, and being backed up.

![The Kloudbean console launching a managed PostgreSQL, MySQL, or MariaDB database as the migration target](../assets/console/launch-database.png)

_Launch the target database in a click, then point pg_restore or the mysql client at it._

Two things make a migration here less nerve-wracking. The database sits on a **private network**, reachable by your app internally instead of exposed to the internet, which is also the fastest path for streaming a big dump across. And **automatic backups** start immediately, so the moment your data lands you have a restore point, a safety net most people bolt on later, if ever. More in the [server backups guide](https://www.kloudbean.com/blog/server-backups-guide/).

![The Kloudbean console showing automatic backups on a managed database, giving an immediate restore point after migration](../assets/console/manage-backups.png)

_Automatic backups mean the freshly migrated database has a restore point from minute one._

<!-- ADD IMAGE: the new connection details you paste into your app's environment variables. -->

Rather not run the cutover alone? Kloudbean offers **free migration assistance**: send your source details and the team helps move it, which is genuinely useful for a large or production database where the freeze window has to be short. A **free trial** lets you stand up the target, dry-run, and verify before committing. For the engine deep-dives, see [managed MySQL hosting](https://www.kloudbean.com/blog/managed-mysql-hosting/) and [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/).

---

**Land your database on hosting you control.**

Launch managed PostgreSQL, MySQL, or MariaDB in a click, on a private network with automatic backups from minute one. Not sure about the cutover? Free migration assistance can run it with you. Start free at [kloudbean.com](https://www.kloudbean.com/), see plans on [pricing](https://www.kloudbean.com/pricing/).

One-click databases · Automatic backups · Private networking · Free migration · Free trial · Simple Git deploy

## FAQ

### How do I migrate a PostgreSQL database with pg_dump?

Run `pg_dump -Fc --no-owner --no-privileges` on the source, copy the dump over, and restore with `pg_restore -d` against the new database. Verify row counts, then repoint your connection string. A plain `pg_dump > file.sql` with a `psql < file.sql` restore works fine for small databases.

### What's the difference between pg_dump and pg_dumpall?

`pg_dump` exports one database; `pg_dumpall` exports a whole cluster, including roles and tablespaces. To move a single app database, use `pg_dump`. If you also need the roles, run `pg_dumpall --globals-only` separately, or recreate the app user by hand.

### Does mysqldump lock tables during the dump?

By default it locks tables while the dump runs. For InnoDB, add `--single-transaction` to take a consistent snapshot without locking, so your app keeps writing during the export. That one flag is the difference between a frozen site and a smooth dump.

### How do I migrate a database without downtime?

A plain dump-and-restore always has a short write-freeze window while you take the final dump, load it, and verify. True zero downtime needs logical replication, which is a real project. For most small and medium apps, a short maintenance window at a quiet hour is simpler and safer.

### Why does my restore fail with a definer or owner error?

Because the dump references a user that doesn't exist on the new server. In Postgres you see role does not exist; fix it with `--no-owner --no-privileges`. In MySQL you see error 1449 about a definer; create that user on the target first, or strip the DEFINER clauses from the dump.

### How do I fix character set issues after a MySQL migration?

Charset problems come from a mismatch between what the source stored and what the dump declared, often an old latin1 database. Dump with `--default-character-set` matching the source, create the target as `utf8mb4`, and load with the same flag. Then read a row with accents or emoji, because row counts won't catch this.

### pg_dump plain SQL or custom format, which should I use?

Plain SQL is readable and simple, loaded with `psql`, and fine for small databases. Custom format (`-Fc`) is compressed, restores in parallel with `pg_restore`, and lets you restore selectively. Use custom format for anything sizeable; reach for plain SQL when you want to grep the dump.

### How do I verify a database migration worked?

Compare row counts with an exact `SELECT count(*)` on the tables that matter. Spot-check specific rows, especially any with accents, emoji, or non-Latin text, since only reading the data catches charset damage. Then run your app against the new database in staging before you cut over.

### Can Kloudbean help migrate my database?

Yes. You launch a managed PostgreSQL, MySQL, or MariaDB target from the dashboard, on a private network with automatic backups from the start. Kloudbean also offers free migration assistance to help move a large or production database and keep the freeze window short. A free trial lets you dry-run first.

---

By Kloudbean · Moving Data Without Downtime.
