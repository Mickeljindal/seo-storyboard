# Brief: cloudflare-error-523-origin-is-unreachable

## Keyword grounding (SEMrush gap export, 2026-08-01)

Mined with `python3 /tmp/kwlook.py "52[34]"`.

**Family roughly 3,390 combined volume at KD 20 to 26.** Low difficulty, and the telling detail is where
the traffic currently goes: the ranking URLs in the export are a competitor's page about 503 and a
forum thread. Nobody owns 523 with a page actually about 523.

| Keyword | Volume | KD |
|---|---|---|
| error code 523 | 1,600 | 25 |
| http error 523 | 720 | 26 |
| origin is unreachable error code 523 | 590 | 20 |
| error 523 | 480 | 26 |

Primary kw: **error code 523**, paired with Cloudflare's own name for it, origin is unreachable.
Secondary: cloudflare error 523, http error 523, error 523, origin is unreachable, cloudflare 523 fix.

## Cluster fit and cannibalisation check

Completes the Cloudflare spoke set. `cloudflare-5xx-error-codes` is the hub and names 520 through 527;
spokes now exist for 520, 521, 522 and 525. This is the 523 spoke.

Boundaries, checked:

- `cloudflare-error-522-connection-timed-out` (written this session) carries 523 as a single table row
  reading "Cloudflare could not route to the address, wrong or dead origin IP". One row, so there is
  plenty of room, but the 521/522 distinction belongs to that article and must be linked rather than
  re-taught.
- `cloudflare-error-521-web-server-is-down` owns the Cloudflare allowlist and the Fail2ban trap.
- `err-name-not-resolved` and `dns-explained` own DNS resolution. 523 is about routing to an address
  that already resolved, which is a different layer. Draw that line explicitly.

## Distinct angle (the spine)

**523 is a routing failure, not a server failure.** Your web server can be running perfectly and still
produce 523 all day, because Cloudflare never reached the point of asking it anything. That reframe
matters because the instinct is to restart the web server, which cannot possibly help.

The three-way progression completes the family and is the reference readers actually want:
521 means something refused, 522 means nothing answered, 523 means there was no path to try.

**The flagship original detail, straight from Cloudflare's own documentation: the 172 trap.**
Cloudflare uses public address space in `172.64.0.0/13`. Almost everyone assumes anything starting 172
is private, because RFC 1918 reserves `172.16.0.0/12`. It does not reserve all of 172. So a route table
entry as broad as `172.0.0.0/8` pointed at a private destination silently swallows traffic meant for
Cloudflare, and Cloudflare's docs name this as a common cause in AWS environments. The fix they give is
a more specific route for `172.64.0.0/13` toward the Internet Gateway.

That is a genuinely checkable, named, mechanical cause with a precise remedy, and it explains a class of
523 that no amount of server debugging will ever find. Nearly no competing article mentions it.

## Grounding + accuracy (verified against the primary source)

From Cloudflare's Error 523 support page, cited in the article:

- 523 occurs when Cloudflare cannot contact the origin web server.
- It typically means a network device between Cloudflare and the origin has no route to the origin's IP.
- In AWS, a common cause is an overly broad route such as `172.0.0.0/8` in a VPC route table, because
  Cloudflare uses public ranges in `172.64.0.0/13` and the broad route captures that traffic.
- Documented checks: confirm the correct origin IP in the A or AAAA records in Cloudflare DNS;
  investigate routing between origin and Cloudflare; in AWS review VPC route tables and avoid sending
  `172.64.0.0/13` to a private destination, adding a specific route to the Internet Gateway if needed.
- Cloudflare asks for an MTR or traceroute from the origin to a Cloudflare IP that previously connected,
  identified from the origin's own logs.

Arithmetic to state correctly, not approximately:

- RFC 1918 private ranges are `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
- `172.16.0.0/12` spans 172.16.0.0 to 172.31.255.255.
- `172.64.0.0/13` spans 172.64.0.0 to 172.71.255.255, well outside the private range.
- `172.0.0.0/8` spans all of 172.x, so it captures both the private block and Cloudflare's.

No invented percentages, no claim about how often each cause occurs beyond what Cloudflare itself calls
common.

## Honest positioning

The concession here is genuine and near-total, so lead with it: 523 usually lives in the customer's own
network configuration, a cloud route table, or a stale DNS record. None of that is something a host can
reach in and correct, and restarting a server never fixes it.

The narrow, true thing infrastructure contributes: knowing the origin's current address with certainty.
The most mundane 523 is a rebuilt or resized server whose public IP changed while the DNS record stayed
put. Kloudbean facts usable here: managed servers across seven clouds with the current server address
and health visible in one dashboard, free SSL, free migration assistance. Nothing about uptime.

## Structure

Diagnostic guide organised by layer rather than a numbered how-to. Opens with the reframe, then the
three-way 521/522/523 table, then an inline SVG showing the three distinct failure points. The 172 trap
gets its own section with the address arithmetic laid out. Then DNS record checks, then proving it with
MTR, then the remaining causes. 8 FAQs mirrored to FAQPage JSON-LD. No double quotes in FAQ questions.

Byline: "By Kloudbean Engineering · Your server is probably fine. Nothing could reach it."
Unique, not "Faster Than Ever".

## Links out

cloudflare-5xx-error-codes, cloudflare-error-522-connection-timed-out,
cloudflare-error-521-web-server-is-down, cloudflare-error-520,
cloudflare-error-525-ssl-handshake-failed, err-name-not-resolved, dns-explained, what-is-a-vpc.
