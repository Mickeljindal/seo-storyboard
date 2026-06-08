# Kloudbean SEO Engine — WordPress Plugin

Custom WordPress plugin that gives the Kloudbean autonomous SEO engine **full control** over your WordPress site and AIOSEO.

## What it does

| Capability | Description |
|-----------|-------------|
| **Publish with full SEO** | Creates/updates posts with meta title, description, focus keyword, slug, excerpt — all wired to AIOSEO |
| **AIOSEO integration** | Directly writes to the `aioseo_posts` table: title, description, keyphrases, canonical, OG image, schema |
| **Featured image** | Downloads image from URL, uploads to media library, sets as post thumbnail with SEO-optimized alt text |
| **Category/tag automation** | Maps cluster names → WP categories (auto-creates), secondary keywords → tags |
| **Table of Contents** | Auto-generates a TOC block from H2/H3 headings, inserted after the first paragraph |
| **Internal link backfill** | When a new post publishes, finds existing posts mentioning the keyword and injects a link TO the new post (up to 3) |
| **Sitemap ping** | Pings Google and Bing sitemaps after every publish |
| **Scheduled publishing** | Accepts a `publish_date` for WordPress's built-in scheduled posts (`future` status) |
| **On-page SEO audit** | Returns a per-post checklist: keyword in title, in intro, meta length, H2 count, word count, images, links |
| **Bulk audit** | Audit the last N published posts in one call |

## Installation

1. Upload the `kloudbean-seo-engine` folder to `/wp-content/plugins/`
2. Activate the plugin in WordPress Admin → Plugins
3. Go to Settings → KB SEO Engine
4. Copy the auto-generated API key
5. Add to your engine's `.env`:
   ```
   WP_PLUGIN_API_KEY=<the key from step 4>
   WP_PLUGIN_URL=https://kloudbean.com/wp-json/kbseo/v1
   ```
6. Restart the engine

## REST API Endpoints

All under `/wp-json/kbseo/v1/`. Authentication via `X-KB-API-Key` header.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Connectivity check (no auth) |
| `/publish` | POST | Create/update post with full SEO |
| `/inject-links` | POST | Bulk inject internal links |
| `/audit/{id}` | GET | On-page audit for one post |
| `/audit-bulk` | GET | Audit last N posts |

## Publish payload

```json
{
  "title": "Deploy a Lovable App to Your Own Server",
  "content": "<p>Full HTML content...</p>",
  "slug": "deploy-lovable-app",
  "status": "publish",
  "publish_date": "2026-06-15T09:00:00Z",
  "meta_title": "Deploy Lovable App — Step-by-Step Guide",
  "meta_description": "How to deploy your Lovable-built app...",
  "focus_keyword": "deploy lovable app",
  "secondary_keywords": ["lovable hosting", "deploy ai app"],
  "canonical_url": "https://kloudbean.com/deploy-lovable-app",
  "featured_image_url": "https://images.example.com/hero.jpg",
  "og_image_url": "https://images.example.com/og.jpg",
  "category": "Deploy AI / Vibe-Coded Apps",
  "tags": ["Lovable", "deploy", "hosting"],
  "schema_jsonld": { "@type": "Article", ... },
  "toc": true,
  "reading_time": 8,
  "excerpt": "A quick guide to deploying..."
}
```

## Requirements

- WordPress 5.8+
- PHP 7.4+
- AIOSEO plugin installed (recommended but not required — falls back to post meta)
