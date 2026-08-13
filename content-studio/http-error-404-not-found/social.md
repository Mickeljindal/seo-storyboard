# Social posts: 404 Not Found: Why It Appears After Deploy, and How to Fix It

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/http-error-404-not-found/

## X / Twitter
```
> Three causes cover most of it.

https://www.kloudbean.com/blog/http-error-404-not-found/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## LinkedIn
```
> Three causes cover most of it.

First, case sensitivity: Linux servers treat `About.js` and `about.js` as different files, while macOS and Windows usually don't, so a wrong-case path works locally and 404s in production. Second, single-page-app routing: the server needs a fallback so deep links like `/dashboard` serve `index.html` instead of looking for a file that isn't there. Third, the build output or base path is wrong, so the server is looking in the wrong folder.

Read the full guide: https://www.kloudbean.com/blog/http-error-404-not-found/

#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## X thread
```
1/6  404 Not Found: Why It Appears After Deploy, and How to Fix It

Quick thread 🧵
```
```
2/6  > Three causes cover most of it.
```
```
3/6  First, case sensitivity: Linux servers treat `About.js` and `about.js` as different files, while macOS and Windows usually don't, so a wrong-case path works locally and 404s in production.
```
```
4/6  Second, single-page-app routing: the server needs a fallback so deep links like `/dashboard` serve `index.html` instead of looking for a file that isn't there.
```
```
5/6  Third, the build output or base path is wrong, so the server is looking in the wrong folder.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/http-error-404-not-found/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```
