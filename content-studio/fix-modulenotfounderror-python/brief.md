# Brief: fix-modulenotfounderror-python

## Keyword grounding (both sources: organic.Positions + gap export)

Combined family roughly **7,750 across ~27 keywords, KD 10-27**. The softest large cluster left in the
whole project. Every variant is a package-specific phrasing of the same error, and all of them are held
by competitor community forums (Render answers, Fly community, Railway station, Netlify answers) rather
than by a proper guide.

| Keyword | Vol | KD | Source / holder |
|---|---|---|---|
| **modulenotfounderror: no module named 'flask'** (primary) | **1,900** | **18** | render #9 |
| modulenotfounderror: no module named 'psycopg2' | 1,300 | 27 | railway |
| modulenotfounderror no module named yaml | 590 | 21 | fly community |
| modulenotfounderror: no module named 'httpx' | 590 | 15 | kinsta |
| modulenotfounderror: no module named '_ctypes' | 320 | 18 | fly community |
| modulenotfounderror: no module named '_sqlite3' | 320 | 11 | fly community |
| modulenotfounderror: no module named 'corsheaders' | 320 | 10 | netlify answers |
| modulenotfounderror no module named google | 260 | 19 | kinsta |
| modulenotfounderror: no module named 'qrcode' | 260 | 22 | fly community |
| modulenotfounderror: no module named 'app' | 260 | 12 | render #3 |

**Secondary terms woven in:** python -m pip, pip vs python -m pip, import name vs package name, PyYAML,
opencv-python, Pillow, psycopg2-binary, venv not activated, gunicorn systemd venv, PYTHONPATH,
sys.executable, requirements.txt missing package, libffi-dev, libsqlite3-dev, --chdir gunicorn.

## THE STRUCTURAL DECISION: one article, not ten
This is the direct application of a lesson recorded earlier in the project. When the package-specific
`Cannot find module` variants came up in Node, the note was: "If ever written, must be ONE combined
article, not four." Ten thin package-name articles here would cannibalise each other on a near-identical
query set and would each be a two-paragraph answer. So this is one article organised by ROOT CAUSE, with
the specific package names appearing as the evidence for each cause. That structure is also what makes it
better than the forum threads currently ranking, which each answer exactly one package.

## Placement
Primary keyword in H1 context, title, meta description, TL;DR, and the first FAQ. The specific
high-volume variants each appear verbatim inside the cause they belong to: 'flask' and 'app' under two
interpreters and working directory, 'yaml' / 'corsheaders' / 'google' in the import-name table, 'psycopg2'
under system libraries, '_ctypes' and '_sqlite3' under the underscore section.

## Cannibalisation check
Verified before writing: only single incidental mentions of virtualenv/psycopg2/ModuleNotFoundError
across the library (deploy-flask-app, deploy-golang-app, deploy-windsurf-app,
fix-better-sqlite3-install-errors). No article covers Python import resolution.

`fix-better-sqlite3-install-errors` already documents the `_sqlite3` build-time cause in depth, so this
article states the underscore rule and links there rather than re-explaining. `fix-cannot-find-module-node`
is the Node equivalent and is linked as such. The three deploy guides are handoffs.

## Original value competitors do not have
- **THE ORGANISING INSIGHT: the name in the quotes tells you which of five problems you have.** Every
  ranking page treats this as one problem with one fix. The routing table at the top sorts the reader in
  seconds and the five causes want genuinely different actions, which is why "just install it" fails so
  often.
- **THE IMPORT-NAME-IS-NOT-THE-PACKAGE-NAME TABLE**, which single-handedly explains several of the
  highest-volume variants (yaml, corsheaders, google) and is the thing nobody assembles in one place.
  Eleven rows including the ones that bite hardest.
- **The wrong-package-that-exists trap**: `pip install jwt` SUCCEEDS and installs something that is not
  PyJWT, so you now have a package installed, an import that still misbehaves, and no signal that you got
  the wrong library. That specific failure is worse than a clean error and nobody warns about it.
- **`importlib.metadata.packages_distributions()`** to ask the environment which distribution owns an
  import. Settles the question rather than consulting a list, and almost never mentioned.
- **`python -m pip` argued as a habit with the mechanism**: it runs pip as a module of the interpreter you
  just named, whereas bare `pip` is whichever appears first on PATH, which is a different question from
  which Python is running.
- **THE SERVICE-VS-SHELL EXPLANATION**, which is the real reason this bites on servers: systemd and
  supervisors do not run your shell profile, so nothing is ever activated and the process uses the system
  interpreter. Fix is pointing at the venv's own binary rather than activating and hoping. That is the
  single most useful paragraph for anyone whose deploy works by hand and fails as a service.
- **THE UNDERSCORE RULE**: a leading underscore means a C extension of the standard library, compiled when
  Python itself was built, so no pip package can fix it because the missing piece is not on the index. Plus
  the ordering people get wrong: headers first, THEN rebuild, because rebuilding without them reproduces
  the identical incomplete interpreter.
- **The split-requirements variant nobody documents**: something imported by application code but listed
  in `requirements-dev.txt` passes every local test and fails only in production, and the tell is that the
  missing package is a testing or tooling library.
- **Module shadowing** as a sibling cause: a local `json.py` or `email.py` wins over the standard library
  and breaks imports in ways that look impossible.
- **psycopg2 vs psycopg2-binary** resolved with a recommendation and the reason, rather than listing both.
- **The structural fix stated as retiring the bug class**: an automated build that creates the venv on the
  target from the committed requirements file cannot produce a works-locally-fails-remotely import error,
  because your laptop was never involved. Same move that worked in the better-sqlite3 article.

## Facts discipline
Kloudbean claims: Python applications including Flask, Django, and FastAPI as managed applications; Python
runtime configuration in the UI; Git integration building and deploying on every push with live build
logs; the 6 managed databases; 7 clouds with region choice; Shorewall and Fail2ban by default; free SSL;
automatic backups; from $8/mo; free migration assistance. All confirmed.

Ends on the confirmed managed boundary, with the dependency list explicitly named as the customer's to
keep accurate, which is the honest framing for an article about dependency mistakes. The managed-database
angle on psycopg2 is a real, non-forced product tie: a managed database means connecting rather than
compiling client libraries.

## Internal links (9, all verified)
fix-better-sqlite3-install-errors (x2), ci-cd-auto-deploy-from-github (x2), deploy-flask-app,
deploy-django-app, deploy-fastapi-app, flask-vs-django, fix-cannot-find-module-node,
fix-node-app-crashing-on-deploy, gunicorn-vs-uvicorn, environment-variables-done-right
