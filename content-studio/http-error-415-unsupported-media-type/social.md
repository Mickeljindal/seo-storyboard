# Social posts: http error 415 unsupported media type

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/http-error-415-unsupported-media-type/

## X / Twitter
```
> The server refuses to process your request because the request body is in a format it doesn't support for that method on that resource.

https://www.kloudbean.com/blog/http-error-415-unsupported-media-type/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> The server refuses to process your request because the request body is in a format it doesn't support for that method on that resource.

In practice it's nearly always the `Content-Type` header on a POST, PUT or PATCH: missing, wrong, or carrying a parameter the server rejects. Set the correct type explicitly and retry. Per RFC 9110 the refusal can also come from an unsupported `Content-Encoding`, or from the server inspecting the data itself, so a correct header does not fully rule out a 415.

Read the full guide: https://www.kloudbean.com/blog/http-error-415-unsupported-media-type/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  http error 415 unsupported media type

Quick thread 🧵
```
```
2/6  > The server refuses to process your request because the request body is in a format it doesn't support for that method on that resource.
```
```
3/6  In practice it's nearly always the `Content-Type` header on a POST, PUT or PATCH: missing, wrong, or carrying a parameter the server rejects.
```
```
4/6  Set the correct type explicitly and retry.
```
```
5/6  Per RFC 9110 the refusal can also come from an unsupported `Content-Encoding`, or from the server inspecting the data itself, so a correct header does not fully rule out a 415.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/http-error-415-unsupported-media-type/
#Kloudbean #CloudHosting #DevOps #WebDev
```
