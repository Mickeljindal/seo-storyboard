---
title: "IP Allowlisting: Lock a Service to the Addresses You Trust"
description: "IP allowlisting restricts who can reach a service by network address, using allow and deny rules and CIDR ranges. What it protects, where it fails, and how to use it without locking yourself out."
slug: ip-allowlisting-guide
canonical: https://www.kloudbean.com/blog/ip-allowlisting-guide/
cluster: 9. Security and compliance
pillar: secure-compliant-hosting
money_page: kloudbean-vs-cloudways
byline: Deny by default, allow the few you trust, and keep a way back in.
---

# IP Allowlisting: Lock a Service to the Addresses You Trust

By Kloudbean Engineering · The bluntest access control there is, and sometimes the best.

Some things should not be reachable by the whole internet. A database admin panel, a staging site, an internal dashboard, an API meant only for your office: exposing these to every address on earth is asking for trouble, no matter how good the password is. IP allowlisting is the oldest and bluntest answer, and often the right one. Instead of trusting anyone who knows the URL, you allow only the network addresses you decide, and deny the rest by default. It is not clever, and that is the point. A request from an address you did not permit never gets far enough to matter.

> **What is IP allowlisting?**
>
> IP allowlisting (also called IP access control) restricts who can reach a service based on their network address. You define allow rules for the addresses or ranges you trust and deny everything else, or the reverse, block specific bad actors and allow the rest. Ranges are written in CIDR notation, like 203.0.113.0/24 for a whole block. It is ideal for admin panels, staging environments, internal tools, and APIs that only need to be reached from known places. Its blind spot is that addresses can change or be spoofed in some contexts, and users on dynamic or mobile connections are hard to pin down, so it is a strong layer rather than a complete authentication system. On Kloudbean, IP Access Control lets you set allow and deny rules, including CIDR ranges, on your services.

<!-- ADD IMAGE: hero, an admin panel reachable only from an allowlisted office IP range, all other addresses blocked -->

## What allowlisting actually does

It answers one question before any other security check runs: is this address allowed to be here at all?

With an allowlist, you name the addresses or ranges permitted to reach a service and deny everything else by default. A request from a permitted address proceeds to the normal login and application logic; a request from anywhere else is refused at the door, before it touches your app. The opposite pattern, a denylist, allows everyone except specific addresses you block, which is useful for shutting out a known abuser but far weaker as a general posture, because it defaults to open. For anything sensitive, allow-by-exception (deny all, permit a few) is the strong default, and denylisting is a targeted tool for specific problems.

Addresses and ranges are written in CIDR notation. A single address might be `203.0.113.10/32`, and a whole block your office owns might be `203.0.113.0/24`, which covers 256 addresses. CIDR is just a compact way to say "this address" or "this range of addresses," and it is the vocabulary every allowlist speaks.

## Where it shines

Allowlisting is at its best when a service has a small, known set of legitimate callers. That describes more of your infrastructure than you might think.

**Admin panels and dashboards.** The WordPress admin, a database GUI, an internal metrics dashboard: none of these need to accept connections from the entire planet. Restricting them to your office and VPN ranges removes them from the attack surface almost entirely. **Staging and pre-production.** A staging site should be seen by your team and your client, not indexed by search engines or poked by bots; an allowlist keeps it genuinely private. **Internal and partner APIs.** If an API is only ever called by your own servers or a known partner, allowlisting their addresses means a leaked key alone is not enough to use it from somewhere else. **Administrative ports.** Access like SSH is far safer limited to known addresses than open to all. In each case the logic is the same: the legitimate callers are few and known, so everything else is noise you can safely refuse.

<!-- ADD IMAGE: diagram, allow-by-exception - office range and VPN allowed through to the service, everyone else denied at the network layer -->

## Where it falls short (so you don't over-trust it)

Allowlisting is a strong layer, not a magic one, and the failure modes are worth knowing before you lean on it too hard.

The biggest limitation is practical: addresses change. Home and mobile connections often have dynamic IPs that shift without warning, so allowlisting a remote worker's home address is fragile and allowlisting a phone on mobile data is close to impossible. That is why allowlisting pairs so naturally with a VPN: your people connect to the VPN from wherever they are, and you allowlist the VPN's stable address rather than chasing each person's changing one. The second limitation is conceptual: an allowed address is not an authenticated user. Anyone on an allowlisted network reaches the service, so if your office network is shared or compromised, the allowlist waves them through. Treat it as "reduce who can knock," not "prove who you are." Because of both, allowlisting belongs alongside real authentication and the other layers, never as the only lock on the door.

## Using it without locking yourself out

The classic self-inflicted wound with allowlisting is banning your own access, so a little care saves a lot of panic.

Before you switch a service to deny-by-default, be certain your own current address, or better your VPN range, is on the allow list, and know how you would get back in if you got it wrong, for example through a console the allowlist does not gate. Prefer allowlisting stable ranges (a VPN, an office block) over individual dynamic addresses you will be updating forever. Keep the list documented, because an unexplained CIDR range six months from now is a small mystery nobody enjoys. And review it periodically: addresses you trusted for a contractor or an old office should come off when they are no longer needed, the same discipline as revoking any other access.

## Where Kloudbean fits, honestly

On Kloudbean, IP Access Control lets you set allow and deny rules, including CIDR ranges, to restrict who can reach your services by network address. That gives you the allow-by-exception posture this article recommends without hand-editing firewall rules: lock an admin surface or a staging environment to your office and VPN, and deny the rest by default. It sits naturally alongside the baseline [Shorewall firewall and Fail2ban](https://www.kloudbean.com/blog/fail2ban-and-shorewall-guide/) that every server already runs, and private networking is available when a service should not touch the public internet at all.

The honest boundary: an allowlist controls which addresses may reach a service; it does not authenticate the person behind the address, and it does not replace login, a WAF, or the rest of your security. It is one strong, blunt layer among several. Used for the right things, admin surfaces and known callers, it removes a huge amount of risk for almost no effort. Used as your only control, it will eventually let the wrong person through a trusted door.

## Related reading

Allowlisting is one access control among several. To gate an app behind a password prompt instead of, or alongside, an address rule, the [Basic Auth gate guide](https://www.kloudbean.com/blog/basic-auth-gate-guide/). For the host firewall underneath, [Fail2ban and Shorewall](https://www.kloudbean.com/blog/fail2ban-and-shorewall-guide/); for the application layer, [what a WAF does](https://www.kloudbean.com/blog/what-a-waf-does/). To keep a service off the public internet entirely, [what a VPC is](https://www.kloudbean.com/blog/what-is-a-vpc/). And the overview that ties the layers together is [secure and compliant hosting](https://www.kloudbean.com/blog/secure-compliant-hosting/).

## Lock sensitive surfaces to the addresses you trust.

Kloudbean's IP Access Control lets you allow and deny by address and CIDR range, so admin panels and staging stay reachable only from your office and VPN. It sits on top of baseline firewall and brute-force protection. Compare the security story in [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/), or start at [kloudbean.com](https://www.kloudbean.com/).

IP Access Control · CIDR allow and deny · Private networking · Baseline hardening

## FAQ

**What is the difference between an allowlist and a denylist?**

An allowlist permits only the addresses you name and denies everything else by default, which is the strong posture for sensitive services because it fails closed. A denylist allows everyone except specific addresses you block, which defaults to open and is best used for shutting out a known bad actor rather than as a general control. For admin panels and internal tools, allow-by-exception is the safer choice.

**What is CIDR notation?**

CIDR is a compact way to write an address or a range of addresses. A suffix like /32 means a single address, while /24 covers a block of 256 addresses, so 203.0.113.0/24 is a whole small network. Allowlists use CIDR to permit either one exact address or an entire range, such as your office block or a VPN, in a single rule.

**Can IP allowlisting be bypassed?**

It is strong but not absolute. Addresses can be spoofed in some network contexts, an allowlisted network that is itself compromised will pass an attacker through, and it does not authenticate the individual behind an allowed address. That is why allowlisting is a layer rather than a complete control: it dramatically reduces who can reach a service, but it should sit alongside real authentication rather than replace it.

**How do I allowlist a remote worker on a dynamic IP?**

Usually you do not allowlist their changing home or mobile address directly, because it shifts. Instead you put them on a VPN and allowlist the VPN's stable address. They connect to the VPN from wherever they are, and the service sees a single trusted address regardless of their actual location. This is the standard pattern for combining allowlisting with a mobile workforce.

**What should I IP allowlist?**

Anything with a small, known set of legitimate callers: admin panels and dashboards, staging and pre-production environments, internal or partner APIs, and administrative access like SSH. These do not need to accept connections from the whole internet, so restricting them to your office and VPN ranges removes them from most of the attack surface for very little effort.

**Will IP allowlisting lock me out?**

It can if you are careless, which is the most common mistake with it. Before switching a service to deny-by-default, make sure your own current address or VPN range is allowed, and know a fallback way in, such as a console that the allowlist does not gate. Prefer allowlisting stable ranges over individual dynamic addresses, and review the list periodically so stale entries do not linger.

**Is IP allowlisting the same as a firewall?**

They are closely related. A host firewall decides which ports are open at all, while IP allowlisting decides which addresses may reach a given service or port. In practice allowlisting is often implemented as firewall or access-control rules, and the two work together: the firewall closes unused doors, and allowlisting restricts who may use the ones that remain open.

**Does Kloudbean support IP allowlisting?**

Yes. Kloudbean's IP Access Control lets you set allow and deny rules, including CIDR ranges, to control which addresses can reach your services. That gives you an allow-by-exception posture for admin surfaces and staging without editing raw firewall rules, on top of the Shorewall and Fail2ban baseline every server runs, with private networking available for services that should not be public at all.

Kloudbean Engineering · Deny by default, allow the few you trust, and keep a way back in.
