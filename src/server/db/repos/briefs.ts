import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../client";

const { contentBriefs } = schema;

export async function getLatestBriefVersion(articleId: string): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ version: contentBriefs.version })
    .from(contentBriefs)
    .where(eq(contentBriefs.articleId, articleId))
    .orderBy(desc(contentBriefs.version))
    .limit(1);
  return row?.version ?? 0;
}

export async function insertBrief(articleId: string, briefData: unknown, version: number, generatedBy: string) {
  const db = await getDb();
  await db.insert(contentBriefs).values({
    articleId,
    briefData,
    version,
    generatedBy,
  });
}
