# -*- coding: utf-8 -*-
"""Break the cross-article template fingerprints in the UNPUBLISHED library.

    python3 scripts/break-template-patterns.py --dry     # report only
    python3 scripts/break-template-patterns.py           # write

The problem: 138 articles shared the H2 "Related reading", 39 shared "Where hosting
fits, honestly", 38 shared "The honest limits", and a handful of sentences were
pasted into a dozen articles each. Individually every article passes its gates; the
library still reads as machine-produced, because the tell only exists across
articles.

The approach matters. Swapping one stock heading for a pool of ten just builds a
smaller template. So each replacement is derived from THAT article's own subject,
taken from its H1, and a global uniqueness ledger refuses to hand the same string to
two articles. Frames that read badly with a long subject fall back to subject-free
phrasings, and the run fails loudly if it cannot make a heading unique.

Live articles are never touched.
"""
import io, os, re, sys, json, hashlib

ROOT = "content-studio"
DRY = "--dry" in sys.argv

# ---------------------------------------------------------------- published set
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

# ---------------------------------------------------------------- subject
STRIP_LEAD = [
    "how to ", "how do i ", "what is ", "what are ", "what's ", "why ", "when ",
    "the complete guide to ", "a complete guide to ", "guide to ", "fixing ", "fix ",
]


def subject_of(text, slug):
    m = re.search(r"^#\s+(.+?)\s*$", text, re.M)
    h1 = m.group(1) if m else slug.replace("-", " ")
    h1 = re.split(r"\s*[:\u2014\u2013]\s*|\s*\?\s*", h1)[0].strip(" .?")
    low = h1.lower()
    for p in STRIP_LEAD:
        if low.startswith(p):
            h1 = h1[len(p):]
            break
    h1 = re.sub(r"^(a|an|the)\s+", "", h1, flags=re.I).strip()
    # keep acronyms and product names as written, lowercase ordinary opening words
    if h1[:1].isupper() and not h1.split()[0].isupper() and h1.split()[0] not in (
            "Kloudbean", "WordPress", "WooCommerce", "MariaDB", "PostgreSQL", "MySQL",
            "Redis", "MongoDB", "Nuxt", "Next", "Django", "Laravel", "Celery", "Docker"):
        h1 = h1[0].lower() + h1[1:]
    return h1


# ---------------------------------------------------------------- heading frames
# {s} is the article subject. Frames without {s} are the fallback when a subject is
# too long to read well inside a heading.
FRAMES = {
    "Related reading": [
        "Threads worth pulling", "Same neighbourhood", "Still stuck?", "If the fix did not hold", "One layer out", "Keep going", "The follow-on questions", "Where else this shows up", "Worth a look afterwards", "For the next time", "Connected problems", "Two doors along", "If this was not it", "Read on, if it recurs", "The rest of the trail", "Other symptoms, same cause", "Before this bites again", "Elsewhere in the stack", "When the obvious fix fails", "A little further", "Also worth knowing", "Next in this area", "If you are debugging more than one thing", "Downstream of this",
        "More on {s}", "{s}, in more depth", "If {s} keeps coming back", "Around {s}", "Other angles on {s}", "{s} and what surrounds it", "When {s} is not the only issue", "Beyond {s}", "Further notes on {s}", "{s}: related failures", "If you came here for {s}", "After {s}", "Working past {s}", "{s} in a wider setup", "Things that sit next to {s}", "Once you have handled {s}", "{s} is rarely alone", "Same area, different problem", "Related to {s}", "If {s} was the easy part", "{s} and its neighbours", "Where {s} leads",
        "If {s} is only part of the problem", "Where to go from here",
        "Adjacent problems worth reading about", "What usually comes up next",
        "If you hit this again somewhere else", "The neighbouring problems",
        "Reading that picks up where this stops", "Follow the thread",
        "If {s} was the symptom, not the cause", "What to look at next",
        "Nearby, and worth knowing", "Once {s} is settled",
        "Take it further", "The next questions this raises",
        "If this was one of several problems", "Related failures and fixes",
        "Where this connects to the rest", "Other things that break the same way",
        "Deeper on {s}", "Before you close the tab",
        "If you are working through a list", "The wider picture",
        "Two or three things worth reading next", "Loose ends",
    ],
    "Where hosting fits, honestly": [
        "{s} and the server underneath", "How the platform touches {s}", "What the host contributes to {s}", "{s} in a hosted environment", "Server-side of {s}", "Where the host owns part of {s}", "{s}, once it leaves your laptop", "The platform and {s}", "What hosting changes about {s}", "{s} on somebody else's machine", "Running {s} in production", "{s} and who maintains the box",
        "What the host actually decides here", "Which part of this is the host's job",
        "How much of {s} is a hosting question", "Where the platform enters the picture",
        "What changes once this is in production", "The hosting side of {s}",
        "Does your host matter for this?", "What a host can and cannot fix here",
        "Where infrastructure meets {s}", "The part that is not your code",
        "What the platform is responsible for", "Hosting, and what it does not solve",
        "Where the server comes into it", "What running this somewhere real involves",
        "The infrastructure question underneath", "Whose problem is this, exactly",
        "What production adds to {s}", "Where this stops being a code problem",
    ],
    "Where hosting fits": [
        "{s} needs a server that behaves", "What the box must do for {s}", "{s}, hosted", "The platform requirements for {s}", "{s} and the environment it runs in", "Server expectations for {s}", "Getting {s} into production", "{s} beyond the dev machine",
        "What running this in production needs", "The platform's share of the work",
        "Where the server matters for {s}", "What the host has to get right",
        "Infrastructure, briefly", "The operational half of {s}",
        "What you need underneath this", "Where this meets the server",
        "What has to be true of your host", "The environment this expects",
        "Running it somewhere real", "What the box needs to provide",
    ],
    "The honest limits": [
        "Where {s} stops helping", "{s} will not fix everything", "The limits of {s}", "What {s} leaves on your plate", "{s}: the caveats", "Where {s} runs into trouble", "What {s} cannot do", "{s} has edges", "The cost of {s}", "When {s} is not enough",
        "What this does not cover", "Where this approach runs out",
        "The caveats worth knowing", "What can still go wrong",
        "Limits worth naming", "Where this stops working",
        "What is still your problem", "The trade-offs you are accepting",
        "Before you rely on this", "What this will not fix",
        "Where {s} gets harder", "The edges of this approach",
        "What to watch for afterwards", "When this is the wrong answer",
        "The parts nobody automates", "What remains unsolved",
        "Where the simple version breaks", "Known rough edges",
    ],
    "How it fits the rest of your stack": [
        "{s} and the rest of the stack", "Fitting {s} into what you already run", "{s} alongside everything else", "What {s} touches elsewhere", "{s} in context", "Where {s} meets your other choices",
        "Where this sits in the wider stack", "How {s} connects to everything else",
        "The rest of the picture", "What this touches",
        "Reading around {s}", "How this lines up with the rest",
        "The pieces either side of this", "What else this decision affects",
        "Where this fits with the rest of your setup", "Neighbouring decisions",
    ],
    "A quick way to decide": [
        "Choosing on {s}, fast", "{s}: the quick call", "Deciding about {s} without ceremony", "The short answer on {s}",
        "Deciding without a spreadsheet", "The short decision",
        "How to choose in a minute", "A rule of thumb for {s}",
        "Picking one, quickly", "If you only have a minute",
        "The decision, compressed",
    ],
    "The honest boundary": [
        "{s}: yours or theirs", "Who owns {s}", "Responsibility for {s}", "The line around {s}",
        "What is yours and what is not", "Drawing the line",
        "Who owns what here", "The division of responsibility",
        "What managed does not mean", "Where responsibility changes hands",
    ],
    "Where people get this wrong": [
        "How {s} usually goes wrong", "The {s} mistake", "What people assume about {s}", "{s}, misread",
        "The common mistake", "What usually goes wrong first",
        "The mistake worth avoiding", "Where {s} trips people up",
        "The wrong turn most people take", "A failure mode to know about",
    ],
}

# ---------------------------------------------------------------- sentence frames
SENTENCES = {
    "Managed covers the server, the stack, TLS, backups, and patching.": [
        "The platform owns the server, the stack, TLS, backups and patching.",
        "Server, stack, TLS, backups and patching sit with the platform.",
        "TLS, patching, backups and the stack itself are handled for you.",
        "What is handled: the operating system, the stack, certificates, backups and patches.",
        "The box, its stack, its certificates and its backups are somebody else's rota.",
        "Patching, TLS renewal, backups and stack upkeep are not on your list.",
        "The managed part is the machine and everything under your code.",
        "Certificates, patches, backups and the stack come with the platform.",
    ],
    "WordPress and WooCommerce are one-click, and so are Laravel, Magento, Drupal, and Joomla.":
    [
        "WordPress, WooCommerce, Laravel, Magento, Drupal and Joomla all launch from a tile.",
        "The PHP stacks are one-click: WordPress, WooCommerce, Laravel, Magento, Drupal, Joomla.",
        "One-click covers WordPress and WooCommerce, plus Laravel, Magento, Drupal and Joomla.",
        "Launching WordPress, WooCommerce, Laravel, Magento, Drupal or Joomla is a tile, not a build.",
        "There are one-click stacks for WordPress, WooCommerce, Laravel, Magento, Drupal and Joomla.",
        "PHP applications from WordPress to Magento launch without hand-building the stack.",
    ],
    "A backup you've never restored is a hope, not a plan.": [
        "An untested backup is a guess wearing a plan's clothes.",
        "You do not have backups until you have completed a restore.",
        "A backup nobody has restored is an assumption.",
        "Restores are the feature; backups are just the prerequisite.",
        "Until you have restored one, you have files, not a recovery plan.",
    ],
    "A **raw VPS** hands you a bare Linux box.": [
        "A **raw VPS** gives you Linux and a root password, and stops there.",
        "With a **raw VPS** you get an empty machine and the whole to-do list.",
        "A **raw VPS** is a blank server: nothing installed, nothing decided.",
        "Rent a **raw VPS** and you own every layer from the kernel up.",
    ],
    "If you've ever lost a change to a bad plugin update, you know why that matters.": [
        "Anyone who has watched a plugin update take a site down already knows why.",
        "One bad update is usually all it takes to learn this the hard way.",
        "If an update has ever cost you an afternoon, the reason is obvious.",
        "It matters most the first time an update goes sideways.",
    ],
}

# ---------------------------------------------------------------- run
articles = []
for slug in sorted(os.listdir(ROOT)):
    d = os.path.join(ROOT, slug)
    md = os.path.join(d, slug + ".md")
    if os.path.isdir(d) and os.path.exists(md):
        articles.append(slug)

targets = [s for s in articles if s not in published]
print(f"{len(articles)} articles, {len(targets)} unpublished (live are skipped)\n")

used_head, used_sent = set(), set()
# Seed the ledger from EVERY article's current headings, live and unpublished, minus
# the burned ones we are about to replace. Seeding from live articles alone meant a
# second run could not see the headings the first run had already handed out, and
# would happily assign a duplicate.
for slug in articles:
    t = io.open(os.path.join(ROOT, slug, slug + ".md"), encoding="utf-8").read()
    for h in re.findall(r"^##\s+(.+?)\s*$", t, re.M):
        h = h.strip()
        if h not in FRAMES:
            used_head.add(h)


def pick(frames, subject, used, slug, key):
    """Deterministic per-slug rotation, first option that is still unclaimed."""
    order = int(hashlib.md5((slug + key).encode()).hexdigest(), 16)
    n = len(frames)
    short = 2 <= len(subject) <= 40
    for i in range(n):
        f = frames[(order + i) % n]
        if "{s}" in f:
            if not short:
                continue
            cand = f.format(s=subject)
        else:
            cand = f
        if cand not in used:
            return cand
    return None


stats = {"heads": 0, "sents": 0, "files": 0}
failures = []
changed_slugs = []

for slug in targets:
    d = os.path.join(ROOT, slug)
    md_p = os.path.join(d, slug + ".md")
    ht_p = os.path.join(d, slug + ".html")
    md = io.open(md_p, encoding="utf-8").read()
    ht = io.open(ht_p, encoding="utf-8").read() if os.path.exists(ht_p) else None
    subject = subject_of(md, slug)
    o_md, o_ht = md, ht

    for burned, frames in FRAMES.items():
        if not re.search(r"^##[ \t]+" + re.escape(burned) + r"[ \t]*$", md, re.M):
            continue
        new = pick(frames, subject, used_head, slug, burned)
        if new is None:
            failures.append(f"{slug}: ran out of unique headings for '{burned}'")
            continue
        used_head.add(new)
        md = re.sub(r"^##[ \t]+" + re.escape(burned) + r"[ \t]*$", "## " + new, md, flags=re.M)
        if ht:
            ht = ht.replace(f"<h2>{burned}</h2>", f"<h2>{new}</h2>")
        stats["heads"] += 1

    for burned, variants in SENTENCES.items():
        if burned not in md:
            continue
        new = pick(variants, subject, used_sent, slug, burned)
        if new is None:
            continue
        used_sent.add(new)
        md = md.replace(burned, new)
        if ht:
            plain_old = burned.replace("**", "")
            plain_new = new.replace("**", "")
            ht = ht.replace(burned, new).replace(plain_old, plain_new)
            ht = ht.replace(burned.replace("**", "<strong>", 1).replace("**", "</strong>", 1),
                            new.replace("**", "<strong>", 1).replace("**", "</strong>", 1))
        stats["sents"] += 1

    if md != o_md or ht != o_ht:
        changed_slugs.append(slug)
        if not DRY:
            if md != o_md:
                io.open(md_p, "w", encoding="utf-8").write(md)
                stats["files"] += 1
            if ht is not None and ht != o_ht:
                io.open(ht_p, "w", encoding="utf-8").write(ht)
                stats["files"] += 1

print(f"headings rewritten : {stats['heads']}")
print(f"sentences rewritten: {stats['sents']}")
print(f"articles touched   : {len(changed_slugs)}")
print(f"files written      : {stats['files']}{'  (dry run)' if DRY else ''}")
if failures:
    print("\nFAILURES:")
    for f in failures:
        print("  ", f)
io.open("/tmp/slop-changed.txt", "w").write("\n".join(changed_slugs))
print("\nchanged slugs -> /tmp/slop-changed.txt")
