# Brief — MongoError: Authentication Failed? Check authSource Before the Password

Cluster: error field-guide / MongoDB. High AI-citation intent (people paste this error verbatim). Minimal product claims: one brief, in-context Kloudbean note plus one short CTA. Not interactive.

## Angle / information gain
"Authentication failed almost never means the password is wrong." Everyone checks the password first and it's usually correct. The gain: MongoDB authenticates a user against ONE authentication database, and `authSource` defaults to the database named in the connection string path. A user created in `admin` with a role on `appdb` fails when the URI ends `/appdb`, because Mongo looks in the wrong place. Fix: `?authSource=admin`, with the mechanism explained.

Secondary causes covered with real fixes: reserved characters in the password needing percent-encoding (`@` is the worst, it splits the URI), authentication vs authorization (`not authorized on appdb` is a different, better error), `.env` artefacts (trailing space, kept quotes, newline, stale value after rotation, wrong environment), SCRAM-SHA-1 vs SCRAM-SHA-256 mismatch, and replica-set / `mongodb+srv` option placement.

Engineering opinion: test with `mongosh` before touching app code, because it splits the problem in half (credentials vs app config). Anti-pattern named: pasting a literal password into a URI in source, which leaks the secret and breaks on reserved characters.

## Cannibalisation check
- `connect-mongoose-to-mongodb` owns driver options, connection events, models, indexes. Not touched here; linked.
- `managed-mongodb-hosting` owns running/choosing MongoDB, indexing, migration. Not touched here; linked.
- This page owns the auth failure and its diagnosis only. Distinct intent, links out twice instead of competing.

## Keywords
Primary: **MongoError authentication failed** in H1, `<title>`, meta description, first 100 words, and H2 ("What MongoError authentication failed actually means").
Variants woven naturally: MongoServerError bad auth, mongodb authentication failed, authSource, mongodb authentication failed password is correct, authSource=admin, not authorized on appdb, mongosh authenticationDatabase, percent encode mongodb password, SCRAM-SHA-256, mongodb+srv authSource.
No volume/difficulty data was supplied for this term, so none is asserted here.

## Grounding
Technical content is standard MongoDB behaviour (user records live in their auth database; `authSource` defaults to the URI path database; SCRAM mechanisms; SRV seed lists; URI reserved characters). Kloudbean claims limited to steering-confirmed facts: managed MongoDB (one of 7 engines), one-click provisioning, controlled access / IP allow-listing, automatic backups, connection details in the dashboard, runtime config in the UI. No private-networking-by-default claim. No numbers, no benchmarks, no frequencies.

## Security constraints honoured
Never suggests disabling auth or binding without credentials (explicitly warns against it). Passwords shown only as `PLACEHOLDER_PASSWORD`. Recommends a least-privilege `readWrite` user scoped to the app database over a root account. `mongosh` examples prompt for the password instead of embedding it.

## Shape
Lead -> tldr -> what the error means -> authSource mismatch (the fix + why) -> mongosh split test -> percent-encoding (+ table) -> auth vs authz (+ symptom table) -> .env artefacts -> SCRAM mechanism -> replica set / SRV -> 6-step diagnosis order -> where this class of mistake comes from (one Kloudbean note) -> related reading -> CTA -> 9 FAQ.

## Internal links (verified folders exist)
fix-econnrefused-node, environment-variables-done-right, secrets-management, connect-mongoose-to-mongodb, managed-mongodb-hosting, database-connection-pooling.

## Gate
0 em-dashes; 1600-2400 words; JSON-LD Article + FAQPage + Organization (@id kloudbean.com/#organization); FAQ h3 parity with schema; HTML code escaped; 3 img-slots with `src -> images/...` comments; 0 blurbs; banned-claim grep clean; .md and .html in sync.
