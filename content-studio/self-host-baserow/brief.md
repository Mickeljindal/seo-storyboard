# Brief: self-host-baserow

## Role in the cluster
Silo 7 (Self-hosted tools). Pillar: best-self-hosted-tools. Cousin: self-host-nocodb (Airtable alt,
DISTINCT model, cross-link). Money page: add-managed-database-to-your-app.

## Keyword grounding (honest)
Branded per-tool spoke. Real intent: self host baserow, baserow self hosted, baserow docker, baserow
vs nocodb, open source airtable alternative, no-code database self hosted. No fabricated volume.

Primary: **self-host Baserow**. Secondary: Baserow vs NocoDB, open-source Airtable alternative,
self-hosted no-code database, no-code database with real-time collaboration.

## Cannibalisation (mandatory)
Live self-host-nocodb = visual interface OVER an existing SQL database. Baserow = SELF-CONTAINED
no-code platform that manages its OWN Postgres. Genuinely different model -> different reader
decision -> distinct branded query. Cross-link NocoDB for the "vs"; do not re-teach generic "what is
an open-source Airtable alternative".

## Verified facts (baserow.io, elest.io/softr/cloudzy/medium NocoDB comparisons)
- Baserow: open-source no-code database / Airtable alternative. A COMPLETE no-code platform that
  manages its OWN PostgreSQL database and adds an application builder, automation engine, dashboards,
  role-based permissions, and real-time collaboration. API-first. "Trying to be the entire stack."
- Self-contained standalone no-code relational database. Real-time collaboration (see co-workers'
  changes live). Budget roughly a 2 vCPU / 4 GB server.
- Licensing: core is open source (MIT); some views/features (e.g. Kanban, calendar) are Premium and
  need a paid license. HEDGE and verify current terms; volunteer this honestly.
- NocoDB (cousin, contrast): visual layer ON TOP of an existing SQL database (Postgres/MySQL); best
  when you already have a database with tables; changes need a refresh (conflict risk).

## Information gain (the honest angle)
1. The decision cue: Baserow = standalone no-code DB (its own Postgres, be the whole stack, start
   fresh); NocoDB = expose an EXISTING database as a spreadsheet UI. Do you have a DB to wrap
   (NocoDB) or want a fresh standalone no-code DB (Baserow)? That is the whole choice.
2. Real-time collaboration is a genuine Baserow advantage (NocoDB needs a refresh / conflict risk).
   Checkable, decision-changing.
3. The Premium caveat: core is open source, but some views (Kanban, calendar) are Premium/paid.
   Honest gap to volunteer, like the Directus BSL note.
4. Concede: if your data already lives in a SQL database you want to keep as the source of truth,
   NocoDB's over-existing-DB model fits better.

## Claims (facts files only)
Managed server; managed PostgreSQL (Baserow's own DB, backed up); free auto-renewing SSL; automatic
backups; S3-compatible object storage (attachments); managed reverse proxy; 7 clouds; one dashboard.
NOT one-click. Honest boundary: platform runs server + Postgres + SSL + backups; the Baserow app,
your data, and any Premium license are yours.

## Format
Match live self-host shape. What it is, the self-contained-vs-NocoDB difference (the decision, table),
real-time collaboration, the Premium caveat, what it takes to run + backups, where hosting fits,
related reading, FAQ. Server-based (not one-click).
