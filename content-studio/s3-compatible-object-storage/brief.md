# Brief — S3-Compatible Object Storage (listicle)

Cluster 7. Primary kw: s3 compatible object storage / object storage / what to store in s3. Intent: informational. (S3 zero-egress cluster signal.)
FORMAT: Listicle (N things that belong in a bucket). Not adjacent to other listicle. Opener = disk-filling scenario.
Items (move off server → buckets): 1 user uploads 2 media libraries (img/video) 3 backups (OFF the app server) 4 static assets / built frontend 5 logs & archives 6 data exports / user downloads 7 large streamed files. Plus why (durable, scalable, cheap, survives rebuilds, CDN-friendly) + what NOT to put in a bucket (live database, active app code). SCREENSHOT s3-buckets.png.
Honesty woven: Linux; S3-compatible = standard API (works with existing SDKs/tools); managed storage, you own the objects.
Byline: "Kloudbean · Get it off the disk."
Slug: s3-compatible-object-storage. Links: zero-egress-object-storage, hosting-for-agencies-playbook (C5), how-to-clear-wordpress-cache (CDN).
