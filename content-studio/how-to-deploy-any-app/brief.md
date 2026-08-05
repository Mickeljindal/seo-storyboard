# Brief — How to Deploy an App (S2 PILLAR)

**Slug:** how-to-deploy-any-app
**Silo:** 2 — Deployment fundamentals + frameworks. This is the CREATE-PILLAR / hub for the silo.
**Primary keyword:** how to deploy an app
**Secondary keywords:** how to deploy an application, deploy app to production, deploy app to server, what does deploying an app mean, how app deployment works, deploy any app, long-running process, reverse proxy, build artifact.
**Search intent:** informational-to-commercial. A developer (often first-timer or AI/vibe-coder) who can build but has never shipped, searching for the universal "how deployment works." Wants the mental model, not one framework's steps.

## Angle (unique DNA)
Teach the ONE model that every deploy shares instead of a framework-specific how-to. The six moves: build artifact -> long-running process -> reverse proxy -> domain + SSL -> keep-alive/supervisor -> where state lives. Then branch by app type (static / SSR / API / worker) and route DOWN to every framework spoke. Not a step-1-2-3 template; it's a concepts-first pillar with a route map. Senior-engineer voice: explains WHY each move exists, the anti-patterns (dev server in prod, SQLite/uploads on local disk, build-time env vars set too late), and a clear opinion (managed server is the sane middle path; premature microservices cost more than they save).

## Grounding note (per playbook default 2 + kloudbean-facts)
All Kloudbean claims grounded in kloudbean-facts.md / reconciled facts: 7 clouds (AWS, Amazon Lightsail, Google Cloud, DigitalOcean, Vultr, Akamai Linode, UpCloud), 7 managed DBs (MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB), Git CI/CD with live build logs, PM2 for Node, free auto-renewing SSL, automatic backups, multiple apps per server, static site hosting (free, domain + SSL + analytics), from $8/mo entry. 503 -> app.error.log detail reused from the AI-deploy pillar (grounded). No customer/geo/CSAT numbers. Linux stacks only; managed = shared responsibility.

## Structure
Eyebrow -> H1 (kw) -> hero -> lead -> .tldr (40-60w answer-first) -> six-moves teaching + ONE bespoke SVG (pipeline: git push -> build -> process:PORT -> reverse proxy :443 -> domain+SSL, with a green supervisor restart loop and a dashed state band DB/object-storage/cache) -> app-type decision table.cmp -> env vars -> three deploy paths (opinion) -> concrete Kloudbean click-path (real console shots: add-server, add-application, git-deployment, env-vars, launch-database + 2 img-slots) -> 503 troubleshooting -> framework route map (pillar DOWN-links) -> honest limits -> CTA -> 10-Q FAQ + FAQPage JSON-LD.

## Links (pillar links DOWN; all targets verified to exist)
deploy-node-app-to-managed-cloud, deploy-nextjs-app-to-your-own-server, deploy-vue-app, deploy-astro-app, deploy-django-app, deploy-flask-app, deploy-fastapi-app, deploy-laravel-app, deploy-rails-app, deploy-golang-app, ci-cd-auto-deploy-from-github, environment-variables-done-right, custom-domain-and-ssl-for-your-app, fix-503-after-deploying-your-app, host-app-api-and-database-on-one-server, add-managed-database-to-your-app, s3-compatible-object-storage. Money page: best-managed-cloud-hosting (S4 pillar, created in this batch).

## Byline
Kloudbean · Every deploy is the same six moves once you can see them.

## Notes
Target length ~3500 words (longest of the batch). ~0 em-dashes in prose. hero.png rendered by pipeline afterward.
