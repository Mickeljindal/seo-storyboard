---
title: "Managed Elasticsearch Hosting: Search Your Database Can't Do Alone"
slug: managed-elasticsearch-hosting
meta_description: "Managed Elasticsearch hosting explained: what it's for, full-text and faceted search, indexing a copy of your data, connecting on port 9200, and why it's not your primary database."
target_keyword: managed Elasticsearch hosting
secondary_keywords:
  - Elasticsearch hosting
  - managed Elasticsearch
  - Elasticsearch cluster
  - full-text search
  - Elasticsearch alternative to database search
author: Kloudbean
hero_image: images/hero.png
cluster: 3 - Managed databases
---

![Managed Elasticsearch hosting, the search engine beside your primary database](images/hero.png)

# Managed Elasticsearch Hosting: Search Your Database Can't Do Alone

Your users type into a search box and expect Google. What they get, if search is a `LIKE '%term%'` query against your database, is slow, unranked, and blind to typos.

That gap is where Elasticsearch earns its keep. Managed Elasticsearch hosting means you launch a search engine next to your app, feed it a copy of your data, and get fast, ranked full-text search without babysitting a cluster yourself. This guide covers what Elasticsearch is actually for, when you genuinely need it, how it fits beside your real database, and the memory reality that makes self-hosting such a chore.

> **The short version:** Managed Elasticsearch hosting is a provisioned, patched, backed-up Elasticsearch instance you run beside your app for search and analytics. It's brilliant at full-text search with relevance ranking, faceted product filters, autocomplete, and log data. It is not your primary database. Keep the source of truth in PostgreSQL or MySQL and index a copy into Elasticsearch for the things a search engine does well.

## What managed Elasticsearch hosting actually is

Elasticsearch is a distributed search and analytics engine built on top of Apache Lucene. You give it JSON documents, it builds an inverted index, and then it answers search queries in milliseconds with results ranked by relevance. It speaks HTTP over a REST API, so any language can talk to it.

Managed Elasticsearch hosting takes the annoying part off your plate. Instead of installing Java, tuning heap, wiring up a cluster, and remembering to snapshot it, you launch an instance from a dashboard. The platform provisions it, patches the engine, keeps it on a private network, and backs it up. You own your indices and your data. You just don't own the 2am pager when a node runs out of memory.

## Elasticsearch is a search engine, not your database

This is the one idea that saves people the most pain, so it goes first. Elasticsearch is not where your data lives. It's where a *copy* of your data goes so it can be searched well.

Your authoritative records, the ones you cannot afford to lose, belong in a real transactional database. That's [PostgreSQL](https://www.kloudbean.com/blog/managed-postgresql-hosting/) or MySQL for most apps. Those engines give you ACID transactions, foreign keys, and a durability guarantee that Elasticsearch was never designed to match. Elasticsearch is near-real-time, not strongly consistent, and its whole architecture is tuned for reading and ranking, not for being the single source of truth.

So the mental model is simple. Write to your database. Index a copy into Elasticsearch. Search against Elasticsearch. If the search index ever gets corrupted or a node dies, you rebuild it from the database and lose nothing that matters.

```
   [ User ] --search--> [ App ]
                          |   \
                 read/write   search query
                          |        \
                   [ Primary DB ]   [ Elasticsearch ]
                  Postgres / MySQL     search index
                  source of truth    (a copy)
                          |                ^
                          +--- index a copy +
```

A classic mistake is treating Elasticsearch as the only home for some data, usually because it was easy to shove documents in and query them back. Then a mapping change, a bad reindex, or a lost node means there's nothing to rebuild from. Don't do that. Keep the database in charge.

## Do you even need Elasticsearch yet?

Honest opinion, and it might cost us a sale: most apps should start with the full-text search already built into their database. Postgres has real full-text search with `tsvector`, `tsquery`, a GIN index, and ranking through `ts_rank`. MySQL has `FULLTEXT` indexes. For a blog, a help center, a small catalog, that is genuinely enough, and it's one less service to run.

One clear exception before that, because it is not a judgement call: **Magento 2.4 requires Elasticsearch or OpenSearch** for catalogue search, so if you are running Magento the answer is already yes, and [Magento SEO](https://www.kloudbean.com/blog/magento-seo/) covers why a neglected search service quietly degrades both site search and layered navigation. Elasticsearch is the usual alternative to database search once a plain query starts creaking. You'll feel it when a few things stack up at the same time:

- **Search is a first-class feature.** People come to your app *to search*, like an online store, a jobs board, or a docs site. Search quality is the product, not a nicety.
- **You need relevance, not just matches.** "Best match first" beats "every row that contains the word." Elasticsearch ranks with BM25 out of the box.
- **You want typo tolerance and autocomplete.** Fuzzy matching, suggestions as you type, and "did you mean" are painful to fake in SQL.
- **You need facets over big result sets.** Live counts per brand, price band, and category across millions of rows. That's an aggregation problem, and it's what Elasticsearch was born for.

If none of that is true yet, save yourself the moving part. If two or three are true, it's time. This is exactly the kind of "add it when the feature demands it" call, same as reaching for [managed Redis](https://www.kloudbean.com/blog/managed-redis-hosting/) when repeat reads start hammering the database.

| | Database full-text search | Elasticsearch |
| --- | --- | --- |
| Setup | Built in, one index | A separate service to run and feed |
| Relevance ranking | Basic (`ts_rank`) | Strong (BM25, tunable) |
| Typos / fuzzy | Limited | Built in |
| Facets / aggregations | Doable but heavy | Fast, first-class |
| Autocomplete | Hand-rolled | Purpose-built field types |
| Best for | Most small and mid apps | Search-heavy apps and logs |

## What Elasticsearch is genuinely good at

Four jobs are where an Elasticsearch cluster pays for itself. If your problem is one of these, you're in the right place.

| Job | What it gives you | Elasticsearch features |
| --- | --- | --- |
| Full-text search | Ranked, relevant results across text | Analyzers, BM25 scoring, fuzzy matching |
| Faceted / filtered search | Live counts per brand, price, category | Aggregations, keyword fields |
| Autocomplete | Suggestions as the user types | Edge n-grams, search-as-you-type, completion suggester |
| Logs & observability | Search and dashboard huge log volumes | Time-based indices, the ELK stack, Kibana |

The store example ties three together. A shopper searches "wool socks," and Elasticsearch ranks the best matches first, shows a sidebar with live counts (12 in Trailhead, 8 under $20, 5 in stock), and offers completions as they type. Doing all of that against a SQL table with a pile of `LIKE` and `COUNT` queries gets slow and ugly fast.

Logs are the other big one. The ELK stack (Elasticsearch, Logstash, Kibana) exists because Elasticsearch ingests a flood of log lines into time-based indices and lets you search and chart them. If you've ever grepped across a week of logs and given up, that's the problem it solves.

<!-- ADD IMAGE: a store search results page with a facet sidebar (brand, price, in stock) and ranked results -->

## How it fits: index a copy of your data

Here's the part tutorials skip. Elasticsearch doesn't magically know about your database. You have to get your data into it, and keep it roughly in sync. There are three common ways, from simplest to sturdiest:

- **Dual write.** When your app writes a record to the database, it also indexes a document into Elasticsearch. Simple to start, but the two can drift if an index write fails, so you'll want retries or a reconciliation job.
- **Batch reindex.** A scheduled job reads changed rows from the database and bulk-indexes them. Easy to reason about, and a nightly or hourly cron is plenty for catalogs that don't change by the second.
- **Change data capture.** A pipeline streams row changes from the database into Elasticsearch in near real time. It's the most robust and the most moving parts. Reach for it when drift actually hurts.

Start with a batch reindex. It's boring, it's debuggable, and you can always rebuild the whole index from scratch, which is the entire point of keeping the database as the source of truth. On one private network, that reindex job talks to both over internal addresses and never touches the public internet.

Launching the engine is the easy bit. Open the DBS section, hit Launch Database, and pick Elasticsearch from the managed engines. Kloudbean runs seven: PostgreSQL, MySQL, MariaDB, Redis, Memcached, Elasticsearch, and MongoDB. A minute or two later it's provisioned on your server, secured, and already being backed up.

![The Kloudbean console, Launch Database, choosing managed Elasticsearch from the list of managed engines](../assets/console/launch-database.png)

## Connecting to Elasticsearch on port 9200

Elasticsearch listens for client traffic over HTTP on port **9200**. You can hit it with plain `curl`, and every language has an official client that wraps the same REST API. Managed instances expect a username, password, and usually TLS.

Keep those in environment variables, never in your source. Open Runtime Configuration, then Environment Variables, and add them, the same way you'd wire up any managed database.

![The Kloudbean console, Environment Variables, storing the Elasticsearch connection details outside the code](../assets/console/env-vars.png)

```bash
# one connection URL, with credentials
ELASTICSEARCH_NODE=https://elastic:s3cret@10.0.0.6:9200

# or split out, if your client prefers discrete fields
ES_HOST=10.0.0.6
ES_PORT=9200
ES_USERNAME=elastic
ES_PASSWORD=s3cret
```

The Node client reads that URL and does the rest:

```js
import { Client } from "@elastic/elasticsearch";
const client = new Client({ node: process.env.ELASTICSEARCH_NODE });

const result = await client.search({
  index: "products",
  query: { match: { name: "wool socks" } },
});
console.log(result.hits.hits);
```

Python is the same shape with `elasticsearch-py`:

```python
import os
from elasticsearch import Elasticsearch

es = Elasticsearch(os.environ["ELASTICSEARCH_NODE"])
res = es.search(index="products", query={"match": {"name": "wool socks"}})
print(res["hits"]["hits"])
```

Because the credentials sit in the environment, they stay out of your Git history and you can rotate a password without a code change. That's the same discipline covered in [adding a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/), and it applies to every managed engine.

## Indexing and mapping, with a small example

An index is like a table, and a mapping is like its schema. You can let Elasticsearch guess field types (dynamic mapping), but on anything real you should define them, because the wrong type is the single most common Elasticsearch bug. Here's an explicit mapping for a product catalog:

```bash
# create an index with an explicit mapping, over the REST API on 9200
curl -X PUT "https://10.0.0.6:9200/products" -u elastic:$ES_PASSWORD \
  -H 'Content-Type: application/json' -d '
{
  "mappings": {
    "properties": {
      "name":     { "type": "text" },
      "brand":    { "type": "keyword" },
      "category": { "type": "keyword" },
      "price":    { "type": "float" },
      "in_stock": { "type": "boolean" }
    }
  }
}'
```

Notice `name` is `text` and `brand` is `keyword`. That distinction is the whole game, so here's the rule people wish they'd known on day one:

- **`text`** fields are analyzed. Elasticsearch tokenizes them, lowercases, and often stems, so "Running Socks" matches a search for "run sock." Use it for anything you want to *search*.
- **`keyword`** fields are stored verbatim. No tokenizing. Use it for anything you want to *filter*, *sort*, or *aggregate* on, like a brand, a status, or a category.

Get this backwards and things quietly break. Index a category as `text` and your facet counts fragment. Index a product title as `keyword` and full-text search stops working, because it only matches the exact whole string. When a filter or sort misbehaves, check the field type first.

Indexing a document and searching it back looks like this:

```bash
# index one product
curl -X POST "https://10.0.0.6:9200/products/_doc" -u elastic:$ES_PASSWORD \
  -H 'Content-Type: application/json' -d '
{ "name": "Merino wool running socks", "brand": "Trailhead", "category": "socks", "price": 18.0, "in_stock": true }'

# full-text search on name, filtered to in-stock items
curl "https://10.0.0.6:9200/products/_search" -u elastic:$ES_PASSWORD \
  -H 'Content-Type: application/json' -d '
{
  "query": {
    "bool": {
      "must":   { "match": { "name": "wool socks" } },
      "filter": { "term":  { "in_stock": true } }
    }
  }
}'
```

The `match` clause does the fuzzy, analyzed, relevance-ranked part on the `text` field. The `term` filter does an exact yes/no check on a boolean and doesn't affect scoring. That split, scoring queries in `must` and exact filters in `filter`, is the backbone of nearly every real Elasticsearch query.

<!-- ADD IMAGE: a terminal or Kibana view of a _search response, with the hits array and _score values visible -->

## Why Elasticsearch is a beast to self-host

This is the real reason managed Elasticsearch hosting exists, and it comes down to memory. Elasticsearch runs on the JVM, and it's hungry. The long-standing guidance is to give the JVM heap no more than half the machine's RAM, and to keep the heap under roughly 32GB so it can use compressed object pointers. The other half of RAM isn't wasted; Lucene leans on the operating system's filesystem cache for the actual search speed. So a box with too little RAM either starves the heap or starves the cache, and search gets slow either way.

That's just the sizing. Running a cluster well also means managing shards and replicas, watching health flip from green to yellow to red, clearing unassigned shards after a restart, taking snapshots, and upgrading versions without downtime. None of it is impossible. All of it is work you didn't sign up for when you just wanted a good search box.

Managed hosting collapses that. The instance is sized and provisioned for you, the engine is patched, it sits on a [private network](https://www.kloudbean.com/blog/what-is-a-vpc/) instead of the open internet, and it's backed up on a schedule you don't maintain. If you want to understand the backup side in general, [the server backups guide](https://www.kloudbean.com/blog/server-backups-guide/) covers how automatic backups and restores work across the platform. You still own your indices and can export them whenever you like.

<!-- ADD IMAGE: cluster health (green/yellow/red) and JVM heap usage -->

## Managed Elasticsearch, or run the cluster yourself?

Self-hosting is fine for learning or a throwaway project. For anything users depend on, a managed instance on the same private network as your app and database, in one dashboard, means one place to launch it, one bill, and no cluster babysitting. If you're weighing where that infrastructure should live, [DigitalOcean vs Kloudbean](https://www.kloudbean.com/blog/digitalocean-vs-kloudbean/) lays out the raw-VPS-versus-managed tradeoff. And mind that the two engines scale differently: Elasticsearch grows by adding nodes and shards, while your primary database usually scales reads with [read replicas](https://www.kloudbean.com/blog/database-read-replicas-scaling/). Keep the roles clear and each stays simple.

---

**Give your app search that actually feels like search.** Launch managed Elasticsearch beside your database, index a copy of your data, and connect with one URL, on infrastructure you control. Start free at [kloudbean.com](https://www.kloudbean.com/), see plans on [pricing](https://www.kloudbean.com/pricing/).

One-click Elasticsearch · On a private network · Automatic backups · Free migration · Free trial

## FAQ

**What is managed Elasticsearch hosting used for?**
Full-text search, faceted filtering, autocomplete, and log or analytics data, mostly. Elasticsearch ranks results by relevance and handles typos and aggregations that are painful in plain SQL. Managed Elasticsearch hosting means the platform provisions the instance, patches the engine, keeps it on a private network, and backs it up, so you launch one and connect with a URL.

**Is Elasticsearch a database?**
Not in the way Postgres or MySQL is. It's a search and analytics engine, near-real-time rather than strongly consistent, and it wasn't built to be your single source of truth. Keep your authoritative data in a transactional database and index a copy into Elasticsearch for search. If the index is ever lost, you rebuild it from the database.

**Do I need Elasticsearch, or is my database's full-text search enough?**
For most small and mid-sized apps, Postgres full-text search or MySQL FULLTEXT indexes are enough and one less service to run. Reach for Elasticsearch when search is a core feature, when you need real relevance ranking, typo tolerance, autocomplete, or fast facets over large result sets. If two or three of those are true, it's time.

**How do I connect my app to managed Elasticsearch?**
Elasticsearch exposes a REST API over HTTP on port 9200. Store the host, port, and credentials in environment variables, then use the official client for your language, such as the Elasticsearch client for Node or elasticsearch-py for Python. Both read the connection details and let you index and search with a few lines of code.

**What is the difference between a text field and a keyword field?**
A text field is analyzed, meaning it's tokenized and lowercased so full-text search works, so use it for anything you want to search. A keyword field is stored exactly as given, so use it for values you filter, sort, or aggregate on, like a brand or a category. Choosing the wrong type is the most common Elasticsearch mistake, and it makes facets and filters behave strangely.

**How does data get into Elasticsearch from my database?**
You index a copy of it. The simplest approach is a scheduled batch job that reads changed rows and bulk-indexes them. You can also dual-write from your app as records change, or stream changes with a change-data-capture pipeline for near real-time sync. Start with a batch reindex, because you can always rebuild the whole index from the database.

**Why does Elasticsearch use so much memory?**
It runs on the JVM and relies on both heap and the operating system's filesystem cache. The common guidance is to give the heap at most half of the machine's RAM and keep it under about 32GB, leaving the rest for the cache that makes searches fast. Under-sizing memory is the usual cause of a slow or unstable cluster, which is a big reason managed hosting is worth it.

**Can I use Elasticsearch for logs and observability?**
Yes, that's one of its biggest uses. The ELK stack pairs Elasticsearch with Logstash for ingestion and Kibana for dashboards. Log data goes into time-based indices, and you can search and chart huge volumes quickly. It's a common alternative to grepping across servers by hand.

**Managed Elasticsearch or self-hosting, which should I pick?**
Self-hosting is fine for learning or a throwaway project. For anything users rely on, managed hosting removes the hard parts: sizing, patching, shard and cluster management, snapshots, and upgrades. A managed instance on the same private network as your app and database, in one dashboard, is simpler and keeps everything on infrastructure you control.

---

*By Kloudbean Data Team · Search belongs in a search engine, not a LIKE query.*
