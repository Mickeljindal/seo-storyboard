# Brief: multi-client-backup-strategy

## Role in the cluster
Silo 6 (Agency). Pillar: hosting-for-agencies-playbook. Across: server-backups-guide, agency-client-
offboarding, how-agencies-host-20-client-apps. Money: cloudways-alternatives.

## Keyword grounding (honest)
Topical-authority + support spoke. Real intent: multi-client backup strategy, agency backup strategy,
backup strategy for multiple websites, how agencies back up client sites, per-client backup retention.
No fabricated volume.

Primary: **multi-client backup strategy**. Secondary: agency backup strategy, backup strategy for
multiple client sites, per-client backup retention, restore testing across many sites.

## Cannibalisation guard
- server-backups-guide owns the GENERAL principle: 3-2-1, off-box, test-the-restore, what-to-back-up.
  This page must NOT re-teach 3-2-1; it links there and assumes it.
- playbook Phase 4 (Media and off-server backups) is a one-section overview.
This page owns the FLEET problem: what changes when it is 20 clients, not one site.

## Information gain (the fleet angle)
Backing up one site is solved. Backing up a fleet introduces problems a single-site guide never faces:
1. Per-client ISOLATION: one client's backup must not contain another's data, and restoring client A
   must never touch client B. A single shared backup blob is a compliance and privacy landmine.
2. Per-client RETENTION: different clients have different needs/contracts, so retention is not one
   global setting; a care-plan client may need longer history than a one-off.
3. Restore testing AT SCALE: you cannot fully test 20 restores every week, so you sample and rotate,
   testing a different client's restore each cycle so every client gets exercised over time.
4. PROVING it to the client: at fleet scale the backup is also a sales/retention artifact; being able
   to say "your last restore test passed on <date>" is worth more than the backup itself.
5. The offboarding tie-in: a client leaving triggers the retention-then-delete rule (link offboarding).

Angle: the-failure-is-invisible (a mixed-client backup blob is fine until a restore leaks), the-fix-is-
structural (per-client isolation retires the class), name-the-tradeoff (test-everything is impossible;
sample-and-rotate).

## Claims (facts files only)
Automatic backups, off-box to S3-compatible object storage (and managed GCS buckets), per-app/per-
client isolation, one dashboard, 7 clouds, Audit Trail (enterprise) for proof. No invented retention
numbers as product facts (retention windows framed as YOUR policy choice). Honest boundary: platform
provides automatic backups + isolation + off-box storage; the schedule, retention policy, and the
restore-test discipline are the agency's.

## Format
Fleet strategy guide. What changes at scale, per-client isolation, per-client retention, the sample-
and-rotate restore drill, proving it to clients, offboarding tie-in, where hosting fits, FAQ. Links
server-backups-guide for the 3-2-1 fundamentals rather than repeating.
