# Brief: flush-dns-cache

## Target keyword and real search data

Source: `kloudgraph-semrush-export` competitor position exports plus the gap export, clustered by
`scripts/build-topic-queue.py`. Three queue families that are one intent.

| Family | Volume | Min KD | Score |
|---|---|---|---|
| `dns flush` | 17,700 | 29 | 77.5 |
| `cache dns flush` | 11,010 | 18 | 67.7 |
| `dns flush mac` | 5,440 | 23 | 75.1 |

**Combined 34,150, the largest coherent on-brand family in the queue.**

| Keyword | Volume | KD |
|---|---|---|
| flush dns | 8,100 | 44 |
| dns flush | 3,600 | 36 |
| dns flush dns | 2,900 | 44 |
| flush dns cache mac | 1,900 | 32 |
| flush dns cache | 1,900 | 38 |
| flush dns mac | 1,600 | 30 |
| mac flush dns | 1,300 | 37 |
| what does flush dns do | 1,300 | 30 |
| macos flush dns cache | 1,000 | 28 |
| windows flush dns cache | 720 | 29 |
| flush dns cache mac os x | 720 | 27 |
| linux flush dns cache | 480 | 22 |
| flush dns what does it do | 480 | 29 |
| flush dns cache windows | 320 | 22 |
| linux flush cache dns | 390 | 18 |

Head terms are hard (KD 36 to 44). The winnable body sits at KD 18 to 32, which is where the
per-platform and definitional terms live, so those get real sections rather than one-line mentions.

**Two distinct sub-intents in the data**, and the second one matters:
1. The procedure. Give me the command for my platform.
2. **The meaning.** `what does flush dns do` at 1,300 and `flush dns what does it do` at 480, roughly
   1,780 combined, asking what it actually accomplishes. Nothing in the library answers this.

Primary: **flush DNS cache**. Secondary: what does flush dns do, flush dns mac, flush dns cache
windows, linux flush dns cache, ipconfig flushdns, dscacheutil flushcache, resolvectl flush-caches.

## Cannibalisation check: the closest call in the library so far

This one nearly got dropped. `err-name-not-resolved` has an H2 literally called "Clearing the caches
that are genuinely yours" and it already contains:

- the macOS, Windows and systemd-resolved flush commands
- Chrome's separate DNS cache at `chrome://net-internals/#dns`
- the hosts-file override check
- a full section on negative caching, which is the mechanism behind a stale `no`

So the raw command list overlaps and that overlap is unavoidable. There is exactly one way to flush
DNS on a Mac.

**The test applied:** could the existing page be optimised to serve `flush dns mac` without becoming a
different page? No. `err-name-not-resolved` is a diagnosis of one specific Chrome error where flushing
is roughly step eight, and the dominant intent behind `flush dns mac` is procedural and
definitional. Rewriting it to serve that query would break what it is. When the existing page would
have to stop being itself, the query needs its own page.

| Existing slug | Owns | Handled by |
|---|---|---|
| `err-name-not-resolved` | Diagnosing one Chrome error. Flushing as a late step. Negative caching. | Early, prominent handoff. It keeps the negative-caching mechanism, this page does not repeat it. |
| `dns-explained` | What DNS is, records, TTL and propagation | Link for the concept. This page does not re-teach resolution. |
| `fix-slow-dns-lookup` | Resolution latency and lookup count | Handoff for the reader whose real problem is speed. |
| `custom-domain-and-ssl-for-your-app` | Pointing a domain at an app | Link from the TTL section. |

**Scoping decision that keeps them apart:** this is a reference plus reality check, explicitly not a
troubleshooting page. It leads with what flushing does and does not fix, and sends anyone actually
debugging an error to the error pages in the first two sections. `err-name-not-resolved` keeps
negative caching entirely; this page does not cover it.

## Information gain (the approval question)

1. **Flushing rarely fixes what people think it fixes.** It addresses one narrow case: your machine
   holds a stale answer for a name whose record changed. It does nothing for a site being down, slow
   internet, or most connection errors. A symptom-to-verdict table says so plainly. Every page
   currently ranking for these terms is a command list that skips this.
2. **Four caches, and you can clear two.** The browser cache and the OS resolver cache are yours. Your
   router's cache and your ISP's resolver cache are not. This is the actual answer to the most common
   follow-up, which is that flushing changed nothing, and it becomes the page's organising idea rather
   than a single sentence.
3. **On Linux there may be nothing to flush.** glibc does not cache DNS answers by default, so a
   server with no `systemd-resolved`, `nscd` or `dnsmasq` has no local cache at all, and every flush
   command people paste will fail or do nothing. Under-reported and correct, and it saves real time.
4. **Verification, which almost no page includes.** How to compare what your machine resolves against
   the authoritative nameserver and against a public resolver, so you can tell whose cache is stale.
5. **The structural fix.** Lowering TTL before a change is what prevents the problem. Flushing after
   is damage control. Ties directly to migrations.

Angles used: *the popular fix cannot work*, *open by ruling things out*, *the fix is structural not a
command*.

## Verified technical claims

- macOS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`. Both parts, because
  `dscacheutil` alone is not sufficient on current macOS.
- Windows: `ipconfig /flushdns`, requires an elevated prompt.
- systemd-resolved: `resolvectl flush-caches`, with `systemd-resolve --flush-caches` as the older name.
- `nscd` and `dnsmasq` are restarted rather than flushed.
- glibc performs no DNS caching of its own, so caching on Linux depends on one of the above being
  installed. Stated as the rule rather than asserting what any given distribution ships, since that
  varies and moves.
- Chrome's internal cache at `chrome://net-internals/#dns`, plus its socket pool, which is why a full
  browser restart sometimes succeeds where a flush does not.
- No specific propagation duration asserted. TTL governs it, and the rule is taught instead of a number.

## Product claims

Only from `kloudbean-facts.md`: seven clouds, free SSL issued and renewed, free migration assistance,
staging for WordPress and Laravel, managed DNS-adjacent work framed only as what the platform actually
does. No propagation-time promise, no uptime figure.

## Format

Reference and reality check. Reality check first, then the platform commands, then verification, then
the TTL discipline. The commands sit in the middle rather than at the top on purpose: a reader who
runs the command without reading the first section is the reader who comes back confused.
