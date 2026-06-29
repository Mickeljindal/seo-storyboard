/**
 * CONVERSION ATTRIBUTION TAGGING.
 *
 * Every link we send to console.kloudbean.com carries:
 *  - standard UTM params (utm_source/medium/campaign/content) for GA-style tools, and
 *  - our own reliable keys `kbsrc` (source slug) + `kbsurface` (tool|article)
 *    that survive even if UTMs get stripped/normalised.
 *
 * console.kloudbean.com echoes these back on the signup/paid webhook so each
 * conversion is attributed to the exact page that drove it.
 */

export type AttributionOpts = {
  surface?: "tool" | "article" | "site";
  slug?: string;
  ref?: string;
  campaign?: string;
};

/** Append attribution params to a console URL. Pure + safe (returns input on parse error). */
export function withAttribution(rawUrl: string, opts: AttributionOpts = {}): string {
  try {
    const url = new URL(rawUrl);
    const p = url.searchParams;
    if (!p.has("utm_source")) p.set("utm_source", "kloudbean");
    p.set("utm_medium", opts.surface || "site");
    p.set("utm_campaign", opts.campaign || "seo-engine");
    if (opts.slug) p.set("utm_content", opts.slug);
    if (opts.ref) p.set("ref", opts.ref);
    if (opts.surface) p.set("kbsurface", opts.surface);
    if (opts.slug) p.set("kbsrc", opts.slug);
    return url.toString();
  } catch {
    return rawUrl;
  }
}

/** Query-string fragment (no leading ?) for client-side URL building (e.g. the gate JS). */
export function attributionQuery(opts: AttributionOpts = {}): string {
  const p = new URLSearchParams();
  p.set("utm_source", "kloudbean");
  p.set("utm_medium", opts.surface || "site");
  p.set("utm_campaign", opts.campaign || "seo-engine");
  if (opts.slug) p.set("utm_content", opts.slug);
  if (opts.ref) p.set("ref", opts.ref);
  if (opts.surface) p.set("kbsurface", opts.surface);
  if (opts.slug) p.set("kbsrc", opts.slug);
  return p.toString();
}

/** Parse attribution back out of a URL (used when ingesting conversions). */
export function parseAttribution(rawUrl: string | null | undefined): {
  slug: string | null;
  surface: string | null;
  ref: string | null;
} {
  if (!rawUrl) return { slug: null, surface: null, ref: null };
  try {
    const p = new URL(rawUrl).searchParams;
    return {
      slug: p.get("kbsrc") || p.get("utm_content"),
      surface: p.get("kbsurface") || p.get("utm_medium"),
      ref: p.get("ref"),
    };
  } catch {
    return { slug: null, surface: null, ref: null };
  }
}
