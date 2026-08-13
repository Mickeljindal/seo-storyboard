# Social posts: http error 401 unauthorized

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/http-error-401-unauthorized/

## X / Twitter
```
> Confirm the credentials are actually reaching the server, then confirm they are still valid.

https://www.kloudbean.com/blog/http-error-401-unauthorized/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Confirm the credentials are actually reaching the server, then confirm they are still valid.

Send the request with `curl -v` to see the exact `Authorization` header you transmitted, and decode any JWT to check its expiry. The causes people miss are a proxy stripping the header, which nginx does by default to any header containing an underscore, a token issued for a different environment, and server clock drift making a valid token look expired.

Read the full guide: https://www.kloudbean.com/blog/http-error-401-unauthorized/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/5  http error 401 unauthorized

Quick thread 🧵
```
```
2/5  > Confirm the credentials are actually reaching the server, then confirm they are still valid.
```
```
3/5  Send the request with `curl -v` to see the exact `Authorization` header you transmitted, and decode any JWT to check its expiry.
```
```
4/5  The causes people miss are a proxy stripping the header, which nginx does by default to any header containing an underscore, a token issued for a different environment, and server clock drift making a valid token look expired.
```
```
5/5  Full walkthrough:
https://www.kloudbean.com/blog/http-error-401-unauthorized/
#Kloudbean #CloudHosting #DevOps #WebDev
```
