---
title: "Postgres List Tables and Databases in psql, Organised by Task"
slug: psql-list-databases-and-tables
meta_description: "A psql reference by task: postgres list tables with dt, list databases with l, list schemas, describe a table, create a database, and the SQL behind each. Plus why dt comes back empty."
target_keyword: postgres list tables
secondary_keywords:
  - psql list databases
  - postgres list databases
  - list tables in psql
  - psql list tables
  - create database postgresql psql
  - list schemas postgres
author: Kloudbean
hero_image: images/hero.png
cluster: 7 - Databases, Storage & S3
---

![A psql terminal session showing backslash l listing databases beside backslash dt listing tables](images/hero.png)

# Postgres List Tables and Databases in psql, Organised by Task

By Kloudbean Engineering · Learn six meta-commands and you rarely reach for a database GUI.

If you have ever opened psql and blanked on how to see what is actually in front of you, this is the page for that. The phrase postgres list tables gets searched constantly, almost always because someone ran a command, got nothing back, and could not tell whether the database was empty or they were just looking in the wrong place. This is a reference organised by the task you are doing, with the psql meta-command and the plain SQL for each, because you need the SQL the moment you are in a script or a GUI that has no backslash commands.

> **The two commands you probably came for.** Inside psql, `\l` (or `\list`) lists every database, and `\dt` lists the tables in the database you are connected to. Here is the catch that trips almost everyone up at least once: `\dt` only shows tables in the schemas on your `search_path`. If it comes back empty, run `\dt *.*` to see every schema, or `\dt billing.*` for one named schema. Prefer SQL? `SELECT tablename FROM pg_tables WHERE schemaname = 'public';` does the same job anywhere.

## The mental model: cluster, databases, schemas, tables

Half the confusion with these commands disappears once you picture how Postgres nests things. One running server (a cluster) holds many databases. You connect to exactly one database at a time. Inside that database, objects live in schemas, and a schema holds your tables, views, and indexes. Each level has its own listing command, and each command only ever shows you one level.

```
  PostgreSQL cluster  (one running server)
        |
        |  \l  lists the databases
        v
  database: app        database: shop        template1
        |
        |  \c app connects, then \dn lists its schemas
        v
  schema: public       schema: billing
        |
        |  and inside a schema:
        v
   tables (\dt)     views (\dv)     indexes (\di)

  \dt only shows schemas on your search_path.
  Empty result? Try \dt *.* to see every schema,
  or check you connected to the right database with \c.
```

*Each backslash command lists exactly one level of this tree. Most empty results are you querying the wrong level.*

## Postgres list tables and databases: every command by task

Bookmark this table. It is the whole reference in one view: the meta-command you type in psql, what it lists, and the SQL that does the same thing when you are in a script, an ORM console, or a GUI with no backslash support.

| Task | psql meta-command | SQL equivalent |
| --- | --- | --- |
| List databases | `\l` or `\list` | `SELECT datname FROM pg_database WHERE datistemplate = false;` |
| Connect to a database | `\c dbname` | (reconnect, not a query) |
| List tables (current schema) | `\dt` | `SELECT tablename FROM pg_tables WHERE schemaname = 'public';` |
| List tables (all schemas) | `\dt *.*` | `SELECT schemaname, tablename FROM pg_tables;` |
| Describe one table | `\d name` or `\d+ name` | query `information_schema.columns` |
| List schemas | `\dn` | `SELECT nspname FROM pg_namespace;` |
| List views | `\dv` | `SELECT viewname FROM pg_views WHERE schemaname = 'public';` |
| List indexes | `\di` | `SELECT indexname FROM pg_indexes WHERE schemaname = 'public';` |
| List roles and users | `\du` | `SELECT rolname FROM pg_roles;` |
| List functions | `\df` | query `information_schema.routines` |

## List databases (and switch between them)

To do a psql list databases, type `\l`. That is the fast path. You get every database on the cluster, its owner, encoding, and access privileges. Add a plus for more: `\l+` throws in the on-disk size and description.

```
\l
\list
\l+          -- same list, plus size on disk
```

The SQL version matters more than it looks, because meta-commands do not exist outside psql. A cron job, a health check, or a migration tool cannot type `\l`. So the postgres list databases query you want in code is:

```sql
SELECT datname
FROM pg_database
WHERE datistemplate = false
ORDER BY datname;
```

The `datistemplate = false` filter hides `template0` and `template1`, the skeletons Postgres clones when you create a new database. You almost never want them in a list, and leaving them out now saves a confused question later. Once you know the name, connect with `\c`:

```
\c app
\c app appuser      -- connect as a specific role
```

Watch the prompt after you connect. It changes to show the current database, and that little detail is the single best defence against the most common reason `\dt` disappoints people, which we get to below.

<!-- ADD IMAGE: a psql session showing backslash l output with the database list, then the prompt changing after backslash c -->

## List tables, and why the schema decides what you see

To list tables in psql, run `\dt`. It shows the tables in whatever schemas sit on your `search_path`, which by default is just `public`. That default is exactly why a psql list tables command so often returns nothing useful even on a database that is full of data. Your tables are there, they are simply in a schema psql is not looking at right now.

```
\dt                 -- tables on your search_path (usually public)
\dt *.*             -- tables in every schema
\dt billing.*       -- tables in the billing schema only
```

The two SQL equivalents both work, and it is worth knowing each. `pg_tables` is a Postgres catalog view and is the shorter query. `information_schema` is the SQL-standard version, so it is the one to reach for if you want a query that also runs on other databases:

```sql
-- Postgres catalog: short and Postgres-specific
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- SQL standard: portable across engines
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

That `table_type = 'BASE TABLE'` filter is deliberate. Without it, `information_schema.tables` also returns views, which is a quiet way to end up counting things that are not tables. Once you can see your tables, the natural next step is usually making them fast, and that is a different craft covered in [PostgreSQL performance tuning](https://www.kloudbean.com/blog/postgresql-performance-tuning/).

## Describe a table: columns, types, and storage

Listing tells you what exists. Describing tells you what is inside. `\d tablename` prints the columns, their types, and the indexes, constraints, and foreign keys attached to the table. The plus form, `\d+ tablename`, adds storage detail and any column comments.

```
\d orders           -- columns, types, indexes, constraints
\d+ orders          -- the above, plus storage and comments
```

One nice quirk: bare `\d` with no name is a quick catch-all that lists tables, views, and sequences together. Handy when you just want a rough inventory and do not care about the exact object type yet.

## List schemas, views, indexes, roles, and functions

The `\d` family follows a pattern once you see it. The letter after `d` names the object type, so a handful of them cover almost everything you will want to inspect day to day. To do a list schemas postgres check, it is `\dn`:

```
\dn                 -- schemas (namespaces)
\dv                 -- views
\di                 -- indexes
\du                 -- roles and users
\df                 -- functions
```

This is the point I would make to anyone new to psql. Memorise these six or seven letters and you have most of the day-to-day inspection you would otherwise open a GUI for. It is a small investment that pays back every single session. Add a plus to any of them, like `\dv+`, and you get the fuller view with sizes and descriptions.

## Create a database from psql

To create a database in PostgreSQL from psql, it is one statement:

```sql
CREATE DATABASE app;
CREATE DATABASE app OWNER appuser;   -- hand it to a specific role
```

There is also a shell wrapper that does not need you to be inside psql at all. It is the same operation, just launched from your terminal, which is handy in setup scripts:

```
createdb app
createdb -O appuser app
```

A detail people hit right after this: you cannot create a database inside a transaction block, so tools that wrap everything in `BEGIN` will refuse. And restoring a dump usually means creating the empty database first, then loading into it, which is exactly the flow in [migrating with pg_dump and mysqldump](https://www.kloudbean.com/blog/database-migration-pg_dump-mysqldump/).

## Show database and table sizes

Sizes are the most underused thing in psql, and the answer to "which table is eating my disk" is usually one keystroke away. The plus variants carry sizes: `\l+` for databases and `\dt+` for tables.

```
\l+                 -- databases with size on disk
\dt+                -- tables with size on disk
```

For a precise, human-readable number in a query, the size functions wrapped in `pg_size_pretty` are the ones to remember:

```sql
SELECT pg_size_pretty(pg_database_size('app'));
SELECT pg_size_pretty(pg_total_relation_size('orders'));
```

The difference between the two table functions matters. `pg_total_relation_size` counts the table plus its indexes and TOAST storage, which is the number you actually care about when a table feels heavy. `pg_relation_size` counts only the table's own data, so a table that looks small there can still be huge once its indexes are added in.

## When psql shows nothing: the four usual causes

This is the section a plain cheat sheet skips, and it is where most of the real time gets lost. If `\dt` prints "Did not find any relations", it is almost never a broken install. It is one of four things, in rough order of how often it turns out to be the answer.

**You are in the wrong database.** psql connected you to a default (often a database named after your username, or `postgres`) and your tables live in a different one. Run `\l`, find the right name, and `\c` into it. The prompt tells you where you are.

**Your tables are in a schema off the search_path.** The tables exist, but not in `public`, and `\dt` only looks at your `search_path`. This is the big one. Check and widen it, or just list everything:

```
SHOW search_path;
SET search_path TO billing, public;
\dt *.*             -- or skip the search_path entirely
```

**They are views, not tables.** `\dt` lists tables only. If the objects you expect are views, they hide from `\dt` and show up under `\dv`. Bare `\d` lists both, which is a fast way to confirm.

**The database really is empty.** Sometimes "no relations" is the honest truth: you connected to a freshly created database with nothing in it yet. Not a bug, just an empty room.

A fifth, rarer cause: your role may lack privileges to see certain objects. But check the first two first. Nine times out of ten it is the wrong database or the search_path, and this is the exact class of confusion that also lies behind a lot of app-side database errors, like the one in [error establishing a database connection](https://www.kloudbean.com/blog/fix-error-establishing-database-connection-wordpress/).

## Connect psql to a remote or managed database

Everything above assumes you are already in a psql session. Connecting to a database that lives on another host, like a managed Postgres instance, is a connection string:

```
psql "postgresql://appuser:secret@db-host.example.com:5432/app"

# managed hosts almost always require TLS:
psql "postgresql://appuser@db-host.example.com:5432/app?sslmode=require"
```

Two things to get right here. First, `sslmode=require` is not optional theatre on a managed database, it is how you make sure the connection is encrypted in transit. Second, and this one bites people, do not put the password in the command. It lands in your shell history in plain text, where it sits until you forget it is there. Use a `~/.pgpass` file locked to your user, or pass the password for a single command through an environment variable:

```
# ~/.pgpass  (chmod 600), one line per host:
db-host.example.com:5432:app:appuser:secret

# or, for a single command, without writing it to history:
PGPASSWORD=secret psql "postgresql://appuser@db-host.example.com:5432/app?sslmode=require"
```

From an app rather than a shell, the same connection string goes in an environment variable, never in your code, and your driver reads it. Two habits are worth building here. See [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/) for why you should not open a fresh connection per request, and [database private access control](https://www.kloudbean.com/blog/database-private-access-control/) for keeping the database off the open internet.

<!-- ADD IMAGE: a terminal connecting to a remote managed Postgres over an sslmode=require connection string, then running backslash dt -->

## Where the server comes into it

None of these commands care where Postgres runs. `\l`, `\dt`, and the rest behave the same on your laptop, a VPS you built by hand, or a managed instance. What managed hosting changes is who runs the server underneath them, and that is the whole pitch: you keep running your psql commands and writing your queries, and someone else provisions the box, keeps it patched, and takes the backups.

On [Kloudbean managed PostgreSQL](https://www.kloudbean.com/blog/managed-postgresql-hosting/), that means one-click provisioning, automatic backups, and controlled access from one dashboard, with Postgres sitting alongside six other managed engines (MySQL, MariaDB, Redis, Memcached, Elasticsearch, and MongoDB) across seven clouds. You connect over the same connection string shown above, with free SSL already in place. For general accounts the database is kept off the public internet by allow-listing your app server's IP so only that server can reach it. On Enterprise it can run on a private network (VPC). Free migration assistance is there if you are moving an existing database in, and standard plans start from $8 a month, though it is worth checking the current figure on the pricing page.

The honest boundary, stated once: managed covers the server, the engine, backups, and patching. Your schema, your data, and your queries stay yours, exportable with a plain `pg_dump` whenever you want. Wiring a fresh app to a managed database from scratch is walked through in [add a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/), and if you are still choosing an engine, [MySQL vs PostgreSQL](https://www.kloudbean.com/blog/mysql-vs-postgresql/) lays out the trade-offs. The MySQL counterpart to this reference is [MySQL port, and listing databases and tables](https://www.kloudbean.com/blog/mysql-default-port-and-show-databases/).

![The Kloudbean console launching a managed PostgreSQL database from a list of managed engines, with automatic backups on](../assets/console/launch-database.png)

---

**Run the queries, skip the server admin.** Managed PostgreSQL with one-click provisioning, automatic backups, and IP allow-listing so only your app server can reach it. Seven managed engines, seven clouds, one dashboard. Free SSL, and free migration assistance if you are bringing a database with you. Start at [kloudbean.com](https://www.kloudbean.com/) or see [pricing](https://www.kloudbean.com/pricing/).

Managed PostgreSQL · Automatic backups · IP allow-listing · Free SSL · Free migration · One dashboard

## FAQ

**How do I list all databases in psql?**
Inside a psql session, type `\l` or `\list` and press enter. You get every database on the cluster with its owner, encoding, and privileges. Use `\l+` to include the size on disk. In a script or a tool that has no backslash commands, run the SQL instead: `SELECT datname FROM pg_database WHERE datistemplate = false;`

**How do I list tables in a specific schema?**
Use `\dt schema.*`, for example `\dt billing.*`, to list the tables in one named schema. To see tables across every schema at once, run `\dt *.*`. The SQL version filters on the schema name: `SELECT tablename FROM pg_tables WHERE schemaname = 'billing';`

**Why does psql show no tables or say no relations found?**
Usually one of four reasons, not a broken install. You are connected to the wrong database, your tables live in a schema that is not on your search_path, the objects are views rather than tables, or the database is genuinely empty. Check the prompt to confirm the database, run SHOW search_path, then try `\dt *.*` to list every schema regardless of the search_path.

**How do I show table and database sizes in psql?**
Add a plus to the listing commands: `\l+` shows database sizes and `\dt+` shows table sizes. For an exact number in a query, use `SELECT pg_size_pretty(pg_database_size('app'));` for a database, or `pg_total_relation_size` for a table, which counts its indexes and TOAST storage too, not just the raw data.

**What is the difference between the d and dt commands?**
They answer different questions. `\dt` lists the tables in your current schemas, so it is for finding out what tables exist. `\d` followed by a table name describes that one table, showing its columns, types, indexes, and constraints. Bare `\d` with no name lists tables, views, and sequences together as a quick inventory.

**How do I connect to a database in psql?**
Inside a session, switch databases with `\c dbname`, or add a role with `\c dbname username`. The prompt updates to show where you are connected. To connect to a remote or managed host, start psql with a connection string such as `psql "postgresql://user@host:5432/dbname?sslmode=require"`.

**How do I list tables using SQL instead of a meta-command?**
Two options. The Postgres catalog view is shortest: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`. The SQL-standard view is more portable across databases: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`. Use the SQL form whenever you are in a script, an ORM, or a GUI without backslash commands.

**How do I create a database from psql?**
Run `CREATE DATABASE app;`, or `CREATE DATABASE app OWNER appuser;` to assign an owner. From the shell without entering psql, the wrapper is `createdb app`. Note that you cannot create a database inside a transaction block, so a tool that wraps statements in BEGIN and COMMIT will refuse the command.

**How do I connect psql to a remote or managed PostgreSQL server?**
Pass a connection string: `psql "postgresql://user:pass@host:5432/dbname"`, and add `?sslmode=require` for a managed host, which will expect TLS. Do not put the password in the command, since it is saved to your shell history. Use a `~/.pgpass` file locked with chmod 600, or the PGPASSWORD environment variable for a single command.

---

*By Kloudbean Engineering · The database that shows nothing is usually the wrong one.*
