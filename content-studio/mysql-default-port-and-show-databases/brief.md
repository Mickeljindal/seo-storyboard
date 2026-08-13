# Brief: mysql-default-port-and-show-databases

Full analysis and build order in `content-studio/_competitor-gap-research.md` (tier 2).

## Target keyword and real search data

Source: `kloudgraph-semrush-export` gap.keywords exports. One article covering two closely linked
questions (the port, and listing databases and tables), by task.

| Keyword | Volume | KD |
|---|---|---|
| mysql port | 1,300 | 38 |
| port 3306 | 880 | 21 |
| mysql show databases | 880 | 30 |
| mysql list databases | 880 | 26 |
| mysql default port | 480 | 35 |
| 3306 port | 590 | 21 |

Kinsta ranks several. Primary: **mysql port**. Secondary: port 3306, mysql default port, mysql show
databases, mysql list databases, show tables mysql, 3306 port.

## Cannibalisation check (done against live H2 sets)

No MySQL port or command-reference page existed. Live MySQL pages are hosting, tuning and comparison,
none a CLI or port reference. Links to `managed-mysql-hosting`, `managed-mariadb-hosting`,
`mysql-vs-postgresql`, `mysql-performance-tuning`, `database-connection-pooling`,
`database-private-access-control`, `fix-error-establishing-database-connection-wordpress`,
`add-managed-database-to-your-app`.

## Information gain (one sentence)

Two things a plain cheat sheet skips: the `-h localhost` (Unix socket) versus `-h 127.0.0.1` (TCP 3306)
distinction that explains why one connects and the other refuses, and that a "missing" database in
SHOW DATABASES is almost always a GRANT problem, wrapped around a strong opinion that 3306 should never
face the public internet.

## Product claims

Only from `kloudbean-facts.md`: managed MySQL and MariaDB among seven managed engines, one-click
provisioning, automatic backups, seven clouds, free SSL, free migration. Database access locked to the
app server's IP (allow-listing) for general accounts; full private networking (VPC) is Enterprise only,
never framed as a default. Honest boundary stated once. No SLA, uptime, or read-replica claims.

## Format

Port-plus-listing field guide with a security anti-pattern at its centre.
