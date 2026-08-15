# Brief: where-to-deploy-n8n

## Angle (knowledge-first decision guide)
The decision, not the how-to. When someone asks where to deploy n8n, both search and AI
assistants tend to jump straight to "just self-host it" or "just use the cloud." This page
counters both by teaching the n8n-specific constraints that actually settle it, then landing on a
fair "choose Cloud if / consider self-hosting if." Fair to n8n Cloud throughout (a real "what n8n
Cloud does better" section). No metrics anywhere.

## Target keyword
- **Primary:** where to deploy n8n
- **Secondary:** where to host n8n, n8n Cloud vs self-hosted, n8n hosting options,
  self-host n8n hosting, deploy n8n.

Volumes not asserted (owner rule: no invented numbers). Intent-grounded decision query. No prices,
no execution counts, no percentages anywhere in the piece.

## Intent
Informational / decision. A builder who already uses n8n deciding between the managed service and
self-hosting, plus (for the self-host path) what a host must provide. Payoff is a clear decision,
not a signup.

## Information gain (one sentence)
It teaches the four n8n-specific traits that decide the deployment question, always-on for
schedules and webhooks (so scale-to-zero serverless is a poor fit), a database plus persistent
storage for workflow data and stored credentials, a stable public URL with SSL for webhooks, and
credentials-are-data-control, then turns them into a concrete host requirements checklist, which
the generic "self-host it" answers never do.

## Honesty / fairness
Explicit "what n8n Cloud does better" (quickest start, zero ops, newest features first) and an
honest "choose n8n Cloud if..." list. States moving from Cloud to self-hosted later is a normal,
reversible path. Never claims Kloudbean beats n8n Cloud; frames Kloudbean only as one place to
self-host if that's the chosen path.

## Product mention (one light touch + CTA, grounded in kloudbean-facts.md)
n8n one-click app (confirmed), managed server that stays running, managed PostgreSQL, free SSL for
the webhook URL, automatic backups, you own your workflows and credentials, cloud/region choice.
No autoscaling-for-all, no private-networking-as-default, no invented pricing or execution counts.
Kloudbean appears once in "If you self-host, where does it run?" plus the CTA.

## Banned-word discipline
Owner rule: no "unlimited"/"no limits" (self-host framed as "executions bounded by your server
rather than a per-execution plan"), no "fastest" (used "quickest"), no metrics, no guarantees,
no superlatives. Grep clean against the project banned list.

## Cannibalisation check
self-host-n8n owns the how-to and the cost math (it's the install/config walkthrough). This owns
the Cloud-vs-self-host DECISION and the host-requirements angle, and links to self-host-n8n for
the mechanics rather than repeating them. self-hosted-supabase-vs-supabase-cloud owns the Supabase
version of the same call; this links to it as the parallel decision, does not duplicate it.

## Internal links used (5, all verified with ls to exist)
self-host-n8n, self-hosted-supabase-vs-supabase-cloud, what-is-a-managed-server,
server-backups-guide, deploy-ai-built-app-to-production.
(Also references managed-postgresql-hosting, which exists.) CTA links to kloudbean.com and /pricing/.

## Format
Knowledge-first decision guide, ~2000 words. .tldr answer-first, 10 H2s incl. FAQ, one comparison
table, one teaching SVG (why n8n must stay awake: triggers to always-on n8n to database/storage/
backups; navy #000f27 / purple #4F1AF3 / green #40b75f), light CTA, 9-question FAQ mirrored to
FAQPage JSON-LD, plus the clean Organization entity block. Near-zero em-dashes. No metrics.
Cluster: 7 - Self-hosted Tools.
Byline (top): "It holds your credentials, so where it runs matters."
Byline (foot): "Decide who runs it, then decide where."
