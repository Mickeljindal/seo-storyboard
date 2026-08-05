# Kloudbean Article Production Spec (single source for every new article)

This is the operational checklist a writer (human or subagent) follows to produce ONE new
blog article that passes the gate on the first try. Pair it with the two steering docs it
does not duplicate: `.kiro/steering/kloudbean-facts.md` (product truth) and
`.kiro/steering/article-quality-playbook.md` (voice + editorial bar). When any of those
conflict, product truth wins, then the playbook, then this spec.

Reference article to imitate for structure and tone: `add-managed-database-to-your-app/`.

---

## 1. Files to create (exactly these, in `content-studio/<slug>/`)

```
<slug>/<slug>.html      # the article (this is what ships)
<slug>/<slug>.md        # a markdown mirror kept in sync with the HTML body
<slug>/brief.md         # the brief: target + secondary keywords (+ volumes if known), silo, byline, SVG concept, honesty notes
<slug>/images/          # leave empty; the hero pipeline writes images/hero.png later
```

Do NOT create `images/hero.png` yourself. The hero is rendered separately
(`social-studio/render-all-heroes.mjs` scans the filesystem and picks up new slugs).

---

## 2. HTML skeleton (match the reference exactly)

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PRIMARY KEYWORD in a real title, ~55-62 chars</title>
<meta name="description" content="Meta with the primary keyword, ~150-160 chars, plain text.">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="images/hero.png">
<link rel="canonical" href="https://www.kloudbean.com/blog/<slug>/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/article.css">
</head>
<body>
<article>
  <p class="eyebrow">SILO / TOPIC LABEL</p>
  <h1>H1 with the primary keyword</h1>
  <p class="byline">By <UNIQUE AUTHOR NAME> · <a UNIQUE tagline, NOT "Faster Than Ever">.</p>
  <figure><img src="images/hero.png" alt="descriptive alt with the keyword"></figure>

  <p>Lead: 2-4 sentences. Name the real tools/audience, state the problem, promise the outcome.</p>

  <div class="tldr"> 2-3 sentence direct answer (wins featured snippets). </div>

  ... body: H2/H3 phrased as the questions people ask ...

</article>

<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
{"@type":"Article","headline":"...","description":"...","image":"https://www.kloudbean.com/blog/<slug>/images/hero.png","author":{"@type":"Organization","name":"Kloudbean","url":"https://www.kloudbean.com/"},"publisher":{"@type":"Organization","name":"Kloudbean","logo":{"@type":"ImageObject","url":"https://www.kloudbean.com/logo.png"}},"mainEntityOfPage":"https://www.kloudbean.com/blog/<slug>/"},
{"@type":"FAQPage","mainEntity":[
{"@type":"Question","name":"...","acceptedAnswer":{"@type":"Answer","text":"..."}}
/* 8-10 questions total */
]}
]}
</script>
</body>
</html>
```

JSON-LD rules: answers are PLAIN text, no raw `<` `>` `&` or unescaped quotes. The FAQ in
the JSON-LD must mirror the on-page FAQ questions. Validator requires the `@graph` to carry
both `Article` and `FAQPage`.

---

## 3. Building blocks available in `assets/article.css`

- `.tldr` snippet box (place right after the lead)
- `.note` callout (e.g. "Coming from X?")
- `table.cmp` comparison table
- `<pre><code>` dark code blocks (escape `&lt; &gt; &amp;` inside)
- inline `<code>`
- inline `<svg>` diagram inside `<figure>` + `<figcaption>` (bespoke per article; brand colors navy #000f27, purple #4F1AF3, green #40b75f)
- `.img-slot` author image placeholder (see section 5)

---

## 4. Console screenshots (real Kloudbean dashboard, in `assets/console/`)

Reference as `<img src="../assets/console/<name>.png" alt="...">`. Use the ones that truly
fit the step; do not force. 18 available:

`add-server`, `add-server-region` (7 clouds + GCP Dammam/Saudi highlighted — use for KSA/region),
`add-application`, `git-deployment`, `env-vars`, `launch-database`, `s3-buckets`,
`flb-load-balancer`, `dashboard` (whole-stack overview), `manage-backups`, `ssl-certificate`,
`firewall` (Shorewall+Fail2ban baseline; BitNinja shown as a light Premium add-on),
`server-health` (CPU/RAM/disk), `cron-jobs`, `staging`, `cloudflare`, `user-2fa-security`,
`subusers-uac`.

Aim for 2-4 real screenshots per guide where they fit, plus image slots for the rest.

---

## 5. Image slots (give the author safe places to add their own images)

3-6 per article, at natural spots. HTML form (precede each with an HTML comment that uses
`src -> images/your-file.png`, NEVER a real `src="..."` which the validator flags):

```html
<!-- ADD IMAGE: what to show here. Swap for a real screenshot: src -> images/your-file.png -->
<figure class="img-slot"><span><b>Add image</b><em>Concrete hint: what to show here.</em><small>Optional note.</small></span></figure>
```

In the `.md` mirror use `<!-- ADD IMAGE: hint -->` at the same spots. Keep hint text
em-dash-free.

---

## 6. Facts you may state (from kloudbean-facts.md) — and the ones you may NOT

MAY (grounded): one dashboard for the whole stack; 7 clouds (AWS, AWS Lightsail, Google
Cloud, Linode, Vultr, DigitalOcean, UpCloud); 7 managed databases (MySQL, MariaDB,
PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB); built-in S3-compatible object storage
+ managed GCS buckets; built-in Flexible Load Balancer (FLB) on any account; multi-language
(PHP/WordPress/WooCommerce/Laravel/Magento/Drupal/Joomla, Node/Express/Angular/React/Vue,
Python/Flask/Django/FastAPI, Ruby, Java, free static sites, one-click AI apps like n8n,
Supabase, OpenWebUI+DeepSeek, Postiz, Penpot); managed CI/CD from Git with live build logs;
staging (WordPress & Laravel); automatic backups; free auto-renewing SSL; Shorewall +
Fail2ban baseline hardening; subusers + UAC; social login; cron jobs from UI; VPC/private
networking; Cloudflare Enterprise edge caching (paid add-on, free for Enterprise);
enterprise-only k8s/autoscaling/custom; audit trail (Enterprise). Entry pricing "from
$8/mo"; Enterprise is "custom / contact sales". GCP in-Kingdom for KSA = Dammam (me-central2)
only. Free migration assistance and free trial are approved to feature.

MUST NOT: any customer/geo/CSAT numbers ("1,000+ customers", "30+ countries", "~2-min
response", "99% CSAT", "24/7 human"); specific Enterprise dollar figures ($5,000/$7,500/mo);
"unlimited DevOps hours"; calling autoscaling automatic for normal users (it's
enterprise/custom only); claiming any certification is held (certs are in progress, never
"certified"); Windows/.NET/IIS (Linux stacks only); inventing Docker one-click, managed WAF
beyond Shorewall/Fail2ban+Cloudflare, read replicas one-click, zero-egress, white-label, or
exact SLA %. Do not headline BitNinja; show it lightly as a Premium/Enterprise added layer.
"Managed" = server/stack/SSL/backups/patching handled, you own your app + data. Compliance
is shared-responsibility (platform provides infra controls; customer owns app-level).

If a needed fact is not in kloudbean-facts.md, omit it or frame it as a general concept. Never guess.

---

## 7. Internal links (4-8 per article, only to slugs whose folder EXISTS)

Follow `INTERNAL-LINKING-MAP.md`: link UP to the silo pillar, ACROSS to 2-4 siblings, and
exactly ONE money-page (a comparison or a "managed X" pillar). Absolute form
`https://www.kloudbean.com/blog/<slug>/`, descriptive anchor text (never "click here").
Before using a link, confirm `content-studio/<slug>/` exists. If a planned target is not yet
written, link a live sibling instead.

---

## 8. Voice (humanized by default — see the playbook)

Near-zero em-dashes in body prose (validator hard-fails otherwise). No filler ("Here's the
thing", "when it comes to", "Moreover", "Ultimately"). Contractions. Burstiness (mix 3-word
and long sentences). Start the odd sentence with And/But/So. One or two concrete checkable
specifics (a real command, a real error string, a named tool). A mild opinion is good. Teach
first, sell last. A competitor gets at most one measured nod, then pivot to Kloudbean on real
advantages. Never fabricate personal anecdotes, numbers, or customer stories.

CTA at the end: outcome first, then a scannable feature line drawn ONLY from confirmed facts,
e.g. "One-click databases · Automatic backups · Private networking · Free migration · Free
trial · Simple Git deploy". Link kloudbean.com and /pricing/.

---

## 9. Length & shape

Target 2000-4000 words; VARY it by topic (a concept explainer can be ~2000, a deep how-to
3000-4000). Do NOT reuse one template across articles: vary opener, section order, heading
phrasing, FAQ count (8-10), CTA placement, and the SVG concept. Pick the shape that fits
(audit, decision tree, troubleshooting guide, migration, comparison, architecture breakdown).

---

## 10. Gate before done (run from `content-studio/`)

1. `python3 /tmp/validate_article.py <slug>` → must print `[OK]`, >=1400 words (aim 2000+), JSON-LD `['Article', 'FAQPage']`, images resolve, CSS linked.
2. Prose em-dash MUST be 0:  `grep -nE '<p>|<li>|<h2|<h3' <slug>/<slug>.html | grep -c '—'`
3. Blurbs MUST be 0:  `grep -ci '1,000+\|30+ countries\|two-minute\|~2-min\|24/7 human' <slug>/<slug>.html <slug>/<slug>.md`
4. SVG present:  `grep -c '<svg' <slug>/<slug>.html`  (>=1)
5. Links resolve:  every `blog/<slug>/` target folder exists.
6. Self-test: could a competitor publish this unchanged? If yes, add what only Kloudbean knows. Does it read like a person wrote it?

Keep `<slug>.html` and `<slug>.md` in sync. Unique byline per new article.
