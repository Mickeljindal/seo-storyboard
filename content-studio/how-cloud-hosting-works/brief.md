# Brief — How Cloud Hosting Works (Silo 8 pillar hub)

Silo 8 (Infrastructure concepts). This is the PILLAR/hub for the silo, so it links DOWN to its spokes and out to one money page.

## Keywords (volumes approximate / unverified, hedge in copy)
- Primary: **how cloud hosting works** (informational, high intent for beginners + AI Overviews; approx volume unknown, treat as a head term).
- Secondary / weave: what is cloud hosting, cloud hosting explained, managed cloud hosting, cloud server, how does web hosting work.
- Long-tail / PAA answered in FAQ: how does cloud hosting work in simple terms, what is a cloud server, cloud hosting vs traditional web hosting, cloud hosting vs shared hosting, do I need a load balancer, where is my data stored, how does cloud hosting scale, how reliable is cloud hosting, is my data safe on cloud hosting.
- Placement: primary keyword is in the H1, <title>, meta description, first 100 words (lead), and an H2 ("How cloud hosting works, one hop at a time").

## Intent + angle
Definitive, answer-first explainer of how cloud hosting actually works, structured as an architecture walk-through of one request's lifecycle (DNS -> load balancer -> web server -> app runtime -> managed database -> object storage -> backups) rather than a numbered how-to. Explains the WHY and the tradeoff at each layer. Founder-grade opinions (most small apps never need a load balancer or autoscaling; SQLite is great in dev, wrong in prod; most deploy failures are config, not code). Teach first; Kloudbean grounded lightly and last.

## Shape (no fixed template)
Answer-first TLDR -> concept (what is cloud hosting / cloud server) -> bespoke SVG of the whole path -> the layer-by-layer walk (H3s) -> cross-cutting concerns (SSL/CDN/edge, managed vs unmanaged, scaling, regions/residency, uptime/SLA) -> one-dashboard payoff -> CTA -> 10-question FAQ mirrored into FAQPage JSON-LD.

## Byline (unique, not "Faster Than Ever")
By Kloudbean Infrastructure · From the DNS lookup to the nightly backup, one dashboard holds the whole chain.

## SVG concept (bespoke, unique to this article)
Request-lifecycle / architecture diagram: horizontal pipeline You (browser) -> DNS -> Load balancer -> App server -> Managed DB, with two green downward branches (App -> Object storage, Managed DB -> Automatic backups). A dashed purple VPC box wraps the private back end (app, DB, storage, backups); a "PUBLIC INTERNET" label sits under the front. Brand colors navy #000f27, purple #4F1AF3, green #40b75f. Distinct from the reference (simple 4-box line) and cloud-load-balancer-explained (fan-out to 3 nodes).

## Console screenshots (real, in ../assets/console/)
add-server (provisioning a cloud server), flb-load-balancer (the load-balancer layer), server-health (resource view for scaling), dashboard (whole-stack overview). Plus 4 img-slots (DNS A record, object storage bucket, SSL/edge, region picker). No images/hero.png created here (rendered later by the hero pipeline).

## Internal links (8 total; all target folders verified to exist)
Down to S8 spokes: cloud-load-balancer-explained, what-is-a-vpc, ddos-protection-explained, autoscaling-explained, data-residency-explained, cloud-sla-explained. Cross/managed + money: managed-vs-unmanaged-hosting, best-managed-cloud-hosting.

## Honesty notes / guardrails
- Autoscaling and Kubernetes framed as enterprise/custom only, NOT automatic for standard accounts. Explicitly say most small/mid apps never need autoscaling.
- 7 clouds (AWS, AWS Lightsail, Google Cloud, Linode, Vultr, DigitalOcean, UpCloud); 7 managed DB engines; built-in S3 object storage; built-in Flexible Load Balancer (off by default, on every account); free auto-renewing SSL; automatic backups. All grounded in kloudbean-facts.
- Cloudflare Enterprise edge caching framed as a paid add-on.
- "Managed" = server/stack/SSL/patching/backups handled; you own app code + data. Security is shared responsibility. Linux stacks.
- No customer/geo/CSAT numbers, no enterprise dollar figures, no invented features. Uptime nines cited as arithmetic (99.9% ~= 43 min/mo), not as a Kloudbean SLA %.
- Near-zero em-dashes; humanized voice.
