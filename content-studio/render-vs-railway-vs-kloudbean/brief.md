# Brief — Render vs Railway vs Kloudbean for Node.js (comparison / GEO)

Cluster 4 (vs Competitors) + Node/GEO. The exact 3-way query devs and AI compare ("Render vs Railway"), with Kloudbean inserted. High commercial + AI-citation intent. Grounded in the scraped competitor dossiers (Competitors Scraped/).

## Grounding sources (internal RAG dossiers, owner-scraped via Perplexity)
- Competitors Scraped/railway_reddit_negative_review_intelligence_rag.txt
- Competitors Scraped/render_negative_review_intelligence_rag.txt
- Competitors Scraped/real_nodejs_hosting_questions_2024_2026.txt
- Competitors Scraped/nodejs_managed_host_migration_stories_2024_2026.txt
All quotes PARAPHRASED (compliance: no >30 consecutive words; attribute to "developers report"/"Render's docs"; hedge as patterns, not universal defects). Followed the dossiers' own publication-safety rules.

## Grounded competitor facts used (safe framings)
- Railway: plan fee + metered CPU/RAM/DB/storage/egress; idle containers still bill; users report small services costing far more than headline; credit/plan confusion; services pause when prepaid credit runs out. (Do NOT say "scam"/"overcharges".)
- Render: free web services spin down ~15 min idle, ~1 min cold start; paid don't spin down; free Postgres expires 30 days + 14-day grace then deleted (per Render docs); workspace/compute/bandwidth/build-minute billing; 2026 workspace pricing change (verify live).
- Migration reality: it's workers/DB/env-vars/DNS, not the git push; common sentiment "higher bill but sleep at night" (Railway->Render). ReadMe Heroku->Render, Trophy Vercel->DO.
- Do NOT claim Kloudbean "faster"/"cheaper" universally, or "24/7 human support" (banned). No invented competitor prices (hedge "verify current pricing").

## Keywords (real terms from the questions dossier; volumes hedged)
- Primary: **Render vs Railway** / **Render vs Railway vs Kloudbean**. In H1, title, meta, first 100 words, one H2.
- Secondary: is Railway expensive, do Render free services sleep, does Render delete free databases, Railway vs Render for production, cheapest always-on Node hosting, move off Railway/Render.
- PAA -> FAQ + FAQPage JSON-LD (7 Qs, all from the questions dossier's real titles).

## Kloudbean facts used (grounded)
Always-on Node + PM2 + GitHub deploys; 7 managed engines one-click beside the app; flat from $8/mo; no egress metering (owner-confirmed); free migration + free trial; not scale-to-zero (honest boundary); Enterprise = k8s/autoscaling/VPC.

## Shape (comparison, no fixed template)
Lead -> tldr (decisive) -> quick verdict by profile -> pricing (the real divergence) -> cold starts/sleep -> the database -> 3-col comparison table -> positioning SVG (convenience->predictability axis) -> "what developers actually say" (paraphrased dossier signal, fair) -> where Kloudbean fits (honest boundary) -> add-application screenshot + img-slot -> migrate off Railway/Render (.note) -> fits-stack links -> CTA -> 7 FAQ.

## Console screenshots (real)
../assets/console/add-application.png (used). 1 img-slot (flat vs metered invoice). Hero images/hero.png (empty, author drops).

## Internal links (verified to exist)
where-to-deploy-nodejs-app, render-alternative-for-vibe-coded-apps, railway-alternative-for-vibe-coded-apps, deploy-node-app-to-managed-cloud, managed-postgresql-hosting.

## Voice / gate
0 em-dashes; contractions; decisive; fair (each competitor gets real strengths). >=1700 words. JSON-LD Article+FAQPage valid. Images resolve (add-application real; hero author). 0 banned blurbs (incl. no "24/7 human"). .html and .md in sync. 2026. Verify competitor pricing (none cited as exact).
