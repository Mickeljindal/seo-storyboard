# Brief: fix-better-sqlite3-install-errors

## Keyword grounding (SEMrush gap export, 2026-07-23)

| Keyword | Vol | KD |
|---|---|---|
| **better-sqlite3** (primary) | **3,600** | **27** |
| better sqlite3 | 590 | 33 |
| npm better-sqlite3 | 170 | 40 |
| modulenotfounderror: no module named '_sqlite3' | 320 | 11 |
| sqlite wal | 170 | 48 |

Cluster 7,640 across 35 SQLite keywords; this article targets the native-module and build-failure subset.
Netlify's community forum and Fly's blog hold most of these, meaning the ranking pages are forum threads
and vendor posts rather than a proper guide.

**Note on the primary.** A bare package name is partly navigational and npm plus GitHub will always own
the top slots. The realistic win is the error-string long tail, so the title and H1 lead with
NODE_MODULE_VERSION and build errors while still carrying "better-sqlite3" for the head term. The KD 11
Python entry (`ModuleNotFoundError: No module named '_sqlite3'`) is the easiest ranking opportunity in
the cluster and gets its own H2.

**Secondary terms woven in:** node_module_version, was compiled against a different node.js version,
npm rebuild better-sqlite3, no prebuilt binaries found, node-gyp, prebuild-install, libc=musl, alpine
node native module, process.versions.modules, sqlite wal mode, sqlite_busy, busy_timeout, node:sqlite.

## Placement
Primary keyword in H1, title, meta description, first sentence of the lead, TL;DR, and three H2s
reference the error surface. FAQ opens on "What does NODE_MODULE_VERSION mean?" and covers the exact
verbatim error phrasing as its own question, which is how people search this.

## Cannibalisation check (this one was tight, and it changed the scope)
Two existing articles already fence parts of this ground:
- `add-managed-database-to-your-app` has an H2 "SQLite vs PostgreSQL vs MySQL: when to use each" and
  already argues the redeploy-wipes-your-data problem and the whole-file write lock. That article is also
  the playbook's named voice reference, so it must not be undercut.
- `fix-node-app-crashing-on-deploy` has an H2 "Node version and native modules" covering, at summary
  level, that compiled binaries need a clean install on the target platform.

Resolution: this article does NOT argue whether to use SQLite. It says so explicitly and links out for
that decision. Its scope is the native-module mechanics that neither existing article covers: the ABI
number mapping, prebuilt binary resolution across four dimensions, the difference between an ABI mismatch
and a build failure, musl, multi-stage builds, and the Python `_sqlite3` case. The WAL and backup section
is operational rather than a repeat of the choose-your-database argument, and is framed as "if you are
keeping SQLite, do these three things".

Verified before writing: no existing article mentions NODE_MODULE_VERSION, node-gyp, prebuild-install, or
WAL mode. The only prior hits were the two summary references above.

## Structure choice
Troubleshooting field guide, ordered by what the reader is holding: read the error, decode the numbers,
understand why a prebuild was missing, identify which of six situations applies, then fix in escalating
order. Deliberately not a tutorial and not a comparison.

## Verified facts (checked against the Node ABI registry, not memory)
The NODE_MODULE_VERSION table was verified against `doc/abi_version_registry.json` in the nodejs/node
repository rather than written from recall. Node 18 = 108, Node 20 = 115, Node 22 = 127, Node 23 = 131,
Node 24 = 137. An earlier draft had Node 24 wrong, which is exactly why the check happened. Older majors
are referred to without numbers and the reader is pointed at the registry.

Also grounded: the verbatim `prebuild-install warn install No prebuilt binaries found
(target= runtime= arch= libc= platform=)` shape, and the fact that Electron carries a separate ABI series.

## Original value competitors do not have
- **Reads the error as a diagnosis rather than a symptom.** It prints both numbers, so it tells you
  exactly which two Node versions are involved. "You are not looking for a bug, you are looking for where
  two Node versions got involved."
- **The ABI table**, verified, which turns two meaningless integers into "built for 18, running on 20".
- **Separates two failures that look alike**: an ABI mismatch means a wrong binary exists; a build failure
  means no binary exists and the fallback toolchain was missing. The second one surfaces as `gyp ERR!`
  about python3 and leads people to blame the package. Different fixes, so read which one you have.
- **Names all four dimensions of prebuild matching** (ABI, architecture, platform, C library) using the
  actual warning line, so the reader can see why their combination missed.
- **`which -a node` as a first-class diagnostic**, with the reason it matters: a version manager active in
  an interactive shell while a service or cron job starts with a different Node on its PATH. That is a
  large share of real reports and almost nobody writes it down.
- **A six-row situation table with a "tell" column**, including the two whose symptom is misleading:
  multi-stage builds (builds clean, crashes on start) and Electron (works with `node`, fails in the app).
- **Argues for pinning a RANGE not an exact patch**, with the reason: patches do not change the ABI, so
  pinning exactly means chasing security updates for no benefit. Pin the major.
- **States that the real fix is structural, not a command.** A pipeline that installs on the target cannot
  produce this error because only one Node and one platform are ever involved. That reframes the whole
  problem and it is honestly the most useful sentence in the piece.
- **Takes a position on Alpine**: for anything with native dependencies, prefer a glibc slim base over
  adding a toolchain to Alpine. "Saving a few dozen megabytes is rarely worth a build that fails on a
  Friday."
- **The Python `_sqlite3` case explained by root cause**: the extension is compiled when Python is built,
  so missing headers at that moment produce an interpreter that looks healthy and silently has no SQLite.
  Fix is headers first, then rebuild the interpreter, and reinstalling packages cannot help. That
  ordering is the part people get wrong.
- **Backups done correctly**, which is a real data-loss trap: `cp` on a live WAL database can produce a
  torn copy, so use `.backup` or `VACUUM INTO`.
- **Precise about WAL's limits**: it lets reads proceed during a write, it does not give concurrent
  writes, there is still one writer. Paired with `busy_timeout` to convert transient `SQLITE_BUSY`
  failures into slightly slower queries.
- **Notes the built-in `node:sqlite` in Node 22+** as experimental, not a drop-in, but with no native
  build step, which removes this entire class of problem. Current and genuinely useful.

## Docker discipline (facts constraint respected)
Docker build/run is on the do-not-assert list in kloudbean-facts.md. Docker appears here only as an
industry concept in the multi-stage and Alpine sections, describing what breaks in the reader's own
setup. No sentence claims Kloudbean builds or runs Dockerfiles, and the Kloudbean paragraphs describe
only the confirmed Git deploy that installs on the target.

## Facts check
Kloudbean claims used: managed PostgreSQL, MySQL, MariaDB, MongoDB, Redis, Elasticsearch as one-click
databases; automatic backups; private access; managed CI/CD from Git with live build logs; from $8/mo;
free migration assistance. All confirmed. No Docker claim, no invented build-tooling feature.

## Internal links (8, all verified to exist)
add-managed-database-to-your-app (x2), ci-cd-auto-deploy-from-github (x2),
fix-node-app-crashing-on-deploy (x2), fix-cannot-find-module-node, mysql-vs-postgresql,
environment-variables-done-right, database-migration-pg_dump-mysqldump, server-backups-guide
