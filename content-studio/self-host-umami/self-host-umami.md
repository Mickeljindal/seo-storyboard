---
title: "How to Self-Host Umami: Own Your Web Analytics"
slug: self-host-umami
meta_description: "Self-host Umami, the open-source, privacy-friendly Google Analytics alternative. Run the Umami Node app on a managed server with managed PostgreSQL, set DATABASE_URL and APP_SECRET, run the migrations, and drop the tracking script on your sites."
target_keyword: self-host Umami
secondary_keywords:
  - self-hosted Umami
  - Umami analytics
  - Umami database
  - Umami PostgreSQL
  - Umami DATABASE_URL
  - Umami APP_SECRET
  - Google Analytics alternative self-hosted
  - privacy-friendly analytics
  - cookieless analytics
  - deploy Umami
  - Umami tracking script
author: Kloudbean Engineering
hero_image: images/hero.png
cluster: 2 (Self-Hosted Tools)
---

![Self-host Umami: the open-source, privacy-friendly Google Analytics alternative running on a server you own](images/hero.png)

# How to Self-Host Umami: Own Your Web Analytics

Umami is an open-source, privacy-friendly web analytics tool, and one of the cleanest Google Analytics alternatives you can actually run yourself. When you self-host Umami, the visitor data stays in a database you own, the tracking is cookieless, and the script that loads on your pages is tiny. This guide covers how to self-host Umami in production: the architecture, the database it needs, the environment variables that matter, and how to deploy it on a managed Node server backed by managed PostgreSQL.

I'll be straight with you. The tool itself is easy. The part people get wrong is the boring infrastructure around it, mostly the database. Get that right and self-hosted Umami will quietly collect your traffic for years.

> **Short version:** Umami is a Next.js app, so you run it on a managed Node server and back it with managed PostgreSQL, not a throwaway local database. Set `DATABASE_URL` and `APP_SECRET` as environment variables, let the build run Umami's migrations to create the schema, then paste the tracking script on your sites. Your analytics live in your own database. Cookieless, no sampling, no ad network sitting in the middle.

## The Google Analytics problem Umami solves

Google Analytics 4 is free, and for a lot of teams that's the end of the conversation. Fair. But free has a shape to it, and once you've lived with GA4 for a while the shape starts to chafe.

The interface is heavy. The event model takes real effort to learn, and plenty of people give up and just check "users this week." On high-traffic properties GA4 samples your data, so the numbers are an estimate, not a count. It sets cookies and touches personal data, so you usually need a consent banner, and a chunk of visitors decline it, which puts holes in your reports. The data itself lives in Google's advertising cloud, a strange place to keep something you'd like to call yours.

Credit where it's due: GA4 is genuinely free and it plugs straight into Google Ads, which is hard to walk away from if you spend money there. That's the one honest reason to stay. Umami answers a different question: what if your analytics were a small app and a database you owned, instead of a tenant in an ad platform?

> **Coming from Google Analytics?** You don't have to rip GA out on day one. Add the Umami script alongside your existing tag, watch both for a couple of weeks, and pull GA once you trust the Umami numbers. Running them in parallel is the calm way to switch.

## Why self-host Umami (and who it's for)

Self-hosting isn't ideological. It's a trade you make on purpose. Here's what you actually get when you self-host Umami rather than paste in a hosted tag:

- **You own the visitor data.** Every pageview lands in your database, on your server. No third party gets a copy, and nobody's building an ad profile off your traffic.
- **Cookieless by default, so it's GDPR-friendly.** Umami doesn't set cookies and doesn't collect personal data out of the box. That design often means you can skip the cookie banner, though the compliance call is still yours (more on that in the FAQ).
- **No sampling.** Umami counts every event. What you see is what happened, not a modeled estimate, even on a busy day.
- **A lightweight script.** The Umami tracking script is roughly 2KB. Google's gtag is many times heavier. On mobile and slow connections that difference is real, and it's a difference your visitors feel.
- **First-party by default.** Because the script loads from your own domain, it dodges a lot of the ad blockers that quietly eat Google Analytics hits. Your counts get more honest, not less.

The honest tradeoff: you're running a service now, a database to keep alive and a process to keep up. A managed platform takes most of that weight (server, OS, SSL, backups), so what's left is small.

## What you're running when you self-host Umami

Umami is two things: a Node app and a database. The app is a Next.js application, so it runs anywhere Node runs. The database is where every event is stored, and Umami supports PostgreSQL or MySQL. For production I'd reach for managed PostgreSQL every time. It's well understood, it backs up cleanly, and it's the engine most Umami deployments run on.

Under the hood Umami uses Prisma to talk to the database, and it ships its schema as migrations. You don't design any tables. When the app builds, it applies those migrations and the database goes from empty to fully set up. The one thing you must not do is point it at some scratch database on the same box that gets wiped on a redeploy. That's the classic way people lose six months of history. Analytics only get more valuable with age, so the database is the part worth protecting from day one.

<!-- SVG diagram in the HTML: the Umami tracking script in a visitor browser sends pageviews to the Umami Node app on your server, which writes events to managed PostgreSQL over the private network. Boundary labeled "your server, your data". -->

*The tracking script runs in your visitors' browsers and sends each pageview to the Umami app on your server. Umami writes every event to managed PostgreSQL over the private network. Nothing leaves for an ad network, and the data sits in a database you own.*

## Self-hosted Umami vs Google Analytics vs Umami Cloud

Three ways to run Umami-style analytics, side by side. The hosted options win on convenience. Self-hosting wins on ownership and cost predictability.

| | Self-hosted Umami | Google Analytics 4 | Umami Cloud |
| --- | --- | --- | --- |
| **Data ownership** | Your database, your server | Google's advertising cloud | Umami's cloud account |
| **Privacy / cookies** | Cookieless, no personal data by default | Cookies, consent banner usually needed | Cookieless, no personal data by default |
| **Cost** | Flat server cost, unlimited events | Free | Paid by events, free hobby tier |
| **Sampling** | None, every event counts | Sampled at high volume | None |
| **Complexity** | You deploy and run it | Paste a snippet | Paste a snippet |
| **Who runs it** | You (a managed server does the heavy lifting) | Google | Umami |

If you want zero operations and you're tiny, Umami Cloud's free tier is a lovely place to start, and GA4 costs nothing. The moment data ownership, a predictable bill, or accurate high-volume counts matter more than a paste-and-forget setup, self-hosting is the better deal.

<!-- ADD IMAGE: Your live Umami dashboard showing real visitor numbers, so readers see the payoff. -->

## Deploy Umami on a managed Node server

Here's the production path end to end. Four steps, and the order matters: database first, then the app, then the secrets, then the deploy.

### 1. Launch managed PostgreSQL

Start with the database, because Umami needs it before it'll boot. Provision a managed PostgreSQL instance, create a database named `umami`, and grab its private-network host and credentials. Managed here means the engine is provisioned, patched, and backed up for you, and it sits on a private network your app can reach without exposing a public port.

![The Kloudbean console Launch Database screen used to provision managed PostgreSQL for a self-hosted Umami analytics instance](../assets/console/launch-database.png)

### 2. Add the Umami Node app

Next, add an application on the server as a Node app and point it at the Umami source (the official `umami-software/umami` repo, or your fork). This is where I want to be clear: there's no magic one-click Umami button here. You're running the real Umami Node app on a managed Node runtime, which is the honest version and the one that lets you update on your own terms. The [deploy a Node app](https://www.kloudbean.com/blog/deploy-node-app-to-managed-cloud/) guide covers the general flow if you want the long form.

![The Kloudbean console Add Application screen where the Umami Next.js Node app is added to a managed server](../assets/console/add-application.png)

<!-- ADD IMAGE: The Umami GitHub repo page, or your fork, so readers know exactly what they're deploying. -->

### 3. Set DATABASE_URL and APP_SECRET

Umami is configured almost entirely through two environment variables. `DATABASE_URL` tells it where the database is, and `APP_SECRET` is the secret it uses to sign tokens. Set these in the console, not in a file you might commit.

![The Kloudbean console Environment Variables screen where the Umami DATABASE_URL and APP_SECRET are configured](../assets/console/env-vars.png)

```bash
# Umami needs a database and a secret, nothing exotic
DATABASE_URL=postgresql://umami:long-random-password@10.0.0.5:5432/umami
DATABASE_TYPE=postgresql
APP_SECRET=a-long-random-string-you-generate-once
```

A few things worth knowing here. The host in that connection string (`10.0.0.5` in the example) is the database's private-network address, not a public one. `DATABASE_TYPE` is usually inferred from the URL scheme, but setting it explicitly to `postgresql` removes any doubt. And `APP_SECRET` matters more than it looks: if you skip it, Umami derives one from your `DATABASE_URL`, which means the day you rotate the database password, every login token silently breaks. Set an explicit `APP_SECRET` once and never think about it again. Our [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/) guide goes deeper on the habit.

### 4. Build, migrate, and deploy

Now deploy. Connect the GitHub repo and let the platform build and start the app on every push, with the build logs streaming in the console so you can watch the migration run. The build step is where Umami's schema gets created: `npm run build` runs Prisma's `migrate deploy` under the hood, which turns your empty database into a fully set-up Umami database.

```bash
# Build: this also runs Umami's Prisma migrations against DATABASE_URL
npm install
npm run build          # applies the schema via prisma migrate deploy

# Start the app (Umami serves on port 3000 by default)
npm start
```

If you ever need to apply the schema by hand (a fresh database, or a manual check), that's the same command Umami runs for you:

```bash
npx prisma migrate deploy
```

![The Kloudbean console Git deployment screen building and deploying the Umami Node app from GitHub with live build logs](../assets/console/git-deployment.png)

When the build finishes, add your domain, let the platform issue free SSL, and open the app. You'll land on the Umami login. That leads straight to the one step nobody should skip. See [auto-deploy from GitHub](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/) for the full pipeline setup.

### Then change the default login

Fresh Umami installs ship with a default account: username `admin`, password `umami`. That's public knowledge. If you leave it, anyone who finds your URL can walk into your dashboard. So the very first thing you do after the first successful login is change that password. This is the single most common self-hosted Umami mistake, and it takes about thirty seconds to avoid.

<!-- ADD IMAGE: The Umami profile screen where you change the default admin password on first login. -->

## Add the Umami tracking script to your sites

With Umami running on your own domain, you add a website inside the dashboard, and it hands you a small script tag with that site's ID. Drop this into the `<head>` of the pages you want to track:

```html
<script
  defer
  src="https://analytics.example.com/script.js"
  data-website-id="b3f1c2a4-your-site-id-here"></script>
```

Swap `analytics.example.com` for your Umami domain and the ID for the one Umami gives you. That's the whole integration. It's plain HTML, so it works everywhere: a WordPress theme header, a static site, a React or Vue app, a Laravel Blade layout, anything that renders a `<head>`. Because it loads from your own domain, it reads as first-party, which is exactly why fewer visitors block it.

## Security: the parts people skip

Self-hosting means the security defaults are yours to set. None of this is hard, but skipping it is how a quiet analytics box becomes a problem.

- **Keep the database on the private network.** Umami reaches PostgreSQL over the private address, and the database never needs a public port. Don't open one.
- **Secrets in env vars, never in code.** `APP_SECRET` and the database credentials live in the environment, not in a config file that could land in Git.
- **Keep .env out of your repo.** Add it to `.gitignore` before the first commit. A leaked `DATABASE_URL` is a leaked database.
- **Least-privilege database user.** The `umami` user needs access to the `umami` database and nothing else. Don't hand it a superuser role it will never use.
- **SSL in front of the dashboard.** Serve Umami over HTTPS so your admin login isn't crossing the network in the clear. Free certificates make this a non-decision.
- **Back up the analytics database.** Server-level backups protect the box; regular PostgreSQL dumps protect the data itself. The database is the one thing you can't recreate. Our [server backups guide](https://www.kloudbean.com/blog/server-backups-guide/) has the sane defaults.

The platform helps here too: a Shorewall firewall and Fail2ban come switched on, and SSL is free, so the baseline hardening is done before you touch anything.

## When Umami Cloud makes more sense

I won't pretend self-hosting is always the answer. Stay on Umami Cloud, or even GA4, when the math points that way:

- **You're a hobby project.** Umami Cloud's free tier covers a lot of small sites, and you get the same cookieless analytics with zero maintenance.
- **You never want to run a service.** A paste-in tag has no database to back up and no process to keep alive. That's a legitimate preference.
- **You live inside Google Ads.** If your marketing runs on Google's stack, GA4's free integration is genuinely hard to give up.

The switch pays off when ownership, a flat bill, or accurate counts at real volume start to matter more than never touching a server.

Umami is a good gateway into running your own tools. The [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/) roundup is worth a read, [self-hosting Supabase](https://www.kloudbean.com/blog/self-host-supabase/) is a natural next step for your backend, and [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) covers what's running under Umami.

---

**Analytics that stay yours.** Run the Umami Node app on a managed server, back it with managed PostgreSQL, and keep every pageview in a database you own. The OS, SSL, and backups are handled. Start free at [kloudbean.com](https://www.kloudbean.com/); plans on [pricing](https://www.kloudbean.com/pricing/).

Managed Node runtime · Managed PostgreSQL · Private networking · Automatic backups · Free SSL · Free migration · Free trial

## FAQ

**Is Umami a good Google Analytics alternative?**
For most sites, yes. Umami gives you the numbers people actually check (pageviews, referrers, top pages, countries, devices) in a clean interface, without cookies or sampling. It won't replace GA4 if you depend on deep Google Ads integration, but for owning your traffic data it's one of the strongest self-hosted options going.

**What database does Umami need?**
Umami needs PostgreSQL or MySQL. It uses Prisma to talk to whichever you pick and ships its schema as migrations. For production, managed PostgreSQL is the safe choice: it backs up cleanly, runs on a private network, and is the engine most Umami deployments use.

**Is self-hosted Umami GDPR compliant?**
Umami's cookieless, no-personal-data design removes the biggest sources of trouble, which is a real head start. But no tool makes you automatically compliant. Compliance depends on how you configure it, what you track, and your own legal setup, so the responsibility stays with you as the site owner. Umami makes doing the right thing much easier; it doesn't do it for you.

**Do I need a cookie banner with Umami?**
Often you don't, because Umami doesn't set cookies or collect personal data by default, and cookie banners exist mainly to consent to cookies and tracking. That said, the final call depends on your jurisdiction and exactly what you collect. Many teams run Umami without a banner, but confirm it against your own legal requirements.

**How do I deploy Umami?**
Run the Umami Node app on a managed Node server and back it with managed PostgreSQL. Set DATABASE_URL and APP_SECRET as environment variables, let the build run the migrations to create the schema, add your domain with SSL, then paste the tracking script on your sites. Connecting a GitHub repo lets it rebuild and redeploy on every push.

**Is Umami free?**
The self-hosted version is free and open source, so the software costs nothing. What you pay for is the server and database you run it on. Umami also offers a paid hosted service, Umami Cloud, with a free tier for small sites if you'd rather not run anything yourself.

**What are DATABASE_URL and APP_SECRET in Umami?**
DATABASE_URL is the connection string Umami uses to reach your PostgreSQL or MySQL database, including the user, password, host, and database name. APP_SECRET is the secret Umami uses to sign login tokens. Always set an explicit APP_SECRET, because if you leave it out Umami derives one from your DATABASE_URL and your logins break the moment you rotate the database password.

**Does self-hosted Umami sample my data?**
No. Umami records every event, so your reports are a true count rather than a modeled estimate. That's a meaningful difference from Google Analytics, which samples data on high-traffic properties and can leave you reading approximations.

**Will ad blockers block my Umami tracking script?**
Far less than they block Google Analytics. Because you self-host, the script loads from your own domain and reads as first-party, so it slips past the blocklists that target well-known third-party trackers. You won't dodge every blocker, but your counts end up noticeably more accurate.

**Can I use MySQL instead of PostgreSQL for Umami?**
Yes. Umami supports both PostgreSQL and MySQL, and you choose by pointing DATABASE_URL at whichever you run. Either works well. PostgreSQL is the more common pick for new Umami deployments, and managed PostgreSQL keeps the operational side simple.

---

*By Kloudbean Engineering · Analytics that stay yours.*
