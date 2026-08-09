# Brief — CSCC 18-Month Log Retention: Immutable Logging for Saudi Critical Systems

Cluster: Saudi / NCA compliance (task #1). Narrow, high-intent, and directly servable. NOT interactive.

## CONFIDENTIALITY
Zero client reference. All controls from the PUBLIC CSCC-1:2019 document (White / Open). Capabilities from the gitignored enterprise-compliance steering file, stated generically as managed-engagement capability.

## Grounding — subdomain 2-11 verified against the open document
- 2-11-1-1 event logs on ALL technical components; 2-11-1-2 file integrity management alerts + monitoring; 2-11-1-3 monitor and analyse user behaviour; 2-11-1-4 monitor around the clock; 2-11-1-5 maintain and protect logs from unauthorised access, tampering, illegitimate modification and/or deletion, log shall include details (time, date, ID, affected system); 2-11-2 retention 18 months minimum.
- Component breadth pulled from the CSCC components list to justify "all components" (network devices, firewall, IDS/IPS, databases, storage, middleware, servers+OS, applications, encryption devices).
- UBA definition taken from CSCC Appendix B glossary (track, collect, analyse user data, identify patterns, detect harmful or unusual behaviour).
- 4-2-1-1 used for the "can logs live outside KSA" FAQ, hedged with "confirm with your compliance team" (we should not give legal advice).
- 18 months = 548 days (arithmetic, and it matches the retention figure Kloudbean configures).

## ORIGINAL VALUE (the reason this ranks and gets cited)
The retention-vs-immutability distinction. Most compliance content treats 2-11-2 as the whole story. The genuine engineering insight: a 548-day lifecycle rule satisfies retention and FAILS 2-11-1-5, because a privileged account can still delete objects. Only write-once + retention lock satisfies both. Plus the honest caveat that a retention lock also prevents YOU from deleting early, which is a deliberate decision not a surprise. Nobody writes that.
Second original point: cloud logging defaults are weeks-to-a-month, so you are compliant on day one and silently non-compliant by month two.

## Positioning discipline
- 2-11-1-4 handled honestly: infra can do collection/alerting/anomaly detection; investigation + severity classification + escalation + regulator reporting need people. SOC/SIEM stated as collaborative, client-scoped, NOT a fixed package (owner correction).
- 2-11-1-3 hedged: infra gives identity/access-pattern coverage; full UBA needs SIEM. Do not overclaim.
- Kloudbean paragraph explicitly says "enterprise engagement rather than a self-serve toggle".
- No exaggeration: no SLA, no "fully compliant", no invented tooling names in the article body (the specific vendor agent name stays internal).

## Keywords
Primary: **CSCC log retention** / **18 month log retention NCA** / **immutable logs Saudi compliance**. In H1/title/meta/first 100 words/H2. Secondary: cscc 2-11-2, nca log retention requirement, tamper proof log storage, WORM log retention lock, file integrity monitoring cscc, 24/7 monitoring cscc soc.
6 FAQ -> FAQPage JSON-LD.

## Shape (single-subdomain deep dive; deliberately different from the pillar's framework-overview shape)
Lead -> tldr (direct answer + the immutability catch) -> what 2-11 requires (control table) -> 18 months vs defaults -> retention != immutability (the original insight) -> what a log line needs -> file integrity monitoring -> around-the-clock + honest boundary -> user behaviour monitoring -> 9-step practical checklist -> add-server screenshot -> where Kloudbean fits -> related reading -> CTA (consultative) -> 6 FAQ.

## Internal links (all verified to exist)
nca-cscc-compliance-guide (same batch), nca-ecc-compliant-hosting, pdpl-compliance-hosting, structured-logging-nodejs, server-backups-guide, data-residency-saudi-arabia.

## Console screenshots
../assets/console/add-server.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid; images resolve; 0 banned blurbs (note: "around the clock" used deliberately instead of the banned "24/7 human" phrasing in body copy; the FAQ question says "24/7 SOC" which is the user's search term, not a Kloudbean support claim); html/md in sync.
