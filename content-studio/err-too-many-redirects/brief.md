# Brief: err-too-many-redirects

## Keyword grounding (SEMrush gap export, 2026-07-23)

Part of a redirect family totalling **134,410 across 282 keywords**, the largest remaining seam in
the export. This article takes the loop.

| Keyword | Vol | KD |
|---|---|---|
| **err_too_many_redirects** (primary) | **3,600** | **31** |

Kinsta ranks with a dedicated page. Intent is urgent: the site is unreachable right now.

**Secondary terms woven in:** redirect loop, too many redirects wordpress, X-Forwarded-Proto,
trust proxy, SECURE_PROXY_SSL_HEADER, TrustProxies, cloudflare flexible ssl redirect loop,
WP_HOME, WP_SITEURL, siteurl home mismatch, www non-www loop, login redirect loop, hsts,
redirect chain, num_redirects.

## Placement
Primary keyword in H1, title, meta, lead, TL;DR. 8 FAQ entries.

## Original value competitors do not have
- **Print the loop before changing anything.** Opens with the one curl command that makes the whole
  problem visible, then a six-row table mapping the alternating pair to its cause. Competing
  articles open with a list of fixes to try, which is how people end up with four conflicting rules
  instead of two.
- **The TLS termination mechanism explained properly**, which is the cause of most http-to-https
  loops and the thing nobody spells out: the proxy decrypts and forwards over plain HTTP, so the app
  correctly concludes the request was insecure and correctly redirects. Neither side is
  misconfigured in isolation. The missing piece is the header and the trust setting.
- **Both halves of that fix**, in four stacks: nginx `proxy_set_header X-Forwarded-Proto`, plus
  Express `trust proxy`, Django `SECURE_PROXY_SSL_HEADER`, Laravel `TrustProxies`, and the WordPress
  `wp-config.php` snippet with the note that it must sit above the wp-settings require. Most guides
  give one side and leave the reader stuck.
- **A security caveat on `X-Forwarded-Proto`** that almost no article includes: clients can send that
  header themselves, so trusting it unconditionally on a directly reachable app lets an attacker
  claim HTTPS. Trust the proxy, not the header.
- **The origin-versus-proxied curl comparison** that localises an edge-configuration loop in one step.
- **"The fix is not a smarter rule, it is finding every place a canonical redirect is defined and
  leaving one"**, with greps across nginx, Apache, and `.htaccess`, plus the reminder that plugins and
  framework settings are invisible to those greps.
- **`WP_HOME` / `WP_SITEURL` in wp-config as the emergency lever**, framed correctly as a way to
  remove WordPress from the argument while you find the real cause, not as the permanent fix.
- **"An SSL plugin is a third opinion in a two-way argument"** when the server already redirects.
- **The login loop as a distinct variant** with four ordered checks (cookie domain, Secure flag,
  shared session store, cookie size), including the observation that a `www` cookie is not sent to
  the bare domain so a canonical redirect becomes a logout. Also the honest note that clearing
  cookies genuinely does fix this one variant, which is the only place the standard advice works.
- **Redirect chains treated as a separate, real problem** even when they resolve, with the accretion
  story (HTTPS rule, then canonical rule, then path change, each by a different person).
- **The HSTS testing warning**: browsers upgrade http themselves so a fix can look ineffective, which
  is another reason to trust curl. Plus the caution that a long HSTS duration cannot be recalled.

## Internal links (7, verified)
cloudflare-error-525-ssl-handshake-failed, cloudflare-5xx-error-codes, nginx-reverse-proxy-for-node,
fix-ssl-certificate-errors, custom-domain-and-ssl-for-your-app, managed-redis-hosting, 400-bad-request

## Facts check
Kloudbean claims used: managed nginx configured with forwarded headers, free SSL issued and renewed,
Cloudflare paid add-on and free for enterprise, managed Redis, staging sites, one dashboard, free
migration assistance. All in kloudbean-facts.md. Honest boundary stated (cannot decide your canonical
host, cannot stop a plugin fighting your server config).
