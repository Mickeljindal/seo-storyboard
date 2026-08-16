# Brief — Server Out of Disk Space: Find What Filled It and Fix It Safely

Cluster: Linux ops / error field guide. Intent: informational, urgent troubleshooting (reader is mid-incident).
Format chosen to match the dominant SERP shape for this family: triage field guide with real commands, not a listicle.

## Angle and information gain

A full disk does not announce itself. It shows up as `ENOSPC` in Node, a database refusing writes or shutting
down, nginx 500s, a failed deploy, `apt` errors, or an SSH login that hangs, so people debug the symptom for an
hour. The gain is the recognition table (symptom to real cause) plus the triage order and what each step RULES OUT:

1. `df -h` — bytes, and WHICH filesystem (`/` vs `/var` vs `/boot`).
2. `df -i` — inodes, the check people skip. Gigabytes free and still unable to create a file.
3. `du -xh --max-depth=1` walked down — find the offender on that one filesystem.
4. `lsof +L1` — deleted file still held open, which is why `df` and `du` disagree and why space is not released
   until the holding process reloads or restarts.

Second differentiator: safety. Readers paste these commands on production under stress, so the article insists on
identify-before-delete, `truncate -s 0` / `: >` for active logs instead of `rm`, no wholesale log-directory
deletion, no `rm` inside a database data directory, no `chmod 777`, and a backup or snapshot before deleting
anything unidentified. Database growth is fixed with database commands (drop the stale replication slot, expire
binlogs), never by removing WAL or binlog files.

Opinion (real, stated): a full disk is nearly always a missing log-rotation policy or user uploads on local disk,
not a server that is too small. Resizing buys time and does not fix the cause.
Anti-pattern (named): delete logs, restart, close ticket, add no rotation. The same outage returns on a schedule.

## Keywords

Primary: **server out of disk space** — in H1, `<title>`, meta description, first 100 words, and the H2
"Why a server out of disk space fails in such strange ways".
Secondary / variants woven through body and FAQ: ENOSPC no space left on device, Linux disk full,
df shows full but du does not, no space left on device but df shows free space, inode exhaustion / `df -i`,
how to find large files Linux, deleted file still open lsof, logrotate disk full, journalctl vacuum size,
database stopped when disk full.
No volume/difficulty figures were supplied for this topic, so none are cited. FAQ questions are PAA-shaped
(9 questions, mirrored 1:1 into FAQPage JSON-LD).

## Shape

Lead (recognition problem) -> `.tldr` (df -h then df -i) -> why it fails weirdly + symptom/cause/fix `table.cmp`
-> Step 1 `df -h` -> Step 2 `df -i` + bytes vs inodes vs deleted-open `table.cmp` -> Step 3 `du` -> df vs du
(deleted open files) -> truncate not delete (safety block) -> culprits with per-culprit safe fix (logs, Docker,
apt cache/kernels, releases, WAL/binlog, core dumps) -> opinion + anti-pattern -> prevention (rotation, alert on
space AND inodes, uploads off the disk) -> related reading -> one CTA -> FAQ.
No fixed template reuse: this one is ordered as an incident triage sequence, not intro/why/steps/conclusion.

## Kloudbean positioning

Problem is solved completely before the product appears. ONE sentence, in the prevention section, framed as a
practical note: S3-compatible object storage for uploads, automatic backups, uptime monitoring, managed servers
where stack and patching are handled, with the honest caveat that application log rotation is still the
customer's job. All grounded in kloudbean-facts.md. No claim that the product prevents disks filling up.
Then one short CTA at the end ($8/mo entry, verify on the pricing page).

## Internal links (7, all verified to exist)

s3-compatible-object-storage, server-backups-guide, uptime-monitoring, structured-logging-nodejs,
fix-node-app-crashing-on-deploy, server-hardening-checklist, vertical-vs-horizontal-scaling.

## Accuracy notes

- ext4 reserves 5% for root by default (documented default, stated as a default, not a measurement).
- `binlog_expire_logs_seconds = 604800` is 7 days in seconds, correct.
- No invented numbers, percentages, frequencies, benchmarks, or customer stories anywhere.
- Alert threshold given as a judgement range (75 to 80%), not a measured claim.

## Gate

`node _val.mjs fix-out-of-disk-space-server` -> [OK] (hero.png warn expected). 0 em-dashes, HTML code escaped
with `&lt; &gt; &amp;`, JSON-LD Article + FAQPage + Organization (@id kloudbean.com/#organization), 9 FAQ h3
matching JSON-LD names exactly, 3 `.img-slot` spacers with `src -> images/your-file.png` comments,
banned-claim grep clean, .md and .html in sync.
