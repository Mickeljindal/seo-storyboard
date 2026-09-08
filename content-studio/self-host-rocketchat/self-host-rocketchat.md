---
title: "How to Self-Host Rocket.Chat, the Open-Source Slack Alternative"
slug: self-host-rocketchat
meta_description: "Self-host Rocket.Chat in production: why it beats per-seat SaaS chat, the MongoDB replica set requirement people miss, the MONGO_URL and ROOT_URL that matter, and deploying the Rocket.Chat Node app on a managed server with managed MongoDB."
target_keyword: self-host Rocket.Chat
secondary_keywords:
  - self-hosted Rocket.Chat
  - Rocket.Chat hosting
  - Rocket.Chat MongoDB
  - Rocket.Chat replica set
  - Rocket.Chat MONGO_URL
  - Rocket.Chat ROOT_URL
  - self-hosted Slack alternative
  - open source team chat
  - deploy Rocket.Chat
author: Kloudbean Engineering
hero_image: images/hero.png
cluster: "2 (Self-Hosted Tools)"
---

![Self-host Rocket.Chat: the open-source team chat app running on a managed Node server backed by managed MongoDB](images/hero.png)

# How to Self-Host Rocket.Chat, the Open-Source Slack Alternative

Rocket.Chat is an open-source team chat platform, a self-hosted alternative to Slack and Microsoft Teams that runs on infrastructure you control. When you self-host Rocket.Chat, your team's messages, files, and history live on a server you own instead of a vendor's cloud, and you stop paying a per-seat fee that climbs every time you hire someone. There's a catch almost nobody flags up front. Rocket.Chat is a Node app that leans hard on MongoDB, and it wants that MongoDB running as a replica set. Get that one detail right and the rest is ordinary Node deployment.

I'll be straight with you: the messaging app is the easy part. The database underneath is what trips people, so this guide spends real time there. A flaky self-hosted Rocket.Chat that keeps dropping its realtime connection is almost always a MongoDB story.

> **Short version:** Run the Rocket.Chat Node app on a managed Node server, and back it with managed MongoDB configured as a replica set (Rocket.Chat reads changes through the oplog and change streams, which a standalone MongoDB can't provide). Set `MONGO_URL` and `ROOT_URL` through environment variables, put SSL and a reverse proxy that forwards websocket upgrades in front, and give the box real RAM. It's a Meteor app, so 2 GB is a floor, not a target.

## The Slack problem this actually solves

Slack is excellent software. That's not the argument. The argument is the invoice and where your conversations live.

Three things push teams to look elsewhere. First, pricing is per user, per month, so your bill grows with headcount whether or not those people say much. Second, message history gets capped on lower tiers, so older threads age out of reach. Third, every message and file sits in a vendor's cloud under their account and their retention rules, not yours.

Rocket.Chat answers all three by being open source and self-hostable. You run it, so history is as long as your disk allows, the cost is your server rather than a seat count, and the data sits wherever you put the machine. That's the whole pitch for self-hosted Rocket.Chat.

## Why self-host Rocket.Chat

The reasons line up cleanly.

- **You own the chat history and the files.** Every message, upload, and channel lives in your MongoDB, on your server. Nobody gates it behind a plan or deletes it on a schedule you didn't set.
- **No per-seat tax on growth.** A self-hosted server costs the same whether 12 people use it or 120. You're paying for a machine, not for chairs, and for a growing team that math flips in your favour fast.
- **Data residency and compliance.** If a rule says your team's communications must stay in a specific country, you put the server there and can point to it. That's an easier conversation with an auditor than a SaaS region setting.
- **Custom integrations and bots.** Rocket.Chat has incoming and outgoing webhooks, a REST API, slash commands, and an app framework. Wire it into your own systems without waiting on a vendor to build the connector.
- **It runs on your infra.** Same server, same network, same backups as the rest of your stack. One less external account to secure and audit.

The honest tradeoff: you're now the one who keeps it running. Updates, backups, and the 2am restart are yours. A managed platform shrinks that job but doesn't delete it. If you never want to touch a server, hosted Slack is the calmer life, and that's fine.

## The requirement almost everyone misses: MongoDB has to be a replica set

This is the section I most want you to read. Rocket.Chat stores everything in MongoDB, which people expect. What surprises them: a plain, standalone MongoDB isn't enough.

Rocket.Chat is a realtime app. Send a message and everyone in the channel should see it instantly, no refresh. To do that, Rocket.Chat watches MongoDB for changes as they happen, using change streams (and, on older setups, oplog tailing). Both are built on the **oplog**, the operations log MongoDB only maintains when it runs as a **replica set**. No replica set, no oplog. No oplog, no reliable realtime.

So skip the throwaway standalone MongoDB. Rocket.Chat wants a replica set and it will tell you so, usually by working fine in a demo and then misbehaving under real use: messages that arrive late or only after a refresh, presence that lies, a log full of retries. People burn a whole day chasing a "Rocket.Chat bug" that was a MongoDB config all along.

Here's the honest framing. A replica set is a MongoDB concept, not a Kloudbean button. Managed MongoDB gives you the database with backups and controlled access, locked to your app server's IP, handled for you. Turning it into a replica set (even a single-node one, which is fine for smaller teams) is a MongoDB step you arrange at the database layer, by initializing the set and giving Rocket.Chat a `MONGO_URL` that names it. Plan for it from the start rather than bolting it on later. Our [managed MongoDB hosting](https://www.kloudbean.com/blog/managed-mongodb-hosting/) guide and the [MongoDB connection](https://www.kloudbean.com/blog/connect-mongoose-to-mongodb/) walkthrough cover the connection-string mechanics in more depth.

Two more traps sit right next to the replica set, and they cause most of the remaining tickets:

- **Under-provisioned RAM.** Rocket.Chat is built on Meteor, and the Node process is memory-hungry. Squeeze it onto a tiny instance and you'll watch it get OOM-killed or thrash under a modest load. Give it headroom.
- **A wrong `ROOT_URL`.** Rocket.Chat builds absolute links and its websocket address from `ROOT_URL`. Set it to `http://localhost:3000` and forget, and the app loads while login redirects, avatars, and the realtime connection quietly break. It has to match the real public address, scheme included.

<!-- SVG diagram in the HTML: web and mobile clients connect over HTTPS and websockets to the Rocket.Chat Node app on a managed server, which talks to managed MongoDB in the same account (app-server IP whitelisted) running as a replica set (oplog + change streams). -->

*Clients reach the Rocket.Chat Node app over HTTPS and websockets through your SSL-terminating proxy. The app talks to managed MongoDB in the same account, with only its app-server IP whitelisted. The replica set is what produces the oplog and change streams Rocket.Chat needs for instant messaging.*

![First boot to admin creation](images/gen-2-flow.png)

## Self-hosted Rocket.Chat vs Slack, honestly

Both are good at different things. Here's the fair version.

| | Self-hosted Rocket.Chat | Slack / hosted chat SaaS |
| --- | --- | --- |
| **Data ownership** | Your server, your MongoDB, your region | Vendor's cloud and account |
| **Cost model** | Flat server price, any team size | Per user, per month, grows with headcount |
| **Message history** | As long as your disk allows | Often capped on lower tiers |
| **Integrations** | Webhooks, REST API, your own bots | Rich app directory, less low-level control |
| **Who runs it** | You (lighter on a managed platform) | The vendor, fully |
| **Ease of start** | Some setup, MongoDB replica set to plan | Zero-ops, polished, running in minutes |

Credit where it's due: Slack's onboarding is frictionless and there's nothing to operate. If that's what you value most, stay. If ownership, flat cost, and full history matter more, keep reading.

## Deploying Rocket.Chat: the actual steps

You're running two things that talk to each other: managed MongoDB (as a replica set) and the Rocket.Chat Node app. Do them in this order.

1. **Provision managed MongoDB first.** Launch a MongoDB database, note its internal address, and create a dedicated Rocket.Chat user with a strong password. This is also where you arrange the replica set, since Rocket.Chat's connection string names it.
2. **Create the Node application for Rocket.Chat.** Add an application on the managed Node runtime. This runs the Rocket.Chat server bundle. It isn't a one-click Rocket.Chat installer; you're running the Rocket.Chat Node app on a managed runtime, which is the honest and flexible way to do it.
3. **Set the environment variables.** `MONGO_URL`, `ROOT_URL`, and `PORT` go in the Environment Variables screen, never in code.
4. **Point your domain and turn on SSL.** Map `chat.example.com` to the app, issue a free certificate, and make sure the proxy forwards websocket upgrades.
5. **Start it and create the admin.** On first boot Rocket.Chat runs a setup wizard where you create the admin account and name the workspace.

![The Kloudbean console Launch Database screen used to provision managed MongoDB for Rocket.Chat](../assets/console-real/shots/psql_launch_step_1.png)

*Step 1: launch managed MongoDB. Backups come with it, and you whitelist your app server's IP so only it can connect; the replica set is the MongoDB-level piece you arrange so Rocket.Chat gets its oplog.*

![The Kloudbean console Add Application screen where the Rocket.Chat Node app is created on the managed Node runtime](../assets/console-real/shots/adding_app_from_apps_step_1.png)

*Step 2: add the application on the managed Node runtime. This is the process that serves Rocket.Chat.*

If you deploy from a Git repository, managed CI/CD can build and start the app on every push. The [deploy a Node app](https://www.kloudbean.com/blog/deploy-node-app-to-managed-cloud/) guide covers that flow end to end.

![Ensure the replica set is live before connecting Rocket.Chat](images/gen-1-terminal.png)

## The config that matters: MONGO_URL, ROOT_URL, PORT

These few lines decide whether your Rocket.Chat is stable or flaky. Set them in the Environment Variables screen and restart so the app picks them up.

![The Kloudbean console Environment Variables screen holding Rocket.Chat's MONGO_URL and ROOT_URL out of the code repository](../assets/console-real/shots/nodespm_env_step_1.png)

*Step 3: Rocket.Chat's connection string and public URL live here, in Runtime Configuration then Environment Variables, out of your repo.*

```bash
# Rocket.Chat's core environment variables

# The database. Note ?replicaSet=rs0, the part people forget.
MONGO_URL=mongodb://rc_user:STRONG_PASS@10.0.0.5:27017/rocketchat?replicaSet=rs0

# Only needed if you tail the oplog directly (older setups).
# It points at the 'local' database where the oplog lives.
MONGO_OPLOG_URL=mongodb://rc_user:STRONG_PASS@10.0.0.5:27017/local?replicaSet=rs0&authSource=admin

# The public address users hit. Must match your real domain and scheme.
ROOT_URL=https://chat.example.com

# The port the Node process listens on behind your proxy.
PORT=3000
```

A couple of notes so this doesn't bite you. The `10.0.0.5` stands in for your MongoDB's internal address, so database traffic never leaves your account. `MONGO_OPLOG_URL` is optional on modern Rocket.Chat, which prefers change streams; if you set it, point it at the `local` database and keep the `replicaSet` name consistent. And `ROOT_URL` is `https://`, not `http://`, because SSL terminates at the proxy in front.

Rocket.Chat starts as a normal Node process (the entry point is `main.js` in the built server bundle), and the managed runtime keeps it alive and restarts it if it exits. For keeping secrets like `MONGO_URL` out of your codebase, see [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

## SSL and the websocket detail that breaks realtime

Rocket.Chat's instant messaging rides on websockets. If the reverse proxy in front doesn't forward the connection-upgrade headers, the app loads fine and then feels broken: messages lag, the client reconnects, presence flickers. The fix is making the proxy upgrade the connection. In nginx terms:

```nginx
# The proxy in front of Rocket.Chat must forward the websocket upgrade
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
```

![The Kloudbean console SSL certificate screen issuing a free certificate for the Rocket.Chat chat domain](../assets/console-real/shots/le_ssl_step_1.png)

*Step 4: issue a free SSL certificate for `chat.example.com`. With SSL on and websockets upgraded, `ROOT_URL` should use `https://`.*

<!-- ADD IMAGE: Browser devtools network tab showing the Rocket.Chat websocket upgraded to wss and staying open. -->

## Locking it down

A team chat server holds your most candid internal conversations, so treat security as part of the deploy, not a later chore.

- **Lock MongoDB to your app server's IP.** The database should never be reachable from the public internet, so whitelist your app server's IP and refuse everything else. App-to-database traffic stays inside your account, and the baseline Shorewall firewall plus Fail2ban keep the front door sensible.
- **Feed `MONGO_URL` through env, never code.** The connection string holds your database password. It belongs in Environment Variables, not a repo where it leaks in a commit.
- **Use a least-privilege database user.** Give Rocket.Chat a user scoped to its own `rocketchat` database, not an admin account that can touch everything.
- **Serve everything over HTTPS, websockets included.** With SSL terminating at the proxy and `ROOT_URL` set to `https://`, both page loads and the realtime connection are encrypted.
- **Set a strong admin and lock down registration.** After the wizard, disable open sign-ups or restrict them to your email domain so strangers can't create accounts.
- **Back up the chat database.** Your entire history is in MongoDB. Server-level backups protect the box; database backups protect the conversations. Set both on day one. The [server backups guide](https://www.kloudbean.com/blog/server-backups-guide/) covers sane defaults.

## Giving it room to run

Rocket.Chat wants real RAM. It's a memory-hungry Meteor app. Plan for at least 2 GB for a small team, and 4 GB or more once history and daily traffic build up. MongoDB wants its own memory too, so run it as its own managed database, not crammed onto the same box.

When usage grows, the levers are simple. Resize the server up; vertical headroom is the fastest win for a memory-hungry app like this. Keep the proxy configured for websockets so realtime scales with your users, and lean on the replica set for reliability under load. Rocket.Chat is also picky about MongoDB versions, so check the release notes for your version and match a supported MongoDB rather than grabbing the newest on instinct.

Running other tools yourself too? The [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/) roundup is a good map, and the sibling [self-host Supabase](https://www.kloudbean.com/blog/self-host-supabase/) guide walks a similar own-your-data path for a backend. And if internal team chat with air-gapped or compliance needs is the priority, [self-hosting Mattermost](https://www.kloudbean.com/blog/self-host-mattermost/) is the focused alternative to weigh.

<!-- cta:start -->
**Take it off localhost for good.**

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

**Is Rocket.Chat a good Slack alternative?**
For teams that want to own their data and avoid per-seat pricing, yes. Rocket.Chat covers the core Slack workflow: channels, direct messages, threads, file sharing, search, and integrations. What you trade for ownership is that you run it yourself, though a managed platform makes that far lighter. Slack still wins on zero-ops polish if that's your priority.

**Does Rocket.Chat need MongoDB?**
Yes. MongoDB is Rocket.Chat's only supported database, and it stores everything: users, channels, messages, and file metadata. You can't swap it for Postgres or MySQL. The real decision is where MongoDB runs, and a managed MongoDB with backups and IP allow-listing is the sensible answer for production.

**Why does Rocket.Chat need a MongoDB replica set?**
Rocket.Chat delivers messages in realtime by watching MongoDB for changes through change streams and the oplog. Both only exist when MongoDB runs as a replica set. On a standalone MongoDB there's no oplog, so realtime becomes unreliable and messages arrive late or only after a refresh. Even a single-node replica set satisfies the requirement.

**Is self-hosted Rocket.Chat free?**
The software is. Rocket.Chat's Community Edition is open source and free to run, with no per-user license. You pay for the server and database it runs on, a flat infrastructure cost rather than a per-seat fee. Paid Enterprise features exist, but they aren't required to run a full team chat.

**How much RAM does Rocket.Chat need?**
Plan for at least 2 GB for a small team, and 4 GB or more as history and traffic grow, because it's a memory-hungry Meteor app. MongoDB wants its own memory on top of that, so keep the database on its own managed instance. If Rocket.Chat feels sluggish or restarts under load, RAM is the first thing to check.

**How do I deploy Rocket.Chat?**
Provision managed MongoDB as a replica set, run the Rocket.Chat Node app on a managed Node server, set MONGO_URL and ROOT_URL through environment variables, and put SSL plus a websocket-aware reverse proxy in front. Then start it and finish the admin setup wizard. It isn't a one-click installer, but the steps are straightforward once the database is right.

**What is MONGO_URL in Rocket.Chat?**
MONGO_URL is the environment variable that tells Rocket.Chat how to reach its database. It's a standard MongoDB connection string, and it must include the replicaSet name, for example mongodb://user:pass@10.0.0.5:27017/rocketchat?replicaSet=rs0. Point it at your database's internal address so traffic never crosses the public internet.

**Why is my Rocket.Chat ROOT_URL breaking links or websockets?**
ROOT_URL must exactly match the public address users hit, scheme included. Rocket.Chat builds its links and websocket connection from it, so a value like http://localhost:3000 on a real deployment causes broken redirects and a failing realtime connection. Set it to your real https domain, for example https://chat.example.com, and restart.

**Can I migrate from Slack to Rocket.Chat?**
Yes. Rocket.Chat has an importer that ingests a standard Slack export, bringing across channels and message history. Export from Slack, import into your self-hosted Rocket.Chat, then invite your team. Free migration assistance can help with the server and database side if you'd rather not do the plumbing yourself.

---

*By Kloudbean Engineering · Own your team chat.*
