# Social posts: fix cors error node production

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-cors-error-node-production/

## X / Twitter
```
> Configure your server to return an `Access-Control-Allow-Origin` header that includes your frontend's real production origin, not just localhost.

https://www.kloudbean.com/blog/fix-cors-error-node-production/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Configure your server to return an `Access-Control-Allow-Origin` header that includes your frontend's real production origin, not just localhost.

In Express, use the `cors` package with an allowed-origins list read from an environment variable. If you send cookies, set `credentials: true` and list the exact origin (you can't use `*` with credentials). Make sure preflight `OPTIONS` requests are handled, and don't set CORS headers in both the app and the proxy.

Read the full guide: https://www.kloudbean.com/blog/fix-cors-error-node-production/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  fix cors error node production

Quick thread 🧵
```
```
2/6  > Configure your server to return an `Access-Control-Allow-Origin` header that includes your frontend's real production origin, not just localhost.
```
```
3/6  In Express, use the `cors` package with an allowed-origins list read from an environment variable.
```
```
4/6  If you send cookies, set `credentials: true` and list the exact origin (you can't use `*` with credentials).
```
```
5/6  Make sure preflight `OPTIONS` requests are handled, and don't set CORS headers in both the app and the proxy.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/fix-cors-error-node-production/
#Kloudbean #CloudHosting #DevOps #WebDev
```
