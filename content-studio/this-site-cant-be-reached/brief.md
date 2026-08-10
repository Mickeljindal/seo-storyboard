# Brief: this-site-cant-be-reached

## Keyword grounding (competitor organic.Positions exports, 2026-08-01 mine)

Mined with `python3 /tmp/posmine.py 400 46 10 "cant be reached|can't be reached"`.

**7 keywords, 11,200 combined volume, KD 15 to 28.** This is the largest low-difficulty family left
in the export. Kinsta ranks positions 1 to 5 across the whole set, which is the useful signal: the
terms are winnable and worth having, not just high volume.

| Keyword | Volume | KD | Competitor position |
|---|---|---|---|
| this site can't be reached | 5,400 | 23 | kinsta 5 |
| site can't be reached | 2,400 | 17 | kinsta 5 |
| this site cant be reached | 1,000 | 17 | kinsta 4 |
| the site can't be reached | 720 | 17 | kinsta 1 |
| this site can't be reached chrome | 720 | 28 | kinsta 4 |
| this site can't be reached error | 480 | 15 | kinsta 1 |
| chrome this site can't be reached | 480 | 22 | kinsta 3 |

Primary kw: **this site can't be reached**. In H1, title, meta description, first 100 words, and an H2.
Secondary: site can't be reached, this site can't be reached chrome, ERR_ADDRESS_UNREACHABLE,
ERR_INTERNET_DISCONNECTED, ERR_NETWORK_CHANGED, ERR_FAILED, DNS_PROBE_FINISHED_NXDOMAIN.

## Cannibalisation check (this changed the article twice)

The phrase appears in only two existing articles, once each, and in neither title, so the keyword
itself is unclaimed. The **angle** was not.

- `err-name-not-resolved` already owns an H2 reading "Chrome's heading tells you nothing, the code
  underneath tells you everything", plus "Is it just you, or is it everyone?" and the NXDOMAIN /
  SERVFAIL / timeout split. My first plan for this page was exactly that. Dropped it.
- `err-connection-reset` already owns the six-message ERR_CONNECTION_* comparison table, the MTU
  branch, the three-minute triage order, and the refused-versus-timed-out distinction.

So this page is **a router, not an explainer**. It must not re-teach DNS or TCP. Rejected as separate
pages during the same mine: `err_timed_out` (4,400/KD 26, covered by err-connection-reset's table)
and `net::err_cert_date_invalid` (3,600/KD 31, fix-ssl-certificate-errors has a dedicated H2).

## Distinct intent

Every existing page in this cluster assumes the reader already knows their sub-code. This reader does
not. That is the whole gap. Two audiences arrive on this phrase:

1. Someone who cannot open a site and has not noticed the small grey line under the headline.
2. A site owner whose visitors report it while the site loads fine for them.

Nobody in the library serves either.

## What this page owns

- The full mapping table: every sub-code Chrome shows under this headline, what it proves, and which
  page fixes it. This is the reference asset and the reason to cite the page.
- Routing by **observation** rather than by code, since the sub-code is sometimes absent or just
  `ERR_FAILED`, and non-technical readers do not find it.
- The branches no existing page covers: `ERR_INTERNET_DISCONNECTED`, `ERR_ADDRESS_UNREACHABLE`,
  `ERR_NETWORK_CHANGED`, `ERR_FAILED`.
- The site-owner case: unreachable for some visitors only.

## Grounding + accuracy

- Verified against Google's own Chrome error reference that `ERR_CONNECTION_TIMED_OUT` and
  `ERR_TIMED_OUT` are both used for a connection that took too long.
- Verified that the sub-line is **not always** an `ERR_` code: Chrome also shows
  `DNS_PROBE_FINISHED_NXDOMAIN` and `DNS_PROBE_FINISHED_NO_INTERNET`. Writing "the sub-code always
  starts with ERR_" would have been wrong.
- Cites the Chromium primary source for the code list, `net/base/net_error_list.h`. No article in the
  library links it yet, and it is the authoritative list rather than a blog's summary.
- No invented percentages, timings, or "most users" statistics.

## Honest positioning

Two deliberate concessions, both true and both stronger than a pitch:

- The most common cause is DNS, and DNS usually lives at the registrar, not the host. Kloudbean does
  not fix that for you. Say so plainly.
- Fail2ban, which Kloudbean configures by default, can itself block a real visitor's IP after failed
  logins. That makes a site unreachable for one person while it loads for everyone else. Naming a
  failure mode our own feature causes is worth more than a feature list.

Grounded Kloudbean facts used: managed servers, free SSL issued and renewed, Shorewall + Fail2ban
configured by default, server health metrics, IP Access Control, one dashboard, free migration
assistance. Nothing about uptime guarantees.

## Structure

Router, not a numbered how-to. Inline SVG of the four hops a request makes with the code that fails
at each. Mapping table. Three observations. Unowned branches. Site-owner section. Honest hosting
note. 8 FAQs mirrored to FAQPage JSON-LD.

Byline: "By Kloudbean Engineering · The headline is generic. The grey line under it is not."
Unique, not "Faster Than Ever".

## Links out

err-name-not-resolved, err-connection-reset, err-ssl-protocol-error, dns-explained,
fix-slow-dns-lookup, cloudflare-error-521-web-server-is-down, fix-ssl-certificate-errors,
fix-504-gateway-timeout.
