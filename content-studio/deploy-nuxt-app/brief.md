# Brief — Deploy a Nuxt App (SSR-vs-static how-to)

Silo 2 (App Deployment Tutorials). Spoke under how-to-deploy-any-app.

Primary kw: **deploy nuxt app** (est. mid volume, mid difficulty; hedge, not mined from SEMrush here).
Secondary / long-tail woven: deploy nuxt 3 to production, nuxt hosting, host a nuxt ssr app, nuxt on your own server, nuxt runtimeConfig env vars, .output/server/index.mjs, nuxt generate static.
PAA-style questions (mirrored into FAQ + FAQPage JSON-LD): how do I deploy a Nuxt 3 app to production; is a built Nuxt app static or a server; what command starts a Nuxt SSR server; what is the .output folder; how do env vars work in Nuxt; do I need to rebuild to change an env var; why does Nuxt throw window is not defined; what causes a hydration mismatch; nuxt build vs nuxt generate; can I run a Nuxt app and its API on one server.
Placement: primary kw in H1, title, meta description, first 100 words, and H2 "Deploy a Nuxt SSR app on a server you own".

Intent: how-to, commercial. Audience: a developer with a Nuxt 3 app ready to ship who doesn't know if it's a server or a static bundle.

FORMAT: practical deploy how-to, fork-first. Distinct skeleton from siblings — deploy-vue (three-shapes decision guide, history-mode 404 + VITE_ trap) and deploy-nextjs (folder-or-program, SSG/SSR/ISR + NEXT_PUBLIC_). This one is spined on the SSR/universal vs static/prerendered fork and goes deep on Nuxt-only material: Nitro `.output`, runtimeConfig + NUXT_ prefix (runtime-overridable for SSR, the genuine differentiator vs Vite/Next build-time baking), server/api + DB, and the SSR failure trio (window is not defined, hydration mismatch, 503).

Founder note (required): decide SSR vs static first; it changes the whole deploy. Delivered as an opinionated .note early.

Key commands/facts used: `nuxt build` -> `.output/server/index.mjs`; `node .output/server/index.mjs` (Nitro reads NITRO_PORT/PORT, NITRO_HOST/HOST); self-contained output, node-server preset; `nuxt generate` -> `.output/public`; runtimeConfig + `NUXT_`/`NUXT_PUBLIC_` overrides via `useRuntimeConfig()`; `import.meta.client` / `<ClientOnly>` guard; `server/api/` endpoints; `npx prisma migrate deploy` in build step.

Bespoke SVG: two-branch fork centered on the `ssr` flag. Branch A (purple/navy): nuxt build -> .output/server -> Node process (PM2, Nginx :443->:3000, SSL). Branch B (green): nuxt generate -> .output/public -> static host + CDN (no server, free SSL, visit analytics). Brand navy #000f27 / purple #4F1AF3 / green #40b75f. Unique vs Vue's three-lane and Next's three-mode diagrams.

Console screenshots: add-application (SSR app), git-deployment (Git deploy + build/start), env-vars (NUXT_ vars). Plus 4 img-slots (runtime config panel, NUXT_ vars, .output/public tree, app.error.log window-not-defined).

Internal links (6, all folders exist): UP how-to-deploy-any-app; ACROSS deploy-nextjs-app-to-your-own-server, deploy-vue-app, custom-domain-and-ssl-for-your-app, environment-variables-done-right; plus add-managed-database-to-your-app (DB pattern). MONEY (exactly one): vercel-alternative-for-full-stack-apps.

Byline (unique, not "Faster Than Ever"): "By Kloudbean Platform Team · Nuxt renders on the server, so that's what you deploy."

Honesty guardrails: Nuxt = Node app on Linux (no Windows/.NET). "Managed" = server/runtime/proxy/SSL/backups handled; you own code + data + rendering choices. Region, not edge; Cloudflare Enterprise edge caching is a paid add-on (free on Enterprise) — shown lightly. 7 managed DB engines listed accurately. Pricing from $8/mo, Enterprise custom (verify on pricing page). Free static hosting (custom domain + SSL + visit analytics) is real for `nuxt generate` output. No customer/geo counts, no invented features, no autoscaling-for-normal-users claim.
