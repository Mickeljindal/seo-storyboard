# Social posts: pm2 app keeps restarting

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/pm2-app-keeps-restarting/

## X / Twitter
```
> Because it's crashing shortly after it starts, so PM2 relaunches it, and it crashes again, a loop.

https://www.kloudbean.com/blog/pm2-app-keeps-restarting/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Because it's crashing shortly after it starts, so PM2 relaunches it, and it crashes again, a loop.

The fix is always the same first move: run `pm2 logs` to see the actual error before each restart. It's usually a missing environment variable, a port already in use, a missing module, or a database that's unreachable on boot. Fix that root cause, then add `min_uptime` and `max_restarts` so a future crash is marked "errored" instead of looping forever.

Read the full guide: https://www.kloudbean.com/blog/pm2-app-keeps-restarting/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  pm2 app keeps restarting

Quick thread 🧵
```
```
2/6  > Because it's crashing shortly after it starts, so PM2 relaunches it, and it crashes again, a loop.
```
```
3/6  The fix is always the same first move: run `pm2 logs` to see the actual error before each restart.
```
```
4/6  It's usually a missing environment variable, a port already in use, a missing module, or a database that's unreachable on boot.
```
```
5/6  Fix that root cause, then add `min_uptime` and `max_restarts` so a future crash is marked "errored" instead of looping forever.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/pm2-app-keeps-restarting/
#Kloudbean #CloudHosting #DevOps #WebDev
```
