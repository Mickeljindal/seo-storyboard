import "@tanstack/react-start/server-only";

/**
 * NATIVE SOCIAL PROVIDERS — direct posting to each platform's own API using an
 * access token you connect per channel. No middle-man automation.
 *
 * Each platform needs:
 *   - an access token with post/write scope (stored on the channel as apiToken)
 *   - a few platform-specific ids (stored in the channel's `meta` JSON)
 *
 * Tokens are obtained by registering an app on each platform and running its
 * OAuth once. The click-to-connect OAuth flow is a separate follow-up; today you
 * paste the token + ids and posting works immediately.
 */

export type NativeChannel = {
  platform: string;
  apiToken: string | null;
  meta: Record<string, unknown> | null;
};
export type NativeContent = { body: string; link?: string | null; imageUrl?: string | null };
export type NativeResult = { ok: boolean; id?: string; error?: string; status?: number };

/** What each platform needs in the connect form. Drives the UI + validation. */
export const NATIVE_FIELDS: Record<
  string,
  { tokenLabel: string; tokenHelp: string; meta: { key: string; label: string; placeholder?: string; help?: string }[]; note?: string }
> = {
  linkedin: {
    tokenLabel: "Access token",
    tokenHelp: "LinkedIn OAuth token with w_member_social (or w_organization_social) scope.",
    meta: [{ key: "authorUrn", label: "Author URN", placeholder: "urn:li:person:XXXX or urn:li:organization:XXXX", help: "Your member or company page URN." }],
  },
  x: {
    tokenLabel: "OAuth 2.0 user access token",
    tokenHelp: "X API v2 token with tweet.write + users.read (OAuth2 user context).",
    meta: [],
  },
  facebook: {
    tokenLabel: "Page access token",
    tokenHelp: "Long-lived Page token with pages_manage_posts.",
    meta: [{ key: "pageId", label: "Page ID", placeholder: "1234567890" }],
  },
  instagram: {
    tokenLabel: "Access token",
    tokenHelp: "Instagram Graph token (via a linked Facebook app) with instagram_content_publish.",
    meta: [{ key: "igUserId", label: "Instagram user ID", placeholder: "1784xxxxxxxxxxx" }],
    note: "Instagram requires an image on every post.",
  },
  threads: {
    tokenLabel: "Access token",
    tokenHelp: "Threads API token with threads_basic + threads_content_publish.",
    meta: [{ key: "threadsUserId", label: "Threads user ID" }],
  },
  mastodon: {
    tokenLabel: "Access token",
    tokenHelp: "From your instance: Preferences → Development → New application (scope write:statuses).",
    meta: [{ key: "instanceUrl", label: "Instance URL", placeholder: "https://mastodon.social" }],
  },
  webhook: { tokenLabel: "", tokenHelp: "", meta: [] },
};

function metaStr(meta: Record<string, unknown> | null, key: string): string {
  const v = meta?.[key];
  return typeof v === "string" ? v.trim() : "";
}

async function readErr(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 300);
  } catch {
    return `HTTP ${res.status}`;
  }
}

const withLink = (body: string, link?: string | null) =>
  link && !body.includes(link) ? `${body}\n\n${link}` : body;

/* ------------------------------- Mastodon -------------------------------- */
async function postMastodon(ch: NativeChannel, c: NativeContent): Promise<NativeResult> {
  const instance = metaStr(ch.meta, "instanceUrl").replace(/\/+$/, "");
  if (!instance) return { ok: false, error: "Mastodon: instance URL missing" };
  if (!ch.apiToken) return { ok: false, error: "Mastodon: access token missing" };
  const res = await fetch(`${instance}/api/v1/statuses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ch.apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: withLink(c.body, c.link) }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return { ok: false, status: res.status, error: `Mastodon ${res.status}: ${await readErr(res)}` };
  const j = (await res.json()) as { id?: string };
  return { ok: true, id: j.id, status: res.status };
}

/* --------------------------------- X ------------------------------------- */
async function postX(ch: NativeChannel, c: NativeContent): Promise<NativeResult> {
  if (!ch.apiToken) return { ok: false, error: "X: access token missing" };
  const text = withLink(c.body, c.link).slice(0, 280);
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${ch.apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return { ok: false, status: res.status, error: `X ${res.status}: ${await readErr(res)}` };
  const j = (await res.json()) as { data?: { id?: string } };
  return { ok: true, id: j.data?.id, status: res.status };
}

/* ------------------------------- LinkedIn -------------------------------- */
async function postLinkedIn(ch: NativeChannel, c: NativeContent): Promise<NativeResult> {
  const author = metaStr(ch.meta, "authorUrn");
  if (!author) return { ok: false, error: "LinkedIn: author URN missing" };
  if (!ch.apiToken) return { ok: false, error: "LinkedIn: access token missing" };
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ch.apiToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: withLink(c.body, c.link) },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return { ok: false, status: res.status, error: `LinkedIn ${res.status}: ${await readErr(res)}` };
  const id = res.headers.get("x-restli-id") ?? undefined;
  return { ok: true, id, status: res.status };
}

/* ------------------------------- Facebook -------------------------------- */
async function postFacebook(ch: NativeChannel, c: NativeContent): Promise<NativeResult> {
  const pageId = metaStr(ch.meta, "pageId");
  if (!pageId) return { ok: false, error: "Facebook: Page ID missing" };
  if (!ch.apiToken) return { ok: false, error: "Facebook: page access token missing" };
  const params = new URLSearchParams({ message: withLink(c.body, null), access_token: ch.apiToken });
  if (c.link) params.set("link", c.link);
  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return { ok: false, status: res.status, error: `Facebook ${res.status}: ${await readErr(res)}` };
  const j = (await res.json()) as { id?: string };
  return { ok: true, id: j.id, status: res.status };
}

/* ------------------------------ Instagram -------------------------------- */
async function postInstagram(ch: NativeChannel, c: NativeContent): Promise<NativeResult> {
  const igUserId = metaStr(ch.meta, "igUserId");
  if (!igUserId) return { ok: false, error: "Instagram: user ID missing" };
  if (!ch.apiToken) return { ok: false, error: "Instagram: access token missing" };
  if (!c.imageUrl) return { ok: false, error: "Instagram requires an image (imageUrl)." };

  const create = new URLSearchParams({ image_url: c.imageUrl, caption: c.body, access_token: ch.apiToken });
  const cres = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: create.toString(),
    signal: AbortSignal.timeout(25_000),
  });
  if (!cres.ok) return { ok: false, status: cres.status, error: `Instagram media ${cres.status}: ${await readErr(cres)}` };
  const cjson = (await cres.json()) as { id?: string };
  if (!cjson.id) return { ok: false, error: "Instagram: no creation id" };

  const pub = new URLSearchParams({ creation_id: cjson.id, access_token: ch.apiToken });
  const pres = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: pub.toString(),
    signal: AbortSignal.timeout(25_000),
  });
  if (!pres.ok) return { ok: false, status: pres.status, error: `Instagram publish ${pres.status}: ${await readErr(pres)}` };
  const pjson = (await pres.json()) as { id?: string };
  return { ok: true, id: pjson.id, status: pres.status };
}

/* -------------------------------- Threads -------------------------------- */
async function postThreads(ch: NativeChannel, c: NativeContent): Promise<NativeResult> {
  const userId = metaStr(ch.meta, "threadsUserId");
  if (!userId) return { ok: false, error: "Threads: user ID missing" };
  if (!ch.apiToken) return { ok: false, error: "Threads: access token missing" };

  const create = new URLSearchParams({ media_type: "TEXT", text: withLink(c.body, c.link), access_token: ch.apiToken });
  const cres = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: create.toString(),
    signal: AbortSignal.timeout(20_000),
  });
  if (!cres.ok) return { ok: false, status: cres.status, error: `Threads create ${cres.status}: ${await readErr(cres)}` };
  const cjson = (await cres.json()) as { id?: string };
  if (!cjson.id) return { ok: false, error: "Threads: no creation id" };

  const pub = new URLSearchParams({ creation_id: cjson.id, access_token: ch.apiToken });
  const pres = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: pub.toString(),
    signal: AbortSignal.timeout(20_000),
  });
  if (!pres.ok) return { ok: false, status: pres.status, error: `Threads publish ${pres.status}: ${await readErr(pres)}` };
  const pjson = (await pres.json()) as { id?: string };
  return { ok: true, id: pjson.id, status: pres.status };
}

const PROVIDERS: Record<string, (ch: NativeChannel, c: NativeContent) => Promise<NativeResult>> = {
  mastodon: postMastodon,
  x: postX,
  twitter: postX,
  linkedin: postLinkedIn,
  facebook: postFacebook,
  instagram: postInstagram,
  threads: postThreads,
};

/** Post directly to a platform's API. Returns a clear error if unsupported/misconfigured. */
export async function postNative(ch: NativeChannel, content: NativeContent): Promise<NativeResult> {
  const fn = PROVIDERS[ch.platform.toLowerCase()];
  if (!fn) return { ok: false, error: `No native provider for "${ch.platform}"` };
  try {
    return await fn(ch, content);
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}
