# Brief: fix-pm2-not-found-after-deploy

Cluster: PM2 / Node deployment error field guide. Intent: informational, urgent (a deploy script is failing).
Format: cause-diagnosis field guide with a proof step, not a reinstall tutorial.

## Angle / information gain
"This is a PATH problem wearing an install costume." The reason `pm2` works when you SSH in but fails inside
a deploy script or cron job is that interactive login shells load a different environment than
non-interactive ones, so a Node version manager initialised in `.bashrc` never runs and the global binary
isn't on `PATH`. Stating that first matters, because everyone's instinct is to reinstall PM2, which cannot
help. Competing pages lead with the reinstall.

Second differentiator: a proof step before any fix. `which pm2`, `command -v pm2`, `npm root -g`, `npm bin -g`,
`echo $PATH`, and `sudo -u <user> -i which pm2` establish *whose* environment is broken, which turns guessing
into a decision.

## Keywords
- **Primary:** pm2 command not found (in H1, `<title>`, meta description, first 100 words, and an H2).
- **Secondary / woven:** pm2 not found after deploy, pm2 not found cron, pm2 PATH, sh: pm2: not found,
  pm2 command not found ubuntu, pm2 startup node version.
No volume or difficulty figures supplied for this term, so none are asserted (owner rule: never invent volumes).

## Intent
Informational, high implementation intent. The reader has a broken deploy and needs the cause, not a rewrite.

## Shape (deliberately not intro/steps/conclusion)
Interactive vs non-interactive shells are not the same machine -> prove whose environment is broken -> the four
causes in suspicion order -> fixes, most robust first -> engineering opinion -> anti-pattern -> the reboot trap
(`pm2 startup`, `pm2 save`, Node version changes) -> when it isn't PATH at all -> where this class of bug comes
from -> FAQ. 10 H2s, 9-question FAQ mirrored to FAQPage JSON-LD.

## Causes and fixes covered
Causes: PM2 installed for a different user than the one running the deploy (installed as your user, deploy runs
as root or a deploy user), installed under a Node version manager whose shims aren't on the non-interactive
PATH, a cron or CI step with a minimal PATH, and PM2 installed locally in the project rather than globally.
Fixes ranked by robustness: absolute path to the binary, `npx pm2` for a local copy, setting PATH explicitly
inside the deploy script, or installing globally for the user that actually runs it. Also the reboot trap:
`pm2 startup` generates a unit referencing a specific Node path, so switching Node versions breaks resurrection,
and `pm2 save` is what persists the process list.

## Accuracy / safety
- `sudo npm install -g` is not offered as a blanket fix without noting the user-ownership issue it creates.
- Running the app as root is not recommended as a solution. No `chmod 777` anywhere.
- No invented numbers or frequencies.

## Opinion + anti-pattern (required beats)
- Opinion: never rely on an interactive shell's PATH inside automation; use absolute paths or set PATH explicitly.
- Anti-pattern: reinstalling PM2 repeatedly, then sourcing a version manager inside a non-interactive script and
  creating a second, subtly different environment.

## Product mention (one, at the point of need)
One paragraph in "Where this class of bug comes from": the whole class arises from hand-rolled deploy scripts and
environment drift, so a managed deploy that runs the app under a process manager and streams the build log removes
the guessing about which shell and which user ran what. Grounded facts only: applications run persistently under
PM2 as part of the platform, managed CI/CD from a Git repo with deployment history and live build logs, runtime
configuration for Node in the UI, cron jobs from the dashboard without SSH. Then one short CTA. No banned
superlatives, no uptime figure, no customer counts.

## Cannibalisation check
`pm2-app-keeps-restarting` owns the crash loop (min_uptime, max_restarts), `pm2-process-manager-guide` owns
general PM2 usage, `pm2-vs-systemd` owns the supervisor choice, `fix-node-app-crashing-on-deploy` owns boot-time
crashes, `run-a-cron-job-without-ssh` owns scheduled jobs. This page owns `pm2: command not found` and the
PATH/environment class of failure only, and links to those instead of repeating them.

## Internal links (7, all verified to exist)
pm2-process-manager-guide, pm2-app-keeps-restarting, pm2-vs-systemd, fix-node-app-crashing-on-deploy,
ci-cd-auto-deploy-from-github, run-a-cron-job-without-ssh, deploy-node-app-to-managed-cloud.
(CTA links kloudbean.com and /pricing/.)

## Gate
`node _val.mjs fix-pm2-not-found-after-deploy` -> [OK] (hero.png warn expected). 0 em-dashes both files,
0 blurbs, Article + FAQPage + clean Organization block (@id https://kloudbean.com/#organization), FAQ h3 parity
with JSON-LD names, HTML code escaped with `&lt; &gt; &amp;`, img-slot spacers with `src -> images/your-file.png`
comments, banned-claim grep clean, .md and .html in sync.
Byline: "By Kloudbean Engineering · Written after too many deploy scripts that worked in a terminal and nowhere else."
