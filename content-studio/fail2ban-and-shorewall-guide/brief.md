# Brief: fail2ban-and-shorewall-guide

## Role in the cluster
Silo 9 (Security + compliance). Pillar: secure-compliant-hosting (LIVE). Money page:
kloudbean-vs-cloudways. Cross-link: what-a-waf-does, ddos-protection-explained (distinct layers).

## Keyword grounding (honest)
Real intent: fail2ban, shorewall, host firewall, ssh brute force protection, server hardening,
block brute force attacks, iptables firewall. No fabricated volume.

Primary: **Fail2ban and Shorewall**. Secondary: host firewall, SSH brute-force protection, server
hardening, block brute-force attacks, deny-by-default firewall.

## Cannibalisation (checked, task 1)
Distinct from what-a-waf-does (APP layer) and ddos-protection-explained (edge/volumetric). This is
HOST layer: a firewall (Shorewall) + brute-force banning (Fail2ban). Cross-link both, own the host-
hardening intent.

## Grounding (facts files)
kloudbean-facts: "Baseline hardening: Shorewall firewall + Fail2ban (auto). Free SSL." So both are
auto-installed baseline on Kloudbean. That is the grounded product hook: you get them without setup.

## Technical facts (standard, well-established tools; no web verify needed)
- Shorewall: a high-level configuration tool for the Linux netfilter/iptables firewall. Lets you
  define zones/policies; the sane posture is deny-by-default inbound, allow only needed ports.
- Fail2ban: a daemon that watches log files (SSH auth log, etc.) for repeated failures/abuse patterns
  and temporarily bans the offending IP by adding a firewall rule. Config = jails (per-service),
  maxretry, findtime, bantime.
- The real problem: any public server is hit by automated SSH brute-force + port scans within minutes;
  auth logs fill with failed logins from bots worldwide. Firewall closes unused doors; Fail2ban bans
  the bots hammering the doors you must keep open (like SSH).

## Information gain (angles)
1. The-invisible-attack: your server is under automated attack constantly, whether or not you notice.
   Concrete: SSH auth logs full of failed root/admin login attempts from global bot IPs.
2. The-status-of-the-layer: firewall = which doors are open; fail2ban = ban who knocks too hard;
   WAF = app-layer request filtering; DDoS scrubbing = volumetric at the edge. Four different layers,
   a table. Naming which does what replaces the vague "is my server secure?".
3. Honest limits: these are host-level. They are NOT a WAF, NOT DDoS scrubbing, NOT a substitute for
   updates, strong SSH keys (disable password auth), and least-privilege. Volunteer that.

## Claims (facts files only)
Shorewall + Fail2ban auto/baseline on Kloudbean; free SSL; the managed platform patches the OS. WAF
is a paid add-on concept / Cloudflare for app layer (link what-a-waf-does; do not overclaim). DDoS via
Cloudflare on internet-facing (enterprise-compliance) - keep light, link ddos page. Honest boundary:
platform hardens the server (firewall, brute-force banning, patching, SSL); your app code, your SSH
key hygiene, and your app-layer security stay yours.

## Format
Match live security-explainer shape (what-a-waf-does / ddos style: what it is, the layers, honest
limits, where Kloudbean fits, FAQ). Inline SVG layers diagram. Server-based/baseline, not one-click.
