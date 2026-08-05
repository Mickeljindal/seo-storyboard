# Brief — ISO 27001 Hosting (honest explainer, ISMS + Annex A mapped)

Cluster 10 (Enterprise & Compliance). Sibling to soc2 / pci / gdpr / hipaa / secure-compliant-hosting.

## Keywords (hedged volumes; verify in SEMrush/DataForSEO before relying on them)
- PRIMARY: **ISO 27001 hosting** / **ISO 27001 compliant hosting** (est. ~500-1.5k/mo, medium-high difficulty; commercial + informational). Placed in H1, `<title>`, meta description, first 100 words, and an H2 ("What ISO 27001 hosting actually requires").
- SECONDARY / long-tail (woven through body + FAQ):
  - ISO 27001 hosting requirements (~200-600, informational)
  - what is ISO 27001 (~10k-30k, high volume, informational; own section + FAQ)
  - ISO 27001 Annex A controls (~300-800, informational)
  - ISMS hosting (~low; concept term, handled honestly)
  - ISO 27001 cloud hosting (~200-600, commercial)
  - is my host ISO 27001 certified (~100-300, question intent)
  - ISO 27001 vs SOC 2 (~1k-3k, comparison intent; own section + FAQ)
- PAA-style questions mirrored into FAQ + FAQPage JSON-LD: Is [host] ISO 27001 certified? / What is ISO 27001? / Does hosting make my company certified? / ISO 27001 vs SOC 2? / What controls does ISO 27001 need from hosting? / What is an ISMS? / What is Annex A? / Do the tier-1 clouds hold ISO 27001? / How long does it take? / Is it required by law?
- Volumes are estimates and hedged. Do NOT publish precise numbers as fact; re-pull if a decision hangs on them.

## Audience & intent
Developers and founders selling to enterprises or government, whose customers or deals ask "are you ISO 27001?" They're googling what the standard actually requires of hosting and whether a host can make them certified. Intent: understand the standard + evaluate infrastructure. Trust-building, careful, not lead-baiting.

## Format (non-templated; distinct from siblings)
Honest explainer built around the ISMS-vs-server distinction and the layered shared-responsibility model. Distinct hook vs siblings: "the certification is about your organization, not your server", plus the two-separate-certifications idea (provider infra layer vs your ISMS). Flow: lead (the procurement-email question) -> tldr -> what ISO 27001 actually is (ISMS, accredited audit, Annex A, SoA) -> what ISO 27001 hosting requires (Annex A areas -> generic controls table) -> shared responsibility table.cmp + bespoke layered SVG -> ISO 27001 vs SOC 2 clarifier -> how Kloudbean maps to Annex A (support, never "makes compliant") -> 6 numbered practical steps w/ real screenshots -> not-legal-advice note -> "so is my host ISO 27001 certified?" wrap -> honest CTA -> 10-question FAQ + JSON-LD.

## Screenshots (real, from ../assets/console/)
subusers-uac.png (access control), ssl-certificate.png (cryptography in transit), firewall.png (operations security), manage-backups.png (backup/availability). Plus 3 .img-slot placeholders (Statement of Applicability, audit-trail export, risk register).

## CRITICAL honesty boundary (compliance topic — do not cross)
- NEVER claim Kloudbean is ISO 27001 certified. The word "certified" is NEVER applied to Kloudbean anywhere in the copy. ISO 27001 is a real certification, but it certifies an ORGANIZATION's ISMS; Kloudbean holding it is NOT in the confirmed facts.
- It IS true and citable that tier-1 cloud providers (AWS, Google Cloud) hold ISO 27001 at the data-center / infrastructure level. Framed explicitly as the PROVIDER layer, separate from the customer's own ISMS certification.
- Compliance is SHARED: platform + cloud = infrastructure controls + evidence for the infra layer; customer owns the ISMS, risk assessment/treatment, policies, staff training, access governance, and the scope + audit of THEIR certification. Kloudbean "supports" / "maps to" Annex A, never "makes you certified".
- Audit Trail = ENTERPRISE only (immutable, searchable, account-wide, CSV export). No per-app audit-logging claim for all tiers.
- Encryption at rest is NOT claimed as a Kloudbean feature (only encryption in transit / free SSL is confirmed); at-rest framed as the customer's app/db-level decision.
- No SLA %, no customer/country counts, no fabricated attestations or audit reports. Avoid the literal phrase "is certified".

## Kloudbean facts used (ground truth only)
Access control (subusers + UAC per-resource/per-action; IP Access Control CIDR; HttpOnly sessions; Basic Auth gate; social login) · encryption in transit (free SSL) · Shorewall + Fail2ban · private networking / VPC · automatic backups · 7 managed DB engines w/ controlled access + backups · tier-1 clouds incl. AWS + GCP (ISO 27001 at the data-center level) · Cloudflare paid add-on (free enterprise) · Enterprise Audit Trail + VPC + k8s/custom + in-house infra/DevOps team for enterprise & government · managed model (infra/stack/SSL/backups/patching handled; you own app + data + your ISMS) · free trial + free migration · from $8/mo.

## Internal links (absolute /blog/<slug>/, verified slugs only — 8 total)
user-access-control-explained, what-is-a-vpc, server-backups-guide, soc2-compliant-hosting, pci-compliant-hosting, gdpr-compliant-hosting, hipaa-compliant-hosting, secure-compliant-hosting.

## Byline (unique, NOT "Faster Than Ever")
"By Kloudbean Security" · tagline "Security you can evidence".

## Voice
Measured, trustworthy, careful (compliance topic). Near-zero em-dashes in body prose. Contractions, direct "you", varied sentence length, one founder opinion (the pain is the ISMS, not the infra) and one anti-pattern (treating hosting as a certification shortcut / "ISMS hosting" as a product). Facts and positioning never softened for voice.

Slug: iso-27001-hosting. Target length 2300-2700 words.
