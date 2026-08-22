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

### Follow-up: the WHY, and the industry pattern (owner supplied a trade article)

Owner supplied `https://hostingdiscussion.com/news/kinstas-cloud-exit-signals-cost-reckoning-for-managed-wordpress-hosting/`. Added the motive and the industry context, with attribution graded by source quality, because these are not all the same strength of claim.

**Reported, NOT confirmed. Attributed as reported in the article.**
- Cost, not performance, was the driver. That trade piece sources it to "people familiar with the move", which is anonymous sourcing in a hosting-news outlet. Written as "trade coverage reports the driver as cost rather than performance, citing people familiar with it, so treat the motive as reported rather than confirmed."
- Kinsta spent nearly a decade on Google Cloud after leaving smaller providers in 2016. Same sourcing. Not asserted in the article.
- Google Cloud pricing rising and squeezing hosting margins. Characterisation by that outlet. Used only as the general framing "hosting margins being squeezed", not as a claim about Google's price list.

**Vendor claim, labelled as one.**
- Comparable VMs at roughly one third of the on-demand price on Oracle Cloud. This traces to Oracle executives, so the article says "Oracle executives have also publicly claimed ... which is a vendor claim and worth reading as one." Never stated as a measured fact.

**Independently verified, primary source. Safe to assert.**
- Bluehost moved WordPress workloads to OCI. Their own blog, `https://www.bluehost.com/blog/wordpress-recommended-host/`, credits it with "a four to five times improvement in median response times, per Bluehost internal migration data". Attributed to Bluehost's internal data, since we cannot verify their measurement.
- Oracle chairman Larry Ellison named Newfold Digital, Bluehost's parent, as an Oracle Cloud customer on an Oracle earnings call, reported by TechRadar in March 2025.

**The angle this unlocked, and it is better than the one it replaced.** The lazy version of this story is "Kinsta downgraded to a cheap cloud". That is not supportable and Bluehost's own numbers point the other way, so the article says so explicitly: this is not a host picking a worse cloud. It is platforms re-rating infrastructure as margins tighten, which is rational for the platform. The point drawn is the one that survives scrutiny: at no stage in that calculation does a customer's opinion appear, so if your host runs one cloud, its margin math is your architecture roadmap. That argument works whether OCI is faster or slower, which is exactly why it is the one to make.

**CONTENT OPPORTUNITY, needs owner sign-off before writing.** Two searchable news intents now exist that nothing in the library covers, and we would be early on both:
1. "Kinsta moved from Google Cloud to Oracle Cloud" explainer for site owners: what changes for them (IP change, SFTP and SSH host and port change, possible region move, some regions retired, no opt-out), what to check, and when single-cloud dependence actually matters. Informational intent, distinct from this comparison page, so no cannibalisation.
2. "Kinsta apps and databases moved to Sevalla" explainer. Distinct again, and it is a real support-shaped question for anyone running non-WordPress workloads there.
Both are time-sensitive and both decay once the rollout completes, so they are worth deciding on quickly or not at all.
