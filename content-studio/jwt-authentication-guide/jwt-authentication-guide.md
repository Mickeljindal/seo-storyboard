# JWT Authentication: A Practical Guide for Node and Python

You built a login form. Now every request after it has to prove who the user is, and that is the job **JWT authentication** does. A JSON Web Token (JWT) is a signed token your server hands out at login and checks on each request that follows, with no session table to look up. If you are wiring auth into an Express, FastAPI, Django, or Flask app with jsonwebtoken or PyJWT, this guide covers the parts that actually bite: access token vs refresh token, HS256 vs RS256, where to store a JWT in the browser, and how to verify one without leaving a hole an attacker can walk through.

> **The short version:** A JWT is a signed token the server verifies on its own, without a session store. Use short-lived access tokens plus longer refresh tokens. Sign them with a strong secret kept in an environment variable, never in code. In a browser, prefer an HttpOnly cookie over localStorage. Always verify the signature and the expiry, pin the algorithm, and only ever send tokens over HTTPS.

## What a JWT actually is

A JSON Web Token is three base64url-encoded parts joined by dots: `header.payload.signature`. It looks like one long opaque string, but two of the three parts are just JSON that anyone can read. Decode it and you get something like this:

```
# header:    which algorithm signed this token
{ "alg": "HS256", "typ": "JWT" }

# payload:   the claims (who the user is, when it expires)
{ "sub": "user_8f21", "role": "member", "iat": 1712345678, "exp": 1712346578 }

# signature: HMAC-SHA256 over header + payload, using your secret
base64url( HMACSHA256(headerB64 + "." + payloadB64, JWT_SECRET) )
```

Encoded, those three parts become one token that travels in a header or a cookie:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzhmMjEiLCJyb2xlIjoibWVtYmVyIn0.J9Xr2m_kd7Q...signature
```

Two things trip people up here, so let me be blunt about both. The payload is **readable, not secret**. It is base64, not encryption. Anyone holding the token can decode the claims, so never put a password, an API key, or anything sensitive in there. And the signature is the **only** thing that makes the token trustworthy. If someone edits the payload to say `"role": "admin"`, the signature no longer matches, and a server that checks the signature rejects it. A server that skips the check gets owned. That is the whole security model in one line.

<!-- ADD IMAGE: A decoder view splitting one token into its three colored parts: header, payload, signature. A jwt.io style breakdown works well here. -->

## How JWT authentication works, end to end

The flow is short. The user logs in with a password once. The server checks it, then signs a JWT with a secret only the server knows and sends it back. From then on the client attaches that token to every request, either in an `Authorization: Bearer` header or an HttpOnly cookie. The server verifies the signature and the expiry on each request and either serves the response or returns a 401. No database hit to check who is calling.

**Diagram:** Login → server signs a JWT with the secret → client sends it on every request → server verifies signature and expiry → allow or deny. (Brand navy #000f27, purple #4F1AF3, green #40b75f.)

## Stateless auth: the appeal, and the tradeoff

The reason people reach for JWTs is statelessness. A signed token carries its own proof, so any server holding the secret can verify a request without a lookup. That scales cleanly across many app instances, and it means no shared session store to run. Nice.

Now the catch, because it matters more than the upside. A stateless token is hard to un-issue. Once you sign a JWT that is valid for an hour, it is valid for that hour, full stop. You cannot easily reach out and cancel it mid-flight, because the server was designed not to track it. So if a token leaks, or a user logs out, or you ban an account, the token keeps working until it expires. This single fact drives almost every real-world JWT decision. It is why access tokens are kept short-lived, why refresh tokens exist, and why "just make the token last a week" is a mistake we will come back to.

## Signing the token: HS256 vs RS256

The `alg` in the header is how the token gets signed. Two show up constantly, and the choice comes down to who needs to verify.

| | HS256 (symmetric) | RS256 (asymmetric) |
| --- | --- | --- |
| **How it signs** | One shared secret both signs and verifies | A private key signs, a public key verifies |
| **Who can verify** | Anyone with the secret (and anyone with it can also forge) | Anyone with the public key; only the private key can mint tokens |
| **Best when** | One backend signs and verifies its own tokens | Several services verify tokens they did not issue |
| **Key handling** | Keep the single secret in env, never ship it to clients | Private key in env; the public key can be shared freely |
| **Speed** | Faster | Slower to sign, fine in practice |

**Recommendation:** if a single backend issues and checks its own tokens, use HS256 with a strong secret. Reach for RS256 when multiple services (or an outside party) need to verify tokens without being able to create them. Publishing a public key is safe. Handing out an HS256 secret so another service can verify is the same as handing out the power to forge. The asymmetric split is the same idea behind [SSH key authentication](https://www.kloudbean.com/blog/ssh-key-authentication/): a private half that signs, a public half that anyone can check.

## Signing and verifying in Node (jsonwebtoken)

The `jsonwebtoken` package is the default in Node. Signing an access token at login is two arguments and an options object:

```js
import jwt from "jsonwebtoken";

// at login, after you have checked the password
const accessToken = jwt.sign(
  { sub: user.id, role: user.role },   // payload (no secrets in here)
  process.env.JWT_SECRET,              // signing key from env
  { expiresIn: "15m" }                 // short life on purpose
);
```

Verification is one call, wrapped in try/catch because an invalid or expired token throws. Pin the algorithm so nobody can downgrade you. Here it is as Express middleware that reads the token from an `Authorization` header or an HttpOnly cookie:

```js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : req.cookies?.token;              // or read it from the cookie

  if (!token) return res.status(401).json({ error: "no token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],           // never trust the token's own alg
    });
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}
```

Full setup for the runtime lives in [deploy an Express app](https://www.kloudbean.com/blog/deploy-express-app/) and the broader [deploy a Node app](https://www.kloudbean.com/blog/deploy-node-app-to-managed-cloud/) guide.

## Signing and verifying in Python (PyJWT)

PyJWT mirrors the same shape. Note the explicit `algorithms` list on decode, which is not optional if you care about security:

```python
import jwt, os
from datetime import datetime, timedelta, timezone

def make_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm="HS256")

def verify_token(token: str) -> dict:
    # raises ExpiredSignatureError / InvalidTokenError on failure
    return jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
```

As a FastAPI dependency, reading the token from an HttpOnly cookie:

```python
from fastapi import Depends, HTTPException, Request
import jwt

def current_user(request: Request):
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="no token")
    try:
        return verify_token(token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="invalid or expired token")
```

Django and Flask follow the same pattern with their own request objects. To put it live, see [deploy a FastAPI app](https://www.kloudbean.com/blog/deploy-fastapi-app/).

<!-- ADD IMAGE: Browser devtools, Application tab, showing the auth cookie with HttpOnly and Secure both checked. Proves the token is not reachable from JavaScript. -->

## Access token vs refresh token

Here is the pattern that squares "verify without a lookup" with "I still need to log people out." You issue two tokens at login. A short access token, maybe 15 minutes, that the app sends on every request. And a longer refresh token, maybe days, whose only job is to mint fresh access tokens when the old one expires.

The access token stays stateless and fast. The refresh token is where you keep control: store it server-side (hashed), tie it to the user, and you can revoke it whenever you want. If the access token leaks, it dies in minutes. If you need to kill a session for good, you drop the refresh token.

```js
import jwt from "jsonwebtoken";
import crypto from "crypto";

// at login: one short access token, one longer refresh token
const accessToken  = jwt.sign({ sub: user.id }, process.env.JWT_SECRET,
                              { expiresIn: "15m" });
const refreshToken = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET,
                              { expiresIn: "7d" });

// store only a HASH of the refresh token, so a DB leak is not game over
const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
await db.refreshTokens.save({ userId: user.id, tokenHash });
```

The refresh secret is a separate value from the access secret. Two keys, two jobs.

## Where should you store a JWT? Cookie vs localStorage

This is the question that starts the most arguments, and the honest answer is that most browser apps should use a cookie. Here is the tradeoff laid out:

| | HttpOnly cookie | localStorage | In memory |
| --- | --- | --- | --- |
| **Readable by JS** | No | Yes | Yes |
| **XSS can steal it** | No (out of reach) | Yes | Yes, while the tab is open |
| **Survives a refresh** | Yes, until expiry | Yes | No |
| **Sent automatically** | Yes, on every request | No, you attach it | No |
| **CSRF exposure** | Yes, use SameSite | No | No |
| **Verdict** | Recommended for browsers | Avoid for auth tokens | Fine for SPAs that re-auth on load |

Why the cookie wins: an **HttpOnly** cookie cannot be read by JavaScript at all, so a cross-site scripting bug cannot scoop up the token and mail it to an attacker. A token in localStorage is one `localStorage.getItem` away from any script that runs on your page, including a compromised npm dependency. Set the cookie with three flags and you have covered the common attacks:

```js
res.cookie("token", accessToken, {
  httpOnly: true,      // JavaScript cannot read it, so XSS cannot steal it
  secure: true,        // only sent over HTTPS
  sameSite: "strict",  // not sent on cross-site requests (CSRF defense)
  maxAge: 15 * 60 * 1000,
});
```

The tradeoff you take on with cookies is CSRF, which `SameSite` handles for most apps, backed by a CSRF token for sensitive actions. Pair this with real [security headers](https://www.kloudbean.com/blog/security-headers-guide/) so the XSS that would read a token never runs in the first place.

## The hard parts: expiry, revocation, and refresh rotation

Everything above is the easy 80 percent. The remaining 20 percent is where JWT projects go wrong.

- **Keep access tokens short.** Ten to fifteen minutes is a sane default. A short life is your main defense against a stolen token, because a leaked token that dies in minutes is a small problem.
- **Do refresh token rotation.** Every time a refresh token is used, issue a new one and invalidate the old. If an attacker steals a refresh token and uses it, the real user's next refresh fails, and you have a signal that something is wrong. Reuse of an already-rotated token means revoke the whole family.
- **Keep a denylist for the "right now" cases.** Logout, a password change, a banned account. Because you cannot un-sign an access token, keep a small server-side denylist (a Redis set works well) of revoked token IDs and check it on verify. Short access tokens keep this list tiny.
- **Never "just make it last a week."** A week-long access token with no refresh and no denylist means a leaked token is a week-long breach you cannot stop. That is trading a little convenience for a large, silent risk. Don't.

<!-- ADD IMAGE: A small sequence sketch of refresh rotation: old refresh token retired, new access and refresh tokens issued together. Show the reuse-detection branch too. -->

## Common JWT mistakes

Most JWT incidents are not exotic. They are the same handful of errors, over and over. Skip these and you have avoided the majority of them:

- **Secrets in the payload.** The payload is readable. Passwords, API keys, and card data do not belong in a JWT.
- **No expiry.** A token with no `exp` is valid forever. Always set one.
- **A weak or committed secret.** `secret123` is guessable, and a secret pushed to Git is already public. Generate a long random value and keep it in env.
- **Accepting `alg: none`.** The infamous one. Some libraries once honored a header that said "no signature." Always pass an explicit algorithms allowlist on verify.
- **Storing tokens in localStorage.** One XSS bug and every user's token walks out the door. Use an HttpOnly cookie.
- **Not actually verifying.** Decoding a token is not verifying it. If you read the claims without checking the signature, an attacker just edits the claims.
- **Using JWTs where a session would be simpler.** More on that next.

## JWT vs sessions: when not to use a JWT

Straight talk, because the internet oversells JWTs. If you are building one backend for one web app, a plain server-side session with a cookie is often the better tool. The session id lives in an HttpOnly cookie, the session data lives on the server, and logout is a single delete. Revocation, which is the hard part of JWTs, is trivial with sessions.

JWTs earn their keep when statelessness is a real requirement: multiple services that each need to verify identity, a mobile or third-party client, or an API where you do not want a shared session store. If you don't need stateless, a session cookie is simpler, so use it. Reaching for JWTs by default is how people end up building a denylist to bolt revocation back onto a system they chose specifically for not tracking state. Pick the tool that matches the job.

> **One more distinction.** Do not confuse your app's auth with the Kloudbean console's own login. The console uses HttpOnly cookie sessions and offers social login plus [User Access Control](https://www.kloudbean.com/blog/user-access-control-explained/) for your team's access to the platform. That is separate from the JWT auth you implement inside your application. Your app owns its own tokens.

## Run a JWT-authenticated app on Kloudbean

Kloudbean does not issue or manage tokens for you. It is not an auth-as-a-service product, and I would rather say that plainly than let you find out later. What it gives you is a clean place to run the app you wrote: a managed Node or Python runtime, a safe home for the signing secret, and free HTTPS so tokens never cross the wire in the clear. The auth code is yours; the platform runs it.

1. **Create the app on a managed runtime.** Add your Express, FastAPI, Django, or Flask app. The runtime, stack, and patching are handled, so you focus on the auth logic.

![The Kloudbean console adding an application on a managed Node or Python runtime](../assets/console/add-application.png)

2. **Put the signing secret in environment variables.** Open Runtime Configuration, then Environment Variables, and add your keys. They never touch the repo.

![The Kloudbean console Environment Variables screen holding the JWT signing secret, kept out of code](../assets/console/env-vars.png)

```bash
# Runtime Configuration -> Environment Variables (never in code)
JWT_SECRET=8f3c1a...at-least-32-random-bytes
JWT_REFRESH_SECRET=a-different-long-random-string

# generate a strong one:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#   openssl rand -hex 32
```

3. **Turn on free SSL.** JWT auth over plain HTTP is broken by design, because anyone on the path reads the token. Enable HTTPS so `secure: true` cookies work and tokens stay encrypted in transit.

![The Kloudbean console issuing a free SSL certificate so JWT authentication runs over HTTPS](../assets/console/ssl-certificate.png)

<!-- ADD IMAGE: Your app's login response setting the auth cookie, viewed in the network tab. Optional: shows the Set-Cookie header with HttpOnly and Secure. -->

Managed here means the server, stack, SSL, backups, and patching are handled, while your code and your data stay yours. It is Linux, and it deploys straight from GitHub, so shipping an auth fix is a push. Keeping secrets out of code is covered in more depth in [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

---

**Ship your auth on a runtime that gets out of the way.** Run your Node or Python app with env-var secrets, free SSL, and Git deploys, so your JWT code is the only auth you have to think about. Start free at [kloudbean.com](https://www.kloudbean.com/); see plans on [pricing](https://www.kloudbean.com/pricing/).

Managed Node & Python · Env-var secrets · Free SSL · Automatic backups · Free migration · Free trial

## FAQ

**What is a JWT?**
A JSON Web Token is a signed token made of three base64url parts, `header.payload.signature`. The payload carries claims like the user id and an expiry, and the signature lets a server confirm the token has not been tampered with. Because it is signed with a secret only the server knows, the server can trust a valid token without any database lookup.

**What is the difference between an access token and a refresh token?**
An access token is short-lived (often 15 minutes) and is sent on every request to prove who you are. A refresh token lives longer and does one thing: get a new access token when the old one expires. Keeping access tokens short limits the damage if one leaks, while the refresh token is stored server-side so you can revoke it.

**Where should I store a JWT, a cookie or localStorage?**
Prefer an HttpOnly cookie for browser apps. JavaScript cannot read an HttpOnly cookie, so a cross-site scripting bug cannot steal the token, whereas a token in localStorage is readable by any script on the page. Set the cookie with HttpOnly, Secure, and SameSite, and add a CSRF token for sensitive actions.

**HS256 vs RS256, which should I use?**
Use HS256 when a single backend both signs and verifies its own tokens; it uses one shared secret and is fast. Use RS256 when several services need to verify tokens without being able to create them, since it splits into a private signing key and a shareable public verification key. Publishing a public key is safe, but sharing an HS256 secret hands out the power to forge.

**How do I verify a JWT on the server?**
Call your library's verify function with the secret and an explicit algorithm list, for example `jwt.verify` in Node or `jwt.decode` with algorithms set in PyJWT. Verification checks the signature and the expiry and throws if either fails. Never just decode the claims without verifying, because decoding alone does not prove the token is genuine.

**How do I revoke a JWT or log a user out?**
You cannot un-sign an already issued access token, which is why they are kept short. For immediate revocation, keep a small server-side denylist of revoked token ids and check it on verify, and delete the user's refresh token so no new access tokens can be minted. Short access-token lifetimes keep the denylist small.

**How long should a JWT last?**
Keep access tokens short, roughly 10 to 15 minutes, and use a longer refresh token (hours to days) to get new ones. A long-lived access token with no refresh and no denylist means a leaked token is a breach you cannot stop until it expires. Short lifetimes plus rotation are the safer default.

**Is JWT authentication secure?**
Yes, when implemented carefully. Sign with a strong secret kept in env, always verify the signature and expiry, pin the algorithm to block alg none, serve only over HTTPS, and store the token in an HttpOnly cookie. Most JWT incidents come from skipped verification, weak or committed secrets, or tokens sitting in localStorage.

**JWT or session cookies, which is simpler?**
For a single backend serving one web app, a server-side session with a cookie is usually simpler, and logout is a single delete. JWTs shine when you need stateless verification across multiple services or clients. If you do not need statelessness, a session cookie is the lighter choice, so use it.

**Does Kloudbean handle JWT authentication for me?**
No. Kloudbean is not an auth-as-a-service provider; you implement JWT auth in your own app with a library like jsonwebtoken or PyJWT. What Kloudbean provides is the managed Node or Python runtime to run it, environment variables for the signing secret, and free SSL so tokens travel over HTTPS.

---

*By Kloudbean Security · Tokens, done carefully.*
