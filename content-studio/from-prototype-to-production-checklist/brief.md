# Brief — From Prototype to Production: The Checklist

Silo 1 (AI builders / deploy to production). Spoke off the pillar `deploy-ai-built-app-to-production`.

## Keywords
- Primary: **prototype to production checklist** (in H1, title, meta description, first 100 words, one H2 "How to use this prototype to production checklist"). Volume/difficulty: not pulled from SEMrush/DataForSEO for this piece; treat as a mid-intent long-tail. Do NOT cite a fabricated volume. Re-mine before asserting numbers.
- Secondary woven in: "AI app production checklist", "take a prototype to production", "ship a vibe-coded app", "production readiness checklist", plus builder names (Lovable, Bolt, Cursor, Replit, v0) and money/intent terms (managed database, object storage, free SSL, automatic backups, Git deploy).
- FAQ mirrors real PAA-style questions: what to check before launch, is my Lovable/Bolt/Cursor app safe as-is, why does my app lose data on deploy, where do secrets go, do I need a load balancer / autoscale, how to add HTTPS, what server size, trustworthy backups, where uploads go, vs staying on the builder's hosting.

## Intent / audience
A builder who has a working AI-generated prototype (Lovable/Bolt/Cursor/Replit/v0) and is about to launch it for real users. They want a concrete readiness checklist before they ship.

## Shape (no fixed template)
Grouped checklist guide. Six sections: Data, Config & secrets, Security, Reliability, Performance, Ops. Each item = Check / Why it matters / Fix. Opens with a lead + tldr + founder note, then a full prototype-default-vs-production-fix comparison table, then the grouped checklist, a prioritization/opinion section, CTA, and a 10-question FAQ. Founder note: a prototype proves the idea; production means state, secrets, security, backups are handled, roughly 80% of the gap.

## Distinct value (the swap test)
Priority weighting (top-four non-negotiables), real failure modes (SQLite wiped on redeploy, committed key scanned by bots, auth checked in UI not server, backups never restored, OOM during build, uploads lost on redeploy), and the one-dashboard consolidation angle. Grounded "we see this" framing only where true.

## Visual
Bespoke inline SVG: prototype-vs-production readiness card, six category rows (Data / Config & secrets / Security / Reliability / Performance / Ops), prototype column = grey hollow markers, production column = green ticks. Brand navy #000f27, purple #4F1AF3, green #40b75f. Unique to this article.

## Images
- Real console screenshots: `../assets/console/launch-database.png` (Data), `env-vars.png` (secrets), `manage-backups.png` (Reliability), `git-deployment.png` (Ops).
- 3 img-slots: auth/security-headers, health-check/monitor, server sizing/resize.
- hero.png rendered later by the hero pipeline (do NOT create it here).

## Internal links (all folders confirmed to exist)
UP: deploy-ai-built-app-to-production. ACROSS: add-managed-database-to-your-app, environment-variables-done-right, server-backups-guide, secure-compliant-hosting, custom-domain-and-ssl-for-your-app, s3-compatible-object-storage, ci-cd-auto-deploy-from-github. MONEY: cloudways-alternatives.

## Byline
By the Kloudbean Platform Team · Notes on what actually stands between a working prototype and a launch real people depend on. (NOT "Faster Than Ever".)

## Honesty guardrails
Linux stacks only. Managed = server/stack/SSL/backups/patching handled, you own app + data. Autoscaling is enterprise/custom, never automatic for standard users. Plans from $8/mo; Enterprise custom (no dollar figure). Compliance shared-responsibility; never "certified". No customer/geo counts, no blurb cliches.
