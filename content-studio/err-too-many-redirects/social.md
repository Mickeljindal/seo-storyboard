# Social posts: err too many redirects

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/err-too-many-redirects/

## X / Twitter
```
> Run `curl -sIL --max-redirs 10 https://example.com | grep -iE '^HTTP|^location'` to print the loop.

https://www.kloudbean.com/blog/err-too-many-redirects/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Run `curl -sIL --max-redirs 10 https://example.com | grep -iE '^HTTP|^location'` to print the loop.

The pattern of alternating locations tells you the cause. If it bounces between `http` and `https`, either your proxy is not sending `X-Forwarded-Proto` or your SSL mode terminates TLS without passing that through. If it bounces between `www` and non-`www`, two canonical rules are fighting.

Read the full guide: https://www.kloudbean.com/blog/err-too-many-redirects/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  err too many redirects

Quick thread 🧵
```
```
2/6  > Run `curl -sIL --max-redirs 10 https://example.com | grep -iE '^HTTP|^location'` to print the loop.
```
```
3/6  The pattern of alternating locations tells you the cause.
```
```
4/6  If it bounces between `http` and `https`, either your proxy is not sending `X-Forwarded-Proto` or your SSL mode terminates TLS without passing that through.
```
```
5/6  If it bounces between `www` and non-`www`, two canonical rules are fighting.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/err-too-many-redirects/
#Kloudbean #CloudHosting #DevOps #WebDev
```
