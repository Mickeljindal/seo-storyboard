---
title: "MongoError: Authentication Failed? Check authSource Before the Password"
slug: fix-mongoerror-authentication-failed
meta_description: "MongoError authentication failed almost never means the password is wrong. The usual cause is the wrong authSource. Here's how to diagnose it with mongosh, fix the URI, and tell auth failures apart from authorization errors."
author: Kloudbean Database
hero_image: images/hero.png
---

![A Node.js app receiving MongoError authentication failed while connecting to MongoDB, with authSource highlighted in the connection string](images/hero.png)

# MongoError: Authentication Failed? Check authSource Before the Password

By Kloudbean Database · The credentials are usually fine. Mongo is looking for them in the wrong database.

Your app boots, tries to connect, and dies with `MongoError: Authentication failed` or the newer `MongoServerError: bad auth : Authentication failed`. So you retype the password. Then you reset it. Then you paste it into a note to compare character by character. And it was right the whole time. In most cases mongodb authentication failed isn't a password problem at all, it's an `authSource` problem: MongoDB checks credentials against one specific authentication database, and your connection string is pointing it somewhere else. Let's fix that, then work through the other real causes.

> **Why does MongoDB say authentication failed when the password is right?**
> Because MongoDB verifies a user against one authentication database, and `authSource` defaults to the database named in your connection string path. If you created the user in `admin` but connect to `/appdb`, Mongo looks in `appdb`, finds no such user, and reports authentication failed. Add `?authSource=admin`. Then check for special characters in the password that need percent-encoding.

## What MongoError authentication failed actually means

The message is narrower than it sounds. It means the server received a username, a credential, and the name of an authentication database, and the combination didn't verify. That's it. It doesn't tell you which of the three was wrong, and it deliberately doesn't tell you whether the user exists, because leaking that would help an attacker enumerate accounts. So "authentication failed" covers a user that doesn't exist in the database Mongo looked in, exactly as it covers a genuinely bad password. Same message, very different fixes.

Two things it does *not* mean. It's not a network problem: you got a real reply from a real mongod, so the host and port are fine (if they weren't, you'd be reading [ECONNREFUSED in Node.js](https://www.kloudbean.com/blog/fix-econnrefused-node/) instead). And it's not a permissions problem. Permissions produce a different error, which we'll separate out below.

## The authSource mismatch: the first thing to check

MongoDB stores users inside databases. A user is not global; it belongs to the database it was created in, and that database is its authentication database. When you authenticate, the driver has to tell the server which database to look in. That value is `authSource`.

Here's the trap. If you don't set `authSource` explicitly, it defaults to the database named in the path of your connection string. Connect to `mongodb://appuser:PLACEHOLDER_PASSWORD@10.0.0.5:27017/appdb` and the driver asks the server to authenticate `appuser` against `appdb`. But nearly every tutorial, and nearly every human at a `mongosh` prompt, creates the user like this:

```js
use admin
db.createUser({
  user: "appuser",
  pwd: passwordPrompt(),
  roles: [ { role: "readWrite", db: "appdb" } ]
})
```

Read that carefully. The user lives in `admin`. Its *role* applies to `appdb`. Those are two separate things, and people conflate them constantly. So the credential record is in `admin`, the driver goes looking in `appdb`, finds nothing, and you get authentication failed with a perfectly valid password.

The fix is one query parameter:

```
# Broken: authSource defaults to appdb, where the user does not exist
mongodb://appuser:PLACEHOLDER_PASSWORD@10.0.0.5:27017/appdb

# Fixed: authenticate against admin, then use appdb
mongodb://appuser:PLACEHOLDER_PASSWORD@10.0.0.5:27017/appdb?authSource=admin
```

Why it works: `authSource=admin` separates "where my credentials are stored" from "which database I want to read and write." The path still selects your working database. Only the credential lookup moves.

The reverse case exists too. If you created the user with `use appdb` and then set `authSource=admin` in the URI out of habit, you get the same error from the opposite direction. The rule to remember: `authSource` must equal the database you ran `createUser` in. Nothing else.

Not sure where the user lives? Ask, as an admin user:

```js
// which users exist in admin
use admin
db.getUsers()

// and in the app database
use appdb
db.getUsers()
```

<!-- ADD IMAGE: a mongosh session running db.getUsers() in admin and in appdb side by side, proving where the user actually lives -->

## Test the credentials with mongosh before you touch app code

This is the step I'd insist on, and it's the one people skip. Before editing a single line of application config, authenticate from a shell. It splits the problem cleanly in half: if `mongosh` gets in with those credentials, the credentials are good and you have an application configuration bug. If `mongosh` also fails, the problem is the user, the password, or the auth database, and your app is innocent.

```bash
# Prompted for the password, so it never lands in shell history
mongosh "mongodb://10.0.0.5:27017/appdb?authSource=admin" \
  --username appuser --authenticationDatabase admin

# Same test against a hosted or SRV endpoint
mongosh "mongodb+srv://cluster.example.net/appdb?authSource=admin" --username appuser
```

Pass the flags instead of embedding the password in the URI: the secret stays out of your shell history and process listings, and you skip URI parsing entirely.

Run the same test twice, once with `--authenticationDatabase admin` and once with `appdb`. Whichever one succeeds is the value your application's `authSource` needs.

## Special characters in the password break URI parsing

A MongoDB connection string is a URI, so it has reserved characters. If your password contains `@`, `:`, `/`, `?`, `#`, `[`, `]`, or `%`, the driver parses the string in a way you did not intend and sends the wrong credential. An `@` is the nastiest one, because the parser treats it as the boundary between credentials and host, so half your password gets read as a hostname.

Percent-encode the username and password before putting them in a URI. Common substitutions:

| Character | Encode as | What happens if you don't |
|---|---|---|
| `@` | `%40` | Parser splits the URI early, host and password both wrong |
| `:` | `%3A` | Password truncated at the colon |
| `/` | `%2F` | Path parsed early, database name lost |
| `?` | `%3F` | Rest of the password read as query options |
| `#` | `%23` | Everything after it silently dropped as a fragment |
| `%` | `%25` | Invalid escape sequence, or a mangled credential |

Let code do it rather than doing it by hand:

```js
// Node.js: build the URI from parts, never by string-pasting a raw password
const user = encodeURIComponent(process.env.MONGO_USER);
const pass = encodeURIComponent(process.env.MONGO_PASSWORD);
const uri = `mongodb://${user}:${pass}@${process.env.MONGO_HOST}:27017/appdb?authSource=admin`;
```

```python
# Python
from urllib.parse import quote_plus
uri = "mongodb://%s:%s@%s:27017/appdb?authSource=admin" % (
    quote_plus(os.environ["MONGO_USER"]),
    quote_plus(os.environ["MONGO_PASSWORD"]),
    os.environ["MONGO_HOST"],
)
```

An anti-pattern worth naming: pasting the literal password into a connection string in source code. It leaks the secret into git forever, it breaks the moment the password contains a reserved character, and it makes rotation a code deploy instead of a config change. Keep credentials in environment variables and assemble the URI at runtime. [Environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/) and [secrets management](https://www.kloudbean.com/blog/secrets-management/) both go deeper on that.

## Authentication failed versus not authorized: two different errors

These get lumped together and they shouldn't be. Authentication is "who are you." Authorization is "may you do this." If you logged in successfully but the user has no role on the database you're touching, you'll see something closer to `MongoServerError: not authorized on appdb to execute command`. That's good news: the credentials work, and you only need to grant a role.

| What you see | Stage that failed | Most likely cause | Fix |
|---|---|---|---|
| MongoError: Authentication failed | Authentication | Wrong authSource, user created in another database | Set authSource to the database holding the user |
| MongoServerError: bad auth : Authentication failed | Authentication | Bad password, or unencoded reserved character in the URI | Percent-encode credentials, retest with mongosh |
| not authorized on appdb to execute command | Authorization | User authenticated but has no role on that database | Grant readWrite scoped to that database |
| Authentication failed after a password change | Authentication | Stale value still in the running environment | Update the env var and restart the app |
| Command requires authentication | Authentication | No credentials sent at all | Supply user and password in the connection config |

Granting the role, scoped narrowly:

```js
use admin
db.grantRolesToUser("appuser", [ { role: "readWrite", db: "appdb" } ])
```

Give the application a user with `readWrite` on its own database and nothing more. Don't hand your app a root or cluster-admin account because it's convenient during debugging, then forget to change it. A least-privilege user limits the blast radius of a leaked credential, and it makes errors more informative, since an over-privileged user succeeds at things that should have failed loudly in staging.

<!-- ADD IMAGE: the two errors side by side in a terminal, authentication failed next to not authorized, to make the distinction visual -->

## The .env causes: invisible characters and stale values

When `mongosh` works but the app still fails, the problem is almost always what your process actually loaded. Things that look identical to the eye and aren't:

- **A trailing space.** `MONGO_PASSWORD=hunter2 ` includes that space in many loaders. Mongo receives a different password than the one you see.
- **Quotes that became part of the value.** Some environments strip `"..."`, some don't. If yours doesn't, the literal quote marks are in the password.
- **A wrapped or newline-split value.** A long URI broken across two lines in a dashboard field silently gains a newline.
- **A stale value after rotation.** The secret store has the new password, the running process still holds the old one from boot. Restart the app after changing it.
- **The wrong environment entirely.** Staging credentials against the production host, or a local `.env` shadowing the real config.

Print what the process actually has, without printing the secret:

```bash
node -e 'const p = process.env.MONGO_PASSWORD || "";
console.log("length:", p.length,
            "trailing space:", / $/.test(p),
            "has quotes:", /^["\x27]|["\x27]$/.test(p),
            "has newline:", /\n|\r/.test(p));'
```

Length plus those four flags is usually enough to spot the culprit, and you never echo the credential itself.

## Auth mechanism mismatch: SCRAM-SHA-1 versus SCRAM-SHA-256

Modern MongoDB defaults to SCRAM-SHA-256, and older servers and users use SCRAM-SHA-1. A user record stores credentials for the mechanisms it was created with, so a user created under an old default may only carry SCRAM-SHA-1 material. Pin the mechanism explicitly when a driver and server disagree:

```
mongodb://appuser:PLACEHOLDER_PASSWORD@10.0.0.5:27017/appdb?authSource=admin&authMechanism=SCRAM-SHA-256
```

Note the `&` joining the second option. Two options separated by anything else is another quiet way to produce this error. If pinning SCRAM-SHA-1 makes it work, the honest fix afterwards is to reset that user's password on a current server so it gains SCRAM-SHA-256 credentials, then drop the override.

## Replica sets and mongodb+srv: put the options in the right place

With a replica set or an SRV endpoint, the URI has more moving parts, and options land in the wrong spot easily. Two rules cover it. Query options belong after the database path, in a single `?` block joined by `&`. And with `mongodb+srv://` you list one hostname, no port, because the seed list arrives over DNS.

```
# Replica set, explicit hosts, options after the path
mongodb://appuser:PLACEHOLDER_PASSWORD@node1:27017,node2:27017,node3:27017/appdb?replicaSet=rs0&authSource=admin&retryWrites=true

# SRV form: one host, no port, same option block
mongodb+srv://appuser:PLACEHOLDER_PASSWORD@cluster.example.net/appdb?authSource=admin&retryWrites=true
```

SRV records can also carry default options, which is why an SRV URI sometimes behaves differently from the plain form with what looks like the same settings. If an SRV connection fails auth and the equivalent `mongodb://` string works, set `authSource` explicitly on the SRV URI rather than trusting an inherited default.

## A five minute diagnosis order

1. Authenticate with `mongosh` using `--authenticationDatabase admin`. Works? The app config is wrong, not the credentials.
2. Repeat with `appdb`. Whichever succeeds is your correct `authSource`.
3. Both fail? Confirm the user exists where you think, with `db.getUsers()` in each database.
4. Check the password for reserved characters and percent-encode them, or better, keep the password out of the URI text.
5. Inspect the loaded env value for length, stray quotes, whitespace, newlines.
6. Still failing? Pin `authMechanism` and check whether the user predates SCRAM-SHA-256.

One thing that should never appear on that list: turning authentication off to get moving. Starting mongod without `--auth`, or exposing it on a public interface with no credentials, is how unsecured MongoDB instances get found and wiped by automated scans. Fix the connection string instead. And keep access restricted so only your application server can reach the database in the first place.

## Where this whole class of mistake comes from

Look back at the causes and a pattern shows up. Almost every one traces to a connection string typed by hand, or a user created by hand in whichever database the shell happened to be pointing at. The error isn't really about MongoDB's auth model. It's about humans assembling URIs from memory at 1am. That's a practical note rather than a pitch: on Kloudbean, MongoDB is a one-click managed database that hands you the connection details in the dashboard, with controlled access and automatic backups, and you set the URI as runtime config in the UI, so there's no hand-built string and no user created in the wrong place to begin with.

Wherever you run it, the discipline is the same: one canonical connection string per environment, stored as config.

<!-- ADD IMAGE: the managed database connection details panel, with host, port, user and database shown so the reader sees a supplied URI rather than a hand-typed one -->

## Related reading

Once you're authenticating cleanly, the next questions are about the connection itself. [Connecting Mongoose to MongoDB](https://www.kloudbean.com/blog/connect-mongoose-to-mongodb/) covers the driver options, connection events, and models. [Managed MongoDB hosting](https://www.kloudbean.com/blog/managed-mongodb-hosting/) covers running the database itself, indexing, and migrating an existing one. For connection stability under load, read [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/). And for keeping credentials out of your repo, [secrets management](https://www.kloudbean.com/blog/secrets-management/) is the companion piece to this one.

**Stop hand-building MongoDB connection strings.** Launch a managed MongoDB, copy the connection details from the dashboard, and set them as runtime config for your app. See [kloudbean.com](https://www.kloudbean.com/) or check current plans on [pricing](https://www.kloudbean.com/pricing/).

One-click managed MongoDB · Automatic backups · IP allow-listing · Free SSL · Git deploys

## FAQ

### What does MongoError authentication failed mean?

It means the server got a username, a credential, and an authentication database, and that combination did not verify. It intentionally does not say which part was wrong, and it does not reveal whether the user exists. So it covers a valid password checked against the wrong authentication database just as much as a genuinely wrong password.

### Why does MongoDB say authentication failed when my password is correct?

Usually because of authSource. MongoDB users belong to the database they were created in, and the driver looks in the database named in your connection string path unless you say otherwise. A user created in admin but referenced by a URI ending in /appdb will fail, with the right password, every time. Add authSource=admin.

### What is authSource in a MongoDB connection string?

It names the database MongoDB should search for the user record when authenticating. It is separate from the database your app reads and writes. If you omit it, it defaults to the database in the URI path, and if that is not where the user was created, authentication fails. Set it to whichever database you ran createUser in.

### How do I fix MongoServerError bad auth authentication failed?

Test the same credentials with mongosh first, passing the authentication database explicitly. If mongosh gets in, your application URI is the problem: check authSource, check for unencoded characters in the password, and check the value your process actually loaded. If mongosh also fails, the user, password, or auth database is wrong.

### How do I escape special characters in a MongoDB password?

Percent-encode them before placing them in a URI. An at sign becomes %40, a colon %3A, a slash %2F, a hash %23, a question mark %3F, and a percent sign %25. Better still, do it in code with encodeURIComponent in Node or quote_plus in Python, so you build the URI from environment variables instead of hand-editing text.

### How do I test MongoDB credentials without running my app?

Connect with mongosh and pass the username and authentication database as flags, letting it prompt for the password. That keeps the secret out of your shell history and skips URI parsing entirely. If it authenticates, the credentials are fine and the bug is in your application config. That single test splits the problem in half.

### What is the difference between authentication failed and not authorized in MongoDB?

Authentication is proving who you are; authorization is being allowed to do something. Authentication failed means login itself did not succeed. Not authorized on a database means login worked but the user has no role covering that action, which you fix by granting a role scoped to that database rather than by touching credentials.

### Does mongodb+srv change how authSource works?

The rule is the same, but SRV records can supply default options, so an SRV URI may behave differently from a plain one that looks equivalent. With the SRV form you give one hostname and no port, and query options still go after the database path joined by ampersands. When auth fails on SRV, set authSource explicitly instead of relying on an inherited default.

### Should my application connect to MongoDB as a root user?

No. Create a user with readWrite on just the database that app uses, and leave administrative accounts for administration. A narrowly scoped user limits what a leaked credential can reach, and it surfaces mistakes early, because an over-privileged account quietly succeeds at operations that should have failed in staging.

Kloudbean Database · When auth fails, suspect the lookup before the password.
