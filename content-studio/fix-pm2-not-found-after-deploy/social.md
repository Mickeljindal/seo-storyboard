# Social posts: pm2: command not found After Deploy: Fix the PATH, Not the Install

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-pm2-not-found-after-deploy/

## X / Twitter
```
> Because the shell running your deploy script or cron job doesn't load the same PATH as your interactive login shell, so the global PM2 binary isn't on it.

https://www.kloudbean.com/blog/fix-pm2-not-found-after-deploy/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## LinkedIn
```
> Because the shell running your deploy script or cron job doesn't load the same PATH as your interactive login shell, so the global PM2 binary isn't on it.

PM2 is usually installed fine. Start with `command -v pm2` inside the failing context, not in your own terminal, then compare it to `npm bin -g`. Fix it by calling the absolute path or setting PATH in the script.

Read the full guide: https://www.kloudbean.com/blog/fix-pm2-not-found-after-deploy/

#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## X thread
```
1/6  pm2: command not found After Deploy: Fix the PATH, Not the Install

Quick thread 🧵
```
```
2/6  > Because the shell running your deploy script or cron job doesn't load the same PATH as your interactive login shell, so the global PM2 binary isn't on it.
```
```
3/6  PM2 is usually installed fine.
```
```
4/6  Start with `command -v pm2` inside the failing context, not in your own terminal, then compare it to `npm bin -g`.
```
```
5/6  Fix it by calling the absolute path or setting PATH in the script.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/fix-pm2-not-found-after-deploy/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```
