# Social posts: n plus one query problem

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/n-plus-one-query-problem/

## X / Twitter
```
> The N+1 query problem is when your code runs 1 query to load a list, then 1 more query for each row's related data.

https://www.kloudbean.com/blog/n-plus-one-query-problem/
#Kloudbean #CloudHosting #DevOps #WebDev
```

## LinkedIn
```
> The N+1 query problem is when your code runs 1 query to load a list, then 1 more query for each row's related data.

Fifty posts turns into 51 queries where 2 would do. The cause is lazy loading, where reading `post.author` quietly fires its own query. The fix is eager loading: tell the ORM to fetch the relation up front with Prisma `include`, Django `select_related` or `prefetch_related`, Rails `includes`, or Sequelize `include`.

Read the full guide: https://www.kloudbean.com/blog/n-plus-one-query-problem/

#Kloudbean #CloudHosting #DevOps #WebDev
```

## X thread
```
1/6  n plus one query problem

Quick thread 🧵
```
```
2/6  > The N+1 query problem is when your code runs 1 query to load a list, then 1 more query for each row's related data.
```
```
3/6  Fifty posts turns into 51 queries where 2 would do.
```
```
4/6  The cause is lazy loading, where reading `post.author` quietly fires its own query.
```
```
5/6  The fix is eager loading: tell the ORM to fetch the relation up front with Prisma `include`, Django `select_related` or `prefetch_related`, Rails `includes`, or Sequelize `include`.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/n-plus-one-query-problem/
#Kloudbean #CloudHosting #DevOps #WebDev
```
