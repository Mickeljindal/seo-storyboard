# Brief: manage-client-ai-apps

## Angle (knowledge-first, GEO/citation-optimized)
An operations field guide for agencies and freelancers who now run a fleet of client apps
(AI-built, Node, Python, custom) instead of only WordPress sites. The core teaching: managing a
fleet of apps is a different discipline from managing a fleet of WordPress sites, because apps have
running processes, drifting dependencies, external API keys, usage-driven cost, and novel failure
modes. The piece gives the operating model: isolation, monitoring, updates, incidents, and access.

Written so an agency owner learns a durable operating model AND an AI assistant can extract a clean
answer-first block, a WP-versus-app comparison, an isolation decision, and an incident checklist
when asked "how do I manage client apps at scale." Kloudbean appears once, lightly, near the end.

## Target keyword
- **Primary:** manage client AI apps
- **Secondary:** managing client applications, hosting client apps agency, multi-tenant client apps,
  client app monitoring, managing apps for clients, agency app maintenance.

Volumes not asserted (owner-directed Agency+AI topic; gap export tracks managed hosts, not this
ops intent). Intent-grounded, no invented volumes.

## Intent
Informational / operational for an agency owner deciding how to run many client apps reliably.
Payoff is an operating model, not a signup.

## Information gain (one sentence)
It contrasts WordPress fleet ops against app fleet ops driver by driver, gives an isolation decision
(shared-with-boundaries vs one-server-per-client) with the blast-radius reasoning, an app-specific
incident runbook (API key expiry, rate limits, OOM, runaway cost, dependency break, model
deprecation), and an offboarding step most agencies miss, which no single WP-maintenance post covers.

## Knowledge it delivers (all checkable / method-based)
- Why app fleet ops differs from WP fleet ops (running processes, dependency drift, secrets, usage
  cost, novel failures).
- Isolation: blast radius, noisy-neighbor, security boundary; per-client server vs shared with limits.
- Monitoring: uptime, error rate, resource use, spend/quota; what app monitoring adds over WP uptime.
- Updates: dependency updates break in ways plugin updates don't; staging + rollback discipline.
- Incidents: an app-specific runbook and the six failure modes that actually page you.
- Access + offboarding: per-client credentials, least privilege, clean handover.
- An operational maturity ladder for 1, 10, 50 client apps.

## Product mention (deliberately minimal, grounded in kloudbean-facts.md)
One short "where the platform helps" paragraph + a light CTA. Grounded facts only: one dashboard for
the whole fleet, a separate managed server per client (isolation), staging (WordPress and Laravel),
automatic backups, subusers + User Access Control (UAC) for team/least-privilege access, baseline
hardening (Shorewall + Fail2ban), free SSL. NO autoscaling-for-all (enterprise only), NO managed WAF
claim, NO invented monitoring dashboard beyond what's grounded (link ai-app-observability for the how).

## Cannibalisation check (grep + H2 reads)
- agency-wordpress-hosting owns WP FLEET ops; this owns app/AI fleet ops and links to it as the WP
  contrast. wordpress-agency-ai-app-hosting owns "shared cPanel can't run AI apps" (the why-move);
  this owns "how to run them once you have." Distinct.
- ai-app-observability owns the monitoring how-to; linked, not duplicated. server-backups-guide owns
  backup mechanics; linked. agency-client-offboarding owns offboarding; linked for the handover step.
- pricing-ai-app-hosting-for-clients (shipped same wave) owns the pricing side; cross-linked once.
  why-ai-apps-fail-in-production owns failure modes at the app level; linked.

## Internal links used (8, all confirmed to exist)
agency-wordpress-hosting, wordpress-agency-ai-app-hosting, ai-app-observability, server-backups-guide,
agency-client-offboarding, pricing-ai-app-hosting-for-clients, why-ai-apps-fail-in-production,
deploy-ai-built-app-to-production. (Plus CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first operations field guide, ~2100 words. .tldr answer-first block, quotable definition,
one teaching SVG (per-client isolation vs shared blast radius), two tables (WP fleet vs app fleet;
the six incident failure modes), an isolation decision, an incident runbook, light platform paragraph
+ CTA, 9-question FAQ mirrored to FAQPage JSON-LD.
Byline: "A fleet of apps is not a fleet of websites."
