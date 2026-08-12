# Brief: ssl-tls-explained

**Slug:** ssl-tls-explained
**Cluster / silo:** 8 - Cloud fundamentals (concept explainer, links up to security + hosting pillars)
**Byline:** By Kloudbean Security · The Padlock, Explained.
**Shape chosen:** naming-truth-first explainer (honest one-liner + history table, then what/how/certs/versions/termination/renewal/errors, land on Kloudbean). Deliberately NOT the What/How/Steps template used elsewhere.

## Keywords

**Primary:** SSL vs TLS (also targeting "what is TLS" and "SSL/TLS explained")
- Placed in: H1, <title>, meta description, first 100 words, and an H2 ("SSL vs TLS: the honest one-line answer" + "SSL vs TLS: what to actually remember").

**Secondary / long-tail (woven through body + FAQ):**
- how HTTPS works
- TLS handshake
- SSL certificate / what is an SSL certificate
- TLS 1.2 vs 1.3
- is SSL still a thing / is SSL still used
- certificate authority (CA)
- Let's Encrypt
- TLS termination
- why HTTPS
- chain of trust / trust store
- DV vs OV vs EV
- forward secrecy
- mixed content
- SSL certificate errors (name mismatch, expired, self-signed, incomplete chain)

**Volume/difficulty note:** "SSL vs TLS", "what is TLS", and "what is an SSL certificate" are high-interest, evergreen informational terms with strong long-tail demand and (as broad definitional queries) high competition from vendor docs and encyclopedic pages. Exact SEMrush volumes were not supplied for this run, so no numbers are asserted here. Re-pull from the mined gap data / DataForSEO before quoting specific volume or difficulty figures. Do not fabricate numbers.

## PAA-style questions (answered in body + FAQ)
- What is the difference between SSL and TLS?
- Is SSL still used / is SSL still a thing?
- What is a TLS handshake?
- What is an SSL certificate?
- Who issues SSL/TLS certificates?
- Is TLS 1.3 better than TLS 1.2?
- Do I need to renew my SSL certificate?
- Why does my browser say "Not Secure"?
- What is TLS termination?
- Does Kloudbean include free SSL?

## Internal links used (7, all confirmed to exist)
- https://www.kloudbean.com/blog/reverse-proxy-explained/ (TLS termination)
- https://www.kloudbean.com/blog/fix-ssl-certificate-errors/ (renewal + errors)
- https://www.kloudbean.com/blog/security-headers-guide/ (TLS secures pipe not payload)
- https://www.kloudbean.com/blog/what-a-waf-does/ (payload filtering, same aside)
- https://www.kloudbean.com/blog/what-is-a-managed-server/ (managed responsibility split)
- https://www.kloudbean.com/blog/how-cloud-hosting-works/ (one dashboard / broader context)
- https://www.kloudbean.com/blog/secure-compliant-hosting/ (compliance-friendly hosting, money-ish page)

## Screenshots referenced
- ../assets/console/ssl-certificate.png (free auto-renewing SSL, main proof shot)
- ../assets/console/cloudflare.png (edge TLS/CDN add-on)
- 4 .img-slot placeholders (padlock cert popover, TLS-termination sketch, browser TLS warning, dashboard SSL status)

## Bespoke SVG
- TLS handshake sequence diagram: Client and Server lifelines, 3 purple handshake arrows (ClientHello, ServerHello+cert, key exchange), green encrypted-session band with a two-way arrow. Brand navy/purple/green. Distinct from the reverse-proxy "two proxies" diagram.

## Kloudbean facts used (grounded in kloudbean-facts.md)
- Free auto-renewing SSL, part of the managed stack; TLS terminated at the platform web-server/proxy layer.
- Cloudflare edge TLS/CDN = optional PAID add-on, FREE for Enterprise; baseline free SSL included regardless.
- Managed = server/stack/SSL/backups/patching handled; customer owns app + data. Linux stacks (PHP/Node/Python/Ruby/Java).
- One dashboard for the whole stack; 7 clouds; IP allow-listing; from $8/mo; free migration + free trial (CTA feature line).

## Facts deliberately OMITTED / not asserted (accuracy firewall)
- Did NOT claim Kloudbean specifically uses Let's Encrypt as its CA (not in facts). Let's Encrypt is explained only as general industry context; Kloudbean's line is "free auto-renewing SSL".
- No customer/geo/CSAT numbers, no SLA %, no specific Enterprise dollar figure.
- No invented benchmarks or handshake timings. TLS/SSL version dates and the POODLE-2014 fact are public, well-established protocol history, not Kloudbean claims.
- No BitNinja headline; not mentioned.

## [CONFIRM] items relevant to this topic
- Whether Kloudbean's free SSL is issued via Let's Encrypt (kept general on purpose until owner confirms).
- Exact Cloudflare add-on pricing wording (kept as "optional paid add-on, free on Enterprise").
