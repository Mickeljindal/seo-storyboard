import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { formatDbError } from "./db-errors";

/**
 * Ingest the local content-studio/ folders into the engine through the app's
 * single PGlite connection (safe while the dev server is running). "upsert"
 * refreshes existing rows too; "new-only" just adds folders not yet in the DB.
 */
export const syncContentStudioFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ mode: z.enum(["upsert", "new-only"]).optional() }).optional().parse)
  .handler(async ({ data }) => {
    try {
      const { getPgliteClient } = await import("@/server/db/client");
      const { ingestContentStudio } = await import("@/server/db/ingest-content-studio");
      const client = await getPgliteClient();
      return await ingestContentStudio(client, { mode: data?.mode ?? "upsert" });
    } catch (e) {
      throw new Error(formatDbError(e));
    }
  });
