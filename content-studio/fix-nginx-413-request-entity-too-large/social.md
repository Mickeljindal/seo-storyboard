# Social posts: 413 Request Entity Too Large in nginx: client_max_body_size, Buffers, Timeouts

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-nginx-413-request-entity-too-large/

## X / Twitter
```
> Set `client_max_body_size` to a value above your largest legitimate upload, then run `nginx -t` and reload.

https://www.kloudbean.com/blog/fix-nginx-413-request-entity-too-large/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Set `client_max_body_size` to a value above your largest legitimate upload, then run `nginx -t` and reload.

The catch is that a request body passes through several independent limits, at your CDN, at nginx, and inside your application framework, and the smallest one still wins. Raise the one that actually rejected you, then raise the next one it hands off to.

Read the full guide: https://www.kloudbean.com/blog/fix-nginx-413-request-entity-too-large/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/5  413 Request Entity Too Large in nginx: client_max_body_size, Buffers, Timeouts

Quick thread 🧵
```
```
2/5  > Set `client_max_body_size` to a value above your largest legitimate upload, then run `nginx -t` and reload.
```
```
3/5  The catch is that a request body passes through several independent limits, at your CDN, at nginx, and inside your application framework, and the smallest one still wins.
```
```
4/5  Raise the one that actually rejected you, then raise the next one it hands off to.
```
```
5/5  Full walkthrough:
https://www.kloudbean.com/blog/fix-nginx-413-request-entity-too-large/
#Kloudbean #CloudHosting #DevOps #WebDev
```
