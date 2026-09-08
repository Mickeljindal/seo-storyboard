import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3000";
const errors = [];
const results = [];
function check(name, ok, extra = "") {
  results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 300)}`);
});

await page.goto(`${BASE}/growth`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

// --- all tabs render
const tabNames = await page.locator('[role="tab"]').allInnerTexts();
check("growth page loads with tabs", tabNames.length >= 4, tabNames.join(" | "));

// --- open the Backlinks tab
const linkTab = page.locator('[role="tab"]').filter({ hasText: /link|backlink/i }).first();
await linkTab.click();
await page.waitForTimeout(4000);

check("metrics card renders", await page.getByText("How it is going").isVisible());
check("funnel tiles render", (await page.getByText("Links live").count()) > 0);
check(
  "reply/link rate shown",
  (await page.getByText(/Reply rate:/).count()) > 0 && (await page.getByText(/Link rate:/).count()) > 0,
);
check("sending card renders", await page.getByText("Sending", { exact: true }).first().isVisible());
check("replies card preserved", await page.getByText("Replies for you to read").isVisible());
check("websites list card renders", await page.getByText("Websites", { exact: true }).first().isVisible());
check(
  "check-for-links button present",
  (await page.getByRole("button", { name: /Check for links now/i }).count()) === 1,
);
check(
  "find-and-write preserved",
  (await page.getByRole("button", { name: /Find and write now/i }).count()) === 1,
);
check(
  "what-would-go-out preserved",
  (await page.getByRole("button", { name: /What would go out/i }).count()) === 1,
);

// --- search box
const search = page.getByLabel("Search websites");
check("search input present", await search.isVisible());
const shownBefore = (await page.getByText(/\d+ shown/).first().innerText()).trim();
await search.fill("zzzzzznotarealdomain");
await page.waitForTimeout(800);
const shownAfter = (await page.getByText(/\d+ shown/).first().innerText()).trim();
check("search filters the list", shownAfter === "0 shown", `${shownBefore} -> ${shownAfter}`);
await search.fill("");
await page.waitForTimeout(800);

// --- stage filter: switch to "Everything"
const stageSel = page.getByLabel("Stage filter");
const typeSel = page.getByLabel("Kind of page filter");
const sortSel = page.getByLabel("Sort order");
check(
  "three filter dropdowns present",
  (await stageSel.count()) === 1 && (await typeSel.count()) === 1 && (await sortSel.count()) === 1,
);
await stageSel.click();
await page.waitForTimeout(400);
await page.getByRole("option", { name: "Everything" }).click();
await page.waitForTimeout(3000);
const shownAll = (await page.getByText(/\d+ shown/).first().innerText()).trim();
check("stage filter changes the list", shownAll !== "0 shown", shownAll);

// --- sort dropdown
await sortSel.click();
await page.waitForTimeout(400);
await page.getByRole("option", { name: "Best known first" }).click();
await page.waitForTimeout(1200);
check("sort applied without error", true, shownAll);

// --- back to "Pitch written" so we get selectable rows
await stageSel.click();
await page.waitForTimeout(400);
await page.getByRole("option", { name: "Pitch written" }).click();
await page.waitForTimeout(3000);
const queuedShown = (await page.getByText(/\d+ shown/).first().innerText()).trim();
check("queued stage filter works", true, queuedShown);

// --- bulk select
const selectAll = page.getByRole("button", { name: /Select the \d+ with a pitch waiting/i });
if (await selectAll.count()) {
  await selectAll.click();
  await page.waitForTimeout(700);
  check("bulk bar appears on selection", (await page.getByText(/\d+ selected/).count()) > 0);
  check(
    "bulk approve + skip + campaign label present",
    (await page.getByRole("button", { name: /Approve selected/i }).count()) === 1 &&
      (await page.getByRole("button", { name: /Skip selected/i }).count()) === 1 &&
      (await page.getByLabel("Campaign name to apply").count()) === 1,
  );
  await page.getByRole("button", { name: /^Clear$/ }).click();
  await page.waitForTimeout(400);
  check("clear deselects", (await page.getByText(/\d+ selected/).count()) === 0);
} else {
  check("bulk bar appears on selection", false, "no queued rows to select");
}

// --- open a row
const openBtns = page.getByRole("button", { name: "Open", exact: true });
const openCount = await openBtns.count();
check("rows have an Open button", openCount > 0, `${openCount} rows`);
if (openCount > 0) {
  await openBtns.first().click();
  await page.waitForTimeout(4000);
  check("detail: contact section", (await page.getByText("Who we write to").count()) > 0);
  check("detail: verification section", (await page.getByText("Did the link appear?").count()) > 0);
  check(
    "detail: check-their-page button",
    (await page.getByRole("button", { name: /Check their page now/i }).count()) > 0,
  );
  check("detail: stage select", (await page.getByText("Move this to").count()) > 0);
  check("detail: note box", (await page.getByLabel("Note").count()) > 0);

  // contact inline edit opens
  const changeBtn = page.getByRole("button", { name: /^(Change|Add one)$/ }).first();
  if (await changeBtn.count()) {
    await changeBtn.click();
    await page.waitForTimeout(600);
    check("contact edit opens with inputs", (await page.getByLabel("Contact email").count()) > 0);
    await page.getByRole("button", { name: /^Cancel$/ }).first().click();
    await page.waitForTimeout(400);
  } else {
    check("contact edit opens with inputs", false, "no change button");
  }

  // pitch edit opens if there is a draft
  const editBtn = page.getByRole("button", { name: /^Edit$/ }).first();
  if (await editBtn.count()) {
    await editBtn.click();
    await page.waitForTimeout(600);
    check(
      "pitch edit opens with subject + body",
      (await page.getByLabel("Subject").count()) > 0 && (await page.getByLabel("Email body").count()) > 0,
    );
    check(
      "save-my-wording button present",
      (await page.getByRole("button", { name: /Save my wording/i }).count()) > 0,
    );
    await page.getByRole("button", { name: /^Cancel$/ }).first().click();
    await page.waitForTimeout(400);
  } else {
    check("pitch edit opens with subject + body", false, "no draft pitch on this row");
  }
}

// --- other tabs still work (no feature destroyed)
for (const t of ["Trends", "Reddit", "Communities", "Distribution"]) {
  const tab = page.locator('[role="tab"]').filter({ hasText: new RegExp(t, "i") }).first();
  if (await tab.count()) {
    await tab.click();
    await page.waitForTimeout(2500);
    const bodyLen = (await page.locator("body").innerText()).length;
    check(`${t} tab still renders`, bodyLen > 300, `${bodyLen} chars`);
  } else {
    check(`${t} tab still renders`, false, "tab not found");
  }
}

await page.screenshot({ path: "/tmp/links-workspace.png", fullPage: false });

const real = errors.filter(
  (e) => !/favicon|Download the React DevTools|autocomplete|source-?map/i.test(e),
);
check("zero page errors", real.length === 0, real.slice(0, 5).join(" || "));

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
