# KLOUDGRAPH — Semrush export data

Drop your per-competitor Semrush export folders here, one subfolder per
competitor domain, e.g.:

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
