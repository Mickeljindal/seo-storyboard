# Social posts: cloudflare error 525 ssl handshake failed

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/cloudflare-error-525-ssl-handshake-failed/

## X / Twitter
```
> Your origin needs a valid TLS certificate on port 443 that Cloudflare can complete a handshake with.

https://www.kloudbean.com/blog/cloudflare-error-525-ssl-handshake-failed/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Your origin needs a valid TLS certificate on port 443 that Cloudflare can complete a handshake with.

Inspect what your server is really serving using `openssl s_client` with the `-servername` flag, then fix the gap: install a certificate if there is none, renew it if expired, open port 443 if it is closed, or update the TLS versions and ciphers your server offers. The clean answer for most sites is a free Cloudflare Origin CA certificate on the origin plus Full (strict) mode. Do not use Flexible.

Read the full guide: https://www.kloudbean.com/blog/cloudflare-error-525-ssl-handshake-failed/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  cloudflare error 525 ssl handshake failed

Quick thread 🧵
```
```
2/6  > Your origin needs a valid TLS certificate on port 443 that Cloudflare can complete a handshake with.
```
```
3/6  Inspect what your server is really serving using `openssl s_client` with the `-servername` flag, then fix the gap: install a certificate if there is none, renew it if expired, open port 443 if it is closed, or update the TLS versions and ciphers your server offers.
```
```
4/6  The clean answer for most sites is a free Cloudflare Origin CA certificate on the origin plus Full (strict) mode.
```
```
5/6  Do not use Flexible.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/cloudflare-error-525-ssl-handshake-failed/
#Kloudbean #CloudHosting #DevOps #WebDev
```
