# Brief: fix-slow-dns-lookup

## Keyword grounding (SEMrush gap export, 2026-07-23)

| Keyword | Intent | Volume | KD | Notes |
|---|---|---|---|---|
| **how to fix slow dns lookup** (primary) | Informational | **40,500** | **29** | 135 results. From the kinsta gap file. |

**Why this was chosen.** The highest-volume winnable keyword in the export. KD 29 against 40,500
volume is unusual, and the reason shows in the data: the only competitor page ranking is Kinsta's
"reduce DNS lookups" article, sitting at **position 34**. A page that weak, that far down, on a
keyword that big means no one has built the definitive answer.

**Search intent.** Diagnostic and remedial. The searcher has been told DNS is slow, usually by
GTmetrix, Pingdom, PageSpeed Insights, or a browser waterfall, and wants to know what to change.

**Secondary / long-tail terms woven in:** dns lookup time, reduce dns lookups, good dns lookup
time, dns prefetch vs preconnect, time_namelookup, dig query time, anycast dns, dns ttl best
practice, what ttl should i use, flatten cname, slow dns resolution server, resolv.conf,
systemd-resolved, UV_THREADPOOL_SIZE, dns lookup taking seconds.

## Placement
- Primary keyword in H1, `<title>`, meta description, first sentence of the lead, and the TL;DR
  question heading.
- 8 FAQ entries shaped to real PAA questions, including the two highest-intent ones
  ("what is a good DNS lookup time", "does changing my DNS provider make my website faster").

## Differentiation vs existing Kloudbean articles
`dns-explained` already owns the fundamentals: what DNS is, how a lookup works, the record types,
TTL and propagation, common gotchas. This article deliberately does **not** re-explain any of
that and links to it instead. Scope here is strictly measurement, diagnosis, and remediation of
DNS latency.

## Original value competitors do not have
- **The core reframe: slow resolution and too many lookups are two different problems.** Every
  competing article conflates them, which is why so much DNS work produces no result. Opens with a
  table that sorts the reader onto the right side before any advice is given.
- **A diagnosis table mapping measurement to cause to action**, including the cases where the
  answer is "this is not yours to fix" and "this is normal, do nothing".
- **Querying authoritative nameservers directly** to get the uncached number, because a nearby
  resolver cache hides a slow authoritative server. Most guides measure the cached figure and
  conclude everything is fine.
- **The multi-second spike explained**: a listed nameserver not answering causes resolver retry.
  Never shows up as downtime, hits a slice of visitors. Almost no coverage anywhere.
- **UDP response size and TCP fallback** from stacked DKIM/TXT records and DNSSEC.
- **Server-side resolution, the section nobody writes.** Outbound calls from the app need DNS too,
  and that latency hides inside TTFB. Includes the Node libuv thread pool detail (default 4
  threads, bursts queue, symptom looks like random slowness) and keep-alive as the real fix.
- **A concrete TTL table with numbers**, plus the position that a permanent 60s TTL is a bad habit.
- **Retiring domain sharding** as an HTTP/1.1 relic that now costs lookups.
- **Founder position taken: DNS is usually innocent.** Explicit rule to stop DNS work when
  `time_namelookup` is under 100ms and under a tenth of total, and go look at TTFB instead. Names
  the misallocation directly.
- Correct, useful distinction between `dns-prefetch` and `preconnect` with a stated ceiling of two
  to four preconnects, rather than the usual "add preconnect" advice.

## Honesty boundary held
States plainly that authoritative DNS speed belongs to whoever runs the DNS zone and that **no
hosting provider can make a slow nameserver fast**. Kloudbean is not presented as a DNS provider,
because it is not one. The two legitimate ties are region choice across 7 clouds and the Cloudflare
add-on (paid, free for enterprise) which brings Anycast DNS and edge caching. Both are in
kloudbean-facts.md.

## Internal links (6, all verified to exist)
dns-explained, cdn-explained, speed-up-wordpress, speed-up-woocommerce, redis-caching-guide,
fix-econnrefused-node

## Facts check
Kloudbean claims used: 7 clouds, region choice, managed servers, Cloudflare as a paid add-on and
free for enterprise, one dashboard, free migration assistance. No DNS hosting claim, no invented
Anycast-DNS-by-Kloudbean claim, no SLA figure.
