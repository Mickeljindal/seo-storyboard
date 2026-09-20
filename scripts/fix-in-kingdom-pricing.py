#!/usr/bin/env python3
"""
Fix the in-Kingdom price on Saudi/Dammam articles.

THE BUG. Six articles pitch hosting in Google Cloud's Dammam region, print the
feature line "In-Kingdom GCP Dammam region", and then quote "Plans start from
$8/mo" in the same CTA. $8 is the Linode entry price and Linode has no Saudi
data centre, so the price on screen is not available for the thing the page is
selling. A prospect finds that on the pricing page, not from us.

Per kloudbean-facts.md: in-Kingdom Dammam starts from $36/mo, because it runs on
Google Cloud. Match the price to the geography the article is about.

Also fixes the pricing FAQ on the four articles that have one, in the visible
copy AND the FAQPage JSON-LD, so schema/visible parity is preserved.

Idempotent: re-running finds nothing to do.
"""
import os
import sys

ROOT = "content-studio"

# The wrong sentence, byte-identical across all six articles.
CTA_OLD = "Plans start from $8/mo, Enterprise is custom."

# The first version of this fix replaced all six with ONE identical sentence, and
# scripts/audit-template-slop.py immediately flagged it: a 9-word-plus sentence in
# more than 3 articles. Correct on the facts, wrong on the library. So the
# replacement is per-slug. Same price, same meaning, different words.
CTA_GENERIC = "In-Kingdom plans start from $36/mo on Google Cloud Dammam, Enterprise is custom."
CTA_NEW = {
    "cloud-hosting-saudi-arabia":
        "In-Kingdom plans start from $36/mo on Google Cloud Dammam, Enterprise is custom.",
    "managed-hosting-ksa":
        "Dammam hosting starts at $36/mo, and Enterprise is priced on scope.",
    "hosting-for-saudi-ecommerce":
        "An in-Kingdom stack starts at $36/mo in Dammam, with Enterprise priced on scope.",
    "arabic-wordpress-hosting":
        "Hosting in the Dammam region starts from $36/mo, Enterprise is custom.",
    "data-residency-saudi-arabia":
        "In-region plans start at $36/mo in Dammam, Enterprise is custom.",
    "pdpl-compliance-hosting":
        "In-Kingdom hosting starts at $36/mo on Dammam, Enterprise is priced on scope.",
}

WHY = ("The $8 entry plan runs on Linode, which has no Saudi data centre, so it is not "
       "an option when your data has to stay in the Kingdom.")

# Pricing FAQ answers. Each string appears twice in the .html (visible <p> and the
# FAQPage JSON-LD) and once in the .md, so a plain replace-all keeps them in parity.
FAQ_FIXES = {
    "cloud-hosting-saudi-arabia": [(
        "Standard plans start from $8 a month, and Enterprise is custom pricing depending on "
        "scale and requirements. In-Kingdom hosting on the Dammam region follows the same plan "
        "structure.",
        "In-Kingdom hosting in the Dammam region starts from $36 a month, because it runs on "
        "Google Cloud. " + WHY + " Enterprise is custom pricing depending on scale and requirements.",
    )],
    "managed-hosting-ksa": [(
        "Standard plans start from $8 a month, and Enterprise is custom pricing depending on "
        "scale and requirements. In-Kingdom hosting on the Dammam region follows the same plan "
        "structure.",
        "In-Kingdom hosting in the Dammam region starts from $36 a month, because it runs on "
        "Google Cloud. " + WHY + " Enterprise is custom pricing depending on scale and requirements.",
    )],
    "hosting-for-saudi-ecommerce": [(
        "Standard plans start from $8 a month, and Enterprise is custom pricing depending on "
        "scale and requirements. An in-Kingdom Dammam stack follows the same plan structure,",
        "An in-Kingdom Dammam stack starts from $36 a month, because it runs on Google Cloud. "
        + WHY + " Enterprise is custom pricing depending on scale and requirements,",
    )],
    "arabic-wordpress-hosting": [(
        "On Kloudbean, standard plans start from $8 a month, and Enterprise is custom pricing "
        "based on scale.",
        "Hosting in the Dammam region starts from $36 a month, since in-Kingdom hosting runs on "
        "Google Cloud. " + WHY + " Enterprise is custom pricing based on scale.",
    )],
}

SLUGS = ["cloud-hosting-saudi-arabia", "managed-hosting-ksa", "hosting-for-saudi-ecommerce",
         "arabic-wordpress-hosting", "data-residency-saudi-arabia", "pdpl-compliance-hosting"]

changed, failures = 0, []

for slug in SLUGS:
    for ext in ("html", "md"):
        path = os.path.join(ROOT, slug, f"{slug}.{ext}")
        if not os.path.isfile(path):
            failures.append(f"missing file: {path}")
            continue
        src = open(path, encoding="utf8").read()
        out = src

        target = CTA_NEW[slug]
        # Handles a first run (still says $8) and a re-run after the generic pass.
        if CTA_OLD in out:
            out = out.replace(CTA_OLD, target)
        elif CTA_GENERIC in out and CTA_GENERIC != target:
            out = out.replace(CTA_GENERIC, target)
        for old, new in FAQ_FIXES.get(slug, []):
            if old in out:
                out = out.replace(old, new)

        if out == src:
            print(f"  unchanged  {slug}.{ext}")
            continue

        # An in-Kingdom page may still MENTION $8 to explain why it does not apply
        # here. What it may not do is OFFER $8 as the price. Check for the promise
        # patterns only, otherwise the guard rejects its own explanation.
        promises = [
            "plans start from $8", "Plans from $8", "start from $8 a month",
            "starts from $8", "starting at $8", "from $8/mo",
        ]
        left = [p for p in promises if p.lower() in out.lower()]
        if left:
            failures.append(f"{path}: still offers $8 as the price ({', '.join(left)})")
            continue

        open(path, "w", encoding="utf8").write(out)
        changed += 1
        print(f"  fixed      {slug}.{ext}")

print(f"\nfiles changed: {changed}")
if failures:
    print("FAILURES:")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("all six in-Kingdom articles now quote $36/mo, and none still quote $8.")
