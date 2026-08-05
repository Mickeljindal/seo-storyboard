# Brief — Security Headers Guide (checklist)

Cluster 9. Primary kw: security headers / http security headers / security headers check. Intent: how-to/checklist. Signals: security headers check 210 (+checker/scanner variants), strict transport security hsts 210.
FORMAT: Checklist. Opener = the free-scan-score scenario.
Headers checklist: HSTS (force HTTPS), CSP (control what loads — note it needs care), X-Frame-Options (clickjacking), X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy. Then: how to check (a headers scanner/grade), where to set them (web server or app — SCREENSHOT env-vars.png as config), which are set-and-forget vs CSP needs tuning.
Real: security headers check 210, HSTS 210.
Honesty woven: Linux/web server; headers set at server or app level; managed can set common ones; you own CSP policy; HTTPS required first.
Byline: "Kloudbean · Headers that quietly protect you."
Slug: security-headers-guide. Links: fix-ssl-certificate-errors, what-a-waf-does, secure-wordpress-hosting (C6).
