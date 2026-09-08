# How to Migrate a Node.js App from Fly.io to Kloudbean

*By Kloudbean Engineering · The app moves in an hour. The volumes are what you have to think about.*

Moving off Fly.io is a different exercise from moving off Render or Railway, because Fly gives you more infrastructure to account for. You are not just relocating an app: you have Machines across regions, volumes pinned to specific hosts, snapshots, private networking, and possibly a Postgres cluster you have been operating yourself. This runbook works through it in order, including the one thing that surprises people mid-migration, which is discovering that their multi-region setup was never replicating data in the first place.

> **How do I migrate from Fly.io to Kloudbean?**
> Inventory every Machine, volume, snapshot, and region in your Fly apps, then export your secrets with `fly secrets list` and your data with `pg_dump`. Create the equivalent on Kloudbean: one always-on server running your app and workers under PM2, plus a managed database. Copy volume contents deliberately, since volumes are local to a host and never replicated for you. Verify on the temporary URL, cut DNS over in a quiet window, then destroy the Fly volumes and apps, because they keep billing until you do.

## Stage 1: inventory, and check every region

Fly spreads state further than most platforms, so the inventory step matters more here. Work through:

- **Machines**, their process groups, sizes, and which regions they run in.
- **Volumes**, in every region, including any not currently attached to a Machine.
- **Snapshots** and their retention.
- **Secrets** set on each app.
- **Databases**, whether Fly Postgres you manage yourself or Managed Postgres.
- **Certificates and custom domains**, plus current DNS records and TTLs.
- **Dedicated IPv4 addresses**, which bill per address.
- Your `fly.toml`, which documents most of the configuration in one place.

```bash
fly apps list
fly machines list -a your-app-name
fly volumes list -a your-app-name
fly secrets list -a your-app-name
fly ips list -a your-app-name
```

Check regions you have stopped using. A volume left in a region you abandoned still holds data and still bills, and it is the item most often missed during a migration.

## Stage 2: the volume conversation

This deserves its own stage because it changes migration plans. Fly's own documentation is explicit that volumes are local persistent storage and do not automatically replicate your data, and that creating more Machines with volumes requires you to set replication up yourself first.

Two consequences. First, whatever is on a volume exists in one place, on one host, in one region, so it needs copying deliberately rather than assumed to be everywhere. Second, and this is the uncomfortable one: if you deployed Machines across several regions and believed that gave you data redundancy, it did not unless you built the replication. Plenty of teams discover this during a migration rather than during an incident, which is the better of the two.

So before you move anything, decide what is actually on each volume. Uploaded files and generated assets need copying. A database you run yourself on a volume needs a proper dump rather than a file copy. Caches and rebuildable artefacts can be discarded. And if a volume holds something you cannot identify, find out before you destroy it.

For files, object storage is the better destination than a server disk, because it survives server changes and works across instances. Kloudbean includes S3-compatible buckets with AWS SDK and CLI compatibility, so if your code already uses the AWS SDK the change is an endpoint and a bucket name. See [S3-compatible object storage](https://www.kloudbean.com/blog/s3-compatible-object-storage/).

## Stage 3: how Fly concepts map

| On Fly.io | On Kloudbean |
|---|---|
| Machines in a process group (metered) | Node app always-on under PM2, flat plan |
| A second process group for a worker | A second PM2 process on the same server |
| Volumes pinned to a host, no auto-replication | Server disk, or S3-compatible object storage |
| Fly Postgres or Managed Postgres | Managed PostgreSQL with automatic backups |
| Redis or other stateful services | Managed Redis in the same dashboard |
| Secrets per app | Environment variables per app |
| `fly deploy` and flyctl | GitHub deploys with live build logs |
| WireGuard and 6PN private networking | App and database in one account, IP allow-listing |
| Metered Machines, volumes, snapshots, egress, IPv4 | Flat from $8/mo, no egress metering |

Your process groups become entries in a PM2 ecosystem file:

```js
// ecosystem.config.js
module.exports = {
  apps: [
    { name: "web",    script: "dist/server.js" },
    { name: "worker", script: "dist/worker.js" },
  ],
};
```

## Stage 4: secrets and data

Fly's `secrets list` shows you the names of what is set, though not the values, since they are write-only once stored. That means you need your own source of truth for the values, whether that is a password manager or your original provisioning notes. Build the list from the names, fill in the values, and set them as environment variables on the new app, changing the database and Redis URLs to the new managed instances.

For the database, dump and restore as normal. Fly provides a way to reach Postgres over its private network, and the simplest reliable approach is to open a local proxy and dump through it:

```bash
# Open a local proxy to the Fly Postgres instance
fly proxy 5433:5432 -a your-postgres-app

# In another terminal, dump through the proxy
pg_dump "postgres://user:pass@127.0.0.1:5433/dbname" -Fc -f fly.dump

# Restore into the new managed database
pg_restore --no-owner -d "postgres://user:pass@new-host:5432/appdb" fly.dump

# Verify before trusting it
psql "postgres://user:pass@new-host:5432/appdb" -c "SELECT count(*) FROM users;"
```

If you have been running unmanaged Postgres yourself, this is also the moment that workload stops being your responsibility, which for most teams is the actual reason they are migrating.

## Stage 5: verify, then cut over

1. Lower your DNS TTL to 300 seconds a day ahead of the switch.
2. Deploy from GitHub, set your environment variables, and test on the temporary URL while Fly still serves production.
3. Exercise it properly: authentication, the endpoints that matter, a background job end to end, file uploads if you moved storage, and a scheduled task by hand.
4. In a quiet window, take the final `pg_dump` and restore so no writes are lost.
5. Point DNS at Kloudbean and issue SSL for your domain.
6. Watch logs and error rates for the first hour.
7. Leave the Fly app running for a few days as a rollback path.

## Stage 6: the cleanup that actually saves money

This step is specific to Fly and skipping it is expensive. Stopping or destroying Machines does not remove the storage. Per Fly's own billing documentation, volumes are billed whether or not they are attached to a Machine, they keep billing when Machines are stopped, and stopped or suspended Machines are still charged for root filesystem usage. Snapshots bill on the storage they occupy, and dedicated IPv4 addresses bill per address.

So once you are confident and no longer need the rollback:

```bash
# Destroy volumes you have confirmed are migrated
fly volumes list -a your-app-name
fly volumes destroy <volume-id>

# Release addresses you no longer need
fly ips list -a your-app-name

# Then destroy the app itself
fly apps destroy your-app-name
```

Do this per app and per region. We wrote up the whole billing picture in [why is my Fly.io bill so high](https://www.kloudbean.com/blog/why-is-my-fly-io-bill-so-high/), and the short version is that a migration you do not finish cleaning up keeps charging you for both platforms.

## What changes, and what you give up

What you gain: the app runs always-on under PM2 with a managed database, managed Redis, and object storage in one dashboard, on a flat plan from $8/mo with no egress metering. Backups are automatic. Storage is part of the server rather than a separately metered object that can outlive the app. Support is in the plan rather than a separate tier. And you stop reasoning about Machines, volumes pinned to hosts, WireGuard, and health-check placement in order to ship a feature.

What you give up, stated honestly: Fly's regional placement is genuinely strong, and if your product needs instances running close to users in many specific regions, that is a real capability you are trading away. Fly Machines also start very fast, and the networking is more flexible than a conventional managed platform. Migrating makes sense when the operational surface costs you more than the regional control earns you. If low latency in many geographies is the product, think carefully.

Kloudbean does offer provider and region choice across seven clouds, and a built-in load balancer for spreading traffic across servers, so it is not a single-location story. It is a smaller regional footprint than Fly's model, and being straight about that is more useful than pretending otherwise.

## Take it further

Context: [a Fly.io alternative](https://www.kloudbean.com/blog/fly-io-alternative/) and [why is my Fly.io bill so high](https://www.kloudbean.com/blog/why-is-my-fly-io-bill-so-high/). On the mechanics: [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/), [S3-compatible object storage](https://www.kloudbean.com/blog/s3-compatible-object-storage/), [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/), and [migrating with zero downtime](https://www.kloudbean.com/blog/how-to-migrate-hosting-zero-downtime/). For workers, [background jobs with BullMQ](https://www.kloudbean.com/blog/nodejs-background-jobs-bullmq/).

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

**How do I export my data from Fly.io Postgres?**
Open a local proxy to the Postgres app with `fly proxy 5433:5432 -a your-postgres-app`, then run `pg_dump` against `127.0.0.1:5433` to produce a compressed dump. Restore it into the new managed database with `pg_restore --no-owner` and compare row counts on key tables before trusting it.

**Can I get my Fly.io secret values back?**
Not from Fly. `fly secrets list` shows the names of your secrets but not their values, because they are write-only once set. Use the list to build a complete inventory of what needs setting, then source the values from your password manager or provisioning notes.

**Do Fly.io volumes replicate across regions?**
No. Fly's documentation states that volumes are local persistent storage and do not automatically replicate your data, and that you need to set replication up yourself before creating more Machines with volumes. If you deployed across regions assuming that gave you data redundancy, it did not unless you built it. Copy volume contents deliberately during a migration.

**Will my Fly.io bill stop when I migrate?**
Only if you clean up. Per Fly's billing documentation, volumes bill whether attached or not and keep billing when Machines are stopped, stopped Machines are still charged for root filesystem usage, snapshots bill on occupied storage, and dedicated IPv4 addresses bill per address. Destroy volumes and apps deliberately, in every region, once you no longer need the rollback.

**What do I lose by moving off Fly.io?**
Mainly regional reach. Fly's placement across many regions, fast Machine starts, and flexible networking are real strengths, and if running close to users in many specific geographies is core to your product, weigh that seriously. Kloudbean offers provider and region choice across seven clouds plus a built-in load balancer, which is a smaller footprint than Fly's model.

**How long does a Fly.io migration take?**
The app itself usually deploys in under an hour, since it is a GitHub connection plus environment variables. The time goes into inventorying Machines and volumes across regions, deciding what each volume holds, and moving that data. Budget more for the storage audit than for the deploy, and keep the Fly app for a few days as a rollback path.

*Kloudbean Engineering · Inventory the volumes, move the data deliberately, then destroy what keeps billing.*
