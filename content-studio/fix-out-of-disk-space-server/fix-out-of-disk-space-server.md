---
title: "Server Out of Disk Space: Find What Filled It and Fix It Safely"
slug: fix-out-of-disk-space-server
meta_description: "A server out of disk space rarely says disk full. It shows up as ENOSPC, a database refusing writes, nginx 500s, or a failed deploy. Here is the safe triage order: df -h, df -i, du, lsof, and the fixes that stop it coming back."
author: "Kloudbean Infrastructure"
hero_image: images/hero.png
---

# Server Out of Disk Space: Find What Filled It and Fix It Safely

*By Kloudbean Infrastructure · A full disk never says "disk full". It just makes everything else look broken.*

![A Linux terminal showing df -h with a root filesystem at 100 percent use and an application logging ENOSPC no space left on device](images/hero.png)

A server out of disk space is one of the few failures that lies to you about what it is. Nothing pops up saying "disk full". Instead your Node process throws `ENOSPC: no space left on device`, Postgres starts refusing writes or shuts itself down, nginx hands out 500s, your deploy fails halfway through `npm install`, `apt` errors out mid-upgrade, and an SSH login hangs because the shell can't write a history file. People burn an hour debugging the symptom. Then someone runs `df -h` and the whole mystery collapses into one line of output.

> **How do I fix a server that is out of disk space?**
> Run `df -h` first to confirm which filesystem is full, then `df -i`, because inodes run out separately from bytes. Walk down with `du -xh --max-depth=1` to find the offender, and check `lsof +L1` for deleted files still held open. Identify before deleting, truncate active logs instead of removing them, then add rotation so it doesn't recur.

## Why a server out of disk space fails in such strange ways

Almost everything on a Linux box assumes it can write. Logs, temp files, session data, socket files, package metadata, database write-ahead logs, your shell's history. When the filesystem is full, every one of those writes fails, and each piece of software reports it in its own vocabulary. So you get scattered, unrelated-looking errors instead of one clear message. Here's the translation table.

| What you actually see | What's really happening | First safe move |
|---|---|---|
| `ENOSPC: no space left on device` in Node | A write, upload, or log call failed at the OS level | `df -h`, then `df -i` |
| Postgres refusing writes, or shutting down after a PANIC on write | WAL or data files can't be extended | Free space on the data volume before restarting anything |
| MySQL going read-only or crashing on write | Same story, often binary logs that were never expired | `df -h`, then look at the binlog directory |
| nginx returning 500 or 502 with nothing useful logged | It can't write its own error log, or the upstream app died | Check disk, then the app process |
| Deploy or `npm install` failing partway through | Build artifacts and package caches filled the volume | Clean caches, check for stale release directories |
| `apt` errors, failed package configuration | No room to unpack, or `/boot` is full of old kernels | `df -h /boot` as well as `/` |
| SSH login hangs or drops you into a broken shell | No space to write session, history, or PAM state files | Get in as root if you can, then `df -h` |

One quirk worth knowing: ext4 reserves a slice of the filesystem for the root user (5% by default). That's a deliberate escape hatch, and it's why you usually still have a working root shell while the disk is effectively full for your app.

<!-- ADD IMAGE: Terminal screenshot of df -h with the root filesystem at 100% Use%, so readers recognise the exact output. -->

## Step 1: df -h, to confirm you're out of bytes and where

Start here every time. It takes a second and it either confirms or kills the whole theory.

```bash
# Human-readable usage per filesystem
df -h

# Just the ones people actually run out of
df -h / /var /boot /tmp
```

Read the `Use%` column, not the size, and read `Mounted on` carefully, because "the disk is full" is usually "one filesystem is full". A separate `/var` at 100% while `/` sits comfortably is a different problem from a single root volume filling up. A full `/boot` is almost always old kernel packages, nothing to do with your app.

**What this rules out:** if every filesystem shows plenty of free space, you're not out of bytes. Don't stop there. Go straight to inodes.

## Step 2: df -i, because inodes run out separately

This is the check people skip, and it's the one that explains the impossible cases. Every file, directory, and symlink consumes one inode, and a filesystem is created with a fixed number of them. Run out of inodes and you can't create a single new file, no matter how many gigabytes are free. The error is still `ENOSPC` or "no space left on device", which is why it's so confusing.

```bash
# Inode usage, same layout as df -h
df -i

# Which directory holds the most files? (run on the full filesystem)
sudo find /var -xdev -type f | wc -l
sudo find /var -xdev -type d -exec sh -c 'echo "$(ls -A "$1" | wc -l) $1"' _ {} \; 2>/dev/null | sort -rn | head -20
```

The classic causes are millions of tiny files: PHP session files in `/var/lib/php/sessions`, a framework cache directory nobody prunes, one-file-per-job queue data, mail spool, or a temp directory an app writes to and never cleans. Bytes-wise it's nothing. Inode-wise it's fatal.

| Failure mode | How you spot it | Why it happens |
|---|---|---|
| Out of bytes | `df -h` shows 100% Use% | Something large grew: logs, images, backups, build cache |
| Out of inodes | `df -h` looks fine, `df -i` shows 100% IUse% | Huge count of tiny files: sessions, cache entries, spool |
| Deleted file still open | `df` says full, `du` can't find the space | A process holds the file descriptor, so blocks aren't released |

## Step 3: walk down with du to find the actual offender

Once you know which filesystem is full, find what's on it. Work top down, one level at a time, instead of running a giant recursive scan that takes minutes and floods your terminal.

```bash
# One level at a time, biggest last. -x stays on this filesystem.
sudo du -xh --max-depth=1 / | sort -h

# Follow the biggest number down
sudo du -xh --max-depth=1 /var | sort -h
sudo du -xh --max-depth=1 /var/log | sort -h

# Or just ask for the twenty biggest files on this filesystem
sudo find / -xdev -type f -printf '%s %p\n' 2>/dev/null | sort -rn | head -20
```

The `-x` flag matters. Without it you'll wander into network mounts and other filesystems and get numbers that don't relate to the volume you're fixing. Two or three iterations normally lands you on the culprit. And if `du` disagrees with `df` by a meaningful amount, that gap is a clue, not a rounding error.

## When df says full and du can't find it: deleted files still held open

This is the one that makes experienced people doubt themselves. Someone already "fixed" it by running `rm` on a huge log file, `df` still reports the filesystem full, and `du` now shows far less usage than `df`. Nothing adds up.

The mechanism: deleting a file removes its directory entry, but the blocks are only released when the last file descriptor referring to it is closed. If nginx, your app, or a logging daemon still holds that file open for writing, the space stays allocated to a file that no longer has a name, and the process keeps writing into it. `du` walks the directory tree, so it can't see the file. `df` asks the filesystem, so it counts every block.

```bash
# List open files that have been unlinked (deleted but still held)
sudo lsof +L1

# Same idea via /proc, useful when lsof is not installed
sudo ls -l /proc/*/fd 2>/dev/null | grep '(deleted)'
```

The fix is to make the holding process let go. Reloading is usually enough and is much gentler than a restart:

```bash
# nginx: reopen its log files
sudo nginx -s reopen        # or: sudo systemctl reload nginx

# systemd services generally
sudo systemctl reload myapp || sudo systemctl restart myapp
```

The space comes back the instant the descriptor closes. And this is exactly why the next rule exists.

## Truncate active logs, don't delete them

If a file is being written to right now, deleting it gives you a deleted-but-open file and no free space. Emptying it in place gives you the space immediately and the process keeps logging to the same descriptor without a hiccup.

```bash
# Empty a log file in place, keeping the file and its handle valid
sudo truncate -s 0 /var/log/nginx/access.log

# Same thing with a shell redirect
sudo sh -c ': > /var/log/myapp/out.log'
```

Two things never to do on a production box under pressure. Don't wipe a log directory wholesale, as in `rm -rf /var/log` or anything shaped like it, because you'll destroy the evidence you need for the postmortem and break services that expect their log paths and permissions to exist. And never `rm` anything inside a database data directory, including files that look like logs. To Postgres and MySQL those files are the database, and removing them can leave you restoring from backup instead of recovering in place.

The rule that keeps you out of trouble: identify the file, work out which process owns it, then act. If you can't identify it, leave it alone, and take a snapshot or backup before touching anything you're unsure about. Also resist the urge to "fix permissions" while you're in there. `chmod 777` on a log or upload directory turns a capacity incident into a security one.

<!-- ADD IMAGE: Output of lsof +L1 showing a deleted log file still held open by a running process, with the size column visible. -->

## The usual culprits, and the safe fix for each

In practice a full disk is nearly always one of these.

### Runaway application and web server logs

A single unrotated log growing for months is the most common cause there is, and one noisy stack trace in a loop can produce gigabytes in a day. Truncate it for breathing room, then fix rotation, which is the actual fix.

```bash
# How much is the systemd journal using?
journalctl --disk-usage

# Cap it, right now and permanently
sudo journalctl --vacuum-size=200M
sudo journalctl --vacuum-time=14d
# Persist it in /etc/systemd/journald.conf:  SystemMaxUse=200M
```

For your own app logs, use logrotate rather than a cron job with `rm` in it. A minimal policy:

```
# /etc/logrotate.d/myapp
/var/log/myapp/*.log {
  daily
  rotate 7
  size 100M
  compress
  delaycompress
  missingok
  notifempty
  copytruncate
}
```

```bash
# Test before you trust it
sudo logrotate -d /etc/logrotate.d/myapp     # dry run
sudo logrotate -f /etc/logrotate.d/myapp     # force one rotation
```

`copytruncate` is the pragmatic option when your app holds its log open and ignores reopen signals. If it does handle reopening, prefer `postrotate` with a reload, since `copytruncate` has a tiny window where lines can be lost.

### Docker images, containers, and build cache

Build cache is invisible until it isn't. Ask Docker before deleting anything, and read what it says it will remove.

```bash
docker system df            # what is using space
docker image prune          # dangling images only
docker system prune         # stopped containers, unused networks, dangling images
docker builder prune        # build cache
```

Be careful with `-a` and `--volumes`. Those can remove images you still need and, worse, volumes holding real data.

### Package caches, old kernels, and stale releases

```bash
sudo apt-get clean                  # clears /var/cache/apt/archives
sudo apt-get autoremove --purge     # old kernels and orphaned deps (review the list first)
sudo dnf clean all                  # RHEL family equivalent
```

Read the `autoremove` list before confirming. It's normally correct, but it's the one that occasionally proposes removing something you depend on. Deploy tooling that keeps every release directory forever eats a volume slowly and predictably, so keep a handful of releases and prune the rest. Check `~/.npm`, `~/.cache`, and any CI workspace on the box too.

### Database WAL and binary log growth

The fix here is a database command, never `rm`. In Postgres, WAL that won't recycle usually means an inactive replication slot pinning it, or a failing `archive_command`:

```sql
-- Postgres: slots that are pinning WAL
SELECT slot_name, active, restart_lsn FROM pg_replication_slots;
```

```sql
-- MySQL: expire binary logs properly
SHOW BINARY LOGS;
SET GLOBAL binlog_expire_logs_seconds = 604800;   -- 7 days
```

Drop an unused replication slot or fix the archiver and the space frees itself. Deleting WAL or binlog files by hand can corrupt the database or break replication and point-in-time recovery.

### Core dumps

Each dump is roughly the size of the process's memory, so a repeatedly crashing service fills a volume fast. Check and cap them:

```bash
coredumpctl list
sudo journalctl --vacuum-time=2d           # journal-stored dumps
# /etc/systemd/coredump.conf:  MaxUse=1G
```

Then go find out why it's crashing, because the dumps are a symptom.

<!-- ADD IMAGE: du -xh --max-depth=1 output walked down two levels, with the offending directory highlighted. -->

## An honest opinion: your server isn't too small

Nearly every full-disk incident I've looked at traces back to one of two things: no log rotation policy, or user uploads sitting on the application server's local disk. Neither is a capacity problem. Both are design problems that present as capacity problems.

Resizing the volume feels like a fix. It's a delay. If a log grows without bound, a bigger disk changes the date of the next outage and nothing else. Resize when you genuinely need room for data you intend to keep, or for headroom mid-incident, then go fix the cause the same week.

The anti-pattern worth naming, because it's everywhere: disk fills, someone deletes logs, restarts the service, closes the ticket, adds no rotation. That's not a fix, it's a subscription. The same outage comes back on a schedule set by your log volume, usually at a worse hour with a less experienced person on call.

## Prevention that actually holds

Three things, in order of how much grief they save.

1. **Rotation on every log path, tested.** Not just your app. Nginx, the journal, cron output, worker logs, anything that appends. Run `logrotate -d` so you know the policy parses, then check a week later that files really are rotating.
2. **An alert at a threshold you can act on.** Somewhere around 75 to 80% used gives you time to think instead of react. Alert on inode usage too, since a bytes-only check misses that failure completely, and note that an uptime check which only asks whether the site answers won't catch a disk creeping toward full.
3. **Get user uploads off the application server.** Files that grow with your user base don't belong on a volume sized for an OS and an app. Object storage moves that growth somewhere designed for it, and it makes your app server disposable again.

A practical note on where that leaves you: the two durable fixes are keeping uploads off the server's disk and having backups plus monitoring so a filling disk becomes a warning instead of an outage. On Kloudbean that's S3-compatible object storage for uploads, automatic backups you can restore from if a cleanup goes wrong, uptime monitoring, and managed servers where the stack and patching are handled, though rotation for your own application logs is still yours to configure.

## Related reading

[S3-compatible object storage](https://www.kloudbean.com/blog/s3-compatible-object-storage/) for moving uploads off local disk, [server backups](https://www.kloudbean.com/blog/server-backups-guide/) before you delete anything you're unsure about, [uptime monitoring](https://www.kloudbean.com/blog/uptime-monitoring/) so you hear about a filling disk early, [structured logging in Node.js](https://www.kloudbean.com/blog/structured-logging-nodejs/) for keeping log volume sane, and [why a Node app crashes on deploy](https://www.kloudbean.com/blog/fix-node-app-crashing-on-deploy/), since ENOSPC is a common hidden cause. Then the [server hardening checklist](https://www.kloudbean.com/blog/server-hardening-checklist/) and [vertical vs horizontal scaling](https://www.kloudbean.com/blog/vertical-vs-horizontal-scaling/) for when resizing genuinely is the right call.

---

**Stop storing growth on your app server.**
Put uploads in S3-compatible object storage, keep automatic backups, and watch your servers from one dashboard. Managed servers from $8/mo at [kloudbean.com](https://www.kloudbean.com/), pricing on the [pricing page](https://www.kloudbean.com/pricing/).
*Object storage · Automatic backups · Managed servers · Free SSL · Free migration · Free trial*

---

## FAQ

**How do I check if my Linux server is out of disk space?**
Run `df -h` to see usage per filesystem and read the Use% column, then run `df -i` to check inode usage, since inodes can run out while bytes remain free. Both report the same "no space left on device" error to applications, so checking only one leaves you guessing.

**What does ENOSPC no space left on device mean?**
It's the operating system telling your process that a write couldn't be completed because the filesystem has no room. It means either the data blocks are exhausted or the inodes are, and it can also appear when you hit a limit like inotify watches. Check `df -h` and `df -i` on the filesystem the process was writing to.

**Why does df show the disk is full but du does not?**
Because someone deleted a file that a running process still has open. The directory entry is gone so `du` can't see it, but the blocks stay allocated until the last file descriptor closes, and `df` counts them. Run `lsof +L1` to find it, then reload or restart the holding process to release the space.

**Can a disk be full even when df shows free space?**
Yes, and that's usually inode exhaustion. Every file and directory uses one inode, and the count is fixed when the filesystem is created, so millions of tiny session or cache files can exhaust inodes with gigabytes still free. `df -i` shows it. The fix is removing or pruning that file population, not adding space.

**Is it safe to delete log files to free disk space?**
Deleting a log a process still holds open frees nothing, because the blocks aren't released until that descriptor closes. Empty it in place with `truncate -s 0` instead. Never wipe a log directory wholesale, and never remove files from a database data directory, since those files are part of the database.

**How do I find the largest files and directories on a server?**
Walk down one level at a time with `sudo du -xh --max-depth=1 /` piped to `sort -h`, then repeat on whichever directory is biggest. The `-x` flag keeps it on a single filesystem so the numbers stay meaningful. For individual files, a `find` with `-printf` on size sorted in reverse gives you the top offenders quickly.

**Should I resize the disk or clean it up?**
Clean up first, then work out why it filled. Resizing is legitimate when you need room for data you intend to keep, but if the growth is unrotated logs or uploads on local disk, a bigger volume only moves the outage later. Fix the cause, then size the volume for what you actually store.

**How do I stop the server disk filling up again?**
Add logrotate policies on every log path and test them with a dry run, cap the systemd journal with SystemMaxUse, alert on both space and inode usage at a level that gives you time to act, and move user uploads to object storage so growth doesn't land on the app server's volume.

*Kloudbean Infrastructure · Identify, then delete. In that order, every time.*
