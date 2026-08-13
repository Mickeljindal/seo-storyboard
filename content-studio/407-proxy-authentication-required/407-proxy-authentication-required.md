# HTTP Error 407 Proxy Authentication Required: The Proxy Wants Credentials

*By Kloudbean Engineering · The 407 is the middleman talking, not your server.*

<!-- ADD IMAGE: hero. A terminal showing a 407 Proxy Authentication Required response with a Proxy-Authenticate header, next to a 401 from the origin. -->

An HTTP error 407, or 407 Proxy Authentication Required, is the one status code where the thing refusing you is not your server at all. It's a proxy sitting between your client and the origin, and it wants credentials before it will pass your request along. That single fact clears up most of the confusion around a 407 error. The 401 you might expect comes from the origin server. The 407 comes from a middleman. So before you touch your app, work out which box in the chain is doing the asking, because the fix for error 407 lives somewhere completely different from the fix for a 401.

> **How do you fix an HTTP 407 error?**
> Give the proxy the credentials it's asking for. A 407 means a proxy between you and the site wants a username and password, answered in a `Proxy-Authorization` header, so the fix is to configure your client or environment with the proxy's credentials, not to change your app. Confirm it first with `curl -v` through the proxy: you'll see the 407 status and a `Proxy-Authenticate` header naming the scheme. For command-line tools, set `http_proxy` and `https_proxy` (or the npm, git, pip, and apt proxy settings) with credentials, and keep those credentials out of shell history and logs.

## HTTP error 407: is it the proxy or the server asking?

This is the whole game, so start here. A 407 is the proxy's version of a 401. Same handshake, one layer closer to you. When the origin server wants to know who you are, it sends a 401 with a `WWW-Authenticate` header, and you answer with `Authorization`. When a proxy in the middle wants to know who you are, it sends a 407 with a `Proxy-Authenticate` header, and you answer with `Proxy-Authorization`. Different header, different link in the chain, different place to put the fix.

| | 401 Unauthorized | 407 Proxy Authentication Required |
|---|---|---|
| Who is asking? | The origin server | A proxy between you and the origin |
| Challenge header | `WWW-Authenticate` | `Proxy-Authenticate` |
| You answer with | `Authorization` | `Proxy-Authorization` |
| Whose network, usually | The server's | The client's |
| Where the fix lives | Your app credentials or token | Your client or network proxy settings |

If you've read our note on [HTTP 401 Unauthorized](https://www.kloudbean.com/blog/http-error-401-unauthorized/), this will feel familiar, because the two codes are the same idea aimed at different boxes. The trap is treating a 407 like a 401 and going to fix your application's login. Your application never saw the request. The proxy stopped it at the door.

<!-- ADD IMAGE: diagram. Client -> forward proxy -> origin. The client-to-proxy hop carries the 407 and Proxy-Authenticate / Proxy-Authorization; the proxy-to-origin hop carries the 401 and WWW-Authenticate / Authorization. Brand colors navy, purple, green. -->

## Who actually gets a 407 error

A 407 is not a random event. It shows up in a handful of very specific situations, and recognising yours saves the guesswork.

**A client behind a corporate or forward proxy.** This is the big one. Your office, your VPN, or a locked-down cloud network routes all outbound traffic through a proxy that requires a login. Browsers usually handle this with a popup. Everything else, your scripts, your build agents, your package managers, does not, unless you tell it the credentials.

**A developer whose HTTP client was never told about the proxy.** `curl`, `npm`, `pip`, `apt`, and `git` all speak to the network directly. Behind an authenticating proxy they get a 407 and stop. The classic symptom is `npm install` hanging or failing the moment you're on the office network, and working fine from home.

**A scripted client that got the challenge and never answered.** A proxy replies 407 with `Proxy-Authenticate` to invite a second, authenticated attempt. A browser or a well-behaved library retries with `Proxy-Authorization`. A bare script that fires one request and reads the status just sees a 407 and gives up, because nothing in it knows how to answer the challenge.

**Occasionally, something in the path you didn't expect.** A transparent proxy at an ISP, an endpoint-security agent that installs a local filtering proxy, or a misconfigured reverse proxy that itself forwards to an upstream proxy needing auth. These are rarer, but they explain the 407 that appears with no corporate network in sight.

> **Works interactively, fails in cron or CI?**
> Proxy credentials living in your interactive shell don't travel to a cron job, a systemd service, or a CI runner. Those run with a clean environment. If a script pulls dependencies fine by hand and returns 407 when scheduled, the proxy variables simply aren't set in the job's environment. Export them inside the job, or put them in the service definition.

## The decisive test: curl through the proxy

Two commands settle where the 407 is coming from. First, go through the proxy in verbose mode and read the response headers. You want to see the 407 and the challenge:

```bash
# Through the proxy, verbose, so you can see the challenge
curl -v -x http://proxy.example.com:8080 https://api.example.com/ 2>&1 \
  | grep -iE '^< HTTP|proxy-authenticate'

# Expect something like:
# < HTTP/1.1 407 Proxy Authentication Required
# < Proxy-Authenticate: Basic realm="corp-proxy"
```

That `Proxy-Authenticate` line is the proof. It's the proxy identifying itself and naming the scheme it wants, usually `Basic`, sometimes `Digest`, `NTLM`, or `Negotiate` on Windows networks. If you see it, the 407 is the proxy, full stop.

Second, reach the same origin from a network with no proxy in front of it, or without the `-x` flag if you can, to confirm the site itself is healthy:

```bash
# Same site, no proxy in the path
curl -sI https://api.example.com/ | head -1

# HTTP/2 200  ->  the origin is fine, so the 407 is purely the proxy talking
```

A 200 direct and a 407 through the proxy localises the problem in one step. Nothing about the origin needs fixing. Read the headers, don't guess: the difference between the two responses tells you which layer to work on.

<!-- ADD IMAGE: terminal showing curl -v through a proxy returning 407 with the Proxy-Authenticate header highlighted. -->

## How to fix a 407 Proxy Authentication Required error

Once you know a proxy is asking, you answer it. The mechanism is the same everywhere: tell the tool the proxy address plus a username and password. The spelling differs per tool.

Most command-line tools read proxy settings from environment variables, so setting these once fixes a whole class of them at once:

```bash
# Point command-line tools at the proxy, with credentials
export http_proxy="http://USER:PASS@proxy.example.com:8080"
export https_proxy="http://USER:PASS@proxy.example.com:8080"

# Some tools only read the uppercase spellings, so set both
export HTTP_PROXY="$http_proxy" HTTPS_PROXY="$https_proxy"

# Keep internal hosts off the proxy
export no_proxy="localhost,127.0.0.1,.internal"
```

For `curl` specifically, you can pass the proxy inline, but prefer letting it prompt for the password so it never lands in your history:

```bash
# Let curl ask for the password instead of baking it into the command
curl -x http://proxy.example.com:8080 --proxy-user 'USER' https://api.example.com/
```

Package managers and git each keep their own config, and they don't all read the environment the same way:

```bash
# npm
npm config set proxy http://USER:PASS@proxy.example.com:8080
npm config set https-proxy http://USER:PASS@proxy.example.com:8080

# git
git config --global http.proxy http://USER:PASS@proxy.example.com:8080

# pip (or just rely on the https_proxy variable above)
pip install --proxy http://USER:PASS@proxy.example.com:8080 requests
```

For system package installs, apt keeps proxy settings in its own config file:

```
# /etc/apt/apt.conf.d/95proxy
Acquire::http::Proxy  "http://USER:PASS@proxy.example.com:8080";
Acquire::https::Proxy "http://USER:PASS@proxy.example.com:8080";
```

One honest warning before you paste any of that into a real terminal, because it matters.

## Fixes that cannot work (and why)

A 407 is a live authentication handshake, negotiated fresh on the connection. That rules out a lot of the usual reflexes.

**Clearing your browser cache does nothing.** The 407 isn't cached content, it's the proxy challenging this connection right now. Same for a hard refresh or clearing cookies. You can empty every cache you own and the proxy will still ask.

**Reinstalling the app or the package won't help.** If `npm install` returns 407, the package is irrelevant. The request never reached the registry. Running it ten more times just fails ten more times.

**Fixing your server is aiming at the wrong box.** This is the expensive mistake. You SSH into production, tail the logs, and find nothing, because your server never received the request. The proxy answered on its behalf. Time spent in your application here is time you won't get back.

Here's the opinion, stated plainly: a 407 in production almost always means a forward proxy inside the client's network, not a bug in your app. If you did not deliberately put an authenticating proxy in the path, the fix is on the client or network side. Look there first, every time.

<!-- ADD IMAGE: an operating-system network-proxy dialog, or a corporate proxy settings panel asking for a username and password. -->

## The anti-pattern: proxy credentials in a URL

Setting `https_proxy=http://user:pass@proxy:8080` is the fastest way to get a 407 to go away, and the fastest way to leak a password. That string does not stay put. It lands in your shell history file. It shows up in `ps aux`, where any user on the box can read the full command line. It gets printed verbatim in build logs and error traces. And `npm config set` writes it in plaintext to `~/.npmrc`, while git writes it to `~/.gitconfig`, both of which get committed by accident more often than anyone admits.

Treat proxy credentials like any other secret. A few safer habits:

- Let the tool prompt, as with `curl --proxy-user 'USER'` above, so the password is never on a command line.
- Use a `.netrc` file with `chmod 600` permissions rather than an inline URL.
- On Windows-style networks, an SSO proxy helper (for example an NTLM or Kerberos forwarder running locally) lets tools point at a local address with no password embedded at all.
- Never commit `.npmrc`, `.gitconfig`, or an `.env` that carries a proxy password.

## 407 versus 401, 403, 429, and 502

A 407 is easy to mix up with its neighbours, because several 4xx and 5xx codes all feel like "the request didn't work". They point at different layers, though, and the layer is the fix.

| Code | What it means | Who returned it | First move |
|---|---|---|---|
| 401 | You are not authenticated to the origin | The origin server | Fix your app credentials or token |
| 403 | Authenticated, still not allowed | The origin server | Check roles, scopes, permissions |
| **407** | **A proxy in the path needs credentials** | **A proxy between you and the origin** | **Give the proxy credentials** |
| 429 | Too many requests, slow down | Origin or proxy | Back off and honour `Retry-After` |
| 502 | A gateway could not get a valid answer upstream | A proxy or gateway | Check the upstream or origin |

The one worth internalising: 401 and 403 come from the destination, so you look at your credentials and permissions. See [403 Forbidden](https://www.kloudbean.com/blog/403-forbidden-error/) when you're authenticated but blocked, and [429 Too Many Requests](https://www.kloudbean.com/blog/429-too-many-requests/) when you're being rate limited. A 407 comes from a box in the middle. And a [502 Bad Gateway](https://www.kloudbean.com/blog/fix-502-bad-gateway-node-nginx/) is that same middle box telling you it couldn't get an answer from upstream, which is a different failure from it demanding a login. If your verb is being rejected rather than your identity, that's a [405 Method Not Allowed](https://www.kloudbean.com/blog/405-method-not-allowed/) instead.

## A quick symptom-to-cause map

| Symptom | Likely cause | First check |
|---|---|---|
| Direct request works, through the proxy it's 407 | Proxy wants auth, none was sent | The `Proxy-Authenticate` header |
| `npm`, `pip`, or `apt` fail only on the office network | Tool never told the proxy credentials | The tool's proxy config |
| Works by hand, 407 in cron or CI | Proxy variables absent in that environment | Export them in the job |
| Only some machines hit it | Those sit behind the authenticating proxy | Where the machine is on the network |
| A reverse proxy you run returns 407 | It forwards to an upstream proxy needing auth | Your `proxy_pass` chain |

## Where hosting fits, honestly

Most 407 errors have nothing to do with your host, and it's worth being straight about that. The proxy asking for a login usually lives in the client's network: an office, a VPN, a locked-down corporate laptop. No hosting provider can reach into that network and change it. If a 407 is stopping your users, the fix is on their side.

What a managed host controls is the other half: making sure the reverse proxy in front of *your* application is configured correctly, so a 407 is never coming from your side of the wire. On Kloudbean, the reverse proxy (nginx or Apache) is set up and kept patched for you, and your application and server logs sit in the same dashboard, so you can confirm your side answered with a normal response rather than a 407. If a reverse proxy config is the culprit, our guides on [nginx as a reverse proxy for Node](https://www.kloudbean.com/blog/nginx-reverse-proxy-for-node/) and [nginx versus Apache](https://www.kloudbean.com/blog/nginx-vs-apache/) cover the setup.

When you actually want to restrict who reaches an app, the honest tools are the ones that fit the job: IP Access Control with allow and deny rules by CIDR, and a Basic Auth gate in front of an app for staging or internal use. A Basic Auth gate returns a 401, not a 407, because it's the destination asking, not a forward proxy. That distinction is the whole article, and it's worth getting right when you set up access control too.

The boundary, once: managed covers the server, the stack, TLS, backups, and patching. Your application code, your client machines, and any corporate proxy in front of your users stay yours. A 407 is usually that client-network proxy, which no host controls. What managed hosting gives you is a correctly configured reverse proxy, plus baseline hardening with Shorewall and Fail2ban and free SSL, so the 407 is not coming from your side.

<!-- ADD IMAGE: Kloudbean console showing server and application logs in one place, confirming the reverse proxy answered rather than a 407. src -> ../assets/console/server-health.png -->

## Related reading

Its origin-side twin, [HTTP 401 Unauthorized](https://www.kloudbean.com/blog/http-error-401-unauthorized/), and the permission version, [403 Forbidden](https://www.kloudbean.com/blog/403-forbidden-error/). When the verb is the problem rather than your identity, [405 Method Not Allowed](https://www.kloudbean.com/blog/405-method-not-allowed/), and when you're rate limited, [429 Too Many Requests](https://www.kloudbean.com/blog/429-too-many-requests/). For the gateway that couldn't reach upstream, [502 Bad Gateway](https://www.kloudbean.com/blog/fix-502-bad-gateway-node-nginx/). On the proxy layer itself, [the nginx reverse proxy guide](https://www.kloudbean.com/blog/nginx-reverse-proxy-for-node/) and [nginx versus Apache](https://www.kloudbean.com/blog/nginx-vs-apache/).

## A reverse proxy that answers, not one that interrogates your users

Managed nginx or Apache kept patched, application and server logs in one dashboard so you can see exactly where a response came from, plus IP access control and a Basic Auth gate when you want to gate access on purpose. Free SSL and free migration assistance included. Standard plans from $8/mo, and you can check current pricing on the [pricing page](https://www.kloudbean.com/pricing/). Start at [kloudbean.com](https://www.kloudbean.com/).

Managed reverse proxy · App + server logs · IP access control · Basic auth gate · Free SSL · From $8/mo

## FAQ

**What does HTTP error 407 Proxy Authentication Required mean?**
It means a proxy sitting between your client and the destination wants credentials before it will forward your request. It is the proxy's version of a 401: the proxy sends a `Proxy-Authenticate` header, and your client is expected to answer with a `Proxy-Authorization` header. Your origin server never saw the request, so the fix is in your client or network, not your app.

**What is the difference between a 407 and a 401 error?**
A 401 comes from the origin server, which sends `WWW-Authenticate` and expects an `Authorization` header in reply. A 407 comes from a proxy in the middle, which sends `Proxy-Authenticate` and expects `Proxy-Authorization`. Same handshake, different box asking. That tells you whether to fix your application credentials or your proxy settings.

**How do I fix a 407 error in curl?**
Pass the proxy with `-x http://proxy:port` and supply the login. Prefer `--proxy-user 'USER'` and let curl prompt for the password so it never lands in your shell history. Confirm it worked by running `curl -v` and checking that the response is no longer a 407 with a `Proxy-Authenticate` header.

**How do I fix a 407 error in npm, pip, or apt?**
Each tool needs the proxy and credentials. For npm, set the `proxy` and `https-proxy` config values. For pip, use the `--proxy` flag or the `https_proxy` environment variable. For apt, add `Acquire` proxy lines in a file under `/etc/apt/apt.conf.d/`. Setting the `http_proxy` and `https_proxy` environment variables often covers several tools at once.

**Is a 407 error a problem with my server or my network?**
Almost always your network. A 407 is raised by a proxy between you and the site, which usually lives in a corporate network, a VPN, or a locked-down laptop. If you did not put an authenticating proxy in front of your own application, the problem is on the client side, and no change to your server will resolve it.

**Why does clearing my browser cache not fix a 407?**
Because a 407 is a live authentication handshake on the connection, not cached content. The proxy is challenging this request right now, so emptying the cache, clearing cookies, or hard-refreshing changes nothing. The only thing that satisfies a 407 is sending valid proxy credentials.

**How do I send proxy credentials without leaking them?**
Avoid putting the password in a URL like `http://user:pass@proxy:port`, because that string ends up in shell history, process listings, and logs. Let the tool prompt for the password, use a `.netrc` file locked to your user, or run a local SSO proxy helper so no password is embedded. Never commit config files that contain proxy credentials.

**Can a reverse proxy or a website return a 407?**
A public website normally returns 401 for authentication, not 407, because it is the origin rather than a forward proxy. You can see a 407 from your own infrastructure if a reverse proxy you run forwards to an upstream proxy that requires a login. In that case, the fix is the upstream proxy configuration in your own stack.

**What is the difference between a 407 and a 502 error?**
A 407 means a proxy wants credentials before it will forward your request. A 502 means a gateway or proxy accepted your request but could not get a valid response from the server upstream. One is an authentication problem at the proxy, the other is a connectivity or health problem behind it, so they point at completely different fixes.

*Kloudbean Engineering · A 401 is the destination asking. A 407 is the doorway asking.*
