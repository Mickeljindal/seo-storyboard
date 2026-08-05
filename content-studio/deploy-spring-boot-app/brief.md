# Brief — How to Deploy a Spring Boot App to Production

Silo 2 (deployment fundamentals + frameworks). Framework spoke under the "deploy any app" pillar, sibling to `deploy-express-app`, `deploy-node-app-to-managed-cloud`, and `deploy-golang-app`.

**Primary keyword:** deploy Spring Boot app (builder/how-to query, clear commercial intent; medium volume, medium difficulty). Placed in the H1, `<title>`, meta description, first 100 words of the lead, and the H2 "Deploy a Spring Boot app on a managed server".

**Also targeting (head/near-primary):** Spring Boot production, Spring Boot hosting, deploy Spring Boot app to production. All appear in the lead and headings.

**Secondary / long-tail (woven through body + FAQ):**
- Spring Boot executable JAR / fat JAR / uber JAR
- java -jar in production
- application.properties vs environment variables
- Spring Boot server.port / SERVER_PORT
- Spring profiles / SPRING_PROFILES_ACTIVE=prod
- Spring Boot behind nginx / reverse proxy
- connect Spring Boot to PostgreSQL / MySQL
- SPRING_DATASOURCE_URL / relaxed binding
- JVM memory / -Xmx / OOM killed
- Spring Boot systemd / Restart=always
- Maven vs Gradle bootJar
- HikariCP connection pool
- UnsupportedClassVersionError (real error string people paste into Google)

Volumes are directional, grounded in the deploy-* cluster demand, not a fresh export. Re-pull from the SEMrush gap data (`/tmp/mined_topics.json`) or DataForSEO before any number is cited in copy. None are cited in the article.

**Intent:** how-to, commercial. A Java/Spring developer whose app runs locally and now needs it live: what to build, how to run the JAR, how config/port/memory/DB work in prod, and how a managed platform removes the wiring.

**Angle (distinct from siblings):** the Node/Express siblings own PORT/0.0.0.0/trust-proxy/PM2. This piece is Java-specific: the fat-JAR-with-embedded-Tomcat mental model (no separate app server), externalized config via relaxed-binding env vars + profiles, the JVM `-Xmx` OOM gotcha (unique to JVM deploys), systemd supervision, and HikariCP. "The honest Java deploy guide."

**Shape (non-template):** mental model + bespoke SVG first, then build -> run -> five production concerns as their own H2s (config, port/proxy, memory, keep-alive, database) -> managed-server deploy -> an anti-pattern "where it goes wrong" list with a founder line. No intro/why/step-1..6 skeleton.

**Founder POV / original value:** most failed Java deploys are config and memory, not code. The `-Xmx`-or-get-OOM-killed section (heap is not the whole process; leave headroom; container-awareness caveat) is the standout, plus the "secrets baked into application.properties" leak and the prod-profile-never-activated trap. Real error strings used: `UnsupportedClassVersionError`, `FATAL: too many connections`.

**SVG (bespoke, unique):** L/T-shaped pipeline. Build band: Git source -> mvn/gradle -> fat JAR drawn as a container with three inner layers (your code / embedded Tomcat / dependencies). Then `java -jar` into a JVM box with a `-Xmx` heap band, a reverse proxy `:443 TLS` sitting above forwarding to `:8080`, and a managed DB cylinder below inside a dashed "managed server / private net" box, linked by "JDBC · HikariCP pool". Brand navy #000f27, purple #4F1AF3, green #40b75f. Distinct from the Express two-band DEPLOY/SERVE figure and the DB article's User->App->DB->Backups row.

**Console screenshots (real):** `../assets/console/server-health.png` (JVM memory/CPU), `add-application.png` (app + runtime), `git-deployment.png` (build/start commands + live logs), `launch-database.png` (managed DB). Plus 4 author img-slots: mvn BUILD SUCCESS terminal, Spring startup banner log, env-vars panel filled with SPRING_ values, deployment history.

**Byline:** "By Kloudbean Engineering · One JAR, In Production." (Unique; not "Faster Than Ever".)

**Internal links (7, all folders verified to exist):**
`environment-variables-done-right` (config), `reverse-proxy-explained` + `nginx-reverse-proxy-for-node` (port/proxy, concept transfers), `pm2-vs-systemd` (keep-alive), `add-managed-database-to-your-app` (DB) + `database-connection-pooling` (Hikari/pool sizing), `ci-cd-auto-deploy-from-github` (build in CI). Absolute `https://www.kloudbean.com/blog/<slug>/`, descriptive anchors.

**Honesty guardrails (grounded in kloudbean-facts):** Java (JVM/enterprise workloads) is a supported managed runtime; managed CI/CD from Git with live build logs; env vars set in the console; managed PostgreSQL/MySQL (7 engines total); reverse proxy + free auto-renewing SSL in the stack; private networking/VPC; server health (CPU/RAM/disk); 7 clouds; from $8/mo, Enterprise custom; free migration + free trial approved. Process supervision framed generically ("supervised service"), NOT claiming Kloudbean uses systemd/PM2 specifically for Java. Autoscaling/k8s are enterprise-only and NOT mentioned as automatic for normal users. No invented metrics, no customer/geo counts, no Docker one-click, no SLA %. `-Xmx 512m` explicitly called illustrative. "Managed" = platform runs server/stack/SSL/backups/proxy/supervision; you own the app + data. Escaped code in `<pre>`; JSON-LD answers kept plain (no raw angle brackets or double quotes).

**Freshness:** references Java 11/17, Spring Boot fat JAR + embedded Tomcat, HikariCP default, systemd, Maven/Gradle wrappers, 2026. Re-check Java LTS version, HikariCP default status, and any console UI label changes on next review.
