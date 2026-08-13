# Social posts: http error 431 request header fields too large

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/http-error-431-request-header-fields-too-large/

## X / Twitter
```
> Measure your request headers first, since the cause is nearly always accumulated cookies or an oversized JWT.

https://www.kloudbean.com/blog/http-error-431-request-header-fields-too-large/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Measure your request headers first, since the cause is nearly always accumulated cookies or an oversized JWT.

Then raise the limit at whichever layer rejected you: `large_client_header_buffers` in nginx, `--max-http-header-size` for Node, `requestHeaderSize` for Jetty. Raise it only far enough to unblock people, then reduce what you are sending, because a limit raised to accommodate uncontrolled growth just moves the wall further out. Moving session data into Redis and trimming JWT claims are the real fixes.

Read the full guide: https://www.kloudbean.com/blog/http-error-431-request-header-fields-too-large/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  http error 431 request header fields too large

Quick thread 🧵
```
```
2/6  > Measure your request headers first, since the cause is nearly always accumulated cookies or an oversized JWT.
```
```
3/6  Then raise the limit at whichever layer rejected you: `large_client_header_buffers` in nginx, `--max-http-header-size` for Node, `requestHeaderSize` for Jetty.
```
```
4/6  Raise it only far enough to unblock people, then reduce what you are sending, because a limit raised to accommodate uncontrolled growth just moves the wall further out.
```
```
5/6  Moving session data into Redis and trimming JWT claims are the real fixes.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/http-error-431-request-header-fields-too-large/
#Kloudbean #CloudHosting #DevOps #WebDev
```
