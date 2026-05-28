import { getDb, schema } from "../client";

const { raffleDraws } = schema;

export async function insertRaffleDraw(data: {
  draw_count: number;
  filters: unknown;
  picked_ids: string[];
}) {
  const db = await getDb();
  await db.insert(raffleDraws).values({
    drawCount: data.draw_count,
    filters: data.filters,
    pickedIds: data.picked_ids,
  });
}
