# Brief: why-ai-app-cant-connect-to-database

## Target
- **Primary keyword:** app can't connect to database (also "deployed app cannot connect to database").
- **Secondary / long-tail:** ECONNREFUSED database, connection refused postgres, database connection timeout, ENOTFOUND database host, password authentication failed, too many connections, whitelist IP database, can't connect to database after deploy.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no fabricated figures are recorded. Treat it as high-intent, error-string troubleshooting demand (people paste the exact error into Google) in the "Deploy AI / Vibe-Coded Apps" cluster. Re-pull real Volume + KD before scaling the sub-cluster. Grounding is intent-based, not volume-based (per the SEO OS: relevance over raw volume).

## Reader + business outcome
- **Reader:** someone who built an app (often with an AI builder like Lovable or Cursor, or by hand) that runs fine locally, deployed it, and now hits a database connection error on the live site.
- **Business outcome:** capture the exact post-deploy failure moment and route to Kloudbean's one-dashboard app + managed database, landing on the real fix (whitelist the app server's IP) and the honest managed boundary.

## Intent + format
- **Intent:** informational, troubleshooting. The reader has an error string in front of them and wants the cause and one decisive check.
- **Format:** a troubleshooting FIELD GUIDE that makes the reader classify by error string first, then fixes. Error-to-cause comparison table, one teaching SVG (the IP allow-list gate), a section per error, an ordered triage, one firm opinion, one anti-pattern. Varied from the reference (which is an architecture walkthrough); this is a diagnosis map.

## Cannibalisation check (mandatory)
- `why-ai-apps-fail-in-production` = connection exhaustion under load as one failure among many (breadth). This page = "can't connect at all" and the diagnosis by error string (depth on one symptom). Linked once for the under-load case, does not compete.
- `database-connection-pooling` = owns pooling. Linked from the "too many connections" branch, not duplicated.
- `why-my-ai-app-works-locally-but-not-in-production` = the general local-vs-prod gap. Linked; this page owns the database-connection version specifically.
- `last-mile-of-vibe-coding` = the map of everything AI builders leave for production. Linked UP.
- `managed-postgresql-hosting` / `add-managed-database-to-your-app` / `environment-variables-done-right` = component how-tos; this page is the diagnosis that ties the fix to them.
- Decision: distinct intent (diagnose a connection failure by its error string), build it.

## Information gain (one sentence)
One place that maps each connection error string to its layer and one decisive check, centred on the cause people miss most: a managed database refuses the deployed server because its IP was never added to the allow-list, which is exactly why it "works on my laptop but not in production."

## Kloudbean grounding (facts only)
Managed database public access is OFF by default; you enable it by whitelisting the connecting IP (dev machine, then app server IP) = IP Access Control, self-serve on standard, NOT a private VPC. Use the DB master user + host shown in the panel (not the hosting-account login). Automatic backups, free SSL, one dashboard, Git deploy, Node/Python. Private VPC is Enterprise-only, not a standard default. Plans from $8/mo (only confirmed price). Honest boundary: managed = server/stack/SSL/backups/patching; customer owns code + data. No invented numbers, uptime, benchmarks, customers, or "certified". No banned claims.

## Internal links used (all resolve)
Up: last-mile-of-vibe-coding. Across: managed-postgresql-hosting, database-connection-pooling, why-ai-apps-fail-in-production, environment-variables-done-right, why-my-ai-app-works-locally-but-not-in-production, add-managed-database-to-your-app. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs why-ai-app-cant-connect-to-database` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity, blurbs=0, internal links resolve, words >= 1400. (hero.png + H2-count warnings acceptable.)
