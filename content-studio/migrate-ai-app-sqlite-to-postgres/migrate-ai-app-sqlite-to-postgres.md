---
title: "How to Migrate Your AI App from SQLite to PostgreSQL"
slug: migrate-ai-app-sqlite-to-postgres
meta_description: "How to migrate SQLite to PostgreSQL for an AI-built app that keeps losing data on redeploy: provision managed Postgres, move the schema and data with pgloader or your ORM, handle the type gotchas, and cut over safely without losing a row."
target_keyword: migrate SQLite to PostgreSQL
secondary_keywords:
  - SQLite to Postgres migration
  - move off SQLite
  - convert SQLite database to Postgres
  - pgloader
  - SQLite vs Postgres types
  - migrate database without losing data
  - AI app database migration
author: Kloudbean
hero_image: images/hero.png
cluster: 1 - Deploy AI / Vibe-Coded Apps
---

![The migration flow: a SQLite file on the left, its schema and data extracted and type-mapped, loaded into a managed Postgres, the app repointed and verified, with the old SQLite kept as a rollback](images/hero.png)

# How to Migrate Your AI App from SQLite to PostgreSQL

Your AI builder handed you a working app and quietly wired it to SQLite. It was perfect on your laptop. Then you deployed, shipped a small fix a week later, and half your data was gone. If that's you, it's time to migrate SQLite to PostgreSQL, and the good news is this is a well-trodden path with real tools, not a rewrite.

This is a migration guide, not a lecture on why SQLite lost your data. We'll provision a managed Postgres, move the schema, move the data, deal with the type differences that actually bite, then cut over without losing a row. The scary part isn't the tooling. It's doing the cutover in the wrong order. So we'll get the order right.

> **The short version:** To migrate SQLite to PostgreSQL, provision a managed Postgres that lives outside your app, then move the schema and data with either pgloader (one command, handles most type mapping for you) or your ORM's migration flow. Fix the type gotchas (AUTOINCREMENT becomes SERIAL, 0/1 booleans become true/false, TEXT dates become timestamptz), reset the sequences, verify row counts match, then repoint `DATABASE_URL` and deploy. Keep the old .db file until you're sure.

## First, why you're moving off SQLite

Quick version, because another page owns the full argument. Your app's filesystem on most hosts is ephemeral. A redeploy builds a fresh instance from your code and throws the old disk away, and your `app.db` file goes with it. The fix isn't a better backup script. It's moving the data into a database that runs as its own service, outside the app process, so deploys never touch it. The full mechanism is in [why your SQLite data disappears on redeploy](https://www.kloudbean.com/blog/why-sqlite-data-disappears-on-redeploy/), and this whole class of "the builder skipped it" problem is mapped in [the last mile of vibe coding](https://www.kloudbean.com/blog/last-mile-of-vibe-coding/).

Postgres is the natural landing spot. It's strict where SQLite is loose, it handles real concurrency, and a managed one is a solved problem to run. If you're still deciding what belongs in a database versus object storage versus a cache, [persistent storage for AI apps](https://www.kloudbean.com/blog/persistent-storage-for-ai-apps/) sorts that out. Assuming you've decided, let's move.

![Key differences for AI app](images/gen-1-comparison.png)

## The plan to migrate SQLite to PostgreSQL

Here's the whole SQLite to Postgres migration in six moves. Read it once so the later detail has somewhere to hang.

1. **Provision a managed Postgres.** A real one, running outside the app, with its own connection string.
2. **Move the schema.** Create the tables in Postgres, with the right Postgres types (not SQLite's loose ones).
3. **Move the data.** Copy every row across, transforming types as you go.
4. **Reset the sequences.** So the next insert doesn't collide with an existing id.
5. **Verify.** Row counts match, and a few spot-checks look right, while the app is still safely on SQLite.
6. **Cut over.** Repoint `DATABASE_URL`, deploy, watch. Keep the old .db as a rollback until you're confident.

<figure>
  <svg viewBox="0 0 800 400" role="img" aria-label="The SQLite to Postgres migration flow. On the left, a SQLite file on the app disk. Its schema and data are extracted, then the types are transformed (AUTOINCREMENT to SERIAL, 0 and 1 to true and false, TEXT to timestamptz), then loaded into a managed Postgres that runs outside the app. Below, the app is repointed by changing DATABASE_URL, then verified by matching row counts. The old SQLite file is kept as a rollback until the cutover is confirmed." xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="mp" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#4F1AF3"/></marker>
      <marker id="mg" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#40b75f"/></marker>
    </defs>

    <text x="28" y="34" font-family="Poppins,sans-serif" font-size="13" font-weight="700" fill="#000f27">Migrating SQLite to managed Postgres</text>

    <rect x="24" y="66" width="132" height="70" rx="12" fill="#fff" stroke="#000f27" stroke-width="1.6"/>
    <text x="90" y="97" text-anchor="middle" font-family="Poppins,sans-serif" font-size="13" font-weight="600" fill="#000f27">SQLite file</text>
    <text x="90" y="116" text-anchor="middle" font-family="Poppins,sans-serif" font-size="10.5" fill="#5b6a86">app.db on disk</text>

    <rect x="210" y="66" width="140" height="70" rx="12" fill="#f6f7fb" stroke="#4F1AF3" stroke-width="1.5"/>
    <text x="280" y="97" text-anchor="middle" font-family="Poppins,sans-serif" font-size="13" font-weight="600" fill="#000f27">Extract</text>
    <text x="280" y="116" text-anchor="middle" font-family="Poppins,sans-serif" font-size="10.5" fill="#5b6a86">schema + data</text>

    <rect x="404" y="66" width="152" height="70" rx="12" fill="#f6f7fb" stroke="#4F1AF3" stroke-width="1.5"/>
    <text x="480" y="93" text-anchor="middle" font-family="Poppins,sans-serif" font-size="13" font-weight="600" fill="#000f27">Transform types</text>
    <text x="480" y="112" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9.5" fill="#5b6a86">SERIAL, bool, timestamptz</text>

    <rect x="612" y="60" width="164" height="82" rx="12" fill="#40b75f"/>
    <text x="694" y="93" text-anchor="middle" font-family="Poppins,sans-serif" font-size="13.5" font-weight="700" fill="#fff">Managed Postgres</text>
    <text x="694" y="113" text-anchor="middle" font-family="Poppins,sans-serif" font-size="10.5" fill="#eafaef">runs outside the app</text>

    <line x1="156" y1="101" x2="206" y2="101" stroke="#4F1AF3" stroke-width="2" marker-end="url(#mp)"/>
    <line x1="350" y1="101" x2="400" y2="101" stroke="#4F1AF3" stroke-width="2" marker-end="url(#mp)"/>
    <line x1="556" y1="101" x2="608" y2="101" stroke="#40b75f" stroke-width="2.4" marker-end="url(#mg)"/>
    <text x="582" y="92" text-anchor="middle" font-family="Poppins,sans-serif" font-size="10" fill="#40b75f">load</text>

    <line x1="694" y1="142" x2="694" y2="236" stroke="#40b75f" stroke-width="2.4" marker-end="url(#mg)"/>

    <rect x="612" y="238" width="164" height="70" rx="12" fill="#fff" stroke="#40b75f" stroke-width="1.6"/>
    <text x="694" y="268" text-anchor="middle" font-family="Poppins,sans-serif" font-size="13" font-weight="600" fill="#000f27">Verify</text>
    <text x="694" y="287" text-anchor="middle" font-family="Poppins,sans-serif" font-size="10" fill="#5b6a86">row counts + spot checks</text>

    <rect x="404" y="238" width="152" height="70" rx="12" fill="#f6f7fb" stroke="#4F1AF3" stroke-width="1.5"/>
    <text x="480" y="268" text-anchor="middle" font-family="Poppins,sans-serif" font-size="13" font-weight="600" fill="#000f27">Repoint app</text>
    <text x="480" y="287" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9.5" fill="#5b6a86">change DATABASE_URL</text>

    <rect x="212" y="238" width="140" height="70" rx="12" fill="#000f27"/>
    <text x="282" y="268" text-anchor="middle" font-family="Poppins,sans-serif" font-size="13" font-weight="600" fill="#fff">Cut over</text>
    <text x="282" y="287" text-anchor="middle" font-family="Poppins,sans-serif" font-size="10" fill="#9fb0cc">deploy + watch</text>

    <line x1="610" y1="273" x2="560" y2="273" stroke="#40b75f" stroke-width="2" marker-end="url(#mg)"/>
    <text x="585" y="264" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9.5" fill="#40b75f">match?</text>
    <line x1="402" y1="273" x2="356" y2="273" stroke="#4F1AF3" stroke-width="2" marker-end="url(#mp)"/>

    <rect x="24" y="238" width="160" height="70" rx="12" fill="#fff" stroke="#000f27" stroke-width="1.4" stroke-dasharray="6 5"/>
    <text x="104" y="266" text-anchor="middle" font-family="Poppins,sans-serif" font-size="11.5" font-weight="600" fill="#000f27">Keep old SQLite</text>
    <text x="104" y="284" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9.5" fill="#5b6a86">rollback until verified</text>
    <line x1="90" y1="136" x2="90" y2="236" stroke="#000f27" stroke-width="1.3" stroke-dasharray="4 4" marker-end="url(#mp)"/>
  </svg>
  <figcaption>Extract, transform types, load into a managed Postgres, then verify before you repoint the app. The old SQLite file stays put as a rollback until the cutover is confirmed.</figcaption>
</figure>

Provisioning the Postgres is the one step you don't have to script. On a managed platform you create the database from a dashboard and get a connection string back. On Kloudbean that's the Databases section: pick PostgreSQL, name it, and you're handed credentials, with automatic backups running from the moment it exists. Do that first, before you touch the data, because step 5 depends on being able to compare a full SQLite file against a real Postgres you can query. If you've never wired a managed database into an app before, [add a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/) walks the wiring, and [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) covers running it day to day.

## The type and dialect gotchas that actually bite

This is the part generic tutorials skip, and it's the part that fails your import at 11pm. SQLite is loosely typed. It'll happily store a string in a column you meant to be a number, and it treats a lot of types as suggestions. Postgres is strict. It checks every value against the column type and rejects anything that doesn't fit. So the migration isn't only a copy. It's a cleanup.

Five differences cause almost all the pain when you convert a SQLite database to Postgres:

- **AUTOINCREMENT primary keys.** SQLite's `INTEGER PRIMARY KEY AUTOINCREMENT` becomes a Postgres `SERIAL` or, better on modern Postgres, an `IDENTITY` column backed by a sequence.
- **Loose typing, mixed values.** A SQLite column can hold a number in one row and text in another. Postgres won't. Find and clean those rows before the import, or the load aborts partway.
- **Booleans stored as 0 and 1.** SQLite has no real boolean, so your ORM probably stored `0`/`1` (or `'t'`/`'f'`). Postgres wants a true `boolean`. These need converting.
- **Dates and times stored as TEXT.** SQLite often keeps timestamps as strings. In Postgres you want `timestamptz`. Pick a convention (store UTC), and convert the strings as you load.
- **The sequence after import.** Even after ids copy over fine, Postgres doesn't know the highest id you used. Its sequence still starts at 1, so the next insert collides. You have to reset it.

| SQLite (loose) | Postgres (strict) | What to watch |
| --- | --- | --- |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL` / `GENERATED AS IDENTITY` | Reset the sequence after the data loads, or the next insert collides |
| Dynamic typing (any value, any column) | Static typing, checked per row | Clean mixed-type rows first; Postgres rejects what SQLite tolerated |
| `INTEGER` used as boolean (0 / 1) | `boolean` (true / false) | Convert 0 and 1 to false and true; don't leave a smallint pretending to be a flag |
| Dates as `TEXT` | `timestamptz` (or `date`) | Decide UTC, parse the strings; a bad format string quietly shifts times |
| `REAL` for money | `numeric` | Floating point drift; use exact `numeric` for currency |

Once you're actually on Postgres, it's worth designing the schema like you mean it (indexes, constraints, sensible types), which [production database design for AI apps](https://www.kloudbean.com/blog/production-database-design-for-ai-apps/) walks through. A migration is a rare good moment to fix the sloppy bits your builder generated.

## Path A: pgloader, the tool built for exactly this

If your data lives in a single SQLite file, pgloader is the shortest honest path. It's an open-source tool whose entire job is reading from one database and loading into Postgres, and it already knows the common SQLite-to-Postgres type mappings. It'll turn integer booleans into booleans, map the primary keys, and create the tables for you. One command does a surprising amount.

The simplest form points pgloader straight at your file and your new database:

```
pgloader ./app.db postgresql://USER:PASSWORD@HOST:5432/appdb
```

For anything beyond a toy database, use a load file so you can set options and casting rules. The shape looks like this (check pgloader's current docs for the exact casting syntax, since it evolves):

```
LOAD DATABASE
  FROM sqlite:///data/app.db
  INTO postgresql://USER:PASSWORD@HOST:5432/appdb

WITH include drop, create tables, create indexes, reset sequences

CAST type integer to bigint,
     column users.is_active to boolean;
```

Notice `reset sequences` in there. That's pgloader handling gotcha number five for you, which is one big reason to prefer it over a hand-rolled dump. When it finishes it prints a summary table: rows read, rows loaded, and any that errored. Read that summary. If the counts don't match, something got rejected and you want to know before you cut over, not after.

![pgloader's end-of-run summary: rows read and rows loaded per table](images/gen-2-terminal.png)

pgloader isn't the answer for everyone. If your app already manages its schema through an ORM, running pgloader can leave the ORM's migration history out of step with reality. In that case, path B is cleaner.

## Path B: let your ORM handle the switch

If you use Prisma, Drizzle, Sequelize, Django, or Rails, your schema is defined in code and applied through migrations. So you don't dump and load here. You change the database provider, generate a fresh Postgres migration, then move the data across.

The provider change is usually a one-liner. In Prisma, you edit the datasource block:

```
datasource db {
-  provider = "sqlite"
-  url      = "file:./dev.db"
+  provider = "postgresql"
+  url      = env("DATABASE_URL")
}
```

Then you point `DATABASE_URL` at the new Postgres, generate a migration against it, and apply it so the tables exist with Postgres types. The exact commands differ by tool (`prisma migrate`, `drizzle-kit`, `django migrate`, `rails db:migrate`), so follow your ORM's current docs rather than trusting my memory of the flags. The pattern is the same across all of them: change the dialect, regenerate the schema for Postgres, then import the rows.

For the data itself you've got options. A small dataset can go through a short script that reads from SQLite and writes through your ORM, which reuses your existing validation and type coercion. That's often the cleanest for AI-built apps, because your model definitions already describe the correct Postgres types. For a quick look at what's inside the file before you script anything, `.dump` is handy:

```
sqlite3 app.db .dump > dump.sql
```

You won't usually replay that dump straight into Postgres (the SQL dialects differ), but reading it tells you exactly which tables, columns, and quirks you're dealing with. Treat it as a map, not a migration.

## Cut over safely, without losing a row

This is where people actually lose data, and it's avoidable. The rule: migrate into the new Postgres while the app is still running on SQLite. Nothing about the old setup changes until the new one is proven.

So the safe order is:

1. Load everything into Postgres (path A or B).
2. Reset the sequences if the tool didn't. For each table with a serial id: `SELECT setval('users_id_seq', (SELECT max(id) FROM users));`
3. Verify. Count rows per table in both databases and compare. `SELECT count(*) FROM users;` on each side should match. Then spot-check a few real records, especially ones with dates and booleans, since those are the values most likely to have shifted.
4. Only now, repoint `DATABASE_URL` at Postgres and deploy.
5. Watch the app. Keep the old SQLite file untouched for a while. If anything looks wrong, you flip `DATABASE_URL` back and you're exactly where you started.

Steps 4 and 5 are only calm if changing one environment variable is genuinely easy. That's worth checking before you start, because on some setups it means rebuilding an image or editing a file over SSH, and nobody wants to discover that mid-cutover. On Kloudbean environment variables are console fields on the application, so repointing `DATABASE_URL` and restarting is a small edit, and rolling back is the same edit in reverse. Make sure whatever you're on gives you that, one way or another. A rollback you can't perform in a minute isn't a rollback.

And here's the anti-pattern that catches people, because it looks like success. You repoint the app at a brand-new, empty Postgres and deploy before moving the data. The app boots. No errors. It "works." Except it's a fresh install with zero rows, and if any code path writes before you notice, you now have data split across two databases and a real mess to reconcile. An empty database that starts clean is not the same as a migrated one. Verify row counts before you trust a green deploy.

![Before cutover](images/gen-3-flow.png)

Do the migration now, while the data is still small. That's the one strong opinion I'll push here. Every week you leave an AI app on SQLite in production, the dataset grows, more real users depend on it, and the cutover gets riskier. The migration you do at 200 rows is a coffee break. The one you keep putting off until 200,000 rows and paying customers is a maintenance window with your heart rate up. Small is easy. Waiting only makes it harder.

One more thing for after cutover. Postgres has a real connection limit, and a busy app (or a serverless one opening a fresh connection per request) can exhaust it fast. If you see connection errors under load, that's expected, and [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/) is the fix. SQLite never made you think about this because it was just a file. Postgres is a server, so plan for it. This is quietly easier if your app runs as a long-lived process rather than a function, which is how apps run on Kloudbean: one process, one pool, connections reused across requests. Functions are where people burn through a connection limit, because each cold instance opens its own.

## The cheapest setup that actually survives a redeploy

You don't need a replicated cluster, a read replica, or a connection proxy to get off SQLite. Most AI-built apps at this stage need four things, and the whole bill is one small server plus one small database. Here's the minimum that's genuinely production-shaped, not a toy:

1. **One managed Postgres, running as its own service.** Not a container next to your app, not a file on the disk. Its own thing, with its own lifecycle, so a deploy has no way to touch it.
2. **The connection string in an environment variable.** Never in the repo. This is also what makes your rollback a one-field edit.
3. **Backups on, and one restore actually tested.** A backup you've never restored is a hope. Restore into a scratch database once and query it.
4. **The database reachable only from your app server's IP.** One allow rule. Everything else refused.

That's it. On Kloudbean those four are the default path rather than four separate projects: managed PostgreSQL in the same dashboard as the app, environment variables as console fields, automatic plus on-demand backups, and IP Access Control to whitelist the app server. Postgres is one of seven managed engines there, which matters later when you want Redis in front of it, less so today. Standard plans start at $8/mo, and if the app you're moving sits on a server above 4GB, migration help is free, which is worth taking on your first cutover.

Be precise about that fourth item though, because a lot of writing on this is sloppy, including some of ours in the past. On a standard plan the database is locked down by IP allow-listing, not hidden on a private network. It has an endpoint; the allow rule is what makes reaching it useless for anyone else. Running it inside a VPC is an Enterprise capability, so don't design around it unless you're on that plan.

And the part no host fixes, ours included: nothing on this page happens automatically. No platform finds the row where a text value snuck into an integer column, decides whether your `created_at` strings are UTC, or resets `users_id_seq` for you. Provisioning is a few clicks anywhere decent. The cleanup is the migration, and it's yours. What managed hosting buys is that the database keeps existing after you're done, which is the whole reason you're here.

<!-- cta:start -->
**A rehoming, not a rewrite.**

Standard code moves onto a standard Linux server, so this is a migration rather than a rewrite. Pick from seven clouds, keep push-to-deploy, and get help moving the first workload across.

- Free migration assistance
- Free trial
- Seven cloud providers
- Flat monthly price
- Managed databases
- Git deploy

[Start free](https://console.kloudbean.com/register) · [See plans](https://www.kloudbean.com/pricing/)
<!-- cta:end -->

## FAQ

**How do I migrate SQLite to Postgres?**
Provision a managed Postgres, then move the schema and data with either pgloader (one command that reads your .db file and handles most type mapping) or your ORM's migration flow. Reset the sequences, verify that row counts match while the app is still on SQLite, then repoint `DATABASE_URL` and deploy. Keep the old file as a rollback until you're confident.

**Will I lose data migrating from SQLite to Postgres?**
Not if you do the cutover in the right order. Migrate into the new Postgres while the app still runs on SQLite, compare row counts on both sides, and spot-check a few records before you repoint anything. Because the old .db file stays untouched until you're sure, you can always roll back. Data loss comes from repointing first and verifying later.

**What is pgloader?**
pgloader is an open-source tool built to load data into PostgreSQL from other databases, including SQLite. Point it at your SQLite file and your Postgres connection string and it creates the tables, copies the rows, maps common types, and can reset sequences for you. For anything past a toy database, use a load file so you can set casting rules explicitly.

**How do I convert SQLite types to Postgres?**
Map the loose SQLite types to strict Postgres ones: AUTOINCREMENT integer keys become SERIAL or IDENTITY, 0/1 booleans become real true/false, TEXT timestamps become timestamptz (store UTC), and floats used for money become numeric. pgloader handles most of this automatically; with the ORM path your model definitions describe the correct Postgres types. Clean mixed-type rows first, since Postgres rejects what SQLite tolerated.

**Can I migrate SQLite to Postgres using my ORM (Prisma, Drizzle, Django, Rails)?**
Yes, and it's often the cleaner route if your schema lives in code. Change the database provider or dialect from SQLite to PostgreSQL, generate a fresh migration against the new database so the tables exist with Postgres types, then move the rows (a short script that reads SQLite and writes through the ORM reuses your existing validation). Check your ORM's current docs for the exact commands.

**Why do I need to reset the sequence after importing into Postgres?**
Because copying the id values doesn't tell Postgres what the next id should be. The sequence behind a SERIAL column still starts at 1, so your next insert tries to reuse an id that already exists and fails on a duplicate key. Run setval to move the sequence past your highest existing id. pgloader's reset sequences option does this for you.

**How long does a SQLite to Postgres migration take?**
For a small AI-built app, minutes. pgloader on a modest file is fast, and the real time goes into verifying and testing, not copying. This is exactly why you should do it early: the migration scales with your data size and your risk tolerance, so a small dataset is quick and low-stakes while a large one becomes a planned maintenance window.

**Do I need to change my application code to move off SQLite?**
Usually a little. The connection string changes, and if you use an ORM you switch the provider from SQLite to PostgreSQL. Raw SQL might need small tweaks where the dialects differ (booleans, date functions, autoincrement). Most app logic stays the same, because the ORM or driver abstracts the database. The bigger change is operational: Postgres is a service with a connection limit, not a file.

**Is SQLite ever fine to use in production?**
Sometimes, yes. SQLite is excellent for local development, for read-heavy apps on a single server with a genuinely persistent disk, and for embedded use. The trouble is deploying it on an ephemeral filesystem where every redeploy wipes the file, which is the default on most app platforms. If your data must survive deploys and concurrent writes, move to Postgres.

**Do I need connection pooling after switching to Postgres?**
Probably, once you have real traffic. Postgres caps how many connections it allows, and an app that opens a connection per request (or a serverless one) can hit that ceiling and start throwing errors. A pool reuses a small set of connections instead. SQLite never surfaced this because it was a file, so it's a new thing to plan for once you're on a database server.

---

*Kloudbean · Move the data first, repoint second, keep the old file until you're sure.*
