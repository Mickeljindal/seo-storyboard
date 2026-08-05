# Brief — Deploy a Django App (checklist / playbook)

Cluster 3. Primary kw: deploy django app / django production server / host django. Intent: how-to.
FORMAT: Checklist/playbook (different from laravel tutorial). Opener = runserver->production scenario. Two checklists: (A) prod SETTINGS that must change — DEBUG=False, SECRET_KEY from env, ALLOWED_HOSTS, CSRF_TRUSTED_ORIGINS, database from env; (B) deploy steps — pip install -r requirements, python manage.py collectstatic --noinput, migrate, run with GUNICORN (WSGI) as the server (NOT manage.py runserver), bind process.env PORT. Then static/media (WhiteNoise for static; S3 for media/uploads), optional Celery worker + beat. Honesty: Python/Linux; managed=server/stack/SSL/backups, you own the app; runserver is dev-only.
Dashboard: env-vars.png (Django settings via env). Distinct byline.
Slug: deploy-django-app. Links: pillar, add-managed-database, fix-503, pricing.
