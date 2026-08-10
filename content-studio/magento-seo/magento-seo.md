# Magento SEO: Three Layers, and the One Nobody Files Under SEO

*By Kloudbean Engineering · Two of these layers are settings. The third is why your competitor outranks you.*

Search for Magento SEO and you get a checklist of admin toggles. Those toggles matter and you should set them, but they are the smallest part of the problem, and working through them explains why a lot of Magento stores follow the advice and see nothing change. Magento SEO really has three layers: the settings you configure, the things Magento does badly by default that need a decision rather than a toggle, and the infrastructure layer, which almost nobody files under SEO at all even though it is where the heaviest stores lose the most ground. Knowing which layer your problem is in saves you doing the wrong work.

> **What actually matters for Magento SEO?**
> Three things, in ascending order of how often they are neglected. One, the admin configuration: canonical tags for products and categories, web server rewrites so `index.php` is not in your URLs, and a sitemap that regenerates. Two, the defaults Magento gets wrong for search: product URLs reachable through multiple category paths, and layered navigation generating an enormous number of crawlable filter combinations. Three, infrastructure. Magento is a heavy PHP application, server time dominates time to first byte, and that feeds directly into Largest Contentful Paint, which is part of how Google measures page experience. Most stores have layer one roughly right and have never examined layer three.

## Which layer is your problem in?

Before changing anything, work out which of the three you are actually dealing with. The symptoms are distinguishable.

| What you are seeing | Layer |
|---|---|
| Pages indexed with `index.php` in the URL, or missing meta descriptions | One: configuration |
| Search Console reporting duplicate content, or the wrong URL chosen as canonical | Two: Magento's defaults |
| Thousands of crawled filter URLs, crawl stats dominated by pages you never wanted indexed | Two: layered navigation |
| Sitemap listing products that no longer exist, or missing new ones | Two: the cron dependency |
| Pages that rank but convert poorly, high time to first byte, failing Core Web Vitals | **Three: infrastructure** |
| Googlebot crawling slowly, few pages per day on a large catalogue | **Three: server response time** |

Be honest with yourself about the last two rows, because they are the ones that get reassigned to a performance backlog and never come back.

## Layer one: the configuration checklist

This layer genuinely is a checklist, so here it is as one. Every path below is in the Magento 2 admin.

| Setting | Where | Why |
|---|---|---|
| Use Web Server Rewrites | Stores > Configuration > General > Web > Search Engine Optimization | Removes `index.php` from your URLs. Set this before launch, because changing it later changes every URL you have. |
| Use Canonical Link Meta Tag For Categories | Stores > Configuration > Catalog > Catalog > Search Engine Optimization | The highest-impact item on this page. See the next section. |
| Use Canonical Link Meta Tag For Products | Same panel | As above, and the two work together. |
| Product and Category URL Suffix | Same panel | Pick one and never change it on a live store without redirects. |
| Create Permanent Redirect for URLs if URL Key Changed | Same panel | Leave this on. It is what stops an edited product name silently orphaning an indexed URL. |
| Search Engine Robots | Content > Design > Configuration, per store view | Where your `robots.txt` is actually generated. Check it says what you think. |
| Site Map | Marketing > SEO & Search > Site Map | Generate it, submit it, and read the cron section below, because it does not stay current on its own. |
| Meta title and description templates | Per product, category, and CMS page | Templates beat leaving them empty, and beat identical text across a catalogue. |

Two of those deserve emphasis rather than a table row.

**The URL suffix is a one-way door.** Magento lets you set a suffix such as `.html` on product and category URLs. The value itself does not matter for search. Changing it on a store with indexed URLs matters enormously, because every existing URL becomes wrong at once. If you are going to have an opinion about it, have it before launch.

**Check the canonical settings rather than assuming.** Do not take anyone's word for what your install has, including mine. Open that panel and look, because a store can run for years with those switched off and nothing in the admin will tell you.

<!-- ADD IMAGE: the Magento 2 Catalog Search Engine Optimization panel with the canonical link settings visible -->

## Layer two: what Magento gets wrong for search by default

These are not oversights so much as ecommerce features that happen to be hostile to search engines. Each needs a decision.

### One product, many URLs

Magento can include the category path in product URLs. So a product sitting in three categories becomes reachable at three addresses, plus the bare product URL, all serving identical content. Google then has to pick one, and it may not pick the one you want, and your signals are divided across four addresses instead of concentrated on one.

This is exactly why the canonical setting is the most important item in layer one, and why the two settings interact: if you use category paths in product URLs, you need the product canonical tag switched on, or you have knowingly created duplicate content at catalogue scale. The canonical tag tells search engines which of those addresses is the real one.

Verify it on a live page rather than trusting the admin:

```bash
# What canonical does this product page actually declare?
curl -s https://store.example.com/category/product.html | grep -i 'rel="canonical"'

# Is the same product reachable through another path? Both should point at one canonical.
curl -s https://store.example.com/other-category/product.html | grep -i 'rel="canonical"'
```

### Layered navigation, which multiplies

Filters are good for shoppers and a genuine problem for crawlers, because they combine. Five filters with four options each do not produce twenty URLs, they produce a combinatorial explosion of them, and every combination is a crawlable address serving a subset of a page that already exists.

The consequences are worth naming separately, because people conflate them:

- **Crawl budget.** Googlebot spends its visits on filter permutations instead of your new products. On a large catalogue this is the expensive one.
- **Duplicate and thin content.** Many combinations return near-identical or nearly empty result sets.
- **Server load.** Every crawled facet is a real query against your catalogue, which loops back to layer three.

What to do about it is a judgement, not a setting. The usual approach is to allow crawling of the small number of filter combinations that genuinely represent demand, such as a category plus a brand people actually search for, and to keep the rest out of the index. Which filters those are depends on your catalogue and your traffic, so anyone giving you a universal answer has not looked at your store.

### The cron dependency, which fails silently

This is the one that catches people, because there is no error message anywhere.

Magento leans on cron for a lot of routine work, including sitemap generation and, when indexers are set to Update by Schedule, reindexing. Update by Schedule is the correct production setting, because reindexing on every save makes the admin unusable on a real catalogue. It also means your indexes and your sitemap are only as current as your cron.

So when cron stops, nothing breaks visibly. The store serves pages. The admin works. Meanwhile the sitemap you submitted to Search Console slowly becomes fiction, listing discontinued products and omitting everything added since, and your indexes drift out of date. Nobody notices for weeks.

```bash
# Is Magento's cron actually running?
php bin/magento cron:run
crontab -l -u www-data     # or whichever user runs your store

# Are indexes current, and are they on schedule rather than on save?
php bin/magento indexer:status
php bin/magento indexer:show-mode
```

Worth adding to whatever you already monitor. A cron that has been dead for a month is a bigger SEO problem than any toggle on this page. Cron jobs are configurable from the Kloudbean dashboard rather than needing an SSH session, which at least removes the excuse that nobody knew where they were defined.

## Layer three: the infrastructure half

Here is the part that belongs in an SEO article and almost never appears in one.

Magento is a large PHP application with a heavy database. A category page assembles from many queries, and unless it is served from cache, a visitor waits for all of that before receiving a single byte. That wait is time to first byte, and time to first byte is a component of Largest Contentful Paint, which is one of the metrics Google uses to assess page experience. So server response time is not adjacent to your SEO work. It is inside it.

There is a second, less discussed effect. Googlebot adjusts how hard it crawls a site partly according to how the site responds. A slow origin gets crawled more conservatively, which on a catalogue of tens of thousands of products means new and updated pages are discovered more slowly. A fast store is not just a better experience, it is a more thoroughly crawled one.

What actually moves the number, in order of effect:

| Lever | Effect |
|---|---|
| **Full page cache** | The largest single lever by a wide margin. Varnish is what Magento's own documentation recommends for production, and the built-in file-based cache is considerably slower. |
| **Redis for cache and sessions** | Magento supports Redis for both. Keeps session and cache reads off your database and off disk. |
| **Elasticsearch, which is not optional** | Magento 2.4 requires Elasticsearch or OpenSearch for catalogue search. Not a tuning choice, a requirement, and a misconfigured one degrades search and layered navigation. |
| **Database sizing and tuning** | Catalogue queries are the work. A starved database shows up as slow category pages. |
| **Edge caching** | Serves cacheable pages near the visitor, which improves the measured experience for traffic far from your origin. |
| **Image weight** | Product photography is usually the largest element on the page, so it is usually what Largest Contentful Paint is measuring. |
| **PHP version and OPcache** | Unglamorous and real. Running a current, supported PHP with OPcache enabled is free performance. |

<!-- ADD IMAGE: diagram comparing an uncached Magento page's server time against a cache hit, with TTFB marked -->

Notice how layers two and three meet. Every filter permutation Googlebot crawls is a genuine catalogue query on your server. Letting layered navigation sprawl does not only waste crawl budget, it generates real load, which slows the pages you do care about. Fixing the facets improves the performance, and improving the performance raises the crawl rate. They compound in both directions.

## What is not our lane, said plainly

Worth being direct, because a hosting company writing about SEO should say where it stops.

Most of layer one is application work. Writing meta description templates that read like a human wrote them, structuring your categories to match how people search, deciding which filter combinations deserve to be indexed, producing product copy that is not the manufacturer's blurb pasted in: none of that is infrastructure, and no host does it for you. A Magento specialist or an SEO agency earns their fee on exactly that work.

Structured data is the same. Product markup with price and availability is what produces rich results in search, and it lives in your theme and templates.

What a platform is responsible for is layer three, plus the boring guarantee that the store stays up and current. That is a real half of the problem and it is the half most stores have not looked at.

## Where hosting fits, honestly

Magento has been a supported stack on Kloudbean since December 2023, and the pieces layer three needs are the managed ones.

Managed Elasticsearch matters most, because Magento 2.4 requires Elasticsearch or OpenSearch for catalogue search, which makes it a dependency rather than an upgrade. Running it as a managed service instead of a service you installed and forgot removes a component that silently degrades search and layered navigation when it drifts. Managed Redis covers Magento's cache and session storage, and managed MySQL or MariaDB covers the catalogue itself, with backups and controlled access. Cloudflare is available as a paid add-on, including Enterprise edge caching, which is the edge row of that table and it is free on Enterprise plans. Application and server logs sit in one dashboard with server metrics, which is where you confirm whether a slow category page is PHP, the database, or search. Cron jobs are managed from the UI, which matters more than it sounds given the silent-failure section above. Seven cloud providers to run on, free SSL issued and renewed, and free migration assistance if the store already exists somewhere else.

The boundary as always. Managed covers the server, the stack, TLS, backups, and patching. Your Magento configuration, your category structure, your content, and your theme stay yours, and a good deal of layer one lives in there.

## Related reading

On the search dependency, [managed Elasticsearch](https://www.kloudbean.com/blog/managed-elasticsearch-hosting/), and for caching and sessions, [managed Redis](https://www.kloudbean.com/blog/managed-redis-hosting/). For the catalogue, [managed MySQL](https://www.kloudbean.com/blog/managed-mysql-hosting/) and [MySQL performance tuning](https://www.kloudbean.com/blog/mysql-performance-tuning/). The equivalent performance work on the other big ecommerce platform is in [speed up WooCommerce](https://www.kloudbean.com/blog/speed-up-woocommerce/) and [WooCommerce hosting](https://www.kloudbean.com/blog/woocommerce-hosting/), and much of the reasoning transfers. On the edge layer, [CDN explained](https://www.kloudbean.com/blog/cdn-explained/). And when a heavy catalogue page times out rather than merely dragging, [504 Gateway Timeout](https://www.kloudbean.com/blog/fix-504-gateway-timeout/).

---

### Fix the layer your competitors have not looked at.

Managed Magento hosting across seven clouds with managed Elasticsearch for catalogue search, managed Redis for cache and sessions, managed MySQL or MariaDB, cron jobs from the dashboard, and logs beside server metrics. Cloudflare Enterprise edge caching available as an add-on. Free SSL issued and renewed. Free migration assistance included. Start at [kloudbean.com](https://www.kloudbean.com/) or see [pricing](https://www.kloudbean.com/pricing/).

Managed Elasticsearch · Managed Redis · Managed MySQL · Cron in the UI · Free SSL

---

## FAQ

**What is the most important Magento SEO setting?**

The canonical link meta tag settings for products and categories, at Stores then Configuration then Catalog then Catalog then Search Engine Optimization. They matter most because Magento can serve one product at several addresses through different category paths, and without a canonical tag your ranking signals are split across all of them. Check your own install rather than assuming, since nothing in the admin warns you when they are off.

**Why does Magento create duplicate content?**

Two main sources. Product URLs can include the category path, so a product in three categories is reachable at several addresses serving identical content. And layered navigation generates a crawlable URL for every filter combination, many of which return near-identical result sets. Canonical tags address the first, and deciding which filter combinations deserve indexing addresses the second.

**How do I remove index.php from Magento URLs?**

Enable Use Web Server Rewrites at Stores then Configuration then General then Web then Search Engine Optimization. Do it before launch if you can, because switching it on a store with indexed URLs changes every URL you have and needs redirects to avoid losing them.

**Does hosting affect Magento SEO?**

Yes, more than most checklists suggest. Magento is a heavy PHP application, so server work dominates time to first byte, and that feeds Largest Contentful Paint, which is part of how Google assesses page experience. There is a second effect too: a slow origin tends to get crawled more conservatively, so on a large catalogue new products are discovered more slowly.

**Does Magento need Elasticsearch?**

Yes. Magento 2.4 requires Elasticsearch or OpenSearch for catalogue search, so it is a dependency rather than an optimisation. That also means a neglected or misconfigured search service degrades both site search and layered navigation, which are the paths a lot of your visitors use to find products.

**Why is my Magento sitemap out of date?**

Almost always because cron is not running. Magento generates its sitemap on a schedule, and with indexers set to Update by Schedule it depends on cron for reindexing too. When cron stops, nothing appears broken: the store serves pages normally while the sitemap quietly becomes inaccurate. Check with php bin/magento cron:run and php bin/magento indexer:status.

**Should I let Google crawl my layered navigation?**

Only selectively. Filters combine, so a handful of them produces an enormous number of crawlable URLs, most of them thin or duplicated, and each one crawled is a real catalogue query against your server. The usual approach is to permit the small set of combinations that match genuine search demand and keep the rest out of the index. Which combinations those are depends on your catalogue and traffic.

**Can I change my Magento URL suffix later?**

You can, and you should be careful. The suffix itself makes no difference to search engines, but changing it on a live store invalidates every indexed URL at once, so it needs redirects from the old form to the new. Treat it as a decision to make before launch rather than a setting to revisit.

**Is Magento or WooCommerce better for SEO?**

Neither has an inherent advantage, and both can rank well or badly depending on configuration and infrastructure. Magento is built for larger catalogues and brings correspondingly heavier server requirements, so the caching and search layers matter more. WooCommerce is lighter to start with and gets slower as the catalogue grows. In both cases the platform is rarely the limiting factor, and time to first byte often is.

---

*Kloudbean Engineering · Set the toggles, then go and look at time to first byte.*
