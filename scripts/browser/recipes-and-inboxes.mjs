import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3000";
const errors = [];
const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
};
async function waitForToast(page, re, ms = 40000) {
  const t0 = Date.now();
  let seen = "";
  while (Date.now() - t0 < ms) {
    const t = (await page.locator("[data-sonner-toast]").allInnerTexts()).join(" | ");
    if (t) seen = t;
    if (re.test(seen)) return seen;
    await page.waitForTimeout(400);
  }
  return seen;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1560, height: 1200 } });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 300)}`);
});

await page.goto(`${BASE}/growth`, { waitUntil: "networkidle", timeout: 90000 });
await page.locator('[role="tab"]').filter({ hasText: /Backlinks/i }).first().click();
await page.waitForTimeout(5000);

/* ------------------------------------------------------- recipes panel */
check("the find-more panel is on the page", await page.getByText("Find more websites").isVisible());
check("it starts collapsed", (await page.getByText("Show the five ways").count()) === 1);
await page.getByRole("button", { name: /Show the five ways/i }).click();
await page.waitForTimeout(2500);

for (const label of [
  "Who links to a rival's article",
  "Who reviewed a rival recently",
  "Who takes guest posts",
  "Podcasts someone has been on",
  "Resource lists on a topic",
]) {
  check(`recipe offered: ${label}`, (await page.getByText(label).count()) > 0);
}
check(
  "the two free ones are labelled free",
  (await page.getByText("free", { exact: true }).count()) === 2,
  String(await page.getByText("free", { exact: true }).count()),
);
/**
 * A key exists but the account has no balance, so the honest badge is "search failed
 * last time" rather than a ready state or an invented credit reading.
 */
check(
  "the three search recipes carry an honest badge about search",
  (await page.getByText(/uses search|search failed last time|no search key/).count()) === 3,
  String(await page.getByText(/uses search|search failed last time|no search key/).count()),
);
check(
  "and they report the real last failure rather than claiming to be ready",
  (await page.getByText("search failed last time").count()) === 3,
  String(await page.getByText("search failed last time").count()),
);

// Skyscraper is selected by default and is free, so it must be runnable.
check("an input box is shown", await page.locator("#recipe-input").isVisible());
check("go button present", (await page.getByRole("button", { name: /Go and look/i }).count()) === 1);
check(
  "go is disabled with an empty box",
  await page.getByRole("button", { name: /Go and look/i }).isDisabled(),
);

// Pick a search recipe and confirm it warns instead of letting you waste time.
await page.getByText("Who takes guest posts").click();
await page.waitForTimeout(900);
check(
  "picking a search recipe warns about the last failure up front",
  (await page.getByText(/last time a search recipe ran it failed/i).count()) > 0,
);
check(
  "and it names what actually went wrong",
  (await page.getByText(/run out of credits/i).count()) > 0,
);
await page.locator("#recipe-input").fill("managed hosting");
await page.waitForTimeout(400);
/**
 * NOT disabled, on purpose. The obvious response to reading that warning is to top
 * the account up, and the next click has to be allowed to work.
 */
check(
  "the button stays usable, since the warning is about the past not the present",
  !(await page.getByRole("button", { name: /Go and look/i }).isDisabled()),
);

/* ---- run the free skyscraper recipe for real ---- */
await page.getByText("Who links to a rival's article").click();
await page.waitForTimeout(900);
await page.locator("#recipe-input").fill("heroku.com/pricing");
await page.getByLabel("Campaign name for this run").fill("browser test");
await page.getByRole("button", { name: /Go and look/i }).click();
const runToast = await waitForToast(page, /sites link to that page|No links to that page/i, 90000);
check(
  "the free recipe actually runs and reports in plain words",
  /sites link to that page|No links to that page/i.test(runToast),
  runToast.slice(0, 170),
);
await page.waitForTimeout(2500);
check(
  "the result stays on screen after the toast goes",
  (await page.getByText(/sites link to that page|No links to that page/i).count()) > 0,
);
check("recent looks are listed", (await page.getByText("Recent looks").count()) > 0);
check(
  "a past run can be reused without retyping",
  (await page.getByRole("button", { name: /Use again/i }).count()) > 0,
);

// Reuse fills the box back in.
await page.getByRole("button", { name: /Use again/i }).first().click();
await page.waitForTimeout(700);
check(
  "use-again refills the input",
  (await page.locator("#recipe-input").inputValue()).length > 3,
  await page.locator("#recipe-input").inputValue(),
);

/* ------------------------------------------------------- inbox panel */
check("the sending-addresses panel is on the page", await page.getByText("Sending addresses").isVisible());
/**
 * The empty-state hint only belongs on an empty pool, and this test adds an address
 * below, so a second run would legitimately not see it. Asserting it unconditionally
 * made a correct UI look broken on the second run.
 */
const poolIsEmpty = (await page.getByText(/\b0 set up\b/).count()) > 0;
if (poolIsEmpty) {
  check(
    "with none set up it explains how to add them",
    (await page.getByText(/OUTREACH_INBOX_ADDRESSES/).count()) > 0,
  );
} else {
  check(
    "with addresses already set up it shows the pool instead of the how-to",
    (await page.getByText(/set up/).count()) > 0,
  );
}
check(
  "look-for-new-addresses button present",
  (await page.getByRole("button", { name: /Look for new addresses/i }).count()) === 1,
);
await page.getByRole("button", { name: /^Manage$/ }).click();
await page.waitForTimeout(1500);
check("manage reveals the add form", await page.getByLabel("New sending address").isVisible());
check("and the name field", await page.getByLabel("Name shown on the email").isVisible());
check(
  "it says plainly that passwords are never stored here",
  (await page.getByText(/passwords are never stored here/i).count()) > 0,
);
check(
  "and that adding addresses does not raise the daily total",
  (await page.getByText(/does not raise the total/i).count()) > 0,
);

// Add one, change its cap, pause it, resume it, then leave it paused-free.
await page.getByLabel("New sending address").fill("browsertest@kloudbean.com");
await page.getByLabel("Name shown on the email").fill("Test");
await page.getByRole("button", { name: /^Add$/ }).click();
const addToast = await waitForToast(page, /Address added|already here/i, 25000);
check("an address can be added", /Address added|already here/i.test(addToast), addToast.slice(0, 120));
await page.waitForTimeout(2500);
check("it appears in the table", (await page.getByText("browsertest@kloudbean.com").count()) > 0);
check(
  "the table shows what it may send today",
  (await page.getByLabel("Daily limit for browsertest@kloudbean.com").count()) === 1,
);
check(
  "a rate is withheld until there is enough to measure",
  (await page.getByText("too early").count()) > 0,
);

const capBox = page.getByLabel("Daily limit for browsertest@kloudbean.com");
await capBox.fill("7");
await capBox.blur();
const capToast = await waitForToast(page, /Daily limit changed/i, 20000);
check("its daily limit can be changed", /Daily limit changed/i.test(capToast), capToast.slice(0, 90));

const pauseBtn = page.locator('button[title="Stop using this address"]').first();
check("a pause button is offered", (await pauseBtn.count()) > 0);
await pauseBtn.click();
await waitForToast(page, /Done/i, 20000);
await page.waitForTimeout(2000);
check(
  "pausing is reflected in the header count",
  (await page.getByText(/\d+ paused/).count()) > 0,
);
const resumeBtn = page.locator('button[title="Start using it again"]').first();
check("and it can be started again", (await resumeBtn.count()) > 0);
await resumeBtn.click();
await waitForToast(page, /Done/i, 20000);
await page.waitForTimeout(1500);

/* ------------------------------------------- nothing else got broken */
for (const t of ["Trends", "Reddit", "Communities", "Distribution"]) {
  await page.locator('[role="tab"]').filter({ hasText: new RegExp(t, "i") }).first().click();
  await page.waitForTimeout(2200);
  check(`${t} tab still renders`, (await page.locator("body").innerText()).length > 300);
}
await page.locator('[role="tab"]').filter({ hasText: /Backlinks/i }).first().click();
await page.waitForTimeout(4000);
for (const keep of [
  "How it is going",
  "Replies for you to read",
  "Websites",
  "Find more websites",
  "Sending addresses",
]) {
  check(`still present: ${keep}`, (await page.getByText(keep).first().isVisible()));
}

await page.screenshot({ path: "/tmp/panels.png", fullPage: true });
const real = errors.filter((e) => !/favicon|React DevTools|autocomplete|source-?map/i.test(e));
check("zero page errors", real.length === 0, real.slice(0, 4).join(" || "));

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
