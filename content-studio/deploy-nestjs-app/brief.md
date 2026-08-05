# Brief — How to Deploy a NestJS App to Production

Silo 2 (Deploy any app). Spoke under the `how-to-deploy-any-app` pillar. Sibling to `deploy-node-app-to-managed-cloud` and `deploy-express-app`.

## Keywords (ground the copy)
- **Primary:** deploy NestJS app (in H1, title, meta description, first 100 words, and the H2 "Deploy your NestJS app from Git").
- **Secondary / long-tail woven through body + FAQ:** deploy NestJS to production, NestJS hosting, host a NestJS API, NestJS production build, nest build, node dist/main.js, @nestjs/config env vars, enableShutdownHooks, run NestJS with PM2, NestJS behind Nginx, connect NestJS to a managed database (TypeORM / Prisma DATABASE_URL), "nest: not found", synchronize true data loss.
- Volumes not pulled from SEMrush/DataForSEO for this run; do not cite invented numbers. Re-mine if precise volume/difficulty is needed later.

## Intent & angle
How-to, commercial-adjacent. Reader is a developer who built a NestJS API, runs it with `start:dev`, and needs the real production path. Differentiator vs the Node sibling: the sibling covers general Node production concerns (crash-restart, process.env.PORT, SIGTERM, cluster). This piece leads with what is genuinely NestJS-specific: the compile step (`nest build` -> `dist/`, run `node dist/main.js`), `@nestjs/config`, `enableShutdownHooks()`, TypeORM/Prisma `synchronize:false` + migrations, and the `nest: not found` devDependencies gotcha. Founder framing: a NestJS deploy is the Node deploy plus one build step.

## Shape (not the fixed template)
Lead -> .tldr (answers "how do I deploy a NestJS app to production?") -> "what changes in prod" (the build) + founder note -> bespoke SVG -> production build steps -> @nestjs/config env vars -> shutdown hooks -> PM2 behind Nginx -> Git deploy on Kloudbean -> managed DB (TypeORM/Prisma) -> domain + SSL -> "where it goes wrong" anti-pattern beat -> what you own -> CTA -> 10-question FAQ.

## Assets
- Bespoke inline SVG: dev-vs-prod pipeline (ts-node/watch on localhost vs git push -> nest build -> dist/main.js -> PM2 -> Nginx :443 -> HTTPS). Brand navy #000f27 / purple #4F1AF3 / green #40b75f. Unique from pillar (six-moves) and Node sibling (crash loop + cluster).
- Real console screenshots: add-application, git-deployment, env-vars.
- 4 img-slots: nest build terminal, pm2 list, build/deploy live logs, (optional).

## Internal links (7; all folders exist except deploy-express-app, a sibling being created alongside — link kept per instruction)
UP: how-to-deploy-any-app. Across: deploy-express-app, deploy-node-app-to-managed-cloud, environment-variables-done-right, add-managed-database-to-your-app, ci-cd-auto-deploy-from-github. Money: heroku-alternative-for-modern-apps.

## Byline
By Kloudbean Platform Team · A NestJS deploy is the Node deploy plus one step: the build. (NOT "Faster Than Ever".)

## Honesty guardrails
Linux stacks only (Node framework, no Windows/.NET). PM2 multi-process supported; managed CI/CD from Git + live build logs; Node runtime config + env vars in UI; free auto-renewing SSL; 7 managed DB engines; 7 clouds. From $8/mo, Enterprise custom. Autoscaling/k8s = enterprise/custom only (framed lightly, not "automatic for everyone"). No Docker one-click claim. No customer/geo counts, no "is certified". Escape < > & in &lt;pre&gt;.
