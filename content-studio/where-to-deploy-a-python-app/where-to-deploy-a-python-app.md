---
title: "Where to Deploy a Python App: An Honest Decision Guide"
slug: where-to-deploy-a-python-app
meta_description: "Where to deploy a Python app (Django, FastAPI, or Flask): the real options compared. A managed platform, a raw VPS you run yourself, or serverless functions, and which one actually fits your app."
target_keyword: where to deploy a Python app
secondary_keywords:
  - where to deploy a Django app
  - where to deploy a FastAPI app
  - best host for a Python web app
  - Python app hosting
  - deploy a Python web app
author: Kloudbean
hero_image: images/hero.png
cluster: 2 - Deployment Fundamentals
---

![How a Python web app runs: a persistent process behind a WSGI or ASGI server, versus serverless functions that spin up per request](images/hero.png)

# Where to Deploy a Python App: An Honest Decision Guide

By Kloudbean Engineering · Match the host to how your Python app actually runs.

So you've built a Python web app, maybe a Django project, a FastAPI service, or a small Flask app, and now the real question is where to deploy a Python app without picking the wrong home. Every option promises to be easy, and most "best Python hosting" lists just rank logos. This guide does the opposite. It starts with how your app actually runs, then walks the three real kinds of home, a managed platform, a raw VPS you run yourself, or serverless functions, and says plainly which one fits which job. No always-win pitch.

> **The short answer.** It depends on how your app runs. A Django, Flask, or FastAPI app is a long-running process that sits behind a WSGI or ASGI server, so a persistent home (a managed platform, or a VPS you run yourself) suits an always-on app with a database and background jobs. Serverless functions fit light, bursty, stateless endpoints, but their cold starts and request timeouts get in the way of long requests, streaming, and steady background work.

## The honest answer: it depends on how your app runs

Most "where to deploy" posts hand you a ranked list of platforms. That's backwards. The home that's perfect for a tiny webhook is a poor fit for a Django app with a database and a queue of background jobs, and a setup built for one long-running API is overkill for a function that runs for a second a day. So start with your app, not the logo on the pricing page.

A Python web app has a shape worth naming out loud. It's a program that starts up once, loads your framework and your code into memory, and then stays running, answering requests as they arrive. That one fact, that it's a persistent process, quietly decides most of this. Some hosts are built to keep a process alive around the clock. Others spin your code up per request and tear it down after. Neither is wrong. They're built for different kinds of work, and the trick is knowing which kind you have.

So the real decision isn't "which platform is best." It's "does my app want an always-on process, and where should its data and its background work live." Answer that and the shortlist writes itself.

## WSGI, ASGI, and why a Python web app is a long-running process

Here's the part the platform ads skip, and it's the part that actually decides where your app is happy. A Python web framework doesn't talk to the internet directly. It speaks through a standard interface, and there are two of them.

Django and Flask are, by default, WSGI apps. WSGI is the classic synchronous interface: a request comes in, a worker handles it start to finish, then picks up the next one. FastAPI is an ASGI app. ASGI is the newer asynchronous interface that also handles WebSockets and long-lived connections, which is why FastAPI gets reached for on real-time and high-concurrency work. Django can run under ASGI too, once you opt in.

Either way, something has to run that app as a real process. That's the job of a server like Gunicorn (the common WSGI choice) or Uvicorn (the common ASGI choice), usually set up to launch several worker processes and restart them if they die. In production you often pair them, with Gunicorn managing a pool of Uvicorn workers for an async app. The mental model to carry: your code is a long-lived process, or a small pool of them, waiting for requests. It has warm memory, open database connections, maybe a cache. It doesn't want to be born and killed on every request.

That single detail is the fork in the road. A host that keeps that process alive is a natural fit. A host that runs code per request, then freezes it, is working against the grain of a typical web app, and you'll feel that friction most on the slow parts, the streaming parts, and the always-on parts of your product.

## What a Python app needs wherever you host it

Before comparing homes, get clear on the full shape of what you're deploying. A Python web app is rarely just the web process. Most real apps need a few pieces, and where each one lives matters as much as where the app lives.

- **The app process itself.** Your Django, FastAPI, or Flask code, run by Gunicorn or Uvicorn workers, kept alive and restarted if it crashes.
- **A database.** Almost always PostgreSQL or MySQL. It wants to sit close to your app so queries stay quick, and it wants backups. A managed database saves you from babysitting it. This is where hosts differ most in practice: a platform with seven managed engines a click away (Kloudbean's list is PostgreSQL, MySQL, MariaDB, Redis, Memcached, MongoDB, and Elasticsearch) turns "and now find a database vendor" into a dropdown, and you lock it down by whitelisting your app server's IP so nothing else can connect.
- **Somewhere for background tasks.** If you send email, process images, or run anything slow, you'll reach for Celery or RQ, and those workers are extra long-running processes with a broker (often Redis) behind them. Note that the broker is a hosting decision too, not just a library choice, so check the broker is available wherever the workers are going to live.
- **Secrets.** API keys and the database URL kept out of your code, in environment variables, never committed to Git.
- **A domain with SSL.** A custom domain and an HTTPS certificate, which most hosts can handle for you now.
- **Backups.** Automatic, and tested at least once, because the day you need one is not the day to discover it never ran.

Notice how much of that assumes things stay running: the web workers, the task workers, the broker. That's the tell. A typical Python app is a small cluster of persistent processes plus a database, not a single stateless function. Keep that picture in mind as we look at the three ways to host it.

## The three real options: managed platform, raw VPS, or serverless

Strip away the brand names and there are three genuine categories, not fifty. Each is a real answer for a real situation.

| | Managed platform | Raw VPS (you run it) | Serverless functions |
| --- | --- | --- | --- |
| What you get | A server with the app and database handled | Root on a plain Linux box | Code that runs per request |
| Who runs the OS, SSL, backups | The platform | You | The provider |
| Fits a long-running process | Yes | Yes | Not really |
| Background jobs, WebSockets | Yes | Yes | Hard or unsupported |
| Setup effort | Low | High | Low for simple endpoints |
| Pick it when | You want an always-on app without server ops | You want full control and will do the ops | The work is short, bursty, and stateless |

A managed platform gives you a real, always-on server, with the operating system, SSL, and backups handled, so your persistent process has a stable home and you don't patch anything at midnight. A raw VPS is the same always-on server, but the whole job of running it, OS updates, the web server, SSL renewal, backups, security, is yours. Serverless functions flip the model: no server to mind, your code runs on demand and scales down to nothing when idle, which is lovely for the right workload and awkward for the wrong one.

There's a fourth shape worth naming, because it confuses a lot of comparisons: the scale-to-zero container platform. It runs your app as a real process, so Gunicorn and WebSockets behave normally, then puts it to sleep when nobody's using it and wakes it on the next request. Think of it as a persistent server with an off switch. That's a fine home for an internal tool or a demo, and the trade is the wake-up delay on the first request after a quiet spell, which is the same cold start serverless has, just arriving less often. If a free tier is what got you looking, this is usually the model you're actually looking at.

None of these is the winner. They're answers to different questions, so the useful move is to match the option to how your app behaves. The next two sections do exactly that.

## Choose serverless if the work is light, bursty, and stateless

Serverless functions get a lot of hate from people who used them for the wrong job, which is unfair, because for the right job they're excellent. Reach for serverless when your workload looks like this:

- Short requests that finish quickly and return.
- Traffic that's spiky or unpredictable, including long quiet stretches where scaling to zero genuinely saves money.
- Stateless endpoints: a webhook receiver, a form handler, a small API that reads and writes a database and gets out.
- Work you're happy to have cold-start occasionally, because it isn't latency-critical.

For those shapes, serverless is a genuinely good answer. You don't run a server, you don't pay for idle time, and it scales up under a burst without you doing anything.

Now the honest catch, and it's the reason serverless struggles as a home for a whole web app. Functions have **cold starts**: when one hasn't run recently, the platform has to spin it up before it can answer, which adds a delay to that first request. They have **request timeouts**: a function is meant to finish quickly, so long requests, big file processing, and streaming responses can hit a ceiling and get cut off. And they're **stateless by design**: no warm memory between calls, no long-lived WebSocket, no place to run a Celery worker that sits and waits for jobs. You can bolt background work onto a serverless architecture, but now you're assembling queues and schedulers to recreate what a persistent process gave you for free.

So serverless is a scalpel, not a house. Perfect for the light and bursty edges of your product. Frustrating as the place your entire Django or FastAPI app lives, if that app does anything long, stateful, or always-on.

## Choose a persistent server if it's a real always-on app

If your Python app is a product people log into during the day, it almost certainly wants a persistent server, either a managed platform or a VPS you run yourself. Pick this side when:

- The app should be **always on**, answering instantly, with no cold start on the first request after a quiet spell.
- You run **background jobs**: Celery or RQ workers churning through email, reports, image processing, or scheduled tasks.
- You use **WebSockets or long-lived connections**, common with FastAPI for real-time features.
- Traffic is **steady** rather than rare and spiky, so paying for a running server is paying for something you actually use.
- You want your **database and cache close by**, with predictable latency and a bill that doesn't jump around with every request.

This is the shape of most SaaS backends, dashboards, APIs with real users, and anything with a job queue. A persistent process keeps its warm memory and open connections, handles a WebSocket without ceremony, and runs a worker that waits patiently for the next job. There's no cold-start penalty because it never went cold.

The split between a managed platform and a raw VPS then comes down to one thing: do you want to run the server, or just your app? A VPS is cheaper on paper and gives you total control, but you own every operational task on it, which is the whole argument in [do I need a VPS for my SaaS](https://www.kloudbean.com/blog/do-i-need-a-vps-for-my-saas/). A managed platform costs a little more and hands the ops back to the provider. Same always-on server underneath, different amount of your time spent keeping it alive.

What "managed" buys you on this side is mostly the boring middle: on Kloudbean, Flask, Django, and FastAPI are supported runtimes on an always-on server, so there's no cold start to design around, and the Python runtime settings you'd otherwise hand-edit over SSH are fields in the console. Scheduled jobs come from the dashboard rather than a `crontab` you'll forget you edited. That's the honest scope of the difference, and it's less glamorous than a marketing page but it's what you notice in month three.

<!-- ADD IMAGE: two-panel teaching diagram. Left "Persistent server": requests -> Gunicorn/Uvicorn -> warm worker 1/2/3, plus a Celery worker and a database, labelled always warm, holds connections, handles jobs and websockets. Right "Serverless": request arrives -> cold start (if idle) -> function runs then stops, labelled great for short bursty endpoints, long or stateful work hits timeouts. Brand colors navy #000f27, purple #4F1AF3, green #40b75f. src -> images/persistent-vs-serverless.png -->

*The same Python app, two very different homes. A persistent server keeps warm workers ready; serverless spins code up per request and stops it after.*

## The costs that don't show up in a deploy demo

Every host has a slick five-minute deploy demo. The demo is never where the decision actually lives. Three quieter questions matter more.

**Where does the database live?** A Python app without a database is rare, and a database far from your app makes every query slower and complicates backups. The tidiest setups keep the app and a managed database close together, which is one reason [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) tends to sit right next to the app rather than three networks away. If a platform treats the database as an afterthought, that's a cost you pay later.

**Where do background tasks run?** If you use Celery or RQ, those workers need a persistent home and a broker. On a persistent server, that's just another process. On serverless, it's an architecture you assemble. Count that work before you commit, and count the broker too, since a managed Redis you launch next to the app (one of the seven engines on Kloudbean) is a very different job from standing one up yourself and remembering to secure it.

**What happens on the slow path?** The happy-path demo is always fast. The real test is the slow request: a big export, an upload, a streamed response, a report that takes a while. That's exactly where serverless timeouts bite and where a persistent process shrugs. Deploying an AI feature makes this sharper still, since model calls can be slow, a theme in [hosting for an AI SaaS](https://www.kloudbean.com/blog/best-hosting-for-ai-saas/).

None of these show up when you're clicking through a deploy tutorial. All of them show up in month three. It's the same lesson the Node crowd learns, laid out in [where to deploy a Node.js app](https://www.kloudbean.com/blog/where-to-deploy-nodejs-app/): the deploy demo is the easy part, and it's the least important part of the decision.

## A quick way to decide where to deploy a Python app

You don't need a spreadsheet. Walk these three questions and you'll have your answer.

**Is your app always-on, or is sleeping fine?** A background webhook or an occasional script can happily scale to zero, so serverless is a fair fit. A product with logged-in users can't afford a cold start on every quiet morning, so it wants a persistent server. If you're unsure, assume always-on, because most apps with real users are.

**Does it hold state or run background work?** WebSockets, a Celery or RQ queue, scheduled jobs, in-memory caches. If yes to any, a persistent server is the natural home, and serverless will have you rebuilding those pieces the hard way. If it's genuinely stateless and short, serverless stays on the table.

**Do you want to run the server, or just your app?** If you enjoy ops and want full control, a raw VPS is honest and cheap. If you'd rather ship features and let someone else patch the OS and renew SSL, a managed platform is the same server with the grunt work removed. Both are persistent; they differ only in who does the maintenance.

Three questions, and the category is clear. From there, the how-to guides get specific: [deploy a Django app](https://www.kloudbean.com/blog/deploy-django-app/), [deploy a FastAPI app](https://www.kloudbean.com/blog/deploy-fastapi-app/), and [deploy a Flask app](https://www.kloudbean.com/blog/deploy-flask-app/) each walk the actual steps once you've picked a home.

## If you only answer one question, answer this one: can your app afford to sleep?

Everything above collapses into that. Not "which platform is best", not price, not how nice the CLI is. Can this app be asleep when nobody is using it, and would you be fine with the first person after a quiet hour waiting for it to wake?

If yes, stop reading comparisons and take the cheap option. A serverless function for short stateless work, or a scale-to-zero container platform if you want a normal Gunicorn process that naps. Paying for uptime nobody consumes is a real waste, and there's no prize for over-provisioning a side project.

If no, and for most apps with logged-in users the answer is no, then you need a persistent server and only one question is left: who runs the operating system. That's a preference about how you spend your week, not a technical ranking. A VPS is honest and cheap if ops is part of the fun. A managed platform is the same always-on server with the patching, SSL, and backups taken off your plate. On Kloudbean specifically, that means Django, Flask, or FastAPI running as a long-lived process across seven clouds, a managed database and Redis broker in the same dashboard, automatic and on-demand backups, free auto-renewing SSL, Git deploys with live build logs, cron and Python runtime config in the console, and vertical resizing when the app outgrows its box. From $8/mo.

Be equally clear about where that model is the wrong answer, including on us. There's no scale-to-zero, so a genuinely idle app pays for a server it isn't using. Kubernetes and autoscaling are Enterprise here, so don't plan a standard-plan app around automatic horizontal scaling. Docker isn't on the standard plan either. And disks resize up, not down, which is worth knowing before you provision generously.

Then the part no host anywhere fixes. Nothing about a hosting choice makes a synchronous WSGI view asynchronous, turns an N+1 query into a fast one, or notices that a Celery task has been silently failing for a fortnight. Sizing your Gunicorn workers, bounding your connection pool, and watching your own queue are yours on every platform that exists. The host decides whether your process gets to stay alive. What that process does with the time is still your code, and that's where almost all the performance actually lives.


<!-- cta:start -->
**Prototype to production, without the babysitting.**

Run the app as an always-on process with managed databases, Redis, object storage, and automatic backups beside it. Deploy from Git with live build logs, and keep the infrastructure someone else's problem.

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

**Where should I deploy a Python app?**
It depends on how your app runs. A Django, Flask, or FastAPI app is a long-running process, so an always-on app with a database and background jobs fits a persistent server, either a managed platform or a VPS you run yourself. Serverless functions suit short, bursty, stateless endpoints. Match the home to the workload rather than picking by brand.

**Where do I deploy a Django app?**
A Django app runs as a WSGI process (or ASGI, once you opt in) behind a server like Gunicorn, so it wants a persistent home. A managed platform or a VPS both keep that process alive, with a database and backups nearby. Serverless can work for a tiny stateless Django endpoint, but a real app with logins and background jobs belongs on an always-on server.

**Where do I deploy a FastAPI app?**
FastAPI is an ASGI app, usually run with Uvicorn workers, and it shines with async and WebSocket work, so it strongly prefers a persistent server that keeps those connections open. A managed platform or a VPS both fit. Serverless undercuts what FastAPI is good at, since cold starts and timeouts fight long-lived connections and streaming responses.

**What is the best host for a Python web app?**
There isn't a single best one, there's a best fit for your app. An always-on app with a database and background jobs is happiest on a persistent server, managed if you'd rather not do ops. A light, bursty, stateless endpoint can suit serverless. Decide by how your app runs, not by which platform has the loudest marketing.

**Can I deploy a Python app on serverless functions?**
Yes, for the right workload. Short, stateless endpoints that finish quickly are a good match, and scaling to zero saves money during quiet spells. The trouble starts with long requests, streaming, WebSockets, and background workers, which run into cold starts and request timeouts. For a whole always-on app, a persistent server is usually the calmer choice.

**Do I need Gunicorn or Uvicorn to deploy a Python app?**
In production, effectively yes. A framework's built-in development server isn't meant for real traffic. WSGI apps like Django and Flask commonly run under Gunicorn; ASGI apps like FastAPI run under Uvicorn, often with Gunicorn managing the workers. The server launches several worker processes and keeps them alive, which is exactly what a persistent host is built to support.

**Where do background tasks like Celery run?**
On a long-running worker process, separate from your web process, with a broker such as Redis behind it. That's straightforward on a persistent server: it's just another process you keep alive. On serverless it's harder, because there's no always-on worker to sit and wait for jobs, so you end up assembling queues and schedulers to fake one.

**Do I need a separate database for my Python app?**
Almost always, yes. You'll want PostgreSQL or MySQL rather than a file-based store once real users arrive, and it should sit close to your app with backups turned on. A managed database handles the upkeep for you. Keeping the app and its database near each other keeps queries quick and backups simple.

**Is a VPS or a managed platform better for Python app hosting?**
Both give you the same always-on server your app wants; they differ in who runs it. A VPS is cheaper and gives full control, but the OS updates, SSL, backups, and security are all yours. A managed platform hands that maintenance back to the provider so you can focus on the app. Pick based on whether you want to run the server or just your code.

---

*Kloudbean Engineering · A Python web app is a long-running process. Give it a home that keeps it running.*
