# Brief — How to Deploy a SvelteKit App to Production

Silo 2 (Deployment). Spoke under how-to-deploy-any-app.

Primary kw: **deploy SvelteKit app** (est. low-mid volume, low-mid difficulty; framework how-to intent). In H1, title, meta description, first 100 words, and the walkthrough H2.
Secondary / long-tail woven in: deploy SvelteKit to production, SvelteKit hosting, SvelteKit adapter-node, host a SvelteKit app on your own server, deploy SvelteKit without Vercel/Netlify, node build, adapter-static vs adapter-node.
PAA-style questions mirrored into the FAQ + FAQPage JSON-LD: how do I deploy a SvelteKit app to production; which adapter to self-host; run without Vercel/Netlify; what does node build do; fix "Cross-site POST form submissions are forbidden"; adapter-static or adapter-node; env vars in production; why adapter-static build fails; Node version + start command; do I need PM2.

Intent: a dev who built a SvelteKit app and wants it on a server they own, confused by adapter-auto hiding the deploy decision.

Angle (no fixed template): anchor the whole piece on the ADAPTER decision, which is the SvelteKit-specific fork. adapter-node = a real Node server (npm run build -> build/, node build on :3000, PM2 + Nginx + SSL) for anything dynamic; adapter-static = prerendered files served like a static site (free static hosting) for pure content. Decision-tree SVG, then each branch, then a compare table, then the concrete Kloudbean walkthrough, then real failure modes, then honest limits. Founder note: pick the adapter that matches your app; adapter-node is the "own server" default.

Distinct from siblings: deploy-nextjs (output:'export' vs server) and deploy-nuxt (Nitro presets) solve the same "where does it run" question for different frameworks. This one owns the SvelteKit adapter framing + the ORIGIN form-action gotcha, which competitors' generic guides miss.

Original / cannot-copy value: the exact `Cross-site POST form submissions are forbidden` error and the ORIGIN fix (grounded in official adapter-node docs); the five-item "where SvelteKit deploys break" field guide; the adapter-static prerender-failure explanation; the $env/dynamic/private runtime-secret framing.

Slug: deploy-sveltekit-app. Byline: "By Kloudbean Engineering · Choose the adapter first, and the rest of the SvelteKit deploy falls into place." (closing byline varies; NOT "Faster Than Ever").

SVG concept: two-lane adapter decision diagram off svelte.config.js — adapter-node -> build/ -> node build (:3000) -> PM2 -> Nginx :443 HTTPS, vs adapter-static (prerender=true) -> build/ static files -> static host + free SSL. Brand navy #000f27 / purple #4F1AF3 / green #40b75f. Unique to this article.

Images: hero.png (rendered later, do not create) + real console screenshots add-application, git-deployment, env-vars; 4 author img-slots (node build terminal, build/deploy logs, domain+SSL panel, and the terminal slot).

Internal links (6, all live except deploy-nuxt-app which is being created alongside): UP how-to-deploy-any-app; across deploy-nextjs-app-to-your-own-server, deploy-nuxt-app, environment-variables-done-right, custom-domain-and-ssl-for-your-app; money netlify-alternative-for-full-stack-apps.

Honesty guardrails: Node/Linux only (SvelteKit adapter-node = standard Node server; no SvelteKit one-click template claimed, deploy on the Node.js stack); free static hosting real for adapter-static output (custom domain + SSL + visit analytics); PM2 multi-process real; managed CI/CD + live build logs real; 7 clouds, 7 managed DBs; one region not global edge (Cloudflare paid add-on, free on Enterprise); from $8/mo, Enterprise custom. No customer/geo counts, no invented features. Facts grounded in kloudbean-facts.md; SvelteKit specifics verified against official adapter-node docs (svelte.dev/docs/kit/adapter-node).
