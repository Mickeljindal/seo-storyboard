# Brief — No Direct Database Access: Architecting for CSCC 2-2-1-8

Cluster: Saudi / NCA compliance (task #2). Single-control deep dive on the CSCC control with the largest effect on daily engineering practice. NOT interactive (one inline SVG architecture diagram).

## CONFIDENTIALITY
Zero client reference. Control text from the PUBLIC CSCC-1:2019 document. Capabilities generic, from the gitignored steering file. (Grep note: "optimisation" contains "misa" -> false positive.)

## Grounding — 2-2-1-8 decomposed, plus the controls it interlocks with
- 2-2-1-8 has THREE parts, separated explicitly in the article: (a) no direct access AND INTERACTION for all users, (b) DBAs are the only exception, (c) users reach data through applications only, plus the "with consideration given to applying security solutions that limit or prohibit visibility of classified data to database administrators" clause. The word "interaction" is called out (a read-only connection still counts).
- Interlocks used: 2-4-1-1 (segregate/isolate networks), 2-12-2 + 2-13-3-1 (min 3 tiers = same architecture from another angle), 2-2-1-3 (MFA), 2-3-1-4 (isolated management network for privileged accounts), 2-2-1-7 (service accounts, interactive login disabled), 2-6-1-2 (classify data), 2-7-1-2 (encryption at rest incl. COLUMN level, which is what makes app-layer field encryption compliant-friendly), 2-6-1-1 + 2-6-1-5 (why you can't just dump prod for local debugging or reporting).

## ORIGINAL VALUE (what no other compliance page does)
1. The "what this breaks" TABLE. Five real habits that stop working (GUI client on prod, ad-hoc analyst SQL, support engineer lookup, prod dump for local debugging, batch job from a dev machine) each paired with the legitimate replacement. This is the practical blocker teams hit and nobody addresses it. Framed with a real engineering insight: unacknowledged friction becomes shadow workarounds that undo the control.
2. The DBA-visibility clause treated seriously and ranked by strength (app-layer field encryption > tokenisation > query-layer masking for admin sessions > separation of duties on keys), WITH the honest limit that infrastructure cannot achieve it alone and "anyone claiming a hosting product removes DBA visibility by itself is overstating what infrastructure can do". That line is a deliberate anti-overclaim trust signal.
3. WHY the control exists, explained in two mechanisms: accountability (direct query = connection + statement with no business context; app path = identity + authz decision + meaningful action + audit trail) and credential blast radius (a leaked connection string is far less useful when no internet route to the port exists).
4. An evidence paragraph: answer with configuration, not policy.

## Positioning discipline
- Infrastructure half vs application half split explicitly, twice (body + FAQ).
- "Managed enterprise engagements" framing. No self-serve implication.
- Offers to "design the split with you" rather than claiming to cover application work.
- No SLA, no CCC claim, no KSA entity claim, no exaggeration.
- Consultative CTA.

## Keywords
Primary: **CSCC 2-2-1-8** / **no direct database access compliance** / **private database access control Saudi**. In H1/title/meta/first 100 words/H2. Secondary: database private ip no public endpoint, developers cannot access production database, dba exception compliance, limit dba visibility classified data, application layer database access nca, bastion database access.
6 FAQ -> FAQPage JSON-LD.

## Shape (single-control architecture piece; distinct from pillar/checklist/log/backup shapes)
Lead -> tldr -> what the control actually says (3 parts) -> why it exists (2 mechanisms) -> the architecture (4 elements) -> SVG diagram (users->app->private DB; DBAs->VPN+bastion; no public route) -> what this breaks + what to offer instead (table) -> the uncomfortable part: limiting DBA visibility (ranked options + honest limit) -> how to evidence it -> launch-database screenshot -> where Kloudbean fits -> related reading -> CTA -> 6 FAQ.

## Internal links (all verified to exist)
nca-cscc-compliance-guide, critical-systems-hosting-checklist (same batch), what-is-a-vpc, database-connection-pooling, managed-postgresql-hosting, cscc-log-retention-immutable-logs, data-residency-saudi-arabia.

## Console screenshots
../assets/console/launch-database.png. Hero images/hero.png (empty). Inline SVG in brand colours (navy #000f27, purple #4F1AF3, green #40b75f, red #c0392b for the restricted DBA path).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid; images resolve; 0 banned blurbs; html/md in sync (.md describes the SVG in prose instead of embedding it).
