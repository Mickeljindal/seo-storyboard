# Brief: wordpress-agency-ai-app-hosting

## Target keyword (primary intent: informational, agency owner deciding how to handle AI work)
- **hosting AI-built apps for clients** (primary)
- WordPress agency AI apps

In H1, `<title>`, meta description, first 100 words of the lead, and the H2 "What hosting AI-built apps for clients actually needs".

## Secondary / long-tail (woven through body + FAQ, by intent)
- shared hosting can't run Node
- cPanel limitations (no root, no long-running process, no build step)
- can I run a Node app on cPanel shared hosting
- why won't my client's Lovable app run on my hosting
- agency moving beyond WordPress / host client apps
- can one host run both WordPress and Node apps
- what do I need to host an AI-built app
- how to price hosting for a client's app
- does an AI feature need a GPU

Volumes not asserted (owner-directed: no fabricated numbers). Terms chosen from real questions agency owners and vibe-coders paste into search; verify against DataForSEO / SEMrush export before any volume claim.

## Cannibalisation note (checked against real neighbours' H2 sets)
Distinct from the near neighbours:
- **agency-wordpress-hosting** owns WordPress *fleet operations* (isolate clients, stage changes, scoped access, onboard/offboard). This page does not re-teach fleet ops; it links there.
- **reseller-hosting-vs-managed-cloud** owns the *reseller vs managed cloud business-model* framing (noisy neighbours, oversold boxes). This page links there for the model choice.
- **hostinger-alternative / migrate-wordpress-to-kloudbean** own *WordPress migration* away from cheap shared hosts.
- **deploy-ai-built-app-to-production / last-mile-of-vibe-coding / why-ai-apps-fail-in-production** own the *developer's* deploy mechanics and failure modes.

This article owns a gap none of them cover head-on: the **technical reason a WordPress agency's shared cPanel stack physically cannot run a client's AI-built (Node/Python) app**, framed for the *agency owner* (business shift + capability requirements + pricing), not the developer. The overlap is intentional-and-linked, not competing.

## Information gain (one sentence)
It explains, concretely and for a non-developer agency owner, *why* the per-request PHP model of shared cPanel hosting cannot keep a long-running Node/Python process alive (with a capability matrix and a request-lifecycle diagram), then turns that into a requirements checklist, a which-project-goes-where table, and the honest business/pricing tradeoffs of taking on AI work.

## Product-claims note (Kloudbean appears only in the light closing touch)
Kloudbean is mentioned in exactly two light places near the end (the "Where this runs" paragraph + the low-key CTA). Claims used are limited to the approved facts: runs WordPress + Node/Python/Ruby/Java/static/AI on managed servers across several clouds from one dashboard; per-client isolation via subusers + User Access Control; staging (WordPress and Laravel); automatic backups; free SSL; managed databases; Git deploys with build + live logs; free migration; standard plans from $8/mo (verify on pricing page). Honest boundary stated once (managed covers server/stack/TLS/backups/patching; client's app code + data stay theirs). No SLA %, no "unlimited"/"no limits", no white-label claim, no invented customer counts, no "certified". GPU/model self-hosting referenced only as the separate case and linked to self-host-an-llm.

## Internal links used (7, all resolve to existing content-studio folders)
- last-mile-of-vibe-coding
- agency-wordpress-hosting
- reseller-hosting-vs-managed-cloud
- deploy-ai-built-app-to-production
- why-ai-apps-fail-in-production
- migrate-wordpress-to-kloudbean
- self-host-an-llm

## Format
Knowledge-first "the ground shifted, here's what changed" guide for agency owners. ~2000-2400 words. Answer-first `.tldr`; 2 comparison tables (capability matrix + which-project-goes-where); one teaching inline SVG (PHP per-request-and-dies vs Node/Python persistent process) in brand colours; image-slot comments for author screenshots; 10-question FAQ mirrored to FAQPage JSON-LD; Article + FAQPage schema. Near-zero em-dashes, contractions, direct address, one founder opinion. Byline tagline: "By Kloudbean Engineering · The stack that sold WordPress won't run a Node app." / closing "Keep the brochure sites cheap, give the app a real home."
