/**
 * MEDIA STUDIO CONTENT — curated, brand-grounded seed content the in-app studio
 * renders (social posts + video scripts). Mirrors the local video-studio /
 * social-studio content shape so the same brand components drive both. Kept
 * representative (not the full 100+/34); the local studios hold the bulk.
 *
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
  beats: VideoBeat[];
};

export const ICP_NAMES: Record<IcpId, string> = {
  vibecoder: "Vibecoders / AI builders",
  saas_founder: "SaaS founders",
  ai_agency: "AI / dev agencies",
  freelance_dev: "Freelance developers",
  wp_agency: "WordPress / agencies",
  enterprise_gov: "Enterprise / gov (KSA)",
  general: "Kloudbean",
};

/** Brand-approved accents only (Primary Purple lightened for on-navy contrast). */
export const ACCENT: Record<IcpId, { c: string; glow: string }> = {
  vibecoder: { c: "#7C5CFF", glow: "#4F1AF3" },
  saas_founder: { c: "#40B75F", glow: "#40B75F" },
  ai_agency: { c: "#7C5CFF", glow: "#4F1AF3" },
  freelance_dev: { c: "#40B75F", glow: "#40B75F" },
  wp_agency: { c: "#7C5CFF", glow: "#4F1AF3" },
  enterprise_gov: { c: "#E4B32F", glow: "#E4B32F" },
  general: { c: "#7C5CFF", glow: "#4F1AF3" },
};

export const EYEBROW: Record<IcpId, string> = {
  vibecoder: "For AI builders",
  saas_founder: "For SaaS founders",
  ai_agency: "For agencies",
  freelance_dev: "For freelance devs",
  wp_agency: "For WordPress teams",
  enterprise_gov: "Enterprise · KSA",
  general: "Managed cloud",
};

const S = (p: Omit<SocialPost, "id">, i: number): SocialPost => ({ id: `s${String(i + 1).padStart(2, "0")}`, ...p });

const RAW_SOCIAL: Omit<SocialPost, "id">[] = [
  { icp: "vibecoder", scene: "code", platform: "X", headline: "It works on localhost.\nThen what?", caption: "Your AI-built app runs perfectly on your machine. Getting it online for real is where most stall. Kloudbean deploys it to a managed server in one click — and you keep the code.", tags: ["VibeCoding", "AIapps", "IndieHackers", "KloudBean"] },
  { icp: "vibecoder", scene: "deploy", platform: "LinkedIn", headline: "Deploy your Lovable app,\nown the code", caption: "Built with Lovable? Ship it to a real, managed server you control — no per-app pricing, no lock-in. Security, backups and scaling handled.", tags: ["Lovable", "VibeCoding", "ManagedCloud", "KloudBean"] },
  { icp: "vibecoder", scene: "ai", platform: "X", headline: "Bolt.new → live", caption: "Prompted a working app in Bolt? Give it a home. Kloudbean runs your Node + React build on managed Linux cloud — prompt to production, no DevOps.", tags: ["BoltNew", "AIapps", "Deployment", "KloudBean"] },
  { icp: "vibecoder", scene: "cloud", platform: "any", headline: "Built it with AI?\nNow actually ship it.", caption: "The build got faster. Deployment should too. One managed server for app, API and database — you own all of it.", tags: ["VibeCoding", "AIapps", "Startups", "KloudBean"] },
  { icp: "saas_founder", scene: "network", platform: "LinkedIn", headline: "Self-host n8n.\nStop paying per run.", caption: "Per-execution automation pricing punishes scale. Run n8n on a managed Kloudbean server — unlimited workflows, your data, one flat price.", tags: ["n8n", "Automation", "SelfHosted", "KloudBean"] },
  { icp: "saas_founder", scene: "database", platform: "LinkedIn", headline: "Self-host Supabase,\nown your backend", caption: "Your backend shouldn't be a metered subscription. Run Supabase on your own managed server — a real Postgres you control, at a predictable price.", tags: ["Supabase", "Postgres", "SelfHosted", "KloudBean"] },
  { icp: "saas_founder", scene: "cost", platform: "X", headline: "Kill the SaaS sprawl", caption: "Ten subscriptions doing what one server could. Self-host n8n, Supabase, Ghost and more on Kloudbean — consolidate and simplify.", tags: ["SaaS", "SelfHosted", "IndieHackers", "KloudBean"] },
  { icp: "saas_founder", scene: "compare", platform: "X", headline: "Escape PaaS\nbill shock", caption: "Usage-based platforms are cheap until a spike. Kloudbean gives managed servers at a flat price — same Node/Next app, no surprise invoice.", tags: ["Vercel", "Railway", "CloudHosting", "KloudBean"] },
  { icp: "ai_agency", scene: "scale", platform: "LinkedIn", headline: "Host every client\non one server", caption: "A dozen client apps, a dozen bills? Consolidate onto one managed Kloudbean server — any stack per client, one console, one bill.", tags: ["Agencies", "WebDev", "Hosting", "KloudBean"] },
  { icp: "ai_agency", scene: "security", platform: "LinkedIn", headline: "White-label it", caption: "Turn hosting into recurring revenue. Deliver managed cloud under your own brand, with unlimited DevOps support behind you.", tags: ["Agencies", "WhiteLabel", "Hosting", "KloudBean"] },
  { icp: "ai_agency", scene: "generic", platform: "X", headline: "Stop juggling\nVercel, Netlify, Heroku", caption: "Five dashboards, one team. Bring client apps into one managed console — frontends, APIs and databases in one place, one flat price.", tags: ["Agencies", "WebDev", "DevOps", "KloudBean"] },
  { icp: "freelance_dev", scene: "cost", platform: "X", headline: "Managed cloud\nfrom ~$8/mo", caption: "A raw VPS means you're on the hook for everything. Kloudbean gives freelancers a fully managed server — security + backups included — from ~$8/mo.", tags: ["Freelance", "WebDev", "Developers", "KloudBean"] },
  { icp: "freelance_dev", scene: "security", platform: "LinkedIn", headline: "Security, backups, CI/CD\n— handled", caption: "The boring, critical stuff done for you. Ship client work on a managed server without running ops yourself.", tags: ["Freelance", "DevOps", "WebDev", "KloudBean"] },
  { icp: "freelance_dev", scene: "network", platform: "LinkedIn", headline: "WordPress + Node\non one box", caption: "One client wants WordPress, the next a Node app. Run both — plus a managed database — on one Kloudbean server.", tags: ["Freelance", "WordPress", "NodeJS", "KloudBean"] },
  { icp: "wp_agency", scene: "wordpress", platform: "LinkedIn", headline: "WordPress AND Next.js,\nside by side", caption: "WordPress-only hosts can't run your modern frameworks. Kloudbean hosts WordPress and Next.js, Vue or Node together — great for headless.", tags: ["WordPress", "NextJS", "Headless", "KloudBean"] },
  { icp: "wp_agency", scene: "compare", platform: "X", headline: "A real WP Engine /\nKinsta alternative", caption: "Premium managed WordPress, but boxed into just WordPress. Kloudbean gives managed WP and any stack — without visit-based overages.", tags: ["WordPress", "WPEngine", "Kinsta", "KloudBean"] },
  { icp: "wp_agency", scene: "speed", platform: "LinkedIn", headline: "Slow WordPress\nloses money", caption: "Speed is a ranking and conversion factor. Kloudbean runs WP on a tuned Nginx/LiteSpeed stack with caching and a CDN.", tags: ["WordPress", "PageSpeed", "SEO", "KloudBean"] },
  { icp: "enterprise_gov", scene: "cdn", platform: "LinkedIn", headline: "Data residency\nin the Kingdom", caption: "For regulated orgs, where data lives matters. Kloudbean can run your workloads in-region on GCP Dammam — managed and isolated.", tags: ["DataResidency", "KSA", "Compliance", "KloudBean"] },
  { icp: "enterprise_gov", scene: "code", platform: "LinkedIn", headline: "Self-host GitLab,\nkeep your source", caption: "Source code that can't live on someone else's SaaS? Run your own GitLab on a managed Kloudbean server, in-region if needed.", tags: ["GitLab", "SelfHosted", "DevOps", "KloudBean"] },
  { icp: "enterprise_gov", scene: "security", platform: "LinkedIn", headline: "Compliant by design,\nnot by accident", caption: "Managed databases, load balancers, S3 and self-hosted GitLab — on controlled infrastructure you can audit.", tags: ["Compliance", "Enterprise", "CloudComputing", "KloudBean"] },
  { icp: "general", scene: "cloud", platform: "LinkedIn", headline: "What is\nmanaged cloud hosting?", caption: "It means the hard server work — security, updates, backups, scaling — is done for you. You bring the app; the platform runs the Linux server underneath.", tags: ["CloudComputing", "ManagedCloud", "WebHosting", "KloudBean"] },
  { icp: "general", scene: "deploy", platform: "X", headline: "One-click deploy,\nexplained", caption: "Connect your app, pick a runtime, click deploy. Kloudbean provisions the server and puts it online — then CI/CD ships every change after.", tags: ["Deployment", "DevOps", "CICD", "KloudBean"] },
  { icp: "general", scene: "database", platform: "LinkedIn", headline: "Managed databases,\nno babysitting", caption: "MySQL, MariaDB, PostgreSQL, MongoDB, Redis — backed up, secured and monitored, running right next to your app.", tags: ["Database", "Postgres", "CloudComputing", "KloudBean"] },
  { icp: "general", scene: "cdn", platform: "LinkedIn", headline: "7 cloud providers,\none console", caption: "Different projects fit different clouds. Deploy across seven providers and global regions from a single managed console.", tags: ["MultiCloud", "CloudComputing", "DevOps", "KloudBean"] },
];
export const SOCIAL_POSTS: SocialPost[] = RAW_SOCIAL.map(S);

const V = (v: Omit<VideoScript, "id" | "cta"> & { cta?: string }, i: number): VideoScript => ({
  id: `v${String(i + 1).padStart(2, "0")}`,
  cta: v.cta ?? "Start free at kloudbean.com",
  ...v,
});

const RAW_VIDEOS: (Omit<VideoScript, "id" | "cta"> & { cta?: string })[] = [
  {
    icp: "vibecoder", title: "Your Lovable app deserves a real home", hook: "It works on localhost… then what?",
    beats: [
      { dur: 4, on_screen: "It works on localhost.", narration: "You built a full app with Lovable. It runs perfectly on your machine.", scene: "code" },
      { dur: 4, on_screen: "Then it goes nowhere.", narration: "But getting it online for real is where most AI-built apps stall.", scene: "generic" },
      { dur: 5, on_screen: "Deploy it in one click", narration: "Kloudbean deploys your app to a real, managed server in a click.", scene: "deploy" },
      { dur: 5, on_screen: "You own the code", narration: "No per-app pricing, no lock-in. It's your code on a server you control.", scene: "security" },
      { dur: 4, on_screen: "Ship it for real", narration: "Take your app from localhost to live. Start free at kloudbean.com.", scene: "cloud" },
    ],
  },
  {
    icp: "saas_founder", title: "Kill the SaaS sprawl", hook: "Ten subscriptions, one server.",
    beats: [
      { dur: 4, on_screen: "Subscriptions everywhere", narration: "Auth, analytics, automation, database — every tool its own bill.", scene: "cost" },
      { dur: 5, on_screen: "Consolidate on one server", narration: "Self-host the tools you need on one managed Kloudbean server.", scene: "scale" },
      { dur: 5, on_screen: "n8n, Supabase, Ghost…", narration: "Run n8n, Supabase, Ghost and Plausible side by side.", scene: "network" },
      { dur: 5, on_screen: "One bill, no sprawl", narration: "One predictable bill replaces a stack of subscriptions.", scene: "cost" },
      { dur: 4, on_screen: "Cut the sprawl", narration: "Consolidate and simplify. Start free at kloudbean.com.", scene: "cloud" },
    ],
  },
  {
    icp: "ai_agency", title: "Host every client on one server", hook: "Stop paying per project.",
    beats: [
      { dur: 4, on_screen: "A dozen client projects", narration: "Every client app on its own platform subscription adds up fast.", scene: "cost" },
      { dur: 5, on_screen: "Consolidate the fleet", narration: "Host many client apps and sites on one managed Kloudbean server.", scene: "scale" },
      { dur: 5, on_screen: "Any stack, any client", narration: "WordPress, Next.js, Node, Laravel — mix stacks per client freely.", scene: "network" },
      { dur: 5, on_screen: "One bill to manage", narration: "One bill and one console instead of a dozen dashboards.", scene: "cloud" },
      { dur: 4, on_screen: "Run the whole book", narration: "Host your whole client book in one place. kloudbean.com.", scene: "deploy" },
    ],
  },
  {
    icp: "freelance_dev", title: "A managed server from ~$8/mo", hook: "Managed cloud, freelancer-friendly.",
    beats: [
      { dur: 4, on_screen: "DIY VPS is fiddly", narration: "A raw VPS means you're on the hook for everything that breaks.", scene: "generic" },
      { dur: 5, on_screen: "Managed from ~$8/mo", narration: "Kloudbean gives you a fully managed server from around eight dollars a month.", scene: "cost" },
      { dur: 5, on_screen: "Security + backups included", narration: "Security hardening and automatic backups are included.", scene: "security" },
      { dur: 4, on_screen: "Managed, affordable", narration: "Managed cloud that fits a freelancer. kloudbean.com.", scene: "cloud" },
    ],
  },
  {
    icp: "wp_agency", title: "WordPress AND Next.js, side by side", hook: "Your CMS and app framework, together.",
    beats: [
      { dur: 4, on_screen: "WP-only hosts limit you", narration: "WordPress-only hosts can't run your Next.js or Node projects.", scene: "generic" },
      { dur: 5, on_screen: "Run both, one platform", narration: "Kloudbean hosts WordPress and modern frameworks together.", scene: "wordpress" },
      { dur: 5, on_screen: "Headless-ready", narration: "Perfect for headless WordPress with a React or Next front end.", scene: "network" },
      { dur: 4, on_screen: "CMS + app, unified", narration: "One platform for both. Start free at kloudbean.com.", scene: "cloud" },
    ],
  },
  {
    icp: "enterprise_gov", title: "Data residency in the Kingdom", hook: "Keep the data in-region. Dammam.",
    beats: [
      { dur: 4, on_screen: "Where does data live?", narration: "For regulated orgs, where your data physically lives matters.", scene: "security" },
      { dur: 5, on_screen: "In-Kingdom on GCP Dammam", narration: "Kloudbean can run your workloads in-region on GCP Dammam.", scene: "cdn" },
      { dur: 5, on_screen: "Managed + isolated", narration: "Managed, isolated environments — not a generic shared host.", scene: "cloud" },
      { dur: 4, on_screen: "In-region, managed", narration: "Data residency, handled. Talk to us at kloudbean.com.", scene: "deploy" },
    ],
  },
  {
    icp: "general", title: "What is managed cloud hosting?", hook: "The server, run for you.",
    beats: [
      { dur: 4, on_screen: "What is managed cloud?", narration: "Managed cloud hosting means the hard server work is done for you.", scene: "cloud" },
      { dur: 5, on_screen: "You bring the app", narration: "You bring the app; the platform runs the Linux server underneath.", scene: "deploy" },
      { dur: 5, on_screen: "Security, updates, backups", narration: "Security patching, updates and backups are handled automatically.", scene: "security" },
      { dur: 5, on_screen: "Scale without rebuilds", narration: "And you can scale up without re-architecting everything.", scene: "scale" },
      { dur: 4, on_screen: "Managed, so you build", narration: "That's Kloudbean. Start free at kloudbean.com.", scene: "network" },
    ],
  },
  {
    icp: "general", title: "Survive traffic spikes", hook: "Autoscaling + load balancing, managed.",
    beats: [
      { dur: 4, on_screen: "Traffic just spiked", narration: "A launch or a viral post can flood your app in minutes.", scene: "scale" },
      { dur: 5, on_screen: "Load balancing", narration: "Kloudbean spreads traffic across your app with load balancing.", scene: "network" },
      { dur: 5, on_screen: "Scale out fast", narration: "Scale out to handle the surge, then scale back down.", scene: "scale" },
      { dur: 4, on_screen: "Built for the spike", narration: "Handle the spike. Start free at kloudbean.com.", scene: "cloud" },
    ],
  },
];
export const VIDEO_SCRIPTS: VideoScript[] = RAW_VIDEOS.map(V);
