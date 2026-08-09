# Brief — CSCC Backup and Disaster Recovery: What Saudi Critical Systems Must Prove

Cluster: Saudi / NCA compliance (task #1, third of three). Replaced the originally planned cscc-shared-responsibility-hosting, because nca-ecc-compliant-hosting and pdpl-compliance-hosting ALREADY carry a "what the platform covers / what you own" table and a third would be thin duplication. The shared-responsibility split is instead folded into the pillar plus a section here. NOT interactive.

## CONFIDENTIALITY
Zero client reference. Controls from the PUBLIC CSCC-1:2019 document. Capabilities generic, from the gitignored steering file.

## Grounding — subdomains 2-8 and 3-1 verified against the open document
- 2-8-1-1 online AND offline backups shall cover all critical systems.
- 2-8-1-2 backup within planned intervals per risk assessment; NCA RECOMMENDS daily for critical systems (recommendation, not mandate — stated precisely).
- 2-8-1-3 secure access/storage/transfer of backups and media; protect from destruction, unauthorised access or modification.
- 2-8-2 periodical test at least every THREE MONTHS to determine efficiency of RECOVERING backups.
- 3-1-1-1 disaster recovery centre; 3-1-1-2 critical systems in DR plans; 3-1-1-3 test DR plans at least ANNUALLY; 3-1-1-4 NCA recommends periodical LIVE DR test.
- Cross-referenced 2-6-1-1 / 2-6-1-5 (no prod data in non-prod without masking; no transfer of prod data) as a genuine constraint on how a restore test may be designed. 2-7-1-1 / 2-7-1-2 for backup encryption.

## ORIGINAL VALUE (what competitors' compliance pages miss)
1. The 2-8-2 vs 3-1-1-3 CADENCE TRAP: backup recovery tested quarterly, DR plans tested annually. Widely conflated.
2. Why 2-8-2 exists: backup failure is SILENT (job succeeds while excluding a later-added volume; dump omits a schema; encrypted archive with a lost key). Concrete failure modes, not generic advice.
3. The restore-test compliance conflict: a naive restore test into staging can VIOLATE 2-6-1-1 / 2-6-1-5. Nobody writes this. Advice: isolated recovery, verified, destroyed, coordinated with compliance.
4. Multi-zone HA is NOT a backup, because it replicates mistakes instantly. Three pieces doing three jobs (HA = infra failure, backups = data loss, DR plan = human coordination).
5. Restore duration is your REAL RTO, not the one in the plan document.

## Positioning discipline
- Kloudbean section splits covered vs customer-owned explicitly. Customer keeps: RTO/RPO definition (business decision), the formal DR plan document, retention periods against legal obligations, classification/masking decisions.
- "Managed enterprise engagements" framing throughout, no self-serve implication.
- No SLA, no uptime figure, no exaggeration. "NCA recommends" kept as recommendation.
- Does not claim a DR "centre" product; describes technical DR configuration only.

## Keywords
Primary: **CSCC backup requirements** / **NCA backup disaster recovery Saudi** / **cscc 2-8-2 recovery test**. In H1/title/meta/first 100 words/H2. Secondary: nca daily backup critical systems, cscc disaster recovery centre, quarterly restore test compliance, offline backup requirement saudi, cscc 3-1-1-3 dr test, multi-zone ha compliance.
6 FAQ -> FAQPage JSON-LD.

## Shape (two-subdomain deep dive; distinct from pillar overview and from the logging article's single-subdomain walk)
Lead -> tldr -> the controls table (8 rows, both subdomains) -> online AND offline -> daily as baseline + RPO framing -> THE CONTROL MOST FAIL (2-8-2, silent failure modes, what a passing test looks like, the 2-6-1-1 conflict) -> protecting the backups (6 bullets) -> DR is separate (cadence trap) -> where multi-zone fits and doesn't -> launch-database screenshot -> what Kloudbean covers vs what stays with you -> related reading -> CTA (consultative) -> 6 FAQ.

## Internal links (all verified to exist)
nca-cscc-compliance-guide (same batch), cscc-log-retention-immutable-logs (same batch), server-backups-guide, nca-ecc-compliant-hosting, data-residency-saudi-arabia, vertical-vs-horizontal-scaling, cloud-load-balancer-explained.

## Console screenshots
../assets/console/launch-database.png (managed DB with automatic backups = the starting point). Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid; images resolve; 0 banned blurbs; html/md in sync.
