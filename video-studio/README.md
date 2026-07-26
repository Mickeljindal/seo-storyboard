# Kloudbean Video Studio (local)

Generates **34 explainer videos** for Kloudbean — animated in HTML, exported to MP4 with ffmpeg — each targeting a specific ICP and grounded in Kloudbean's real capabilities (Linux managed cloud, the runtimes/frameworks/databases it actually runs). No invented figures.

Every video gets its **own folder** with the script and the storyboard:

```
output/
  INDEX.md                      ← table of all videos
  index.json                    ← machine-readable manifest
  01-deploy-lovable-app/
    script.md                   ← production script: beats, voiceover, CTA
    storyboard.html             ← self-contained animated storyboard (open in a browser)
    video.mp4                   ← rendered video (after render-all)
  02-deploy-bolt-new-app/
  … 34 folders …
```

## Quick start

```bash
cd video-studio

# 1. Generate all 34 folders (script.md + storyboard.html). Fast, no deps.
node build.mjs

# 2. One-time: install the headless browser used for frame capture.
npm run setup            # = npm install && npx playwright install chromium

# 3. Render MP4s (needs ffmpeg on PATH — you already have it).
npm run render-all                 # all 34
node render-all.mjs --only 01,08   # just a few (by number)
node render-all.mjs --fps 24       # faster / smaller
node export.mjs 27-what-is-managed-cloud-hosting   # a single one
```

Prefer to just **watch** without rendering? Open any `output/*/storyboard.html` in a browser — it autoplays the animation full-screen. The MP4 is the same thing, frame-captured.

## How the HTML → MP4 export works

1. `storyboard.html` exposes `window.__videoMeta` (`{durationMs, fps, width, height}`) and `window.__seek(ms)`.
2. `export.mjs` loads it in headless Chromium with `?export=1`, then for each frame calls `__seek(ms)` — which positions the timeline **and** freezes the decorative CSS animations at a fixed phase, so frame N is identical every capture — and screenshots to `frames/fNNNNN.png`.
3. `ffmpeg` stitches the PNGs into an H.264 MP4 (`-crf 20`, `+faststart`).

Default output is **1920×1080 (16:9)**. Set `aspect: "9:16"` (or `"1:1"`) on a video in `ideas.mjs` for shorts/reels.

## Add or edit videos

Everything lives in `ideas.mjs`. A video is:

```js
V({
  slug: "my-idea",
  icp: "saas_founder",              // vibecoder | saas_founder | ai_agency | freelance_dev | wp_agency | enterprise_gov | general
  title: "…",
  hook: "…",
  beats: [
    { dur: 4, on_screen: "Big headline", narration: "Voiceover line.", scene: "deploy" },
    // scenes: deploy network speed database security cost compare cdn scale code cloud ai wordpress generic
  ],
})
```

Re-run `node build.mjs` to regenerate the folders.

## Making this part of the system (AI-powered)

The beat shape here — `{ seconds/dur, on_screen, narration, scene }` — is intentionally the **same** as the in-app Reels Studio script format (`src/lib/reel-engine.ts`). So the path to "generate ideas with AI, then export videos" is:

1. In-app, `discoverReelIdeas` + `generateReel` already produce scripted beats (+ a scene can be derived from each beat's `visual_prompt` via the same `pickScene` logic used by `ReelStoryboard`).
2. A small server function can pass that reel object to `buildStoryboardHtml(video)` (this folder's `template.mjs`) to get the exact same standalone HTML.
3. A render worker (Playwright + ffmpeg, i.e. `export.mjs`) turns it into an MP4 and stores it (local disk now; object storage later).

For now this runs **locally** for the first 34 ideas, which is the fastest way to iterate on the look before wiring it into the app.
