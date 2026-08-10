# Brief: what-is-127-0-0-1-5000

## Target keyword and real search data

Source: `kloudgraph-semrush-export` competitor position exports plus the gap export, clustered by
`scripts/build-topic-queue.py`. Family `http-127`, priority score 66.9, **no nearest neighbour found**.

| Keyword | Volume | KD |
|---|---|---|
| running on http://127.0.0.1:5000 | 1,900 | 22 |
| http://127.0.0.1:5000 | 1,600 | 22 |
| http://127.0.0.1:5000. | 1,300 | 22 |
| http://127.0.0.1:18789/ | 1,000 | 20 |
| http://127.0.0.1:5000/ | 880 | 17 |
| http://127.0.0.1:8000/docs | 720 | 29 |
| http://127.0.0.1:5000' | 390 | 21 |
| curl http://127.0.0.1:8000/health | 320 | 23 |

**Family volume 8,110 across 8 keywords, KD 17 to 29.** Adjacent families in the same intent, each
its own queue entry, which the article should absorb rather than leave for thin separate pages:

| Adjacent keyword | Volume | KD |
|---|---|---|
| localhost/wordpress | 2,400 | 33 |
| localhost/index.php | 1,900 | 30 |
| redis://localhost:6379 | 880 | 26 |
| curl http://localhost:8000/health | 720 | 24 |
| http //localhost/wordpress/wp-admin | 720 | 25 |
| redis://localhost:6379/0 | 590 | 20 |
| mongodb://localhost:27017 | 1,300 | 28 |

Combined intent is roughly **17,000**. Per the operating system's rule on variant families, this is
one article organised by the underlying question, not ten pages each chasing a port number.

Primary: **running on http://127.0.0.1:5000**. Secondary: what is 127.0.0.1, localhost vs 0.0.0.0,
Flask default port, why can nobody else open my localhost, 127.0.0.1:8000/docs, port 5000 already in use.

The searcher's real question, which every one of those keywords shares: *I have this URL, it works for
me, and I do not know what it is or why nobody else can open it.*

## Cannibalisation check (mandatory, done against real H2 sets)

| Existing slug | What it owns | Verdict |
|---|---|---|
| `why-my-ai-app-works-locally-but-not-in-production` | Apps already deployed that behave differently once live | Reader here has deployed **nothing**. Different stage. Link forward. |
| `deploy-flask-app` | The how-to once you have decided to deploy | This is the page before that one. Hand off. |
| `how-to-deploy-any-app` | General deployment walkthrough | Same. Hand off. |
| `gunicorn-vs-uvicorn` | Choosing a production server | Referenced when explaining the dev-server warning. Link. |
| `fix-modulenotfounderror-python` | Import failures | Unrelated. |
| `flask-vs-django` | Framework choice | Unrelated. |

**Distinct intent in one line:** every neighbour assumes the reader intends to deploy and knows what
that means. This reader is looking at a loopback URL and does not yet know it is a loopback URL. The
page is an explainer plus a bridge, deliberately not a deployment tutorial, and it hands off to the
tutorials rather than repeating them.

## Information gain (the approval question)

1. **The central misunderstanding, named plainly:** 127.0.0.1 is the loopback address, so sending that
   link to a colleague sends them to *their own* machine. Every one of them gets a different result,
   or an error, and none of them reaches you. Most pages ranking for these terms never say this.
2. **A port-to-service table** that resolves the whole keyword cluster at once, covering 5000, 8000,
   3000, 5173, 8080 and the database ports behind `redis://localhost:6379` and
   `mongodb://localhost:27017`, so a reader who arrived with any one of those URLs is served.
3. **The macOS port 5000 collision.** AirPlay Receiver listens on 5000, so Flask's default port is
   occupied on a Mac out of the box. Verified: Apple's own developer forums confirm AirPlay's use of
   port 5000 and 7000, and the Flask documentation covers picking another port. This is a concrete,
   checkable gotcha rather than generic advice.
4. **The dev-server warning is load bearing.** Flask prints it for a reason, and the article explains
   what the development server actually lacks rather than repeating the instruction.
5. **An honest read on tunnels.** ngrok and friends genuinely solve sharing a demo and genuinely do
   not solve hosting, because your laptop is still the server. Saying so is more useful than either
   recommending or ignoring them.

Angles used: *open by ruling things out*, *the popular fix cannot work* (sending the link),
*volunteer the honest limit* (a tunnel is fine for a demo).

## Verified technical claims

- 127.0.0.1 is loopback; traffic never leaves the host. `localhost` is a hostname that resolves to it.
- `0.0.0.0` as a bind address means all interfaces, which is what makes a dev server reachable from
  another device on the network. Not a destination you browse to.
- macOS AirPlay Receiver occupies port 5000, confirmed via Apple developer forums discussion, with
  port 7000 also used. Setting location varies by macOS version, so the article describes the setting
  by name rather than pinning a menu path.
- Flask documentation covers the port-in-use case and the `--port` flag.
- `127.0.0.1:8000/docs` is FastAPI's generated interactive documentation, which is why that exact URL
  has its own search volume.
- Dev servers are for development: no process supervision, no TLS, single-process by default. Stated as
  the general property rather than asserting per-version threading behaviour.

## Product claims

Only from `kloudbean-facts.md`: Python runtimes including Flask, Django and FastAPI; Node runtimes;
managed databases across six engines; free SSL; managed CI/CD from a Git repository with live build
logs; runtime configuration in the UI; seven clouds; free migration assistance. No autoscaling claim,
since that is enterprise and custom only.

## Format

Explainer that answers the literal question first, then a reference table, then the bridge. Absorbs
the adjacent localhost families instead of spawning thin pages for each. CTA sits late, because the
reader needs to understand loopback before hosting means anything to them.
