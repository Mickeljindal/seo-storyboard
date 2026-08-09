# Brief — Critical Systems Hosting Checklist: Preparing Infrastructure for an NCA Review

Cluster: Saudi / NCA compliance (task #2). The practical/utility page of the CSCC cluster and the natural hub that links the three deep dives. NOT interactive.

## CONFIDENTIALITY
Zero client reference. All controls from the PUBLIC CSCC-1:2019 document. Capabilities generic, from the gitignored steering file. NOTE for future greps: "optimisation" contains the string "misa" -> false positive.

## ORIGINAL VALUE (the reason this beats every other compliance checklist online)
The EVIDENCE column. Every other CSCC/ECC checklist lists controls. This one pairs each control with the dated artefact an auditor actually asks for (patch history per host, dated access-review records, firewall review output, restore-test records including duration, retention setting PLUS a successful retrieval of a >12-month-old event, MFA enrolment coverage report rather than "the feature is enabled").
Second original insight, stated in the FAQ and the closing byline: the recurring gaps are CALENDAR problems, not engineering problems. The four that actually fail are the 3-monthly access review, the 3-monthly restore test, the 6-monthly firewall/hardening reviews, and log retention silently reverting to a shorter cloud default.
Third: a consolidated cadence list in one FAQ answer (3-monthly access review + restore test, monthly vuln + patching, 6-monthly firewall/hardening/pentest, annual DR + CSCC review, 3-yearly independent review). Nobody assembles these in one place.

## Grounding — every control number verified against the open document
Section 1 access: 2-2-1-1, 2-2-1-2, 2-2-1-3, 2-2-1-4, 2-2-1-5, 2-2-1-6, 2-2-1-7, 2-2-2 (3-monthly access review).
Section 2 network: 2-4-1-1, 2-4-1-9, 2-4-1-2, 2-4-1-4, 2-4-1-8, 2-3-1-4, 2-4-1-6.
Section 3 encryption: 2-7-1-1, 2-7-1-2, 2-3-1-5, 2-7-1-3.
Section 4 hardening: 2-3-1-3, 2-3-1-6, 2-3-1-7, 2-3-1-1 (whitelisting), 2-3-1-2 (endpoint protection), 2-3-1-8.
Section 5 database: 2-2-1-8 (incl. the "consideration" wording about limiting DBA visibility of classified data).
Section 6 logging: 2-11-1-1..5, 2-11-2.
Section 7 backup/resilience: 2-8-1-1, 2-8-1-2, 2-8-1-3, 2-8-2, 3-1-1-1, 3-1-1-2, 3-1-1-3.
Section 8 testing: 2-9-2, 2-9-1-1, 2-9-1-2, 2-9-1-3, 2-10-2, 2-10-1-1, 2-10-1-2.
Section 9 app/data: 2-12-2, 2-13-3-1, 2-12-1-2, 2-12-1-1, 2-6-1-1, 2-6-1-5, 2-6-1-2, 2-6-1-3, 2-6-1-4.
Customer-owned: 1-2-1-1 (annual risk assessment), 1-2-1-2 (MONTHLY risk register review), 1-4-1 (annual CSCC review), 1-4-2 (independent review every 3 years), 1-5-1-1 (screening/vetting), 1-5-1-2.

## Positioning discipline
- "Managed enterprise engagements" framing; explicitly NOT a self-serve plan.
- Explicit "no provider can make an organisation compliant".
- SOC/SIEM = collaborative, client-scoped, not a fixed package (owner correction).
- 1-5-1-2 referenced by number only, NOT quoted (it concerns Saudi national staffing; quoting it would invite an unverifiable claim about our own staffing). Deliberate.
- No CCC claim, no KSA entity claim, no SLA, no exaggeration.
- Consultative CTA, no $8/mo on a critical-systems page.

## Keywords
Primary: **critical systems hosting checklist** / **NCA CSCC checklist** / **CSCC audit preparation**. In H1/title/meta/first 100 words/H2. Secondary: nca compliance evidence, cscc control checklist, saudi critical systems audit, cscc review cadence, what evidence nca audit, cscc infrastructure controls.
6 FAQ -> FAQPage JSON-LD.

## Shape (checklist/utility page; deliberately different from the pillar overview and the two single-subdomain deep dives)
Lead -> tldr (9 areas) -> how to use this (configured vs evidenced) -> 9 numbered control sections with inline evidence notes -> add-server screenshot -> the items hosting cannot close for you -> where Kloudbean fits -> related reading (hub links to all three deep dives) -> CTA -> 6 FAQ.

## Internal links (all exist or same-batch)
nca-cscc-compliance-guide, cscc-log-retention-immutable-logs, cscc-backup-disaster-recovery, database-private-access-control (same batch), nca-ecc-compliant-hosting, pdpl-compliance-hosting, data-residency-saudi-arabia, security-headers-guide.

## Console screenshots
../assets/console/add-server.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid; images resolve; 0 banned blurbs; html/md in sync.
