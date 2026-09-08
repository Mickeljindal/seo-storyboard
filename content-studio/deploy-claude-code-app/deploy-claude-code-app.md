---
title: "Deploy a Claude Code App: Read the Diff, Then Ship It"
slug: deploy-claude-code-app
meta_description: "Claude Code edited real files across your whole repo and ran commands. Before you deploy a Claude Code app, review the diff, scrub for inlined secrets, lock the build, and ship it to a server you own."
target_keyword: deploy Claude Code app
secondary_keywords:
  - Claude Code to production
  - host app built with Claude Code
  - deploy Claude Code project
  - Claude Code server
author: Kloudbean
hero_image: images/hero.png
cluster: 1 - Deploy AI / Vibe-Coded Apps
---

![Deploy a Claude Code app, review what the terminal agent built, then ship it to a server you own](images/hero.png)

# Deploy a Claude Code App: Read the Diff, Then Ship It

Claude Code is an agentic coding tool that lives in your terminal. It edits real files across your whole repository, runs commands, installs packages, and commits as it goes. So when you set out to deploy a Claude Code app, you're starting from a good place: the code is standard, and it's already yours in Git, the same as if you'd typed every line.

The catch is quieter than with a browser builder. The agent may have touched thirty files, pulled in a dependency, and made an assumption you never actually read. A green run on your laptop tells you the app works on your machine, in whatever half-committed state the agent left it. It doesn't tell you the build is reproducible, that no API key got pasted into a source file, or that a clean server can rebuild what you have. So the real work isn't the deploy. It's the review that comes first. Do that, and the deploy takes about five minutes.

> **Short version:** Push to GitHub, launch a server, connect the repo in Deploy Code, set your build and start commands, add a managed database and your environment variables, then point your domain with SSL. Before any of that, run three quick reviews: read what the agent changed (`git diff`), scrub for hard-coded secrets and paths, and commit your lockfile so the server builds exactly what you tested.

## Why deploying a Claude Code app is a review job

With a UI-first tool you get a bounded artifact: the screen it generated, roughly the code behind it. An agent in your terminal is different. It ranges across the repo on its own, refactors files you didn't open, and runs whatever commands it decides it needs. That's exactly why people love it. It's also why you now own a lot of surface you didn't hand-write.

Here's the honest version, and it's not a knock on the tool. An agent that can refactor forty files in one turn can also, in one turn, paste your `OPENAI_API_KEY` straight into a config file because that made the thing run right now. It can hard-code `/Users/you/project/uploads` as a path. It can `npm install` a package and forget to save it. None of that shows up when you hit run locally, because locally all of it happens to work. Read the agent's changes before you trust them. That one habit prevents most of what goes wrong later.

![Review the changes](images/gen-1-terminal.png)

The three gates, in order: **1. See** what changed (`git diff --stat`, read it). **2. Scrub** for inlined keys and absolute paths, keep `.env` untracked. **3. Lock** the build with a committed lockfile and a pinned runtime. Then ship.

### 1. See what the agent actually changed

Start by looking at the shape of the work. Claude Code commits as it goes, so your history is right there:

```
# the shape of it: which files, how much
git status
git diff --stat

# the last handful of commits the agent made
git log --oneline -10

# now actually read the changes
git diff
```

You don't need to audit every line like a security firm. You do need to know what moved. If the agent rewrote your auth middleware or swapped a library, that's a thing you're now shipping and answering for. Skimming a forty-file diff is uncomfortable. Shipping one you never looked at is worse.

<!-- ADD IMAGE: your terminal after a Claude Code session, git diff --stat listing the touched files with insertions and deletions -->

### 2. Scrub for hard-coded secrets and paths

This is the check most people skip and later regret. Agents inline things to make the app run in the moment, and a secret committed to Git is a secret leaked the instant you push to a repo, public or not. A quick grep across what you're about to ship catches the common ones:

```
# look for the usual suspects the agent might have baked in
git grep -nE "sk-[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}|password *= *[\"']|/Users/|/home/[a-z]"

# and confirm your .env is NOT tracked (this should print nothing)
git ls-files | grep -E "(^|/)\.env$"
```

Two things to fix if the grep lights up. Any real key goes into an environment variable and out of the code (rotate it too, if it already hit a commit). Any absolute path like `/Users/you/project` gets made relative, because that folder does not exist on a Linux server and the app will crash looking for it. While you're here, make sure `.gitignore` actually lists `.env`. If your secrets file was never ignored, it's probably already in your history, and that's a leak to clean up before you go further. The full mental model for this is in [environment variables, done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

### 3. Make the build reproducible

"Works on my machine" is doing a lot of hidden work in that sentence. When an agent runs commands for you, it can install a package globally, or leave a dependency it used out of your manifest, or build against whatever runtime version happens to be on your laptop. A server has none of that context. It clones your repo and builds from what's committed, nothing else.

So commit the things that make the build deterministic:

- **The lockfile.** For Node that's `package-lock.json` (or `pnpm-lock.yaml` / `yarn.lock`). For Python, a pinned `requirements.txt` or a `uv.lock` / `poetry.lock`. The lockfile is the difference between "it built once" and "it builds."
- **The runtime version.** Pin Node with an `engines` field in `package.json` or a `.nvmrc`. Pin Python with a `runtime.txt` or your `pyproject.toml`. If you built on Node 20 and the server quietly runs 18, some packages just won't install.

```
// package.json: pin what you tested on
{
  "engines": { "node": "20.x" },
  "scripts": { "build": "next build", "start": "next start -p $PORT" }
}
```

A good sanity check, and it costs a minute: delete `node_modules`, run `npm ci` (which installs strictly from the lockfile), then build. If that succeeds, a server will succeed too. If `npm ci` errors with something like `npm ci can only install with an existing package-lock.json`, that's your answer. The lockfile isn't committed yet.

## Know what starts it: Node or Python

Because Claude Code works across a real project, it happily builds Node backends and Python backends (and full-stack combinations of both). The deploy flow is the same either way. Only the install, build, and start commands differ, so figure out yours before you touch the console. Not sure? Ask the agent to read `package.json` or your entrypoint and tell you the exact commands. That's the terminal-native advantage, and we'll lean on it again for debugging.

| Stack | Install | Build | Start (binds the assigned port) |
| --- | --- | --- | --- |
| Node / Express | `npm ci` | none, or `npm run build` | `node server.js` reading `process.env.PORT` |
| Next.js | `npm ci` | `npm run build` | `next start -p $PORT` |
| Python / FastAPI | `pip install -r requirements.txt` | none | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Python / Django | `pip install -r requirements.txt` | `python manage.py collectstatic` | `gunicorn project.wsgi --bind 0.0.0.0:$PORT` |

The single thing every one of these has in common: the app listens on the port the platform hands it, not a number hard-coded in the source. If the agent wrote `app.listen(3000)` or `--port 8000`, change it to read `process.env.PORT` (Node) or `$PORT` (Python). Get that right and you've removed the most common reason a first deploy never comes up. There are framework-specific walkthroughs for [FastAPI](https://www.kloudbean.com/blog/deploy-fastapi-app/), [Django](https://www.kloudbean.com/blog/deploy-django-app/), and [Node](https://www.kloudbean.com/blog/deploy-node-app-to-managed-cloud/) if you want the detail for your stack.

## Deploy it on a server you own

Reviews done? Now the quick part. Push your reviewed code to GitHub (you can ask Claude Code to add the remote and push). That repo is the source of truth your server deploys from.

In the [Kloudbean](https://www.kloudbean.com/) console, click **Add Server**. Pick a **Cloud Provider** (AWS, DigitalOcean, Linode, Vultr, GCP, UpCloud, or Lightsail), choose the stack that matches your app (Node.js, or a Python stack), pick the datacenter nearest your users, and give a build 2–4 GB of headroom. **Launch Now** provisions it in a few minutes, with the runtime, web server, process manager, firewall, and SSL already set up.

![Kloudbean Add Server screen: choosing a cloud provider, application stack, datacenter, and server size](../assets/console-real/shots/launch_server_step_1.png)

Open the app and go to **Application Administration → Deploy Code**. Connect GitHub over OAuth, paste your repository URL, pick the branch, and **Clone Repository**. Then fill the runtime fields with the exact commands from your table above: **App Directory** (the folder with your `package.json` or entrypoint), **Port**, **runtime version**, and your **Install / Build / Start** commands. Click **Pull & Deploy** and the build log streams live.

![Kloudbean Deploy Code / Git Deployment screen: connect a repo, then set App Directory, port, and build and start commands](../assets/console-real/shots/git_connect_step_4.png)

If your app stores data, launch a managed **Postgres** or **MySQL** from **DBS → Launch Database**. It runs on the same box, backed up and secured, and your app reaches it over the local network. If the agent built you a schema and you've a local database, export it and import it here so the deployed app boots with its tables. There's a fuller walkthrough in [adding a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/).

![Kloudbean Launch Database screen for creating a managed Postgres or MySQL instance](../assets/console-real/shots/psql_launch_step_1.png)

Now the values you pulled out of the code in review two. In **Runtime Configuration → Environment Variables**, use the **Paste .env Content** tab, drop in your local `.env`, hit **Convert to Key/Value**, and replace the dev values with real ones, starting with the database connection string.

![Kloudbean environment variables editor with a paste .env content tab and key value list](../assets/console-real/shots/nodespm_env_step_1.png)

```
DATABASE_URL=postgres://kb_user:generated-pass@postgres-123456.kloudbeansite.com:5432/kb_appdb
APP_URL=https://yourapp.com
OPENAI_API_KEY=sk-...
SESSION_SECRET=a-long-random-string
```

Add your custom domain under **Domain Aliases**, point its DNS at the server, and install a free **Let's Encrypt** certificate so it's HTTPS and self-renewing. Turn on **automated deployment** and every push builds and ships on its own, log streaming in the console. Since the agent does your commits, the loop becomes: describe the change, let it implement and push, and production updates itself. That's the same auto-deploy the per-app platforms rent you, on [a server you own](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/). Full-stack app? The front end, the API, and the database all sit on the one box, which is exactly what [one server is best at](https://www.kloudbean.com/blog/host-app-api-and-database-on-one-server/).

<!-- ADD IMAGE: your Claude Code app live on its custom domain with the SSL padlock, next to the console showing a green deployment -->

## If it 503s on the first deploy

A **503** means the process didn't start. The usual suspects, in rough order: a missing environment variable, the app not binding `process.env.PORT`, a start command that doesn't launch the real server, or a build that dropped its tools because `NODE_ENV=production` was set before install and skipped `devDependencies`. Either way the app wrote down why, so read that before you touch code.

Start in the dashboard. **Application Administration → Logs Viewer** gives you the logs grouped into tabs, and for a 503 you want **App Errors**, which is the app's own error log. There's a search box, so you can jump straight to the exception instead of scrolling. **App Info** and **Web Requests Logs** have their own tabs next to it, and if the deploy itself failed rather than the process, that output streams live and stays in **Build and Deployment History**.

Now the part that's nicer with a terminal-native tool. The same files sit on disk at a predictable path:

```
/home/admin/hosted-sites/<app_system_user>/app-logs/app.error.log
```

So SSH in and have Claude Code read `app.error.log` with you, interpret the error, and make the fix. Then commit and push to redeploy. You're debugging with the agent that wrote the code, not alone with a manual open in the other window. The File Manager opens the same two files (`app.error.log` and `app.info.log`) if you'd rather just look. The full playbook is in [fixing a 503 after deploying](https://www.kloudbean.com/blog/fix-503-after-deploying-your-app/).

## What you own, and what you don't

Kloudbean runs Linux stacks: Node, Python, PHP, Ruby, and Java, plus the frameworks on top (React, Next.js, Vue, Django, FastAPI, Laravel). That's essentially everything Claude Code builds for the web. If you had it write a Windows or .NET app expecting IIS, that's a port, not a deploy. "Managed" means the server, the stack, SSL, backups, and patching are handled. Your code and your data stay yours, on a standard Linux box you can move whenever you like. No per-app tax as you grow. For the tool-agnostic version that also covers Cursor, Lovable, Bolt, and v0, there's the [deploy an AI-built app](https://www.kloudbean.com/blog/deploy-ai-built-app-to-production/) pillar.

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

**How do I deploy an app built with Claude Code?**
Review the agent's changes first (read the diff, scrub for hard-coded secrets and paths, commit your lockfile), then push to GitHub and deploy on Kloudbean: launch a server, connect the repo in Deploy Code, set your install/build/start commands, add a managed database and environment variables, and point your domain with SSL. The code is standard, so it deploys like any app.

**Should I review Claude Code's changes before deploying?**
Yes, and it's the step that matters most. Because the agent edits across your whole repo and runs commands on its own, it can inline a secret, hard-code a local path, or install a dependency it never saved to your manifest. Run `git diff`, grep for keys and absolute paths, and confirm a clean `npm ci` build works before you ship.

**My Claude Code app works locally but fails on the server. Why?**
Usually the build isn't reproducible. The agent may have installed something globally or left a dependency out of your lockfile, or you built on a different runtime version than the server uses. Commit your lockfile, pin your Node or Python version, and confirm a fresh `npm ci` (or `pip install -r requirements.txt`) builds cleanly.

**Does Claude Code build Python apps too, and how do I deploy those?**
Yes, it builds Node and Python backends. The deploy flow is identical; only the commands change. For Python, install with `pip install -r requirements.txt` and start with a real server like `gunicorn` or `uvicorn` bound to `$PORT`, rather than the dev server. Set those in the Deploy Code runtime fields.

**Where do my API keys go, and what if the agent inlined one?**
Keys belong in environment variables, never the code. Set them under Runtime Configuration, Environment Variables. If your review found a key pasted into a source file, move it to an env var and rotate it, since anything committed to Git should be treated as exposed.

**Can Claude Code help me deploy and debug, not just build?**
Yes, that's the advantage of a terminal-native tool. Before deploying, ask it for your exact build and start commands and the environment variables the code reads. After deploying, the App Errors tab in the dashboard's Logs Viewer shows the crash, and you can also SSH in and have it read `app.error.log` with you, diagnose the failure, and push a fix.

**Do I need Docker to deploy a Claude Code app?**
No. A single app is a Node or Python process, and a managed server runs it directly and restarts it if it falls over. Docker and Kubernetes solve orchestration problems that appear at much larger scale. For getting your app in front of users, you can skip them.
