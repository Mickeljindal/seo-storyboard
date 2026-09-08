import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * CRM server functions: upload contacts from CSV, browse + segment them, and
 * edit lifecycle status. The list is admin-uploaded, never scraped.
 */

async function boot() {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
}

const STATUS = ["paying", "abandoned", "registered", "lead", "unknown"] as const;

export const contactCountsFn = createServerFn({ method: "GET" }).handler(async () => {
  await boot();
  const crm = await import("@/server/db/repos/crm");
  const counts = await crm.contactCounts();
  return { ok: true, counts, segments: crm.SEGMENTS };
});

export const listContactsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      segment: z.string().max(30).optional(),
      search: z.string().max(120).optional(),
      limit: z.number().min(1).max(1000).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    await boot();
    const crm = await import("@/server/db/repos/crm");
    const rows = await crm.listContacts({
      segment: data.segment,
      search: data.search,
      limit: data.limit,
    });
    return {
      ok: true,
      contacts: rows.map((c) => ({
        id: c.id,
        email: c.email,
        name: c.name ?? "",
        company: c.company ?? "",
        status: c.status,
        tags: c.tags ?? [],
        subscribed: c.subscribed,
        source: c.source ?? "",
        lastEmailedAt: c.lastEmailedAt ? c.lastEmailedAt.toISOString() : null,
        createdAt: c.createdAt ? c.createdAt.toISOString() : null,
      })),
    };
  });

/**
 * Import a pasted/uploaded CSV. `defaultStatus` stamps every row that has no
 * status column, so an export of "only paying customers" lands correctly even
 * without a status field.
 */
export const importContactsCsvFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      csv: z.string().min(1).max(8_000_000),
      defaultStatus: z.enum(STATUS).default("unknown"),
      source: z.string().max(40).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    await boot();
    const crm = await import("@/server/db/repos/crm");
    const { rows, skipped, headers } = crm.csvToContacts(data.csv, {
      defaultStatus: data.defaultStatus,
    });
    if (!rows.length) {
      return {
        ok: false as const,
        error: "No valid rows found. Make sure there is an email column and the file is CSV.",
        headers,
      };
    }
    const res = await crm.importContacts(rows, data.source ?? "csv");
    return { ok: true as const, ...res, invalidRows: skipped, headers };
  });

export const updateContactStatusFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), status: z.enum(STATUS) }).parse)
  .handler(async ({ data }) => {
    await boot();
    const crm = await import("@/server/db/repos/crm");
    await crm.updateContactStatus(data.id, data.status);
    return { ok: true };
  });

export const setContactSubscribedFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), subscribed: z.boolean() }).parse)
  .handler(async ({ data }) => {
    await boot();
    const crm = await import("@/server/db/repos/crm");
    await crm.setSubscribed(data.id, data.subscribed);
    return { ok: true };
  });

export const deleteContactFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    await boot();
    const crm = await import("@/server/db/repos/crm");
    await crm.deleteContact(data.id);
    return { ok: true };
  });
