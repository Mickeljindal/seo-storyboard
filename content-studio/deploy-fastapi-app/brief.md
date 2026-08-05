# Brief — Deploy a FastAPI App (myth-vs-reality)

Cluster 3. Primary kw: deploy fastapi app / fastapi production / uvicorn gunicorn fastapi. Intent: how-to + correcting misconceptions.
FORMAT: Myth-vs-reality — each H2 is a myth, answered with Reality. Different skeleton from laravel/django/golang/rails/flask. Opener = myth framing.
Myths: (1) async means one worker is enough → still run multiple Uvicorn workers to use all cores; (2) bare `uvicorn main:app` is production → run Uvicorn workers under Gunicorn/--workers + a process manager; (3) you need Kubernetes → one managed server w/ workers behind a load balancer scales far (SCREENSHOT: flb-load-balancer.png here); (4) async never blocks → sync/CPU-bound work in an async route blocks the event loop, use def routes / background tasks; (5) deploying FastAPI is totally different → it's ASGI vs WSGI, same deploy shape (build, start, PORT, env, DB).
Honesty woven: Python/Linux; managed=server/stack/SSL/backups, you own the app. Not a dedicated identical honesty block.
Dashboard: flb-load-balancer.png (workers behind LB / scale). Distinct byline: "Kloudbean · ASGI apps, served straight."
Slug: deploy-fastapi-app. Links: pillar, deploy-flask-app, autoscaling/LB, add-managed-database.
