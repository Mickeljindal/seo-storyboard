# Brief — Self-Host Supabase (tutorial format)

Cluster 2. Primary kw: self host supabase / supabase self hosted / self host supabase vs cloud (7-rival consensus). Intent: how-to/consideration.
FORMAT: Tutorial + honest-complexity (distinct from decision-guide/listicle/cost-breakdown already used). Opener = definition ("Supabase is a backend in a box"). Be HONEST that Supabase self-host is the most involved on the self-host list: it's a docker-compose stack (Postgres + Auth/GoTrue + PostgREST + Realtime + Storage + Kong gateway + Studio). Needs ~2GB+. Secrets matter a lot (POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY). Steps: server -> run the compose stack -> set the keys (env-vars screen) -> domain+SSL -> point your app's SUPABASE_URL/anon key at it. Honest: managed=server/stack/SSL/backups, you own the Supabase stack + data; the DB is the crown jewel — back it up.
Dashboard: env-vars.png (Supabase is key-heavy). Data note: rivals rank for supabase self-host.
When cloud is fine vs self-host wins (data ownership/residency/cost at scale).
Slug: self-host-supabase. Links: best-self-hosted-tools, add-managed-database, pricing. Distinct byline.
