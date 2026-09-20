#!/usr/bin/env python3
"""
Add a price to the 26 PUBLISHED articles whose CTA states none.

WHY THESE WERE MISSED. The v1.12.0 CTA pass covered the 396 unpublished articles
and skipped every live one. So the conversion work landed on pages earning no
traffic and missed all 38 pages that are actually published. 26 of those state no
price at all, which is the single biggest gap in a bottom-of-page CTA.

WHY THIS IS NOT THE v1.12.0 SCRIPT. Those 396 carry a generated CTA block
(.kbcta-*). These 26 are hand-written `<div class="cta">` blocks with genuinely
varied copy: 24 distinct link lines and 18 distinct feature lines across 26
articles. So this adds a price line and touches nothing else. Rewriting them to
the generated shape would destroy copy that is better than the template.

REGION-AWARE, because it has to be. $8/mo is the Linode entry price and Linode
has no Saudi data centre, so the four in-Kingdom articles get $36/mo (Google
Cloud Dammam) instead. See kloudbean-facts.md.

NO BYTE-IDENTICAL LINES. The cross-article slop audit flags a 9-word-plus
sentence repeated in more than 3 articles, so the price copy rotates rather than
pasting one string 26 times. Each general variant lands on at most 3 articles.

Idempotent: re-running finds nothing to do.
"""
import json
import os
import re
import sys

ROOT = "content-studio"

# Four in-Kingdom articles. $8 is not purchasable in Dammam, so each gets the real
# in-Kingdom entry price plus the reason.
IN_KINGDOM = {
    "cscc-backup-disaster-recovery":
        "In-Kingdom hosting starts at $36/mo, since Dammam runs on Google Cloud. "
        "Enterprise engagements, where tested restores and multi-zone failover are managed for you, "
        "are priced on scope.",
    "hosting-ai-apps-saudi-arabia":
        "From $36/mo for in-Kingdom Dammam hosting. GPU servers are sized and quoted per workload, "
        "so ask rather than guess.",
    "managed-databases-saudi-data-sovereignty":
        "$36/mo is the in-Kingdom entry price, because Dammam runs on Google Cloud. "
        "Our $8 plan is on Linode, which has no Saudi data centre.",
    "nca-cscc-compliance-guide":
        "In-Kingdom hosting from $36/mo. Enterprise, where the audit trail, isolation and 18-month "
        "log retention sit, starts from $7,500/mo with custom pricing for wider scope.",
}

# Rotated across the remaining 22. Every claim here is in kloudbean-facts.md:
# $8 Linode entry, free migration above 4GB, 3-day trial on one service, and no
# cap on applications per server at any tier.
GENERAL = [
    "From $8/mo. Migration is free on servers above 4GB, and the trial runs 3 days on one service.",
    "Servers start at $8/mo, and one server runs as many apps as its RAM allows. There is no per-app charge.",
    "$8/mo to start, with the first migration handled for you on servers above 4GB.",
    "Entry plans are $8/mo. Cloud pricing moves, so confirm the current number on the pricing page.",
    "From $8/mo, and that price buys the server rather than each service running on it.",
    "Starts at $8/mo. Free migration above 4GB, and a 3-day trial if you would rather test first.",
    "$8/mo for the entry server, which is sized on RAM first. Check current rates before you commit.",
    "From $8/mo. Worth knowing the entry plan already runs more than one app.",
]

HTML_P = ('<p style="margin:.75em 0 0; padding-top:.6em; '
          'border-top:1px solid rgba(255,255,255,.18); font-size:15px">{}</p>')
FAQ_RE = re.compile(r"^#{2,3}\s*FAQ|^\*\*FAQ", re.M | re.I)
HAS_PRICE = re.compile(r"\$\s?\d")


def price_for(slug, index):
    if slug in IN_KINGDOM:
        return IN_KINGDOM[slug]
    return GENERAL[index % len(GENERAL)]


# The 26 published articles whose CTA stated no price. Listed explicitly rather
# than rediscovered, so a re-run cannot quietly widen its own blast radius.
TARGETS = [
    "add-managed-database-to-your-app", "agency-wordpress-hosting", "ci-cd-auto-deploy-from-github",
    "cscc-backup-disaster-recovery", "database-connection-pooling",
    "deploy-ai-built-app-to-production", "deploy-golang-app", "deploy-node-app-to-managed-cloud",
    "environment-variables-done-right", "fix-503-after-deploying-your-app",
    "host-app-api-and-database-on-one-server", "hosting-ai-apps-saudi-arabia",
    "how-agencies-host-20-client-apps", "last-mile-of-vibe-coding",
    "managed-databases-saudi-data-sovereignty", "managed-mysql-hosting",
    "managed-postgresql-hosting", "managed-redis-hosting", "managed-vs-unmanaged-hosting",
    "nca-cscc-compliance-guide", "netlify-alternative-for-full-stack-apps",
    "s3-compatible-object-storage", "security-headers-guide", "server-backups-guide",
    "what-is-a-managed-server", "what-is-a-vpc",
]


def main():
    targets = TARGETS
    changed, skipped, failures = 0, 0, []
    general_i = 0

    for slug in targets:
        text = price_for(slug, general_i)
        if slug not in IN_KINGDOM:
            general_i += 1

        hp = os.path.join(ROOT, slug, slug + ".html")
        mp = os.path.join(ROOT, slug, slug + ".md")
        if not (os.path.isfile(hp) and os.path.isfile(mp)):
            failures.append(f"{slug}: missing html or md")
            continue

        html = open(hp, encoding="utf8").read()
        md = open(mp, encoding="utf8").read()

        # --- html: append the price as the last <p> inside <div class="cta">
        m = re.search(r'(<div class="cta">)(.*?)(</div>)', html, re.S)
        if not m:
            failures.append(f"{slug}: no <div class=\"cta\"> found")
            continue
        block = m.group(2)
        if "<div" in block:
            failures.append(f"{slug}: nested div inside .cta, refusing to guess")
            continue
        if HAS_PRICE.search(block):
            skipped += 1
            print(f"  skip   {slug}  (CTA already states a price)")
            continue
        new_block = block.rstrip() + "\n    " + HTML_P.format(text) + "\n  "
        new_html = html[:m.start(2)] + new_block + html[m.end(2):]

        # --- md: insert the same line just before the FAQ heading
        fm = FAQ_RE.search(md)
        if not fm:
            failures.append(f"{slug}: no FAQ anchor in md")
            continue
        head = md[:fm.start()].rstrip()
        if HAS_PRICE.search(head[-1200:]):
            failures.append(f"{slug}: md CTA already has a price but html did not")
            continue
        new_md = head + "\n\n" + text + "\n\n" + md[fm.start():]

        open(hp, "w", encoding="utf8").write(new_html)
        open(mp, "w", encoding="utf8").write(new_md)
        changed += 1
        tag = "KSA" if slug in IN_KINGDOM else "   "
        print(f"  {tag}    {slug}")

    print(f"\nchanged: {changed}   skipped: {skipped}   failed: {len(failures)}")
    if failures:
        print("FAILURES:")
        for f in failures:
            print("  -", f)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
