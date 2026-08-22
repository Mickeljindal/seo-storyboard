# Brief — Kloudbean vs Kinsta (decision-guide)

Cluster 4. Primary kw: kloudbean vs kinsta / kinsta alternative / managed wordpress + app hosting. Intent: comparison (branching).
Real data: Kinsta ranks for huge informational content (php #1, responsive design, web hosting) — famous for docs/content marketing; premium managed WordPress on Google Cloud; also app + DB hosting. HONEST: Kinsta's speed, support, MyKinsta polish are genuinely strong.
FORMAT: Decision-guide (branch by situation) — NOT a head-to-head table (just did table for cloudways). Opener = "the right pick depends on a few concrete questions." Branches: WordPress-first & polish matters → Kinsta; want to choose cloud provider (Kinsta=GCP only, Kloudbean=AWS/DO/Vultr/Linode) → Kloudbean; mixed apps+DBs (SCREENSHOT launch-database.png) → compare; cost predictability. Short "quick read" summary at end (not a big table).
Honesty woven: Linux; managed=server/stack/SSL/backups; you own app. Don't invent Kinsta prices.
Dashboard: launch-database.png (both do managed DB + app hosting). Byline: "Kloudbean · Pick the cloud. Keep the manager."
Slug: kloudbean-vs-kinsta. Links: kloudbean-vs-cloudways, managed-vs-unmanaged-hosting, enterprise WP (cluster 10), add-managed-database.

## UPDATE Aug 2026: two verified Kinsta changes. Do not regress these.

Owner flagged that Kinsta left Google Cloud for OCI. Verified before writing, and the owner's version needed one correction.

**1. Infrastructure: Oracle Cloud Infrastructure, not Google Cloud. CONFIRMED.**
Source: `https://kinsta.com/docs/service-information/infrastructure-upgrades/` (Kinsta's own docs, fetched in full). Quotable from that page:
- their new infrastructure "is powered by Oracle Cloud Infrastructure (OCI), which uses different data center locations than our previous Google Cloud setup"
- and again: "our upgrade to Oracle Cloud Infrastructure (OCI), which offers a different set of data center locations compared to our former Google Cloud setup"
- opting out: "No, it isn't possible to opt out of infrastructure upgrades"
- notice 1 to 2 weeks by email; maintenance window 2am to 5am local; usually under a minute of downtime
- the site's external IP changes; SFTP/SSH Host and Port change; a site may be relocated to the nearest available OCI region; some previous regions "may no longer be available"
- per-site rollout, tracked by an `Infrastructure` column in the site CSV export (empty means not yet upgraded)

**CORRECTION to the owner's framing:** the owner said Kinsta "left GCP 100%". The docs describe a rolling, per-site upgrade that is still in progress, not a completed exit, and some Kinsta pages still reference Google Cloud (a changelog about Google C3D VMs in Taiwan, and their `google-cloud-alternative` landing page). So the article says what is documented: the new infrastructure is OCI, their docs call Google Cloud the previous and former setup, and the rollout is per site and not opt-out-able. It does NOT claim a completed 100% migration. That distinction is the difference between a checkable claim and one Kinsta could rebut.

**2. Apps, databases, static sites and object storage moved to Sevalla. CONFIRMED, and arguably the bigger story.**
Source: `https://kinsta.com/changelog/paas-moving-to-sevalla/`. From February 2, 2026 those services are managed in Sevalla, Kinsta's separate PaaS, not in MyKinsta. Their stated reason: it "allows Kinsta to focus fully on WordPress hosting". Existing services keep running, billing and credentials carry over, and MyKinsta has a quick link across. So Kinsta is now WordPress-only in MyKinsta, and a WordPress site plus a Node app plus a database means two dashboards and two products. This makes the article's scope thesis Kinsta's own stated strategy rather than our characterisation, which is a much stronger place to argue from.

**How it was written.** New H2 near the top, "Two recent Kinsta changes that move this decision", placed before the scope argument so the rest of the piece rests on it. Deliberately fair in tone: swapping clouds is a legitimate engineering decision, handled with notice, snapshots and a window. The point drawn is about single-provider dependence, not competence: you didn't choose Google Cloud and you didn't choose to leave it, and if you needed a specific region or a fixed IP, that was decided for you.

**Also corrected in the same pass:** "six managed databases" and "Six engines are on offer" were wrong and omitted Memcached. Now seven, named. Go added to the runtime list per the owner-confirmed one-click managed Go runtime. Every "happy on Google Cloud" conditional was reworded, since it is no longer the relevant question.

**Files updated:** article md and html including JSON-LD and og:description, plus social.md and social.json which repeated the Google Cloud line.

**Freshness triggers:** OCI rollout completing (then "previous setup" language can harden); Sevalla and Kinsta pricing diverging; Kinsta's own pages dropping their remaining Google Cloud references; any Kinsta announcement about the migration finishing.
