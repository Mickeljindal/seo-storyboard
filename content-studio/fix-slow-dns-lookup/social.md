# Social posts: fix slow dns lookup

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-slow-dns-lookup/

## X / Twitter
```
> Measure first with `curl -w "%{time_namelookup}"` and `dig` to see whether a single lookup is genuinely slow or whether you simply have too many.

https://www.kloudbean.com/blog/fix-slow-dns-lookup/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Measure first with `curl -w "%{time_namelookup}"` and `dig` to see whether a single lookup is genuinely slow or whether you simply have too many.

Slow single lookups are fixed on the DNS provider side: use an Anycast provider, set sensible TTLs, flatten CNAME chains, and repair broken delegation. Too many lookups is a front-end problem: cut third-party hostnames and use `preconnect` for the few origins you keep. Also check the resolver on your own server, which almost nobody does.

Read the full guide: https://www.kloudbean.com/blog/fix-slow-dns-lookup/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  fix slow dns lookup

Quick thread 🧵
```
```
2/6  > Measure first with `curl -w "%{time_namelookup}"` and `dig` to see whether a single lookup is genuinely slow or whether you simply have too many.
```
```
3/6  Slow single lookups are fixed on the DNS provider side: use an Anycast provider, set sensible TTLs, flatten CNAME chains, and repair broken delegation.
```
```
4/6  Too many lookups is a front-end problem: cut third-party hostnames and use `preconnect` for the few origins you keep.
```
```
5/6  Also check the resolver on your own server, which almost nobody does.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/fix-slow-dns-lookup/
#Kloudbean #CloudHosting #DevOps #WebDev
```
