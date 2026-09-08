# -*- coding: utf-8 -*-
"""Find the template fingerprints that make a library read as machine-generated.

    python3 scripts/audit-template-slop.py            # summary
    python3 scripts/audit-template-slop.py --list     # name the articles

Why this exists: an individual article can pass every quality gate and the library
can still be obviously templated, because the tell is only visible ACROSS articles.
Nothing in the per-article validator or the scorecard can see it. The owner spotted
39 articles sharing one section heading and 16 sharing one boilerplate paragraph.

Thresholds are deliberately strict. A heading used by more than DUP_HEAD articles,
or a sentence repeated in more than DUP_SENT, is a fingerprint rather than a
coincidence. FAQ and the H1 are exempt: those are structural, not stylistic.
"""
import io, os, re, sys, json, collections

ROOT = "content-studio"
DUP_HEAD = 4          # same H2 in more than this many articles
DUP_SENT = 3          # same sentence in more than this many articles
MIN_SENT_WORDS = 9    # ignore short fragments like "Both are legitimate"
EXEMPT_HEADINGS = {"faq", "frequently asked questions"}

show_list = "--list" in sys.argv

published = set()
try:
    data = json.load(open(os.path.join(ROOT, "_published.json")))

    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                published.add(str(k)); walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
        elif isinstance(o, str):
            published.add(o)

    walk(data)
except Exception:
    pass

articles = []
for slug in sorted(os.listdir(ROOT)):
    md = os.path.join(ROOT, slug, slug + ".md")
    if os.path.isdir(os.path.join(ROOT, slug)) and os.path.exists(md):
        articles.append((slug, io.open(md, encoding="utf-8").read()))

heads = collections.defaultdict(list)
sents = collections.defaultdict(list)
for slug, text in articles:
    body = re.sub(r"^---.*?^---", "", text, flags=re.S | re.M)      # drop front matter
    body = re.sub(r"```.*?```", " ", body, flags=re.S)              # drop code
    # Drop the conversion block. A CTA is a designed, deliberately consistent
    # component (the owner reuses one verbatim across live posts), so it is not
    # the templated editorial prose this audit exists to catch.
    body = re.sub(r"<!--\s*cta:start\s*-->.*?<!--\s*cta:end\s*-->", " ", body, flags=re.S)
    body = re.sub(r"<!--.*?-->", " ", body, flags=re.S)             # drop author notes
    for h in re.findall(r"^##\s+(.+?)\s*$", body, re.M):
        if h.strip().lower() not in EXEMPT_HEADINGS:
            heads[h.strip()].append(slug)
    prose = "\n".join(l for l in body.splitlines() if not l.lstrip().startswith("#"))
    for raw in re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", prose)):
        s = raw.strip(" *_#>-")
        if len(s.split()) >= MIN_SENT_WORDS:
            sents[s].append(slug)


def state(slugs):
    live = [s for s in slugs if s in published]
    return f"{len(slugs):3} ({len(live):2} live)"


dup_heads = sorted(((h, v) for h, v in heads.items() if len(set(v)) > DUP_HEAD),
                   key=lambda kv: -len(set(kv[1])))
dup_sents = sorted(((s, v) for s, v in sents.items() if len(set(v)) > DUP_SENT),
                   key=lambda kv: -len(set(kv[1])))

print(f"scanned {len(articles)} articles, {len(published & {a for a, _ in articles})} live\n")
print(f"REPEATED SECTION HEADINGS  (more than {DUP_HEAD} articles)")
if not dup_heads:
    print("  none")
for h, slugs in dup_heads:
    u = sorted(set(slugs))
    print(f"  {state(u)}  {h}")
    if show_list:
        print("        " + ", ".join(u))

print(f"\nREPEATED SENTENCES  (more than {DUP_SENT} articles, {MIN_SENT_WORDS}+ words)")
if not dup_sents:
    print("  none")
for s, slugs in dup_sents:
    u = sorted(set(slugs))
    print(f"  {state(u)}  {s[:96]}{'...' if len(s) > 96 else ''}")
    if show_list:
        print("        " + ", ".join(u))

worst = (dup_heads[0][1] if dup_heads else []) and len(set(dup_heads[0][1]))
print(f"\nworst heading fingerprint: {worst or 0} articles")
print(f"total flagged headings: {len(dup_heads)} | flagged sentences: {len(dup_sents)}")
sys.exit(1 if (dup_heads or dup_sents) else 0)
