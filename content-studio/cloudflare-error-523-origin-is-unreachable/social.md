# Social posts: cloudflare error 523 origin is unreachable

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/cloudflare-error-523-origin-is-unreachable/

## X / Twitter
```
> Cloudflare could not contact your origin because something between the two has no route to your origin's IP address.

https://www.kloudbean.com/blog/cloudflare-error-523-origin-is-unreachable/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Cloudflare could not contact your origin because something between the two has no route to your origin's IP address.

Per Cloudflare's documentation the usual causes are a wrong origin IP in your A or AAAA record, and network routing problems between the origin and Cloudflare. In AWS specifically, a very common cause is an overly broad route such as `172.0.0.0/8` in a VPC route table, because Cloudflare uses public addresses in `172.64.0.0/13` and that broad route swallows them. Restarting your web server will not help.

Read the full guide: https://www.kloudbean.com/blog/cloudflare-error-523-origin-is-unreachable/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  cloudflare error 523 origin is unreachable

Quick thread 🧵
```
```
2/6  > Cloudflare could not contact your origin because something between the two has no route to your origin's IP address.
```
```
3/6  Per Cloudflare's documentation the usual causes are a wrong origin IP in your A or AAAA record, and network routing problems between the origin and Cloudflare.
```
```
4/6  In AWS specifically, a very common cause is an overly broad route such as `172.0.0.0/8` in a VPC route table, because Cloudflare uses public addresses in `172.64.0.0/13` and that broad route swallows them.
```
```
5/6  Restarting your web server will not help.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/cloudflare-error-523-origin-is-unreachable/
#Kloudbean #CloudHosting #DevOps #WebDev
```
