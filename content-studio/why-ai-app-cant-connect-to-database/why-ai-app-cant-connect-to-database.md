---
title: "Why Your Deployed AI App Can't Connect to Its Database"
slug: why-ai-app-cant-connect-to-database
meta_description: "Your app can't connect to database after deploy? The error string names the cause. ECONNREFUSED, connection timeout, ENOTFOUND, password authentication failed, too many connections, and the one nearly everyone misses: your app server's IP is not whitelisted."
target_keyword: app can't connect to database
secondary_keywords:
  - deployed app cannot connect to database
  - ECONNREFUSED database
  - connection refused postgres
  - database connection timeout
  - ENOTFOUND database host
  - password authentication failed
  - too many connections
  - whitelist IP database
  - can't connect to database after deploy
author: Kloudbean
hero_image: images/hero.png
cluster: 1 - Deploy AI / Vibe-Coded Apps
---

![Why a deployed app can't connect to its database: the connection path from app server through the database IP allow-list, where a whitelisted laptop gets through and an unlisted server IP is refused](images/hero.png)

# Why Your Deployed AI App Can't Connect to Its Database

Your app worked perfectly on your laptop. You deployed it, opened the live URL, and it fell over with a database error. Maybe connection refused. Maybe a timeout that just hangs. Maybe password authentication failed. Nothing in your code changed between local and production, so why can't your app connect to the database now that it's live?

Because the error usually isn't in your code. When a deployed app can't connect to its database, the cause is almost always the network path, the credentials, or a missing config value, and the exact error string tells you which one. So this is a field guide, not a lecture. Read the error, work out which layer broke, run one decisive check. You'll fix most of these in a couple of minutes without editing a single line.

> **The short version:** when a deployed app can't connect to its database, read the exact error before you touch code. ECONNREFUSED or a timeout usually means the app server's IP isn't on the database allow-list. ENOTFOUND is DNS (wrong host). Password authentication failed is credentials. Too many connections means you need a pool. Nine times out of ten it's the allow-list or a missing env var, not your code.

## First, read the error: a deployed app can't connect to its database for only a handful of reasons

The instinct is to reopen your code and start rereading it. Resist that. A connection is a short conversation between two machines, and a connection error tells you exactly where that conversation broke: the network never reached the database, the hostname didn't resolve, the login was rejected, or the database ran out of room for new connections. Each one has a different fix, and guessing burns the most time.

So classify before you change anything. Here's the order that finds the problem fastest:

1. Read the exact error string, word for word.
2. Confirm the host and the port you're connecting to.
3. Confirm the connecting IP is whitelisted on the database.
4. Confirm the credentials are the database's own user, not your hosting login.
5. Confirm the connection details are actually set in the production environment.
6. Only then look at pooling and connection limits.

My honest opinion, after seeing a lot of these: nine times out of ten it's the IP allow-list or a missing environment variable, not your code. Check those two before you touch a line.

<!-- ADD IMAGE: teaching diagram of the connection path. Laptop with a whitelisted IP and a deployed app server with an unlisted IP both point at the database IP allow-list gate. The laptop passes and reaches the managed database, the server is refused at the gate. Shows why it works locally but not in production. -->

## The error-to-cause map

Find your error in the left column. The right column is the one check worth running first. The sections after this go deeper on each.

| Error string | What it usually means | The one decisive check |
| --- | --- | --- |
| ECONNREFUSED / connection refused | The database actively said no on that address and port | Confirm the host and port, then whether anything is listening there |
| Connection timeout (hangs, then fails) | Packets are being silently dropped | Check the IP allow-list and firewall; your server's IP is probably not on it |
| ENOTFOUND / getaddrinfo | The hostname didn't resolve (DNS) | Copy the exact host from the database panel; check for typos |
| password authentication failed | You reached the database, the login was rejected | Use the database master user and password from the panel, not your account login |
| too many connections | You've used every connection slot | Put a connection pool in front of the database |
| SSL required / self-signed certificate | The client and server disagree about TLS | Match sslmode to what the server expects |
| Works locally, fails in production | The env var is missing or wrong in prod | Print the connection target at boot in production and compare it to the panel |

> **The signature to memorize:** works on your laptop, refused or times out from the deployed server. That pattern points straight at the IP allow-list, not at your code.

## The cause almost everyone misses: your server's IP is not on the allow-list

Here's the one that eats the most hours, because it looks like a code bug and isn't. A good managed database keeps public access turned off by default. That's correct, and you want it that way. An open database is one that strangers scan and try to log into within minutes of it appearing online. So the database only accepts connections from IP addresses you've explicitly added to its allow-list.

While you were building locally, you (or the setup wizard) whitelisted your laptop's IP so you could connect. Everything worked. Then you deployed, and the app now runs on a server with a completely different IP address, one that was never added to the list. The database quietly refuses it. That is the exact reason it works on your machine but the deployed app cannot connect to the database. Same code, different source IP.

The fix is quick: add the app server's public IP to the database allow-list. On Kloudbean, a managed database ships with public access off, and you open it by whitelisting the connecting IP, your dev machine while you build, then the app server's IP once you deploy. Only whitelisted addresses get through, and everything else is refused. Grab the master user and the host from the database panel while you're in there.

One warning, because the temptation is real. When you're tired and the error won't budge, opening the database to the whole internet (allowing `0.0.0.0/0`) makes it vanish instantly. Don't. You've just put your database on the open internet where automated scanners will find it, and you've traded a quick allow-list entry for an exposed database and a much worse night later. Whitelist the one IP that needs in. That's the whole job.

<!-- ADD IMAGE: the database access control / IP allow-list screen with the app server's IP added to the list. -->

## ECONNREFUSED, connection refused, or a timeout: is anything even listening?

These two feel similar and mean different things, so split them first.

ECONNREFUSED (connection refused) means something at that address answered and said no. Usually the host or port is wrong, or the database process isn't running there. Postgres listens on 5432 by default, MySQL on 3306. Point at the wrong port and you get refused fast. This error is honest: the packet reached a machine, and the machine turned it away. A connection refused postgres error on port 5432 is almost always a wrong host or a database that isn't up.

A database connection timeout is different. It hangs for a while, then gives up. That silence almost always means a firewall or the database allow-list is dropping your packets without replying. This is the fingerprint of the IP problem above: a laptop that was whitelisted connects, a deployed server that wasn't just times out. A timeout is not slowness, it's a closed door with nobody answering the knock.

The decisive check: from the app server itself, test whether you can even reach the port.

```
# from the app server, can you even reach the database port?
nc -zv your-db-host 5432      # refused = wrong host/port; hangs = allow-list or firewall
```

If it refuses immediately, fix the host or port. If it hangs, it's the allow-list or firewall, so go add the server's IP. And if your app connects fine at first and only fails once traffic climbs, that's a different animal (connection exhaustion under load), which [why AI apps fail in production](https://www.kloudbean.com/blog/why-ai-apps-fail-in-production/) covers.

<!-- ADD IMAGE: a terminal showing the reachability check, one result that refuses immediately and one that hangs, side by side. -->

## ENOTFOUND or getaddrinfo: the name doesn't resolve

ENOTFOUND, or `getaddrinfo ENOTFOUND` in Node, is a DNS failure. Your app tried to turn the hostname into an IP address and got nothing back. The network is probably fine. The name is wrong.

Nearly always it's a typo or the wrong host string: a copied value with a trailing space, an internal hostname used from outside the network, or a placeholder that never got replaced. The decisive check is boring and it works: copy the exact host straight from the database panel, paste it into your config, and confirm it resolves (`ping` or `nslookup` the hostname). If the panel gives you an ENOTFOUND database host that's only reachable internally, use the external host it lists, or the IP address as a fallback.

## password authentication failed: right door, wrong key

Good news hides in this one. If you're getting password authentication failed, your network is fine. You reached the database. It looked at your credentials and said no. That narrows things a lot.

The most common mistake is using the wrong identity entirely: people try their hosting-account or dashboard login instead of the database's own user. Those are different accounts. A managed database has its own master username and password, and that's what your app connects with. On Kloudbean you'll find the master user and password right in the database panel. Copy them from there.

A few more things throw the same error: the database name is wrong, the user exists but has no rights on that database, or the password has special characters that aren't URL-encoded inside a `DATABASE_URL` string. An `@` or a `#` in a raw password will break the URL and look like a bad password. Encode it, or set the fields separately, then check the panel value against what your app is actually sending.

<!-- ADD IMAGE: the database panel showing the master user, host, and port fields you copy connection details from. -->

## too many connections: you ran out of slots

This one shows up later, after everything worked for a while. Under a bit of traffic the app starts throwing too many connections, or Postgres says remaining connection slots are reserved. Every database caps how many connections it will hold at once, and you've hit the ceiling.

The usual cause is opening a fresh connection per request and never closing it, or running several app instances that each grab a fistful of connections. It multiplies fast. The fix isn't a bigger database, it's a connection pool: a small, reused set of connections your app borrows and returns. [Database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/) explains why the limit bites sooner than people expect and how to size a pool properly. Add the pool before you pay for more database.

## SSL required or self-signed certificate: the TLS handshake disagrees

Two shapes here. Either the server requires an encrypted connection and your client didn't ask for one (you'll see something like SSL required, or no encryption), or the client demands a fully verified certificate and the server presents one it won't accept (self-signed certificate in certificate chain).

The fix is to match your client's `sslmode` to what the server expects. Plenty of managed databases want `sslmode=require`, which encrypts the link without forcing full chain verification. If you need strict verification, use `verify-full` and point the client at the CA the provider gives you. Don't reflexively disable SSL to make the error stop, because then you're sending database traffic in the clear.

## Works locally, breaks in production: it's the environment variable

You've ruled out the network and the login, and it still only fails when deployed. Now it's almost certainly config. Your `DATABASE_URL` (or the separate host, user, password, and name fields) lives in a `.env` file locally, and that file does not get deployed. If you never set the same values in the production environment, your app boots with an empty or default connection string and can't connect to the database after deploy.

The decisive check: at startup in production, log the connection target you're about to use (the host and database name, never the password) and compare it to the database panel.

```
# production needs the same values your local .env had
DATABASE_URL=postgres://appuser:password@your-db-host:5432/appdb?sslmode=require

# log the target at boot (never the password) and compare it to the panel
console.log('DB target ->', new URL(process.env.DATABASE_URL).host)
```

If it prints `localhost` or `undefined`, there's your answer. Set the variables in your host's environment settings, not in a committed file. [Environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/) covers the safe way to do it, and [why my AI app works locally but not in production](https://www.kloudbean.com/blog/why-my-ai-app-works-locally-but-not-in-production/) walks the wider set of local-versus-prod gaps. This database version is the most common one by far.

If you built the app with an AI tool and this is your first real deploy, the missing-env-var trap is practically a rite of passage. The [last mile of vibe coding](https://www.kloudbean.com/blog/last-mile-of-vibe-coding/) is all about the gap between a working preview and a running production app, and this sits right in the middle of it.

<!-- ADD IMAGE: the deployed app's environment variables screen with DATABASE_URL set for production. -->

## Where Kloudbean fits

Most of this pain comes from the pieces living in different places, each with its own rules. Kloudbean keeps the app and its database in one dashboard, which makes the connection details easy to find and the allow-list easy to set. A managed database starts with public access off. You open it by whitelisting the connecting IP: your dev machine while you build, the app server's IP once you deploy. Only those addresses get in, so the database stays off the open internet without you hand-rolling a firewall. The master user, password, and host all show in the panel, so your app connects with the right identity from the start. You get automatic backups and free SSL, deploy from Git, and run Node, Python, and more. Plans start at $8/mo. Adding a database to an app for the first time? [Add a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/) and [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) walk the whole flow.

The honest boundary: managed means the platform handles the server, the stack, SSL, backups, and patching. Your app code and your data stay yours. Whitelisting is self-serve on a standard plan, and it's the mechanism that keeps the database private. Full network isolation in a private VPC is an Enterprise capability, not a standard default, so on a normal plan the IP allow-list is how you lock the database down.

**Launch a database your deployed app can actually reach, in one dashboard, with the allow-list one click away.** Run your app and its managed database together on Kloudbean: whitelist your server's IP, copy the host and master user from the panel, and connect. Automatic backups and free SSL come standard. Start at [kloudbean.com](https://www.kloudbean.com/); see plans on [pricing](https://www.kloudbean.com/pricing/).

One-click databases · IP allow-listing · Master user in the panel · Automatic backups · Free SSL · Free migration · Simple Git deploy

## FAQ

**Why does my app work locally but can't connect to the database in production?**
Because your laptop's IP was whitelisted on the database and your deployed server's IP was not, or your DATABASE_URL is set locally but missing in production. Both produce a connection that works on your machine and fails once deployed. Add the server's IP to the allow-list and confirm the env vars are set in the production environment.

**How do I whitelist my server's IP on the database?**
Find your app server's public IP, then add it to the database's IP allow-list (access control) in your host's dashboard. On Kloudbean, a managed database keeps public access off by default, and you enable it by adding the connecting IP: your dev machine while building, the app server once deployed. Only listed addresses can connect.

**What does ECONNREFUSED mean when connecting to a database?**
It means something at that address actively refused the connection. Usually the host or port is wrong, or the database isn't running there. Postgres uses 5432 and MySQL uses 3306 by default. If instead the connection hangs and then times out, that's typically a firewall or allow-list dropping your packets, not a refusal.

**Why is password authentication failing when the password is correct?**
Often because you're using the wrong account. A managed database has its own master user and password, which is different from your hosting-account login. Copy the database user and password from the database panel. Also check the database name and, if you use a DATABASE_URL, that special characters in the password are URL-encoded.

**What does ENOTFOUND mean for a database host?**
ENOTFOUND is a DNS failure: the hostname didn't resolve to an IP. The name is wrong, has a stray space, or is an internal-only host used from outside. Copy the exact host from the database panel and confirm it resolves. If the panel lists an external host or an IP, use that from your app server.

**How do I fix too many connections on Postgres or MySQL?**
You've hit the database's cap on simultaneous connections, usually from opening a connection per request or running many app instances. Add a connection pool so your app reuses a small set of connections instead of creating new ones. That fixes it far more reliably than moving to a bigger database.

**My database connection just times out with no error. What's wrong?**
A silent timeout almost always means packets are being dropped by a firewall or the database allow-list, not that the database is slow. The classic cause is a deployed server whose IP was never whitelisted. Test the port from the server (for example nc -zv host 5432); if it hangs, add the server's IP to the allow-list.

**Should I open my database to public access to fix the connection?**
No. Allowing all IPs (0.0.0.0/0) makes the error vanish but puts your database on the open internet, where automated scanners find and probe it quickly. Whitelist only the specific IP that needs access, which is your app server. It takes about two minutes and keeps the database private.

**Do I need a private network or VPC to connect my app to its database?**
Not on a standard setup. The IP allow-list is the mechanism: whitelist your app server's IP and only it can connect. On Kloudbean, a private VPC is an Enterprise capability, not the default, so standard plans rely on IP whitelisting plus strong credentials and SSL to keep the database locked down.

---

*Kloudbean · Read the error, check the allow-list, then check the env var.*
