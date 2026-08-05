# Brief — Deploy a Symfony App to Production

Cluster 3 — App Deployment Tutorials. Sibling to `deploy-laravel-app` (the other big PHP
framework). Stay Symfony-specific; link Laravel, don't repeat it.

## Keywords (hedge volumes; no fabricated numbers)
- **Primary:** `deploy symfony app` (also target `symfony production`, `symfony hosting`).
  Placed in H1, `<title>`, meta description, first 100 words, and the H2
  "Wiring the Symfony deploy on a managed server" / the FAQ. Steady evergreen developer
  intent; treat volume as low-to-moderate, high-quality (buyer-adjacent) rather than high-volume.
- **Secondary / long-tail (woven through body + FAQ):**
  - symfony APP_ENV prod
  - APP_SECRET symfony
  - composer install --no-dev (--optimize-autoloader)
  - symfony cache:clear / cache:warmup (--env=prod)
  - doctrine migrations deploy (doctrine:migrations:migrate --no-interaction)
  - symfony var/cache permissions / "unable to write in the cache directory"
  - symfony behind nginx / nginx docroot public/
  - symfony DATABASE_URL / connect symfony to a database
  - symfony opcache / preload
  - bin/console / symfony console
  - .env.local / composer dump-env prod
- **Error string targeted (real, paste-into-Google intent):**
  `Unable to write in the cache directory (.../var/cache/prod)`.

Volumes: no SEMrush/DataForSEO export was supplied for this exact topic in-session, so no
precise numbers are asserted. If cited later, keep them hedged. Treat this as an evergreen
how-to whose value is answer quality + citation, not raw volume.

## PAA-style questions (mirrored into the on-page FAQ + FAQPage JSON-LD)
- How do I deploy a Symfony app to production?
- What does APP_ENV=prod do?
- How do I run composer install for production?
- Why do I get a 500 error on var/cache after deploying?
- How do I run Doctrine migrations on deploy?
- How do I connect a Symfony app to a database?
- Do I need to run cache:warmup?
- What should the nginx docroot be for a Symfony app?
- What is APP_SECRET and do I need to change it?
- Can I host a Symfony app on Kloudbean?

## Angle / shape (distinct from Laravel)
"The honest Symfony deploy guide." Laravel's spine was "one codebase, three processes"
(web + queue worker + scheduler). Symfony's spine here is the deploy **pipeline + the sharp
edges**: APP_ENV=prod & APP_SECRET, composer --no-dev, cache:clear/warmup (compiled
container in var/cache), Doctrine migrations, the var/ permissions 500, public/ as docroot
behind nginx + PHP-FPM, DATABASE_URL to a managed DB. No queue-worker centerpiece (Messenger
gets one light `.note`, not a section).

## Assets
- Hero: images/hero.png (rendered later by the hero pipeline; do not create).
- SVG (bespoke, navy #000f27 / purple #4F1AF3 / green #40b75f): left-to-right deploy
  pipeline (git push → build: composer --no-dev + cache:warmup → migrate → nginx+PHP-FPM
  serving public/index.php), managed DB below reached over DATABASE_URL, footer strip =
  var/cache + var/log writable + opcache. Distinct from Laravel's "three processes" diagram.
- Console screenshots: env-vars, launch-database, add-application, git-deployment.
- 3 `.img-slot` spacers (env files; var/ permissions error + fix; live build log).

## Internal links (7 used; all target folders confirmed to exist)
Linked in body: deploy-laravel-app (sibling), environment-variables-done-right,
add-managed-database-to-your-app, managed-mysql-hosting (the one "managed X" money page),
database-migration-pg_dump-mysqldump, reverse-proxy-explained, ci-cd-auto-deploy-from-github.
Mentioned as plain text (not linked, to keep the count at 7 and one money page):
managed PostgreSQL, "a managed server".

## Byline
By Kloudbean · **Symfony, Served.** (unique; not "Faster Than Ever").

## Honesty guardrails (grounded in kloudbean-facts.md)
- Symfony framed as **a PHP application on Kloudbean's managed PHP stack** (same stack as
  WordPress/Laravel/Magento/Drupal/Joomla). NO claim of a named one-click Symfony installer
  (not in facts). Stated explicitly in the FAQ.
- Managed CI/CD from Git with live build logs; env vars set in the console; managed
  MySQL/MariaDB/PostgreSQL; free auto-renewing SSL; nginx/PHP-FPM handled; Shorewall +
  Fail2ban baseline; 7 clouds. Free migration + free trial approved to feature.
- Staging framed generally ("deploy to a staging copy first"), NOT as a named Symfony
  staging feature (facts name staging for WordPress & Laravel only).
- Autoscaling omitted (enterprise/custom only; not for general readers).
- Linux stacks only (the .NET/IIS honesty line kept, once, non-templated).
- No invented metrics/benchmarks; only real commands, real env var names, and the real
  "Unable to write in the cache directory" error string.

## Anti-patterns + opinions carried (depth signals, zero fabrication)
- Anti-pattern: `chmod -R 777 var` (use ACLs/ownership); pointing docroot at project root
  (leaks .env); `doctrine:schema:update --force` in prod.
- Opinions: set APP_ENV=prod (most important var); turn opcache on and leave it on; use
  migrations, not schema:update --force; warm the cache at deploy, not on the first request.
