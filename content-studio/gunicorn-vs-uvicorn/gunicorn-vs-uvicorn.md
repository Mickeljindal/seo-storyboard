---
title: "Gunicorn vs Uvicorn: Which Python Server for Production?"
description: "Gunicorn vs Uvicorn, explained. Use Gunicorn for sync frameworks like Flask and Django, Uvicorn for async apps like FastAPI, plus how to combine them safely."
slug: gunicorn-vs-uvicorn
canonical: https://www.kloudbean.com/blog/gunicorn-vs-uvicorn/
eyebrow: Python in production
byline: By the Kloudbean engineering team · Serving Python in Production.
---

# Gunicorn vs Uvicorn: Which Python App Server for Production?

By the Kloudbean engineering team · Serving Python in Production.

![Gunicorn vs Uvicorn: choosing the Python app server for production based on WSGI or ASGI](images/hero.png)

You built a Python app. Flask, Django, maybe FastAPI. It runs great with `flask run` or `uvicorn main:app --reload`, so you copy that command to a server, run it, and call the thing deployed. That command is the mistake.

Gunicorn vs Uvicorn is the question you actually need to answer, and the answer comes down to one distinction most tutorials skip: WSGI vs ASGI. Get it wrong and you either fight your server or watch it fall over the first time real traffic shows up.

> **The short answer**
> Use **Gunicorn** for synchronous frameworks (Flask, classic Django). Use **Uvicorn** for async frameworks (FastAPI, Django ASGI, WebSockets). Want an async app with battle-tested process management? Run Uvicorn workers under Gunicorn with `gunicorn -k uvicorn_worker.UvicornWorker`. Either way, put it behind a reverse proxy like nginx and never run the dev server in production.

## First, stop shipping the development server

Every Python web framework ships a built-in server for local work. They're wonderful for that and wrong for production, and the frameworks say so out loud.

```
# development only, do not ship these
flask run                     # Werkzeug dev server, effectively single process
python manage.py runserver    # Django dev server, auto-reloads on file change
uvicorn main:app --reload     # Uvicorn watching your files for edits
```

Run `flask run` and Werkzeug prints the warning itself: this is a development server, do not use it in a production deployment. Django's `runserver` says the same. They're single-process, tuned for one developer hitting refresh, and light on the hardening a public endpoint needs. Uvicorn's `--reload` is worse in prod: it watches your files and restarts on every change, which is a development convenience and a liability on a live box.

Production needs a real app server: multiple worker processes to use every CPU core, a supervisor that restarts a worker if it dies, and a reverse proxy in front. That's the job Gunicorn and Uvicorn do, and which one you pick is decided by your framework.

## WSGI vs ASGI: the fork that picks your server

Here's the whole decision in two acronyms.

**WSGI** is the synchronous standard Python has used for years (PEP 3333, if you like citations). A worker takes one request, runs it start to finish, then takes the next. Ten simultaneous requests need ten workers. Flask, classic Django views, Bottle, and Pyramid are WSGI apps.

**ASGI** is the async standard that came later. One ASGI worker runs an event loop that juggles many requests at once, as long as each spends part of its life waiting (on a database, an API, the network). While request A waits, the loop serves B and C. ASGI also handles what WSGI can't: WebSockets, Server-Sent Events, streaming. FastAPI, Starlette, and Django's async stack are ASGI apps.

That single split decides everything. Gunicorn is a WSGI server. Uvicorn is an ASGI server. So the framework you already chose has quietly chosen your app server for you.

<!-- Diagram: a sync WSGI framework (Flask, classic Django) is served by Gunicorn (pre-fork, one request per worker); an async ASGI framework (FastAPI, async Django, WebSockets) is served by Uvicorn (event loop, many requests per worker); the combo gunicorn -k uvicorn_worker.UvicornWorker runs Uvicorn under Gunicorn; both sit behind nginx, which terminates TLS and serves static files before the internet. -->

*The framework picks the server. The combo in the middle lets an ASGI app borrow Gunicorn's process manager. Everything terminates behind a reverse proxy.*

<!-- ADD IMAGE: terminal running flask run, showing the Werkzeug warning about not using the dev server in production -->

## Gunicorn: the WSGI workhorse

Gunicorn (Green Unicorn) is the default answer for sync Python apps, and it earned that spot. Stable, boring in the good way, running Flask and Django in production for over a decade.

Its model is **pre-fork**. A master process (Gunicorn calls it the arbiter) boots, then forks a pool of identical worker processes. The master watches them, restarts any that crash, and handles graceful reloads while the workers do the request handling. The master never touches client sockets directly, which is part of why it's so sturdy.

A real production command is short:

```
# Flask, an app object named "app" in app.py
gunicorn app:app --workers 4 --bind 0.0.0.0:8000

# Django, project "mysite" exposes mysite/wsgi.py
gunicorn mysite.wsgi:application --workers 4 --bind 0.0.0.0:8000
```

Two flags carry the weight. `--workers` sets how many processes to fork. `--bind` tells Gunicorn where to listen: an address and port, or better yet a unix socket the proxy talks to. Gunicorn also has worker *classes*: the default `sync`, threaded `gthread`, greenlet-based `gevent`/`eventlet` for high-concurrency I/O, and the Uvicorn worker class that turns it into an ASGI supervisor. That last one is the bridge to async, and the reason these two aren't really rivals.

## Uvicorn: the ASGI server for async apps

Uvicorn is a lightning-quick ASGI server built on `uvloop` and `httptools`. If your app is async (usually FastAPI, but also Starlette or Django under ASGI), Uvicorn is what actually speaks the protocol. Gunicorn's plain workers can't run an ASGI app at all: they speak WSGI, and FastAPI doesn't.

Locally you'll run the bare command. In production you want workers:

```
# fine for dev, single process unless you add workers
uvicorn main:app --host 0.0.0.0 --port 8000

# Uvicorn running its own worker pool (Uvicorn 0.30+)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Uvicorn also handles WebSockets and streaming out of the box, which is the whole point of going async for real-time dashboards, chat, and live updates. That's ASGI territory, and Uvicorn serves it directly. Now the part people ask about most.

### Uvicorn with Gunicorn: the combo, and why it exists

For years the recommended production pattern for FastAPI was Uvicorn workers supervised by Gunicorn. You get Uvicorn's ASGI speed *and* Gunicorn's grown-up process management (graceful restarts, worker recycling, signal handling) in one command:

```
# async app, Gunicorn's process manager
pip install uvicorn-worker
gunicorn main:app -k uvicorn_worker.UvicornWorker --workers 4 --bind 0.0.0.0:8000
```

One current gotcha, because half the tutorials online are stale: that worker class used to live inside Uvicorn as `uvicorn.workers.UvicornWorker`. It moved into a separate `uvicorn-worker` package, so the import is now `uvicorn_worker.UvicornWorker`. Copy an old command and you'll hit a "module not found" error. Install `uvicorn-worker` and update the path.

And there's a newer wrinkle. Since Uvicorn 0.30 (2024), Uvicorn ships its own multi-worker manager, so `uvicorn main:app --workers 4` is a legitimate production setup on its own. The Gunicorn combo is no longer mandatory for FastAPI, just a fine, well-understood option if your team already knows Gunicorn's knobs. Both are correct. Pick the one your ops muscle memory prefers.

## Gunicorn vs Uvicorn, side by side

The honest comparison isn't "which is better." It's "which protocol does your app speak," with a shared column where they meet.

| | Gunicorn | Uvicorn |
| --- | --- | --- |
| Protocol | WSGI (sync) | ASGI (async) |
| Handles requests | one per worker at a time | many per worker via an event loop |
| WebSockets | No (WSGI can't) | Yes, natively |
| Typical frameworks | Flask, classic Django, Bottle, Pyramid | FastAPI, Starlette, async Django |
| Worker model | pre-fork master + workers | event-loop workers (own manager since 0.30) |
| Process management | mature, its main strength | solid; historically leaned on Gunicorn |
| Use them together? | Yes: `gunicorn -k uvicorn_worker.UvicornWorker` runs Uvicorn (ASGI) under Gunicorn's supervisor | |

So the choice writes itself. Sync framework, reach for Gunicorn. Async framework, reach for Uvicorn (alone, or under Gunicorn). Nobody's asking you to rank them on a leaderboard.

## How many workers should I run?

This is where "it depends" is the honest answer, but it depends on things you can reason about. The common starting point you'll see everywhere:

```
# rule of thumb, for a 2-core box
workers = (2 * cores) + 1     # (2 * 2) + 1 = 5
```

Where does `(2 x cores) + 1` come from? For sync workers doing typical web work, requests spend a chunk of their time waiting on the database or an external call. While one worker waits, another uses the CPU. A little more than one worker per core keeps the cores busy without piling on so many they thrash. The `+1` is slack. It's a starting line, not a law of physics.

Then adjust with your actual workload in mind:

- **I/O-bound** (waiting on databases, APIs, disk): more workers help, since they're idle a lot. Async servers shine here because a single worker keeps busy during the waits.
- **CPU-bound** (image processing, number crunching): extra workers past your core count don't buy speed, they buy context-switching overhead. Stay closer to core count.
- **Memory**: every worker is a full copy of your app in RAM. Four workers loading a chunky ML model or a fat framework can quietly eat your whole box. Watch memory per worker, not just count.

My advice, plainly: start low, measure, then raise it. Two or four workers, real traffic, watch CPU and memory. Guessing high on day one is how people run out of RAM and wonder why the OS started killing processes.

<!-- ADD IMAGE: resource view showing several worker processes and the memory each one holds -->

## Both belong behind a reverse proxy

Whichever server you land on, it shouldn't face the internet directly. Put a reverse proxy in front, almost always nginx. It terminates TLS, serves static files fast without waking a Python worker, buffers slow clients, and forwards real requests to Gunicorn or Uvicorn over a socket.

Why bother? A Python worker exposed on port 443 spends its time fielding slow connections instead of running your code. One slow client dribbling bytes can tie up a worker that should be serving someone else. nginx absorbs that. It's the same pattern you'd use in front of any app server, and it carries straight over from [what a reverse proxy actually does](https://www.kloudbean.com/blog/reverse-proxy-explained/) to [putting nginx in front of a Node app](https://www.kloudbean.com/blog/nginx-reverse-proxy-for-node/). Python is no different.

Two founder-ish opinions, since you're here. Don't expose the app server straight to the world, ever. And don't pick your server by hype. FastAPI being fast doesn't mean you should port a Flask app to it just to use Uvicorn. Pick by the framework you already run. The server is a consequence of that choice, not a fashion statement.

## Where this setup goes wrong

The failure modes are boring and repeatable, which is good news, because you can dodge all of them.

- **A blocking call in an async route.** The classic. An `async def` handler calls a synchronous database driver or does heavy CPU work with no `await`. That parks the whole event loop, and every other request on that worker waits behind it. Async didn't fail; it got handed a sync task. Use an async driver, or make the route a plain `def` so the framework offloads it to a thread pool.
- **Too many workers, not enough RAM.** Someone sets `--workers 16` on a small box "for performance." Each worker is a full app copy. The machine swaps, then the kernel's OOM killer starts reaping workers, and throughput drops instead of rising.
- **Forgetting `--bind`.** Bind to `127.0.0.1` and only the local box can reach it, so a proxy on another host connects to nothing. Bind to a real interface or a unix socket the proxy can see.

```
# only the box itself can reach this
--bind 127.0.0.1:8000

# reachable, or (nicer) a unix socket the proxy reads
--bind 0.0.0.0:8000
--bind unix:/run/myapp.sock
```

And one more: **timeouts on long requests**. Gunicorn's default worker timeout is 30 seconds. A request that runs longer (a big report, a slow upload) gets its worker killed, and the user sees a broken response. Don't just crank the timeout to 300. Long jobs belong in a background worker, not a web process. If you must allow longer requests, raise `--timeout` deliberately and know why.

## What this looks like on a managed server

Everything above is real, and it's a fair amount of plumbing to wire up by hand: install the server, write a systemd unit to keep it alive, configure nginx, get TLS, handle restarts on deploy. A managed platform's job is to take that off your plate so you configure the app, not the machine under it. If the term's fuzzy, here's [what "managed" actually means](https://www.kloudbean.com/blog/what-is-a-managed-server/).

On [Kloudbean](https://www.kloudbean.com/), Python is a first-class managed runtime: Flask, Django, and FastAPI are all supported. You set the runtime and your start command in the dashboard, and the WSGI or ASGI server is configured through that runtime config rather than hand-rolled on the box. The platform supervises the process, keeps it alive across crashes and reboots, sits it behind the web server, and handles free auto-renewing SSL and server-level backups. You still own the interesting decisions: which server, how many workers, your framework, your data.

![The Kloudbean console adding a Python application and choosing its runtime configuration](../assets/console/add-application.png)

*Pick the Python app and its runtime in the dashboard. The WSGI or ASGI server is set through runtime config, so you're choosing behavior, not writing init scripts.*

Deploys follow the same path as any app here: connect a GitHub repo, set the install and start commands, and it builds and ships on every push with build logs streaming live in the console. For a WSGI app the start command is a Gunicorn line; for an async app it's a Uvicorn line (or the Gunicorn combo). Same three fields either way.

![The Kloudbean Git Deployment tab with install and start commands for a Python app](../assets/console/git-deployment.png)

*Git Deployment: Install runs `pip install -r requirements.txt`, Start runs your Gunicorn or Uvicorn command. The platform keeps the workers running.*

Keep your secrets and database URL out of the repo and in [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/). Then it's the flow you already know: the WSGI walkthrough is [deploy a Flask app](https://www.kloudbean.com/blog/deploy-flask-app/) and [deploy a Django app](https://www.kloudbean.com/blog/deploy-django-app/), the ASGI version is [deploy a FastAPI app](https://www.kloudbean.com/blog/deploy-fastapi-app/). Same server, same proxy. Only the start command changes.

<!-- ADD IMAGE: the deployed app responding in a browser, or the build log completing -->

---

**Pick the server your framework asks for. We'll run it.**

Deploy your Flask, Django, or FastAPI app at [kloudbean.com](https://www.kloudbean.com/). Managed Python runtimes · Git deploy with live logs · Auto SSL · Automatic backups · Free migration · Free trial. Sizes on [pricing](https://www.kloudbean.com/pricing/).

## FAQ

### Gunicorn vs Uvicorn: which should I use?

Match the server to your framework's protocol: Gunicorn for synchronous WSGI apps like Flask and classic Django, Uvicorn for asynchronous ASGI apps like FastAPI, async Django, or WebSockets. They aren't really competitors, they serve two different standards.

### What's the difference between WSGI and ASGI?

WSGI is the synchronous standard: one worker handles one request start to finish before the next. ASGI is asynchronous, so a worker runs an event loop handling many requests at once and supports WebSockets, which is why FastAPI and async Django use it while Flask and classic Django are WSGI.

### Can I use Uvicorn with Gunicorn?

Yes, and it was the recommended FastAPI setup for years: run Uvicorn workers under Gunicorn with `gunicorn main:app -k uvicorn_worker.UvicornWorker`. Note the worker class now lives in the separate `uvicorn-worker` package, not inside Uvicorn.

### How many workers should I run?

A common starting point is (2 x CPU cores) + 1, then adjust: I/O-bound apps can use more, CPU-bound apps stay near the core count. Each worker is a full copy of your app in memory, so start low and raise it on real traffic.

### Is Uvicorn faster than Gunicorn?

It's the wrong comparison, since they serve different protocols. Uvicorn is quick for genuinely async workloads; for a sync Flask or Django app, Gunicorn is the right tool, and head-to-head benchmarks don't reflect how you'd run either.

### Do I need Gunicorn for Django?

For classic synchronous Django, Gunicorn is the standard, excellent choice: `gunicorn mysite.wsgi:application`. If you run Django under ASGI for async views or WebSockets, use Uvicorn against `mysite.asgi:application`, optionally under Gunicorn with the Uvicorn worker class.

### Should I run the dev server in production?

No. `flask run`, `python manage.py runserver`, and `uvicorn --reload` are single-process development servers, and the frameworks themselves warn against production use. Run a real app server with multiple workers behind a reverse proxy instead.

### Do I still need Gunicorn for FastAPI now?

Not necessarily. Since Uvicorn 0.30 it ships its own multi-worker manager, so `uvicorn main:app --workers 4` is a valid production setup on its own. The Gunicorn combo is still fine if you want its process management.

### Do Gunicorn and Uvicorn replace nginx?

No. Gunicorn and Uvicorn are app servers that run your Python code; nginx is a reverse proxy that terminates TLS, serves static files, and forwards requests to them. Use both, with nginx in front.

### What worker class should I use with Gunicorn?

For a normal sync app the default `sync` class is fine. Use `gthread` for threaded I/O, `gevent` or `eventlet` for high-concurrency I/O, and `uvicorn_worker.UvicornWorker` when you want Gunicorn to run an ASGI app like FastAPI.

---

Kloudbean · pick the server your framework asks for, then let the platform run it.
