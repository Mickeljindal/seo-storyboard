import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listKeywords = createServerFn({ method: "GET" })
  .inputValidator(z.object({ geo: z.string().default("sa"), limit: z.number().default(50) }).parse)
  .handler(async ({ data }) => {
    const keywordsRepo = await import("@/server/db/repos/keywords");
    return keywordsRepo.listKeywords(data.geo, data.limit);
  });
