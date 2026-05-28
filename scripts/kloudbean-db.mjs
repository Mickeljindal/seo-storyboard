/**
 * Kloudbean DBS connection helper for setup scripts
 * @see https://support.kloudbean.com/docs/database-launch/launching-postgres
 */

export function getKloudbeanDbConfig() {
  const host = process.env.DATABASE_HOST?.trim();
  const port = Number(process.env.DATABASE_PORT || 5432);
  const database = process.env.DATABASE_NAME?.trim();
  const username = process.env.DATABASE_USER?.trim();
  const password = process.env.DATABASE_PASSWORD?.trim();

  if (host && database && username && password) {
    return {
      host,
      port: port || 5432,
      database,
      username,
      password,
      ssl: process.env.DATABASE_SSL === "true" ? "require" : false,
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

export function connectionAttempts(cfg) {
  const hosts = [cfg.host];
  const fallback = process.env.DATABASE_FALLBACK_HOST?.trim();
  if (fallback && fallback !== cfg.host) hosts.push(fallback);

  const sslModes = [cfg.ssl];
  if (!sslModes.includes(false)) sslModes.push(false);
  if (!sslModes.includes("prefer")) sslModes.push("prefer");
  if (!sslModes.includes("require")) sslModes.push("require");

  const attempts = [];
  for (const host of hosts) {
    for (const ssl of sslModes) {
      attempts.push({ ...cfg, host, ssl });
    }
  }
  return attempts;
}

export const KLOUDBEAN_DB_ACCESS_HELP =
  "Kloudbean → DBS → Access tab → whitelist your IP. Docs: https://support.kloudbean.com/docs/database-launch/launching-postgres";

export function formatKloudbeanDbError(err) {
  const msg = String(err?.message ?? err);
  if (/ENOTFOUND/i.test(msg)) return `${msg}. Use Host from Kloudbean Administration or DATABASE_FALLBACK_HOST.`;
  if (/ECONNREFUSED|ETIMEDOUT/i.test(msg)) return `${msg}. Whitelist your IP in Kloudbean DBS → Access.`;
  if (/password|authentication/i.test(msg)) return `${msg}. Check Master User + password from Administration page.`;
  return `${msg}. ${KLOUDBEAN_DB_ACCESS_HELP}`;
}
