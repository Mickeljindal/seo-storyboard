# Brief — The AI-Built App Security Checklist

Silo 1 (AI builders), spoke that bridges to Silo 9 (secure/compliant hosting).

Primary keyword: **AI-built app security checklist**
Secondary / weave: secure a vibe-coded app, Lovable/Bolt/Cursor app security, AI-generated code security, is my AI app secure, secure AI app, hardcoded API key in frontend, AI app security best practices, are AI-generated apps secure.
(Volumes: none mined for this exact slug yet. Do not fabricate numbers; treat these as intent terms from the AI-builder + security clusters. Re-mine if precise volumes are needed.)

Intent: informational + commercial. Audience is a non-DevOps builder who shipped an app from Lovable, Bolt, Cursor, Replit, or v0 and now worries it's insecure. They want a plain-English list of what's likely wrong and how to fix it.

Angle: a real security checklist grounded in the failure modes AI/vibe-coded apps actually ship with. Symptom -> risk -> fix, per item:
1. secrets/API keys hard-coded in the client or committed to Git -> server-side env vars, rotate, scrub history
2. DB credentials or the DB itself exposed to the browser/public internet -> go through an API, private network
3. missing/weak auth, broken access control (AI stubs auth) -> real auth + server-side checks + 2FA
4. no input validation -> injection/XSS -> validate, parameterize, set security headers
5. overly permissive CORS -> lock the origin
6. dependency CVEs in generated package.json -> npm audit / pip-audit, update
7. no HTTPS -> free auto-renewing SSL
8. no rate limiting/brute-force protection -> Fail2ban baseline + app-level limits
9. no backups -> automatic backups, test a restore

Framing: AI code optimizes for "it works", not "it's safe". Shared responsibility (platform hardens infra, you own app-level). Founder note: the most common AI-app breach is a leaked key in front-end code or Git, not an exotic exploit.

Distinct value: maps generated-code smells to concrete fixes; a one-glance risk/fix table; the shared-responsibility boundary made concrete for a solo builder. Bridges the AI-builder silo to the security hub.

Bespoke SVG: an AI-built-app attack-surface / before-after hardening map. Left column "ships like this (risky)": secrets in client/Git, DB open to the internet, stubbed auth, unvalidated input, plain HTTP + CORS *. Right column "harden it to this": env vars, private network, real auth + 2FA, validate + parameterize, HTTPS + tight CORS. Brand navy/purple/green. Unique (not the pillar's gauge, not the hub's layered bands).

Console screenshots (../assets/console/): env-vars (secrets server-side), user-2fa-security (auth), ssl-certificate (HTTPS), firewall (Shorewall + Fail2ban baseline; BitNinja light). Plus 3-4 img-slots.

Internal links (all folders exist): UP deploy-ai-built-app-to-production; across secure-compliant-hosting, security-headers-guide, environment-variables-done-right, add-managed-database-to-your-app; money secure-compliant-hosting.

Byline: "By Kloudbean Security · The gap between an AI app that works and one that's safe to ship." NOT "Faster Than Ever".

Honesty guardrails: name AI tools fairly (do NOT say they're insecure by design; generated code optimizes for working, security is on you). Shorewall+Fail2ban baseline real; free SSL; env vars in UI; private networking; 2FA/UAC; automatic backups. BitNinja light only. Never "certified"; shared-responsibility. from $8/mo, Enterprise custom. Linux stacks. No customer/geo counts.
