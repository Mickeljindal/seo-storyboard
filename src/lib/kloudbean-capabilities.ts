/**
 * KLOUDBEAN CAPABILITY GRAPH — the hard boundary of what Kloudbean can run.
 *
 * Kloudbean is LINUX-based managed cloud hosting. It runs Linux web stacks
 * (Nginx/Apache/OpenLiteSpeed, PHP-FPM), modern app runtimes (Node, Python,
 * PHP, Ruby, Go, Java), and Linux-hostable databases. It does NOT run Windows
 * Server, IIS, the .NET Framework (Windows), or MSSQL on Windows.
 *
 * Without this graph the engine generated impossible topics like
 * "Deploy Next.js on IIS Server on Kloudbean" — IIS is Windows-only.
 *
 * This module is the SINGLE SOURCE OF TRUTH for supported vs unsupported tech.
 * It feeds:
 *   - topic discovery (reject off-capability ideas before they become articles)
 *   - AI prompts (never recommend tech Kloudbean can't run)
 *   - the quality scorecard (block drafts that present unsupported tech as hostable)
 *
 * Scope can be narrowed/widened by the user via the Scope settings screen
 * (overrides persisted in .local/scope-config.json).
 */

export type CapabilityGroup =
  | "os"
  | "web_server"
  | "runtime"
  | "framework"
  | "database"
  | "app_type"
  | "tool";

export type Capability = {
  id: string;
  label: string;
  group: CapabilityGroup;
  /** terms that signal this capability in a keyword/title */
  terms: string[];
};

/** SUPPORTED — things Kloudbean can host/run/deploy. */
export const SUPPORTED_CAPABILITIES: Capability[] = [
  // OS
  { id: "linux", label: "Linux", group: "os", terms: ["linux", "ubuntu", "debian"] },
  // Web servers
  { id: "nginx", label: "Nginx", group: "web_server", terms: ["nginx"] },
  { id: "apache", label: "Apache", group: "web_server", terms: ["apache", "httpd"] },
  { id: "litespeed", label: "OpenLiteSpeed", group: "web_server", terms: ["litespeed", "openlitespeed"] },
  // Runtimes
  { id: "node", label: "Node.js", group: "runtime", terms: ["node", "node.js", "nodejs"] },
  { id: "php", label: "PHP", group: "runtime", terms: ["php", "php-fpm"] },
  { id: "python", label: "Python", group: "runtime", terms: ["python"] },
  { id: "ruby", label: "Ruby", group: "runtime", terms: ["ruby", "rails"] },
  { id: "go", label: "Go", group: "runtime", terms: ["golang", " go "] },
  { id: "java", label: "Java", group: "runtime", terms: ["java", "spring boot"] },
  // Frameworks
  { id: "react", label: "React", group: "framework", terms: ["react", "react.js"] },
  { id: "nextjs", label: "Next.js", group: "framework", terms: ["next.js", "nextjs"] },
  { id: "vue", label: "Vue", group: "framework", terms: ["vue", "vue.js", "nuxt"] },
  { id: "laravel", label: "Laravel", group: "framework", terms: ["laravel"] },
  { id: "django", label: "Django", group: "framework", terms: ["django"] },
  { id: "flask", label: "Flask", group: "framework", terms: ["flask"] },
  { id: "fastapi", label: "FastAPI", group: "framework", terms: ["fastapi"] },
  { id: "wordpress", label: "WordPress", group: "framework", terms: ["wordpress", "woocommerce"] },
  { id: "static", label: "Static / JAMstack", group: "framework", terms: ["static site", "jamstack", "astro", "gatsby", "hugo"] },
  // Databases
  { id: "mysql", label: "MySQL", group: "database", terms: ["mysql"] },
  { id: "mariadb", label: "MariaDB", group: "database", terms: ["mariadb"] },
  { id: "postgres", label: "PostgreSQL", group: "database", terms: ["postgres", "postgresql"] },
  { id: "mongodb", label: "MongoDB", group: "database", terms: ["mongodb", "mongo"] },
  { id: "redis", label: "Redis", group: "database", terms: ["redis"] },
  { id: "elasticsearch", label: "Elasticsearch", group: "database", terms: ["elasticsearch", "elastic search"] },
  { id: "memcached", label: "Memcached", group: "database", terms: ["memcached"] },
  // App types
  { id: "spa", label: "SPA / web app", group: "app_type", terms: ["single page app", "web app", "spa"] },
  { id: "api", label: "API / backend", group: "app_type", terms: ["rest api", "graphql", "backend api"] },
  { id: "pwa", label: "PWA", group: "app_type", terms: ["progressive web app", "pwa"] },
];

/**
 * NOT SUPPORTED — things Kloudbean CANNOT run. Topics that present these as
 * hostable-on-Kloudbean are factually wrong and must be rejected.
 * (Comparison/migration framing — "migrate off Windows to Linux on Kloudbean" — is allowed.)
 */
export const UNSUPPORTED_CAPABILITIES: { label: string; terms: string[]; why: string }[] = [
  { label: "Windows Server", terms: ["windows server", "windows hosting", "windows vps"], why: "Kloudbean is Linux-only managed hosting; no Windows Server." },
  { label: "IIS", terms: ["iis server", " iis ", "internet information services"], why: "IIS is a Windows-only web server; Kloudbean runs Nginx/Apache/LiteSpeed on Linux." },
  { label: ".NET Framework (Windows)", terms: [".net framework", "asp.net web forms", "vb.net"], why: "The classic Windows .NET Framework needs Windows/IIS, which Kloudbean does not provide. (Cross-platform .NET on Linux is a separate question — do not assume support.)" },
  { label: "MSSQL / SQL Server", terms: ["sql server", "mssql", "microsoft sql"], why: "Kloudbean's managed databases are MySQL, MariaDB, PostgreSQL, MongoDB, Redis, Elasticsearch and Memcached — not Microsoft SQL Server." },
  { label: "MS Access", terms: ["ms access", "microsoft access"], why: "Desktop/Windows database, not a Kloudbean managed database." },
  { label: "ColdFusion", terms: ["coldfusion"], why: "Not part of Kloudbean's supported runtimes." },
  { label: "Windows desktop apps", terms: ["windows desktop app", ".exe app", "wpf", "winforms"], why: "Kloudbean hosts web/server workloads on Linux, not Windows desktop software." },
  { label: "Plesk/cPanel control panel", terms: ["plesk", "cpanel"], why: "Kloudbean has its own console; it is not a cPanel/Plesk reseller host." },
];

const COMPARISON_FRAMING = /\b(vs|versus|alternative|compare|comparison|migrate|migration|move (from|off)|switch (from|off)|instead of|replace)\b/i;

/** Detect supported capabilities named in text. */
export function detectSupportedCapabilities(text: string): Capability[] {
  const k = ` ${text.toLowerCase()} `;
  return SUPPORTED_CAPABILITIES.filter((c) => c.terms.some((t) => k.includes(t)));
}

/** Detect unsupported tech named in text. */
export function detectUnsupportedTech(text: string): { label: string; why: string }[] {
  const k = ` ${text.toLowerCase()} `;
  return UNSUPPORTED_CAPABILITIES.filter((c) => c.terms.some((t) => k.includes(t)))
    .map((c) => ({ label: c.label, why: c.why }));
}

/**
 * Validate a topic/keyword against the capability graph.
 * ok=false when it presents unsupported tech as something to run ON Kloudbean.
 * Comparison/migration framing is allowed (that's how we win those searches).
 */
export function validateCapability(
  keyword: string,
  overrides?: ScopeOverrides,
): { ok: boolean; reason?: string } {
  const unsupported = detectUnsupportedTechWithOverrides(keyword, overrides);
  if (unsupported.length === 0) return { ok: true };
  if (COMPARISON_FRAMING.test(keyword)) return { ok: true };
  return {
    ok: false,
    reason: `Kloudbean cannot run ${unsupported.map((u) => u.label).join(", ")}. ${unsupported[0].why}`,
  };
}

/* ----------------------------- SCOPE OVERRIDES ----------------------------- */

/**
 * User-editable scope overrides (set from the Scope settings screen).
 * - disabledSupported: supported capability IDs the user wants EXCLUDED from content.
 * - extraUnsupported: extra banned terms the user adds (e.g. a product Kloudbean dropped).
 * - allowedUnsupported: terms to UN-ban (e.g. if Kloudbean adds Windows later).
 */
export type ScopeOverrides = {
  disabledSupported: string[];
  extraUnsupported: { label: string; terms: string[]; why: string }[];
  allowedUnsupported: string[]; // labels to treat as allowed again
};

export const EMPTY_OVERRIDES: ScopeOverrides = {
  disabledSupported: [],
  extraUnsupported: [],
  allowedUnsupported: [],
};

function detectUnsupportedTechWithOverrides(
  text: string,
  overrides?: ScopeOverrides,
): { label: string; why: string }[] {
  const k = ` ${text.toLowerCase()} `;
  const allowed = new Set((overrides?.allowedUnsupported ?? []).map((s) => s.toLowerCase()));
  const base = UNSUPPORTED_CAPABILITIES.filter(
    (c) => !allowed.has(c.label.toLowerCase()) && c.terms.some((t) => k.includes(t)),
  ).map((c) => ({ label: c.label, why: c.why }));
  const extra = (overrides?.extraUnsupported ?? [])
    .filter((c) => c.terms.some((t) => k.includes(t.toLowerCase())))
    .map((c) => ({ label: c.label, why: c.why }));
  return [...base, ...extra];
}

/** Build the prompt block listing what Kloudbean can and cannot run. */
export function capabilityPromptBlock(overrides?: ScopeOverrides): string {
  const allowed = new Set((overrides?.allowedUnsupported ?? []).map((s) => s.toLowerCase()));
  const disabled = new Set(overrides?.disabledSupported ?? []);
  const supported = SUPPORTED_CAPABILITIES.filter((c) => !disabled.has(c.id));
  const byGroup = (g: CapabilityGroup) => supported.filter((c) => c.group === g).map((c) => c.label).join(", ");
  const unsupported = UNSUPPORTED_CAPABILITIES.filter((c) => !allowed.has(c.label.toLowerCase()))
    .map((c) => c.label)
    .concat((overrides?.extraUnsupported ?? []).map((c) => c.label));

  return `KLOUDBEAN CAPABILITY GRAPH (HARD BOUNDARY — never recommend tech outside this):
- Kloudbean is LINUX-based managed cloud hosting. Web servers: ${byGroup("web_server")}.
- Supported runtimes: ${byGroup("runtime")}.
- Supported frameworks: ${byGroup("framework")}.
- Managed databases: ${byGroup("database")}.
- DOES NOT SUPPORT (never present as hostable on Kloudbean): ${unsupported.join(", ")}.
- Windows Server, IIS, classic .NET Framework, and MSSQL are NOT available — Kloudbean runs Linux web stacks only.
- You MAY mention unsupported tech ONLY in a migration/comparison frame ("move off Windows/IIS to a Linux stack on Kloudbean"). Never write a "deploy X on IIS/Windows on Kloudbean" tutorial.`;
}

/** Capability alignment score boost (0–4) for clearly in-scope topics. */
export function scoreCapabilityAlignment(keyword: string): number {
  const supported = detectSupportedCapabilities(keyword).length;
  const unsupported = detectUnsupportedTech(keyword).length;
  if (unsupported > 0 && !COMPARISON_FRAMING.test(keyword)) return -10; // strong penalty
  return Math.min(4, supported * 2);
}
