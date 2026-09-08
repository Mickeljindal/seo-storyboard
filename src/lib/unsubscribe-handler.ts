import "@tanstack/react-start/server-only";
import { verifyUnsubscribe } from "./email-sender";

/**
 * UNSUBSCRIBE — the endpoint the signed links in every outreach email point at.
 *
 * WHY THIS WAS URGENT. `unsubscribeUrl()` and `verifyUnsubscribe()` already
 * existed in email-sender.ts, and every email carried a signed link plus the
 * `List-Unsubscribe` and `List-Unsubscribe-Post` headers. Nothing served that
 * link. So the one promise made in the footer of every message was the one thing
 * that did not work: a working opt-out is a legal requirement under CAN-SPAM and
 * GDPR, and mailbox providers weight one-click unsubscribe heavily when deciding
 * whether a sender is legitimate. A dead unsubscribe link is worse than none,
 * because it looks deliberate.
 *
 * TWO METHODS, DIFFERENT CONTRACTS:
 *   POST — RFC 8058 one-click. Gmail and Outlook POST here themselves when the
 *          user presses their own native unsubscribe button. It must act
 *          immediately and answer with a bare 200; nobody reads the body.
 *   GET  — a person clicked the link. Act immediately, then show a page saying so.
 *
 * WHY GET ALSO ACTS IMMEDIATELY, despite the usual rule that GET should not
 * change state. The two failure modes are not equal. A link prefetched by a
 * security scanner costs us one prospect who was not going to reply anyway. A
 * confirmation step that somebody abandons means we keep emailing a person who
 * asked us to stop, which is a complaint and a legal problem. So this errs
 * towards honouring the request.
 *
 * IDEMPOTENT. Clicking twice shows the same confirmation rather than an error,
 * because a second click means the person is not certain it worked.
 */

/** Paths treated as the unsubscribe endpoint, whatever fronts the app. */
const PATHS = new Set([
  "/unsubscribe",
  "/unsubscribe/",
  "/api/unsubscribe",
  "/email/unsubscribe",
]);

export function isUnsubscribePath(pathname: string): boolean {
  return PATHS.has(pathname.toLowerCase());
}

/* -------------------------------------------------------------------------- *
 * Pages
 * -------------------------------------------------------------------------- */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A tiny, self-contained page. No external CSS or fonts, because this has to
 * render for somebody who is already annoyed, possibly on a slow connection, and
 * a broken stylesheet here would look like the unsubscribe itself failed.
 *
 * Accessibility: a real lang attribute, a single h1, semantic landmarks, text
 * that meets contrast on the given background, and no reliance on colour alone.
 */
function page(opts: { title: string; heading: string; body: string; status: number }): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(opts.title)}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #f6f7f9; color: #14161a;
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    padding: 24px;
  }
  main {
    background: #fff; max-width: 34rem; width: 100%; padding: 2rem;
    border: 1px solid #e3e6ea; border-radius: 10px;
  }
  h1 { font-size: 1.35rem; margin: 0 0 .75rem; color: #000f27; }
  p { margin: 0 0 .85rem; }
  .addr { font-weight: 600; overflow-wrap: anywhere; }
  a { color: #4F1AF3; }
  footer { margin-top: 1.25rem; font-size: .875rem; color: #4a5160; }
  @media (prefers-color-scheme: dark) {
    body { background: #0d0f14; color: #e8eaee; }
    main { background: #14171d; border-color: #262b33; }
    h1 { color: #e8eaee; }
    footer { color: #a2a9b8; }
    a { color: #9b7bff; }
  }
</style>
</head>
<body>
<main>
  <h1>${esc(opts.heading)}</h1>
  ${opts.body}
  <footer>Kloudbean · <a href="https://www.kloudbean.com/">kloudbean.com</a></footer>
</main>
</body>
</html>`;
  return new Response(html, {
    status: opts.status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Never cached: the answer depends on state that just changed.
      "cache-control": "no-store, max-age=0",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    },
  });
}

/* -------------------------------------------------------------------------- *
 * Handler
 * -------------------------------------------------------------------------- */

export type UnsubResult = {
  ok: boolean;
  email: string | null;
  alreadySuppressed: boolean;
  stoppedSequence: boolean;
  verified: boolean;
  reason: string;
};

/**
 * Record the opt-out. Separated from the HTTP layer so it can be tested and
 * reused (a support agent honouring a request by hand, for example).
 */
export async function applyUnsubscribe(
  email: string,
  opts: { verified: boolean; note?: string } = { verified: false },
): Promise<UnsubResult> {
  const repo = await import("@/server/db/repos/outreach");
  const addr = (email ?? "").trim().toLowerCase();

  const out: UnsubResult = {
    ok: false,
    email: addr || null,
    alreadySuppressed: false,
    stoppedSequence: false,
    verified: opts.verified,
    reason: "",
  };

  if (!addr || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addr)) {
    out.reason = "not a usable address";
    return out;
  }

  out.alreadySuppressed = await repo.isSuppressed(addr);

  // addSuppression is a no-op when the address is already listed, and it also
  // flips the matching prospect, so this stays safe to call twice.
  await repo.addSuppression({
    email: addr,
    reason: "unsubscribe",
    note: opts.note ?? (opts.verified ? "via signed link" : "via unsigned link"),
  });

  // Stopping the sequence is the part that actually prevents the next email:
  // suppression is checked at send time, but a stopped sequence also cancels the
  // follow-up already sitting in the queue.
  const replies = await import("@/server/db/repos/replies");
  const match = await replies.findProspectByEmail(addr);
  if (match) {
    const r = await repo.stopSequence(match.id, "unsubscribed", { status: "suppressed" });
    out.stoppedSequence = true;
    if (r.cancelledMessages) out.reason = `cancelled ${r.cancelledMessages} pending message(s)`;
  }

  out.ok = true;
  return out;
}

/**
 * Handle a request if it is for the unsubscribe endpoint, otherwise return null so
 * the caller carries on to the app.
 */
export async function handleUnsubscribeRequest(request: Request): Promise<Response | null> {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return null;
  }
  if (!isUnsubscribePath(url.pathname)) return null;

  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "POST" && method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, POST" } });
  }

  // The address can arrive in the query string (our links) or in a POSTed form.
  let email = (url.searchParams.get("e") ?? url.searchParams.get("email") ?? "").trim();
  let sig = (url.searchParams.get("s") ?? url.searchParams.get("sig") ?? "").trim();

  if (method === "POST") {
    try {
      const ct = request.headers.get("content-type") ?? "";
      if (/application\/x-www-form-urlencoded|multipart\/form-data/i.test(ct)) {
        const form = await request.formData();
        email = String(form.get("e") ?? form.get("email") ?? email).trim();
        sig = String(form.get("s") ?? form.get("sig") ?? sig).trim();
      }
    } catch {
      /* the query string is the primary source anyway */
    }
  }

  const hasSecret = !!process.env.UNSUBSCRIBE_SECRET?.trim();
  const verified = hasSecret && !!sig && verifyUnsubscribe(email, sig);

  /**
   * When a secret IS configured, a bad signature is refused: without that, anybody
   * could unsubscribe any address by editing a query string.
   *
   * When no secret is configured, the links already sent carry no signature at
   * all, so refusing would break every unsubscribe link in the wild. Honour it and
   * say so in the log, because the fix is a configuration change, not a code one.
   */
  if (hasSecret && !verified) {
    console.warn(`[unsubscribe] refused: bad or missing signature for "${email.slice(0, 60)}"`);
    if (method === "POST") return new Response("Invalid unsubscribe link", { status: 400 });
    return page({
      status: 400,
      title: "Unsubscribe link not valid",
      heading: "That link doesn't look right",
      body: `<p>The link may have been shortened, split across two lines by an email client, or copied incompletely.</p>
             <p>Reply to any of our emails with the word <strong>unsubscribe</strong> and we will take care of it by hand.</p>`,
    });
  }
  if (!hasSecret) {
    console.warn(
      "[unsubscribe] UNSUBSCRIBE_SECRET is not set, so unsubscribe links cannot be verified. " +
        "Honouring the request anyway. Set UNSUBSCRIBE_SECRET to sign and verify them.",
    );
  }

  if (!email) {
    if (method === "POST") return new Response("Missing address", { status: 400 });
    return page({
      status: 400,
      title: "Unsubscribe",
      heading: "We need to know which address to remove",
      body: `<p>The link did not include an email address.</p>
             <p>Reply to any of our emails with the word <strong>unsubscribe</strong> and we will do it manually.</p>`,
    });
  }

  // HEAD is used by link scanners. Answer without changing anything.
  if (method === "HEAD") return new Response(null, { status: 200 });

  let result: UnsubResult;
  try {
    result = await applyUnsubscribe(email, { verified });
  } catch (e) {
    console.error("[unsubscribe] failed to record:", e);
    if (method === "POST") return new Response("Temporary failure", { status: 500 });
    return page({
      status: 500,
      title: "Unsubscribe",
      heading: "Something went wrong on our side",
      body: `<p>We could not record that just now. Reply to any of our emails with the word
             <strong>unsubscribe</strong> and a person will handle it.</p>`,
    });
  }

  if (!result.ok) {
    if (method === "POST") return new Response("Invalid address", { status: 400 });
    return page({
      status: 400,
      title: "Unsubscribe",
      heading: "That address doesn't look valid",
      body: `<p>Reply to any of our emails with the word <strong>unsubscribe</strong> and we will remove you by hand.</p>`,
    });
  }

  console.log(
    `[unsubscribe] ${result.alreadySuppressed ? "re-confirmed" : "recorded"} for ${email} ` +
      `(verified: ${verified}${result.stoppedSequence ? ", sequence stopped" : ""})`,
  );

  // One-click clients want a bare success, not a page.
  if (method === "POST") return new Response("Unsubscribed", { status: 200 });

  return page({
    status: 200,
    title: "You're unsubscribed",
    heading: result.alreadySuppressed ? "You were already unsubscribed" : "Done, you're unsubscribed",
    body: `<p><span class="addr">${esc(email)}</span> will not receive outreach from us again.</p>
           <p>${
             result.alreadySuppressed
               ? "This address was already on our do-not-contact list, so nothing changed."
               : "Anything already queued for you has been cancelled."
           }</p>
           <p>If you got this email by mistake and would rather tell us why, replying is welcome but never required.</p>`,
  });
}
