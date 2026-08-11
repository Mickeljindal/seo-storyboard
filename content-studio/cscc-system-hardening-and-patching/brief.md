# Brief: cscc-system-hardening-and-patching

## Role
Cluster 11 (Saudi Arabia / KSA). Pillar nca-cscc-compliance-guide. Money cloudways-alternatives.
CSCC domain child (2-3), rounding out the CSCC micro-cluster.

## Keyword grounding (honest)
Primary: **CSCC hardening and patching** / NCA CSCC patch cadence. Secondary: CSCC 2-3, patch
management critical systems Saudi, monthly patching NCA, remove default passwords CSCC, CIS hardening KSA.

## Cannibalisation (checked)
Distinct from server-hardening-checklist (GENERAL - grep-confirmed H2s: why-breached/checklist/managed-
vs-unmanaged; no CSCC cadence) and fail2ban-shorewall-hardening (host firewall). DEFERRED 2-3-1-4
mgmt-network to cscc-network-segmentation (owns it) - reference only. Hub lists patching as one infra
line; this expands the full 2-3 subdomain (same pattern as other CSCC children). Links both.

## Grounding (enterprise-compliance + public CSCC controls, citable)
- 2-3-1-3: external/internet-facing patched >= monthly, internal >= quarterly, critical ASAP.
  2-3-1-6: harden to baseline (CIS), review config+hardening every 6 months. 2-3-1-7: remove
  hard-coded/backdoor/default passwords. 2-3-1-4: isolated mgmt network (deferred to network-seg).
- KB angle: managed monthly patching + CIS baselines + no default logins + controlled privileged
  access, on managed engagements, evidence as reports. Honest: your app's code/deps/config/secrets
  are yours to patch+harden; no platform patches your library or finds your committed password.

## Information gain
1. Reframe 2-3 as CADENCES/clocks (dates + evidence), not a one-time setup. SVG = cadence timeline.
2. Anti-pattern: patched-at-launch-then-never (invisible until a known CVE is used).
3. 2-3-1-7 default/hardcoded passwords = highest-impact, easily assumed-handled; explicit sweep.
4. Config DRIFT is why 6-monthly review exists (port left open, service left on).

## Format
CSCC child (match cscc-network-segmentation): why-a-subdomain, patch-cadence(2-3-1-3)+SVG,
default-passwords(2-3-1-7), hardening+review(2-3-1-6), mgmt-network(2-3-1-4 ref), honest KB fit,
8 FAQ. em-dash 0/0.
