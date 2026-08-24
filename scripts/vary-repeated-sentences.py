# -*- coding: utf-8 -*-
"""Second slop pass: vary the sentences that are pasted across many articles.

    python3 scripts/vary-repeated-sentences.py [--dry]

Companion to break-template-patterns.py, which handled headings. Each pool must be
at least as large as the number of articles using the phrase, or the pass runs dry
and leaves duplicates behind, which is what happened on the first attempt.

One of these is self-inflicted: correcting the ".NET is not supported" error created
19 identical replacement sentences. Fixing a fact by pasting one sentence into 19
articles trades a factual bug for a fingerprint, so it gets varied here too.

Unpublished articles only.
"""
import io, os, re, sys, json, hashlib

ROOT = "content-studio"
DRY = "--dry" in sys.argv

published = set()
data = json.load(open(os.path.join(ROOT, "_published.json")))


def _walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            published.add(str(k)); _walk(v)
    elif isinstance(o, list):
        for v in o: _walk(v)
    elif isinstance(o, str):
        published.add(o)


_walk(data)

POOLS = {
    "![The Kloudbean console showing automatic backups you can view and restore](../assets/console/manage-backups.png)": [
        "![The backup list in Kloudbean, with restore points ready to roll back to](../assets/console/manage-backups.png)",
        "![Automatic backups in the Kloudbean console, each one restorable](../assets/console/manage-backups.png)",
        "![Backup and restore settings, showing the retained restore points](../assets/console/manage-backups.png)",
        "![Where backups are listed and restores are triggered in the Kloudbean console](../assets/console/manage-backups.png)",
        "![The Kloudbean backup screen, with schedule and available restore points](../assets/console/manage-backups.png)",
    ],
    "Pick a cloud (AWS, AWS Lightsail, Google Cloud, Linode, Vultr, DigitalOcean, or UpCloud), choose a region near your visitors, and pick a size.": [
        "Choose your provider from AWS, Lightsail, Google Cloud, Linode, Vultr, DigitalOcean or UpCloud, then a region close to your audience and a size that fits.",
        "Seven providers to choose from, a region near your readers, and a size you can change later.",
        "Start with the cloud (AWS, Lightsail, Google Cloud, Linode, Vultr, DigitalOcean, UpCloud), then region, then size.",
        "Pick where it runs, from any of seven providers, how close it sits to your visitors, and how much machine you want.",
        "Provider first, then region, then size. Seven clouds are on the list, including AWS, Google Cloud and DigitalOcean.",
    ],
    "Compare the platform in [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/), or start at [kloudbean.com](https://www.kloudbean.com/).": [
        "There is a fuller comparison in [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/), or begin at [kloudbean.com](https://www.kloudbean.com/).",
        "See [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/) for the head-to-head, or go straight to [kloudbean.com](https://www.kloudbean.com/).",
        "[Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/) covers the platform difference; [kloudbean.com](https://www.kloudbean.com/) is where you start.",
        "Weigh them in [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/), then try it at [kloudbean.com](https://www.kloudbean.com/).",
        "The platform-level view is in [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/). Otherwise, [kloudbean.com](https://www.kloudbean.com/).",
        "For the direct comparison read [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/), or launch one from [kloudbean.com](https://www.kloudbean.com/).",
    ],
    "For the wider set of tools worth owning, the [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/) guide.": [
        "The [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/) guide covers the rest of the field.",
        "There is a broader survey in [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/).",
        "If you are assembling a self-hosted stack, see [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/).",
        "More options live in the [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/) roundup.",
        "For what else is worth running yourself, [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/).",
        "The rest of the category is in [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/).",
        "Other tools worth self-hosting are collected in [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/).",
    ],
    "Free migration assistance handles the WordPress files and database, free SSL is included once DNS points over, and automatic backups are on from day one.": [
        "Migration assistance moves the files and database, SSL is issued once DNS resolves, and backups run from the start.",
        "The files and database come across with help, SSL follows the DNS change, and backups are on immediately.",
        "You get assistance moving files and database, a certificate once DNS points over, and backups from day one.",
        "Free migration covers files and database, SSL lands after the DNS switch, and backups are already running.",
        "Files and database are migrated for you, the certificate is issued when DNS resolves, and backups start straight away.",
    ],
    # self-inflicted by the .NET correction: 19 copies of one sentence
    "Windows Server is a Premium and Enterprise option rather than a standard one, and .NET "
    "runs on Linux.": [
        "Windows Server sits on the Premium and Enterprise tiers, while .NET itself runs on Linux.",
        "Run .NET on Linux; reach for Premium or Enterprise if you need Windows Server itself.",
        ".NET runs on Linux here; Windows Server is a Premium and Enterprise option.",
        "If you need Windows Server that is a Premium or Enterprise conversation, though .NET on "
        "Linux is standard.",
        "Linux covers .NET. Windows Server is the part that moves you to Premium or Enterprise.",
        "The Linux stack includes .NET; Windows Server is available higher up the tiers.",
        "You can run .NET on Linux. Windows Server is a Premium and Enterprise option.",
        "Windows Server is not a standard-plan feature, but .NET on Linux is.",
        ".NET is supported on Linux, and Windows Server is offered on Premium and Enterprise.",
        "For .NET, Linux is enough. For Windows Server itself, look at Premium or Enterprise.",
        "Linux .NET versions are supported; a Windows Server box is a Premium and Enterprise item.",
        "There is .NET on Linux. There is Windows Server too, on the upper tiers.",
        "Windows Server belongs to Premium and Enterprise; .NET does not need it.",
        ".NET workloads run on the Linux stack, and Windows Server is a higher-tier option.",
        "Nothing stops .NET on Linux; Windows Server is where the tier matters.",
        "The distinction worth knowing: .NET on Linux is standard, Windows Server is not.",
        "Linux handles .NET. Windows Server is a Premium and Enterprise arrangement.",
        "Premium and Enterprise carry Windows Server, and .NET runs on Linux regardless.",
        ".NET on Linux is fine. A Windows Server instance is a Premium or Enterprise question.",
        "Windows Server is tier-gated to Premium and Enterprise; .NET on Linux is not.",
    ],
    "Managed covers the server, the stack, TLS, backups, and patching.": [
        "The platform owns the server, the stack, TLS, backups and patching.",
        "Server, stack, TLS, backups and patching sit on the platform's side.",
        "TLS, patching, backups and the stack itself are handled for you.",
        "What is handled: the operating system, the stack, certificates, backups and patches.",
        "The box, its stack, its certificates and its backups are somebody else's rota.",
        "Patching, TLS renewal, backups and stack upkeep are off your list.",
        "The managed half is the machine and everything beneath your code.",
        "Certificates, patches, backups and the stack come with the platform.",
        "Everything under your application, from the OS to the TLS certificate, is maintained for you.",
        "The server, its packages, its certificates and its backup schedule are not yours to run.",
        "Stack upkeep, security patches, certificate renewal and backups are included.",
    ],
    "Compare the platform in [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/).": [
        "There is a fuller platform comparison in [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/).",
        "For the head-to-head, see [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/).",
        "If you are weighing the two platforms, [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/) goes through it.",
        "The platform-level differences are laid out in [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/).",
        "[Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/) covers how the two stack up.",
        "Weighing them properly? Start with [Kloudbean vs Cloudways](https://www.kloudbean.com/blog/kloudbean-vs-cloudways/).",
    ],
    "For the wider set of tools worth owning, the [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/) guide has more.": [
        "The [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/) guide covers the rest of the field.",
        "There is a broader list in [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/).",
        "If you are assembling a self-hosted stack, [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/) is the wider survey.",
        "More options in the [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/) roundup.",
        "For what else is worth running yourself, see [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/).",
        "The rest of the category is in [best self-hosted tools](https://www.kloudbean.com/blog/best-self-hosted-tools/).",
    ],
    "Free migration assistance handles the WordPress files and database, free SSL is included once DNS points over, and automatic backups start on day one.": [
        "Migration assistance moves the files and database, SSL is issued once DNS resolves, and backups begin immediately.",
        "The files and database come across with migration help, SSL follows the DNS change, and backups run from the first day.",
        "You get help moving files and the database, a certificate once DNS points over, and backups from the start.",
        "Free migration covers files and database; SSL lands after the DNS switch; backups are on by default.",
        "Files and database are migrated for you, the certificate is issued when DNS resolves, and backups start straight away.",
    ],
    "WordPress and WooCommerce run on a one-click stack, and free migration assistance moves the files and database for you.": [
        "WordPress and WooCommerce launch from a tile, and migration help brings the files and database over.",
        "The WordPress and WooCommerce stacks are one-click, with migration assistance for the move itself.",
        "One click gets you WordPress or WooCommerce; migration assistance handles files and database.",
        "WordPress and WooCommerce are prebuilt stacks, and someone else can do the move.",
        "Both WordPress and WooCommerce launch preconfigured, and the migration is assisted.",
    ],
    "Start free at [kloudbean.com](https://www.kloudbean.com/), and check plans on [pricing](https://www.kloudbean.com/pricing/).": [
        "Try it at [kloudbean.com](https://www.kloudbean.com/); the tiers are on [pricing](https://www.kloudbean.com/pricing/).",
        "Have a look at [kloudbean.com](https://www.kloudbean.com/), and the tiers on [pricing](https://www.kloudbean.com/pricing/).",
        "Get started on [kloudbean.com](https://www.kloudbean.com/); what each tier covers is on [pricing](https://www.kloudbean.com/pricing/).",
        "Launch one at [kloudbean.com](https://www.kloudbean.com/), and read the tiers on [pricing](https://www.kloudbean.com/pricing/).",
        "Start at [kloudbean.com](https://www.kloudbean.com/) and compare tiers on [pricing](https://www.kloudbean.com/pricing/).",
        "See it working at [kloudbean.com](https://www.kloudbean.com/), with current rates on [pricing](https://www.kloudbean.com/pricing/).",
        "Spin one up from [kloudbean.com](https://www.kloudbean.com/); plan details live on [pricing](https://www.kloudbean.com/pricing/).",
        "Begin at [kloudbean.com](https://www.kloudbean.com/) and check what each tier includes on [pricing](https://www.kloudbean.com/pricing/).",
    ],
    "One-click databases, automatic backups, IP allow-listing, free migration, free trial, and simple Git deploy": [
        "One-click databases · automatic backups · IP allow-listing · assisted migration · Git deploy",
        "Databases in a click, backups on by default, IP allow-listing, migration help, Git deploys",
        "One-click database launch · scheduled backups · allow-listed access · Git-based deploys",
        "Managed databases, automatic backups, IP allow-listing and deploys straight from Git",
        "Click to launch a database, backups running, access allow-listed, deploys from Git",
    ],
    "![The Kloudbean console launching a server, with a choice of cloud provider, region, and server size](../assets/console/add-server.png)": [
        "![Choosing the cloud provider, region and size when launching a Kloudbean server](../assets/console/add-server.png)",
        "![The Add Server screen: provider, region and instance size side by side](../assets/console/add-server.png)",
        "![Launching a server on Kloudbean, with provider and region selected before size](../assets/console/add-server.png)",
        "![Provider, region and size, the three choices when creating a Kloudbean server](../assets/console/add-server.png)",
        "![Server creation in the Kloudbean console, showing the provider and region options](../assets/console/add-server.png)",
        "![Picking where the server runs and how big it is, in the Kloudbean console](../assets/console/add-server.png)",
    ],
    "![The Kloudbean console adding an application, with WordPress and other one-click stacks](../assets/console/add-application.png)": [
        "![The Add Application screen, with WordPress among the one-click stacks](../assets/console/add-application.png)",
        "![Adding an application in Kloudbean and choosing its stack](../assets/console/add-application.png)",
        "![One-click application stacks in the Kloudbean console, WordPress included](../assets/console/add-application.png)",
        "![Creating a second application on an existing Kloudbean server](../assets/console/add-application.png)",
        "![Choosing an application stack when adding it to a Kloudbean server](../assets/console/add-application.png)",
        "![The application list in Kloudbean, mid-way through adding a new one](../assets/console/add-application.png)",
    ],
    "![The Kloudbean console connecting a GitHub repository for automatic build and deploy on push](../assets/console/git-deployment.png)": [
        "![Connecting a GitHub repository so every push builds and deploys](../assets/console/git-deployment.png)",
        "![Pointing a Kloudbean application at a GitHub branch for automatic deploys](../assets/console/git-deployment.png)",
        "![The deployment settings, with the repository connected and auto-deploy enabled](../assets/console/git-deployment.png)",
        "![The Git Deployment tab, with a repository and branch selected](../assets/console/git-deployment.png)",
        "![Wiring a repository to a Kloudbean application for push-to-deploy](../assets/console/git-deployment.png)",
        "![Git deployment settings in the Kloudbean console, branch and build command visible](../assets/console/git-deployment.png)",
        "![Setting up automatic deploys from a GitHub branch](../assets/console/git-deployment.png)",
    ],
}

articles = sorted(s for s in os.listdir(ROOT)
                  if os.path.isdir(os.path.join(ROOT, s))
                  and os.path.exists(os.path.join(ROOT, s, s + ".md")))
targets = [s for s in articles if s not in published]

used = set()
for slug in articles:                    # never reuse a phrasing already in the library
    t = io.open(os.path.join(ROOT, slug, slug + ".md"), encoding="utf-8").read()
    for pool in POOLS.values():
        for v in pool:
            if v in t:
                used.add(v)

changed, n_sent, dry_run_left = [], 0, []
for slug in targets:
    d = os.path.join(ROOT, slug)
    paths = [os.path.join(d, slug + e) for e in (".md", ".html")]
    paths = [p for p in paths if os.path.exists(p)]
    md = io.open(paths[0], encoding="utf-8").read()
    touched = False
    for burned, pool in POOLS.items():
        if burned not in md:
            continue
        order = int(hashlib.md5((slug + burned).encode()).hexdigest(), 16)
        new = None
        for i in range(len(pool)):
            c = pool[(order + i) % len(pool)]
            if c not in used:
                new = c
                break
        if new is None:
            dry_run_left.append(f"{slug}: pool exhausted for '{burned[:52]}...'")
            continue
        used.add(new)
        n_sent += 1
        touched = True
        for p in paths:
            s = io.open(p, encoding="utf-8").read()
            o = s
            s = s.replace(burned, new)
            # markdown link and image syntax become html in the mirror
            s = s.replace(re.sub(r"!\[(.*?)\]\((.*?)\)", r'<img src="\2" alt="\1">', burned),
                          re.sub(r"!\[(.*?)\]\((.*?)\)", r'<img src="\2" alt="\1">', new))
            s = s.replace(re.sub(r"\[(.*?)\]\((.*?)\)", r'<a href="\2">\1</a>', burned),
                          re.sub(r"\[(.*?)\]\((.*?)\)", r'<a href="\2">\1</a>', new))
            if s != o and not DRY:
                io.open(p, "w", encoding="utf-8").write(s)
    if touched:
        changed.append(slug)

print(f"sentences varied : {n_sent}")
print(f"articles touched : {len(changed)}{'  (dry run)' if DRY else ''}")
if dry_run_left:
    print("\nPOOL EXHAUSTED:")
    for x in dry_run_left:
        print("  ", x)
io.open("/tmp/slop-changed2.txt", "w").write("\n".join(changed))
