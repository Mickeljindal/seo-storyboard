# Brief — How to Run a Cron Job Without SSH

Slug: run-a-cron-job-without-ssh
Silo: Developer experience / scheduled tasks (capability + how-to). Sibling to pm2-vs-systemd (process/scheduling cluster).
Byline: By Kloudbean Platform · Scheduled Jobs, No Terminal.

## Search intent
Informational + commercial. A developer needs a scheduled task (send emails, prune rows, nightly report, ping an endpoint) and wants to schedule it without SSHing in to hand-edit a crontab. They want cron explained properly AND a no-terminal way to schedule it.

## Keywords (volumes hedged; no precise figures fabricated)
- PRIMARY: "run a cron job without SSH" (low volume, high intent; also the exact-match promise of the page).
  Secondary primaries woven in H1/title/meta/first-100/H2: "schedule a cron job from the dashboard", "cron job without terminal".
- Secondary / mid-tail: cron job UI, scheduled task hosting, crontab syntax explained, cron job logs, cron every 5 minutes, wget/curl cron.
  ("cron job" family and "crontab" carry meaningful, steady search demand; treat as evergreen. Do not cite exact monthly numbers without a real SEMrush/DataForSEO pull.)
- Long-tail / how-to: "run a Laravel scheduler" / "php artisan schedule:run", "Django management command on a schedule", "Node script cron", "node-cron vs system cron", "missed cron job", "what does */5 * * * * mean", "cron job works manually but not on schedule".

## PAA-style questions (mirrored into on-page FAQ + FAQPage JSON-LD)
- How do I run a cron job without SSH?
- What does */5 * * * * mean?
- What timezone does a cron job use?
- Why does my cron job work manually but not on a schedule?
- How do I run the Laravel scheduler with cron?
- Should I use an in-process scheduler (node-cron) or system cron?
- How do I see cron job logs and output?
- How do I stop a cron job from overlapping itself?
- Can I schedule a URL instead of a command?
- Can I run a Django management command on a schedule?

## Angle / shape (avoid the house template)
Teach-first field guide, not Intro -> Step 1..6 -> Conclusion. Order: what cron is + why crontab -e is fragile -> read the five fields (bespoke SVG of */5 * * * *) + common-schedules table -> the gotchas that break jobs (PATH/env, cwd, timezone, overlap/flock, output/logs, the env -i debug trick) -> framework patterns (Laravel single-entry explained, Django management command, Node script, curl a URL) + framework lookup table incl. WordPress pseudo-cron gotcha -> in-process vs system cron decision + honest opinion -> schedule without SSH on Kloudbean (cron-jobs.png) -> honest boundary (cron is not a job queue: no retries/missed-run recovery) -> CTA -> FAQ.

## Original value (competitor can't copy / info gain)
- The "works by hand but not on schedule" root-cause section (env/PATH/cwd/timezone) with the `env -i` reproduction trick.
- Laravel single-entry pattern explained (one every-minute cron -> schedule:run -> Kernel.php), grounded in the real dashboard screenshot showing exactly that command.
- In-process vs system cron with a clear founder opinion: if a duplicate/missed run costs money, keep it in system cron.
- WordPress pseudo-cron gotcha + fix (DISABLE_WP_CRON + real scheduled wp-cron.php hit).
- Cron-is-not-a-queue honesty boundary (retries/dead-letter/fan-out belong to Celery/Sidekiq/BullMQ).

## Visuals
- Hero: images/hero.png (rendered later).
- Bespoke inline SVG: anatomy of */5 * * * * (five labelled fields, */5 highlighted green, explainer banner). Navy #000f27 / purple #4F1AF3 / green #40b75f.
- Real console screenshots: ../assets/console/cron-jobs.png (PRIMARY, scheduling step; caption it) and ../assets/console/add-application.png (once).
- 3 .img-slot spacers (log tail; in-process vs cron; own cron list).

## Internal links (only live slugs; absolute https://www.kloudbean.com/blog/<slug>/)
- what-is-a-managed-server (pillar / up)
- environment-variables-done-right (PATH/secrets gotcha)
- deploy-django-app (Django pattern)
- deploy-express-app (Node process-management side)
- ci-cd-auto-deploy-from-github (Git deploys money/utility page)
(pm2-vs-systemd intentionally NOT linked yet: folder does not exist. Add when published.)

## Kloudbean facts used (grounded in kloudbean-facts.md)
- Cron jobs from the UI, no SSH (changelog Apr 2024). "Since 2024" phrasing.
- Managed server (patched, backed up); Git deploys / managed CI/CD; PM2 multi-process (context for in-process warning).
- Dashboard cron types (PHP script, wget, curl) + Basic/Expert mode + job list: from the real cron-jobs.png screenshot.
- Entry price / trial / migration: CTA feature line only.

## Honesty guardrails / omissions
- Do NOT claim missed-run alerting, automatic retries, or per-run success/failure notifications. Not in facts. Described run history/logs only as far as the visible UI + facts support ("scheduled jobs listed", "log viewer alongside").
- No autoscaling-for-normal-users claim. No invented metrics or benchmarks. No fabricated customer/support story (opinions kept general-true).
- Linux stacks only (PHP/Node/Python/Ruby/Java). No Windows Task Scheduler framing.
- [CONFIRM] items omitted: customer counts, exact SLA %, exact plan prices, Go one-click runtime.
