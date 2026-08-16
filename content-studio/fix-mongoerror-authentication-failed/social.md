# Social posts: MongoError: Authentication Failed? Check authSource Before the Password

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/fix-mongoerror-authentication-failed/

## X / Twitter
```
> Because MongoDB verifies a user against one authentication database, and `authSource` defaults to the database named in your connection string path.

https://www.kloudbean.com/blog/fix-mongoerror-authentication-failed/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> Because MongoDB verifies a user against one authentication database, and `authSource` defaults to the database named in your connection string path.

If you created the user in `admin` but connect to `/appdb`, Mongo looks in `appdb`, finds no such user, and reports authentication failed. Add `?authSource=admin`. Then check for special characters in the password that need percent-encoding.

Read the full guide: https://www.kloudbean.com/blog/fix-mongoerror-authentication-failed/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  MongoError: Authentication Failed? Check authSource Before the Password

Quick thread 🧵
```
```
2/6  > Because MongoDB verifies a user against one authentication database, and `authSource` defaults to the database named in your connection string path.
```
```
3/6  If you created the user in `admin` but connect to `/appdb`, Mongo looks in `appdb`, finds no such user, and reports authentication failed.
```
```
4/6  Add `?authSource=admin`.
```
```
5/6  Then check for special characters in the password that need percent-encoding.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/fix-mongoerror-authentication-failed/
#Kloudbean #CloudHosting #DevOps #WebDev
```
