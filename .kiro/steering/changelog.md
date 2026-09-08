# Changelog discipline (always)

This product keeps a changelog. Whenever a new feature, capability, page, or
notable change ships in the seo-storyboard engine, update `CHANGELOG.md` in the
same change.

Rules:
- `CHANGELOG.md` (repo root) is the single source of truth. The in-app `/changelog`
  page renders it, so keeping the file current keeps the product view current.
- Add new entries ABOVE the marker comment, newest first, in this exact shape so
  the parser (`src/lib/changelog.functions.ts`) reads them:

  ```
  ## vX.Y.Z — YYYY-MM-DD — Short title
  Status: Shipped | Beta | Planned · Visibility: Internal | Public
  - concise feature line
  - concise feature line
  ```

- Always include: a version, a real date (YYYY-MM-DD), a title, Status, Visibility
  (Internal = team-facing engine capability; Public = customer-facing output), and
  a short bullet list of what changed.
- Bump the version sensibly: patch for fixes, minor for new features, major for big
  shifts. Don't invent dates — use the date the change is made.
- Do not delete past entries; the log only grows.
