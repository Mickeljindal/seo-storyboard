# Brief: launch-a-directory-website

## Angle (opportunity playbook, honest about the real work)
Most "how to build a directory site" content is a tooling tutorial. This one leads with the reason
directory projects actually die: the cold-start problem. It spends its weight on niche selection,
manual seeding, and the SEO reality of thin listing pages, then covers the technical shape (database
+ search/filter + server-rendered, crawlable pages + image storage) and monetisation. Fair to no-code
(Airtable / WordPress directory theme) as a legitimate validation path.

## Target keyword
- **Primary:** launch a directory website
- **Secondary:** niche directory site, directory website business, listings site,
  how to build a directory site, directory site SEO, directory website monetisation.

Volumes not asserted (no keyword export supplied for this topic; intent-grounded query family).
Per the owner rule, no invented volumes, market sizes, income figures, or traffic numbers appear
anywhere in the article.

Primary keyword placement: H1, `<title>`, meta description, first sentence of the lead, and the H2
"Why people launch a directory website in the first place".

## Intent
Informational, leaning commercial-investigation. A small-business owner or side-project builder
deciding whether and how to start a niche directory. Payoff is a realistic plan, not a signup.

## Information gain (one sentence)
It names the cold-start loop as the actual failure mode and turns it into a capacity test for niche
selection ("pick a niche you can personally seed"), then explains why the popular shortcut (scraping
to look full) produces thin duplicate pages that never rank and irritates the businesses you listed.

## Honesty / fairness
- No-code gets a real "right when" column, not a strawman. Custom build is not framed as always better.
- Explicit statement that no directory is promised to earn anything.
- Anti-pattern section on scraping, including the reputational cost with listed businesses.
- Founder opinion stated plainly: the curation is the business, the code is a weekend.

## Product mention (ONE sentence + one short CTA)
Kloudbean appears exactly once, in "Where you run it, once the requirements are clear", after the
reader's own requirements (durable database, image storage, always-on server rendering, traffic-driven
bandwidth) have already been established. Grounded claims used: managed PostgreSQL/MySQL with automatic
backups, S3-compatible object storage with data-transfer-out not metered, always-on server-rendered
apps, free SSL, one dashboard, from $8/mo. No rival product named alongside the egress point. No
private-networking claim. No uptime figure.

## Cannibalisation check
Neighbours read: cost-of-running-a-side-project (owns side-project cost modelling),
how-to-launch-a-micro-saas (owns the software-product launch shape),
s3-compatible-object-storage (owns the storage how-to), managed-postgresql-hosting and
add-managed-database-to-your-app (own the DB setup), database-connection-pooling, server-backups-guide.
None of them owns "directory / listings site as a business", the cold-start problem, or directory-page
SEO. This page links to them instead of repeating their material.

## Internal links used (7, all verified to exist)
s3-compatible-object-storage, cost-of-running-a-side-project, managed-postgresql-hosting,
add-managed-database-to-your-app, database-connection-pooling, server-backups-guide,
how-to-launch-a-micro-saas. (CTA links to kloudbean.com and /pricing/.)

## Format
Opportunity playbook, ~2200 words. Non-standard shape: appeal, failure mode, seeding tactics,
anti-pattern, technical anatomy, build-vs-no-code decision, SEO reality, image and bandwidth economics,
one hosting paragraph, monetisation table, ninety-day plan, FAQ. Includes `.tldr` (answer-first),
two `table.cmp` tables, one bespoke teaching SVG (request path plus the crawlable link graph),
four `.img-slot` author spacers, and a 9-question FAQ mirrored into FAQPage JSON-LD.
Near-zero em-dashes. Byline: "The code takes a weekend. The listings take months."
