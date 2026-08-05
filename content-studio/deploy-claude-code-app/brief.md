# Brief — Deploy Your Claude Code App to Production

Cluster 1. Primary kw: deploy Claude Code app. Secondary: Claude Code to production, host app built with Claude Code, deploy Claude Code project, Claude Code server.
Intent: how-to/commercial. A developer using Claude Code (Anthropic's terminal/CLI agentic coding tool) whose app runs locally and needs a real, owned server.
Angle: Claude Code is terminal-native — it edits real files in your local project and runs git itself, so your code is already yours and already committed. Often builds substantial/full-stack apps. Gap is localhost -> always-on server. Unique: Claude Code can drive parts of the deploy from your terminal (push, and after deploy help read app.error.log over SSH, fix, redeploy). Walk real Kloudbean flow. Key move: local .env -> server env vars.
Distinct: terminal-native / "the agent already did the Git" + "let Claude Code help debug the deploy from the terminal (SSH, logs)". Honest, no hype.
Slug: deploy-claude-code-app. Images: hero.png + ../assets/console/git-deployment.png. Links: pillar, node/nextjs guides, pricing.
Honesty guardrails: Linux stacks (Node/PHP/Python + frameworks), not Windows/.NET/IIS; managed = server/stack/SSL/backups, you own app. No blurbs.
