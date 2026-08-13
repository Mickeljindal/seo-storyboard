# Social posts: Production Database Design for AI Apps: The Schema a Real SaaS Needs

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/production-database-design-for-ai-apps/

## X / Twitter
```
A production AI app needs a handful of related tables: users, conversations, and messages for the chat spine; documents and doc_chunks (with a…

https://www.kloudbean.com/blog/production-database-design-for-ai-apps/
#Kloudbean #AIapps #VibeCoding #DevOps #PostgreSQL #Redis
```

## LinkedIn
```
A production AI app needs a handful of related tables: users, conversations, and messages for the chat spine; documents and doc_chunks (with a pgvector…

Design foreign keys with ON DELETE CASCADE and a soft-delete column from the start, so a delete-my-account request is one transaction, not manual surgery. Keep the durable record in Postgres and the fast, throwaway state in Redis.

Read the full guide: https://www.kloudbean.com/blog/production-database-design-for-ai-apps/

#Kloudbean #AIapps #VibeCoding #DevOps #PostgreSQL #Redis
```

## X thread
```
1/5  Production Database Design for AI Apps: The Schema a Real SaaS Needs

Quick thread 🧵
```
```
2/5  A production AI app needs a handful of related tables: users, conversations, and messages for the chat spine; documents and doc_chunks (with a pgvector column) for knowledge and search; usage_events and billing_records for metering and money; and an audit_log for accountability.
```
```
3/5  Design foreign keys with ON DELETE CASCADE and a soft-delete column from the start, so a delete-my-account request is one transaction, not manual surgery.
```
```
4/5  Keep the durable record in Postgres and the fast, throwaway state in Redis.
```
```
5/5  Full walkthrough:
https://www.kloudbean.com/blog/production-database-design-for-ai-apps/
#Kloudbean #AIapps #VibeCoding #DevOps #PostgreSQL #Redis
```
