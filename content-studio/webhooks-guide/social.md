# Social posts: webhooks guide

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/webhooks-guide/

## X / Twitter
```
Verify the HMAC signature on every incoming webhook using the raw request body and a timing-safe compare.

https://www.kloudbean.com/blog/webhooks-guide/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
Verify the HMAC signature on every incoming webhook using the raw request body and a timing-safe compare.

Return a 2xx (a 202 is ideal) the moment you've verified and queued the event, then do the real work in a background worker backed by Redis. Make the handler idempotent by deduping on the provider's event id, because providers retry and you will see the same event twice. Keep the signing secret in an environment variable, and serve the endpoint over HTTPS.

Read the full guide: https://www.kloudbean.com/blog/webhooks-guide/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  webhooks guide

Quick thread 🧵
```
```
2/6  Verify the HMAC signature on every incoming webhook using the raw request body and a timing-safe compare.
```
```
3/6  Return a 2xx (a 202 is ideal) the moment you've verified and queued the event, then do the real work in a background worker backed by Redis.
```
```
4/6  Make the handler idempotent by deduping on the provider's event id, because providers retry and you will see the same event twice.
```
```
5/6  Keep the signing secret in an environment variable, and serve the endpoint over HTTPS.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/webhooks-guide/
#Kloudbean #CloudHosting #DevOps #WebDev
```
