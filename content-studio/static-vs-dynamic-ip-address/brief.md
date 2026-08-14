# Brief: static-vs-dynamic-ip-address

## Target
- **Primary keyword:** static vs dynamic ip address
- **Secondary / merge keywords:** difference between static and dynamic ip, do i need a static ip, static ip for server, dynamic ip meaning, static ip address explained
- **Cluster:** 8 - Infra Concepts
- **Intent:** Informational. Reader wants to understand the difference and decide whether they need a static IP. Format: explainer with a decision table.
- **Volume / difficulty:** not supplied for this topic in the mined data at time of writing. Kept all figures qualitative; no invented volumes or benchmarks (per steering: hedge volumes honestly, verify anything checkable).

## Placement of primary keyword
- H1, `<title>`, meta description, first 100 words of the lead, and the first H2 ("Static vs dynamic IP address: what is the actual difference?").

## Ownable angle / information gain
Make the reader able to *decide* if they need a static IP, not just read definitions.
- Mechanism: how addresses get assigned (DHCP leases that can rotate vs a fixed/reserved assignment), and why home is dynamic (address scarcity + zero-config) while servers want static.
- The concrete cases a static IP matters: DNS A record target, IP allowlisting into a firewall/DB, mail server needing a stable IP + matching PTR/reverse DNS, and site-to-site / VPN links.
- The real failure mode ("my service broke because the IP changed"): stale A record, locked-out allowlist, Dynamic DNS as a partial workaround.
- Public vs private IP distinction so readers do not conflate it with static vs dynamic.
- IPv4 scarcity (32-bit space, ~4.3B, a definitional math fact, not invented) and how cloud providers assign a server a stable public IP for its lifetime.
- Teaching SVG: DHCP lease rotating an address over time vs a pinned static address.
- Use-case table (use case -> static or dynamic + why).

## Kloudbean grounding (single light mention, in the CTA only)
- "managed cloud server" + "stable public IP you can point a DNS A record at" -> general cloud truth, task-authorized framing.
- "IP access control to allow or deny connections by CIDR" -> grounded in kloudbean-facts.md ("IP Access Control (allow/deny, CIDR)").
- Deliberately did NOT mention private networking / VPC as a default (Enterprise-only per kloudbean-facts.md correction). No prices, no invented counts, no SLA claims.

## Internal links used (all verified to exist under content-studio/)
- https://www.kloudbean.com/blog/what-is-a-vpc/
- https://www.kloudbean.com/blog/dns-explained/
- https://www.kloudbean.com/blog/what-is-a-managed-server/
- https://www.kloudbean.com/blog/custom-domain-and-ssl-for-your-app/
- https://www.kloudbean.com/blog/ssl-tls-explained/

## Accuracy notes
- IP examples use documentation ranges (203.0.113.0/24 TEST-NET-3, 198.51.100.0/24 TEST-NET-2, 192.168.x / 10.x private ranges) so nothing points at a real host.
- No em-dashes in body prose. No banned claim classes (guarantee / certified / unlimited / fastest / only provider, etc.).
