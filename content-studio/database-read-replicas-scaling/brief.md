# Brief — Database Read Replicas & Scaling (quickstart + reference)

Cluster 7. Primary kw: database read replicas / scale database reads / read replica. Intent: how-to/reference.
FORMAT: Quickstart + reference. 8th distinct C7 format. Opener = scenario (DB pegged, mostly reads).
Quickstart: what a read replica is / when you need one (read-heavy, DB CPU high) / add one (managed = a click) / point reads at the replica. Reference: primary vs replica roles / replication lag (reads may be slightly stale — design for it) / read-write split in app / when replicas DON'T help (write-heavy → shard/scale up instead) / cache FIRST (cheapest) / replicas vs HA failover (different purposes, can overlap). SCREENSHOT flb-load-balancer.png (spread/distribute reads).
Honesty woven: Linux; managed handles replica setup+replication; you own schema/queries; replication lag is real — be honest.
Byline: "Kloudbean · Read big, write calm."
Slug: database-read-replicas-scaling. Links: managed-postgresql-hosting, managed-mysql-hosting, scalable-wordpress-hosting (C6), managed-redis-hosting.
