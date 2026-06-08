# Deploy SEO Engine on Kloudbean

## Prerequisites

- A Kloudbean server (Linode g6-standard-2 or higher, 4GB+ RAM recommended)
- Node.js app deployed via Kloudbean's console (Apps → Add Application → Node.js)
- Your `.env` configured with API keys

## Option A: Deploy via Kloudbean Console (Easiest)

### 1. Push to GitHub

```bash
git add -A
git commit -m "Full SEO engine ready for deploy"
git push origin main
```

### 2. Create the app on Kloudbean

1. Log into **console.kloudbean.com**
2. Go to your server → **Apps** → **Add Application**
3. Select **Node.js** as the stack
4. Connect your GitHub repo
5. Set the following:
   - **Build command:** `npm ci && npm run build`
   - **Start command:** `node dist/server/server.js`
   - **Node version:** 22
   - **Port:** 3000

### 3. Set environment variables

In the app settings on Kloudbean, add these environment variables:

```
DATABASE_MODE=pglite
DATABASE_PATH=.local/seo-pglite
PORT=3000

# Serper (keyword discovery)
SERPER_API_KEY=1e6212aeb392fdfdff547b5341fc22458980cfa5

# AI (content generation)
OPENAI_API_KEY=your-openai-or-openrouter-key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=openai/gpt-4o-mini

# WordPress plugin
WP_PLUGIN_URL=https://kloudbean.com/wp-json/kbseo/v1
WP_PLUGIN_API_KEY=from-wp-admin-settings

# Autopilot (set to 1 to enable fully autonomous mode)
AUTOPILOT_ENABLED=1
AUTOPILOT_MAX_PER_DAY=2
AUTOPILOT_MAX_PER_WEEK=7
AUTOPILOT_MIN_SCORE=85
AUTOPILOT_GEO=global

# RAG knowledge base
KLOUDBEAN_RAG_URL=https://vhbbmovxfuuqzfywysba.supabase.co/functions/v1/rag-chat

# Weekly digest (optional)
# DIGEST_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 4. Deploy

Click **Deploy** in the Kloudbean console. The build runs, then the app starts automatically.

### 5. Verify

Visit `https://your-app-domain.kloudbean.com/` — you should see the dashboard.

---

## Option B: Deploy via Git Auto-Deploy

If you've already connected GitHub to Kloudbean:

1. Push to main
2. Kloudbean auto-deploys on push
3. Done

---

## Option C: Deploy via Docker

If your server has Docker configured:

```bash
# On your local machine, build and push
docker build -t kloudbean-seo-engine .
docker tag kloudbean-seo-engine your-registry/kloudbean-seo-engine:latest
docker push your-registry/kloudbean-seo-engine:latest

# On your Kloudbean server
docker pull your-registry/kloudbean-seo-engine:latest
docker run -d \
  --name seo-engine \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  -v seo-data:/app/.local \
  your-registry/kloudbean-seo-engine:latest
```

---

## After deployment

### Install the WordPress plugin

1. Upload `wordpress-plugin/kloudbean-seo-engine/` to your WordPress:
   ```
   wp-content/plugins/kloudbean-seo-engine/
   ```
2. Activate in WP Admin → Plugins
3. Go to Settings → KB SEO Engine
4. Copy the API key → paste into your engine's `WP_PLUGIN_API_KEY` env var
5. Redeploy or restart the engine

### Verify the connection

Visit your engine URL → Settings page. You should see:
- ✅ Serper connected
- ✅ AI connected
- ✅ WordPress connected (if plugin is installed)

### Enable autopilot

Set `AUTOPILOT_ENABLED=1` in your environment variables and restart. The engine will begin its autonomous cycle immediately.

---

## Persistent data

The engine uses PGlite (a file-based PostgreSQL) stored in `.local/seo-pglite/`. On Kloudbean:
- This directory persists between deploys as long as you don't delete the app
- For Docker: mount a volume to `/app/.local`
- For extra safety: the data is your article database. Back it up periodically.

---

## Monitoring

- **Dashboard:** `https://your-engine/` — pipeline stats, published articles
- **Topical Map:** `https://your-engine/topical-map` — silo structure + learning
- **Engine logs:** check your app's stdout in the Kloudbean console
- **Weekly digest:** add `DIGEST_WEBHOOK_URL` for Slack/Discord notifications

---

## Recommended Kloudbean server size

| Articles | Server | Why |
|----------|--------|-----|
| < 100 | g6-standard-1 (2GB) | PGlite is lightweight |
| 100-500 | g6-standard-2 (4GB) | Content generation uses ~1-2GB RAM |
| 500+ | g6-standard-4 (8GB) | Parallel processing + larger DB |

The engine + autopilot typically uses ~500MB idle, spiking to 1-2GB during content generation cycles.
