---
title: "pgvector: Use Postgres as a Vector Database for AI Apps"
description: "pgvector turns Postgres into a vector database for AI apps: store embeddings next to your data and run semantic search or RAG with one database, not two."
slug: pgvector-for-ai-apps
canonical: https://www.kloudbean.com/blog/pgvector-for-ai-apps/
eyebrow: AI & databases
byline: By Kloudbean · Vectors, in your database.
---

# pgvector: Use Postgres as a Vector Database for AI Apps

![pgvector: using Postgres as a vector database for AI apps](images/hero.png)

You're adding AI features to your app. Semantic search, a chatbot that knows your own docs, maybe recommendations. And everywhere you look, the advice is the same: go buy a dedicated vector database. Most apps don't need one. Postgres already does vector search through an extension called **pgvector**, which stores your embeddings right next to your relational data. One database instead of two. This guide teaches pgvector properly, then shows the one case where a separate vector store still earns its place.

> **The short version**
>
> **pgvector** is a PostgreSQL extension that adds a `vector` column type and distance operators, so Postgres can store embeddings and run similarity search. For most apps, well under a few million vectors, that's all you need: keep vectors beside your rows, filter by user and similarity in one query, and skip the second system. Add an HNSW or IVFFlat index once the table grows. Reach for a dedicated vector database when you genuinely outgrow Postgres.

## What is pgvector?

pgvector is an open-source extension for PostgreSQL that teaches the database two new tricks. First, a `vector` data type for storing embeddings. Second, a set of distance operators for measuring how close two vectors are. Install it, and a plain Postgres table can hold a 1536-dimension embedding in a column beside a user's name, a SKU, or a document's text.

No separate service. Your existing SQL, client library, and backups all still work, because it's just another column in just another table. Postgres becomes a vector database without becoming a different database, and that matters more than it sounds.

## What embeddings and vector search actually are

Before the SQL, the concept, because it's simpler than the jargon makes it sound. An embedding is a list of numbers that represents the meaning of something: a sentence, an image, a product. You feed text to an embedding model, OpenAI's `text-embedding-3-small` or an open one you run yourself, and it hands back an array of floats. Say 1536 of them. That array is a point in high-dimensional space, and similar things land near each other. "How do I get a refund?" and "What's your return policy?" sit close together even though they share almost no words. That's the leap over keyword search: it matches meaning, not spelling.

Vector search is just finding the nearest points to a query point. You embed the user's question into the same space, then ask the database for the rows whose vectors sit closest, measured with a distance function, most often cosine distance. That's the whole idea.

<!-- ADD IMAGE: a simple 2D scatter showing similar sentences clustering together in embedding space -->

## Do you actually need a dedicated vector database?

Here's my honest position, and it'll annoy a few people: most apps adding AI search do not need a dedicated vector database. Pinecone, Weaviate, Milvus, Qdrant, and the rest are genuinely good, and at very large scale or extreme query volume they pull ahead. But "very large scale" is bigger than most teams assume. If you're holding well under a few million vectors, and most apps are, Postgres with pgvector handles it comfortably.

So what does a separate vector database actually cost you? Not just the monthly bill. It's a second system to run and secure, and a second copy of your data that has to stay in sync with your source of truth. Your app writes a row to Postgres, then writes its embedding to the vector store, and now you own a consistency problem. What if the first write succeeds and the second fails, or a row gets deleted in Postgres but its vector lingers? You end up maintaining reconciliation jobs nobody enjoys.

Keep the vectors in Postgres and those problems disappear. The row and its embedding commit in the same transaction, so they're never out of step. You can filter by an ordinary column and by similarity in a single query (closest support articles for _this_ user's language, say). One database to operate and back up, one connection string. That's a real architectural win, not a slogan.

| | Postgres + pgvector | Dedicated vector DB |
|---|---|---|
| **Systems to run** | One (you already have it) | Two, plus the sync between them |
| **Consistency** | Row and vector commit together | You keep two stores in sync |
| **Filter + similarity** | One SQL query with a WHERE | Metadata filtering, often more limited |
| **Joins to real data** | Native SQL joins | Fetch IDs, then query Postgres anyway |
| **Best scale** | Thousands to a few million vectors | Tens of millions and up, high QPS |
| **Ops + cost** | One bill, one thing to back up | Extra service, extra spend, extra ops |

![Two databases kept in sync versus one Postgres with pgvector holding rows and embeddings together](svg-two-db-vs-one-postgres)
_Two databases means a sync-and-reconcile problem. Postgres with pgvector keeps rows and embeddings in one place, committed together._

> **Coming from Pinecone or a dedicated vector store?** You don't have to rip it out overnight. But if you added it because "everyone said I needed a vector database," check whether a single Postgres would do the job with less to run.

## How to store embeddings in Postgres with pgvector

Enough theory. Here's the actual SQL. First, enable the extension and create a table with a vector column, its dimension matching your embedding model (1536 for OpenAI's `text-embedding-3-small`).

```sql
-- turn Postgres into a vector store
CREATE EXTENSION IF NOT EXISTS vector;

-- your real columns AND the embedding, side by side
CREATE TABLE document (
  id         bigserial PRIMARY KEY,
  user_id    bigint NOT NULL,
  content    text   NOT NULL,
  embedding  vector(1536)     -- 1536 dims to match the model
);
```

Notice that `user_id` and `content` live in the same row as the embedding. That's the point. Now insert a row. The vector comes back from your model as an array of floats, and you store it as-is.

```sql
-- the row and its embedding go in together, one INSERT
INSERT INTO document (user_id, content, embedding)
VALUES (42,
        'Refunds are processed within 5 business days.',
        '[0.0123, -0.0456, 0.0789, ...]');   -- vector from your model
```

Then search. To find the chunks closest to a question, embed it and order by distance. pgvector gives you three distance operators; you'll almost always use cosine:

- `<=>` cosine distance (the usual choice for text embeddings)
- `<->` Euclidean, or L2, distance
- `<#>` negative inner product

```sql
-- the 5 rows nearest to the question's embedding
SELECT id, content
FROM document
ORDER BY embedding <=> '[0.011, -0.043, 0.080, ...]'
LIMIT 5;
```

![The Kloudbean console launching a managed PostgreSQL database, the engine that runs pgvector](../assets/console/launch-database.png)
_pgvector runs on standard PostgreSQL. Launch a managed Postgres, then enable the extension on it._

Now the query a separate vector database makes awkward and Postgres makes trivial: similarity _and_ a normal filter, in one round trip. Search only this user's documents, ranked by closeness.

```sql
-- similarity AND a plain WHERE, one query, one round trip
SELECT id, content
FROM document
WHERE user_id = 42                 -- ordinary relational filter
ORDER BY embedding <=> $1         -- $1 = the query embedding
LIMIT 5;
```

Try doing that cleanly across two systems. You can't, not without fetching IDs from one and re-querying the other. That's a big part of why vectors in Postgres feel calmer. The app wiring is the same as any database, a `DATABASE_URL` in an env var; the full walkthrough is in [how to add a managed database to your app](https://www.kloudbean.com/blog/add-managed-database-to-your-app/).

<!-- ADD IMAGE: a psql session running the ORDER BY distance query and showing ranked results -->

## Indexing pgvector for speed: HNSW or IVFFlat?

By default, that `ORDER BY embedding <=> ...` query does an exact search. It compares the query vector against every row and returns the true nearest neighbours. For a few thousand rows that's genuinely fine, and the results are exact. Don't add an index before you need one.

But a sequential scan gets slower as the table grows. Once you're into tens or hundreds of thousands of vectors, you add an approximate nearest neighbour (ANN) index. "Approximate" is the tradeoff: it returns the nearest neighbours _almost_ always, swapping a sliver of recall for a big speedup. pgvector offers two.

```sql
-- HNSW: builds a graph, great recall and speed, more memory
CREATE INDEX ON document
USING hnsw (embedding vector_cosine_ops);

-- IVFFlat: buckets the vectors; build it AFTER you have data
CREATE INDEX ON document
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

| | HNSW | IVFFlat |
|---|---|---|
| **How it works** | Navigable graph of vectors | Partitions vectors into lists |
| **Recall / quality** | Higher, tunable | Good, depends on list count |
| **Query speed** | Fast, even at scale | Fast once tuned |
| **Build time + memory** | Slower build, more RAM | Quicker build, lighter |
| **Needs data first?** | No | Yes, train on existing rows |
| **Reach for it when** | You want the best recall and can spare memory | You want a cheap index and can tune lists |

My default is HNSW. It gives excellent recall out of the box and stays fast as the table grows, and the extra memory is usually a fair trade. IVFFlat is lighter and builds faster, but it wants to be built after you've loaded data (it trains on the existing rows), and you have to pick a sensible `lists` value. One rule that saves headaches: build the index once real data is in, not on an empty table.

<!-- ADD IMAGE: EXPLAIN ANALYZE for the same query before and after the HNSW index -->

## Can I use pgvector for RAG?

Yes, and it's the most common reason people install it. Retrieval-augmented generation (RAG) is how you get an LLM to answer from _your_ content instead of guessing. pgvector is the retrieval half. The flow is short:

- **Chunk** your documents into pieces of a few hundred words each.
- **Embed** every chunk with your embedding model.
- **Store** the chunk text and its vector in a pgvector table.
- **Retrieve** at query time: embed the user's question, run the top-k similarity query, get the closest chunks.
- **Generate**: hand those chunks to the LLM as context and let it answer, grounded in your data.

That's it. The database's whole job is step four, the top-k lookup you already saw. Because it's Postgres, you can scope retrieval with a WHERE (only this customer's knowledge base, only published articles) in the same query, which is exactly the filtering real RAG apps need. Shipping an AI feature end to end? Pair this with [deploying an AI-built app to production](https://www.kloudbean.com/blog/deploy-ai-built-app-to-production/).

## Where pgvector stops being the right tool

I've argued hard for Postgres, so let me be honest about its edges. pgvector is excellent up to a point, and past it a specialised engine can win. A few real limits:

- **Very large scale.** At tens of millions of vectors with high queries per second, purpose-built vector databases are engineered for that and will often beat a general-purpose Postgres. Use the right tool for that world.
- **Index memory.** HNSW indexes live in memory and grow with your data and dimensions, so size your instance for the index, not just the table.
- **Dimensions matter.** Bigger embeddings capture more nuance but cost more storage, more memory, and slower distance math. Pick the smallest model that hits your quality bar.
- **You still need a model.** Postgres stores and searches vectors, it does not create them. Embeddings come from a model you call, OpenAI or an open one you host, and that step lives in your app.

Start on Postgres, measure, and move only if you actually hit a wall. Premature "we need a vector database" is a classic case of solving a scale problem you don't have yet.

## Running pgvector on a managed Postgres

So where does this land in practice? pgvector is a standard PostgreSQL extension, so the real question is where your Postgres runs. On [managed PostgreSQL](https://www.kloudbean.com/blog/managed-postgresql-hosting/), one of Kloudbean's seven managed database engines, you get the database provisioned, patched, backed up, and kept on a [private network](https://www.kloudbean.com/blog/what-is-a-vpc/) with controlled access. Your app reaches it over that private network with a connection string in an environment variable, the same as any Postgres.

One honest note, because I won't oversell it: enabling the pgvector extension depends on your specific Postgres setup and version, so check availability for your instance rather than assuming it's turned on. Kloudbean doesn't sell a separate "vector database" product, and it doesn't need to. Run one managed Postgres, keep your app data and your embeddings together, and back the whole thing up as a unit.

![The Kloudbean console storing the Postgres DATABASE_URL as an environment variable for a pgvector-backed app](../assets/console/env-vars.png)
_One database, one connection string. Store `DATABASE_URL` as an env var, never in code._

```bash
# one database for app data AND vectors, one connection string
DATABASE_URL=postgresql://appuser:s3cret@10.0.0.5:5432/appdb
```

From there it's ordinary Postgres work. Your ORM connects the usual way (here's [connecting Prisma to a managed database](https://www.kloudbean.com/blog/connect-prisma-to-a-managed-database/)), you handle load with [connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/), and you cache the hot reads. Redis and Postgres do different jobs, so if you're weighing them, see [when to use Redis vs Postgres](https://www.kloudbean.com/blog/when-to-use-redis-vs-postgres/). Still choosing an engine? [MySQL vs PostgreSQL](https://www.kloudbean.com/blog/mysql-vs-postgresql/) covers it (short version for AI work: Postgres, because pgvector).

<!-- ADD IMAGE: an app answering a question using chunks retrieved from pgvector, with sources listed -->

---

**Keep your vectors where your data already lives.**

Run a managed PostgreSQL for your app data and your embeddings together, with automatic backups, private networking, and free migration help. Start free at [kloudbean.com](https://www.kloudbean.com/), see plans on [pricing](https://www.kloudbean.com/pricing/).

Managed PostgreSQL · Automatic backups · Private networking · Free migration · Free trial · Simple Git deploy

## FAQ

**What is pgvector?**
pgvector is an open-source PostgreSQL extension that adds a `vector` column type and distance operators. With it enabled, a normal Postgres table can store embeddings and run similarity search, turning Postgres into a vector database with no separate system to run.

**Do I need a dedicated vector database?**
Usually not. If your app holds well under a few million vectors, Postgres with pgvector handles semantic search comfortably and you avoid running and syncing a second system. Dedicated vector databases earn their keep at very large scale or extreme query volume.

**Is Postgres good enough for vector search?**
For most apps, yes. pgvector does exact search on small tables and approximate (ANN) indexes like HNSW and IVFFlat on larger ones, staying fast into the millions of vectors. The real edge is combining similarity with ordinary SQL filters and joins in one query.

**pgvector vs Pinecone: which should I use?**
Use pgvector when you already run Postgres and want one database, transactional consistency, and SQL filtering alongside similarity. Consider Pinecone or another dedicated vector database when you outgrow Postgres, at tens of millions of vectors or very high query volume. Start with pgvector and move only if you hit a wall.

**What index should I use, HNSW or IVFFlat?**
HNSW is the strong default: excellent recall and fast queries, at the cost of a slower build and more memory. IVFFlat is lighter and builds faster, but create it after loading data and tune the list count. Small tables may need no index at all.

**How do I store embeddings in Postgres?**
Run `CREATE EXTENSION vector`, then create a table with a `vector(N)` column where N matches your model, such as 1536. Generate the embedding with your model and INSERT it like any value. It lives in the same row as your normal columns.

**Can I use pgvector for RAG?**
Yes, it's a main reason people install it. You chunk documents, embed each chunk, and store the text and vector in pgvector. At query time you embed the question, fetch the top-k nearest chunks, and pass them to the LLM as context.

**What distance should I use, cosine or L2?**
For most text embeddings, cosine distance is standard, since it compares direction rather than magnitude. pgvector also supports Euclidean (L2) distance and inner product. Match the distance to what your embedding model was trained with, and use the matching index operator class.

**How many vectors can pgvector handle?**
Comfortably into the millions on a right-sized instance, especially with an HNSW index. The practical limits are index memory and query latency, which scale with row count and dimensions. Look at a specialised engine around tens of millions of vectors with heavy traffic.

**Is pgvector available on managed Postgres or Kloudbean?**
pgvector is the standard PostgreSQL vector extension, and Kloudbean offers managed PostgreSQL with backups, private networking, and controlled access. Whether the extension can be enabled depends on your specific Postgres setup and version, so check availability for your instance. Kloudbean does not sell a separate vector database product.

_By Kloudbean · Vectors, in your database._
