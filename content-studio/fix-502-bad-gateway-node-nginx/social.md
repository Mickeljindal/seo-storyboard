# Social posts: fix 502 bad gateway node nginx

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-502-bad-gateway-node-nginx/

## X / Twitter
```
> A 502 means Nginx couldn't get a valid response from your Node app.

https://www.kloudbean.com/blog/fix-502-bad-gateway-node-nginx/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> A 502 means Nginx couldn't get a valid response from your Node app.

Check three things: is the Node process actually running and listening on the port Nginx forwards to; does `proxy_pass` point at that exact port; and is the app responding in time. Read `/var/log/nginx/error.log`, it literally says "connection refused" (app down or wrong port) or "upstream timed out" (app too slow). Fix that root cause and the 502 clears.

Read the full guide: https://www.kloudbean.com/blog/fix-502-bad-gateway-node-nginx/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  fix 502 bad gateway node nginx

Quick thread 🧵
```
```
2/6  > A 502 means Nginx couldn't get a valid response from your Node app.
```
```
3/6  Check three things: is the Node process actually running and listening on the port Nginx forwards to; does `proxy_pass` point at that exact port; and is the app responding in time.
```
```
4/6  Read `/var/log/nginx/error.log`, it literally says "connection refused" (app down or wrong port) or "upstream timed out" (app too slow).
```
```
5/6  Fix that root cause and the 502 clears.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/fix-502-bad-gateway-node-nginx/
#Kloudbean #CloudHosting #DevOps #WebDev
```
