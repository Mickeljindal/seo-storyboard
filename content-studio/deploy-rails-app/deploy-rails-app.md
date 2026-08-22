---
title: "Deploying a Rails App: The Questions Everyone Actually Asks"
slug: deploy-rails-app
meta_description: "You want to deploy a Rails app and it already runs with rails server. Production raises real questions: RAILS_MASTER_KEY, assets:precompile, migrations, Puma, Sidekiq. Plain answers to each."
target_keyword: deploy rails app
secondary_keywords:
  - rails production server
  - host ruby on rails
  - deploy ruby on rails
  - rails puma production
author: Kloudbean
hero_image: images/hero.png
cluster: 3 - App Deployment Tutorials
---

![Deploy a Ruby on Rails app: the ordered deploy sequence, Puma, Postgres and Sidekiq, on a server you own](images/hero.png)

# Deploying a Rails App: The Questions Everyone Actually Asks

Your Rails app runs locally. You type `rails server`, open localhost, and it works. Then you go to deploy your Rails app to a production server and a small pile of questions lands all at once: what does the server need, why does it refuse to boot over some encryption key, how do assets work, do you need that background jobs thing?

None of it is hard once someone answers it straight. So that's the format here: the real questions, in the order they tend to hit, with short answers and the commands that go with them.

> **Short version.** A Rails deploy is an ordered sequence: `bundle install`, `assets:precompile`, `db:migrate`, then boot **Puma**. Set `RAILS_ENV=production`, `RAILS_MASTER_KEY` (or `SECRET_KEY_BASE`) and `DATABASE_URL` as env vars first, or it won't start. Uploads go to object storage via Active Storage. Add Sidekiq only if you have background jobs.

## What does a Rails app actually need in production?

Not much, and nothing exotic:

- **Ruby** (the version pinned in your `.ruby-version`) and **Bundler** for gems.
- **A database.** Postgres is the usual pick for a rails production server; MySQL is fine too.
- **An app server.** **Puma** runs your Rails app, and it's already in your Gemfile.
- **Node and a JS bundler** at build time, only if your app compiles JavaScript. Plenty of modern Rails apps barely touch this.

On a managed platform Ruby and that stack are already provisioned, so you're placing your app onto a ready server instead of building one from scratch. That's most of why "how do I host Ruby on Rails" feels heavier than it is: the old guides make you install the world first. You get to skip that part.

## So how do I deploy a Rails app?

Think of it as four ordered stages, not one big scary "deploy." Push your code to GitHub, connect the repo, and set the sequence. Each stage feeds the next.

*(Diagram: the Rails deploy sequence, in order. Stage 1 `bundle install` (install your gems), stage 2 `assets:precompile` (CSS and JS, fingerprinted), stage 3 `db:migrate` (schema follows code), stage 4 Puma boots (listens on $PORT). A warning strip: before step 4, set RAILS_MASTER_KEY or Rails can't decrypt config/credentials.yml.enc and won't start; set SECRET_KEY_BASE and DATABASE_URL too, all as environment variables, never in git. Optional background branch: a Sidekiq worker (`bundle exec sidekiq`) runs alongside the web process, backed by managed Redis that holds the jobs. rails server is nowhere in this picture; Puma is the app server in production.)*

```bash
# Install
bundle install
# Build
bundle exec rails assets:precompile
# Release (runs each deploy, before new code goes live)
bundle exec rails db:migrate
# Start
bundle exec puma -C config/puma.rb   # listens on the assigned port
```

Push once to wire it up. From then on, deploying is a `git push`: the precompile and migrate steps run themselves in order, and Puma restarts on the new code. That's the payoff for setting the sequence up once. On [Kloudbean](https://www.kloudbean.com/) you connect the repo under **Deploy Code → Git Deployment** and fill those fields.

![The Kloudbean Deploy Code / Git Deployment screen: a Rails repo connected with bundle install, assets:precompile, db:migrate and the Puma start command set](../assets/console/git-deployment.png)

## Why won't it boot with "Missing encryption key" or SECRET_KEY_BASE?

This is the one that gets almost everybody on the first production boot, and it's worth understanding rather than just pasting a fix. Modern Rails encrypts your secrets into `config/credentials.yml.enc`, which can only be read with a key kept in `config/master.key`. That key file is gitignored on purpose, so it isn't in your repo, which means production doesn't have it unless you provide it. When Rails tries to read credentials and can't decrypt them, it stops dead:

```text
Missing encryption key to decrypt file with.
Ask your team for your master key and write it to
config/master.key or put it in the ENV["RAILS_MASTER_KEY"].
```

We see this constantly, and the fix is one environment variable. Set `RAILS_MASTER_KEY` to the contents of your local `config/master.key` and Rails can decrypt credentials and boot. Related but separate is `SECRET_KEY_BASE`, the value Rails uses to sign cookies and sessions. In modern Rails it can live inside credentials, or you can set it directly as its own env var (`rails secret` prints a fresh one). Either approach is valid. What you can't do is skip both and expect production to start.

So the boot-critical trio, set as environment variables and never committed: `RAILS_MASTER_KEY`, `SECRET_KEY_BASE` (unless it's in credentials), and `DATABASE_URL`. Add `RAILS_ENV=production` and `RAILS_SERVE_STATIC_FILES=true` while you're there.

```bash
# the boot-critical environment (set on the server, not in git)
RAILS_ENV=production
RAILS_MASTER_KEY=...        # equals your local config/master.key
SECRET_KEY_BASE=...         # or keep it inside encrypted credentials
DATABASE_URL=postgres://myapp:pass@postgres-123456.kloudbeansite.com:5432/myapp
RAILS_SERVE_STATIC_FILES=true
RAILS_MAX_THREADS=5
```

![The Kloudbean Environment Variables screen: RAILS_MASTER_KEY, SECRET_KEY_BASE and DATABASE_URL set for a Rails app via Paste .env](../assets/console/env-vars.png)

More on why secrets belong in the environment and not the codebase: [environment variables, done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

<!-- ADD IMAGE: The boot failure in context: a production.log tail showing the Missing encryption key error, or the Logs Viewer App Errors tab with the same message. -->

## What about the database and migrations?

Launch a managed Postgres and connect it with a single `DATABASE_URL` environment variable. Rails reads that automatically, no config file editing needed.

![The Kloudbean Launch Database screen: creating a managed Postgres for a Rails app, connected with DATABASE_URL](../assets/console/launch-database.png)

Migrations are the part people fret over, but the pattern is boring on purpose: run `rails db:migrate` as a release step on every deploy, right before the new code goes live. Each version applies its own schema changes, in order, so the database never drifts behind the code. You don't run migrations by hand on production. You let the deploy do it, every time.

One quiet gotcha: your database **connection pool** has to be big enough for Puma. Each Puma worker runs several threads, and each thread wants its own connection, so set the pool in `database.yml` to at least `RAILS_MAX_THREADS`. Set it too small and requests queue up waiting for a free connection under load. It looks like a slow database, but it's really a number set too low. Background on the engine choice is in [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) and [add a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/).

## Where do my assets and uploaded files go?

Two different things, handled two different ways. Mixing them up is a classic first-deploy mistake.

- **Assets** (the CSS, JS and images that ship *with* the app) are handled by `assets:precompile` at build time. Rails fingerprints them for caching and serves them fast. Skip precompile and you ship an app with no CSS or JS, so it loads as naked HTML. Set `RAILS_SERVE_STATIC_FILES=true` so Rails serves them, and put a CDN in front later if you want.
- **Uploads** (files your *users* send, like avatars and PDFs) go through **Active Storage**. The catch: the default local-disk service saves them on that one server, so they vanish on a rebuild and don't exist if you run more than one instance. Point Active Storage at [S3-compatible object storage](https://www.kloudbean.com/blog/s3-compatible-object-storage/) instead. It's a few lines of config plus credentials, because Rails ships the adapter. Do it early. Migrating uploads later is a chore.

## Is `rails server` fine for production, or do I need Puma?

Use Puma. `rails server` is a development convenience that boots one process, which is exactly wrong for real traffic. Puma is built for it: multiple workers and threads handling concurrent requests, and it's already configured in a standard Rails app at `config/puma.rb`. So you're not setting up anything new. You start the app with `bundle exec puma` instead of `rails server`, and that's the whole change.

An opinion, since people ask: don't hand-roll your process setup for a normal Rails app. Puma with its default config is the sane default and it's what the community standardizes on. The default worker and thread counts are a fine starting point on a small-to-medium server. Tune them later if you measure a reason to, not before. Guessing at Puma tuning on day one is effort spent on a problem you probably don't have yet.

## Do I need Sidekiq?

Only if your app does background work: sending email, generating reports, calling slow third-party APIs. If it does, that work usually runs through **Sidekiq**, which needs two things: a [managed Redis](https://www.kloudbean.com/blog/managed-redis-hosting/) to hold the jobs, and a worker process running `bundle exec sidekiq` alongside your web app, kept alive by the process manager. Launch a small Redis, start the worker, and jobs get processed. No background work yet? Skip all of it. You can add it the day you need it, and not a moment sooner.

## Do I need Capistrano or Docker to deploy Rails?

For a single Rails app, honestly, no. Capistrano is a fine tool, but a git-based deploy that runs your build sequence and boots Puma covers the same ground with less to maintain. Docker and Kubernetes solve orchestration problems that appear when you're running many services at scale; one Rails app plus Sidekiq plus a database isn't that. Reach for them when you actually have the problem they solve. Starting simple is not a compromise here, it's the right call for most apps.

## What breaks first?

In rough order of likelihood, the first-deploy failures are:

1. **Won't boot: missing `RAILS_MASTER_KEY` or `SECRET_KEY_BASE`.** Rails can't decrypt credentials or sign cookies. Set the env vars.
2. **Wrong mode: missing `RAILS_ENV=production`.** The app runs as if it's in development. Set it.
3. **No styling: assets 404.** You skipped `assets:precompile`, or `RAILS_SERVE_STATIC_FILES` isn't set.
4. **Database errors.** `DATABASE_URL` is wrong or missing, or the pool is too small for Puma.
5. **Uploads disappear.** Active Storage is still on local disk. Move it to object storage.

Read the logs before you touch code. On Kloudbean they're in the dashboard: **Application Administration → Logs Viewer**. Open **App Errors** first, especially if the site is answering with a 503, because a 503 means the app isn't running and the reason it died is in that tab. **App Info** is the informational log next to it, and **Web Requests Logs** is the web server's access log of every request served. Search is built in, so paste `Missing encryption key` or the exception class and go straight to it.

Keep two things apart, because Rails muddies this. `log/production.log` is Rails' own logger, written by your app, and it's the one with the request-by-request detail and the full backtrace. App Errors is the platform's capture of what the process wrote to stderr, which is where a failure that happens before Rails finishes booting shows up, the missing master key being the classic. If Rails never got far enough to log, look in App Errors. Those platform logs are also on disk at `/home/admin/hosted-sites/<app_system_user>/app-logs/` as `app.info.log` and `app.error.log`, if you'd rather tail them. Nearly every first-deploy problem is one of the five above, and each is a one-line fix once you've seen it. The step-by-step for a stubborn boot is [fixing a 503 after deploying your app](https://www.kloudbean.com/blog/fix-503-after-deploying-your-app/).

## What you own, what Kloudbean runs

Rails is a Ruby app, and Ruby on Linux is exactly what a managed server runs, so nothing here fights the platform. Kloudbean keeps the box healthy: the Ruby stack, the web server in front of Puma, free SSL, the firewall, and server-level backups, on any of its seven clouds. You own the Rails app: its credentials, its migrations, its Active Storage config, any Sidekiq workers. It's a standard Linux server running standard Ruby, so you can move hosts whenever you like. Working in other frameworks too? The Python checklist is [deploy a Django app](https://www.kloudbean.com/blog/deploy-django-app/), and running app plus database on one box is covered in [host your app, API, and database on one server](https://www.kloudbean.com/blog/host-app-api-and-database-on-one-server/).

**Puma, Postgres, and Sidekiq if you need it.** Deploy your Rails app on a server you own at [kloudbean.com](https://www.kloudbean.com/), and let the release step run migrations on every push. Managed Postgres & Redis · Automatic backups · Free Let's Encrypt SSL · Git deploy · Free migration · Free trial. Sizes on [pricing](https://www.kloudbean.com/pricing/).

## FAQ

**How do I deploy a Ruby on Rails app?**
Push it to GitHub, connect the repo, and set the ordered sequence: a build step (`bundle install` plus `assets:precompile`), a release step (`rails db:migrate`), and a start command (`bundle exec puma`). Add your environment variables first, especially `RAILS_MASTER_KEY`, `SECRET_KEY_BASE`, `RAILS_ENV=production` and `DATABASE_URL`, then deploy.

**Why does my Rails app say Missing encryption key on boot?**
Rails can't decrypt `config/credentials.yml.enc` because the master key isn't present in production. That key is gitignored, so you provide it as an environment variable. Set `RAILS_MASTER_KEY` to the contents of your local `config/master.key` and the app boots.

**What is the difference between RAILS_MASTER_KEY and SECRET_KEY_BASE?**
`RAILS_MASTER_KEY` decrypts your encrypted credentials file. `SECRET_KEY_BASE` is the value Rails uses to sign cookies and sessions. In modern Rails the secret base can live inside credentials, or you can set it as its own env var. If neither is available in production, Rails refuses to start.

**How do I run Rails migrations when I deploy?**
Run `rails db:migrate` as a release step that fires on every deploy, right before the new code goes live. That keeps the schema in step with the code automatically. You don't run migrations by hand on production.

**Why does my Rails app load with no CSS or JavaScript?**
Your assets weren't precompiled or aren't being served. Run `bundle exec rails assets:precompile` in the build step and set `RAILS_SERVE_STATIC_FILES=true`. Broken styling right after a deploy almost always traces back to one of those two.

**Where should Rails store user uploads in production?**
In S3-compatible object storage, through Active Storage. The default local-disk service loses files on a server rebuild and won't work across multiple instances. Pointing Active Storage at object storage is a small config change plus credentials in the environment.

**Should I use rails server in production?**
No. That's the development server. Production Rails is served by Puma, which handles concurrent traffic with workers and threads and is already configured in a standard Rails app. Start the app with `bundle exec puma`.

**Do I need Sidekiq to deploy a Rails app?**
Only if you run background jobs. Sidekiq needs a managed Redis to hold jobs and a worker process running alongside the web app. If your app has no background work yet, skip it and add it later when you do.

_Kloudbean · Rails in production, minus the server babysitting._
