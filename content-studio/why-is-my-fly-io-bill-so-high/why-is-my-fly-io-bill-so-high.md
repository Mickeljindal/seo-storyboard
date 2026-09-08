# Why Is My Fly.io Bill So High? The Resources That Keep Charging

*By Kloudbean Engineering · Stopping the Machine is not the same as stopping the bill.*

If your Fly.io bill is bigger than you expected, the cause is usually not the app you are actively running. It is the resources you assumed had stopped. Fly meters compute, storage, snapshots, bandwidth, addresses, and databases as separate things, and several of them keep charging after you think you have turned them off. The good news is that Fly documents this clearly, so every item below comes from their own published pricing and cost-management pages rather than from guesswork. Here is what to check, in the order most likely to explain the number.

> **Why is my Fly.io bill higher than expected?**
> Because several resources bill independently of whether your app is running. Per Fly's own documentation: volumes are billed whether or not they are attached to a Machine, and they keep billing when Machines are stopped; stopped or suspended Machines are still charged for root filesystem usage; snapshots are billed on the storage they occupy; outbound bandwidth is billed at rates that vary by region; a dedicated IPv4 address costs around $2 a month; and Managed Postgres is priced separately from your application Machines.

## Start with volumes, because they are usually the answer

This is the single most common surprise, and Fly says it plainly in their docs. Three separate statements worth reading together: if you create a volume, you will be charged for it; you are billed for volumes that are not attached to Machines; and volumes do not stop billing when your Machines do.

Put together, that means a volume you created for an experiment months ago, in a region you have since forgotten, detached from anything, is still on your invoice. Fly's own cost-management documentation even calls out the forgotten volume in a distant region as an example. Scaling down a Machine, suspending it, or destroying it does not clean up the storage.

```bash
# List volumes across your app, including detached ones
fly volumes list -a your-app-name

# Destroy one you have confirmed you do not need
fly volumes destroy <volume-id>
```

Do this per app, and remember to check every region you have ever deployed to, not just your current one. A volume in a region you no longer use is exactly the thing that hides.

## Stopped Machines are cheaper, not free

The second assumption worth correcting. Running Machines are billed by their CPU and RAM preset for the time they run, which is expected. What catches people is that per Fly's billing documentation, stopped or suspended Machines are still charged for root filesystem usage. The compute charge goes away; the storage underneath it does not.

So a scale-to-zero pattern reduces your compute cost without reducing it to nothing. If you have a collection of old test apps sitting stopped, they are contributing a small amount each, and the sum is easy to overlook.

## Snapshots accumulate quietly

Volume snapshots are billed based on the snapshot storage they occupy. That is reasonable in isolation, and it compounds when retention is generous and nobody reviews it. If you have been snapshotting a large volume daily for a year, the storage total can exceed the volume itself. Check your snapshot retention against what you would actually restore from.

## Bandwidth, and where it hides

Outbound bandwidth is billed, and Fly notes that rates vary by region. Their cost-management guidance flags the workloads where this becomes significant: serving media, syncing large datasets, and replicating across regions.

That last one deserves attention if you chose Fly specifically for multi-region deployment. Running instances in several regions means data moving between them, and inter-region traffic is a real line item rather than an internal free-for-all. The architecture that makes Fly attractive is also the architecture that generates the most transfer.

## The smaller items that add up

- **Dedicated public IPv4 addresses** are billed at approximately $2 a month each. One is trivial. One per app across a dozen apps is not.
- **Managed Postgres is priced separately** from your application Machines, so a database does not come out of your compute budget.
- **Old test apps** that still hold a volume, a snapshot series, or an IPv4 address.

## Managed Postgres is the step-change

Fly's Managed Postgres is a genuinely more managed product than the older self-managed approach, and it includes high availability, backups, and connection pooling. Credit where it is due, because the earlier unmanaged Postgres experience asked a lot of operators.

The thing to plan for is the price step. Per Fly's published Managed Postgres pricing, the entry tier at 1 GB of memory is around $38 a month, 2 GB is around $72, 8 GB is around $282, and it scales up from there, with database storage billed at roughly $0.28 per provisioned GB per 30-day month. Those are Fly's own figures and they may change, so check current pricing. The point is structural rather than a criticism: a managed database on Fly is priced well above a small self-managed Machine, which is exactly the objection small teams raise when they move from unmanaged to managed.

## Support is a separate purchase

Worth knowing before an incident rather than during one. Community support is included for all customers. Fly's documented email support comes through paid support packages, with Standard at $29 a month, Premium at $199, and Enterprise starting at $2,500. Again, these are Fly's published figures.

This matters for budgeting because the realistic cost of running production on Fly includes whichever support tier you would want available at 3am, and that is a line most people leave out of their initial comparison.

## How to make it predictable

1. Audit volumes in every app and every region. Destroy the detached ones you have confirmed are unused.
2. Review snapshot retention against what you would genuinely restore from.
3. Delete old test apps completely rather than stopping them, since stopped Machines still carry filesystem charges.
4. Count your dedicated IPv4 addresses and release the ones no app needs.
5. Look at your egress by workload. If you serve media or replicate across regions, model that separately from compute.
6. Price your database and your support tier as first-class line items, not afterthoughts.
7. Set a calendar reminder to repeat the audit, because forgotten resources are a recurring problem rather than a one-time cleanup.

## The alternative shape: one flat number

The reason a Fly bill is hard to forecast is that it is assembled from many independent meters. A flat plan is the other model. On Kloudbean your Node app, its worker, a managed database, and Redis sit in one dashboard on one predictable plan from $8/mo, and egress is not metered, so serving media or moving data does not change the invoice. There are no volumes billing in a region you forgot, because storage is part of the server rather than a separate metered object. Support is included in the plan rather than bought as a tier, and migration help is included if you are moving in.

To be fair about the trade, though: Fly's regional placement is genuinely excellent, Machines start fast, and the networking flexibility is real. If your product depends on running close to users in many specific regions and you have the operational appetite for Machines, volumes, and private networking, that capability is worth paying a metered bill for. Flat pricing wins when you want a predictable number and a conventional production setup, which describes most teams rather than all of them.

## More on is My Fly.io Bill So High

For the platform comparison see [a Fly.io alternative](https://www.kloudbean.com/blog/fly-io-alternative/), and for the move itself [migrating from Fly.io to Kloudbean](https://www.kloudbean.com/blog/migrate-fly-to-kloudbean/). Other cost-shape reads: [why is my Railway bill so high](https://www.kloudbean.com/blog/why-is-my-railway-bill-so-high/), [Heroku costs after the free tier](https://www.kloudbean.com/blog/heroku-cost-after-free-tier/), and [the cheapest way to host a Node.js app](https://www.kloudbean.com/blog/cheapest-way-to-host-nodejs-app/). For choosing overall, [best managed Node.js hosting](https://www.kloudbean.com/blog/best-managed-nodejs-hosting-2026/).

<!-- cta:start -->
**Read the log, fix it, ship again.**

Deploy from Git, watch the build output as it runs, and open the app error log when a process refuses to start. Managed processes restart on crash, and backups are automatic.

- Live build logs
- Deployment history
- Logs viewer
- Managed process restarts
- Automatic backups
- Git deploy

[Start free](https://console.kloudbean.com/register) · [See plans](https://www.kloudbean.com/pricing/)
<!-- cta:end -->

## FAQ

**Why am I being charged when my Fly.io app is stopped?**
Because stopping compute does not stop storage. Per Fly's billing documentation, stopped or suspended Machines are still charged for root filesystem usage, and volumes keep billing when Machines are stopped. To stop the charges entirely you need to remove the resources, not just stop the Machine.

**Do Fly.io volumes cost money if they are not attached?**
Yes. Fly's documentation states that you are billed for volumes that are not attached to Machines, and that if you create a volume you will be charged for it. This is the most common reason a bill is higher than expected, especially for volumes left in regions you no longer deploy to. Run `fly volumes list` per app to find them.

**How much does Fly.io Managed Postgres cost?**
Per Fly's published pricing, the entry tier at 1 GB memory is around $38 a month, 2 GB around $72, and 8 GB around $282, with storage at roughly $0.28 per provisioned GB per 30-day month. It includes high availability, backups, and connection pooling. Check Fly's current pricing before budgeting, since these figures change.

**Is Fly.io support included?**
Community support is included for all customers. Fly's documented email support is available through paid support packages: Standard at $29 a month, Premium at $199, and Enterprise starting at $2,500. Worth including whichever tier you would want during an incident in your real cost comparison.

**Does Fly.io charge for bandwidth?**
Yes, outbound bandwidth is billed, and Fly notes rates vary by region. Their guidance flags serving media, syncing large datasets, and replicating across regions as the cases where it becomes significant. If you chose Fly for multi-region deployment, model inter-region transfer separately from compute.

**How do I reduce my Fly.io bill?**
Audit volumes across every app and region and destroy detached ones, review snapshot retention, delete old test apps rather than stopping them, release unused dedicated IPv4 addresses, and model egress by workload. Then repeat it on a schedule, because forgotten resources accumulate again. If predictability matters more than regional control, a flat-priced plan removes the problem instead of managing it.

*Kloudbean Engineering · Audit the storage you forgot, not the app you remember.*
