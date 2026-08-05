# Brief — Deploy a Full-Stack React App to Production

Cluster 1. Primary kw: deploy full-stack React app. Secondary: React app with backend to production, host React and Node API, deploy React SPA and API, full-stack React hosting.
Intent: framework how-to. A dev with a React front end + Node/Express API + DB who wants it in production on one owned server.
Angle: Full-stack React = SPA (Vite/CRA build) + Node/Express API + database. Deploy to ONE server. Two shapes: single process (Express serves the built React files AND /api routes) or two apps (static front + API) sharing DB. Cover the classic SPA gotcha (catch-all route serving index.html so client routing doesn't 404 on refresh), API base URL (relative /api or env-config, not hardcoded), building the front end, env prefixes (VITE_/REACT_APP_ = public). Flow via Deploy Code + DB + env + domain. Distinct from nextjs (SSR framework) — this is client-rendered React SPA + API.
Slug: deploy-fullstack-react-app-to-production. Images: hero.png + ../assets/console/git-deployment.png. Links: pillar, add-db, one-server, pricing.
Honesty guardrails: Linux/Node; managed=server/stack/SSL/backups, you own app; SPA is client-rendered (SEO note: consider SSR/prerender if SEO-critical — honest). No blurbs.
