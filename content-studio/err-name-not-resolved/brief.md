# Brief: err-name-not-resolved

## Keyword grounding (competitor organic.Positions exports, 2026-07-22 crawl)

NEW DATA SOURCE. Previous batches mined `gap.keywords_*.csv` (9 files), which is exhausted. This batch
comes from the `*-organic.Positions-*.csv` exports, 60,568 rows across 8 competitors (cloudways, heroku,
kinsta, netlify, pressable, railway, render, wpvip), which had never been mined. Advantage over gap data:
it includes each competitor's POSITION, so it shows terms a rival already ranks top-10 for, which is
proof the term is both winnable and worth having.

| Keyword | Vol | KD | Best competitor position |
|---|---|---|---|
| this site can't be reached | 5,400 | 23 | kinsta #5 |
| **err_name_not_resolved** (primary) | **4,400** | **28** | kinsta #9 |
| site can't be reached | 2,400 | 17 | kinsta #5 |
| dns_probe_finished_nxdomain error | 2,400 | 32 | kinsta #9 |

Cluster roughly 14,600. Miner: `python3 /tmp/posmine.py <minvol> <maxkd> <maxpos> [regex]`.

**Secondary terms woven in:** dns_probe_finished_nxdomain, dns_probe_finished_no_internet,
dns_probe_finished_bad_config, nxdomain vs servfail, dig servfail, domain expired dns, nameservers not
updated, negative caching soa, cname at apex, alias record, flush dns cache, chrome net-internals dns.

## Placement
Primary keyword in H1, title, meta description, TL;DR, first FAQ, and the routing table. The
higher-volume "this site can't be reached" is served by a dedicated H2 about Chrome's wrapper heading,
which is the honest way to target it since that phrase is not itself a distinct error.

## Cannibalisation check (tight, and it defines the article)
`err-connection-reset` covers the CONNECTION family and its "Its close relatives" table lists
ERR_CONNECTION_RESET, REFUSED, TIMED_OUT, EMPTY_RESPONSE, ABORTED, CLOSED. Verified it does NOT include
ERR_NAME_NOT_RESOLVED. That gives a clean technical split and the article's opening argument: every
error in that table means a connection was ATTEMPTED, so the name had already resolved. This one happens
before any connection exists.

`fix-slow-dns-lookup` covers SLOW resolution and too-many-lookups, not FAILED resolution. Different
problem, linked both ways.

So: err-connection-reset owns "connected then failed", fix-slow-dns-lookup owns "resolved but slow",
this owns "never resolved". Three articles, three stages of the same request, no overlap.

## Original value competitors do not have
- **The opening is a process-of-elimination gift**: this error rules out your web server, firewall,
  certificate, application, disk, and vhost, because none of them were ever consulted. Competing pages
  open with a fix list; this opens by telling you where NOT to look, which is more valuable when you are
  panicking.
- **Chrome's heading versus the code underneath**, with a six-row table. "This site can't be reached" is
  shared across unrelated failures, so the article trains the reader to skip the big text. Reuses the
  wrapper-text pattern from the SSL work, applied to a much higher-volume phrase.
- **NXDOMAIN vs SERVFAIL vs no-response vs NOERROR-with-no-records as FOUR different diagnoses**, where
  every competitor collapses this into "DNS is broken". The NOERROR row is the subtle one: a domain can
  be perfectly healthy, serving mail, with no A record for the host you typed.
- **SERVFAIL's signature named**: a DNSSEC misconfiguration breaks the domain only on validating
  resolvers, so it presents as intermittent and user-specific when it is fully deterministic. That
  explains a symptom people otherwise cannot reproduce.
- **One command that splits the problem before any changes**: `dig +short domain @1.1.1.1`. Public
  answer means everyone is affected; local success means it is your machine. Everything after that is
  routed by this result.
- **`dig NS` promoted as the step people skip**, with the reason: it tells you who the internet actually
  asks, not who you think you configured. That is the cause where a control panel shows a perfect zone
  that nothing is delegated to.
- **`whois | grep -i expir` recommended EARLY**, with the signature that identifies it: everything under
  the domain dies at once with no deploy. It is also the one cause no server work can fix.
- **NEGATIVE CACHING, the standout section.** DNS caches "does not exist" answers under the SOA minimum,
  so a resolver that asked before you created the record keeps returning NXDOMAIN after your fix is live.
  Produces the maddening case where you verify the record correctly at the authoritative server and the
  reporter still sees a failure. Nobody in this SERP explains it, and it yields a real operational rule:
  create records BEFORE announcing a hostname, because checking-then-creating teaches every resolver a
  negative answer to hold.
- **The apex/www pair explained as two independent names**, plus the follow-on complication people hit
  next: a CNAME is not permitted at the apex because the apex carries NS and SOA, which is why providers
  offer ALIAS, ANAME, or flattening.
- **Cache clearing placed LAST and gated**, because doing it first means clearing a cache that holds a
  correct answer. Includes the Chrome-has-its-own-cache detail that explains why an OS flush appears to
  do nothing, and the hosts-file entry that makes a site work only for the person who built it.
- **Propagation answered without a fabricated number.** "There is no universal figure, and quoting one is
  guesswork." Then gives the actionable version: lower the TTL before a planned change.

## Facts discipline
States plainly that Kloudbean is not a DNS provider and that no host can fix a name that does not
resolve, consistent with the position already taken in fix-slow-dns-lookup. The one genuine hosting
intersection is real and useful: a domain must resolve to the server before a certificate can be issued,
because the CA validates by requesting that name, so a failed SSL step on a new site is often this error
in disguise. Grounded in the confirmed free-SSL-issued-and-renewed fact.

Other claims: 7 clouds with region choice, managed databases, automatic backups, Shorewall and Fail2ban
by default, one dashboard, from $8/mo, free migration assistance. All confirmed. No DNS product claimed,
no propagation SLA, no uptime figure.

## Internal links (6, all verified)
err-connection-reset (x2), fix-slow-dns-lookup (x2), fix-ssl-certificate-errors, what-is-sni,
cloudflare-5xx-error-codes, migrate-wordpress-to-kloudbean
