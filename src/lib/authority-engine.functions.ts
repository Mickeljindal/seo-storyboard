import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const engineConfigSchema = z.object({
  geo: z.enum(["sa", "in", "ae", "global"]).default("sa"),
  clusterIds: z.array(z.number().min(1).max(10)).optional(),
  topicsPerCluster: z.number().min(1).max(15).default(5),
  minMonthlyVolume: z.number().min(0).max(50000).optional(),
  minTrafficScore: z.number().min(0).max(100).optional(),
  useSemanticClustering: z.boolean().default(true),
  includeCompetitorGap: z.boolean().default(true),
  competitorDomain: z.string().default("cloudways.com"),
  generateBriefs: z.boolean().default(true),
  generateContent: z.boolean().default(false),
});

export const runAutonomousEngine = createServerFn({ method: "POST" })
  .inputValidator(engineConfigSchema.parse)
  .handler(async ({ data }) => {
    const { runAuthorityEngine } = await import("@/lib/authority-engine");
    return runAuthorityEngine({ ...data });
  });

export const getEngineRuns = createServerFn({ method: "GET" })
  .inputValidator(z.object({ limit: z.number().default(10) }).parse)
  .handler(async ({ data }) => {
    const engineRepo = await import("@/server/db/repos/engine");
    const runs = await engineRepo.listEngineRuns(data.limit);
    return {
      runs: runs.map((r) => ({
        id: r.id,
        status: r.status,
        geo: r.geo,
        config: r.config,
        stats: r.stats,
        log: r.log,
        error_message: r.errorMessage,
        started_at: r.startedAt,
        finished_at: r.finishedAt,
      })),
      tableMissing: false,
    };
  });

export const getEngineRun = createServerFn({ method: "GET" })
  .inputValidator(z.object({ runId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const engineRepo = await import("@/server/db/repos/engine");
    const run = await engineRepo.getEngineRun(data.runId);
    return { run };
  });
