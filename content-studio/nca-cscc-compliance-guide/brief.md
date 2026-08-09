# Brief — NCA CSCC Explained: Critical Systems Cybersecurity Controls in Saudi Arabia

Cluster: Saudi / NCA compliance (task #1, pillar). Fills a total gap: existing KSA pages cover ECC, PDPL, residency, managed-KSA, e-commerce. CSCC, CCC, and DCC were uncovered. NOT interactive.

## CONFIDENTIALITY (non-negotiable)
Zero client reference. No ministry, agency, initials, sector+region+workload combination, engagement, deliverable, or figure. Everything here is sourced from the PUBLIC NCA CSCC document (Sharing Indicator: White / No Restrictions, Classification: Open) plus approved capability statements from .kiro/steering/kloudbean-enterprise-compliance.md (which is gitignored, repo is public).

## Grounding — all control numbers verified against the open CSCC-1:2019 document
- Structure: 4 main domains, 21 subdomains, 32 main controls, 73 subcontrols. Extends ECC-1:2018; continuous ECC compliance is a PREREQUISITE. Most controls phrased "in addition to ECC subdomain X".
- Critical system definition + all 7 identification criteria (national security, Kingdom reputation, >0.01% GDP, >5% population, loss of lives, Top Secret/Secret disclosure, vital sector operations). Identification is the ORGANISATION'S responsibility and the first implementation step.
- Components list (network devices/firewall/IDS-IPS/APT, databases, storage, middleware, servers+OS, applications, encryption devices, peripherals, people, documents).
- Scope: government orgs in Kingdom or abroad (ministries, authorities, establishments, embassies), subsidiaries of government or private orgs. 4-2 applies to orgs using/planning cloud.
- Controls cited: 2-2-1-1 (no remote access from outside KSA), 2-2-1-2, 2-2-1-3 (MFA all users), 2-2-1-8 (no direct DB access except DBAs), 2-3-1-3 (monthly external / quarterly internal patching), 2-3-1-4 (isolated management network), 2-3-1-6 (6-monthly config review), 2-3-1-7 (remove hard-coded/backdoor/default passwords), 2-4-1-1 (segregate/isolate), 2-4-1-2 (6-monthly firewall review), 2-4-1-4 (no wireless), 2-4-1-8 (DDoS), 2-4-1-9 (whitelist only), 2-6-1-1 (no prod data in non-prod without masking), 2-6-1-5 (no prod data transfer), 2-7-1-1/2-7-1-2 (encrypt in transit / at rest file-db-column), 2-8-2 (quarterly restore test), 2-9-2 (monthly vuln assessment), 2-10-2 (6-monthly pen test), 2-11-1-1..5 (logs, FIM, UBA, around-the-clock, log protection), 2-11-2 (18-month retention), 2-12-1-2 (OWASP Top Ten), 2-12-2/2-13-3-1 (min 3 tiers), 3-1-1-1 (DR centre), 3-1-1-3 (annual DR test), 4-1-1-2 (Saudi companies for outsourcing/managed services), 4-2-1-1 (host internally or with CCC-compliant Saudi/government cloud).
- Compliance evaluated by NCA via self-assessment and/or on-site audits.

## Positioning discipline (owner-corrected, Aug 2026)
- Kloudbean capabilities framed as MANAGED ENTERPRISE ENGAGEMENTS on a dedicated cloud account, explicitly "not something you switch on from a self-serve plan". Prevents the $8/mo overclaim.
- GCP Dammam me-central2 named (already public in cloud-hosting-saudi-arabia).
- SOC/SIEM: stated as collaborative, scoped with the client, NOT a fixed package. Matches owner correction.
- CCC: explained as the requirement in 4-2-1-1 only. No claim Kloudbean needs CCC (we don't operate data centres), no assertion about any provider's certification status.
- NO KSA entity claim (planned, not registered). 4-1-1-2 is quoted as a requirement without claiming we satisfy it.
- Explicitly says NO provider can make an org CSCC compliant. That honesty is the trust asset and matches the existing ECC/PDPL page pattern.
- No exaggeration per owner instruction: no "definitive guide", no superlatives, no invented uptime/SLA.

## Keywords
Primary: **NCA CSCC** / **critical systems cybersecurity controls** / **CSCC compliance Saudi Arabia**. In H1/title/meta/first 100 words/H2. Secondary: nca cscc 2019, ecc vs cscc difference, what is a critical system saudi, cscc 4-2-1-1 hosting, cscc log retention 18 months, critical systems hosting saudi arabia.
6 FAQ -> FAQPage JSON-LD.

## Shape (framework explainer, distinct from the ECC page's "what platform covers" shape)
Lead -> tldr (definition + structure) -> CSCC vs ECC relationship -> is your system critical (definition + 7 criteria + components) -> who it applies to -> 4 domains table -> the controls that shape infrastructure (grouped by access/db/network/patching/encryption/data/logging/testing/architecture/resilience) -> the hosting + third-party controls (4-2-1-1, 4-1-1-2) -> what hosting covers vs what it doesn't -> add-server screenshot -> where Kloudbean fits (honest scope notes) -> related reading -> CTA (consultative, not self-serve) -> 6 FAQ.

## Internal links (all verified to exist)
nca-ecc-compliant-hosting, pdpl-compliance-hosting, data-residency-saudi-arabia, cloud-hosting-saudi-arabia, managed-hosting-ksa.

## Console screenshots
../assets/console/add-server.png (provider/region choice = where in-Kingdom gets satisfied). Hero images/hero.png (empty, author drops).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (% spelled out as "percent" in JSON-LD); images resolve; 0 banned blurbs; html/md in sync. CTA is consultative (no $8/mo on a critical-systems page).
