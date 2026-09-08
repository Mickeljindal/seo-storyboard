// Build the screenshot mapping as STEP SEQUENCES.
//
// Feature flows on support.kloudbean.com are multi-step (S3: access -> create ->
// name -> created; FLB: launch 1/2/3; git: tab -> repo URL -> branch -> deploy).
// The first shot is usually just navigation, so a single image undersells the
// real dashboard UI. This map therefore gives every slot:
//   - steps[]: the ordered real dashboard screens, each with a caption
//   - lead:    the single most representative UI screen (for passing mentions)
//
// It resolves content-hashed filenames from the live docs, downloads each unique
// screenshot once into content-studio/assets/console-real/shots/<base>.png, and
// writes content-studio/assets/console-real/screenshot-map.json.
//
// Run: node scripts/build-screenshot-map.mjs
import fs from "node:fs";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const BASE = "https://support.kloudbean.com";
const OUT = "content-studio/assets/console-real";
const SHOTS = `${OUT}/shots`;

// slot -> { doc, lead, steps:[[base, caption], ...] }
const SLOTS = {
  "add-server": {
    doc: "getting-started/creating-new-server",
    lead: "launch_server_step_1",
    steps: [
      ["launch_server_step_1", "Choose cloud provider, application, datacenter, and server size"],
      ["launch_server_step_2", "The server provisions with your full stack in a few minutes"],
    ],
  },
  "add-server-region": {
    doc: "getting-started/selecting-server-location",
    lead: "selecting_server_location",
    steps: [["selecting_server_location", "Pick the datacenter closest to your users"]],
  },
  dashboard: {
    doc: "getting-started/understanding-dashboard",
    lead: "dashboard",
    steps: [["dashboard", "The Kloudbean dashboard: servers, apps, and databases in one place"]],
  },
  "add-application": {
    doc: "getting-started/deploying-application-server",
    lead: "adding_app_from_apps_step_1",
    steps: [
      ["adding_app_from_apps_step_1", "Add an application from the Applications page"],
      ["adding_app_step_2", "Pick the application type and the server to run it on"],
    ],
  },
  "launch-database": {
    doc: "database-launch/launching-postgres",
    lead: "psql_launch_step_1",
    steps: [
      ["database_step_1", "Open Managed Databases and add a new database"],
      ["psql_launch_step_1", "Choose the engine, size, and region"],
      ["psql_launch_step_2", "The managed database is created with its own host and SSL"],
    ],
  },
  "env-vars": {
    doc: "application-deployment/deploying-nodejs-single-process",
    lead: "nodespm_env_step_1",
    steps: [
      ["nodespm_env_step_1", "Open the Environment Variables editor in the console"],
      ["nodespm_env_step_2", "Paste your .env content, then convert to key/value"],
    ],
  },
  "git-deployment": {
    doc: "application-management/connecting-git",
    lead: "git_connect_step_4",
    steps: [
      ["git_connect_step_1", "Open Code Delivery, Git deployment, and pick a connection mode"],
      ["git_connect_step_4", "Paste your repository URL and fetch branches"],
      ["git_connect_step_5", "Select the branch and clone the repo to the app"],
      ["git_connect_step_6", "Pull and deploy: Kloudbean builds and ships the code"],
    ],
  },
  "server-health": {
    doc: "server-management/monitoring-server-health",
    lead: "server_health_step_2",
    steps: [
      ["server_health_step_1", "Open Server Health monitoring"],
      ["server_health_step_2", "CPU, memory, and disk usage over time"],
      ["server_health_step_3", "Per-service resource breakdown"],
    ],
  },
  "manage-backups": {
    doc: "application-management/managing-restoring-backups",
    lead: "app_backup_step_2",
    steps: [
      ["app_backup_step_1", "Open the application Backups tab"],
      ["app_backup_step_2", "Take an on-demand backup or set a schedule"],
      ["app_restore_step_1", "Restore from any listed restore point"],
    ],
  },
  "flb-load-balancer": {
    doc: "flexible-load-balancers/launching-flexible-load-balancer",
    lead: "flb_launch_step_2",
    steps: [
      ["flb_launch_step_1", "Launch a Flexible Load Balancer"],
      ["flb_launch_step_2", "Configure the load balancer and its application pool"],
      ["flb_launch_step_3", "The load balancer is provisioned and fronting your app"],
    ],
  },
  "ssl-certificate": {
    doc: "application-management/managing-ssl-certificates",
    lead: "le_ssl_step_1",
    steps: [
      ["ssl_certs_step_1", "Open the SSL Certificate section"],
      ["le_ssl_step_1", "Issue a free Let's Encrypt certificate for your domain"],
      ["le_ssl_install_success", "The certificate is installed and active"],
    ],
  },
  "s3-buckets": {
    doc: "s3-object-storage/creating-new-bucket",
    lead: "storage_bucket_step_3",
    steps: [
      ["storage_bucket_step_1", "Open S3 Object Storage"],
      ["storage_bucket_step_2", "Create a new bucket"],
      ["storage_bucket_step_3", "Name the bucket and set its access"],
      ["storage_bucket_step_4", "The bucket is ready for objects"],
    ],
  },
  firewall: {
    doc: "application-management/restricting-access-by-ip",
    lead: "app_ip_whitelisting",
    steps: [["app_ip_whitelisting", "Lock access down with IP allow-listing (CIDR)"]],
  },
  "subusers-uac": {
    doc: "user-account/managing-team-members",
    lead: "uac_resources_access",
    steps: [
      ["manage_team_add_user_step_1", "Invite a team member from Team Management"],
      ["uac_main_access", "Set the member's overall access level"],
      ["uac_resources_access", "Grant granular per-resource, per-action permissions"],
    ],
  },
  "user-2fa-security": {
    doc: "user-account/updating-account-security",
    lead: "updating_account_password",
    steps: [["updating_account_password", "Account security settings"]],
  },
  // Not one of the original synthetic slots, but articles routinely ask for "where
  // the custom domain goes", and pointing that at a generic dashboard shot was
  // the weakest match in the whole set.
  "domain-aliases": {
    doc: "application-management/managing-domains-aliases",
    lead: "domain_alias_step_2",
    steps: [
      ["domain_alias_step_1", "Open Domain Management for the application"],
      ["domain_alias_step_2", "Add the apex and www domains as aliases"],
      ["domain_alias_make_primary", "Set the primary domain"],
    ],
  },
};

// Slots whose screenshots are owner-provided direct URLs (not support docs).
// slot -> { lead, steps:[[base, caption, url], ...] }
const DIRECT_SLOTS = {
  staging: {
    lead: "staging_step_1",
    steps: [
      [
        "staging_step_1",
        "Create a staging copy of your site from the Kloudbean dashboard",
        "https://www.kloudbean.com/wp-content/uploads/2026/08/Stagging-Kloudbean-Dashboard.png",
      ],
      [
        "staging_step_2",
        "Manage the staging environment and push changes to production",
        "https://www.kloudbean.com/wp-content/uploads/2026/09/Screenshot-2026-09-05-at-9.13.19-PM.png",
      ],
    ],
  },
};

// Owner: skip cloudflare entirely for now (new UI coming). cron-jobs has no doc.
const NO_MATCH = ["cloudflare", "cron-jobs"];

// framework -> deploy doc. Override the add-server (launch) + env-vars sequences.
const FRAMEWORK_DOC = {
  nextjs: "application-deployment/deploying-nextjs",
  node: "application-deployment/deploying-nodejs-multi-process",
  nodespm: "application-deployment/deploying-nodejs-single-process",
  django: "application-deployment/deploying-django",
  flask: "application-deployment/deploying-flask",
  fastapi: "application-deployment/deploying-fastapi",
  laravel: "application-deployment/deploying-laravel",
  react: "application-deployment/deploying-react",
  vue: "application-deployment/deploying-vuejs",
  angular: "application-deployment/deploying-angular",
};
// prefix per framework for the launch + env step families
const FW_PREFIX = {
  nextjs: "nextjs",
  node: "node",
  nodespm: "nodespm",
  django: "django",
  flask: "flask",
  fastapi: "fastapi",
  laravel: "laravel",
  react: "react",
  vue: "vue",
  angular: "angular",
};

const DB = {
  postgres: ["database-launch/launching-postgres", "psql"],
  mysql: ["database-launch/launching-mysql", "mysql"],
  mariadb: ["database-launch/launching-mariadb", "mariadb"],
  mongodb: ["database-launch/launching-mongodb", "mongodb"],
  redis: ["database-launch/launching-redis", "redis"],
  elasticsearch: ["database-launch/launching-elasticsearch", "es"],
};

const docCache = new Map();
async function fetchDoc(docPath) {
  if (docCache.has(docPath)) return docCache.get(docPath);
  const res = await fetch(`${BASE}/docs/${docPath}`, { headers: { "User-Agent": UA } });
  const html = await res.text();
  const map = new Map();
  for (const m of html.matchAll(/\/assets\/images\/([A-Za-z0-9_.-]+)\.(png|jpg|jpeg|webp)/g)) {
    const base = m[1].replace(/-[a-f0-9]{16,}$/, "");
    if (!map.has(base)) map.set(base, `${BASE}${m[0]}`);
  }
  docCache.set(docPath, map);
  return map;
}

const downloaded = new Map(); // base -> {local, source}
let ok = 0,
  miss = 0;
async function grabUrl(base, url) {
  if (downloaded.has(base)) return downloaded.get(base);
  const dest = `${SHOTS}/${base}.png`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    console.log(`  MISS ${base} (${res.status} ${url})`);
    miss++;
    return null;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  const rec = { local: `assets/console-real/shots/${base}.png`, source: url };
  downloaded.set(base, rec);
  ok++;
  return rec;
}

async function grab(docPath, base) {
  if (downloaded.has(base)) return downloaded.get(base);
  const map = await fetchDoc(docPath);
  const url = map.get(base);
  if (!url) {
    miss++;
    return null;
  }
  return grabUrl(base, url);
}

async function buildSeq(doc, steps) {
  const out = [];
  for (const [base, caption] of steps) {
    const rec = await grab(doc, base);
    if (rec) out.push({ base, caption, ...rec });
  }
  return out;
}

const mapping = { slots: {}, frameworks: {}, dbEngines: {}, noMatch: NO_MATCH, generatedAt: new Date().toISOString() };

console.log("Slots (sequences):");
for (const [slot, cfg] of Object.entries(SLOTS)) {
  const steps = await buildSeq(cfg.doc, cfg.steps);
  const lead = steps.find((s) => s.base === cfg.lead) ?? steps[0];
  mapping.slots[slot] = { lead, steps };
  console.log(`  ${slot}: ${steps.length} step(s), lead=${lead?.base}`);
}

console.log("Direct-URL slots (owner-provided):");
for (const [slot, cfg] of Object.entries(DIRECT_SLOTS)) {
  const steps = [];
  for (const [base, caption, url] of cfg.steps) {
    const rec = await grabUrl(base, url);
    if (rec) steps.push({ base, caption, ...rec });
  }
  if (steps.length) {
    const lead = steps.find((s) => s.base === cfg.lead) ?? steps[0];
    mapping.slots[slot] = { lead, steps };
    console.log(`  ${slot}: ${steps.length} step(s), lead=${lead.base}`);
  }
}

console.log("Framework overrides (add-server launch seq + env seq):");
for (const [fw, doc] of Object.entries(FRAMEWORK_DOC)) {
  const p = FW_PREFIX[fw];
  const launchSteps = await buildSeq(doc, [
    [`${p}_launch_step_1`, `Select cloud, choose the ${fw} application, datacenter, and size`],
    [`${p}_launch_step_2`, "Name your application and server"],
    [`${p}_launch_step_3`, `Launch; the server and ${fw} stack provision in minutes`],
  ]);
  const envSteps = await buildSeq(doc, [
    [`${p}_env_step_1`, "Open the Environment Variables editor in the console"],
  ]);
  const entry = {};
  if (launchSteps.length) entry["add-server"] = { lead: launchSteps[0], steps: launchSteps };
  if (envSteps.length) entry["env-vars"] = { lead: envSteps[0], steps: envSteps };
  mapping.frameworks[fw] = entry;
  console.log(`  ${fw}: launch=${launchSteps.length} env=${envSteps.length}`);
}

console.log("DB engine overrides (launch-database seq):");
for (const [engine, [doc, p]] of Object.entries(DB)) {
  const steps = await buildSeq(doc, [
    ["database_step_1", "Open Managed Databases and add a new database"],
    [`${p}_launch_step_1`, `Choose ${engine}, size, and region`],
    [`${p}_launch_step_2`, `The managed ${engine} is created with its own host and SSL`],
  ]);
  if (steps.length) {
    const lead = steps.find((s) => s.base === `${p}_launch_step_1`) ?? steps[0];
    mapping.dbEngines[engine] = { "launch-database": { lead, steps } };
  }
  console.log(`  ${engine}: ${steps.length} step(s)`);
}

fs.writeFileSync(`${OUT}/screenshot-map.json`, JSON.stringify(mapping, null, 2));
console.log(`\nDONE: ${ok} unique shots downloaded, ${miss} missing. Map -> ${OUT}/screenshot-map.json`);
console.log(`No real screenshot (kept synthetic): ${NO_MATCH.join(", ")}`);
