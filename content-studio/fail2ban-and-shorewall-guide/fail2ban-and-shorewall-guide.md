---
title: "Fail2ban and Shorewall: The Two Tools Quietly Guarding Your Server"
description: "Every public server is brute-forced within minutes. Shorewall closes the doors and Fail2ban bans the bots. What each does, how they differ from a WAF and DDoS protection, and their honest limits."
slug: fail2ban-and-shorewall-guide
canonical: https://www.kloudbean.com/blog/fail2ban-and-shorewall-guide/
cluster: 9. Security and compliance
pillar: secure-compliant-hosting
money_page: kloudbean-vs-cloudways
byline: Close the doors, ban the knockers, then build the rest on top.
---

# Fail2ban and Shorewall: The Two Tools Quietly Guarding Your Server

By Kloudbean Engineering · The least glamorous security you have, and some of the most important.

Put a brand-new server on a public IP and watch the logs. Within minutes, before you have told a single person it exists, strangers are trying to log in. Bots sweep the entire internet around the clock, guessing passwords on port 22 and knocking on every port you left open. It is relentless, it is automated, and it is aimed at every server, not just yours. Two humble tools handle most of it: Shorewall, which decides what can reach the server at all, and Fail2ban, which bans the ones hammering the doors you have to keep open. They are not exciting. They are the seatbelt of server security, and on Kloudbean they are fastened by default.

> **What do Fail2ban and Shorewall do?**
>
> Shorewall is a host firewall: it configures the Linux netfilter/iptables layer to block everything by default and allow only the ports your services actually need, so most of the internet's probing hits a closed door. Fail2ban is a brute-force bouncer: it watches logs like the SSH auth log, and when an IP racks up failed logins, it bans that IP temporarily by adding a firewall rule. Together they cut the constant automated attacks that hit every public server. They work at the host and network layer, which is different from a WAF (application layer) and from DDoS protection (volumetric, at the edge). On Kloudbean both are part of the baseline hardening, set up automatically, so you get this floor of protection without configuring anything.

<!-- ADD IMAGE: hero, a server behind a Shorewall firewall closing unused ports while Fail2ban bans a brute-force bot -->

## The attack you never see

Most people picture an attacker as a person targeting them. The reality is far more boring and far more constant.

The moment a server has a public IP, automated bots begin probing it. They scan for open ports, look for known services, and above all they try to brute-force SSH: thousands of login attempts using common usernames like root and admin and a dictionary of passwords. If you have ever run `grep "Failed password" /var/log/auth.log` on an unprotected box, you have seen it: page after page of failed logins from IP addresses all over the world, none of whom have ever heard of you. This is background radiation on the internet. It does not stop, and it does not need a reason to target you. You are a public IP, and that is enough.

That constant pressure is why the baseline matters. You are not deciding whether to defend against a hypothetical attacker. You are deciding whether to leave the door open to a flood that is already arriving.

## Shorewall: decide what can reach the server

The first move in server security is not clever. It is closing doors.

Shorewall is a high-level configuration tool for the Linux firewall (netfilter, the thing `iptables` talks to). Rather than hand-writing cryptic firewall rules, you describe your intent in readable config: which zones exist, what the default policy is, and which specific traffic is allowed through. The sane posture, and the one you want, is deny-by-default on inbound traffic: block everything, then open only the ports your services genuinely need, such as 80 and 443 for web traffic and a locked-down SSH port for administration.

The effect is simple and powerful. Every port you are not using is simply closed, so the internet's endless scanning finds nothing to talk to. A closed port cannot be brute-forced, cannot be exploited, and does not even reveal that a service exists. Most of the noise from the previous section never reaches an application at all, because the firewall answered first. This is the single highest-leverage thing you can do to a server, and it is why it comes first.

Timing matters as much as the rules do. The probing starts at the moment the IP goes live, not at the moment you finish configuring, so a firewall you write on day two spent a day not existing. That gap is the practical reason baseline hardening belongs in provisioning rather than in a runbook. Kloudbean servers come up with Shorewall already configured for the ports the stack actually uses, so there is no window between the server existing and the server being closed. On a raw VPS, write the deny-by-default policy before you install anything else.

## Fail2ban: ban the ones knocking too hard

A firewall closes the doors you do not use. But some doors have to stay open, and SSH is the obvious one. That is where Fail2ban earns its keep.

Fail2ban is a small daemon that reads log files and acts on patterns. You point it at a service's log (the SSH auth log is the classic), and you set a rule: if an IP fails to authenticate more than a handful of times within a short window, ban it. The ban is enforced by adding a temporary firewall rule that drops that IP's traffic, and after a set time the ban lifts. In Fail2ban's language these are "jails," each with a `maxretry` (how many failures are allowed), a `findtime` (the window they are counted in), and a `bantime` (how long the ban lasts).

The result is that a bot which starts guessing SSH passwords gets a few attempts and then hits a wall, silently, for minutes or hours. Multiply that across every attacker and the brute-force problem largely evaporates: nobody gets enough attempts to succeed. Fail2ban does not replace strong authentication, it buys it time and quiet, and it turns a screaming auth log into a calm one.

Tuning is where people either overdo it or never start. Too aggressive and you ban yourself out of your own server after three fat-fingered logins, which is a genuinely common way to lose an afternoon. Kloudbean sets Fail2ban up as part of the same baseline as the firewall, so the jails are running on a new server without you writing them, and access to the console and the app stays in the dashboard if SSH ever does lock you out. What Fail2ban cannot do, on any host, is make a guessable password safe. It slows the guessing down.

<!-- ADD IMAGE: diagram, four layers (edge DDoS, WAF app layer, Shorewall host firewall, Fail2ban brute-force banning) with Shorewall+Fail2ban as the host layer -->

## How they work together

The two are a natural pair, and understanding the handoff is the whole mental model.

Shorewall handles the structural question: which doors exist at all. It closes every port you are not using, so the attack surface shrinks to the few services you deliberately expose. Fail2ban handles the behavioural question on those remaining open doors: who is abusing them. It watches the services that must be reachable, notices the ones knocking too hard, and tells the firewall to slam the door on that specific IP for a while. One reduces the number of targets; the other polices the targets that remain. Neither is enough alone, and together they remove the overwhelming majority of the automated pressure every server faces.

## Where they fit, and where they don't

This is the part that keeps you from a false sense of security, so read it carefully.

Fail2ban and Shorewall operate at the host and network layer. They are brilliant at their jobs and useless outside them, and knowing the boundary is what makes them useful rather than a comfort blanket. A host firewall does not understand HTTP, so it cannot tell a SQL-injection attempt from a normal request to your app; that is a job for [a web application firewall](https://www.kloudbean.com/blog/what-a-waf-does/), which works at the application layer. Neither tool absorbs a large volumetric flood; a serious [DDoS attack](https://www.kloudbean.com/blog/ddos-protection-explained/) is filtered at the edge, upstream of your server, long before Fail2ban could react. And none of this substitutes for the basics: keeping the OS patched, using SSH keys with password login disabled, and running services with least privilege. Think of Fail2ban and Shorewall as the floor of your security, not the ceiling. They belong in a stack with the other layers, as the diagram shows, not as a replacement for any of them.

Which means the two outer layers have to come from somewhere else, and it's fair to say plainly where. On Kloudbean the host layer is included and the edge layer is an add-on: Cloudflare, paid on standard plans and included for Enterprise, is what handles volumetric filtering and application-layer rules in front of the site. The host firewall and the brute-force banning don't stretch to cover that, and pretending otherwise is how people end up surprised.

## Your first hour on a new public server, in leverage order

Everything above is explanation. This is the sequence, ordered by how much attack surface each step removes per minute spent. Do them in this order on any public box, and notice as you go which ones the hosting model can settle for you and which ones follow you everywhere.

1. **Deny-by-default inbound firewall.** Nothing else you do matters as much. On a VPS this is Shorewall or equivalent, written before you install a service. On a Kloudbean server it is already configured at provisioning.
2. **SSH keys on, password authentication off, root login off.** Yours, on every platform. This is the step that actually ends brute-forcing rather than slowing it, and no host can do it for you because the key lives with you.
3. **A Fail2ban jail on the auth log.** Install it and point it at the log, or inherit it as part of baseline hardening. Either way, check `fail2ban-client status` once so you know it's really running.
4. **TLS on every hostname, renewing automatically.** An expired certificate is a self-inflicted outage. Free auto-renewing SSL covers this on Kloudbean; on a VPS it's your cron job and your renewal failure to notice.
5. **A patch cadence you don't have to remember.** The OS side is what a managed platform patches. Your framework, your plugins, and your dependencies are still yours, and they're where most real compromises actually come from.
6. **Narrow the admin surfaces by address.** Admin panels, staging, phpMyAdmin, database ports. IP Access Control with allow and deny rules by CIDR does this, and a Basic Auth gate in front of a whole app is the cheap version when the address list changes too often.
7. **Add an edge layer if you're a plausible target.** Cloudflare as an add-on, for the volumetric and application-layer jobs the host firewall structurally cannot do.

Steps 1, 3, 4 and part of 5 are what "baseline hardening included" actually means, and they're the ones people most often postpone on a self-managed box. Step 6 is available in the dashboard. Steps 2 and the application half of 5 are yours forever.

And there's a category no host touches, ours firmly included. A firewall doesn't help if credentials are committed to a public repository. Fail2ban doesn't help if the SSH private key was emailed to a contractor in 2022. Neither one has an opinion about an outdated plugin with a known remote-code-execution bug, a database password of eight lowercase letters, or an admin account still called admin. Those are the compromises that actually happen, and the honest map of who owns what sits in [the secure and compliant hosting guide](https://www.kloudbean.com/blog/secure-compliant-hosting/).

## Related reading

This is the host layer of a larger picture. For the application layer, [what a WAF actually does](https://www.kloudbean.com/blog/what-a-waf-does/); for volumetric attacks, [DDoS protection explained](https://www.kloudbean.com/blog/ddos-protection-explained/); and for the response-header layer, the [security headers guide](https://www.kloudbean.com/blog/security-headers-guide/). To restrict who can reach a service by address, [IP allowlisting](https://www.kloudbean.com/blog/ip-allowlisting-guide/), and to gate a whole app behind a password, the [Basic Auth gate guide](https://www.kloudbean.com/blog/basic-auth-gate-guide/). The overview that ties it together is [secure and compliant hosting](https://www.kloudbean.com/blog/secure-compliant-hosting/).

## Start with the doors already closed.

Every Kloudbean server ships with baseline hardening: Shorewall firewall and Fail2ban configured automatically, free auto-renewing SSL, and a patched OS. The floor of server security, without the setup. See how it compares in [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/), or start at [kloudbean.com](https://www.kloudbean.com/).

Shorewall + Fail2ban baseline · Free auto-renewing SSL · Patched OS · One dashboard

## FAQ

**What is the difference between Shorewall and Fail2ban?**

Shorewall is a host firewall: it configures the Linux netfilter layer to block traffic by default and allow only the ports you need, so unused doors are closed. Fail2ban is a brute-force bouncer: it watches logs like the SSH auth log and temporarily bans IPs that fail to log in too many times. Shorewall decides what can reach the server at all, and Fail2ban polices the services that must stay open. They complement each other rather than overlap.

**Do I still need a WAF if I have Fail2ban and Shorewall?**

Yes, because they work at different layers. Shorewall and Fail2ban operate at the host and network layer, blocking ports and banning brute-force IPs, but they do not understand HTTP and cannot recognise application attacks like SQL injection or cross-site scripting. A web application firewall inspects the actual requests to your app and blocks malicious ones. They are complementary layers, so a complete setup uses both rather than choosing one.

**Will Fail2ban stop a DDoS attack?**

No. Fail2ban bans individual IPs that show abuse patterns in logs, which is effective against brute-force attempts but not against a large volumetric flood from many sources. A serious DDoS is filtered at the edge, upstream of your server, before it reaches the host at all. Fail2ban is a host-level tool, so treat DDoS protection as a separate, edge-level layer rather than something Fail2ban handles.

**Does a host firewall slow down my server?**

Not meaningfully. A deny-by-default firewall like Shorewall adds negligible overhead for normal traffic, and the security benefit is large: closed ports cannot be scanned, brute-forced, or exploited. The performance cost of firewalling is trivial next to the cost of an unprotected service being compromised, so there is no practical reason to run a public server without one.

**Are Fail2ban and Shorewall enough on their own?**

They are the floor, not the ceiling. They remove most of the constant automated attack pressure at the host layer, but they do not replace keeping the OS patched, disabling SSH password login in favour of keys, running with least privilege, a WAF at the application layer, or DDoS protection at the edge. Think of them as an essential baseline that other layers build on, not a complete security strategy by themselves.

**Do I have to configure Fail2ban and Shorewall myself on Kloudbean?**

No. Both are part of Kloudbean's baseline server hardening and are configured automatically, so a new server arrives with unused ports closed and brute-force banning already watching. Free auto-renewing SSL is included and the OS is kept patched. You get this floor of protection without hand-writing firewall zones or tuning Fail2ban jails, though you still own your application's own security.

**What does Fail2ban actually do when it bans an IP?**

It adds a temporary firewall rule that drops traffic from that IP, then removes the rule after a set period. You control the behaviour per service through jails, with a maximum number of retries, the time window failures are counted in, and how long the ban lasts. The ban is silent from the attacker's perspective, which is part of why it is effective: the bot simply stops getting responses.

**Is disabling SSH password login still necessary with Fail2ban?**

Yes, and it is one of the highest-value steps you can take. Fail2ban slows brute-force attempts dramatically, but using SSH keys and disabling password authentication entirely removes the attack altogether, because there is no password to guess. Fail2ban then acts as a strong second layer that quiets the logs and bans persistent probers. Use both: keys first, Fail2ban as reinforcement.

Kloudbean Engineering · Close the doors, ban the knockers, then build the rest on top.
