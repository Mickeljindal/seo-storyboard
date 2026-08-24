# ModuleNotFoundError in Python: The Name in the Quotes Tells You Which Problem You Have

*By Kloudbean Engineering · Same message, five unrelated causes.*

Everyone's first move on `ModuleNotFoundError` is to pip install the thing it named, and roughly half the time that is the wrong action. This one message covers at least five unrelated situations: the package is installed under a different name than you import, you have two Python interpreters and installed into the other one, it never made it into your requirements file, your Python itself was compiled without part of its standard library, or the missing module is your own code and the process is running from the wrong directory. The useful thing is that the name inside the quotes usually tells you which. Read it before you install anything.

> **How do I fix ModuleNotFoundError in Python?**
> First check whether the import name matches the package name, because many do not: `import yaml` comes from `PyYAML`, `import cv2` from `opencv-python`. Then confirm you installed into the interpreter that is running by using `python -m pip install` rather than bare `pip`. If the module name starts with an underscore, such as `_sqlite3` or `_ctypes`, no pip package will help, because your Python was built without that standard library extension. And if the missing module is your own code, it is a working directory or `PYTHONPATH` problem, not a package problem.

## Read the name, pick the branch

| What the name looks like | Likely cause | First move |
|---|---|---|
| A known library, but you installed something differently named | Import name is not the pip name | Check the mapping table below |
| `'flask'`, `'django'`, anything you know you installed | Two interpreters | `python -m pip list` |
| Works locally, fails on the server | Missing from requirements | Diff `pip freeze` against the file |
| Starts with an underscore: `_sqlite3`, `_ctypes` | Python built incomplete | Install headers, rebuild Python |
| `'app'`, `'config'`, your own module names | Working directory or path | Check where the process starts |

Those five want completely different actions, which is why a generic "just install it" answer fails so often.

## Cause one: the import name is not the package name

This is the most common genuinely confusing case, and it explains a whole family of these errors at once. What you `import` and what you `pip install` are separate namespaces, and plenty of well-known libraries differ.

| You import | You install |
|---|---|
| `yaml` | `PyYAML` |
| `cv2` | `opencv-python` |
| `PIL` | `Pillow` |
| `bs4` | `beautifulsoup4` |
| `sklearn` | `scikit-learn` |
| `dotenv` | `python-dotenv` |
| `jwt` | `PyJWT` |
| `dateutil` | `python-dateutil` |
| `corsheaders` | `django-cors-headers` |
| `google`, `googleapiclient` | `google-api-python-client` |
| `psycopg2` | `psycopg2-binary` (see cause four) |

The failure mode that wastes the most time here is installing something that exists and is wrong. `pip install jwt` succeeds, because a package called `jwt` does exist, and it is not the one whose documentation you were reading. So you now have a package installed, the import still fails or behaves oddly, and nothing suggests you got the wrong library.

Worth knowing the general shape rather than memorising a list: `Py` prefixes, `python-` prefixes, and framework prefixes such as `django-` and `flask-` are added to distribution names to avoid collisions on the index, while the module inside keeps the short name. When an import fails for a library you are sure exists, search the documentation for its install line rather than guessing.

You can also ask your environment which distribution provided a module, which settles the question in one command:

```
# Which installed distribution owns this import?
python -c "import importlib.metadata as m; print(m.packages_distributions()['yaml'])"
# ['PyYAML']
```

<!-- ADD IMAGE: your own terminal showing pip install of a wrongly guessed package succeeding while the import still fails. -->

## Cause two: you have two Pythons

The other big one, and it is almost always what is happening when the missing module is something you distinctly remember installing.

A machine typically has several interpreters: the system Python, one from a version manager, and one per virtual environment. `pip` belongs to exactly one of them. So `pip install flask` can succeed while the Python actually running your code has never heard of Flask.

```
# Which python and which pip are you using?
which -a python python3 pip pip3

# Which interpreter is running, definitively
python -c "import sys; print(sys.executable)"

# Which interpreter does this pip install into?
pip -V

# The fix that removes the ambiguity permanently
python -m pip install flask
```

`python -m pip` is the habit worth adopting. It runs pip as a module of the interpreter you just named, so the package cannot land somewhere else. Bare `pip` is whichever one appears first on your `PATH`, which is a different question from which Python you are running.

On a server this appears in a specific and confusing way. You activate a virtual environment, install everything, test by hand, and it works. Then your process manager starts the application and it fails immediately, because systemd or a supervisor does not run your shell profile and therefore never activated anything. The service is running the system interpreter.

```
# Don't rely on activation in a service. Name the interpreter.
/var/www/app/venv/bin/gunicorn --workers 3 "app:app"

# systemd equivalent
# ExecStart=/var/www/app/venv/bin/gunicorn --workers 3 app:app
```

Pointing at the venv's own binary is more reliable than activating and hoping, because that binary uses its own interpreter and its own site-packages regardless of environment. If a deploy works interactively and fails as a service, this is the first thing to check.

## Cause three: it is not in requirements.txt

The classic works-on-my-machine shape. During development you installed something to try it, it stayed in your virtual environment, and it never got recorded. Your machine has it, the server does not.

```
# What is actually installed here?
python -m pip freeze > /tmp/installed.txt

# What does the project claim to need?
diff <(sort requirements.txt) <(sort /tmp/installed.txt) | head
```

Two habits prevent it. Install through the file rather than around it, so adding a dependency means editing `requirements.txt` and reinstalling, and the record is the source of truth rather than an afterthought. And build in a clean environment, because a fresh install from the file is the only real test that the file is complete. A deploy pipeline that creates the environment from scratch on every run catches this before your users do, which is one of the quieter benefits of automating builds.

Watch for the split-requirements version of this too. If a project has `requirements.txt` and `requirements-dev.txt`, something imported by application code but listed as a dev dependency will pass every local test and fail in production. The tell is that the missing package is a testing or tooling library.

## Cause four: an underscore means your Python is incomplete

This one deserves its own section because the usual fix cannot possibly work, and the naming is the giveaway.

Modules whose names begin with an underscore, `_sqlite3`, `_ctypes`, `_ssl`, `_bz2`, are C extensions of the standard library. They are compiled when Python itself is built. If the development headers for the underlying system library were not present at that moment, Python builds successfully and silently omits that extension.

So you end up with an interpreter that looks completely healthy and is missing a piece of its own standard library. No pip package fixes it, because the missing part is not on the package index. It is part of Python.

```
# Install the headers first, then rebuild the interpreter
sudo apt-get install -y libsqlite3-dev libffi-dev libssl-dev libbz2-dev

# Then rebuild, for example with pyenv
pyenv install 3.12.4
```

The order matters and is the part people get wrong: headers first, then rebuild. Rebuilding without installing the headers reproduces exactly the same incomplete interpreter. This is common when Python is compiled from source or installed by a version manager on a minimal server, and it is why we cover the SQLite case in more depth in our guide to [native module build errors](https://www.kloudbean.com/blog/fix-better-sqlite3-install-errors/).

`psycopg2` is a close relative worth mentioning here. It is a real pip package, and it compiles against PostgreSQL client libraries, so installing it on a machine without `libpq-dev` and a compiler fails at build time rather than import time. The pragmatic answer for most deployments is `psycopg2-binary`, which ships prebuilt and needs no toolchain.

## Cause five: the missing module is your own code

When the name in the quotes is something like `'app'`, `'config'`, or one of your own packages, nothing is missing from your environment. Python simply cannot find your code from where it started.

Python resolves imports using `sys.path`, which includes the directory of the script being run. Start the process somewhere else and your own modules become invisible.

```
# What can Python actually see?
python -c "import sys; print('\n'.join(sys.path))"

# Where is this process running from?
pwd
```

The usual culprit on a server is a process manager with a different working directory from the one you tested in. Gunicorn resolving `app:app` needs to be started from the directory containing `app.py`, or told where that is.

```
# Be explicit rather than depending on where it happens to start
# systemd
# WorkingDirectory=/var/www/app
# ExecStart=/var/www/app/venv/bin/gunicorn --workers 3 app:app

# Or gunicorn's own option
gunicorn --chdir /var/www/app --workers 3 app:app
```

Two smaller variants in the same family. A module name that shadows a real library, a local `email.py` or `json.py`, breaks imports in ways that look impossible, because your file wins over the standard library. And a package directory without `__init__.py` behaves differently from what older tutorials assume, so if you are following an older guide and imports fail, check whether it expected that file.

## The order to work through

1. **Read the name.** Underscore prefix? Cause four. Your own module? Cause five. Otherwise continue.
2. **Check the import-to-package mapping.** Cheap, and it resolves a large share of cases.
3. **Confirm the interpreter.** `python -c "import sys; print(sys.executable)"` and `python -m pip list`. Not bare `pip`.
4. **Compare installed against declared.** `pip freeze` versus your requirements file.
5. **Only then install.** With `python -m pip install`, and add it to the requirements file in the same action.

Steps one to four cost under a minute together and they are the difference between fixing the cause and installing a package that was never the problem.

## Making it stop happening

The structural fix is the same one that retires most environment bugs: build the environment on the target, from the declared dependency list, every time.

```
# A deploy that cannot drift from your requirements file
python -m venv /var/www/app/venv
/var/www/app/venv/bin/python -m pip install --upgrade pip
/var/www/app/venv/bin/python -m pip install -r requirements.txt
```

An automated build that does exactly this on every push cannot produce a works-locally-fails-remotely import error, because the only environment that ever runs your code is one created from the file you committed. That is the real value of a pipeline here, and it is why this class of bug quietly disappears once deploys stop being manual. Our guide to [auto-deploy from Git](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/) covers that setup, and [why apps crash on deploy](https://www.kloudbean.com/blog/fix-node-app-crashing-on-deploy/) covers the wider environment-gap family.

Two smaller habits worth having. Pin versions rather than leaving them open, so a working environment stays working when an upstream release changes an import path. And keep the virtual environment out of version control, since it contains platform-specific binaries that will not transfer to your server.

## The operational half of moduleNotFoundError in Python

Most of this is Python environment discipline and no platform substitutes for it. Two parts genuinely are hosting: whether dependencies get installed on the machine that runs them, and whether the process starts with the right interpreter and working directory.

On Kloudbean, Python applications including Flask, Django, and FastAPI run as managed applications, with Python runtime configuration available in the UI rather than only in files, which is where the interpreter and start command stop being guesswork. The Git integration builds and deploys on every push with live build logs, so a failed dependency install is visible in the log rather than inferred from a crash. Managed PostgreSQL, MySQL, MariaDB, Redis, Elasticsearch, and MongoDB sit alongside the application, which is also the neatest answer to the `psycopg2` problem, since a managed database means you connect to it rather than compiling client libraries by hand.

Servers run across seven clouds with your choice of region, with a Shorewall firewall and Fail2ban configured by default, free SSL issued and renewed, and automatic backups. The honest boundary stays the same one: the server, stack, SSL, backups, and patching are handled, and your application code and its dependency list remain yours to keep accurate.

<!-- ADD IMAGE: the Git deployment screen with build commands and a live build log showing pip install running on the target. -->

## Nearby, and worth knowing

For the deployment guides themselves, [Flask](https://www.kloudbean.com/blog/deploy-flask-app/), [Django](https://www.kloudbean.com/blog/deploy-django-app/), and [FastAPI](https://www.kloudbean.com/blog/deploy-fastapi-app/). On choosing between them, [Flask versus Django](https://www.kloudbean.com/blog/flask-vs-django/). For the compiled-extension version of this problem, [native module build errors](https://www.kloudbean.com/blog/fix-better-sqlite3-install-errors/), and the Node equivalent in [Cannot find module](https://www.kloudbean.com/blog/fix-cannot-find-module-node/). When pip itself refuses to install at all, [the externally-managed-environment fix](https://www.kloudbean.com/blog/pip-externally-managed-environment/) is the one. On the process layer, [Gunicorn versus Uvicorn](https://www.kloudbean.com/blog/gunicorn-vs-uvicorn/). And on configuration and deploys, [environment variables done right](https://www.kloudbean.com/blog/environment-variables-done-right/) and [auto-deploy from GitHub](https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/).

## Build the environment where the code runs.

Managed Python hosting for Flask, Django, and FastAPI across seven clouds, with runtime config in the UI, Git deploys and live build logs, one-click managed databases, free SSL, and automatic backups. From $8/mo, with free migration assistance. Start at [kloudbean.com](https://www.kloudbean.com/).

Flask · Django · FastAPI · Live build logs · 6 managed databases · Flat from $8/mo

## FAQ

**How do I fix ModuleNotFoundError in Python?**

Identify which of five causes you have before installing anything. Check whether the import name differs from the package name, confirm you installed into the interpreter that is running by using `python -m pip`, compare installed packages against your requirements file, note that an underscore-prefixed name means your Python was built incomplete, and check the working directory if the missing module is your own code.

**Why does pip install not fix ModuleNotFoundError?**

Usually because it installed into a different interpreter than the one running your code, since `pip` belongs to one Python and your `PATH` decides which. Use `python -m pip install` so the package goes to the interpreter you named. It can also fail because you installed a differently named package, or because the missing module is part of the standard library rather than something on the package index.

**Why does No module named 'yaml' happen when PyYAML is installed?**

It does not, and that pairing is the point: the import name and the package name differ. `import yaml` is provided by the distribution `PyYAML`. If PyYAML really is installed in the running interpreter, the import works, so check `python -m pip list` in that specific interpreter rather than the one your shell reaches first.

**What does an underscore at the start of a module name mean?**

It is a C extension of the standard library, compiled when Python itself was built. Names like `_sqlite3`, `_ctypes`, and `_ssl` are missing because the development headers for the underlying system library were absent at build time, so Python built successfully without them. Install the headers, then rebuild the interpreter, in that order.

**Why does my app work locally but fail with ModuleNotFoundError on the server?**

Most often the package is installed on your machine and missing from `requirements.txt`, so the server never got it. The other frequent cause is that your service does not run your shell profile, so no virtual environment is activated and the process uses the system interpreter. Point your start command at the venv's own binary rather than relying on activation.

**Why can't Python find my own module, like 'app'?**

Because Python resolves imports relative to where the process started, so a process manager with a different working directory cannot see your code. Set the working directory explicitly, or pass `--chdir` to Gunicorn. Also check that no local file shadows a standard library name, since a file called `json.py` in your project wins over the real one.

**Should I use psycopg2 or psycopg2-binary?**

`psycopg2` compiles against PostgreSQL client libraries, so it needs `libpq-dev` and a compiler and fails at install time without them. `psycopg2-binary` ships prebuilt and needs no toolchain, which makes it the pragmatic choice for most deployments and avoids adding build tools to a production machine.

**How do I stop this happening on every deploy?**

Create the virtual environment on the target machine and install from `requirements.txt` as part of the deploy, so the only environment that runs your code is one built from the file you committed. Pin versions, keep the venv out of version control since it holds platform-specific binaries, and add dependencies by editing the requirements file rather than installing around it.

*Kloudbean Engineering · python -m pip, every time.*
