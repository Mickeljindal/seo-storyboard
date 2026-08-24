# How to Fix Slow DNS Lookup: Measure It, Then Fix the Right Thing

*By Kloudbean Engineering · Two problems wear the same name. Only one of them is usually yours.*

Almost everyone who wants to fix a slow DNS lookup arrives from the same place: a speed test flagged DNS, or a browser waterfall showed a chunk of time before the request even started. The trouble is that two completely different problems get reported with the same label. One is slow resolution, where a single lookup takes too long. The other is too many lookups, where each one is fast but your page needs thirty of them. They have different causes and different fixes, and treating them as one problem is why so much DNS tuning achieves nothing.

> **How do you fix a slow DNS lookup?**
> Measure first with `curl -w "%{time_namelookup}"` and `dig` to see whether a single lookup is genuinely slow or whether you simply have too many. Slow single lookups are fixed on the DNS provider side: use an Anycast provider, set sensible TTLs, flatten CNAME chains, and repair broken delegation. Too many lookups is a front-end problem: cut third-party hostnames and use `preconnect` for the few origins you keep. Also check the resolver on your own server, which almost nobody does.

## Which problem do you actually have?

Before touching anything, work out which side you are on. This one distinction saves more wasted effort than any tip further down.

| | Slow resolution | Too many lookups |
|---|---|---|
| What it looks like | One lookup takes 200ms or more | Each lookup is 20ms, but there are 25 of them |
| Where you see it | `dig` query time, `time_namelookup` | Waterfall with many distinct hostnames |
| Root cause | Your DNS provider, TTL, or delegation | Third-party scripts, fonts, tags, widgets |
| Who fixes it | Whoever runs your DNS | Whoever owns the front end |
| Typical real gain | 50ms to 250ms, once per visitor | Can be several hundred milliseconds |

Most sites flagged by a speed tool have the second problem. Most people go and change their DNS provider anyway.

## Measure it properly

`curl` is the fastest honest answer, because it separates DNS from everything that follows:

```bash
curl -o /dev/null -s -w "dns:      %{time_namelookup}s\nconnect:  %{time_connect}s\ntls:      %{time_appconnect}s\nttfb:     %{time_starttransfer}s\ntotal:    %{time_total}s\n" https://example.com
```

Read `time_namelookup` against `total`. If DNS is 0.04s of a 1.9s total, DNS is not your problem and no amount of DNS work will make the page feel faster. That comparison is the entire point of measuring.

Then look at resolution on its own:

```bash
# Query time from your current resolver
dig example.com | grep "Query time"

# Compare public resolvers against your local one
dig @1.1.1.1 example.com | grep "Query time"
dig @8.8.8.8 example.com | grep "Query time"

# Walk the full delegation chain, root to authoritative
dig +trace example.com

# Ask your authoritative nameservers directly, bypassing all caching
dig NS example.com +short
dig @ns1.your-dns-provider.com example.com | grep "Query time"
```

That last pair matters most. A cached answer from a nearby resolver is always fast, which can hide a slow authoritative server. Querying the nameserver directly shows you the number your first-time visitors actually pay.

## Reading the numbers

| What you measure | What it means | Action |
|---|---|---|
| Slow once, near zero after | Normal cold cache | Nothing. This is how DNS works. |
| Slow from several countries | Authoritative DNS is slow or far away | Move to an Anycast provider |
| Slow from one network only | That ISP resolver, not your domain | Not yours to fix |
| Occasional multi-second spikes | A nameserver not answering, resolver retrying | Check delegation and glue |
| Consistent extra hops in `+trace` | CNAME chain | Flatten it |
| Many hostnames in the waterfall | Third-party bloat | Audit and cut |

Those multi-second spikes deserve a note, because they are the ugliest failure in DNS and the least understood. If one of your listed nameservers does not answer, a resolver will wait, time out, and try another. Nothing is broken enough to show up as downtime, but a slice of your visitors gets a pause of seconds before the page begins. Always test every nameserver individually, not just the one that happens to answer first.

## Fixing slow resolution

**Use a provider with Anycast.** This is the single biggest lever. With Anycast, the same nameserver address is announced from many locations and a visitor reaches the nearest one. Without it, someone in Singapore may be querying a nameserver in Virginia on every cold lookup. The free DNS bundled with a cheap registrar or hosting plan is the usual culprit here, and moving your zone to a serious DNS provider is often a fifteen minute job with a real payoff.

**Set TTLs deliberately.** A low TTL forces more lookups; a high one slows down changes. Sensible defaults:

| Record | Normal TTL | Why |
|---|---|---|
| A / AAAA, stable production | 3600 | An hour of caching, still same-day changes |
| A / AAAA, before a migration | 300 | Set 24 to 48 hours ahead, raise it again after |
| CNAME | 3600 | Same reasoning as A records |
| MX, TXT, SPF | 3600 to 86400 | Rarely change |
| NS | 86400 | Should almost never change |

Running a 60 second TTL permanently, just in case, is a habit worth breaking. It multiplies lookups for every visitor to buy agility you use twice a year. Drop the TTL before a planned change, then put it back.

**Flatten CNAME chains.** A CNAME pointing at a CNAME pointing at a CNAME means extra resolution steps, each with its own latency, and any one of them can be slow. `dig +trace` exposes the chain. Point at the final target where you can, or use whatever flattening your DNS provider offers at the apex.

**Watch response size.** Long TXT records, several DKIM keys, and DNSSEC can push a response past what fits comfortably in a single UDP packet. When that happens the resolver has to retry over TCP, which costs a round trip. Check with `dig example.com TXT` and look for a truncation flag. Housekeeping on stale verification records is the usual fix, and people are often surprised how many old ones are still published.

## Fixing too many lookups

Every unique hostname on your page is a separate lookup for a first-time visitor. Fonts from one domain, analytics from another, a tag manager, a chat widget, an A/B testing tool, two ad networks, an embedded video. Twelve hostnames is ordinary. Thirty is common on a marketing site.

Count them, then decide honestly which ones earn their place. In practice the biggest wins are removing tags nobody looks at any more, and self-hosting fonts so they resolve from your own domain rather than a third party.

For the origins you keep and genuinely need early, resolve them ahead of time:

```html
<!-- DNS only, cheap, use freely -->
<link rel="dns-prefetch" href="//cdn.example.com">

<!-- DNS + TCP + TLS, expensive, keep to a few critical origins -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

The difference matters. `dns-prefetch` resolves the name and stops. `preconnect` also opens a connection and negotiates TLS, which is a much bigger win but consumes a real connection. Preconnecting to a dozen origins is counterproductive, since you spend resources on connections that may never be used. Two to four is a reasonable ceiling, reserved for things needed to render the page.

One habit to retire: sharding assets across several subdomains. That was a sensible workaround for HTTP/1.1 connection limits. Under HTTP/2 it costs you extra lookups and connections for no benefit.

## The resolver on your own server, which almost nobody checks

Front-end DNS gets all the attention. Meanwhile your application is making outbound calls to payment providers, mail services, and internal APIs, and every one of those needs resolution too. If the server's resolver is slow or uncached, that latency lands inside your response time and shows up as a slow TTFB rather than as a DNS problem, which is exactly why it goes unnoticed for so long.

```bash
# What is this server actually using to resolve?
cat /etc/resolv.conf
resolvectl status 2>/dev/null | head -20

# Time an outbound lookup from the server itself
dig api.stripe.com | grep "Query time"

# Is anything caching locally?
systemctl status systemd-resolved
```

A local caching resolver turns repeated lookups into memory reads. On a busy app making thousands of outbound requests, this is not a rounding error.

Node deserves a specific warning. The default `dns.lookup()` path runs on the libuv thread pool, which has four threads by default. A burst of outbound requests to many different hostnames can queue behind each other, and the symptom looks like random slowness rather than DNS. Two practical mitigations: reuse connections with a keep-alive agent so you are not resolving the same host repeatedly, and if you genuinely need many concurrent lookups, raise `UV_THREADPOOL_SIZE` rather than guessing at the network.

## When DNS is not your problem

Worth saying plainly, because speed tools cause a lot of misdirected work. A DNS lookup normally costs somewhere between twenty and a hundred and fifty milliseconds, once, and then it is cached for the length of your TTL. If your page takes four seconds, DNS is not what is wrong. Optimising a 40ms lookup while a 1.8 second TTFB sits untouched is the most common misallocation in web performance.

My rule: if `time_namelookup` is under about 100ms and under a tenth of your total, close the DNS tab and go and look at server response time, database queries, and render-blocking assets. Come back to DNS when it is actually the largest number in front of you.

## How much of fix Slow DNS Lookup is a hosting question

Being straight about the boundary: authoritative DNS speed belongs to whoever runs your DNS zone, and no hosting provider can make a slow nameserver fast. What hosting genuinely affects is the rest of that timing breakdown, which is usually the bigger number anyway.

Two things are relevant on Kloudbean. First, you pick which of seven clouds and which region your server sits in, so you can put the application near the people using it rather than accepting whatever a platform assigns. Second, Cloudflare is available as a paid add-on and is included for enterprise accounts, which brings Anycast DNS and edge caching into the same setup as your hosting. That is the legitimate answer to a slow lookup: a global Anycast network in front of the domain, not a hosting change.

And because servers are managed, the server-side resolver path described above is part of what is maintained rather than something you discover during an incident.

## Where to go from here

For the fundamentals of records, resolution, and propagation, start with [DNS explained](https://www.kloudbean.com/blog/dns-explained/). If you came here intending to clear a cache, [flushing your DNS cache](https://www.kloudbean.com/blog/flush-dns-cache/) covers what that does and does not fix, and it is not a speed fix. For the caching layer in front of your origin, [CDN explained](https://www.kloudbean.com/blog/cdn-explained/). On the response-time side that usually matters more, [speed up WordPress](https://www.kloudbean.com/blog/speed-up-wordpress/) and [speed up WooCommerce](https://www.kloudbean.com/blog/speed-up-woocommerce/). For caching that cuts real server work, [the Redis caching guide](https://www.kloudbean.com/blog/redis-caching-guide/). And when resolution succeeds but the connection is refused, [fixing ECONNREFUSED](https://www.kloudbean.com/blog/fix-econnrefused-node/).

## Put the application where your users are

Seven clouds, your choice of region, managed servers with the resolver path maintained, and Cloudflare available as an add-on for Anycast DNS and edge caching. Free migration assistance included. Start at [kloudbean.com](https://www.kloudbean.com/).

7 clouds · Region choice · Cloudflare edge add-on · Managed servers · One dashboard

## FAQ

**What is a good DNS lookup time?**
Under 50ms is good, and under 100ms is fine for most sites. Anything consistently above about 200ms from multiple locations suggests your authoritative nameservers are slow or geographically distant. Remember the result is cached for the length of your TTL, so this cost is paid once per visitor rather than on every request.

**How do I check DNS lookup time?**
Run `curl -o /dev/null -s -w "%{time_namelookup}\n" https://example.com` for the number your users experience, and `dig example.com | grep "Query time"` for resolution on its own. To see the uncached figure, query your authoritative nameservers directly with `dig @ns1.provider.com example.com`, since a nearby cache will otherwise hide a slow server.

**Does changing my DNS provider make my website faster?**
Only if DNS is genuinely your bottleneck. Moving to an Anycast provider can remove 100 to 250ms from a cold lookup, which is real but happens once per visitor. If your time to first byte is over a second, that is where the time actually is. Measure both before deciding.

**What TTL should I use?**
3600 seconds is a sensible default for A and CNAME records on stable production, with 86400 for NS records. Drop A records to 300 about 24 to 48 hours before a planned migration, then raise them again once traffic has moved. Leaving a 60 second TTL in place permanently just multiplies lookups.

**What is the difference between dns-prefetch and preconnect?**
`dns-prefetch` resolves a hostname only, so it is cheap and can be used for several origins. `preconnect` also completes the TCP handshake and TLS negotiation, which saves more time but ties up a connection. Use preconnect for the two to four origins needed to render the page, and dns-prefetch for the rest.

**Why does my DNS lookup occasionally take several seconds?**
Usually one of your listed nameservers is not answering, so the resolver waits, times out, and retries against another. It never registers as downtime, but some visitors pay a multi-second pause. Test each nameserver individually with `dig @nameserver example.com` and check your delegation and glue records rather than assuming the domain is fine because it resolves.

**How do I reduce the number of DNS lookups on my site?**
Count the unique hostnames in your network waterfall and remove the ones you no longer use, which on most marketing sites means old tags and abandoned tools. Self-host fonts so they come from your own domain, avoid sharding assets across subdomains since HTTP/2 removed the reason for it, and add `preconnect` only for the critical third parties you keep.

**Can slow DNS on my server affect my application?**
Yes, and it is commonly missed. Outbound calls from your application to payment gateways, mail providers, or internal APIs all need resolution, and that latency lands inside your own response time. Check `/etc/resolv.conf`, make sure a local caching resolver is running, and reuse connections with keep-alive so you are not resolving the same hostname repeatedly.

*Kloudbean Engineering · Measure first. DNS is usually innocent.*
