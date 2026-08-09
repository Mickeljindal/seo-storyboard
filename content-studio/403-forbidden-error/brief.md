# Brief: 403-forbidden-error

## Keyword grounding (SEMrush gap export, 2026-07-23)

The largest family in the export: **187,480 combined volume across 141 keywords**. Head terms are
hard (KD 42 to 60), so this page is written to win the low-difficulty entry points now and grow into
the head as the silo matures.

Winnable entry points:

| Keyword | Vol | KD |
|---|---|---|
| **your client does not have permission to get url** | **3,600** | **13** |
| error: unable to download video data: http error 403 | 2,400 | 22 |
| 403 error the request could not be satisfied. | 2,400 | 31 |

Head terms in the same family, targeted as a longer-term goal:

| Keyword | Vol | KD |
|---|---|---|
| 403 error | 18,100 | 59 |
| 403 forbidden | 18,100 | 57 |
| 403 forbidden error | 8,100 | 60 |
| http 403 error | 6,600 | 42 |
| 403 error meaning | 5,400 | 50 |
| error code 403 | 5,400 | 58 |
| what does 403 forbidden mean | 5,400 | 47 |

Kinsta ranks for essentially all 141. Intent is diagnostic.

**Secondary terms woven in:** 401 vs 403, chmod 777, file permissions 755 644, namei, directory
index forbidden, access forbidden by rule, permission denied, .htaccess, wp-admin 403, security
plugin blocking ip, hotlink protection, presigned url expired, bucket policy, SELinux.

## Placement
Primary term in H1, title, meta description, lead, TL;DR. The H1 carries the differentiator ("which
of the five 403s"). 8 FAQ entries covering the real PAA set.

## Original value competitors do not have
- **THE SPINE: 403 is five unrelated failures sharing one status code.** Filesystem permissions,
  missing directory index, explicit deny rule, application or security layer, storage bucket policy.
  Competing articles present one undifferentiated list of fixes, which is why people spend an hour on
  permissions when a plugin was blocking their address.
- **An nginx-log-line-to-cause table** with the three distinct messages (`directory index ... is
  forbidden`, `access forbidden by rule`, `open() ... failed (13: Permission denied)`) mapped to
  three unrelated fixes. Nobody else uses the log to route the diagnosis.
- **"An empty error log is information"** — it proves the web server was willing and something else
  refused, so stop looking at permissions. That is a genuine decision cue.
- **`namei -l` on the full path**, because every parent directory needs execute permission and a
  correct file inside an unenterable directory produces the same error. This explains the "I fixed
  the permissions and it still fails" case that competing articles leave hanging.
- **A proper argument against `chmod 777`** on two grounds, not just hand-waving about security: it is
  a real exposure on multi-tenant systems, AND it frequently does not work because some
  configurations refuse to execute group or world writable scripts. So you take the security hit and
  keep the error.
- **"Do not switch directory listing on to make the error go away"** — that replaces a 403 with a
  public file browser.
- **The proxy trap for allow lists**: once traffic is proxied the web server only sees the proxy, so
  an allow list written against visitor addresses matches nothing. Cross-links to the 521 guide where
  the same misunderstanding causes a different outage.
- **"Check whether the 403 is deliberate"** — if you put an IP allow list or basic auth gate on
  staging, the control is working. A five second check that saves an afternoon.
- **WAF false positives characterised by signature**: one specific action fails while everything else
  works, classically saving a post containing SQL keywords or code samples.
- **Expired presigned URLs as a named cause** with the recognisable pattern: worked yesterday, 403
  today, nothing changed.
- **The "your client does not have permission to get URL" case handled accurately** as a Google
  frontend response, with the useful conclusion that nothing on your own server will change it.
  This is the KD 13 entry keyword, and answering it correctly rather than lumping it in with file
  permissions is the whole value.
- **An eight-row pattern table** keyed on how the reader is experiencing it (works on mobile data but
  not from the office, only wp-admin, only when saving one post, images only when embedded).

## Internal links (9, verified)
fix-502-bad-gateway-node-nginx, fix-503-after-deploying-your-app, fix-504-gateway-timeout,
cloudflare-5xx-error-codes, cloudflare-error-521-web-server-is-down,
there-has-been-a-critical-error-on-this-website, wordpress-cli-guide, secure-wordpress-hosting,
s3-compatible-object-storage, security-headers-guide

## Facts check
Kloudbean claims used: applications provisioned with correct ownership and permissions, IP Access
Control with allow/deny and CIDR, Basic Auth gate for apps, S3-compatible buckets with public and
private access controls, free migration assistance. All confirmed in kloudbean-facts.md. Deliberately
no managed-WAF claim, since that is on the unconfirmed list; WAFs are discussed as a general concept
the reader may have. Honest boundary stated (cannot stop a security plugin blocking your own address,
cannot tell a WAF your post about SQL injection is not an attack).
