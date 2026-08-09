# Kloudbean Content Silo Plan + 6-Month Roadmap

The bird's-eye map of the whole content operation: every silo, every pillar, every
existing article, every topic still to write, how it all interlinks, what's missing,
what's redundant, and a month-by-month plan you can run without re-thinking.

Grounded in: the 100 articles already live in `content-studio/`, the real internal-link
graph, `STRATEGY-2026.md` (GEO/citation strategy), and `.kiro/steering/kloudbean-facts.md`
(product truth). Nothing here proposes a topic Kloudbean can't honestly serve.

Legend: **[LIVE]** already written and at the new bar · **[NEW]** to write · **[PILLAR]** silo hub · **[CREATE-PILLAR]** hub that does not exist yet and is the highest priority.

---

## 1. Bird's-eye view (the whole board on one screen)

We currently have **100 live articles**. The clusters were tagged inconsistently (mixed
labels, 5 untagged, 3 one-off clusters) and Silo 1 is overloaded with four different
intents. The plan below is the **finalized 11-silo structure** after cleanup, with a real
pillar for each. Target end-state at month 6 is roughly **175 articles**, fully siloed.

| # | Silo | Pillar (hub) | Live | To add | Money role |
|---|------|-------------|-----|-------|-----------|
| 1 | Deploy AI / vibe-coded apps | deploy-ai-built-app-to-production **[PILLAR]** | 15 | 12 | Top-of-funnel → trial |
| 2 | Deployment fundamentals + frameworks | **[CREATE-PILLAR]** how-to-deploy-any-app | 16 | 14 | Top-of-funnel |
| 3 | Managed databases + storage | add-managed-database-to-your-app **[PILLAR]** | 10 | 12 | High-intent |
| 4 | Comparisons / alternatives / vs | **[CREATE-PILLAR]** best-managed-cloud-hosting | 15 | 14 | **Bottom-of-funnel (converts)** |
| 5 | WordPress + WooCommerce | **[CREATE-PILLAR]** managed-wordpress-hosting | 11 | 12 | High-intent |
| 6 | Agency / multi-app / white-label | hosting-for-agencies-playbook **[PILLAR]** | 6 | 8 | **Bottom-of-funnel (high LTV)** |
| 7 | Self-hosted tools | best-self-hosted-tools **[PILLAR]** | 8 | 12 | Top-of-funnel → trial |
| 8 | Infra concepts (VPC, LB, scaling, DNS) | **[CREATE-PILLAR]** how-cloud-hosting-works | 8 | 10 | Educational / GEO citations |
| 9 | Security + compliance | **[CREATE-PILLAR]** secure-compliant-hosting | 10 | 12 | Enterprise trust |
| 10 | Pricing / cost / free | cloud-hosting-pricing-explained **[PILLAR]** | 6 | 8 | Decision-stage |
| 11 | **Geo wedge: Saudi / KSA (+ UAE, EU, India)** | **[CREATE-PILLAR]** cloud-hosting-saudi-arabia | 0 | 12 | **Defensible moat** |

Five **[CREATE-PILLAR]** hubs and the **entire KSA silo** are the biggest gaps. Fixing those is worth more than any single new spoke.

---

## 2. Finalized silo taxonomy (and the cleanup it implies)

Current tagging problems the plan resolves:

- **Silo 1 is overloaded.** Its 27 articles actually span four intents: AI-tool deploy guides, generic deploy fundamentals, competitor comparisons, and Lovable migrations. We split them into Silos 1, 2, 4.
- **Label inconsistency.** "4 — vs Competitors", "4, vs Competitors", "10 - Enterprise networking", etc. Normalize every `cluster:` value to one exact string per silo.
- **5 untagged articles** (add-managed-database, discord-bot-hosting, docker-container-hosting, host-multiple-apps-one-server, soc2-compliant-hosting) get a home.
- **3 one-off clusters** ("Architecture", "Hosting fundamentals", "Databases, Storage and S3") fold into the finalized silos.

Do this as a one-time front-matter normalization pass (see Roadmap, Month 1).

---

## 3. Silo-by-silo: pillar, live spokes, new spokes, linking

### Silo 1 — Deploy AI / vibe-coded apps
**Pillar [PILLAR]:** `deploy-ai-built-app-to-production` (already the #4 hub, 30 inbound links).
Intent: the huge wave of Lovable/Bolt/Cursor/etc. users who built something and can't ship it.

- **[LIVE]** deploy-lovable-app-to-your-own-server, deploy-bolt-new-app, deploy-cursor-app, deploy-v0-app, deploy-replit-app, deploy-windsurf-app, deploy-claude-code-app, move-lovable-app-off-vercel, move-lovable-app-off-netlify, lovable-self-hosted-alternative, lovable-on-managed-aws (11) + the pillar + 3 shared capability pages it leans on.
- **[NEW]** deploy-chatgpt-canvas-app · deploy-gemini-built-app · deploy-base44-app · connect-a-database-to-your-lovable-app · add-authentication-to-an-ai-built-app · why-my-ai-app-works-locally-but-not-in-production · ai-built-app-security-checklist · ai-built-app-is-slow-fix · from-prototype-to-production-checklist · move-app-off-replit · move-app-off-bolt-hosting · deploy-a-vibe-coded-saas.
- **Linking rule:** every deploy-`<tool>` spoke links UP to the pillar, ACROSS to 2 sibling tool guides, and OUT to the 3 capability pages (env-vars, custom-domain-ssl, add-managed-database). **This fixes 6 of the 8 current orphans** (deploy-bolt, deploy-claude-code, deploy-replit, deploy-windsurf, lovable-on-managed-aws are all orphaned today).

### Silo 2 — Deployment fundamentals + frameworks
**Pillar [CREATE-PILLAR]:** `how-to-deploy-any-app` (a hub that routes to every framework guide + the capability pages). This is the missing spine that would de-orphan the framework guides.

- **[LIVE]** deploy-node-app-to-managed-cloud, deploy-nextjs-app-to-your-own-server, deploy-fullstack-react-app-to-production, deploy-astro-app, deploy-django-app, deploy-fastapi-app, deploy-flask-app, deploy-golang-app, deploy-laravel-app, deploy-rails-app, deploy-vue-app, ci-cd-auto-deploy-from-github, custom-domain-and-ssl-for-your-app, environment-variables-done-right, fix-503-after-deploying-your-app, host-app-api-and-database-on-one-server (16).
- **[NEW]** deploy-express-app · deploy-nestjs-app · deploy-nuxt-app · deploy-sveltekit-app · deploy-remix-app · deploy-fastify-app · deploy-spring-boot-app · deploy-symfony-app · deploy-strapi-app · deploy-static-site (hub-adjacent) · pm2-vs-systemd · gunicorn-vs-uvicorn · nginx-reverse-proxy-for-node · run-a-cron-job-without-ssh.
- **Linking rule:** every `deploy-<framework>` links UP to the new pillar and ACROSS to 2 sibling frameworks. **This fixes the remaining orphans** (deploy-golang, deploy-laravel, deploy-rails).

### Silo 3 — Managed databases + storage
**Pillar [PILLAR]:** `add-managed-database-to-your-app` (the #1 hub, 39 inbound — keep it as the spine).

- **[LIVE]** managed-mysql-hosting, managed-postgresql-hosting, managed-redis-hosting, mysql-vs-postgresql, managed-database-vs-self-managed, database-read-replicas-scaling, s3-compatible-object-storage, zero-egress-object-storage, server-backups-guide (10 incl. the pillar).
- **[NEW] — the 6-engine gap first (Kloudbean runs 6 DBs; only 3 have pages):** managed-mariadb-hosting · managed-mongodb-hosting · managed-elasticsearch-hosting. Then: gcs-object-storage-buckets (Kloudbean has managed GCS; no page yet) · connect-prisma-to-a-managed-database · connect-drizzle-to-postgres · database-connection-pooling · pgvector-for-ai-apps · redis-caching-patterns · when-to-use-redis-vs-postgres · store-user-uploads-in-object-storage · database-migration-pg_dump-mysqldump.
- **Linking rule:** each DB-engine page links UP to the pillar, ACROSS to `mysql-vs-postgresql` and `managed-database-vs-self-managed`, and to `server-backups-guide` (the #2 hub, 32 inbound).

### Silo 4 — Comparisons / alternatives / vs (the conversion silo)
**Pillar [CREATE-PILLAR]:** `best-managed-cloud-hosting` (a fair "how to choose + who it's for" hub that all the vs/alternative pages ladder up to). This is where money is made; it deserves a real hub.

- **[LIVE]** cloudways-alternatives, kloudbean-vs-cloudways, kloudbean-vs-kinsta, kloudbean-vs-wp-engine, fly-io-alternative, vercel-alternative-for-full-stack-apps, netlify-alternative-for-full-stack-apps, railway-alternative-for-vibe-coded-apps, render-alternative-for-vibe-coded-apps, heroku-alternative-for-modern-apps, digitalocean-vs-kloudbean, managed-vs-unmanaged-hosting, reseller-hosting-vs-managed-cloud, single-tenant-vs-multi-tenant, managed-cloud-hosting-myths (15).
- **[NEW]** firebase-alternative · supabase-alternative (hosting angle) · aws-amplify-alternative · planetscale-alternative · digitalocean-app-platform-alternative · linode-vs-kloudbean · vultr-vs-kloudbean · aws-lightsail-vs-kloudbean · gcp-vs-kloudbean · hetzner-vs-kloudbean · namecheap-shared-hosting-alternative · godaddy-alternative-for-developers · best-heroku-alternative-2026 · best-vercel-alternative-for-databases.
- **Linking rule:** every comparison links UP to the pillar, and every top-of-funnel article in other silos links to the ONE most relevant comparison here. This is the mesh that turns reads into trials.

### Silo 5 — WordPress + WooCommerce
**Pillar [CREATE-PILLAR]:** `managed-wordpress-hosting` (the head term; currently missing a hub).

- **[LIVE]** agency-wordpress-hosting, enterprise-wordpress-hosting, scalable-wordpress-hosting, secure-wordpress-hosting, headless-wordpress-hosting, speed-up-wordpress, how-to-clear-wordpress-cache, fix-error-establishing-database-connection-wordpress, wordpress-cli-guide, wordpress-multisite-hosting, wp-rest-api-guide (11).
- **[NEW]** woocommerce-hosting · migrate-wordpress-to-kloudbean · wordpress-staging-guide · wordpress-backup-and-restore · move-wordpress-off-wp-engine · move-wordpress-off-kinsta · wordpress-redis-object-cache · fix-wordpress-white-screen-of-death · wordpress-php-version-guide · wordpress-two-factor-auth · wordpress-cdn-setup · woocommerce-speed-optimization.
- **Linking rule:** all WP spokes link UP to the new pillar; the fix/how-to pages link ACROSS to speed/security/cache siblings; enterprise + agency WP pages bridge to Silo 6 and Silo 9.

### Silo 6 — Agency / multi-app / white-label (highest LTV)
**Pillar [PILLAR]:** `hosting-for-agencies-playbook`.

- **[LIVE]** how-agencies-host-20-client-apps, white-label-hosting-for-agencies, reseller-hosting-vs-managed-cloud, host-multiple-apps-one-server (bridge from S2), wordpress-multisite-hosting (bridge from S5) (6).
- **[NEW]** client-billing-and-markup-for-hosting · agency-onboarding-checklist · wordpress-maintenance-retainer-plans · agency-migration-service-guide · multi-client-backup-strategy · subuser-and-uac-guide · agency-client-offboarding · reselling-managed-cloud-vs-reseller-hosting.
- **Linking rule:** pillar links down to all; each links to a Silo 4 comparison (agencies compare) and `subusers/UAC` + `server-backups-guide`.

### Silo 7 — Self-hosted tools
**Pillar [PILLAR]:** `best-self-hosted-tools`.

- **[LIVE]** self-host-supabase, self-host-n8n, self-host-ollama-open-webui, self-host-ghost, self-host-gitlab, self-host-nextcloud, self-host-langflow (8 incl. pillar).
- **[NEW] — lead with the confirmed one-click apps (Penpot, Postiz per facts):** self-host-penpot · self-host-postiz · then server-based: self-host-metabase · self-host-plausible-analytics · self-host-appwrite · self-host-directus · self-host-strapi · self-host-mattermost · self-host-vaultwarden · self-host-uptime-kuma · self-host-listmonk · self-host-baserow.
- **Linking rule:** each tool page links UP to the pillar, ACROSS to 2 similar tools, and to `add-managed-database` (most need a DB) + `server-backups-guide`. Confirmed one-click apps say "one-click"; everything else says "server-based" (keep the honesty split).

### Silo 8 — Infra concepts (VPC, load balancing, scaling, DNS)
**Pillar [CREATE-PILLAR]:** `how-cloud-hosting-works` (an educational hub; these pages earn AI-citations, per STRATEGY-2026).

- **[LIVE]** what-is-a-vpc, cloud-load-balancer-explained, autoscaling-explained, data-residency-explained, cloud-sla-explained, ddos-protection-explained, docker-container-hosting, discord-bot-hosting (8).
- **[NEW]** cdn-explained · dns-explained · reverse-proxy-explained · what-is-a-managed-server · vertical-vs-horizontal-scaling · uptime-monitoring-guide · blue-green-vs-rolling-deploys · health-checks-explained · private-networking-guide · what-is-edge-caching.
- **Linking rule:** answer-first definitions (40-60 words) up top of each — these are the pages AI Overviews quote. Link ACROSS within the silo and UP to the pillar.

### Silo 9 — Security + compliance
**Pillar [CREATE-PILLAR]:** `secure-compliant-hosting` (a shared-responsibility hub; no cert claims).

- **[LIVE]** gdpr-compliant-hosting, pci-compliant-hosting, soc2-compliant-hosting, what-a-waf-does, security-headers-guide, container-security-scanning, fix-ssl-certificate-errors, ddos-protection-explained (bridge), server-backups-guide (bridge), data-residency-explained (bridge) (10).
- **[NEW]** hipaa-compliant-hosting · iso-27001-hosting (shared-responsibility framing) · pdpl-compliant-hosting (Saudi data law → bridges to Silo 11) · ssl-tls-explained · fail2ban-and-shorewall-guide · secrets-management-guide · ip-allowlisting-guide · two-factor-and-social-login · data-encryption-at-rest-and-in-transit · security-audit-checklist · audit-trail-for-compliance (enterprise) · basic-auth-gate-guide.
- **Linking rule:** every compliance page states the shared-responsibility split, links to `data-residency`, `server-backups`, and the enterprise audit-trail page. Never claim a certification Kloudbean doesn't hold.

### Silo 10 — Pricing / cost / free
**Pillar [PILLAR]:** `cloud-hosting-pricing-explained`.

- **[LIVE]** cost-of-running-a-side-project, how-to-cut-your-cloud-bill, the-real-cost-of-unmanaged-vps, free-app-hosting-options, is-free-hosting-worth-it, free-tier-vs-cheap-vps, cut-saas-bill-4000-to-100 (bridge from old S1) (6-7).
- **[NEW]** true-cost-of-serverless · reserved-vs-on-demand-pricing · saas-vs-self-host-cost-breakdown · when-to-upgrade-your-server · hidden-cloud-fees-to-watch · cloud-cost-monitoring-guide · cost-per-visitor-math · predictable-vs-metered-billing.
- **Linking rule:** all cost pages link to the pillar and to the ONE comparison in Silo 4 that closes the sale (predictable pricing vs metered bill-shock).

### Silo 11 — Geo wedge: Saudi / KSA (the moat; currently 0 articles)
**Pillar [CREATE-PILLAR]:** `cloud-hosting-saudi-arabia` (managed hosting in-Kingdom). Per STRATEGY-2026, this is the **defensible wedge few competitors can match** (GCP Dammam in-Kingdom residency). Own it completely.

- **[NEW]** managed-hosting-ksa · gcp-dammam-region-guide · data-residency-saudi-arabia · pdpl-compliance-hosting · nca-ecc-compliant-hosting (shared-responsibility) · nca-cscc-compliance-guide · critical-systems-hosting-checklist · cscc-remote-access-controls · saudi-vision-2030-cloud · arabic-wordpress-hosting · hosting-for-saudi-ecommerce · low-latency-hosting-riyadh-jeddah · then replicate the wedge for **UAE** and **India** (residency + latency angles).
- **Linking rule:** the KSA pillar links to residency (Silo 9/8), the WooCommerce/WordPress pages (Silo 5), and a Silo 4 comparison framed for the region. Keep facts exact: KSA in-Kingdom = GCP Dammam only.

---

## 4. Internal-linking master plan

Six rules, applied to every article. Together they build the "authority mesh" that both Google's topical-authority model and AI-citation engines reward.

1. **Spoke → Pillar (up):** every article links to its silo pillar with descriptive anchor text. Non-negotiable. (This alone fixes today's 8 orphans.)
2. **Pillar → Spokes (down):** each pillar links to all its spokes (a real hub page, not a stub).
3. **Spoke ↔ Spoke (across):** each article links to 2-4 siblings in the same silo.
4. **Cross-silo bridges (defined join points), not random:**
   - Deploy (S1/S2) → **add-managed-database** (S3) → **server-backups-guide** (S9) → **security** (S9).
   - Any hosting page → the ONE most relevant **comparison** (S4) → **pricing** (S10).
   - WordPress (S5) → agency (S6) and security (S9).
   - Everything region-relevant → the **KSA** pillar (S11).
5. **Money-page mesh:** every top-of-funnel article carries exactly one contextual link to a bottom-of-funnel page (a S4 comparison or a "managed X hosting" pillar). One, chosen for relevance, not stuffed.
6. **Reuse the natural hubs.** The link graph already elected them; feed them deliberately: `add-managed-database` (39), `server-backups-guide` (32), `environment-variables-done-right` (31), `deploy-ai-built-app-to-production` (30), `ci-cd-auto-deploy` (28), `s3-compatible-object-storage` (27). New articles in those topics should link to these, and these hubs should link back down to new spokes.

**Anchor-text rule:** vary it, describe the destination, never "click here". Use the target's keyword phrasing.

---

## 5. What's MISSING (ranked by leverage)

1. **Five pillar hubs don't exist** — create them first, they anchor everything: `how-to-deploy-any-app` (S2), `best-managed-cloud-hosting` (S4), `managed-wordpress-hosting` (S5), `how-cloud-hosting-works` (S8), `secure-compliant-hosting` (S9).
2. **The entire KSA/geo silo (S11)** — the strategy's defensible moat, currently zero coverage. Highest strategic upside.
3. **The 6-engine database gap** — Kloudbean runs 6 managed DBs; only MySQL/Postgres/Redis have pages. Missing: **MariaDB, MongoDB, Elasticsearch**, plus the **managed GCS buckets** page.
4. **8 orphaned articles** get no inbound links today (deploy-bolt/claude/replit/windsurf, deploy-golang/laravel/rails, lovable-on-managed-aws). Rules 1-3 fix them.
5. **ORM/integration long-tail** (Prisma/Drizzle/Sequelize + a managed DB) — high-intent developer searches with near-zero competition.
6. **WooCommerce + WordPress-migration** money pages.

## 6. What's UNNECESSARY / needs fixing (not delete-heavy, mostly hygiene)

- **Cluster-label normalization** — one exact `cluster:` string per silo across all 100 `.md` files. Retire the one-off labels ("Architecture", "Hosting fundamentals", "Databases, Storage and S3").
- **Re-silo the overloaded old Cluster 1** into S1/S2/S4/S10 as mapped above.
- **Home the 5 untagged articles:** add-managed-database → S3, discord-bot-hosting + docker-container-hosting → S8, host-multiple-apps-one-server → S6 (bridge from S2), soc2-compliant-hosting → S9.
- **Watch for future cannibalization, don't cut now:** `free-app-hosting-options` vs `is-free-hosting-worth-it` vs `free-tier-vs-cheap-vps` are close; they currently hold distinct angles (options map / worth-it decision / head-to-head). Keep, but never add a 4th "free hosting" page. Same caution for `cost-of-running-a-side-project` vs `how-to-cut-your-cloud-bill`.
- No article should be deleted today. The corpus is clean (100/100 pass the quality gate). The work is structure, not pruning.

---

## 7. The 6-month roadmap (month by month)

Assumes the 100 are done (they are). Cadence target: **~10 new articles/month + 1 new pillar/month**, every article passing the existing quality gate before publish. End state ≈ **175 articles**, fully siloed, all pillars live, KSA moat established.

**Month 1 — Structure and spine (no new spokes yet).**
- Normalize all `cluster:` labels; re-silo old Cluster 1; home the 5 untagged.
- Apply linking rules 1-3 across the corpus (kills all 8 orphans).
- Create 2 pillars: `how-to-deploy-any-app` (S2) and `best-managed-cloud-hosting` (S4).
- Ship the hero-image rollout (generator is built and approved-pending).
- GEO from STRATEGY-2026: publish `llms.txt` + the shared "About Kloudbean" entity block.

**Month 2 — Close the product-truth gaps.**
- 6-engine DB gap: managed-mariadb, managed-mongodb, managed-elasticsearch, gcs-object-storage (4).
- Create pillar `managed-wordpress-hosting` (S5); add woocommerce-hosting + migrate-wordpress-to-kloudbean.
- Framework gaps: deploy-express, deploy-nestjs, deploy-nuxt, deploy-sveltekit (4).
- Schema expansion (Organization, Service, HowTo, author E-E-A-T) on the publishing layer.

**Month 3 — The KSA moat.**
- Create pillar `cloud-hosting-saudi-arabia` (S11) + 5 spokes (Dammam, residency, PDPL, NCA shared-responsibility, Saudi ecommerce).
- Create pillar `secure-compliant-hosting` (S9); add hipaa + iso-27001 + ssl-tls-explained.
- Start AI-citation tracking (probe ChatGPT/Perplexity/Gemini for target questions).

**Month 4 — Conversion + long-tail.**
- S4 comparisons: firebase-alternative, supabase-alternative, aws-amplify-alternative, the 4 cloud "X-vs-kloudbean" (Linode/Vultr/Lightsail/GCP) (7).
- ORM long-tail: connect-prisma / connect-drizzle / pooling / pgvector (4).
- Create pillar `how-cloud-hosting-works` (S8) + cdn-explained + dns-explained.

**Month 5 — Agency + self-hosted expansion.**
- S6 agency: client-billing, onboarding-checklist, maintenance-retainers, migration-service (4).
- S7 self-hosted: penpot, postiz (one-click), metabase, plausible, appwrite (5).
- WordPress problem/how-to gap: staging, backup-restore, redis-object-cache, white-screen-fix (4).

**Month 6 — Fill, refresh, and geo-replicate.**
- Replicate the geo wedge: UAE + India residency/latency pages (4-6).
- Pricing depth: serverless-cost, reserved-vs-on-demand, saas-vs-self-host (3).
- Refresh pass: re-date and update the 20 oldest/most-trafficked articles ("last reviewed" + any product changes).
- Review AI-citation + Search Console data; double down on whichever silo is winning.

---

## 8. The endless weekly loop (so it runs without thinking)

Once the structure exists, the operation is a repeatable weekly cycle:

1. **Pick** the next 2-3 topics from the silo backlog above (highest-leverage silo first: pillars > product-truth gaps > KSA > conversion > long-tail).
2. **Ground** each with keyword data (search volume + PAA questions) — never write from vibes.
3. **Write** through the content engine (`runContentEngine`): grounded, section-by-section, humanized, scored, auto-revised, fact-checked.
4. **Gate:** must pass `python3 /tmp/validate_article.py <slug>` → `[OK]`, ≥1400 words, JSON-LD Article+FAQPage, 0 prose em-dashes, 0 blurbs, a bespoke SVG, images resolve. Plus the scorecard ≥ threshold with zero blocking claims.
5. **Wire links:** apply the 6 linking rules (up to pillar, across to 2-4 siblings, one money-page link, feed a natural hub).
6. **Render** a hero via `hero-studio` (unique archetype+palette+motif for the slug).
7. **Publish**, set "last reviewed", and log the target question for AI-citation tracking.

**Definition of done for every article (pin this):** passes the gate; sits in exactly one silo; links up + across + to one money page; has a unique byline and a unique SVG; states only grounded facts; reads like a human engineer wrote it. If it fails the swap test (replace "Kloudbean" with a rival and it still reads fine), it isn't done.

---

*This plan is a living map. Mark it up: reprioritize silos, veto topics, or add ones I missed, and I'll adjust the roadmap and start executing whichever slice you approve first.*
