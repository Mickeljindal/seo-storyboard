# Social posts: vercel for node backends limits

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/vercel-for-node-backends-limits/

## X / Twitter
```
> You can, but Vercel runs it as serverless functions, not a persistent Node process.

https://www.kloudbean.com/blog/vercel-for-node-backends-limits/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> You can, but Vercel runs it as serverless functions, not a persistent Node process.

That brings execution-duration limits (currently around 300 seconds by default, up to 800 or an extended 1,800 on Pro with Fluid Compute, per Vercel's docs, not the old 10 seconds), cold starts after idle, no durable long-running workers, WebSockets only within function limits, and usage-based bills that combine several meters. For a persistent API, worker, or WebSocket backend, a real always-on server is the better fit.

Read the full guide: https://www.kloudbean.com/blog/vercel-for-node-backends-limits/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/5  vercel for node backends limits

Quick thread 🧵
```
```
2/5  > You can, but Vercel runs it as serverless functions, not a persistent Node process.
```
```
3/5  That brings execution-duration limits (currently around 300 seconds by default, up to 800 or an extended 1,800 on Pro with Fluid Compute, per Vercel's docs, not the old 10 seconds), cold starts after idle, no durable long-running workers, WebSockets only within function limits,…
```
```
4/5  For a persistent API, worker, or WebSocket backend, a real always-on server is the better fit.
```
```
5/5  Full walkthrough:
https://www.kloudbean.com/blog/vercel-for-node-backends-limits/
#Kloudbean #CloudHosting #DevOps #WebDev
```
