# Brief: cloudflare-5xx-error-codes (cluster HUB)

## Keyword grounding (SEMrush gap export, 2026-07-23)

This is the hub for the Cloudflare 52x cluster. Total addressable volume across the family is
roughly **48,000 searches/month at KD 8 to 33**, which is the largest low-difficulty opportunity
remaining in the export after the DNS piece. Kinsta ranks for nearly all of it and Kloudbean had
**zero** coverage.

Representative rows (each keyword's best row from the export):

| Keyword | Vol | KD |
|---|---|---|
| error code 521 | 6,600 | 21 |
| error code 520 | 4,400 | 16 |
| ssl handshake failed error code 525 | 4,400 | 16 |
| web server is down error code 521 | 2,900 | 10 |
| error 520 | 2,900 | 16 |
| error 525 / error code 525 | 2,400 | 20 / 23 |
| 520 error | 2,400 | 20 |
| how to fix error code 521 cloudflare | 2,400 | 23 |
| http error 521 | 1,900 | 21 |
| error code 523 | 1,600 | 25 |
| http error 525 | 1,600 | 21 |
| a timeout occurred error code 524 | 1,000 | 21 |
| web server is returning an unknown error error code 520 | 1,000 | 19 |
| origin is unreachable error code 523 | 590 | 20 |
| web server is down error code 521 how to fix | 480 | 8 |

**Hub role.** Captures the generic and multi-code queries (523, 524, 522, 526 plus "cloudflare
error codes" style searches) and routes the three big ones to dedicated children. Children each
link back here, hub links to all three.

**Why this cluster fits Kloudbean.** Every 52x code is Cloudflare reporting that it could not get
a usable response from the **origin server**. That is hosting territory, not CDN territory. And
Cloudflare is a confirmed Kloudbean add-on (paid, free for enterprise), so the topic is native
rather than borrowed.

## Placement
- Primary term in H1, `<title>`, meta description, lead, and the TL;DR heading.
- 7 FAQ entries covering the real PAA questions, including the highest-intent comparison question
  ("what is the difference between error 521 and 522").

## Original value competitors do not have
- **The reframe: Cloudflare is the messenger.** All 52x codes are Cloudflare-generated and describe
  a failure reaching your origin, so the code is diagnostic information rather than a Cloudflare
  fault. Competing articles treat each code as a Cloudflare problem with a Cloudflare fix.
- **The `curl --resolve` origin bypass test as step one**, with the explicit warning to run it from
  outside your own network because your office IP is often already whitelisted. That warning is the
  single most valuable line in the article and appears nowhere in competing coverage.
- **A four-column table mapping code to Cloudflare's wording to what really happened to where to
  look.** The wording column matters because Cloudflare's phrasing actively misleads (521 says
  "web server is down" when it usually is not).
- **The 521 vs 522 distinction as the key diagnostic**: refused means something answered and said
  no (firewall, stopped service); timed out means nothing answered (silent packet drop, security
  group). Same symptom, opposite causes.
- **The Fail2ban self-ban failure mode**, explained as a shared root cause across the family, with
  the blunt position that Fail2ban behind Cloudflare without real-IP restoration is a mechanism
  that periodically takes your own site offline.
- **A 7-step order of operations that puts "change Cloudflare settings" LAST**, with the reason
  stated: that is where everyone starts and almost never where the answer is.
- **524 correctly reframed as a slow-request problem, not a proxy problem**, with the 100-second
  default proxy limit and an awk one-liner to find slow requests in the access log.
- Honest limits stated: no host can stop you choosing Flexible mode or make a slow query fast.

## Internal links (7, verified)
cloudflare-error-521-web-server-is-down, cloudflare-error-520,
cloudflare-error-525-ssl-handshake-failed, fix-ssl-certificate-errors, ssl-tls-explained,
dns-explained, cdn-explained, fix-502-bad-gateway-node-nginx, fix-503-after-deploying-your-app,
nodejs-background-jobs-bullmq

## Facts check
Kloudbean claims used: Shorewall + Fail2ban shipped configured, free SSL, Cloudflare as paid add-on
and free for enterprise, one dashboard for servers/apps/databases, free migration assistance. All
in kloudbean-facts.md. No WAF claim beyond Shorewall/Fail2ban/Cloudflare. No SLA figure.
Cloudflare-side facts kept to publicly documented behaviour (published IP ranges, CF-Connecting-IP,
CF-Ray, 100s default proxy timeout, SSL modes, Origin CA certificates).
