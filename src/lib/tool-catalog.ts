/**
 * TOOL CATALOG — the seed source for the "idea bringer".
 *
 * A curated set of free interactive tools that fit Kloudbean's audience
 * (developers, DevOps, agencies, SaaS founders, people deploying AI/vibe-coded
 * apps). Each entry is intentionally on-brand: the tool is genuinely useful AND
 * has a natural path back to "host/deploy this on Kloudbean".
 *
 * Discovery (tool-ideas.ts) starts here, dedupes against tools already in the DB
 * and on WordPress, then ranks by real search demand. This guarantees we always
 * have high-quality, scoped ideas even with zero API credentials.
 */

export type ToolType =
  | "calculator"
  | "converter"
  | "generator"
  | "validator"
  | "analyzer"
  | "formatter";

export type ToolCatalogEntry = {
  name: string;
  /** Suggested URL slug (only used for NEW pages; existing slugs are never changed). */
  slug: string;
  category: string;
  toolType: ToolType;
  targetKeyword: string;
  secondaryKeywords: string[];
  /** What the tool does, used by the generator as the build spec. */
  description: string;
  /** Concrete inputs/outputs the generated tool should expose. */
  spec: string;
  /** How this tool ties back to Kloudbean (drives the CTA + intro angle). */
  kloudbeanAngle: string;
  /** Search seeds used for demand lookup / expansion. */
  seeds: string[];
  /** Hand priority 1–5 (tiebreaker when demand data is unavailable). */
  priority: number;
};

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const TOOL_CATALOG: ToolCatalogEntry[] = [
  // --- Cloud / hosting cost + sizing (highest commercial intent → Kloudbean) ---
  {
    name: "Cloud Hosting Cost Calculator",
    slug: "cloud-hosting-cost-calculator",
    category: "Developer Tools",
    toolType: "calculator",
    targetKeyword: "cloud hosting cost calculator",
    secondaryKeywords: [
      "cloud cost estimator",
      "server cost calculator",
      "hosting price calculator",
    ],
    description:
      "Estimate monthly cloud hosting cost from vCPU, RAM, storage, bandwidth and number of apps, with a side-by-side of DIY cloud vs managed.",
    spec: "Inputs: vCPU, RAM (GB), SSD storage (GB), monthly bandwidth (GB), number of apps/sites, region. Outputs: estimated monthly compute + storage + egress cost, a managed-vs-unmanaged comparison row, and total cost of ownership including DevOps time saved.",
    kloudbeanAngle:
      "Show how a bundled managed plan (compute + DevOps + security) often beats raw cloud + hired ops; CTA to Kloudbean plans.",
    seeds: ["cloud hosting cost calculator", "server cost calculator", "aws cost estimator"],
    priority: 5,
  },
  {
    name: "Server Sizing Calculator",
    slug: "server-sizing-calculator",
    category: "Developer Tools",
    toolType: "calculator",
    targetKeyword: "server sizing calculator",
    secondaryKeywords: [
      "how much ram do i need server",
      "vps sizing",
      "server requirements calculator",
    ],
    description:
      "Recommend vCPU/RAM/storage for a workload based on expected traffic, app type (WordPress, Node, Laravel, DB), and concurrent users.",
    spec: "Inputs: app type, monthly visits or concurrent users, database size, caching yes/no. Outputs: recommended vCPU, RAM, storage, and a suggested Kloudbean plan tier.",
    kloudbeanAngle: "Map the recommendation to a Kloudbean plan and one-click deploy.",
    seeds: ["server sizing calculator", "how much ram does my server need", "vps requirements"],
    priority: 5,
  },
  {
    name: "Bandwidth & Egress Cost Calculator",
    slug: "bandwidth-egress-cost-calculator",
    category: "Developer Tools",
    toolType: "calculator",
    targetKeyword: "bandwidth cost calculator",
    secondaryKeywords: ["egress cost calculator", "data transfer cost", "cdn bandwidth calculator"],
    description:
      "Estimate monthly egress/bandwidth cost across providers and show how zero/low-egress changes the bill.",
    spec: "Inputs: monthly GB transferred, average request size, provider egress price per GB. Outputs: monthly egress cost, annualized cost, and savings vs a high-egress provider.",
    kloudbeanAngle: "Highlight Kloudbean's bundled bandwidth/object storage egress advantage.",
    seeds: ["egress cost calculator", "bandwidth cost calculator", "data transfer pricing"],
    priority: 4,
  },
  {
    name: "Website Downtime Cost Calculator",
    slug: "downtime-cost-calculator",
    category: "Developer Tools",
    toolType: "calculator",
    targetKeyword: "downtime cost calculator",
    secondaryKeywords: ["cost of downtime", "uptime sla calculator", "website downtime calculator"],
    description:
      "Calculate revenue lost per hour/year of downtime from traffic, conversion rate, and order value.",
    spec: "Inputs: monthly revenue or (visits × conversion × AOV), current uptime %. Outputs: cost per hour of downtime, annual cost at 99.9% vs 99.99%, and break-even on managed hosting.",
    kloudbeanAngle: "Tie reliability to Kloudbean's managed monitoring, backups, and uptime.",
    seeds: ["downtime cost calculator", "cost of website downtime", "uptime calculator"],
    priority: 4,
  },
  {
    name: "Uptime / SLA Calculator",
    slug: "uptime-sla-calculator",
    category: "Developer Tools",
    toolType: "calculator",
    targetKeyword: "uptime calculator",
    secondaryKeywords: ["sla calculator", "99.9 uptime minutes", "availability calculator"],
    description:
      "Convert an uptime percentage into allowed downtime per day/month/year and vice versa.",
    spec: "Inputs: uptime % (or downtime minutes). Outputs: allowed downtime per day/week/month/year for 99% → 99.999%, with a reference table.",
    kloudbeanAngle: "Explain what SLA tier Kloudbean managed hosting targets.",
    seeds: ["uptime calculator", "sla uptime calculator", "99.9 percent uptime"],
    priority: 3,
  },

  // --- DevOps / infra utilities ---
  {
    name: "Cron Expression Generator",
    slug: "cron-expression-generator",
    category: "Developer Tools",
    toolType: "generator",
    targetKeyword: "cron expression generator",
    secondaryKeywords: ["crontab generator", "cron schedule builder", "cron syntax"],
    description:
      "Build and explain cron expressions from a friendly schedule picker, with a human-readable preview.",
    spec: "Inputs: minute/hour/day/month/weekday selectors or presets. Outputs: the cron string, a plain-English description, and the next 5 run times.",
    kloudbeanAngle: "Mention scheduled jobs/cron on Kloudbean managed servers.",
    seeds: ["cron expression generator", "crontab generator", "cron builder"],
    priority: 5,
  },
  {
    name: "Nginx Config Generator",
    slug: "nginx-config-generator",
    category: "Developer Tools",
    toolType: "generator",
    targetKeyword: "nginx config generator",
    secondaryKeywords: ["nginx reverse proxy config", "nginx ssl config", "nginx location block"],
    description:
      "Generate a production-ready Nginx server block from a few options (domain, SSL, proxy, static, PHP).",
    spec: "Inputs: domain, root path, SSL on/off, reverse proxy target, gzip, caching. Outputs: a copy-paste Nginx config with security headers.",
    kloudbeanAngle: "Note Kloudbean handles Nginx/OpenLiteSpeed config for you.",
    seeds: ["nginx config generator", "nginx reverse proxy generator", "nginx ssl config"],
    priority: 4,
  },
  {
    name: "Dockerfile Generator",
    slug: "dockerfile-generator",
    category: "Developer Tools",
    toolType: "generator",
    targetKeyword: "dockerfile generator",
    secondaryKeywords: ["dockerfile builder", "docker compose generator", "node dockerfile"],
    description:
      "Generate an optimized multi-stage Dockerfile for Node, Python, PHP, Go, or static apps.",
    spec: "Inputs: language/runtime, package manager, build command, start command, port. Outputs: a multi-stage Dockerfile + a basic docker-compose snippet.",
    kloudbeanAngle: "Tie to deploying containers/apps on Kloudbean.",
    seeds: ["dockerfile generator", "node dockerfile example", "docker compose generator"],
    priority: 4,
  },
  {
    name: ".htaccess Redirect Generator",
    slug: "htaccess-redirect-generator",
    category: "Developer Tools",
    toolType: "generator",
    targetKeyword: "htaccess redirect generator",
    secondaryKeywords: ["301 redirect generator", "htaccess generator", "redirect rule generator"],
    description:
      "Generate .htaccess or Nginx redirect rules (301/302), www/non-www, HTTP→HTTPS, and path mappings.",
    spec: "Inputs: redirect type, from/to URLs or patterns, force HTTPS, www handling. Outputs: .htaccess block and the Nginx equivalent.",
    kloudbeanAngle: "Mention migrations to Kloudbean keep redirects intact.",
    seeds: ["htaccess redirect generator", "301 redirect generator", "force https htaccess"],
    priority: 4,
  },
  {
    name: "Password / API Key Generator",
    slug: "password-generator",
    category: "Developer Tools",
    toolType: "generator",
    targetKeyword: "password generator",
    secondaryKeywords: ["strong password generator", "api key generator", "secure password"],
    description:
      "Generate strong random passwords, API keys, and secrets entirely in the browser (no server).",
    spec: "Inputs: length, character sets, count, prefix. Outputs: generated secrets with copy, plus a strength/entropy meter. All client-side.",
    kloudbeanAngle:
      "Note Kloudbean's managed security (BitNinja, isolation) for the apps that use these.",
    seeds: ["password generator", "strong password generator", "api key generator"],
    priority: 5,
  },
  {
    name: "UUID Generator",
    slug: "uuid-generator",
    category: "Developer Tools",
    toolType: "generator",
    targetKeyword: "uuid generator",
    secondaryKeywords: ["guid generator", "uuid v4 generator", "bulk uuid"],
    description: "Generate UUID v1/v4 (and ULIDs) in bulk, client-side, with copy and download.",
    spec: "Inputs: version, quantity, uppercase, hyphens. Outputs: list of UUIDs with copy/download.",
    kloudbeanAngle: "Light touch — for developers building apps they'll host on Kloudbean.",
    seeds: ["uuid generator", "guid generator", "uuid v4"],
    priority: 3,
  },

  // --- Converters / formatters ---
  {
    name: "JSON Formatter & Validator",
    slug: "json-formatter-validator",
    category: "Developer Tools",
    toolType: "formatter",
    targetKeyword: "json formatter",
    secondaryKeywords: ["json validator", "json beautifier", "format json online"],
    description:
      "Format, minify, and validate JSON with error highlighting and a tree view — all in the browser.",
    spec: "Inputs: pasted JSON. Outputs: pretty/minified output, validation errors with line numbers, collapsible tree, copy/download.",
    kloudbeanAngle: "Developer utility; subtle CTA to host APIs on Kloudbean.",
    seeds: ["json formatter", "json validator online", "json beautifier"],
    priority: 5,
  },
  {
    name: "Base64 Encoder / Decoder",
    slug: "base64-encode-decode",
    category: "Developer Tools",
    toolType: "converter",
    targetKeyword: "base64 encode decode",
    secondaryKeywords: ["base64 decoder", "base64 to image", "base64 encoder online"],
    description:
      "Encode/decode text and files to/from Base64 in the browser, including data URLs for images.",
    spec: "Inputs: text or file, mode (encode/decode). Outputs: result with copy/download, image preview for data URLs.",
    kloudbeanAngle: "Light developer utility.",
    seeds: ["base64 encode decode", "base64 decoder", "base64 to image"],
    priority: 4,
  },
  {
    name: "Cron to Human Readable Converter",
    slug: "cron-to-human-readable",
    category: "Developer Tools",
    toolType: "converter",
    targetKeyword: "cron to human readable",
    secondaryKeywords: ["cron explainer", "what does this cron mean", "cron parser"],
    description:
      "Paste a cron expression and get a plain-English explanation plus the next run times.",
    spec: "Inputs: cron string. Outputs: human description, validity, next 10 run times in a chosen timezone.",
    kloudbeanAngle: "Pairs with the cron generator; mention scheduled jobs on Kloudbean.",
    seeds: ["cron to human readable", "explain cron expression", "cron parser"],
    priority: 3,
  },
  {
    name: "Timestamp (Epoch) Converter",
    slug: "epoch-timestamp-converter",
    category: "Developer Tools",
    toolType: "converter",
    targetKeyword: "epoch converter",
    secondaryKeywords: ["unix timestamp converter", "epoch to date", "timestamp to date"],
    description:
      "Convert between Unix timestamps and human dates across timezones, with millisecond support.",
    spec: "Inputs: timestamp or date, timezone, unit (s/ms). Outputs: converted value, relative time, copy.",
    kloudbeanAngle: "Light developer utility.",
    seeds: ["epoch converter", "unix timestamp converter", "timestamp to date"],
    priority: 3,
  },

  // --- Web / performance / SEO-ish (drives hosting intent) ---
  {
    name: "Website Speed / TTFB Estimator",
    slug: "website-speed-estimator",
    category: "Developer Tools",
    toolType: "calculator",
    targetKeyword: "website speed calculator",
    secondaryKeywords: ["page load time calculator", "ttfb estimator", "page weight calculator"],
    description:
      "Estimate page load time from page weight, number of requests, and connection speed, with optimization tips.",
    spec: "Inputs: total page size (KB), number of requests, bandwidth, RTT. Outputs: estimated load time, TTFB band, and a prioritized fix list.",
    kloudbeanAngle: "Tie speed to Kloudbean caching/CDN/managed stack.",
    seeds: ["website speed calculator", "page load time calculator", "page weight"],
    priority: 4,
  },
  {
    name: "SSL Certificate Expiry Checker",
    slug: "ssl-expiry-checker",
    category: "Developer Tools",
    toolType: "validator",
    targetKeyword: "ssl certificate checker",
    secondaryKeywords: ["ssl expiry checker", "check ssl certificate", "ssl validator"],
    description:
      "Explain how to check an SSL cert's expiry and validity, with an inline date-based expiry calculator.",
    spec: "Inputs: certificate expiry date (or paste cert details). Outputs: days remaining, renewal reminder window, and a checklist. (Live checks need a backend; client version uses pasted dates.)",
    kloudbeanAngle: "Kloudbean auto-manages/renews SSL.",
    seeds: ["ssl certificate checker", "ssl expiry checker", "check ssl"],
    priority: 4,
  },
  {
    name: "Subnet / CIDR Calculator",
    slug: "subnet-cidr-calculator",
    category: "Developer Tools",
    toolType: "calculator",
    targetKeyword: "subnet calculator",
    secondaryKeywords: ["cidr calculator", "ip subnet calculator", "cidr to ip range"],
    description:
      "Calculate network/broadcast addresses, host range, and usable hosts from an IP and CIDR.",
    spec: "Inputs: IP address, CIDR prefix. Outputs: network, broadcast, mask, host range, usable hosts, wildcard.",
    kloudbeanAngle: "Light infra utility; mention VPC/networking on Kloudbean.",
    seeds: ["subnet calculator", "cidr calculator", "ip subnet calculator"],
    priority: 3,
  },
];

/** Look up a catalog entry by slug. */
export function catalogBySlug(slug: string): ToolCatalogEntry | undefined {
  return TOOL_CATALOG.find((t) => t.slug === slug);
}
