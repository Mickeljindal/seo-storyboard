# Brief — Deploy a Laravel App (tutorial)

Cluster 3. Primary kw: deploy laravel app / best laravel hosting (7-rival consensus) / laravel deploy. Intent: how-to.
FORMAT: Tutorial with fresh framing. Opener = "Laravel is more than a web process" (queues + scheduler) — the thing generic guides miss. Laravel specifics that make it non-generic: PHP 8.x + Composer; APP_KEY in .env; composer install + npm run build (Vite assets) + php artisan migrate + config/route cache; PHP-FPM behind web server (NOT php artisan serve in prod); THE TWO THINGS PEOPLE FORGET = queue worker (php artisan queue:work as a persistent background process) + scheduler (php artisan schedule:run via cron every minute); storage symlink. Data signal: best laravel hosting = 7 rivals.
Honesty: PHP/Linux (Laravel's home); managed=server/PHP stack/SSL/backups, you own the app; not Windows/IIS.
Dashboard: git-deployment.png (Deploy Code). Distinct byline.
Slug: deploy-laravel-app. Links: pillar deploy guide, add-managed-database, ci-cd, pricing.
