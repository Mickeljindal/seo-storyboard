# Brief — How to Deploy a Remix App to Production, the Honest Way

Silo 2 (Deployment). Spoke under how-to-deploy-any-app, sibling to deploy-nextjs / deploy-nuxt / deploy-sveltekit / deploy-fullstack-react.

## Keywords (grounded, volumes hedged)

Primary kw: **deploy Remix app** (also targeting **Remix hosting** and **deploy Remix to production**). Framework how-to intent, likely low-to-mid volume, low-to-mid difficulty. No exact SEMrush/DataForSEO pull was available for this slug at write time, so volumes are left qualitative rather than fabricated. If precise numbers are needed, re-mine before publish. Primary keyword placed in H1, `<title>`, meta description, first 100 words, and the walkthrough H2 ("How do I deploy a Remix app to production on a server I own?").

Secondary / long-tail woven through the body and FAQ:
- Remix production build / `remix vite:build` / `build/server/index.js`
- Remix Node server, `remix-serve`, `@remix-run/serve`
- Remix loaders and actions (server-side data + mutations)
- Remix vs Next.js deploy
- Remix on your own server / self-host Remix without Vercel
- Remix environment variables (process.env, window.ENV, `.server` files)
- React Router v7 (framework mode), `react-router build`, `react-router-serve`
- Remix SSR, custom Express server, createRequestHandler

PAA-style questions mirrored into the FAQ + FAQPage JSON-LD: how do I deploy a Remix app to production; does a Remix app need a Node server; what does remix-serve do; Remix vs Next.js for deployment; how do loaders and actions work in production; how do I connect a Remix app to a database; is Remix the same as React Router now; how do I set env vars for Remix; why is my Remix app blank/404 in production; what Node version and start command.

## Intent + angle (no fixed template)

Reader: a dev who built a Remix app and wants it on a server they own, half-expecting to "just upload the files" because it's React. The myth-vs-reality hook kills that: a Remix app is not static. Loaders and actions run on the server every request, so you deploy a live Node process. Structure rotates away from the sibling templates: myth correction -> WHY (loaders/actions) -> request-lifecycle SVG -> build output -> two run shapes (remix-serve vs Express) -> Kloudbean walkthrough -> data layer -> env/boundary -> React Router v7 note -> failure modes -> honest limits -> CTA -> FAQ. Deliberately NOT the "one decision / two lanes" fork used by deploy-sveltekit or the "SSR or static, decide first" table used by deploy-nuxt.

Distinct from siblings: deploy-nextjs (output:'export' vs server), deploy-nuxt (Nitro presets, SSR vs generate), deploy-sveltekit (the adapter decision) all answer "where does it run" for their framework. This one owns Remix's specifics: loaders/actions as the reason it needs a server, the Vite build's `build/server/index.js` + `build/client/`, `remix-serve` vs a custom Express `createRequestHandler`, the `.server` file convention, the `window.ENV` client boundary, and the honest React Router v7 merge note.

## Original / cannot-copy value

- The static-SPA-vs-Remix comparison table that names the exact difference (where data is fetched, whether a Node process is needed, secret exposure).
- The "you shipped the passengers and left the driver at home" framing for the number-one mistake: uploading only `build/client/`.
- The five-item "where Remix deploys break" field guide (static-site deploy, dev server as Start, server code leaked into a component, hard-coded port -> 502, NODE_ENV before install skipping devDependencies).
- Grounded product tie-in: Node.js stack, managed CI/CD with live build logs, env vars in UI, 7 managed DB engines over private networking, free SSL + reverse proxy handled, PM2 process manager. No named one-click "Remix runtime" claimed (deployed as a standard Node app).

## Facts + accuracy notes

Remix specifics verified against Remix docs + the React Router v7 merge announcement (remix.run blog): Vite build emits `build/server/index.js` (configurable) + `build/client/`; `remix-serve` is the built-in prod server (`@remix-run/serve`, reads PORT, default 3000); custom server via `@remix-run/express` `createRequestHandler`. React Router v7 note is hedged and accurate: Remix v2 features merged into React Router v7 "framework mode" (late 2024); deploy shape unchanged (Node server, loaders/actions); commands rename to `react-router build` / `react-router-serve`; copy explicitly tells readers frameworks move fast and to check current React Router docs for exact package names. No RR7 version-specific claims beyond the merge itself.

Kloudbean facts grounded in kloudbean-facts.md: 7 clouds, 7 managed DBs, managed CI/CD + live build logs, runtime env vars in UI, PM2 multi-process, private networking/VPC, free auto-renewing SSL, reverse proxy handled, Cloudflare paid add-on (free on Enterprise), from $8/mo, Enterprise custom. Honesty: Linux Node only; "managed" = server/stack/SSL/backups/patching handled, you own code + data; one region not global edge. No customer/geo counts, no invented features, no autoscaling-for-normal-users claim.

## Slug + byline

Slug: deploy-remix-app. Byline (unique, NOT "Faster Than Ever"): "By Kloudbean Engineering · Server-Rendered, Server-Run." Closing byline varies: "Kloudbean · A Remix app is a program that runs, not a folder you upload. Deploy it like one."

## SVG concept (unique to this article)

A single-request lifecycle, not a decision fork. Browser sends GET /products -> into a dashed "your Remix Node server" boundary box containing `build/server/index.js` -> `loader() runs` -> queries a managed database (green) over the private network -> `render React to HTML` (the HTML already holds the data) -> green response arrow "HTML + data" back to the browser -> "then hydrates." Makes the SSR + server-side data point visual. Brand navy #000f27 / purple #4F1AF3 / green #40b75f, in `<figure>` + `<figcaption>`.

## Images

hero.png (rendered later by the hero pipeline, do not create) + real console screenshots add-application (Node app) and git-deployment (build/deploy). Four author img-slots: build-folder file tree, stack/Node-version selection, live build logs, app error log. All slot hints em-dash-free; HTML comments use `src -> images/your-file.png` (never a quoted src).

## Internal links (8, all confirmed to exist)

UP to pillar: how-to-deploy-any-app. Sibling/money: deploy-fullstack-react-app-to-production. Data layer: add-managed-database-to-your-app, connect-prisma-to-a-managed-database. Env: environment-variables-done-right. Proxy: nginx-reverse-proxy-for-node, reverse-proxy-explained. Keep-alive: pm2-vs-systemd. Deploys: ci-cd-auto-deploy-from-github. (Confirmed each folder exists under content-studio/ before linking; absolute https://www.kloudbean.com/blog/<slug>/ form.)

## Freshness / last reviewed

React Router is moving quickly (v7 framework mode, RSC previews). Re-check the RR7 package names and the Remix-to-RR7 framing on the next content refresh. Last reviewed: at write time.
