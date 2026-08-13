# Social posts: How to Deploy a Fastify App to Production (Node + PM2)

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/deploy-fastify-app/

## X / Twitter
```
How to Deploy a Fastify App to Production (Node + PM2)

https://www.kloudbean.com/blog/deploy-fastify-app/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## LinkedIn
```
How to Deploy a Fastify App to Production (Node + PM2)

Bind the server with `app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' })`, because Fastify defaults to localhost only and that is why it 502s behind a proxy. Read config from `process.env`, set `trustProxy: true` so it behaves behind nginx, keep the built-in pino logger writing JSON to stdout, and handle `SIGTERM` by calling `app.close()`. Then deploy from Git, run it under PM2, wire in a managed database, and attach a domain with free SSL.

Read the full guide: https://www.kloudbean.com/blog/deploy-fastify-app/

#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## X thread
```
1/6  How to Deploy a Fastify App to Production (Node + PM2)

Quick thread 🧵
```
```
2/6  Bind the server with `app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' })`, because Fastify defaults to localhost only and that is why it 502s behind a proxy.
```
```
3/6  Read config from `process.env`, set `trustProxy: true` so it behaves behind nginx, keep the built-in pino logger writing JSON to stdout, and handle `SIGTERM` by calling `app.close()`.
```
```
4/6  Then deploy from Git, run it under PM2, wire in a managed database, and attach a domain with free SSL.
```
```
5/6  Most Fastify deploy failures are config, not code.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/deploy-fastify-app/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```
