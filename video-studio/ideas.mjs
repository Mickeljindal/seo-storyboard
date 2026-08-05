/**
 * 34 Kloudbean explainer video scripts, grounded in the real capability graph
 * (Linux managed cloud: Node/PHP/Python/Ruby/Go/Java, React/Next/Vue/Laravel/
 * Django/WordPress, MySQL/MariaDB/Postgres/Mongo/Redis/Elasticsearch) and the
 * six ICPs. Honesty: qualitative positioning only — no invented figures.
 *
 * Beat shape matches the in-app reel format so AI-generated scripts can later
 * feed the same exporter: { dur (s), on_screen, narration, scene }.
 */

const ICP = {
  vibecoder: "Vibecoders / AI builders",
  saas_founder: "SaaS founders",
  ai_agency: "AI / dev agencies",
  freelance_dev: "Freelance developers",
  wp_agency: "WordPress / agencies",
  enterprise_gov: "Enterprise / gov (KSA)",
  general: "Everyone",
};

const CTA = "Start free at kloudbean.com";

/** helper to keep each idea compact */
function V(o) {
  return { aspect: "16:9", fps: 30, format: "explainer", cta: CTA, ...o, icpName: ICP[o.icp] };
}

export const VIDEOS = [
  // ───────────────────────── Vibecoders / AI builders ─────────────────────────
  V({
    slug: "deploy-lovable-app",
    icp: "vibecoder",
    title: "Your Lovable app deserves a real home",
    hook: "It works on localhost… then what?",
    summary: "For builders shipping full-stack apps with Lovable who hit the deployment gap.",
    beats: [
      { dur: 4, on_screen: "It works on localhost.", narration: "You built a full app with Lovable. It runs perfectly on your machine.", scene: "code" },
      { dur: 4, on_screen: "Then it goes nowhere.", narration: "But getting it online for real is where most AI-built apps stall.", scene: "generic" },
      { dur: 5, on_screen: "Deploy it in one click", narration: "Kloudbean deploys your Lovable app to a real, managed server in a click.", scene: "deploy" },
      { dur: 5, on_screen: "You own the code", narration: "No per-app pricing, no lock-in. It's your code on a server you control.", scene: "security" },
      { dur: 5, on_screen: "Managed. Scalable.", narration: "Security, backups and scaling are handled for you, so you just build.", scene: "scale" },
      { dur: 4, on_screen: "Ship it for real", narration: "Take your Lovable app from localhost to live. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "deploy-bolt-new-app",
    icp: "vibecoder",
    title: "From Bolt.new to live",
    hook: "Prompt to production, without the DevOps.",
    beats: [
      { dur: 4, on_screen: "Prompted an app in Bolt?", narration: "You prompted a working app in Bolt dot new. Now it needs a home.", scene: "ai" },
      { dur: 5, on_screen: "One click to a real server", narration: "Kloudbean runs your Node and React build on managed Linux cloud.", scene: "deploy" },
      { dur: 5, on_screen: "Add a database", narration: "Attach managed Postgres, MySQL, MongoDB or Redis in a few clicks.", scene: "database" },
      { dur: 5, on_screen: "No DevOps required", narration: "No servers to patch, no pipelines to wire. It's all managed.", scene: "security" },
      { dur: 4, on_screen: "Bolt → live", narration: "Go from prompt to production. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "deploy-cursor-app",
    icp: "vibecoder",
    title: "Deploy your Cursor-built app",
    hook: "You wrote it in Cursor. Where does it run?",
    beats: [
      { dur: 4, on_screen: "Built it in Cursor", narration: "You shipped a full-stack app in Cursor. It's ready for the world.", scene: "code" },
      { dur: 5, on_screen: "Deploy to owned cloud", narration: "Push it to a managed Kloudbean server that you actually own.", scene: "deploy" },
      { dur: 5, on_screen: "Node, Python, Go…", narration: "It runs modern runtimes — Node, Python, Ruby, Go, Java and PHP.", scene: "network" },
      { dur: 5, on_screen: "Predictable pricing", narration: "A flat, predictable price instead of per-app platform bills.", scene: "cost" },
      { dur: 4, on_screen: "Own your stack", narration: "Own your app and your infra. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "deploy-replit-app",
    icp: "vibecoder",
    title: "From Replit prototype to production",
    hook: "Prototype in Replit. Run it seriously on Kloudbean.",
    beats: [
      { dur: 4, on_screen: "Prototyped in Replit?", narration: "Replit is great for building. Production is a different job.", scene: "code" },
      { dur: 5, on_screen: "Move to managed cloud", narration: "Kloudbean gives your app a managed Linux server with real resources.", scene: "deploy" },
      { dur: 5, on_screen: "Backups + security built in", narration: "Automatic backups and hardened security come standard.", scene: "security" },
      { dur: 5, on_screen: "Scale when it grows", narration: "Add resources or scale out when your traffic climbs.", scene: "scale" },
      { dur: 4, on_screen: "Prototype → product", narration: "Turn the prototype into a product. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "built-with-ai-now-ship-it",
    icp: "vibecoder",
    title: "Built it with AI? Now actually ship it.",
    hook: "The deployment gap is where AI apps die.",
    beats: [
      { dur: 4, on_screen: "AI wrote the app.", narration: "Lovable, Bolt, Cursor, v0 — AI can write a whole app now.", scene: "ai" },
      { dur: 4, on_screen: "Shipping is the hard part.", narration: "The gap between localhost and live is where most of them die.", scene: "generic" },
      { dur: 5, on_screen: "One managed server", narration: "Kloudbean runs it on one managed server — app, API and database together.", scene: "deploy" },
      { dur: 5, on_screen: "You own everything", narration: "Your code, your data, your server. No per-seat, per-app tax.", scene: "security" },
      { dur: 4, on_screen: "Actually ship it", narration: "Close the deployment gap. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),

  // ───────────────────────── SaaS founders / indie hackers ─────────────────────────
  V({
    slug: "self-host-n8n",
    icp: "saas_founder",
    title: "Self-host n8n and own your automations",
    hook: "Stop renting your automation runs.",
    beats: [
      { dur: 4, on_screen: "Automation SaaS adds up", narration: "Per-run automation pricing gets expensive fast as you scale.", scene: "cost" },
      { dur: 5, on_screen: "Self-host n8n", narration: "Run n8n yourself on a managed Kloudbean server instead.", scene: "network" },
      { dur: 5, on_screen: "Unlimited workflows", narration: "Your workflows, your data, no per-execution meter running.", scene: "scale" },
      { dur: 5, on_screen: "Managed + backed up", narration: "It's still fully managed — security and backups handled for you.", scene: "security" },
      { dur: 4, on_screen: "Own your automations", narration: "Take back your automations. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "self-host-supabase",
    icp: "saas_founder",
    title: "Self-host Supabase, own your backend",
    hook: "Your backend shouldn't be a subscription.",
    beats: [
      { dur: 4, on_screen: "Backend-as-a-service bills", narration: "Managed backend platforms bill by usage — and it stacks up.", scene: "cost" },
      { dur: 5, on_screen: "Self-host Supabase", narration: "Run Supabase on your own managed server on Kloudbean.", scene: "database" },
      { dur: 5, on_screen: "Postgres you control", narration: "A real Postgres database you own, with room to grow.", scene: "database" },
      { dur: 5, on_screen: "Flat, predictable price", narration: "One flat price instead of surprise usage overages.", scene: "cost" },
      { dur: 4, on_screen: "Own your backend", narration: "Own the whole backend. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "kill-the-saas-sprawl",
    icp: "saas_founder",
    title: "Kill the SaaS sprawl",
    hook: "Ten subscriptions, one server.",
    beats: [
      { dur: 4, on_screen: "Subscriptions everywhere", narration: "Auth, analytics, automation, database — every tool its own bill.", scene: "cost" },
      { dur: 5, on_screen: "Consolidate on one server", narration: "Self-host the tools you need on one managed Kloudbean server.", scene: "scale" },
      { dur: 5, on_screen: "n8n, Supabase, Ghost, more", narration: "Run n8n, Supabase, Ghost, Plausible and more, side by side.", scene: "network" },
      { dur: 5, on_screen: "One bill, no sprawl", narration: "One predictable bill replaces a stack of subscriptions.", scene: "cost" },
      { dur: 4, on_screen: "Cut the sprawl", narration: "Consolidate and simplify. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "whole-stack-one-server",
    icp: "saas_founder",
    title: "Your whole stack on one server",
    hook: "Frontend, API, database — together.",
    beats: [
      { dur: 4, on_screen: "Scattered infrastructure", narration: "Frontend here, API there, database somewhere else. It's a lot.", scene: "generic" },
      { dur: 5, on_screen: "One managed server", narration: "Kloudbean runs your frontend, API and database on one server.", scene: "deploy" },
      { dur: 5, on_screen: "Managed databases", narration: "Choose managed MySQL, Postgres, MongoDB or Redis.", scene: "database" },
      { dur: 5, on_screen: "Plus self-hosted tools", narration: "Add self-hosted tools like n8n and Supabase alongside it.", scene: "network" },
      { dur: 4, on_screen: "Whole stack, one place", narration: "Your entire stack, consolidated. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "escape-paas-bill-shock",
    icp: "saas_founder",
    title: "Escape PaaS bill shock",
    hook: "A flat price beats a usage surprise.",
    beats: [
      { dur: 4, on_screen: "The bill spiked again", narration: "Usage-based platforms are cheap until a traffic spike hits.", scene: "cost" },
      { dur: 5, on_screen: "Flat, owned servers", narration: "Kloudbean gives you managed servers at a flat, predictable price.", scene: "compare" },
      { dur: 5, on_screen: "Same app, less surprise", narration: "Run the same React, Next or Node app — without the bill shock.", scene: "deploy" },
      { dur: 5, on_screen: "Scale on your terms", narration: "You decide when to add resources, not a metered dashboard.", scene: "scale" },
      { dur: 4, on_screen: "Predictable by design", narration: "Predictable hosting, on purpose. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),

  // ───────────────────────── AI / dev agencies ─────────────────────────
  V({
    slug: "host-every-client-one-server",
    icp: "ai_agency",
    title: "Host every client on one server",
    hook: "Stop paying per project.",
    beats: [
      { dur: 4, on_screen: "A dozen client projects", narration: "Every client app on its own platform subscription adds up fast.", scene: "cost" },
      { dur: 5, on_screen: "Consolidate the fleet", narration: "Host many client apps and sites on one managed Kloudbean server.", scene: "scale" },
      { dur: 5, on_screen: "Any stack, any client", narration: "WordPress, Next.js, Node, Laravel — mix stacks per client freely.", scene: "network" },
      { dur: 5, on_screen: "One bill to manage", narration: "One bill and one console instead of a dozen dashboards.", scene: "cloud" },
      { dur: 4, on_screen: "Run the whole book", narration: "Host your whole client book in one place. kloudbean.com.", scene: "deploy" },
    ],
  }),
  V({
    slug: "white-label-agency-hosting",
    icp: "ai_agency",
    title: "White-label hosting for your agency",
    hook: "Your brand, our managed infra.",
    beats: [
      { dur: 4, on_screen: "Hosting is your margin", narration: "Reselling hosting can be recurring revenue for your agency.", scene: "cost" },
      { dur: 5, on_screen: "White-label it", narration: "Deliver managed cloud under your own brand on Kloudbean.", scene: "security" },
      { dur: 5, on_screen: "Unlimited DevOps support", narration: "Lean on unlimited DevOps help so your team ships, not firefights.", scene: "network" },
      { dur: 5, on_screen: "Clients stay yours", narration: "You own the relationship; we run the infrastructure.", scene: "cloud" },
      { dur: 4, on_screen: "Managed, branded", narration: "White-label managed hosting. Start free at kloudbean.com.", scene: "deploy" },
    ],
  }),
  V({
    slug: "one-bill-unlimited-devops",
    icp: "ai_agency",
    title: "One bill. Unlimited DevOps.",
    hook: "Trade infra headaches for shipping.",
    beats: [
      { dur: 4, on_screen: "DevOps is a tax", narration: "Managing per-client servers is a tax on your billable time.", scene: "generic" },
      { dur: 5, on_screen: "Fully managed", narration: "Kloudbean handles security, backups, updates and scaling.", scene: "security" },
      { dur: 5, on_screen: "Unlimited support", narration: "Unlimited DevOps support means help when a client needs it.", scene: "network" },
      { dur: 5, on_screen: "One predictable bill", narration: "And it's one predictable bill across all your projects.", scene: "cost" },
      { dur: 4, on_screen: "Ship, don't firefight", narration: "Spend time shipping. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "stop-juggling-platforms",
    icp: "ai_agency",
    title: "Stop juggling Vercel, Netlify, Heroku",
    hook: "One console beats five dashboards.",
    beats: [
      { dur: 4, on_screen: "Five dashboards, one team", narration: "Vercel here, Netlify there, Heroku for the API — it's scattered.", scene: "generic" },
      { dur: 5, on_screen: "One managed console", narration: "Kloudbean brings your apps into one managed console.", scene: "compare" },
      { dur: 5, on_screen: "Frontends + APIs + DBs", narration: "Frontends, APIs and databases, all in one place.", scene: "network" },
      { dur: 5, on_screen: "Predictable pricing", narration: "And a flat price instead of five metered bills.", scene: "cost" },
      { dur: 4, on_screen: "Consolidate it all", narration: "One place for everything. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),

  // ───────────────────────── Freelance developers ─────────────────────────
  V({
    slug: "managed-server-from-8",
    icp: "freelance_dev",
    title: "A managed server from ~$8/mo",
    hook: "Managed cloud, freelancer-friendly.",
    beats: [
      { dur: 4, on_screen: "DIY VPS is fiddly", narration: "A raw VPS means you're on the hook for everything that breaks.", scene: "generic" },
      { dur: 5, on_screen: "Managed from ~$8/mo", narration: "Kloudbean gives you a fully managed server starting around eight dollars a month.", scene: "cost" },
      { dur: 5, on_screen: "Security + backups included", narration: "Security hardening and automatic backups are included.", scene: "security" },
      { dur: 5, on_screen: "Host client work", narration: "Run your own projects and client sites on the same box.", scene: "scale" },
      { dur: 4, on_screen: "Managed, affordable", narration: "Managed cloud that fits a freelancer. kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "security-backups-cicd-handled",
    icp: "freelance_dev",
    title: "Security, backups, CI/CD — handled",
    hook: "The boring, critical stuff, done for you.",
    beats: [
      { dur: 4, on_screen: "No time for ops", narration: "Freelancers rarely have time to run security and backups properly.", scene: "generic" },
      { dur: 5, on_screen: "Hardened by default", narration: "Kloudbean hardens the server and keeps it patched.", scene: "security" },
      { dur: 5, on_screen: "Automatic backups", narration: "Automatic backups mean a bad deploy is never fatal.", scene: "database" },
      { dur: 5, on_screen: "CI/CD built in", narration: "Built-in CI/CD pushes your changes live cleanly.", scene: "code" },
      { dur: 4, on_screen: "You just build", narration: "The critical stuff is handled. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "wordpress-and-node-one-box",
    icp: "freelance_dev",
    title: "WordPress + Node on one box",
    hook: "Mixed stacks, one managed server.",
    beats: [
      { dur: 4, on_screen: "Clients use everything", narration: "One client wants WordPress, the next wants a Node app.", scene: "generic" },
      { dur: 5, on_screen: "Run them together", narration: "Kloudbean runs WordPress, Node and frontends on one server.", scene: "network" },
      { dur: 5, on_screen: "Managed databases too", narration: "Attach managed MySQL or Postgres for whatever they need.", scene: "database" },
      { dur: 5, on_screen: "One place to manage", narration: "No separate hosts to juggle — it's all in one console.", scene: "cloud" },
      { dur: 4, on_screen: "Any stack, one box", narration: "Host any stack together. Start free at kloudbean.com.", scene: "deploy" },
    ],
  }),
  V({
    slug: "no-devops-no-problem",
    icp: "freelance_dev",
    title: "No DevOps team? No problem.",
    hook: "Be a one-person shop with a real backend.",
    beats: [
      { dur: 4, on_screen: "Solo, but shipping", narration: "You're a one-person shop shipping real apps for real clients.", scene: "code" },
      { dur: 5, on_screen: "Managed cloud has your back", narration: "Kloudbean is the managed cloud that acts like your ops team.", scene: "security" },
      { dur: 5, on_screen: "Deploy, scale, sleep", narration: "Deploy in a click, scale when needed, and actually sleep.", scene: "scale" },
      { dur: 5, on_screen: "Support when you need it", narration: "And there's real support when something looks off.", scene: "network" },
      { dur: 4, on_screen: "Ops, handled", narration: "Ship like a bigger team. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),

  // ───────────────────────── WordPress / marketing agencies ─────────────────────────
  V({
    slug: "wordpress-and-nextjs-side-by-side",
    icp: "wp_agency",
    title: "WordPress AND Next.js, side by side",
    hook: "Your CMS and your app framework, together.",
    beats: [
      { dur: 4, on_screen: "WP-only hosts limit you", narration: "WordPress-only hosts can't run your Next.js or Node projects.", scene: "generic" },
      { dur: 5, on_screen: "Run both, one platform", narration: "Kloudbean hosts WordPress and modern frameworks together.", scene: "wordpress" },
      { dur: 5, on_screen: "Headless-ready", narration: "Perfect for headless WordPress with a React or Next front end.", scene: "network" },
      { dur: 5, on_screen: "Managed + fast", narration: "Fully managed, with caching and a global CDN for speed.", scene: "speed" },
      { dur: 4, on_screen: "CMS + app, unified", narration: "One platform for both. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "wp-engine-kinsta-alternative",
    icp: "wp_agency",
    title: "A real WP Engine / Kinsta alternative",
    hook: "Managed WordPress without the handcuffs.",
    beats: [
      { dur: 4, on_screen: "Managed WP, but boxed in", narration: "Premium managed WordPress is fast, but locked to just WordPress.", scene: "compare" },
      { dur: 5, on_screen: "Managed WP + any stack", narration: "Kloudbean gives you managed WordPress and any other stack too.", scene: "wordpress" },
      { dur: 5, on_screen: "No visit-based overages", narration: "No nervous month-end when a campaign spikes your traffic.", scene: "cost" },
      { dur: 5, on_screen: "Global speed", narration: "Backed by caching and a CDN so pages load fast everywhere.", scene: "cdn" },
      { dur: 4, on_screen: "Managed WP, unlocked", narration: "A managed WordPress home without limits. kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "managed-wordpress-no-visit-caps",
    icp: "wp_agency",
    title: "Managed WordPress without visit caps",
    hook: "Go viral without a surprise invoice.",
    beats: [
      { dur: 4, on_screen: "The campaign worked…", narration: "Your campaign took off — and so did the visit-based overage fees.", scene: "cost" },
      { dur: 5, on_screen: "No per-visit meter", narration: "Kloudbean's managed WordPress isn't billed per visit.", scene: "compare" },
      { dur: 5, on_screen: "Cached + CDN-backed", narration: "Caching and a CDN keep it fast under a traffic surge.", scene: "cdn" },
      { dur: 5, on_screen: "Scale the server", narration: "Need more? Scale the server — on your terms.", scene: "scale" },
      { dur: 4, on_screen: "Grow without fear", narration: "Let traffic spike. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "faster-managed-wordpress",
    icp: "wp_agency",
    title: "Faster managed WordPress hosting",
    hook: "Speed is a ranking factor. And a conversion one.",
    beats: [
      { dur: 4, on_screen: "Slow WP loses money", narration: "A slow WordPress site costs you rankings and conversions.", scene: "speed" },
      { dur: 5, on_screen: "Tuned Linux stack", narration: "Kloudbean runs WordPress on a tuned Nginx or LiteSpeed stack.", scene: "network" },
      { dur: 5, on_screen: "Caching + CDN", narration: "Server caching plus a global CDN cut your load times.", scene: "cdn" },
      { dur: 5, on_screen: "Managed, always", narration: "And it stays fast because it's fully managed and monitored.", scene: "security" },
      { dur: 4, on_screen: "Fast by default", narration: "Make WordPress fast. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),

  // ───────────────────────── Enterprise / government (KSA) ─────────────────────────
  V({
    slug: "data-residency-gcp-dammam",
    icp: "enterprise_gov",
    title: "Data residency in the Kingdom",
    hook: "Keep the data in-region. Dammam.",
    beats: [
      { dur: 4, on_screen: "Where does data live?", narration: "For regulated orgs, where your data physically lives matters.", scene: "security" },
      { dur: 5, on_screen: "In-Kingdom on GCP Dammam", narration: "Kloudbean can run your workloads in-region on GCP Dammam.", scene: "cdn" },
      { dur: 5, on_screen: "Managed + isolated", narration: "Managed, isolated environments — not a generic shared host.", scene: "cloud" },
      { dur: 5, on_screen: "Audit-ready infra", narration: "Built for compliance and audit-ready operations.", scene: "security" },
      { dur: 4, on_screen: "In-region, managed", narration: "Data residency, handled. Talk to us at kloudbean.com.", scene: "deploy" },
    ],
  }),
  V({
    slug: "self-host-gitlab",
    icp: "enterprise_gov",
    title: "Self-host GitLab on managed cloud",
    hook: "Own your source, in your region.",
    beats: [
      { dur: 4, on_screen: "Source code is sensitive", narration: "For many teams, source code can't live on someone else's SaaS.", scene: "security" },
      { dur: 5, on_screen: "Self-host GitLab", narration: "Run your own GitLab on a managed Kloudbean server.", scene: "code" },
      { dur: 5, on_screen: "In-region if needed", narration: "Keep it in-region for data residency requirements.", scene: "cdn" },
      { dur: 5, on_screen: "Managed + backed up", narration: "Still fully managed, with backups and security handled.", scene: "database" },
      { dur: 4, on_screen: "Own your pipeline", narration: "Own your source and CI. Talk to us at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "prod-qa-dev-managed",
    icp: "enterprise_gov",
    title: "Prod, QA and dev — fully managed",
    hook: "Real environments, managed DBs, load balancers, S3.",
    beats: [
      { dur: 4, on_screen: "You need real environments", narration: "Serious apps need separate production, QA and dev environments.", scene: "network" },
      { dur: 5, on_screen: "Managed everything", narration: "Kloudbean runs them with managed databases and load balancers.", scene: "database" },
      { dur: 5, on_screen: "S3 storage + scaling", narration: "Add object storage and scale each environment independently.", scene: "scale" },
      { dur: 5, on_screen: "One controlled platform", narration: "All on one controlled, managed platform you can audit.", scene: "security" },
      { dur: 4, on_screen: "Enterprise-ready", narration: "Environments done right. Talk to us at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "compliance-ready-cloud",
    icp: "enterprise_gov",
    title: "Compliance-ready managed cloud",
    hook: "Control and isolation, not a generic host.",
    beats: [
      { dur: 4, on_screen: "Generic hosting won't cut it", narration: "Regulated workloads need isolation and control, not shared hosting.", scene: "generic" },
      { dur: 5, on_screen: "Isolated environments", narration: "Kloudbean gives you isolated, managed environments.", scene: "security" },
      { dur: 5, on_screen: "Data residency options", narration: "With in-region options for data residency, including the Kingdom.", scene: "cdn" },
      { dur: 5, on_screen: "Managed DBs + GitLab", narration: "Managed databases, load balancers and self-hosted GitLab included.", scene: "database" },
      { dur: 4, on_screen: "Built for compliance", narration: "Compliance-ready by design. Talk to us at kloudbean.com.", scene: "cloud" },
    ],
  }),

  // ───────────────────────── Capability / feature explainers ─────────────────────────
  V({
    slug: "what-is-managed-cloud-hosting",
    icp: "general",
    title: "What is managed cloud hosting?",
    hook: "The server, run for you.",
    beats: [
      { dur: 4, on_screen: "What is managed cloud?", narration: "Managed cloud hosting means the hard server work is done for you.", scene: "cloud" },
      { dur: 5, on_screen: "You bring the app", narration: "You bring the app; the platform runs the Linux server underneath.", scene: "deploy" },
      { dur: 5, on_screen: "Security, updates, backups", narration: "Security patching, updates and backups are handled automatically.", scene: "security" },
      { dur: 5, on_screen: "Scale without rebuilds", narration: "And you can scale up without re-architecting everything.", scene: "scale" },
      { dur: 4, on_screen: "Managed, so you build", narration: "That's Kloudbean. Start free at kloudbean.com.", scene: "network" },
    ],
  }),
  V({
    slug: "one-click-deploy-explained",
    icp: "general",
    title: "One-click deploy, explained",
    hook: "From repo to running, fast.",
    beats: [
      { dur: 4, on_screen: "Deploying used to hurt", narration: "Deploying an app used to mean configuring a server by hand.", scene: "generic" },
      { dur: 5, on_screen: "Connect your app", narration: "On Kloudbean you connect your app and pick a runtime.", scene: "code" },
      { dur: 5, on_screen: "One click to live", narration: "One click provisions the server and puts your app online.", scene: "deploy" },
      { dur: 5, on_screen: "CI/CD keeps it fresh", narration: "Built-in CI/CD ships every future change cleanly.", scene: "network" },
      { dur: 4, on_screen: "Repo → running", narration: "That's one-click deploy. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "managed-databases-explained",
    icp: "general",
    title: "Managed databases, without the babysitting",
    hook: "MySQL, Postgres, Mongo, Redis — handled.",
    beats: [
      { dur: 4, on_screen: "Databases need care", narration: "Databases need backups, tuning and security — or they bite you.", scene: "database" },
      { dur: 5, on_screen: "Pick your engine", narration: "Kloudbean offers managed MySQL, MariaDB, Postgres, MongoDB and Redis.", scene: "database" },
      { dur: 5, on_screen: "Backed up + secured", narration: "They're backed up, secured and monitored for you.", scene: "security" },
      { dur: 5, on_screen: "Right next to your app", narration: "And they run right beside your app for low latency.", scene: "speed" },
      { dur: 4, on_screen: "Databases, handled", narration: "Managed data, done right. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "automatic-backups",
    icp: "general",
    title: "Automatic backups that just work",
    hook: "A bad deploy shouldn't be fatal.",
    beats: [
      { dur: 4, on_screen: "One bad deploy…", narration: "One bad deploy or a wrong query can wipe out hours of work.", scene: "generic" },
      { dur: 5, on_screen: "Automatic backups", narration: "Kloudbean takes automatic backups of your sites and data.", scene: "database" },
      { dur: 5, on_screen: "Restore in a click", narration: "Roll back to a known-good point in a click.", scene: "security" },
      { dur: 5, on_screen: "Set and forget", narration: "No scripts to maintain — it just runs in the background.", scene: "cloud" },
      { dur: 4, on_screen: "Sleep easy", narration: "Backups you never think about. Start free at kloudbean.com.", scene: "network" },
    ],
  }),
  V({
    slug: "cicd-built-in",
    icp: "general",
    title: "CI/CD built in",
    hook: "Push code. It ships.",
    beats: [
      { dur: 4, on_screen: "Manual deploys break", narration: "Manual deploys are slow and easy to get wrong.", scene: "generic" },
      { dur: 5, on_screen: "Pipeline included", narration: "Kloudbean includes a CI/CD pipeline out of the box.", scene: "code" },
      { dur: 5, on_screen: "Push to deploy", narration: "Push your code and it builds and ships automatically.", scene: "deploy" },
      { dur: 5, on_screen: "Roll back safely", narration: "If something's off, roll back safely in moments.", scene: "security" },
      { dur: 4, on_screen: "Ship on autopilot", narration: "Shipping on autopilot. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "autoscaling-load-balancing",
    icp: "general",
    title: "Survive traffic spikes",
    hook: "Autoscaling + load balancing, managed.",
    beats: [
      { dur: 4, on_screen: "Traffic just spiked", narration: "A launch or a viral post can flood your app in minutes.", scene: "scale" },
      { dur: 5, on_screen: "Load balancing", narration: "Kloudbean spreads traffic across your app with load balancing.", scene: "network" },
      { dur: 5, on_screen: "Scale out fast", narration: "Scale out to handle the surge, then scale back down.", scene: "scale" },
      { dur: 5, on_screen: "Stay online", narration: "Your app stays fast and online when it matters most.", scene: "speed" },
      { dur: 4, on_screen: "Built for the spike", narration: "Handle the spike. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "seven-cloud-providers-one-console",
    icp: "general",
    title: "7 cloud providers, one console",
    hook: "Pick your cloud. Manage it in one place.",
    beats: [
      { dur: 4, on_screen: "Which cloud is best?", narration: "Different projects fit different clouds — but juggling them is hard.", scene: "compare" },
      { dur: 5, on_screen: "7 providers, 1 console", narration: "Kloudbean lets you deploy across seven cloud providers from one console.", scene: "cdn" },
      { dur: 5, on_screen: "Global regions", narration: "Choose regions worldwide, close to your users.", scene: "cdn" },
      { dur: 5, on_screen: "Same managed experience", narration: "The same managed experience, whichever cloud you pick.", scene: "cloud" },
      { dur: 4, on_screen: "Your cloud, your call", narration: "One console for all of it. Start free at kloudbean.com.", scene: "network" },
    ],
  }),
  V({
    slug: "migrate-off-windows-iis",
    icp: "general",
    title: "Move off Windows and IIS to a Linux stack",
    hook: "Modernize onto managed Linux cloud.",
    summary: "Comparison/migration framing — Kloudbean runs Linux stacks, not Windows/IIS.",
    beats: [
      { dur: 4, on_screen: "Stuck on Windows/IIS?", narration: "Legacy Windows and IIS hosting can be costly and hard to scale.", scene: "generic" },
      { dur: 5, on_screen: "Move to managed Linux", narration: "Kloudbean runs modern Linux web stacks — Nginx, Apache and LiteSpeed.", scene: "network" },
      { dur: 5, on_screen: "Node, PHP, Python, more", narration: "Bring your Node, PHP, Python, Ruby, Go or Java workloads over.", scene: "code" },
      { dur: 5, on_screen: "Managed + cheaper to run", narration: "Fully managed, and typically simpler and cheaper to operate.", scene: "cost" },
      { dur: 4, on_screen: "Modernize the stack", narration: "Migrate to modern managed cloud. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),

  // ───────────────── Capability reels (2026) — grounded in kloudbean-facts.md ─────────────────
  // One dashboard, 7 clouds, 6 managed DBs, built-in S3 + FLB, static sites, one-click
  // AI apps, managed CI/CD with live logs, staging, UAC/IP controls, audit trail (enterprise).
  V({
    slug: "one-dashboard-whole-stack",
    icp: "general",
    title: "Your whole stack, one dashboard",
    hook: "Stop stitching five tools together.",
    beats: [
      { dur: 4, on_screen: "Your stack is scattered", narration: "Servers on one tool, database on another, storage somewhere else.", scene: "generic" },
      { dur: 5, on_screen: "One dashboard for all of it", narration: "Kloudbean runs your servers, apps and databases from a single console.", scene: "cloud" },
      { dur: 5, on_screen: "Storage, static sites, balancer", narration: "Add object storage, static sites and a load balancer in the same place.", scene: "network" },
      { dur: 5, on_screen: "One login, whole stack", narration: "No juggling providers. Your whole stack lives behind one login.", scene: "compare" },
      { dur: 4, on_screen: "See it all at once", narration: "One dashboard for everything. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "built-in-load-balancer",
    icp: "saas_founder",
    title: "A load balancer, already built in",
    hook: "It's in every account. Just flip it on.",
    beats: [
      { dur: 4, on_screen: "Outgrowing one server?", narration: "When one server isn't enough, you need to spread the load.", scene: "scale" },
      { dur: 5, on_screen: "The FLB is built in", narration: "Kloudbean's Flexible Load Balancer ships with every account.", scene: "network" },
      { dur: 5, on_screen: "Pools, SSL, access logs", narration: "Route traffic across app pools, manage SSL, and read access logs.", scene: "security" },
      { dur: 5, on_screen: "Off until you need it", narration: "It's there the moment you switch it on. No separate product to buy.", scene: "compare" },
      { dur: 4, on_screen: "Balance the load", narration: "Scale out cleanly. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "object-storage-built-in",
    icp: "saas_founder",
    title: "S3-compatible storage, included",
    hook: "Buckets in the same dashboard as your app.",
    beats: [
      { dur: 4, on_screen: "Files, uploads, backups", narration: "Every app needs somewhere to put uploads and static assets.", scene: "generic" },
      { dur: 5, on_screen: "S3-compatible buckets", narration: "Kloudbean gives you S3-compatible object storage right in the console.", scene: "database" },
      { dur: 5, on_screen: "Works with the AWS SDK", narration: "Point your existing S3 SDK or CLI at it and it just works.", scene: "code" },
      { dur: 5, on_screen: "Public or private", narration: "Set buckets public or private and manage objects from the dashboard.", scene: "security" },
      { dur: 4, on_screen: "Store it on Kloudbean", narration: "Object storage, included. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "six-managed-databases",
    icp: "general",
    title: "Six managed databases, one click",
    hook: "SQL, document, cache, search. Covered.",
    beats: [
      { dur: 4, on_screen: "Which database fits?", narration: "Different apps need different databases. Picking is half the battle.", scene: "database" },
      { dur: 5, on_screen: "Six managed engines", narration: "Managed MySQL, MariaDB, PostgreSQL, MongoDB, Redis and Elasticsearch.", scene: "database" },
      { dur: 5, on_screen: "One click, backed up", narration: "Launch one in a click, with automatic backups and controlled access.", scene: "security" },
      { dur: 5, on_screen: "Right beside your app", narration: "They run next to your app for low latency and simple wiring.", scene: "speed" },
      { dur: 4, on_screen: "Pick your engine", narration: "Managed data, your way. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "private-ai-chat-openwebui",
    icp: "vibecoder",
    title: "Private AI chat you actually own",
    hook: "OpenWebUI + DeepSeek, one click.",
    beats: [
      { dur: 4, on_screen: "Want private AI chat?", narration: "Sending everything to a third-party AI isn't always an option.", scene: "ai" },
      { dur: 5, on_screen: "OpenWebUI + DeepSeek", narration: "Kloudbean deploys OpenWebUI with DeepSeek in a single click.", scene: "deploy" },
      { dur: 5, on_screen: "On a server you own", narration: "Your prompts and your data stay on infrastructure you control.", scene: "security" },
      { dur: 5, on_screen: "Still fully managed", narration: "It's managed for you, with backups and hardening handled.", scene: "cloud" },
      { dur: 4, on_screen: "Own your AI", narration: "Private AI chat, self-hosted. Start free at kloudbean.com.", scene: "ai" },
    ],
  }),
  V({
    slug: "free-static-site-hosting",
    icp: "freelance_dev",
    title: "Free static site hosting",
    hook: "Custom domain, SSL and analytics. Free.",
    beats: [
      { dur: 4, on_screen: "Just need to ship a site?", narration: "Landing pages and docs shouldn't cost a monthly platform fee.", scene: "generic" },
      { dur: 5, on_screen: "Static hosting, free", narration: "Kloudbean hosts static sites for free, on your own custom domain.", scene: "cdn" },
      { dur: 5, on_screen: "SSL + visit analytics", narration: "Free SSL and built-in visit analytics come with it.", scene: "security" },
      { dur: 5, on_screen: "Push and it's live", narration: "Deploy your built site and it's online in moments.", scene: "deploy" },
      { dur: 4, on_screen: "Ship it free", narration: "Static hosting on the house. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "live-build-logs",
    icp: "vibecoder",
    title: "Watch your deploy happen live",
    hook: "Push to GitHub. See the build stream.",
    beats: [
      { dur: 4, on_screen: "Deploys shouldn't be a mystery", narration: "When a deploy fails, you need to see why, fast.", scene: "generic" },
      { dur: 5, on_screen: "Live build logs", narration: "Kloudbean streams the build log as your code deploys.", scene: "code" },
      { dur: 5, on_screen: "Push to GitHub, it ships", narration: "Connect GitHub and every push builds and deploys automatically.", scene: "deploy" },
      { dur: 5, on_screen: "History and rollback", narration: "Browse deployment history and roll back if something looks off.", scene: "security" },
      { dur: 4, on_screen: "See every deploy", narration: "CI/CD you can watch. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "staging-sites-wp-laravel",
    icp: "wp_agency",
    title: "One-click staging for WordPress and Laravel",
    hook: "Never test on the live site again.",
    beats: [
      { dur: 4, on_screen: "Never test on production", narration: "Editing a live site and hoping for the best is how sites break.", scene: "generic" },
      { dur: 5, on_screen: "One-click staging", narration: "Kloudbean spins up staging for WordPress and Laravel in a click.", scene: "code" },
      { dur: 5, on_screen: "Test safely", narration: "Try changes, plugins and updates away from real traffic.", scene: "security" },
      { dur: 5, on_screen: "Push when ready", narration: "Happy with it? Take it live with confidence.", scene: "deploy" },
      { dur: 4, on_screen: "Stage, then ship", narration: "Test before you launch. Start free at kloudbean.com.", scene: "cloud" },
    ],
  }),
  V({
    slug: "audit-trail-enterprise",
    icp: "enterprise_gov",
    title: "An audit trail built for compliance",
    hook: "Who changed what, and when. All of it.",
    cta: "Talk to us at kloudbean.com",
    beats: [
      { dur: 4, on_screen: "Who changed what, when?", narration: "Compliance means knowing every action taken on your infrastructure.", scene: "security" },
      { dur: 5, on_screen: "Immutable activity log", narration: "Kloudbean keeps an account-wide, immutable audit trail.", scene: "security" },
      { dur: 5, on_screen: "Searchable, exportable", narration: "Search it, then export to CSV for your auditors.", scene: "database" },
      { dur: 5, on_screen: "Built for regulators", narration: "It's made for teams that answer to compliance requirements.", scene: "cloud" },
      { dur: 4, on_screen: "Audit-ready by default", narration: "Prove control. Talk to us at kloudbean.com.", scene: "security" },
    ],
  }),
  V({
    slug: "lock-down-access-uac",
    icp: "enterprise_gov",
    title: "Lock down who can touch what",
    hook: "Least privilege, by design.",
    cta: "Talk to us at kloudbean.com",
    beats: [
      { dur: 4, on_screen: "Not everyone needs the keys", narration: "Handing every teammate full access is a real security risk.", scene: "security" },
      { dur: 5, on_screen: "Granular access control", narration: "User Access Control sets per-resource, per-action rights for subusers.", scene: "security" },
      { dur: 5, on_screen: "Lock it to an IP", narration: "Add IP access rules with CIDR, plus a Basic Auth gate on apps.", scene: "network" },
      { dur: 5, on_screen: "Least privilege by design", narration: "Give people exactly the access they need and nothing more.", scene: "compare" },
      { dur: 4, on_screen: "Control the keys", narration: "Least-privilege access. Talk to us at kloudbean.com.", scene: "security" },
    ],
  }),
];

// Stamp a stable, zero-padded id/number per video (order = list order).
VIDEOS.forEach((v, i) => {
  v.number = i + 1;
  v.id = String(i + 1).padStart(2, "0");
});

/**
 * LONG-FORM YouTube episodes for the Kloudbean founder channel.
 * These are richer than the short reels above: outline + wow factor + CTA, meant
 * as founder-led tutorials, tours, comparisons and deep-dives. Grounded strictly
 * in kloudbean-facts.md (7 clouds, 6 managed DBs, built-in S3 + FLB, one-click AI
 * apps, managed CI/CD with live logs, staging, UAC/IP controls, enterprise k8s/
 * autoscaling/audit trail). No invented figures, prices or SLAs.
 *
 * Consumed by build.mjs to emit output/LONGFORM.md. Shape is intentionally NOT
 * the reel beat shape (long-form isn't a slideshow), so it lives in its own export.
 */
export const LONGFORM = [
  {
    slug: "deploy-ai-app-live-10-min",
    title: "I took an AI-built app from localhost to production (live)",
    audience: "Vibecoders / AI builders (Lovable, Cursor, Bolt.new, v0, Replit)",
    lengthMin: "10-14",
    hook: "AI can write a whole app now. The part nobody shows you is getting it live and keeping it alive.",
    segments: [
      { at: "0:00", title: "The deployment gap", detail: "Why AI-built apps stall between 'works on my machine' and a real URL." },
      { at: "1:30", title: "Spin up a managed server", detail: "Create a server and pick a cloud from the same dashboard." },
      { at: "3:30", title: "Connect GitHub, deploy on push", detail: "Managed CI/CD builds and deploys on every push; GitHub OAuth to connect." },
      { at: "5:30", title: "Attach a managed database", detail: "Add managed PostgreSQL and wire it in with environment variables." },
      { at: "7:30", title: "Watch the build stream", detail: "Live build logs and deployment history, with rollback if a deploy goes wrong." },
      { at: "9:30", title: "Domain, SSL, backups", detail: "Point a custom domain, get free SSL, and turn on automatic backups." },
      { at: "12:00", title: "Recap + what it cost you", detail: "One dashboard, your code, your data. Honest note on what 'managed' does and doesn't cover." },
    ],
    wow: "A real, unedited screen-share taking an AI-generated app from localhost to a live URL with a database and live build logs, all in one console.",
    cta: "Start free at kloudbean.com — free trial and free migration assistance.",
    grounding: ["managed CI/CD from Git + GitHub OAuth", "live build logs + deployment history", "managed PostgreSQL", "free SSL", "automatic backups", "one dashboard for the whole stack"],
  },
  {
    slug: "one-dashboard-platform-tour",
    title: "The whole stack in one dashboard: a full Kloudbean tour",
    audience: "Everyone evaluating a managed cloud platform",
    lengthMin: "12-16",
    hook: "Most hosting makes you juggle products. Here's what it looks like when servers, databases, storage and a load balancer live behind one login.",
    segments: [
      { at: "0:00", title: "One console, whole stack", detail: "The pitch: servers, apps, databases, storage, static sites, load balancer, all in one place." },
      { at: "1:30", title: "Servers across 7 clouds", detail: "AWS, AWS Lightsail, GCP, Linode, Vultr, DigitalOcean and UpCloud from one UI." },
      { at: "3:30", title: "Deploy an app", detail: "PHP, Node, Python, Ruby or Java, with runtime config in the UI." },
      { at: "5:30", title: "Six managed databases", detail: "MySQL, MariaDB, PostgreSQL, MongoDB, Redis and Elasticsearch, one click each." },
      { at: "7:30", title: "Object storage + static sites", detail: "S3-compatible buckets, managed GCS, and free static hosting with SSL + analytics." },
      { at: "9:30", title: "Flexible Load Balancer", detail: "Built into every account: app pools, SSL management, access logs." },
      { at: "11:00", title: "Staging, backups, access", detail: "Staging for WordPress and Laravel, automatic backups, subusers and UAC." },
    ],
    wow: "Seeing genuinely everything, compute to storage to load balancing, managed from a single dashboard instead of five separate products.",
    cta: "Start free at kloudbean.com.",
    grounding: ["7 clouds", "6 managed databases", "S3-compatible + managed GCS storage", "free static sites", "built-in FLB", "staging + backups", "subusers + UAC"],
  },
  {
    slug: "choose-your-cloud-7-providers",
    title: "AWS vs GCP vs DigitalOcean vs Vultr vs Linode vs UpCloud vs Lightsail",
    audience: "SaaS founders and developers picking where to host",
    lengthMin: "12-15",
    hook: "You don't have to marry one cloud. Here's how to actually choose, and deploy the same app to two of them.",
    segments: [
      { at: "0:00", title: "Why cloud choice matters", detail: "Cost, performance, regions and lock-in, framed simply." },
      { at: "2:00", title: "The seven, compared", detail: "Where each of the 7 supported providers tends to shine." },
      { at: "5:00", title: "Regions and latency", detail: "Put the app close to users; why region choice beats raw specs." },
      { at: "7:00", title: "Deploy the same app twice", detail: "Live: deploy one app to two different clouds from the same console." },
      { at: "10:00", title: "One console for all of it", detail: "Same managed experience regardless of the cloud underneath." },
      { at: "12:00", title: "How I'd choose", detail: "A founder's honest default pick, and when to deviate." },
    ],
    wow: "Deploying one identical app to two different clouds side by side, from a single dashboard, then comparing.",
    cta: "Start free at kloudbean.com.",
    grounding: ["7 clouds: AWS, Lightsail, GCP, Linode, Vultr, DigitalOcean, UpCloud", "one console across providers", "tier-1 provider infrastructure"],
  },
  {
    slug: "self-host-ai-saas-stack",
    title: "Self-host your SaaS stack: n8n + Supabase + private AI, one server",
    audience: "SaaS founders and indie hackers cutting subscription sprawl",
    lengthMin: "12-16",
    hook: "Every tool is a subscription now. Here's how to run the important ones yourself, still managed.",
    segments: [
      { at: "0:00", title: "The subscription sprawl problem", detail: "Automation, backend and AI each metered separately adds up." },
      { at: "2:00", title: "One-click n8n", detail: "Self-host n8n for unlimited workflows on a managed server." },
      { at: "4:30", title: "One-click Supabase", detail: "A Postgres-backed backend you own, not a usage meter." },
      { at: "7:00", title: "Private AI: OpenWebUI + DeepSeek", detail: "A private AI chat on infrastructure you control." },
      { at: "9:30", title: "Wire them together", detail: "Connect the tools and keep data on your own server." },
      { at: "11:30", title: "Managed, backed up, honest costs", detail: "Still fully managed. A fair note on when self-hosting is and isn't worth it." },
    ],
    wow: "A working self-hosted SaaS toolkit (automation + backend + private AI) stood up in one session, all managed.",
    cta: "Start free at kloudbean.com.",
    grounding: ["one-click n8n, Supabase, OpenWebUI + DeepSeek", "managed servers + backups", "you own your code and data"],
  },
  {
    slug: "managed-databases-deep-dive",
    title: "6 managed databases explained: which one for your app?",
    audience: "Developers and technical founders (engineer-grade)",
    lengthMin: "14-18",
    hook: "Relational, document, cache, search. Here's when each of the six managed engines is the right call, and when it isn't.",
    segments: [
      { at: "0:00", title: "The four jobs databases do", detail: "Relational vs document vs cache vs search, in plain terms." },
      { at: "2:30", title: "MySQL and MariaDB", detail: "The default relational pick and its drop-in cousin." },
      { at: "5:00", title: "PostgreSQL", detail: "When Postgres is worth choosing over MySQL." },
      { at: "7:30", title: "MongoDB", detail: "Where a document store genuinely helps, and where it hurts." },
      { at: "9:30", title: "Redis", detail: "Caching and queues; why it's a companion, not a primary store." },
      { at: "11:30", title: "Elasticsearch", detail: "Real search and log analytics, not a general database." },
      { at: "13:30", title: "Backups, access, private networking", detail: "One-click launch, automatic backups, controlled access, VPC." },
    ],
    wow: "A no-hype decision guide across all six managed engines, with honest 'don't use this here' calls a vendor usually won't make.",
    cta: "Start free at kloudbean.com.",
    grounding: ["6 managed DBs: MySQL, MariaDB, PostgreSQL, MongoDB, Redis, Elasticsearch", "one-click + automatic backups + access control", "VPC / private networking"],
  },
  {
    slug: "ci-cd-live-build-logs",
    title: "Ship on every git push: managed CI/CD with live build logs",
    audience: "Vibecoders and freelance developers",
    lengthMin: "9-12",
    hook: "No pipelines to wire. Connect GitHub, push, and watch it build in real time.",
    segments: [
      { at: "0:00", title: "Manual deploys are fragile", detail: "Why hand-deploying breaks and wastes time." },
      { at: "1:30", title: "Connect GitHub (OAuth)", detail: "Link the repo once with GitHub OAuth." },
      { at: "3:00", title: "Build and deploy on push", detail: "Every push triggers a managed build and deploy." },
      { at: "4:30", title: "Live build logs", detail: "Watch the log stream so failures are obvious, fast." },
      { at: "6:00", title: "History and rollback", detail: "Deployment history plus a clean rollback path." },
      { at: "7:30", title: "Runtime config + cron", detail: "Set Node/Python runtime config and cron jobs from the UI, no SSH." },
    ],
    wow: "The live build log streaming as code ships, plus one-click rollback, shown end to end.",
    cta: "Start free at kloudbean.com.",
    grounding: ["managed CI/CD from Git + GitHub OAuth", "live build logs + deployment history", "Node/Python runtime config in UI", "cron jobs from the UI"],
  },
  {
    slug: "enterprise-gov-cloud-no-devops",
    title: "Enterprise and government cloud without hiring a DevOps team",
    audience: "Enterprise and government / regulated teams",
    lengthMin: "12-16",
    hook: "What if the platform acted like your in-house infra team? That's the enterprise pitch, minus the marketing.",
    segments: [
      { at: "0:00", title: "The in-house-team model", detail: "Kloudbean operating like your infra/DevOps team for enterprise workloads." },
      { at: "2:00", title: "Private networking / VPC", detail: "Isolated environments and private networking." },
      { at: "4:00", title: "Kubernetes, autoscaling, custom", detail: "Enterprise-only: k8s, autoscaling and custom architectures (not for general accounts)." },
      { at: "6:30", title: "Audit trail", detail: "Immutable, searchable, account-wide activity log with CSV export." },
      { at: "8:30", title: "Access controls", detail: "UAC per-resource permissions, IP access rules, Basic Auth gates." },
      { at: "10:30", title: "Uptime + Cloudflare edge", detail: "Tier-1 provider foundation; Cloudflare Enterprise edge caching (free for enterprise)." },
    ],
    wow: "A candid look at enterprise-only capabilities (k8s, autoscaling, audit trail) with the honest line that autoscaling is enterprise/custom, not automatic for everyone.",
    cta: "Talk to us at kloudbean.com.",
    grounding: ["enterprise k8s / autoscaling / custom (enterprise only)", "audit trail (enterprise)", "VPC / private networking", "UAC + IP access control + Basic Auth", "Cloudflare Enterprise edge (free for enterprise)", "tier-1 uptime foundation"],
  },
  {
    slug: "migrate-to-kloudbean-honest",
    title: "Moving from Cloudways, Vercel or Render: an honest walkthrough",
    audience: "SaaS founders and agencies considering a switch",
    lengthMin: "12-15",
    hook: "No trash-talk. What you keep, what changes, and what one dashboard actually buys you.",
    segments: [
      { at: "0:00", title: "Why people switch", detail: "The real reasons teams outgrow their current host." },
      { at: "2:00", title: "One fair word for each", detail: "A single honest nod to what Cloudways, Vercel and Render each do well." },
      { at: "4:00", title: "What one dashboard changes", detail: "Consolidating compute, databases, storage and load balancing in one place." },
      { at: "6:30", title: "The migration, step by step", detail: "How a move actually goes, with free migration assistance." },
      { at: "9:00", title: "Safety net: staging + backups", detail: "Stage the migrated app, keep backups, then cut over." },
      { at: "11:00", title: "Go live", detail: "Point DNS, verify SSL, watch the first deploy." },
    ],
    wow: "A genuinely fair comparison that still lands on Kloudbean for concrete reasons, plus free migration assistance shown in practice.",
    cta: "Start free at kloudbean.com — free migration assistance and a free trial.",
    grounding: ["one dashboard for the whole stack", "free migration assistance (owner-approved)", "staging + automatic backups", "free SSL"],
  },
];
