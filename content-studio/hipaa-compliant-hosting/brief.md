# Brief — HIPAA Compliant Hosting (honest explainer, safeguards-mapped)

Cluster 10 (Enterprise & Compliance). Sibling to soc2 / pci / gdpr / secure-compliant-hosting.

## Keywords (hedged volumes; verify in SEMrush/DataForSEO before relying on them)
- PRIMARY: **HIPAA compliant hosting** / **HIPAA-compliant hosting** (est. ~1.5k-3k/mo, medium-high difficulty; commercial + informational). In H1, <title>, meta description, first 100 words, and >=1 H2.
- SECONDARY / long-tail (weave through body + FAQ):
  - HIPAA hosting requirements (~300-800, informational)
  - PHI hosting (~100-400)
  - HIPAA cloud hosting (~400-1k, commercial)
  - is my hosting HIPAA compliant (~100-300, question intent)
  - HIPAA BAA hosting (~100-300, commercial)
  - healthcare app hosting (~200-600, commercial)
  - HIPAA safeguards infrastructure (~low; concept term)
- PAA-style questions mirrored into FAQ + FAQPage JSON-LD: Is [host] HIPAA compliant? / Is there an official HIPAA certification? / Does HIPAA require a BAA? / What makes hosting HIPAA-ready? / Is encryption required for PHI? / Can any host make my app HIPAA compliant? / What is PHI? / Where should PHI live? / Do small startups have to follow HIPAA? / most common HIPAA mistake.
- Volumes are estimates and hedged. Do NOT publish precise numbers as fact; re-pull if a decision hangs on them.

## Audience & intent
Developers and founders building US healthcare / telehealth / health-tech apps that handle PHI, googling whether their hosting is HIPAA-compliant and what that even requires. Intent: understand obligations + evaluate infrastructure. Trust-building, not lead-baiting.

## Format (non-templated; distinct from siblings)
Honest explainer built around the three Security Rule safeguard categories (administrative / physical / technical) + the shared-responsibility split. Distinct hook vs siblings: "there is no official HIPAA certification" + the addressable-vs-required encryption nuance. Lead = the sprint-stopping question ("is our setup HIPAA-compliant?"). Then tldr, safeguards mapping (with technical-safeguard table), shared-responsibility table.cmp, bespoke SVG (PHI flow + platform-vs-you lanes), Kloudbean controls mapping ("support", never "makes compliant"), 7 numbered practical steps w/ real screenshots, not-legal-advice note, "so is my hosting HIPAA compliant?" wrap, honest CTA, 10-question FAQ + JSON-LD.

## Screenshots (real, from ../assets/console/)
ssl-certificate.png (encryption in transit), subusers-uac.png (access control), firewall.png (hardening), manage-backups.png (backups/availability). Plus 3 .img-slot placeholders (PHI data-flow map, log-scrubbing config, BAA/vendor tracker).

## CRITICAL honesty boundary (compliance topic — do not cross)
- HIPAA has NO official certification. The word "certified" appears NOWHERE. Never call any host "HIPAA certified".
- Do NOT promise or state that Kloudbean signs a BAA. BAAs framed generically: a HIPAA app needs a BAA with every vendor touching PHI; confirm availability with the provider directly. Never assert Kloudbean offers one.
- Compliance is SHARED: platform = infrastructure controls; customer = app code, PHI handling, policies, workforce training, BAAs, risk analysis. Kloudbean "supports" a HIPAA-aligned setup, never "makes you compliant".
- Audit Trail = ENTERPRISE only (immutable, searchable, account-wide, CSV export). No per-app HIPAA audit logging claim for all tiers.
- No SLA %, no customer/country counts, no fabricated attestations. Encryption at rest is NOT claimed as a Kloudbean feature (only encryption in transit / free SSL is confirmed); at-rest framed as the customer's app/db-level decision.

## Kloudbean facts used (ground truth only)
Access control (subusers + UAC per-resource/per-action; IP Access Control CIDR; HttpOnly sessions; Basic Auth gate; social login) · encryption in transit (free SSL) · private networking / VPC · automatic backups · Shorewall + Fail2ban · 7 managed DB engines w/ controlled access + backups · tier-1 clouds (AWS, GCP) physical layer · Cloudflare paid add-on (free enterprise) · Enterprise Audit Trail + VPC + k8s/custom + in-house infra/DevOps team for enterprise & government · managed model · free trial + free migration · from $8/mo.

## Internal links (absolute /blog/<slug>/, verified slugs only)
user-access-control-explained, what-is-a-vpc, server-backups-guide, what-a-waf-does, soc2-compliant-hosting, pci-compliant-hosting, gdpr-compliant-hosting, secure-compliant-hosting. (8 links.)

## Byline (unique, NOT "Faster Than Ever")
"By Kloudbean Security" · tagline "Built for regulated workloads".

## Voice
Measured, trustworthy, less jokey than other clusters (it's a compliance topic). Near-zero em-dashes in body prose. Contractions, direct "you", varied rhythm, one founder opinion + one anti-pattern (PHI leaking into logs/URLs/error trackers). Facts and positioning never softened for voice.

Slug: hipaa-compliant-hosting. Target length 2300-2700 words.
