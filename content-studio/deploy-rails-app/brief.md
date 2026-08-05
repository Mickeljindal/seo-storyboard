# Brief — Deploy a Rails App (Q&A explainer)

Cluster 3. Primary kw: deploy rails app / rails production server / host ruby on rails. Intent: how-to.
FORMAT: Q&A explainer — every H2 is a real question a person types. Different skeleton from laravel(tutorial)/django(checklist)/golang(teardown). Opener = the "it runs with rails server, now what?" question.
Questions: what does Rails need in prod? / how do I deploy it? / why "SECRET_KEY_BASE missing"? / database + migrations? / where do assets & uploads go (asset pipeline + Active Storage → S3)? / do I need Sidekiq? / is `rails server` ok in prod (no — Puma)? / what breaks first?
Honesty woven: Ruby/Linux; managed=server/stack/SSL/backups, you own the app; rails server is dev-only. NOT a dedicated identical honesty section.
Dashboard: launch-database.png (Rails + managed Postgres). Distinct byline: "Kloudbean · Rails in production, minus the server babysitting."
Slug: deploy-rails-app. Links: pillar, add-managed-database, fix-503, deploy-django-app.
