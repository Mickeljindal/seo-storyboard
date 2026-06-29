import { desc, gte, sql } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiConversion, type ApiConversion } from "../map";

const { conversions } = schema;

export type NewConversion = {
  event?: string;
  sourceUrl?: string | null;
  sourceSlug?: string | null;
  surface?: string | null;
  articleId?: string | null;
  toolId?: string | null;
  clusterId?: number | null;
  ref?: string | null;
  plan?: string | null;
  value?: number | null;
  currency?: string | null;
  externalId?: string | null;
  meta?: unknown;
  occurredAt?: Date | null;
};

/** Insert conversions, skipping any with a duplicate external_id. Returns inserted count. */
export async function insertConversions(rows: NewConversion[]): Promise<number> {
  if (!rows.length) return 0;
  const db = await getDb();
  let inserted = 0;
  for (const r of rows) {
    try {
      const res = await db
        .insert(conversions)
        .values({
          event: r.event ?? "signup",
          sourceUrl: r.sourceUrl ?? null,
          sourceSlug: r.sourceSlug ?? null,
          surface: r.surface ?? "unknown",
          articleId: r.articleId ?? null,
          toolId: r.toolId ?? null,
          clusterId: r.clusterId ?? null,
          ref: r.ref ?? null,
          plan: r.plan ?? null,
          value: r.value != null ? String(r.value) : null,
          currency: r.currency ?? "USD",
          externalId: r.externalId ?? null,
          meta: r.meta ?? null,
          occurredAt: r.occurredAt ?? null,
        })
        .onConflictDoNothing()
        .returning({ id: conversions.id });
      inserted += res.length;
    } catch {
      /* dupe / optional */
    }
  }
  return inserted;
}

export async function listConversions(limit = 100): Promise<ApiConversion[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(conversions)
    .orderBy(desc(conversions.createdAt))
    .limit(limit);
  return rows.map(toApiConversion);
}

export type ConversionSummary = {
  total: number;
  signups: number;
  paid: number;
  value: number;
  currency: string;
  bySource: { source: string; surface: string; signups: number; paid: number; value: number }[];
  byCluster: Record<number, { signups: number; paid: number; value: number }>;
};

export async function conversionSummary(days = 90): Promise<ConversionSummary> {
  const db = await getDb();
  const since = new Date(Date.now() - days * 86400_000);
  const rows = await db.select().from(conversions).where(gte(conversions.createdAt, since));

  const bySourceMap = new Map<
    string,
    { source: string; surface: string; signups: number; paid: number; value: number }
  >();
  const byCluster: Record<number, { signups: number; paid: number; value: number }> = {};
  let signups = 0;
  let paid = 0;
  let value = 0;
  let currency = "USD";

  for (const r of rows) {
    const v = r.value != null ? Number(r.value) : 0;
    value += v;
    if (r.currency) currency = r.currency;
    const isPaid = r.event === "paid";
    const isSignup = r.event === "signup" || r.event === "lead";
    if (isPaid) paid++;
    if (isSignup) signups++;

    const key = (r.sourceSlug || r.sourceUrl || "unknown") + "|" + (r.surface || "unknown");
    const s = bySourceMap.get(key) ?? {
      source: r.sourceSlug || r.sourceUrl || "unknown",
      surface: r.surface || "unknown",
      signups: 0,
      paid: 0,
      value: 0,
    };
    if (isPaid) s.paid++;
    if (isSignup) s.signups++;
    s.value += v;
    bySourceMap.set(key, s);

    if (r.clusterId != null) {
      const c = (byCluster[r.clusterId] ??= { signups: 0, paid: 0, value: 0 });
      if (isPaid) c.paid++;
      if (isSignup) c.signups++;
      c.value += v;
    }
  }

  const bySource = [...bySourceMap.values()]
    .sort((a, b) => b.paid - a.paid || b.signups - a.signups || b.value - a.value)
    .slice(0, 25);

  return {
    total: rows.length,
    signups,
    paid,
    value: Number(value.toFixed(2)),
    currency,
    bySource,
    byCluster,
  };
}

/**
 * Conversion reward per cluster for the learning model — the ultimate outcome.
 * Caller passes a scorer so we avoid a circular import with learning-ranker.
 */
export async function getConversionRewardByCluster(
  scorer: (c: { signups: number; paid: number; value: number }) => number,
): Promise<Record<number, { avgReward: number; n: number }>> {
  const db = await getDb();
  const out: Record<number, { avgReward: number; n: number }> = {};
  try {
    const rows = await db.select().from(conversions);
    const byCluster: Record<number, { signups: number; paid: number; value: number }> = {};
    for (const r of rows) {
      if (r.clusterId == null) continue;
      const c = (byCluster[r.clusterId] ??= { signups: 0, paid: 0, value: 0 });
      const v = r.value != null ? Number(r.value) : 0;
      if (r.event === "paid") c.paid++;
      else if (r.event === "signup" || r.event === "lead") c.signups++;
      c.value += v;
    }
    for (const [cid, c] of Object.entries(byCluster)) {
      out[Number(cid)] = { avgReward: scorer(c), n: c.signups + c.paid };
    }
  } catch {
    /* optional */
  }
  return out;
}

export async function countConversions(): Promise<number> {
  const db = await getDb();
  try {
    const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(conversions);
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}
