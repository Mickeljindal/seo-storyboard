/** Unwrap postgres/drizzle errors into a readable message for the UI. */
export function formatDbError(e: unknown): string {
  const err = e as { message?: string; cause?: { message?: string; code?: string } };
  const detail = err.cause?.message ?? err.message ?? String(e);
  if (/relation "articles" does not exist/i.test(detail)) {
    return `${detail} — Run: npm run setup`;
  }
  if (/column .* does not exist/i.test(detail)) {
    return `${detail} — Run: npm run db:migrate (schema patch)`;
  }
  if (/Failed query/i.test(detail) && err.cause?.message) {
    return `${err.cause.message} — Run: npm run setup`;
  }
  return detail;
}
