---
title: "Deploy a Cursor App to Production: the Localhost Trap"
slug: deploy-cursor-app
meta_description: "How to deploy a Cursor app to production on a server you own, plus the localhost assumptions in AI-generated code (hard-coded ports, SQLite, baked-in secrets) you need to fix before it goes live."
target_keyword: deploy Cursor app
secondary_keywords:
  - host Cursor-built app
  - deploy app built with Cursor
  - Cursor production deployment
  - Cursor app hosting
author: Kloudbean
hero_image: images/hero.png
cluster: 1 - Deploy AI / Vibe-Coded Apps
---

![From Cursor to production: deploying a Cursor-built app on a server you own](images/hero.png)

# Deploy a Cursor App to Production: the Localhost Trap

Cursor wrote most of your app, and it's real code. Normal files, a Git history you can read, dependencies you chose. That's the good part, and it's a real edge over the closed AI builders. To deploy a Cursor app you're just moving standard code onto a standard server.

The catch is quieter. Cursor is very good at one thing: getting the app working on your machine, right now. And your machine hands it a pile of free services it silently assumes will always be there. A port it can grab. A file that never disappears. Your secrets, sitting in a folder. They won't be there on a server. Almost every failed first deploy of an AI-built app traces back to one of those assumptions, not to anything hard about hosting. So this splits in two: the handful of things localhost was faking, and then the deploy, which honestly takes about five minutes.

> **Short version:** Push your repo to GitHub, launch a Node server, connect the repo, and set your port, build, and start commands. Before that, fix what localhost was covering for: a hard-coded port, a SQLite file, secrets read from a `.env`, and uploads written to local disk. The deploy is quick. The cleanup is the actual work, and it's maybe twenty minutes.

## What localhost was quietly doing for you

When Cursor writes `app.listen(3000)` and points the database at `./dev.db`, that isn't a bug. On your laptop it's the fastest thing that works, so that's what the model reaches for. The trouble is that a production server doesn't offer the same conveniences, and it shouldn't. A server that let any process keep a file forever and grab any port would be a server you couldn't trust.

So the job before you deploy is small and specific. Find the places your app leaned on the laptop, and point them at something durable instead. Here's the whole map on one screen.

| On your laptop | In production |
| --- | --- |
| A port you picked (3000) | `process.env.PORT` (assigned) |
| `dev.db`, a file on disk | A managed Postgres or MySQL |
| `.env` sitting in the folder | Env vars stored in the console |
| `./uploads` on local disk | S3-compatible object storage |
| One process, restarted by hand | Managed process that auto-restarts |

*Localhost gives your app a free port, a file that persists, your secrets, and a disk. A server gives you the durable version of each. Most first-deploy bugs are one of these five.*

Split them by how you fix them. Three are edits in your own code. Three are a matter of using a real service instead of the laptop. Do the code ones first, because they're the ones that stop the app booting at all.

| What Cursor tends to scaffold | Why it breaks in production | The fix |
| --- | --- | --- |
| `app.listen(3000)` | The platform assigns the port. Nothing is listening where it expects. | Listen on `process.env.PORT` |
| Frontend calls `http://localhost:3000` | There is no localhost on a user's browser. Requests fail silently. | Relative `/api` path or a build-time URL |
| `VITE_`/`NEXT_PUBLIC_` vars | They're frozen into the bundle at build time, not read live. | Set them before the build runs |
| SQLite `file:./dev.db` | The filesystem resets on redeploy. Your data vanishes. | A managed Postgres or MySQL |
| File uploads to `./uploads` | Same reset. Uploaded files disappear on the next deploy. | S3-compatible object storage |
| Sessions in a JS object | Gone on restart, and not shared across processes. | Managed Redis |

## The three you fix in your code

These live in your repo, so fix them, commit, and push before you touch the console.

### 1. Read the port from the environment

This one denies you a green deploy more than anything else. Your server has to listen on the port it's handed, not a number Cursor liked.

```js
// Cursor tends to write this
app.listen(3000, () => console.log("listening on 3000"));

// production needs the assigned port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on ${port}`));
```

### 2. Stop the frontend from calling localhost

If Cursor hard-coded your API base URL to `http://localhost:3000`, every request from a real browser goes nowhere. The user's machine has no localhost server. Use a relative path when the same app serves the API, or an environment-driven URL when it doesn't.

```js
// baked into the built bundle, dead in production
const api = axios.create({ baseURL: "http://localhost:3000/api" });

// relative path (same-origin API), or an env var
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "/api" });
```

<!-- ADD IMAGE: Browser DevTools Network tab showing the failed request to http://localhost:3000 from the deployed site. -->

### 3. Know that frontend env vars bake in at build time

This one costs people an afternoon. Anything prefixed `VITE_` or `NEXT_PUBLIC_` is not read when your app runs. It's stamped into the JavaScript when the build runs, then it's frozen. So if you deploy, then add `VITE_API_URL` in the console afterward, nothing changes. The old value is already inside the bundle. Set those variables first, then build. If you added one late, just redeploy so the build picks it up. Backend secrets like `DATABASE_URL` behave the opposite way. They're read live at runtime, which is why they belong in the console and never in the repo. If you want the full mental model, we wrote it up in [environment variables, done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

## The three you fix with a real service, not code

### Move off SQLite before you have users

SQLite is a joy in development. It's also the wrong production database the moment you have real traffic or more than one process, and Cursor loves to default to it. The deeper problem on most platforms is that the disk resets when you redeploy, so `dev.db` and everything in it is gone on your next `git push`. People discover this the worst possible way: a customer signs up, the deploy goes out an hour later, the account is gone.

Launch a managed Postgres or MySQL instead and point your app at it with a connection string. With Prisma it's a two-line schema change plus a migration in your build step.

```
// prisma/schema.prisma, the dev default Cursor leaves behind
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// what production wants
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

The migration part is the step people skip, and then they hit "relation does not exist" on first load because the tables were never created. Run migrations as part of the build, not by hand:

```
npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
```

Use `migrate deploy`, not `migrate dev`. The `dev` variant is interactive and can try to reset the database, which is not what you want anywhere near production. Kloudbean runs seven managed engines (Postgres, MySQL, MariaDB, Redis, Memcached, MongoDB, Elasticsearch), so if your app already speaks Mongo or MySQL you're not forced to rewrite it. More on the setup in [adding a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/) and the [managed PostgreSQL](https://www.kloudbean.com/blog/managed-postgresql-hosting/) guide.

<!-- ADD IMAGE: Terminal running `npx prisma migrate deploy`, creating tables on the managed database. -->

### Send uploads to object storage, not the disk

If your app lets people upload anything, an avatar, a PDF, a CSV, and Cursor wired `multer` to write into `./uploads`, those files live on the same disk that resets on redeploy. Same disappearing act as SQLite. Point uploads at an S3-compatible bucket instead. Kloudbean has object storage built in with full AWS S3 SDK compatibility, so the standard `@aws-sdk/client-s3` code works unchanged. Here's the [object storage walkthrough](https://www.kloudbean.com/blog/s3-compatible-object-storage/).

### Keep session and cache state in Redis

A pattern the AI reaches for a lot: `const sessions = {}`, or an in-memory rate limiter, or a cache that's just a Map. Fine for one process on your laptop. On a server it evaporates every time the app restarts, and if you run Node across multiple processes with PM2, each process has its own copy, so a user's login works one request and fails the next. Managed Redis fixes both. It's shared, and it survives restarts.

## The deploy, which really is the boring part

Repo cleaned up? Good. The rest is a short path through the console, and there's genuinely no Nginx to configure or runtime to install by hand.

Sign in to the [Kloudbean](https://www.kloudbean.com/) console and click **Add Server**. Pick your **Cloud Provider** (AWS, DigitalOcean, Linode, Vultr, GCP, UpCloud, or Lightsail), choose **Node.js** as the application, pick the datacenter closest to your users, and give a Node build a couple of gigs of headroom on the server size. **Launch Now** provisions it in a few minutes with the stack ready.

![Kloudbean Add Server screen: choosing cloud provider, Node.js application, datacenter, and server size](../assets/console/add-server.png)

Open the app, go to **Application Administration → Deploy Code**, and you're on the Git Deployment screen. This is where the whole thing happens.

![Kloudbean console Deploy Code / Git Deployment screen: connect a repo, then set App Directory, port, and build and start commands](../assets/console/git-deployment.png)

Connect GitHub over OAuth (or drop in the SSH key it shows you), paste the repository URL, pick the branch, and hit **Clone Repository**. Then the runtime fields, which are the part that matters:

- **App Directory**: the folder holding your `package.json`. Monorepo with the server in `/apps/server`? Put that here.
- **Port**: the port the platform assigned. Your app reads it from `process.env.PORT`, which you already fixed.
- **Node Version**: match what you built on.
- **Install / Build / Start**: `npm ci`, your build command (including the Prisma line above if you use it), then `npm start` or `node server.js`.

Click **Pull & Deploy**. Kloudbean pulls the code, pins your Node version, installs, builds, and puts it on the web. Then wire up the database and secrets:

![Kloudbean Launch Database screen for creating a managed Postgres or MySQL instance](../assets/console/launch-database.png)

In **Runtime Configuration → Environment Variables** there's a **Paste .env Content** tab. Drop your local `.env` in, **Convert to Key/Value**, and swap the dev values for the real ones, especially the database connection string pointing at the instance you just launched.

![Kloudbean environment variables editor with a paste .env content tab and key value list](../assets/console/env-vars.png)

```
DATABASE_URL=postgres://kb_user:generated-pass@127.0.0.1:5432/kb_appdb
APP_URL=https://yourapp.com
VITE_API_URL=https://yourapp.com/api
OPENAI_API_KEY=sk-...
SESSION_SECRET=a-long-random-string
```

Last, add your custom domain under **Domain Aliases**, point its DNS at the server, and install a free **Let's Encrypt** certificate so it's HTTPS and renews itself. Turn on **automated deployment** and every push to your branch builds and ships on its own, with the build log streaming live in the console. From then on, shipping is just `git push`. That's the same auto-deploy loop the per-app platforms rent you, except it's [running on a server you own](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/).

<!-- ADD IMAGE: Your Cursor app live on its custom domain with the SSL padlock in the address bar. -->

## One app, or two?

Cursor projects land in one of two shapes, and each has a clean answer.

Built a **single full-stack app**, like a Next.js project where the pages and API routes share a repo? It's one application. The App Directory is your project root, one process serves everything, done.

Built a **separate frontend and backend**, say a Vite React SPA and a standalone Express API? You've got two good options. Simplest: build the frontend and let your Node server serve those static files, so it stays one app on one domain. Or run them as two applications on the same server, the API on `api.yourapp.com` and the client on `app.yourapp.com`, which you add from **Applications → Add Application**. Same box, same bill. Mirror whatever you already do locally: one dev server means one app, two dev servers means two. The mechanics of stacking apps are in [hosting multiple apps on one server](https://www.kloudbean.com/blog/host-multiple-apps-one-server/).

<!-- ADD IMAGE: The Applications list on one server, API on api.yourapp.com and client on app.yourapp.com. -->

## Do you actually need Docker for this?

No. Not for a single Cursor app. A Dockerfile and a Kubernetes cluster solve problems you don't have yet: fleets of services, teams shipping in parallel, orchestration across many machines. Your app is a Node process. A managed server runs it directly, restarts it if it falls over, and gets out of the way. If you're ever running dozens of services and need real orchestration, that's an enterprise conversation and a different article. Docker does earn its place once you have fiddly system dependencies or a team that needs identical environments, and [where the Docker line actually falls for an AI-built app](https://www.kloudbean.com/blog/do-i-need-docker-to-deploy-an-ai-app/) walks through those cases. For getting your Cursor build in front of users this week, containers are ceremony you can skip.

## When it still won't go green

First deploy shows a **503**? A 503 means the app isn't running, so the real reason is in its own log. You read that in the dashboard: **Application Administration → Logs Viewer**, then the **App Errors** tab. Search it if the file is long. The other tabs are **App Info** for the app's informational output and **Web Requests Logs** for the web server's access log, which is handy for telling "the app crashed" apart from "the request never got there". A build that failed instead of a process that died shows up in **Build and Deployment History**, output and all.

Same files, on disk, if you'd rather stay in a terminal or use the File Manager:

```
/home/admin/hosted-sites/<app_system_user>/app-logs/app.error.log
```

One less obvious cause with AI-built TypeScript projects: the build fails because the tools it needs (the TypeScript compiler, Vite, Tailwind) are in `devDependencies`, and something set `NODE_ENV=production` before install, so `npm` skipped them. Either move the build-time tools where they belong or make sure install runs before that variable is set. Cheapest way to catch this class of failure before the server does: clone your repo into an empty folder and build it there, which is exactly the test behind [whether an AI editor project builds from a clean clone](https://www.kloudbean.com/blog/deploy-windsurf-app/). There's also `sudo adm`, the deploy utility, which runs the whole build-and-ship in one command over SSH. The full 503 playbook is [here](https://www.kloudbean.com/blog/fix-503-after-deploying-your-app/).

<!-- ADD IMAGE: the Logs Viewer open on the App Errors tab, showing the missing-variable line behind the 503. -->

## What you own, and what you don't

Kloudbean runs Linux stacks: Node, plus PHP, Python, Ruby, and Java, with the frameworks on top (React, Next.js, Vue, Laravel, Django, WordPress). That's essentially everything Cursor builds for the web. If you had Cursor write a classic Windows or .NET app that expects IIS and SQL Server, that's a port, not a deploy, and this isn't the platform for it. "Managed" means the server, the stack, SSL, backups, and patching are handled. Your code and your data stay yours. You can move hosts whenever you like, because underneath it's a normal Linux box running normal code. No slot to rent, no per-app tax as you grow.

## Ship it

You did the hard part in the editor. Get your Cursor app live at [kloudbean.com](https://www.kloudbean.com/), with a free trial and your first migration done for you. Want the tool-agnostic version that covers Lovable, Bolt, v0, and Replit too? That's the [deploy an AI-built app](https://www.kloudbean.com/blog/deploy-ai-built-app-to-production/) guide. Server sizes and plans are on [pricing](https://www.kloudbean.com/pricing/).

## FAQ

**Why does my Cursor app work locally but break in production?**
Because localhost provides things a server doesn't: any port you want, a disk that persists, and your `.env` file sitting right there. Cursor writes code that assumes those. The fixes are reading the port from `process.env.PORT`, moving off a local SQLite file to a managed database, storing secrets as environment variables, and sending uploads to object storage.

**Can I deploy a Cursor app without DevOps experience?**
Yes. The server-level work (stack, process manager, SSL, backups) is handled for you. You launch a Node server, connect your Git repo in Deploy Code, set the App Directory, port, and start command, add your environment variables, and click Pull & Deploy.

**My Cursor app uses SQLite. What database should I use in production?**
A managed Postgres or MySQL. SQLite is great for development, but on most hosts the disk resets on redeploy, so the file and its data disappear. Launch a managed instance, point your connection string at it, and run your migrations as part of the build so the tables exist on first boot.

**My Cursor project is a monorepo. Does that work?**
Yes. Point the **App Directory** field at the folder holding your server's `package.json`, for example `/apps/server`, set the matching build and start commands, and deploy. If you also host a separate frontend, add it as its own application on the same server.

**Where do my API keys and database credentials go?**
Into environment variables, never the code. Use Runtime Configuration → Environment Variables, where there's a Paste .env tab. Add your database connection details and API keys and save. Launch the database itself from the Managed Database section first.

**Why is my deployed frontend blank or still calling localhost?**
Frontend variables prefixed `VITE_` or `NEXT_PUBLIC_` are baked into the bundle at build time, not read at runtime. If you set them after building, redeploy so the build picks up the new values. A blank page is often the frontend calling a hard-coded localhost API that doesn't exist for the visitor's browser.

**Do I need Docker to deploy a Cursor app?**
No. A single Cursor app is a Node process, and a managed server runs it directly. Docker and Kubernetes solve orchestration problems that show up at much larger scale. For getting your app in front of users, you can skip them.

**Do I keep full ownership of the app?**
Yes. The code, the data, and the server are yours, with no per-app pricing and no lock-in. Because it's a standard Linux server running standard code, you can move hosts whenever you want.
