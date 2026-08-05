# Brief — Store User Uploads in Object Storage, Not on the App Server

Cluster 7 (Databases, Storage & S3). Sibling of s3-compatible-object-storage (concept pillar) and
why-my-ai-app-works-locally-but-not-in-production (troubleshooting). This one is the focused
"where do user uploads go, and how" capability guide.

## Keywords (volumes hedged — never cite precise numbers without data)
- Primary: **store user uploads in object storage** (commercial/how-to intent, low-to-mid volume, low difficulty).
  Also targeting **where to store user uploads** and **file uploads object storage** as head variants.
  Primary phrase placed in H1, <title>, meta description, first 100 words, and the H2
  "How to store user uploads in object storage."
- Secondary / long-tail (woven through body + FAQ):
  - user file uploads, image uploads, S3 bucket for uploads
  - presigned URL upload, direct-to-bucket upload, upload directly from browser
  - store uploads not on server disk, ephemeral filesystem uploads lost, uploads 404 after deploy
  - multer / multer-s3, formidable, Django FileField S3, django-storages, Laravel filesystem s3 driver,
    Rails Active Storage, Next.js route handler upload
  - public vs private bucket, serve images from bucket, Content-Type / CORS / Cache-Control for uploads
- Intent: a builder whose deployed app loses uploaded files on redeploy or 404s them behind a load
  balancer, and wants the correct pattern plus copy-paste code.

## PAA-style questions (mapped into the on-page FAQ + FAQPage JSON-LD)
- Why do my uploaded files disappear after a deploy?
- Where should I store user uploads?
- Should I store uploads in the database?
- What is the difference between a public and a private bucket?
- What is a presigned URL?
- How do I upload directly from the browser to a bucket?
- Can I use the S3 SDK with Kloudbean buckets?
- How do I serve images from a bucket?
- Do I have to rewrite my upload code to use object storage?

## Angle / shape (avoid the one-template tell)
Lead with the concrete failure (avatar 404s after the nightly deploy), diagnose WHY (ephemeral disk +
per-server disk behind a load balancer), then the correct architecture (bytes in a bucket, object key +
metadata in the DB), then two upload flows (server-side SDK put, and presigned direct-to-bucket), a
framework mapping table, public vs private decision, a production gotchas list, then the Kloudbean tie-in.
Bespoke SVG: "Browser -> App -> (bytes to Bucket) + (key/metadata to DB) -> serve by URL/presigned",
distinct from the s3-compatible sibling's PUT/GET-two-buckets diagram and the localhost/production diff.

## Visuals
- Bespoke inline SVG (navy/purple/green) of the split upload flow.
- ../assets/console/env-vars.png — storing S3 endpoint/bucket/keys as env vars.
- ../assets/console/s3-buckets.png — creating a bucket in the same dashboard.
- 3 .img-slot spacers: disk-vs-bucket before/after, framework storage config, bucket object list.

## Internal links (all live folders, absolute /blog/<slug>/)
why-my-ai-app-works-locally-but-not-in-production, add-managed-database-to-your-app,
environment-variables-done-right, s3-compatible-object-storage, gcs-object-storage-buckets,
server-backups-guide, deploy-ai-built-app-to-production. (7 total.)

## Byline
By Kloudbean Engineering · Files Belong in Buckets. (Unique; not "Faster Than Ever.")

## Honesty guardrails (grounded in kloudbean-facts.md)
- Built-in S3-compatible object storage since Nov 2024; full AWS S3 SDK/CLI compatibility since Mar 2025;
  managed GCS buckets since Dec 2025; public/private access controls; manage objects in the dashboard;
  same login as servers/apps/databases (one dashboard for the whole stack).
- OMITTED (unconfirmed / not in facts): zero-egress storage, object versioning as a Kloudbean feature,
  exact SLA %, any customer/geo numbers. Backups framed as a general discipline, linking the backups guide.
- No blurb cliches. Near-zero em-dashes in prose. Linux stacks only; managed = platform handles
  server/stack/SSL/backups/patching, you own your app code + data.
