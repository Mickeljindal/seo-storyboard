# Social posts: cloudflare error 522 connection timed out

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/cloudflare-error-522-connection-timed-out/

## X / Twitter
```
> Cloudflare could not complete a TCP connection to your origin server.

https://www.kloudbean.com/blog/cloudflare-error-522-connection-timed-out/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Cloudflare could not complete a TCP connection to your origin server.

Per Cloudflare's documentation there are two timeouts behind the one code: before a connection exists, it gives up if no SYN+ACK arrives within 19 seconds of its SYN; once connected, it gives up if the request is not acknowledged within 90 seconds. The 19-second case means packets are being dropped, so look at cloud security groups, host firewall rules, and a full listen backlog. The 90-second case means the connection worked and your application never replied.

Read the full guide: https://www.kloudbean.com/blog/cloudflare-error-522-connection-timed-out/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  cloudflare error 522 connection timed out

Quick thread 🧵
```
```
2/6  > Cloudflare could not complete a TCP connection to your origin server.
```
```
3/6  Per Cloudflare's documentation there are two timeouts behind the one code: before a connection exists, it gives up if no SYN+ACK arrives within 19 seconds of its SYN; once connected, it gives up if the request is not acknowledged within 90 seconds.
```
```
4/6  The 19-second case means packets are being dropped, so look at cloud security groups, host firewall rules, and a full listen backlog.
```
```
5/6  The 90-second case means the connection worked and your application never replied.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/cloudflare-error-522-connection-timed-out/
#Kloudbean #CloudHosting #DevOps #WebDev
```
