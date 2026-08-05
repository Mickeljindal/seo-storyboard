/**
 * AUTO-GENERATED — do not edit by hand.
 * Source: social-studio/content.mjs + video-studio/ideas.mjs
 * Regenerate: npm run gen:studio  (node scripts/gen-studio-content.mjs)
 *
 * Full in-app mirror of the local studios so the Media Studio (/studio) shows the
 * ENTIRE library: 103 social posts + 44 video scripts.
 * Grounded in Kloudbean's real capabilities + ICPs. No invented figures.
 */

export type IcpId =
  | "vibecoder"
  | "saas_founder"
  | "ai_agency"
  | "freelance_dev"
  | "wp_agency"
  | "enterprise_gov"
  | "general";

export type SceneKind =
  | "deploy" | "network" | "speed" | "database" | "security" | "cost"
  | "compare" | "cdn" | "scale" | "code" | "cloud" | "ai" | "wordpress" | "generic";

export type SocialPost = {
  id: string;
  icp: IcpId;
  scene: SceneKind;
  platform: string;
  headline: string; // \n for line breaks (goes on the card)
  caption: string; // ready-to-paste copy
  tags: string[];
};

export type VideoBeat = { dur: number; on_screen: string; narration: string; scene: SceneKind };
export type VideoScript = {
  id: string;
  icp: IcpId;
  title: string;
  hook?: string;
  cta: string;
  /** Ready-to-paste post caption (dynamic/AI items set this; static ones derive it). */
  caption?: string;
  /** Hashtags without the # symbol. */
  tags?: string[];
  beats: VideoBeat[];
};

export const ICP_NAMES: Record<IcpId, string> = {
  "vibecoder": "Vibecoders / AI builders",
  "saas_founder": "SaaS founders",
  "ai_agency": "AI / dev agencies",
  "freelance_dev": "Freelance developers",
  "wp_agency": "WordPress / agencies",
  "enterprise_gov": "Enterprise / gov (KSA)",
  "general": "Kloudbean"
};

/** Brand-approved accents only (Primary Purple lightened for on-navy contrast). */
export const ACCENT: Record<IcpId, { c: string; glow: string }> = {
  "vibecoder": {
    "c": "#7C5CFF",
    "glow": "#4F1AF3"
  },
  "saas_founder": {
    "c": "#40B75F",
    "glow": "#40B75F"
  },
  "ai_agency": {
    "c": "#7C5CFF",
    "glow": "#4F1AF3"
  },
  "freelance_dev": {
    "c": "#40B75F",
    "glow": "#40B75F"
  },
  "wp_agency": {
    "c": "#7C5CFF",
    "glow": "#4F1AF3"
  },
  "enterprise_gov": {
    "c": "#E4B32F",
    "glow": "#E4B32F"
  },
  "general": {
    "c": "#7C5CFF",
    "glow": "#4F1AF3"
  }
};

export const EYEBROW: Record<IcpId, string> = {
  "vibecoder": "For AI builders",
  "saas_founder": "For SaaS founders",
  "ai_agency": "For agencies",
  "freelance_dev": "For freelance devs",
  "wp_agency": "For WordPress teams",
  "enterprise_gov": "Enterprise · KSA",
  "general": "Managed cloud"
};

export const SOCIAL_POSTS: SocialPost[] = [
  {
    "id": "s001",
    "icp": "vibecoder",
    "scene": "code",
    "platform": "X",
    "headline": "It works on localhost.\nThen what?",
    "caption": "Your AI-built app runs perfectly on your machine. Getting it online for real is where most of them stall. Kloudbean deploys it to a managed server in one click — and you keep the code.",
    "tags": [
      "VibeCoding",
      "AIapps",
      "IndieHackers",
      "KloudBean"
    ]
  },
  {
    "id": "s002",
    "icp": "vibecoder",
    "scene": "deploy",
    "platform": "LinkedIn",
    "headline": "Deploy your Lovable app,\nown the code",
    "caption": "Built something with Lovable? Ship it to a real, managed server you control — no per-app pricing, no lock-in. Security, backups and scaling handled for you.",
    "tags": [
      "Lovable",
      "VibeCoding",
      "ManagedCloud",
      "KloudBean"
    ]
  },
  {
    "id": "s003",
    "icp": "vibecoder",
    "scene": "ai",
    "platform": "X",
    "headline": "Bolt.new → live",
    "caption": "Prompted a working app in Bolt? Give it a home. Kloudbean runs your Node + React build on managed Linux cloud — prompt to production, no DevOps.",
    "tags": [
      "BoltNew",
      "AIapps",
      "Deployment",
      "KloudBean"
    ]
  },
  {
    "id": "s004",
    "icp": "vibecoder",
    "scene": "code",
    "platform": "X",
    "headline": "You wrote it in Cursor.\nWhere does it run?",
    "caption": "Cursor writes the app. Kloudbean runs it — Node, Python, Go, PHP and more — on a managed server you actually own. Flat pricing, not per-app bills.",
    "tags": [
      "Cursor",
      "VibeCoding",
      "Developers",
      "KloudBean"
    ]
  },
  {
    "id": "s005",
    "icp": "vibecoder",
    "scene": "generic",
    "platform": "LinkedIn",
    "headline": "The deployment gap\nis real",
    "caption": "AI can write a whole app now. The gap between 'works on localhost' and 'live for real users' is where they die. Close it: one managed server for app, API and database.",
    "tags": [
      "AIapps",
      "VibeCoding",
      "BuildInPublic",
      "KloudBean"
    ]
  },
  {
    "id": "s006",
    "icp": "vibecoder",
    "scene": "security",
    "platform": "LinkedIn",
    "headline": "Own your code.\nOwn your server.",
    "caption": "SaaS app builders lock your code in and bill per app. On Kloudbean, the code and the server are yours. Deploy once, own it forever.",
    "tags": [
      "IndieHackers",
      "VibeCoding",
      "SelfHosted",
      "KloudBean"
    ]
  },
  {
    "id": "s007",
    "icp": "vibecoder",
    "scene": "deploy",
    "platform": "X",
    "headline": "From Replit prototype\nto production",
    "caption": "Replit is great for building. Production is a different job — real resources, backups, security. Kloudbean gives your prototype a managed home to grow into.",
    "tags": [
      "Replit",
      "VibeCoding",
      "Deployment",
      "KloudBean"
    ]
  },
  {
    "id": "s008",
    "icp": "vibecoder",
    "scene": "cost",
    "platform": "X",
    "headline": "\"Hosting an AI app\nis complicated\"",
    "caption": "It isn't anymore. Connect your repo, pick a runtime, click deploy. Kloudbean provisions the managed server and puts your app online. That's it.",
    "tags": [
      "AIapps",
      "Deployment",
      "DevOps",
      "KloudBean"
    ]
  },
  {
    "id": "s009",
    "icp": "vibecoder",
    "scene": "scale",
    "platform": "LinkedIn",
    "headline": "Shipped with AI?\nNow actually ship it.",
    "caption": "The build was the easy part. Put it in front of real users on a managed server that scales when they show up. Start free.",
    "tags": [
      "VibeCoding",
      "AIapps",
      "Startups",
      "KloudBean"
    ]
  },
  {
    "id": "s010",
    "icp": "vibecoder",
    "scene": "database",
    "platform": "LinkedIn",
    "headline": "Your app needs\na real database",
    "caption": "localStorage won't cut it in production. Attach managed Postgres, MySQL, MongoDB or Redis to your AI-built app in a few clicks — backed up and secured.",
    "tags": [
      "Database",
      "VibeCoding",
      "Postgres",
      "KloudBean"
    ]
  },
  {
    "id": "s011",
    "icp": "vibecoder",
    "scene": "compare",
    "platform": "X",
    "headline": "Per-app pricing\nvs one owned server",
    "caption": "App builders that bill per app get expensive fast. One managed Kloudbean server can run many apps at a flat price. Do the math.",
    "tags": [
      "IndieHackers",
      "VibeCoding",
      "CloudHosting",
      "KloudBean"
    ]
  },
  {
    "id": "s012",
    "icp": "vibecoder",
    "scene": "cloud",
    "platform": "LinkedIn",
    "headline": "Build fast.\nDeploy real.\nOwn it.",
    "caption": "The whole vibe-coding loop, finished: build with AI, deploy to a managed server, own the code and the infra. No SaaS lock-in.",
    "tags": [
      "VibeCoding",
      "BuildInPublic",
      "ManagedCloud",
      "KloudBean"
    ]
  },
  {
    "id": "s013",
    "icp": "vibecoder",
    "scene": "deploy",
    "platform": "X",
    "headline": "Deploy your v0 app\nin one click",
    "caption": "Designed a front end in v0 and wired up a backend? Kloudbean hosts the whole thing on one managed server. One click, real URL, yours.",
    "tags": [
      "v0",
      "AIapps",
      "NextJS",
      "KloudBean"
    ]
  },
  {
    "id": "s014",
    "icp": "vibecoder",
    "scene": "network",
    "platform": "LinkedIn",
    "headline": "One server.\nApp + API + DB.",
    "caption": "Stop scattering your AI app across three services. Run the frontend, API and database together on one managed Kloudbean server.",
    "tags": [
      "VibeCoding",
      "FullStack",
      "Deployment",
      "KloudBean"
    ]
  },
  {
    "id": "s015",
    "icp": "vibecoder",
    "scene": "cloud",
    "platform": "any",
    "headline": "Give your AI app\na real home",
    "caption": "From localhost to live, without a DevOps team. Start free at kloudbean.com.",
    "tags": [
      "VibeCoding",
      "AIapps",
      "ManagedCloud",
      "KloudBean"
    ]
  },
  {
    "id": "s016",
    "icp": "saas_founder",
    "scene": "network",
    "platform": "LinkedIn",
    "headline": "Self-host n8n.\nStop paying per run.",
    "caption": "Per-execution automation pricing punishes you for scaling. Run n8n on a managed Kloudbean server instead — unlimited workflows, your data, one flat price.",
    "tags": [
      "n8n",
      "Automation",
      "SelfHosted",
      "KloudBean"
    ]
  },
  {
    "id": "s017",
    "icp": "saas_founder",
    "scene": "database",
    "platform": "LinkedIn",
    "headline": "Self-host Supabase,\nown your backend",
    "caption": "Your backend shouldn't be a metered subscription. Run Supabase on your own managed server — a real Postgres you control, at a predictable price.",
    "tags": [
      "Supabase",
      "Postgres",
      "SelfHosted",
      "KloudBean"
    ]
  },
  {
    "id": "s018",
    "icp": "saas_founder",
    "scene": "cost",
    "platform": "X",
    "headline": "The SaaS bill\nnever stops growing",
    "caption": "Auth, analytics, automation, database — every tool its own subscription. Consolidate the ones you can self-host onto one managed server. One bill, less sprawl.",
    "tags": [
      "SaaS",
      "IndieHackers",
      "SelfHosted",
      "KloudBean"
    ]
  },
  {
    "id": "s019",
    "icp": "saas_founder",
    "scene": "cost",
    "platform": "X",
    "headline": "PaaS bill shock\nis a choice",
    "caption": "Usage-based platforms are cheap until a traffic spike. A flat-price managed server runs the same app without the month-end surprise.",
    "tags": [
      "SaaS",
      "CloudHosting",
      "Startups",
      "KloudBean"
    ]
  },
  {
    "id": "s020",
    "icp": "saas_founder",
    "scene": "scale",
    "platform": "LinkedIn",
    "headline": "Your whole stack,\none server",
    "caption": "Frontend, API, managed database, plus self-hosted tools like n8n and Supabase — all consolidated on one managed Kloudbean server you own.",
    "tags": [
      "SaaS",
      "FullStack",
      "SelfHosted",
      "KloudBean"
    ]
  },
  {
    "id": "s021",
    "icp": "saas_founder",
    "scene": "compare",
    "platform": "X",
    "headline": "Vercel/Railway/Render\nalternative",
    "caption": "Love the DX, hate the metered bill? Kloudbean gives you managed servers at a flat, predictable price — run the same Node/Next app, own the box.",
    "tags": [
      "Vercel",
      "Railway",
      "CloudHosting",
      "KloudBean"
    ]
  },
  {
    "id": "s022",
    "icp": "saas_founder",
    "scene": "cost",
    "platform": "LinkedIn",
    "headline": "Cut the SaaS sprawl",
    "caption": "Ten subscriptions doing what one server could. Self-host n8n, Supabase, Ghost, Plausible and more on Kloudbean — consolidate and simplify.",
    "tags": [
      "SaaS",
      "SelfHosted",
      "IndieHackers",
      "KloudBean"
    ]
  },
  {
    "id": "s023",
    "icp": "saas_founder",
    "scene": "security",
    "platform": "LinkedIn",
    "headline": "\"Self-hosting\nis a headache\"",
    "caption": "Not when it's managed. Kloudbean handles security, backups and updates — you get the ownership and savings of self-hosting without babysitting a server.",
    "tags": [
      "SelfHosted",
      "DevOps",
      "ManagedCloud",
      "KloudBean"
    ]
  },
  {
    "id": "s024",
    "icp": "saas_founder",
    "scene": "database",
    "platform": "X",
    "headline": "Managed Postgres,\nno babysitting",
    "caption": "Backups, tuning and security handled. Run managed MySQL, Postgres, MongoDB or Redis right next to your app for low latency.",
    "tags": [
      "Postgres",
      "Database",
      "SaaS",
      "KloudBean"
    ]
  },
  {
    "id": "s025",
    "icp": "saas_founder",
    "scene": "cloud",
    "platform": "LinkedIn",
    "headline": "Own your stack.\nControl your burn.",
    "caption": "Predictable infrastructure is a growth advantage. Run your product on owned, managed servers instead of a stack of subscriptions.",
    "tags": [
      "Startups",
      "SaaS",
      "IndieHackers",
      "KloudBean"
    ]
  },
  {
    "id": "s026",
    "icp": "saas_founder",
    "scene": "network",
    "platform": "X",
    "headline": "Run Ollama +\nOpen WebUI yourself",
    "caption": "Want private AI without per-token SaaS pricing? Self-host Ollama and Open WebUI on a managed Kloudbean server. Your models, your data.",
    "tags": [
      "Ollama",
      "AI",
      "SelfHosted",
      "KloudBean"
    ]
  },
  {
    "id": "s027",
    "icp": "saas_founder",
    "scene": "generic",
    "platform": "LinkedIn",
    "headline": "Scattered infra\nslows you down",
    "caption": "Frontend here, API there, database somewhere else. Bring it together on one managed server and spend your time shipping, not wiring.",
    "tags": [
      "SaaS",
      "FullStack",
      "DevOps",
      "KloudBean"
    ]
  },
  {
    "id": "s028",
    "icp": "saas_founder",
    "scene": "cloud",
    "platform": "X",
    "headline": "Self-host Ghost\nfor your blog",
    "caption": "Own your content and your audience. Run Ghost on a managed Kloudbean server — fast, yours, no platform tax.",
    "tags": [
      "Ghost",
      "SelfHosted",
      "Blogging",
      "KloudBean"
    ]
  },
  {
    "id": "s029",
    "icp": "saas_founder",
    "scene": "cost",
    "platform": "X",
    "headline": "How much of your MRR\ngoes to SaaS?",
    "caption": "Add it up. Then look at what you could self-host on one managed server. The gap is your runway.",
    "tags": [
      "SaaS",
      "Startups",
      "IndieHackers",
      "KloudBean"
    ]
  },
  {
    "id": "s030",
    "icp": "saas_founder",
    "scene": "cloud",
    "platform": "any",
    "headline": "Run the whole stack,\nflat price",
    "caption": "App, API, managed DB and self-hosted tools — on servers you own. Start free at kloudbean.com.",
    "tags": [
      "SaaS",
      "SelfHosted",
      "ManagedCloud",
      "KloudBean"
    ]
  },
  {
    "id": "s031",
    "icp": "ai_agency",
    "scene": "scale",
    "platform": "LinkedIn",
    "headline": "Host every client\non one server",
    "caption": "A dozen client apps, a dozen subscriptions? Consolidate them onto one managed Kloudbean server — any stack per client, one console, one bill.",
    "tags": [
      "Agencies",
      "WebDev",
      "Hosting",
      "KloudBean"
    ]
  },
  {
    "id": "s032",
    "icp": "ai_agency",
    "scene": "security",
    "platform": "LinkedIn",
    "headline": "White-label\nmanaged hosting",
    "caption": "Turn hosting into recurring revenue. Deliver managed cloud under your own brand, with unlimited DevOps support behind you.",
    "tags": [
      "Agencies",
      "WhiteLabel",
      "Hosting",
      "KloudBean"
    ]
  },
  {
    "id": "s033",
    "icp": "ai_agency",
    "scene": "generic",
    "platform": "X",
    "headline": "5 dashboards.\nOne team.",
    "caption": "Vercel here, Netlify there, Heroku for the API. Bring client apps into one managed console and stop context-switching.",
    "tags": [
      "Agencies",
      "WebDev",
      "DevOps",
      "KloudBean"
    ]
  },
  {
    "id": "s034",
    "icp": "ai_agency",
    "scene": "network",
    "platform": "LinkedIn",
    "headline": "One bill.\nUnlimited DevOps.",
    "caption": "Managing per-client infra is a tax on billable time. Kloudbean handles security, backups, updates and scaling — your team ships instead of firefighting.",
    "tags": [
      "Agencies",
      "DevOps",
      "ManagedCloud",
      "KloudBean"
    ]
  },
  {
    "id": "s035",
    "icp": "ai_agency",
    "scene": "compare",
    "platform": "X",
    "headline": "Per-project hosting\nvs one fleet",
    "caption": "Separate hosting per client scatters cost and attention. One managed server (or a few) runs the whole book — WordPress, Next.js, Node, Laravel.",
    "tags": [
      "Agencies",
      "Hosting",
      "WebDev",
      "KloudBean"
    ]
  },
  {
    "id": "s036",
    "icp": "ai_agency",
    "scene": "cloud",
    "platform": "LinkedIn",
    "headline": "Any stack,\nany client",
    "caption": "One client wants WordPress, the next wants a Next.js app, another needs a Node API. Run them all, side by side, on Kloudbean.",
    "tags": [
      "Agencies",
      "WordPress",
      "NextJS",
      "KloudBean"
    ]
  },
  {
    "id": "s037",
    "icp": "ai_agency",
    "scene": "deploy",
    "platform": "LinkedIn",
    "headline": "Ship.\nDon't firefight.",
    "caption": "The best agencies spend time on client work, not server maintenance. Managed cloud gives you that time back.",
    "tags": [
      "Agencies",
      "DevOps",
      "Productivity",
      "KloudBean"
    ]
  },
  {
    "id": "s038",
    "icp": "ai_agency",
    "scene": "cost",
    "platform": "X",
    "headline": "Hosting = margin",
    "caption": "Reselling managed hosting under your brand is recurring revenue you already have the clients for. White-label it on Kloudbean.",
    "tags": [
      "Agencies",
      "WhiteLabel",
      "Business",
      "KloudBean"
    ]
  },
  {
    "id": "s039",
    "icp": "ai_agency",
    "scene": "security",
    "platform": "LinkedIn",
    "headline": "\"Managing many apps\nmeans many servers\"",
    "caption": "Not anymore. Host dozens of client apps on one managed server, isolated and organized, from a single console.",
    "tags": [
      "Agencies",
      "Hosting",
      "DevOps",
      "KloudBean"
    ]
  },
  {
    "id": "s040",
    "icp": "ai_agency",
    "scene": "generic",
    "platform": "X",
    "headline": "How many hosting logins\ndoes your agency have?",
    "caption": "If the answer made you wince, consolidate. One console, one bill, every client.",
    "tags": [
      "Agencies",
      "WebDev",
      "Hosting",
      "KloudBean"
    ]
  },
  {
    "id": "s041",
    "icp": "ai_agency",
    "scene": "cloud",
    "platform": "any",
    "headline": "Run your whole\nclient book, one place",
    "caption": "White-label managed cloud with unlimited DevOps. Start free at kloudbean.com.",
    "tags": [
      "Agencies",
      "WhiteLabel",
      "ManagedCloud",
      "KloudBean"
    ]
  },
  {
    "id": "s042",
    "icp": "freelance_dev",
    "scene": "cost",
    "platform": "X",
    "headline": "Managed cloud\nfrom ~$8/mo",
    "caption": "A raw VPS means you're on the hook for everything. Kloudbean gives freelancers a fully managed server — security and backups included — starting around $8/mo.",
    "tags": [
      "Freelance",
      "WebDev",
      "Developers",
      "KloudBean"
    ]
  },
  {
    "id": "s043",
    "icp": "freelance_dev",
    "scene": "security",
    "platform": "LinkedIn",
    "headline": "Security, backups, CI/CD\n— handled",
    "caption": "The boring, critical stuff done for you. Ship your client work on a managed server without running ops yourself.",
    "tags": [
      "Freelance",
      "DevOps",
      "WebDev",
      "KloudBean"
    ]
  },
  {
    "id": "s044",
    "icp": "freelance_dev",
    "scene": "network",
    "platform": "LinkedIn",
    "headline": "WordPress + Node\non one box",
    "caption": "One client wants WordPress, the next a Node app. Run both — plus a managed database — on one Kloudbean server instead of juggling hosts.",
    "tags": [
      "Freelance",
      "WordPress",
      "NodeJS",
      "KloudBean"
    ]
  },
  {
    "id": "s045",
    "icp": "freelance_dev",
    "scene": "cloud",
    "platform": "X",
    "headline": "Be a one-person shop\nwith a real backend",
    "caption": "No DevOps team? Managed cloud acts like one. Deploy in a click, scale when needed, and actually sleep.",
    "tags": [
      "Freelance",
      "Developers",
      "SideProject",
      "KloudBean"
    ]
  },
  {
    "id": "s046",
    "icp": "freelance_dev",
    "scene": "generic",
    "platform": "X",
    "headline": "DIY VPS\nis fiddly",
    "caption": "Patching, firewalls, backups, uptime — that's a second job. Let it be managed so you can focus on shipping.",
    "tags": [
      "Freelance",
      "DevOps",
      "WebDev",
      "KloudBean"
    ]
  },
  {
    "id": "s047",
    "icp": "freelance_dev",
    "scene": "code",
    "platform": "LinkedIn",
    "headline": "Push to deploy",
    "caption": "Built-in CI/CD means your changes go live cleanly, and roll back safely if something's off. No pipeline to wire up.",
    "tags": [
      "CICD",
      "Freelance",
      "Developers",
      "KloudBean"
    ]
  },
  {
    "id": "s048",
    "icp": "freelance_dev",
    "scene": "cost",
    "platform": "X",
    "headline": "\"Managed hosting\nis expensive\"",
    "caption": "Not here. A fully managed server from around $8/mo — cheaper than the hours you'd spend running it yourself.",
    "tags": [
      "Freelance",
      "CloudHosting",
      "Developers",
      "KloudBean"
    ]
  },
  {
    "id": "s049",
    "icp": "freelance_dev",
    "scene": "database",
    "platform": "LinkedIn",
    "headline": "A database\nfor every project",
    "caption": "Spin up managed MySQL or Postgres alongside your apps. Backed up and secured, so a client project never loses data.",
    "tags": [
      "Freelance",
      "Database",
      "Postgres",
      "KloudBean"
    ]
  },
  {
    "id": "s050",
    "icp": "freelance_dev",
    "scene": "speed",
    "platform": "X",
    "headline": "Your time > server admin",
    "caption": "Every hour on server maintenance is an hour not billed. Managed cloud buys that time back.",
    "tags": [
      "Freelance",
      "Productivity",
      "DevOps",
      "KloudBean"
    ]
  },
  {
    "id": "s051",
    "icp": "freelance_dev",
    "scene": "cloud",
    "platform": "any",
    "headline": "Ship like a bigger team",
    "caption": "Managed security, backups and CI/CD from ~$8/mo. Start free at kloudbean.com.",
    "tags": [
      "Freelance",
      "Developers",
      "ManagedCloud",
      "KloudBean"
    ]
  },
  {
    "id": "s052",
    "icp": "wp_agency",
    "scene": "wordpress",
    "platform": "LinkedIn",
    "headline": "WordPress AND Next.js,\nside by side",
    "caption": "WordPress-only hosts can't run your modern frameworks. Kloudbean hosts WordPress and Next.js, Vue or Node together — perfect for headless setups.",
    "tags": [
      "WordPress",
      "NextJS",
      "Headless",
      "KloudBean"
    ]
  },
  {
    "id": "s053",
    "icp": "wp_agency",
    "scene": "compare",
    "platform": "X",
    "headline": "A real WP Engine /\nKinsta alternative",
    "caption": "Premium managed WordPress is fast — but boxed into just WordPress. Kloudbean gives you managed WP and any other stack, without visit-based overages.",
    "tags": [
      "WordPress",
      "WPEngine",
      "Kinsta",
      "KloudBean"
    ]
  },
  {
    "id": "s054",
    "icp": "wp_agency",
    "scene": "cost",
    "platform": "LinkedIn",
    "headline": "The campaign worked…\nthen the overage bill",
    "caption": "Visit-based WordPress pricing punishes success. Kloudbean's managed WordPress isn't billed per visit — let traffic spike.",
    "tags": [
      "WordPress",
      "Marketing",
      "Hosting",
      "KloudBean"
    ]
  },
  {
    "id": "s055",
    "icp": "wp_agency",
    "scene": "speed",
    "platform": "LinkedIn",
    "headline": "Slow WordPress\nloses money",
    "caption": "Speed is a ranking factor and a conversion factor. Kloudbean runs WP on a tuned Nginx/LiteSpeed stack with caching and a CDN.",
    "tags": [
      "WordPress",
      "PageSpeed",
      "SEO",
      "KloudBean"
    ]
  },
  {
    "id": "s056",
    "icp": "wp_agency",
    "scene": "cdn",
    "platform": "X",
    "headline": "Managed WordPress,\nno visit caps",
    "caption": "Go viral without a surprise invoice. Caching and a global CDN keep it fast under a surge; scale the server on your terms.",
    "tags": [
      "WordPress",
      "CDN",
      "Hosting",
      "KloudBean"
    ]
  },
  {
    "id": "s057",
    "icp": "wp_agency",
    "scene": "network",
    "platform": "LinkedIn",
    "headline": "Go headless\nwithout the host swap",
    "caption": "Run classic WordPress as your CMS and a React/Next front end on the same managed platform. One place, any architecture.",
    "tags": [
      "WordPress",
      "Headless",
      "NextJS",
      "KloudBean"
    ]
  },
  {
    "id": "s058",
    "icp": "wp_agency",
    "scene": "wordpress",
    "platform": "X",
    "headline": "\"WordPress can't\nbe fast\"",
    "caption": "It can — on the right stack. Tuned server, caching, CDN, and it stays fast because it's fully managed and monitored.",
    "tags": [
      "WordPress",
      "PageSpeed",
      "WebPerf",
      "KloudBean"
    ]
  },
  {
    "id": "s059",
    "icp": "wp_agency",
    "scene": "cloud",
    "platform": "LinkedIn",
    "headline": "Your CMS and your app,\none platform",
    "caption": "Marketing teams shouldn't choose between WordPress and modern frameworks. Host both on Kloudbean.",
    "tags": [
      "WordPress",
      "Marketing",
      "WebDev",
      "KloudBean"
    ]
  },
  {
    "id": "s060",
    "icp": "wp_agency",
    "scene": "cost",
    "platform": "X",
    "headline": "Still paying per visit\nfor WordPress?",
    "caption": "There's a managed WordPress home that doesn't meter your traffic. Move when your next campaign lands.",
    "tags": [
      "WordPress",
      "Hosting",
      "Marketing",
      "KloudBean"
    ]
  },
  {
    "id": "s061",
    "icp": "wp_agency",
    "scene": "wordpress",
    "platform": "any",
    "headline": "Managed WordPress,\nunlocked",
    "caption": "WordPress + any stack, fast, no visit caps. Start free at kloudbean.com.",
    "tags": [
      "WordPress",
      "ManagedCloud",
      "Hosting",
      "KloudBean"
    ]
  },
  {
    "id": "s062",
    "icp": "enterprise_gov",
    "scene": "cdn",
    "platform": "LinkedIn",
    "headline": "Data residency\nin the Kingdom",
    "caption": "For regulated orgs, where data physically lives matters. Kloudbean can run your workloads in-region on GCP Dammam — managed and isolated.",
    "tags": [
      "DataResidency",
      "KSA",
      "Compliance",
      "KloudBean"
    ]
  },
  {
    "id": "s063",
    "icp": "enterprise_gov",
    "scene": "code",
    "platform": "LinkedIn",
    "headline": "Self-host GitLab,\nkeep your source",
    "caption": "Source code that can't live on someone else's SaaS? Run your own GitLab on a managed Kloudbean server, in-region if needed.",
    "tags": [
      "GitLab",
      "SelfHosted",
      "DevOps",
      "KloudBean"
    ]
  },
  {
    "id": "s064",
    "icp": "enterprise_gov",
    "scene": "database",
    "platform": "LinkedIn",
    "headline": "Prod, QA, dev —\nfully managed",
    "caption": "Real environments with managed databases, load balancers and S3 storage, scaled independently, on one auditable platform.",
    "tags": [
      "Enterprise",
      "CloudComputing",
      "DevOps",
      "KloudBean"
    ]
  },
  {
    "id": "s065",
    "icp": "enterprise_gov",
    "scene": "security",
    "platform": "LinkedIn",
    "headline": "Isolation,\nnot shared hosting",
    "caption": "Regulated workloads need control and isolation. Kloudbean gives you managed, isolated environments built for audit-readiness.",
    "tags": [
      "Compliance",
      "Enterprise",
      "Security",
      "KloudBean"
    ]
  },
  {
    "id": "s066",
    "icp": "enterprise_gov",
    "scene": "cdn",
    "platform": "LinkedIn",
    "headline": "Where does your\ndata actually live?",
    "caption": "For KSA and other regulated markets, that's not a detail — it's the requirement. Kloudbean offers in-region options, including GCP Dammam.",
    "tags": [
      "DataResidency",
      "KSA",
      "SaudiArabia",
      "KloudBean"
    ]
  },
  {
    "id": "s067",
    "icp": "enterprise_gov",
    "scene": "cloud",
    "platform": "LinkedIn",
    "headline": "Compliant by design,\nnot by accident",
    "caption": "Managed databases, load balancers, S3 and self-hosted GitLab — on controlled infrastructure you can audit.",
    "tags": [
      "Compliance",
      "Enterprise",
      "CloudComputing",
      "KloudBean"
    ]
  },
  {
    "id": "s068",
    "icp": "enterprise_gov",
    "scene": "scale",
    "platform": "LinkedIn",
    "headline": "Managed DBs,\nload balancers, S3",
    "caption": "Everything a serious deployment needs, managed for you and available in-region — so your team runs the app, not the infrastructure.",
    "tags": [
      "Enterprise",
      "CloudComputing",
      "DevOps",
      "KloudBean"
    ]
  },
  {
    "id": "s069",
    "icp": "enterprise_gov",
    "scene": "security",
    "platform": "LinkedIn",
    "headline": "\"Compliance means\nrunning it all yourself\"",
    "caption": "Not with managed cloud. Get isolation and data residency without building an ops team from scratch.",
    "tags": [
      "Compliance",
      "Enterprise",
      "ManagedCloud",
      "KloudBean"
    ]
  },
  {
    "id": "s070",
    "icp": "enterprise_gov",
    "scene": "cdn",
    "platform": "any",
    "headline": "In-region.\nManaged. Audit-ready.",
    "caption": "Compliance-ready managed cloud, including GCP Dammam for KSA. Talk to us at kloudbean.com.",
    "tags": [
      "DataResidency",
      "KSA",
      "Compliance",
      "KloudBean"
    ]
  },
  {
    "id": "s071",
    "icp": "general",
    "scene": "cloud",
    "platform": "LinkedIn",
    "headline": "What is\nmanaged cloud hosting?",
    "caption": "It means the hard server work — security patching, updates, backups, scaling — is done for you. You bring the app; the platform runs the Linux server underneath.",
    "tags": [
      "CloudComputing",
      "ManagedCloud",
      "WebHosting",
      "KloudBean"
    ]
  },
  {
    "id": "s072",
    "icp": "general",
    "scene": "deploy",
    "platform": "X",
    "headline": "One-click deploy,\nexplained",
    "caption": "Connect your app, pick a runtime, click deploy. Kloudbean provisions the server and puts it online — then CI/CD ships every change after.",
    "tags": [
      "Deployment",
      "DevOps",
      "CICD",
      "KloudBean"
    ]
  },
  {
    "id": "s073",
    "icp": "general",
    "scene": "database",
    "platform": "LinkedIn",
    "headline": "Managed databases,\nno babysitting",
    "caption": "MySQL, MariaDB, PostgreSQL, MongoDB, Redis — backed up, secured and monitored, running right next to your app.",
    "tags": [
      "Database",
      "Postgres",
      "CloudComputing",
      "KloudBean"
    ]
  },
  {
    "id": "s074",
    "icp": "general",
    "scene": "security",
    "platform": "X",
    "headline": "Backups that\njust work",
    "caption": "One bad deploy shouldn't be fatal. Automatic backups plus one-click restore mean you can always roll back to a known-good point.",
    "tags": [
      "Backups",
      "DevOps",
      "ManagedCloud",
      "KloudBean"
    ]
  },
  {
    "id": "s075",
    "icp": "general",
    "scene": "code",
    "platform": "LinkedIn",
    "headline": "CI/CD built in",
    "caption": "Push code, it builds and ships. Roll back safely if something's off. Shipping on autopilot, no pipeline to maintain.",
    "tags": [
      "CICD",
      "DevOps",
      "Developers",
      "KloudBean"
    ]
  },
  {
    "id": "s076",
    "icp": "general",
    "scene": "scale",
    "platform": "X",
    "headline": "Survive the traffic spike",
    "caption": "Load balancing spreads the load; autoscaling handles the surge. Your app stays fast and online when it matters most.",
    "tags": [
      "Autoscaling",
      "CloudComputing",
      "WebPerf",
      "KloudBean"
    ]
  },
  {
    "id": "s077",
    "icp": "general",
    "scene": "cdn",
    "platform": "LinkedIn",
    "headline": "7 cloud providers,\none console",
    "caption": "Different projects fit different clouds. Deploy across seven providers and global regions from a single managed console.",
    "tags": [
      "MultiCloud",
      "CloudComputing",
      "DevOps",
      "KloudBean"
    ]
  },
  {
    "id": "s078",
    "icp": "general",
    "scene": "network",
    "platform": "LinkedIn",
    "headline": "Move off Windows/IIS\nto managed Linux",
    "caption": "Legacy Windows hosting is costly and hard to scale. Modernize onto managed Linux stacks — Nginx, Apache, LiteSpeed — with Node, PHP, Python and more.",
    "tags": [
      "Linux",
      "Migration",
      "CloudComputing",
      "KloudBean"
    ]
  },
  {
    "id": "s079",
    "icp": "general",
    "scene": "cloud",
    "platform": "X",
    "headline": "Build fast.\nDeploy real.\nOwn it.",
    "caption": "The Kloudbean way: ship quickly, run it on a managed server you own, and keep your costs predictable.",
    "tags": [
      "CloudComputing",
      "Startups",
      "ManagedCloud",
      "KloudBean"
    ]
  },
  {
    "id": "s080",
    "icp": "general",
    "scene": "speed",
    "platform": "X",
    "headline": "Fast is a feature",
    "caption": "Caching, a tuned stack and a global CDN mean your site loads fast everywhere — good for users and for rankings.",
    "tags": [
      "WebPerf",
      "PageSpeed",
      "SEO",
      "KloudBean"
    ]
  },
  {
    "id": "s081",
    "icp": "general",
    "scene": "cost",
    "platform": "X",
    "headline": "Predictable beats\ncheap-until-it-isn't",
    "caption": "Usage-based pricing hides the real cost until the spike. Flat, managed servers keep your bill boring — on purpose.",
    "tags": [
      "CloudHosting",
      "Startups",
      "Business",
      "KloudBean"
    ]
  },
  {
    "id": "s082",
    "icp": "general",
    "scene": "network",
    "platform": "LinkedIn",
    "headline": "Any Linux stack,\nmanaged",
    "caption": "Node, PHP, Python, Ruby, Go, Java. React, Next, Vue, Laravel, Django, WordPress. If it runs on Linux, Kloudbean runs it — managed.",
    "tags": [
      "Linux",
      "Developers",
      "CloudComputing",
      "KloudBean"
    ]
  },
  {
    "id": "s083",
    "icp": "general",
    "scene": "cloud",
    "platform": "any",
    "headline": "Managed cloud,\nso you can just build",
    "caption": "Deploy, scale and own your apps without a DevOps team. Start free at kloudbean.com.",
    "tags": [
      "ManagedCloud",
      "CloudComputing",
      "Startups",
      "KloudBean"
    ]
  },
  {
    "id": "s084",
    "icp": "vibecoder",
    "scene": "network",
    "platform": "X",
    "headline": "Your side project\ndeserves uptime",
    "caption": "Weekend build that people actually use? Move it off your laptop onto a managed server that stays up while you sleep.",
    "tags": [
      "BuildInPublic",
      "IndieHackers",
      "VibeCoding",
      "KloudBean"
    ]
  },
  {
    "id": "s085",
    "icp": "vibecoder",
    "scene": "ai",
    "platform": "X",
    "headline": "AI wrote it in a day.\nHost it in a click.",
    "caption": "The build got 10x faster. Deployment should too. One click to a managed server, code stays yours.",
    "tags": [
      "AIapps",
      "VibeCoding",
      "Deployment",
      "KloudBean"
    ]
  },
  {
    "id": "s086",
    "icp": "vibecoder",
    "scene": "deploy",
    "platform": "LinkedIn",
    "headline": "From Windsurf\nto the web",
    "caption": "Built with Windsurf or Claude Code? Kloudbean runs your full-stack app on managed Linux cloud — one server, all yours.",
    "tags": [
      "Windsurf",
      "AIapps",
      "Developers",
      "KloudBean"
    ]
  },
  {
    "id": "s087",
    "icp": "saas_founder",
    "scene": "database",
    "platform": "X",
    "headline": "Self-host Langflow\nfor your AI flows",
    "caption": "Prototype AI pipelines without per-run SaaS fees. Run Langflow on a managed Kloudbean server you control.",
    "tags": [
      "Langflow",
      "AI",
      "SelfHosted",
      "KloudBean"
    ]
  },
  {
    "id": "s088",
    "icp": "saas_founder",
    "scene": "compare",
    "platform": "LinkedIn",
    "headline": "Rent forever\nvs own it",
    "caption": "Every SaaS subscription is rent. Self-hosting on a managed server is equity in your own stack. Compound accordingly.",
    "tags": [
      "SaaS",
      "IndieHackers",
      "SelfHosted",
      "KloudBean"
    ]
  },
  {
    "id": "s089",
    "icp": "saas_founder",
    "scene": "scale",
    "platform": "X",
    "headline": "Launch day\nshouldn't scare you",
    "caption": "Scale the server for the spike, scale back after. Predictable, managed, no metered panic.",
    "tags": [
      "Startups",
      "SaaS",
      "Launch",
      "KloudBean"
    ]
  },
  {
    "id": "s090",
    "icp": "ai_agency",
    "scene": "code",
    "platform": "LinkedIn",
    "headline": "Standardize client\ndeploys",
    "caption": "One CI/CD pattern across every client project. Onboard faster, hand off cleaner, all on one managed platform.",
    "tags": [
      "Agencies",
      "CICD",
      "DevOps",
      "KloudBean"
    ]
  },
  {
    "id": "s091",
    "icp": "ai_agency",
    "scene": "cloud",
    "platform": "X",
    "headline": "Consolidate\nto scale",
    "caption": "Fewer moving parts is how small teams take on big client loads. One console, many apps.",
    "tags": [
      "Agencies",
      "WebDev",
      "Productivity",
      "KloudBean"
    ]
  },
  {
    "id": "s092",
    "icp": "freelance_dev",
    "scene": "deploy",
    "platform": "LinkedIn",
    "headline": "Handoff without\nthe hosting drama",
    "caption": "Deliver a client project on a managed server they can keep — no fragile setup that breaks the week after you leave.",
    "tags": [
      "Freelance",
      "ClientWork",
      "WebDev",
      "KloudBean"
    ]
  },
  {
    "id": "s093",
    "icp": "freelance_dev",
    "scene": "speed",
    "platform": "X",
    "headline": "Staging = fewer\n3am calls",
    "caption": "Test on a real staging environment before you push to production. Managed and easy to spin up.",
    "tags": [
      "Freelance",
      "DevOps",
      "WebDev",
      "KloudBean"
    ]
  },
  {
    "id": "s094",
    "icp": "wp_agency",
    "scene": "cdn",
    "platform": "LinkedIn",
    "headline": "WooCommerce\nthat stays fast",
    "caption": "A slow store is an abandoned cart. Run WooCommerce on a tuned, cached, CDN-backed managed stack.",
    "tags": [
      "WooCommerce",
      "WordPress",
      "Ecommerce",
      "KloudBean"
    ]
  },
  {
    "id": "s095",
    "icp": "wp_agency",
    "scene": "speed",
    "platform": "X",
    "headline": "Core Web Vitals\nkeeping you up?",
    "caption": "A tuned server, caching and a CDN do most of the heavy lifting. Managed WordPress that passes.",
    "tags": [
      "WordPress",
      "CoreWebVitals",
      "SEO",
      "KloudBean"
    ]
  },
  {
    "id": "s096",
    "icp": "enterprise_gov",
    "scene": "security",
    "platform": "LinkedIn",
    "headline": "Separate every\nenvironment",
    "caption": "Prod, QA and dev isolated and managed — the baseline for serious, auditable operations.",
    "tags": [
      "Enterprise",
      "DevOps",
      "Compliance",
      "KloudBean"
    ]
  },
  {
    "id": "s097",
    "icp": "enterprise_gov",
    "scene": "cdn",
    "platform": "LinkedIn",
    "headline": "Sovereign cloud,\nmanaged",
    "caption": "In-region infrastructure with managed databases, load balancers and S3 — control without the operational burden.",
    "tags": [
      "DataResidency",
      "KSA",
      "CloudComputing",
      "KloudBean"
    ]
  },
  {
    "id": "s098",
    "icp": "general",
    "scene": "network",
    "platform": "X",
    "headline": "Load balancer,\nexplained",
    "caption": "It spreads incoming traffic across your app so no single instance gets overwhelmed — keeping you online under load.",
    "tags": [
      "CloudComputing",
      "WebPerf",
      "DevOps",
      "KloudBean"
    ]
  },
  {
    "id": "s099",
    "icp": "general",
    "scene": "cdn",
    "platform": "X",
    "headline": "What a CDN\nactually does",
    "caption": "It serves your site from a location near each visitor, so pages load fast worldwide instead of from one origin.",
    "tags": [
      "CDN",
      "WebPerf",
      "PageSpeed",
      "KloudBean"
    ]
  },
  {
    "id": "s100",
    "icp": "general",
    "scene": "security",
    "platform": "LinkedIn",
    "headline": "SSL the right way",
    "caption": "Managed certificates that renew themselves — HTTPS everywhere without the manual dance.",
    "tags": [
      "SSL",
      "Security",
      "WebDev",
      "KloudBean"
    ]
  },
  {
    "id": "s101",
    "icp": "general",
    "scene": "cost",
    "platform": "X",
    "headline": "Your cloud bill\nshould be boring",
    "caption": "Exciting bills are bad bills. Flat, managed pricing keeps infrastructure predictable.",
    "tags": [
      "CloudHosting",
      "Startups",
      "Business",
      "KloudBean"
    ]
  },
  {
    "id": "s102",
    "icp": "general",
    "scene": "deploy",
    "platform": "LinkedIn",
    "headline": "Less DevOps.\nMore shipping.",
    "caption": "The point of managed cloud is simple: spend your time building the product, not running the servers.",
    "tags": [
      "DevOps",
      "ManagedCloud",
      "Productivity",
      "KloudBean"
    ]
  },
  {
    "id": "s103",
    "icp": "general",
    "scene": "database",
    "platform": "X",
    "headline": "Redis for speed,\nPostgres for truth",
    "caption": "Cache with managed Redis, store with managed Postgres — both running next to your app, both handled.",
    "tags": [
      "Redis",
      "Postgres",
      "Database",
      "KloudBean"
    ]
  }
];

export const VIDEO_SCRIPTS: VideoScript[] = [
  {
    "id": "v01",
    "icp": "vibecoder",
    "title": "Your Lovable app deserves a real home",
    "hook": "It works on localhost… then what?",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "It works on localhost.",
        "narration": "You built a full app with Lovable. It runs perfectly on your machine.",
        "scene": "code"
      },
      {
        "dur": 4,
        "on_screen": "Then it goes nowhere.",
        "narration": "But getting it online for real is where most AI-built apps stall.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Deploy it in one click",
        "narration": "Kloudbean deploys your Lovable app to a real, managed server in a click.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "You own the code",
        "narration": "No per-app pricing, no lock-in. It's your code on a server you control.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Managed. Scalable.",
        "narration": "Security, backups and scaling are handled for you, so you just build.",
        "scene": "scale"
      },
      {
        "dur": 4,
        "on_screen": "Ship it for real",
        "narration": "Take your Lovable app from localhost to live. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v02",
    "icp": "vibecoder",
    "title": "From Bolt.new to live",
    "hook": "Prompt to production, without the DevOps.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Prompted an app in Bolt?",
        "narration": "You prompted a working app in Bolt dot new. Now it needs a home.",
        "scene": "ai"
      },
      {
        "dur": 5,
        "on_screen": "One click to a real server",
        "narration": "Kloudbean runs your Node and React build on managed Linux cloud.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "Add a database",
        "narration": "Attach managed Postgres, MySQL, MongoDB or Redis in a few clicks.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "No DevOps required",
        "narration": "No servers to patch, no pipelines to wire. It's all managed.",
        "scene": "security"
      },
      {
        "dur": 4,
        "on_screen": "Bolt → live",
        "narration": "Go from prompt to production. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v03",
    "icp": "vibecoder",
    "title": "Deploy your Cursor-built app",
    "hook": "You wrote it in Cursor. Where does it run?",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Built it in Cursor",
        "narration": "You shipped a full-stack app in Cursor. It's ready for the world.",
        "scene": "code"
      },
      {
        "dur": 5,
        "on_screen": "Deploy to owned cloud",
        "narration": "Push it to a managed Kloudbean server that you actually own.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "Node, Python, Go…",
        "narration": "It runs modern runtimes — Node, Python, Ruby, Go, Java and PHP.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Predictable pricing",
        "narration": "A flat, predictable price instead of per-app platform bills.",
        "scene": "cost"
      },
      {
        "dur": 4,
        "on_screen": "Own your stack",
        "narration": "Own your app and your infra. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v04",
    "icp": "vibecoder",
    "title": "From Replit prototype to production",
    "hook": "Prototype in Replit. Run it seriously on Kloudbean.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Prototyped in Replit?",
        "narration": "Replit is great for building. Production is a different job.",
        "scene": "code"
      },
      {
        "dur": 5,
        "on_screen": "Move to managed cloud",
        "narration": "Kloudbean gives your app a managed Linux server with real resources.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "Backups + security built in",
        "narration": "Automatic backups and hardened security come standard.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Scale when it grows",
        "narration": "Add resources or scale out when your traffic climbs.",
        "scene": "scale"
      },
      {
        "dur": 4,
        "on_screen": "Prototype → product",
        "narration": "Turn the prototype into a product. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v05",
    "icp": "vibecoder",
    "title": "Built it with AI? Now actually ship it.",
    "hook": "The deployment gap is where AI apps die.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "AI wrote the app.",
        "narration": "Lovable, Bolt, Cursor, v0 — AI can write a whole app now.",
        "scene": "ai"
      },
      {
        "dur": 4,
        "on_screen": "Shipping is the hard part.",
        "narration": "The gap between localhost and live is where most of them die.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "One managed server",
        "narration": "Kloudbean runs it on one managed server — app, API and database together.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "You own everything",
        "narration": "Your code, your data, your server. No per-seat, per-app tax.",
        "scene": "security"
      },
      {
        "dur": 4,
        "on_screen": "Actually ship it",
        "narration": "Close the deployment gap. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v06",
    "icp": "saas_founder",
    "title": "Self-host n8n and own your automations",
    "hook": "Stop renting your automation runs.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Automation SaaS adds up",
        "narration": "Per-run automation pricing gets expensive fast as you scale.",
        "scene": "cost"
      },
      {
        "dur": 5,
        "on_screen": "Self-host n8n",
        "narration": "Run n8n yourself on a managed Kloudbean server instead.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Unlimited workflows",
        "narration": "Your workflows, your data, no per-execution meter running.",
        "scene": "scale"
      },
      {
        "dur": 5,
        "on_screen": "Managed + backed up",
        "narration": "It's still fully managed — security and backups handled for you.",
        "scene": "security"
      },
      {
        "dur": 4,
        "on_screen": "Own your automations",
        "narration": "Take back your automations. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v07",
    "icp": "saas_founder",
    "title": "Self-host Supabase, own your backend",
    "hook": "Your backend shouldn't be a subscription.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Backend-as-a-service bills",
        "narration": "Managed backend platforms bill by usage — and it stacks up.",
        "scene": "cost"
      },
      {
        "dur": 5,
        "on_screen": "Self-host Supabase",
        "narration": "Run Supabase on your own managed server on Kloudbean.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "Postgres you control",
        "narration": "A real Postgres database you own, with room to grow.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "Flat, predictable price",
        "narration": "One flat price instead of surprise usage overages.",
        "scene": "cost"
      },
      {
        "dur": 4,
        "on_screen": "Own your backend",
        "narration": "Own the whole backend. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v08",
    "icp": "saas_founder",
    "title": "Kill the SaaS sprawl",
    "hook": "Ten subscriptions, one server.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Subscriptions everywhere",
        "narration": "Auth, analytics, automation, database — every tool its own bill.",
        "scene": "cost"
      },
      {
        "dur": 5,
        "on_screen": "Consolidate on one server",
        "narration": "Self-host the tools you need on one managed Kloudbean server.",
        "scene": "scale"
      },
      {
        "dur": 5,
        "on_screen": "n8n, Supabase, Ghost, more",
        "narration": "Run n8n, Supabase, Ghost, Plausible and more, side by side.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "One bill, no sprawl",
        "narration": "One predictable bill replaces a stack of subscriptions.",
        "scene": "cost"
      },
      {
        "dur": 4,
        "on_screen": "Cut the sprawl",
        "narration": "Consolidate and simplify. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v09",
    "icp": "saas_founder",
    "title": "Your whole stack on one server",
    "hook": "Frontend, API, database — together.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Scattered infrastructure",
        "narration": "Frontend here, API there, database somewhere else. It's a lot.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "One managed server",
        "narration": "Kloudbean runs your frontend, API and database on one server.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "Managed databases",
        "narration": "Choose managed MySQL, Postgres, MongoDB or Redis.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "Plus self-hosted tools",
        "narration": "Add self-hosted tools like n8n and Supabase alongside it.",
        "scene": "network"
      },
      {
        "dur": 4,
        "on_screen": "Whole stack, one place",
        "narration": "Your entire stack, consolidated. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v10",
    "icp": "saas_founder",
    "title": "Escape PaaS bill shock",
    "hook": "A flat price beats a usage surprise.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "The bill spiked again",
        "narration": "Usage-based platforms are cheap until a traffic spike hits.",
        "scene": "cost"
      },
      {
        "dur": 5,
        "on_screen": "Flat, owned servers",
        "narration": "Kloudbean gives you managed servers at a flat, predictable price.",
        "scene": "compare"
      },
      {
        "dur": 5,
        "on_screen": "Same app, less surprise",
        "narration": "Run the same React, Next or Node app — without the bill shock.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "Scale on your terms",
        "narration": "You decide when to add resources, not a metered dashboard.",
        "scene": "scale"
      },
      {
        "dur": 4,
        "on_screen": "Predictable by design",
        "narration": "Predictable hosting, on purpose. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v11",
    "icp": "ai_agency",
    "title": "Host every client on one server",
    "hook": "Stop paying per project.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "A dozen client projects",
        "narration": "Every client app on its own platform subscription adds up fast.",
        "scene": "cost"
      },
      {
        "dur": 5,
        "on_screen": "Consolidate the fleet",
        "narration": "Host many client apps and sites on one managed Kloudbean server.",
        "scene": "scale"
      },
      {
        "dur": 5,
        "on_screen": "Any stack, any client",
        "narration": "WordPress, Next.js, Node, Laravel — mix stacks per client freely.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "One bill to manage",
        "narration": "One bill and one console instead of a dozen dashboards.",
        "scene": "cloud"
      },
      {
        "dur": 4,
        "on_screen": "Run the whole book",
        "narration": "Host your whole client book in one place. kloudbean.com.",
        "scene": "deploy"
      }
    ]
  },
  {
    "id": "v12",
    "icp": "ai_agency",
    "title": "White-label hosting for your agency",
    "hook": "Your brand, our managed infra.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Hosting is your margin",
        "narration": "Reselling hosting can be recurring revenue for your agency.",
        "scene": "cost"
      },
      {
        "dur": 5,
        "on_screen": "White-label it",
        "narration": "Deliver managed cloud under your own brand on Kloudbean.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Unlimited DevOps support",
        "narration": "Lean on unlimited DevOps help so your team ships, not firefights.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Clients stay yours",
        "narration": "You own the relationship; we run the infrastructure.",
        "scene": "cloud"
      },
      {
        "dur": 4,
        "on_screen": "Managed, branded",
        "narration": "White-label managed hosting. Start free at kloudbean.com.",
        "scene": "deploy"
      }
    ]
  },
  {
    "id": "v13",
    "icp": "ai_agency",
    "title": "One bill. Unlimited DevOps.",
    "hook": "Trade infra headaches for shipping.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "DevOps is a tax",
        "narration": "Managing per-client servers is a tax on your billable time.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Fully managed",
        "narration": "Kloudbean handles security, backups, updates and scaling.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Unlimited support",
        "narration": "Unlimited DevOps support means help when a client needs it.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "One predictable bill",
        "narration": "And it's one predictable bill across all your projects.",
        "scene": "cost"
      },
      {
        "dur": 4,
        "on_screen": "Ship, don't firefight",
        "narration": "Spend time shipping. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v14",
    "icp": "ai_agency",
    "title": "Stop juggling Vercel, Netlify, Heroku",
    "hook": "One console beats five dashboards.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Five dashboards, one team",
        "narration": "Vercel here, Netlify there, Heroku for the API — it's scattered.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "One managed console",
        "narration": "Kloudbean brings your apps into one managed console.",
        "scene": "compare"
      },
      {
        "dur": 5,
        "on_screen": "Frontends + APIs + DBs",
        "narration": "Frontends, APIs and databases, all in one place.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Predictable pricing",
        "narration": "And a flat price instead of five metered bills.",
        "scene": "cost"
      },
      {
        "dur": 4,
        "on_screen": "Consolidate it all",
        "narration": "One place for everything. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v15",
    "icp": "freelance_dev",
    "title": "A managed server from ~$8/mo",
    "hook": "Managed cloud, freelancer-friendly.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "DIY VPS is fiddly",
        "narration": "A raw VPS means you're on the hook for everything that breaks.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Managed from ~$8/mo",
        "narration": "Kloudbean gives you a fully managed server starting around eight dollars a month.",
        "scene": "cost"
      },
      {
        "dur": 5,
        "on_screen": "Security + backups included",
        "narration": "Security hardening and automatic backups are included.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Host client work",
        "narration": "Run your own projects and client sites on the same box.",
        "scene": "scale"
      },
      {
        "dur": 4,
        "on_screen": "Managed, affordable",
        "narration": "Managed cloud that fits a freelancer. kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v16",
    "icp": "freelance_dev",
    "title": "Security, backups, CI/CD — handled",
    "hook": "The boring, critical stuff, done for you.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "No time for ops",
        "narration": "Freelancers rarely have time to run security and backups properly.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Hardened by default",
        "narration": "Kloudbean hardens the server and keeps it patched.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Automatic backups",
        "narration": "Automatic backups mean a bad deploy is never fatal.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "CI/CD built in",
        "narration": "Built-in CI/CD pushes your changes live cleanly.",
        "scene": "code"
      },
      {
        "dur": 4,
        "on_screen": "You just build",
        "narration": "The critical stuff is handled. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v17",
    "icp": "freelance_dev",
    "title": "WordPress + Node on one box",
    "hook": "Mixed stacks, one managed server.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Clients use everything",
        "narration": "One client wants WordPress, the next wants a Node app.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Run them together",
        "narration": "Kloudbean runs WordPress, Node and frontends on one server.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Managed databases too",
        "narration": "Attach managed MySQL or Postgres for whatever they need.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "One place to manage",
        "narration": "No separate hosts to juggle — it's all in one console.",
        "scene": "cloud"
      },
      {
        "dur": 4,
        "on_screen": "Any stack, one box",
        "narration": "Host any stack together. Start free at kloudbean.com.",
        "scene": "deploy"
      }
    ]
  },
  {
    "id": "v18",
    "icp": "freelance_dev",
    "title": "No DevOps team? No problem.",
    "hook": "Be a one-person shop with a real backend.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Solo, but shipping",
        "narration": "You're a one-person shop shipping real apps for real clients.",
        "scene": "code"
      },
      {
        "dur": 5,
        "on_screen": "Managed cloud has your back",
        "narration": "Kloudbean is the managed cloud that acts like your ops team.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Deploy, scale, sleep",
        "narration": "Deploy in a click, scale when needed, and actually sleep.",
        "scene": "scale"
      },
      {
        "dur": 5,
        "on_screen": "Support when you need it",
        "narration": "And there's real support when something looks off.",
        "scene": "network"
      },
      {
        "dur": 4,
        "on_screen": "Ops, handled",
        "narration": "Ship like a bigger team. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v19",
    "icp": "wp_agency",
    "title": "WordPress AND Next.js, side by side",
    "hook": "Your CMS and your app framework, together.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "WP-only hosts limit you",
        "narration": "WordPress-only hosts can't run your Next.js or Node projects.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Run both, one platform",
        "narration": "Kloudbean hosts WordPress and modern frameworks together.",
        "scene": "wordpress"
      },
      {
        "dur": 5,
        "on_screen": "Headless-ready",
        "narration": "Perfect for headless WordPress with a React or Next front end.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Managed + fast",
        "narration": "Fully managed, with caching and a global CDN for speed.",
        "scene": "speed"
      },
      {
        "dur": 4,
        "on_screen": "CMS + app, unified",
        "narration": "One platform for both. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v20",
    "icp": "wp_agency",
    "title": "A real WP Engine / Kinsta alternative",
    "hook": "Managed WordPress without the handcuffs.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Managed WP, but boxed in",
        "narration": "Premium managed WordPress is fast, but locked to just WordPress.",
        "scene": "compare"
      },
      {
        "dur": 5,
        "on_screen": "Managed WP + any stack",
        "narration": "Kloudbean gives you managed WordPress and any other stack too.",
        "scene": "wordpress"
      },
      {
        "dur": 5,
        "on_screen": "No visit-based overages",
        "narration": "No nervous month-end when a campaign spikes your traffic.",
        "scene": "cost"
      },
      {
        "dur": 5,
        "on_screen": "Global speed",
        "narration": "Backed by caching and a CDN so pages load fast everywhere.",
        "scene": "cdn"
      },
      {
        "dur": 4,
        "on_screen": "Managed WP, unlocked",
        "narration": "A managed WordPress home without limits. kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v21",
    "icp": "wp_agency",
    "title": "Managed WordPress without visit caps",
    "hook": "Go viral without a surprise invoice.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "The campaign worked…",
        "narration": "Your campaign took off — and so did the visit-based overage fees.",
        "scene": "cost"
      },
      {
        "dur": 5,
        "on_screen": "No per-visit meter",
        "narration": "Kloudbean's managed WordPress isn't billed per visit.",
        "scene": "compare"
      },
      {
        "dur": 5,
        "on_screen": "Cached + CDN-backed",
        "narration": "Caching and a CDN keep it fast under a traffic surge.",
        "scene": "cdn"
      },
      {
        "dur": 5,
        "on_screen": "Scale the server",
        "narration": "Need more? Scale the server — on your terms.",
        "scene": "scale"
      },
      {
        "dur": 4,
        "on_screen": "Grow without fear",
        "narration": "Let traffic spike. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v22",
    "icp": "wp_agency",
    "title": "Faster managed WordPress hosting",
    "hook": "Speed is a ranking factor. And a conversion one.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Slow WP loses money",
        "narration": "A slow WordPress site costs you rankings and conversions.",
        "scene": "speed"
      },
      {
        "dur": 5,
        "on_screen": "Tuned Linux stack",
        "narration": "Kloudbean runs WordPress on a tuned Nginx or LiteSpeed stack.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Caching + CDN",
        "narration": "Server caching plus a global CDN cut your load times.",
        "scene": "cdn"
      },
      {
        "dur": 5,
        "on_screen": "Managed, always",
        "narration": "And it stays fast because it's fully managed and monitored.",
        "scene": "security"
      },
      {
        "dur": 4,
        "on_screen": "Fast by default",
        "narration": "Make WordPress fast. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v23",
    "icp": "enterprise_gov",
    "title": "Data residency in the Kingdom",
    "hook": "Keep the data in-region. Dammam.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Where does data live?",
        "narration": "For regulated orgs, where your data physically lives matters.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "In-Kingdom on GCP Dammam",
        "narration": "Kloudbean can run your workloads in-region on GCP Dammam.",
        "scene": "cdn"
      },
      {
        "dur": 5,
        "on_screen": "Managed + isolated",
        "narration": "Managed, isolated environments — not a generic shared host.",
        "scene": "cloud"
      },
      {
        "dur": 5,
        "on_screen": "Audit-ready infra",
        "narration": "Built for compliance and audit-ready operations.",
        "scene": "security"
      },
      {
        "dur": 4,
        "on_screen": "In-region, managed",
        "narration": "Data residency, handled. Talk to us at kloudbean.com.",
        "scene": "deploy"
      }
    ]
  },
  {
    "id": "v24",
    "icp": "enterprise_gov",
    "title": "Self-host GitLab on managed cloud",
    "hook": "Own your source, in your region.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Source code is sensitive",
        "narration": "For many teams, source code can't live on someone else's SaaS.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Self-host GitLab",
        "narration": "Run your own GitLab on a managed Kloudbean server.",
        "scene": "code"
      },
      {
        "dur": 5,
        "on_screen": "In-region if needed",
        "narration": "Keep it in-region for data residency requirements.",
        "scene": "cdn"
      },
      {
        "dur": 5,
        "on_screen": "Managed + backed up",
        "narration": "Still fully managed, with backups and security handled.",
        "scene": "database"
      },
      {
        "dur": 4,
        "on_screen": "Own your pipeline",
        "narration": "Own your source and CI. Talk to us at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v25",
    "icp": "enterprise_gov",
    "title": "Prod, QA and dev — fully managed",
    "hook": "Real environments, managed DBs, load balancers, S3.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "You need real environments",
        "narration": "Serious apps need separate production, QA and dev environments.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Managed everything",
        "narration": "Kloudbean runs them with managed databases and load balancers.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "S3 storage + scaling",
        "narration": "Add object storage and scale each environment independently.",
        "scene": "scale"
      },
      {
        "dur": 5,
        "on_screen": "One controlled platform",
        "narration": "All on one controlled, managed platform you can audit.",
        "scene": "security"
      },
      {
        "dur": 4,
        "on_screen": "Enterprise-ready",
        "narration": "Environments done right. Talk to us at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v26",
    "icp": "enterprise_gov",
    "title": "Compliance-ready managed cloud",
    "hook": "Control and isolation, not a generic host.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Generic hosting won't cut it",
        "narration": "Regulated workloads need isolation and control, not shared hosting.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Isolated environments",
        "narration": "Kloudbean gives you isolated, managed environments.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Data residency options",
        "narration": "With in-region options for data residency, including the Kingdom.",
        "scene": "cdn"
      },
      {
        "dur": 5,
        "on_screen": "Managed DBs + GitLab",
        "narration": "Managed databases, load balancers and self-hosted GitLab included.",
        "scene": "database"
      },
      {
        "dur": 4,
        "on_screen": "Built for compliance",
        "narration": "Compliance-ready by design. Talk to us at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v27",
    "icp": "general",
    "title": "What is managed cloud hosting?",
    "hook": "The server, run for you.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "What is managed cloud?",
        "narration": "Managed cloud hosting means the hard server work is done for you.",
        "scene": "cloud"
      },
      {
        "dur": 5,
        "on_screen": "You bring the app",
        "narration": "You bring the app; the platform runs the Linux server underneath.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "Security, updates, backups",
        "narration": "Security patching, updates and backups are handled automatically.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Scale without rebuilds",
        "narration": "And you can scale up without re-architecting everything.",
        "scene": "scale"
      },
      {
        "dur": 4,
        "on_screen": "Managed, so you build",
        "narration": "That's Kloudbean. Start free at kloudbean.com.",
        "scene": "network"
      }
    ]
  },
  {
    "id": "v28",
    "icp": "general",
    "title": "One-click deploy, explained",
    "hook": "From repo to running, fast.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Deploying used to hurt",
        "narration": "Deploying an app used to mean configuring a server by hand.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Connect your app",
        "narration": "On Kloudbean you connect your app and pick a runtime.",
        "scene": "code"
      },
      {
        "dur": 5,
        "on_screen": "One click to live",
        "narration": "One click provisions the server and puts your app online.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "CI/CD keeps it fresh",
        "narration": "Built-in CI/CD ships every future change cleanly.",
        "scene": "network"
      },
      {
        "dur": 4,
        "on_screen": "Repo → running",
        "narration": "That's one-click deploy. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v29",
    "icp": "general",
    "title": "Managed databases, without the babysitting",
    "hook": "MySQL, Postgres, Mongo, Redis — handled.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Databases need care",
        "narration": "Databases need backups, tuning and security — or they bite you.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "Pick your engine",
        "narration": "Kloudbean offers managed MySQL, MariaDB, Postgres, MongoDB and Redis.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "Backed up + secured",
        "narration": "They're backed up, secured and monitored for you.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Right next to your app",
        "narration": "And they run right beside your app for low latency.",
        "scene": "speed"
      },
      {
        "dur": 4,
        "on_screen": "Databases, handled",
        "narration": "Managed data, done right. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v30",
    "icp": "general",
    "title": "Automatic backups that just work",
    "hook": "A bad deploy shouldn't be fatal.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "One bad deploy…",
        "narration": "One bad deploy or a wrong query can wipe out hours of work.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Automatic backups",
        "narration": "Kloudbean takes automatic backups of your sites and data.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "Restore in a click",
        "narration": "Roll back to a known-good point in a click.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Set and forget",
        "narration": "No scripts to maintain — it just runs in the background.",
        "scene": "cloud"
      },
      {
        "dur": 4,
        "on_screen": "Sleep easy",
        "narration": "Backups you never think about. Start free at kloudbean.com.",
        "scene": "network"
      }
    ]
  },
  {
    "id": "v31",
    "icp": "general",
    "title": "CI/CD built in",
    "hook": "Push code. It ships.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Manual deploys break",
        "narration": "Manual deploys are slow and easy to get wrong.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Pipeline included",
        "narration": "Kloudbean includes a CI/CD pipeline out of the box.",
        "scene": "code"
      },
      {
        "dur": 5,
        "on_screen": "Push to deploy",
        "narration": "Push your code and it builds and ships automatically.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "Roll back safely",
        "narration": "If something's off, roll back safely in moments.",
        "scene": "security"
      },
      {
        "dur": 4,
        "on_screen": "Ship on autopilot",
        "narration": "Shipping on autopilot. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v32",
    "icp": "general",
    "title": "Survive traffic spikes",
    "hook": "Autoscaling + load balancing, managed.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Traffic just spiked",
        "narration": "A launch or a viral post can flood your app in minutes.",
        "scene": "scale"
      },
      {
        "dur": 5,
        "on_screen": "Load balancing",
        "narration": "Kloudbean spreads traffic across your app with load balancing.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Scale out fast",
        "narration": "Scale out to handle the surge, then scale back down.",
        "scene": "scale"
      },
      {
        "dur": 5,
        "on_screen": "Stay online",
        "narration": "Your app stays fast and online when it matters most.",
        "scene": "speed"
      },
      {
        "dur": 4,
        "on_screen": "Built for the spike",
        "narration": "Handle the spike. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v33",
    "icp": "general",
    "title": "7 cloud providers, one console",
    "hook": "Pick your cloud. Manage it in one place.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Which cloud is best?",
        "narration": "Different projects fit different clouds — but juggling them is hard.",
        "scene": "compare"
      },
      {
        "dur": 5,
        "on_screen": "7 providers, 1 console",
        "narration": "Kloudbean lets you deploy across seven cloud providers from one console.",
        "scene": "cdn"
      },
      {
        "dur": 5,
        "on_screen": "Global regions",
        "narration": "Choose regions worldwide, close to your users.",
        "scene": "cdn"
      },
      {
        "dur": 5,
        "on_screen": "Same managed experience",
        "narration": "The same managed experience, whichever cloud you pick.",
        "scene": "cloud"
      },
      {
        "dur": 4,
        "on_screen": "Your cloud, your call",
        "narration": "One console for all of it. Start free at kloudbean.com.",
        "scene": "network"
      }
    ]
  },
  {
    "id": "v34",
    "icp": "general",
    "title": "Move off Windows and IIS to a Linux stack",
    "hook": "Modernize onto managed Linux cloud.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Stuck on Windows/IIS?",
        "narration": "Legacy Windows and IIS hosting can be costly and hard to scale.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Move to managed Linux",
        "narration": "Kloudbean runs modern Linux web stacks — Nginx, Apache and LiteSpeed.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Node, PHP, Python, more",
        "narration": "Bring your Node, PHP, Python, Ruby, Go or Java workloads over.",
        "scene": "code"
      },
      {
        "dur": 5,
        "on_screen": "Managed + cheaper to run",
        "narration": "Fully managed, and typically simpler and cheaper to operate.",
        "scene": "cost"
      },
      {
        "dur": 4,
        "on_screen": "Modernize the stack",
        "narration": "Migrate to modern managed cloud. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v35",
    "icp": "general",
    "title": "Your whole stack, one dashboard",
    "hook": "Stop stitching five tools together.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Your stack is scattered",
        "narration": "Servers on one tool, database on another, storage somewhere else.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "One dashboard for all of it",
        "narration": "Kloudbean runs your servers, apps and databases from a single console.",
        "scene": "cloud"
      },
      {
        "dur": 5,
        "on_screen": "Storage, static sites, balancer",
        "narration": "Add object storage, static sites and a load balancer in the same place.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "One login, whole stack",
        "narration": "No juggling providers. Your whole stack lives behind one login.",
        "scene": "compare"
      },
      {
        "dur": 4,
        "on_screen": "See it all at once",
        "narration": "One dashboard for everything. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v36",
    "icp": "saas_founder",
    "title": "A load balancer, already built in",
    "hook": "It's in every account. Just flip it on.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Outgrowing one server?",
        "narration": "When one server isn't enough, you need to spread the load.",
        "scene": "scale"
      },
      {
        "dur": 5,
        "on_screen": "The FLB is built in",
        "narration": "Kloudbean's Flexible Load Balancer ships with every account.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Pools, SSL, access logs",
        "narration": "Route traffic across app pools, manage SSL, and read access logs.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Off until you need it",
        "narration": "It's there the moment you switch it on. No separate product to buy.",
        "scene": "compare"
      },
      {
        "dur": 4,
        "on_screen": "Balance the load",
        "narration": "Scale out cleanly. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v37",
    "icp": "saas_founder",
    "title": "S3-compatible storage, included",
    "hook": "Buckets in the same dashboard as your app.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Files, uploads, backups",
        "narration": "Every app needs somewhere to put uploads and static assets.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "S3-compatible buckets",
        "narration": "Kloudbean gives you S3-compatible object storage right in the console.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "Works with the AWS SDK",
        "narration": "Point your existing S3 SDK or CLI at it and it just works.",
        "scene": "code"
      },
      {
        "dur": 5,
        "on_screen": "Public or private",
        "narration": "Set buckets public or private and manage objects from the dashboard.",
        "scene": "security"
      },
      {
        "dur": 4,
        "on_screen": "Store it on Kloudbean",
        "narration": "Object storage, included. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v38",
    "icp": "general",
    "title": "Six managed databases, one click",
    "hook": "SQL, document, cache, search. Covered.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Which database fits?",
        "narration": "Different apps need different databases. Picking is half the battle.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "Six managed engines",
        "narration": "Managed MySQL, MariaDB, PostgreSQL, MongoDB, Redis and Elasticsearch.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "One click, backed up",
        "narration": "Launch one in a click, with automatic backups and controlled access.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Right beside your app",
        "narration": "They run next to your app for low latency and simple wiring.",
        "scene": "speed"
      },
      {
        "dur": 4,
        "on_screen": "Pick your engine",
        "narration": "Managed data, your way. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v39",
    "icp": "vibecoder",
    "title": "Private AI chat you actually own",
    "hook": "OpenWebUI + DeepSeek, one click.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Want private AI chat?",
        "narration": "Sending everything to a third-party AI isn't always an option.",
        "scene": "ai"
      },
      {
        "dur": 5,
        "on_screen": "OpenWebUI + DeepSeek",
        "narration": "Kloudbean deploys OpenWebUI with DeepSeek in a single click.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "On a server you own",
        "narration": "Your prompts and your data stay on infrastructure you control.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Still fully managed",
        "narration": "It's managed for you, with backups and hardening handled.",
        "scene": "cloud"
      },
      {
        "dur": 4,
        "on_screen": "Own your AI",
        "narration": "Private AI chat, self-hosted. Start free at kloudbean.com.",
        "scene": "ai"
      }
    ]
  },
  {
    "id": "v40",
    "icp": "freelance_dev",
    "title": "Free static site hosting",
    "hook": "Custom domain, SSL and analytics. Free.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Just need to ship a site?",
        "narration": "Landing pages and docs shouldn't cost a monthly platform fee.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Static hosting, free",
        "narration": "Kloudbean hosts static sites for free, on your own custom domain.",
        "scene": "cdn"
      },
      {
        "dur": 5,
        "on_screen": "SSL + visit analytics",
        "narration": "Free SSL and built-in visit analytics come with it.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Push and it's live",
        "narration": "Deploy your built site and it's online in moments.",
        "scene": "deploy"
      },
      {
        "dur": 4,
        "on_screen": "Ship it free",
        "narration": "Static hosting on the house. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v41",
    "icp": "vibecoder",
    "title": "Watch your deploy happen live",
    "hook": "Push to GitHub. See the build stream.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Deploys shouldn't be a mystery",
        "narration": "When a deploy fails, you need to see why, fast.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "Live build logs",
        "narration": "Kloudbean streams the build log as your code deploys.",
        "scene": "code"
      },
      {
        "dur": 5,
        "on_screen": "Push to GitHub, it ships",
        "narration": "Connect GitHub and every push builds and deploys automatically.",
        "scene": "deploy"
      },
      {
        "dur": 5,
        "on_screen": "History and rollback",
        "narration": "Browse deployment history and roll back if something looks off.",
        "scene": "security"
      },
      {
        "dur": 4,
        "on_screen": "See every deploy",
        "narration": "CI/CD you can watch. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v42",
    "icp": "wp_agency",
    "title": "One-click staging for WordPress and Laravel",
    "hook": "Never test on the live site again.",
    "cta": "Start free at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Never test on production",
        "narration": "Editing a live site and hoping for the best is how sites break.",
        "scene": "generic"
      },
      {
        "dur": 5,
        "on_screen": "One-click staging",
        "narration": "Kloudbean spins up staging for WordPress and Laravel in a click.",
        "scene": "code"
      },
      {
        "dur": 5,
        "on_screen": "Test safely",
        "narration": "Try changes, plugins and updates away from real traffic.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Push when ready",
        "narration": "Happy with it? Take it live with confidence.",
        "scene": "deploy"
      },
      {
        "dur": 4,
        "on_screen": "Stage, then ship",
        "narration": "Test before you launch. Start free at kloudbean.com.",
        "scene": "cloud"
      }
    ]
  },
  {
    "id": "v43",
    "icp": "enterprise_gov",
    "title": "An audit trail built for compliance",
    "hook": "Who changed what, and when. All of it.",
    "cta": "Talk to us at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Who changed what, when?",
        "narration": "Compliance means knowing every action taken on your infrastructure.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Immutable activity log",
        "narration": "Kloudbean keeps an account-wide, immutable audit trail.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Searchable, exportable",
        "narration": "Search it, then export to CSV for your auditors.",
        "scene": "database"
      },
      {
        "dur": 5,
        "on_screen": "Built for regulators",
        "narration": "It's made for teams that answer to compliance requirements.",
        "scene": "cloud"
      },
      {
        "dur": 4,
        "on_screen": "Audit-ready by default",
        "narration": "Prove control. Talk to us at kloudbean.com.",
        "scene": "security"
      }
    ]
  },
  {
    "id": "v44",
    "icp": "enterprise_gov",
    "title": "Lock down who can touch what",
    "hook": "Least privilege, by design.",
    "cta": "Talk to us at kloudbean.com",
    "beats": [
      {
        "dur": 4,
        "on_screen": "Not everyone needs the keys",
        "narration": "Handing every teammate full access is a real security risk.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Granular access control",
        "narration": "User Access Control sets per-resource, per-action rights for subusers.",
        "scene": "security"
      },
      {
        "dur": 5,
        "on_screen": "Lock it to an IP",
        "narration": "Add IP access rules with CIDR, plus a Basic Auth gate on apps.",
        "scene": "network"
      },
      {
        "dur": 5,
        "on_screen": "Least privilege by design",
        "narration": "Give people exactly the access they need and nothing more.",
        "scene": "compare"
      },
      {
        "dur": 4,
        "on_screen": "Control the keys",
        "narration": "Least-privilege access. Talk to us at kloudbean.com.",
        "scene": "security"
      }
    ]
  }
];
