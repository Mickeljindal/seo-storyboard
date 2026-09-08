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
- NO egress fees on KLOUDBEAN's own built-in S3-compatible object storage: data-transfer-out is not
  metered (OWNER-CONFIRMED). SCOPE THIS CAREFULLY: the no-egress claim applies ONLY to Kloudbean's
  built-in S3 storage. Managed GCS buckets are a premium/enterprise feature (dedicated cloud project)
  and DO incur egress AND ingress fees, so never extend "no egress" to GCS. Do NOT attribute the S3
  storage to Cloudflare or say it is "powered by Cloudflare R2"; state it plainly as a Kloudbean
  capability (it has R2-like properties, but never name or imply Cloudflare/R2 as the backing).
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
- NEVER OVERSELL A COMPETITOR (owner instruction). A comparison exists to help the reader
  and land on Kloudbean, not to flatter the rival. Strip competitor superlatives (lovely,
  excellent, ideal, genuinely great, best-in-class); state plainly what they do, one measured
  strength line at most, then move to Kloudbean's real advantages. Never let Kloudbean read as
  "the same thing, but pricier."
- BYO-VPS control panels (e.g. Laravel Forge, Ploi) are a SEPARATE, cheaper category, not
  managed-hosting rivals. NAMING: do NOT name RunCloud, ServerAvatar, xCloud, or SpinupWP anywhere
  (owner deny-list); refer to the category generically instead. They are dashboards that configure a
  server you rent, own, pay for SEPARATELY, and stay responsible for; they are inexpensive
  precisely because they are only the automation layer, not a managed server. When one is
  unavoidable in a comparison, frame it as dashboard-only vs managed-server-included (an
  apples-to-oranges price story, never "Kloudbean is pricier"), give it one fair measured line,
  and do not imply it is a managed-hosting equivalent. Before writing any NEW panel-vs-Kloudbean
  article, reconsider whether it is worth it at all: the category mismatch and thin search value
  usually mean the honest answer is to fold a brief mention into cloudways-alternatives rather
  than build a dedicated page. laravel-forge-vs-kloudbean already covers the iconic one; do NOT
  add runcloud/ploi/serverpilot pages without a clear, owner-approved reason.

## Honesty boundary (still true, keep using — but concise, not a repeated template)
- Linux-based hosting (PHP, Node, Python, Go, Ruby, Java + their databases). CORRECTION (owner Aug 2026):
  .NET IS supported, on Linux, using the Linux-supported .NET versions. Windows Server is available on
  PREMIUM/ENTERPRISE plans only. Stop writing the old blanket "not Windows/.NET/IIS" line; use the
  updated capability in the OWNER-CONFIRMED section below.
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
- RESOLVED via owner questionnaire (Aug 2026): customer count = 17,000+; Go = one-click managed runtime;
  Cloudflare add-on pricing + SLA stance now confirmed. See the OWNER-CONFIRMED section below, which is
  authoritative and supersedes older lines where they conflict.
- Still open: operational benchmarks/numbers (provisioning time, restore time, migration counts),
  named case studies, and first-party benchmark figures were NOT supplied, so keep those general.

---

## OWNER-CONFIRMED FACTS (questionnaire, Aug 2026) — authoritative, supersedes conflicts above

### Geography & regions (BIG unblock)
- Kloudbean can provision in ANY region its 7 clouds offer: 80+ data centres worldwide. In-country
  hosting is available in ~35 countries, including: USA (many), UK (London), Germany (Frankfurt),
  France (Paris), Netherlands (Amsterdam), Ireland, Spain (Madrid), Italy (Milan), Sweden, Poland,
  Finland, Denmark, Norway, Switzerland (Zurich), Belgium, Austria, Portugal, Czechia; UAE (Dubai),
  Saudi Arabia (Dammam; AWS also has a Saudi region), Bahrain, Qatar (Doha), Israel (Tel Aviv);
  India (Mumbai/Delhi/Bangalore/Chennai/Hyderabad), Singapore, Japan (Tokyo/Osaka), South Korea
  (Seoul), Hong Kong, Taiwan, Indonesia (Jakarta), Malaysia (KL), Thailand (Bangkok), Australia
  (Sydney/Melbourne), New Zealand (Auckland); Canada (Toronto/Montreal/Calgary), Brazil (São Paulo),
  Mexico (Mexico City), Chile (Santiago), Colombia, South Africa (Cape Town/Johannesburg).
  (Full per-cloud region list is in the questionnaire; treat that as the source list.)
- STRATEGY (owner): KSA/Dammam stays the PRIORITY wedge (early market, Kloudbean can win first
  position as the managed-cloud/infra platform in KSA). But Kloudbean is NOT KSA-only — write geo
  content for other countries too, led by real search demand. Top customer countries: USA, KSA, UK,
  France, Brazil, UAE/Dubai, Netherlands, Australia. Compliance-angle priority: KSA, USA, Australia
  (others fine for enterprise).
- Do NOT mass-produce near-identical pages by swapping country names (owner). Build a geo page only
  where there is genuine search demand + a real residency/latency/compliance angle.
- "60+ countries" and "17,000+ customers" are approved proof points. Use SPARINGLY and only where it
  helps; do not stamp them on every page.

### Multi-cloud / FLB (a real differentiator)
- A single APPLICATION can run multi-cloud AND multi-region at once from one dashboard: e.g. compute
  across GCP + Linode + AWS in different data centres, front-end/back-end/DBs wired together through
  the FLB (Flexible Load Balancer). The FLB is named "flexible" precisely because it can front
  multi-cloud, multi-data-centre underlying infra. Strong, ownable story.
- LIMIT (state it honestly): the DATABASE primary is single-region (cannot run the primary DB
  multi-region). Read replicas CAN be multi-region; the primary cannot. Do not imply a globally
  distributed primary database.

### Runtimes / capabilities — corrections & additions
- Go: ONE-CLICK MANAGED runtime (not just "run your binary"). Managed features apply, not only build.
- .NET: supported ON LINUX (Linux-supported .NET versions). Windows Server: PREMIUM/ENTERPRISE only.
- Docker: NOT on the standard plan. Supported under customization on PREMIUM/ENTERPRISE.
- Kubernetes: ENTERPRISE (full); PREMIUM gets limited k8s features. Autoscaling: enterprise/custom only.
- Vertical scaling (resize UP): self-serve for normal users. Disk DOWNGRADE is NOT supported (can't shrink).
- Read replicas: one-click for MySQL & MariaDB on standard; ALL databases on ENTERPRISE.
- Container/image scanning: not default; added + maintained on ENTERPRISE.
- Email: managed SMTP CONFIGURATION on the app server (yes). Managed EMAIL: no. Enterprise on request:
  Kloudbean sets up + manages a tool like mailcow (managed).
- Backups: automatic backups AND on-demand backups (for apps).
- White-label / agency dashboard rebranding: NOT supported. Do not claim white-label (the video
  storyboard for it is not a sellable capability).

### Object storage nuance (correction)
- No-egress applies to Kloudbean's built-in S3-compatible storage ONLY. Managed GCS is
  premium/enterprise (dedicated cloud project) WITH egress AND ingress fees. Never say "no egress"
  about GCS. Never attribute the S3 storage to Cloudflare/R2 (R2-like, but not named).

### PRICING IS PER-PROVIDER AND PER-REGION (owner-confirmed, Sep 2026). READ BEFORE QUOTING A PRICE.

The entry price depends on WHICH CLOUD and WHICH REGION the server runs in, because Kloudbean
provisions on 7 different providers. Quoting one number everywhere is wrong.

- **$8/mo is the LINODE entry price.** It is the cheapest baseline and it is the right number for
  general, region-agnostic content.
- **LINODE HAS NO SAUDI DATA CENTRE.** So $8/mo is NOT available for in-Kingdom hosting, and quoting
  it on Saudi content is a factual error a prospect will catch on the pricing page.
- **KSA / Dammam starts from $36/mo**, because in-Kingdom hosting runs on Google Cloud's Dammam
  region (me-central2), which costs more than Linode.

**RULE: match the price to the geography the article is about.**
- Saudi / KSA / Dammam / in-Kingdom / PDPL / NCA content -> "from $36/mo".
- General or region-agnostic content -> "from $8/mo".
- A region with no confirmed figure -> do not invent one. Say "pricing varies by cloud and region"
  and link the pricing page.
- Always suggest verifying current pricing on the pricing page, since these move.

This applies to CTAs as much as body copy: a CTA on a Dammam article saying "$8/mo" is a broken promise.

### Pricing & commercial (owner-confirmed)
- Standard from $8/mo on Linode (see the per-provider rule above before using this number).
- Enterprise: from US$7,500/month, custom pricing for wider scope. OWNER CONFIRMED this is PUBLISHABLE.
  Phrase as "enterprise plans start from $7,500/mo, with custom pricing for wider scope" and still
  suggest verifying current pricing on the pricing page. Don't splash it on every page, but it's fine
  to state on enterprise/pricing-relevant content.
- Free migration: free for servers above 4GB (no scope limit there). Free trial: 3 days per account,
  limited to 1 service.
- Cloudflare CDN add-on: paid for all; enterprise get 1TB free, then $5 per 100GB of bandwidth.
- No public discounts (no startup/student/nonprofit/annual public discounts).
- SLA: do NOT state a specific 99.9%/99.99% figure unless legal/terms confirm it. Use qualitative
  "built on established tier-1 cloud providers, designed for reliable uptime."

### Compliance posture (IMPORTANT wording)
- Kloudbean is COMPLIANT-READY / ALIGNED with GDPR, SOC 2, ISO 27001, and NCA CSCC. NOT certified.
  Say "compliant / ready / aligned / supports"; NEVER "certified" (certification is planned, not held).
- Never claim "using Kloudbean makes YOUR organisation compliant." Hard line: "Kloudbean provides/
  supports X" is fine; "Kloudbean makes you compliant with X" is not.
- Can write "aligned/supports (not certified)" articles for: GDPR, EU NIS2, UAE NESA/SIA, Qatar NIA,
  India DPDP, Singapore PDPA, PCI DSS, HIPAA. (All owner-approved.)

### Enterprise operating model (additions)
- Enterprise customers get a DEDICATED onboarding manager AND a DEDICATED DevOps engineer (enterprise
  only, not standard). Serving government clients (never name them). KSA local entity: not yet
  registered (do not claim it; "soon").

### Competitors — naming rules (owner)
- Do NOT name at all: RunCloud, ServerAvatar, xCloud, SpinupWP. Do NOT compare against Azure.
  (Update the BYO-panel positioning rule accordingly: reference the category generically, not by
  these names. Laravel Forge / Ploi were not in the deny-list.)
- Verticals to AVOID chasing/claiming: edge compute, serverless (Kloudbean is not those).

### Brand casing — RESOLVED (owner: "don't care")
- Use "Kloudbean" everywhere (consistent with all existing articles + the naming rule). Owner was
  indifferent on Kloudbean vs KloudBean, so keep the established "Kloudbean". No rename needed.

### Priority content areas (owner Q59/Q61)
- AI/vibe-coding deploy (build-with-AI -> deploy-on-Kloudbean), managed databases, cloud cost
  optimization, cloud provider comparisons, app migration, enterprise DevOps, KSA digital infra +
  Saudi residency + government hosting, agency hosting, security hardening, object storage,
  backup/restore + HA + multi-cloud architecture, developer-focused deploy, WordPress/WooCommerce at
  scale, Cursor/Lovable hosting. Ground the next batches in the SEMrush gap data in
  kloudgraph-semrush-export/ (real Volume + KD), avoiding country-swap thinness.

### PRIVATE NETWORKING — CORRECTION (owner-flagged blunder, Aug 2026). READ THIS.

We shipped a real overclaim across roughly 90 articles: private networking / VPC was presented as a
DEFAULT, every-user capability (in CTA feature-lines like "... Private networking ..." and in prose
like "your app and database sit on a private network", "kept on a private network", "private IP only").
That is WRONG. Correct it going forward and never repeat it.

THE FACT: private networking / VPC is an ENTERPRISE feature. Enterprise-subscribed users can enable it.
It is NOT the default behaviour for standard/premium users and must never be pitched as something every
Kloudbean user gets.

DEFAULT framing to use instead (for standard content), using only confirmed general features:
- Managed databases have CONTROLLED ACCESS. Protect them with IP Access Control (allow/deny, CIDR) and
  strong credentials. Say "access is locked down with IP allow-listing and credentials", NOT "it's on a
  private network".
- Do NOT claim, by default: "private network", "private networking", "VPC", "private IP", "private host",
  "no public IP", "not reachable from the internet". Those describe the Enterprise private-networking
  feature, not the standard experience.
- When the point genuinely needs private networking, SCOPE it: "On Enterprise, the database can run on a
  private network (VPC)." Never unscoped.
- The CTA feature-line must NOT list "Private networking" as a default perk. Use true defaults instead
  (Automatic backups, Free SSL, Managed databases, IP allow-listing / access controls, Git deploys,
  Free migration, Free trial, 7 clouds).

Educational/conceptual pages (what-is-a-vpc, cscc-network-segmentation, data-residency) and genuine
ENTERPRISE/CSCC pages may discuss private networking correctly (as a concept, or as the enterprise
capability). The blunder is specifically presenting it as a DEFAULT Kloudbean feature in general content.

### DB ACCESS CONTROL — the correct DEFAULT framing (owner-confirmed, Aug 2026)

This is the concrete feature that REPLACES the "private network / VPC by default" overclaim. Use it.

Managed databases (the DBS section) support IP Access Control / IP whitelisting. A standard user can
whitelist their APPLICATION SERVER'S IP ADDRESS on the database so that ONLY the app server is allowed
to connect. Everything else is refused. This is self-serve and available to normal users, it is NOT
enterprise-gated.

So the correct DEFAULT security sentence for a managed DB is:
- "Whitelist your app server's IP on the database so only that server can reach it" (IP Access Control),
  paired with strong credentials and free SSL.
- NOT "the database sits on a private network (VPC)" and NOT "it isn't reachable from the public internet
  by default". The lock-down mechanism available to everyone is IP allow-listing, not a VPC.

Private networking / VPC / VPN stays ENTERPRISE-only (see PRIVATE NETWORKING — CORRECTION above). When a
draft says the DB is "on a private network" as a default, rewrite it to the IP-whitelisting framing. When
it genuinely means the Enterprise VPC feature, scope it: "On Enterprise, the database can run on a private
network (VPC)."

Correct replacements to use when fixing existing drafts:
- "kept on a private network"            -> "locked down with IP allow-listing (only your app server can connect)"
- "sits on a private network (VPC)"      -> "locked down so only your whitelisted app server IP can reach it"
- "reachable over a private network"     -> "reachable only from your whitelisted app server IP"
- "not exposed to the public internet"   -> keep ONLY if paired with the IP-whitelisting reason; otherwise drop
- CTA perk "· Private networking ·"      -> drop it, or use "· IP allow-listing ·" / a true default


### GPU SERVERS & SELF-HOSTED LLMs / AI INFERENCE (owner-confirmed, Aug 2026) — READ THIS

CORRECTION to a real prior gap. Earlier content said things like "Kloudbean does not sell GPUs /
model inference" and "Kloudbean isn't in the business of GPU inference hosting", and told readers
that self-hosting a model was a separate compute project done somewhere else. That is WRONG. Fix it
wherever it appears and never write it again.

THE FACT (owner-confirmed):
- Kloudbean DOES offer GPU-based servers, and they are SELF-SERVE for users (owner-confirmed
  Aug 2026): a user can provision a GPU machine and run ANY model on it (bring your own open model,
  any framework). They are selectable in the console server-size picker (e.g. GPU instances with
  1 GPU and varying vCPU/RAM). GPU compute is a real, selectable Kloudbean product available to
  users, not something we send people elsewhere for.
- You CAN self-host open LLMs on Kloudbean. Running an open model (Mistral, and open models
  generally, via Ollama / Open WebUI, vLLM, and similar) on a Kloudbean GPU server is a supported,
  marketed story. Public landing pages already sell it (e.g. kloudbean.com/mistral-ai-self-hosted/).
- ONE-CLICK MODELS + ANY MODEL ON REQUEST (owner-confirmed Aug 2026, screenshot-verified). The console
  has a one-click tool/app picker. DeepSeek (shown as "DeepSeek r1-1.5b Model") and Open WebUI install
  one-click, alongside other one-click tools (GitLab, Postiz, Supabase, Glance, Evolution API, and more).
  For ANY other or custom model, the user starts an instant chat and the Kloudbean SUPPORT team installs
  it and makes it available. So it is more managed than "bring and set up everything yourself": frame it
  as "one-click DeepSeek, or any/custom model installed for you on request".
- AI + VPC + REGION/SOVEREIGNTY (owner-confirmed). A self-hosted model can run INSIDE a private VPC
  (Enterprise private networking) and be pinned to a chosen region, including in-Kingdom (Dammam), so the
  AI workload stays sovereign and can align with data-residency/compliance needs in Saudi or any region.
  This is the strong KSA/enterprise AI-sovereignty story: the DATA and the MODEL can both stay in-region.
  SCOPE the VPC part as Enterprise (private networking is Enterprise-only); region pinning is generally
  available across the 7 clouds' regions.
- ENTERPRISE / bigger customers: standardise on AWS or GCP. On enterprise/custom there is NO fixed
  product-tier cap on GPU or CPU. It scales to whatever the customer provisions and pays for, on
  custom pricing. This is the "no limits" position the owner wants.

POSITIONING (how to phrase "no limits" so it is strong AND defensible):
- Say: "no fixed tier ceiling; GPU and CPU scale with your plan and the underlying AWS or GCP
  capacity", or "enterprise sizing is custom, provision the GPU and CPU your workload needs".
- Do NOT write a bare absolute "no limitations" / "unlimited GPUs" as a standalone claim. It trips
  the overpromise guardrail and is challengeable (cloud GPU stock, regional quotas, budget all
  exist). Keep the ambition, scope it to enterprise/custom + the hyperscaler capacity.

THE HONEST BOUNDARY THAT IS STILL TRUE (keep it, this is the correct scope, not a limitation):
- Kloudbean gives you the GPU SERVER and runs the box (OS, networking, free SSL, patching, server
  backups), and can INSTALL the model for you (DeepSeek one-click; any other or custom model via the
  support team on request). You still CHOOSE and OWN the model and its use: which model, your prompts,
  your data, and the day-to-day operation. So it is managed at the infrastructure and install layer,
  while model choice and usage stay yours. (Do not swing to the opposite overclaim either: Kloudbean is
  not fine-tuning or writing your model for you; it installs and hosts the model you pick.)
- Kloudbean is NOT a hosted-model-API vendor like OpenAI or Anthropic. It does not hand you a
  per-token model endpoint. You self-host the model on a Kloudbean GPU server. So the correct
  contrast is: "call a hosted model API (OpenAI etc.) OR self-host your own open model on a
  Kloudbean GPU server". Both are legitimate; Kloudbean powers the second.
- Self-hosting a model is still real ops work (model choice, sizing, updates). That framing stays
  true, but the compute runs ON Kloudbean, never "somewhere else".

WORDING FIXES (replace the false lines wherever they appear, in prose and FAQ):
- "Kloudbean doesn't sell GPUs / model inference"        -> "Kloudbean offers GPU servers, so you can self-host an open model here"
- "Kloudbean isn't in the business of GPU inference"     -> "you can run inference on a Kloudbean GPU server (you bring the model)"
- "that's a separate compute project / done elsewhere"   -> "that's a compute project you run on a Kloudbean GPU server: you own the model, Kloudbean runs the box"
- Hedges like "(and GPU, where available/where offered)" -> state plainly that GPU servers are available.
- KEEP unchanged: "you bring / own the model and its updates" and "not an OpenAI-style API vendor". Both remain true.

STILL TO CONFIRM (do NOT invent; use [VERIFY WITH PRODUCT TEAM] in drafts):
- Exact GPU models, VRAM, and tiers, and which of the 7 clouds carry which GPU options. (Self-serve
  GPU availability to users, and running any model on it, are CONFIRMED; only the per-cloud GPU
  specs/models/VRAM/pricing remain to confirm.)
- GPU pricing.
- The official list of one-click vs bring-your-own models.
Never state GPU specs, VRAM, tokens/sec, or model benchmarks without owner/product confirmation.

### Plans & limits — CORRECTION (owner-confirmed, Aug 2026). Read before writing any pricing or plan copy.

THE CORRECTION: **There is NO limit on the number of applications, sites or tools on a single
Kloudbean server, on ANY plan.** Not on an $8 server, not on a $1,000 server. Multiple apps per
server is a first-class, deliberate feature.

**What the tiers actually differ by is FEATURES, never limits.** Premium and Enterprise add
capability: VPC and VPN, Kubernetes, autoscaling, audit trail, enterprise support, dedicated account
managers, BitNinja Pro, Windows Server, Docker under customization, higher free-migration volume.
Moving up a tier buys capability, never permission to run more apps, because that permission was
never withheld.

**The only real ceiling is the server itself:** RAM, then CPU, then disk. That is a sizing judgement,
not a product limit, and nobody can quote the number in advance. A dozen cached brochure sites fit
where one busy Laravel app with background workers will not. Watch memory first. Twenty-plus
light-to-moderate sites on one properly sized machine is realistic (see
`how-agencies-host-20-client-apps`, which already gets this right).

**WHY THIS IS HERE.** The support docs at `/docs/getting-started/subscription-tier` carry a row
reading `Application Limit: Standard Limits [Standard] · Standard Limits [Premium] · Unlimited
[Enterprise]`. "Standard Limits" reads to any outside reader, and to any AI ingesting the docs, as an
undisclosed numeric cap. It caused a real error: `cloudways-velocity-alternative` shipped three
revisions claiming Kloudbean caps application count below Enterprise, in its tldr, pricing table,
cost section, limits section, diagram and FAQ. That is self-inflicted damage, because the article
attacks Cloudways Velocity's genuine one-app-per-isolated-server rule while inventing a competing
limitation for us.

**DRAFTING RULE:** never present a Kloudbean tier difference as an allowance or a quota on how much
the customer may run. If a docs row looks like a cap, treat it as a docs wording problem and confirm
with the owner rather than writing it as a limit. Approved phrasings: "no cap on applications per
server", "the ceiling is the server's RAM and CPU", "the number of apps is not a billing lever at
any tier", "multiple apps per server is first-class here, not a hack".

**DOCS ACTION (owner):** that `Application Limit` row should read unlimited, or state plainly that
the constraint is server resources.

### Plans & limits, part 2 — BitNinja, in-stack MariaDB, and what tiers really mean (owner-confirmed, Aug 2026)

**BitNinja is AVAILABLE ON EVERY PLAN, including Standard.** This corrects the earlier line in this
file calling BitNinja "a real available added security layer (not the baseline)" in a way that implied
Standard cannot have it, and it corrects how the support docs read. The subscription-tier doc shows
`Application/BitNinja: ❌ [Standard] · ✅ Free ($24/month value) [Premium/Enterprise]`, but that marker
is about whether it is INCLUDED at no cost, not whether it is available. The actual how-to doc,
`/docs/server-management/enabling-bitninja-security`, contains no plan gating and no pricing at all.
Correct phrasing: available on any plan and enabled from server management, included at no cost on
Premium and Enterprise, with Shorewall plus Fail2ban as the Standard baseline. Do NOT write "BitNinja
is Premium and Enterprise only".

**Operational detail worth using (from that same doc):** BitNinja needs resource headroom. Check
memory and CPU before enabling it, and keep memory under roughly 80 to 85 percent afterwards. A
security layer that starves the app it protects is not a win. This is real, citable, and the kind of
thing competitors do not publish.

**A NEW SERVER ALREADY HAS A DATABASE IN THE STACK.** `/docs/application-deployment/deploying-nextjs`
states the default new-server stack as `Node 20.X, NPM 10.X, NVM (latest), MariaDB > 10.6 (optional)`.
So never write "a Kloudbean app needs a separate managed database subscription" or "databases cost
extra" as a flat claim. Correct framing: the server stack ships MariaDB, so the simple case needs
nothing extra; managed databases are an OPTIONAL separate product for when you want the database
sized, backed up and scaled independently of the app. Managed PostgreSQL pricing ($18 for 1GB Starter,
$30 for 2GB, $60 for 4GB) is fine to cite, scoped that way.

**WHAT THE TIERS ACTUALLY CHANGE: capability and service level. Never permission or quota.**
- Standard: nothing is restricted. The architecture is the customer's to run. They resize, add nodes
  behind the FLB, and decide when to split. No cap on applications (see part 1 above).
- Premium and Enterprise: the Kloudbean team implements, manages and monitors WITH the customer,
  working alongside their developers, in their Slack or on WhatsApp, closer to an extended in-house
  infrastructure team than a support queue. Plus capability: VPC and VPN, Kubernetes, autoscaling,
  audit trail, Windows Server, Docker under customization, higher free-migration volume, BitNinja
  included free.
- So a tier is a service level, not an unlock. Frame it that way. Do not promise an SLA percentage,
  a response time, or an outcome.

**Cloudflare stays PARITY with Cloudways, not an edge.** Both resell a Cloudflare Enterprise add-on.
Free for Kloudbean Enterprise users. Never present it as a Kloudbean-only advantage over Cloudways.

### DATABASES: two distinct models. Get this right, it has been wrong across ~30 articles (verified Aug 2026)

There are TWO different things called "a database" on Kloudbean, and conflating them produced a
library-wide positioning error. Verified against the support docs, paths given so it can be rechecked.

**Model 1: the application's own database, on the app server.**
`/docs/application-management/accessing-managing-database`: "When you create a new app on your server,
KloudBean by default creates a database as well". Its documented connection examples use
`DB_HOST=127.0.0.1` or `localhost`, `DB_PORT=3306`, and the troubleshooting section says the host is
"usually localhost". `/docs/application-deployment/deploying-nextjs` lists the default new-server stack
as `Node 20.X, NPM 10.X, NVM (latest), MariaDB > 10.6 (optional)`.
So this model is **MySQL / MariaDB only**, it lives on the app server, and `127.0.0.1:3306` is CORRECT
for it. Fine to mention, especially to answer a "databases cost extra" objection.

**Model 2: standalone managed databases, their own tier. THIS IS WHAT WE PROMOTE.**
`/docs/database-launch/launching-postgres`, `-mysql`, `-mariadb`, `-mongodb`, `-redis`,
`-elasticsearch`. Each launches its own database server with its own hostname, in the documented form
`postgres-123456.kloudbeansite.com`, `mysql-123456.kloudbeansite.com`, `redis-123456.kloudbeansite.com`
and so on. Mandatory SSL/TLS, granular access control and IP whitelisting.
`/docs/database-management/controlling-database-access` is explicit: "Never use public access for
production databases" and "Always prefer IP whitelisting over public access".

**THEREFORE, the hard rules:**
- **PostgreSQL is NEVER on the app server.** It exists only as a standalone managed database. Any
  article showing `postgres://...@127.0.0.1:5432` or `localhost:5432` as a Kloudbean production
  connection string is WRONG. Same for managed Redis (6379), MongoDB (27017) and Elasticsearch (9200).
  Use the documented host form instead, with the app server whitelisted.
- **Never write that a managed database "runs on the same server / same box as the app".** It does not.
- **"Next to the app", "beside the app", "in the same account", "in the same dashboard" are all FINE**
  and accurate. They describe one control plane, not one machine.
- "The worker / cron / a second application is on the same server" is FINE and correct. That is the
  app tier, and it is where the per-service billing saving genuinely comes from.

**THE POSITIONING (owner-stated):** promote the separated data tier as the right way to build. A
three-tier shape with the database in its own tier, no public exposure, reachable only from
whitelisted addresses, sized tuned and backed up on its own schedule, and not sitting on the machine
you rebuild when you resize the app. Present this as **basic and correct, not as a premium upsell or
an extra cost**. A managed database is its own subscription on every comparable platform, Render and
Vercel-partner databases included, so it is parity and must not be sold as a saving.

**WHERE THE COST ARGUMENT ACTUALLY LIVES:** the app tier. Web process, background worker and cron are
three billed services on a per-service PaaS and three processes on one server here. That is the real,
honest saving. Do not reach for "and the database is free because it is on the same box".
