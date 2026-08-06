# Kloudbean — Product Facts & Positioning (source of truth)

Ground truth for ALL Kloudbean content (blogs, comparisons, social, video).
Every article must be grounded here. Do NOT fill gaps with generic assumptions.
If a needed fact is not here, ASK — do not guess.
Sources: official changelog (kloudbean.com/changelog) + owner-confirmed facts.

## The core value proposition (lead with this)
- One single dashboard for the WHOLE stack: servers, applications, managed databases,
  S3 object storage, static sites, Flexible Load Balancer (FLB), and enterprise features
  (VPC, VPN, k8s and more) — no juggling separate products or providers. NOTE: private
  networking/VPC/VPN are Enterprise-only, not a default for every user.
- The goal: make hosting and managing entire infrastructure simple, so production
  systems are easy to run. A user can have a standalone load balancer AND S3 buckets
  AND servers AND static sites, all within one login.
- Established platform, not a newcomer. Launched November 2023 and has shipped new
  providers, runtimes, and features nearly every month since (see timeline). Large,
  active customer base. RESOLVED: use "since 2023" / "launched in 2023" in copy — the
  official changelog dates are authoritative (owner confirmed: go by the changelog).

## Cloud providers — 7 (OWNER-CONFIRMED). More than Cloudways.
AWS, AWS Lightsail, Google Cloud (GCP), Linode, Vultr, DigitalOcean, UpCloud.
- This is a strict SUPERSET of Cloudways' clouds (DO, Vultr, Linode, AWS, GCP) PLUS
  AWS Lightsail and UpCloud. Never show Cloudways with more clouds than Kloudbean.
- Provider timeline: launch (Linode, AWS, Lightsail) → GCP (Jan 2024) → DigitalOcean +
  UpCloud (Feb 2024). Vultr also supported (owner-confirmed).
- Infra is owned/run by the world's biggest providers → strong uptime foundation.

## Managed databases — 7 (standalone, one-click, backups, controlled access)
MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB.
(Do NOT under-list as just "MySQL/Postgres/Redis".)

## Message queues, streaming & analytics engines (on demand — OWNER-CONFIRMED)
- Available ON DEMAND (enabled on request; owner-confirmed): Apache Kafka, RabbitMQ, ClickHouse,
  OpenSearch, and Apache Flink. Kloudbean can run the full data-platform engine set, not just the
  common DBs. They're enabled on demand rather than default one-click tiles in the DBS list.
- In comparisons (e.g. vs Aiven) position "bring it ALL to Kloudbean, on demand" — do NOT tell
  readers to leave for any of these engines. Frame as "available on demand" (enabled on request),
  not necessarily a self-serve one-click tile. Search is also covered by managed Elasticsearch.

## Object storage
- Built-in S3-compatible buckets (since Nov 2024); full AWS S3 SDK/CLI compatibility
  (Mar 2025). Managed Google Cloud Storage (GCS) buckets too (Dec 2025).
- NO egress fees on object storage: data-transfer-out is not metered (OWNER-CONFIRMED). This is a
  real advantage vs egress-billed clouds. Do NOT name specific rival products (do not mention
  Cloudflare) when making this point; state it plainly as a Kloudbean capability.
- Public/private access controls, manage objects from the dashboard.

## FLB — Flexible Load Balancer (since Aug 2024)
- BUILT IN, available on EVERY account to enable/subscribe. Off by default, but not
  tier-gated and not a separate product. Frame as "built in, enable when you need it."
- Virtual load balancers + application pools, SSL management, access logs.

## Runtimes / apps supported (multi-language — NOT just PHP/WordPress)
- PHP CMS/e-comm: WordPress, WooCommerce, Laravel, Magento, Drupal, Joomla.
- Node.js: Express, Angular, React, Vue.js (PM2 multi-process supported).
- Python: Flask, Django, FastAPI.
- Ruby; Java (JVM/enterprise workloads).
- Free static site hosting: custom domains + SSL + built-in visit analytics (free).
- Smart/AI apps (one-click): n8n, Supabase, OpenWebUI + DeepSeek (private AI chat),
  Postiz, Penpot.

## Developer experience
- Fully managed CI/CD: connect Git repo → build & deploy on every push (GitHub, incl.
  GitHub OAuth). Deployment history + live build logs stream in the console.
- adm automated deployment utility; runtime config for Node/Python in the UI; cron jobs
  from the UI (no SSH); Platform API (read-only v1) with scoped personal API tokens.

## Security & team
- Baseline hardening: Shorewall firewall + Fail2ban (auto). Free SSL.
- BitNinja is a real available added security layer (not the baseline). Show it lightly and
  factually — not as a headline selling point on every page.
- Subusers + User Access Control (UAC): granular per-resource, per-action permissions.
- Social login (Google/GitHub/LinkedIn); HttpOnly cookie sessions (XSS/CSRF hardening).
- Basic Auth gate for apps; IP Access Control (allow/deny, CIDR).
- Staging sites (WordPress & Laravel). Automatic backups.

## Enterprise & government (a KEY focus — position strongly)
- Kloudbean acts like an in-house infra/DevOps team for enterprises & governments.
- Enterprise-only: Kubernetes (k8s), autoscaling, and custom setups/architectures.
  IMPORTANT: autoscaling is NOT available for normal users — enterprise/custom only.
  Do not tell general readers Kloudbean autoscales their app automatically.
- Audit Trail (Enterprise): immutable, searchable, account-wide activity log, CSV
  export, built for compliance.
- Private networking / VPC and VPN are ENTERPRISE-ONLY — NOT available to every user. Do NOT
  present "private networking"/VPC/VPN as a general or default feature in content. They ship as
  part of the Enterprise package, alongside Kubernetes (k8s), autoscaling, audit trail, custom
  setups/architectures, and more. Enterprise is a full package, not "just VPC".
- Uptime guaranteed via tier-1 provider infrastructure.

## Saudi Arabia (KSA) — go-to-market positioning (KEY market push — OWNER PRIORITY)
- Flagship KSA angle to LEAD with in all Saudi/KSA content: MANAGED DATABASES with in-Kingdom
  DATA SOVEREIGNTY. Data stays in the Kingdom, run in-region on Google Cloud's Dammam region,
  aligned with PDPL (Personal Data Protection Law) and NCA ECC expectations. Pair the 7 managed
  DB engines + automatic backups + one dashboard with the data-residency story.
- OWNER POSITIONING (owner-stated): Kloudbean is the only provider in the KSA market delivering
  fully MANAGED databases with true in-Kingdom data sovereignty — a real edge vs managed-hosting
  platforms (Cloudways etc.) that have no Saudi/Dammam presence.
- SUPERLATIVE GUARDRAIL: a bare "the only provider in Saudi Arabia" is challengeable (hyperscalers
  run managed DBs in Dammam directly). In published copy, qualify it so it's defensible AND still
  strong, e.g. "one of the only MANAGED-CLOUD platforms delivering managed databases with in-Kingdom
  data sovereignty," or "the managed-hosting platform that brings managed databases and Saudi data
  sovereignty together in one dashboard." Keep the leadership tone; avoid the unqualified absolute
  unless the owner confirms they can substantiate it.
- Never claim NCA/PDPL "certified" — say aligned with / built for / supports compliance. Data
  sovereignty and residency (in-Kingdom Dammam) are the grounded, real hooks.
- Cloudflare available to ALL sites as a PAID add-on; FREE for Enterprise users.
- Includes Cloudflare Enterprise edge caching for extreme speed on landing pages,
  sites, and apps. Use as the headline differentiator vs Fly.io / edge-first platforms.
- NOTE: Cloudways also resells a Cloudflare Enterprise add-on, so do NOT frame Cloudflare
  as a Kloudbean-only edge over Cloudways — there it's parity. It IS a strong edge vs
  Fly.io and most PaaS.

## Pricing (confirmed)
- Standard plans start from $8/mo (confirmed — fine as an entry pitch). Enterprise is custom
  pricing / contact sales; do NOT publish a specific enterprise dollar figure. Always tell
  readers to verify current pricing on the pricing page.

## Positioning rules (how to write, esp. comparisons)
- This is Kloudbean's OWN blog. Comparisons must be fair and credible but LAND on
  Kloudbean, backed by concrete, real advantages. Confident, not cocky; never gushing
  about rivals. One measured, honest line for a competitor's real strength — max.
- Never hedge Kloudbean while praising a rival firmly.
- Lead with: one dashboard for the whole stack; 7 clouds (more than Cloudways, incl.
  Lightsail + UpCloud); 7 managed DBs; built-in S3 + GCS storage; built-in FLB on any
  account; true multi-language (PHP/Node/Python/Ruby/Java/static/AI); managed CI/CD with
  live build logs; staging, backups, UAC, audit trail; enterprise k8s/autoscaling/custom;
  in-house-team model for enterprise & government; Cloudflare Enterprise edge caching.
- Stay truthful: pro-Kloudbean = leading with real advantages, never inventing features
  or lying about competitors. Accuracy is still the priority. Do not rely on [CONFIRM]
  lines in published copy until confirmed.

## Honesty boundary (still true, keep using — but concise, not a repeated template)
- Linux stacks (PHP, Node, Python, Go, Ruby, Java + their databases) — not Windows/.NET/IIS.
- "Managed" = server, stack, SSL, backups, patching handled; you own your app code + data.
- Compliance is shared: platform provides infra controls; customer owns app-level compliance.

## Dated timeline (from official changelog — use for "since when" claims)
- 2023 Nov: LAUNCH — providers Linode, AWS, Lightsail; managed WordPress, WooCommerce, Laravel.
- 2023 Dec: Magento; managed MySQL & MariaDB.
- 2024 Jan: Google Cloud (GCP). Feb: DigitalOcean + UpCloud; managed PostgreSQL.
- 2024 Mar: Drupal & Joomla. Apr: cron jobs in UI; managed Redis, Elasticsearch, MongoDB.
- 2024 May: Shorewall + Fail2ban. Jun: staging (WordPress & Laravel). Jul: subusers + UAC.
- 2024 Aug: Node.js (Express & Angular); FLB (Flexible Load Balancer). Sep: Java.
- 2024 Oct: Ruby & Python (Flask). Nov: Django; S3-compatible object storage. Dec: React & Vue; n8n.
- 2025 Jan: free static site hosting; OpenWebUI+DeepSeek. Feb: Supabase, Postiz, Penpot.
- 2025 Mar: S3 AWS-SDK API compatibility. Apr: managed CI/CD (Git); FastAPI. Jun: PM2 multi-process Node.
- 2025 Jul: adm deploy utility. Aug: live build logs. Sep: Node/Python runtime config in UI. Dec: managed GCS buckets.
- 2026 Jan: social login. Mar: Debian 12. Apr: HttpOnly cookie auth. May: GitHub OAuth.
- 2026 Jun: Audit Trail (Enterprise). Jul: Platform API tokens; Basic Auth; IP Access Control.

## Still to confirm
- [CONFIRM] Customer-count figure to cite (e.g. "trusted by X+ customers").
- [CONFIRM] Exact Cloudflare add-on pricing wording; any uptime SLA % we may state.
- [CONFIRM] Go runtime support — changelog lists PHP/Node/Python/Ruby/Java but NOT Go.
  There is a deploy-golang-app article + a Go mention in cloudways-alternatives. Until
  confirmed, frame Go as "run your Go binary on a managed Kloudbean server" (server-based),
  NOT as a one-click managed Go runtime. Ask owner to confirm/deny Go support.
