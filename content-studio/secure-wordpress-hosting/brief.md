# Brief — Secure WordPress Hosting (checklist/playbook)

Cluster 6. Primary kw: secure wordpress hosting / wordpress security / harden wordpress. Intent: informational/checklist. Signal 1000.
FORMAT: Checklist/playbook (grouped: you-level vs server-level). Not adjacent to other playbook. Opener = why WP is targeted (popularity = attack surface).
Sections: Group A "the app-level basics you own" (updates core/plugins/themes, strong admin + 2FA, limit logins, least-privilege users, disable admin file editing, secure wp-config keys/salts + permissions, disable XML-RPC if unused) — SCREENSHOT env-vars.png at secrets/keys. Group B "what a good host handles" (server patching, firewall/WAF, SSL, isolation, off-site backups, DDoS). Then "what security is NOT" (a plugin alone isn't a strategy). 
Real: "2fa for wordpress" 260, "secure wordpress hosting" 1000.
Honesty woven: Linux; managed=server/stack/SSL/backups + host-level security; you own app-level hygiene. Security is shared responsibility.
Byline: "Kloudbean · Hardened by default, not by luck."
Slug: secure-wordpress-hosting. Links: wordpress-2fa (future), fix-error-establishing-database-connection-wordpress, security headers (C9).
