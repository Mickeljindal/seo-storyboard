# Brief — Deploy Your Bolt.new App to Production

Cluster 1. Primary kw: deploy Bolt.new app. Secondary: host Bolt app, Bolt.new to production, Bolt.new deployment, bolt.new own server.
Intent: how-to/commercial. A builder who built a working app in Bolt.new (in-browser StackBlitz WebContainer) and wants it live on a real, owned server.
Angle: Bolt runs in an in-browser WebContainer and can export the project to GitHub — the output is standard Vite/Node/React code. The gap is "works in the Bolt preview" vs "running 24/7 on a real server with a database, domain, SSL." Walk the real Kloudbean flow: repo -> Add Server -> Deploy Code -> managed DB -> env vars -> domain+SSL -> auto-deploy. Bolt-specific: export to GitHub, WebContainer is not production, full-stack apps need a real Node process + DB.
Distinct from other deploy guides: emphasize the in-browser WebContainer -> real server transition and Bolt's GitHub export.
Slug: deploy-bolt-new-app. Images: hero.png + ../assets/console/git-deployment.png. Links: pillar, Lovable guide, pricing.
Honesty guardrails: Linux stacks only (Node/React/Vite/etc), not Windows/.NET/IIS; managed = server/stack/SSL/backups, you own the app. No blurbs.
