# Brief: woocommerce-vs-shopify

## Target keyword and real search data

Source: `kloudgraph-semrush-export` competitor position exports plus the gap export, clustered by
`scripts/build-topic-queue.py`. Family `shopify woocommerce`, score 53.2, no nearest neighbour.

| Keyword | Volume | KD |
|---|---|---|
| woocommerce vs shopify | 2,900 | 28 |
| shopify to woocommerce | 480 | 43 |

**Family volume 3,380.** Related terms people also use (same intent): shopify vs woocommerce,
woocommerce or shopify, is woocommerce cheaper than shopify, woocommerce vs shopify for small business,
woocommerce vs shopify fees.

Primary: **WooCommerce vs Shopify**. Secondary: shopify vs woocommerce, woocommerce or shopify,
woocommerce vs shopify fees, is woocommerce cheaper than shopify, migrate shopify to woocommerce,
woocommerce vs shopify for small business.

Audience fit: this is the decision-stage query for exactly the readers the owner named, solo founders,
one-person companies, and small brands choosing where to sell. They do not search "one person company
hosting"; they search "woocommerce vs shopify". Answering the decision is how we reach them.

## Cannibalisation check (mandatory, done against real H2 sets)

`grep -ril shopify` across all article HTML: zero matches. Shopify is not mentioned anywhere in the
library, so there is no platform-choice content to compete with.

| Existing slug | Owns | Verdict |
|---|---|---|
| `woocommerce-hosting` | Running and hosting a Woo store; "The PCI question, answered honestly", scaling, requirements | Assumes you already chose Woo. This page is the step before. Link forward. |
| `speed-up-woocommerce` | Performance of an existing Woo store | Same. Link. |
| `hosting-for-saudi-ecommerce` | Regional ecommerce hosting, PCI scope, RTL | Different question. Link for the PCI/regional angle. |

Distinct intent in one line: every neighbour assumes WooCommerce is already chosen. This page is the
choice itself, and it is the only entry point in the library for someone who has not yet decided.

## Information gain (the approval question)

The honest, differentiated frame: **this is not a feature bake-off, it is a single architectural fork.
Shopify is a closed hosted service; WooCommerce is an open plugin you host. Almost every real
difference (cost shape, ownership, lock-in, who fixes it at 2am) follows from that one fact.** Most
ranking pages present a 20-row feature table that obscures the decision. This page makes the fork
explicit and gives a decision cue.

Specific gain:
1. **The cost curves cross.** Shopify is cheaper to start and gets structurally more expensive as you
   grow, because it can take a cut of every sale. WooCommerce has a higher floor (you pay for hosting
   whether you sell or not) and a flatter curve (no platform cut). The article shows where the
   crossover sits and why, instead of declaring one "cheaper".
2. **The transaction-fee trap, stated precisely.** Shopify charges credit-card processing on every
   sale, and an ADDITIONAL surcharge if you use any processor other than Shopify Payments. That second
   fee is the one people miss, and it is effectively a tax on not using their processor.
3. **Ownership and lock-in as the real stakes.** With Shopify your store lives on their platform and a
   migration out is a project. With WooCommerce you own the database and the files and can move hosts
   in an afternoon. That is the thing the fee comparison usually buries.
4. **A fair, single concession to Shopify:** it genuinely removes operations entirely. No server, no
   updates, no security patching. For someone who never wants to think about infrastructure, that is a
   real and legitimate reason to choose it, and the article says so plainly rather than pretending
   otherwise.
5. **The honest boundary for us:** Kloudbean cannot host Shopify (nobody but Shopify can), so the
   pro-Kloudbean landing is only relevant if you choose WooCommerce. The article concedes that the
   choice might be Shopify, and claims only the narrower true thing: if you choose WooCommerce, the
   hosting under it is what makes or breaks the store, and that is where we come in.

Angles used: the status-quo-hides-the-real-cause (feature tables obscure the one fork), concede the
main point up front (Shopify's zero-ops is real), name the trade-off.

## Verified facts and how they are phrased

- Shopify: subscription tiers + per-sale credit-card processing via Shopify Payments + an additional
  third-party gateway surcharge (published as roughly 0.2%-2% depending on plan) when you use an
  outside processor. Verified against Shopify's published 2026 pricing structure. **Framed structurally
  with a "check current rates" caveat**, since pricing tiers and percentages move. No single exact
  monthly price asserted as fixed truth.
- WooCommerce: free, open-source WordPress plugin. No platform or per-sale fee from WooCommerce itself.
  You pay for hosting, your payment processor's standard rate, and any paid extensions.
- WooCommerce runs on the WordPress/PHP/MySQL stack; you own the data and files.
- Shopify is fully hosted SaaS: no server access, they handle infrastructure, updates, security.
- PCI: with either, keeping card data off your own server (processor-hosted fields) is the sane path;
  cross-link rather than re-teach, since `woocommerce-hosting` and `hosting-for-saudi-ecommerce` cover it.

## Product claims (only from kloudbean-facts.md)

WooCommerce and WordPress supported; managed WordPress; staging for WordPress; managed MySQL and
MariaDB; managed Redis; seven clouds; free SSL; Cloudflare edge add-on; automatic backups; free
migration assistance; one dashboard. NOT claimed: that Kloudbean hosts Shopify (it does not). No SLA %,
no exact prices, no autoscaling for general users.

## Format

Decision guide, not a feature table. The single fork up front, then cost shape, ownership/lock-in, the
ease-vs-control trade, then an explicit "choose X if" cue, then where hosting fits, then FAQ. Fair to
Shopify, lands on WooCommerce for the reader who wants ownership and margin, honest that Shopify is the
right call for the reader who wants zero ops.
