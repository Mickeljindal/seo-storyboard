# Brief: roll-back-a-deployment-safely

## Target
- **Primary keyword:** roll back a deployment
- **Secondary / long-tail:** revert a deploy, rollback strategy, undo a bad deployment, roll back database migration, blue-green rollback, keep the last good build, forward-compatible migration, roll back vs roll forward, does rolling back lose data, why did my rollback break the app.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no fabricated figures are recorded. Treat as a mid-tail ops/how-to query in the AI-deploy cluster (incident-time intent). Re-pull real Volume + KD before scaling the sub-cluster. Grounding is intent-based, not volume-based (per the SEO OS: relevance over raw volume).

## Reader + business outcome
- **Reader:** someone whose deploy just broke production (often an AI-built or vibe-coded app) and who needs to get back to a working state fast without making it worse or losing user data. Also the developer setting up a deploy process who wants rollback to be possible before they need it.
- **Business outcome:** capture incident-time and process-design intent for the "Deploy AI / Vibe-Coded Apps" cluster, then route to Kloudbean's Git deploy (redeploy a previous build), automatic backups, and staging, landing on the honest managed boundary.

## Intent + format
- **Intent:** informational, ops how-to with an incident-time urgency and a design-time tail (how do I make rollback possible at all).
- **Format:** ops how-to / runbook. Fast path first, then the centrepiece (why schema does not roll back), the expand/contract fix with a code sketch, keep-the-last-good-build, a 3-way comparison table (code vs schema vs backup), a 2am runbook, then grounding and a deep FAQ. Deliberately varied from the reference (which was an architecture walkthrough).

## Organizing idea (information gain, one sentence)
Rolling back code is easy; rolling back a database change is the part that bites, so a safe rollback is really a shipping discipline (expand/contract, keep the last good build), and restoring a backup is a data-losing last resort, not a rollback.

## Cannibalisation check (mandatory)
- `ci-cd-auto-deploy-from-github` owns the Git deploy flow; this page links to it and frames rollback as redeploying the previous build. No overlap on the deploy pipeline itself.
- `migrate-ai-app-sqlite-to-postgres` and `production-database-design-for-ai-apps` own migration mechanics and schema design; linked for the how, not duplicated. This page owns the rollback angle on migrations (why they do not reverse cleanly).
- `server-backups-guide` owns backups/restore; linked and clearly distinguished (restore != rollback, restore loses data since the snapshot).
- `why-ai-apps-fail-in-production` owns the failure catalogue; linked as the map. This page is the specific "get back to safe" playbook.
- `fix-503-after-deploying-your-app` owns the 503 signal; linked as the symptom that often triggers a rollback.
- Decision: distinct intent (safe rollback + reversible shipping), build it. Links across the cluster instead of competing.

## Kloudbean grounding (facts only)
Deploy from Git, so rolling back = redeploying a previous commit/build (framed generally, NOT as a specific one-click instant-rollback product feature). Managed database has automatic backups (used only as last-resort restore). Staging environments available for WordPress and Laravel to catch a bad change before it ships. Honest boundary: managed = server/stack/SSL/backups/patching; the customer owns app code, data, and migration design. No invented numbers, uptime, benchmarks, or customers. No banned claims. No "private networking" default.

## Internal links used (7, all resolve)
Up: last-mile-of-vibe-coding. Across: ci-cd-auto-deploy-from-github, fix-503-after-deploying-your-app, why-ai-apps-fail-in-production, production-database-design-for-ai-apps, migrate-ai-app-sqlite-to-postgres, server-backups-guide. Money: kloudbean.com + /pricing/.

## Original assets
- One bespoke inline SVG (viewBox 0 0 800 400): a two-track deploy timeline. Top track = destructive migration, rollback breaks (old code hits a schema with no column). Bottom track = expand/contract, rollback stays clean (old column still there). Brand navy/purple/green plus a single restrained red for the break state. Teaches the centrepiece, not decoration.
- Expand/contract SQL sketch (add column, write both, backfill, read new, drop old later).
- 3-way comparison table (roll back code vs schema vs restore backup: what it undoes, cost, when).
- Anti-pattern: destructive migration shipped in the same release as the dependent code; "rolling back" by restoring last night's backup and silently wiping a day of data.
- Opinion: the best rollback is the one you designed for before you shipped; expand/contract makes almost every deploy reversible.

## Validation
`node _val.mjs roll-back-a-deployment-safely` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity (9), blurbs=0, internal links resolve, words >= 1400. (hero.png + H2-count warnings acceptable.)
