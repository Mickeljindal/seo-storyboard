# Brief — Server Hardening Checklist (Silo 9: Security)

**Slug:** server-hardening-checklist
**Silo:** 9 (Security + compliance). Role: SPOKE under the `secure-compliant-hosting` pillar. Links UP to the pillar, ACROSS to security siblings, and ONE managed-X money page (`what-is-a-managed-server`).
**Intent:** A developer with a fresh Linux VPS/Ubuntu box who wants an actionable, ordered hardening list, plus the honest managed-platform payoff (baseline hardening handled, so they can focus on app-level security). Teach-first, then land on Kloudbean.

## Keywords (volumes hedged, nothing fabricated)
- **Primary:** "server hardening checklist" (informational, developer intent; solid steady volume). Placed in H1, `<title>`, meta description, first 100 words, and the H2 "The server hardening checklist, in order."
- **Also target (co-primary):** "how to secure a Linux server" (in H1 + an FAQ), "server security best practices" (woven into the founder-opinion section).
- **Secondary / long-tail (weave through body + FAQ):** Linux server security, harden Ubuntu server, SSH hardening, disable root login, disable password authentication, firewall rules / default-deny, ufw, fail2ban, brute force protection, least privilege, keep server patched / unattended-upgrades, secure a VPS, close unused ports, non-root service user.
- **PAA-style questions (answered in FAQ):** what is a server hardening checklist, how do I secure a Linux server, what is the highest-value hardening step, should I disable root SSH login, do I need fail2ban if I use SSH keys, what ports should I leave open, does managed hosting harden the server for me, how often should I patch, hardening vs firewall, is hardening one-time.

## Byline (unique)
By Kloudbean Security · Lock the Doors First. The boring hygiene that stops the attacks that actually happen.

## Shape (not a fixed template)
Checklist / field-guide. Opens by killing the zero-day myth (most breaches are boring: unpatched box, open port, weak SSH, leaked key), states a clear founder position (baseline hygiene beats fancy tooling), then an ordered 1-10 checklist where each item gives the WHY + the failure it prevents + a concrete command. Then a managed-vs-unmanaged "who does each" table, the honest shared-responsibility boundary, a five-minute quick-win recap, CTA, and a 10-question FAQ.

## Bespoke SVG concept
Concentric "attack surface reduction" rings (unique to this article; distinct from the pillar's vertical PLATFORM/YOU-OWN defense-in-depth stack). Outer to inner: 1 Patched OS -> 2 Firewall default-deny -> 3 SSH keys + Fail2ban -> 4 Least-privilege app -> 5 TLS, wrapping a green "Your app + data" core. Numbered badges on each band + a right-side legend with the failure each ring prevents. Brand colors navy #000f27, purple #4F1AF3, green #40b75f.

## Console screenshots (real, ../assets/console/)
- `firewall.png` (Shorewall + Fail2ban baseline) after the firewall step.
- `server-health.png` (CPU/RAM/disk) after the monitoring step.
- Plus 3 `.img-slot` spacers (key-based SSH login terminal; non-root service-user layout; server-baseline vs app-level split). Hero images/hero.png rendered later by the pipeline.

## Internal links (7; all target folders verified LIVE)
- `fix-ssl-certificate-errors` (TLS step)
- `server-backups-guide` (backups step)
- `environment-variables-done-right` (secrets step; used because `secrets-management` does not exist yet)
- `security-headers-guide` (app-level "your side" security)
- `secure-compliant-hosting` (UP to the Silo 9 pillar; shared responsibility)
- `what-is-a-managed-server` (the managed-X money page)
- `the-real-cost-of-unmanaged-vps` (the hours cost of running the baseline yourself)

Note: `ssl-tls-explained` and `secrets-management` were candidates but their folders do NOT exist, so they were not linked.

## Honesty notes (hard guardrails applied)
- Kloudbean baseline grounded ONLY in facts: Shorewall firewall + Fail2ban (on by default), free auto-renewing SSL, automatic backups, managed OS/stack patching. Access tools: IP Access Control (allow/deny, CIDR), Basic Auth gate for apps, subusers + UAC.
- Shared-responsibility line stated plainly: platform hardens the server baseline; customer owns app-level security (dependencies/CVEs, code, auth logic, secrets). Same in both table columns.
- NO managed-WAF claim beyond Shorewall/Fail2ban (Cloudflare not even needed here; not claimed). BitNinja NOT mentioned (kept off; never a headline).
- No invented metrics, no percentages, no "certified", no SLA figures. Linux stacks only. Numbers used are real/standard (port numbers 22/80/443/5432/3306/6379/27017, real commands), not fabricated benchmarks.
- No banned blurb phrases (1,000+, 30+ countries, two-minute, ~2-min, 24/7 human).
