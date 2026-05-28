/**
 * Kloudbean Managed PostgreSQL connection
 * @see https://support.kloudbean.com/docs/database-launch/launching-postgres
 *
 * Copy Host, Port, Database Name, Master User, and Password from:
 * Kloudbean → DBS → [your database] → Administration
 *
 * Access is OFF by default — whitelist your IP under Access → Database Specifications
 * (do not enable public access unless required).
 */

export type KloudbeanDbConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: false | "require" | "prefer";
};

function parseSslEnv(val: string | undefined): false | "require" | "prefer" {
  if (!val || val === "false" || val === "0") return false;
  if (val === "prefer") return "prefer";
  if (val === "true" || val === "require") return "require";
  return false;
}

/** Build config from Kloudbean panel fields or DATABASE_URL. */
export function getKloudbeanDbConfig(): KloudbeanDbConfig | null {
  const host = process.env.DATABASE_HOST?.trim();
  const port = Number(process.env.DATABASE_PORT || 5432);
  const database = process.env.DATABASE_NAME?.trim();
  // Panel label: "Master User"
  const username = (process.env.DATABASE_USER ?? process.env.DATABASE_MASTER_USER)?.trim();
  const password = process.env.DATABASE_PASSWORD?.trim();

  if (host && database && username && password) {
    return {
      host,
      port: port || 5432,
      database,
      username,
      password,
      ssl: parseSslEnv(process.env.DATABASE_SSL),
    };
  }

  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;

  try {
    const parsed = new URL(url.replace(/^postgresql:/, "http:"));
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 5432,
      database: parsed.pathname.replace(/^\//, "") || "postgres",
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      ssl: /sslmode=require/i.test(url) ? "require" : false,
    };
  } catch {
    return null;
  }
}

/** Standard Kloudbean connection string (no sslmode unless DATABASE_SSL=true). */
export function toConnectionString(cfg: KloudbeanDbConfig): string {
  const user = encodeURIComponent(cfg.username);
  const pass = encodeURIComponent(cfg.password);
  const base = `postgresql://${user}:${pass}@${cfg.host}:${cfg.port}/${cfg.database}`;
  return cfg.ssl === "require" ? `${base}?sslmode=require` : base;
}

/** Try hostname/IP × SSL modes (Kloudbean may require SSL even with public access). */
export function connectionAttempts(cfg: KloudbeanDbConfig): KloudbeanDbConfig[] {
  const hosts = [cfg.host];
  const fallback = process.env.DATABASE_FALLBACK_HOST?.trim();
  if (fallback && fallback !== cfg.host) hosts.push(fallback);

  const sslModes: Array<false | "prefer" | "require"> = [cfg.ssl];
  if (!sslModes.includes(false)) sslModes.push(false);
  if (!sslModes.includes("prefer")) sslModes.push("prefer");
  if (!sslModes.includes("require")) sslModes.push("require");

  const attempts: KloudbeanDbConfig[] = [];
  for (const host of hosts) {
    for (const ssl of sslModes) {
      attempts.push({ ...cfg, host, ssl });
    }
  }
  return attempts;
}

/** postgres.js options — `user` matches Kloudbean/pg Pool docs. */
export function postgresOptions(cfg: KloudbeanDbConfig) {
  return {
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    user: cfg.username,
    password: cfg.password,
    max: 10,
    ssl: cfg.ssl,
    connect_timeout: 20,
    idle_timeout: 20,
  };
}

/** For db:check — maps env vars to Kloudbean Administration labels. */
export function describeDbConfig(cfg: KloudbeanDbConfig) {
  return {
    "Administration → Host": cfg.host,
    "Administration → Port": String(cfg.port),
    "Administration → Database Name": cfg.database,
    "Administration → Master User": cfg.username,
    "Administration → Password": cfg.password ? "(set)" : "(missing)",
    SSL: String(cfg.ssl),
  };
}

export function isLocalDatabase(cfg?: KloudbeanDbConfig | null): boolean {
  const c = cfg ?? getKloudbeanDbConfig();
  return c?.host === "127.0.0.1" || c?.host === "localhost";
}

export function kloudbeanAccessHelp(): string {
  const cfg = getKloudbeanDbConfig();
  if (cfg && isLocalDatabase(cfg)) {
    return "Local Postgres — run: npm run db:up (Docker) then npm run setup";
  }
  const publicAccess = process.env.DATABASE_PUBLIC_ACCESS === "true";
  if (publicAccess) {
    return [
      "Public access is ON — IP whitelist not required",
      "Copy Host, Port, Database Name, Master User, Password from DBS → Access tab (not Firewall)",
      "Instance name on dashboard (e.g. Kloudbean) may differ from Database Name in credentials",
    ].join(" · ");
  }
  return [
    "Kloudbean → DBS → Access tab → whitelist your IP, or enable public access under Firewall",
    "Copy credentials from Access tab: Host, Port, Database Name, Master User, Password",
  ].join(" · ");
}

export const KLOUDBEAN_DB_ACCESS_HELP = kloudbeanAccessHelp();

export function formatKloudbeanDbError(err: unknown): string {
  const msg = String((err as Error)?.message ?? err);
  if (/ENOTFOUND/i.test(msg)) {
    return `${msg}. Host not found — use Host from Kloudbean Administration, or set DATABASE_FALLBACK_HOST to the panel IP.`;
  }
  if (/ECONNREFUSED|ETIMEDOUT|timeout/i.test(msg)) {
    const hint =
      process.env.DATABASE_PUBLIC_ACCESS === "true"
        ? "Public access is on — verify Host/Port/User/Password from DBS → Access tab match .env exactly."
        : "Enable public access (Firewall) or whitelist your IP (Access tab).";
    return `${msg}. ${hint}`;
  }
  if (/password|authentication/i.test(msg)) {
    return `${msg}. Wrong Master User or password — copy from Kloudbean Administration page.`;
  }
  return `${msg}. ${kloudbeanAccessHelp()}`;
}
