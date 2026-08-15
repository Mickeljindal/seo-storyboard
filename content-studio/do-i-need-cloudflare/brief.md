# Brief: do-i-need-cloudflare

## Angle (knowledge-first decision guide)
"Do I need Cloudflare" is asked as a yes/no, but Cloudflare is a bundle (managed DNS, CDN caching,
DDoS protection, a WAF, SSL). The honest reframe: the real question is which of those you need, and
whether the free plan covers you. Position: for most small public sites the free plan is worth
turning on (managed DNS, basic CDN, a DDoS buffer) with little downside, so it's often worth a try;
you rarely need the paid tiers unless you have a specific WAF, performance, or enterprise need. When
it matters less: an internal tool with no public exposure, or a managed host that already handles
SSL, caching, and basic protection. Genuinely fair to Cloudflare (useful and free at the base). No
metrics, no invented numbers.

## Target keyword
- **Primary:** do I need Cloudflare
- **Secondary:** is Cloudflare necessary, do I need Cloudflare for my website, what does Cloudflare
  do, Cloudflare for a small site, Cloudflare free plan.

Volumes not asserted (owner-directed; intent-grounded decision query). No invented volumes,
percentages, or dollar figures anywhere per owner rule.

## Intent
Informational / decision. A site owner or small team deciding whether to put Cloudflare in front of
their site. Payoff is a clear decision (skip it, free plan, or pay for a specific need), not a
signup.

## Information gain (one sentence)
It separates Cloudflare into its five distinct jobs, maps each feature to the exact need it solves
in a decision table, gives an honest free-vs-paid line, names when to skip it entirely, and offers a
one-minute decision framework, which the generic "just add Cloudflare" answers never do.

## Honesty / fairness
Explicit credit that the free tier is a genuine, useful, no-cost gift for the small web. Explicit
"when you can skip Cloudflare" and "when the paid tiers are genuinely worth it." Closing FAQ states
plainly that Cloudflare does not protect against insecure code, weak passwords, or app logic flaws.

## Product mention (one light touch + CTA, grounded in kloudbean-facts.md)
One light Kloudbean paragraph: free SSL and baseline server hardening (Shorewall + Fail2ban) come
standard; Cloudflare is available as a PAID add-on on any plan and included for Enterprise. Two
explicit accuracy caveats stated in-copy: Cloudflare is NOT unique to Kloudbean (competitors resell
it) and is NOT free for everyone on Kloudbean (paid outside Enterprise). No autoscaling-for-all, no
VPC-as-default, no invented pricing, no uptime guarantee language.

## Cannibalisation check
do-i-need-aws-to-launch-a-saas owns the "do I need AWS" decision (template, different topic). The
four bundle-component explainers already exist and are linked, not duplicated: dns-explained (what
DNS is), cdn-explained (what a CDN does), ddos-protection-explained (how a flood works),
what-a-waf-does (what a WAF blocks). This page owns the higher-level "do I need Cloudflare (the
bundle)" decision and routes to each component page rather than re-explaining them.

## Internal links used (4, all verified with ls before writing)
dns-explained, cdn-explained, ddos-protection-explained, what-a-waf-does.
(CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first decision guide, ~1900 words. .tldr answer-first, 10 H2s (question-style), two
decision tables (feature -> need map; free vs paid tiers), one teaching SVG (request path: visitor
-> Cloudflare edge bundle -> origin server; navy #000f27 / purple #4F1AF3 / green #40b75f), light
CTA, 9-question FAQ mirrored to FAQPage JSON-LD, plus a clean Organization entity block. Near-zero
em-dashes. No metrics.
Cluster: 8 - Infra Concepts.
Byline: "Cloudflare is a bundle, not a yes or no."
