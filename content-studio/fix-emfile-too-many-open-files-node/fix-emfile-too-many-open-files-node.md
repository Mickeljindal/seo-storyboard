---
title: "Fix: EMFILE: too many open files in Node.js"
description: "EMFILE means your Node process hit the operating system's open file-descriptor limit. How to tell a real leak from genuine concurrency, when raising the limit is right, and how to find the leak when it isn't."
slug: fix-emfile-too-many-open-files-node
canonical: https://www.kloudbean.com/blog/fix-emfile-too-many-open-files-node/
cluster: 2. Node.js and deployment
pillar: best-managed-nodejs-hosting-2026
money_page: best-managed-nodejs-hosting-2026
byline: Every socket is a file. Run out of file slots and even a healthy app stops answering.
---

# Fix: EMFILE: too many open files in Node.js

By Kloudbean Engineering · Raising the limit is the first thing people try and often the wrong one.

Your Node app throws `Error: EMFILE: too many open files`, maybe the moment it starts on your Mac, maybe only once real traffic arrives. It's a resource-exhaustion error, cousin to running out of memory, except the resource here is file descriptors: the slots the operating system gives a process for open files, sockets, and connections. The fix everyone reaches for is to raise the limit, and sometimes that's correct. But if the real problem is a leak, raising the limit just buys you a slower crash. So the useful first move is figuring out which of the two you have.

> **How do I fix EMFILE too many open files in Node?**
>
> EMFILE means your process hit the OS limit on open file descriptors. Everything counts: open files, network sockets, and database connections. If the count climbs steadily until it crashes, you have a descriptor leak, so find and close the connections or streams you're not releasing. If it's genuinely high concurrency, raise the limit with `ulimit -n` for a session, or `LimitNOFILE` in your systemd service for a permanent change. On a dev machine, a file watcher hitting the limit is usually solved by raising it. Raising the limit on a leak only delays the crash.

<!-- ADD IMAGE: hero, an open file-descriptor count climbing toward the ulimit line, with a leak curve versus a flat concurrency line -->

## What EMFILE actually means

The key insight is that "file" here means far more than files on disk.

To the operating system, a lot of things are file descriptors: an open file, yes, but also every network socket, every database connection, every pipe. A process is allowed only so many open at once, a ceiling called the open-files limit (you'll see it as `ulimit -n` or `nofile`). When your Node process tries to open one more, a new incoming socket, a new query connection, a file read, and it's already at the ceiling, the OS refuses and Node reports `EMFILE: too many open files`. So this is not really about files in the everyday sense. A busy web app hits it through sockets and connections far more often than through actual files. Reading the error as "too many open descriptors" rather than "too many open files" points you at the right suspects.

## First, which EMFILE do you have?

This split decides everything, so spend thirty seconds here before touching a config.

| What you see | Likely cause | Where to look |
| --- | --- | --- |
| Fails immediately, often on a Mac in dev | A file watcher plus a low default limit | Raise the limit |
| Fine at first, fails only under load | Genuine high concurrency | Raise the limit, size the server |
| Count climbs steadily until it crashes | A descriptor leak | Find the unclosed resource |

You can watch the actual count for a running process with `lsof -p <pid> | wc -l`, or check the limit itself with `ulimit -n`. If the number of open descriptors grows and never comes back down even as traffic is steady, that's the signature of a leak, and no limit will save you, it just moves the crash later. If the count rises with concurrent load and plateaus, that's real usage and raising the limit is legitimate. Diagnose first; the fix follows from which pattern you see.

## Raising the limit, and when it's right

Sometimes the limit genuinely is too low, so here's how to raise it properly.

For a quick, session-only change:

```
ulimit -n 65535
```

That only affects the current shell. For a real service, set it where the process is actually managed. Under systemd, add it to the service unit:

```
[Service]
LimitNOFILE=65535
```

then reload and restart the service. This is the correct fix when your app legitimately holds many descriptors at once, a server handling thousands of concurrent WebSocket connections, for instance, where the default limit is simply below your real, healthy working set. Sizing the limit to genuine concurrency is normal operations, not a hack. The trap is reaching for this without checking first, because if the underlying issue is a leak, a higher limit just means the process runs longer before it dies the same way. Raise the limit when the usage is real. Don't raise it to paper over a leak.

Notice that this fix is a server change, not an application change. You're editing a unit file and restarting a service, which means it belongs to whoever owns the box. On a managed server the base system arrives tuned for real workloads, so the dev-machine version of this error is mostly a local problem rather than a production one, and when the answer really is "more room", resizing the server up is a self-serve action in the Kloudbean console rather than a migration. Sizing down disk isn't reversible, so size deliberately.

## Finding and fixing a descriptor leak

When the count only ever climbs, this is the actual work, and it's worth doing right.

A descriptor leak is your code opening something and never closing it, so the count ratchets up with every request or every job until the ceiling. The usual culprits: database connections opened per request instead of pooled and released, HTTP requests using an agent that never reuses or closes sockets, file streams or read handles opened and not closed on error paths, or event listeners that pile up. The tell is that restarting the process resets the count to healthy and then it climbs again. To find it, watch `lsof -p <pid>` over time and look at what type of descriptor is accumulating, sockets to your database point at connection handling, sockets to an external host point at an HTTP client, real files point at unclosed streams. The fix is to close what you open, ideally in a `finally` block so error paths release too, and to use a connection pool for your database rather than a fresh connection per request. That last one is common enough that it has its own guide in [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/). A leak fixed is fixed forever; a limit raised on a leak is a countdown.

One useful cross-check when the accumulating descriptors are database sockets: look at the count from the database's side too, not only the app's. A managed instance gives you that view without an SSH session, which matters because the database has its own connection ceiling and you can exhaust that before you exhaust the app's descriptor limit. Same leak, different error message, and the one you hit first depends on which ceiling is lower.

## What a raised limit really costs when the cause is a leak

People raise the limit and move on, so let me be specific about what that trade actually buys. The leak doesn't slow down. Only the calendar changes.

Say your app accumulates descriptors steadily and dies at 1024. You raise the ceiling to 65535, which is roughly sixty times the headroom, and now instead of failing during the afternoon you were already looking at it, it fails days later. Probably at 4am. Probably on a weekend. That's the first cost: you traded a crash you were watching for one nobody is.

The second cost is blast radius. A leak with sixty times more room to run has time to exhaust things that aren't yours. The database's own connection limit, a pool on a shared upstream, an intermediary's socket table. So the failure that eventually arrives isn't a tidy `EMFILE` in one process's log, it's a set of unrelated-looking symptoms across several services, and the clients hanging off it get resets rather than errors. Much harder to trace back to one unclosed stream.

The third cost is evidence. Every restart resets the count, so a supervised process that bounces itself keeps the app up and quietly deletes the pattern you needed to see. Which is exactly why a Kloudbean app running under PM2 with logs streaming in the console is only half the answer here: the restart keeps you serving traffic, and the sawtooth in the log is the diagnosis. Read it rather than being relieved by it. A process that restarts on a predictable interval is telling you something specific.

What to do instead of guessing is to make the count visible, so trend becomes something you can see rather than something you infer after a crash:

```js
// Linux: /proc/self/fd is one entry per open descriptor.
const fs = require("node:fs");

setInterval(() => {
  try {
    const open = fs.readdirSync("/proc/self/fd").length;
    logger.info({ open_fds: open }, "descriptor count");
  } catch {
    // macOS has no /proc. Use `lsof -p <pid> | wc -l` locally instead.
  }
}, 60000);
```

Alert on the slope, not the ceiling. A count that climbs through a quiet period is a leak no matter how far from the limit it currently sits.

And the part no platform can do, ours firmly included: nothing about where you deploy closes a stream your error path skipped, or releases a client your route handler forgot in a `catch`. A managed server can give you a sane baseline limit, supervision, and a place to see the count. It cannot put the `finally` block in your code. Sizing is the conversation to have once the leak is gone, covered alongside where to run Node in [the managed Node.js hosting guide](https://www.kloudbean.com/blog/best-managed-nodejs-hosting-2026/).

## More on fix

The other resource-exhaustion error is [JavaScript heap out of memory](https://www.kloudbean.com/blog/fix-javascript-heap-out-of-memory-node/), which is RAM rather than descriptors. Leaks often trace back to connections, so [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/) and [scaling WebSockets in Node](https://www.kloudbean.com/blog/scale-websockets-nodejs/) are close neighbours, and [graceful shutdown](https://www.kloudbean.com/blog/graceful-shutdown-nodejs/) covers closing things cleanly. For where to run Node, [the managed Node.js hosting guide](https://www.kloudbean.com/blog/best-managed-nodejs-hosting-2026/).

<!-- cta:start -->
**Read the log, fix it, ship again.**

Deploy from Git, watch the build output as it runs, and open the app error log when a process refuses to start. Managed processes restart on crash, and backups are automatic.

- Live build logs
- Deployment history
- Logs viewer
- Managed process restarts
- Automatic backups
- Git deploy

[Start free](https://console.kloudbean.com/register) · [See plans](https://www.kloudbean.com/pricing/)
<!-- cta:end -->

## FAQ

**What does EMFILE too many open files mean in Node?**

It means your process reached the operating system's limit on how many file descriptors it can have open at once. Descriptors cover not just files but network sockets and database connections, so a busy app usually hits this through connections rather than actual files. When the process tries to open one more past the ceiling, the OS refuses and Node reports EMFILE. Reading it as "too many open descriptors" points at the right causes.

**How do I raise the open files limit for Node?**

For the current shell, run ulimit -n 65535. For a real service, set the limit where the process is managed: under systemd, add LimitNOFILE=65535 to the service unit and restart. This is the correct fix when your app legitimately holds many descriptors, such as thousands of concurrent connections. It is the wrong fix if the real cause is a leak, because a higher limit only delays the same crash.

**How do I know if it's a leak or just high traffic?**

Watch the open descriptor count over time with lsof -p and the process id. If the count rises with concurrent load and then plateaus, that is genuine usage and raising the limit is appropriate. If it climbs steadily and never comes back down even when traffic is steady, and a restart resets it before it climbs again, that is a leak in your code. The shape of the count over time is the clearest signal.

**What causes a file descriptor leak in Node?**

Opening something and never closing it: database connections created per request instead of pooled and released, HTTP clients whose sockets are never reused or closed, file streams left open on error paths, or accumulating event listeners. The pattern is a descriptor count that only grows. The fix is to close what you open, ideally in a finally block so error paths release too, and to use a connection pool for the database rather than a new connection each request.

**Is EMFILE the same as running out of memory?**

No, they are different resources. Running out of memory (JavaScript heap out of memory) is about RAM. EMFILE is about file descriptors, the slots for open files, sockets, and connections. Both are resource-exhaustion errors and both can be triggered by a leak, but the thing being exhausted is different, so the diagnosis and fix differ. EMFILE points you at connections and streams, not at memory usage.

**Why does EMFILE happen on my Mac in development but not in production?**

macOS often ships with a low default open-files limit, and development tools like file watchers open a descriptor per watched file, so a large project can exhaust the default quickly. That is usually a genuine case for raising the limit locally with ulimit -n. It is not necessarily a code problem, just a low default meeting a watcher, though it is still worth confirming the count is stable rather than climbing.

**Does raising the limit fix the problem permanently?**

Only if the cause was genuinely high, healthy concurrency. If your app holds many connections legitimately and the default was simply too low, sizing the limit up is a proper fix. If there is a descriptor leak, raising the limit does not fix anything, it just lets the process run longer before it hits the new ceiling and crashes the same way. Diagnose which situation you are in before deciding the limit is the answer.

**How does managed hosting help with EMFILE?**

A managed platform sets sensible system limits for real workloads and supervises your process, so on Kloudbean your app runs under PM2 and restarts cleanly if it crashes, keeping you online while you investigate. It does not fix a leak in your code, which lives in the connections and streams you open, but it gives you a sane baseline and a safety net, and legitimate concurrency has room to breathe rather than hitting a tiny default.

Kloudbean Engineering · A leak fixed is fixed; a limit raised on a leak is a countdown.
