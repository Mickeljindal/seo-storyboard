# Social posts: nginx 499 client closed request

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/nginx-499-client-closed-request/

## X / Twitter
```
> It means the client closed the request before the server responded.

https://www.kloudbean.com/blog/nginx-499-client-closed-request/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> It means the client closed the request before the server responded.

It is non-standard, specific to nginx, and it appears only in your logs, never in a browser, because by the time nginx records it there is nobody left to send a page to. Most 499s are ordinary human behaviour: someone hit stop, closed the tab, navigated away, or lost mobile signal. The version worth investigating is a cluster of them on one slow endpoint, which means the client's timeout is shorter than your response time.

Read the full guide: https://www.kloudbean.com/blog/nginx-499-client-closed-request/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  nginx 499 client closed request

Quick thread 🧵
```
```
2/6  > It means the client closed the request before the server responded.
```
```
3/6  It is non-standard, specific to nginx, and it appears only in your logs, never in a browser, because by the time nginx records it there is nobody left to send a page to.
```
```
4/6  Most 499s are ordinary human behaviour: someone hit stop, closed the tab, navigated away, or lost mobile signal.
```
```
5/6  The version worth investigating is a cluster of them on one slow endpoint, which means the client's timeout is shorter than your response time.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/nginx-499-client-closed-request/
#Kloudbean #CloudHosting #DevOps #WebDev
```
