# Brief: graphql-vs-rest

## Angle (knowledge-first comparison)
A senior-engineer take that helps someone actually choose, not a feature list. Teach what each
style is, make the real GraphQL win concrete (over-fetching / under-fetching, one round trip for
exactly the fields many different clients need), then the honest costs GraphQL adds. Land on a
clear opinion and a decision rule. Kloudbean appears once, lightly, in the CTA only.

## Target keyword
- **Primary:** graphql vs rest
- **Secondary (by intent):** difference between graphql and rest, rest vs graphql, when to use
  graphql, graphql or rest, graphql pros and cons, graphql vs rest performance.

Volumes not asserted. This is a high-demand evergreen developer comparison (the primary term is a
well-known, high-volume query), but no precise figure is claimed here since no SEMrush/DataForSEO
export was supplied for it. Intent-grounded, not gap-scored. No invented volumes.

## Intent
Informational / commercial-investigation. A developer or tech lead deciding between REST and
GraphQL for a new API, or wondering whether to migrate. The payoff is a confident decision, useful
even to a reader who never touches Kloudbean.

## Information gain (one sentence)
It gives the honest tradeoff most tutorials skip: not just the over-fetching win, but the real
costs GraphQL adds (HTTP caching breaking because everything is a POST to one URL, the N+1 problem
moving into resolvers and why you reach for DataLoader, schema/resolver overhead, clunky uploads
and error semantics, accidental expensive queries) plus a clear decision rule, in one place.

## Knowledge it delivers (all checkable)
- What each is: REST = resources + HTTP verbs; GraphQL = one endpoint + a typed query language.
- The win: over-fetching and under-fetching, one query returns exactly the fields, one round trip,
  serving many client shapes from one backend without custom endpoints.
- The costs: HTTP caching (POST to one URL is not cacheable by browser/CDN/proxy), N+1 in resolvers
  and DataLoader as the batching fix, schema/resolver + client-library complexity, no native file
  upload, HTTP-200-with-errors-array semantics, easy accidental expensive nested queries.
- Side-by-side request examples (two REST round trips vs one GraphQL query and its mirrored response).
- A dimension-by-dimension comparison table.
- Decision rule with an opinion: most CRUD apps and public APIs -> REST; GraphQL earns its keep when
  many clients need different data shapes or you are aggregating several backends. You can run both.

## Ownable angle / opinion
Take a position: a lot of GraphQL adoption is resume-driven, not problem-driven; REST is the sane
default for most apps; the database (N+1, pooling) decides real performance far more than the API
style. That opinion is what a competitor's neutral feature-list article will not print.

## Product mention (deliberately minimal, grounded in kloudbean-facts.md)
Kloudbean appears once, in the CTA: either API style is a Node or Python app that needs a server,
DB, and backups; Kloudbean runs managed servers for Express / FastAPI / Django across several
clouds, with managed databases and automatic backups. All grounded (runtimes list, 7 clouds,
managed DBs, automatic backups). No private-networking-as-default, no SLA %, no banned superlatives.

## Cannibalisation check
No existing graphql/rest/api-design page in content-studio (checked). Neighbours are deploy guides
(deploy-express-app, deploy-fastapi-app, deploy-node-app-to-managed-cloud) and data-layer pages
(managed-postgresql-hosting, database-connection-pooling) that own different intents (how to deploy
/ how to run the DB, not which API style to choose). Linked, not duplicated.

## Internal links used (5)
deploy-express-app, deploy-node-app-to-managed-cloud, deploy-fastapi-app, database-connection-pooling,
managed-postgresql-hosting (plus the CTA links to kloudbean.com and /pricing/). All verified present.

## Format
Knowledge-first comparison, ~2000 words. Frontmatter, H1, unique byline ("Choose for your clients,
not the hype cycle"), 2-4 sentence lead, .tldr answer box, 8 H2 sections (incl. FAQ), one teaching
SVG (over-fetching REST vs precise GraphQL query, brand colors), one table.cmp (dimension x REST x
GraphQL), request/response code blocks, a light CTA before the FAQ, and a 9-question FAQ mirrored
into FAQPage JSON-LD. Near-zero em-dashes. cluster: 8 - Infra Concepts.
