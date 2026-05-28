# Self-hosting

## Local development (recommended — no Kloudbean DBS)

Everything runs on your Mac. Postgres is **local** (embedded, no Docker required).

```bash
npm install
npm run dev:local
```

Or step by step:

```bash
npm run db:up      # starts local Postgres (embedded)
npm run setup      # migrate + seed 59 articles
npm run dev
```

Open http://127.0.0.1:3000

Data is stored in `.local-postgres/` (gitignored).

---

## Kloudbean PostgreSQL (optional remote DB)

Follow the official guide: [Launching PostgreSQL on Kloudbean](https://support.kloudbean.com/docs/database-launch/launching-postgres)

### 1. Launch database

1. Kloudbean dashboard → **DBS** → **Launch Database**
2. Engine: **PostgreSQL** (16 recommended)
3. Note: **Database Name**, **Master User**, **Password**, **Server Location**
4. Wait 2–5 minutes for provisioning

### 2. Enable access (critical)

**Public access is disabled by default.** You must whitelist your IP:

1. DBS → click your database → **Access** tab
2. **Database Specifications** → whitelist your current public IP  
   (or your app server IP when deployed)
3. Do **not** enable public access unless absolutely necessary

See also: [Controlling Database Access](https://support.kloudbean.com/docs/database-launch/launching-postgres#enabling-database-access)

### 3. Copy credentials

From **Administration** page, copy into `.env`:

```bash
DATABASE_HOST=kloudbean-ap-west-18486.kloudbeansite.com   # Host
DATABASE_PORT=5432
DATABASE_NAME=kloudbean                                  # Database Name
DATABASE_USER=kloudbean                                  # Master User
DATABASE_PASSWORD=your_password                          # from panel
DATABASE_FALLBACK_HOST=194.195.x.x                       # optional: IP from panel
DATABASE_SSL=false                                       # no sslmode in URL by default
```

Connection format (per Kloudbean docs):

```
postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME
```

### 4. Setup & run

```bash
cp .env.example .env
# paste Kloudbean credentials

npm install
npm run setup    # migrate + seed 59 articles
npm run dev
```

## Other integrations

| Variable | Source |
|----------|--------|
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | [app.dataforseo.com/api-access](https://app.dataforseo.com/api-access) |
| `OPENAI_API_KEY` | OpenAI or OpenRouter |
| `WP_*` | WordPress Application Password |

## Troubleshooting

| Error | Fix |
|-------|-----|
| `ECONNREFUSED` / timeout | Whitelist IP in **DBS → Access** |
| `ENOTFOUND` | Use **Host** from Administration, or set `DATABASE_FALLBACK_HOST` to panel **IP** |
| `password authentication failed` | Use **Master User** + password from Administration (not Kloudbean login) |
| DataForSEO `fetch failed` | Restart `npm run dev` after `.env` changes; check API password from email |

## Stack

- TanStack Start (frontend + server functions)
- PostgreSQL + Drizzle ORM
- DataForSEO, OpenAI-compatible AI, WordPress REST
