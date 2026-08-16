# Brief: build-a-saas-with-stripe-payments

## Angle (architecture and correctness guide, not a tutorial)
Almost every "add Stripe to your SaaS" page on the web is a code-copy tutorial: create a session,
redirect, done. The thing that actually breaks in production is *state*, not the charge. So this
page is organised around the failure surface: webhook-as-source-of-truth, raw-body signature
verification, idempotency under retries, what you persist locally, and the subscription state
machine. Shape is a correctness guide with an explicit anti-pattern section, not Step 1..6.

## Target keyword
- **Primary:** build a saas with stripe payments
- **Secondary:** Stripe subscription billing, Stripe webhooks, add payments to a SaaS,
  Stripe Checkout, Stripe webhook signature verification, Stripe CLI webhook testing.

Volumes not asserted (no keyword export supplied for this term; intent is clearly informational /
implementation). Per the no-invented-numbers rule, no volume or difficulty figure is claimed here.

## Intent
Informational / implementation. A developer adding subscription billing for the first time who
wants the architecture right rather than a snippet. Payoff is a correct design, not a signup.

## Information gain (one sentence)
It names the two specific failures that generic Stripe tutorials cause (provisioning in the
success-redirect handler, and body-parsing middleware breaking every signature check) and gives
the concrete fixes: raw-body route ordering, an event-ID idempotency claim with ON CONFLICT DO
NOTHING, and a status-to-app-behaviour table for the whole subscription lifecycle.

## Engineering opinion + anti-pattern (both required, both present)
- Opinion: the webhook is the only thing allowed to grant or revoke access; the database is the
  ledger; the success page is a UI courtesy. Plus: don't cut access the instant a renewal fails.
- Anti-pattern: provisioning in the `/success` handler, which hands free upgrades to anyone who
  guesses the URL and gives nothing to the customer who closed the tab.

## Fairness / honesty
- Merchant-of-record option (Paddle, Lemon Squeezy) named as the better choice when you want
  someone else carrying sales tax and VAT. Stripe framed as the choice for control and the lowest
  abstraction. No always-win framing.
- PCI stated only as scope reduction (card data goes to Stripe, not your server). No claim that
  the reader or Kloudbean becomes compliant or certified. Reader pointed to a qualified advisor.
- No Stripe fee percentages stated; reader told to check current pricing at the source.
- No invented statistics, failure rates, or revenue figures anywhere.

## Product mention (deliberately one touch, then a short CTA)
Kloudbean appears exactly ONCE in the body, in "What your webhook endpoint needs from the
infrastructure under it", at the moment the reader's own requirements (publicly reachable HTTPS
with a valid cert, a process that is listening when Stripe retries, and a backed-up database for
who-paid-for-what) create the need. Grounded claims used: persistent app processes with no cold
start, free SSL, managed PostgreSQL/MySQL with automatic backups, runtime config for secrets.
Nothing about VPC/private networking (Enterprise-only), no pricing figure, no uptime claim.

## Cannibalisation check
Checked the near neighbours' H2 sets. `how-to-launch-a-micro-saas` owns the launch decision path
and only touches billing in passing; `turn-your-ai-prototype-into-a-paid-product` owns the
prototype-to-revenue journey; `environment-variables-done-right` and `secrets-management` own the
secrets layer; `add-managed-database-to-your-app` and `managed-postgresql-hosting` own the DB
layer. None owns Stripe webhook correctness. This page links to all of them instead of restating.

## Internal links used (7, all verified to exist)
environment-variables-done-right, secrets-management, add-managed-database-to-your-app,
managed-postgresql-hosting, server-backups-guide, turn-your-ai-prototype-into-a-paid-product,
how-to-launch-a-micro-saas. (CTA links kloudbean.com and /pricing/.)

## Format
Correctness guide, ~2400 words. `.tldr` answer-first (quotable), 12 H2s with an H3 anti-pattern
beat, two `table.cmp` (Checkout vs Elements vs custom form; Stripe status to app behaviour), five
real `<pre><code>` blocks (raw-body Express route, idempotency table + claim, users table columns,
`stripe listen` / `stripe trigger`), four `.img-slot` spacers, 9-question FAQ mirrored to FAQPage
JSON-LD, clean Organization entity block. Near-zero em-dashes.
Byline: "The webhook is the receipt. The redirect is just a nice view."
