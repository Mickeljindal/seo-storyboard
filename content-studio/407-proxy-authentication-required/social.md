# Social posts: 407 proxy authentication required

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/407-proxy-authentication-required/

## X / Twitter
```
> Give the proxy the credentials it's asking for.

https://www.kloudbean.com/blog/407-proxy-authentication-required/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Give the proxy the credentials it's asking for.

A 407 means a proxy between you and the site wants a username and password, answered in a `Proxy-Authorization` header, so the fix is to configure your client or environment with the proxy's credentials, not to change your app. Confirm it first with `curl -v` through the proxy: you'll see the 407 status and a `Proxy-Authenticate` header naming the scheme. For command-line tools, set `http_proxy` and `https_proxy` (or the npm, git, pip, and apt proxy settings) with credentials, and keep those…

Read the full guide: https://www.kloudbean.com/blog/407-proxy-authentication-required/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  407 proxy authentication required

Quick thread 🧵
```
```
2/6  > Give the proxy the credentials it's asking for.
```
```
3/6  A 407 means a proxy between you and the site wants a username and password, answered in a `Proxy-Authorization` header, so the fix is to configure your client or environment with the proxy's credentials, not to change your app.
```
```
4/6  Confirm it first with `curl -v` through the proxy: you'll see the 407 status and a `Proxy-Authenticate` header naming the scheme.
```
```
5/6  For command-line tools, set `http_proxy` and `https_proxy` (or the npm, git, pip, and apt proxy settings) with credentials, and keep those credentials out of shell history and logs.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/407-proxy-authentication-required/
#Kloudbean #CloudHosting #DevOps #WebDev
```
