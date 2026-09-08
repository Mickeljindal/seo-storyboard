# -*- coding: utf-8 -*-
"""Apply the explicitly reviewed fixes from the cross-library repetition audit.

This is deliberately a finite map, not a bulk synonym replacer. Each heading names
what its own article's section says, and the one competitor hand-off is changed into
an architecture boundary. Run from repository root:

    python3 scripts/remediate-repetition-audit.py
"""
import io
import os

ROOT = "content-studio"

# slug: (old heading, replacement that names the section's actual subject)
HEADING_FIXES = {
    "add-managed-database-to-your-app": (
        "The honest limits", "The database choices this does not make for you"),
    "best-managed-cloud-hosting": (
        "The honest limits", "What this hosting model still leaves to you"),
    "deploy-ai-built-app-to-production": (
        "The honest limits", "Before you deploy an AI-built app"),
    "environment-variables-done-right": (
        "The honest limits", "What environment variables cannot protect"),
    "fix-503-after-deploying-your-app": (
        "The honest limits", "When this is not a hosting-layer 503"),
    "host-app-api-and-database-on-one-server": (
        "The honest limits", "What this one-server layout should not carry"),
    "upstash-alternative": (
        "The honest limits", "Where an edge-oriented Redis model still fits"),
    "best-managed-cloud-hosting": (
        "Where Kloudbean fits", "How Kloudbean performs against the checklist"),
    "cloud-hosting-saudi-arabia": (
        "Where Kloudbean fits, and where it stops", "What stays shared in a Saudi deployment"),
    "hosting-ai-apps-saudi-arabia": (
        "Where Kloudbean fits", "What a Saudi AI deployment needs from its platform"),
    "last-mile-of-vibe-coding": (
        "Where Kloudbean fits", "Where the deployment layer begins"),
    "nca-cscc-compliance-guide": (
        "Where Kloudbean fits", "The infrastructure work a managed platform can carry"),
    "security-headers-guide": (
        "Where Kloudbean fits", "The platform layer below your headers"),
}

# The best-managed-cloud-hosting article contains both repeated headings.
EXTRA_HEADING_FIXES = {
    "best-managed-cloud-hosting": [
        ("The honest limits", "What this hosting model still leaves to you"),
        ("Where Kloudbean fits", "How Kloudbean performs against the checklist"),
    ],
}

# The audit output catches seven copies of each stock heading. Use this full map rather
# than a global swap so it remains clear which per-article editorial decision was made.
ALL_HEADING_FIXES = {
    "add-managed-database-to-your-app": [("The honest limits", "The database choices this does not make for you")],
    "best-managed-cloud-hosting": EXTRA_HEADING_FIXES["best-managed-cloud-hosting"],
    "deploy-ai-built-app-to-production": [("The honest limits", "Before you deploy an AI-built app")],
    "environment-variables-done-right": [("The honest limits", "What environment variables cannot protect")],
    "fix-503-after-deploying-your-app": [("The honest limits", "When this is not a hosting-layer 503")],
    "host-app-api-and-database-on-one-server": [("The honest limits", "What this one-server layout should not carry")],
    "upstash-alternative": [("The honest limits", "Where an edge-oriented Redis model still fits")],
    "cloud-hosting-saudi-arabia": [("Where Kloudbean fits, and where it stops", "What stays shared in a Saudi deployment")],
    "hosting-ai-apps-saudi-arabia": [("Where Kloudbean fits", "What a Saudi AI deployment needs from its platform")],
    "last-mile-of-vibe-coding": [("Where Kloudbean fits", "Where the deployment layer begins")],
    "nca-cscc-compliance-guide": [("Where Kloudbean fits", "The infrastructure work a managed platform can carry")],
    "security-headers-guide": [("Where Kloudbean fits", "The platform layer below your headers")],
}

HANDOFF_OLD = "So if your workload is serverless, spiky, or edge-first, honestly, stay on Upstash. It fits. The rest is for the other case: an app that's always running, on a server."
HANDOFF_NEW = "A serverless, spiky, or edge-first workload has different operational constraints from an always-running server application. This guide covers the latter case, where Redis can live alongside the application stack and its operating costs are easier to predict."

GIT_OLD_MD = "A deploy pipeline pointed at a branch that no longer exists doesn't complain, it just stops shipping, and nobody notices until someone asks why their merge isn't live."
GIT_NEW_MD = "A deploy pipeline pointed at a branch that no longer exists doesn't complain, it just stops shipping, and nobody notices until someone asks why their merge isn't live. If a Kloudbean deployment is connected to that branch, deployment history and live build logs distinguish a missing push from a failed build."
GIT_OLD_HTML = "A deploy pipeline pointed at a branch that no longer exists doesn't complain, it just stops shipping, and nobody notices until someone asks why their merge isn't live."
GIT_NEW_HTML = "A deploy pipeline pointed at a branch that no longer exists doesn't complain, it just stops shipping, and nobody notices until someone asks why their merge isn't live. If a Kloudbean deployment is connected to that branch, deployment history and live build logs distinguish a missing push from a failed build."


def replace_once(text, old, new, path):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one occurrence of {old!r}, found {count}")
    return text.replace(old, new, 1)


def update_pair(slug, transforms):
    base = os.path.join(ROOT, slug)
    md_path = os.path.join(base, f"{slug}.md")
    html_path = os.path.join(base, f"{slug}.html")
    md = io.open(md_path, encoding="utf-8").read()
    html = io.open(html_path, encoding="utf-8").read()
    for old, new in transforms:
        md = replace_once(md, f"## {old}", f"## {new}", md_path)
        html = replace_once(html, f"<h2>{old}</h2>", f"<h2>{new}</h2>", html_path)
    io.open(md_path, "w", encoding="utf-8").write(md)
    io.open(html_path, "w", encoding="utf-8").write(html)


for slug, transforms in ALL_HEADING_FIXES.items():
    update_pair(slug, transforms)

# Convert the Upstash article's explicit hand-off into a factual boundary between
# architecture models, retaining the useful comparison without sending readers away.
slug = "upstash-alternative"
base = os.path.join(ROOT, slug)
for suffix, old, new in [("md", HANDOFF_OLD, HANDOFF_NEW), ("html", HANDOFF_OLD, HANDOFF_NEW)]:
    path = os.path.join(base, f"{slug}.{suffix}")
    text = io.open(path, encoding="utf-8").read()
    io.open(path, "w", encoding="utf-8").write(replace_once(text, old, new, path))

# Integrate the product context into the section where branch deletion affects a
# deployment, so the Git article has two relevant product mentions instead of a lone
# end-of-article product block.
slug = "git-delete-and-rename-branch"
base = os.path.join(ROOT, slug)
for suffix, old, new in [("md", GIT_OLD_MD, GIT_NEW_MD), ("html", GIT_OLD_HTML, GIT_NEW_HTML)]:
    path = os.path.join(base, f"{slug}.{suffix}")
    text = io.open(path, encoding="utf-8").read()
    io.open(path, "w", encoding="utf-8").write(replace_once(text, old, new, path))

print(f"Updated {len(ALL_HEADING_FIXES)} article pairs plus the Git product-placement pair.")
