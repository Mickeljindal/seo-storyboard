# Brief: psql-list-databases-and-tables

Full analysis and build order in `content-studio/_competitor-gap-research.md` (tier 2).

## Target keyword and real search data

Source: `kloudgraph-semrush-export` gap.keywords exports. This is a variant family, written as ONE
article organised by task per the operating-system rule, not ten thin pages.

| Keyword | Volume | KD |
|---|---|---|
| postgres list tables | 1,300 | 29 |
| create database postgresql psql | 1,300 | 38 |
| postgres list databases | 1,000 | 27 |
| psql list databases | 1,000 | 41 |
| list tables in psql | 1,000 | 27 |
| psql list tables | 880 | 27 |
| list schemas postgres | 480 | 35 |

Kinsta owns most of these. Primary: **postgres list tables**. Secondary: the family above.

## Cannibalisation check (done against live H2 sets)

No psql or Postgres command-reference page existed. The live Postgres pages are hosting, tuning,
full-text and ORM-connection pieces, none a CLI reference, so no overlap. Links to
`managed-postgresql-hosting`, `postgresql-performance-tuning`, `database-connection-pooling`,
`database-private-access-control`, `mysql-vs-postgresql`, `database-migration-pg_dump-mysqldump`,
`add-managed-database-to-your-app`, `fix-error-establishing-database-connection-wordpress`.

## Information gain (one sentence)

Beyond the commands, the page explains the four reasons `\dt` returns nothing (wrong database, tables
off the search_path, objects are views, or an empty database), gives the SQL equivalent of every
meta-command for use in scripts and GUIs, and covers connecting psql to a managed database safely.

## Product claims

Only from `kloudbean-facts.md`: managed PostgreSQL among seven managed engines, one-click provisioning,
automatic backups, seven clouds, free SSL, free migration. Database kept off the public internet by IP
allow-listing for general accounts; full private networking (VPC) framed as Enterprise only. Honest
boundary stated once. No SLA, uptime, or one-click read-replica claims.

## Format

Task-organised command reference, not the error-article shape.
