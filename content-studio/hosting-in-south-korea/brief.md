# Brief: hosting-in-south-korea

## Target keyword
- **Primary:** hosting in South Korea
- Placed in: H1, `<title>`, meta description, first sentence of the lead (first 100 words), and one H2 ("Hosting in South Korea is two questions, not one").

## Secondary keywords (by intent)
- South Korea data residency (residency/legal intent)
- PIPA compliance (legal/compliance intent)
- Seoul server latency (performance intent)
- host in Korea (transactional/decision intent)
- Korea cloud region (technical/where-to-host intent)
- Supporting long-tail woven through body + FAQ: which cloud regions are in Seoul, AWS ap-northeast-2, GCP asia-northeast3, cross-border transfer of personal data, does hosting in Korea make me PIPA compliant.

Volumes are not asserted. No SEMrush/DataForSEO export was supplied for this exact term in-session, so figures are intentionally omitted rather than invented. This is an owner-directed geo vertical (South Korea is a named top customer country / compliance-relevant market in the product-truth files). It is not country-swap thinness: the value is Korea-specific (PIPA at a rule level + trans-Pacific Seoul latency physics), which does not transfer to another country by find-and-replace.

## Cannibalisation check
- No existing Korea or Asia geo slug in content-studio (checked: no hosting-in-*, seoul-*, korea-*, or asia-* folder).
- Distinct from `gcp-dammam-region-guide` (that page is KSA / Dammam me-central2 / PDPL + NCA, and is product-forward). This page is South Korea / Seoul / PIPA and is knowledge-first, so no overlap of intent or region.
- Distinct from `data-residency-explained` (generic concept) which it links to rather than repeats; this page is the Korea-specific application of that concept.

## Information gain (one sentence)
It separates the two reasons people conflate when hosting for Korean users, teaches trans-Pacific vs in-region latency as compounding physics and PIPA as a rule-based shared-responsibility law, and gives a concrete decision table for what must stay in a Korea region versus what can live on the edge.

## Accuracy note
- PIPA is taught at a public, rule-based level only: consent-centric, data-subject rights, breach-notification duties, cross-border transfer conditions, regulator = PIPC. No article numbers, no fines, no dates invented.
- Latency numbers are qualitative / widely-known ballparks (intra-region single digits to low tens of ms; trans-Pacific well over 100 ms, ~120 to 180) and explicitly labelled typical/approximate physics floors, not promises or benchmarks.
- Region codes AWS ap-northeast-2 and GCP asia-northeast3 stated as public facts; no over-claim about which clouds Kloudbean offers in Seoul beyond "can provision a server in a Seoul region across major clouds".
- Compliance framed as "aligned with / supports" and "necessary, not sufficient"; never "certified" or "makes you compliant". Shared-responsibility boundary stated once.
- Product mentions: Kloudbean appears only in the closing "Where to run it" note and the low-key CTA (two light touches). No feature-drop in the body.

## Format
- Geo decision-guide, knowledge-first (mirrors self-host-an-llm tone: teach fully, product only at the very end).
- ~2,000 words. Lead, .tldr, 7 teaching H2s + FAQ H2, 2 comparison tables (latency ranking + what-stays-in-region decision table), one bespoke teaching SVG (two-distance latency diagram), one ping code block, 2 image-slot comments, low-key CTA, 9-question FAQ.
- Internal links (7, all resolve): fix-slow-dns-lookup, data-residency-explained, database-private-access-control, what-is-a-vpc, high-availability-explained, managed-postgresql-hosting, self-host-an-llm.
- JSON-LD: Article + FAQPage; FAQ h3 text == FAQPage name (parity).
