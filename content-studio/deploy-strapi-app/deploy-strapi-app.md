---
title: How to Deploy Strapi to Production Without Losing Your Content
description: "Deploy Strapi to production the right way: swap SQLite for a managed Postgres or MySQL, set the required secrets, build the admin panel, and keep uploads in S3."
slug: deploy-strapi-app
canonical: https://www.kloudbean.com/blog/deploy-strapi-app/
eyebrow: Deployment · Headless CMS
byline: By Kloudbean Engineering · Headless, Not Homeless.
---

# How to Deploy Strapi to Production Without Losing Your Content

By Kloudbean Engineering · Headless, Not Homeless.

<!-- ADD IMAGE: hero (rendered later): the admin build and API in front of a managed Postgres database and S3 object storage, behind a reverse proxy with SSL -->

Strapi is a joy in development. You run `npm run develop`, the content-type builder opens, you model a few collections, and the REST and GraphQL APIs just appear. Then you go to deploy Strapi to production and the fun stops. The admin panel needs a build. Five secrets have to exist or the server refuses to boot. And that friendly default database? It's a SQLite file that quietly disappears on your next deploy. This is the complete, honest guide to getting Strapi live on a server you own, with a real database and uploads that survive.

> **How do I deploy Strapi to production?**
> Move off SQLite to a managed PostgreSQL or MySQL, set the five required secrets (`APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`) as environment variables, build the admin panel with `NODE_ENV=production npm run build`, then run `npm run start`. Point your upload provider at S3-compatible object storage so media survives redeploys, and put Strapi behind a reverse proxy with SSL. Most Strapi deploy failures are a missing secret, a forgotten build, or SQLite, not a code bug.

## What Strapi actually is, and what it needs in production

Strapi is an open-source Node.js headless CMS. You define content types in an admin panel, and Strapi hands you a REST API and a GraphQL API to read and write that content from any front end you like. React, Next.js, a mobile app, whatever. The CMS part runs on your infrastructure, which is the appeal. You own the data and the API.

Because it's a Node app, production Strapi hosting needs two things that dev mode papers over. A Node runtime to run the server, and a real database to hold your content. Locally, Strapi gives you both for free: it runs on your machine and writes to a SQLite file at `.tmp/data.db`. Zero config, instant start. Perfect for building. Wrong for production, and that gap is where most people get hurt.

## The mistake that eats a weekend: SQLite in production

Here's the single most common way a Strapi launch goes sideways. You deploy with the default SQLite database still wired up, everything looks fine, you add a few entries through the admin. Then you push an update. Your content is gone.

SQLite stores everything in one file on the app server's local disk. On a lot of modern platforms that disk is ephemeral, meaning it gets wiped and rebuilt on every deploy or restart. So the file, and every article, user, and media reference in it, evaporates. Even on a persistent disk, SQLite locks the whole file for a single writer and can't be shared across a second app instance, so the moment you scale out you're stuck. My take, and I'll be blunt: SQLite is great in dev, and the wrong choice in production. Don't ship it past a demo.

The fix is to point Strapi at a client-server database that lives on its own, gets backed up, and can be reached by more than one app server. That means PostgreSQL or MySQL.

<!-- ADD IMAGE: the Strapi admin content-type builder with a couple of collection types modeled -->

## The production shape, in one picture

Before the steps, here's what you're actually building. Strapi (the Node app, serving both the built admin panel and the API) sits behind a reverse proxy that terminates SSL. Content goes to a managed database. Uploads go to object storage. Neither of those lives on the app server's disk.

> **Diagram:** One Strapi process serves the built admin panel and the API, reading content from a managed database and pushing uploads to object storage, all behind a proxy that handles SSL. Browser/client sends HTTPS to a reverse proxy on :443, which forwards to Strapi (Node :1337). Strapi reads and writes content to a managed Postgres or MySQL reached over the local network, with backups, and stores uploads/media in S3-compatible object storage. Content lives in the managed database, media lives in object storage, neither sits on the app disk.

## What database should Strapi use in production?

Use PostgreSQL if you have no strong reason not to. It's the community default for production Strapi, it handles concurrency well, and it won't surprise you. MySQL and MariaDB are fully supported too, so if your team or your stack already leans that way, they're a fine choice. SQLite stays where it belongs: local dev.

| Database | Strapi support | Use it for |
|---|---|---|
| **SQLite** | Default, dev only | Local building and tests. Never production. |
| **PostgreSQL** | Fully supported, recommended | Most production Strapi apps. The safe default. |
| **MySQL / MariaDB** | Fully supported | Teams and stacks that already run MySQL. |

Strapi reads its database config from `config/database.js` (or `.ts`), and the sane pattern is to drive everything from environment variables so the same code runs against SQLite locally and Postgres in production:

```js
// config/database.js
module.exports = ({ env }) => ({
  connection: {
    client: env('DATABASE_CLIENT', 'postgres'),
    connection: {
      connectionString: env('DATABASE_URL'),
      host: env('DATABASE_HOST', '127.0.0.1'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD'),
      ssl: env.bool('DATABASE_SSL', false),
    },
  },
});
```

Then the production values live in your environment, not the repo:

```bash
# PostgreSQL
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://strapi:s3cret@10.0.0.5:5432/strapi

# or MySQL
DATABASE_CLIENT=mysql
DATABASE_URL=mysql://strapi:s3cret@10.0.0.5:3306/strapi
```

The connection details (host, port, name, user, password) come from your managed database. If you want the framework-agnostic version of this step, with Prisma, Django, Rails and the rest, it's covered in [add a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/), and there's a deeper dive on [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/).

![Launch a managed PostgreSQL or MySQL for Strapi in the Kloudbean console](../assets/console/launch-database.png)
*Launch a managed PostgreSQL or MySQL for Strapi. It's provisioned and backed up on a schedule, locked to your app server's IP.*

## The five secrets Strapi won't boot without

This one catches almost everyone on the first production run. Strapi requires a set of secrets, and if they're missing it doesn't warn and carry on, it refuses to start. The classic symptom is this exact error in your logs:

```
Middleware "strapi::session": App keys are required.
```

That means `APP_KEYS` isn't set. In development Strapi wrote these values into your local `.env` when it created the project, so you never thought about them. In production you have to set them yourself, on purpose. The five you need:

- `APP_KEYS` signs the session cookies. It's a comma-separated list of random keys.
- `API_TOKEN_SALT` salts the API tokens Strapi issues.
- `ADMIN_JWT_SECRET` signs admin panel login tokens.
- `JWT_SECRET` signs end-user tokens from the users-and-permissions plugin.
- `TRANSFER_TOKEN_SALT` salts data-transfer tokens.

Generate real random values, not the placeholder `tobemodified` strings from the sample file. One command per secret:

```bash
# run this five times, one value per secret
openssl rand -base64 32

# APP_KEYS wants a few comma-separated keys
APP_KEYS=key1base64,key2base64
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
JWT_SECRET=...
TRANSFER_TOKEN_SALT=...
```

Running a recent Strapi 5 build? It also expects an `ENCRYPTION_KEY`, so generate one more while you're there. Set every one of these as an environment variable in your host, never committed to Git. If you commit a `.env` with real secrets, treat them as burned and rotate them. The why-and-how of secret handling is in [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

![The Kloudbean Environment Variables editor holding the Strapi secrets and database connection](../assets/console/env-vars.png)
*Set the Strapi secrets and the database connection as environment variables. There's a paste-env tab so you can drop them all in at once.*

> **A pattern we see constantly:** a Strapi app that builds cleanly but crash-loops on boot. Nine times out of ten it's one missing secret or a database it can't reach, not a bug in your code. Read the first few lines of the error log before you touch anything else. Strapi usually names the exact problem.

## Building the Strapi admin panel

The Strapi admin is a React application. In development, `npm run develop` serves it and hot-reloads as you edit content types. In production you don't run develop. You compile the admin into a static bundle once, then start the server that serves it. Two commands, in order:

```bash
# 1. compile the admin panel (React) for production
NODE_ENV=production npm run build

# 2. start the server in production
NODE_ENV=production npm run start
```

Skip the build and you'll start the server fine, then open the admin URL to a blank page or a 404 on the JavaScript. That's the tell: the admin was never compiled. Set `NODE_ENV=production` so Strapi builds the optimized bundle and behaves as a production server.

One gotcha worth burning into memory. Your `config/server.js` controls the host, port, public URL, and proxy setting, and changing any of that requires rebuilding the admin. So if you update the public URL after the fact, run `npm run build` again or the admin keeps pointing at the old address. This trips people who tweak the URL as a quick fix and can't work out why nothing changed.

<!-- ADD IMAGE: the runtime config panel with the Install, Build (npm run build) and Start (npm run start) commands and Node version filled in -->

## Where do Strapi uploads go in production?

Same trap as SQLite, different folder. Strapi's default upload provider writes files to `public/uploads` on the local disk. On ephemeral storage those images vanish on the next deploy, and across two app servers they aren't shared, so an upload on one box 404s on the other. If your CMS holds any media, and most do, this bites.

The fix is an S3-compatible upload provider. Install `@strapi/provider-upload-aws-s3`, then configure it in `config/plugins.js` to point at your bucket. The `endpoint` option is the important bit: it lets you target any S3-compatible object storage, not only AWS.

```js
// config/plugins.js
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          endpoint: env('S3_ENDPOINT'),
          region: env('S3_REGION'),
          credentials: {
            accessKeyId: env('S3_ACCESS_KEY_ID'),
            secretAccessKey: env('S3_ACCESS_SECRET'),
          },
          params: { Bucket: env('S3_BUCKET') },
        },
      },
    },
  },
});
```

Now media survives deploys and is shared across every instance. Kloudbean gives you built-in S3-compatible buckets with full AWS S3 SDK compatibility, so the same config points straight at storage on your own account. The broader pattern, and why big files never belong on the app disk, is in [store user uploads in object storage](https://www.kloudbean.com/blog/store-user-uploads-in-object-storage/).

<!-- ADD IMAGE: the Strapi media library with a few images, served from S3-compatible object storage -->

## Running Strapi behind nginx or a reverse proxy

In production you don't expose Strapi's port 1337 to the world. A reverse proxy sits in front on 443, terminates TLS, and forwards to Strapi. That gives you HTTPS and a clean domain. Two settings make Strapi behave correctly behind it, both in `config/server.js`:

```js
// config/server.js
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'https://cms.example.com'),
  proxy: true,
  app: { keys: env.array('APP_KEYS') },
});
```

The `url` is your public HTTPS address. Strapi uses it to build absolute links for the admin and the API, so if it's wrong the admin loads from the wrong host or your media URLs point at `localhost`. Setting `proxy: true` tells Strapi it's behind a proxy so it trusts the forwarded protocol and reports HTTPS instead of the internal HTTP hop. On a managed host the proxy and the SSL certificate are handled for you, so you set the public URL and move on. If you want the mechanics, see [nginx reverse proxy for Node](https://www.kloudbean.com/blog/nginx-reverse-proxy-for-node/). And remember: change the `url`, rebuild the admin.

## Your Strapi production deploy checklist

Six things stand between a working dev project and a Strapi app you can trust in production. Run down this list before you point a domain at it.

| Step | Do this | Why it matters |
|---|---|---|
| **Database** | Provision managed Postgres or MySQL, set `DATABASE_*` | SQLite loses your content on redeploy |
| **Secrets** | Set `APP_KEYS` and the other four as env vars | Strapi refuses to boot without them |
| **Build** | `NODE_ENV=production npm run build` | Compiles the admin React bundle |
| **Start** | `npm run start` in production mode | Runs the API and serves the admin |
| **Uploads** | Point the upload provider at object storage | Local disk is ephemeral, media disappears |
| **Proxy + SSL** | Set `url`, put it behind a proxy with TLS | Admin and API links must be HTTPS and correct |

## How to deploy Strapi on a managed server (step by step)

With the concepts clear, the actual deploy is short, because a managed server hands you the Node runtime, the reverse proxy, the firewall, and SSL already assembled. You bring the repo. Here's the path through the Kloudbean console. If you've deployed a plain Node service before, this will feel familiar; the sibling walkthrough is [deploy an Express app to production](https://www.kloudbean.com/blog/deploy-express-app/).

### 1. Add the server and the Strapi app

Create a server, pick a cloud (Kloudbean runs seven: AWS, Amazon Lightsail, Google Cloud, DigitalOcean, Vultr, Linode, and UpCloud), choose the Node.js stack and a size. 2 GB of RAM is a comfortable starting point for a single Strapi instance, since the admin build is not shy about memory. Then add your app under **Applications**.

![The Kloudbean Add Application screen, adding a Strapi Node.js app](../assets/console/add-application.png)
*Add Application: Strapi is a Node app, so pick the Node.js stack. It can share a server with other apps if you want.*

### 2. Launch the managed database

Open **Launch Database** and create a PostgreSQL (or MySQL). It provisions locked to your app server's IP, gets automatic backups, and hands you the host, port, name, user, and password. Those go into your `DATABASE_*` env vars. Keeping the database off the public internet is not optional for a CMS that holds user data, and IP allow-listing makes that the default: only your app server's IP can connect.

### 3. Set the secrets and the database connection

In **Runtime Configuration, Environment Variables**, add the five Strapi secrets, the `DATABASE_*` values, your S3 upload credentials, `PUBLIC_URL`, and `NODE_ENV=production`. Use the paste-env tab to drop them in together. A single missing variable is the most common reason a Strapi deploy builds and then won't boot, so slow down and check them.

### 4. Connect Git and deploy

In **Git Deployment**, connect GitHub, paste the repo URL, pick a branch, and set the commands: install with `npm ci`, build with `npm run build`, start with `npm run start`. Hit deploy and the build log streams live, so you watch the admin compile instead of guessing. Turn on automated deployment and every push to that branch rebuilds and ships itself. Details in [CI/CD auto-deploy from GitHub](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/).

![The Kloudbean Git Deployment tab with the repository, branch, and commands for Strapi](../assets/console/git-deployment.png)
*Git Deployment: set install, build (npm run build), and start (npm run start), then deploy with live logs.*

### 5. Point a domain and turn on SSL

Add your custom domain, point DNS at the server, and install a free auto-renewing SSL certificate. Set `PUBLIC_URL` to that HTTPS address and rebuild the admin so its links are correct. Open `/admin`, create your first admin user, and you're live.

<!-- ADD IMAGE: the live Strapi admin login on your custom domain, over HTTPS -->

## A few things that will save you later

Self-hosting Strapi is not hard, but a handful of habits keep it boring, which is what you want from production.

- **Run migrations and content-type changes carefully.** Strapi writes schema based on your content types. Build them in a lower environment, not by editing types live in production.
- **Give the database its own least-privilege user.** Your Strapi user needs its schema and nothing more. It doesn't need superuser.
- **Turn backups on, then test a restore.** Automatic backups are worth little until you've proven you can restore one. Do it before you need it.
- **Keep secrets rotated.** Since they're env vars, rotating a leaked `ADMIN_JWT_SECRET` is a config change, not a redeploy of code.

Backups, IP allow-listing, and free SSL come with the managed setup, so most of this is a matter of using what's already there rather than bolting it on later.

---

**Your Strapi CMS, live on infrastructure you own.**

Managed Postgres or MySQL, a Node runtime, S3-compatible storage for uploads, Git deploy with live build logs, automatic backups, and free auto-renewing SSL, all in one dashboard. Start at [kloudbean.com](https://www.kloudbean.com/); sizes and plans (from $8/mo, Enterprise custom) are on [pricing](https://www.kloudbean.com/pricing/).

Managed PostgreSQL and MySQL · Node runtime · S3-compatible object storage · Git deploy with live logs · Automatic backups · Free SSL · Free migration

## FAQ

### How do I deploy Strapi to production?

Move off SQLite to a managed PostgreSQL or MySQL, set the required secrets as environment variables, build the admin panel with `NODE_ENV=production npm run build`, then run `npm run start`. Point your upload provider at S3-compatible object storage, and put Strapi behind a reverse proxy with SSL. On a managed host you deploy from Git and the runtime, proxy, and certificate are handled for you.

### What database should Strapi use in production?

PostgreSQL is the recommended default, and MySQL or MariaDB are fully supported if your stack prefers them. All three are client-server databases that live independently of the app, handle concurrency, and can be backed up. SQLite is fine for local development only. Set the connection through `DATABASE_*` environment variables so the same code runs in both places.

### Why should I not run Strapi on SQLite in production?

SQLite stores everything in a single file on the app server's local disk. On ephemeral storage that file, and all your content, is wiped on every redeploy, and it can't be shared across a second app instance. That makes it impossible to scale out and dangerous for anything you care about. Switch to a managed Postgres or MySQL before real users arrive.

### What environment variables does Strapi need?

At minimum Strapi needs `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, and `TRANSFER_TOKEN_SALT`, plus your database connection variables. Recent Strapi 5 builds also expect an `ENCRYPTION_KEY`. Generate random values with a command like openssl rand base64 32, set them in your host's environment, and never commit them to Git.

### How do I build the Strapi admin panel?

The admin is a React app that has to be compiled for production. Run `NODE_ENV=production npm run build` to produce the optimized bundle, then `npm run start` to serve it. If you skip the build, the admin URL loads a blank page or a 404 on its JavaScript. Note that changing the server config, including the public URL, requires rebuilding the admin.

### Where do Strapi uploads go in production?

By default Strapi writes uploads to the public folder on local disk, which is ephemeral and not shared across instances, so media can disappear on redeploy. Install an S3-compatible upload provider and configure it in config plugins to point at your bucket. Set the endpoint option so it targets any S3-compatible storage, and media then survives deploys and scale-out.

### How do I run Strapi behind nginx or a reverse proxy?

Put a proxy in front on port 443 to terminate TLS and forward to Strapi on port 1337. In config server, set `url` to your public HTTPS address so Strapi builds correct absolute links, and set proxy to true so it trusts the forwarded protocol. On a managed host the proxy and certificate are handled for you, so you mainly set the public URL and rebuild the admin.

### What causes the App keys are required error in Strapi?

That error means `APP_KEYS` is not set in the environment. In development Strapi writes it into your local env file automatically, but in production you must set it yourself. Add `APP_KEYS` as a comma-separated list of random keys, along with the other required secrets, and Strapi will boot.

### Can I host Strapi on Kloudbean?

Yes. Strapi runs on the managed Node.js runtime, with one-click managed PostgreSQL, MySQL, or MariaDB for its database, environment variables for the secrets, S3-compatible object storage for uploads, and Git deploy with live build logs. Backups, IP allow-listing, and free auto-renewing SSL come with the managed setup, and free migration help is available.

### Do I need Node in production, or can I export Strapi as a static site?

Strapi is the backend, so it needs a running Node process and a database in production. It is not a static site generator. Your front end can be static and call Strapi's REST or GraphQL API, but the CMS itself has to run as a live server. That is why production Strapi hosting needs a Node runtime plus a managed database.

---

Kloudbean · Own your headless CMS, from the admin build to the backups.
