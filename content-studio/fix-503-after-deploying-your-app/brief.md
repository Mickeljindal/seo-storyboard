# Brief — Fix the 503 After Deploying Your App

Cluster 1. Primary kw: fix 503 after deploy. Secondary: 503 service unavailable app, app won't start after deploy, deployed app 503 error, debug deploy 503.
Intent: troubleshooting how-to. A builder whose freshly deployed app returns 503 and needs to diagnose+fix.
Angle: The 503 is the most common and most fixable post-deploy problem. What it means (app process isn't up / not answering on expected port). Where to look FIRST: app.error.log at /home/admin/hosted-sites/<app_system_user>/app-logs + Build & Deployment History. Then causes in order of likelihood: (1) not listening on process.env.PORT, (2) missing env var, (3) wrong Start command (built but doesn't start a server), (4) crash on startup (missing dep not in package.json / DB connection fail / uncaught error), (5) build actually failed. Give a diagnostic order-of-operations. Distinguish build-time failure vs runtime crash.
Distinct: troubleshooting/debugging guide (not a deploy walkthrough). Use git-deployment.png (Build & Deployment History context).
Slug: fix-503-after-deploying-your-app. Images: hero.png + ../assets/console/git-deployment.png. Links: env-vars article, pillar, pricing.
Honesty guardrails: Linux stacks; logs path real; be concrete. No blurbs.
