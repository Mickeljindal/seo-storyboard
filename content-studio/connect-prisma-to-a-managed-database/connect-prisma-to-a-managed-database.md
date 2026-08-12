# How to Connect Prisma to a Managed Database in Production

Prisma makes local development feel effortless. Then you ship, and the questions start. Where does `DATABASE_URL` live? Which migrate command is safe to run against real data? Why is the database suddenly refusing connections?

This guide shows how to connect Prisma to a managed database, Postgres or MySQL, for production: the datasource block, the Prisma `DATABASE_URL`, `prisma migrate deploy` versus `migrate dev`, running `prisma generate` on build, and the Prisma connection pooling reality that trips up almost everyone. Real code you can paste, no hand-waving.

> **The short version.** Point Prisma's datasource `url` at `env("DATABASE_URL")`, set `DATABASE_URL` as an environment variable (never in code) to your managed Postgres or MySQL connection string, then run `prisma generate` followed by `prisma migrate deploy` on every deploy. Cap connections with `connection_limit` in the URL so many app instances don't exhaust the database. Connect, migrate, and survive production.

## The datasource block: where Prisma finds your database

Prisma's whole connection lives in one place, the `datasource` block in `schema.prisma`. You set the `provider` to match your engine and point `url` at an environment variable.

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"   // or "mysql"
  url      = env("DATABASE_URL")
}
```

That's it. The `provider` tells Prisma which SQL dialect to speak. The `url` reads from the environment at runtime. That indirection is the whole point: the schema gets committed to Git, the secret does not. So a Prisma PostgreSQL connection is really just a connection string handed to Prisma through an env var. Nothing exotic underneath.

> **Using Drizzle instead?** The wiring idea is the same, just a different config file. See [connect Drizzle to Postgres](https://www.kloudbean.com/blog/connect-drizzle-to-postgres/) for that flavor.

## Set the Prisma DATABASE_URL in the environment, not in code

Your app reads its connection from the environment. Not from a value typed into a file, and definitely not from something committed to the repo. On Kloudbean you open **Runtime Configuration -> Environment Variables** and set it there.

<!-- ADD IMAGE: Kloudbean env-vars screen setting the Prisma DATABASE_URL -->

Here's the shape for each engine. Note the query params after the database name:

```bash
# PostgreSQL
DATABASE_URL="postgresql://appuser:s3cret@10.0.0.5:5432/appdb?schema=public&sslmode=require&connection_limit=10"

# MySQL
DATABASE_URL="mysql://appuser:s3cret@10.0.0.5:3306/appdb?connection_limit=10"
```

Read left to right: the user, the password, the host (an internal address on Kloudbean, reachable from your app rather than the public internet), the port (`5432` for Postgres, `3306` for MySQL), the database name, then options. `connection_limit` caps the pool size, and we'll come back to why that number matters more than it looks.

**On SSL:** if the database is ever reachable over a public network, add `sslmode=require` so Postgres encrypts the connection (MySQL has its own SSL params like `sslaccept`). With IP allow-listing, where only your app server's IP can connect, the database isn't exposed to the internet at all, which is the safer default and one less thing to configure. Keep `.env` out of Git either way. More on that in [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

<!-- ADD IMAGE: schema.prisma next to the .env file, showing url = env("DATABASE_URL") and the matching variable -->

## How Prisma actually connects: one pool per instance

Here's the part that surprises people. Prisma Client doesn't open a single connection. When it starts, it opens a **connection pool**, and it does that once per process. Run three copies of your app and you have three pools, all pointing at the same database.

The default pool size is `(number of physical CPUs * 2) + 1` per instance. So a 4-core box defaults to nine connections. Two instances, eighteen. A serverless setup with ten warm functions, each holding its own client, can quietly reach for far more. The database has a hard ceiling on total connections, and those pools all draw from it.

<!-- DIAGRAM: three app instances, each with a five-connection Prisma pool, converging on one managed Postgres with max_connections 100; instances x connection_limit must stay under max_connections -->

Keep that picture in mind. It's the reason `connection_limit` exists, and the reason the pooling section below matters more than any other part of this guide.

## prisma migrate dev vs prisma migrate deploy

This is the single most important distinction for a Prisma production database, and getting it wrong is how people lose data. The two commands do genuinely different jobs.

**`prisma migrate dev`** is a local development tool. It compares your schema to the migration history, generates a fresh SQL migration file, applies it, and regenerates the client. It spins up a temporary shadow database to check the migration is sound. It can prompt you. And if it detects that the database has drifted from the migration history, it can offer to reset, which drops your data. Useful on your laptop. A disaster in production.

```bash
# local dev only, never against production
npx prisma migrate dev --name add_orders_table
```

**`prisma migrate deploy`** is the production and CI command. It applies migration files that already exist, in order, and stops there. No prompts. No shadow database. No schema diffing, no reset, no interactive anything. It's idempotent, so running it on every deploy is safe: already-applied migrations are skipped.

```bash
# production / CI
npx prisma migrate deploy
```

<!-- DIAGRAM: migrate dev (local) writes to the committed migrations/ folder; migrate deploy (production/CI) reads and applies them; no prompts, no reset in prod -->

The workflow follows from that: create migrations locally, commit the `migrations/` folder to Git, and let production apply them with `migrate deploy`. One more warning while we're here. `prisma db push` is a prototyping shortcut that syncs your schema without creating migration files. Handy for a quick spike, wrong for production, because you lose the migration history that makes changes reviewable and repeatable.

## Run prisma generate on every build

Prisma Client is generated code. It gets written into `node_modules` from your schema, and it usually isn't committed to Git. So if your build doesn't generate it, the app starts and immediately throws:

```text
@prisma/client did not initialize yet. Please run "prisma generate"
```

A `postinstall` script covers local installs, and Prisma adds one for you in many setups. But don't rely on that in CI. Make it explicit in your build step so a clean environment always regenerates the client. Regenerate after every schema change too, otherwise your types drift from your tables and TypeScript starts lying to you.

```json
// package.json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

## A real deploy workflow

Put the steps in the right order and this stops being fiddly. Install, generate the client, apply migrations, build, start:

```bash
# runs on every deploy
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build        # if your app has a build step
npm run start
```

On Kloudbean's managed CI/CD you connect the Git repo and drop `prisma generate` and `prisma migrate deploy` into the build or deploy step. A schema change then ships with the code that needs it, and the live build logs show each command running. The full setup is in [CI/CD auto-deploy from GitHub](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/).

<!-- ADD IMAGE: deploy build logs with prisma generate and prisma migrate deploy running in sequence -->

## Prisma connection pooling: the number one production issue

Here's an opinion, and I'll stand behind it: the thing that takes Prisma apps down in production usually isn't Prisma. It's the connection count. The ORM is fine. The database ran out of room to accept new connections, and every query started timing out at once.

You saw the math in the diagram. Each instance opens a pool of `(CPUs * 2) + 1` by default, and they all draw from the database's `max_connections`. Cross that ceiling and Postgres says:

```text
FATAL: sorry, too many clients already
```

Or Prisma itself gives up waiting for a free connection from its own pool:

```text
Timed out fetching a new connection from the connection pool.
(Current connection pool timeout: 10, connection limit: 5)
```

Three real ways to keep this from happening, roughly in the order most people should try them:

- **Cap the pool deliberately.** Set `connection_limit` in `DATABASE_URL` to a number you chose, then multiply by your instance count and confirm it stays under the database's `max_connections`. Five connections across four instances is twenty. Predictable beats default.
- **Keep instances long-lived.** A persistent Node server reuses one pool for its whole life, which is gentle on the database. Serverless is the hard case: many short-lived functions each open their own pool, and the count spikes with traffic. If you're serverless, cap hard and consider a pooler.
- **Put a pooler in front.** Run [PgBouncer](https://www.kloudbean.com/blog/database-connection-pooling/) in transaction mode on your server, point `DATABASE_URL` at it with `pgbouncer=true`, and give Prisma a `directUrl` to the real port so migrations bypass the pooler.

```prisma
// schema.prisma, when a pooler sits in front
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooler port, ?pgbouncer=true
  directUrl = env("DIRECT_URL")     // direct 5432, for migrations
}
```

```bash
# env
DATABASE_URL="postgresql://appuser:s3cret@10.0.0.5:6432/appdb?pgbouncer=true"
DIRECT_URL="postgresql://appuser:s3cret@10.0.0.5:5432/appdb"
```

One honest note on what's yours versus what's the platform's. A managed database on Kloudbean gives you a real Postgres or MySQL with a connection ceiling, backups, and access locked to your app server's IP. The pooling strategy is yours to set: you choose `connection_limit`, or you run PgBouncer on your own server when you need it. There's no separate pooler product to buy, and no magic that hides the connection math from you. Understanding it is the job. The deeper mechanics live in [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/), and the engine-side view is in [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/).

<!-- ADD IMAGE: a metrics graph of active database connections climbing under load -->

## Does Prisma care whether it's PostgreSQL or MySQL?

Mostly no. The client API you write against is identical, so your queries don't change. The `provider` value changes, and a handful of native behaviors differ underneath.

| | PostgreSQL | MySQL |
|---|---|---|
| **provider** | `postgresql` | `mysql` |
| **Default port** | 5432 | 3306 |
| **Enums** | Native enum type | Emulated |
| **Rich types** | Arrays, JSONB, native | JSON, fewer native types |
| **Migrations** | Same commands: `migrate dev` locally, `migrate deploy` in prod | |

Both are fully managed engines on Kloudbean, so the choice is about your app, not about what's supported. For a new project I'd lean Postgres, mostly for JSONB and the extension ecosystem. If your stack already expects MySQL, stay there. The engine guides are [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) and [managed MySQL hosting](https://www.kloudbean.com/blog/managed-mysql-hosting/).

## Where Prisma-in-prod usually breaks

Almost every Prisma production incident I've seen traces back to config, not code. The usual suspects:

- **Running `migrate dev` against production.** It can detect drift and offer a reset, and someone tired says yes. Use `migrate deploy` in prod, always.
- **Forgetting `prisma generate` in the build.** The app boots straight into "did not initialize yet". Add it to the build step, not just `postinstall`.
- **No `connection_limit` with several instances.** Pools stack up, the ceiling arrives, and every query times out together.
- **Committing `.env`.** The real `DATABASE_URL` ends up in Git history, where it lives forever. Keep it in the environment.
- **Using `db push` instead of migrations.** Quick today, no history tomorrow, and nothing to review or roll back.
- **Migrating through a transaction pooler without `directUrl`.** Migrations need a direct connection. Route them past PgBouncer or they misbehave.

## How to connect Prisma to a managed database on Kloudbean

Prisma wants a specific thing from production: a real, always-on Postgres or MySQL with a stable connection string, automatic backups, and an address that isn't sitting open on the internet. That description is a managed database, more or less exactly.

<!-- ADD IMAGE: Kloudbean launch-database screen choosing Postgres or MySQL -->

The flow is short. Launch the database, copy the connection details into `DATABASE_URL`, and deploy your Node app on the same server so the app and the database sit side by side in one account. You whitelist the app server's IP so only it can reach the database: no public exposure, low latency, one dashboard for both. The broader walkthrough, including framework examples beyond Prisma, is the pillar guide: [add a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/).

---

**Give Prisma a production database it can trust.** Launch managed PostgreSQL or MySQL, set one `DATABASE_URL`, and deploy your Node app beside it, with IP allow-listing and automatic backups. Start free at [kloudbean.com](https://www.kloudbean.com/), see plans on [pricing](https://www.kloudbean.com/pricing/).

One-click databases · Automatic backups · Free migration · Free trial · Simple Git deploy

## FAQ

**How do I connect Prisma to a managed database in production?**
Set the datasource provider to postgresql or mysql, point its url at env of DATABASE_URL, and store the real connection string as an environment variable on the server rather than in code. Then run prisma generate and prisma migrate deploy on every deploy. The database should be locked down with IP allow-listing, so only your app server can reach it and Prisma connects with no public exposure.

**What is the difference between prisma migrate dev and prisma migrate deploy?**
prisma migrate dev is for local development. It generates new migration files, applies them, uses a shadow database, and can reset data if it detects drift. prisma migrate deploy is for production and CI. It only applies migration files that already exist, with no prompts and no reset, and it is safe to run on every deploy. Never run migrate dev against production.

**Do I need to run prisma generate on deploy?**
Yes. Prisma Client is generated code that lives in node_modules and is usually not committed. If the build does not run prisma generate, the app throws an error saying the client did not initialize yet. Add prisma generate to your build step, and regenerate after any schema change so your types match your tables.

**How do I set the Prisma DATABASE_URL?**
Put it in the environment, not in your source. On Kloudbean you set DATABASE_URL under Runtime Configuration and Environment Variables. The value is your managed database connection string, for example a postgresql or mysql URL with the host, port, database name, and options like connection_limit. Keeping it in the environment means credentials stay out of Git and are easy to rotate.

**Why does Prisma open so many database connections?**
Prisma Client opens a connection pool when it starts, once per process. The default pool size is the number of physical CPUs times two, plus one, for each instance. Run several instances, or a serverless setup with many warm functions, and those pools add up against the database connection ceiling. This is why capping connection_limit matters.

**How do I fix too many clients or a Prisma pool timeout?**
Both errors mean the connection count is too high. Set connection_limit in DATABASE_URL to a deliberate number and multiply it by your instance count to confirm it stays under the database max_connections. Keep app instances long-lived so they reuse one pool. For serverless or high concurrency, run a pooler like PgBouncer in front and route migrations around it with directUrl.

**Do I need PgBouncer with Prisma?**
Not always. A single long-lived Node server with a sensible connection_limit often does not need one. You want a pooler when you run many instances or a serverless platform that opens fresh connections per request. If you use PgBouncer in transaction mode, add pgbouncer=true to the pooled URL and set directUrl to the direct port so migrations use a direct connection.

**Does Prisma work with both PostgreSQL and MySQL?**
Yes. You change the provider to postgresql or mysql and the connection string, and the client API you write stays the same. A few native behaviors differ, such as how enums and some rich types are handled, but your queries and migrate commands do not change. Both are available as managed engines on Kloudbean.

**Should I use migrate deploy or db push in production?**
Use migrate deploy. It applies committed migration files in order and keeps a history you can review and roll back. prisma db push syncs the schema without creating migration files, which is fine for quick prototyping but leaves you with no migration history, so it is the wrong choice for production.

**How do I connect Prisma to the database over SSL?**
For Postgres, add sslmode=require to the connection string so the connection is encrypted. MySQL uses its own SSL parameters such as sslaccept. On Kloudbean you whitelist your app server's IP so only it can reach the database, and it is not exposed to the public internet, so the app connects over that internal link, which removes most of the need to expose it over SSL in the first place.

By Kloudbean Engineering · Prisma in production, minus the connection storms.
