# Social posts: cloudflare error 521 web server is down

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/cloudflare-error-521-web-server-is-down/

## X / Twitter
```
> First check whether your web server is actually running with `systemctl status nginx`, then request your origin IP directly with `curl --resolve` from…

https://www.kloudbean.com/blog/cloudflare-error-521-web-server-is-down/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> First check whether your web server is actually running with `systemctl status nginx`, then request your origin IP directly with `curl --resolve` from…

If the origin answers, your server is fine and something is refusing Cloudflare specifically, which means either your firewall does not allow Cloudflare's IP ranges on ports 80 and 443, or Fail2ban has banned Cloudflare addresses. Both are common, and the second one is the reason 521 often appears for some visitors and not others.

Read the full guide: https://www.kloudbean.com/blog/cloudflare-error-521-web-server-is-down/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/5  cloudflare error 521 web server is down

Quick thread 🧵
```
```
2/5  > First check whether your web server is actually running with `systemctl status nginx`, then request your origin IP directly with `curl --resolve` from outside your network.
```
```
3/5  If the origin answers, your server is fine and something is refusing Cloudflare specifically, which means either your firewall does not allow Cloudflare's IP ranges on ports 80 and 443, or Fail2ban has banned Cloudflare addresses.
```
```
4/5  Both are common, and the second one is the reason 521 often appears for some visitors and not others.
```
```
5/5  Full walkthrough:
https://www.kloudbean.com/blog/cloudflare-error-521-web-server-is-down/
#Kloudbean #CloudHosting #DevOps #WebDev
```
