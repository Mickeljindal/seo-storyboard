#!/usr/bin/env python3
"""
Build a graded, cannibalisation-checked topic queue from the keyword exports.

    python3 scripts/build-topic-queue.py            # writes the queue
    python3 scripts/build-topic-queue.py --report   # prints a summary only

WHY THIS EXISTS
Writing at volume is bottlenecked on TOPICS, not on prose. The generator in
src/lib/content-engine.ts can write; what it cannot do is decide whether a page
should exist, whether we already own the intent, or what the real search demand
is. Inventing those is exactly what the drafting rules forbid. So this script
produces the one artefact that unlocks scale honestly: a queue where every entry
carries a real volume, a real difficulty, the keyword variants behind it, and the
nearest existing slugs so the cannibalisation judgement is traceable.

WHAT THE SCORE IS AND IS NOT
The score is a PRIORITISATION PROXY built from what can be computed: demand,
difficulty, cluster support, and topical business value. It deliberately does NOT
attempt information gain or linkability, because those cannot be derived from a
keyword row and pretending otherwise would put a number on the one thing that
needs a human. A high score means "look at this next", never "this is approved".

COVERAGE CHECK
Two passes, because token overlap alone is unreliable:
  1. Numeric: a bare status code like 429 shares no usable tokens with
     "429-too-many-requests", so codes are matched explicitly against slugs.
  2. Token overlap: most of the keyword's words appearing in one slug.
Both are heuristics. The queue records the nearest slugs so a human still reads
the neighbour's headings before writing, which is the actual rule.
"""
import csv, glob, json, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPORT = os.path.join(ROOT, "kloudgraph-semrush-export")
STUDIO = os.path.join(ROOT, "content-studio")
OUT_JSON = os.path.join(STUDIO, "_topic-queue.json")
OUT_MD = os.path.join(STUDIO, "_topic-queue.md")
GAP = "/tmp/allgap.csv"  # optional extra source, not tracked in the repo

MIN_VOL = 300
MAX_KD = 45
MIN_FAMILY_VOL = 500

# ---------------------------------------------------------------- existing work
slugs = sorted(
    d for d in os.listdir(STUDIO)
    if os.path.isdir(os.path.join(STUDIO, d)) and not d.startswith(("_", "."))
    and d != "assets" and os.path.isfile(os.path.join(STUDIO, d, f"{d}.html"))
)
slug_tokens = {s: set(s.split("-")) for s in slugs}
# every 3-digit number that appears in a slug, so numeric families resolve
slug_numbers = collections.defaultdict(list)
for s in slugs:
    for n in re.findall(r"\b\d{3}\b", s):
        slug_numbers[n].append(s)

# ---------------------------------------------------------------- filters
JUNK = re.compile(
    r"inurl:|allintitle:|allinurl:|site:|intitle:"
    r"|litchart|sparknotes|trailhead|lit chart"
    r"|xxx|porn|sex|hentai|nude|onlyfans|xnxx|xnx|cloudnestra"
    r"|gmail|youtube|facebook|instagram|instagre|tiktok|steam|whatsapp|telegram"
    r"|near me|affiliate|dropship|aliexpress|alibaba"
    r"|gtmetrix|sucuri|dnsmadeeasy|everlane|aws summit|career"
    r"|crashpad|snipping|screenshot|screen shot|print screen"
    r"|resume|salary|\bjobs?\b|\bcv\b"
    r"|weather|recipe|lyrics|\bmovie|watch online|unblocked"
    r"|^\d+[\d.,/ ]*$",
    re.I,
)
BRAND = re.compile(
    r"\b(cloudways|kinsta|heroku|netlify|pressable|wpvip|railway|render|vercel"
    r"|onrender|reder|rendeer|raiway|redlib|searng|paymenter|pyrodactyl|yamtrack"
    r"|formbricks|navidrone|dufs|controlr|whatomate|refferq|telecode"
    r"|pelican panel|cobalt|openlovable|open lovable)\b", re.I,
)
# Off-brand topical areas. Volume here is real and irrelevant to us.
OFF_TOPIC = re.compile(
    r"\b(cursive|cursiva|font|fonts|typeface|typography|calligraph|alphabet"
    r"|growth hacking|design trend|colour palette|color palette|logo"
    r"|find (someone|an?) email|email finder|people search|phone number"
    r"|instagram|linkedin|twitter|reddit karma"
    r"|news|trends 20|statistics 20)\b", re.I,
)
# On-brand signals. A keyword needs at least one of these to enter the queue.
ON_TOPIC = re.compile(
    r"\b(host|hosting|server|servers|vps|cloud|deploy|deployment|devops"
    r"|database|databases|mysql|postgres|postgresql|mariadb|redis|mongo|mongodb"
    r"|elasticsearch|sql|query|queries|index|indexes|schema|migration|backup"
    r"|http|https|error|err_|status code|nginx|apache|litespeed|proxy|reverse proxy"
    r"|dns|domain|nameserver|cname|ttl|ssl|tls|certificate|cert|https|handshake|sni"
    r"|wordpress|woocommerce|laravel|magento|drupal|joomla|php|wp-"
    r"|node|nodejs|npm|yarn|pnpm|express|react|vue|angular|next"
    r"|python|django|flask|fastapi|pip|venv|ruby|rails|java|golang|\bgo\b"
    r"|linux|ubuntu|debian|centos|ssh|scp|sftp|cron|systemd|bash|shell|chmod|chown"
    r"|permission|sudo|apt|yum|tar|gzip|grep|awk|sed|curl|wget"
    r"|git|github|gitlab|branch|merge|rebase|commit|ci/cd|pipeline"
    r"|docker|container|kubernetes|k8s"
    r"|cache|caching|cdn|load balanc|scaling|scale|uptime|latency|throughput"
    r"|performance|optimi[sz]|memory|cpu|swap|disk|ram"
    r"|security|firewall|header|auth|authentication|authori|token|jwt|oauth"
    r"|cors|csp|xss|csrf|ddos|fail2ban|compliance|gdpr|encryption"
    r"|smtp|email deliver|spf|dkim|dmarc|port"
    r"|api|rest|graphql|webhook|json|yaml|env|environment variable"
    r"|robots\.txt|sitemap|canonical|redirect|htaccess"
    r"|s3|object storage|bucket|vpc|subnet|firewall|ip address)\b", re.I,
)

def already_covered(kw):
    """Return the nearest existing slugs, or [] if the topic looks uncovered."""
    low = kw.lower()
    hits = []
    for n in re.findall(r"\b\d{3}\b", low):
        hits.extend(slug_numbers.get(n, []))
    toks = set(re.findall(r"[a-z0-9]+", low))
    if toks:
        for s, st in slug_tokens.items():
            inter = toks & st
            if len(inter) >= max(2, int(len(toks) * 0.6)):
                hits.append(s)
    return sorted(set(hits))

def neighbours(kw, limit=3):
    """Weaker signal than coverage: slugs sharing any two tokens, for context."""
    toks = set(re.findall(r"[a-z0-9]+", kw.lower()))
    scored = []
    for s, st in slug_tokens.items():
        c = len(toks & st)
        if c >= 2:
            scored.append((c, s))
    scored.sort(reverse=True)
    return [s for _, s in scored[:limit]]

# ---------------------------------------------------------------- load keywords
rows = {}

def add(kw, vol, kd, src):
    prev = rows.get(kw)
    if prev is None or vol > prev["vol"]:
        rows[kw] = {"kw": kw, "vol": vol, "kd": kd, "src": src}

for path in glob.glob(os.path.join(EXPORT, "*", "*organic.Positions*.csv")):
    comp = os.path.basename(os.path.dirname(path))
    try:
        with open(path, newline="", encoding="utf-8", errors="replace") as fh:
            for r in csv.DictReader(fh):
                kw = (r.get("Keyword") or "").strip()
                if not kw:
                    continue
                try:
                    add(kw, int(float(r.get("Search Volume") or 0)),
                        int(float(r.get("Keyword Difficulty") or 999)), comp)
                except ValueError:
                    continue
    except Exception as e:
        print(f"  !! {path}: {e}", file=sys.stderr)

if os.path.exists(GAP):
    with open(GAP, newline="", encoding="utf-8", errors="replace") as fh:
        for r in csv.reader(fh):
            if len(r) < 4 or not r[0].strip() or r[0].startswith("#"):
                continue
            try:
                add(r[0].strip(), int(float(r[2])), int(float(r[3])), "gap")
            except (ValueError, IndexError):
                continue

raw_total = len(rows)

# ---------------------------------------------------------------- filter
kept = []
for r in rows.values():
    k = r["kw"]
    if r["vol"] < MIN_VOL or r["kd"] > MAX_KD:
        continue
    if JUNK.search(k) or BRAND.search(k) or OFF_TOPIC.search(k):
        continue
    if not ON_TOPIC.search(k):
        continue
    cov = already_covered(k)
    if cov:
        continue
    r["neighbours"] = neighbours(k)
    kept.append(r)

# ---------------------------------------------------------------- cluster
STOP = re.compile(
    r"\b(how|to|what|is|does|do|why|when|where|fix|fixing|error|errors|code|codes"
    r"|the|a|an|in|on|for|of|my|your|and|or|with|from|not|no|it|its|best|top)\b")

def family_key(kw):
    k = kw.lower()
    nums = re.findall(r"\b\d{3}\b", k)
    if nums:
        return f"http-{nums[0]}"
    errs = re.findall(r"\b(err_[a-z_]+|pr_[a-z_]+|dns_probe[a-z_]*)\b", k)
    if errs:
        return errs[0]
    k = STOP.sub(" ", k)
    k = re.sub(r"[^a-z0-9]+", " ", k).strip()
    toks = [t for t in k.split() if len(t) > 2]
    return " ".join(sorted(set(toks))[:3]) if toks else k

fams = collections.defaultdict(lambda: {"vol": 0, "kd": 999, "kws": [], "neigh": set()})
for r in kept:
    f = fams[family_key(r["kw"])]
    f["vol"] += r["vol"]
    f["kd"] = min(f["kd"], r["kd"])
    f["kws"].append({"kw": r["kw"], "vol": r["vol"], "kd": r["kd"]})
    f["neigh"].update(r.get("neighbours", []))

# ---------------------------------------------------------------- score
MONEY = re.compile(r"\b(host|hosting|managed|migrat|alternative|vs|versus|price|pricing|cost|cheap|best)\b", re.I)
TECH = re.compile(r"\b(error|err_|fix|status code|http|nginx|apache|dns|ssl|database|deploy)\b", re.I)

def score(name, f):
    joined = " ".join(x["kw"] for x in f["kws"])
    # demand, 0-1, log-ish so a 100k family does not swamp everything
    demand = min(1.0, (f["vol"] / 20000) ** 0.5)
    # achievability, easier is better
    achv = max(0.0, min(1.0, (46 - f["kd"]) / 40))
    # cluster support: do we already have siblings to link from?
    auth = min(1.0, len(f["neigh"]) / 3)
    # business value by topical shape
    if MONEY.search(joined):
        biz = 1.0
    elif TECH.search(joined):
        biz = 0.65
    else:
        biz = 0.4
    # intent fit proxy: a family with several phrasings is a real intent
    intent = min(1.0, len(f["kws"]) / 6)
    total = 0.25 * biz + 0.20 * intent + 0.15 * achv + 0.10 * auth + 0.10 * demand
    # renormalise: the two components we refuse to guess (information gain and
    # linkability, 0.20 combined) are excluded rather than faked.
    return round(total / 0.80 * 100, 1)

queue = []
for name, f in fams.items():
    if f["vol"] < MIN_FAMILY_VOL:
        continue
    f["kws"].sort(key=lambda x: -x["vol"])
    queue.append({
        "family": name,
        "primary_keyword": f["kws"][0]["kw"],
        "family_volume": f["vol"],
        "min_kd": f["kd"],
        "keyword_count": len(f["kws"]),
        "keywords": f["kws"][:12],
        "nearest_existing_slugs": sorted(f["neigh"])[:5],
        "priority_score": score(name, f),
    })
queue.sort(key=lambda x: -x["priority_score"])

# ---------------------------------------------------------------- emit
if "--report" not in sys.argv:
    with open(OUT_JSON, "w", encoding="utf-8") as fh:
        json.dump({
            "generated_from": "kloudgraph-semrush-export organic.Positions"
                              + (" + gap export" if os.path.exists(GAP) else ""),
            "filters": {"min_volume": MIN_VOL, "max_kd": MAX_KD,
                        "min_family_volume": MIN_FAMILY_VOL},
            "existing_articles": len(slugs),
            "score_note": "Prioritisation proxy only. Information gain and "
                          "linkability are deliberately not scored, because they "
                          "cannot be derived from a keyword row. A high score "
                          "means look at this next, never approved.",
            "cannibalisation_note": "nearest_existing_slugs is a heuristic. Read "
                                    "the neighbour's H2 set before writing.",
            "topics": queue,
        }, fh, indent=1)

    lines = [
        "# Topic queue",
        "",
        f"Generated from the keyword exports. {len(slugs)} articles already exist.",
        f"Filters: volume >= {MIN_VOL}, KD <= {MAX_KD}, family volume >= {MIN_FAMILY_VOL}.",
        "",
        "`priority_score` is a **prioritisation proxy**, built only from demand,",
        "difficulty, cluster support, business shape and intent breadth. Information",
        "gain and linkability are deliberately unscored, because a keyword row cannot",
        "tell you either. A high score means look at this next, never approved.",
        "",
        "`nearest existing slugs` is a heuristic. **Read the neighbour's H2 set before",
        "writing.** That check has changed real decisions and it is not optional.",
        "",
        f"| # | Score | Volume | KD | Primary keyword | Nearest existing |",
        "|---|---|---|---|---|---|",
    ]
    for i, t in enumerate(queue[:250], 1):
        near = ", ".join(t["nearest_existing_slugs"][:2]) or "none found"
        lines.append(
            f"| {i} | {t['priority_score']} | {t['family_volume']:,} | {t['min_kd']} "
            f"| {t['primary_keyword']} | {near} |"
        )
    with open(OUT_MD, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")

# ---------------------------------------------------------------- summary
print(f"raw unique keywords          : {raw_total:,}")
print(f"survived all filters         : {len(kept):,}")
print(f"topic families (vol >= {MIN_FAMILY_VOL}) : {len(queue):,}")
print(f"  of those at KD <= 35       : {sum(1 for t in queue if t['min_kd'] <= 35):,}")
print(f"  with no nearest neighbour  : {sum(1 for t in queue if not t['nearest_existing_slugs']):,}")
print(f"combined queue volume        : {sum(t['family_volume'] for t in queue):,}")
if "--report" not in sys.argv:
    print(f"\nwrote {os.path.relpath(OUT_JSON, ROOT)}")
    print(f"wrote {os.path.relpath(OUT_MD, ROOT)}")
print(f"\n{'SCORE':>6} {'VOLUME':>8} {'KD':>4}  PRIMARY KEYWORD")
print("-" * 78)
for t in queue[:30]:
    print(f"{t['priority_score']:>6} {t['family_volume']:>8,} {t['min_kd']:>4}  {t['primary_keyword'][:56]}")
