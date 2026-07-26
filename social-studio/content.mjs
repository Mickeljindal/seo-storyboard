/**
 * 100+ Kloudbean social posts, grounded in the real capability graph + the six
 * ICPs. Each post: a big card HEADLINE (goes on the image), the ready-to-paste
 * CAPTION text, hashtags, a scene (reused from ../video-studio/scenes.mjs), a
 * platform hint, and type. No invented figures — qualitative positioning only.
 *
 * `extraPosts(n)` composes additional on-brand posts from building blocks so the
 * "generate more" option can produce as many as you ask for.
 */

const P = (o) => o; // identity — keeps each entry readable

// ─────────────────────────────── Vibecoders / AI builders ───────────────────────────────
const VIBECODER = [
  P({ type: "hook", scene: "code", platform: "X", headline: "It works on localhost.\nThen what?", caption: "Your AI-built app runs perfectly on your machine. Getting it online for real is where most of them stall. Kloudbean deploys it to a managed server in one click — and you keep the code.", tags: ["VibeCoding", "AIapps", "IndieHackers", "KloudBean"] }),
  P({ type: "usecase", scene: "deploy", platform: "LinkedIn", headline: "Deploy your Lovable app,\nown the code", caption: "Built something with Lovable? Ship it to a real, managed server you control — no per-app pricing, no lock-in. Security, backups and scaling handled for you.", tags: ["Lovable", "VibeCoding", "ManagedCloud", "KloudBean"] }),
  P({ type: "usecase", scene: "ai", platform: "X", headline: "Bolt.new → live", caption: "Prompted a working app in Bolt? Give it a home. Kloudbean runs your Node + React build on managed Linux cloud — prompt to production, no DevOps.", tags: ["BoltNew", "AIapps", "Deployment", "KloudBean"] }),
  P({ type: "usecase", scene: "code", platform: "X", headline: "You wrote it in Cursor.\nWhere does it run?", caption: "Cursor writes the app. Kloudbean runs it — Node, Python, Go, PHP and more — on a managed server you actually own. Flat pricing, not per-app bills.", tags: ["Cursor", "VibeCoding", "Developers", "KloudBean"] }),
  P({ type: "pain", scene: "generic", platform: "LinkedIn", headline: "The deployment gap\nis real", caption: "AI can write a whole app now. The gap between 'works on localhost' and 'live for real users' is where they die. Close it: one managed server for app, API and database.", tags: ["AIapps", "VibeCoding", "BuildInPublic", "KloudBean"] }),
  P({ type: "tip", scene: "security", platform: "LinkedIn", headline: "Own your code.\nOwn your server.", caption: "SaaS app builders lock your code in and bill per app. On Kloudbean, the code and the server are yours. Deploy once, own it forever.", tags: ["IndieHackers", "VibeCoding", "SelfHosted", "KloudBean"] }),
  P({ type: "usecase", scene: "deploy", platform: "X", headline: "From Replit prototype\nto production", caption: "Replit is great for building. Production is a different job — real resources, backups, security. Kloudbean gives your prototype a managed home to grow into.", tags: ["Replit", "VibeCoding", "Deployment", "KloudBean"] }),
  P({ type: "myth", scene: "cost", platform: "X", headline: "\"Hosting an AI app\nis complicated\"", caption: "It isn't anymore. Connect your repo, pick a runtime, click deploy. Kloudbean provisions the managed server and puts your app online. That's it.", tags: ["AIapps", "Deployment", "DevOps", "KloudBean"] }),
  P({ type: "hook", scene: "scale", platform: "LinkedIn", headline: "Shipped with AI?\nNow actually ship it.", caption: "The build was the easy part. Put it in front of real users on a managed server that scales when they show up. Start free.", tags: ["VibeCoding", "AIapps", "Startups", "KloudBean"] }),
  P({ type: "tip", scene: "database", platform: "LinkedIn", headline: "Your app needs\na real database", caption: "localStorage won't cut it in production. Attach managed Postgres, MySQL, MongoDB or Redis to your AI-built app in a few clicks — backed up and secured.", tags: ["Database", "VibeCoding", "Postgres", "KloudBean"] }),
  P({ type: "compare", scene: "compare", platform: "X", headline: "Per-app pricing\nvs one owned server", caption: "App builders that bill per app get expensive fast. One managed Kloudbean server can run many apps at a flat price. Do the math.", tags: ["IndieHackers", "VibeCoding", "CloudHosting", "KloudBean"] }),
  P({ type: "quote", scene: "cloud", platform: "LinkedIn", headline: "Build fast.\nDeploy real.\nOwn it.", caption: "The whole vibe-coding loop, finished: build with AI, deploy to a managed server, own the code and the infra. No SaaS lock-in.", tags: ["VibeCoding", "BuildInPublic", "ManagedCloud", "KloudBean"] }),
  P({ type: "usecase", scene: "deploy", platform: "X", headline: "Deploy your v0 app\nin one click", caption: "Designed a front end in v0 and wired up a backend? Kloudbean hosts the whole thing on one managed server. One click, real URL, yours.", tags: ["v0", "AIapps", "NextJS", "KloudBean"] }),
  P({ type: "tip", scene: "network", platform: "LinkedIn", headline: "One server.\nApp + API + DB.", caption: "Stop scattering your AI app across three services. Run the frontend, API and database together on one managed Kloudbean server.", tags: ["VibeCoding", "FullStack", "Deployment", "KloudBean"] }),
  P({ type: "cta", scene: "cloud", platform: "any", headline: "Give your AI app\na real home", caption: "From localhost to live, without a DevOps team. Start free at kloudbean.com.", tags: ["VibeCoding", "AIapps", "ManagedCloud", "KloudBean"] }),
];

// ─────────────────────────────── SaaS founders / indie hackers ───────────────────────────────
const SAAS = [
  P({ type: "tip", scene: "network", platform: "LinkedIn", headline: "Self-host n8n.\nStop paying per run.", caption: "Per-execution automation pricing punishes you for scaling. Run n8n on a managed Kloudbean server instead — unlimited workflows, your data, one flat price.", tags: ["n8n", "Automation", "SelfHosted", "KloudBean"] }),
  P({ type: "tip", scene: "database", platform: "LinkedIn", headline: "Self-host Supabase,\nown your backend", caption: "Your backend shouldn't be a metered subscription. Run Supabase on your own managed server — a real Postgres you control, at a predictable price.", tags: ["Supabase", "Postgres", "SelfHosted", "KloudBean"] }),
  P({ type: "pain", scene: "cost", platform: "X", headline: "The SaaS bill\nnever stops growing", caption: "Auth, analytics, automation, database — every tool its own subscription. Consolidate the ones you can self-host onto one managed server. One bill, less sprawl.", tags: ["SaaS", "IndieHackers", "SelfHosted", "KloudBean"] }),
  P({ type: "hook", scene: "cost", platform: "X", headline: "PaaS bill shock\nis a choice", caption: "Usage-based platforms are cheap until a traffic spike. A flat-price managed server runs the same app without the month-end surprise.", tags: ["SaaS", "CloudHosting", "Startups", "KloudBean"] }),
  P({ type: "usecase", scene: "scale", platform: "LinkedIn", headline: "Your whole stack,\none server", caption: "Frontend, API, managed database, plus self-hosted tools like n8n and Supabase — all consolidated on one managed Kloudbean server you own.", tags: ["SaaS", "FullStack", "SelfHosted", "KloudBean"] }),
  P({ type: "compare", scene: "compare", platform: "X", headline: "Vercel/Railway/Render\nalternative", caption: "Love the DX, hate the metered bill? Kloudbean gives you managed servers at a flat, predictable price — run the same Node/Next app, own the box.", tags: ["Vercel", "Railway", "CloudHosting", "KloudBean"] }),
  P({ type: "tip", scene: "cost", platform: "LinkedIn", headline: "Cut the SaaS sprawl", caption: "Ten subscriptions doing what one server could. Self-host n8n, Supabase, Ghost, Plausible and more on Kloudbean — consolidate and simplify.", tags: ["SaaS", "SelfHosted", "IndieHackers", "KloudBean"] }),
  P({ type: "myth", scene: "security", platform: "LinkedIn", headline: "\"Self-hosting\nis a headache\"", caption: "Not when it's managed. Kloudbean handles security, backups and updates — you get the ownership and savings of self-hosting without babysitting a server.", tags: ["SelfHosted", "DevOps", "ManagedCloud", "KloudBean"] }),
  P({ type: "tip", scene: "database", platform: "X", headline: "Managed Postgres,\nno babysitting", caption: "Backups, tuning and security handled. Run managed MySQL, Postgres, MongoDB or Redis right next to your app for low latency.", tags: ["Postgres", "Database", "SaaS", "KloudBean"] }),
  P({ type: "quote", scene: "cloud", platform: "LinkedIn", headline: "Own your stack.\nControl your burn.", caption: "Predictable infrastructure is a growth advantage. Run your product on owned, managed servers instead of a stack of subscriptions.", tags: ["Startups", "SaaS", "IndieHackers", "KloudBean"] }),
  P({ type: "usecase", scene: "network", platform: "X", headline: "Run Ollama +\nOpen WebUI yourself", caption: "Want private AI without per-token SaaS pricing? Self-host Ollama and Open WebUI on a managed Kloudbean server. Your models, your data.", tags: ["Ollama", "AI", "SelfHosted", "KloudBean"] }),
  P({ type: "pain", scene: "generic", platform: "LinkedIn", headline: "Scattered infra\nslows you down", caption: "Frontend here, API there, database somewhere else. Bring it together on one managed server and spend your time shipping, not wiring.", tags: ["SaaS", "FullStack", "DevOps", "KloudBean"] }),
  P({ type: "tip", scene: "ghost || cloud", platform: "X", headline: "Self-host Ghost\nfor your blog", caption: "Own your content and your audience. Run Ghost on a managed Kloudbean server — fast, yours, no platform tax.", tags: ["Ghost", "SelfHosted", "Blogging", "KloudBean"] }),
  P({ type: "hook", scene: "cost", platform: "X", headline: "How much of your MRR\ngoes to SaaS?", caption: "Add it up. Then look at what you could self-host on one managed server. The gap is your runway.", tags: ["SaaS", "Startups", "IndieHackers", "KloudBean"] }),
  P({ type: "cta", scene: "cloud", platform: "any", headline: "Run the whole stack,\nflat price", caption: "App, API, managed DB and self-hosted tools — on servers you own. Start free at kloudbean.com.", tags: ["SaaS", "SelfHosted", "ManagedCloud", "KloudBean"] }),
];

// ─────────────────────────────── AI / dev agencies ───────────────────────────────
const AGENCY = [
  P({ type: "tip", scene: "scale", platform: "LinkedIn", headline: "Host every client\non one server", caption: "A dozen client apps, a dozen subscriptions? Consolidate them onto one managed Kloudbean server — any stack per client, one console, one bill.", tags: ["Agencies", "WebDev", "Hosting", "KloudBean"] }),
  P({ type: "usecase", scene: "security", platform: "LinkedIn", headline: "White-label\nmanaged hosting", caption: "Turn hosting into recurring revenue. Deliver managed cloud under your own brand, with unlimited DevOps support behind you.", tags: ["Agencies", "WhiteLabel", "Hosting", "KloudBean"] }),
  P({ type: "pain", scene: "generic", platform: "X", headline: "5 dashboards.\nOne team.", caption: "Vercel here, Netlify there, Heroku for the API. Bring client apps into one managed console and stop context-switching.", tags: ["Agencies", "WebDev", "DevOps", "KloudBean"] }),
  P({ type: "tip", scene: "network", platform: "LinkedIn", headline: "One bill.\nUnlimited DevOps.", caption: "Managing per-client infra is a tax on billable time. Kloudbean handles security, backups, updates and scaling — your team ships instead of firefighting.", tags: ["Agencies", "DevOps", "ManagedCloud", "KloudBean"] }),
  P({ type: "compare", scene: "compare", platform: "X", headline: "Per-project hosting\nvs one fleet", caption: "Separate hosting per client scatters cost and attention. One managed server (or a few) runs the whole book — WordPress, Next.js, Node, Laravel.", tags: ["Agencies", "Hosting", "WebDev", "KloudBean"] }),
  P({ type: "usecase", scene: "cloud", platform: "LinkedIn", headline: "Any stack,\nany client", caption: "One client wants WordPress, the next wants a Next.js app, another needs a Node API. Run them all, side by side, on Kloudbean.", tags: ["Agencies", "WordPress", "NextJS", "KloudBean"] }),
  P({ type: "quote", scene: "deploy", platform: "LinkedIn", headline: "Ship.\nDon't firefight.", caption: "The best agencies spend time on client work, not server maintenance. Managed cloud gives you that time back.", tags: ["Agencies", "DevOps", "Productivity", "KloudBean"] }),
  P({ type: "tip", scene: "cost", platform: "X", headline: "Hosting = margin", caption: "Reselling managed hosting under your brand is recurring revenue you already have the clients for. White-label it on Kloudbean.", tags: ["Agencies", "WhiteLabel", "Business", "KloudBean"] }),
  P({ type: "myth", scene: "security", platform: "LinkedIn", headline: "\"Managing many apps\nmeans many servers\"", caption: "Not anymore. Host dozens of client apps on one managed server, isolated and organized, from a single console.", tags: ["Agencies", "Hosting", "DevOps", "KloudBean"] }),
  P({ type: "hook", scene: "generic", platform: "X", headline: "How many hosting logins\ndoes your agency have?", caption: "If the answer made you wince, consolidate. One console, one bill, every client.", tags: ["Agencies", "WebDev", "Hosting", "KloudBean"] }),
  P({ type: "cta", scene: "cloud", platform: "any", headline: "Run your whole\nclient book, one place", caption: "White-label managed cloud with unlimited DevOps. Start free at kloudbean.com.", tags: ["Agencies", "WhiteLabel", "ManagedCloud", "KloudBean"] }),
];

// ─────────────────────────────── Freelance developers ───────────────────────────────
const FREELANCE = [
  P({ type: "hook", scene: "cost", platform: "X", headline: "Managed cloud\nfrom ~$8/mo", caption: "A raw VPS means you're on the hook for everything. Kloudbean gives freelancers a fully managed server — security and backups included — starting around $8/mo.", tags: ["Freelance", "WebDev", "Developers", "KloudBean"] }),
  P({ type: "tip", scene: "security", platform: "LinkedIn", headline: "Security, backups, CI/CD\n— handled", caption: "The boring, critical stuff done for you. Ship your client work on a managed server without running ops yourself.", tags: ["Freelance", "DevOps", "WebDev", "KloudBean"] }),
  P({ type: "usecase", scene: "network", platform: "LinkedIn", headline: "WordPress + Node\non one box", caption: "One client wants WordPress, the next a Node app. Run both — plus a managed database — on one Kloudbean server instead of juggling hosts.", tags: ["Freelance", "WordPress", "NodeJS", "KloudBean"] }),
  P({ type: "quote", scene: "cloud", platform: "X", headline: "Be a one-person shop\nwith a real backend", caption: "No DevOps team? Managed cloud acts like one. Deploy in a click, scale when needed, and actually sleep.", tags: ["Freelance", "Developers", "SideProject", "KloudBean"] }),
  P({ type: "pain", scene: "generic", platform: "X", headline: "DIY VPS\nis fiddly", caption: "Patching, firewalls, backups, uptime — that's a second job. Let it be managed so you can focus on shipping.", tags: ["Freelance", "DevOps", "WebDev", "KloudBean"] }),
  P({ type: "tip", scene: "code", platform: "LinkedIn", headline: "Push to deploy", caption: "Built-in CI/CD means your changes go live cleanly, and roll back safely if something's off. No pipeline to wire up.", tags: ["CICD", "Freelance", "Developers", "KloudBean"] }),
  P({ type: "myth", scene: "cost", platform: "X", headline: "\"Managed hosting\nis expensive\"", caption: "Not here. A fully managed server from around $8/mo — cheaper than the hours you'd spend running it yourself.", tags: ["Freelance", "CloudHosting", "Developers", "KloudBean"] }),
  P({ type: "usecase", scene: "database", platform: "LinkedIn", headline: "A database\nfor every project", caption: "Spin up managed MySQL or Postgres alongside your apps. Backed up and secured, so a client project never loses data.", tags: ["Freelance", "Database", "Postgres", "KloudBean"] }),
  P({ type: "hook", scene: "speed", platform: "X", headline: "Your time > server admin", caption: "Every hour on server maintenance is an hour not billed. Managed cloud buys that time back.", tags: ["Freelance", "Productivity", "DevOps", "KloudBean"] }),
  P({ type: "cta", scene: "cloud", platform: "any", headline: "Ship like a bigger team", caption: "Managed security, backups and CI/CD from ~$8/mo. Start free at kloudbean.com.", tags: ["Freelance", "Developers", "ManagedCloud", "KloudBean"] }),
];

// ─────────────────────────────── WordPress / marketing agencies ───────────────────────────────
const WP = [
  P({ type: "usecase", scene: "wordpress", platform: "LinkedIn", headline: "WordPress AND Next.js,\nside by side", caption: "WordPress-only hosts can't run your modern frameworks. Kloudbean hosts WordPress and Next.js, Vue or Node together — perfect for headless setups.", tags: ["WordPress", "NextJS", "Headless", "KloudBean"] }),
  P({ type: "compare", scene: "compare", platform: "X", headline: "A real WP Engine /\nKinsta alternative", caption: "Premium managed WordPress is fast — but boxed into just WordPress. Kloudbean gives you managed WP and any other stack, without visit-based overages.", tags: ["WordPress", "WPEngine", "Kinsta", "KloudBean"] }),
  P({ type: "pain", scene: "cost", platform: "LinkedIn", headline: "The campaign worked…\nthen the overage bill", caption: "Visit-based WordPress pricing punishes success. Kloudbean's managed WordPress isn't billed per visit — let traffic spike.", tags: ["WordPress", "Marketing", "Hosting", "KloudBean"] }),
  P({ type: "tip", scene: "speed", platform: "LinkedIn", headline: "Slow WordPress\nloses money", caption: "Speed is a ranking factor and a conversion factor. Kloudbean runs WP on a tuned Nginx/LiteSpeed stack with caching and a CDN.", tags: ["WordPress", "PageSpeed", "SEO", "KloudBean"] }),
  P({ type: "usecase", scene: "cdn", platform: "X", headline: "Managed WordPress,\nno visit caps", caption: "Go viral without a surprise invoice. Caching and a global CDN keep it fast under a surge; scale the server on your terms.", tags: ["WordPress", "CDN", "Hosting", "KloudBean"] }),
  P({ type: "tip", scene: "network", platform: "LinkedIn", headline: "Go headless\nwithout the host swap", caption: "Run classic WordPress as your CMS and a React/Next front end on the same managed platform. One place, any architecture.", tags: ["WordPress", "Headless", "NextJS", "KloudBean"] }),
  P({ type: "myth", scene: "wordpress", platform: "X", headline: "\"WordPress can't\nbe fast\"", caption: "It can — on the right stack. Tuned server, caching, CDN, and it stays fast because it's fully managed and monitored.", tags: ["WordPress", "PageSpeed", "WebPerf", "KloudBean"] }),
  P({ type: "quote", scene: "cloud", platform: "LinkedIn", headline: "Your CMS and your app,\none platform", caption: "Marketing teams shouldn't choose between WordPress and modern frameworks. Host both on Kloudbean.", tags: ["WordPress", "Marketing", "WebDev", "KloudBean"] }),
  P({ type: "hook", scene: "cost", platform: "X", headline: "Still paying per visit\nfor WordPress?", caption: "There's a managed WordPress home that doesn't meter your traffic. Move when your next campaign lands.", tags: ["WordPress", "Hosting", "Marketing", "KloudBean"] }),
  P({ type: "cta", scene: "wordpress", platform: "any", headline: "Managed WordPress,\nunlocked", caption: "WordPress + any stack, fast, no visit caps. Start free at kloudbean.com.", tags: ["WordPress", "ManagedCloud", "Hosting", "KloudBean"] }),
];

// ─────────────────────────────── Enterprise / government (KSA) ───────────────────────────────
const ENTERPRISE = [
  P({ type: "usecase", scene: "cdn", platform: "LinkedIn", headline: "Data residency\nin the Kingdom", caption: "For regulated orgs, where data physically lives matters. Kloudbean can run your workloads in-region on GCP Dammam — managed and isolated.", tags: ["DataResidency", "KSA", "Compliance", "KloudBean"] }),
  P({ type: "tip", scene: "code", platform: "LinkedIn", headline: "Self-host GitLab,\nkeep your source", caption: "Source code that can't live on someone else's SaaS? Run your own GitLab on a managed Kloudbean server, in-region if needed.", tags: ["GitLab", "SelfHosted", "DevOps", "KloudBean"] }),
  P({ type: "usecase", scene: "database", platform: "LinkedIn", headline: "Prod, QA, dev —\nfully managed", caption: "Real environments with managed databases, load balancers and S3 storage, scaled independently, on one auditable platform.", tags: ["Enterprise", "CloudComputing", "DevOps", "KloudBean"] }),
  P({ type: "tip", scene: "security", platform: "LinkedIn", headline: "Isolation,\nnot shared hosting", caption: "Regulated workloads need control and isolation. Kloudbean gives you managed, isolated environments built for audit-readiness.", tags: ["Compliance", "Enterprise", "Security", "KloudBean"] }),
  P({ type: "hook", scene: "cdn", platform: "LinkedIn", headline: "Where does your\ndata actually live?", caption: "For KSA and other regulated markets, that's not a detail — it's the requirement. Kloudbean offers in-region options, including GCP Dammam.", tags: ["DataResidency", "KSA", "SaudiArabia", "KloudBean"] }),
  P({ type: "quote", scene: "cloud", platform: "LinkedIn", headline: "Compliant by design,\nnot by accident", caption: "Managed databases, load balancers, S3 and self-hosted GitLab — on controlled infrastructure you can audit.", tags: ["Compliance", "Enterprise", "CloudComputing", "KloudBean"] }),
  P({ type: "usecase", scene: "scale", platform: "LinkedIn", headline: "Managed DBs,\nload balancers, S3", caption: "Everything a serious deployment needs, managed for you and available in-region — so your team runs the app, not the infrastructure.", tags: ["Enterprise", "CloudComputing", "DevOps", "KloudBean"] }),
  P({ type: "myth", scene: "security", platform: "LinkedIn", headline: "\"Compliance means\nrunning it all yourself\"", caption: "Not with managed cloud. Get isolation and data residency without building an ops team from scratch.", tags: ["Compliance", "Enterprise", "ManagedCloud", "KloudBean"] }),
  P({ type: "cta", scene: "cdn", platform: "any", headline: "In-region.\nManaged. Audit-ready.", caption: "Compliance-ready managed cloud, including GCP Dammam for KSA. Talk to us at kloudbean.com.", tags: ["DataResidency", "KSA", "Compliance", "KloudBean"] }),
];

// ─────────────────────────────── Features / general ───────────────────────────────
const GENERAL = [
  P({ type: "feature", scene: "cloud", platform: "LinkedIn", headline: "What is\nmanaged cloud hosting?", caption: "It means the hard server work — security patching, updates, backups, scaling — is done for you. You bring the app; the platform runs the Linux server underneath.", tags: ["CloudComputing", "ManagedCloud", "WebHosting", "KloudBean"] }),
  P({ type: "feature", scene: "deploy", platform: "X", headline: "One-click deploy,\nexplained", caption: "Connect your app, pick a runtime, click deploy. Kloudbean provisions the server and puts it online — then CI/CD ships every change after.", tags: ["Deployment", "DevOps", "CICD", "KloudBean"] }),
  P({ type: "feature", scene: "database", platform: "LinkedIn", headline: "Managed databases,\nno babysitting", caption: "MySQL, MariaDB, PostgreSQL, MongoDB, Redis — backed up, secured and monitored, running right next to your app.", tags: ["Database", "Postgres", "CloudComputing", "KloudBean"] }),
  P({ type: "feature", scene: "security", platform: "X", headline: "Backups that\njust work", caption: "One bad deploy shouldn't be fatal. Automatic backups plus one-click restore mean you can always roll back to a known-good point.", tags: ["Backups", "DevOps", "ManagedCloud", "KloudBean"] }),
  P({ type: "feature", scene: "code", platform: "LinkedIn", headline: "CI/CD built in", caption: "Push code, it builds and ships. Roll back safely if something's off. Shipping on autopilot, no pipeline to maintain.", tags: ["CICD", "DevOps", "Developers", "KloudBean"] }),
  P({ type: "feature", scene: "scale", platform: "X", headline: "Survive the traffic spike", caption: "Load balancing spreads the load; autoscaling handles the surge. Your app stays fast and online when it matters most.", tags: ["Autoscaling", "CloudComputing", "WebPerf", "KloudBean"] }),
  P({ type: "feature", scene: "cdn", platform: "LinkedIn", headline: "7 cloud providers,\none console", caption: "Different projects fit different clouds. Deploy across seven providers and global regions from a single managed console.", tags: ["MultiCloud", "CloudComputing", "DevOps", "KloudBean"] }),
  P({ type: "compare", scene: "network", platform: "LinkedIn", headline: "Move off Windows/IIS\nto managed Linux", caption: "Legacy Windows hosting is costly and hard to scale. Modernize onto managed Linux stacks — Nginx, Apache, LiteSpeed — with Node, PHP, Python and more.", tags: ["Linux", "Migration", "CloudComputing", "KloudBean"] }),
  P({ type: "quote", scene: "cloud", platform: "X", headline: "Build fast.\nDeploy real.\nOwn it.", caption: "The Kloudbean way: ship quickly, run it on a managed server you own, and keep your costs predictable.", tags: ["CloudComputing", "Startups", "ManagedCloud", "KloudBean"] }),
  P({ type: "tip", scene: "speed", platform: "X", headline: "Fast is a feature", caption: "Caching, a tuned stack and a global CDN mean your site loads fast everywhere — good for users and for rankings.", tags: ["WebPerf", "PageSpeed", "SEO", "KloudBean"] }),
  P({ type: "hook", scene: "cost", platform: "X", headline: "Predictable beats\ncheap-until-it-isn't", caption: "Usage-based pricing hides the real cost until the spike. Flat, managed servers keep your bill boring — on purpose.", tags: ["CloudHosting", "Startups", "Business", "KloudBean"] }),
  P({ type: "feature", scene: "network", platform: "LinkedIn", headline: "Any Linux stack,\nmanaged", caption: "Node, PHP, Python, Ruby, Go, Java. React, Next, Vue, Laravel, Django, WordPress. If it runs on Linux, Kloudbean runs it — managed.", tags: ["Linux", "Developers", "CloudComputing", "KloudBean"] }),
  P({ type: "cta", scene: "cloud", platform: "any", headline: "Managed cloud,\nso you can just build", caption: "Deploy, scale and own your apps without a DevOps team. Start free at kloudbean.com.", tags: ["ManagedCloud", "CloudComputing", "Startups", "KloudBean"] }),
];

// ─────────────────────────────── More (mixed) — pushes the curated set past 100 ───────────────────────────────
const MORE = [
  P({ icp: "vibecoder", type: "tip", scene: "network", platform: "X", headline: "Your side project\ndeserves uptime", caption: "Weekend build that people actually use? Move it off your laptop onto a managed server that stays up while you sleep.", tags: ["BuildInPublic", "IndieHackers", "VibeCoding", "KloudBean"] }),
  P({ icp: "vibecoder", type: "hook", scene: "ai", platform: "X", headline: "AI wrote it in a day.\nHost it in a click.", caption: "The build got 10x faster. Deployment should too. One click to a managed server, code stays yours.", tags: ["AIapps", "VibeCoding", "Deployment", "KloudBean"] }),
  P({ icp: "vibecoder", type: "usecase", scene: "deploy", platform: "LinkedIn", headline: "From Windsurf\nto the web", caption: "Built with Windsurf or Claude Code? Kloudbean runs your full-stack app on managed Linux cloud — one server, all yours.", tags: ["Windsurf", "AIapps", "Developers", "KloudBean"] }),
  P({ icp: "saas_founder", type: "tip", scene: "database", platform: "X", headline: "Self-host Langflow\nfor your AI flows", caption: "Prototype AI pipelines without per-run SaaS fees. Run Langflow on a managed Kloudbean server you control.", tags: ["Langflow", "AI", "SelfHosted", "KloudBean"] }),
  P({ icp: "saas_founder", type: "compare", scene: "compare", platform: "LinkedIn", headline: "Rent forever\nvs own it", caption: "Every SaaS subscription is rent. Self-hosting on a managed server is equity in your own stack. Compound accordingly.", tags: ["SaaS", "IndieHackers", "SelfHosted", "KloudBean"] }),
  P({ icp: "saas_founder", type: "hook", scene: "scale", platform: "X", headline: "Launch day\nshouldn't scare you", caption: "Scale the server for the spike, scale back after. Predictable, managed, no metered panic.", tags: ["Startups", "SaaS", "Launch", "KloudBean"] }),
  P({ icp: "ai_agency", type: "tip", scene: "code", platform: "LinkedIn", headline: "Standardize client\ndeploys", caption: "One CI/CD pattern across every client project. Onboard faster, hand off cleaner, all on one managed platform.", tags: ["Agencies", "CICD", "DevOps", "KloudBean"] }),
  P({ icp: "ai_agency", type: "quote", scene: "cloud", platform: "X", headline: "Consolidate\nto scale", caption: "Fewer moving parts is how small teams take on big client loads. One console, many apps.", tags: ["Agencies", "WebDev", "Productivity", "KloudBean"] }),
  P({ icp: "freelance_dev", type: "usecase", scene: "deploy", platform: "LinkedIn", headline: "Handoff without\nthe hosting drama", caption: "Deliver a client project on a managed server they can keep — no fragile setup that breaks the week after you leave.", tags: ["Freelance", "ClientWork", "WebDev", "KloudBean"] }),
  P({ icp: "freelance_dev", type: "tip", scene: "speed", platform: "X", headline: "Staging = fewer\n3am calls", caption: "Test on a real staging environment before you push to production. Managed and easy to spin up.", tags: ["Freelance", "DevOps", "WebDev", "KloudBean"] }),
  P({ icp: "wp_agency", type: "tip", scene: "cdn", platform: "LinkedIn", headline: "WooCommerce\nthat stays fast", caption: "A slow store is an abandoned cart. Run WooCommerce on a tuned, cached, CDN-backed managed stack.", tags: ["WooCommerce", "WordPress", "Ecommerce", "KloudBean"] }),
  P({ icp: "wp_agency", type: "hook", scene: "speed", platform: "X", headline: "Core Web Vitals\nkeeping you up?", caption: "A tuned server, caching and a CDN do most of the heavy lifting. Managed WordPress that passes.", tags: ["WordPress", "CoreWebVitals", "SEO", "KloudBean"] }),
  P({ icp: "enterprise_gov", type: "tip", scene: "security", platform: "LinkedIn", headline: "Separate every\nenvironment", caption: "Prod, QA and dev isolated and managed — the baseline for serious, auditable operations.", tags: ["Enterprise", "DevOps", "Compliance", "KloudBean"] }),
  P({ icp: "enterprise_gov", type: "hook", scene: "cdn", platform: "LinkedIn", headline: "Sovereign cloud,\nmanaged", caption: "In-region infrastructure with managed databases, load balancers and S3 — control without the operational burden.", tags: ["DataResidency", "KSA", "CloudComputing", "KloudBean"] }),
  P({ icp: "general", type: "feature", scene: "network", platform: "X", headline: "Load balancer,\nexplained", caption: "It spreads incoming traffic across your app so no single instance gets overwhelmed — keeping you online under load.", tags: ["CloudComputing", "WebPerf", "DevOps", "KloudBean"] }),
  P({ icp: "general", type: "feature", scene: "cdn", platform: "X", headline: "What a CDN\nactually does", caption: "It serves your site from a location near each visitor, so pages load fast worldwide instead of from one origin.", tags: ["CDN", "WebPerf", "PageSpeed", "KloudBean"] }),
  P({ icp: "general", type: "tip", scene: "security", platform: "LinkedIn", headline: "SSL the right way", caption: "Managed certificates that renew themselves — HTTPS everywhere without the manual dance.", tags: ["SSL", "Security", "WebDev", "KloudBean"] }),
  P({ icp: "general", type: "hook", scene: "cost", platform: "X", headline: "Your cloud bill\nshould be boring", caption: "Exciting bills are bad bills. Flat, managed pricing keeps infrastructure predictable.", tags: ["CloudHosting", "Startups", "Business", "KloudBean"] }),
  P({ icp: "general", type: "quote", scene: "deploy", platform: "LinkedIn", headline: "Less DevOps.\nMore shipping.", caption: "The point of managed cloud is simple: spend your time building the product, not running the servers.", tags: ["DevOps", "ManagedCloud", "Productivity", "KloudBean"] }),
  P({ icp: "general", type: "feature", scene: "database", platform: "X", headline: "Redis for speed,\nPostgres for truth", caption: "Cache with managed Redis, store with managed Postgres — both running next to your app, both handled.", tags: ["Redis", "Postgres", "Database", "KloudBean"] }),
];

/** ICP display names for the card badge + caption sign-off. */
export const ICP_NAMES = {
  vibecoder: "Vibecoders / AI builders",
  saas_founder: "SaaS founders",
  ai_agency: "AI / dev agencies",
  freelance_dev: "Freelance developers",
  wp_agency: "WordPress / agencies",
  enterprise_gov: "Enterprise / gov (KSA)",
  general: "Kloudbean",
};

function tag(list, icp) {
  return list.map((p) => ({ ...p, icp }));
}

/** The curated 100+ posts, in a sensible mixed order. */
export const POSTS = [
  ...tag(VIBECODER, "vibecoder"),
  ...tag(SAAS, "saas_founder"),
  ...tag(AGENCY, "ai_agency"),
  ...tag(FREELANCE, "freelance_dev"),
  ...tag(WP, "wp_agency"),
  ...tag(ENTERPRISE, "enterprise_gov"),
  ...tag(GENERAL, "general"),
  ...MORE,
];

// Fix a stray scene typo without editing every line above.
for (const p of POSTS) if (p.scene && p.scene.includes("||")) p.scene = "cloud";

/* ─────────────────────────── "Generate more" overflow ───────────────────────────
 * Composes additional on-brand posts from building blocks when you ask for more
 * than the curated set. Each is a real, coherent combination (benefit + CTA),
 * tagged to an ICP and scene — clearly on-message, never invented figures.
 */
const BLOCKS = {
  vibecoder: {
    scene: "deploy",
    lines: [
      ["Ship your AI-built app for real", "Deploy the app you built with AI to a managed server you own — one click, no DevOps."],
      ["Own the code you generated", "No per-app pricing, no lock-in. Your code, your server, your call."],
      ["Localhost is not a launch", "Give your prototype a real, managed home the moment it's ready."],
    ],
  },
  saas_founder: {
    scene: "cost",
    lines: [
      ["Trade SaaS bills for one server", "Self-host the tools you can and consolidate onto one managed server."],
      ["Predictable infra, longer runway", "Flat-price managed servers keep your burn boring."],
      ["Own your backend", "Run managed Postgres and self-hosted tools you control."],
    ],
  },
  ai_agency: {
    scene: "scale",
    lines: [
      ["One console for every client", "Host the whole client book on managed servers, one bill."],
      ["White-label the hosting", "Recurring revenue under your own brand, DevOps handled."],
    ],
  },
  freelance_dev: {
    scene: "security",
    lines: [
      ["Managed cloud for one-person shops", "Security, backups and CI/CD handled from ~$8/mo."],
      ["Your time beats server admin", "Let the ops be managed and bill the hours instead."],
    ],
  },
  wp_agency: {
    scene: "wordpress",
    lines: [
      ["WordPress plus any stack", "Run WordPress and modern frameworks on one platform."],
      ["No visit-based overages", "Let campaigns spike without a surprise invoice."],
    ],
  },
  enterprise_gov: {
    scene: "cdn",
    lines: [
      ["Keep data in-region", "In-region options including GCP Dammam for KSA."],
      ["Managed, isolated, auditable", "Compliance-ready environments without building an ops team."],
    ],
  },
  general: {
    scene: "cloud",
    lines: [
      ["Managed cloud, done right", "Deploy, scale and own your apps without a DevOps team."],
      ["Any Linux stack, managed", "Node, PHP, Python, Go and more — if it runs on Linux, we run it."],
    ],
  },
};

const BASE_TAGS = ["KloudBean", "ManagedCloud", "CloudComputing"];

export function extraPosts(n) {
  const icps = Object.keys(BLOCKS);
  const out = [];
  let i = 0;
  while (out.length < n) {
    const icp = icps[i % icps.length];
    const b = BLOCKS[icp];
    const [headline, caption] = b.lines[Math.floor(i / icps.length) % b.lines.length];
    out.push({
      icp,
      type: "cta",
      scene: b.scene,
      platform: "any",
      headline,
      caption: `${caption} Start free at kloudbean.com.`,
      tags: BASE_TAGS,
      extra: true,
    });
    i++;
    if (i > n * icps.length + 50) break; // safety
  }
  return out.slice(0, n);
}

/** Return `count` posts: the curated set first, then overflow if more requested. */
export function getPosts(count) {
  if (!count || count >= POSTS.length) {
    const base = [...POSTS];
    if (count && count > POSTS.length) base.push(...extraPosts(count - POSTS.length));
    return base;
  }
  return POSTS.slice(0, count);
}
