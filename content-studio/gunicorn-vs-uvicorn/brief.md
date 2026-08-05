# Brief: Gunicorn vs Uvicorn

- **Slug:** `gunicorn-vs-uvicorn`
- **Silo:** Python in production (app deployment cluster)
- **Byline / tagline:** By the Kloudbean engineering team · "Serving Python in Production" (unique, not "Faster Than Ever")
- **Shape:** Decision guide / field guide (deliberately NOT the "5 myths" shape of the FastAPI sibling, NOT intro-why-steps-conclusion). Fork the reader on WSGI vs ASGI, then Gunicorn deep-dive, Uvicorn deep-dive, comparison table, workers reasoning, reverse proxy, gotchas, managed tie-in.
- **Angle:** Honest "which server for production" guide. Not winner-take-all. Real recommendation: Gunicorn for sync (Flask, classic Django), Uvicorn for async (FastAPI, Django ASGI), often Uvicorn workers under Gunicorn. Both behind nginx.

## Keywords

Volumes below are rough/hedged ranges, not exact SEMrush pulls (no mined data file present for this topic). Do not cite precise numbers in copy. Re-mine with DataForSEO/SEMrush if exact figures are needed later.

- **Primary keyword:** "Gunicorn vs Uvicorn" (comparison intent, steady developer search demand; placed in H1, `<title>`, meta description, first 100 words, and the "Gunicorn vs Uvicorn, side by side" H2).
- **Secondary keywords:**
  - WSGI vs ASGI
  - run Django in production
  - run FastAPI in production
  - Gunicorn workers / Uvicorn workers
  - gunicorn uvicorn worker class
  - async Python server
  - how many workers (Gunicorn / Uvicorn)
  - Flask production server
  - Uvicorn with Gunicorn
  - python app server production
- **Long-tail / entity terms woven in:** pre-fork worker model, event loop, `(2 x cores) + 1`, `uvicorn_worker.UvicornWorker`, `uvicorn-worker` package, `uvicorn.workers.UvicornWorker` (legacy), Uvicorn 0.30 own worker manager, `--bind` / unix socket, worker timeout, WebSockets, uvloop, httptools, Werkzeug dev server, `manage.py runserver`, reverse proxy / nginx, thread pool, gevent/eventlet/gthread worker classes.

## People-Also-Ask style questions (mapped to the on-page FAQ + FAQPage JSON-LD)

- Gunicorn vs Uvicorn: which should I use?
- What's the difference between WSGI and ASGI?
- Can I use Uvicorn with Gunicorn?
- How many workers should I run?
- Is Uvicorn faster than Gunicorn?
- Do I need Gunicorn for Django?
- Should I run the dev server in production?
- Do I still need Gunicorn for FastAPI now? (Uvicorn 0.30+ context)
- Do Gunicorn and Uvicorn replace nginx?
- What worker class should I use with Gunicorn?

## Internal links used (6, all live folders, absolute URLs)

- https://www.kloudbean.com/blog/reverse-proxy-explained/
- https://www.kloudbean.com/blog/nginx-reverse-proxy-for-node/  (sibling; concept transfers)
- https://www.kloudbean.com/blog/what-is-a-managed-server/
- https://www.kloudbean.com/blog/deploy-flask-app/
- https://www.kloudbean.com/blog/deploy-django-app/
- https://www.kloudbean.com/blog/deploy-fastapi-app/
- https://www.kloudbean.com/blog/environment-variables-done-right/

Note: `nginx-reverse-proxy-for-node` did not yet have a folder at write time (planned sibling). Linked per the topic plan; confirm the folder exists before publish, or the six confirmed-live slugs above stand on their own.

## Visuals

- Bespoke inline SVG: WSGI/ASGI decision fork (Flask/Django to Gunicorn on the sync side, FastAPI/async Django/WebSockets to Uvicorn on the async side), the `gunicorn -k uvicorn_worker.UvicornWorker` combo pill between the converging arrows, both feeding an nginx reverse-proxy bar to the internet. Brand colors navy #000f27, purple #4F1AF3, green #40b75f. Distinct from the FastAPI sibling's per-worker event-loop diagram.
- Real console screenshots: `add-application.png` (runtime config), `git-deployment.png` (install/start command deploy).
- 3 `.img-slot` author spacers (dev-server warning terminal, workers/memory resource view, deployed app / build log).
- Hero `images/hero.png` rendered later by the hero pipeline. Do not hand-create.

## Accuracy / honesty notes (grounded in kloudbean-facts.md)

- Kloudbean facts used: Python is a managed runtime (Flask, Django, FastAPI); Node/Python runtime config in the dashboard UI; managed CI/CD from Git with live build logs; process supervised/kept alive by the platform; free auto-renewing SSL; automatic server-level backups; managed = server/stack/SSL/backups/patching handled, you own app + data; free migration + free trial (approved to feature); entry pricing on the pricing page.
- Framed the app server as "the WSGI/ASGI server is configured via runtime config / handled by the platform." Did NOT claim Kloudbean internally "uses gunicorn/uvicorn" (not in facts).
- No autoscaling-for-normal-users claim. No invented benchmarks, worker counts, memory figures, or customer stories. `(2 x cores) + 1` is the well-known community rule of thumb, framed as such.
- Technical currency verified via web check: worker class moved to the `uvicorn-worker` package (`uvicorn_worker.UvicornWorker`); Uvicorn 0.30 (2024) added its own multi-worker manager. Both stated with hedged, non-fabricated framing.

## [CONFIRM] facts omitted

- No customer-count / geo / CSAT / uptime-SLA numbers (all still unconfirmed per facts).
- No specific Enterprise dollar figures.
- BitNinja / Cloudflare not featured (off-topic for this piece).
- Freshness watch: Uvicorn/Gunicorn version behavior and the worker-package split can change; re-check the `uvicorn-worker` guidance and any "since 0.30" line on refresh.
