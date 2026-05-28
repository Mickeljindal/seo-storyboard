import postgres from "postgres";
import {
  connectionAttempts,
  formatKloudbeanDbError,
  getKloudbeanDbConfig,
} from "./kloudbean-db.mjs";

export async function connectDb() {
  const cfg = getKloudbeanDbConfig();
  if (!cfg) {
    throw new Error(
      "Database not configured. Set DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD from Kloudbean DBS → Administration.",
    );
  }

  let last;
  for (const attempt of connectionAttempts(cfg)) {
    const sql = postgres({
      host: attempt.host,
      port: attempt.port,
      database: attempt.database,
      user: attempt.username,
      password: attempt.password,
      max: 1,
      ssl: attempt.ssl,
      connect_timeout: 20,
    });
    try {
      await sql`SELECT 1`;
      return { sql, config: attempt };
    } catch (e) {
      last = e;
      await sql.end().catch(() => {});
    }
  }
  throw new Error(formatKloudbeanDbError(last));
}
