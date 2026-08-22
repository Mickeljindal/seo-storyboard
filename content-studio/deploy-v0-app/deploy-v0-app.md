---
title: "Deploy Your v0 App to a Server You Own: Start With What v0 Gave You"
slug: deploy-v0-app
meta_description: "Generated a UI with v0 and want it off Vercel? Here's how to deploy your v0 app to a server you own: figure out what v0 gave you, run Next.js as a normal Node process, wire up the database, and go live with SSL."
target_keyword: deploy v0 app
secondary_keywords:
  - v0 to production
  - host v0 app
  - v0 Next.js deployment
  - v0 own server
  - deploy v0 without Vercel
author: Kloudbean
hero_image: images/hero.png
cluster: 1 - Deploy AI / Vibe-Coded Apps
---

![Deploy your v0 app: from generated Next.js UI to a production server you own](images/hero.png)

# Deploy Your v0 App to a Server You Own: Start With What v0 Gave You

v0, Vercel's generator, is very good at the slow part of building: getting from "I need a screen" to polished React, styled with Tailwind, built on shadcn/ui. It'll push the project to GitHub and, being a Vercel product, nudge you toward one-click Vercel hosting. That default is fine. But if you want to deploy your v0 app to a server you own, for a real database, predictable cost, or just to not be tied to one platform, the code is completely portable. It's plain Next.js.

Before any deploy steps, one question decides your whole path, and almost no guide asks it: what did v0 actually hand you? A whole application, or a few components to drop into an app you already have? The answer changes what "deploy" even means here.

> **Short version:** v0 writes standard Next.js and React, so you don't need Vercel or any special adapter. Figure out whether you got a full app or just components. Then run it as a normal Node process (`next build`, `next start`) on a server you own, set your `NEXT_PUBLIC_` vars at build time, add a managed database, and turn on SSL and auto-deploy.

## First, figure out what v0 actually handed you

v0 output lands in one of a few shapes, and I've seen people burn an hour trying to "deploy" something that was never a standalone app. Sort yours first.

- **A full Next.js app.** You built out pages and routes in v0 and pushed the whole project to GitHub. This is a deployable app on its own.
- **A few components.** You generated a pricing section, a dashboard card, a form. These are meant to be pasted into an app you already have. You deploy that app, with the new components in it.
- **A page or block.** Somewhere between the two. Add it as a route in your existing Next.js project, then deploy that project.

| v0 gave you | What you do | Where it ends up |
| --- | --- | --- |
| A full Next.js app | Deploy the repo | One Next.js app on your server |
| A few components | Paste into your app | One Next.js app on your server |
| A page or block | Add it as a route | One Next.js app on your server |

*Whatever shape v0 handed you, the destination is the same: one Next.js app running on a server you own. The only difference is how much assembly you do first.*

The rest of this assumes you've got (or assembled) one Next.js app. If it's just loose components, paste them in, get the app running locally, then follow along.

<!-- ADD IMAGE: The v0 canvas with a generated component, showing the code panel and the option to push the project to GitHub. -->

## shadcn/ui components are yours (that's the point)

One thing that quietly makes v0 apps easy to own: the shadcn/ui components v0 leans on are not an npm dependency. They're copied straight into your repo as source files, usually under `components/ui`. That's shadcn's entire philosophy. You own the component code and can edit it.

For deploying, this is good news on two fronts. There's no component library to reach out to at runtime and no design-system service to subscribe to, so nothing extra to configure on the server. And there's no lock-in hiding in your UI layer. The buttons and dialogs are just React files that build like any other part of the app. What you saw in the v0 preview compiles and serves from your server, unchanged.

## A Next.js app is a Node process, not a static site

This is the misconception that trips people, so let's kill it. A Next.js app is not a folder of static files you can drop on any web host. Unless you deliberately set `output: 'export'` (which most v0 apps don't), a built Next.js app is a running Node server. `next build` compiles it, and `next start` boots the server that handles rendering, API routes, and the rest.

Two things follow. First, you need a host that runs a persistent Node process, not just static file hosting. Second, and this is the part people don't expect from a Vercel product: you do not need a special adapter, a proprietary build target, or Vercel itself. The standard `next start` is the same production server Next.js ships. Server rendering, API routes, incremental static regeneration, image optimization: all of it runs on an ordinary Node machine.

```
# package.json: the standard Next.js scripts, nothing custom
"scripts": {
  "build": "next build",
  "start": "next start"
}
```

So hosting Next.js yourself isn't a degraded version of Next.js. It's the same server, on hardware you picked. If you want the framework-specific deep dive, we have a whole guide on [deploying Next.js to your own server](https://www.kloudbean.com/blog/deploy-nextjs-app-to-your-own-server/).

## NEXT_PUBLIC_ variables bake in at build time

Next.js splits environment variables in two, and getting this wrong is the most common reason a first deploy looks broken. Anything prefixed `NEXT_PUBLIC_` is meant for the browser, so it gets inlined into the JavaScript when `next build` runs. It's frozen at build time. Everything else is a server-side secret, read live at runtime, and it should never carry the `NEXT_PUBLIC_` prefix.

The practical rule: set your `NEXT_PUBLIC_` values before the build, and if one of them encodes a URL, point it at your new domain, not the old preview address. Add or change one after deploying and nothing updates until you rebuild. Secrets like `DATABASE_URL` behave the opposite way, read at runtime, which is exactly why they stay out of the repo and out of anything public.

```
# Inlined into the browser bundle at build time
NEXT_PUBLIC_APP_URL=https://yourapp.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Read at runtime, server-side only, never NEXT_PUBLIC_
DATABASE_URL=postgres://kb_user:pass@postgres-123456.kloudbeansite.com:5432/kb_appdb
STRIPE_SECRET_KEY=sk_live_...
```

If this split feels fuzzy, the full mental model is in [environment variables, done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

<!-- ADD IMAGE: The v0 project pushed to a GitHub repo, showing the Next.js structure and the components/ui folder. -->

## Where the backend and data go (v0 leaves this to you)

v0's sweet spot is the interface, so a v0 project often arrives as a gorgeous front end with the data layer barely sketched in. That's the work you finish, and your own server is the natural home for it. API routes live in the same Next.js app (or a separate service if you'd rather split), your data lives in a managed database on the same box, and configuration comes from environment variables.

Reach for an ORM like Prisma or Drizzle, or write SQL directly. Either way the database sits next to the app rather than across a network to a metered service. Putting the whole thing on one server is covered in [app, API, and database on one server](https://www.kloudbean.com/blog/host-app-api-and-database-on-one-server/).

## Deploy your v0 app on a server you own

With one Next.js app in a GitHub repo, the deploy is short. No adapter, no special output mode.

In the [Kloudbean](https://www.kloudbean.com/) console, click **Add Server**, pick a **Cloud Provider**, choose **Node.js**, pick the nearest datacenter, and give a Next.js build 2 to 4 GB of headroom. **Launch Now** has it ready in a few minutes.

![Kloudbean Add Server screen: choosing a cloud provider, Node.js application, datacenter, and server size](../assets/console/add-server.png)

Open the app, go to **Application Administration, Deploy Code**, connect GitHub, paste your repository URL, and pick the branch. Then the runtime fields:

- **App Directory:** where `package.json` lives.
- **Port:** `next start` respects `process.env.PORT` by default; a custom server must too.
- **Node Version:** Node 20+ for a modern Next.js app.
- **Install / Build / Start:** `npm install`, `npm run build` (runs `next build`), and `npm start` (runs `next start`).

![Kloudbean Deploy Code / Git Deployment screen: connect the repo, set the runtime, and Pull and Deploy](../assets/console/git-deployment.png)

Launch a managed **Postgres** or **MySQL** from the console for the data layer v0 left to you. It runs alongside the app, backed up, reachable through a connection string you keep in environment variables.

![Kloudbean Launch Database screen for creating a managed Postgres or MySQL instance next to the app](../assets/console/launch-database.png)

Add your variables under **Runtime Configuration, Environment Variables**, using the **Paste .env Content** tab. Remember the split: `NEXT_PUBLIC_` values are baked in at build, everything else is read at runtime. Then add your domain under **Domain Aliases**, install a free Let's Encrypt certificate, and turn on [automated deployment](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/) so every push rebuilds and ships. It's the same git-driven flow the Vercel default gave you, now on a server you own.

![Kloudbean environment variables editor with a paste .env content tab and a key value list](../assets/console/env-vars.png)

<!-- ADD IMAGE: Your v0 app live on its own domain with the SSL padlock, real data behind the shadcn/ui interface. -->

## v0 to Vercel is the default. When to own the server instead.

Credit where it's due: Vercel's edge network and zero-config preview deployments are genuinely slick, and for a purely static marketing site the one-click path is hard to beat. If that fits your project and the bill doesn't bother you, there's no rule that says you must move.

You'd choose your own server when the shape of the app, or the shape of the bill, starts pushing back.

|  | v0 to Vercel default | A server you own |
| --- | --- | --- |
| Backend and database | Add managed services, often billed separately | App, API, and database on one box |
| Pricing shape | Usage and seat based, scales with success | Flat monthly, predictable in a busy month |
| Several apps | Each tends to be its own project | Share one server, one bill |
| Previews | Zero-config, built in | A staging app on the same server |
| Control | Platform conventions | Full access, move hosts anytime |

My take: for a static site, the default is genuinely fine, stay. The moment there's a real backend, a database, and a plan to ship more than one app, a server you own tends to be simpler and cheaper to reason about. If you're specifically migrating away from the default, the [Vercel alternative for full-stack apps](https://www.kloudbean.com/blog/vercel-alternative-for-full-stack-apps/) and the [move off Vercel](https://www.kloudbean.com/blog/move-lovable-app-off-vercel/) guide both dig into the migration.

## When it won't come up

A **503** means the process didn't start. For a v0 or Next.js app, check in this order:

- **The start command runs `next start`**, after a successful `next build`. Running `next dev` in production is a common slip.
- **A missing environment variable**, often the database URL or a `NEXT_PUBLIC_` value the app reads at startup.
- **Port binding.** Standard `next start` respects `process.env.PORT`; a custom server must honor it too.

All three name themselves in the logs, and you read those in the dashboard: **Application Administration**, then **Logs Viewer**, then the **App Errors** tab, which is `app.error.log`. Search it for the variable or module you suspect. **App Info** (`app.info.log`) carries the ordinary startup chatter, and **Web Requests Logs** is the access log for every request served, useful for confirming the proxy is even reaching your app. Build output is separate and streams live under **Build and Deployment History**. If you'd rather read the files, they're at `/home/admin/hosted-sites/<app_system_user>/app-logs` through the File Manager. The full playbook is in [fixing a 503 after deploying](https://www.kloudbean.com/blog/fix-503-after-deploying-your-app/).

## What you own, and what's managed

Kloudbean runs Linux stacks: Node and the modern JavaScript toolkit including Next.js and React, which is what v0 produces. It isn't for Windows or .NET workloads. "Managed" means the server, stack, SSL, backups, and patching are handled, while you own and maintain the app. The upside of owning it: the UI, the API, and the database sit in one dashboard, and your next v0 project can share the same server instead of starting a new bill. For the tool-agnostic version that also covers Cursor, Lovable, and Bolt, see [deploy an AI-built app to production](https://www.kloudbean.com/blog/deploy-ai-built-app-to-production/).

## Generated UI, infrastructure you own

Deploy your v0 app on a server you own at [kloudbean.com](https://www.kloudbean.com/). One-click databases · Automatic backups · Free migration · Free trial · Git deploy. Plans on [pricing](https://www.kloudbean.com/pricing/).

## FAQ

**Can I deploy a v0 app without using Vercel?**
Yes. v0 generates a standard Next.js and React project and pushes it to GitHub. You can deploy that repo to your own server on Kloudbean. The code isn't tied to Vercel in any way.

**Did v0 give me a full app or just components?**
Both are possible. If you built pages and routes and pushed a whole project, it's a deployable app. If you generated individual sections or cards, those are meant to be pasted into an existing app, which is the app you then deploy.

**Does Next.js need a special adapter to run on my server?**
No. Standard next build then next start runs the full Next.js production server on a normal Node machine. Server rendering, API routes, ISR, and image optimization all work, with no proprietary adapter or build target.

**Are shadcn/ui components hard to deploy?**
No. shadcn/ui components are copied into your repo as source files rather than pulled from a package, so they build like any other React code. There's nothing to configure on the server and no runtime service to reach.

**Where does my database go?**
On your server. Launch a managed Postgres or MySQL from the console, connect through environment variables, and it runs next to the app. Handy, since v0 focuses on the UI and leaves the data layer to you.

**My v0 app builds but won't start: why?**
Usually the start command isn't running next start, or an environment variable is missing (often the database URL or a NEXT_PUBLIC_ value), or the port isn't respected. Open Logs Viewer under Application Administration and read the App Errors tab, then fix the config and redeploy.

**Do I lose Vercel's preview deployments?**
You can reproduce them. Run a second application from a staging branch on the same server for a stable preview URL. You keep git-driven deploys and add previews without the platform lock-in.
