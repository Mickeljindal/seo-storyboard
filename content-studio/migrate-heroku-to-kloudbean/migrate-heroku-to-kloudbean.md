# How to Migrate a Node.js App from Heroku to Kloudbean

*By Kloudbean Engineering · A production migration is more than connecting a Git repo.*

Moving off Heroku is very doable, and the teams who do it smoothly all share one habit: they inventory everything before they touch anything. The pain isn't deploying your code, that part takes minutes. It's the surrounding stuff, the worker dyno you forgot, the add-on that quietly holds state, the twenty config vars nobody documented, the DNS cutover. This is the runbook for a Node.js app: what to catalog, how Heroku concepts map onto a real server, the exact commands, and how to keep a rollback path the whole way.

> **How do I migrate from Heroku to Kloudbean?**
> Work in five stages. Inventory every dyno, add-on, config var, and scheduled job. Provision the equivalents on Kloudbean (a server for the app, a managed database, managed Redis if you use it). Map your `Procfile` processes to PM2, and copy config vars in as environment variables. Move data with `pg_dump` and restore, verify on a temporary URL, then cut DNS over during a quiet window. Keep Heroku running until you've verified, so rollback is just a DNS change.

## Stage 1: inventory before you migrate anything

This is the step people skip and regret. When ReadMe moved its eight-year-old app off Heroku, its documented approach started with taking inventory of all services, then deploying the main app as a proof of concept, migrating low-risk services first and saving the difficult ones for last. That ordering exists because surprises live in the corners. Write down:

- **Every process type** in your `Procfile`: web, worker, clock/scheduler, one-off release tasks.
- **Every add-on**: Postgres, Redis, mail, logging, monitoring. Note which hold data you must move.
- **Every config var**, including ones only used by an add-on.
- **Scheduled jobs** (Heroku Scheduler entries) and what they run.
- **Domains, SSL, and DNS TTLs**, plus anything sitting in front like Cloudflare.
- **Dyno sizes** and current resource usage, so you size the new server sensibly.

A team that migrated a mature SaaS off Heroku summarized the honest reality well: a production migration involves far more than connecting a Git repository. Processes, workers, scheduled jobs, domains, and cutover sequencing are the actual work. Two hours of inventory saves a bad afternoon.

## Stage 2: how Heroku concepts map to Kloudbean

The mental model shift is from "a collection of separately billed dynos and add-ons" to "one server running your processes, with managed data services alongside." Here's the translation:

| On Heroku | On Kloudbean |
|---|---|
| Web dyno | Node app, always-on under PM2 |
| Worker dyno | A second PM2 process on the same server |
| Clock dyno / Heroku Scheduler | Cron jobs from the dashboard |
| Heroku Postgres | Managed PostgreSQL, automatic backups |
| Heroku Key-Value Store (Redis) | Managed Redis |
| Config vars | Environment variables per app |
| Git push deploys | GitHub deploys with live build logs |
| Add-on per capability, billed separately | One flat plan from $8/mo |

Your `Procfile` becomes a PM2 ecosystem file. Same idea, one file:

```
# Procfile (Heroku)
web: node dist/server.js
worker: node dist/worker.js
```

```js
// ecosystem.config.js (Kloudbean, running under PM2)
module.exports = {
  apps: [
    { name: "web",    script: "dist/server.js" },
    { name: "worker", script: "dist/worker.js" },
  ],
};
```

One genuine improvement here: on Heroku a web process and a worker are two separately billed dynos. On one server they're two processes sharing the resources you already pay for, which is where a lot of the cost difference comes from.

## Stage 3: export your config vars

Get everything out of Heroku in one shot so nothing gets missed. The `-s` flag prints them in `KEY=value` shell format:

```bash
# Dump all config vars from Heroku
heroku config -s --app your-app-name > heroku-vars.txt
```

Then set them as environment variables on your Kloudbean app, with two edits. Change `DATABASE_URL` and `REDIS_URL` to the new managed instances (you'll get those connection strings when you create them), and drop anything that only existed for a Heroku add-on you're not carrying over. Validate the list against the app before cutover, unset variables are the single most common cause of a crash on the first boot. Our [deploy crash field guide](https://www.kloudbean.com/blog/fix-node-app-crashing-on-deploy/) covers that failure mode in detail.

## Stage 4: move the database

Create the managed PostgreSQL database first, then dump from Heroku and restore into it. Heroku's `DATABASE_URL` gives you everything you need:

```bash
# Dump directly from Heroku Postgres (custom format)
pg_dump "$(heroku config:get DATABASE_URL --app your-app-name)" -Fc -f heroku.dump

# Restore into the new managed database
pg_restore --no-owner -d "postgres://user:pass@new-host:5432/appdb" heroku.dump
```

Use `--no-owner` so the restore doesn't try to recreate Heroku's role names. If your app is on MySQL instead, or you want the charset and cutover gotchas in one place, the field guide to [database migration with pg_dump and mysqldump](https://www.kloudbean.com/blog/database-migration-pg_dump-mysqldump/) covers both engines. Then verify before you trust it, count rows in your biggest tables on both sides:

```bash
psql "postgres://user:pass@new-host:5432/appdb" -c "SELECT count(*) FROM users;"
```

One thing worth planning for: database region. ReadMe's migration forced a MongoDB move between regions because of where the new platform ran, which added work nobody budgeted for. Put your app and database in the same region from the start and you avoid that latency tax entirely.

## Stage 5: verify, cut over, and keep a rollback

Deploy the app on Kloudbean from GitHub and test it on the temporary URL while Heroku is still serving real traffic. Walk the app: log in, hit the slow endpoints, trigger a background job, confirm the worker picks it up, run a scheduled task manually. Then cut over:

1. Lower your DNS TTL a day ahead (to 300 seconds) so the switch propagates fast.
2. Pick a quiet window. Put Heroku in maintenance mode if you need a clean data freeze.
3. Take a final `pg_dump` and restore, so you don't lose writes made during testing.
4. Point DNS at Kloudbean and issue SSL for the domain.
5. Watch logs and error rates for the first hour.
6. Leave Heroku running for a few days. Rollback is then just pointing DNS back.

Done this way the hard downtime is small. ReadMe reported roughly 90 seconds of hard downtime on its final cutover, which is a fair benchmark for a careful move on a real app. The unglamorous secret is the final dump-and-restore window, not the deploy.

## What actually gets better, and what to watch

Being straight with you: migrating off Heroku is not automatically cheaper, and there are documented cases where a team's first month elsewhere cost more than the old Heroku bill, because they moved for control or roadmap reasons rather than price. Where the savings do show up is consolidation. If your Heroku bill is a web dyno plus a worker dyno plus Postgres plus Redis plus staging, collapsing that onto one flat plan is usually a real reduction, and we broke the arithmetic down in [Heroku costs after the free tier](https://www.kloudbean.com/blog/heroku-cost-after-free-tier/).

What you gain beyond price: your whole stack in one dashboard, no per-piece add-on billing, no egress metering, and a persistent process that can hold WebSockets and run real background workers. Credit where it's due, Heroku's git-push simplicity was genuinely excellent and set the standard, which is exactly why a GitHub-push deploy with live build logs is the workflow to keep. And if you'd rather not do the steps above yourself, migration assistance is included, we'll do the inventory and the cutover with you.

## Related reading

Useful companions: [a Heroku alternative for modern apps](https://www.kloudbean.com/blog/heroku-alternative-for-modern-apps/) for the platform comparison, [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) for the database side, [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/) for config, and [CI/CD auto-deploy from GitHub](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/) to replace git-push deploys. For workers, see [background jobs with BullMQ](https://www.kloudbean.com/blog/nodejs-background-jobs-bullmq/), and for a clean cutover, [how to migrate hosting with zero downtime](https://www.kloudbean.com/blog/how-to-migrate-hosting-zero-downtime/).

## Let us do the migration with you

Move your Node app, worker, Postgres, and Redis onto one flat plan from $8/mo, with GitHub deploys, live build logs, and free migration assistance including the inventory and cutover. Start at [kloudbean.com](https://www.kloudbean.com/), see plans on [pricing](https://www.kloudbean.com/pricing/).

Free migration assistance · Whole stack, one dashboard · Managed Postgres and Redis · No egress metering · Flat from $8/mo

## FAQ

**How long does a Heroku migration take?**
For a straightforward Node app with one database, plan a few hours of setup and testing plus a short cutover window. Bigger apps with multiple process types, add-ons, and scheduled jobs take longer, mostly in inventory and verification. Teams that migrated mature apps report the deploy is quick and the surrounding work is what takes the time.

**Will my app be down during the migration?**
Only briefly, if you sequence it well. Keep Heroku serving traffic while you deploy and test elsewhere, then take a final database dump and switch DNS in a quiet window. One documented Heroku migration reported around 90 seconds of hard downtime at final cutover. Lowering your DNS TTL beforehand keeps propagation quick.

**How do I move my Heroku Postgres database?**
Dump it with `pg_dump` using the connection string from `heroku config:get DATABASE_URL`, then restore into your new managed database with `pg_restore --no-owner`. Verify by comparing row counts on key tables. Take a final dump right before cutover so writes made during testing aren't lost.

**What happens to my worker dynos and scheduled jobs?**
Worker dynos become additional PM2 processes on the same server, defined in an ecosystem config, so you aren't paying for a separate dyno per process. Heroku Scheduler entries become cron jobs you set up in the dashboard. Test both explicitly after deploying, worker setup is the thing most likely to need adjustment.

**Is moving off Heroku actually cheaper?**
Often, but not automatically. There are documented migrations where the first month elsewhere cost more, because the team moved for control or roadmap reasons. The savings come from consolidation: if you pay separately for a web dyno, worker, Postgres, Redis, and staging, collapsing that onto one flat plan is usually a genuine reduction. Compare your whole stack, not one dyno.

**Can I roll back if something goes wrong?**
Yes, and you should plan for it. Leave your Heroku app running for a few days after cutover so rolling back is just pointing DNS at Heroku again. Keep your final database dump too. Having that path available is what makes a migration low-stress rather than a leap.

*Kloudbean Engineering · Inventory first, cut over last, keep the rollback.*
