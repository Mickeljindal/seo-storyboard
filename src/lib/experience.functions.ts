import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * EXPERIENCE ENGINE — server functions for the dashboard (manage the curated
 * library of real operational lessons that get woven into articles for E-E-A-T).
 */

export const listExperienceSnippetsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const repo = await import("@/server/db/repos/experience");
  const [snippets, total] = await Promise.all([
    repo.listExperienceSnippets({ limit: 500 }),
    repo.countExperienceSnippets(),
  ]);
  return { ok: true, snippets, total };
});

export const seedExperienceSnippetsFn = createServerFn({ method: "POST" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { seedExperienceSnippets } = await import("./experience-engine");
  return seedExperienceSnippets();
});

export const addExperienceSnippetFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      title: z.string().min(3).max(200),
      kind: z.enum(["lesson", "mistake", "migration", "incident", "benchmark"]),
      body: z.string().min(20).max(2000),
      tags: z.array(z.string()).default([]),
      clusterId: z.number().nullable().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const repo = await import("@/server/db/repos/experience");
    const snippet = await repo.insertExperienceSnippet({
      title: data.title,
      kind: data.kind,
      body: data.body,
      tags: data.tags,
      clusterId: data.clusterId ?? null,
      source: "manual",
    });
    return { ok: true, snippet };
  });

export const updateExperienceSnippetFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      title: z.string().min(3).max(200).optional(),
      kind: z.enum(["lesson", "mistake", "migration", "incident", "benchmark"]).optional(),
      body: z.string().min(20).max(2000).optional(),
      tags: z.array(z.string()).optional(),
      clusterId: z.number().nullable().optional(),
      active: z.boolean().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/experience");
    await repo.updateExperienceSnippet(data.id, {
      title: data.title,
      kind: data.kind,
      body: data.body,
      tags: data.tags,
      clusterId: data.clusterId,
      active: data.active,
    });
    return { ok: true };
  });

export const deleteExperienceSnippetFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/experience");
    await repo.deleteExperienceSnippet(data.id);
    return { ok: true };
  });
