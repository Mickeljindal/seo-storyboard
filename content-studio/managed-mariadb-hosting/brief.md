# Brief — Managed MariaDB Hosting (managed-DB engine guide)

Silo 3 (managed databases). Spoke under add-managed-database-to-your-app.

## Keywords (ground the copy; volumes are rough, hedge in prose, do not fabricate precise numbers)
- Primary: **managed MariaDB hosting** (in H1, title, meta, first 100 words, one H2). Commercial/decision intent.
- Secondary woven through body + FAQ:
  - mariadb hosting
  - managed mariadb
  - mariadb vs mysql (own the comparison question; H2 + FAQ)
  - mariadb database hosting
  - mariadb connection string (H2 "Connecting your app" + FAQ)
- Real questions targeted in FAQ: "is mariadb the same as mysql", "mariadb or mysql for a new app",
  "mariadb connection string / driver", "does prisma/laravel/django/rails support mariadb",
  "migrate mysql to mariadb", "why utf8mb4", "mariadb for wordpress/woocommerce".

## Format / shape (deliberately NOT the same template as the MySQL sibling)
Fork-story + compatibility field guide. Opener = the "apt install mariadb-server / you may already be
running it" hook. Section order: origin/governance -> MariaDB vs MySQL honest table -> when to pick it
(founder coin-flip) -> connecting (driver/port 3306/DATABASE_URL/utf8mb4) -> framework table -> launch +
managed value -> migration -> fast & safe (+ anti-pattern) -> fits-your-stack -> CTA -> 10-Q FAQ.
Differentiator vs managed-mysql-hosting: that piece is the "ops bill of self-hosting"; this one is the
"what MariaDB is + how compatible it is" angle. No duplicated sections.

## SVG concept (bespoke, brand colors navy #000f27 / purple #4F1AF3 / green #40b75f)
MariaDB-vs-MySQL compatibility diagram: app+ORM -> shared green "mysql:// driver · port 3306 · mysqldump ·
MySQL-compatible wire protocol" bar -> two cylinders (MariaDB purple, MySQL navy). Teaches that the same
driver/port reaches either engine; figcaption names the few real divergences.

## Console screenshots
launch-database.png (engine choices incl MariaDB), env-vars.png (connection string stored safely).
Plus 2 img-slots (backups/restore panel; migration terminal).

## Internal links (7, all folders verified to EXIST)
UP: add-managed-database-to-your-app. ACROSS: managed-mysql-hosting, mysql-vs-postgresql,
managed-database-vs-self-managed. SUPPORT: server-backups-guide, what-is-a-vpc.
MONEY: digitalocean-vs-kloudbean.
(Redis is mentioned in-body as plain text, not linked, to keep the count at 7.)

## Byline (unique, NOT "Faster Than Ever")
By Kloudbean Databases Team · MariaDB, the open fork of MySQL, minus the ops.

## Honesty / fact notes
- 7 managed engines: MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB (MariaDB is real).
- Managed = provision/patch/backups/private network/SSL; customer owns schema + data (exportable via mysqldump).
- Linux stacks only. Pricing "from $8/mo"; enterprise custom (no dollar figure). No customer/geo counts.
- MariaDB facts are general/checkable (fork by Monty Widenius post-Oracle/Sun; MariaDB Foundation; distros
  ship it as default; JSON=LONGTEXT alias vs MySQL native JSON; utf8mb4 error 1366; port 3306; mysql driver).
  Framed as honest tech context, not Kloudbean-specific claims. No invented features (no one-click read
  replicas, no managed WAF, no Docker one-click).
