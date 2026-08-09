# Brief: cloudflare-error-521-web-server-is-down

## Keyword grounding (SEMrush gap export, 2026-07-23)

Biggest single target in the Cloudflare 52x cluster, roughly **19,400 combined volume** across the
521 variants, at difficulty as low as **KD 8**.

| Keyword | Vol | KD |
|---|---|---|
| **error code 521** (primary) | **6,600** | **21** |
| web server is down error code 521 | 2,900 | 10 |
| how to fix error code 521 cloudflare | 2,400 | 23 |
| http error 521 | 1,900 | 21 |
| 521 error | 1,600 | 30 |
| error 521 | 1,000 | 25 |
| what does error code 521 mean | 720 | 24 |
| what is error code 521 in cloudflare | 590 | 25 |
| error code 521 meaning | 480 | 16 |
| web server is down error code 521 how to fix | 480 | 8 |
| cloudflare error code 521 | 390 | 26 |
| 521 error code | 390 | 25 |

Kinsta ranks for essentially all of these. Intent is urgent and diagnostic: the site is down now.

**Secondary terms woven in:** connection refused, cloudflare 521 fix, whitelist cloudflare ip,
cloudflare ip ranges, fail2ban cloudflare, CF-Connecting-IP, set_real_ip_from, real ip module,
nginx not running, ss -tlnp, 521 vs 522, pause cloudflare.

## Placement
H1 leads with the code and Cloudflare's wording plus the contradiction ("even when it isn't"),
which is also the article's angle. Primary keyword in title, meta, lead, TL;DR. 7 FAQ entries.

## Original value competitors do not have
- **The reframe in the title and lead: "web server is down" is usually wrong.** What 521 reports is
  narrowly a *refused TCP connection*. Stating that precisely rules out slow servers, DNS, and
  application bugs entirely, which tells the reader what NOT to investigate. No competitor does this.
- **The "test from outside your own network" warning**, called out as the single most common wrong
  turn, because office IPs are frequently already whitelisted and give a falsely healthy result.
- **The Fail2ban trap as a full section with the distinctive symptom named**: works for some
  visitors, fails for others, and shifts over time, because a subset of Cloudflare addresses are
  banned at any moment. This exactly matches a real support pattern and is almost absent from
  competing articles.
- **Real-IP restoration presented as the actual fix, with unbanning framed as temporary relief**
  that will recur within days. Includes the working nginx `set_real_ip_from` + `real_ip_header`
  config and the three things that start working once it is in place (bans hit real offenders, logs
  become meaningful, rate limiting stops seeing all traffic as a few busy clients).
- **Founder position taken**: Fail2ban behind Cloudflare without real-IP restoration is worse than
  no intrusion prevention, because the only thing it can effectively block is the proxy the site
  depends on.
- **A "what not to do" section** covering the two popular bad fixes: pausing Cloudflare (removes
  protection, explains nothing) and opening 80/443 to the world (lets anyone who finds the origin IP
  bypass the proxy entirely). The second is a genuine security regression that circulates as advice.
- **Symptom-to-cause table keyed on timing and distribution** (everyone vs some, after enabling
  Cloudflare, after a migration, under load only), which is how people actually experience this.
- Diagnosis of *why* the web server stopped, not just that it did: OOM killer via
  `grep "killed process"`, and invalid config via `nginx -t`.

## Internal links (6, verified)
cloudflare-5xx-error-codes, cloudflare-error-520, cloudflare-error-525-ssl-handshake-failed,
fix-502-bad-gateway-node-nginx, nginx-reverse-proxy-for-node, fix-econnrefused-node, dns-explained

## Facts check
Kloudbean claims used: Shorewall + Fail2ban configured, free SSL issued and renewed, Cloudflare
paid add-on and free for enterprise, one dashboard. All confirmed in kloudbean-facts.md. Honest
boundary stated (cannot prevent Cloudflare misconfiguration or an overloaded server refusing
connections). Cloudflare behaviour limited to documented facts: published IP ranges, CF-Connecting-IP.
