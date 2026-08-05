# Brief: dns-explained

- **Slug:** dns-explained
- **Silo:** 8 (Infra concepts). Spoke.
- **Pillar (up-link):** how-cloud-hosting-works
- **Shape:** answer-first concept explainer (not the pillar's request-journey, not the sibling's staged pipeline). Distinct section order and diagram so it doesn't read as one template.

## Keywords (grounding)

Volumes are not fabricated here. No SEMrush/DataForSEO export was provided for this slug, so
no specific search volumes are cited. Keyword targets are drawn from the assigned brief and the
questions people actually paste into search. Re-mine before asserting any volume figure.

- **Primary:** "DNS explained" — placed in H1, `<title>`, meta description, first 100 words, and an H2 ("How does DNS work? ...").
- **Secondary / woven:** what is DNS, how does DNS work, DNS records, A record CNAME (the difference), DNS propagation, TTL.
- **Long-tail / PAA answered in FAQ:** what is DNS in simple terms; how does DNS work step by step; A record vs CNAME; what is DNS propagation and why it is slow; what is TTL; why my site shows the old server after changing DNS; what records to point a domain at a server; can I point my domain at a Kloudbean server; why SSL won't issue after DNS setup; is DNS the same as registration/hosting.

## Depth angle (go deeper than the pillar's DNS section without contradiction)

- Pillar already covers: DNS is the phone book, one A record example, TTL = cached seconds, "propagation takes time."
- This article goes deeper: the full recursion (resolver -> root -> TLD -> authoritative + referrals), a real six-record zone snippet, the apex-cannot-be-a-CNAME rule, propagation reframed as caches expiring (not a push), the lower-TTL-before-migration move, and the five classic gotchas.
- Sibling division of labor: custom-domain-and-ssl-for-your-app owns the practical "point domain + issue SSL" steps; this owns the concept. They link across.

## Internal links (6, all folders exist)

- UP: how-cloud-hosting-works
- ACROSS: custom-domain-and-ssl-for-your-app, cloud-load-balancer-explained, fix-ssl-certificate-errors, data-residency-explained
- MONEY: digitalocean-vs-kloudbean

(Plan's other planned siblings cdn-explained and reverse-proxy-explained are NEW/unwritten, so live siblings were substituted.)

## Bespoke SVG

DNS resolution flow: browser -> recursive resolver -> root / TLD / authoritative (numbered 1-7),
IP travels back and is cached, browser connects to server over HTTPS. Brand navy/purple/green.
Unique from the pillar (horizontal request pipeline) and the sibling (vertical staged pipeline).

## Console screenshots

- add-server (the public IP the A record points at)
- ssl-certificate (issues once DNS resolves)
- dashboard (whole stack on one login)
- plus 3 img-slots (dig/nslookup output, registrar DNS panel, propagation checker)

## Byline

By Kloudbean Networking · A name, an IP, and the lookup that quietly connects them. (Not "Faster Than Ever".)

## Fact guardrails used

- DNS concepts general and accurate; no invented behavior.
- Kloudbean: point a domain at your server IP; DNS records live at the registrar, not the console;
  free auto-renewing SSL once DNS resolves; from $8/mo, Enterprise custom; Linux stacks.
- No customer/geo counts. Code escaped in `<pre>` (no raw < > & present).
