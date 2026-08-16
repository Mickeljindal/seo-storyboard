# Brief: deploy-a-telegram-bot

## Angle (deployment field guide, organised around one architectural decision)
A developer has a working Telegram bot on their laptop and needs it live for real users. Every
generic answer jumps straight to "put it on a VPS." This page instead makes the reader decide the
thing that actually determines their hosting: long polling or webhooks. Everything else (always-on
process, token handling, durable state, supervision) follows from that fork. Written as a field
guide with a triage list, not an intro-steps-conclusion template.

## Target keyword
- **Primary:** deploy a telegram bot
- **Secondary:** telegram bot hosting, host a telegram bot 24/7, telegram bot webhook vs polling,
  always on telegram bot server.

Volumes not asserted (no keyword export supplied for this term; intent is unambiguous and
support-adjacent). No invented numbers anywhere per owner rule.

## Intent
Informational, high implementation intent. The reader has code and needs it running. Payoff is a
working deployment decision plus copy-pasteable commands, not a signup.

## Information gain (one sentence)
It frames Telegram deployment around the polling-vs-webhooks fork that Discord-style bots don't
have, maps each mode to the hosting it forces (no public URL vs a valid HTTPS cert), and names the
two silent failures nobody documents together: 409 Conflict from a half-finished webhook migration
and in-memory conversation state that vanishes on restart with no error.

## Cannibalisation check
`discord-bot-hosting` is the near neighbour. Its H2 set owns: what Discord bot hosting needs, free
tiers dropping the bot, gateway connection, token, a minimal discord.py bot, PM2/systemd, sharding,
cost, deploy steps, logs, honest limits. It has NO polling-vs-webhooks decision, because Discord has
no such fork. This page leads with that fork, adds setWebhook/getWebhookInfo/409 triage and Telegram
Bot API rate-limit behaviour, and links to the Discord page once instead of competing with it.
Overlap on "keep the process alive" is deliberately kept short and framed Telegram-side
(`--update-env`, restart caps), with the depth delegated to pm2-process-manager-guide.

## Honesty / fairness
Explicit concession that a stateless webhook-only command bot is a good fit for a serverless
function or a free tier, with the specific conditions that flip the answer (polling's long-lived
outbound connection, in-memory context, background jobs, no cold-start tolerance). Engineering
opinion stated plainly: use polling until something forces you off it; most bots never need
webhooks. Anti-patterns: token committed to the repo, and a dict in RAM as conversation state.

## Product mention (one touch + one short CTA, grounded in kloudbean-facts.md)
One sentence, placed where the reader's own requirement list creates the need: persistent
Node/Python process under PM2 with no spin-down, free SSL for a valid webhook cert, managed
PostgreSQL/MySQL/Redis with automatic backups, runtime config in the UI, Git deploys from GitHub,
from $8/mo. No VPC/private-networking claim, no autoscaling, no uptime figure, no benchmark.

## Internal links used (7, all verified to exist)
managed-redis-hosting, environment-variables-done-right, secrets-management,
add-managed-database-to-your-app, pm2-process-manager-guide, deploy-node-app-to-managed-cloud,
discord-bot-hosting. (CTA links to kloudbean.com and /pricing/.)

## Format
Field guide, ~2100 words. Answer-first `.tldr`, 10 H2s, one `table.cmp` (polling vs webhooks mapped
to when each wins), one bespoke teaching SVG (direction of connection), three `.img-slot` spacers,
real `curl` / PM2 / Python blocks, a triage list of six real failure signatures, and a 9-question
FAQ mirrored to FAQPage JSON-LD. Near-zero em-dashes. Byline: "A bot that only runs on your laptop
is a demo, not a bot."
