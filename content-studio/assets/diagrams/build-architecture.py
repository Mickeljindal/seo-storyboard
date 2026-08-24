# -*- coding: utf-8 -*-
"""Build the Kloudbean architecture diagram.

    python3 content-studio/assets/diagrams/build-architecture.py

Writes kloudbean-architecture.html next to this script: one self-contained page
holding a single inline SVG, the real brand logos as <symbol>, and a PNG/SVG
export toolbar.

Rules for this asset:
  - technical audience: no benefit claims, no plan or pricing references, no CTA
  - never states a host count; co-location is shown by nesting, not asserted
  - no network calls at render time; every logo is embedded

Logo provenance
  logos/kloudbean-dark-horizontal.svg  official, kloudbean.com/wp-content/uploads/
                                       2024/11/Dark-Horizontal-Kloudbean-logo2x.svg
  logos/mariadb.svg, logos/cloudflare.svg   Simple Icons (CC0), vendor brand fills
  everything else                      kb-ui-for-claude/src/assets/images, the
                                       same assets the product console uses
Design tokens copied from kb-ui-for-claude/docs/01-DESIGN-TOKENS.md.
"""
import io, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
IMG = os.path.join(REPO, "kb-ui-for-claude", "src", "assets", "images")
OUT = os.path.join(HERE, "kloudbean-architecture.html")

W, H = 1240, 1072
NAVY, PURPLE, GREEN, SEC = "#000F27", "#4F1AF3", "#22c55f", "#6f6b99"
BORD, PAGE, MUT, INK = "#e5e5e5", "#f8f9fa", "#6b7280", "#3d3d3d"
DBG, CHR, AMB, SKY = "#15803d", "#b91c1c", "#b45309", "#0284c7"
F = "Poppins,system-ui,-apple-system,Segoe UI,Arial,sans-serif"
MONO = "JetBrains Mono,ui-monospace,Menlo,Consolas,monospace"

LOGOS = {
    "kb":         os.path.join(HERE, "logos", "kloudbean-dark-horizontal.svg"),
    "nginx":      os.path.join(IMG, "providers", "nginx_colored.svg"),
    "varnish":    os.path.join(IMG, "providers", "varsnish_colored.svg"),
    "apache":     os.path.join(IMG, "providers", "apache_colored.svg"),
    "php":        os.path.join(IMG, "providers", "php_colored.svg"),
    "redis":      os.path.join(IMG, "providers", "redis_colored.svg"),
    "git":        os.path.join(IMG, "providers", "app-git-light.svg"),
    "bitninja":   os.path.join(IMG, "application-settings", "bitninja_light.svg"),
    "mariadb":    os.path.join(HERE, "logos", "mariadb.svg"),
    "cloudflare": os.path.join(HERE, "logos", "cloudflare.svg"),
    "gcloud":     os.path.join(HERE, "logos", "googlecloud.svg"),
}

symbols, VB, SAVED = [], {}, {}
for key, path in LOGOS.items():
    raw = io.open(path, encoding="utf-8").read()
    raw = re.sub(r"<\?xml.*?\?>", "", raw, flags=re.S)
    raw = re.sub(r"<!DOCTYPE.*?>", "", raw, flags=re.S)
    raw = re.sub(r"<!--.*?-->", "", raw, flags=re.S)
    root = re.search(r"<svg[^>]*>", raw, flags=re.S).group(0)
    vb = re.search(r'viewBox="([^"]+)"', root)
    if vb:
        vbs = vb.group(1)
    else:
        w = re.search(r'width="([\d.]+)', root).group(1)
        h = re.search(r'height="([\d.]+)', root).group(1)
        vbs = f"0 0 {w} {h}"
    inner = raw[raw.index(root) + len(root):raw.rindex("</svg>")]
    inner = re.sub(r"<title>.*?</title>", "", inner, flags=re.S)

    def _round(m):
        v = round(float(m.group(0)), 2)
        return str(int(v)) if v == int(v) else str(v)

    before = len(inner)
    inner = re.sub(r"-?\d+\.\d{3,}", _round, inner)      # 2dp is lossless at 16-30px
    inner = re.sub(r"\s+", " ", inner).strip()
    SAVED[key] = (before, len(inner))
    n = [float(x) for x in vbs.replace(",", " ").split()]
    VB[key] = (n[2], n[3])
    symbols.append(f'<symbol id="lg-{key}" viewBox="{vbs}">{inner}</symbol>')

o = []
A = o.append


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def rect(x, y, w, h, r=12, fill="#fff", stroke=BORD, sw=1):
    A(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" '
      f'stroke="{stroke}" stroke-width="{sw}"/>')


def txt(x, y, t, size=11, fill=INK, weight="400", anchor="start", ls="", font=None):
    l = f' letter-spacing="{ls}"' if ls else ""
    A(f'<text x="{x}" y="{y}" font-family="{font or F}" font-size="{size}" fill="{fill}" '
      f'font-weight="{weight}" text-anchor="{anchor}"{l}>{esc(t)}</text>')


def logo(key, cx, cy, h):
    w0, h0 = VB[key]
    w = h * (w0 / h0)
    A(f'<use href="#lg-{key}" x="{cx-w/2:.1f}" y="{cy-h/2:.1f}" width="{w:.1f}" height="{h}"/>')
    return w


def pill(cx, cy, t, size=9.5, fill=PURPLE, color="#fff", pad=13, ls="0.8"):
    w = len(t) * (size * 0.62) + pad * 2
    rect(cx - w / 2, cy - 11, w, 22, 11, fill, fill)
    txt(cx, cy + 4, t, size, color, "700", "middle", ls)


def porttag(cx, cy, t):
    w = len(t) * 5.6 + 12
    rect(cx - w / 2, cy - 8, w, 16, 8, "#fff", BORD)
    txt(cx, cy + 4, t, 8.6, SEC, "500", "middle", font=MONO)


def lane(x, y, w, h, label, label_fill=PURPLE, r=16, fill="#fdfdff", stroke="#dfe3f2"):
    """Grouping box with a pill straddling the top edge. Only for regions that
    nothing points into, since the pill would sit under an incoming arrowhead."""
    rect(x, y, w, h, r, fill, stroke, 1.3)
    lw = len(label) * (9.5 * 0.62) + 26
    pill(x + 18 + lw / 2, y, label, 9.5, label_fill)


def panel(x, y, w, h, label, label_col, r=16):
    """Box with the label set INSIDE at top left, leaving the top edge clear for
    incoming connectors. The straddling-pill version put the tier labels exactly
    where the data arrows terminate, so arrowheads landed on the text."""
    rect(x, y, w, h, r, "#fdfdff", "#dfe3f2", 1.3)
    A(f'<rect x="{x+20}" y="{y+13}" width="4" height="14" rx="2" fill="{label_col}"/>')
    txt(x + 32, y + 25, label, 9.4, label_col, "700", "start", "1.1")


CX = 620
# aria-label rather than <title>: a <title> child makes the browser show a native
# tooltip on hover, which covered the NGINX node. <desc> carries the detail without
# rendering anything.
A(f'<svg id="kbsvg" viewBox="0 0 {W} {H}" width="100%" xmlns="http://www.w3.org/2000/svg" '
  f'xmlns:xlink="http://www.w3.org/1999/xlink" font-family="{F}" role="img" '
  f'aria-label="Kloudbean hosting architecture, technical reference" '
  f'aria-describedby="kbD">')
A('<desc id="kbD">Cloudflare provides DNS, CDN and DDoS protection. Traffic arrives over '
  'HTTPS on port 443 at NGINX, which reverse proxies and load balances. A cache hit is '
  'served by Varnish; a cache miss is passed to Apache, which hands execution to PHP-FPM. '
  'Applications sit in the same compute engine, each in an isolated environment with its '
  'own Git repository, PHP-FPM worker pool and system user. Applications connect to MariaDB '
  'over tcp 3306 and to Redis over tcp 6379. Application data and database dumps are backed '
  'up off-site to Google Cloud Storage, where every application and the database each get '
  'their own isolated bucket. BitNinja enforces security at the compute engine boundary.</desc>')
A("<defs>")
A("".join(symbols))
for n, c in (("ap", PURPLE), ("ag", DBG), ("ar", CHR), ("aa", AMB), ("as", SEC),
             ("ab", SKY)):
    A(f'<marker id="{n}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" '
      f'markerHeight="6.5" orient="auto-start-reverse">'
      f'<path d="M0 0 L10 5 L0 10 z" fill="{c}"/></marker>')
A('<filter id="sh" x="-20%" y="-20%" width="140%" height="150%">'
  '<feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0b1220" flood-opacity="0.10"/></filter>')
A('<linearGradient id="gnav" x1="0" y1="0" x2="0" y2="1">'
  '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#fbfaff"/></linearGradient>')
A("</defs>")
A(f'<rect width="{W}" height="{H}" fill="{PAGE}"/>')

# ----------------------------------------------------------------- layout
# One block, so the vertical rhythm is decided in one place and nothing is
# nudged locally. Every gap below has a minimum and is asserted at the end of
# this file. Sibling nodes sit GAP apart, major regions GAP_L apart, and any
# edge an arrow terminates on is kept clear of labels.
PAD, GAP, GAP_L, BAR = 24, 26, 42, 22

CF_Y, CF_H = 24, 70                     # Cloudflare
BADGE_Y = CF_Y + CF_H + 22              # HTTPS 443 badge
LX, LY, LW, LH = 120, 176, 1000, 440    # compute engine lane
NY, NH = LY + PAD, 60                   # NGINX
ROUTE_Y = NY + NH + GAP                 # branch horizontal run
PILL_Y = ROUTE_Y + 18                   # branch label, interrupts the drop
VY, VW, VH = PILL_Y + 11 + 15, 160, 84  # Varnish / Apache
VCX, ACX = CX - 100, CX + 100           # branch centres, symmetric about CX
PX, PY, PW, PH = LX + 16, VY + VH + GAP, LW - 32, 156   # applications lane
CY, CH, CW = PY + 28, 96, 210           # application cards
CAP_Y = CY + CH + 18                    # isolation caption baseline
TAG_Y = LY + LH + 20                    # port tag on the data connectors
TY, TH = LY + LH + GAP_L, 130           # row 1: database and cache tiers
BK_TAG_Y = TY + TH + 28                 # label on the backup connectors
R2Y, R2H = TY + TH + 56, 118            # row 2: off-site backup
GY, GH = R2Y + R2H + 30, 56             # legend
BX, BY, BW, BH = 930, CF_Y, 190, 128    # BitNinja panel

# header: official dark horizontal logo
kbw = logo("kb", 24 + 138 / 2, 40, 28)
txt(24, 78, "Hosting architecture", 16.5, NAVY, "600")
txt(24, 97, "Request path, application isolation and data-tier connections", 10.2, MUT)

# Cloudflare
A('<g filter="url(#sh)">')
rect(CX - 180, CF_Y, 360, CF_H, 14, "url(#gnav)", "#dfe3f2")
A('</g>')
logo("cloudflare", CX - 82, CF_Y + 28, 24)
txt(CX - 62, CF_Y + 33, "CLOUDFLARE", 14.5, NAVY, "700", "start", "1.2")
txt(CX, CF_Y + 55, "DNS  ·  CDN  ·  DDoS protection", 9.6, MUT, "400", "middle")
A(f'<line x1="{CX}" y1="{CF_Y+CF_H}" x2="{CX}" y2="{BADGE_Y}" stroke="{SEC}" stroke-width="1.6"/>')
rect(CX - 48, BADGE_Y, 96, BAR, 11, "#eafbf0", "#bfe9cd")
A(f'<rect x="{CX-35}" y="{BADGE_Y+9}" width="10" height="7" rx="1.6" fill="{DBG}"/>')
A(f'<path d="M{CX-33} {BADGE_Y+9}v-3a3 3 0 0 1 6 0v3" fill="none" stroke="{DBG}" stroke-width="1.3"/>')
txt(CX + 7, BADGE_Y + 16, "HTTPS 443", 9.6, DBG, "700", "middle", font=MONO)
A(f'<line x1="{CX}" y1="{BADGE_Y+BAR}" x2="{CX}" y2="{LY}" stroke="{SEC}" stroke-width="1.6" marker-end="url(#as)"/>')

# BitNinja
A('<g filter="url(#sh)">')
rect(BX, BY, BW, BH, 14, "#fff", BORD)
A('</g>')
logo("bitninja", BX + 32, BY + 30, 26)
txt(BX + 52, BY + 35, "BITNINJA", 12.5, NAVY, "700", "start", "0.6")
for i, t in enumerate(["Server security layer", "WAF", "Malware scanning", "Continuous monitoring"]):
    y = BY + 60 + i * 18
    A(f'<path d="M{BX+16} {y-3}l3.2 3.2 5.6-5.6" fill="none" stroke="{GREEN}" stroke-width="1.9" '
      f'stroke-linecap="round" stroke-linejoin="round"/>')
    txt(BX + 30, y + 1, t, 9.8, INK)

# compute engine
lane(LX, LY, LW, LH, "COMPUTE ENGINE", NAVY)
# straight drop onto the compute lane top edge: the previous elbow ran along the
# outside of the lane and read as if it were pointing at nothing in particular
A(f'<line x1="{BX+BW/2}" y1="{BY+BH}" x2="{BX+BW/2}" y2="{LY}" stroke="{SEC}" '
  f'stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#as)" opacity=".85"/>')
rect(LX + 14, LY + 24, 128, 74, 10, "#f6f7fb", BORD)
A(f'<rect x="{LX+28}" y="{LY+36}" width="20" height="20" rx="5" fill="{PURPLE}" opacity=".14"/>')
A(f'<rect x="{LX+33}" y="{LY+41}" width="10" height="10" rx="2" fill="{PURPLE}"/>')
txt(LX + 54, LY + 50, "OS + stack", 9.4, NAVY, "600")
txt(LX + 24, LY + 72, "kernel, packages,", 9, MUT)
txt(LX + 24, LY + 85, "TLS termination", 9, MUT)

A('<g filter="url(#sh)">')
rect(CX - 140, NY, 280, NH, 12, "url(#gnav)", "#cdd7f5")
A('</g>')
logo("nginx", CX, NY + 24, 21)
txt(CX, NY + 50, "reverse proxy · load balancer", 9.4, MUT, "400", "middle")

# The branch label interrupts the vertical drop, the same idiom as the HTTPS 443
# badge. Drawing the pill across the horizontal run instead hides the line and the
# arrowhead, so keep the run above the pill and the arrow below it.
ROUTE_Y, PILL_Y = 286, 304
for cx, col, mk in ((VCX, DBG, "ag"), (ACX, AMB, "aa")):
    A(f'<path d="M{CX} {NY+NH} V {ROUTE_Y} H {cx} V {PILL_Y-11}" fill="none" '
      f'stroke="{col}" stroke-width="1.7"/>')
    A(f'<line x1="{cx}" y1="{PILL_Y+11}" x2="{cx}" y2="{VY}" stroke="{col}" '
      f'stroke-width="1.7" marker-end="url(#{mk})"/>')
pill(VCX, PILL_Y, "CACHE HIT", 8.8, "#eafbf0", DBG, 11)
pill(ACX, PILL_Y, "CACHE MISS", 8.8, "#fff5e8", AMB, 11)
rect(VCX - VW / 2, VY, VW, VH, 12)
logo("varnish", VCX, VY + 26, 30)
txt(VCX, VY + 58, "HTTP accelerator,", 9.2, MUT, "400", "middle")
txt(VCX, VY + 72, "serves cached response", 9.2, MUT, "400", "middle")
rect(ACX - VW / 2, VY, VW, VH, 12)
logo("apache", ACX, VY + 26, 30)
txt(ACX, VY + 58, "web server, passes", 9.2, MUT, "400", "middle")
txt(ACX, VY + 72, "execution to PHP-FPM", 9.2, MUT, "400", "middle")

# straight drop from Apache: the elbowed version left only 12px for a 12px arrowhead
A(f'<line x1="{ACX}" y1="{VY+VH}" x2="{ACX}" y2="{PY}" stroke="{PURPLE}" '
  f'stroke-width="1.8" marker-end="url(#ap)"/>')
lane(PX, PY, PW, PH, "APPLICATIONS  ·  ISOLATED ENVIRONMENT PER APP",
     PURPLE, 14, "#f4f6fb", "#d7ddf0")

CARDS = [152, 374, 596, 858]
for i, cx in enumerate(CARDS):
    label = "app n" if i == 3 else f"app {i+1}"
    A('<g filter="url(#sh)">')
    rect(cx, CY, CW, CH, 12, "#fff", BORD)
    A('</g>')
    A(f'<path d="M{cx} {CY+12}a12 12 0 0 1 12-12h{CW-24}a12 12 0 0 1 12 12v13H{cx}z" fill="{PURPLE}"/>')
    txt(cx + CW / 2, CY + 17, label, 10.6, "#fff", "600", "middle", "0.4", font=MONO)
    for j, (nm, key, ih) in enumerate([("git repo", "git", 17),
                                       ("php-fpm pool", "php", 20),
                                       ("system user", None, 0)]):
        chx = cx + 7 + j * 67
        rect(chx, CY + 32, 62, 50, 9, "#fcfcfe", BORD)
        if key:
            logo(key, chx + 31, CY + 48, ih)
        else:
            A(f'<circle cx="{chx+31}" cy="{CY+44}" r="4.8" fill="{PURPLE}"/>')
            A(f'<path d="M{chx+22} {CY+58}c0-4.8 4-7.8 9-7.8s9 3 9 7.8z" fill="{PURPLE}"/>')
        txt(chx + 31, CY + 76, nm, 8, SEC, "400", "middle", font=MONO)
    # No MariaDB or Redis chip here on purpose. Putting one inside every card
    # asserts an instance per application, which is not a claim this diagram
    # makes. The shared data tiers below carry that relationship instead.
for k in range(3):
    A(f'<circle cx="{824 + k*9}" cy="{CY+66}" r="3" fill="{SEC}" opacity=".5"/>')
txt(PX + PW - 16, CAP_Y,
    "dedicated system user · filesystem permissions · own worker pool", 8.6, SEC, "400", "end")

# ------------------------------------------------------------- data tiers
# Two rows. Row 1 holds the live data services, row 2 the off-site backup target,
# so both the applications lane and the database layer have somewhere to point.
GUT = 14                                 # gutter between the row-1 panels
DBW = (LW - GUT) / 2
DBX = LX
CHX, CHW = LX + DBW + GUT, DBW
panel(DBX, TY, DBW, TH, "DATABASE LAYER", DBG)
panel(CHX, TY, CHW, TH, "CACHE LAYER", CHR)

# Two connectors rather than one per application. Eight dashed lines crossing
# each other's channels was noise, and it also implied a per-app database and
# cache, which is not a claim this diagram makes.
for cx, col, mk, tag in ((DBX + DBW / 2, DBG, "ag", "tcp/3306"),
                         (CHX + CHW / 2, CHR, "ar", "tcp/6379")):
    A(f'<line x1="{cx}" y1="{PY+PH}" x2="{cx}" y2="{TAG_Y-8}" stroke="{col}" '
      f'stroke-width="1.5" stroke-dasharray="4 4"/>')
    A(f'<line x1="{cx}" y1="{TAG_Y+8}" x2="{cx}" y2="{TY}" stroke="{col}" '
      f'stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#{mk})"/>')
    porttag(cx, TAG_Y, tag)

NODE_Y, NODE_H = TY + 38, 74
rect(DBX + 30, NODE_Y, DBW - 60, NODE_H, 11, "#eafbf0", "#cfe9d8")
logo("mariadb", DBX + DBW / 2 - 44, NODE_Y + 22, 26)
txt(DBX + DBW / 2 - 26, NODE_Y + 28, "MariaDB", 15, DBG, "700", "start")
txt(DBX + DBW / 2, NODE_Y + 50, "relational data, reached", 9.2, MUT, "400", "middle")
txt(DBX + DBW / 2, NODE_Y + 64, "over tcp/3306", 9.2, MUT, "400", "middle")

rect(CHX + 30, NODE_Y, CHW - 60, NODE_H, 11, "#fdeef0", "#f5c9cb")
logo("redis", CHX + CHW / 2 - 40, NODE_Y + 22, 28)
txt(CHX + CHW / 2 - 20, NODE_Y + 28, "Redis", 15, CHR, "700", "start")
txt(CHX + CHW / 2, NODE_Y + 50, "sessions, objects, queues,", 9.2, MUT, "400", "middle")
txt(CHX + CHW / 2, NODE_Y + 64, "reached over tcp/6379", 9.2, MUT, "400", "middle")

# ------------------------------------------------- row 2: off-site GCS backup
panel(LX, R2Y, LW, R2H, "OFF-SITE BACKUP", SKY)
logo("gcloud", LX + 152, R2Y + 20, 17)
txt(LX + 166, R2Y + 25, "Google Cloud Storage", 9.4, SEC, "600", "start", "0.4")

# Backup connectors: applications come down the row-1 gutter, the database layer
# comes straight down out of its own panel. Both are labelled on the way.
for x0, y0, tag in ((CHX - GUT / 2, PY + PH, "app data"),
                    (DBX + DBW / 2, TY + TH, "database dumps")):
    A(f'<line x1="{x0}" y1="{y0}" x2="{x0}" y2="{BK_TAG_Y-8}" stroke="{SKY}" '
      f'stroke-width="1.5" stroke-dasharray="5 4"/>')
    A(f'<line x1="{x0}" y1="{BK_TAG_Y+8}" x2="{x0}" y2="{R2Y}" stroke="{SKY}" '
      f'stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#ab)"/>')
    porttag(x0, BK_TAG_Y, tag)

# one isolated bucket per source
BK_N = 5
BK_GAP = 28
BK_W = (LW - 48 - (BK_N - 1) * BK_GAP) / BK_N
BK_Y, BK_H = R2Y + 38, 64
for j, name in enumerate(["app 1", "app 2", "app 3", "app n", "database"]):
    bx = LX + 24 + j * (BK_W + BK_GAP)
    rect(bx, BK_Y, BK_W, BK_H, 10, "#f0f9ff", "#bae0f5")
    # bucket glyph: tapered body with a rim
    gx, gy = bx + 22, BK_Y + 16
    A(f'<path d="M{gx-9} {gy}h18l-2.4 15.5a2 2 0 0 1-2 1.7h-9.2a2 2 0 0 1-2-1.7z" '
      f'fill="{SKY}" opacity=".18"/>')
    A(f'<path d="M{gx-9} {gy}h18l-2.4 15.5a2 2 0 0 1-2 1.7h-9.2a2 2 0 0 1-2-1.7z" '
      f'fill="none" stroke="{SKY}" stroke-width="1.5"/>')
    A(f'<rect x="{gx-11}" y="{gy-4.5}" width="22" height="5" rx="2.2" fill="{SKY}"/>')
    txt(bx + 40, gy + 6, name, 9.6, NAVY, "600", "start", "0.3", font=MONO)
    txt(bx + 40, gy + 20, "isolated bucket", 8.2, SEC, "400", "start")

rect(LX, GY, LW, GH, 14, "#fff", BORD)
txt(LX + 20, GY + 22, "LEGEND", 8.8, SEC, "700", "start", "1.1")
LEG = [(PURPLE, None, "ap", "request path"),
       (DBG, "4 4", "ag", "database connection"),
       (CHR, "4 4", "ar", "cache connection"),
       (SKY, "5 4", "ab", "off-site backup"),
       (SEC, "5 4", "as", "security enforcement")]
for i, (col, dash, mk, lbl) in enumerate(LEG):
    x = LX + 100 + i * ((LW - 120) / len(LEG))
    da = f' stroke-dasharray="{dash}"' if dash else ""
    A(f'<line x1="{x}" y1="{GY+30}" x2="{x+46}" y2="{GY+30}" stroke="{col}" stroke-width="1.7"'
      f'{da} marker-end="url(#{mk})"/>')
    txt(x + 58, GY + 34, lbl, 9.6, INK)
txt(LX + 20, GY + 46, "ports shown as tcp/nnnn", 8.4, MUT)
A("</svg>")
svg = "\n".join(o)

# --------------------------------------------------------------- layout audit
# Every gap an arrow or a label depends on, asserted. This exists because the
# branch labels once sat directly on the lines they labelled, and the tier labels
# once sat exactly where the data arrows terminated. Both were invisible in the
# source and only showed up in the render.
def _check(label, actual, minimum):
    if actual < minimum:
        problems.append(f"{label}: {actual}px, needs {minimum}px")


problems = []
_check("cloudflare -> https badge", BADGE_Y - (CF_Y + CF_H), 16)
_check("https badge -> compute lane", LY - (BADGE_Y + BAR), 30)
_check("bitninja -> compute lane", LY - (BY + BH), 20)
_check("nginx -> branch run", ROUTE_Y - (NY + NH), 20)
_check("branch label -> box top", VY - (PILL_Y + 11), 14)
_check("varnish/apache -> apps lane", PY - (VY + VH), 20)
_check("apps lane top -> cards", CY - PY, 24)
_check("cards -> caption", CAP_Y - (CY + CH), 14)
_check("caption -> apps lane bottom", (PY + PH) - CAP_Y, 10)
_check("apps lane -> compute lane bottom", (LY + LH) - (PY + PH), 16)
_check("compute lane -> data tiers", TY - (LY + LH), 30)
_check("tier label -> node card", NODE_Y - (TY + 25), 8)
_check("row 1 -> backup label", (BK_TAG_Y - 8) - (TY + TH), 14)
_check("backup label -> row 2 (arrow)", R2Y - (BK_TAG_Y + 8), 18)
_check("backup label -> bucket row", BK_Y - (R2Y + 25), 8)
_check("buckets -> row 2 bottom", (R2Y + R2H) - (BK_Y + BK_H), 12)
_check("row 2 -> legend", GY - (R2Y + R2H), 24)
_check("legend -> canvas edge", H - (GY + GH), 16)

if not (PY > LY and PY + PH < LY + LH):
    problems.append("applications lane is not inside the compute lane")
if not (CY > PY and CY + CH < PY + PH):
    problems.append("application cards are not inside the applications lane")
for _cx in CARDS:
    if not (_cx >= PX + 8 and _cx + CW <= PX + PW - 8):
        problems.append(f"application card at x={_cx} breaks the lane bounds")
if not (LY + LH < TAG_Y - 8 and TAG_Y + 8 < TY):
    problems.append("port tag is not clear of the lane and tier edges")
# a tier label must never share a row with the arrowhead landing on that tier
for _x, _w in ((DBX, DBW), (CHX, CHW)):
    if abs((_x + _w / 2) - (_x + 32)) < 60:
        problems.append("tier label sits under the incoming connector")
# the applications backup line runs down the gutter, so it must miss both panels
_gut = CHX - GUT / 2
if not (DBX + DBW <= _gut <= CHX):
    problems.append("applications backup connector does not clear the row-1 panels")
# and it must miss the row-2 label and the bucket row
if abs(_gut - (LX + 32)) < 60:
    problems.append("backup connector lands on the row-2 label")
_last = LX + 24 + (BK_N - 1) * (BK_W + BK_GAP) + BK_W
if _last > LX + LW - 20:
    problems.append("bucket row overflows the backup panel")

if problems:
    raise SystemExit("LAYOUT PROBLEMS:\n  " + "\n  ".join(problems))
print("layout audit: clean")

page = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kloudbean hosting architecture</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link id="kbfonts" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
<style>
  body{margin:0;background:__PAGE__;font-family:__F__;}
  .kb-wrap{max-width:1240px;margin:0 auto;padding:16px 14px 30px;}
  .kb-wrap svg{display:block;width:100%;height:auto;}
  .kb-bar{display:flex;gap:8px;align-items:center;justify-content:flex-end;
    max-width:1240px;margin:0 auto 10px;padding:0 14px;flex-wrap:wrap;}
  .kb-bar span{font-size:11px;color:#6b7280;margin-right:auto;}
  .kb-bar button{font-family:inherit;font-size:13px;font-weight:500;padding:8px 15px;
    border-radius:50px;border:1px solid __PURPLE__;background:#fff;color:__PURPLE__;
    cursor:pointer;transition:.15s;}
  .kb-bar button:hover{background:#f3efff;}
  .kb-bar button.p{background:__PURPLE__;color:#fff;}
  .kb-bar button.p:hover{filter:brightness(1.08);}
  .kb-bar button[disabled]{opacity:.55;cursor:progress;}
  figcaption{max-width:900px;margin:14px auto 0;text-align:center;font-size:10.5px;
    line-height:1.7;color:#9aa3b2;}
</style>
</head>
<body>
<div class="kb-bar">
  <span id="kbmsg">Export renders the diagram at full vector quality.</span>
  <button class="p" data-scale="2">Download PNG (2x)</button>
  <button data-scale="1">PNG 1x</button>
  <button data-scale="3">PNG 3x</button>
  <button id="kbsvgbtn">Download SVG</button>
</div>
<figure class="kb-wrap" style="margin:0 auto">
__SVG__
<figcaption>
  Cloudflare fronts DNS, CDN and DDoS protection. Traffic arrives over HTTPS on 443 at NGINX, which
  reverse proxies and load balances: a cache hit is served by Varnish, a miss is passed to Apache,
  which hands execution to PHP-FPM. Applications sit in the same compute engine, each in an isolated
  environment with its own Git repository, PHP-FPM worker pool and system user. Applications connect
  to MariaDB over tcp/3306 and to Redis over tcp/6379. Application data and database dumps go
  off-site to Google Cloud Storage, where each application and the database get their own isolated
  bucket, so one restore never touches another tenant's data. The PHP path is shown; Node, Python,
  Ruby, Java, Go and static applications substitute their own runtime for Apache and PHP-FPM.
</figcaption>
</figure>

<script>
(function(){
  var msg = document.getElementById('kbmsg');
  var fontCss = null;

  function save(blob, name){
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
  }

  // An SVG loaded into an <img> cannot fetch external stylesheets, so without
  // inlining the webfonts every PNG would silently fall back to a system font.
  async function fonts(){
    if (fontCss !== null) return fontCss;
    try {
      var href = document.getElementById('kbfonts').href;
      var css = await (await fetch(href)).text();
      var urls = Array.from(new Set((css.match(/https:\\/\\/[^)\\s]+\\.woff2/g) || [])));
      for (var i = 0; i < urls.length; i++){
        var b = await (await fetch(urls[i])).blob();
        var d = await new Promise(function(r){
          var fr = new FileReader(); fr.onload = function(){ r(fr.result); }; fr.readAsDataURL(b);
        });
        css = css.split(urls[i]).join(d);
      }
      fontCss = css;
    } catch (e) { fontCss = ''; }
    return fontCss;
  }

  function clone(css){
    var src = document.getElementById('kbsvg');
    var c = src.cloneNode(true);
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    c.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    var vb = src.viewBox.baseVal;
    c.setAttribute('width', vb.width); c.setAttribute('height', vb.height);
    if (css){
      var st = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      st.textContent = css;
      c.insertBefore(st, c.firstChild);
    }
    return { node: c, w: vb.width, h: vb.height };
  }

  async function png(scale){
    var all = document.querySelectorAll('.kb-bar button');
    all.forEach(function(b){ b.disabled = true; });
    msg.textContent = 'Embedding fonts and rendering at ' + scale + 'x...';
    try {
      var css = await fonts();
      var c = clone(css);
      var str = new XMLSerializer().serializeToString(c.node);
      var url = URL.createObjectURL(new Blob([str], {type:'image/svg+xml;charset=utf-8'}));
      var img = new Image();
      await new Promise(function(res, rej){ img.onload = res; img.onerror = rej; img.src = url; });
      var cv = document.createElement('canvas');
      cv.width = Math.round(c.w * scale); cv.height = Math.round(c.h * scale);
      var ctx = cv.getContext('2d');
      ctx.fillStyle = '__PAGE__';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      await new Promise(function(res){
        cv.toBlob(function(b){ save(b, 'kloudbean-architecture@' + scale + 'x.png'); res(); }, 'image/png');
      });
      msg.textContent = 'Saved PNG at ' + cv.width + ' x ' + cv.height + ' px.'
        + (css ? '' : ' Fonts could not be embedded, so system fonts were used.');
    } catch (e) {
      msg.textContent = 'PNG export failed: ' + e.message + '. The SVG download always works.';
    }
    all.forEach(function(b){ b.disabled = false; });
  }

  document.querySelectorAll('.kb-bar button[data-scale]').forEach(function(b){
    b.addEventListener('click', function(){ png(parseInt(b.dataset.scale, 10)); });
  });
  document.getElementById('kbsvgbtn').addEventListener('click', async function(){
    var css = await fonts();
    var c = clone(css);
    var str = '<?xml version="1.0" encoding="UTF-8"?>\\n' + new XMLSerializer().serializeToString(c.node);
    save(new Blob([str], {type:'image/svg+xml;charset=utf-8'}), 'kloudbean-architecture.svg');
    msg.textContent = 'Saved SVG. Vector, scales to any size.';
  });
})();
</script>
</body>
</html>
"""
page = (page.replace("__SVG__", svg).replace("__PAGE__", PAGE)
            .replace("__PURPLE__", PURPLE).replace("__F__", F))
io.open(OUT, "w", encoding="utf-8").write(page)
print("wrote", os.path.relpath(OUT, REPO))
print("svg bytes:", len(svg), "| page bytes:", len(page))
print("logos:", ", ".join(f"{k} {int(VB[k][0])}x{int(VB[k][1])}" for k in LOGOS))
