---
title: "Deploy a Symfony App to Production, the Honest Way"
slug: deploy-symfony-app
meta_description: "Deploy a Symfony app to production the honest way: set APP_ENV=prod, composer install --no-dev, warm the cache, run Doctrine migrations, fix var/ permissions, and serve public/ behind nginx and PHP-FPM."
target_keyword: deploy symfony app
secondary_keywords:
  - symfony production
  - symfony hosting
  - symfony APP_ENV prod
  - composer install no-dev
  - doctrine migrations deploy
  - symfony var/cache permissions
author: Kloudbean
hero_image: images/hero.png
cluster: 3 (App Deployment Tutorials)
---

![Deploy a Symfony app to production: build, warm the cache, migrate, then serve public/index.php behind nginx and PHP-FPM](images/hero.png)

# Deploy a Symfony App to Production, the Honest Way

_By Kloudbean · Symfony, Served._

Deploying a Symfony app is a well-worn path. Symfony is a mature PHP framework, the production story is documented, and the steps rarely change. The trouble is the sharp edges: a handful of small things that turn a five-minute deploy into a white 500 page.

Set `APP_ENV=prod`. Install without dev dependencies. Warm the cache. Run your Doctrine migrations. Make `var/` writable by the web server. Point the docroot at `public/`, not the project root. Get those right and Symfony production hosting is genuinely boring, which is exactly what you want. Get one wrong and you'll spend an hour reading the wrong log. This guide walks the whole thing, in order, with the real commands.

> **Short version.** To deploy a Symfony app: set `APP_ENV=prod` and a real `APP_SECRET` on the server, run `composer install --no-dev --optimize-autoloader`, then `bin/console cache:clear` and `cache:warmup`, then `doctrine:migrations:migrate --no-interaction`. Serve `public/index.php` with nginx and PHP-FPM, and make sure `var/cache` and `var/log` are writable by the web server user. That last one is the classic 500.

## The Symfony deploy in one picture

Before the commands, the shape. A Symfony deploy is a short pipeline. Code goes in one end, a warmed, migrated, production-tuned app comes out the other, and nginx serves a single front controller. Nothing exotic. But every stage has a job, and skipping one is where the pain starts.

*(Diagram: the Symfony production deploy pipeline. Your repo is pushed, then the build runs `composer install --no-dev --optimize-autoloader` and `bin/console cache:warmup` to compile the container into `var/cache`, then `doctrine:migrations:migrate` applies schema changes, then nginx and PHP-FPM serve `public/index.php`. Migrations and the live app both reach the same managed database (MySQL or PostgreSQL) over `DATABASE_URL`. Under all of it: `var/cache` and `var/log` must be writable by the web server user, with opcache enabled for speed.)*

## Set APP_ENV=prod and a real APP_SECRET

Symfony reads its configuration from environment variables, and two of them decide how the app behaves the moment it boots. `APP_ENV` picks the environment. In `dev` you get the debug toolbar, verbose errors, and a cache that rebuilds when files change. In `prod` you get a compiled container, terse error pages, and none of that live rebuilding. Ship with `APP_ENV=dev` by accident and you leak stack traces and pay a real speed penalty on every request. So set `APP_ENV=prod`. It's the single most important variable on the box.

`APP_SECRET` is the other one. Symfony uses it to sign things: CSRF tokens, signed URIs, the "remember me" cookie. It needs to be a long, random value, set once and kept stable. Rotate it and every existing CSRF token and signed URL becomes invalid, which logs people out and breaks in-flight forms. Generate it once, store it as an environment variable, and leave it be.

Keep real values out of git. Symfony's convention makes this clean: `.env` holds committed, safe defaults, and anything real (secrets, the production database URL) goes in `.env.local` or straight into the server's environment, neither of which you commit. Here's what each file is actually for.

| File | What goes in it | In git? |
| --- | --- | --- |
| `.env` | Committed defaults with safe placeholder values | Yes |
| `.env.local` | Real secrets and overrides for this specific machine | No |
| `.env.prod` | Non-secret defaults that only apply in prod | Yes |
| `.env.local.php` | A compiled, fast version of all the above (see `dump-env`) | Generated |

```bash
# the production environment (set on the server, never committed)
APP_ENV=prod
APP_SECRET=change_me_to_a_long_random_string
DATABASE_URL="postgresql://appuser:secret@postgres-123456.kloudbeansite.com:5432/appdb?serverVersion=16&charset=utf8"
```

One Symfony-specific speed trick worth knowing. If you use Symfony Flex (most modern apps do), `composer dump-env prod` compiles all those dotenv files into a single `.env.local.php`. Symfony then loads that PHP file instead of parsing text files on every request. Small win, zero downside in production.

```bash
# compile env vars into an optimized PHP file (Symfony Flex)
composer dump-env prod
```

![The Kloudbean console environment variables screen showing a Symfony app's APP_ENV, APP_SECRET and DATABASE_URL set on the server](../assets/console-real/shots/nodespm_env_step_1.png)

The deeper reasoning on keeping secrets out of code, and the mistakes people make rotating them, is in [environment variables, done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

![Which file to edit for secrets](images/gen-1-comparison.png)

## The production build: install without dev, then warm the cache

A production Symfony deploy runs a fixed set of commands, in order, every time. Each has a purpose and a matching failure mode. This is the part generic PHP tutorials skip, so here's the whole sequence with the reasons attached.

| Command | What it does | Skip it and… |
| --- | --- | --- |
| `composer install --no-dev --optimize-autoloader` | Installs production deps only and builds a fast classmap | Dev tooling ships to prod, autoloading is slower, and Flex scripts run in the wrong env |
| `bin/console cache:clear --env=prod` | Rebuilds the compiled container and config for prod | A stale or dev-shaped cache in production, or a boot error |
| `bin/console cache:warmup --env=prod` | Precompiles the container, routes and metadata into `var/cache` | The first visitor pays the compile cost, so the first hit is cold and slow |
| `bin/console doctrine:migrations:migrate` | Applies pending schema changes to the database | A 500 the instant your code queries a column that isn't there yet |
| asset build (`importmap:install` or Encore) | Publishes your CSS and JavaScript | Unstyled pages and missing front-end behavior |

Two of those deserve a closer look, because they're where Symfony differs from a plain PHP app.

First, `--no-dev`. Production doesn't need PHPUnit, the profiler's dev bits, or fixture bundles, and `--optimize-autoloader` builds a class map so PHP finds classes by lookup instead of scanning the filesystem. It pairs with opcache to make autoloading close to free. There's a subtle trap too: Composer's post-install scripts (a cache clear via Flex, for one) run under whatever `APP_ENV` is set at build time, so set `APP_ENV=prod` before you install or they warm the wrong cache.

Second, `cache:warmup`. Symfony compiles your service container, routing, and metadata into plain PHP under `var/cache/prod`. Warm it at deploy time and the compiled cache is already there when the first request lands. Skip it and Symfony builds it lazily, so the first visitor after each deploy waits while the container compiles. Warm it in the build.

```bash
# the deploy build, in order
composer install --no-dev --optimize-autoloader
php bin/console cache:clear --env=prod
php bin/console cache:warmup --env=prod
php bin/console doctrine:migrations:migrate --no-interaction
# assets, if you use them:
php bin/console importmap:install     # AssetMapper
# or, for Webpack Encore:
npm ci && npm run build
```

An opinion, since this is a guide and not a menu: turn on opcache in production and leave it on. Symfony leans on compiled PHP for the container and the warmed cache, and opcache is what keeps that compiled code in memory instead of re-reading it from disk. Symfony even ships a `config/preload.php` for opcache preloading. It's one of the cheapest speedups you'll ever get. If your production PHP has opcache off, fix that before you go tuning anything clever.

## The 500 that is almost always var/ permissions

If a fresh Symfony deploy greets you with a blank 500 and nothing obvious in the browser, put your money on permissions before you touch a line of code. Symfony writes to two directories at runtime: `var/cache` and `var/log`. If the web server user (PHP-FPM runs as something like `www-data`) can't write there, Symfony throws on boot. The error in the log is blunt about it:

```
Unable to write in the cache directory (/path/to/app/var/cache/prod)
```

This happens because the person who deployed owns `var/`, but the PHP-FPM process runs as a different user, and that user has no write bit. The fix is to give the web server user write access to `var/`. And here's the anti-pattern to avoid: do not `chmod -R 777 var`. It "works" in the sense that the error goes away, and it's a bad habit that hands write access to everyone on the box. Use ownership or ACLs instead, so exactly the web server user can write, and nobody else.

```bash
# give the web server user write access to var/ with ACLs (not chmod 777)
setfacl -R -m u:www-data:rwX var
setfacl -dR -m u:www-data:rwX var
```

On a managed PHP server this is handled for you: the deploy runs as the right system user and the web root already has the correct ownership, so the classic `var/` 500 mostly stops being your problem. Worth knowing why it happens anyway, because the day you SSH in and run a console command as the wrong user, you'll recognize the error on sight.

![Common first-deploy Symfony 500](images/gen-2-flow.png)

## Run Doctrine migrations on every deploy

If you use Doctrine (most Symfony apps do), your schema lives in migration classes, and production applies them with one command:

```bash
php bin/console doctrine:migrations:migrate --no-interaction
```

The `--no-interaction` flag skips the "are you sure?" prompt, which you want in an automated deploy. Run this as part of the build, after the code is in place and before traffic hits the new version. The order matters: if new code that expects a column deploys before the migration that adds it, every request touching that column 500s until the migration catches up.

Two habits keep this smooth. Write backward-compatible migrations where you can, so old code and new schema coexist for the few seconds a deploy takes: add a column, backfill, then switch code to use it, rather than renaming a column out from under a running app. And a firm opinion: never run `doctrine:schema:update --force` in production. It changes the live schema on the spot with no review and no history, which is a footgun. Migrations give you an ordered, reversible, version-controlled record of every change. Use them.

Migrations are also where a deploy can genuinely damage data, so treat a risky one with respect: back the database up first, and rehearse it against a staging copy or a restored backup before it touches production. The mechanics of dumping and restoring a database, which is what a backup and a rehearsal both rely on, are covered in [database migration with pg_dump and mysqldump](https://www.kloudbean.com/blog/database-migration-pg_dump-mysqldump/).

## Connect Doctrine to a managed database with DATABASE_URL

Doctrine reads its connection from a single environment variable, `DATABASE_URL`. One string carries the driver, credentials, host, port, and database name. Postgres and MySQL both work; pick the one your team knows.

```bash
# PostgreSQL
DATABASE_URL="postgresql://appuser:secret@postgres-123456.kloudbeansite.com:5432/appdb?serverVersion=16&charset=utf8"

# MySQL / MariaDB
DATABASE_URL="mysql://appuser:secret@127.0.0.1:3306/appdb?serverVersion=8.0"
```

Point that at a managed database rather than one you install and babysit yourself. A managed instance is backed up, patched, and secured for you, and when it sits on the same server as the app you reach it over `127.0.0.1` on the local network, so credentials never cross the public internet. Launch a [managed MySQL](https://www.kloudbean.com/blog/managed-mysql-hosting/) or a managed PostgreSQL, drop its URL into `DATABASE_URL`, and Doctrine connects. The wider pattern of putting a real database next to your app, instead of leaning on a metered external service, is in [add a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/).

One production note. PHP opens a database connection per request, so a busy app opens and closes a lot of them; watch your database's connection limit as traffic grows. And set `serverVersion` correctly in the URL, since Doctrine uses it to decide which SQL features are safe to emit.

![The Kloudbean Launch Database screen: creating a managed PostgreSQL instance on the same server as a Symfony app](../assets/console-real/shots/psql_launch_step_1.png)

## Point nginx at public/, never the project root

Symfony has a single entry point: `public/index.php`, the front controller every request flows through. Your web server's docroot must be the `public/` directory, and nothing above it. This is not a style preference. Point the docroot at the project root and you've just published `.env`, your `config/`, your `src/`, and your `vendor/` to the open web. Anyone can read your secrets. Docroot is `public/`. Always.

A minimal nginx and PHP-FPM setup looks like this. Requests that don't match a file get rewritten to the front controller, and PHP is handed to FPM over a socket:

```nginx
server {
    server_name yourdomain.com;
    root /home/your-app/public;          # docroot is public/, not the project root

    location / {
        try_files $uri /index.php$is_args$args;
    }

    location ~ ^/index\.php(/|$) {
        fastcgi_pass unix:/run/php/php-fpm.sock;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    }

    location ~ \.php$ { return 404; }     # block direct access to any other .php
}
```

That's nginx as a reverse proxy in front of PHP-FPM, the standard way PHP runs in production. If the path through a proxy is fuzzy, [reverse proxy, explained](https://www.kloudbean.com/blog/reverse-proxy-explained/) lays it out. Good news for most readers: on a managed PHP server the web server, PHP-FPM, the `public/` docroot, and free auto-renewing SSL are already configured. You don't hand-write this file. It's here so you know what the platform does on your behalf.

## Wiring the Symfony deploy on a managed server

Symfony is a PHP application, and a managed PHP stack is exactly what it runs on. You're not installing PHP-FPM or configuring nginx by hand; that stack already exists and stays patched. So a real question people ask is whether Symfony works on a managed server when it isn't a one-click app type. Yes. It runs on the same managed PHP runtime that hosts WordPress, Laravel, Magento, and the rest. You deploy it like any PHP codebase.

Connect your Git repository under **Application Administration → Deploy Code → Git Deployment** and put the build sequence (Composer, cache warmup, migrations, assets) into the build step. The start side is PHP-FPM already serving `public/index.php`.

![The Kloudbean Add Application screen: creating a PHP application to host a Symfony app on the managed stack](../assets/console-real/shots/adding_app_from_apps_step_1.png)

![The Kloudbean Deploy Code / Git Deployment screen with a Symfony repo connected and the Composer and console build sequence set](../assets/console-real/shots/git_connect_step_4.png)

Push once to wire it up, then turn on auto-deploy so every push to your branch re-runs the build and applies new migrations. The live build log is the part I'd actually watch, because that's where a failed migration or a warmup error shows up first, in plain text, while it happens. More on the push-to-deploy loop is in [CI/CD auto-deploy from GitHub](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/). And for a risky migration, deploy to a staging copy first, watch it, then promote to production.

> **Running background work?** If your app uses Symfony Messenger for async jobs, that's a long-lived worker process, kept alive by the server and restarted on deploy so it picks up new code. This guide stays on the web-request path; the worker pattern deserves its own walkthrough.

![Live build log during a deploy](images/gen-3-flow.png)

## When the first deploy goes sideways

Symfony's opening-night failures are few and predictable, and each maps to something above. Read the log before you change code on a hunch.

- **Blank 500, nothing in the browser.** Almost always `var/cache` or `var/log` permissions, or a missing `APP_SECRET`. Read `var/log/prod.log`. The exception is named there.
- **Verbose errors and a toolbar on production.** You shipped with `APP_ENV=dev`. Set it to `prod` and clear the cache.
- **A 500 that mentions a missing column or table.** Migrations didn't run. Run `doctrine:migrations:migrate`.
- **Your secrets are readable over the web, or you get a raw directory listing.** The docroot points at the project root. Repoint it at `public/`.
- **A slow first request after each deploy.** You're warming the cache lazily. Add `cache:warmup` to the build.
- **Class not found only in production.** You built with the wrong env or without `--optimize-autoloader`. Set `APP_ENV=prod`, reinstall, rebuild the autoloader.

## What you run, what Kloudbean runs

Symfony is PHP, and PHP on Linux is what a managed server runs, so none of this is a workaround. Kloudbean keeps the box healthy: the PHP runtime, PHP-FPM and nginx, free SSL, the Shorewall and Fail2ban baseline, and server-level backups, on whichever of its seven clouds you pick. You own the Symfony app: its environment variables, its Doctrine migrations, its cache warmup, the `public/` docroot the platform already points at. Clean split, and it's the arrangement most PHP teams actually want. If your app were .NET on IIS this wouldn't be your platform. For PHP and Symfony, it's home turf.

Building elsewhere in the same stack? The closest sibling is [deploy a Laravel app](https://www.kloudbean.com/blog/deploy-laravel-app/), the other big PHP framework, with its own set of production quirks around queues and the artisan sequence. Same platform, different sharp edges.

<!-- cta:start -->
**Prototype to production, without the babysitting.**

Move the whole thing onto a managed server you own: always-on processes, a managed database for real data, object storage for uploads, and Git deploys with live build logs.

- Managed databases
- Always-on processes
- Object storage
- Automatic backups
- Free SSL
- Git deploy
- Free migration

[Start free](https://console.kloudbean.com/register) · [See plans](https://www.kloudbean.com/pricing/)
<!-- cta:end -->

## FAQ

**How do I deploy a Symfony app to production?**
Set `APP_ENV=prod` and a real `APP_SECRET` on the server, then on each deploy run `composer install --no-dev --optimize-autoloader`, clear and warm the cache with `bin/console cache:clear` and `cache:warmup`, and apply `doctrine:migrations:migrate --no-interaction`. Serve `public/index.php` with nginx and PHP-FPM. On a managed host you set that build sequence once, connect your repo, and every push repeats it.

**What does APP_ENV=prod do?**
It puts Symfony in production mode: a compiled service container, terse error pages, and no live cache rebuilding. In `dev` you get the debug toolbar and verbose errors, which are slow and leak internals, so they must never run on a public site. Setting `APP_ENV=prod` is the most important environment variable on the server.

**How do I run composer install for production?**
Run `composer install --no-dev --optimize-autoloader`. The `--no-dev` flag skips test and development packages, and `--optimize-autoloader` builds a class map so PHP resolves classes by lookup instead of scanning the filesystem. Make sure `APP_ENV` is set to `prod` before you run it, or the post-install cache scripts warm the wrong environment.

**Why do I get a 500 error on var/cache after deploying?**
The web server user cannot write to `var/cache` or `var/log`. Symfony writes its compiled cache and logs there at runtime, and if PHP-FPM runs as a user without write access it throws on boot. Grant that user write access with ACLs or correct ownership, and avoid `chmod 777`, which is insecure. On a managed server the ownership is set up for you.

**How do I run Doctrine migrations on deploy?**
Run `php bin/console doctrine:migrations:migrate --no-interaction` as part of the build, after the code is in place. The flag skips the confirmation prompt so it works in automation. Apply migrations before traffic reaches the new code, because code that expects a new column will error until the schema catches up.

**How do I connect a Symfony app to a database?**
Set the `DATABASE_URL` environment variable and Doctrine reads it. One string holds the driver, username, password, host, port, and database name, for example a PostgreSQL or MySQL URL. Point it at a managed database on the same server over `127.0.0.1` so credentials stay on the local network and the instance is backed up for you.

**Do I need to run cache:warmup?**
You should. `cache:warmup` precompiles the service container, routing, and metadata into `var/cache` during the build. Skip it and Symfony builds that cache lazily, so the first visitor after each deploy waits while it compiles. Warming it in the build keeps the first request fast.

**What should the nginx docroot be for a Symfony app?**
The `public/` directory, and never the project root. Symfony routes every request through the `public/index.php` front controller, so the docroot points there. Exposing the project root would publish your `.env`, config, and source to the internet. A managed PHP server sets the docroot to `public/` for you.

**What is APP_SECRET and do I need to change it?**
It's a long random value Symfony uses to sign CSRF tokens, signed URIs, and remember-me cookies. Set it once to a strong random string and keep it stable. Changing it invalidates existing tokens and signed URLs, which logs users out and breaks in-flight forms, so only rotate it deliberately.

**Can I host a Symfony app on Kloudbean?**
Yes. Symfony is a PHP application, so it runs on the same managed PHP stack that hosts WordPress, Laravel, Magento, and other PHP apps, with nginx, PHP-FPM, and free SSL already configured. You deploy it from Git, set your environment variables in the console, and run a managed MySQL or PostgreSQL alongside it. There is no dedicated one-click Symfony installer; you deploy it as a standard PHP codebase.

_Kloudbean · Symfony, Served._
