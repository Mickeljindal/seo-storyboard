# How to Connect Sequelize to a Database in Production

By Kloudbean Engineering · Nodes, models, and migrations

Sequelize has been wiring Node apps to SQL databases since the callback era, and it still runs under a huge number of Express and Fastify APIs today. Most tutorials, though, show you `new Sequelize('mydb', 'root', 'password', { host: 'localhost' })` and stop. That's fine on your laptop. It falls apart the moment you connect Sequelize to a database in production, where localhost doesn't exist, the password can't live in your code, and one missing setting can exhaust the database on your first real traffic. This guide is the production wiring: the Sequelize instance built from `DATABASE_URL`, a connection pool sized on purpose, SSL through `dialectOptions`, and migrations that actually run on deploy. Postgres and MySQL, real code you can paste.

> **The short version**
>
> To connect Sequelize to a database in production, create one Sequelize instance from `process.env.DATABASE_URL`, set `dialect` to `postgres` or `mysql`, and configure the `pool` block (`max`, `min`, `acquire`, `idle`) so many app processes don't blow past the database's connection ceiling. Add SSL under `dialectOptions` if the database is public, or skip it when the app reaches the database on an internal connection. Never run `sequelize.sync({ force: true })` against real data. Use sequelize-cli migrations and run `npx sequelize-cli db:migrate` on every deploy.

## Why your Sequelize app breaks the moment it leaves localhost

Almost every Sequelize production incident I've seen traces back to config, not the library. The ORM is fine. The setup around it is where things go wrong. Before the how, the what: the things that break the first time a Sequelize app meets a real database.

- **Hardcoded localhost and credentials.** The tutorial config points at `127.0.0.1` with a password in the file. In production the host is a different machine and that password can't be in Git. Result: `SequelizeConnectionRefusedError` / `ECONNREFUSED`, or a leaked secret.
- **No pool cap, or one that's too big.** Every Node process opens its own pool. Run a few and you sail past the database limit, then queries fail with `sorry, too many clients already` on Postgres or `ER_CON_COUNT_ERROR: Too many connections` on MySQL. The app looks down while the code is perfectly fine.
- **SSL required, plaintext attempted.** Connect to a public managed Postgres without SSL and it slams the door: `no pg_hba.conf entry for host ... no encryption`. You need `dialectOptions.ssl`, or an internal connection where the question never comes up.
- **Migrations never ran.** The app boots, the first query hits a table that isn't there, and you get `relation "Users" does not exist` wrapped in a `SequelizeDatabaseError`. The schema lives in migration files nobody ran on deploy.

Four problems, four fixes, one per section from here, starting with the connection.

## Connect Sequelize to a database the production way

You want exactly one Sequelize instance for the whole process. Create it once, export it, and every model and query reuses it, because that instance owns the connection pool. Building a new Sequelize per request is a classic way to leak connections you never close.

Here's a production-shaped instance that reads its connection string from the environment and sets the pool and SSL up front:

```js
// db.js
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",            // or "mysql" / "mariadb"
  logging: false,                 // don't log every query in prod
  pool: {
    max: 10,                      // most connections this process keeps open
    min: 0,
    acquire: 30000,               // ms to wait for a connection before erroring
    idle: 10000,                  // ms a connection can sit idle before release
  },
  dialectOptions: {
    // only needed when the database is on a public endpoint (see SSL below)
    ssl: { require: true, rejectUnauthorized: false },
  },
});

module.exports = sequelize;
```

One more line earns its keep: check the connection at boot instead of finding out on the first request. `authenticate()` runs a trivial query and either confirms the link or throws a clear error you can log and exit on.

```js
// index.js
const sequelize = require("./db");

try {
  await sequelize.authenticate();
  console.log("Database connection OK");
} catch (err) {
  console.error("Unable to connect:", err.message);
  process.exit(1);   // fail fast and loud, don't limp along
}
```

Fail fast is the right call. A process that can't reach its database shouldn't be taking traffic, and a clear crash beats a stream of confusing 500s.

*(Diagram: two PM2 workers, each holding a Sequelize pool with `max: 5`, add up to ten live connections. They cross an internal connection to one managed Postgres or MySQL with automatic backups. The lesson: workers × pool × servers must stay under the database's connection ceiling, so do the multiplication before you pick the number.)*

> **Coming from Prisma, Drizzle, or TypeORM?** Same production ideas, different config surface. See [connect Prisma to a managed database](https://www.kloudbean.com/blog/connect-prisma-to-a-managed-database/), [connect Drizzle to Postgres](https://www.kloudbean.com/blog/connect-drizzle-to-postgres/), and [connect TypeORM to a database](https://www.kloudbean.com/blog/connect-typeorm-to-a-database/). Sequelize's own quirks are its built-in pool and the `sync()` trap below.

## Define a model

A model maps a class to a table. Sequelize gives you two ways to declare one. The modern style extends `Model` and calls `init`; the older `sequelize.define` shorthand still works and you'll see it everywhere. Here's the class form with a small `User`:

```js
// models/user.js
const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

class User extends Model {}

User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  sequelize,
  modelName: "User",
});

module.exports = User;
```

By default Sequelize adds `createdAt` and `updatedAt` timestamps and pluralizes the table name to `Users`. Handy, and also the reason a lot of migration errors mention `Users` with a capital U. One thing the model does not do: defining it never touches the live schema. Creating the table is the migration's job.

![Comparison of database connection in production](images/gen-1-comparison.png)

## Size the Sequelize connection pool

Sequelize is a little different from some ORMs here: it ships its own pool rather than leaning on the raw driver's. You control it through the `pool` block, and the four knobs are worth knowing:

- `max`: the most connections this instance will open. This is the number that matters most.
- `min`: connections kept warm even when idle. Zero is a fine default; a small number trims cold-start latency.
- `acquire`: how long, in milliseconds, a query waits for a free connection before it throws.
- `idle`: how long a connection can sit unused before Sequelize releases it.

Now the part that catches Node developers. A database has a hard ceiling on total connections. Postgres defaults to 100, and each connection is a real server-side process, not a free handle. The Sequelize pool is per process, and Node apps run more than one process.

Run PM2 in cluster mode with four workers and a `max` of 10, and that's not 10 connections, it's 40. Add a second server and you're at 80. Leave `max` unset while you spin up workers and you can walk into `sorry, too many clients already` with no bad line of code anywhere. The rule: `workers × max × servers` stays comfortably under the database ceiling, with headroom for migrations and admin connections. Pick the number deliberately. The deeper mechanics, including when a pooler like PgBouncer helps, are in [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/).

## SSL, dialectOptions, and the pg_hba.conf error

If your database sits on a public endpoint, the connection should be encrypted, and many managed Postgres providers refuse plaintext outright. The tell is a connection that dies immediately with a message like `no pg_hba.conf entry for host "1.2.3.4", user "appuser", database "appdb", no encryption`. That "no encryption" tail is the giveaway: the server wanted SSL and your client tried to connect without it. If the message ends any other way, the problem is the rules rather than your driver, and [pg_hba.conf explained](https://www.kloudbean.com/blog/pg-hba-conf/) covers why a rule you added may never be reached.

Sequelize passes SSL settings through `dialectOptions`, straight to the underlying driver. The quick fix people paste from Stack Overflow:

```js
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false,   // clears the error, but skips cert verification
  },
}
```

A word on `rejectUnauthorized: false`, because it's everywhere and it isn't free. It tells the driver to accept the certificate without checking it against a trusted authority. The handshake succeeds, but you lose the guarantee that you reached the real database and not something in the middle. The stricter version keeps verification on and hands the driver your provider's CA:

```js
const fs = require("fs");

dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: true,
    ca: fs.readFileSync(process.env.DB_CA_CERT).toString(),
  },
}
```

MySQL takes SSL through the same `dialectOptions.ssl` channel, handed to the `mysql2` driver. Here's the opinion I'll defend, though: the cleanest way to deal with database SSL is to not need it. Put the app and the database in the same account, with the database locked to the app server's IP, and it never gets a public address, so nothing is exposed to encrypt in transit. On Kloudbean the app reaches the database internally, so the common setup is a plain internal connection with no public SSL to configure. Fewer moving parts, and one less certificate to renew.

## Run migrations, don't sync() in production

Sequelize has a tempting shortcut called `sequelize.sync()`. It reads your models and creates matching tables. In development it feels magic. In production it's the fastest way to lose data, so let me be blunt about the two dangerous forms.

- `sync({ force: true })` **drops every table first**, then recreates it. Run that against real data and the data is gone. All of it.
- `sync({ alter: true })` tries to reshape existing tables to match your models. It's less brutal, but it makes changes you didn't review and can drop or rewrite columns in ways that surprise you on a live table.

Both are lovely on a laptop and wrong against customer rows. The production answer is migrations: versioned files with an `up` and a `down`, tracked in a table and reviewed before they run. Sequelize ships a CLI for this. A migration that creates our `Users` table:

```js
// migrations/20240101120000-create-users.js
"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("Users");   // the reverse, for rollbacks
  },
};
```

The day-to-day commands are short. Generate a file, apply pending migrations, and roll the last one back if something's off:

```bash
# create a new, empty migration file to fill in
npx sequelize-cli migration:generate --name create-users

# apply all pending migrations (this is the one you run on deploy)
npx sequelize-cli db:migrate

# undo the most recent migration
npx sequelize-cli db:migrate:undo
```

The CLI needs to know how to connect, and you want it reading the same secret your app does. Point it at a config that pulls `DATABASE_URL` from the environment with `use_env_variable`, so there's no second copy of the credentials to keep in sync:

```js
// config/config.js  (referenced from a .sequelizerc)
module.exports = {
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  },
};
```

Then `db:migrate` becomes a deploy step. Run it after the build and before the new version takes traffic, so the schema is always ahead of the code that needs it. On Kloudbean's managed CI/CD you drop `npx sequelize-cli db:migrate` into the deploy step and watch it stream in the live build logs.

![Using Sequelize CLI](images/gen-2-terminal.png)

## Postgres or MySQL: same Sequelize, different dialect

Sequelize speaks several SQL dialects, and switching is mostly a one-word change plus the right driver package. The connection string lives in one environment variable either way:

```bash
# set in Runtime Configuration, Environment Variables (never in code)
DATABASE_URL=postgres://appuser:s3cret@10.0.0.5:5432/appdb
```

For Postgres, set the dialect to `postgres` and install `pg` and `pg-hstore`:

```js
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",              // npm i pg pg-hstore
  pool: { max: 10, idle: 10000 },
});
```

For MySQL, set the dialect to `mysql` and install `mysql2`. The default port shifts from 5432 to 3306, and your connection string uses the `mysql://` scheme:

```js
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "mysql",                 // npm i mysql2
  pool: { max: 10, idle: 10000 },
});
```

MariaDB works the same way with `dialect: "mariadb"` and the `mariadb` package. Your models, queries, and migration commands don't change between engines; a few native column types differ, but the Sequelize surface stays put. Still choosing between the engines? [MySQL vs PostgreSQL](https://www.kloudbean.com/blog/mysql-vs-postgresql/) weighs the tradeoffs without the tribalism.

## Deploy your Sequelize app on Kloudbean, step by step

Everything above assumes a real database on the other end: always on, backed up, patched, locked to your app server's IP instead of open to the world. The whole flow, app and database in one dashboard rather than stitched across providers.

**Step 1. Launch a managed database.** From the console, open DBS and launch PostgreSQL, MySQL, or MariaDB. It arrives provisioned, patched, and on an automatic backup schedule, reachable from your app once you whitelist its IP. No `apt install`, no hand-tuning `postgresql.conf`.

*(Screenshot: DBS, Launch Database in the Kloudbean console. Pick PostgreSQL, MySQL, or MariaDB and it comes up provisioned, patched, and backed up.)*

**Step 2. Put the connection string in an environment variable.** Copy the host, port, database, user, and password into a single `DATABASE_URL` under Runtime Configuration, Environment Variables. Your instance reads it at boot, so the secret never touches your code or Git history. More in [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

*(Screenshot: Runtime Configuration, Environment Variables in the Kloudbean console. DATABASE_URL lives here, out of the repo and easy to rotate.)*

**Step 3. Connect your Git repo and deploy on push.** Link the repository and Kloudbean builds and deploys on every push, with deployment history and live build logs. Most Sequelize apps ride on Express, and the walkthrough for that is [deploy an Express app](https://www.kloudbean.com/blog/deploy-express-app/).

*(Screenshot: the Git deployment screen. Connect a repo and each push builds and deploys, with live logs streaming the whole run.)*

**Step 4. Run migrations as part of the deploy.** Add `npx sequelize-cli db:migrate` to the deploy step so the schema updates before the new code serves a request, and watch it apply in the live build logs. Wiring it through CI? [CI/CD auto-deploy from GitHub](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/) shows the pattern.

![Connection details after launch](images/gen-3-flow.png)

**Step 5. Verify with a health check.** Your `authenticate()` log line is the confirmation. A clean "Database connection OK" in the logs means the string, the network, and the pool all agree. A crash there means fix the config, not the code.

## Sequelize vs Prisma vs Drizzle vs TypeORM

People connecting Sequelize to a database are often quietly wondering whether they backed the right ORM. Fair. One honest line each, no gushing:

| | Sequelize | Prisma | Drizzle | TypeORM |
| --- | --- | --- | --- | --- |
| **Feel** | Mature, JS-first ORM | Generated typed client | Thin, SQL-first | Decorator classes |
| **Schema in** | `Model.init` / `define` | schema.prisma | TS objects | Decorated classes |
| **Migrations** | `sequelize-cli db:migrate` | `migrate deploy` | `drizzle-kit migrate` | `migration:run` |
| **Prod foot-gun** | `sync({ force })` | `migrate dev` in prod | `push` in prod | `synchronize: true` |
| **Reach for it when** | Big existing JS codebase, Express APIs | You want a polished typed client | You want to feel the SQL | You want decorators or NestJS |

Sequelize's strength is age in the good sense: it's battle-tested and works in plain JavaScript without a build step, with answers to almost any question already written down. Prisma leans on a generated, typed client. Drizzle stays deliberately thin and close to SQL. TypeORM centers on decorated entity classes and pairs neatly with NestJS. Already invested in one? Stay. What matters for hosting: all four run on the same managed Postgres or MySQL, so the database choice is independent of the ORM. The sibling guides go deep on [Prisma](https://www.kloudbean.com/blog/connect-prisma-to-a-managed-database/), [Drizzle](https://www.kloudbean.com/blog/connect-drizzle-to-postgres/), and [TypeORM](https://www.kloudbean.com/blog/connect-typeorm-to-a-database/).

## A short security checklist

Nothing exotic here, just the handful of habits that keep a database connection from becoming an incident:

- **Read credentials from the environment, never hardcode them.** Every snippet above uses `process.env`.
- **Keep `.env` out of Git.** Add it to `.gitignore` on day one. A connection string committed once lives in history forever.
- **Whitelist your app server's IP on the database.** When only your app server is allowed to connect, most of the internet can't even try to reach it.
- **Use a least-privilege database user.** Your app doesn't need superuser. Grant it what it uses, nothing more.
- **Rotate passwords, and design so you can.** Because the secret lives in an env var, rotating it is a config change, not a redeploy.
- **Keep automatic backups on.** A managed database backs up on a schedule, the difference between a bad afternoon and a lost business.

## Performance: pooling, indexes, and the N+1 trap

Once it connects cleanly, performance is mostly about three things, and Sequelize makes it easy to trip on the third.

Pooling first, since it's the one that pages you. Size `max` to your real concurrency and remember the per-process multiplier from earlier. Too small and requests queue behind `acquire`; too big and you exhaust the database.

Indexes next. Add them on the columns you filter and join on, like that `unique` email, and let the database do the heavy lifting. When a query feels slow, run `EXPLAIN` (or `EXPLAIN ANALYZE` on Postgres) to see whether it uses an index or scans the whole table.

Then the N+1 trap. It's the quiet Sequelize performance killer. You fetch a list of users, then loop over them and lazily load each user's posts, firing one query per row. Ten users, eleven queries. A thousand, and your endpoint crawls. The fix is eager loading: pull the related rows in one query with `include`.

```js
// N+1: one query for users, then one per user for their posts
const users = await User.findAll();
for (const u of users) {
  u.posts = await u.getPosts();   // fires a query every iteration
}

// eager load: a single query with a JOIN via include
const users = await User.findAll({
  include: [{ model: Post }],
});
```

If a list endpoint got slow after you added a relation, look here first. It's almost always the culprit.

<!-- cta:start -->
**One click to a real database.**

Launch MySQL, MariaDB, PostgreSQL, Redis, Memcached, MongoDB, or Elasticsearch in a click, reachable from your app server with automatic backups from minute one. Standard connection strings, standard dumps, no proprietary format.

- Seven managed engines
- One-click launch
- Automatic backups
- Controlled access
- Standard connection strings
- Free migration assistance

[Start free](https://console.kloudbean.com/register) · [See plans](https://www.kloudbean.com/pricing/)
<!-- cta:end -->

## FAQ

**How do I connect Sequelize to a database in production?**
Create one Sequelize instance that reads your connection string from an environment variable, set the dialect to postgres or mysql, and configure the pool block. Verify the link at boot with authenticate so a bad connection fails fast. Run your migrations on deploy, keep the credentials in the environment, and reach the database over an internal connection locked to your app server's IP so it has no public exposure.

**Should I use sequelize.sync() in production?**
No. sync with force true drops and recreates every table, which destroys data, and sync with alter true makes unreviewed schema changes that can drop or rewrite columns. Both are convenient in local development but dangerous against real rows. In production, manage the schema with sequelize-cli migrations that have reviewable up and down steps.

**How do I run Sequelize migrations on deploy?**
Generate migration files with sequelize-cli, commit them, and run npx sequelize-cli db:migrate as a deploy step after the build and before the new version takes traffic. Point the CLI config at your DATABASE_URL with use_env_variable so it uses the same secret as the app. On a managed CI/CD pipeline you add the command to the deploy step and watch it apply in the live build logs.

**How do I set the Sequelize connection pool size?**
Set the pool block on the Sequelize instance with max, min, acquire, and idle. Choose max deliberately, because the pool is per process. If you run PM2 cluster mode or several servers, multiply workers by max by servers and keep the total comfortably under the database connection ceiling, leaving headroom for migrations and admin connections.

**Why does Sequelize say too many connections or too many clients already?**
The database hit its connection ceiling. Postgres defaults to 100 total connections and reports sorry, too many clients already, while MySQL reports Too many connections. It usually means the Sequelize pool is unbounded or multiplied across many Node processes. Cap the pool max and do the workers by pool by servers arithmetic so the total stays under the limit.

**How do I fix the no pg_hba.conf entry for host error in Sequelize?**
That Postgres error means the server rejected the connection, and when it ends with no encryption it means the server requires SSL and your client connected without it. Add SSL under dialectOptions, for example ssl with require true, or connect from a whitelisted host. When the database has no public endpoint and only your app server's IP is allowed, the error does not come up.

**How do I connect Sequelize to a database over SSL?**
Pass SSL options through dialectOptions.ssl, which Sequelize hands to the underlying driver. Setting rejectUnauthorized to false clears handshake errors but skips certificate verification, so the stricter option supplies the provider CA and keeps verification on. When the app connects to the database internally, as on Kloudbean, with the database locked to the app server's IP, the common setup is a plain internal connection with no public SSL to configure.

**Does Sequelize work with both PostgreSQL and MySQL?**
Yes. Set dialect to postgres and install pg and pg-hstore, or set dialect to mysql and install mysql2, with MariaDB supported through the mariadb dialect. Your models, queries, and migration commands stay the same across engines. A few native column types and functions differ, but the Sequelize surface does not change. All are available as managed engines.

**Sequelize vs Prisma vs Drizzle, which should I use?**
Sequelize is a mature JavaScript-first ORM that fits large existing codebases and Express APIs without a build step. Prisma offers a generated typed client, and Drizzle stays thin and close to SQL. All three are solid and all run on the same managed Postgres or MySQL, so pick on developer preference and existing code rather than database support.

Kloudbean · Define the models, we keep the database alive underneath.
