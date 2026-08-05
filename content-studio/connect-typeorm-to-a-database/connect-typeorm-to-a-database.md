# How to Connect TypeORM to a Database in Production

By the Kloudbean Node Team · TypeORM, wired to prod.

TypeORM feels great on your laptop. You add a decorator, restart, and the table just appears. Then you connect TypeORM to a database in production and that same convenience turns into a foot-gun. This guide covers the whole production wiring: a real `DataSource` built from environment variables, entities and migrations, the connection pool, and the one setting that quietly deletes columns if you leave it on. TypeORM with PostgreSQL and MySQL, real code you can paste.

> **The short version**
>
> To connect TypeORM to a database in production, build a `DataSource` that reads your connection string from `process.env`, list your entities and a `migrations` glob, and set `synchronize: false`. Manage schema changes with `typeorm migration:generate` and `migration:run` instead of auto-sync. Cap the pool with `poolSize` or `extra.max` so many processes don't exhaust the database, and reach the database over a private network so you rarely need public SSL at all.

## What is a TypeORM DataSource?

Everything starts with the `DataSource`. Older TypeORM used `createConnection()`; since 0.3 the `DataSource` is the object holding your connection settings, entities, migrations, and the driver's connection pool. You create it once, call `initialize()` once, and share it for the life of the process.

Here's a production-shaped DataSource that reads a single connection string from the environment:

```ts
// data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",                 // or "mysql"
  url: process.env.DATABASE_URL,    // one connection string, from the env
  entities: [User],
  migrations: ["dist/migrations/*.js"],
  synchronize: false,               // never true in production
  logging: false,
});
```

That `import "reflect-metadata"` line at the top isn't decoration. TypeORM reads your decorators through it, so without it your entities misbehave. Import it once, first thing.

Prefer discrete fields over a URL? TypeORM takes host, port, user, and password just as happily, the shape you'll reach for when the database hands you separate values:

```ts
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),   // 5432 Postgres, 3306 MySQL
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [User],
  migrations: ["dist/migrations/*.js"],
  synchronize: false,
});
```

Then initialize it before your app serves a request:

```ts
// index.ts
import { AppDataSource } from "./data-source";

await AppDataSource.initialize();
console.log("Data Source ready");
```

Both forms describe the same thing: a Node process, one DataSource holding a pool, a database at the other end. Keep the private network in that picture. One DataSource per process holds the pool, and it reaches the managed database over a private network, not the open internet.

> **Coming from Prisma or Drizzle?** Same production ideas, different config surface. See [connect Prisma to a managed database](https://www.kloudbean.com/blog/connect-prisma-to-a-managed-database/) and [connect Drizzle to Postgres](https://www.kloudbean.com/blog/connect-drizzle-to-postgres/). TypeORM's distinctive bits are the decorated entity classes and the `synchronize` setting below.

## Defining TypeORM entities

An entity is a class with decorators that map to a table. This is the part TypeORM developers already know, so I'll keep it short. A small `User`:

```ts
// entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

One production note about the `entities` array. In dev people use a glob like `src/**/*.ts`. In production you run compiled JavaScript, so the glob has to point at `dist` and `.js`, or you import the classes directly as above. Get it wrong and TypeORM finds zero entities, then throws `EntityMetadataNotFoundError: No metadata for "User" was found.` Importing classes explicitly is the boring, reliable choice.

<!-- ADD IMAGE: Your editor open on entities/User.ts, decorators visible. -->

## The synchronize trap: never use synchronize true in production

This is the single most important line in the whole article, so I'll be blunt. **Set `synchronize: false` in production. Always.**

Here's what `synchronize: true` actually does. On every boot TypeORM compares your entities to the live database and alters the database to match. New property? It adds the column. Renamed one? TypeORM doesn't see a rename. It sees an old column mapping to nothing and a new one that does, so it drops the old column and creates the new. The data in it is gone. No prompt, no migration file, no undo.

On your laptop that's a lovely feature. You iterate fast, the schema keeps up. Against a table of real customer rows, it's a way to lose data on a routine deploy: a harmless-looking rename ships, sync runs on boot, and the column is gone. A common way TypeORM apps get burned. The fix costs nothing. Turn it off and drive schema changes with migrations.

*(Diagram: same entity change, two outcomes. With sync on, a rename can drop a column on boot and lose the data. With `synchronize: false` plus migrations, the same change becomes a reviewable SQL file you apply on deploy, reversible and safe.)*

## How do I run TypeORM migrations?

Migrations are versioned SQL files TypeORM tracks in a `migrations` table. You generate one by diffing entities against the database, commit it to Git, and run it on deploy. Three commands do almost everything.

With TypeScript, the cleanest setup is a few package.json scripts that point the CLI at your DataSource. Modern TypeORM ships `typeorm-ts-node-commonjs` for exactly this:

```json
// package.json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs -d ./src/data-source.ts",
    "migration:generate": "npm run typeorm -- migration:generate ./src/migrations/Change",
    "migration:run": "npm run typeorm -- migration:run",
    "migration:revert": "npm run typeorm -- migration:revert"
  }
}
```

Then the day-to-day flow:

```bash
# 1. change an entity, then diff it into a new migration file
npm run migration:generate

# 2. apply pending migrations (this is the one you run on deploy)
npm run migration:run

# 3. roll back the most recent migration if something's wrong
npm run migration:revert
```

Generate locally, review the SQL it produced (the step people skip, and the whole point of migrations), commit the file, and let production run it. If TypeORM prints `No changes in database schema were found - cannot generate a migration`, your entities already match the database. Nothing to do.

Two ways to trigger the run on deploy. Call `npm run migration:run` as an explicit deploy step, which I prefer because it's visible in the logs. Or let the DataSource run pending migrations itself on startup:

```ts
export const AppDataSource = new DataSource({
  // ...
  migrationsRun: true,   // run pending migrations automatically on initialize()
});
```

`migrationsRun` is convenient, but with several instances booting at once you get multiple migrations racing. For one instance it's fine. For anything bigger, run migrations as a dedicated step before the new version takes traffic. On Kloudbean's managed CI/CD you drop `npm run migration:run` into the deploy step and watch it stream in the live build logs.

<!-- ADD IMAGE: Deploy logs with migration:run applying a pending migration. -->

## Configuring the TypeORM connection pool

TypeORM doesn't invent its own pool. It uses the underlying driver's pool: `pg` for Postgres, `mysql2` for MySQL. Your job is to cap it at a number you actually chose. The simple option is `poolSize`, which maps to the driver's max:

```ts
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  poolSize: 10,                 // cap the pool at 10 connections
});
```

Need finer control, or a driver-specific option? Pass it through `extra`, which TypeORM hands straight to the driver. For `pg`:

```ts
extra: {
  max: 10,                      // pg Pool max connections
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
}
```

For MySQL the equivalent is `connectionLimit`:

```ts
extra: { connectionLimit: 10 }
```

Why bother? A database has a hard ceiling on total connections. Postgres defaults to 100, and every connection is a real server-side process. Once they're all taken, the next query gets `sorry, too many clients already` and your app looks down even though the code is fine.

Here's the multiplier that catches Node developers: the pool is per process, and Node apps run several. Use PM2 cluster mode with four workers and that's four pools, so a "pool of 10" is really 40 connections. Add a second server, 80. Easy to forget: `workers x poolSize x servers` has to stay comfortably under the database's ceiling. Pick the size on purpose. The deeper mechanics, including when to add PgBouncer, are in [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/).

*(Screenshot: server health showing CPU, RAM and disk in the Kloudbean console. Watch resource use as you tune pool size and worker count.)*

## Connecting over SSL, and why the private network wins

If your database sits behind a public endpoint, the connection should be encrypted, and many managed providers require it. TypeORM passes SSL options through `extra`:

```ts
extra: {
  ssl: { rejectUnauthorized: false },   // see the caveat below
}
```

A word on `rejectUnauthorized: false`, since it's everywhere and isn't free. It tells the driver to accept the certificate without checking it against a trusted CA, which clears the handshake error but stops you confirming you reached the real database. The stricter version supplies the provider's CA and keeps verification on:

```ts
import { readFileSync } from "fs";

extra: {
  ssl: {
    rejectUnauthorized: true,
    ca: readFileSync(process.env.DB_CA_CERT_PATH!).toString(),
  },
}
```

An opinion I'll defend: the cleanest way to handle database SSL is to not need it. If your app and database share a private network, the database never gets a public address, so there's nothing exposed to the internet to encrypt. On Kloudbean the app reaches the database internally, so the usual setup is a plain internal connection, no public SSL to configure. Fewer moving parts, smaller attack surface.

## Keep the connection string in the environment

Every snippet reads `process.env`, and that's deliberate. The connection string is a secret, and secrets don't belong in your source, your Git history, or a Slack screenshot. On Kloudbean you set them under Runtime Configuration, Environment Variables, and the app reads them at boot.

```bash
# set in Runtime Configuration, Environment Variables (not in code)
DATABASE_URL=postgresql://appuser:s3cret@10.0.0.5:5432/appdb
```

Keeping it in the environment means you can rotate a leaked password without a code change, and nobody accidentally commits prod credentials. Fuller treatment, including per-environment values, in [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

## Using TypeORM with NestJS

On NestJS the ideas above don't change, only the wiring does. Instead of a bare `DataSource` you register `TypeOrmModule.forRoot` (or `forRootAsync` when you need config injected). Same two production settings: read from the env, and `synchronize: false`.

```ts
// app.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      entities: [User],
      migrations: ["dist/migrations/*.js"],
      synchronize: false,
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

NestJS is a Node framework, so it runs on the managed Node runtime like any Express or Fastify app. The full walkthrough of getting one live is in [deploy a NestJS app](https://www.kloudbean.com/blog/deploy-nestjs-app/).

## TypeORM vs Prisma vs Drizzle

People connecting TypeORM to a database are often quietly asking if they picked the right tool. Fair question. Honest one-line-each, no gushing:

| | TypeORM | Prisma | Drizzle |
| --- | --- | --- | --- |
| **Schema lives in** | Decorated TS classes | schema.prisma DSL | Plain TS objects |
| **Feel** | Full classic ORM | Generated typed client | Thin, SQL-first |
| **Migrations** | `migration:generate` / `run` | `migrate dev` / `deploy` | `drizzle-kit generate` / `migrate` |
| **Prod foot-gun** | `synchronize: true` | `migrate dev` in prod | `push` in prod |
| **Reach for it when** | You want decorators, NestJS, an established ORM | You want a polished generated client | You want to feel the SQL |

TypeORM's strength is being a mature, full ORM with first-class decorator and NestJS support, plus a huge base of existing code and answers to lean on. Already invested? Stay. Weighing the field? The sibling guides go deep on each: [Prisma](https://www.kloudbean.com/blog/connect-prisma-to-a-managed-database/) and [Drizzle](https://www.kloudbean.com/blog/connect-drizzle-to-postgres/). All three run on the same managed Postgres or MySQL, so the database choice is independent of the ORM.

## Where TypeORM breaks in production

Almost every TypeORM production problem comes down to configuration, not the library. A short field guide to the usual evening-killers:

- **Left `synchronize: true` on.** The big one. A deploy quietly alters or drops columns. Set it `false` and use migrations.
- **Entities glob points at `.ts` in production.** You ship `.js`, TypeORM finds nothing, and you get `EntityMetadataNotFoundError`. Point globs at `dist` or import the classes.
- **Forgot `import "reflect-metadata"`.** Decorator metadata never loads and entities misbehave. Import it first, at the entry point.
- **Never ran migrations.** First query hits a missing table: `QueryFailedError: relation "user" does not exist`. Make `migration:run` part of deploy.
- **No pool cap with PM2 cluster.** Four workers times a default pool, times two servers, and you meet `sorry, too many clients already`. Do the multiplication.
- **Committed the `.env`.** The real connection string lands in Git forever. Keep it in the environment.

One more, quieter: eager relations. Load a list of users and, because a relation is eager or you passed `relations` broadly, you can fire a query per row without noticing. That's the classic N+1, and TypeORM makes it comfortable to trip over. Slow list endpoint? Check there first. Full breakdown in [the N+1 query problem](https://www.kloudbean.com/blog/n-plus-one-query-problem/).

## Connect TypeORM to a managed database on Kloudbean

Everything above assumes a real database on the other end: always-on, backed up, patched, on a private network rather than open to the world. That's a managed database, near enough exactly.

*(Screenshot: DBS, Launch Database in the Kloudbean console. Pick PostgreSQL, MySQL, or MariaDB and it arrives provisioned, patched, and backed up.)*

The flow is short. Launch a managed PostgreSQL, MySQL, or MariaDB, copy the host, port, database, user, and password into your environment variables, then deploy your Node or NestJS app on the same server so the two share a private network. Point your DataSource at it and run your migrations. One dashboard for the app, the database, the backups, and the env vars, no separate providers to stitch together. The framework-agnostic pillar is [add a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/), and the engine deep-dive is [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/).

<!-- ADD IMAGE: The connection details panel after launch: host, port, database, user. -->

---

**Give your TypeORM app a database built for production.**

Launch managed PostgreSQL or MySQL, drop the connection string into one environment variable, set `synchronize: false`, and run your migrations on a private network with automatic backups. Start free at [kloudbean.com](https://www.kloudbean.com/), see plans from $8/mo on [pricing](https://www.kloudbean.com/pricing/).

One-click databases · Automatic backups · Private networking · Env vars in the UI · Free migration · Free trial

## FAQ

**How do I connect TypeORM to a database in production?**
Create a DataSource that reads your connection string from an environment variable, list your entities and a migrations glob that points at your compiled output, and set synchronize to false. Call initialize once when the app starts. Run your migrations on deploy, cap the connection pool, and reach the database over a private network so it has no public exposure.

**What is a TypeORM DataSource?**
The DataSource is the object that holds your connection settings, entities, migrations, and the driver connection pool. Since TypeORM 0.3 it replaces the older createConnection call. You create one DataSource, call initialize once, and share it for the life of the process rather than creating a new one per request.

**Should I use synchronize in production?**
No. synchronize true makes TypeORM alter the database to match your entities on every boot, and a renamed property is seen as a dropped column plus a new one, which loses data with no prompt and no undo. It is convenient in local development but dangerous against real data. Set synchronize false in production and manage schema changes with migrations.

**How do I run TypeORM migrations?**
Change an entity, then run typeorm migration:generate to diff it into a new SQL migration file. Review the generated SQL, commit it, and run typeorm migration:run to apply pending migrations, typically as a deploy step. Use migration:revert to roll back the most recent one. You can also set migrationsRun true to apply pending migrations automatically on initialize.

**How do I configure the TypeORM connection pool?**
TypeORM uses the underlying driver pool, so set poolSize for a simple cap, or pass driver options through extra, such as max for the pg driver or connectionLimit for mysql2. Choose the number deliberately, because the pool is per process. If you run PM2 cluster mode or several servers, multiply workers by pool size by servers and keep the total under the database connection ceiling.

**How do I connect TypeORM to a database over SSL?**
Pass SSL options through the extra field, for example ssl with rejectUnauthorized. Setting rejectUnauthorized to false stops handshake errors but skips certificate verification, so the stricter option is to supply the provider CA and keep verification on. When the app and database share a private network, as on Kloudbean, the common setup is a plain internal connection with no public SSL to configure.

**TypeORM vs Prisma, which should I use?**
TypeORM is a mature full ORM built around decorated entity classes with strong NestJS support, so it fits teams that want a classic ORM and a large existing ecosystem. Prisma offers a generated, typed client that some teams find quicker to start with. Both are solid and both run on the same managed Postgres or MySQL, so pick on developer preference rather than database support.

**How do I use TypeORM with NestJS?**
Register TypeOrmModule.forRoot, or forRootAsync when you need injected config, with the same production settings: read the connection from the environment and keep synchronize false. Use autoLoadEntities so registered entities are picked up. NestJS is a Node framework, so it deploys on a managed Node runtime like any other Node app.

**Why does TypeORM say EntityMetadataNotFound or relation does not exist?**
EntityMetadataNotFoundError usually means TypeORM did not load your entities, often because the entities glob points at .ts files while production runs compiled .js, or because reflect-metadata was not imported. A relation does not exist error usually means migrations never ran, so the table is missing. Point globs at your compiled output or import entities directly, and run migrations on deploy.

**Does TypeORM work with both PostgreSQL and MySQL?**
Yes. Set type to postgres or mysql and provide the matching connection details, and the entity and repository code you write stays the same. A few native types and behaviors differ between the engines, but your DataSource, entities, and migration commands do not change. Both are available as managed engines, alongside MariaDB.

Kloudbean · Decorators up top, a managed database doing the real work underneath.
