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

W, H = 1240, 928
NAVY, PURPLE, GREEN, SEC = "#000F27", "#4F1AF3", "#22c55f", "#6f6b99"
BORD, PAGE, MUT, INK = "#e5e5e5", "#f8f9fa", "#6b7280", "#3d3d3d"
DBG, CHR, AMB = "#15803d", "#b91c1c", "#b45309"
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
    rect(x, y, w, h, r, fill, stroke, 1.3)
    lw = len(label) * (9.5 * 0.62) + 26
    pill(x + 18 + lw / 2, y, label, 9.5, label_fill)


CX = 620
A(f'<svg id="kbsvg" viewBox="0 0 {W} {H}" width="100%" xmlns="http://www.w3.org/2000/svg" '
  f'xmlns:xlink="http://www.w3.org/1999/xlink" font-family="{F}" role="img" '
  f'aria-labelledby="kbT kbD">')
A('<title id="kbT">Kloudbean hosting architecture, technical reference</title>')
A('<desc id="kbD">Cloudflare provides DNS, CDN and DDoS protection. Traffic arrives over '
  'HTTPS on port 443 at NGINX, which reverse proxies and load balances. A cache hit is '
  'served by Varnish; a cache miss is passed to Apache, which hands execution to PHP-FPM. '
  'Applications sit in the same compute engine, each in an isolated environment with its '
  'own Git repository, PHP-FPM worker pool and system user. Each application opens its own '
  'connection to a dedicated MariaDB database on tcp 3306 and a dedicated Redis instance on '
  'tcp 6379. Backups, off-site storage, restore procedures and a staging environment sit '
  'alongside. BitNinja enforces security at the compute engine boundary.</desc>')
A("<defs>")
A("".join(symbols))
for n, c in (("ap", PURPLE), ("ag", DBG), ("ar", CHR), ("aa", AMB), ("as", SEC)):
    A(f'<marker id="{n}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" '
      f'markerHeight="6.5" orient="auto-start-reverse">'
      f'<path d="M0 0 L10 5 L0 10 z" fill="{c}"/></marker>')
A('<filter id="sh" x="-20%" y="-20%" width="140%" height="150%">'
  '<feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0b1220" flood-opacity="0.10"/></filter>')
A('<linearGradient id="gnav" x1="0" y1="0" x2="0" y2="1">'
  '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#fbfaff"/></linearGradient>')
A("</defs>")
A(f'<rect width="{W}" height="{H}" fill="{PAGE}"/>')

# header: official dark horizontal logo
kbw = logo("kb", 24 + 138 / 2, 40, 28)
txt(24, 78, "Hosting architecture", 16.5, NAVY, "600")
txt(24, 97, "Request path, application isolation and data-tier connections", 10.2, MUT)

# Cloudflare
A('<g filter="url(#sh)">')
rect(CX - 180, 24, 360, 70, 14, "url(#gnav)", "#dfe3f2")
A('</g>')
logo("cloudflare", CX - 82, 52, 24)
txt(CX - 62, 57, "CLOUDFLARE", 14.5, NAVY, "700", "start", "1.2")
txt(CX, 79, "DNS  ·  CDN  ·  DDoS protection", 9.6, MUT, "400", "middle")
A(f'<line x1="{CX}" y1="94" x2="{CX}" y2="116" stroke="{SEC}" stroke-width="1.6"/>')
rect(CX - 48, 116, 96, 22, 11, "#eafbf0", "#bfe9cd")
A(f'<rect x="{CX-35}" y="125" width="10" height="7" rx="1.6" fill="{DBG}"/>')
A(f'<path d="M{CX-33} 125v-3a3 3 0 0 1 6 0v3" fill="none" stroke="{DBG}" stroke-width="1.3"/>')
txt(CX + 7, 132, "HTTPS 443", 9.6, DBG, "700", "middle", font=MONO)
A(f'<line x1="{CX}" y1="138" x2="{CX}" y2="206" stroke="{SEC}" stroke-width="1.6" marker-end="url(#as)"/>')

# BitNinja
BX, BY, BW, BH = 930, 24, 190, 132
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
LX, LY, LW, LH = 120, 194, 1000, 434
lane(LX, LY, LW, LH, "COMPUTE ENGINE", NAVY)
A(f'<path d="M{BX+10} {BY+BH} V 252 H {LX+LW+14} V 268 H {LX+LW+2}" fill="none" stroke="{SEC}" '
  f'stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#as)" opacity=".8"/>')
rect(LX + 14, LY + 24, 128, 74, 10, "#f6f7fb", BORD)
A(f'<rect x="{LX+28}" y="{LY+36}" width="20" height="20" rx="5" fill="{PURPLE}" opacity=".14"/>')
A(f'<rect x="{LX+33}" y="{LY+41}" width="10" height="10" rx="2" fill="{PURPLE}"/>')
txt(LX + 54, LY + 50, "OS + stack", 9.4, NAVY, "600")
txt(LX + 24, LY + 72, "kernel, packages,", 9, MUT)
txt(LX + 24, LY + 85, "TLS termination", 9, MUT)

NY, NH = 208, 60
A('<g filter="url(#sh)">')
rect(CX - 140, NY, 280, NH, 12, "url(#gnav)", "#cdd7f5")
A('</g>')
logo("nginx", CX, NY + 24, 21)
txt(CX, NY + 50, "reverse proxy · load balancer", 9.4, MUT, "400", "middle")

VY, VW, VH = 314, 160, 84
VCX, ACX = 520, 720
A(f'<path d="M{CX} {NY+NH} V 292 H {VCX} V {VY}" fill="none" stroke="{DBG}" stroke-width="1.7" marker-end="url(#ag)"/>')
A(f'<path d="M{CX} {NY+NH} V 292 H {ACX} V {VY}" fill="none" stroke="{AMB}" stroke-width="1.7" marker-end="url(#aa)"/>')
pill(VCX - 6, 301, "CACHE HIT", 8.8, "#eafbf0", DBG, 11)
pill(ACX + 6, 301, "CACHE MISS", 8.8, "#fff5e8", AMB, 11)
rect(VCX - VW / 2, VY, VW, VH, 12)
logo("varnish", VCX, VY + 26, 30)
txt(VCX, VY + 58, "HTTP accelerator,", 9.2, MUT, "400", "middle")
txt(VCX, VY + 72, "serves cached response", 9.2, MUT, "400", "middle")
rect(ACX - VW / 2, VY, VW, VH, 12)
logo("apache", ACX, VY + 26, 30)
txt(ACX, VY + 58, "web server, passes", 9.2, MUT, "400", "middle")
txt(ACX, VY + 72, "execution to PHP-FPM", 9.2, MUT, "400", "middle")

PX, PY, PW, PH = LX + 16, 424, LW - 32, 186
A(f'<path d="M{ACX} {VY+VH} V 412 H {CX} V {PY}" fill="none" stroke="{PURPLE}" '
  f'stroke-width="1.8" marker-end="url(#ap)"/>')
lane(PX, PY, PW, PH, "APPLICATIONS  ·  ISOLATED ENVIRONMENT PER APP",
     PURPLE, 14, "#f4f6fb", "#d7ddf0")

CARDS = [152, 374, 596, 858]
CW, CY, CH = 210, 452, 142
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
    rect(cx + 7, CY + 90, 96, 34, 9, "#eafbf0", "#cfe9d8")
    logo("mariadb", cx + 24, CY + 107, 16)
    txt(cx + 38, CY + 111, "MariaDB", 9.2, DBG, "600", "start")
    rect(cx + 107, CY + 90, 96, 34, 9, "#fdeef0", "#f5c9cb")
    logo("redis", cx + 126, CY + 107, 17)
    txt(cx + 140, CY + 111, "Redis", 9.2, CHR, "600", "start")
for k in range(3):
    A(f'<circle cx="{824 + k*9}" cy="{CY+66}" r="3" fill="{SEC}" opacity=".5"/>')
txt(PX + PW - 14, PY + PH - 12,
    "dedicated system user · filesystem permissions · own worker pool", 8.6, SEC, "400", "end")

DBX, DBW, CHX, CHW, BKX, BKW = 120, 300, 434, 300, 748, 372
TY, TH = 686, 126
lane(DBX, TY, DBW, TH, "DATABASE LAYER  ·  PER APP", DBG)
lane(CHX, TY, CHW, TH, "CACHE LAYER  ·  PER APP", CHR)
lane(BKX, TY, BKW, TH, "BACKUP AND RECOVERY", NAVY)
for cx in CARDS:
    A(f'<path d="M{cx+55} {CY+CH} V 646 H {DBX+DBW/2} V {TY}" fill="none" stroke="{DBG}" '
      f'stroke-width="1.3" stroke-dasharray="4 4" marker-end="url(#ag)" opacity=".85"/>')
    A(f'<path d="M{cx+155} {CY+CH} V 664 H {CHX+CHW/2} V {TY}" fill="none" stroke="{CHR}" '
      f'stroke-width="1.3" stroke-dasharray="4 4" marker-end="url(#ar)" opacity=".85"/>')
porttag(DBX + DBW / 2 - 62, 646, "tcp/3306")
porttag(CHX + CHW / 2 - 62, 664, "tcp/6379")
rect(DBX + 30, TY + 26, DBW - 60, 78, 11, "#eafbf0", "#cfe9d8")
logo("mariadb", DBX + DBW / 2 - 44, TY + 50, 26)
txt(DBX + DBW / 2 - 26, TY + 56, "MariaDB", 15, DBG, "700", "start")
txt(DBX + DBW / 2, TY + 78, "one dedicated database", 9.2, MUT, "400", "middle")
txt(DBX + DBW / 2, TY + 92, "per application", 9.2, MUT, "400", "middle")
rect(CHX + 30, TY + 26, CHW - 60, 78, 11, "#fdeef0", "#f5c9cb")
logo("redis", CHX + CHW / 2 - 40, TY + 50, 28)
txt(CHX + CHW / 2 - 20, TY + 56, "Redis", 15, CHR, "700", "start")
txt(CHX + CHW / 2, TY + 78, "one dedicated instance per app:", 9.2, MUT, "400", "middle")
txt(CHX + CHW / 2, TY + 92, "sessions, objects, queues", 9.2, MUT, "400", "middle")
for j, (a1, a2) in enumerate([("automated", "backups"), ("off-site", "storage"),
                              ("restore", "procedures"), ("staging", "environment")]):
    bx = BKX + 22 + j * 84
    rect(bx, TY + 28, 74, 74, 9, "#fff", BORD)
    A(f'<circle cx="{bx+37}" cy="{TY+50}" r="10" fill="{PURPLE}" opacity=".13"/>')
    A(f'<circle cx="{bx+37}" cy="{TY+50}" r="3.6" fill="{PURPLE}"/>')
    txt(bx + 37, TY + 78, a1, 8.4, INK, "600", "middle")
    txt(bx + 37, TY + 90, a2, 8.4, MUT, "400", "middle")

GY = 842
rect(120, GY, 1000, 56, 14, "#fff", BORD)
txt(140, GY + 22, "LEGEND", 8.8, SEC, "700", "start", "1.1")
for i, (col, dash, mk, lbl) in enumerate([(PURPLE, None, "ap", "request path"),
                                          (DBG, "4 4", "ag", "database connection"),
                                          (CHR, "4 4", "ar", "cache connection"),
                                          (SEC, "5 4", "as", "security enforcement")]):
    x = 232 + i * 224
    da = f' stroke-dasharray="{dash}"' if dash else ""
    A(f'<line x1="{x}" y1="{GY+30}" x2="{x+46}" y2="{GY+30}" stroke="{col}" stroke-width="1.7"'
      f'{da} marker-end="url(#{mk})"/>')
    txt(x + 58, GY + 34, lbl, 9.6, INK)
txt(140, GY + 46, "ports shown as tcp/nnnn", 8.4, MUT)
A("</svg>")
svg = "\n".join(o)

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
  environment with its own Git repository, PHP-FPM worker pool and system user. Each application
  opens its own connections to a dedicated MariaDB database and a dedicated Redis instance. The PHP
  path is shown; Node, Python, Ruby, Java, Go and static applications substitute their own runtime
  for Apache and PHP-FPM.
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
