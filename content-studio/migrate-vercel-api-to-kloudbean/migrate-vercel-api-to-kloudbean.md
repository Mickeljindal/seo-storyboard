# Move Your API Off Vercel: Migrating Serverless Functions to a Node Server

*By Kloudbean Engineering · You don't have to move the whole app. Just the part that hates being serverless.*

This migration is different from the others, because the right answer usually isn't "leave Vercel." Vercel is very good at hosting a Next.js frontend. What tends to hurt is running a real backend as serverless functions: duration ceilings on long work, no durable background workers, database connections multiplying under bursts, and a bill made of several meters you don't fully control. The clean fix most teams land on is a split. Frontend stays on Vercel, the API moves to a persistent Node server, and the two talk over HTTPS. Here's how to do that without breaking auth.

> **How do I move my API off Vercel?**
> Keep the frontend where it is and move the backend to a persistent Node server. Convert your Vercel route handlers into Express (or NestJS/Fastify) routes, host the API on its own subdomain like `api.example.com`, and update the frontend to call that base URL. Then handle the three things that actually break: CORS (allow your frontend's origin), cookies and auth across origins, and the database connection string. Migrate endpoint by endpoint rather than all at once, starting with the slowest ones.

## Decide what actually needs to move

Be selective. A short, stateless endpoint that reads a row and returns JSON is genuinely well served by a serverless function, and moving it buys you nothing. The endpoints worth moving are the ones fighting the model:

- **Long-running work**: report and PDF generation, AI calls, video or image processing, large exports, scraping, data migrations. Vercel's current limits are far more generous than the old 10-second days, but a hard ceiling still exists.
- **Background jobs**: anything you'd want to queue and retry. Functions are request-scoped, so durable workers need an external service.
- **WebSockets and real-time**: supported now with Fluid Compute, but bound by function limits and requiring external state for rooms and presence.
- **Database-heavy endpoints**: bursts of invocations can each open connections and exhaust your database's limit.
- **High-volume API traffic**: this is the cost one, and it's the trigger a founder at an API company described plainly, saying a per-request pricing model was never going to work long term for a product with heavy ingest, since they wanted to pay for CPU, bandwidth, and memory instead of request count.

If none of those describe your API, honestly, stay put. If two or more do, the split is worth doing.

## Converting a route handler to Express

The code change is smaller than people expect, because the logic inside your handler barely changes. What changes is the wrapper. A Vercel route handler:

```js
// app/api/orders/route.js (Vercel)
export async function POST(request) {
  const body = await request.json();
  const order = await createOrder(body);
  return Response.json({ id: order.id }, { status: 201 });
}
```

becomes an Express route:

```js
// routes/orders.js (persistent Node server)
router.post("/orders", async (req, res) => {
  const order = await createOrder(req.body);   // same business logic
  res.status(201).json({ id: order.id });
});
```

Your database code, validation, and third-party calls come across unchanged. The upside once you're on a persistent process: one connection pool shared by every request instead of a new connection per invocation, no duration ceiling on your own handlers, and you can start a real worker beside the API.

## The three things that actually break

Not the handlers. These:

**1. CORS.** Your frontend is now calling a different origin, so the browser enforces CORS. Allow your frontend's exact origin, driven from an environment variable so each environment lists its own:

```js
const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);

app.use(cors({
  origin: allowedOrigins,   // e.g. https://app.example.com
  credentials: true,        // needed if you send cookies
}));
```

You cannot combine a wildcard origin with credentials, so name the origins explicitly. The full set of traps is in [CORS errors in production](https://www.kloudbean.com/blog/fix-cors-error-node-production/).

**2. Cookies and auth across origins.** This is the one that quietly breaks logins. A cookie set by `api.example.com` won't be sent to a frontend on a different site unless it's configured for cross-site use, meaning `SameSite=None` and `Secure`, and the frontend must send credentials with its requests. The cleaner alternative is keeping both on the same parent domain (`app.example.com` and `api.example.com`) so cookies can be scoped to `.example.com`. If you use bearer tokens in an Authorization header instead of cookies, this problem mostly disappears.

**3. The database connection.** Point the new server at your database and, ideally, move the database next to it so the app talks over a private network rather than the public internet. Then set a sane pool size, since a persistent server holds a stable pool instead of the per-invocation connections that caused the exhaustion problem in the first place. See [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/).

## Migrate endpoint by endpoint

Do not attempt a big-bang switch. Point the frontend at a configurable API base URL, then move routes across in batches:

```bash
# Frontend env: flip this per environment as you migrate
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

Start with the endpoints that time out or run long, since those give the biggest immediate win and are the easiest to justify. Keep the rest on Vercel until you're ready. Someone who migrated a Vercel app off by feature took exactly this approach, moving the parts that struggled (a process running past 30 seconds, a library that didn't build well in the serverless environment) rather than the whole thing at once. Incremental means every step is verifiable and reversible.

## Moving the data

If your database is moving too, it's the same dump-and-restore as any migration. Create the managed database first, then:

```bash
pg_dump "postgres://user:pass@old-host/dbname" -Fc -f api.dump
pg_restore --no-owner -d "postgres://user:pass@new-host:5432/appdb" api.dump
psql "postgres://user:pass@new-host:5432/appdb" -c "SELECT count(*) FROM users;"
```

Take the final dump during a quiet window so writes made while you tested aren't lost, and keep the old database until you've verified. If your database stays where it is, just make sure the new server can reach it and that latency between the two is acceptable, region matters here.

## What you get from a persistent API

Concretely: no duration ceiling on your own request handling, so long jobs stop needing to be re-architected around a timeout. Real background workers, run beside the API under PM2 with managed Redis for a BullMQ queue. WebSockets on an actual long-lived process. A single stable connection pool instead of per-invocation connections. And a flat bill from $8/mo with no egress metering, so bot traffic or a heavy response payload doesn't turn into a surprise invoice. Everything (app, worker, database, Redis, object storage) sits in one dashboard.

The genuinely fair part, and worth repeating: keep your Next.js frontend on Vercel if you like it there. It's excellent at that job. This migration is about matching each workload to the right runtime, not about picking a single winner. We laid out the full set of constraints in [Vercel for Node.js backends](https://www.kloudbean.com/blog/vercel-for-node-backends-limits/).

## Related reading

Next steps and context: [a Vercel alternative for full-stack apps](https://www.kloudbean.com/blog/vercel-alternative-for-full-stack-apps/), [deploy an Express app](https://www.kloudbean.com/blog/deploy-express-app/) and [deploy a NestJS app](https://www.kloudbean.com/blog/deploy-nestjs-app/) for the API side, [background jobs with BullMQ](https://www.kloudbean.com/blog/nodejs-background-jobs-bullmq/) for the queue you couldn't run before, [scaling WebSockets](https://www.kloudbean.com/blog/scale-websockets-nodejs/) for real-time, and [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/) for the config split.

## Give your API a persistent home

Run an always-on Node API under PM2 with real background workers, managed PostgreSQL and Redis, and no egress metering, on a flat plan from $8/mo. Keep your frontend wherever you like. Free migration assistance included. Start at [kloudbean.com](https://www.kloudbean.com/), see plans on [pricing](https://www.kloudbean.com/pricing/).

No duration limits on your handlers · Real workers and WebSockets · Managed Postgres and Redis · No egress metering · Flat from $8/mo

## FAQ

**Should I move my whole app off Vercel or just the API?**
Usually just the API. Vercel is strong at hosting a Next.js frontend, and the friction is specific to backend workloads: long-running jobs, durable queues, WebSockets, and heavy database use. A common setup is frontend on Vercel, API on a persistent Node server, communicating over HTTPS. Move only what's fighting the serverless model.

**How hard is it to convert Vercel route handlers to Express?**
Easier than expected, because the business logic inside the handler doesn't change. You swap the request and response wrapper: reading `req.body` instead of awaiting `request.json()`, and calling `res.status().json()` instead of returning a `Response`. Database code, validation, and third-party calls come across as-is.

**What breaks when I split the frontend and API?**
Three things: CORS, since the frontend now calls a different origin and you must allow it explicitly; cookies and auth, because cross-site cookies need `SameSite=None` and `Secure` or a shared parent domain; and the database connection string. Handle those and the endpoints themselves generally just work.

**How do I keep my login working across two domains?**
The simplest approach is putting both on the same parent domain, like `app.example.com` and `api.example.com`, so cookies can be scoped to `.example.com`. Otherwise you need cross-site cookies with `SameSite=None` and `Secure`, plus credentialed requests from the frontend. Using bearer tokens in an Authorization header avoids most of the complication.

**Can I migrate gradually instead of all at once?**
Yes, and you should. Put the API base URL in an environment variable on the frontend, then move endpoints in batches, starting with the ones that time out or run long. Each batch is independently testable and reversible. One developer migrating off Vercel moved by feature, relocating the parts that struggled rather than the entire app.

**Will moving my API off Vercel save money?**
It depends on your traffic shape. Serverless billing combines invocations, active CPU, provisioned memory, and data transfer, which is hard to forecast for a high-volume API and exposed to bot traffic. A flat plan with no egress metering is more predictable, and predictability is often the real win. For a low-traffic API the difference may be small.

*Kloudbean Engineering · Right runtime for each workload, not one home for everything.*
