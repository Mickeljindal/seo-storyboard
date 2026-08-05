# Brief — CI/CD: Auto-Deploy Your App from GitHub

Cluster 1. Primary kw: auto deploy from GitHub. Secondary: CI/CD for vibe-coded app, git push to deploy, automatic deployment, continuous deployment server.
Intent: how-to. A builder who wants every push to build+ship automatically instead of manual redeploys.
Angle: Practical how-to for push-to-deploy. Connect repo (Deploy Code), first manual deploy to confirm, enable Automated Deployment on a branch, then every push builds on the server and goes live. Branch strategy (main=prod, staging branch=preview app). Watch Build & Deployment History; rollback by redeploying a previous commit. HONEST scope: this is continuous DEPLOYMENT (build+ship on push), not a full CI pipeline with test matrices — you can still run GitHub Actions for tests/CI and let the server handle CD; or run tests in the build step.
Distinct: focused CI/CD how-to. Use git-deployment.png (auto-deploy toggle lives on that screen).
Slug: ci-cd-auto-deploy-from-github. Images: hero.png + ../assets/console/git-deployment.png. Links: pillar, fix-503 article, pricing.
Honesty guardrails: Linux stacks; auto-deploy = build on server + swap to live; failed build doesn't take down running app (redeploy/rollback); it's CD not a full CI system. No blurbs.
