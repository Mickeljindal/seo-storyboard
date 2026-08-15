# Brief: do-i-need-a-cdn

## Angle (knowledge-first decision guide)
The honest answer to a question that gets a reflexive "yes" everywhere. Most "do I need a CDN"
content assumes every site benefits. This page hands the reader the actual decision instead:
whether a CDN helps comes down to two things, where your audience is and how static your content
is. Fair to CDNs (a real "when you clearly need one" section) and fair to the reader who doesn't
(a real "when it barely matters yet" section). The load-bearing lesson: a CDN caches STATIC
content, it does not speed up dynamic per-user responses, so it is not a "make my app fast" button.
No metrics, no invented numbers.

## Target keyword
- **Primary:** do I need a CDN
- **Secondary:** is a CDN necessary, do I need a CDN for my website, when do I need a CDN,
  CDN for a small site, CDN benefits.

Volumes not asserted (owner-directed; intent-grounded decision query). No invented numbers anywhere
(no percentages, no latency figures, no dollar amounts, no PoP counts).

## Intent
Informational / decision. A site owner or developer deciding whether a CDN is worth adding. Payoff
is a clear decision for their situation, not a signup.

## Information gain (one sentence)
It separates static from dynamic content as the real deciding factor, states plainly the one thing a
CDN cannot do (speed up per-user responses), and gives a situation-to-verdict decision table, which
the generic "yes, add a CDN" answers never do.

## Honesty / fairness
Explicit "when a CDN barely matters yet" (small local audience, mostly-dynamic per-user app,
early/low-traffic). Names the common expensive mistake of using a CDN to fix a dynamic-performance
problem. Treats the DDoS buffer as a real but partial side benefit, not a security plan. Never
claims a CDN (or Kloudbean) universally wins.

## Product mention (one light touch + CTA, grounded in kloudbean-facts.md)
Free static site hosting with custom domain + SSL; Cloudflare CDN add-on available (paid on standard
plans, included for Enterprise). Never implies Cloudflare/CDN is Kloudbean-only or free for everyone.
Kloudbean appears once near the end plus the CTA. No invented pricing, no autoscaling, no VPC-as-default.

## Cannibalisation check
cdn-explained owns the mechanics (how a CDN works, caching, TTLs, PoPs); this page owns the DECISION
(do I need one) and links to cdn-explained instead of repeating it. ddos-protection-explained owns
flood defense; cloud-load-balancer-explained owns scaling the origin; s3-compatible-object-storage
and zero-egress-object-storage own storage/egress. This page references those rather than duplicating.

## Internal links used (5, all verified to exist via ls -d content-studio/<slug>)
cdn-explained, ddos-protection-explained, s3-compatible-object-storage, zero-egress-object-storage,
cloud-load-balancer-explained. (CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first decision guide, ~2000 words. .tldr answer-first, 8 content H2s + FAQ, two comparison
tables (static-vs-dynamic cache table, and a situation-to-verdict decision table), one teaching SVG
(static answered at edge vs dynamic still hitting origin), light CTA, 9-question FAQ mirrored to
FAQPage JSON-LD, plus a clean Organization entity block. Near-zero em-dashes. No metrics.
Byline: "A CDN caches static files, it can't speed up your database." Cluster: 8 - Infra Concepts.
