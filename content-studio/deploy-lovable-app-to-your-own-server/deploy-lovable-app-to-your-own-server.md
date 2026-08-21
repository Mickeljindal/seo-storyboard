---
title: "Deploy a Lovable App to Your Own Server: the Supabase Half People Forget"
slug: deploy-lovable-app-to-your-own-server
meta_description: "A Lovable app is a React frontend wired to a Supabase backend. Here's how to deploy a Lovable app to a server you own, keep or move Supabase, get your VITE_ env vars right, and go live with SSL."
target_keyword: deploy Lovable app
secondary_keywords:
  - Lovable self-hosted hosting
  - host Lovable app on own server
  - Lovable production deployment
  - own your Lovable code
  - Lovable Supabase deployment
author: Kloudbean
hero_image: images/hero.png
cluster: 1 - Deploy AI / Vibe-Coded Apps
---

![Deploy a Lovable app on a server you own, the React frontend and the Supabase backend, both in one dashboard](images/hero.png)

# Deploy a Lovable App to Your Own Server: the Supabase Half People Forget

Lovable builds fast. You describe an app and it ships a working React frontend, styled with Tailwind, wired to a Supabase backend for login, data, and file uploads. It runs on Lovable's own hosting by default. So when you decide to deploy a Lovable app to your own server, the frontend turns out to be the easy half. The backend is the half people forget. And it's the half that breaks.

This guide splits the job the way the app is actually split: where the static frontend goes, and where Supabase lives. Get both right and you're live on your own domain in an afternoon. Get only the frontend right and you'll ship a login button that spins forever and a dashboard with no data. Same app, half a deploy.

> **Short version:** A Lovable app is a static React/Vite bundle plus a Supabase backend. Host the built frontend on free static hosting with SSL, then point it at a Supabase you control. Keep managed Supabase, or move the data into a managed Postgres. Set your `VITE_` variables before you build, and never put the Supabase `service_role` key in frontend env.

## A Lovable app is two things wearing one URL

Inside the Lovable editor it feels like a single thing. It isn't. There's a frontend, and there's a backend, and they only meet over the network. Naming the two halves is the whole trick to moving the app cleanly.

The **frontend** is a React app built with Vite and Tailwind. When you build it, Vite compiles everything down to a folder of plain static files: HTML, CSS, and JavaScript. No database, no secrets, no server logic. Just files a browser downloads.

The **backend** is Supabase. Lovable leans on it for the parts a static bundle can't do: user login, the Postgres database your data lives in, file storage, and sometimes Edge Functions for server-side logic. The frontend reaches all of that by calling your Supabase URL with a key that's baked into the build.

| The frontend does this | The backend (Supabase) provides |
| --- | --- |
| Login and signup screens | Auth |
| Lists and dashboards | Postgres (your data) |
| Uploading files | Storage |
| "Magic" server actions | Edge Functions |

*The frontend is a bundle of static files. Everything dynamic (login, data, uploads, server logic) is a call to Supabase. Move the frontend and forget Supabase, and all four of those calls have nowhere to go.*

## What breaks when you copy the frontend and forget the backend

Picture the wrong version of this. You build the frontend, drop the static files on a host, point your domain at it, and load the page. The layout is perfect. Then you click Sign in, and nothing happens. That's not a broken deploy. That's a frontend with no backend to talk to.

Here's what each thing you touch in the app is really doing under the hood, and what you see when the backend half is missing or misconfigured.

| What you do in the app | What it actually calls | What you see if the backend is wrong |
| --- | --- | --- |
| Log in or sign up | Supabase Auth | The button spins, then nothing. The console shows a failed request to the Supabase URL. |
| Load a list or dashboard | Postgres, over Supabase's API | Empty screen, or a `401`. Often "permission denied" when a row-level policy is missing. |
| Upload an avatar or file | Supabase Storage | Upload fails, images render broken. |
| Trigger a server action | An Edge Function | A `404` on the function endpoint. |
| Anything, wrong address | The baked-in `VITE_SUPABASE_URL` | The app talks to your old project, or to nowhere at all. |

The fix is never to rewrite the app. It's to give the frontend a real Supabase to talk to, then point the build at it. So the rest of this is about the backend half, plus the two settings that decide whether the frontend can even reach it.

## The Supabase key you must never ship to the browser

Supabase hands you two API keys, and they are not interchangeable. Mixing them up is the single most dangerous mistake you can make while deploying a Lovable app, so it goes near the top.

The **anon** key (the public or publishable one) is designed to live in your frontend. It ships inside the JavaScript bundle, and that's fine. On its own it can't do much, because Supabase's Row Level Security decides what any request is allowed to read or write. Exposing the anon key is expected. It's how the browser talks to Supabase at all.

The **service_role** key is the opposite animal. It bypasses Row Level Security completely. It can read and write every row in every table, no questions asked. It belongs only on a server, in server-side environment variables, and it must never sit in anything prefixed `VITE_`.

The trap is subtle. You hit a `401` while testing, you're tired, and you "fix" it by dropping the `service_role` key into a `VITE_` variable so the request goes through. It does go through. It also compiles that god key straight into your public bundle, where anyone can open DevTools and copy it. That's a full-database leak, and it's one of the most common ways an AI-built app gets its data dumped. A `401` means a Row Level Security policy is missing. It does not mean you need the master key in the browser.

```
# Safe in the frontend build (public by design, guarded by RLS)
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...   # anon / publishable

# NEVER in a VITE_ variable. Server-side only.
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # bypasses Row Level Security
```

If you want the wider mental model for what goes public and what stays secret, we wrote it up in [environment variables, done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

<!-- ADD IMAGE: The Supabase project API settings page, with the anon key and service_role key side by side and labelled. -->

## Your VITE_ variables freeze at build time

This one costs people an afternoon, so it's worth being blunt. Anything prefixed `VITE_` is read once, when Vite builds. The value gets stamped into the compiled JavaScript and then it's frozen. It is not read live when the app runs.

So the classic mistake goes like this: you deploy, the page is blank, you add `VITE_SUPABASE_URL` in the console, you reload, and nothing changes. Of course it doesn't. The old build already has the old value (or an empty one) baked in. Setting the variable after the build does nothing until you build again.

Set your `VITE_` variables first. Then build. If you added one late, just rebuild so it gets picked up. A blank white page, or an error like `supabaseUrl is required` thrown on load, almost always means the URL wasn't present at build time.

```
# set these FIRST, then build
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
npm run build   # values are now baked into dist/
```

## Keep Supabase, or move to Postgres? Decide on purpose

Once you're hosting the app yourself, you've got two honest options for the backend. Both are fine. They suit different apps, and picking the wrong one wastes a weekend.

**Option one: keep a managed Supabase.** You keep Auth, Storage, Edge Functions, and the Postgres-with-RLS model exactly as Lovable built it. Nothing in the app changes. Kloudbean runs [Supabase as a one-click managed app](https://www.kloudbean.com/blog/self-host-supabase/), so it can sit in the same dashboard as the frontend, backed up and yours.

**Option two: move the data to a plain managed Postgres.** You drop Supabase's auth, storage, and functions layer and own a straight [managed Postgres](https://www.kloudbean.com/blog/managed-postgresql-hosting/) database instead. Cleaner if you barely used those features. More work if you did, because you're now on the hook to replace login, uploads, and any function logic yourself. Either way the wiring matters more than the choice, so keep the rules for [connecting a database to your Lovable app](https://www.kloudbean.com/blog/connect-a-database-to-your-lovable-app/) in mind: the connection string belongs on a server, never in the browser bundle.

My honest take: if your app leans on Supabase Auth and Storage, keep Supabase. Rewriting authentication just to say you're "on plain Postgres" is a lot of risk for very little gain, and auth is exactly the thing you don't want to hand-roll under deadline. If Supabase was really just a Postgres with a few tables, and you never touched RLS, auth, or storage, then a managed Postgres is simpler to reason about and one less moving part. Don't move off Supabase to prove a point. Move because the app is genuinely simpler without it.

|  | Keep managed Supabase | Move to managed Postgres |
| --- | --- | --- |
| Login / auth | Works as-is | You rebuild it |
| File storage | Works as-is | You add object storage yourself |
| Server functions | Edge Functions stay | You move logic into your own API |
| Effort to switch | Low | Medium to high |
| Best when | You use auth, storage, or RLS | Supabase was basically just a database |

## Deploying a Lovable app: the two halves, one dashboard

Now the actual moves. The nice part of doing this on Kloudbean is that both halves, the frontend and the backend, live behind one login. No stitching three services together. You also pick which cloud the server sits on, so when a customer or a company standard says AWS specifically, [running your Lovable app on managed AWS](https://www.kloudbean.com/blog/lovable-on-managed-aws/) is this same flow with AWS underneath.

### Get the code out first

Lovable can sync your project to GitHub. Connect it and push the full source to a repo you own. That repo, not the editor, becomes the thing you deploy. Do this even if you're not shipping today, because the moment the code is in your own GitHub you're no longer locked into anyone's hosting.

### Half one: host the built frontend

Your Lovable frontend builds to a folder of static files. Two clean ways to serve it:

- **Free static site hosting.** Point a custom domain at the built output, get a free SSL certificate, and there's built-in visit analytics. This fits the common Lovable shape, where the frontend is fully static and Supabase does everything dynamic.
- **As a Node app over Git.** If your project also runs a small Node server, connect the GitHub repo and let managed CI/CD build and ship it on every push, with the build log streaming live in the console.

Either way, remember the rule from two sections up: set your `VITE_` variables before the build runs.

![Kloudbean Deploy Code / Git Deployment screen: connect the GitHub repo, choose the branch, set the runtime, and pull and deploy](../assets/console/git-deployment.png)

<!-- ADD IMAGE: Kloudbean free static site hosting screen with the Lovable frontend on a custom domain and free SSL on. -->

### Half two: give the frontend a Supabase to talk to

Pick the backend you chose above.

- **Keeping Supabase?** Launch a managed Supabase (one click) or point at your existing project. Put the project URL and anon key into the frontend build. Keep the `service_role` key server-side.
- **Moving to Postgres?** Launch a managed Postgres or MySQL from the console, import your data (next section), and point your server code at the connection string.

![Kloudbean Launch Database screen for creating a managed Postgres or MySQL instance next to the app](../assets/console/launch-database.png)

### Set the environment variables

In **Runtime Configuration, Environment Variables**, there's a **Paste .env Content** tab. Drop your `.env` in, click **Convert to Key/Value**, and swap the dev values for the real ones. Frontend keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) matter at build time. Server secrets (`service_role`, any `DATABASE_URL`) are read at runtime and stay out of the repo.

![Kloudbean environment variables editor showing a paste .env content tab and a key value list](../assets/console/env-vars.png)

### Domain, SSL, and auto-deploy

Add your custom domain under **Domain Aliases**, point its DNS at the server, and install a free Let's Encrypt certificate so it's HTTPS and renews itself. Turn on automated deployment and every push to your branch rebuilds and ships. From then on, updating production is just `git push`, the same loop you'd get from a per-app platform, except it's [running on a server you own](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/).

<!-- ADD IMAGE: Your Lovable app live on its custom domain, logged in, real data loading, SSL padlock in the address bar. -->

## Bringing your Supabase data across (only if you're moving it)

Skip this if you're keeping Supabase. If you're moving to a plain Postgres, or to a fresh Supabase project, the data has to come with you on purpose. The good news: Supabase is Postgres underneath, so this is an ordinary dump and restore.

```
# pull everything from the old database
pg_dump "postgresql://postgres:PASS@db.OLD-PROJECT.supabase.co:5432/postgres" \
  --no-owner --no-privileges -Fc -f lovable.dump

# load it into the new managed database
pg_restore --no-owner --no-privileges \
  -d "postgresql://kb_user:PASS@127.0.0.1:5432/kb_appdb" lovable.dump
```

One caveat that catches people: if you kept Supabase Auth, your users live in Supabase's `auth` schema, and a plain Postgres won't magically replace login. That's the same tradeoff from the decision table, just showing up at migration time. The full walkthrough is in [adding a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/).

## When the first deploy misbehaves

Three symptoms cover almost everything, and each points at one of the two halves.

- **Blank white page.** A `VITE_` variable (usually the Supabase URL or anon key) wasn't set when you built. Rebuild with them in place.
- **Login does nothing, or data returns a `401`.** Either a Row Level Security policy is missing, the frontend is pointed at the wrong Supabase project, or the auth redirect URL still points at your old Lovable address. Add your new domain to Supabase's list of allowed redirect and site URLs. This last one trips up nearly every Supabase move, and it's a quick fix once you know to look for it.
- **A `503` on a Node-server build.** A 503 means the process isn't running, usually a missing env var or a wrong start command. Go to **Application Administration → Logs Viewer** and open the **App Errors** tab, which is where the crash is recorded. The full playbook is in [fixing a 503 after deploying](https://www.kloudbean.com/blog/fix-503-after-deploying-your-app/).

That Logs Viewer is worth a minute of your time before you start editing code. Tabs split it up: **App Errors** for your app's error output, **App Info** for its informational output, and **Web Requests Logs** for the web server's record of every request served. There's a search box, so if the browser console gave you a status code or an error string, look for it there rather than reading top to bottom. Build output is somewhere else again: it streams live while a deploy runs and stays in **Build and Deployment History**.

The same files also sit on disk at `/home/admin/hosted-sites/<app_system_user>/app-logs`, as `app.info.log` and `app.error.log`, if you'd rather read them in the File Manager or a terminal.

## What you own, and what's managed

Kloudbean runs Linux stacks: the JavaScript toolkit Lovable uses (React, Vite, Node) plus PHP, Python, Ruby, and Java when you need them. That covers what Lovable builds for the web. It isn't for Windows or .NET workloads. "Managed" means the server, the stack, SSL, backups, and patching are handled. Your code stays in your repo and your data stays in a database you control. And because the frontend, the database or Supabase, and object storage all sit in one dashboard, your next Lovable project can share the same server instead of starting a new bill. If you'd rather see the tool-agnostic version that also covers Cursor, Bolt, and v0, that's the [deploy an AI-built app](https://www.kloudbean.com/blog/deploy-ai-built-app-to-production/) guide. Hosting several apps on one box is covered in [app, API, and database on one server](https://www.kloudbean.com/blog/host-app-api-and-database-on-one-server/).

## You built the app. Now own where it runs.

Give your Lovable app a real home at [kloudbean.com](https://www.kloudbean.com/). Free static hosting with SSL · One-click managed Supabase · Managed Postgres and MySQL · Free migration · Free trial · Git deploy. Sizes and plans on [pricing](https://www.kloudbean.com/pricing/).

## FAQ

**Can I deploy a Lovable app without using Lovable's hosting?**
Yes. Sync your project to GitHub so the code is a repo you own, host the built React frontend on a server or static hosting you control, and point it at a Supabase you control. It's standard React and Vite code, so it runs anywhere.

**Do I have to move off Supabase to self-host a Lovable app?**
No. You can keep a managed Supabase and change nothing in the app, or move the data to a managed Postgres if you barely used Supabase's auth, storage, and functions. Keep Supabase if you rely on those features. Moving off it means rebuilding them.

**Is the Supabase anon key safe to expose in the frontend?**
Yes. The anon key is public by design and protected by Row Level Security, so it belongs in the frontend bundle. The key to protect is the service_role key, which bypasses RLS and must stay server-side, never in a VITE_ variable.

**Why is my deployed Lovable app a blank white page?**
Almost always a VITE_ variable that wasn't set at build time, usually the Supabase URL or anon key. VITE_ values are baked into the bundle when you build, not read at runtime, so set them first and then rebuild.

**My login or data returns a 401 after deploying, why?**
Three usual causes: a missing Row Level Security policy, the frontend pointed at the wrong Supabase project, or the auth redirect URL still pointing at your old Lovable domain. Add your new domain to Supabase's allowed redirect and site URLs.

**How do I move my Supabase data to a new database?**
Supabase is Postgres underneath, so use pg_dump on the old database and pg_restore into the managed one. Remember that a plain Postgres won't carry Supabase Auth users or Storage, so keep Supabase if you depend on those.

**Where do my Supabase URL and keys go on the server?**
The project URL and anon key go into the frontend build as VITE_ variables, set before you build. The service_role key and any database connection string are server-side runtime variables and never belong in a VITE_ variable or the repo.

**Do I keep ownership of my Lovable code and data?**
Yes. The code lives in your GitHub repo, the data in a database you own, on a server you can move whenever you like. There's no per-app pricing that climbs as you add projects.
