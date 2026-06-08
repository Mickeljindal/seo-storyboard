import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Read the capability graph + current scope overrides for the Scope screen. */
export const getScopeFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { SUPPORTED_CAPABILITIES, UNSUPPORTED_CAPABILITIES } = await import("./kloudbean-capabilities");
  const { getScopeConfig } = await import("./scope-config");
  const config = getScopeConfig();
  return {
    supported: SUPPORTED_CAPABILITIES.map((c) => ({ id: c.id, label: c.label, group: c.group })),
    unsupported: UNSUPPORTED_CAPABILITIES.map((c) => ({ label: c.label, why: c.why })),
    config: {
      disabledSupported: config.disabledSupported,
      allowedUnsupported: config.allowedUnsupported,
      extraUnsupported: config.extraUnsupported,
      updatedAt: config.updatedAt,
    },
  };
});

const saveSchema = z.object({
  disabledSupported: z.array(z.string()).optional(),
  allowedUnsupported: z.array(z.string()).optional(),
  extraUnsupported: z
    .array(z.object({ label: z.string(), terms: z.array(z.string()), why: z.string() }))
    .optional(),
});

/** Persist scope overrides (allow/disallow capabilities, add custom banned tech). */
export const saveScopeFn = createServerFn({ method: "POST" })
  .inputValidator(saveSchema.parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { saveScopeConfig } = await import("./scope-config");
    const saved = saveScopeConfig(data);
    return { ok: true, updatedAt: saved.updatedAt };
  });

/** Quick test: does a keyword/topic pass the full scope (capability + provider + geo)? */
export const testScopeFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ keyword: z.string().min(1), geo: z.string().default("global") }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { validateCapability } = await import("./kloudbean-capabilities");
    const { validateSupportedProviders, validateTopicAgainstGeoPolicy } = await import("./geo-provider-policy");
    const { isKloudbeanScopedKeyword, scoreKloudbeanRelevance } = await import("./kloudbean-scope");
    const { scopeOverrides } = await import("./scope-config");
    const overrides = scopeOverrides();

    const cap = validateCapability(data.keyword, overrides);
    const prov = validateSupportedProviders(data.keyword);
    const geo = validateTopicAgainstGeoPolicy(data.keyword, data.geo);
    const score = scoreKloudbeanRelevance(data.keyword);
    const inScope = cap.ok && prov.ok && geo.ok && isKloudbeanScopedKeyword(data.keyword, 4);

    return {
      keyword: data.keyword,
      inScope,
      score,
      capability: cap,
      provider: prov,
      geo,
      reason: !cap.ok ? cap.reason : !prov.ok ? prov.reason : !geo.ok ? geo.reason : score < 4 ? "Not clearly Kloudbean-scoped (low relevance score)." : "In scope.",
    };
  });
