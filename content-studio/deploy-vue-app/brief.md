# Brief — Deploy a Vue App (decision-guide)

Cluster 3. Primary kw: deploy vue app / host vue js / vue production build. Intent: how-to (branching).
FORMAT: Decision-guide — branch by how the app was built. Different skeleton from laravel/django/golang/rails/flask/fastapi. Opener = "the first question isn't which host, it's what kind of Vue app you built."
Branches: (1) plain SPA (Vite → static dist/) — serve static + SPA history-mode fallback so refresh doesn't 404; where the files live = object storage + CDN (SCREENSHOT s3-buckets.png); (2) SSR (Nuxt / vite-ssr) — it's a Node server, deploy like Node (build, node start, PORT); (3) static/prerendered — static host.
Cross-cutting traps: VITE_ env vars are baked at BUILD time (not runtime) — rebuild to change; talking to an API without CORS pain (same origin / proxy / set base URL).
Honesty woven: static/Node on Linux; managed=server/CDN/SSL/backups, you own the app/build. Not a dedicated identical honesty block.
Dashboard: s3-buckets.png (static build assets in object storage + CDN). Distinct byline: "Kloudbean · From dist/ to done."
Slug: deploy-vue-app. Links: pillar, deploy-astro-app, s3/object storage, deploy-node (cluster 1).
