# Social posts: fix 504 gateway timeout

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-504-gateway-timeout/

## X / Twitter
```
> Find which layer gave up by reading your web server error log, where nginx records `upstream timed out` along with the upstream address.

https://www.kloudbean.com/blog/fix-504-gateway-timeout/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Find which layer gave up by reading your web server error log, where nginx records `upstream timed out` along with the upstream address.

Then fix the slow work rather than the timeout: look for unindexed queries, external API calls without their own timeout, and long-running tasks running inside a web request. Raising `proxy_read_timeout` or `fastcgi_read_timeout` is appropriate only when the work is genuinely long and cannot be moved, and even then it should be a deliberate exception rather than a first response.

Read the full guide: https://www.kloudbean.com/blog/fix-504-gateway-timeout/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/5  fix 504 gateway timeout

Quick thread 🧵
```
```
2/5  > Find which layer gave up by reading your web server error log, where nginx records `upstream timed out` along with the upstream address.
```
```
3/5  Then fix the slow work rather than the timeout: look for unindexed queries, external API calls without their own timeout, and long-running tasks running inside a web request.
```
```
4/5  Raising `proxy_read_timeout` or `fastcgi_read_timeout` is appropriate only when the work is genuinely long and cannot be moved, and even then it should be a deliberate exception rather than a first response.
```
```
5/5  Full walkthrough:
https://www.kloudbean.com/blog/fix-504-gateway-timeout/
#Kloudbean #CloudHosting #DevOps #WebDev
```
