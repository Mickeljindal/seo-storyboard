# Brief: why-sqlite-data-disappears-on-redeploy

## Target
- **Primary keyword:** SQLite data disappears after redeploy (verbatim in h1, title, meta description, first 100 words, one H2).
- **Secondary / long-tail:** database resets on deploy, SQLite file wiped on redeploy, why my data resets after deployment, ephemeral filesystem, lose data on redeploy, SQLite in production, AI app loses data.
- **PAA-style questions answered in the FAQ:** why does my database reset every deploy, why does my SQLite data disappear after a redeploy, what is an ephemeral filesystem, is SQLite ok for production, how do I stop losing data on redeploy, does this happen to user uploads too, can I commit the .db file to git, will Postgres/MySQL fix it, does a restart or crash also wipe it.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no figures are fabricated. Treat as a high-intent troubleshooting/error query in the "Deploy AI / Vibe-Coded Apps" cluster (people paste the symptom and the `SQLITE_ERROR: no such table` string into search). Grounding is intent-based per the SEO OS (relevance over raw volume); re-pull real Volume + KD before scaling the sub-cluster.

## Reader + business outcome
- **Reader:** someone (often a vibe-coder using Lovable, Cursor, Bolt, Replit) whose app worked locally and in prod, then lost all data after a routine deploy. They are mid-panic, searching the symptom.
- **Business outcome:** own the SQLite-wiped-on-redeploy intent in full, teach the ephemeral-disk mechanism, and route the fix to Kloudbean's managed Postgres/MySQL that lives outside the app (survives redeploys), landing on the honest managed boundary.

## Intent + format
- **Intent:** informational troubleshooting with a commercial tail (where do I put the data instead).
- **Format:** a diagnosis explainer that OPENS BY RULING THINGS OUT (your code isn't the problem, the disk is), then mechanism, then fix. Deliberately varied from the reference build-guide shape: short ruling-out section, a bespoke two-timeline SVG, a local-disk-vs-managed table, a "when SQLite is fine" fairness section, a "same bug, other disguises" generalisation, and a two-anti-patterns section. Deep FAQ.

## Cannibalisation check (mandatory)
- `why-my-ai-app-works-locally-but-not-in-production` lists SQLite-on-redeploy as cause #1 of seven (breadth). `why-ai-apps-fail-in-production` mentions it among many failures. THIS page owns the topic in full (mechanism, timing, fairness, anti-patterns, generalisation) and both defer here; it links back to them for the wider list rather than repeating it.
- `production-database-design-for-ai-apps` owns schema design; linked for "once you're on Postgres", not duplicated.
- `add-managed-database-to-your-app` owns the how-to of wiring a managed DB; linked as the fix, not repeated.
- `store-user-uploads-in-object-storage` owns the uploads sibling of the same bug; linked, not duplicated.
- Did NOT link persistent-storage-for-ai-apps or migrate-ai-app-sqlite-to-postgres (do not exist yet).
- Decision: distinct, ownable intent (the SQLite-wiped-on-redeploy diagnosis). Build it.

## Information gain (one sentence)
The full, concrete mechanism of why writable SQLite is wiped by a redeploy (the app filesystem is ephemeral, so a deploy swaps in a fresh instance with a fresh disk and the data was never in the code), why the timing fools everyone, when SQLite is still correct, two anti-patterns that make it worse (committing the .db to git; moving it to another ephemeral path), and the general rule that nothing needing to survive a deploy lives on local disk.

## Kloudbean grounding (facts only)
Managed database (Postgres, MySQL, and more) runs outside the app as its own service, so it survives redeploys; automatic backups; free SSL; deploy from Git; DB locked down by IP allow-listing (whitelist the app server's IP), NOT a default private network/VPC (VPC is Enterprise-only). One dashboard. $8/mo used lightly (confirmed). Honest boundary: managed = server/stack/SSL/backups/patching; customer owns code + data. No invented numbers, uptime, benchmarks, customers, or "certified"; no banned claims.

## Internal links used (all resolve)
Up: last-mile-of-vibe-coding. Across: why-my-ai-app-works-locally-but-not-in-production, why-ai-apps-fail-in-production, add-managed-database-to-your-app, managed-postgresql-hosting, production-database-design-for-ai-apps, store-user-uploads-in-object-storage. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs why-sqlite-data-disappears-on-redeploy` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity (9), blurbs=0, internal links resolve, words >= 1400. (hero.png absent + H2 off-by-one warnings acceptable; the CTA is an h2 in the .md and a div in the .html by design.)
