import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server functions for the Entity Distribution tracker (roadmap #7).
 */

export const entityDistributionFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const repo = await import("@/server/db/repos/entity-assets");
  const { canonicalEntityFacts } = await import("./entity-distribution");
  const [assets, summary] = await Promise.all([
    repo.listEntityAssets(),
    repo.entityDistributionSummary(),
  ]);
  return { assets, summary, facts: canonicalEntityFacts() };
});

export const seedEntityDistributionFn = createServerFn({ method: "POST" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { seedEntityDistribution } = await import("./entity-distribution");
  const seeded = await seedEntityDistribution();
  return { ok: true, seeded };
});

export const upsertEntityAssetFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid().optional(),
      platform: z.string().min(1),
      assetType: z.string().default("listing"),
      name: z.string().min(1),
      url: z.string().url().nullable().optional(),
      status: z.enum(["todo", "in_progress", "live", "verified"]).default("todo"),
      priority: z.number().min(1).max(3).default(2),
      notes: z.string().nullable().optional(),
      nameConsistent: z.boolean().nullable().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const repo = await import("@/server/db/repos/entity-assets");
    return repo.upsertEntityAsset(data);
  });

export const updateEntityAssetStatusFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["todo", "in_progress", "live", "verified"]).optional(),
      nameConsistent: z.boolean().nullable().optional(),
      url: z.string().url().nullable().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const repo = await import("@/server/db/repos/entity-assets");
    await repo.updateEntityAssetStatus(data.id, {
      status: data.status,
      nameConsistent: data.nameConsistent,
      url: data.url,
    });
    return { ok: true };
  });

export const deleteEntityAssetFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const repo = await import("@/server/db/repos/entity-assets");
    await repo.deleteEntityAsset(data.id);
    return { ok: true };
  });
