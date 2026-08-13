# Social posts: Store User Uploads in Object Storage, Not on the App Server

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/store-user-uploads-in-object-storage/

## X / Twitter
```
Where should you store user uploads?

https://www.kloudbean.com/blog/store-user-uploads-in-object-storage/
#Kloudbean #AIapps #VibeCoding #DevOps #RAG #Database
```

## LinkedIn
```
Where should you store user uploads?

In an S3-compatible object storage bucket, not on the app server's local disk. On most managed platforms the app filesystem is ephemeral and isn't shared across instances, so files written to `./uploads` disappear on the next deploy or 404 behind a load balancer. Keep the file bytes in a bucket, store only the object key and metadata in your database, and serve each file with a public URL or a short-lived presigned URL.

Read the full guide: https://www.kloudbean.com/blog/store-user-uploads-in-object-storage/

#Kloudbean #AIapps #VibeCoding #DevOps #RAG #Database
```

## X thread
```
1/6  Store User Uploads in Object Storage, Not on the App Server

Quick thread 🧵
```
```
2/6  Where should you store user uploads?
```
```
3/6  In an S3-compatible object storage bucket, not on the app server's local disk.
```
```
4/6  On most managed platforms the app filesystem is ephemeral and isn't shared across instances, so files written to `./uploads` disappear on the next deploy or 404 behind a load balancer.
```
```
5/6  Keep the file bytes in a bucket, store only the object key and metadata in your database, and serve each file with a public URL or a short-lived presigned URL.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/store-user-uploads-in-object-storage/
#Kloudbean #AIapps #VibeCoding #DevOps #RAG #Database
```
