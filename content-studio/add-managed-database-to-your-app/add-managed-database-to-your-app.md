# How to Add a Managed Database (PostgreSQL or MySQL) to Your App

Lovable, Bolt, Cursor, Replit, v0, Claude Code. The AI builders are genuinely good at spitting out a working app in an afternoon. Then you go to ship it and hit the wall nobody warned you about: where does the data actually live? A SQLite file that gets wiped on the next redeploy won't cut it. You need a real database. This guide walks through adding a **managed PostgreSQL or MySQL** to your app, wiring it up without leaking credentials, running your migrations, and keeping backups, with code you can paste for Prisma, Drizzle, Django, Laravel, and Rails.

> **The short version:** Spin up a managed PostgreSQL or MySQL next to your app. Put the connection in a `DATABASE_URL` environment variable, never in your code. Run your framework's migrate command (`prisma migrate deploy`, `python manage.py migrate`, `php artisan migrate`, `rails db:migrate`), then sign up a test user to confirm it sticks. On Kloudbean the database is provisioned, kept on a private network, and backed up for you.

## Why AI-built apps need a real managed database

Most generated apps start on **SQLite** or a local file. It's zero-config and works the instant you hit run, which is exactly what you want while building. It just doesn't survive contact with real users. Four things break, usually in this order:

- **Redeploys wipe the data.** On a lot of platforms the filesystem is temporary. Push a new version and the SQLite file, plus everyone's data, can be gone.
- **One writer at a time.** SQLite locks the whole file to write, so a handful of concurrent users start queuing behind each other.
- **No second server.** A local file can't be shared across app instances, so scaling out isn't on the table.
- **Backups are your problem.** Nothing is quietly making a restorable copy of a loose file on disk.

A managed PostgreSQL or MySQL fixes all of that. It lives on its own, handles plenty of concurrent users, can be reached by more than one app server, and gets backed up without you thinking about it. That's the line between a demo and something you'd put in front of paying customers.

## The architecture, in one picture

Here's the shape of what you're building. A request comes in, your app reads and writes to a managed database over a private network, and that database is backed up on its own schedule.

```
User  →  Application  →  Managed Database  →  Backups
          └──────── private network (VPC) ────────┘
      (browser)   (Node/Django/Laravel)  (Postgres/MySQL)   (automatic · restorable)
```

## SQLite vs PostgreSQL vs MySQL: when to use each

SQLite isn't bad. It's just the wrong tool for this particular job. Use it while you build, then move to a client-server database before real users show up. What actually differs:

| | SQLite | PostgreSQL | MySQL |
| --- | --- | --- | --- |
| **Best for** | Local dev, tests, prototypes | Production, most modern apps | Production, WordPress/PHP & general |
| **Concurrency** | One writer (file lock) | High (MVCC) | High |
| **Survives redeploy** | Only if the file persists (often lost) | Yes, independent and managed | Yes, independent and managed |
| **Multiple app servers** | No | Yes | Yes |
| **JSON / rich types** | Basic | Excellent (JSONB) | Good |
| **Backups** | Manual | Automatic (managed) | Automatic (managed) |

**Rule of thumb:** SQLite for development, Postgres or MySQL once people are relying on it. The switch is usually painless, because your ORM already speaks all three. You change a connection string and run your migrations.

## PostgreSQL or MySQL: which should you pick?

Both are mature, fast, and fully managed on Kloudbean, so you're not going to regret either one. A quick way to decide:

| | PostgreSQL | MySQL |
| --- | --- | --- |
| **Pick it when** | New app, no strong preference; rich data types, JSONB, analytics | Your stack expects it; WordPress/PHP; team knows it well |
| **Default for** | Most AI-generated apps and modern ORMs | PHP ecosystems and legacy apps |
| **Reputation** | Powerful, standards-strict | Fast, simple, everywhere |

No strong opinion? Take **PostgreSQL**. It's what most of the AI tools generate against anyway. If you want the deeper comparison, there's [MySQL vs PostgreSQL](https://www.kloudbean.com/blog/mysql-vs-postgresql/), or jump straight to [managed PostgreSQL](https://www.kloudbean.com/blog/managed-postgresql-hosting/) and [managed MySQL](https://www.kloudbean.com/blog/managed-mysql-hosting/).

## Step 1: Launch a managed database

Open the **DBS** section and hit **Launch Database**. Kloudbean runs six managed engines: PostgreSQL, MySQL, MariaDB, Redis, Elasticsearch, and MongoDB. Pick one, give it a name, create it. A minute or two later it's provisioned, secured, and already being backed up.

![The Kloudbean console — Launch Database with a choice of managed PostgreSQL, MySQL, MariaDB, Redis, Elasticsearch, or MongoDB](../assets/console/launch-database.png)

You'll get the connection details: host, port, database name, username, password. You'll need them in a second. Just don't paste them into your code.

> **Coming from Supabase?** Two ways to land here. Migrate your Postgres data to a managed PostgreSQL you own (steps are below), or launch **managed Supabase** itself as a one-click app. Either way, the data sits on infrastructure you control.

## Step 2: Connect through environment variables (with real examples)

Your app should read its connection from the **environment**, not from a value typed into the source. Open **Runtime Configuration → Environment Variables** and add it, either as a single `DATABASE_URL` or as separate fields:

![The Kloudbean console — Environment Variables, where the database connection string is stored safely, not in code](../assets/console/env-vars.png)

Here's what those values look like. Use the **Paste .env Content** tab to drop them all in at once:

```bash
# PostgreSQL — single connection string
DATABASE_URL=postgresql://appuser:s3cret@10.0.0.5:5432/appdb

# MySQL — single connection string
DATABASE_URL=mysql://appuser:s3cret@10.0.0.5:3306/appdb

# Or discrete variables (many frameworks read these)
DB_HOST=10.0.0.5
DB_PORT=5432
DB_USERNAME=appuser
DB_PASSWORD=s3cret
DB_NAME=appdb
```

Because the credentials live in the environment, they never end up in your Git history, and you can rotate a password without touching code. There's more on this in [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

## Connect from your framework or ORM

Every popular framework reads the same variables. Here are the three shapes you'll see most, then a table for the rest.

**Prisma (Node / TypeScript)**

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"   // or "mysql"
  url      = env("DATABASE_URL")
}
```

**Express with node-postgres (pg)**

```js
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const query = (text, params) => pool.query(text, params);
```

**Django (Python)**

```python
# settings.py
import dj_database_url, os
DATABASES = {
    "default": dj_database_url.parse(os.environ["DATABASE_URL"]),
}
```

The pattern doesn't change: read `DATABASE_URL` (or the `DB_*` fields) from the environment and let the ORM do the rest. This table has the connection variable and the migrate command for the frameworks people ask about:

| Framework / ORM | Reads | Migrate command |
| --- | --- | --- |
| **Prisma** | `DATABASE_URL` | `npx prisma migrate deploy` |
| **Drizzle** | `DATABASE_URL` | `npx drizzle-kit migrate` |
| **Sequelize** | env / config | `npx sequelize-cli db:migrate` |
| **TypeORM** | DataSource env | `npm run typeorm migration:run` |
| **NestJS** | `DATABASE_URL` | `prisma migrate deploy` / TypeORM run |
| **Django** | `DATABASE_URL` | `python manage.py migrate` |
| **FastAPI** (SQLAlchemy + Alembic) | `DATABASE_URL` | `alembic upgrade head` |
| **Laravel** | `DB_*` in `.env` | `php artisan migrate --force` |
| **Rails** (ActiveRecord) | `DATABASE_URL` | `rails db:migrate` |
| **Express** (node-pg-migrate) | `DATABASE_URL` | `node-pg-migrate up` |

## Step 3: Run your migrations

A fresh database is empty, so your schema has to be applied. Run your framework's migrate command against the new `DATABASE_URL`:

```bash
# Node ORMs
npx prisma migrate deploy
npx drizzle-kit migrate

# Python
python manage.py migrate        # Django
alembic upgrade head            # FastAPI / SQLAlchemy

# PHP / Ruby
php artisan migrate --force     # Laravel
rails db:migrate                # Rails
```

**Do yourself a favor:** run migrations automatically on deploy, so a schema change ships with the code that needs it. Drop the migrate command into your build or start step and you'll never forget it again. Setting up [Git deployments](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/)? That's exactly where it belongs.

## Step 4: Verify the connection

Redeploy so the app picks up the new variables, then do something real. Sign up a test user, create a record, reload the page, check it's still there. If it won't connect, it's nearly always one of three things. A typo in the connection string. The wrong variable name (your ORM wants `DATABASE_URL` and you set `DB_URL`). Or migrations never ran, so the tables aren't there. Whatever it is, the database error in your logs will say so plainly.

## Database security best practices

Your database holds the data you least want leaked, so none of these are optional:

- **Never hard-code credentials.** Connection strings live in environment variables, not in source.
- **Never commit `.env` files.** Add `.env` to `.gitignore` and set the values on the server instead.
- **Keep the database off the public internet.** On Kloudbean it sits on a **private network (VPC)**, reachable by your app internally, not sitting out in the open where scanners find it.
- **Use least-privilege users.** Your app's database user should have the permissions it needs and nothing more. It doesn't need superuser.
- **Rotate passwords.** Since the connection is an env var, rotating one is a config change, not a code change.
- **Turn on backups, then test a restore.** Automatic backups are on. Actually restoring one before you're in a crisis is the part people skip.

## Performance and scaling

You don't need to tune a thing on day one. But it's worth knowing the levers, so a slow afternoon later doesn't turn into a mystery:

- **Connection pooling.** A database allows a finite number of connections. An always-on app server (like the one you get here) reuses a pool naturally, so this is far gentler than serverless. Most drivers pool by default. If you ever see "too many connections," set a sensible pool size instead of opening connections ad hoc.
- **Indexing.** The biggest win for most apps, by a distance. Add indexes on the columns you filter and join on. A missing one turns a fast query slow the moment the table grows.
- **Query optimization.** Run `EXPLAIN` on anything sluggish, and watch for the N+1 queries an ORM loves to generate.
- **Caching.** Put a [managed Redis](https://www.kloudbean.com/blog/managed-redis-hosting/) in front of your hottest reads and the database barely notices them.
- **Sizing.** Start small and **resize the server** as you grow. More CPU and RAM is the simplest first move.
- **Scaling reads.** For read-heavy workloads, read replicas are the usual next step. Plan for them as traffic climbs.

## Migrating an existing database (including from Supabase)

Already have data? Moving it is a plain export and import, then you repoint the connection string:

```bash
# PostgreSQL (works for Supabase too — it's just Postgres)
pg_dump "$OLD_DATABASE_URL" > dump.sql
psql "$NEW_DATABASE_URL" < dump.sql

# MySQL
mysqldump -h OLD_HOST -u USER -p appdb > dump.sql
mysql -h NEW_HOST -u USER -p appdb < dump.sql
```

Then point `DATABASE_URL` at the new database and redeploy. Supabase is Postgres underneath, so a Supabase move is just the Postgres flow above. And if you'd rather not do the first one yourself, Kloudbean's **free migration assistance** will handle it.

## Supported frameworks

If it speaks Postgres or MySQL, it works here. That's basically every modern framework:

- **Python:** Django, Flask, FastAPI
- **Node / JS:** Express, NestJS, Next.js, Nuxt, Astro
- **PHP:** Laravel, WordPress
- **Ruby:** Rails

An AI builder almost certainly handed you one of these. The [full guide to deploying an AI-built app to production](https://www.kloudbean.com/blog/deploy-ai-built-app-to-production/) shows where the database step fits the bigger picture.

## How it fits the rest of your stack

A database is one piece of owning your whole stack. It sits next to your app, wired in through environment variables, and everything else falls into place around it. Background jobs and scheduled tasks work against it. Big files go to [object storage](https://www.kloudbean.com/blog/s3-compatible-object-storage/) instead of bloating the database. Hot reads get cached in Redis. And it's all covered by [automatic backups](https://www.kloudbean.com/blog/server-backups-guide/) behind free SSL. One dashboard, one server, one bill.

## The honest limits

Kloudbean runs six managed engines, PostgreSQL, MySQL, MariaDB, Redis, Elasticsearch, and MongoDB, all on **Linux**. It won't manage every exotic datastore, and it isn't built for Windows-only database stacks. "Managed" means the platform provisions the database, keeps it on a private network, and backs it up, while the schema and the data stay yours to export whenever you like. For plain Postgres or MySQL, which is what nearly every AI-built app actually uses, running one next to your app is about as simple as it gets.

---

**A production database, one click away.** Managed PostgreSQL and MySQL, with automatic backups, private networking, and free migration help, plus simple Git deploys on the same server. Start free at [kloudbean.com](https://www.kloudbean.com/); plans on [pricing](https://www.kloudbean.com/pricing/).

One-click databases · Automatic backups · Private networking · Free migration · Free trial

## FAQ

**How do I add a database to my Lovable, Bolt, or Cursor app?**
Launch a managed PostgreSQL or MySQL from the DBS section, connect your app through a `DATABASE_URL` environment variable (not hard-coded), run your framework's migrate command to create the tables, and confirm it works with a test read and write. The database lives on your server, on a private network, and it's backed up automatically.

**PostgreSQL vs MySQL, which should I choose?**
Both are excellent and fully managed, so you're not going to lose either way. Pick PostgreSQL for a new app with no strong preference. It's the default most AI tools generate against, and its JSON and rich-type support are great. Pick MySQL if your stack already expects it (WordPress, say) or your team knows it well. A typical app won't hit the limits of either.

**Can I migrate from Supabase?**
Yes. Supabase is PostgreSQL underneath, so you export with `pg_dump`, import into a managed PostgreSQL, and repoint `DATABASE_URL`. You can also launch managed Supabase itself as a one-click app on Kloudbean. Free migration assistance can handle the first move for you.

**Does this work with Prisma?**
Yes. Point Prisma's `datasource` `url` at `env("DATABASE_URL")`, set that variable to your managed database's connection string, and run `npx prisma migrate deploy`. Prisma behaves the same whether the database is Postgres or MySQL.

**Does it support Laravel?**
Yes. Set `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in your environment, then run `php artisan migrate --force`. Laravel runs comfortably on managed MySQL or PostgreSQL.

**How do I import an existing database?**
Export it (`pg_dump` for PostgreSQL, `mysqldump` for MySQL), import the dump into the new managed database with `psql` or `mysql`, then update `DATABASE_URL` and redeploy. For a large or production database, free migration assistance can do it with minimal downtime.

**Can I connect to the database remotely?**
Your app connects over the private network by default, which is the setup you want. For admin access from your own machine, like a GUI client, you tunnel in through the server rather than exposing the database to the public internet. Keeping it off the open web is the whole point.

**Can multiple apps share one database?**
Yes. Several apps on the same server can point their `DATABASE_URL` at one managed database. If you want isolation, give each app its own database, or its own least-privilege user on a shared instance.

**How do backups work, and can I restore them?**
Managed databases are backed up automatically, and you can restore from a backup when you need to. The data stays yours, and you can export it anytime. Do yourself a favor and test a restore before you're depending on it, so you know the path works.

**Do I have to run migrations?**
Yes, unless you're importing an existing database. A new database has no tables, so run your ORM's migrate command (`prisma migrate deploy`, `python manage.py migrate`, `php artisan migrate`, `rails db:migrate`). Best to run it automatically on deploy so schema changes ship with the code.

---

*By Kloudbean · Managed multi-cloud hosting. Build. Deploy. Scale — Faster Than Ever.*
