# KLOUDGRAPH — Semrush export data

Drop your per-competitor Semrush exports into the matching folder below (one
subfolder per competitor domain). The folders already exist — just drag your
exported CSVs into each one as you go, no need to create anything.

## Checklist (tick these off as you complete each export)

**Tier 1 — managed cloud / WordPress**
- [ ] `cloudways/` — cloudways.com
- [ ] `kinsta/` — kinsta.com
- [ ] `wpengine/` — wpengine.com
- [ ] `rocket/` — rocket.net
- [ ] `pressable/` — pressable.com
- [ ] `nexcess/` — nexcess.net
- [ ] `convesio/` — convesio.com
- [ ] `servebolt/` — servebolt.com
- [ ] `getflywheel/` — getflywheel.com

**Tier 2 — control panel / managed VPS**
- [ ] `runcloud/` — runcloud.io
- [ ] `gridpane/` — gridpane.com
- [ ] `spinupwp/` — spinupwp.com
- [ ] `ploi/` — ploi.io
- [ ] `serveravatar/` — serveravatar.com

**Tier 3 — modern PaaS / app deploy**
- [ ] `vercel/` — vercel.com
- [ ] `netlify/` — netlify.com
- [ ] `render/` — render.com
- [ ] `railway/` — railway.app
- [ ] `fly/` — fly.io

**Tier 4 — raw cloud infrastructure**
- [ ] `digitalocean/` — digitalocean.com
- [ ] `vultr/` — vultr.com
- [ ] `linode/` — linode.com
- [ ] `kamatera/` — kamatera.com

**Tier 5 — broad hosts**
- [ ] `hostinger/` — hostinger.com
- [ ] `siteground/` — siteground.com

**Additional (used in an earlier import, not yet back in the seed list)**
- [ ] `pantheon/` — pantheon.io
- [ ] `pressidium/` — pressidium.com
- [ ] `sevalla/` — sevalla.com
- [ ] `northflank/` — northflank.com
- [ ] `wpvip/` — wpvip.com
- [ ] `heroku/` — heroku.com

If you tracked others not listed here, just make a new folder — the importer
auto-detects the domain from the folder name / filenames, it doesn't require
this exact list.

## Folder structure inside each competitor folder

```
kloudgraph-semrush-export/
  cloudways/
    cloudways.com-organic.Positions-us-20260101.csv
    cloudways.com-organic.Competitors-us-20260101.csv
    cloudways.com-organic.KeywordGap-us-20260101.csv
    cloudways.com-backlinks-anchors-20260101.csv
    cloudways.com-backlinks-refdomains-20260101.csv
  kinsta/
    ...
```

This folder (and everything inside it) is now committed to git as a backup —
it is **not** gitignored anymore. After adding/updating files here:

```
git add kloudgraph-semrush-export/
git commit -m "Update Semrush export data"
git push
```

Import into the local KLOUDGRAPH database from the `/kloudgraph` dashboard
page (or run the importer script), which reads every subfolder here.

Note: the **Positions** report must be exported as CSV, not .xlsx — the
importer skips .xlsx files and reports them so you know to re-export as CSV.
