# Kloudbean Social Studio (local)

Generates **100+ social posts** for Kloudbean — a branded 1080×1080 graphic **and** the ready-to-paste caption for each — across the six ICPs (vibecoders, SaaS founders, agencies, freelance devs, WordPress/marketing, enterprise/gov KSA) plus feature/general posts. Grounded in Kloudbean's real capabilities; no invented figures. Visuals reuse the same scene system as `video-studio/`, so social + video look like one brand.

Each post gets its **own folder**, with the text alongside it:

```
output/
  gallery.html        ← dashboard: browse every post + one-click "Copy caption"
  INDEX.md · posts.json
  001-it-works-on-localhost-then-what/
    post.html         ← the 1080x1080 card (open in a browser)
    caption.txt       ← the post text + hashtags (copy-paste)
    post.png          ← rendered image (after `npm run render`)
  002-… (103 folders)
```

## Quick start

```bash
cd social-studio

node build.mjs           # generate all 100+ folders (post.html + caption.txt) — fast, no deps
npm run setup            # one-time: playwright + chromium (reuses video-studio's download)
npm run render           # screenshot every card -> post.png

open output/gallery.html # browse everything, copy any caption
```

## Generate more

```bash
node build.mjs --count 150     # 100+ curated, then on-brand posts composed to reach 150
npm run render                 # render the new ones (add --skip-existing to only do new)
```

- The gallery's header has a **Generate more** panel with the exact command.
- To add *curated* posts, edit `content.mjs` (each entry = headline, caption, hashtags, `scene`, `platform`, `icp`). Beyond the curated set, `extraPosts()` composes additional on-brand posts automatically.
- Shapes: `node build.mjs --shape portrait` (1080×1350) or `--shape wide` (1200×630) for link cards.

## What's in a post

- **headline** — the big text on the image (≤ ~7 words).
- **caption.txt** — the copy you paste into LinkedIn / X / Instagram, with a hashtag line.
- **scene** — the animated visual (deploy, database, security, scale, cdn, wordpress, …), reused from `../video-studio/scenes.mjs`.
- **platform / type / icp** — for filtering and planning (shown in the gallery).

## Making it part of the app (later)

`content.mjs` is plain data and `card.mjs`/`render.mjs` are a tiny HTML→PNG pipeline — the same shape as `video-studio`. To wire an in-app **Social** page with a live "Generate more" button: have a server function produce posts (curated + AI-generated, reusing this content shape), render cards with `buildPostHtml`, screenshot with a Playwright worker, and store the PNG + caption. The gallery here is the local stand-in for that dashboard.


---

## Per-blog social posts (automatic)

Every article in `content-studio/` gets its own ready-to-post social copy, generated
**automatically** from the article's own title, meta description, and short-version box
(so it invents no new claims and is safe to run unattended).

```bash
node social-studio/blog-social.mjs --all        # (re)generate for every article
node social-studio/blog-social.mjs --missing     # only articles without social copy (fast)
node social-studio/blog-social.mjs <slug>        # one article
```

Each article folder gets:

```
content-studio/<slug>/
  social.md     # copy-paste: an X/Twitter post, a LinkedIn post, and a short X thread
  social.json   # same content, machine-readable (for a scheduler / API)
```

An aggregate index is written to `social-studio/output/blog-social/blog-posts.json`.

**Automatic:** two Kiro hooks keep this in sync without anyone remembering to run it:
- `blog-social-on-create` (PostFileCreate on `content-studio/**.md`) generates copy the moment a new article file appears.
- `blog-social-on-stop` (Stop) runs the idempotent `--missing` pass at the end of each agent turn, so any new blog leaves the session already having its social copy.

**Posting:** the copy is generated, not auto-posted. To actually publish, paste from `social.md`,
feed `social.json` into a scheduler, or use the self-hosted Postiz app on Kloudbean. Wiring a live
X/LinkedIn API poster needs your own API credentials and is deliberately left as an opt-in step.
