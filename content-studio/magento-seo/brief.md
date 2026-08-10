# Brief: magento-seo

## Target keyword and real search data

Source: `kloudgraph-semrush-export` competitor position exports plus the gap export, clustered by
`scripts/build-topic-queue.py`. Four queue families, one intent.

| Family | Volume | Min KD | Score |
|---|---|---|---|
| `magento seo` | 7,990 | 17 | 59.0 |
| `advice magento seo` | 1,300 | 15 | 34.4 |
| `ecommerce magento seo` | 1,000 | 14 | 34.5 |
| `magento practices seo` | 880 | 3 | 56.8 |

**Combined 11,170.** All four flagged with no nearest neighbour.

| Keyword | Volume | KD |
|---|---|---|
| magento seo | 3,600 | 32 |
| magento seo advice | 1,300 | 15 |
| magento ecommerce seo | 1,000 | 14 |
| seo for magento | 1,000 | 20 |
| seo magento 2 | 880 | 45 |
| magento seo best practices | 880 | 3 |
| seo in magento 2 | 720 | 31 |
| seo in magento | 720 | 27 |
| magento and seo | 590 | 17 |
| seo with magento | 480 | 29 |

`magento seo best practices` at KD 3 and `magento ecommerce seo` at KD 14 are among the lowest
difficulty scores anywhere in the queue at this volume.

Primary: **Magento SEO**. Secondary: magento seo best practices, seo for magento 2, magento canonical
tag, magento url rewrites, magento layered navigation duplicate content, magento core web vitals.

## Cannibalisation check (mandatory)

**Magento appears in 12 articles and is owned by none of them.** Every mention is a passing one in a
comparison or alternatives page listing supported stacks: `aws-lightsail-vs-kloudbean`,
`bluehost-alternative`, `godaddy-alternative`, `hostgator-alternative`, `hostinger-alternative`,
`namecheap-alternative`, `siteground-alternative`, `joomla-vs-wordpress`, `deploy-symfony-app`,
`kloudbean-for-developers`, `managed-cloud-hosting-myths`, `managed-mysql-hosting`.

There is no Magento article of any kind, and no SEO-as-a-topic article.

| Nearest existing | Owns | Verdict |
|---|---|---|
| `speed-up-woocommerce` | WooCommerce performance | Different platform. Link. |
| `woocommerce-hosting` | WooCommerce hosting | Different platform. Link. |
| `speed-up-wordpress` | WordPress performance | Different platform. |
| `hosting-for-saudi-ecommerce` | Regional ecommerce hosting | Adjacent, different question. |

Genuine gap on a confirmed supported stack. Magento has been supported since December 2023 per the
changelog.

## Information gain (the approval question)

The problem with this topic is that a hosting company writing about Magento SEO could easily produce a
thin checklist of admin settings, which is what most ranking pages already are. The angle that is both
honest and differentiated:

**Magento SEO splits into three layers, and the layer that holds most stores back is the one nobody
files under SEO.** Configuration is layer one and it is genuinely a checklist. Layer two is the things
Magento does badly by default and that need a decision rather than a toggle. Layer three is
infrastructure, and it belongs in an SEO article because Magento is heavy, server work dominates
time-to-first-byte, and time-to-first-byte feeds Largest Contentful Paint.

Specific gain items:

1. **The canonical settings are the single highest-impact thing in the admin, and they are a toggle
   most stores never check.** Exact path given so the reader verifies their own install.
2. **The product URL multi-path problem explained mechanically:** enabling category paths in product
   URLs means one product is reachable at several addresses, which is why the canonical setting matters
   so much and why the two settings interact.
3. **Layered navigation as a crawl-budget problem,** with the reason facets multiply combinatorially
   and what to do about it, rather than a vague warning about duplicate content.
4. **Magento's dependence on cron for sitemap generation and indexing.** A silently broken cron means
   a stale sitemap and stale indexes with no error anywhere, which is a real failure mode and invisible
   by nature.
5. **Elasticsearch is a hard requirement for Magento 2.4 catalog search, not an optimisation.** This is
   factual, load-bearing for the site working at all, and it happens to be a legitimate product fit.
6. **The honest boundary,** stated rather than blurred: most of layer one is application work we do not
   do, and the article says so before claiming the infrastructure half.

Angles used: *the status quo hides the real cause* (infrastructure filed under performance rather than
SEO), *the failure is invisible* (broken cron, stale sitemap), *concede the main point up front*
(configuration is not ours).

## Verified technical claims and how they are phrased

- Canonical settings live at Stores > Configuration > Catalog > Catalog > Search Engine Optimization,
  named "Use Canonical Link Meta Tag For Categories" and "For Products". Verified that the settings and
  path exist. **Default value not confirmed from a primary Adobe source**, so the article says to check
  your own install rather than asserting a default. This is deliberate.
- "Use Web Server Rewrites" at Stores > Configuration > General > Web > Search Engine Optimization
  controls whether index.php appears in URLs.
- URL suffix settings exist for products and categories, and changing them on a live store invalidates
  existing indexed URLs, so it needs redirects.
- Magento sitemap generation is at Marketing > SEO & Search > Site Map and depends on cron.
- Indexers support Update on Save and Update by Schedule; Update by Schedule is the production setting
  and requires working cron.
- Magento 2.4 requires Elasticsearch or OpenSearch for catalog search. Stated as a requirement.
- Varnish is Magento's recommended full page cache. Described as **Magento's recommendation**, and
  **not** claimed as a Kloudbean feature, because it is not in the product facts.
- Core Web Vitals and page experience are described as Google signals in general terms. **No ranking
  outcome promised anywhere**, per the banned claim classes.

## Product claims, checked against the facts files

Used: Magento supported since December 2023; managed Elasticsearch; managed Redis; managed MySQL and
MariaDB; seven clouds; free SSL; Cloudflare available as a paid add-on including Enterprise edge
caching, free for Enterprise; application and server logs in one dashboard; cron jobs from the UI; free
migration assistance.

**Deliberately NOT claimed:** staging for Magento. Staging is confirmed for WordPress and Laravel only,
so the article does not extend it to Magento. Varnish is not claimed. No SLA or uptime figure. No
autoscaling, which is enterprise and custom only.

## Format

Three-layer diagnostic rather than a checklist, so the reader can tell which layer their problem is in
before doing any work. Layer one is compressed into a table since it genuinely is a checklist. Layers
two and three get the depth, because that is where the article is credible and where the gain is.
