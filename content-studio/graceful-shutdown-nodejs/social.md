# Social posts: graceful shutdown nodejs

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/graceful-shutdown-nodejs/

## X / Twitter
```
> Listen for the `SIGTERM` signal your platform sends on restart or deploy.

https://www.kloudbean.com/blog/graceful-shutdown-nodejs/
#Kloudbean #CloudHosting #DevOps #WebDev #NodeJS
```

## LinkedIn
```
> Listen for the `SIGTERM` signal your platform sends on restart or deploy.

On receiving it, stop accepting new connections with `server.close()`, let in-flight requests finish, close your database pool and Redis, then `process.exit(0)`. Add a timeout that force-exits if draining hangs, so a stuck connection can't block the shutdown forever. Handle `SIGINT` too for local Ctrl+C.

Read the full guide: https://www.kloudbean.com/blog/graceful-shutdown-nodejs/

#Kloudbean #CloudHosting #DevOps #WebDev #NodeJS
```

## X thread
```
1/6  graceful shutdown nodejs

Quick thread 🧵
```
```
2/6  > Listen for the `SIGTERM` signal your platform sends on restart or deploy.
```
```
3/6  On receiving it, stop accepting new connections with `server.close()`, let in-flight requests finish, close your database pool and Redis, then `process.exit(0)`.
```
```
4/6  Add a timeout that force-exits if draining hangs, so a stuck connection can't block the shutdown forever.
```
```
5/6  Handle `SIGINT` too for local Ctrl+C.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/graceful-shutdown-nodejs/
#Kloudbean #CloudHosting #DevOps #WebDev #NodeJS
```
