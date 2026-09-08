import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { linkProspects } = schema;

export type LinkProspect = {
  id: string;
  domain: string;
  homepage_url: string | null;
  authority: number;
  refdomain_backlinks: number;
  country: string | null;
  links_to: string[];
  rival_count: number;
  link_count: number;
  best_source_url: string | null;
  best_source_title: string | null;
  best_anchor: string | null;
  best_target_url: string | null;
  has_lost_link: boolean;
  domain_class: string;
  opportunity_type: string;
  reject_reason: string | null;
  is_live: boolean | null;
  language: string | null;
  accepts_guest_posts: boolean | null;
  guidelines_url: string | null;
  contact_page_url: string | null;
  vetted_at: string | null;
  contact_email: string | null;
  contact_name: string | null;
  contact_source: string | null;
  contact_confidence: number;
  our_target_slug: string | null;
  pitch_angle: string | null;
  value_score: number;
  spam_score: number;
  status: string;
  prospect_id: string | null;
  won_url: string | null;
  notes: string | null;
  created_at: string;
  /** v26 outcome tracking. link_found null = not checked yet, false = checked and absent. */
  link_found: boolean | null;
  link_found_at: string | null;
  link_lost_at: string | null;
  link_is_followed: boolean | null;
  link_anchor: string | null;
  last_checked_at: string | null;
  check_count: number;
  campaign_name: string | null;
  /**
   * v27. Which recipe found this row, and whatever that recipe knew that the
   * backlink-shaped columns cannot hold. Carried through to the API because the
   * pitch drafter reads both to choose its wording, and the follow-up rebuilds its
   * input from this row rather than from memory.
   */
  source_recipe: string | null;
  recipe_run_id: string | null;
  /**
   * Deliberately typed as flat, JSON-safe values rather than `unknown`.
   *
   * Two reasons. Everything a recipe records IS a flat scalar (a URL, a title, a
   * rival's name, a query, a boolean), so this is an honest description rather than
   * a restriction. And `Record<string, unknown>` is not assignable to the server
   * function layer's serializable constraint, so using it broke the return type of
   * three separate server functions and cascaded thirty type errors into the UI
   * that reads them.
   */
  recipe_evidence: RecipeEvidence | null;
};

/** Flat, JSON-safe facts a recipe recorded about how it found a prospect. */
export type RecipeEvidence = Record<string, string | number | boolean | null>;

function toApi(row: typeof linkProspects.$inferSelect): LinkProspect {
  return {
    id: row.id,
    domain: row.domain,
    homepage_url: row.homepageUrl ?? null,
    authority: Number(row.authority ?? 0),
    refdomain_backlinks: Number(row.refdomainBacklinks ?? 0),
    country: row.country ?? null,
    links_to: row.linksTo ?? [],
    rival_count: Number(row.rivalCount ?? 0),
    link_count: Number(row.linkCount ?? 0),
    best_source_url: row.bestSourceUrl ?? null,
    best_source_title: row.bestSourceTitle ?? null,
    best_anchor: row.bestAnchor ?? null,
    best_target_url: row.bestTargetUrl ?? null,
    has_lost_link: row.hasLostLink ?? false,
    domain_class: row.domainClass ?? "unknown",
    opportunity_type: row.opportunityType ?? "unknown",
    reject_reason: row.rejectReason ?? null,
    is_live: row.isLive ?? null,
    language: row.language ?? null,
    accepts_guest_posts: row.acceptsGuestPosts ?? null,
    guidelines_url: row.guidelinesUrl ?? null,
    contact_page_url: row.contactPageUrl ?? null,
    vetted_at: row.vettedAt?.toISOString?.() ?? null,
    contact_email: row.contactEmail ?? null,
    contact_name: row.contactName ?? null,
    contact_source: row.contactSource ?? null,
    contact_confidence: Number(row.contactConfidence ?? 0),
    our_target_slug: row.ourTargetSlug ?? null,
    pitch_angle: row.pitchAngle ?? null,
    value_score: Number(row.valueScore ?? 0),
    spam_score: Number(row.spamScore ?? 0),
    status: row.status,
    prospect_id: row.prospectId ?? null,
    won_url: row.wonUrl ?? null,
    notes: row.notes ?? null,
    created_at: row.createdAt?.toISOString?.() ?? "",
    link_found: row.linkFound ?? null,
    link_found_at: row.linkFoundAt?.toISOString?.() ?? null,
    link_lost_at: row.linkLostAt?.toISOString?.() ?? null,
    link_is_followed: row.linkIsFollowed ?? null,
    link_anchor: row.linkAnchor ?? null,
    last_checked_at: row.lastCheckedAt?.toISOString?.() ?? null,
    check_count: Number(row.checkCount ?? 0),
    campaign_name: row.campaignName ?? null,
    source_recipe: row.sourceRecipe ?? null,
    recipe_run_id: row.recipeRunId ?? null,
    recipe_evidence: (row.recipeEvidence as RecipeEvidence | null) ?? null,
  };
}

export type LinkProspectUpsert = {
  domain: string;
  homepageUrl?: string | null;
  authority?: number;
  refdomainBacklinks?: number;
  country?: string | null;
  ipAddress?: string | null;
  linksTo?: string[];
  rivalCount?: number;
  linkCount?: number;
  bestSourceUrl?: string | null;
  bestSourceTitle?: string | null;
  bestAnchor?: string | null;
  bestTargetUrl?: string | null;
  firstSeen?: string | null;
  lastSeen?: string | null;
  hasLostLink?: boolean;
  domainClass?: string;
  opportunityType?: string;
  rejectReason?: string | null;
  valueScore?: number;
  spamScore?: number;
  status?: string;
  ourTargetSlug?: string | null;
  pitchAngle?: string | null;
};

/**
 * Insert or refresh by domain.
 *
 * Re-mining a fresh export must never undo human work or lose the crawler's
 * findings, so anything discovered later (contact, vetting, pitch, workflow
 * status) is left alone here. Only the facts that come from the export itself are
 * overwritten. Without this rule, a second mining run would quietly reset every
 * contacted prospect back to 'new' and the system would email people twice.
 */
export async function upsertLinkProspect(row: LinkProspectUpsert): Promise<LinkProspect> {
  const db = await getDb();
  const domain = row.domain.trim().toLowerCase();

  const [existing] = await db
    .select()
    .from(linkProspects)
    .where(sql`lower(${linkProspects.domain}) = ${domain}`)
    .limit(1);

  if (existing) {
    // A domain a human has already acted on keeps its status.
    const humanTouched = [
      "queued", "contacted", "replied", "won", "lost", "suppressed",
    ].includes(existing.status);

    const [updated] = await db
      .update(linkProspects)
      .set({
        homepageUrl: row.homepageUrl ?? existing.homepageUrl,
        authority: row.authority ?? existing.authority,
        refdomainBacklinks: row.refdomainBacklinks ?? existing.refdomainBacklinks,
        country: row.country ?? existing.country,
        ipAddress: row.ipAddress ?? existing.ipAddress,
        linksTo: row.linksTo ?? existing.linksTo,
        rivalCount: row.rivalCount ?? existing.rivalCount,
        linkCount: row.linkCount ?? existing.linkCount,
        bestSourceUrl: row.bestSourceUrl ?? existing.bestSourceUrl,
        bestSourceTitle: row.bestSourceTitle ?? existing.bestSourceTitle,
        bestAnchor: row.bestAnchor ?? existing.bestAnchor,
        bestTargetUrl: row.bestTargetUrl ?? existing.bestTargetUrl,
        firstSeen: row.firstSeen ?? existing.firstSeen,
        lastSeen: row.lastSeen ?? existing.lastSeen,
        hasLostLink: row.hasLostLink ?? existing.hasLostLink,
        domainClass: row.domainClass ?? existing.domainClass,
        opportunityType: row.opportunityType ?? existing.opportunityType,
        rejectReason: row.rejectReason ?? existing.rejectReason,
        valueScore: row.valueScore != null ? String(row.valueScore) : existing.valueScore,
        spamScore: row.spamScore != null ? String(row.spamScore) : existing.spamScore,
        status: humanTouched ? existing.status : (row.status ?? existing.status),
        updatedAt: new Date(),
      })
      .where(eq(linkProspects.id, existing.id))
      .returning();
    return toApi(updated);
  }

  const [inserted] = await db
    .insert(linkProspects)
    .values({
      domain,
      homepageUrl: row.homepageUrl ?? `https://${domain}/`,
      authority: row.authority ?? 0,
      refdomainBacklinks: row.refdomainBacklinks ?? 0,
      country: row.country ?? null,
      ipAddress: row.ipAddress ?? null,
      linksTo: row.linksTo ?? [],
      rivalCount: row.rivalCount ?? 0,
      linkCount: row.linkCount ?? 0,
      bestSourceUrl: row.bestSourceUrl ?? null,
      bestSourceTitle: row.bestSourceTitle ?? null,
      bestAnchor: row.bestAnchor ?? null,
      bestTargetUrl: row.bestTargetUrl ?? null,
      firstSeen: row.firstSeen ?? null,
      lastSeen: row.lastSeen ?? null,
      hasLostLink: row.hasLostLink ?? false,
      domainClass: row.domainClass ?? "unknown",
      opportunityType: row.opportunityType ?? "unknown",
      rejectReason: row.rejectReason ?? null,
      valueScore: String(row.valueScore ?? 0),
      spamScore: String(row.spamScore ?? 0),
      status: row.status ?? "new",
      ourTargetSlug: row.ourTargetSlug ?? null,
      pitchAngle: row.pitchAngle ?? null,
    })
    .returning();
  return toApi(inserted);
}

/** Bulk insert for the miner. Far faster than one upsert per domain. */
export async function insertLinkProspectsIgnoringDuplicates(
  rows: LinkProspectUpsert[],
): Promise<number> {
  if (!rows.length) return 0;
  const db = await getDb();
  let inserted = 0;
  const CHUNK = 250;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK).map((row) => ({
      domain: row.domain.trim().toLowerCase(),
      homepageUrl: row.homepageUrl ?? `https://${row.domain.trim().toLowerCase()}/`,
      authority: row.authority ?? 0,
      refdomainBacklinks: row.refdomainBacklinks ?? 0,
      country: row.country ?? null,
      ipAddress: row.ipAddress ?? null,
      linksTo: row.linksTo ?? [],
      rivalCount: row.rivalCount ?? 0,
      linkCount: row.linkCount ?? 0,
      bestSourceUrl: row.bestSourceUrl ?? null,
      bestSourceTitle: row.bestSourceTitle ?? null,
      bestAnchor: row.bestAnchor ?? null,
      bestTargetUrl: row.bestTargetUrl ?? null,
      firstSeen: row.firstSeen ?? null,
      lastSeen: row.lastSeen ?? null,
      hasLostLink: row.hasLostLink ?? false,
      domainClass: row.domainClass ?? "unknown",
      opportunityType: row.opportunityType ?? "unknown",
      rejectReason: row.rejectReason ?? null,
      valueScore: String(row.valueScore ?? 0),
      spamScore: String(row.spamScore ?? 0),
      status: row.status ?? "new",
    }));
    const res = await db.insert(linkProspects).values(chunk).onConflictDoNothing().returning({
      id: linkProspects.id,
    });
    inserted += res.length;
  }
  return inserted;
}

export async function listLinkProspects(opts?: {
  status?: string;
  statuses?: string[];
  opportunityType?: string;
  domainClass?: string;
  minValue?: number;
  needsContact?: boolean;
  hasContact?: boolean;
  limit?: number;
}): Promise<LinkProspect[]> {
  const db = await getDb();
  let q = db.select().from(linkProspects).$dynamic();
  const where = [];
  if (opts?.status) where.push(eq(linkProspects.status, opts.status));
  if (opts?.statuses?.length) where.push(inArray(linkProspects.status, opts.statuses));
  if (opts?.opportunityType) where.push(eq(linkProspects.opportunityType, opts.opportunityType));
  if (opts?.domainClass) where.push(eq(linkProspects.domainClass, opts.domainClass));
  if (opts?.minValue != null) {
    where.push(sql`${linkProspects.valueScore} >= ${String(opts.minValue)}`);
  }
  if (opts?.needsContact) where.push(isNull(linkProspects.contactEmail));
  if (opts?.hasContact) where.push(sql`${linkProspects.contactEmail} IS NOT NULL`);
  if (where.length) q = q.where(where.length === 1 ? where[0] : and(...where));
  q = q.orderBy(desc(linkProspects.valueScore));
  if (opts?.limit) q = q.limit(opts.limit);
  return (await q).map(toApi);
}

export async function getLinkProspectById(id: string): Promise<LinkProspect | null> {
  const db = await getDb();
  const [row] = await db.select().from(linkProspects).where(eq(linkProspects.id, id)).limit(1);
  return row ? toApi(row) : null;
}

/** Record what the crawler learned by actually fetching the site. */
export async function saveVetting(
  id: string,
  v: {
    isLive?: boolean;
    language?: string | null;
    acceptsGuestPosts?: boolean | null;
    guidelinesUrl?: string | null;
    contactPageUrl?: string | null;
    contactEmail?: string | null;
    contactName?: string | null;
    contactSource?: string | null;
    contactConfidence?: number;
    valueScore?: number;
    status?: string;
    opportunityType?: string;
    rejectReason?: string | null;
    notes?: string | null;
  },
): Promise<void> {
  const db = await getDb();
  await db
    .update(linkProspects)
    .set({
      isLive: v.isLive,
      language: v.language,
      acceptsGuestPosts: v.acceptsGuestPosts,
      guidelinesUrl: v.guidelinesUrl,
      contactPageUrl: v.contactPageUrl,
      contactEmail: v.contactEmail,
      contactName: v.contactName,
      contactSource: v.contactSource,
      contactConfidence: v.contactConfidence != null ? String(v.contactConfidence) : undefined,
      valueScore: v.valueScore != null ? String(v.valueScore) : undefined,
      status: v.status,
      opportunityType: v.opportunityType,
      rejectReason: v.rejectReason,
      notes: v.notes,
      vettedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(linkProspects.id, id));
}

export async function savePitchPlan(
  id: string,
  v: { ourTargetSlug?: string | null; pitchAngle?: string | null; status?: string },
): Promise<void> {
  const db = await getDb();
  await db
    .update(linkProspects)
    .set({
      ourTargetSlug: v.ourTargetSlug,
      pitchAngle: v.pitchAngle,
      status: v.status,
      updatedAt: new Date(),
    })
    .where(eq(linkProspects.id, id));
}

export async function updateLinkProspectStatus(
  id: string,
  status: string,
  extra?: { prospectId?: string | null; wonUrl?: string | null; notes?: string | null },
): Promise<void> {
  const db = await getDb();
  await db
    .update(linkProspects)
    .set({
      status,
      prospectId: extra?.prospectId,
      wonUrl: extra?.wonUrl,
      notes: extra?.notes,
      updatedAt: new Date(),
    })
    .where(eq(linkProspects.id, id));
}

/** Link a mined domain to the sales-side prospect row that carries the email. */
export async function attachProspect(id: string, prospectId: string): Promise<void> {
  const db = await getDb();
  await db
    .update(linkProspects)
    .set({ prospectId, updatedAt: new Date() })
    .where(eq(linkProspects.id, id));
}

export async function countLinkProspects(status?: string): Promise<number> {
  const db = await getDb();
  try {
    let q = db.select({ c: sql<number>`count(*)::int` }).from(linkProspects).$dynamic();
    if (status) q = q.where(eq(linkProspects.status, status));
    const [r] = await q;
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

/** The pipeline board: counts by status, type and class in one round trip. */
export async function linkPipelineSummary(): Promise<{
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byClass: Record<string, number>;
  total: number;
  withContact: number;
  actionable: number;
}> {
  const db = await getDb();
  const out = {
    byStatus: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    byClass: {} as Record<string, number>,
    total: 0,
    withContact: 0,
    actionable: 0,
  };
  try {
    const s: any = await db.execute(
      `select status, count(*)::int as c from link_prospects group by status`,
    );
    for (const r of s.rows ?? s) out.byStatus[r.status] = Number(r.c);
    const t: any = await db.execute(
      `select opportunity_type as k, count(*)::int as c from link_prospects
        where status <> 'rejected' group by opportunity_type`,
    );
    for (const r of t.rows ?? t) out.byType[r.k] = Number(r.c);
    const c: any = await db.execute(
      `select domain_class as k, count(*)::int as c from link_prospects group by domain_class`,
    );
    for (const r of c.rows ?? c) out.byClass[r.k] = Number(r.c);
    const agg: any = await db.execute(
      `select count(*)::int as total,
              count(contact_email)::int as with_contact,
              count(*) filter (where status in ('new','needs_contact','ready','queued'))::int as actionable
         from link_prospects`,
    );
    const a = (agg.rows ?? agg)[0] ?? {};
    out.total = Number(a.total ?? 0);
    out.withContact = Number(a.with_contact ?? 0);
    out.actionable = Number(a.actionable ?? 0);
  } catch {
    /* table optional */
  }
  return out;
}
