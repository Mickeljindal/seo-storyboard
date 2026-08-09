# Brief — CSCC Remote Access: No Access From Outside the Kingdom, and What That Means

Cluster: Saudi / NCA compliance (task #2). Replaced the planned in-kingdom-hosting-saudi-arabia pillar. NOT interactive (one inline SVG access-path diagram).

## WHY THE PLANNED PILLAR WAS DROPPED
in-kingdom-hosting-saudi-arabia would have cannibalised the existing cloud-hosting-saudi-arabia, which is already subtitled "Keeping Your Data In-Kingdom" and whose H2s already cover: why host inside the Kingdom, the shape of in-Kingdom hosting, the GCP Dammam me-central2 region, PDPL/SDAIA/NCA ownership split, latency to Riyadh and Jeddah, and how to launch. data-residency-saudi-arabia covers the residency mechanics on top of that. A third page on the same concept is thin duplication and keyword cannibalisation. The slug should also be removed from SILO-PLAN-AND-ROADMAP.md and INTERNAL-LINKING-MAP.md.

## CONFIDENTIALITY
Zero client reference. Controls from the PUBLIC CSCC-1:2019 document. Capabilities generic, from the gitignored steering file. (Grep note: "optimisation" contains "misa" -> false positive.)

## Grounding — the access-control cluster, all verified
2-2-1-1 (PROHIBIT remote access from outside KSA), 2-2-1-2 (restrict from inside, verify each attempt BY THE SOC, continuously monitor), 2-2-1-3 (MFA all users), 2-2-1-4 (MFA privileged + on systems managing critical systems), 2-3-1-4 (isolated management network workstations, separated from email/internet), 2-3-1-5 (encrypt non-console admin traffic), 2-4-1-4 (no wireless for critical systems), 2-5-1-1 (mobile access prohibited except temporary, after risk assessment + cybersecurity function approval), 2-5-1-2 (full disk encryption on approved mobile devices), 2-2-2 (access rights reviewed every 3 months). Cross-refs: 2-11-2 (retention for session logs), 2-11-1-4 (same SOC boundary), 4-1-1-2 (Saudi companies), 1-5-1-2 (staffing, referenced by number only), 2-6-1-1 (masking, why dev workflow must work without prod data).

## ORIGINAL VALUE (competitors do not write any of this)
1. "Geographic prohibition is an ARCHITECTURE problem, not a policy one" with a 4-layer enforcement model, and the HONEST admission that network-origin location enforcement is not flawless (an in-Kingdom relay defeats it), which is exactly why 2-2-1-2 asks for per-attempt verification rather than a one-time config. Also flags split tunnelling and third-party remote support tools as the forgotten second path.
2. THE OFFSHORE TEAM PROBLEM. The genuinely consequential business insight: an offshore team can develop against non-production but cannot reach production; production access, deploy approval, incident response, and DBA work must sit with people who can lawfully connect; emergency access paths must be designed up front ("an incident at 2am is the worst time to discover the only person who can reach the system is in another country"); and the dev workflow must function without production data. Nobody connects 2-2-1-1 to team structure like this.
3. Bastion rationale explained by mechanism (phishing link opened on the same machine that holds the privileged credential), not just named.
4. Notes CSCC never uses the word "bastion" but the surrounding controls make it the standard answer. Precise rather than overstated.

## Positioning discipline
- SOC verification boundary handled honestly: infra can log/alert/retain; verification is human, needs a rota. SOC/SIEM = collaborative, client-scoped (owner correction).
- 1-5-1-2 referenced by number only, never quoted, to avoid an unverifiable claim about our own staffing.
- No KSA entity claim, no CCC claim, no SLA, no exaggeration.
- Kloudbean section splits infra vs organisational explicitly. Consultative CTA.

## Keywords
Primary: **CSCC remote access** / **remote access outside Saudi Arabia prohibited** / **CSCC 2-2-1-1**. In H1/title/meta/first 100 words/H2. Secondary: vpn bastion compliance saudi, jump server nca, offshore team saudi critical system, mobile device access critical systems, isolated management network 2-3-1-4, quarterly access review cscc.
6 FAQ -> FAQPage JSON-LD.

## Shape (access-architecture piece; distinct from the other four in the cluster)
Lead -> tldr -> controls table (10 rows) -> geographic prohibition as architecture (4 layers + 2 honest caveats) -> bastion pattern + isolated mgmt network -> SVG access-path diagram (blocked from outside; VPN -> bastion -> system) -> SOC verification requirement + boundary -> mobile devices and wireless -> THE OFFSHORE TEAM PROBLEM -> how to evidence it -> add-server screenshot -> where Kloudbean fits -> related reading -> CTA -> 6 FAQ.

## Internal links (all verified to exist)
nca-cscc-compliance-guide, critical-systems-hosting-checklist, database-private-access-control, cscc-log-retention-immutable-logs, what-is-a-vpc, data-residency-saudi-arabia.

## Console screenshots
../assets/console/add-server.png. Hero images/hero.png (empty). Inline SVG in brand colours with red for the prohibited path.

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid; images resolve; 0 banned blurbs; html/md in sync (.md describes the SVG in prose).
