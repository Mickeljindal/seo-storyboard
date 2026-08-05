---
title: "Deploying a Go App Is Almost Boring (Here's Why)"
slug: deploy-golang-app
meta_description: "Deploy a Golang app the simple way: compile one static binary with go build, put it on a managed Linux server, and run it under systemd. No runtime to install, no Docker required. Here's the whole path."
target_keyword: deploy golang
secondary_keywords:
  - deploy go app
  - go production server
  - host golang app
  - deploy go binary
author: Kloudbean
hero_image: images/hero.png
cluster: 3 — App Deployment Tutorials
---

![Deploy a Go app — one static binary compiled with go build, running under systemd on a server you own](images/hero.png)

# Deploying a Go App Is Almost Boring (Here's Why)

To deploy a Node or Python app you ship code, plus a runtime, plus a folder of dependencies, and hope the versions line up. To deploy a Golang app you ship a file. One file. That single difference is why deploying Go is the most anticlimactic deploy in this whole series, in the best way.

People search this a few ways, deploy Golang, deploy a Go binary, or set up a go production server, and they all point at the same short path. This is a teardown of *why* it's so simple, because once you see it, you know exactly what to do: compile the binary, put it on a server you own, and keep it running. Let's pull it apart.

> **Short version.** Compile with `go build -o app` and you get one self-contained binary, no runtime to install. Put it on a managed Linux server and run it under **systemd** so it stays up and restarts on reboot. Read the port from `os.Getenv("PORT")`, put a reverse proxy in front for your domain and SSL, and run a managed Postgres or MySQL alongside. This is the server-based path, not a one-click Go runtime, and Go doesn't need one.

## What `go build` actually hands you

When you compile a Go program, the compiler packs everything, your code and every dependency, into a **single self-contained binary**. There's no interpreter to install on the server. No `node_modules` to restore, no virtualenv to recreate. No "which version is the server running?" because the answer is: none, the binary carries what it needs. That one executable *is* your application.

Everything easy about deploying Go flows from that fact. So the whole game is: produce the binary, then keep it running on a server. Two problems, both small.

*(Diagram: two deploy paths compared. Top lane, Go: your Go source (main.go plus deps) goes through `go build` into ONE static binary that is self-contained with no runtime, which runs as a systemd service on your server that stays always-on and restarts itself. It listens on the assigned $PORT, and a reverse proxy in front adds your domain and free SSL. Bottom lane, interpreted Node or Python: your source, then install a runtime, then restore dependencies like node_modules or a venv, then a process manager, then run on the $PORT. Same result, more moving parts. Footer: run the binary on a managed Linux server on any of seven clouds. No one-click Go runtime here; you own the binary and run it under systemd, with a managed Postgres or MySQL alongside on the same box.)*

## How you deploy a Golang app on a server you own

Let me be straight about the shape of this, because it's different from the PHP, Node, Python and Ruby guides in this series. Those runtimes are one-click managed app types. Go isn't one you pick from a menu here, and that's completely fine, because a compiled binary barely needs a runtime to manage. So this is the **server-based path**: you get a managed Linux server, you put your binary on it, and you run it as a service. Honest and simple.

![The Kloudbean Add Server screen: launching a managed Linux server across one of seven clouds to run a Go binary](../assets/console/add-server.png)

The two commands at the center of it:

```bash
# produce the binary, then run it
go build -o app .
PORT=8080 ./app      # your code reads the port from the environment
```

That's the entire "build and run." No dependency install that can fail, no runtime version to match, no cold-start warmup. The binary starts fast and stays small. What's left is doing the "run it" part properly so it survives a logout and a reboot, which is the next section.

<!-- ADD IMAGE: A terminal showing go build finishing, then ls -lh app with the single compiled binary and its size. -->


## The one rule your code must follow: read the port

The single thing your Go code has to do to deploy cleanly is read its port from the environment instead of hard-coding one. The server (or the reverse proxy in front) decides which port your app should listen on, and it tells you through an env var.

```go
port := os.Getenv("PORT")
if port == "" {
    port = "8080"   // sensible local default
}
log.Fatal(http.ListenAndServe(":"+port, nil))
```

Hard-code `:3000` and the thing in front goes looking on the port it assigned, finds nothing, and you get a 502 or 503. This is the most common reason a Go deploy doesn't answer on the first try. Honestly, on a pure-Go app, it's about the only common one. If you do hit a blank 503, the walkthrough is [fixing a 503 after deploying your app](https://www.kloudbean.com/blog/fix-503-after-deploying-your-app/).

## Keeping it alive: systemd, not a terminal

Here's where people actually get a Go deploy wrong, and it's got nothing to do with Go. Someone SSHes into the server, runs `./app`, sees it responding, and closes the laptop. The process was a child of that SSH session, so it dies the moment the session ends. Or the server reboots for a kernel update at 3am and the app never comes back, because nothing was ever told to start it again. Running `nohup ./app &` is a half-step: it survives logout, but it still won't restart after a crash or a reboot.

The fix is a process supervisor, and on a Linux server that's **systemd**. (Not PM2, which is a Node tool. Not a fancy orchestrator. Just the init system that's already on the box.) You write a small unit file that says "run this binary, keep it alive, start it on boot":

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Go app
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/home/appuser/myapp
ExecStart=/home/appuser/myapp/app
EnvironmentFile=/home/appuser/myapp/.env
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now myapp     # start now, and on every boot
sudo systemctl status myapp           # is it running?
```

Now the binary starts on boot, restarts within seconds if it ever exits, and logs go to the journal where `journalctl -u myapp` can read them. That's what "always-on" actually means. On a managed server the box itself, its patching and the firewall are handled for you, so this unit file is about the only server-level thing you write.

<!-- ADD IMAGE: A terminal showing systemctl status myapp with an active (running) service, or a journalctl -u myapp tail with the app logging its start on the assigned port. -->

## Your domain and SSL: a reverse proxy in front

Your binary speaks plain HTTP on some internal port. To serve it on your domain over HTTPS, you put a web server in front as a reverse proxy: it terminates TLS, handles the certificate, and forwards requests to your app's port. On a managed server that reverse proxy and a free Let's Encrypt certificate are part of the setup, so you point your domain at the server, and the proxy talks to your binary. You don't hand-assemble the TLS story. Good, because certificate renewal is exactly the kind of thing you want off your plate.

## The database, if your app is stateful

Go is just the client here, same as any language. If your app stores data, launch a managed database and connect over the local network with a connection string in an env var. Postgres and MySQL are both a click to create and backed up for you.

![The Kloudbean Launch Database screen: creating a managed Postgres for a Go app on the same server](../assets/console/launch-database.png)

Feed the connection string in as an environment variable, exactly like `PORT`. Keep it out of the binary and out of git. The reasoning is in [environment variables, done right](https://www.kloudbean.com/blog/environment-variables-done-right/), and the details of the managed engines are in [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) and [managed MySQL hosting](https://www.kloudbean.com/blog/managed-mysql-hosting/). Running the binary and its database on one server is the pattern in [host your app, API, and database on one server](https://www.kloudbean.com/blog/host-app-api-and-database-on-one-server/).

```bash
# the app's environment (loaded by systemd via EnvironmentFile)
PORT=8080
DATABASE_URL=postgres://myapp:pass@127.0.0.1:5432/myapp
```

## The one gotcha: build a Linux binary

Because Go compiles for a specific operating system, there's one thing to get right. The binary that runs in production has to be a **Linux** binary, because that's what the server is. Two clean ways to handle it:

- **Build on the server.** Pull your code, run `go build` right there, and the binary is automatically for the server's OS. Simplest.
- **Cross-compile, then copy it over.** Build a Linux binary from your Mac or Windows machine and ship the file.

```bash
# cross-compile a Linux binary from any machine, then copy it up
GOOS=linux GOARCH=amd64 go build -o app .
scp app appuser@your-server:/home/appuser/myapp/
```

One footnote: if your app uses **CGO** (say, a SQLite driver that links C), the build needs the C toolchain and a matching target, so building on the server is the easy path. Most pure-Go apps never touch this.

## Do you need Docker for this?

For a single Go binary, no, and I'll plant a flag on that. A compiled binary is about the easiest thing in the world to run on a server you own. Docker earns its keep when you're juggling many services or a gnarly build environment. But a static Go binary already has zero runtime dependencies, so a container is a wrapper around a thing that didn't need wrapping. Use Docker if your team standardizes on it. Skip it happily if not. Deploying Go without a container just uses what the compiler already did for you: it packed the whole app into one file.

## Why this makes Go cheap to run

There's a payoff on the bill. Because a Go binary is small and starts fast, it runs comfortably on a modest server, and several small Go services can share one box without much fuss. A service that would want a heavier footprint in an interpreted runtime often runs happily on a small instance as Go. When people call Go "efficient," this is the part you feel when you size the server. Pair that with server-level backups (see [the server backups guide](https://www.kloudbean.com/blog/server-backups-guide/)) and a small box goes a long way.

## Rollback is just the previous binary

One more perk of the single-file model. A deploy is "build this commit into a file and run it," so rolling back is "run the previous file." No dependency graph to unwind, no half-migrated runtime. If a release misbehaves, you swap the binary back and restart the service, and you're where you were. Keep the last known-good binary around and rollback is a ten-second `systemctl restart`.

## The honest bit

None of this is magic. It's what a compiled language gives you. Kloudbean runs the Linux server, its patching, the firewall, the reverse proxy and SSL, and server-level backups; you own the binary, its config, and its data. Go is a first-class Linux citizen, so there's nothing to fight. To say it once more plainly: this is the server-based path, running your compiled binary on a managed server under systemd, not a push-button "Go" runtime, and a self-contained binary is exactly the thing that doesn't need one. Coming from a runtime-managed stack instead? The contrast is [deploy a Node app to managed cloud](https://www.kloudbean.com/blog/deploy-node-app-to-managed-cloud/). For the Go app itself, the deploy really is close to boring. Boring is the goal.

**One binary. One server. Live.** Run your Go binary on a server you own at [kloudbean.com](https://www.kloudbean.com/). Managed Postgres & MySQL · Automatic backups · Free Let's Encrypt SSL · Private networking · Free migration · Free trial. A small box goes a long way with Go. Sizes on [pricing](https://www.kloudbean.com/pricing/).

## FAQ

**How do I deploy a Go app to production?**
Compile it with `go build -o app`, put the binary on a Linux server, and run it under a process supervisor like systemd so it stays up and restarts on boot. Read the port from the environment, put a reverse proxy in front for your domain and SSL, and connect a managed database if your app is stateful. There's no runtime to install because the binary is self-contained.

**Does Kloudbean have a one-click Go runtime?**
No, and Go doesn't really need one. The managed one-click app types are for PHP, Node, Python, Ruby and Java. For Go you take the server-based path: launch a managed Linux server and run your compiled binary on it under systemd. Because the binary carries its own dependencies, that's genuinely all it takes.

**Why won't my Go app come up after deploying?**
Almost always because it isn't listening on the assigned port. Read the port from `os.Getenv("PORT")` instead of hard-coding one, and the reverse proxy in front can reach it. That single fix resolves the large majority of Go deploy issues.

**How do I keep a Go binary running after I log out?**
Run it as a systemd service, not from an SSH session. A unit file with `Restart=always` and `WantedBy=multi-user.target` starts your binary on boot and restarts it if it exits. Running it directly in a terminal, or with nohup, won't survive a crash or a reboot.

**Do I need to install Go on the server?**
Only if you build there. If the server compiles your code, Go is present for the build and the resulting binary runs on its own. If you cross-compile a Linux binary elsewhere and copy it up, the server just runs it. Either way there's no Go runtime to keep installed, because there isn't one.

**Do I need Docker to deploy a Go app?**
No. A single static Go binary already has no runtime dependencies, so a container mostly wraps something that didn't need wrapping. Docker and Kubernetes solve orchestration at scale. For one binary on a server you own, systemd is enough.

**How much server does a Go app need?**
Usually not much. Go binaries are small and start fast, so a modest server handles a lot, and several Go services can share one box. Size up only when your traffic or workload actually asks for it.

**What about the "build for Linux" issue?**
Your binary must target Linux, which is the server's OS. Building on the server handles that automatically; if you build locally, set `GOOS=linux`. If your app uses CGO, like some SQLite drivers, build on the server so the C toolchain matches.

_Kloudbean · One binary, none of the drama._
