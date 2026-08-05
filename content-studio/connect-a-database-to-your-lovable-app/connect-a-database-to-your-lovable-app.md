---
title: "How to Connect a Database to Your Lovable App the Right Way"
slug: connect-a-database-to-your-lovable-app
meta_description: "How to connect a database to your Lovable app safely: own your Lovable Supabase Postgres or add a managed database, keep DATABASE_URL on the server, and never in the browser."
target_keyword: connect a database to your Lovable app
secondary_keywords:
  - Lovable database
  - Lovable Supabase
  - add a database to Lovable
  - Lovable production database
  - Lovable Postgres
author: Kloudbean
hero_image: images/hero.png
cluster: 1 - Deploy AI / Vibe-Coded Apps
---

![Connect a database to your Lovable app safely, reached through a server, not the browser](images/hero.png)

# How to Connect a Database to Your Lovable App the Right Way

You built something in Lovable and it works. People can sign up, data shows up, it feels like a real product. Then the obvious question lands: how do you connect a database to your Lovable app that you actually own, one that won't vanish on the next change or get expensive the moment real users arrive? Good news, and a small catch. Your Lovable app already has a database (Supabase, most likely). The catch is doing the connection safely, because the wrong way quietly hands your entire database to the internet.

> **How do I connect a real database to a Lovable app?** Your Lovable app already talks to Supabase Postgres by default, and for many apps that is a real database. To connect your own, you have two honest paths: keep Supabase but run it on infrastructure you own, or add a managed PostgreSQL or MySQL and reach it through a small server. Either way the connection lives in a server-side `DATABASE_URL`, never in front-end code. A raw database connection in the browser is a leak, not a feature.

## What your Lovable app is already using for a database

Before you add anything, know what you have. Lovable ships a React frontend built with Vite, and it wires that frontend to **Supabase** for the dynamic parts: login, the database your rows live in, and file storage. Supabase is PostgreSQL underneath, with an API layer and auth bolted on. So in most cases your **Lovable database** already exists. It's a Postgres, you just didn't pick it by hand.

Here's the part that trips people up. The browser never speaks raw SQL to that Postgres. It calls Supabase's API with a public *anon key*, and Row Level Security decides what each request may touch. That indirection isn't an accident. It stands between "a database on the internet" and "a database anyone can drain," and it shapes how you connect your own database later.

One caveat: inside Lovable's preview, some state can be mocked so the UI feels alive. That isn't your production data. The real backend is Supabase, and that's what the app reads once you ship.

## When you actually need your own Lovable database

Plenty of apps never need to move off the default, and that's fine. But there are real reasons to want your own database behind a Lovable app:

- **Ownership.** Your data sits on infrastructure you control, not inside a product whose terms can change under you.
- **Cost at scale.** Metered backends look cheap at zero users and get spiky as you grow. A flat plan is predictable, which is what you want a bill to be.
- **The database next to the app.** Share a private network and queries skip the round trip across the public internet. Less latency, fewer moving parts.
- **One dashboard.** Server, app, and database in one login and one bill, instead of stitching three vendors together.

My honest take: most Lovable apps don't need to leave Supabase on day one. The **Lovable production database** question is an ownership question first, a technology question second. If Supabase does real work for you (login, uploads, row-level rules), owning it beats ripping it out. Move because the app is genuinely simpler your way, not to prove a point.

<!-- DIAGRAM: browser calls your API over HTTPS; only the API holds DATABASE_URL and talks to the managed database on a private network. Connecting the database straight from the browser is the blocked, leaking path. -->
*The safe shape: browser to your API over HTTPS, API to the managed database over a private network. The browser-straight-to-database path is the leak you avoid.*

## The rule that keeps you safe: your database never talks to the browser

This is the one thing to get right, so it goes before the how-to. Front-end code is public. Every string in your compiled JavaScript ships to the visitor's machine, and anyone can open DevTools and read it. There are no secrets in a browser bundle. There is only stuff you've decided to show the world, whether you meant to or not.

So two different things get confused, and the difference matters:

- The **Supabase anon key** is public *by design*. It's meant to sit in the frontend, and Row Level Security is what actually guards your data. Shipping it is expected and safe.
- A **raw database connection string** like `postgresql://appuser:s3cret@10.0.0.5:5432/appdb` is the opposite. It's full, unrestricted access to the database. No RLS, no gate. If that lands in front-end code, your database is effectively open to anyone who views source.

Here's the trap, and it's a common one. You add your own managed Postgres, a tutorial shows a two-line `pg` snippet, and you drop it straight into a component to "just get it connected." It works in the preview. It also compiles your database password into the public bundle. That's not a connection, that's a data breach with good intentions.

```js
// WRONG: this runs in the browser, so the password ships to every visitor
import { Pool } from "pg";
const pool = new Pool({
  connectionString: "postgresql://appuser:s3cret@10.0.0.5:5432/appdb",
});
// open DevTools on the live site and that string is right there
```

The fix is the shape from the diagram. The browser calls *your* server. Your server holds the connection and does the querying. The database credentials never leave the machine you control.

```js
// Browser: call your own API. No database credentials anywhere here.
const res = await fetch("/api/todos");
const todos = await res.json();
```

```js
// Server (Node/Express): the connection lives here, read from the environment
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get("/api/todos", async (_req, res) => {
  const { rows } = await pool.query("select * from todos");
  res.json(rows);
});
```

Same trap wears a second hat with Supabase. You hit a `401` while testing, you're tired, and you "fix" it by pasting the *service_role* key (the one that bypasses Row Level Security) into a `VITE_` variable so the request goes through. It goes through, all right, straight into the public bundle. A `401` means a policy is missing, not that you need the master key in the browser. If any of this feels fuzzy, the full mental model is in [environment variables, done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

<!-- ADD IMAGE: DevTools open on a live site, a database string visible in the bundle. Shows why front-end code holds no secrets. -->

## Two honest ways to connect a database to your Lovable app

Once you've decided you want a database you own, there are two paths that actually make sense. Both are fine. They fit different apps, and picking the wrong one burns a weekend.

### Path A: keep Supabase, but own it

You keep everything Lovable built (Auth, Storage, and the Postgres-with-RLS model) and just move it onto infrastructure you control. On Kloudbean, Supabase runs as a one-click managed app, so it sits in the same dashboard as the rest of your stack, backed up and yours. Nothing in the code changes. The frontend keeps using the **Lovable Supabase** client with your project URL and anon key. This is the low-risk path, and the right one if you lean on Supabase auth or storage. Rewriting login just to say you're on "plain Postgres" is a lot of risk for little reward.

Want to lift only the Postgres data out and drop the rest? You can, but then you're on the hook to replace auth, storage, and any Edge Functions yourself, because those are Supabase features, not Postgres ones.

### Path B: add a managed Postgres or MySQL directly

If Supabase was really just a database with a few tables, and you never touched auth, storage, or RLS, then a straight [managed PostgreSQL](https://www.kloudbean.com/blog/managed-postgresql-hosting/) (or MySQL) is simpler to reason about and one fewer moving part. You add the database, reach it through a small server or API, and put the connection in `DATABASE_URL`. This is the cleaner long-term shape for apps that outgrew the "backend as a service" model, or never really used it.

|  | Keep Supabase, own it | Add a managed Postgres / MySQL |
| --- | --- | --- |
| Login / auth | Works as-is | You rebuild it |
| File storage | Works as-is | You add object storage yourself |
| How the browser reaches data | supabase-js + anon key, guarded by RLS | Through your own API (never direct) |
| Effort to switch | Low | Medium |
| Best when | You use auth, storage, or RLS | Supabase was basically just a database |

Still weighing it? The deeper keep-or-move decision, with migration commands, is in [deploying a Lovable app to your own server](https://www.kloudbean.com/blog/deploy-lovable-app-to-your-own-server/), and the reasons teams seek [a Supabase alternative they control](https://www.kloudbean.com/blog/supabase-alternative/) are worth a read first.

## Connecting it, step by step

Here's the real click-path, whichever database you landed on. None of it needs a DevOps hire, but the steps are specific, so I'll show the actual screens.

### 1. Launch a managed database

Open the **DBS** section and hit **Launch Database**. Kloudbean runs seven managed engines, so pick PostgreSQL (the safe default for a Lovable app, since that's what it already used) or MySQL if your stack expects it. Name it, create it, and a minute or two later it's provisioned, on a private network, and already backed up. On Path A instead? Launch **Supabase** as a one-click app here rather than a bare database.

![Kloudbean Launch Database screen with managed PostgreSQL, MySQL, and other engines for a Lovable app](../assets/console/launch-database.png)

You'll get the connection details: host, port, database name, username, password. You need them in the next step. Don't paste them into your app's code.

### 2. Put the connection in DATABASE_URL, on the server

Open **Runtime Configuration then Environment Variables**. The **Paste .env Content** tab lets you drop everything in at once and convert to key/value. Set your server-side `DATABASE_URL` here. Keeping Supabase? The front-end `VITE_` values go here too (the project URL and anon key, safe to expose). What never goes in a `VITE_` variable: the raw database password or the Supabase service_role key.

```bash
# Server-side only, read at runtime, never shipped to the browser
DATABASE_URL=postgresql://kb_appuser:generated-pass@10.0.0.5:5432/kb_appdb

# Safe in the frontend build (public by design, guarded by RLS)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

![Kloudbean Environment Variables editor storing DATABASE_URL for a Lovable app safely, not in code](../assets/console/env-vars.png)

Because the connection is an environment variable, it stays out of your Git history and you can rotate the password without touching a line of code.

<!-- ADD IMAGE: The Paste .env tab converting a pasted block into key/value pairs, DATABASE_URL among them. -->

### 3. Run your Lovable app (and its API) on a real server

This is the step people skip, and it's the one that makes the safe shape possible. The static frontend can live on free static hosting, but the small server that holds `DATABASE_URL` and answers your API calls has to run somewhere always-on. From **Applications then Add Application**, pick your stack (Node, for most Lovable projects that ship a server). Kloudbean keeps a Node app alive under PM2, so it restarts itself instead of dying when a process hiccups.

![Kloudbean Add Application screen for running the server side of a Lovable app that holds the database connection](../assets/console/add-application.png)

If keeping Supabase, your "server" work is lighter, since supabase-js handles the data calls from the frontend. The full deploy of both halves (frontend and backend) is walked end to end in [deploy a Lovable app to your own server](https://www.kloudbean.com/blog/deploy-lovable-app-to-your-own-server/).

### 4. Verify it actually sticks

Redeploy so the app picks up the new variables, then do something real. Sign up a test user, create a record, reload, and confirm it stuck. If it won't connect, it's almost always one of three things: a typo in the connection string, the wrong variable name (your code wants `DATABASE_URL`, you set `DB_URL`), or a frontend built before the value existed. That last one shows up as a blank white page or a `supabaseUrl is required` error on load, because `VITE_` values freeze at build time. Set them first, then build.

<!-- ADD IMAGE: The live app, logged in, real rows loading from the managed database, padlock in the address bar. -->

## Founder note: a database in the browser or a local file is a demo, not production

I'll say this plainly, because it's the mistake underneath most of the others. A database you reach from front-end code, or a SQLite file on the app server's disk, is a demo. Not production. Both feel like they work, right up until they don't.

The local file gets wiped the first time the app redeploys onto a fresh disk, and a day of real signups goes with it. The browser connection leaks the instant someone opens DevTools. Neither is quietly making a restorable backup. Real production is boring by design: a managed database that lives on its own, reached through a server you control, backed up on a schedule you didn't have to build. Less exciting than the demo. Also the difference between an app and a story about the app you used to have.

## How this fits your Lovable app's bigger picture

Connecting the database is one piece of owning your whole stack instead of renting it a slice at a time. The tool-agnostic version, covering Cursor, Bolt, and v0 as well as Lovable, is the pillar guide on [deploying an AI-built app to production](https://www.kloudbean.com/blog/deploy-ai-built-app-to-production/). For the framework and ORM specifics (Prisma, Drizzle, Django, Laravel, Rails) plus migrations, see [adding a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/). Do it all in one place and your frontend, database, and object storage share one dashboard and one bill, so your next Lovable project rides the same server instead of a new subscription.

> **Coming from Supabase?** You don't have to choose between "stay locked in" and "rewrite everything." Run managed Supabase on infrastructure you own, or move to a plain managed Postgres. Both keep your data on hardware you control. The tradeoffs are in [the Supabase alternative breakdown](https://www.kloudbean.com/blog/supabase-alternative/).

## Give your Lovable app a database it actually owns.

Managed PostgreSQL and MySQL, one-click managed Supabase, automatic backups, and private networking, all beside your app on a server you control. Start free at [kloudbean.com](https://www.kloudbean.com/); plans on [pricing](https://www.kloudbean.com/pricing/).

One-click databases · Automatic backups · Private networking · Free migration · Free trial · Simple Git deploy

## FAQ

**How do I connect a database to my Lovable app?**
Your Lovable app already connects to Supabase Postgres by default. To connect your own, launch a managed PostgreSQL or MySQL (or managed Supabase), put the connection in a server-side `DATABASE_URL`, and reach it through a small API, never from front-end code. Redeploy and confirm a test record persists.

**Does my Lovable app already have a database?**
Almost certainly yes. Lovable wires your frontend to Supabase, which is PostgreSQL with auth and storage on top, so you usually already have a real database. The question is whether to keep Supabase, own it yourself, or swap in a plain managed Postgres.

**Can I connect my Lovable app directly to Postgres from the frontend?**
No. A raw connection string is full, unguarded access, and front-end code is public, so anyone could read it in DevTools. Put the connection on a server and have the browser call your API. The server holds `DATABASE_URL`; the browser never sees it.

**Is the Supabase anon key safe to expose in my Lovable app?**
Yes. The anon key is public by design and protected by Row Level Security, so it belongs in the frontend bundle. The key to protect is the service_role key, which bypasses RLS and must stay server-side. Never put it in a VITE_ variable.

**Where do I put DATABASE_URL in a Lovable app?**
In Runtime Configuration then Environment Variables on the server, not in your code or your repo. There's a Paste .env tab to add it quickly. Because it's an environment variable, it stays out of Git and you can rotate the password without a code change.

**Should I keep Supabase or move to my own managed Postgres?**
Keep Supabase if you rely on its auth, storage, or Row Level Security, and just run it on infrastructure you own. Move to a plain managed Postgres if Supabase was basically a database with a few tables. Moving off it means rebuilding login and uploads yourself, so move only if the app is genuinely simpler that way.

**How do I move my Lovable Supabase data to a managed Postgres?**
Supabase is Postgres underneath, so it's an ordinary export and import. Use pg_dump on the old database, load it into the managed one with pg_restore, then repoint your connection. Remember a plain Postgres won't carry Supabase Auth users or Storage, and free migration assistance can handle the move for you.

**Can I use MySQL instead of Postgres with my Lovable app?**
Yes. Managed MySQL works the same way: put a MySQL `DATABASE_URL` on the server and query it through your API. That said, PostgreSQL is the natural fit for a Lovable app, since Supabase already used Postgres and your schema will move over cleanly.
