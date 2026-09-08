# Browser checks for the growth page

Three Playwright suites that drive the real UI against the real database. They are
the only checks that catch a broken render, a dead button or a page error, which no
amount of type checking or unit assertions will find.

## Running them

Playwright lives in `social-studio/`, so the scripts have to run from there:

```bash
# 1. start the app (leave it running)
npm run dev

# 2. in another terminal, from the repo root
cd social-studio
cp ../scripts/browser/links-workspace.mjs ./_x.mjs && node ./_x.mjs; rm -f ./_x.mjs
cp ../scripts/browser/links-writes.mjs ./_x.mjs && node ./_x.mjs; rm -f ./_x.mjs
cp ../scripts/browser/recipes-and-inboxes.mjs ./_x.mjs && node ./_x.mjs; rm -f ./_x.mjs
```

The copy step is not superstition: the scripts import `playwright`, which only
resolves inside `social-studio/`.

## What each covers

| File | Checks | Covers |
|---|---|---|
| `links-workspace.mjs` | 33 | Every card renders, filters, search, sort, bulk select and approve, the row detail panel, all five tabs, zero page errors |
| `links-writes.mjs` | 16 | Real writes: edit and save a pitch, the human-edited badge, restoring it, notes, checking a link now, a dry-run send, and that no real-send button appears while sending is off |
| `recipes-and-inboxes.mjs` | 46 | All five recipes offered with honest badges, a real skyscraper run, re-running a past look, the address pool, adding an address, changing its limit, pausing and resuming |

## Things learned the hard way

- **Poll for a toast, never sleep and then read it.** Toasts expire after 8 to 11
  seconds, so a fixed `waitForTimeout` followed by a read finds an empty page. Each
  suite carries a `waitForToast(page, regex)` helper for this.
- **Select dropdowns by `aria-label`, not by index.** The count changes: a fourth
  combobox appears once any campaign exists, which silently shifted every index.
- **The tab is called "Trends", not "Trending".**
- **These suites write real rows.** `links-writes.mjs` restores the pitch it edits,
  and `recipes-and-inboxes.mjs` adds `browsertest@kloudbean.com`. Assertions that
  depend on an empty starting state have to be conditional, or the second run
  reports a working UI as broken.
