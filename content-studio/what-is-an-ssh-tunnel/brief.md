# Brief - what-is-an-ssh-tunnel

## Target
- Primary keyword: what is an ssh tunnel
- Search volume / difficulty: not supplied for this task (no SEMrush/DataForSEO export provided). Do not fabricate; confirm from mined data before publish. Intent is clearly informational and evergreen (definition + how-to), a strong topical-authority page for the Infra Concepts cluster.
- Intent: informational. Reader wants to understand what a tunnel is and how to use it, then copy a working command.
- Cluster: 8 - Infra Concepts

## Secondary / merge keywords (woven into body + FAQ)
- ssh tunneling
- ssh port forwarding
- local port forwarding (-L)
- remote port forwarding (-R)
- dynamic port forwarding (SOCKS, -D)
- ssh tunnel example
- ssh tunnel to database

## Angle / information gain
Teach SSH tunneling as encrypted port forwarding over a connection you already trust. The ownable framing: a tunnel adds no new login, it rides your SSH auth, which explains both its convenience and its limits. Cover the three forwarding types with real copy-paste commands, the exact use cases (reach a private database, hop through a bastion/jump host, expose a local service, SOCKS proxy), the security reality (not a full VPN; close it when done; keep GatewayPorts off; restrict forwarding you do not need; keep local forwards on loopback), and a clean SSH tunnel vs VPN vs VPC distinction. Teaching inline SVG (your machine to SSH server to target, encrypted hop vs plain hop) plus a three-types table and a vs-VPN-vs-VPC table.

## Structure (deliberately not a fixed template)
Definition -> three types (table + SVG) -> local -L -> remote -R -> dynamic -D -> tunnel vs VPN vs VPC (table) -> security reality -> where it fits -> CTA -> FAQ (9).

## Internal links (verified present in content-studio)
- dns-explained (name resolution happens on the server side of a local forward)
- docker-container-hosting (reaching a service bound to localhost in a container)
- what-is-a-vpc (the vs section; a tunnel can reach a DB that lives in a VPC)
- ssh-key-authentication (security section: protect the login the tunnel rides on)
- what-is-a-managed-server (where it fits: SSH access on a managed box)

## Kloudbean grounding (light: one mention in body + CTA only)
Grounded in kloudbean-facts.md: managed servers with full SSH access; managed databases locked down with IP allow-listing (whitelist the app server IP), NOT presented as private-network-by-default; VPC is Enterprise-only and is referenced only as the concept/where-resources-live, never implied as a default feature. No invented features, numbers, or SLAs.

## Guardrails honored
- Near-zero em-dashes (commas, periods, parentheses).
- No banned claim words (guarantee, certified, unlimited, only provider, fastest, most secure, etc.).
- FAQ visible questions match FAQPage JSON-LD names exactly; no double quotes in question names.
- Word count target 1800-2400.
