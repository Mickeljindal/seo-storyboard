# Brief — NCA ECC Compliant Hosting: What the Platform Covers, What You Own

Silo 11 (KSA / MENA) spoke. Bridges to Silo 9 (security & compliance). Links UP to the
KSA pillar (cloud-hosting-saudi-arabia) and across to the S9 shared-responsibility hub
(secure-compliant-hosting), the SOC 2 sibling (soc2-compliant-hosting), the privacy sibling
(pdpl-compliance-hosting), and the residency sibling (data-residency-saudi-arabia).

## Keywords

Primary: **NCA ECC compliant hosting**
Placed in: H1, <title>, meta description, first 100 words (lead), and an H2
("Does 'NCA ECC compliant hosting' actually exist?").

Secondary / long-tail woven through body + FAQ:
- NCA ECC
- Essential Cybersecurity Controls
- National Cybersecurity Authority (Saudi Arabia)
- ECC hosting
- Saudi cybersecurity controls
- ECC compliant / ECC compliance
- NCA ECC vs PDPL (PAA)
- does hosting make me NCA ECC compliant (PAA)
- who needs to comply with NCA ECC (PAA)
- which ECC controls can a host cover (PAA)

Volume note: emerging, low-volume but high-intent regulatory query cluster (Saudi B2B,
gov/enterprise/CNI procurement). No SEMrush/DataForSEO export was available for this exact
topic at write time, so no precise volumes are cited in-copy. If exact numbers are needed,
re-mine via DataForSEO (creds in .env) or a SEMrush export before adding any. Intent is
informational + commercial-investigation (a buyer checking whether a host clears ECC).

## Angle / shape

Security-compliance explainer built on the shared-responsibility model (NOT a how-to
template, and distinct in shape from the PDPL sibling). The reader's real question: "does
hosting make us ECC compliant?" The honest answer (no; it covers the infrastructure-shaped
controls, the governance half is yours) is the spine.
Shape: plain-English "what is NCA ECC" -> "NCA ECC vs PDPL" (security vs privacy) ->
"does ECC compliant hosting exist" (myth-bust) -> control-domain-map SVG + who-does-what
table -> where hosting helps (network/hardening, access, backups, logging) -> the domains
no host can cover (governance/risk/policy/training/incident/third-party) -> in-Kingdom
residency note -> honest certification section -> two-part checklist -> map-not-advice note
-> CTA -> 9-question FAQ.

## Byline

By Kloudbean MENA · "ECC is controls plus the evidence they ran. We harden the
infrastructure; you run the governance." (End byline is a second unique variant.)
NOT "Faster Than Ever".

## SVG concept

Bespoke inline SVG: an ECC CONTROL-DOMAIN MAP, three vertical lanes under a single
NCA ECC header bar. Lane 1 (purple header) PLATFORM PROVIDES = network security, hardening
+ patching, cryptography (TLS), backups + recovery, logging + monitoring. Lane 2 (navy
header) SHARED · CONFIGURE = identity + access, data protection, vulnerability management,
third-party + cloud. Lane 3 (green header) YOUR GOVERNANCE = governance + strategy, risk
management, policies + procedures, awareness + training, incident response. Dashed lane
dividers. Brand navy #000f27, purple #4F1AF3, green #40b75f. Deliberately distinct from the
PDPL two-column split, the S9 defense-in-depth layered stack, and the KSA pillar's
user-to-region topology.

## Console screenshots

- firewall.png (Shorewall + Fail2ban baseline; BitNinja shown LIGHT as an added layer) ->
  network security + hardening
- user-2fa-security.png (2FA + per-user access control) -> identity and access management
- manage-backups.png (automatic, restorable backups) -> resilience + recovery
Plus 3 img-slots (ECC responsibility matrix, the audit-trail/logging view, and the matrix
handout near the table).

## Internal links (absolute, 6)

- UP: cloud-hosting-saudi-arabia (pillar)
- across: pdpl-compliance-hosting (privacy sibling), secure-compliant-hosting (S9 hub),
  soc2-compliant-hosting (S9 sibling), data-residency-saudi-arabia (KSA sibling),
  what-is-a-vpc (private networking concept)
- money page: cloudways-alternatives
All target folders confirmed to exist at write time.

## Honesty guardrails (strict — this is a compliance page)

- NEVER claim Kloudbean is ECC certified / NCA certified / certified, or that it makes the
  reader compliant. Framing everywhere: the platform "provides the infrastructure controls
  that support the ECC"; compliance is shared and ongoing; no certification/attestation
  claimed on the reader's behalf; certs pursued/maintained at most, never "certified".
- NCA ECC = National Cybersecurity Authority Essential Cybersecurity Controls (security
  framework). PDPL (SDAIA) = privacy law. Keep them distinct: ECC = security, PDPL = privacy.
- Control domains that map to infra: network security, hardening/patching, cryptography,
  backups/resilience, logging. Your job: governance, risk, policies, staff/awareness,
  incident response, third-party management.
- Version hedge: ECC-1:2018 referenced; counts/version to be confirmed with the NCA (no hard
  count asserted beyond "more than a hundred controls" / "five main domains" framed loosely).
- In-Kingdom = GCP Dammam (me-central2), the in-Kingdom option among 7 clouds; NOT the only
  KSA region; Kloudbean owns no Saudi data center (provisions on Google Cloud).
- Map, not legal/audit advice (stated in a .note near the end + in FAQ).
- Pricing from $8/mo, Enterprise custom. No customer/geo counts. Linux stacks. BitNinja light.
- Free migration assistance + free trial approved to feature (CTA only).

## Gate

python3 /tmp/validate_article.py nca-ecc-compliant-hosting (expect only images/hero.png
missing, rendered later by the hero pipeline). >=2400 words, JSON-LD Article + FAQPage.
Em-dash prose count 0. Blurb + overclaim grep 0 (incl. is/ecc/nca certified, only cloud
region, exactly one). >=1 <svg>. Keep .html and .md in sync.
