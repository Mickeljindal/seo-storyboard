import { inArray } from "drizzle-orm";
import { getDb, schema } from "../client";

const { appSettings } = schema;

/** Read one setting value (or null). */
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  try {
    const [row] = await db
      .select()
      .from(appSettings)
      .where(inArray(appSettings.key, [key]))
      .limit(1);
    return row?.value ?? null;
  } catch {
    return null;
  }
}

/** Read several settings at once → { key: value }. */
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  if (!keys.length) return {};
  const db = await getDb();
  const out: Record<string, string> = {};
  try {
    const rows = await db.select().from(appSettings).where(inArray(appSettings.key, keys));
    for (const r of rows) if (r.value != null) out[r.key] = r.value;
  } catch {
    /* table optional */
  }
  return out;
}

/** Upsert a setting. Pass null/"" to clear it. */
export async function setSetting(key: string, value: string | null): Promise<void> {
  const db = await getDb();
  await db
    .insert(appSettings)
    .values({ key, value: value ?? null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: value ?? null, updatedAt: new Date() },
    });
}

export async function setSettings(entries: Record<string, string | null>): Promise<void> {
  for (const [k, v] of Object.entries(entries)) await setSetting(k, v);
}
