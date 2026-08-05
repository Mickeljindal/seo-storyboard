# Brief — Server Backups Guide (tutorial)

Cluster 9. Primary kw: server backups / website backup / how to back up a server. Intent: how-to. (backups signal.)
FORMAT: Tutorial (numbered). Not adjacent to other tutorial. Opener = the "we had a backup... didn't we?" horror.
Steps: 1 decide what to back up (database, files/uploads, config) 2 set a schedule by RPO (how much data can you afford to lose) 3 store backups OFF the server — object storage (SCREENSHOT s3-buckets.png) 4 automate (don't rely on remembering) 5 TEST a restore (the skipped step) 6 retention / keep multiple versions 7 the 3-2-1 rule.
Real: backups intent.
Honesty woven: Linux; managed host does automated server-level backups + off-box; you own app-level/data backups + must test restore; a backup = its restore.
Byline: "Kloudbean · A backup you've actually tested."
Slug: server-backups-guide. Links: managed-mysql-hosting (C7 restores), s3-compatible-object-storage (C7), how-to-migrate-hosting-zero-downtime (C4).
