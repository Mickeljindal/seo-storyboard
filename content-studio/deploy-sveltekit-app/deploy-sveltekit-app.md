---
title: How to Deploy a SvelteKit App to Production the Right Way
slug: deploy-sveltekit-app
eyebrow: Deploy SvelteKit
byline: By Kloudbean Engineering · Choose the adapter first, and the rest of the SvelteKit deploy falls into place.
description: Deploy a SvelteKit app to production without guessing. The adapter is the whole decision: adapter-node for a self-hosted Node server, adapter-static for a static site.
canonical: https://www.kloudbean.com/blog/deploy-sveltekit-app/
---

# How to Deploy a SvelteKit App to Production the Right Way

You can deploy a SvelteKit app to production on a server you own, and it's less work than the adapter zoo makes it look. New projects ship with `adapter-auto`, which quietly picks a target the moment you push to Vercel or Netlify. That's lovely until you want your own box. Then `adapter-auto` has nothing to detect, and you're left staring at a build wondering what actually runs.

The fix is one line in `svelte.config.js`. This whole guide is really about that line, because for SvelteKit hosting the adapter is the entire decision. Get it right and the rest (Node process, reverse proxy, SSL, env vars) is the same short path every app walks. Get it wrong and you'll fight 404s, blank pages, or a "why won't my form submit" error that has nothing to do with your form.

> **How do I deploy a SvelteKit app to production?**
> Pick an adapter. For a server you own, install `@sveltejs/adapter-node`, run `npm run build` to produce a `build/` directory, then run `node build` to start a real Node server (behind Nginx, kept alive by PM2). If your app is fully prerendered, use `adapter-static` instead and serve the built files like any static site with free SSL. Set `ORIGIN` and your secrets as environment variables, point a domain, and you're live.

## The adapter is the entire SvelteKit deploy decision

SvelteKit doesn't assume where it runs. At build time it hands your compiled app to an *adapter*, and the adapter shapes the output for a target: a Node server, a pile of static files, a serverless function, a Cloudflare Worker. Same source, very different artifacts. That's genuinely a nice design. It's also the one thing that trips people up on their first self-host, because the default adapter hides the choice.

Here's what `adapter-auto` does: it sniffs the platform during build. On Vercel it emits functions. On Netlify it emits Netlify functions. On your own Linux server it detects nothing, so it can't build a sensible artifact. The answer isn't to fight it. You swap it for the adapter that matches where you're actually deploying. For a box you control, that's almost always `adapter-node`.

*Diagram: svelte.config.js chooses an adapter. adapter-node path builds a Node server (npm run build to build/, then node build on port 3000, kept alive by PM2, served by Nginx on 443 over HTTPS). adapter-static path (prerender = true) builds static files served by a static host with free SSL.*

If the words "build artifact" and "long-running process" are new, the [mental model behind every deploy](https://www.kloudbean.com/blog/how-to-deploy-any-app/) is worth ten minutes first. SvelteKit is one clean instance of it.

## adapter-node: run your SvelteKit app as a Node server

This is the default answer for "I want to host a SvelteKit app on your own server." `adapter-node` turns your build into a standalone Node server, which means SvelteKit runs anywhere Node runs. No proprietary runtime, no lock-in. Install it, point your config at it, and build.

```
npm i -D @sveltejs/adapter-node
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

const config = {
  kit: {
    adapter: adapter()
  }
};

export default config;
```

Now build and run. `npm run build` is Vite under the hood, and it drops a production server into `build/`. You start it with a single command:

```
npm run build      # vite build, output goes to build/
node build         # starts the server, listens on 0.0.0.0:3000
```

That's a real long-running process, the same shape a Node or Express app takes in production. It binds to port 3000 by default, and you can move it with the `PORT` and `HOST` environment variables. In production you'll want two things around it: a reverse proxy (Nginx) terminating SSL on 443 and forwarding to 3000, and a supervisor (PM2) that restarts the process on a crash or a reboot. A terminal running `node build` is a demo. PM2 plus Nginx is a service. On managed hosting both are wired up for you, which is the entire point of not hand-rolling it at 11pm.

One more real detail: `adapter-node` bundles your build tooling with Rollup, so the runtime footprint is small. To ship only production dependencies you copy `package.json` and the lockfile and run `npm ci --omit dev`. Skip that if your app has no runtime dependencies at all.

<!-- ADD IMAGE: a terminal running node build with the "Listening on 0.0.0.0:3000" line visible -->

### The ORIGIN gotcha that breaks form actions

This one costs people an afternoon, so learn it before it bites. Behind a reverse proxy, SvelteKit can't reliably know the public URL it's being served on. HTTP just doesn't tell it. When it guesses wrong, your form actions start failing with this exact message:

```
Cross-site POST form submissions are forbidden
```

Your form is fine. The server simply doesn't believe the request came from its own origin. The clean fix is to tell it, using the `ORIGIN` environment variable:

```
ORIGIN=https://your-domain.com node build
```

If your proxy sets the standard forwarding headers (most do), you can let SvelteKit read the origin from them instead. Only do this when the proxy is trusted, since a client could otherwise spoof these:

```
PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host node build
```

My advice: set `ORIGIN` to your real domain and move on. It's one variable, it's unambiguous, and it kills the whole class of "my login form 403s in production but works locally" tickets. If you need the client's real IP for rate limiting or geo, that's `ADDRESS_HEADER`, and the max request body is `BODY_SIZE_LIMIT` (default 512kb, worth raising if you accept uploads).

## adapter-static: when your SvelteKit app is just files

Sometimes you don't need a server at all. A docs site, a marketing page, a blog, a landing page: if every route can be rendered ahead of time, `adapter-static` prerenders the whole thing to plain HTML, CSS, and JavaScript. No process to keep alive, nothing to crash, nothing to patch. You host the output like any static site.

```
npm i -D @sveltejs/adapter-static
```

```js
// src/routes/+layout.js
export const prerender = true;
```

With prerendering on and `adapter-static` in your config, `npm run build` writes a folder of static files to `build/`. That output drops straight onto Kloudbean's free static site hosting, which gives you a custom domain, free auto-renewing SSL, and built-in visit analytics at no cost. Building a single-page app with client-side routing? Set a fallback page (like `index.html`) in the adapter options and it serves as an SPA.

The catch, and it's the whole catch: `adapter-static` only works if every page can actually be prerendered. The moment you add a form action, a `+server.js` endpoint that runs per request, or a `+page.server.js` that loads live data, that route can't be baked at build time. The build will stop and point at the route it can't prerender. That's not a bug. It's SvelteKit telling you that you've outgrown a static site and need a server. Which means `adapter-node`.

> **Founder take:** don't agonize over this. Pick the adapter that matches what your app does, not what you wish it did. If it has logins, writes to a database, or has any route that runs on request, use `adapter-node` and run the real server. If it's genuinely all content and could be a folder of files, use `adapter-static` and enjoy hosting that never wakes you up. Most real products are the first kind. Trying to force a dynamic app into static export is the single most common SvelteKit deploy mistake we see.

## adapter-node vs adapter-static, side by side

If you only remember one table from this page, this is it.

| | adapter-node | adapter-static |
|---|---|---|
| **What it outputs** | A Node server in `build/` | Static files in `build/` |
| **Needs a running process?** | Yes (`node build`) | No, just serve the folder |
| **SSR, form actions, +server routes** | All work | Prerendered pages only |
| **Talks to a database?** | Yes, at runtime | No (client-side calls only) |
| **Best for** | Apps with auth, dynamic data, writes | Docs, blogs, marketing, SPAs |
| **On Kloudbean** | Node.js server + PM2 + Nginx | Free static site hosting + SSL |

There's a third adapter worth naming: `adapter-auto`, the default. It's fine while you're on a platform it recognizes. For your own infrastructure, replace it explicitly so nobody (including future you) has to guess what the build produced. Nuxt users reading over your shoulder have the same story with Nitro presets, and it's covered in [deploy a Nuxt app](https://www.kloudbean.com/blog/deploy-nuxt-app/). On Next.js the equivalent decision is `output: 'export'` versus running the server, which we get into in [deploy a Next.js app to your own server](https://www.kloudbean.com/blog/deploy-nextjs-app-to-your-own-server/).

## How do I deploy a SvelteKit app to production on a server I own?

Assume `adapter-node`, since that's the interesting case. Here's the concrete path through the Kloudbean console. It's short, because once the adapter is set you're just deploying a Node app.

### Launch a server and add the app

Click **Add Server**, choose a cloud provider (seven to pick from: AWS, Amazon Lightsail, Google Cloud, Linode, Vultr, DigitalOcean, and UpCloud), select the **Node.js** stack, and pick a datacenter near your users. SvelteKit builds are Vite builds, so give them a little headroom. 2GB of RAM is a comfortable starting size. A few minutes later you have a server with Node, a web server, a process manager, a firewall, and SSL already in place. Then, if you're running more than one project on the box, add each under **Applications**.

*Screenshot: the Kloudbean Add Application screen, adding a Node.js app for a SvelteKit deploy.*

### Connect Git and set the build

Deploys come from Git, which is what you want: the repo is the source of truth, not a folder on your laptop. Open the app's **Git Deployment** screen, connect GitHub over OAuth, paste the repository URL, pick a branch, and clone. Then fill the runtime fields, which map one to one onto the diagram above:

- **App Directory:** the folder with your `package.json`.
- **Port:** `3000`, unless you set `PORT` to something else.
- **Node Version:** match your local build. Node 20 or newer for a current SvelteKit.
- **Install / Build / Start:** `npm ci`, then `npm run build`, then `node build`.

*Screenshot: the Kloudbean Git Deployment tab, Build set to npm run build and Start set to node build.*

Hit **Pull & Deploy**. The console streams the pull, install, build, and start steps live, so when something fails you see the exact line, not a spinner. Turn on automated deployment and every push to your branch reruns `npm run build` and ships itself. That's the git-to-live loop the per-seat platforms rent you, on a server you own.

<!-- ADD IMAGE: Build and Deployment History with a deploy open and live logs streaming the SvelteKit build -->

### Environment variables, the SvelteKit way

SvelteKit is unusually clear about environment variables, and getting it right saves you from leaking a secret into the browser bundle. There are four modules, and the split is the whole point:

- `$env/dynamic/private` reads real values from the environment at runtime. This is where your `DATABASE_URL`, API keys, and session secrets belong. They never touch the client.
- `$env/static/private` is the same idea but inlined at build time. Server-only, still safe.
- Anything prefixed `PUBLIC_` (via `$env/static/public` or `$env/dynamic/public`) is exposed to the browser. Never put a secret behind that prefix.

```js
import { env } from '$env/dynamic/private';

const db = connect(env.DATABASE_URL);   // runtime, server-only, never shipped to the browser
```

In the console, open **Environment Variables**, and there's a **Paste .env Content** tab so you can drop your whole file in and convert it to key/value. Set `DATABASE_URL`, your secrets, and `ORIGIN` here. Because `$env/dynamic/private` reads them at runtime, you can rotate a secret by editing it in the dashboard and restarting, no rebuild required. The full model, including why a `PUBLIC_` value is frozen the moment the build runs, is in [environment variables, done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

*Screenshot: the Kloudbean environment variables editor with a Paste .env Content tab, DATABASE_URL and ORIGIN set.*

### Add a database, a domain, and SSL

Move data off any local file before you have users. Launch a managed database (Kloudbean runs seven engines: MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, and MongoDB), copy its connection string into `DATABASE_URL`, and run your migrations as part of the build so the schema exists before the app serves a request:

```
npm run build && npx prisma migrate deploy   # or: npx drizzle-kit migrate
```

Then add your custom domain, point DNS at the server, and install a free auto-renewing certificate so the site loads over HTTPS. If DNS records and certificate steps are new territory, the full walkthrough is in [custom domain and SSL for your app](https://www.kloudbean.com/blog/custom-domain-and-ssl-for-your-app/). Set `ORIGIN` to that same domain while you're here, so form actions behave the instant the domain goes live.

<!-- ADD IMAGE: the app's domain and SSL panel with a custom domain added and a free certificate issued -->

## Where SvelteKit deploys actually break

The failures are boringly repeatable, and every one maps to a decision above. Knowing them turns a 30-minute stall into a 30-second fix.

**adapter-auto left in place.** The build runs on your server, detects no known platform, and produces something that won't start (or a warning you scrolled past). Swap to `adapter-node` explicitly. This is the number one first-deploy stall.

**The ORIGIN error.** "Cross-site POST form submissions are forbidden" the first time a real user submits a form. It's not your code, it's the missing `ORIGIN`. Set it to your domain and redeploy.

**adapter-static on a dynamic app.** You picked static export, then a route with a `+server.js` endpoint or a live server load refuses to prerender and the build stops. That route needs a server. Move to `adapter-node`.

**Start command still runs the dev server.** Someone sets Start to `npm run dev` because that's the command they type all day. Vite's dev server is for reloading as you type, not for traffic. Start must be `node build`, and Build must have run `npm run build` first.

**Build tools skipped.** If `NODE_ENV=production` is set before install runs, npm skips `devDependencies`, and Vite, Svelte, and the adapter all live there. The build then dies with a missing-module error. Let install pull everything, and let the adapter bundle what the runtime actually needs. When a deploy 503s, read the app's error log first. The reason is almost always one of these five, sitting in plain text.

## What this will not fix

Two things worth saying straight. First, this is a Linux Node deployment. SvelteKit compiles to a Node server through `adapter-node`, and that runs great on a managed Linux box. It isn't a Windows or .NET target, which is fine because SvelteKit isn't either.

Second, your server lives in one region, not on a global edge network the way some platforms spread functions worldwide. For most apps a well-placed server with the database right next to it is faster than people expect, because you skip the cold starts and the round trips to a far-off database. If you genuinely serve a latency-critical audience on every continent, put Cloudflare in front (a paid add-on, free on Enterprise) so pages cache at the edge while the app runs on hardware you own. "Managed" means the server, stack, SSL, backups, and patching are handled. Your code and your data stay yours, and because it's a standard Linux box underneath, you can move whenever you like.

---

**Set the adapter. Push. Watch it build.**

Deploy your SvelteKit app from Git onto a managed server you own, with PM2, Nginx, and SSL already handled. Start at [kloudbean.com](https://www.kloudbean.com/), and if you're moving off a per-seat host, read the [Netlify alternative for full-stack apps](https://www.kloudbean.com/blog/netlify-alternative-for-full-stack-apps/). Sizes and plans on [pricing](https://www.kloudbean.com/pricing/).

Seven clouds, one dashboard · Git deploy with live logs · Free auto-renewing SSL · Managed databases · Automatic backups · Free migration · Free trial

## FAQ

**How do I deploy a SvelteKit app to production?**
Choose an adapter that matches your target. For a server you own, install `@sveltejs/adapter-node`, run `npm run build` to create a `build/` directory, and run `node build` to start the server. Put it behind Nginx for SSL and under PM2 so it restarts on crash or reboot. Set `ORIGIN` and your secrets as environment variables, then point a domain at it.

**Which SvelteKit adapter should I use to self-host?**
Use `adapter-node` for any app with server-side rendering, form actions, API endpoints, or a database, because it produces a real Node server. Use `adapter-static` only if every page can be prerendered, such as a docs site or a marketing page. Replace the default `adapter-auto` explicitly when you deploy to your own infrastructure.

**Can I host a SvelteKit app on my own server without Vercel or Netlify?**
Yes. SvelteKit with `adapter-node` is a standard Node server, so it runs on any managed Linux box. Deploy it from GitHub, set Build to `npm run build` and Start to `node build`, and you get the full framework with no proprietary runtime and no lock-in.

**What does node build do in SvelteKit?**
`node build` starts the production Node server that `adapter-node` created in the `build/` directory. By default it listens on 0.0.0.0 port 3000. You can change that with the `PORT` and `HOST` environment variables. It is the long-running process a browser ultimately reaches through your reverse proxy.

**How do I fix Cross-site POST form submissions are forbidden?**
That error means `adapter-node` can't determine the public URL it is served on, so it rejects the form as cross-origin. Set the `ORIGIN` environment variable to your real domain, for example `ORIGIN=https://your-domain.com`, and restart. Behind a trusted proxy you can instead set `PROTOCOL_HEADER` and `HOST_HEADER` to the forwarding headers.

**adapter-static or adapter-node for a static site?**
If the site is fully content and every route can be prerendered, use `adapter-static` and host the built files like any static site with free SSL. If any route needs to run on request, a form action, a server load, or a `+server.js` endpoint, the static build will fail and you should use `adapter-node` instead.

**How do I set environment variables in SvelteKit in production?**
Read runtime secrets through `$env/dynamic/private`, which pulls values from the environment when the app runs, so put `DATABASE_URL` and API keys there. Anything the browser needs must be prefixed `PUBLIC_` and is exposed on purpose. Set the values in your host's environment variables panel, never commit them to Git.

**Why does my SvelteKit build fail with adapter-static?**
Because a route can't be prerendered. `adapter-static` renders every page to HTML at build time, so a form action, a live server load, or a request-time `+server.js` endpoint stops the build. Either make the route prerenderable or switch to `adapter-node`, which runs those routes on a real server.

**What Node version and start command should I use for SvelteKit?**
Use Node 20 or newer to match a current SvelteKit, and set your production Start command to `node build`. Do not use `npm run dev` in production, since that runs the Vite dev server, which is built for local reloading and not for real traffic.

**Do I need PM2 to run a SvelteKit Node server?**
You need some supervisor, and PM2 is the common choice for Node. Without one, a crash or a server reboot leaves your app down until you notice. PM2 restarts the process automatically and starts it again after a reboot. On managed hosting this is configured for you, so `node build` stays running as a service rather than a terminal session.

---

Kloudbean · One config line decides the whole SvelteKit deploy. Choose it on purpose.
