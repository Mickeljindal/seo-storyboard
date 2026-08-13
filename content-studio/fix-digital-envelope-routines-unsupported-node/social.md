# Social posts: Fix: error:0308010C digital envelope routines unsupported (Node.js)

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-digital-envelope-routines-unsupported-node/

## X / Twitter
```
> It appears because Node 17 and newer ship OpenSSL 3.0, which refuses the outdated hashing algorithm that older build tools (Webpack 4,…

https://www.kloudbean.com/blog/fix-digital-envelope-routines-unsupported-node/
#Kloudbean #CloudHosting #DevOps #WebDev #NodeJS #Deployment
```

## LinkedIn
```
> It appears because Node 17 and newer ship OpenSSL 3.0, which refuses the outdated hashing algorithm that older build tools (Webpack 4, older…

The proper fix is to upgrade the build tooling to a version that uses a modern algorithm, for example `react-scripts` 5 or Webpack 5. If you can't upgrade right now, set `NODE_OPTIONS=--openssl-legacy-provider` as a temporary bridge. Downgrading Node back to 16 also stops the error, but Node 16 is end of life, so treat that as a last resort, not a fix.

Read the full guide: https://www.kloudbean.com/blog/fix-digital-envelope-routines-unsupported-node/

#Kloudbean #CloudHosting #DevOps #WebDev #NodeJS #Deployment
```

## X thread
```
1/6  Fix: error:0308010C digital envelope routines unsupported (Node.js)

Quick thread 🧵
```
```
2/6  > It appears because Node 17 and newer ship OpenSSL 3.0, which refuses the outdated hashing algorithm that older build tools (Webpack 4, older `react-scripts`) relied on.
```
```
3/6  The proper fix is to upgrade the build tooling to a version that uses a modern algorithm, for example `react-scripts` 5 or Webpack 5.
```
```
4/6  If you can't upgrade right now, set `NODE_OPTIONS=--openssl-legacy-provider` as a temporary bridge.
```
```
5/6  Downgrading Node back to 16 also stops the error, but Node 16 is end of life, so treat that as a last resort, not a fix.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/fix-digital-envelope-routines-unsupported-node/
#Kloudbean #CloudHosting #DevOps #WebDev #NodeJS #Deployment
```
