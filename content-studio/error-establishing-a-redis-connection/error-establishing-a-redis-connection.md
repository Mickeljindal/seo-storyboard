# Error Establishing a Redis Connection: How to Diagnose and Fix It

*By Kloudbean Engineering · Six causes, one command that tells you which.*

If you are reading this you have probably just opened Settings then Redis in WordPress and seen "Error establishing a Redis connection" where you wanted "Connected". Most people meet this message through the Redis Object Cache plugin, though the same wording appears in other object-cache plugins and the underlying causes are identical for a Node or PHP app connecting to Redis directly. The message itself tells you nothing useful, so this guide starts with the one command that narrows it down, then works through the six real causes in order of likelihood.

> **How do I fix "Error establishing a Redis connection"?**
> Run `redis-cli ping` on the server first. If you do not get `PONG`, Redis is not running or not reachable, so start it or fix the host and port. If you do get `PONG`, the service is fine and the problem is in your configuration: a missing password, the wrong host or port in `wp-config.php`, a missing PHP redis extension, the wrong scheme for a socket connection, or a memory policy refusing writes. Check them in that order.

## Start here: is Redis actually answering?

This single test splits the problem in half, and it is worth doing before changing any configuration. On the server, run:

```bash
# Is Redis running and answering locally?
redis-cli ping
# expected: PONG

# If Redis is on another host or a non-default port
redis-cli -h 10.0.0.5 -p 6379 ping

# If Redis requires a password
redis-cli -h 10.0.0.5 -p 6379 -a 'your-password' ping
```

Three possible outcomes, and each points somewhere different. `PONG` means the service is healthy and your problem is configuration. `Connection refused` means nothing is listening there, so Redis is down or you have the wrong host or port. `NOAUTH Authentication required` means Redis is running perfectly and your credentials are missing, which is genuinely good news because it is a one-line fix.

## Cause 1: Redis is not running

The most common cause, especially after a server reboot or an update. Check and start it:

```bash
sudo systemctl status redis-server   # or: redis
sudo systemctl start redis-server
sudo systemctl enable redis-server   # so it survives a reboot
```

That last line matters more than people expect. A Redis that was started manually and never enabled will come back down at the next reboot, and the cache will silently fail until someone notices the page got slower.

Also worth ruling out: on some shared hosting plans Redis is simply not available. If `redis-cli` is not installed and you have no way to install it, the plugin cannot connect because there is nothing to connect to, and no amount of configuration will change that.

## Cause 2: wrong host or port

If `redis-cli ping` works on the server but the plugin still fails, compare what the plugin is told against where Redis actually listens. In WordPress that means the constants in `wp-config.php`, which must go above the line that requires `wp-settings.php`:

```php
define( 'WP_REDIS_HOST', '127.0.0.1' );
define( 'WP_REDIS_PORT', 6379 );
define( 'WP_REDIS_DATABASE', 0 );
define( 'WP_REDIS_TIMEOUT', 1 );
define( 'WP_REDIS_READ_TIMEOUT', 1 );
```

Confirm the port Redis is really bound to, and the address it accepts connections on:

```bash
ss -tlnp | grep redis
grep -E '^(bind|port|requirepass|maxmemory)' /etc/redis/redis.conf
```

A frequent trap after a migration: `wp-config.php` still names the old server's Redis host. The site loads, the cache quietly fails, and nobody connects the two until performance is investigated weeks later.

## Cause 3: a password Redis wants and the plugin does not send

If `redis-cli ping` returns `NOAUTH Authentication required`, Redis has `requirepass` set and your client is not authenticating. Add the password:

```php
define( 'WP_REDIS_PASSWORD', 'your-redis-password' );
```

For a managed Redis instance you will usually be given a full connection URL, in which case the scheme, host, port, and credentials all need to match what the provider issued. If the instance requires TLS, a plain connection will fail even with the right password, so check whether you need `rediss://` rather than `redis://`.

## Cause 4: the PHP redis extension is missing

This one confuses people because Redis is running, the credentials are right, and it still will not connect. The reason is that PHP needs a client library to speak the protocol at all. Check whether the extension is present:

```bash
php -m | grep redis
php -i | grep -i "redis"
```

If nothing comes back, install the phpredis extension for your PHP version and restart PHP-FPM. Some plugins can fall back to a pure-PHP client such as Predis, which works but is slower, so the extension is the better answer for a cache whose whole purpose is speed. And remember that upgrading PHP can leave the extension behind, which is why this failure sometimes appears immediately after a PHP version change rather than after a Redis change.

## Cause 5: socket versus TCP mismatch

Redis can accept connections over a TCP port or a Unix socket, and the two need different configuration. If your Redis is set up for a socket, pointing the plugin at a host and port will fail even though everything is running. For a socket connection:

```php
define( 'WP_REDIS_SCHEME', 'unix' );
define( 'WP_REDIS_PATH', '/var/run/redis/redis.sock' );
```

Confirm the socket path from your Redis configuration rather than guessing it, and confirm the web server user can actually read it. A socket with permissions that exclude the PHP process produces a connection failure that looks identical to Redis being down.

## Cause 6: memory full with the wrong eviction policy

The subtlest one, and it usually appears after weeks of normal operation rather than at setup. If Redis hits its `maxmemory` limit while `maxmemory-policy` is set to `noeviction`, it starts refusing writes instead of discarding old keys. Depending on the client, that surfaces as connection or write errors rather than a clear out-of-memory message.

```bash
redis-cli info memory | grep -E 'used_memory_human|maxmemory_human|maxmemory_policy'
redis-cli config get maxmemory-policy
```

For a cache, `noeviction` is the wrong choice. A cache should be allowed to forget things:

```bash
redis-cli config set maxmemory-policy allkeys-lru
# then persist it in redis.conf so it survives a restart
```

My honest opinion: if you are using Redis purely as an object cache, `allkeys-lru` should be the default you set on day one. Leaving it at `noeviction` turns a full cache into an application error, which is exactly backwards for something that is supposed to be optional.

| What you see | Cause | Fix |
|---|---|---|
| `redis-cli ping` fails, connection refused | Redis down or wrong host/port | Start and enable Redis, verify bind and port |
| `NOAUTH Authentication required` | Password not configured in the client | Set the password constant |
| PONG works, plugin still fails | Wrong host, port, or scheme in config | Match config to the real listener |
| Everything correct, still no connection | PHP redis extension missing | Install phpredis, restart PHP-FPM |
| Broke right after a PHP upgrade | Extension not carried over | Reinstall for the new PHP version |
| Worked for weeks, then failed | maxmemory reached, noeviction | Set `allkeys-lru` |
| Broke right after a migration | Old Redis host in config | Update to the new host |

## Verifying the fix

Do not trust the plugin's status page alone. Confirm that keys are actually being written:

```bash
# Watch key count while you load a few pages
redis-cli info keyspace

# Or confirm the object cache is doing something
redis-cli --stat
```

A connected plugin with an empty keyspace means something is still wrong, usually a database index mismatch or a drop-in file that was not installed. If you use WP-CLI, `wp redis status` gives you the plugin's own view, which is useful to compare against what `redis-cli` reports.

## If you are connecting from Node rather than WordPress

The causes are the same minus the PHP extension. A Node client failing to reach Redis usually surfaces as `ECONNREFUSED`, which is the same diagnosis path: confirm the service answers, then check the host, port, and credentials your app is actually using. Our [ECONNREFUSED guide](https://www.kloudbean.com/blog/fix-econnrefused-node/) covers that in detail, including the localhost trap where code works locally and fails in production because the database or cache is on a separate host. If you are using Redis as a queue backend, [background jobs with BullMQ](https://www.kloudbean.com/blog/nodejs-background-jobs-bullmq/) covers the connection settings that library expects.

## How managed Redis removes most of these

Looking at the six causes, four of them are operational rather than application problems: the service not running, not being enabled at boot, the wrong bind address, and a memory policy nobody set deliberately. Those disappear when the instance is managed. On Kloudbean you launch managed Redis in a few clicks, it sits in the same dashboard as your app, right next to it, and you get a connection string rather than a configuration puzzle. Because the cache runs in the same account as your app and is locked down with IP allow-listing, you are not exposing Redis to the public internet to make it reachable, which is a mistake we see people make while trying to fix this error.

What it does not fix, honestly: a wrong constant in `wp-config.php` is still a wrong constant, and a missing PHP extension is still a PHP matter. Managed Redis removes the service-level causes, not the configuration ones.

## Related reading

For the caching side, see [managed Redis hosting](https://www.kloudbean.com/blog/managed-redis-hosting/), [the Redis caching guide](https://www.kloudbean.com/blog/redis-caching-guide/), and [Redis caching patterns](https://www.kloudbean.com/blog/redis-caching-patterns/). To decide whether Redis is even the right tool, [when to use Redis vs Postgres](https://www.kloudbean.com/blog/when-to-use-redis-vs-postgres/) and [Redis vs Memcached](https://www.kloudbean.com/blog/redis-vs-memcached/). On the WordPress side, [how to clear WordPress cache](https://www.kloudbean.com/blog/how-to-clear-wordpress-cache/).

## Let the cache be someone else's uptime problem

Launch managed Redis in the same dashboard as your site or app, right next to it with a supplied connection string, locked to your app server's IP, backed up automatically, on a flat plan from $8/mo. Free migration assistance included. Start at [kloudbean.com](https://www.kloudbean.com/).

Managed Redis · Automatic backups · One dashboard · Flat from $8/mo

## FAQ

**What causes 'Error establishing a Redis connection'?**
Six things, in rough order of likelihood: Redis is not running, the host or port in your configuration is wrong, Redis requires a password your client is not sending, the PHP redis extension is missing, you have a socket versus TCP mismatch, or Redis has hit its memory limit with an eviction policy of `noeviction`. Running `redis-cli ping` first tells you which half of the list to look at.

**How do I test whether Redis is reachable?**
Run `redis-cli ping` on the server and expect `PONG`. Add `-h` and `-p` for a remote host or non-default port, and `-a` for a password. `Connection refused` means nothing is listening; `NOAUTH Authentication required` means Redis is healthy and only your credentials are missing.

**Why does Redis Object Cache say not connected when Redis is running?**
Usually a configuration mismatch or a missing client library. Check that `WP_REDIS_HOST`, `WP_REDIS_PORT`, and any password match where Redis actually listens, that the constants sit above the `wp-settings.php` require line in `wp-config.php`, and that `php -m | grep redis` shows the extension. A missing phpredis extension is the cause people overlook most.

**Why did Redis stop working after a PHP upgrade?**
Because the phpredis extension is compiled against a specific PHP version and is not always carried across an upgrade. Check with `php -m | grep redis`, reinstall the extension for the new version, and restart PHP-FPM. The timing is the giveaway: nothing changed about Redis, so look at PHP.

**Can a full Redis cause connection errors?**
Yes, indirectly. If Redis reaches `maxmemory` while `maxmemory-policy` is `noeviction`, it refuses writes rather than evicting old keys, and clients often report that as a connection or write failure. For a cache, set `allkeys-lru` so Redis discards the least recently used keys instead of erroring.

**Should Redis be exposed to the internet to fix this?**
No. Binding Redis to a public address to make it reachable is a common and dangerous shortcut, since Redis is designed to run on a trusted network. Keep it reachable only from your application, use a password, and if you genuinely need a remote connection use TLS. A managed instance locked to your app server's IP gives you this by default.

*Kloudbean Engineering · Ping first. It tells you which half of the problem you have.*
