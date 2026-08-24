# Structured Logging in Node.js: Stop Using console.log in Production

*By Kloudbean Engineering · At 2am you don't want to read logs. You want to search them.*

There's a moment every Node developer hits: something broke in production twenty minutes ago, you open the logs, and you're scrolling through thousands of lines of `console.log("here")` and half-formatted objects trying to piece together what one user's request actually did. You can't filter by severity. You can't follow a single request. That's the cost of unstructured logs. Structured logging fixes it by making every log line a machine-readable event you can query, and in Node it's about fifteen minutes of work.

> **What is structured logging in Node.js?**
> Structured logging means emitting logs as machine-readable JSON objects with consistent fields (level, timestamp, message, plus your own context) instead of free-form text. That makes logs searchable and filterable: you can query all errors, or every line belonging to one request ID. In Node, use a fast logger like Pino, write JSON to stdout, attach a request ID to every log, and redact secrets. Skip `console.log` in production.

## Why console.log fails in production

It's fine locally, where you're watching one request at a time. In production it falls apart for concrete reasons. There's no severity, so an error looks exactly like a debug note and you can't filter noise from emergencies. There's no structure, so you can't query "all failures for user 4821." Concurrent requests interleave, so a single user's story is shredded across unrelated lines. Objects get stringified inconsistently, sometimes as `[object Object]`. And `console.log` can behave synchronously depending on where its output goes, which means high-volume logging can actually block your event loop and slow down request handling. That last one surprises people, and it's a real performance argument, not a style preference.

## What a structured log looks like

Here's the difference in practice. Unstructured:

```
Payment failed for user 4821
```

Structured:

```json
{"level":"error","time":1754006400000,"reqId":"c3f1a2","userId":4821,"orderId":"ord_92","msg":"payment failed","err":"card_declined"}
```

The second one you can search. Filter by `level: error`, group by `err`, pull every line with that `reqId` to replay the whole request. Same information, but now a log aggregator (or plain `jq`) can answer questions instead of you reading prose.

## Setting up Pino

Pino is the standard choice in Node for a reason: it's fast, writes JSON by default, and stays out of the way. Install it and create a logger:

```js
// logger.js
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: ["req.headers.authorization", "password", "token", "*.secret"],
});
```

Then log events with context objects rather than concatenated strings:

```js
logger.info({ userId: user.id, plan: "pro" }, "subscription created");
logger.warn({ retries: 3, host: "smtp.example.com" }, "email retry limit reached");
logger.error({ err, orderId }, "payment failed");
```

Notice the shape: object first, message second. The object becomes queryable fields; the message stays human-readable. That's the whole discipline, and it pays off the first time you need to answer a question about production.

## Log levels, and picking one

Levels are how you separate signal from noise. Pino's ladder runs `trace`, `debug`, `info`, `warn`, `error`, `fatal`. Set the threshold with an environment variable so you can run `debug` locally and `info` in production without touching code. My rule of thumb: `info` for business events worth knowing about (a signup, an order), `warn` for something recovered but suspicious (a retry, a degraded dependency), `error` for a request that failed, and `fatal` for the app going down. Resist logging everything at `info`, that's how you end up back where you started with unsearchable noise, just in JSON.

## Request IDs: the feature that saves debugging

This is the single highest-value habit here. Give every incoming request a unique ID, put it on the logger for that request, and every line produced while handling it carries the same ID. Then one filter reconstructs the entire request:

```js
import { randomUUID } from "crypto";

app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] || randomUUID();
  req.log = logger.child({ reqId: req.id });   // child logger with context
  res.setHeader("x-request-id", req.id);
  next();
});

// Later, anywhere in the request
app.post("/orders", async (req, res) => {
  req.log.info({ items: req.body.items.length }, "creating order");
  // ...
});
```

The `child()` logger is the trick: it inherits config and permanently attaches `reqId` so you never pass it around manually. Honoring an incoming `x-request-id` header also lets you trace a request across services, which matters once you have more than one.

## Never log secrets

Logs get shipped, stored, and read by people, so treat them as a place secrets can leak. Two habits prevent almost all of it. Use your logger's `redact` option (shown above) to strip authorization headers, passwords, tokens, and API keys automatically. And never log a whole request or user object without thinking, `logger.info(req.body)` is how card details and passwords end up in a log aggregator forever. Log the fields you need, not the object you happen to have. This is one of those things that costs nothing up front and is genuinely painful to clean up later.

## Log to stdout, not to files

Write logs to stdout and let the platform handle the rest. Your app shouldn't own log rotation, disk space, or shipping, and writing to a local file on an ephemeral server means the logs disappear with the server. Process managers and platforms capture stdout, and that's the interface everything else understands. If you want pretty output locally, pipe it rather than changing what your app emits:

```bash
# Human-readable logs in development only
node app.js | npx pino-pretty
```

Keep production emitting raw JSON. Pretty-printing in production just makes the output harder to parse.

| | console.log | Structured (Pino) |
|---|---|---|
| Format | Free-form text | JSON with consistent fields |
| Severity levels | None | trace to fatal, filterable |
| Searchable | Text matching only | Query by any field |
| Trace one request | Manual guesswork | Filter by request ID |
| Secret redaction | Manual, easy to forget | Built-in redact config |
| Performance | Can block the event loop | Designed to be low-overhead |

## Reading logs on Kloudbean

Structured logs only pay off if you can get at them. On Kloudbean your Node app runs always-on under PM2 with its output captured, so writing JSON to stdout means your logs are there in the console when you need them, alongside live build logs from your GitHub deploys. Because the app is a persistent process rather than short-lived functions, a request ID actually follows a full request through one process, which makes tracing straightforward. Ship the JSON to an external aggregator later if you want dashboards; the point is your app's logging stays simple and portable either way.

## More on structured Logging in Node.js

Logging is one leg of production visibility. Pair it with [Node.js health checks](https://www.kloudbean.com/blog/nodejs-health-checks/) and [uptime monitoring](https://www.kloudbean.com/blog/uptime-monitoring/) so you know when to go looking, and keep `LOG_LEVEL` and friends tidy with [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/). When logs point at a crash, the [PM2 restart guide](https://www.kloudbean.com/blog/pm2-app-keeps-restarting/) and [deploy crash field guide](https://www.kloudbean.com/blog/fix-node-app-crashing-on-deploy/) take it from there.

## Logs you can search when it matters

Run always-on Node under PM2 with output captured in the console and live build logs on every GitHub deploy, so structured JSON logging is useful from day one. Flat pricing from $8/mo. Start at [kloudbean.com](https://www.kloudbean.com/).

Always-on under PM2 · Logs in the console · Live build logs · GitHub deploys · Flat from $8/mo

## FAQ

**Why shouldn't I use console.log in production?**
Because it produces unstructured text with no severity levels, so you can't filter or query it, concurrent requests interleave into an unreadable stream, and objects stringify inconsistently. It can also behave synchronously depending on the output destination, so heavy logging may block the event loop. A structured logger fixes all of that.

**What's the best logging library for Node.js?**
Pino is the common default: it emits JSON by default, is built for low overhead, and supports child loggers and redaction. Winston is another established option with more transport flexibility. Either is a big improvement over `console.log`; the important part is structured JSON output and consistent fields.

**How do I trace a single request through my logs?**
Assign every request a unique ID in middleware, create a child logger with that ID attached, and use it for all logging during the request. Then filter your logs by that ID to see the whole story in order. Honor an incoming `x-request-id` header so the same ID can follow a request across services.

**How do I keep secrets out of my logs?**
Use your logger's redaction config to automatically strip fields like authorization headers, passwords, tokens, and API keys. Beyond that, log specific fields rather than whole request or user objects, since `logger.info(req.body)` is the usual way credentials end up stored in a log system. Assume anything logged will be read by someone.

**Should I log to a file or stdout?**
Write to stdout and let the platform capture it. Your app shouldn't manage rotation or disk space, and files on an ephemeral server vanish with it. Process managers and hosting platforms collect stdout, and log shippers read from there, so stdout is the portable interface. Pretty-print locally by piping the output, not by changing what the app emits.

**What log level should I use in production?**
Usually `info`, with `warn` and `error` above it, and keep `debug` for local work. Set the threshold from an environment variable so you can change it without a code change. Be selective about what you log at `info`, logging everything there recreates the noise problem in JSON form.

*Kloudbean Engineering · Log events with fields, not sentences.*
