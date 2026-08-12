# How to Connect SQLAlchemy to a Database in Production

By Kloudbean Engineering · Engines, sessions, migrations

SQLAlchemy powers a huge slice of Python's backend, from small Flask apps to FastAPI services under load. On your laptop it just works. Then you ship, and the gap between a tutorial and production shows up fast. This guide is how to connect SQLAlchemy to a database in production: the engine and connection URL, a pool sized on purpose, sessions that don't leak, and Alembic migrations instead of `create_all()`. Postgres and MySQL, with code for Flask-SQLAlchemy, FastAPI, and plain SQLAlchemy 2.0.

> **The short version**
>
> To connect SQLAlchemy to a database in production, build one `Engine` from `os.environ["DATABASE_URL"]` with `create_engine`, and set `pool_size`, `max_overflow`, `pool_pre_ping=True` and `pool_recycle` so your workers don't exhaust the database. Hand out short-lived `Session` objects from a `sessionmaker`. Don't call `create_all()` in production; run Alembic (`alembic upgrade head`) on deploy. Same wiring for Flask-SQLAlchemy, FastAPI, and plain SQLAlchemy 2.0.

## Why SQLAlchemy apps break the moment they leave localhost

The library is rarely the problem. Almost every SQLAlchemy incident traces back to the setup around it: the URL, the pool, the session lifecycle, the missing migration.

- **Hardcoded localhost.** The engine points at `localhost` with a password in the file, so in production you get `sqlalchemy.exc.OperationalError: could not connect to server: Connection refused`.
- **Leaked sessions exhaust the pool.** A request opens a session and never closes it, so under load the pool drains until you hit `QueuePool limit of size 5 overflow 10 reached, connection timed out, timeout 30.00`.
- **Stale connections after a restart.** The database gets patched, your pooled connections are dead, and the next query throws `server closed the connection unexpectedly`. That's what `pool_pre_ping` and `pool_recycle` prevent.
- **create_all() instead of migrations.** The app hits a missing table and throws a `ProgrammingError`, or you edit a model and the live schema silently drifts.
- **SSL required, plaintext sent.** A public managed Postgres refuses plaintext: `no pg_hba.conf entry for host ... no encryption`. You need `sslmode=require`, or an internal connection where the database isn't public.

## Connect SQLAlchemy to a database: the engine and the URL

The `Engine` is the heart of it. Create one per process at import time and keep it for the life of the app, because it owns the connection pool. Build a new one per request and you leak connections you never get back. Here's a production-shaped engine that reads its string from the environment:

```python
# db.py : one engine and one Session factory for the whole process
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(
    os.environ["DATABASE_URL"],
    pool_size=10,        # persistent connections kept open in the pool
    max_overflow=5,      # extra connections allowed under burst load
    pool_pre_ping=True,  # test a connection before use, drop dead ones
    pool_recycle=1800,   # recycle connections older than 30 minutes
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
```

The string says which database, which driver, and where. The shape is `dialect+driver://user:password@host:port/dbname`. Keep it in one environment variable:

```bash
# DATABASE_URL, set in Runtime Configuration, Environment Variables (never in code)

# Postgres, psycopg 3 driver:
postgresql+psycopg://appuser:s3cret@10.0.0.5:5432/appdb

# MySQL, PyMySQL driver:
mysql+pymysql://appuser:s3cret@10.0.0.5:3306/appdb
```

One gotcha bites constantly, especially Flask users on Heroku-style URLs. A string starting with `postgres://` (no "ql") is rejected on modern SQLAlchemy with `NoSuchModuleError: Can't load plugin: sqlalchemy.dialects:postgres`. The alias was removed in 1.4. Normalize the scheme before `create_engine`:

```python
url = os.environ["DATABASE_URL"]
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql+psycopg://", 1)

engine = create_engine(url, pool_pre_ping=True)
```

*(Diagram: two web workers under Gunicorn or Uvicorn, each holding its own SQLAlchemy engine with a QueuePool of up to fifteen connections, pool_size 10 plus max_overflow 5. Their lines converge, annotated 2 × 15 = 30, cross an internal-connection band, and land on one managed Postgres or MySQL tagged max_connections 100 with automatic backups. The lesson: workers × (pool_size + max_overflow) must stay under the database ceiling.)*

> **Coming from Django's ORM?** SQLAlchemy is more explicit on purpose: you build the engine, manage sessions, and run Alembic yourself. More wiring, more control, and it runs under any framework, not one.

## Size the connection pool: pool_size, max_overflow, and friends

This is where SQLAlchemy apps live or die under load. The engine keeps a pool of open connections and lends them to sessions. Five settings shape the behavior:

| Option | What it does | Sensible default |
| --- | --- | --- |
| `pool_size` | Connections the engine keeps open and ready in the pool | 5 to 10 |
| `max_overflow` | Extra connections allowed above pool_size during bursts | 5 to 10 |
| `pool_pre_ping` | Checks a connection before use, recycles dead ones | `True` in prod |
| `pool_recycle` | Recycles any connection older than N seconds | 1800 (under the DB idle timeout) |
| `pool_timeout` | Seconds a request waits for a free connection before erroring | 30 |

The ceiling that matters isn't in your app, it's in the database. Postgres defaults to 100 total connections. Your pool is per engine and you run one engine per worker, so the arithmetic is `workers × (pool_size + max_overflow)`. Two workers with `pool_size=10, max_overflow=5` is up to 30 connections; bump to six and you're at 90, one busy admin query from `sorry, too many clients already`. For thousands of short-lived connections, put a pooler like PgBouncer in front. Full mechanics in [database connection pooling](https://www.kloudbean.com/blog/database-connection-pooling/).

Two options fix the "worked yesterday, broken today" bugs. `pool_pre_ping=True` tests a connection on checkout, so one that died while idle gets swapped for a live one instead of failing the query. `pool_recycle=1800` retires connections older than 30 minutes, which keeps you under MySQL's `wait_timeout`. Set both in production.

## Sessions and scoped sessions (where the leaks hide)

The engine manages connections. The `Session` manages your work inside a transaction. The rule: a session is short-lived. Open one per request, use it, close it. Closing it returns the connection to the pool.

```python
# a session as a unit of work (SQLAlchemy 2.0)
from sqlalchemy import select
from db import SessionLocal
from models import User

with SessionLocal() as session:            # closes automatically at the end
    user = session.get(User, 1)            # fetch by primary key
    actives = session.scalars(
        select(User).where(User.active.is_(True))
    ).all()
    session.commit()
```

That `with` block is the trick: it closes the session no matter what, so the connection goes back. The classic bug is a session held across a slow call and never closed; under load that gives you `QueuePool limit ... reached`. Hunt for un-closed sessions before you touch `pool_size`. Usually it's a leak, not sizing.

Plain SQLAlchemy in a threaded server needs one session per thread, which is what `scoped_session` gives you. The catch: remove it when the request ends, or the connection never returns.

```python
# plain SQLAlchemy in a threaded server: one session per thread
from sqlalchemy.orm import scoped_session, sessionmaker

Session = scoped_session(sessionmaker(bind=engine))

# ... use Session() anywhere during the request ...

Session.remove()   # CRITICAL: hands the connection back to the pool
```

The frameworks do this for you: Flask-SQLAlchemy removes its scoped session after every request, and FastAPI does it with a dependency.

<!-- ADD IMAGE: Your editor open on db.py, the create_engine and sessionmaker calls visible. -->

## Declarative models, SQLAlchemy 2.0 style

A model maps a Python class to a table. SQLAlchemy 2.0 uses typed `Mapped` annotations with `mapped_column`, which reads cleanly and satisfies type checkers:

```python
# models.py
from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str | None] = mapped_column(default=None)
    active: Mapped[bool] = mapped_column(default=True)
```

Defining the class does not touch the live schema. Creating the table is a separate step: in production, a migration, not `create_all()`.

## Flask-SQLAlchemy and FastAPI: the same engine, wired two ways

The engine and pool ideas don't change between frameworks, only where the config lives. Flask-SQLAlchemy reads the URL from `SQLALCHEMY_DATABASE_URI` and takes engine settings through `SQLALCHEMY_ENGINE_OPTIONS`:

```python
# app.py  (Flask-SQLAlchemy)
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["DATABASE_URL"]
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_size": 10,
    "max_overflow": 5,
    "pool_pre_ping": True,
    "pool_recycle": 1800,
}

db = SQLAlchemy(app)   # db.session is a scoped session, removed each request
```

This is where the `postgres://` scheme error shows up most, so normalize the URL first. Walkthrough: [deploy a Flask app](https://www.kloudbean.com/blog/deploy-flask-app/). FastAPI has no built-in ORM, so you wire SQLAlchemy with a dependency that yields a session and always closes it:

```python
# main.py  (FastAPI)
from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session
from db import SessionLocal
from models import User

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db          # hand the session to the endpoint
    finally:
        db.close()        # always return it to the pool

@app.get("/users/{user_id}")
def read_user(user_id: int, db: Session = Depends(get_db)):
    return db.get(User, user_id)
```

That `finally: db.close()` is the FastAPI version of the `with` block. See [deploy a FastAPI app](https://www.kloudbean.com/blog/deploy-fastapi-app/).

## Run Alembic migrations, don't create_all() in production

SQLAlchemy has a tempting shortcut, `Base.metadata.create_all(engine)`. It reads your models and creates missing tables. Great for a test fixture, a trap in production:

```python
# fine for a quick prototype or a test fixture. WRONG for production:
Base.metadata.create_all(engine)   # creates missing tables, never alters, no history
```

The problem isn't that it's destructive, it's that it does too little. It never alters an existing table, so the day you add a column it does nothing and your schema drifts from the code. Alembic fixes that: versioned, reviewable migration files with an upgrade and a downgrade.

```bash
# one-time setup
alembic init alembic

# after changing your models, generate a migration from the diff
alembic revision --autogenerate -m "create users table"

# apply migrations. THIS is your deploy step, not create_all()
alembic upgrade head

# roll back the last migration if something is wrong
alembic downgrade -1
```

Point Alembic at the same URL and metadata your app uses:

```python
# alembic/env.py : reuse the app's URL and models
import os
from models import Base

config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
target_metadata = Base.metadata
```

Run `alembic upgrade head` on deploy, after the build and before the new version serves traffic. On Kloudbean's managed CI/CD it's a deploy step you watch in the live build logs. See [CI/CD auto-deploy from GitHub](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/).

<!-- ADD IMAGE: Terminal output of alembic upgrade head applying a pending revision. -->

## Postgres or MySQL: same SQLAlchemy, different driver

SQLAlchemy speaks both through a driver you pick in the URL. Install psycopg for Postgres, PyMySQL for MySQL. Your models, sessions, and Alembic commands don't change.

```bash
# Postgres:  pip install "psycopg[binary]"
postgresql+psycopg://appuser:s3cret@10.0.0.5:5432/appdb

# MySQL:     pip install pymysql
mysql+pymysql://appuser:s3cret@10.0.0.5:3306/appdb
```

SSL is the one place the URL grows. On a public Postgres endpoint that requires encryption, append `sslmode=require`, which libpq-based drivers read from the query string:

```bash
# public endpoint that requires SSL:
postgresql+psycopg://appuser:s3cret@db.example.com:5432/appdb?sslmode=require
```

My honest take: the cleanest way to handle database SSL is to not need it. Put the app and database in the same account, lock the database to your app server's IP so it has no public address, and nothing is exposed in transit. That's the common Kloudbean setup. Weighing the engines? See [MySQL vs PostgreSQL](https://www.kloudbean.com/blog/mysql-vs-postgresql/), plus [managed PostgreSQL hosting](https://www.kloudbean.com/blog/managed-postgresql-hosting/) and [managed MySQL hosting](https://www.kloudbean.com/blog/managed-mysql-hosting/).

## Deploy your SQLAlchemy app on Kloudbean, step by step

Everything above assumes a real database behind it: always on, backed up, patched, and locked to your app server's IP.

**Step 1. Launch a managed database.** Open DBS and launch PostgreSQL, MySQL, or MariaDB. It comes up provisioned, patched, and backed up, reachable from your app once you whitelist its IP.

*(Screenshot: DBS, Launch Database in the Kloudbean console. Pick PostgreSQL, MySQL, or MariaDB and it arrives provisioned, patched, and backed up.)*

**Step 2. Put the connection string in an environment variable.** Assemble host, port, database, user, and password into one `DATABASE_URL` under Runtime Configuration, Environment Variables, out of your code. More in [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/).

*(Screenshot: Runtime Configuration, Environment Variables in the Kloudbean console. DATABASE_URL lives here, out of the repo and easy to rotate.)*

**Step 3. Connect your Git repo and deploy on push.** Link the repository and Kloudbean builds and deploys on every push, with live build logs. Set the Python runtime and start command (Gunicorn or Uvicorn) in the UI.

*(Screenshot: the Git deployment screen. Connect a repo and each push builds and deploys, with live logs streaming the whole run.)*

**Step 4. Run migrations on deploy.** Add `alembic upgrade head` to the deploy step so the schema updates before the new code serves a request.

<!-- ADD IMAGE: The managed database connection details panel after launch: host, port, database, user. -->

**Step 5. Verify.** Hit an endpoint that reads from the database, or run `select(1)` through the engine at startup. A clean read means the URL, the network, and the pool all agree.

## SQLAlchemy vs Django ORM vs raw psycopg

Wondering if you picked the right tool? One honest line each:

| | SQLAlchemy | Django ORM | raw psycopg |
| --- | --- | --- | --- |
| **Ships with** | Standalone (any framework) | Django only | Just the driver |
| **Query style** | ORM + Core `select()` | QuerySets | You write SQL |
| **Migrations** | Alembic | Built-in `migrate` | Hand-written DDL |
| **Pooling** | QueuePool built in | Its own (CONN_MAX_AGE) | Manual / psycopg_pool |
| **Reach for it when** | Flask, FastAPI, or you want control | You're already on Django | Scripts, hot paths, raw SQL |

SQLAlchemy is framework-agnostic and gives you a full ORM plus a lower-level Core. Django's ORM is more batteries-included but tied to Django; raw psycopg is simplest when you just want SQL. All three connect to the same managed Postgres or MySQL, so the database choice is independent of the tool. On Django, stick with its ORM.

## A short security checklist

- **Read credentials from the environment.** Every snippet here uses `os.environ`.
- **Keep `.env` out of Git.** A string committed once lives in history forever.
- **Whitelist your app server's IP on the database.** When only your app server is allowed, most of the internet can't reach it.
- **Use a least-privilege database user.** Your app doesn't need superuser; grant what it uses.
- **Rotate passwords, and build so you can.** With the secret in an env var, rotating it is a config change.
- **Keep automatic backups on.** A managed database backs up on a schedule.

## Performance: pooling, indexes, and the N+1 trap

Once it connects cleanly, performance is three things. Pooling first: size `pool_size` and `max_overflow` to your worker count and keep `pool_pre_ping` on. Indexes next: add them on the columns you filter and join on, and run `EXPLAIN ANALYZE` on Postgres when a query feels slow.

Then the N+1 trap, the quiet SQLAlchemy killer. You load a list of users, touch each user's `posts`, and every access fires its own lazy query. Ten users, eleven queries. Fix it with eager loading:

```python
# N+1: one query for users, then one per user for their posts
users = session.scalars(select(User)).all()
for u in users:
    print(u.posts)          # a lazy query fires on every loop

# fixed: load posts up front in one extra batched query
from sqlalchemy.orm import selectinload
users = session.scalars(
    select(User).options(selectinload(User.posts))
).all()
```

If a list endpoint got slow right after you added a relationship, this is almost always why. Use `selectinload` for collections and `joinedload` for single related rows.

---

**Give your SQLAlchemy app a database that's ready for production.**

Launch managed PostgreSQL or MySQL, drop the connection string into one environment variable, size the pool, and run `alembic upgrade head` with IP allow-listing and automatic backups. Start free at [kloudbean.com](https://www.kloudbean.com/), and see plans from $8/mo on [pricing](https://www.kloudbean.com/pricing/).

One-click databases · Automatic backups · Env vars in the UI · Free migration · Free trial

## FAQ

**How do I connect SQLAlchemy to a database in production?**
Build one engine from a connection string kept in an environment variable, hand out short-lived sessions from a sessionmaker, and run Alembic migrations on deploy, with the database locked to your app server's IP.

**What is pool_pre_ping in SQLAlchemy?**
pool_pre_ping runs a cheap test on a pooled connection before use. If it died while idle, SQLAlchemy swaps in a live one instead of failing the query, which kills stale-connection errors after a restart.

**How do I fix the QueuePool limit reached error?**
QueuePool limit of size 5 overflow 10 reached means every pooled connection is checked out and none came free within pool_timeout. The usual cause is sessions that are never closed, so fix the leak before raising pool_size.

**Should I use create_all() in production?**
No. create_all creates missing tables but never alters them and keeps no history, so schema and models drift the moment you change a column. Fine for tests; in production use Alembic and run alembic upgrade head.

**What is the difference between Flask-SQLAlchemy and SQLAlchemy?**
SQLAlchemy is the toolkit and ORM. Flask-SQLAlchemy wires it into Flask, reading SQLALCHEMY_DATABASE_URI, taking engine settings from SQLALCHEMY_ENGINE_OPTIONS, and managing a per-request scoped session. Same SQLAlchemy underneath.

**How do I set the SQLAlchemy pool size?**
Pass pool_size and max_overflow to create_engine, or set them in SQLALCHEMY_ENGINE_OPTIONS with Flask-SQLAlchemy. The pool is per worker, so multiply workers by pool_size plus max_overflow and keep the total under the database limit.

**What is the SQLAlchemy connection string for PostgreSQL and MySQL?**
Use postgresql+psycopg://user:password@host:5432/dbname for Postgres and mysql+pymysql://user:password@host:3306/dbname for MySQL. The shape is dialect+driver://user:password@host:port/dbname, and it belongs in a DATABASE_URL variable.

**How do I connect SQLAlchemy to a database over SSL?**
For libpq-based Postgres drivers, append sslmode=require to the URL query string. MySQL takes SSL through connect_args passed to create_engine. When the database has no public endpoint and only your app server's IP can reach it, no SSL is needed.

**Why do I get Can't load plugin sqlalchemy.dialects postgres?**
Your URL starts with postgres:// but modern SQLAlchemy only accepts postgresql://; the short alias was removed in 1.4. Replace the scheme before you call create_engine.

**Do I still need Alembic if I have SQLAlchemy models?**
Yes, beyond a prototype. Models describe the schema but don't evolve the live database safely on their own. Alembic turns model changes into versioned, reviewable migrations with an upgrade and a downgrade.

Kloudbean · You bring the models and the migrations. We keep the database underneath them healthy.
