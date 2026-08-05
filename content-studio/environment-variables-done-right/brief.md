# Brief — Environment Variables Done Right (for a Deployed App)

Cluster 1. Primary kw: environment variables for deployed app. Secondary: env vars best practices, .env in production, manage secrets in app, NEXT_PUBLIC vs server env.
Intent: how-to, commercial-adjacent (educational + product). A builder deploying a vibe-coded app who needs to handle env vars/secrets correctly.
Angle: Practical how-to. Golden rule: secrets/config out of code and out of Git. How to set on the platform (Runtime Config -> Environment Variables; Paste .env Content -> Convert to Key/Value -> Save). Build-time vs runtime vars. CLIENT-EXPOSED prefixes (NEXT_PUBLIC_, VITE_, REACT_APP_) leak to the browser — never put secrets in them (security). Missing var = #1 cause of 503. Rotation, per-environment values, don't commit .env. Verify via logs.
Distinct: focused security-aware how-to. Use git-deployment.png (Runtime Config shows env area).
Slug: environment-variables-done-right. Images: hero.png + ../assets/console/git-deployment.png. Links: pillar, add-db article, fix-503 article, pricing.
Honesty guardrails: Linux stacks; managed platform stores env vars for the app; you own values. Security: never expose secret keys to the client; server-only secrets stay server-side. No blurbs.
