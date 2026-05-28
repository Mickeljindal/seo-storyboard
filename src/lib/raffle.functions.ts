import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { formatDbError } from "./db-errors";

export const getRafflePool = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        cluster: z.string().optional(),
        anchor: z.string().optional(),
        excludeWritten: z.boolean().optional(),
      })
      .parse,
  )
  .handler(async ({ data }) => {
    try {
      const articlesRepo = await import("@/server/db/repos/articles");
      return await articlesRepo.listRafflePool({
        clusterId: data.cluster && data.cluster !== "all" ? Number(data.cluster) : undefined,
        anchor: data.anchor && data.anchor !== "all" ? data.anchor : undefined,
        statusIdea: data.excludeWritten,
      });
    } catch (e) {
      throw new Error(formatDbError(e));
    }
  });

export const logRaffleDraw = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        draw_count: z.number(),
        filters: z.unknown(),
        picked_ids: z.array(z.string().uuid()),
      })
      .parse,
  )
  .handler(async ({ data }) => {
    const raffleRepo = await import("@/server/db/repos/raffle");
    await raffleRepo.insertRaffleDraw(data);
    return { ok: true };
  });
