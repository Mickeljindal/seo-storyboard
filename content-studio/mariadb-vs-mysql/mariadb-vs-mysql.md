# MariaDB vs MySQL: Which One Should You Actually Run?

Install "MySQL" on a lot of Linux boxes today and you'll quietly get MariaDB instead. That's how close these two are. MariaDB vs MySQL sounds like a big architectural decision, and for most apps it just isn't, because they grew from the same source code and still share the bulk of it. They have drifted since 2009 though, and the gaps matter in a few specific places: licensing, JSON, high-availability clustering, and who controls the roadmap. Here's the fair version, from a team that runs both as managed engines.

> **The short version:** MariaDB and MySQL share DNA. MariaDB was forked from MySQL in 2009 and stayed broadly compatible, so for a typical web app either one is a solid pick. The real split is governance: MariaDB is fully open and community-run under the MariaDB Foundation, while MySQL is Oracle-owned, dual-licensed, and sells a paid Enterprise edition. They've diverged in spots (JSON storage, some functions, clustering tech), so test rather than assume one drops straight into the other. On Kloudbean both are one-click managed engines, so trying either, or moving between them, is low-risk.

## The honest 30-second answer

For a typical web app, treat MariaDB and MySQL as near-interchangeable. Both are fast, stable, battle-tested, and boring in the way you want a database to be boring.

**Pick MariaDB** if you want a fully open database with community governance, no single corporate owner, and a few extras that ship in the free build: more storage engines, a built-in thread pool, some convenient syntax.

**Pick MySQL** if you want the reference implementation that ORMs and tools are tested against first, the largest ecosystem and hiring pool, first-class support on every managed cloud, and Oracle's commercial backing behind it.

Neither is a wrong answer for most projects. It gets real only at the edges: heavy JSON work leans MySQL, a shop that wants one commercial vendor with a support contract leans MySQL Enterprise, and a team that would rather not depend on Oracle leans MariaDB. Honestly? Most teams overthink this. If your framework, host, or team already assumes one, use that and get back to building.

## Why there are two databases in the first place

MySQL was born in 1995, built by a small Swedish company called MySQL AB. Sun Microsystems bought that company in 2008. Then in 2009 Oracle moved to acquire Sun, and with it, MySQL.

Michael "Monty" Widenius, one of MySQL's original authors, wasn't comfortable with the world's most popular open-source database sitting inside Oracle, a company that also sold a competing commercial database. So he forked the MySQL code and started MariaDB. He'd named MySQL after his daughter My. He named the fork after another daughter, Maria.

The whole point of the fork was to keep a version of MySQL that would stay open no matter what happened to the original. Today the MariaDB Foundation stewards the open-source project and its promise to remain free software, while MySQL carries on under Oracle. Same roots, two owners, two philosophies. Almost every difference below flows from that one split.

<!-- ADD IMAGE (diagram in HTML): timeline of MySQL (1995) -> Oracle acquires via Sun (2009) -> MariaDB fork, with community-governed vs Oracle-owned paths -->

*Diagram: MySQL (1995) passes to Oracle via the 2009 Sun acquisition; MariaDB forks off to stay community-governed and fully open.*

## MariaDB vs MySQL at a glance

You'll see this written both ways, MariaDB vs MySQL and MySQL vs MariaDB. Same comparison. Here's the difference between MariaDB and MySQL in one table, then a closer look at the rows that actually change a decision.

| | MariaDB | MySQL |
| --- | --- | --- |
| **Origin & governance** | Fork of MySQL (2009), MariaDB Foundation, community-governed | Original (1995), owned by Oracle |
| **License** | GPLv2, fully open, no paid core edition | Dual-licensed: free GPL Community + paid Enterprise |
| **Default storage engine** | InnoDB | InnoDB |
| **Extra storage engines** | Aria, ColumnStore, Spider, MyRocks | Tighter set around InnoDB; NDB Cluster |
| **JSON support** | JSON is an alias for LONGTEXT + a JSON_VALID() check (text) | Native, validated, binary JSON type |
| **Clustering / HA** | Galera Cluster (synchronous multi-master) | Group Replication / InnoDB Cluster |
| **Compatibility** | Highly compatible with MySQL, not identical anymore | The reference implementation others target |
| **Tooling & ecosystem** | Broad, shares MySQL tooling; default in many Linux distros | Largest ecosystem, first-class on every managed cloud |
| **Best fit** | Fully-open stacks, distro default, avoid-Oracle teams | Max ecosystem familiarity, heavy JSON, Enterprise support |

## Licensing: the difference that actually changes your options

MariaDB licensing is simple. The server is GPLv2, full stop. It's free software, the source is open, and there's no separate paid edition of the core database that unlocks features. Commercial support exists if you want it, but the database you run is the same database everyone runs.

MySQL is dual-licensed. The Community Edition is GPLv2 and free, and it's what most people run. But Oracle also sells MySQL Enterprise Edition under a commercial license, and that's where certain features live: enterprise auth, a thread pool, advanced backup, monitoring, auditing. The Community build is plenty for most apps. Still, "some features are Enterprise-only" is a real MySQL thing that doesn't exist in MariaDB.

If your reason for choosing is "I want to steer clear of Oracle's licensing," that's a legitimate, honest reason to pick MariaDB. And if you never plan to buy an Enterprise license, the practical difference for your app is close to zero.

## Where they've actually diverged

For the first few years the two were nearly identical. They aren't anymore. The versions even stopped lining up: MySQL runs its 8.x line (with 8.4 as a long-term release), while MariaDB is off on its own 10.x and 11.x series. Here's where you'll notice.

### JSON: the biggest real gotcha

This is the one that bites people on migration. MySQL 5.7 and up has a native JSON type: the data is validated and stored in an optimized binary format, so reaching into a JSON document is quick. MariaDB stores JSON differently. There, the JSON type is an alias for `LONGTEXT` with an automatic `JSON_VALID()` check constraint. It's stored as text, not binary.

```sql
-- MySQL: JSON is a real, validated, binary type
CREATE TABLE events (id INT PRIMARY KEY, payload JSON);

-- MariaDB: JSON is an alias for LONGTEXT + a JSON_VALID() CHECK
CREATE TABLE events (id INT PRIMARY KEY, payload JSON);
-- run SHOW CREATE TABLE and you'll see LONGTEXT under the hood
```

In practice both support JSON functions and both work fine for storing documents. But if your app leans hard on JSON columns, does a lot of JSON querying, or you're porting a schema built around MySQL's JSON type over to MariaDB, test it. A dump that defines columns as `JSON` lands as `LONGTEXT` on MariaDB, and some ORMs and validators notice. If JSON is central to your data model, that's a point for MySQL. It might also be a nudge to read [when to use a NoSQL database](https://www.kloudbean.com/blog/when-to-use-a-nosql-database/) before you commit.

### Storage engines

Both default to InnoDB now, which is what you want for almost everything: row-level locking, transactions, crash recovery. The difference is what else ships in the box. MariaDB bundles extra engines, including Aria (a crash-safe MyISAM replacement), ColumnStore for columnar analytics, plus options like Spider and MyRocks. MySQL keeps a tighter set around InnoDB, with NDB Cluster as its in-memory clustered engine. For a normal transactional app you'll run InnoDB on either and never think about it. The extra engines only matter if you have a specific job for them, like analytics on ColumnStore.

### High availability and clustering

Both engines can replicate and cluster. They just use different tech to get there. MariaDB ships with Galera Cluster for synchronous multi-master replication. MySQL has Group Replication, packaged as InnoDB Cluster with MySQL Router and Shell. These are engine-level capabilities, and also the part people over-reach on. Most apps do not need multi-master clustering. A single well-sized instance with solid backups, plus a read replica when you genuinely need one, covers a huge share of real workloads. Reach for a cluster when you have a concrete availability requirement, not because it sounds robust in a design doc.

### Syntax, functions, and the small stuff

The little differences add up. MariaDB has sequences, some extra functions, an optional Oracle compatibility mode, and its own take on invisible columns and system-versioned tables. MySQL has the X Protocol and X DevAPI, a document-store API on port 33060 that MariaDB doesn't implement. Auth defaults and a few system tables differ too. None of this matters for everyday SQL. All of it can matter the moment you use a niche feature and expect the other engine to understand it.

## MariaDB vs MySQL performance

Short version: for most apps, MariaDB vs MySQL performance is a wash. Both are quick. You'll find benchmarks where MariaDB edges ahead and benchmarks where MySQL does, and almost none of them look like your workload. The thing that actually makes a database fast isn't the logo on it. It's indexing, query shape, connection handling, and how much RAM the box has.

If your queries are slow on one, they'll be slow on the other, and the fix is the same. Add the right indexes. Run `EXPLAIN` on the ugly queries. Kill the N+1 patterns your ORM loves to generate. Cache the hot reads. We keep a full [MySQL performance tuning](https://www.kloudbean.com/blog/mysql-performance-tuning/) guide, and [connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/) is usually the first real bottleneck a busy app hits, on either engine. Choose on fit and licensing, not on a benchmark screenshot someone posted in 2019.

<!-- ADD IMAGE: a benchmark you ran yourself, MariaDB vs MySQL on the same hardware and your own query mix -->

## Is MariaDB a drop-in replacement for MySQL?

It started life as exactly that, and for a lot of apps it still behaves like one. Same wire protocol, same port 3306, same `mysql://` connection scheme, the same `mysqldump` and `mysql` client tools, and connectors that mostly interchange. WordPress, WooCommerce, Laravel, Drupal, most ORMs: point them at either and they run.

But "drop-in" was a truer claim in 2013 than it is today. The two have diverged enough that you should test, not assume, especially if you use JSON columns, GTID-based replication, specific auth plugins, or version-specific features. Treat MariaDB as highly compatible with MySQL, not identical to it.

Moving data between them is refreshingly boring, because they share tooling. `mysqldump` exports from either and imports into the other:

```bash
# mysqldump works for both engines, in either direction
mysqldump -h OLD_HOST -u appuser -p appdb > appdb.sql

# import into the other engine, same command either way
mysql -h NEW_HOST -u appuser -p appdb < appdb.sql
```

Connection strings don't change shape either, because both speak the MySQL protocol:

```bash
# Both listen on port 3306 and use the mysql:// scheme
DATABASE_URL=mysql://appuser:s3cret@10.0.0.5:3306/appdb

# Frameworks that read discrete vars don't care which engine it is
DB_HOST=10.0.0.5
DB_PORT=3306
DB_USER=appuser
DB_PASSWORD=s3cret
DB_NAME=appdb
```

After importing, run your test suite and click through the JSON-heavy and report-heavy pages first. That's where drift hides. For a bigger or busier database, our free migration assistance can move it with minimal downtime.

<!-- ADD IMAGE: your terminal mid-migration, mysqldump exporting then the mysql client importing into the new engine -->

## MariaDB or MySQL for WordPress?

Both work, and both are officially supported. WordPress needs MySQL 5.5.5+ or MariaDB 10.0+, and it honestly does not care which one is underneath. Plenty of managed WordPress hosts default to MariaDB precisely because it's a clean, fully-open drop-in, and the extra thread pool and engines don't hurt. WooCommerce is the same story. If you're running WordPress or Woo, choose either based on what your host offers and what your team knows. You won't feel a difference in the admin or on the storefront. Building something new that isn't WordPress? The more interesting fork in the road is usually [MySQL vs PostgreSQL](https://www.kloudbean.com/blog/mysql-vs-postgresql/), not MariaDB vs MySQL.

## So which should you pick?

Here's how I'd actually decide, in order:

- **Already using one?** Stay. The cost of switching almost never beats the benefit for a running app.
- **Want maximum openness and no Oracle in the picture?** MariaDB. Community governance is the entire reason it exists.
- **Want the widest ecosystem, the reference every tool tests against, and a vendor you can buy support from?** MySQL.
- **Building fresh with no constraints?** Flip a coin, then pick MySQL for the ecosystem or MariaDB for the openness. You genuinely can't get this badly wrong.

### Should you switch from MySQL to MariaDB?

If MySQL is working, "should I switch from MySQL to MariaDB" usually has a boring answer: not without a reason. Good reasons exist. You want off Oracle's licensing. You need a MariaDB-only feature. Your distro already moved and you're just following it. A vague sense that MariaDB is "more open" is a fine reason for a new project and a weak one for migrating a healthy production database. If you do switch, test the JSON and replication bits the hardest, since that's where the two disagree most.

## Run either one on Kloudbean

Both MariaDB and MySQL are one-click managed engines here, sitting alongside PostgreSQL, Redis, Memcached, Elasticsearch, and MongoDB. Managed means we handle provisioning, patching, and automatic backups, and the engine is locked down with IP allow-listing so only your app server can reach it. You own the schema, the queries, and the data, and you can export any time.

1. **Launch the engine.** Open **DBS** and click **Launch Database**. Choose MariaDB or MySQL, name it, create it. It's provisioned, secured, and backed up within a couple of minutes.
2. **Grab the credentials.** You'll get host, port 3306, database name, user, and password. You'll need them in a second. Don't paste them into your code.
3. **Wire it in through the environment.** Add the connection as an environment variable, not a hard-coded string. A single `DATABASE_URL` or discrete `DB_*` fields both work, and since both engines use the same scheme, you don't rewrite anything if you switch later.
4. **Deploy and verify.** Ship your app (managed CI/CD from GitHub works well here), run your migrations, then click through a couple of real pages to confirm reads and writes stick.

![The Kloudbean console Launch Database screen with MariaDB and MySQL among the one-click managed engines](../assets/console/launch-database.png)

*DBS -> Launch Database: MariaDB and MySQL are both one-click, provisioned and backed up on your server.*

The connection details go into your app's environment, never into the repository. Open **Runtime Configuration -> Environment Variables** and drop them in:

![The Kloudbean console Environment Variables screen holding the database connection string safely outside the code](../assets/console/env-vars.png)

*Runtime Configuration -> Environment Variables: the connection string lives here for both MariaDB and MySQL.*

Because both speak the same protocol and share tooling, you can start on one and move to the other later without rewriting your app. Want the per-engine details? See [managed MariaDB hosting](https://www.kloudbean.com/blog/managed-mariadb-hosting/) and [managed MySQL hosting](https://www.kloudbean.com/blog/managed-mysql-hosting/).

<!-- ADD IMAGE: the WordPress Site Health screen showing the database server and version, MariaDB or MySQL -->

---

**Run MariaDB or MySQL without babysitting it.** Both are one-click managed engines with automatic backups, IP allow-listing, and free migration help, deployed next to your app with simple Git deploys. Start free at [kloudbean.com](https://www.kloudbean.com/); plans on [pricing](https://www.kloudbean.com/pricing/).

One-click databases · Automatic backups · Free migration · Free trial

## FAQ

**Is MariaDB a drop-in replacement for MySQL?**
It began as one, and for many apps it still swaps in cleanly, since they share the wire protocol, port 3306, the `mysql://` scheme, and tools like `mysqldump`. But the two have diverged since 2009, so treat MariaDB as highly compatible rather than identical. Test anything that uses JSON columns, specific replication setups, or version-specific features before you rely on the swap.

**What's the main difference between MariaDB and MySQL?**
Governance and licensing. MariaDB is fully open and community-run under the MariaDB Foundation with a single GPL edition, while MySQL is owned by Oracle, dual-licensed, and offers a paid Enterprise edition with extra features. On top of that they differ in JSON storage, bundled storage engines, and clustering technology.

**Is MariaDB faster than MySQL?**
For most real applications the difference is negligible, and benchmarks swing both ways depending on the workload. What makes your database fast is indexing, query design, connection pooling, and RAM, not the choice between these two engines. Pick on licensing and fit, then tune the database you chose.

**MariaDB or MySQL for WordPress?**
Either works, and both are officially supported (WordPress needs MySQL 5.5.5+ or MariaDB 10.0+). Many managed WordPress hosts default to MariaDB because it's a clean open drop-in, but you won't notice a difference in the admin or on the front end. Choose based on what your host offers and what your team is comfortable with.

**Is MariaDB free?**
Yes. MariaDB's server is licensed under GPLv2 and is fully free and open source, with no paid edition of the core database that gates features. Commercial support is available if you want it, but the database itself is free to run.

**Should I switch from MySQL to MariaDB?**
Only with a concrete reason: wanting off Oracle's licensing, needing a MariaDB-specific feature, or following your Linux distribution's default. If MySQL is running fine, switching a healthy production database rarely pays off. When you do switch, test the JSON and replication behavior most carefully, since that's where they differ.

**Can I migrate data between MariaDB and MySQL?**
Yes, and it's straightforward because they share tooling. Export with `mysqldump` and import with the `mysql` client in either direction, then repoint your connection string. Watch JSON columns and replication config, and run your test suite afterward, since drift tends to surface there.

**Do MariaDB and MySQL use the same port and connection string?**
They do. Both listen on port 3306 by default and use the `mysql://` connection scheme, so a `DATABASE_URL` like `mysql://user:pass@host:3306/db` works for either. Frameworks that read discrete host and port variables don't need to know which engine they're talking to.

**Does MariaDB or MySQL handle JSON better?**
MySQL has the edge for heavy JSON work. It stores JSON as a validated binary type for faster access, while MariaDB implements the JSON type as an alias for `LONGTEXT` with a validity check, stored as text. Both support JSON functions and both are fine for light JSON use, but a JSON-centric schema leans toward MySQL.

**Are both MariaDB and MySQL managed on Kloudbean?**
Yes. Both are one-click managed engines, alongside PostgreSQL, Redis, Memcached, Elasticsearch, and MongoDB, with automatic backups, controlled access, and IP allow-listing. Managed means provisioning, patching, and backups are handled while you keep full ownership of your schema and data.

---

*By Kloudbean Data · Managed MySQL and MariaDB. Same roots, different paths.*
