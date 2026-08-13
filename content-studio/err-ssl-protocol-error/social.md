# Social posts: err ssl protocol error

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/err-ssl-protocol-error/

## X / Twitter
```
> Test which TLS versions your server actually accepts with `openssl s_client`, one version at a time.

https://www.kloudbean.com/blog/err-ssl-protocol-error/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Test which TLS versions your server actually accepts with `openssl s_client`, one version at a time.

If nothing above TLS 1.1 is supported, that is your answer, because current browsers refuse the older versions: set `ssl_protocols TLSv1.2 TLSv1.3;` and reload. If TLS 1.2 works from the command line but the browser still fails, suspect local interference such as antivirus HTTPS scanning, or Chrome attempting QUIC. And if you are seeing SSL_ERROR_RX_RECORD_TOO_LONG, you are almost certainly requesting `https://` against a port that serves plain HTTP.

Read the full guide: https://www.kloudbean.com/blog/err-ssl-protocol-error/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  err ssl protocol error

Quick thread 🧵
```
```
2/6  > Test which TLS versions your server actually accepts with `openssl s_client`, one version at a time.
```
```
3/6  If nothing above TLS 1.1 is supported, that is your answer, because current browsers refuse the older versions: set `ssl_protocols TLSv1.2 TLSv1.3;` and reload.
```
```
4/6  If TLS 1.2 works from the command line but the browser still fails, suspect local interference such as antivirus HTTPS scanning, or Chrome attempting QUIC.
```
```
5/6  And if you are seeing SSL_ERROR_RX_RECORD_TOO_LONG, you are almost certainly requesting `https://` against a port that serves plain HTTP.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/err-ssl-protocol-error/
#Kloudbean #CloudHosting #DevOps #WebDev
```
