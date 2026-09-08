import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { communityVenues } = schema;

/** Concrete shape so this crosses the server-function boundary as serializable. */
export type VenueRules = {
  source?: string;
  rules?: { short_name?: string; description?: string }[];
};

export type CommunityVenue = {
  id: string;
  platform: string;
  name: string;
  url: string | null;
  title: string | null;
  description: string | null;
  subscribers: number;
  active_users: number;
  over_18: boolean;
  created_utc: string | null;
  self_promo_allowed: string;
  rules: VenueRules | null;
  submission_notes: string | null;
  topical_fit: number;
  matched_terms: string[];
  opportunity: number;
  recommendation: string;
  reasoning: string | null;
  status: string;
  notes: string | null;
  last_checked_at: string | null;
};

function toApi(row: typeof communityVenues.$inferSelect): CommunityVenue {
  return {
    id: row.id,
    platform: row.platform,
    name: row.name,
    url: row.url ?? null,
    title: row.title ?? null,
    description: row.description ?? null,
    subscribers: row.subscribers ?? 0,
    active_users: row.activeUsers ?? 0,
    over_18: row.over18 ?? false,
    created_utc: row.createdUtc?.toISOString?.() ?? null,
    self_promo_allowed: row.selfPromoAllowed ?? "unknown",
    rules: (row.rules ?? null) as VenueRules | null,
    submission_notes: row.submissionNotes ?? null,
    topical_fit: Number(row.topicalFit ?? 0),
    matched_terms: row.matchedTerms ?? [],
    opportunity: Number(row.opportunity ?? 0),
    recommendation: row.recommendation ?? "watch",
    reasoning: row.reasoning ?? null,
    status: row.status,
    notes: row.notes ?? null,
    last_checked_at: row.lastCheckedAt?.toISOString?.() ?? null,
  };
}

/**
 * Insert or refresh by (platform, name). Re-checking updates the audience numbers
 * and the rules, since both change, but leaves a human's approve/reject alone.
 */
export async function upsertVenue(row: {
  platform: string;
  name: string;
  url?: string | null;
  title?: string | null;
  description?: string | null;
  subscribers?: number;
  activeUsers?: number;
  over18?: boolean;
  createdUtc?: Date | null;
  selfPromoAllowed?: string;
  rules?: VenueRules | null;
  submissionNotes?: string | null;
  topicalFit?: number;
  matchedTerms?: string[];
  opportunity?: number;
  recommendation?: string;
  reasoning?: string | null;
}): Promise<CommunityVenue> {
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(communityVenues)
    .where(
      and(
        eq(communityVenues.platform, row.platform),
        sql`lower(${communityVenues.name}) = ${row.name.toLowerCase()}`,
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(communityVenues)
      .set({
        url: row.url ?? existing.url,
        title: row.title ?? existing.title,
        description: row.description ?? existing.description,
        subscribers: row.subscribers ?? existing.subscribers,
        activeUsers: row.activeUsers ?? existing.activeUsers,
        selfPromoAllowed: row.selfPromoAllowed ?? existing.selfPromoAllowed,
        rules: row.rules ?? existing.rules,
        submissionNotes: row.submissionNotes ?? existing.submissionNotes,
        topicalFit: row.topicalFit != null ? String(row.topicalFit) : existing.topicalFit,
        matchedTerms: row.matchedTerms ?? existing.matchedTerms,
        opportunity: row.opportunity != null ? String(row.opportunity) : existing.opportunity,
        // A human's verdict outranks a fresh score.
        recommendation:
          existing.status === "new" ? (row.recommendation ?? existing.recommendation) : existing.recommendation,
        reasoning: existing.status === "new" ? (row.reasoning ?? existing.reasoning) : existing.reasoning,
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(communityVenues.id, existing.id))
      .returning();
    return toApi(updated);
  }

  const [inserted] = await db
    .insert(communityVenues)
    .values({
      platform: row.platform,
      name: row.name,
      url: row.url ?? null,
      title: row.title ?? null,
      description: row.description ?? null,
      subscribers: row.subscribers ?? 0,
      activeUsers: row.activeUsers ?? 0,
      over18: row.over18 ?? false,
      createdUtc: row.createdUtc ?? null,
      selfPromoAllowed: row.selfPromoAllowed ?? "unknown",
      rules: row.rules ?? null,
      submissionNotes: row.submissionNotes ?? null,
      topicalFit: row.topicalFit != null ? String(row.topicalFit) : "0",
      matchedTerms: row.matchedTerms ?? [],
      opportunity: row.opportunity != null ? String(row.opportunity) : "0",
      recommendation: row.recommendation ?? "watch",
      reasoning: row.reasoning ?? null,
      lastCheckedAt: new Date(),
    })
    .returning();
  return toApi(inserted);
}

export async function listVenues(opts?: {
  platform?: string;
  recommendation?: string;
  status?: string;
  limit?: number;
}): Promise<CommunityVenue[]> {
  const db = await getDb();
  let q = db.select().from(communityVenues).$dynamic();
  const where = [];
  if (opts?.platform) where.push(eq(communityVenues.platform, opts.platform));
  if (opts?.recommendation) where.push(eq(communityVenues.recommendation, opts.recommendation));
  if (opts?.status) where.push(eq(communityVenues.status, opts.status));
  if (where.length) q = q.where(where.length === 1 ? where[0] : and(...where));
  q = q.orderBy(desc(communityVenues.opportunity));
  if (opts?.limit) q = q.limit(opts.limit);
  const rows = await q;
  return rows.map(toApi);
}

export async function updateVenueStatus(
  id: string,
  status: string,
  notes?: string,
): Promise<void> {
  const db = await getDb();
  await db
    .update(communityVenues)
    .set({ status, notes, updatedAt: new Date() })
    .where(eq(communityVenues.id, id));
}

export async function countVenues(recommendation?: string): Promise<number> {
  const db = await getDb();
  try {
    let q = db.select({ c: sql<number>`count(*)::int` }).from(communityVenues).$dynamic();
    if (recommendation) q = q.where(eq(communityVenues.recommendation, recommendation));
    const [r] = await q;
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

/**
 * The communities worth acting on: everything recommended for posting or
 * participating, best first. This is what the thread listener should target
 * instead of a hardcoded list.
 */
export async function activeVenueNames(platform = "reddit"): Promise<string[]> {
  const db = await getDb();
  try {
    const rows = await db
      .select({ name: communityVenues.name })
      .from(communityVenues)
      .where(
        and(
          eq(communityVenues.platform, platform),
          sql`${communityVenues.recommendation} IN ('post','participate')`,
          sql`${communityVenues.status} <> 'rejected'`,
        ),
      )
      .orderBy(desc(communityVenues.opportunity));
    return rows.map((r) => r.name);
  } catch {
    return [];
  }
}
