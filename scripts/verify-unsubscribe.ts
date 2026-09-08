/**
 * Prove the unsubscribe endpoint honours opt-outs and refuses forgeries.
 *
 *   npx tsx scripts/verify-unsubscribe.ts
 *
 * Calls handleUnsubscribeRequest with constructed Request objects rather than over
 * HTTP, so the signing secret can be set and cleared per case without touching
 * .env or restarting anything.
 *
 * Uses throwaway @example.com prospects and cleans up after itself.
 * Run with the dev server stopped: PGlite allows a single writer.
 */
import { loadProjectEnv } from "../src/lib/load-env";

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const BASE = "https://engine.example.com";

async function main() {
  loadProjectEnv();
  const { handleUnsubscribeRequest, isUnsubscribePath } = await import(
    "../src/lib/unsubscribe-handler"
  );
  const repo = await import("../src/server/db/repos/outreach");
  const { getDb } = await import("../src/server/db/client");
  const db = await getDb();

  const TAG = `unsubtest-${Date.now()}`;
  const addr = `editor.${TAG}@example.com`;

  const seed = async (email: string) => {
    const p = await repo.upsertProspect({
      email,
      company: "Unsub Test",
      segment: "publisher",
      source: TAG,
      personalNote: "Published a test page",
    });
    await repo.upsertMessage({ prospectId: p.id, step: 1, subject: "s", bodyText: "b unsubscribe" });
    const m = (await repo.listMessages({ prospectId: p.id }))[0];
    await repo.approveMessage(m.id);
    return { p, m };
  };

  console.log("1) path matching\n");
  check("/unsubscribe matches", isUnsubscribePath("/unsubscribe"));
  check("/unsubscribe/ matches", isUnsubscribePath("/unsubscribe/"));
  check("/api/unsubscribe matches", isUnsubscribePath("/api/unsubscribe"));
  check("/UNSUBSCRIBE matches (case-insensitive)", isUnsubscribePath("/UNSUBSCRIBE"));
  check("an unrelated path does NOT match", !isUnsubscribePath("/growth"));
  const passthrough = await handleUnsubscribeRequest(new Request(`${BASE}/growth`));
  check("a non-unsubscribe request returns null so the app handles it", passthrough === null);

  console.log("\n2) a real click, with no signing secret configured\n");
  const hadSecret = process.env.UNSUBSCRIBE_SECRET;
  delete process.env.UNSUBSCRIBE_SECRET;

  const { p, m } = await seed(addr);
  const res = await handleUnsubscribeRequest(
    new Request(`${BASE}/unsubscribe?e=${encodeURIComponent(addr)}`),
  );
  check("returns a page", res?.status === 200, String(res?.status));
  const html = (await res!.text()) ?? "";
  check("the page confirms it is done", /you're unsubscribed|Done,/i.test(html));
  check("the page names the address", html.includes(addr));
  check("the page is not indexable", /noindex/.test(html));
  check("the page declares a language", /<html lang="en">/.test(html));
  check("the response is not cacheable", /no-store/.test(res!.headers.get("cache-control") ?? ""));

  check("the address is now suppressed", await repo.isSuppressed(addr));
  const after = await repo.getProspectById(p.id);
  check("the sequence was stopped", after?.sequence_stopped_reason === "unsubscribed", String(after?.sequence_stopped_reason));
  const due = await repo.listDueMessages({ limit: 500 });
  check("their approved message is no longer due to send", !due.some((x) => x.id === m.id));
  const msgAfter = (await repo.listMessages({ prospectId: p.id }))[0];
  check("the pending message was cancelled", msgAfter.status === "skipped", msgAfter.status);

  console.log("\n3) clicking twice is safe\n");
  const res2 = await handleUnsubscribeRequest(
    new Request(`${BASE}/unsubscribe?e=${encodeURIComponent(addr)}`),
  );
  const html2 = (await res2!.text()) ?? "";
  check("still 200, not an error", res2?.status === 200, String(res2?.status));
  check("it says they were already unsubscribed", /already unsubscribed/i.test(html2));

  console.log("\n4) one-click POST (what Gmail and Outlook actually send)\n");
  const addr2 = `oneclick.${TAG}@example.com`;
  await seed(addr2);
  const post = await handleUnsubscribeRequest(
    new Request(`${BASE}/unsubscribe?e=${encodeURIComponent(addr2)}`, { method: "POST" }),
  );
  check("POST returns a bare 200", post?.status === 200, String(post?.status));
  const postBody = await post!.text();
  check("POST does not return HTML", !/<html/i.test(postBody), postBody.slice(0, 40));
  check("POST suppressed the address", await repo.isSuppressed(addr2));

  console.log("\n5) POST with the address in a form body\n");
  const addr3 = `formpost.${TAG}@example.com`;
  await seed(addr3);
  const form = new URLSearchParams({ e: addr3 });
  const post2 = await handleUnsubscribeRequest(
    new Request(`${BASE}/unsubscribe`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    }),
  );
  check("a form-encoded POST works", post2?.status === 200, String(post2?.status));
  check("and it suppressed the address", await repo.isSuppressed(addr3));

  console.log("\n6) HEAD must never unsubscribe anybody (link scanners use it)\n");
  const addr4 = `scanner.${TAG}@example.com`;
  await seed(addr4);
  const head = await handleUnsubscribeRequest(
    new Request(`${BASE}/unsubscribe?e=${encodeURIComponent(addr4)}`, { method: "HEAD" }),
  );
  check("HEAD returns 200", head?.status === 200, String(head?.status));
  check("HEAD did NOT suppress the address", !(await repo.isSuppressed(addr4)));

  console.log("\n7) with a signing secret set, forgeries are refused\n");
  process.env.UNSUBSCRIBE_SECRET = "test-secret-for-verification";
  const { unsubscribeUrl } = await import("../src/lib/email-sender");

  const addr5 = `signed.${TAG}@example.com`;
  await seed(addr5);

  const forged = await handleUnsubscribeRequest(
    new Request(`${BASE}/unsubscribe?e=${encodeURIComponent(addr5)}&s=deadbeef`),
  );
  check("a bad signature is refused with 400", forged?.status === 400, String(forged?.status));
  check("the forged attempt did NOT suppress anybody", !(await repo.isSuppressed(addr5)));

  const noSig = await handleUnsubscribeRequest(
    new Request(`${BASE}/unsubscribe?e=${encodeURIComponent(addr5)}`),
  );
  check("a missing signature is refused once a secret exists", noSig?.status === 400, String(noSig?.status));
  check("and still nobody was suppressed", !(await repo.isSuppressed(addr5)));

  // A genuine link, built the same way the emails build it.
  const real = unsubscribeUrl(addr5);
  const realSig = new URL(real).searchParams.get("s") ?? "";
  check("unsubscribeUrl produced a signature", realSig.length === 32, `len ${realSig.length}`);
  const good = await handleUnsubscribeRequest(
    new Request(`${BASE}/unsubscribe?e=${encodeURIComponent(addr5)}&s=${realSig}`),
  );
  check("a genuine signed link is accepted", good?.status === 200, String(good?.status));
  check("and it suppressed the address", await repo.isSuppressed(addr5));

  console.log("\n8) trying to unsubscribe somebody ELSE with a valid-looking link\n");
  const victim = `victim.${TAG}@example.com`;
  await seed(victim);
  // Same signature, different address: this is the attack the signature exists for.
  const swapped = await handleUnsubscribeRequest(
    new Request(`${BASE}/unsubscribe?e=${encodeURIComponent(victim)}&s=${realSig}`),
  );
  check("a signature from another address is refused", swapped?.status === 400, String(swapped?.status));
  check("the third party was NOT suppressed", !(await repo.isSuppressed(victim)));

  if (hadSecret) process.env.UNSUBSCRIBE_SECRET = hadSecret;
  else delete process.env.UNSUBSCRIBE_SECRET;

  // Cleanup.
  await db.execute(
    `delete from outreach_messages where prospect_id in (select id from outreach_prospects where source = '${TAG}')`,
  );
  await db.execute(`delete from outreach_suppressions where email like '%${TAG}%'`);
  await db.execute(`delete from outreach_prospects where source = '${TAG}'`);
  console.log(`\ncleaned up test rows (${TAG})`);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}

main().then(() => process.exit(process.exitCode ?? 0));
