---
title: "How to Self-Host Strapi in Production (Without Losing Your Data)"
slug: self-host-strapi
meta_description: "How to self-host Strapi, the open-source Node.js headless CMS, in production. Use PostgreSQL not SQLite, put uploads on S3-compatible storage, set APP_KEYS and secrets via env, build the admin, and deploy self-hosted Strapi from Git on a managed Node server."
target_keyword: self-host Strapi
secondary_keywords:
  - self-hosted Strapi
  - deploy Strapi to production
  - Strapi production database
  - Strapi PostgreSQL
  - Strapi S3 upload provider
  - Strapi APP_KEYS
  - Strapi environment variables
  - Strapi headless CMS hosting
  - Strapi SQLite production
author: Kloudbean Engineering
hero_image: images/hero.png
cluster: Self-Hosted Tools
---

![Self-host Strapi in production: the Strapi Node app backed by managed PostgreSQL with uploads on S3-compatible storage](images/hero.png)

# How to Self-Host Strapi in Production (Without Losing Your Data)

Strapi is the open-source Node.js headless CMS teams reach for when they want an API-driven content layer they own. It's a pleasure to build with. Then you self-host Strapi in production and the defaults that felt smooth on your laptop turn on you. A SQLite file that resets on redeploy. Uploaded images that vanish when the app restarts. Editors logged out for no obvious reason. This guide is the production version: how to deploy self-hosted Strapi on a real database, with durable uploads and secrets that stay put.

> **The short version:** Run the Strapi Node app on a managed Node server, back it with **managed PostgreSQL** instead of SQLite, and send uploads to **S3-compatible object storage** instead of local disk. Set `APP_KEYS` and the other secrets as environment variables, build the admin panel, then deploy from Git so every push ships. Do those five things and self-hosted Strapi behaves in production exactly like it did in dev.

## Why self-host Strapi in the first place?

Hosted SaaS content platforms are convenient. You sign up, you're editing in minutes. The bill and the boundaries show up later. Strapi flips that. You run the CMS yourself, which buys you things a hosted CMS can't offer:

- **You own the content and the data.** Every entry, media file, and editor account lives in a database and a bucket you control, in the region you choose. Nothing sits in a vendor's account waiting on an export button.
- **No per-seat or per-record pricing.** Hosted headless CMS plans meter editors, API calls, records, or bandwidth. A server you rent doesn't care how many editors log in or how often your frontend hits the API.
- **Custom fields, plugins, and logic.** Strapi is code. You write custom controllers, add lifecycle hooks, install or build plugins, and shape content types to fit your product.
- **Your API on your terms.** REST and GraphQL out of the box, your own auth rules and rate limits, running next to the rest of your stack instead of across the public internet.

The tradeoff is honest: self-hosting means you run it, so updates and the database are yours to look after. That's the exact part a managed server eases, which is most of what this guide is about. Weighing Strapi against other tools you'd run yourself? The [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/) roundup is a good map, and the sibling [self-host Supabase](https://www.kloudbean.com/blog/self-host-supabase/) guide covers a heavier backend if you need auth and storage baked in. If you'd rather the CMS wrap an existing database than own the schema, [self-hosting Directus](https://www.kloudbean.com/blog/self-host-directus/) is the database-first alternative to weigh.

## What a production Strapi actually looks like

Strapi on your laptop is one process reading a file. In production it's three moving parts, and the two that hold state have to live outside the app process, because that process is disposable. It gets restarted, redeployed, sometimes cloned. Here's the shape you're building toward.

<!-- SVG diagram in the HTML: Client -> Strapi (Node runtime, PM2) -> managed PostgreSQL over a private network, and Strapi -> S3-compatible object storage for uploads. Brand navy/purple/green. -->

*The Strapi Node app serves the API and admin. Content and users live in managed PostgreSQL over a private network. Uploads go to S3-compatible object storage, not the app's disk.*

Notice what's not inside the app box: your data and your files. That separation is the whole game. When the Strapi process can be thrown away and recreated without losing a thing, you're in production. When your data rides inside the process, you're one redeploy from an incident.

## The mistakes that break self-hosted Strapi in production

Almost every broken self-hosted Strapi we've seen traces back to the same short list. None of these show up in development, which is exactly why they're dangerous. They wait for production.

### Leaving Strapi on SQLite in production

Strapi ships with SQLite so `npm run develop` works with zero setup. SQLite is great in dev and wrong for prod Strapi. It's a single file on disk, so it inherits every weakness of that disk. On most deploy platforms the filesystem is ephemeral, so a redeploy or restart can wipe the file and every entry in it. It also allows one writer at a time, so two editors saving at once start queuing. Move to **PostgreSQL** before real content goes in. This is the most important change on the list.

### Storing uploads on the local disk

Strapi's default upload provider writes to `public/uploads` on the app server. Same disk, same problem. Those files vanish on redeploy, and once you run a second instance, each one only sees the files it received. Media needs to live somewhere durable and shared: **S3-compatible object storage** through an upload provider, not the local folder.

### Missing or rotated APP_KEYS

`APP_KEYS` signs Strapi's session cookies. If it's absent, Strapi won't start cleanly in production. If it changes between deploys, every session signature becomes invalid and every logged-in editor gets kicked out. Set `APP_KEYS` once as an environment variable and keep it stable across deploys. Same rule for `ADMIN_JWT_SECRET`, `JWT_SECRET`, and the token salts.

### Forgetting NODE_ENV=production

Strapi reads `NODE_ENV` to decide how to behave. Without `NODE_ENV=production` it can run in a development mode that exposes things you don't want on a public box. Set it explicitly. It also lets you keep a separate `config/env/production` folder for prod-only settings.

### Never building the admin panel

The Strapi admin is a React app that has to be compiled before it's served. Run `npm run start` without a prior `npm run build` and you get a broken admin, usually a blank page or a 404 where the dashboard should be. The build isn't optional in production. Wire it into your deploy so it runs on every push.

## Self-hosted Strapi vs a hosted headless CMS

Hosted platforms like Contentful or Sanity are genuinely good, and for a small marketing site with a couple of editors they can be the right call. The differences that matter show up as you grow: who holds the data, and who sends the invoice.

| | Self-hosted Strapi | Hosted headless CMS (SaaS) |
| --- | --- | --- |
| **Data ownership** | Your database, your bucket, your region | Their cloud account; export when they allow it |
| **Cost model** | Flat server price, unmetered editors and API calls | Per seat, per record, per API call, per bandwidth |
| **Customization** | Full: custom fields, controllers, plugins, code | Whatever the platform exposes |
| **Who runs and updates it** | You (a managed server does the OS and stack) | The vendor, entirely hands-off |
| **Vendor lock-in** | Open source, plain Postgres, portable | Proprietary model and API to migrate off |

Fair credit to the SaaS side: hands-off really is hands-off, and for a tiny site that convenience can beat ownership. But once your content becomes a core asset, or editors and API traffic drive the bill, self-hosted Strapi is usually the better long game.

<!-- ADD IMAGE: Strapi Media Library showing uploaded files served from your S3-compatible bucket URL, not the local server. -->

## The config that makes Strapi production-ready

This is the part that turns a dev project into something you can run. Four pieces: the database config, the secrets, the build and start commands, and the S3 upload provider. All of it reads from the environment, so nothing sensitive lands in your repo.

### config/database.js (PostgreSQL)

Tell Strapi to use the `postgres` client and read its connection from the environment. This is the standard Strapi database config, trimmed to the Postgres path:

```js
// config/database.js
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      // one connection string is simplest in production
      connectionString: env('DATABASE_URL'),
      // discrete vars work too, and act as fallbacks
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD', ''),
      ssl: env.bool('DATABASE_SSL', false),
    },
    pool: {
      min: env.int('DATABASE_POOL_MIN', 2),
      max: env.int('DATABASE_POOL_MAX', 10),
    },
    acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
  },
});
```

If your database sits on a private network, where it should, you can usually leave `DATABASE_SSL` off, since traffic never crosses the public internet. TypeScript projects use the same shape in `config/database.ts`.

### The environment variables that matter

These are the secrets and settings Strapi needs in production. Set them in your host's environment, never in code. Generate each secret as its own long random string, for example with `openssl rand -base64 32`:

```bash
# Runtime
NODE_ENV=production

# Strapi secrets (generate unique random values, keep them stable)
APP_KEYS=key1base64,key2base64,key3base64,key4base64
API_TOKEN_SALT=another-random-value
ADMIN_JWT_SECRET=another-random-value
JWT_SECRET=another-random-value
TRANSFER_TOKEN_SALT=another-random-value

# Database
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://strapi:STRONGPASSWORD@10.0.0.5:5432/strapi
DATABASE_SSL=false

# S3-compatible uploads
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://your-s3-endpoint.example.com
S3_REGION=us-east-1
S3_BUCKET=strapi-uploads
```

`APP_KEYS` takes a comma-separated list; a handful of keys is normal. Keep every value identical across deploys so sessions and tokens survive a redeploy. More on the habit in [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

<!-- ADD IMAGE: Terminal running openssl rand to generate APP_KEYS and the JWT secrets. -->

### Build and start commands

Compile the admin panel, then start Strapi in production mode. In development you'd use `npm run develop`; production is a build followed by start:

```bash
# build the admin panel (required before start)
npm run build

# start Strapi in production
NODE_ENV=production npm run start
```

On a managed server your process manager keeps `npm run start` alive and restarts it if it crashes. The build runs as part of the deploy, which we'll wire up next.

### config/plugins.js (S3 upload provider)

Install the provider first, then point it at your bucket:

```bash
npm install @strapi/provider-upload-aws-s3
```

The provider speaks the AWS S3 API, so it works with any S3-compatible endpoint. `forcePathStyle` is the flag most S3-compatible storage needs:

```js
// config/plugins.js
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env('S3_ACCESS_KEY_ID'),
            secretAccessKey: env('S3_SECRET_ACCESS_KEY'),
          },
          endpoint: env('S3_ENDPOINT'),
          region: env('S3_REGION'),
          forcePathStyle: true,
          params: {
            Bucket: env('S3_BUCKET'),
          },
        },
      },
      actionOptions: { upload: {}, uploadStream: {}, delete: {} },
    },
  },
});
```

One step people miss: Strapi's default security middleware sets a content security policy that can block images from an outside domain. Add your bucket host to the `img-src` and `media-src` directives in `config/middlewares.js`, or the Media Library shows broken thumbnails even though the files uploaded fine.

## Deploying Strapi on a managed Node server

Strapi is a Node app, so you deploy it like any Node service: add it to the managed Node runtime, give it a managed PostgreSQL, set the env vars, connect Git. One clarification. There's no one-click "Strapi" button here. You deploy your own Strapi repo onto the managed Node runtime, which is what you want for an app you're customizing. Same general flow as [deploy a Node app to a managed cloud](https://www.kloudbean.com/blog/deploy-node-app-to-managed-cloud/).

### 1. Launch managed PostgreSQL

Open the database section and launch a PostgreSQL instance. It's provisioned, secured, kept on a private network, and backed up for you. Note the connection details for the env vars next.

![The Kloudbean console Launch Database screen, creating the managed PostgreSQL that backs self-hosted Strapi](../assets/console/launch-database.png)

*Launch a managed PostgreSQL for Strapi. More on sizing and backups in the [managed PostgreSQL](https://www.kloudbean.com/blog/managed-postgresql-hosting/) guide.*

### 2. Add your Strapi app as a Node application

Create a new application on the Node runtime and point it at your Strapi project. Standard Node deployment, running under PM2 so the process stays up and restarts on failure.

![The Kloudbean console Add Application screen, deploying the Strapi Node app onto the managed Node runtime](../assets/console/add-application.png)

*Add the Strapi app on the managed Node runtime. Strapi runs as your own Node application, not a one-click install.*

### 3. Set APP_KEYS and the rest of your secrets

Open Runtime Configuration, then Environment Variables, and paste in the block from earlier: the Strapi secrets, `DATABASE_URL`, `NODE_ENV=production`, and the S3 credentials. Save, and the app picks them up on its next start.

![The Kloudbean console Environment Variables screen holding Strapi APP_KEYS, JWT secrets, DATABASE_URL and S3 credentials](../assets/console/env-vars.png)

*Environment Variables: APP_KEYS, the JWT secrets, DATABASE_URL, and the S3 keys live here, never in the repo.*

### 4. Connect Git and deploy on every push

Link your GitHub repository and set it to build and start on push. Put `npm run build` in the build step so the admin compiles every time, then let the process manager run `npm run start`. Live build logs stream in the console, so a failed build tells you why.

![The Kloudbean console Git deployment screen, building and starting self-hosted Strapi on every push from GitHub](../assets/console/git-deployment.png)

*Git deploys: push to your branch, Strapi rebuilds the admin and restarts. Full walk-through in [CI/CD auto-deploy from GitHub](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/).*

<!-- ADD IMAGE: The Strapi admin login screen running on your own domain over HTTPS after the first deploy. -->

## Lock down your self-hosted Strapi

You're running a public content API and an admin panel, so a little hardening goes a long way. None of this is exotic, and most of it you set once.

- **Secrets in env, never in code.** Every value from the env block belongs in the environment. Nothing sensitive in the repo, ever.
- **Keep `.env` out of Git.** Add it to `.gitignore` and set values on the server. A leaked `ADMIN_JWT_SECRET` is an admin-account problem.
- **Database on the private network.** Your PostgreSQL should be reachable by Strapi internally, not exposed to the public internet where scanners find it.
- **Least-privilege database user.** Strapi's Postgres user needs its own database and normal read/write rights, not superuser.
- **Lock down the admin route.** Restrict who can reach the admin panel, use strong admin passwords, and lean on the Shorewall firewall and Fail2ban that come with the server.
- **Back up the database.** The Postgres database is your content. Server-level backups cover the box; keep database dumps too. Our [server backups guide](https://www.kloudbean.com/blog/server-backups-guide/) has sane defaults.

<!-- ADD IMAGE: Strapi Settings showing Administrator roles and the Users and Permissions plugin locked down. -->

## Scaling Strapi past a single instance

One Strapi process handles a surprising amount of traffic, so don't reach for more before you need it. When you do scale out, the earlier architecture is what makes it possible. Multiple instances only work if they share the same state: one PostgreSQL, one S3-compatible bucket. That's the real reason local SQLite and local uploads fail, they're private to a single process. Put a load balancer in front (Kloudbean's FLB is built in for this), point every instance at the same database and bucket, and requests spread cleanly.

![The Kloudbean console Flexible Load Balancer screen, spreading traffic across multiple Strapi instances that share one database and bucket](../assets/console/flb-load-balancer.png)

*Scaling out: FLB in front of multiple Strapi instances, all sharing the same managed PostgreSQL and S3 bucket.*

Keep media in object storage no matter how many instances you run. And a slow content API is nearly always a database question: add the right indexes, watch your queries, resize the server before you add machines.

---

**Own your content layer, end to end.** Run self-hosted Strapi on a managed Node server, backed by managed PostgreSQL and S3-compatible uploads, with secrets in env, Git deploys, and automatic backups handled for you. Start free at [kloudbean.com](https://www.kloudbean.com/); plans on [pricing](https://www.kloudbean.com/pricing/).

Managed Node runtime · Managed PostgreSQL · S3-compatible storage · Private networking · Automatic backups · Free migration · Free trial

## FAQ

**Can I self-host Strapi?**
Yes. Strapi is open source and self-hosting is how it's designed to run. You deploy the Strapi Node app on a server you control, back it with a real database, and point uploads at object storage. On a managed Node server the OS, SSL, and backups are handled while you keep the code and data.

**What database should Strapi use in production?**
PostgreSQL is the safe default, and MySQL or MariaDB also work. Use a real client-server database with its own storage, its own backups, and support for many concurrent writers. Managed PostgreSQL on a private network is a clean fit for Strapi.

**Why not use SQLite with Strapi in production?**
SQLite is a single file on disk, so it inherits the disk's fate. On ephemeral filesystems a redeploy or restart can wipe it, and it allows only one writer at a time. It's excellent for local development and wrong once real editors and content are involved. Switch to PostgreSQL before launch.

**Where should Strapi store uploaded media?**
In S3-compatible object storage through an upload provider, not the local disk. Local uploads disappear on redeploy and aren't shared across instances. Install a provider like the AWS S3 provider, point it at your bucket, and your media becomes durable and shared.

**What are Strapi APP_KEYS?**
APP_KEYS is a comma-separated list of secret keys Strapi uses to sign session cookies. If it's missing, Strapi won't start cleanly in production; if it changes between deploys, everyone gets logged out. Set it once as an environment variable and keep it stable across deploys.

**How do I deploy Strapi from GitHub?**
Connect your repository to the app and set the deploy to build and start on push. Put npm run build in the build step so the admin panel compiles, then run npm run start under a process manager. Live build logs show what happened on each deploy.

**Do I need to build the Strapi admin panel before starting?**
Yes. The admin is a React app that must be compiled with npm run build before npm run start can serve it. Skip the build and you get a blank page or a 404 where the dashboard should be. Run the build automatically on every deploy.

**Is self-hosted Strapi free?**
The Strapi Community Edition is free and open source, and it's the version most self-hosted setups run. You pay for the server and the managed services around it, not per editor or per API call. That flat cost is a big part of why teams self-host as they grow.

**Can I run multiple Strapi instances behind a load balancer?**
Yes, as long as every instance shares the same database and the same object storage bucket. Put a load balancer in front and point all instances at the shared PostgreSQL and S3 bucket. This is exactly why local SQLite and local uploads can't scale: they're private to one process.

**How do I move a Strapi project from SQLite to PostgreSQL?**
Point config/database.js at PostgreSQL, set DATABASE_CLIENT and DATABASE_URL, and start Strapi against the empty database so it builds the schema. Then migrate your content across, either through Strapi's data transfer tooling or a fresh import. Free migration assistance can help with the move.

---

*By Kloudbean Engineering · Own your content layer*
