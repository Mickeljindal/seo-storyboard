# How to Connect Drizzle to Postgres (and Ship It to Production)

By the Kloudbean Database Team · Drizzle stays thin so Postgres can do the heavy lifting.

You built the app with Drizzle ORM and it runs fine on localhost. Then production shows up and the real question lands: how do you connect Drizzle to Postgres on a database that survives a redeploy and actually gets backed up? Drizzle is deliberately thin, a type-safe layer sitting right on top of SQL, so connecting it to a managed PostgreSQL is mostly about picking a driver and pointing it at a `DATABASE_URL`. This guide does exactly that: real TypeScript, migrations that hold up in production, and the one connection gotcha that tends to surface at 2am.

> **How do I connect Drizzle ORM to a managed Postgres?** Pick a driver (node-postgres, the `pg` Pool, or postgres.js), read your `DATABASE_URL` from an environment variable, and wrap the client in `drizzle()`. Define your tables in a TypeScript schema, then run `drizzle-kit generate` to create the SQL migration and `drizzle-kit migrate` to apply it. That's a production-ready Drizzle setup on a managed PostgreSQL, backed up and off the public internet.

## Connect Drizzle to Postgres in four moves

Drizzle isn't a heavy ORM that hides SQL from you. It's a query builder and schema toolkit that stays close to the database, which means "connecting" it is refreshingly boring. Four moves, in order:

1. **Pick a driver.** Drizzle doesn't talk to Postgres directly. It rides on top of `pg` (node-postgres) or postgres.js.
2. **Pass the connection.** Read `DATABASE_URL` from the environment and hand the client to `drizzle()`.
3. **Describe your tables in TypeScript.** Your schema file is the source of truth, in code.
4. **Generate and run migrations.** `drizzle-kit generate` writes the SQL, `drizzle-kit migrate` applies it.

Here's the whole shape on one canvas: the build-time path that turns your TypeScript schema into a migrated database, and the runtime path your queries take through the driver pool.

```
BUILD TIME · drizzle-kit
  schema.ts  →  generate (.sql)  →  migrate  ─┐
                                              ├─→  Managed Postgres
RUNTIME · your app                            │
  app query  →  drizzle(pool)  ───────────────┘
                (pg / postgres.js)
```

## Step 1: Pick a driver (node-postgres or postgres.js)

This is the step people skip past, then get confused when `drizzle()` asks for a client. Drizzle ORM and PostgreSQL don't speak to each other directly. You bring a driver, and Drizzle wraps it. For Postgres you've got two mainstream choices:

| | node-postgres (`pg`) | postgres.js |
| --- | --- | --- |
| **Drizzle import** | `drizzle-orm/node-postgres` | `drizzle-orm/postgres-js` |
| **Reputation** | The boring, battle-tested default | Newer, fast, tidy API |
| **Pooling** | Built-in `Pool` (default max 10) | Pools by default, `max` option |
| **Good when** | You want the most widely used option | You like its query and type ergonomics |

My honest take: for most apps it doesn't matter, so pick `pg` and move on. It's the one nearly every tutorial, Stack Overflow answer, and AI code generator assumes, which means fewer surprises when something goes sideways. Reach for postgres.js if you specifically like its API. Here's the `pg` setup:

```ts
// db.ts (node-postgres / pg driver)
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                 // cap connections; more on why below
});

export const db = drizzle(pool);
```

And the postgres.js version, which is nearly identical:

```ts
// db.ts (postgres.js driver)
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, { max: 10 });
export const db = drizzle(client);
```

Coming from a fuller ORM and weighing your options? Prisma is the other big one in this space, and there's a parallel walkthrough for [connecting Prisma to a managed database](https://www.kloudbean.com/blog/connect-prisma-to-a-managed-database/). Drizzle's pitch is that it stays close to SQL and ships less runtime, so you feel the database instead of a thick abstraction over it.

## Step 2: Pass DATABASE_URL from the environment

Notice both snippets read `process.env.DATABASE_URL`. That's on purpose. Your Drizzle DATABASE_URL should live in an environment variable, never typed into the source and never committed. On Kloudbean you set it under Runtime Configuration, Environment Variables, and the app reads it at boot:

![The Kloudbean console Environment Variables screen, where the Drizzle DATABASE_URL is stored instead of in code](../assets/console-real/shots/nodespm_env_step_1.png)

```bash
# set in Runtime Configuration, Environment Variables (not in code)
DATABASE_URL=postgresql://appuser:s3cret@10.0.0.5:5432/appdb

# reaching the DB over the public internet instead of internally? add SSL:
DATABASE_URL=postgresql://appuser:s3cret@db.example.com:5432/appdb?sslmode=require
```

Because the credentials sit in the environment, they stay out of your Git history and you can rotate a password without touching code. There's a fuller treatment in [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

> **Do I need SSL?** A managed Postgres reached over the public internet usually expects TLS, so append `?sslmode=require` to the URL or set the driver's ssl option. On Kloudbean you whitelist your app server's IP so only it can reach the database, and your app connects to it internally, so the common setup is a plain internal connection with no public exposure at all. If you do need it in code, pg takes `ssl: { rejectUnauthorized: false }` and postgres.js takes `ssl: 'require'`.

## Step 3: Define your schema in TypeScript

This is the part that makes Drizzle feel good. Your tables are TypeScript, so your column types flow straight into your query results with no code generation step. A small `schema.ts`:

```ts
// schema.ts
import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id:        serial("id").primaryKey(),
  email:     text("email").notNull().unique(),
  name:      text("name"),
  active:    boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

Pass that schema into `drizzle()` and you also unlock the relational query API (`db.query.users.findMany()`), plus fully typed results:

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

![From schema to query](images/gen-1-flow.png)

## Step 4: Generate and run migrations with drizzle-kit

A fresh database is empty. Your schema in TypeScript has to become tables in Postgres, and that's what `drizzle-kit` does. Point it at your schema with a small config file:

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

Then the two commands you'll run constantly, plus the one you should be careful with:

```bash
# 1. turn the current TS schema into a versioned SQL migration file
npx drizzle-kit generate

# 2. apply any pending migrations to the database
npx drizzle-kit migrate

# prototyping only: shove the schema straight into the DB, no migration file
npx drizzle-kit push
```

Here's an actual opinion, not a hedge: use **generate then migrate** for anything with real users. It leaves a reviewable, version-controlled SQL file per change, which is exactly what you want when a migration goes wrong at 2am and you need to see what ran. `drizzle-kit push` is a lovely convenience while you're still throwing the schema around in early dev, but it isn't a deploy strategy. Pushing against a production database can quietly alter or drop columns with no migration history to point at afterward. Great for a scratch project. Wrong for the one holding customer data.

On deploy, run migrations before the app starts serving traffic. Drizzle gives you a programmatic migrator so you can wire it into a start step:

```ts
// migrate.ts (run on deploy, before the app takes traffic)
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
await pool.end();
```

Drop that into your build or start command and schema changes ship with the code that needs them. If you're wiring up automatic deploys, the [Git deploy guide](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/) shows where the migrate step belongs in the pipeline.

![Real migration flow](images/gen-2-terminal.png)

## A real query, end to end

With the client wired and the schema migrated, queries are type-safe the whole way through. Insert a row and read it back:

```ts
// query.ts
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./schema";

// insert and get the row back, typed
const [created] = await db
  .insert(users)
  .values({ email: "ada@example.com", name: "Ada" })
  .returning();

// read it back; `found` is typed from the schema, no casting
const found = await db
  .select()
  .from(users)
  .where(eq(users.email, "ada@example.com"));
```

If `found` comes back empty on a fresh deploy, or you see `error: relation "users" does not exist`, that's almost always migrations that never ran. The tables aren't there yet. Run the migrate step and try again.

## Where the DATABASE_URL comes from: launch a managed Postgres

All of the above assumes you have a real Postgres to point at. On Kloudbean you open the DBS section, hit Launch Database, and pick PostgreSQL from the managed engines. A minute or two later it's provisioned, patched, locked to your app server's IP, and already being backed up. You copy the host, port, database, user, and password into your `DATABASE_URL`.

![Launching a managed PostgreSQL database in the Kloudbean console to connect Drizzle to](../assets/console-real/shots/psql_launch_step_1.png)

Why managed rather than a Postgres you babysit yourself? Because Drizzle being thin means the database is doing the real work, and you don't want to be the one paging yourself over patches, backups, and disk alerts. If you want the deeper reasoning on the engine itself, JSONB, extensions, and what you're actually paying for, that's in [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/). For the broader picture of wiring any framework to a managed database, start at [how to add a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/).

![Connection details feed DATABASE_URL](images/gen-3-flow.png)

## Connections are finite: size your pool

This is the gotcha I promised, and it's the same one that bites every Postgres client, Drizzle included. Postgres backs each connection with its own server-side process, so there's a hard ceiling set by `max_connections`. It ships at 100 by default. Blow past it and you get:

```
FATAL: sorry, too many clients already
```

How does an app get there? Usually one of two ways. Either lots of app instances each open a generous pool, or a serverless function opens a fresh connection on every invocation and they pile up faster than they close. The node-postgres `Pool` defaults to a max of 10, which is sane for a single always-on server, but ten instances at ten connections each is already 100, and you've hit the wall.

The fixes, in order of how often you'll need them:

- **Size the pool to the server.** Set `max` deliberately. On one always-on app server a pool of 10 to 20 is usually plenty, and it reuses connections instead of opening a new one per request. That reuse is the quiet advantage of a long-running server over serverless.
- **One pool per process, created once.** Instantiate `drizzle(pool)` at module scope, not inside a request handler. A new Pool on every request is how the count explodes.
- **Serverless needs a pooler.** If you're on functions, put a connection pooler (PgBouncer is the usual pick) in front of Postgres, or use a driver mode built for it. To be clear about what Kloudbean does and doesn't do here: there's no magic built-in pooler doing this for you. Pooling is your driver's pool on an always-on server, or a pooler you run. The concept is worth understanding properly, and it's covered in [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/).
- **Read-heavy? Spread the reads.** Once a single instance is genuinely maxed, [read replicas](https://www.kloudbean.com/blog/database-read-replicas-scaling/) take read traffic off the primary. And caching the hottest reads with a managed Redis in front of Postgres is often the cheapest win of all, because the query that never reaches the database is the fastest one.

> **Founder note.** Drizzle is intentionally a thin layer over SQL, which is a feature, not a shortcut. It means the managed Postgres underneath is doing the heavy lifting, so treat it like it matters. Size your pool. Add indexes on the columns you filter and join on. Run `EXPLAIN` on the slow query before you reach for a bigger server. Drizzle won't paper over a missing index, and honestly, you wouldn't want an ORM that pretended it could.

## Where this usually breaks

A short field guide to the failures that cost people an evening:

- **Forgot to migrate on deploy.** The app boots, the first query hits a table that doesn't exist, and you get `relation "..." does not exist`. Make the migrate step part of deploy.
- **Used `push` in production.** A schema tweak silently drops a column, and there's no migration file to audit. Keep push in dev; use generate and migrate everywhere real.
- **Hard-coded the connection string.** It ends up in Git, then in a screenshot, then in an incident. Read it from `DATABASE_URL`.
- **New Pool per request.** Connections climb until Postgres refuses new ones. One pool, created once, at module scope.
- **SSL mismatch.** Connecting over the public internet without `sslmode=require`, or with a stray ssl option on an internal connection that doesn't want one. Match the setting to how you're actually reaching the database.

None of these are Drizzle's fault, and that's kind of the point. Most deploy failures are configuration, not code.

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

**How do I connect Drizzle ORM to a managed Postgres?**
Pick a driver (node-postgres or postgres.js), read your DATABASE_URL from an environment variable, and pass the client to drizzle(). Define your tables in a TypeScript schema file, then run drizzle-kit generate to create the SQL migration and drizzle-kit migrate to apply it. The database itself is a managed PostgreSQL you launch first, which arrives provisioned, backed up, and locked to your app server's IP.

**Should I use node-postgres (pg) or postgres.js with Drizzle?**
Both work well and Drizzle supports each with a dedicated import. Pick node-postgres (pg) if you want the most widely used, battle-tested option, which is what most examples and code generators assume. Pick postgres.js if you prefer its API and type ergonomics. For the majority of apps the choice makes no practical difference, so pg is a fine default.

**What is the difference between drizzle-kit generate, migrate, and push?**
generate reads your TypeScript schema and writes a versioned SQL migration file. migrate applies any pending migration files to the database. push skips the files and applies the schema straight to the database, which is handy for prototyping but risky in production because it can alter or drop columns with no reviewable history. Use generate and migrate for anything with real users.

**Do I need SSL to connect Drizzle to a managed Postgres?**
It depends on how you reach the database. Over the public internet a managed Postgres usually expects TLS, so add sslmode=require to the DATABASE_URL or set the driver ssl option. When your app connects to the database internally, as it does on Kloudbean, the common setup is a plain internal connection with no public exposure, so SSL is often not needed for that path.

**How do I set DATABASE_URL for Drizzle?**
Store it as an environment variable rather than hard-coding it. On Kloudbean you add it under Runtime Configuration, Environment Variables, and both the app and drizzle-kit read process.env.DATABASE_URL. Keeping it in the environment keeps credentials out of your code and Git history, and lets you rotate the password without a code change.

**Does Drizzle need a connection pooler for serverless?**
Often yes. Postgres has a max_connections ceiling (100 by default), and serverless functions tend to open connections faster than they close them, which triggers the too many clients error. Put a pooler such as PgBouncer in front of Postgres, or use a driver mode designed for serverless. On an always-on server the driver pool reuses connections naturally and you rarely hit this.

**How do I run Drizzle migrations on deploy?**
Use Drizzle's programmatic migrator from drizzle-orm and call migrate() against a small connection before the app serves traffic, or run npx drizzle-kit migrate as part of your build or start step. The goal is that schema changes ship with the code that depends on them, so you never deploy an app that expects a table the database does not have yet.

**Can I use Drizzle with an existing Postgres database?**
Yes. Run drizzle-kit introspect (also called pull) to read an existing database and generate a matching TypeScript schema and initial migration. From there you manage further changes with generate and migrate as usual. This is the normal path when you are adding Drizzle to an app that already has a populated Postgres.

**Is Drizzle production-ready for Postgres?**
Yes. Drizzle is a thin, type-safe layer over SQL, so in production the real work is done by Postgres and your driver, both of which are mature. The practices that make a Drizzle setup production-ready are the same as for any Postgres client: read the connection from an env var, run migrations on deploy, size your pool, and add the right indexes.

**Prisma or Drizzle for Postgres?**
Both are solid. Drizzle stays close to SQL, ships less runtime, and defines the schema in TypeScript, which many developers prefer for control and transparency. Prisma offers a higher-level, generated client that some teams find faster to start with. If you are weighing them, there is a companion guide on connecting Prisma to a managed database, and either one runs happily on a managed PostgreSQL.

Kloudbean · Type-safe schema on top, a managed Postgres doing the work underneath.
