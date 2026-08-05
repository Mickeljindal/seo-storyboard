# Brief — Deploy Your Windsurf App to Production

Cluster 1. Primary kw: deploy Windsurf app. Secondary: Windsurf to production, host Windsurf app, deploy Codeium Windsurf app, Windsurf Cascade deploy.
Intent: how-to/commercial. A builder using Windsurf (Codeium's agentic AI IDE, Cascade agent) whose app runs on localhost and needs a real, owned server.
Angle: Unlike browser tools, Windsurf edits REAL local code in your repo — so there's no export/preview gap; the code is already yours and (likely) in Git. The gap is "runs on my machine / localhost" vs "runs always-on for real users." Windsurf builds any framework (Node/Next/Vue/Python/etc.), so the deploy flow adapts commands. Key move: local .env -> server env vars. Walk real Kloudbean flow.
Distinct: "your code is already yours (local + Git), no export" + "any framework, same flow" + local .env transfer. Honest, no anti-tool tone.
Slug: deploy-windsurf-app. Images: hero.png + ../assets/console/git-deployment.png. Links: pillar, node/nextjs guides, pricing.
Honesty guardrails: Linux stacks (Node/PHP/Python + frameworks), not Windows/.NET/IIS; managed = server/stack/SSL/backups, you own app. No blurbs.
