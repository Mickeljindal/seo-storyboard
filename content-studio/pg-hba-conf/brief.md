# Brief: pg-hba-conf

## Keyword grounding (competitor organic.Positions export, 2026-08-01 mine)

Mined with `python3 /tmp/compmine.py cloudways,kinsta,heroku,netlify,pressable,wpvip 700 34 6`.

| Keyword | Volume | KD | Competitor position |
|---|---|---|---|
| pg_hba.conf | 1,000 | 24 | heroku 3 |

Primary kw: **pg_hba.conf**. Secondary: pg_hba.conf entry, no pg_hba.conf entry for host,
pg_hba.conf location, pg_hba.conf reload, host based authentication postgres, pg_hba_file_rules.

Strongly on-brand: managed PostgreSQL is a core product, so the reader is squarely in the ICP rather than
being a passing search-volume opportunity.

## Cannibalisation check (this one is PARTIAL, and it shaped the scope)

Prose extracted from all 296 articles. Two articles mention pg_hba:

- `connect-sequelize-to-a-database` covers the error string `no pg_hba.conf entry for host ... no
  encryption` in **two places**, explains that the "no encryption" tail is the tell, and gives the
  `dialectOptions.ssl` fix. That is substantive coverage of the single highest-intent variant.
- `connect-sqlalchemy-to-a-database` mentions it in passing only.
- `managed-postgresql-hosting` does not mention it at all. Its H2s are product and concept level:
  why Postgres, JSONB, extensions, cost, connection weight, keeping the connection string private,
  scaling, migrating in.

So this page must **not** be another "my ORM cannot connect over SSL" article. It owns **the file**:
its rules, their order, the auth methods, and how to test a change. The SSL variant is handed off to
`connect-sequelize-to-a-database` by name and link.

## Distinct angle (the spine, quoted in substance from the docs)

**There is no fall-through.** PostgreSQL's own documentation states that the first record matching the
connection type, client address, database and user is used, that there is no fall-through or backup, that
if a record is chosen and authentication fails subsequent records are not considered, and that if no
record matches then access is denied.

That single rule explains most pg_hba confusion. People append a permissive rule at the bottom of the
file, reload, and nothing changes, because a stricter rule higher up matched first and PostgreSQL never
looked further. Order is not a style preference here. It is the algorithm.

The second-most-valuable point falls straight out of it: **two error messages, two different problems.**

- `no pg_hba.conf entry for host ...` means **no rule matched at all**. Add or widen a rule.
- `password authentication failed for user ...` means **a rule did match** and authentication failed
  inside it. The rules are fine; the credential or the method is wrong.

Confusing those two sends people editing a file that was already correct.

Third: **editing pg_hba.conf is only half the job for remote access.** The docs note that remote TCP/IP
connections are not possible unless `listen_addresses` is set appropriately, because the default is to
listen only on loopback. So a perfect host rule still fails until that parameter changes.

Fourth: **test before you reload.** The `pg_hba_file_rules` view exists for pre-testing changes and for
diagnosing why a load did not take effect, and rows with a non-null `error` field point at the broken
lines. Almost nobody uses it.

## Grounding + accuracy (verified against the PostgreSQL documentation)

Read the official client-authentication page. Facts to use exactly:

- The file traditionally lives in the cluster's data directory, and can be relocated via the `hba_file`
  parameter. `SHOW hba_file;` is the reliable way to find the one actually in use.
- It is read at start-up and on SIGHUP. Reload with `pg_ctl reload`, the SQL function
  `pg_reload_conf()`, or `kill -HUP`. **A restart is not required.**
- Obscure and verified: that reload requirement **does not apply on Microsoft Windows**, where changes
  are applied immediately to subsequent new connections.
- Record types: `local`, `host`, `hostssl`, `hostnossl`, `hostgssenc`, `hostnogssenc`, plus the
  `include`, `include_if_exists` and `include_dir` directives.
- Without a `local` record, Unix-domain socket connections are disallowed.
- `host` matches both SSL and non-SSL attempts.
- `hostssl` requires the server to be built with SSL support and the `ssl` parameter enabled, otherwise
  the record **is ignored except for logging a warning**. Good gotcha.
- `include_dir` includes files not starting with `.` and ending in `.conf`, processed in file name order
  under C locale rules, meaning numbers before letters and uppercase before lowercase.
- Records are one per line, `#` starts a comment, and a line can be continued with a trailing backslash.

Do not pin version numbers to features. Mention `scram-sha-256` as the modern method and `md5` as the
legacy one without asserting which release changed the default, per the moving-target drafting rule.

## Honest positioning (this is what differentiates the page)

**On managed PostgreSQL you cannot edit this file, and that is the point.** Say it plainly and early,
because it reframes the whole topic for a large part of the audience. The provider owns client
authentication, and what you get instead is a private network, a controlled allow list, and enforced
encryption. So the reader arriving from a managed database has a different job: stop looking for the
file and configure access where the platform exposes it.

Grounded Kloudbean facts: managed PostgreSQL among the managed engines, databases reachable on a private
network rather than the public internet, IP access control with allow and deny rules, subusers and
granular access control, automatic backups, seven cloud providers, one dashboard. Nothing about uptime,
no invented figures, and no claim that we expose pg_hba.conf.

## Structure

Reference and diagnostic, not a numbered how-to. Opens with the no-fall-through rule because it is the
misconception to break, then the two-error-messages table which is the fastest diagnostic, then an inline
SVG of rule matching stopping at the first hit, then the record anatomy, then auth methods, then the
listen_addresses pairing, then testing with pg_hba_file_rules and reloading, then the managed-database
section. 8 FAQs mirrored to FAQPage JSON-LD. No double quotes in any FAQ question.

Byline: "By Kloudbean Engineering · The first matching rule wins, and nothing after it is read."
Unique, not "Faster Than Ever".

## Links out

managed-postgresql-hosting, connect-sequelize-to-a-database, connect-sqlalchemy-to-a-database,
postgresql-performance-tuning, database-connection-pooling, what-is-a-vpc, mysql-vs-postgresql,
connect-drizzle-to-postgres.
