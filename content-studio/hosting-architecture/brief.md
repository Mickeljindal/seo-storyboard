# Brief — Hosting Architecture (platform documentation page, not a blog post)

**Ask:** a Kloudbean page modelled on Kinsta's WordPress infrastructure doc, built around the
architecture diagram. Reference: `https://kinsta.com/docs/wordpress-hosting/wordpress-getting-started/wordpress-infrastructure/`

**Type:** platform documentation, canonical `https://www.kloudbean.com/hosting-architecture/`, not
`/blog/`. It documents our own stack rather than chasing a keyword, so it is a reference page that
other articles can point at.

## What the Kinsta page actually does, and what I took from it
Their page is short, about 300 words, and does five things: refuses the usual hosting categories,
states the isolation model concretely (container with Linux, NGINX, PHP, MySQL, "100% private, not
shared even between your own sites"), names the container technology, shows one diagram, then gives
per-plan resources and a firewall section.

Kept: the shape, the refusal of categories, the concrete isolation list, the single diagram as the
centrepiece, and a security section broken out.
Changed: ours is longer (2,173 words) because our request path has more layers worth naming, and
because a docs page that says what is NOT included is more useful than one that does not. Kinsta
quote fixed per-plan CPU and RAM; we do not have a published equivalent, so ours states the size
range and says the ceiling is resources rather than a licence limit.

## Structure (11 H2s, none reused anywhere in the library)
Where your server actually runs · The request path, end to end · The architecture, in one diagram ·
How applications are isolated · Data services · Security at each layer · Backups, and getting data
back · What we run and what you run · Enterprise and regulated workloads · Where to read next · FAQ

Checked every heading against the whole library before writing: zero collisions. This page must not
become part of the template-slop problem it was written after.

## Facts used, and where each comes from
- 7 providers named; 80+ data centres, in-country in ~35 countries (`kloudbean-facts.md` geography).
- 8 server configurations, 1GB to 128+GB; vertical resize self-serve; disk cannot shrink.
- Request path Cloudflare → NGINX → Varnish on hit / Apache and PHP-FPM on miss, from the diagram
  and the console stack.
- Node under PM2, always-on, no cold start.
- Isolation: own system user, own filesystem permissions, own PHP-FPM pool, own MariaDB and Redis,
  own deployment settings. No cap on applications per server, ceiling is RAM and CPU
  (owner-confirmed, Aug 2026).
- Two database models, from the support docs: MariaDB in the default server stack reached on
  loopback, versus standalone managed databases with their own hostname, TLS and IP allow-listing.
  Named the seven engines and cited "nine or more" from the docs. Stated plainly that PostgreSQL,
  MongoDB, Elasticsearch and Memcached are standalone only.
- Security: Shorewall plus Fail2ban by default; BitNinja on every plan, free on Premium and
  Enterprise, with the real resource-headroom caveat from the enabling doc; free auto-renewed SSL;
  IP Access Control; Basic Auth; subusers and UAC; HttpOnly sessions; social login; Enterprise
  audit trail.
- Backups: automatic, off-site to Google Cloud Storage, isolated bucket per application and per
  database, on-demand backup and dashboard restore, staging for WordPress and Laravel.
- Enterprise-only: Kubernetes (Premium gets a limited subset), autoscaling, VPC and VPN, audit
  trail, custom architectures, Windows Server. .NET on Linux is standard.
- KSA: Google Cloud Dammam for in-Kingdom residency, framed as infrastructure alignment with
  certification assessed against the organisation.

## Guardrails observed
No SLA percentage anywhere. Autoscaling scoped to Enterprise, never implied for general users.
Cloudflare described as a paid add-on that is free for Enterprise, never as an exclusive edge. No
customer counts, no "60+ countries" proof point, no banned blurbs. Windows and .NET stated
correctly, which is the error found in 16 articles and corrected in the same batch as this page.

## The diagram is injected, not pasted
`build-page.py` reads the SVG out of `content-studio/assets/diagrams/kloudbean-architecture.html` at
build time, and `build-architecture.py` now calls `build-page.py` at the end of its own run. So
regenerating the diagram cannot leave this page showing an older version. Rebuild either with:

    python3 content-studio/assets/diagrams/build-architecture.py

The page is 205KB because the SVG is inlined, which keeps it self-contained with no image
dependency. If page weight becomes an issue, the alternative is a rendered PNG with the SVG as a
fallback, which needs a browser export step we do not have in this repo.

## Open question for the owner
The prose says each application has "its own MariaDB and Redis instance". That is what the diagram
now shows, per the instruction to show per-app instances rather than a shared pair. It is also close
to the "dedicated MariaDB per application" wording that was struck earlier. I have used "its own"
rather than "dedicated", but if the intended line is different, this page and the diagram should
change together.

## Gate
`node _val.mjs hosting-architecture` → [OK]. 2,173 words, 0 em-dashes, Article + FAQPage JSON-LD,
FAQ parity 8, H2 count 11, 6 internal links resolve. One warning: no hero.png, which a
documentation page does not need.
