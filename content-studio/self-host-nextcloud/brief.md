# Brief — Self-Host Nextcloud (checklist / playbook)

Cluster 2. Primary kw: self host nextcloud / nextcloud hosting / self hosted google drive. Intent: how-to.
FORMAT: Checklist / playbook (distinct from formats used so far). Opener = "where are our files?" scenario (per-user Drive/Dropbox sprawl). Setup checklist in order: server (PHP stack), database (MariaDB/MySQL), install Nextcloud, domain+SSL, admin. Standout section = the STORAGE decision: local disk vs S3-compatible object storage as PRIMARY storage (real Nextcloud feature) -> embed s3-buckets.png. Hardening checklist: background jobs via cron (not AJAX), Redis for caching/file locking, PHP memory limit, 2FA, backups. Honesty: PHP/Linux app; managed=server/stack/SSL/backups, you own Nextcloud + files; files need real disk or object storage.
Dashboard: s3-buckets.png (object storage as Nextcloud primary store).
Slug: self-host-nextcloud. Links: best-self-hosted-tools, self-host-ghost, s3/storage cluster, pricing. Distinct byline.
