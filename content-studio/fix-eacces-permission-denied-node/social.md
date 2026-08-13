# Social posts: Fix: listen EACCES: permission denied in Node.js

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-eacces-permission-denied-node/

## X / Twitter
```
> It almost always means your app tried to bind a privileged port (below 1024, usually 80 or 443) without root permission.

https://www.kloudbean.com/blog/fix-eacces-permission-denied-node/
#Kloudbean #CloudHosting #DevOps #WebDev #NodeJS #Deployment
```

## LinkedIn
```
> It almost always means your app tried to bind a privileged port (below 1024, usually 80 or 443) without root permission.

Don't fix it by running Node as root, that's a security risk. Instead, run your app on a high port like 3000 or 8080 and put a reverse proxy (Nginx) in front to listen on 80 and 443 and forward to it. On a managed host this is already done for you.

Read the full guide: https://www.kloudbean.com/blog/fix-eacces-permission-denied-node/

#Kloudbean #CloudHosting #DevOps #WebDev #NodeJS #Deployment
```

## X thread
```
1/6  Fix: listen EACCES: permission denied in Node.js

Quick thread 🧵
```
```
2/6  > It almost always means your app tried to bind a privileged port (below 1024, usually 80 or 443) without root permission.
```
```
3/6  Don't fix it by running Node as root, that's a security risk.
```
```
4/6  Instead, run your app on a high port like 3000 or 8080 and put a reverse proxy (Nginx) in front to listen on 80 and 443 and forward to it.
```
```
5/6  On a managed host this is already done for you.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/fix-eacces-permission-denied-node/
#Kloudbean #CloudHosting #DevOps #WebDev #NodeJS #Deployment
```
