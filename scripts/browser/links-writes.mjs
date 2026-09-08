import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3000";
const errors = [];
const results = [];
function check(name, ok, extra = "") {
  results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
}
/** Read the toast text as soon as one shows up, rather than after it has gone. */
async function waitForToast(page, re, ms = 25000) {
  const started = Date.now();
  let seen = "";
  while (Date.now() - started < ms) {
    const t = (await page.locator("[data-sonner-toast]").allInnerTexts()).join(" | ");
    if (t) seen = t;
    if (re.test(seen)) return seen;
    await page.waitForTimeout(400);
  }
  return seen;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 300)}`);
});

await page.goto(`${BASE}/growth`, { waitUntil: "networkidle", timeout: 90000 });
await page.locator('[role="tab"]').filter({ hasText: /Backlinks/i }).first().click();
await page.waitForTimeout(4000);

await page.getByLabel("Stage filter").click();
await page.waitForTimeout(400);
await page.getByRole("option", { name: "Pitch written" }).click();
await page.waitForTimeout(3000);

const openBtns = page.getByRole("button", { name: "Open", exact: true });
check("has a row with a pitch", (await openBtns.count()) > 0, `${await openBtns.count()} rows`);
await openBtns.first().click();
await page.waitForTimeout(4000);

/* ------------------------------------------------ 0. clean any old litter */
await page.getByRole("button", { name: /^Edit$/ }).first().click();
await page.waitForTimeout(600);
const cleaned = (await page.getByLabel("Email body").inputValue())
  .replace(/\n*\[test marker \d+\]/g, "")
  .trimEnd();
await page.getByLabel("Email body").fill(cleaned);
await page.getByRole("button", { name: /Save my wording/i }).click();
await page.waitForTimeout(3500);
const baseline = await page.getByLabel("Email body").inputValue();
check("starting from a clean pitch body", !baseline.includes("[test marker"));

/* ---------------------------------------------- 1. edit and save the pitch */
const marker = `\n\n[test marker ${Date.now()}]`;
await page.getByRole("button", { name: /^Edit$/ }).first().click();
await page.waitForTimeout(600);
await page.getByLabel("Email body").fill(baseline + marker);
await page.getByRole("button", { name: /Save my wording/i }).click();
await page.waitForTimeout(3500);
check(
  "the editor closes after saving",
  (await page.getByRole("button", { name: /Save my wording/i }).count()) === 0,
);
check("edit is marked as human-edited", (await page.getByText(/you edited this/i).count()) > 0);
check(
  "edited text persisted",
  (await page.getByLabel("Email body").inputValue()).includes("[test marker"),
);

// put it back, so the test leaves nothing behind
await page.getByRole("button", { name: /^Edit$/ }).first().click();
await page.waitForTimeout(600);
await page.getByLabel("Email body").fill(baseline);
await page.getByRole("button", { name: /Save my wording/i }).click();
await page.waitForTimeout(3500);
check(
  "restored the original wording",
  !(await page.getByLabel("Email body").inputValue()).includes("[test marker"),
);

/* ------------------------------------------------------- 2. add a note */
const note = `browser test ${new Date().toISOString().slice(0, 16)}`;
await page.getByLabel("Note").fill(note);
await page.getByRole("button", { name: /^Save$/ }).first().click();
check("note saves", /Note saved/i.test(await waitForToast(page, /Note saved/i, 12000)));

/* --------------------------------------------- 3. check the link right now */
await page.getByRole("button", { name: /Check their page now/i }).first().click();
const linkToast = await waitForToast(
  page,
  /Link is live|No link on that page yet|nofollow|link has gone/i,
  40000,
);
check(
  "check-link-now returns a plain answer",
  /Link is live|No link on that page yet|nofollow|link has gone/i.test(linkToast),
  linkToast.slice(0, 160),
);
await page.waitForTimeout(2500);
check(
  "the check is recorded in the history",
  (await page.getByText(/not found|found, followed|found, /i).count()) > 0,
);

/* ------------------------------------------------- 4. test send (dry run) */
await page.getByRole("button", { name: /Test send/i }).first().click();
const sendToast = await waitForToast(page, /Test run only|would go to|Could not send/i, 25000);
check(
  "test send stays a test and says where it would go",
  /Test run only|nothing was sent|would go to/i.test(sendToast),
  sendToast.slice(0, 200),
);

/* -------------------------------------- 5. no real-send button while off */
const realSend = await page.getByRole("button", { name: /Send now, for real/i }).count();
check("no real-send button while sending is switched off", realSend === 0, `${realSend} found`);

/* -------------------------------- 6. every other tab is still intact */
for (const t of ["Trends", "Reddit", "Communities", "Distribution"]) {
  await page.locator('[role="tab"]').filter({ hasText: new RegExp(t, "i") }).first().click();
  await page.waitForTimeout(2500);
  const len = (await page.locator("body").innerText()).length;
  check(`${t} tab still renders`, len > 300, `${len} chars`);
}

await page.screenshot({ path: "/tmp/links-writes.png" });
const real = errors.filter((e) => !/favicon|React DevTools|autocomplete|source-?map/i.test(e));
check("zero page errors", real.length === 0, real.slice(0, 4).join(" || "));

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
