# -*- coding: utf-8 -*-
"""Build hosting-architecture.html from the markdown source and the shared diagram.

    python3 content-studio/hosting-architecture/build-page.py

The diagram's SVG is pulled from content-studio/assets/diagrams/kloudbean-architecture.html
at build time rather than pasted, so regenerating the diagram and rebuilding this
page cannot leave the two out of step. Run the diagram build first if you changed it.
"""
import io, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
DIAGRAM = os.path.join(HERE, "..", "assets", "diagrams", "kloudbean-architecture.html")
OUT = os.path.join(HERE, "hosting-architecture.html")

d = io.open(DIAGRAM, encoding="utf-8").read()
svg = d[d.index('<svg id="kbsvg"'):d.index("</svg>") + len("</svg>")]
svg = svg.replace('id="kbsvg"', 'id="kbarch"', 1)          # avoid an id clash if both load
svg = svg.replace('width="100%"', 'width="100%" style="display:block;height:auto"', 1)
print("diagram svg:", len(svg), "bytes")

BODY = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kloudbean Hosting Architecture</title>
<meta name="description" content="How Kloudbean is built: the request path from Cloudflare through NGINX, Varnish and PHP-FPM, per-application isolation, data services, security at each layer, and off-site backup to Google Cloud Storage.">
<meta name="author" content="Kloudbean">
<link rel="canonical" href="https://www.kloudbean.com/hosting-architecture/">
<meta property="og:type" content="article">
<meta property="og:title" content="Kloudbean Hosting Architecture">
<meta property="og:description" content="The request path, per-application isolation, data services, security at each layer and off-site backup, documented.">
<meta property="og:site_name" content="Kloudbean">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/article.css">
<style>
  .kb-diagram{margin:26px 0 10px;border:1px solid #e5e5e5;border-radius:16px;
    background:#f8f9fa;padding:10px;overflow:hidden}
  .kb-diagram svg{width:100%;height:auto;display:block}
  .kb-spec{width:100%;border-collapse:collapse;margin:18px 0;font-size:15px}
  .kb-spec th,.kb-spec td{border:1px solid #e5e5e5;padding:9px 12px;text-align:left;vertical-align:top}
  .kb-spec th{background:#f6f7fb;font-weight:600;color:#000f27;width:34%}
</style>
</head>
<body>
<article class="wrap">
  <span class="eyebrow">Platform documentation</span>
  <h1>Kloudbean Hosting Architecture</h1>
  <p class="byline">Platform documentation · What runs where, and who is responsible for it</p>

  <p class="lead">Kloudbean is a managed layer over tier-one cloud infrastructure. You choose the provider and the region; the platform provisions the server, builds the stack, configures the web server, issues certificates, applies patches and runs backups. Your application code and your data stay yours.</p>

  <p>That means it does not sit neatly in the usual categories. It is not shared hosting, because nothing is shared with another customer's applications. It is not a raw VPS, because you are not the one patching it at 2am. And it is not a per-service PaaS, because the pieces of your application are processes on infrastructure you control rather than separately metered products.</p>

  <h2>Where your server actually runs</h2>
  <p>Compute comes from seven providers: AWS, AWS Lightsail, Google Cloud, Linode, Vultr, DigitalOcean and UpCloud. You pick which one, and you can run different projects on different providers from the same dashboard.</p>
  <p>Between them those providers reach more than 80 data centres, with in-country hosting available in around 35 countries. That matters for two reasons that have nothing to do with marketing: latency to your actual audience, and data residency where a regulator has an opinion about it.</p>
  <table class="kb-spec">
    <tr><th>Providers</th><td>AWS, AWS Lightsail, Google Cloud, Linode, Vultr, DigitalOcean, UpCloud</td></tr>
    <tr><th>Server sizes</th><td>1GB to 128GB of RAM and beyond, across eight documented configurations</td></tr>
    <tr><th>Resizing</th><td>Vertical resize is self-serve. Disk cannot be shrunk afterwards</td></tr>
    <tr><th>Runtimes</th><td>PHP, Node, Python, Ruby, Java, Go, static. .NET on Linux</td></tr>
  </table>

  <h2>The request path, end to end</h2>
  <p>A request to a PHP application passes through four components before your code executes, and knowing the order is the difference between fixing an error and guessing at it.</p>
  <p><strong>Cloudflare</strong> handles DNS, CDN and DDoS protection at the edge. It is available as a paid add-on on any plan, and is included for Enterprise.</p>
  <p><strong>NGINX</strong> terminates TLS and acts as reverse proxy and load balancer. This is the layer that returns a 502 when the thing behind it is not answering, and a 504 when it answered too slowly.</p>
  <p><strong>Varnish</strong> sits in front of the application as an HTTP accelerator. On a cache hit the response never touches PHP at all, which is why a cached page and an uncached page can differ by an order of magnitude in response time.</p>
  <p><strong>Apache and PHP-FPM</strong> handle a cache miss. Apache passes execution to the application's own PHP-FPM worker pool.</p>
  <p>Node, Python, Ruby, Java, Go and static applications follow the same shape with their own runtime in place of Apache and PHP-FPM. A Node application runs as an always-on process under PM2 rather than being spun up per request, so there is no cold start for the next visitor.</p>

  <h2>The architecture, in one diagram</h2>
  <p>The full technical reference, including the ports each connection uses and where backups leave the platform:</p>
  <figure class="kb-diagram">
__SVG__
  </figure>
  <p>Two things in that drawing are worth pointing out, because they are the parts people assume rather than check. The cache-hit and cache-miss paths are genuinely different routes, not a single path with a flag. And the backup connections leave the compute engine entirely, which is the whole point of calling them off-site.</p>

  <h2>How applications are isolated</h2>
  <p>More than one application can run on a server, and there is no cap on how many. What keeps them apart is not a promise, it is configuration:</p>
  <ul>
    <li><strong>Its own system user.</strong> Each application runs as a separate Linux user, so file ownership is a real boundary rather than a convention.</li>
    <li><strong>Its own filesystem permissions.</strong> One application cannot read another's files, including its configuration and its secrets.</li>
    <li><strong>Its own PHP-FPM worker pool.</strong> Worker exhaustion in one application does not consume the workers of another.</li>
    <li><strong>Its own MariaDB and Redis instance.</strong> Data and cache are not pooled between applications on the same server.</li>
    <li><strong>Its own deployment settings.</strong> Repository, branch, build command and environment variables are per application.</li>
  </ul>
  <p>The practical ceiling on how many applications a server holds is its RAM and CPU, not a licence limit. A dozen cached brochure sites and one busy application with background workers are very different loads, so nobody can quote a number in advance. Watch memory first: it is what runs out.</p>

  <h2>Data services</h2>
  <p>Two distinct things get called "a database" here, and conflating them causes real confusion.</p>
  <p><strong>The application's own database.</strong> A new server arrives with the stack already on it, including MariaDB. An application can use the database on its own server with no second subscription, reached on the loopback interface.</p>
  <p><strong>Standalone managed databases.</strong> Launched from the dashboard as their own service, each with its own hostname, mandatory TLS, IP allow-listing and its own backup schedule. The documented engines are MySQL, MariaDB, PostgreSQL, MongoDB, Redis, Memcached and Elasticsearch, with nine or more listed in the platform docs. These are separately priced subscriptions.</p>
  <p>Which one to use is an architecture decision rather than a cost one. A standalone managed database keeps the data tier off the application server, so it has no public exposure, it is sized and tuned on its own schedule, and it is not sitting on the machine you rebuild when you resize the application. That is the shape we point people at for anything carrying real data.</p>
  <p>PostgreSQL, MongoDB, Elasticsearch and Memcached exist only as standalone managed services. There is no Postgres on the application server.</p>

  <h2>Security at each layer</h2>
  <p>Nothing here is a single product. It is a set of defaults applied at different depths.</p>
  <p><strong>Network.</strong> A Shorewall firewall and Fail2ban are configured by default on every server. IP Access Control allows or denies by address or CIDR range.</p>
  <p><strong>Application layer.</strong> BitNinja is available on every plan and enabled from Server Management, and is included at no cost on Premium and Enterprise. It adds WAF filtering, malware scanning and continuous monitoring. Worth knowing before you switch it on: it wants resource headroom, so check memory and CPU first and keep memory under roughly 80 to 85 percent afterwards. A security layer that starves the application it protects is not a win.</p>
  <p><strong>Transport.</strong> Free SSL certificates are issued and renewed automatically, with HTTP to HTTPS redirection.</p>
  <p><strong>Access.</strong> Subusers with granular per-resource, per-action permissions. Basic Auth gates an application while it is being built. Sessions use HttpOnly cookies. Social login is available through Google, GitHub and LinkedIn.</p>
  <p><strong>Audit.</strong> Enterprise accounts get an immutable, searchable, account-wide activity log with CSV export.</p>

  <h2>Backups, and getting data back</h2>
  <p>Backups are automatic, and they go off-site to Google Cloud Storage rather than sitting on the same disk as the thing they protect. Each application and each database gets its own isolated bucket, so a restore touches one workload rather than a shared archive.</p>
  <p>You can also take an on-demand backup before a risky change, and restore from the dashboard. Staging environments are available for WordPress and Laravel, which is the honest place to test a restore or an upgrade.</p>
  <p>A note that applies to every host, not just this one: an untested backup is an assumption. The first restore you ever perform should not be during an incident.</p>

  <h2>What we run and what you run</h2>
  <p>The division is worth stating plainly because it decides who gets paged.</p>
  <p>The platform owns the operating system, the stack, the web server configuration, TLS certificates, security patching and the backup schedule. You own your application code, your dependencies, your database schema and your data.</p>
  <p>So a memory leak in your process, an unindexed query, a dependency you did not pin, or a plugin that breaks on update are yours. The server it all runs on is ours. Compliance is shared in the same way: the platform provides infrastructure controls, and the application layer remains yours to evidence.</p>
  <p>Linux stacks are what this is built for: PHP with WordPress, WooCommerce, Laravel, Magento, Drupal and Joomla, plus Node, Python, Ruby, Java, Go and static sites. .NET runs on Linux here. Windows Server is a Premium and Enterprise option rather than a standard one.</p>

  <h2>Enterprise and regulated workloads</h2>
  <p>Some capabilities are deliberately not on the standard plan, because they need architecture work rather than a toggle: Kubernetes, autoscaling, private networking with VPC and VPN, the audit trail, and custom architectures. Premium gets a limited subset of Kubernetes features; full Kubernetes and autoscaling are Enterprise.</p>
  <p>For regulated work, Kloudbean can run in-region, including the Google Cloud Dammam region for in-Kingdom data residency in Saudi Arabia, with the configuration and evidence a regulated organisation needs to demonstrate its technical controls. Certification is always assessed against the organisation rather than the hosting provider.</p>

  <h2>Where to read next</h2>
  <p>For the platform comparison, <a href="https://www.kloudbean.com/blog/kloudbean-vs-cloudways/">Kloudbean vs Cloudways</a>. On the managed-versus-unmanaged question, <a href="https://www.kloudbean.com/blog/managed-vs-unmanaged-hosting/">managed vs unmanaged hosting</a>. For the data tier specifically, <a href="https://www.kloudbean.com/blog/managed-postgresql-hosting/">managed PostgreSQL hosting</a> and <a href="https://www.kloudbean.com/blog/add-managed-database-to-your-app/">add a managed database to your app</a>. On the caching layer, <a href="https://www.kloudbean.com/blog/managed-redis-hosting/">Redis object caching</a>. And for backups, <a href="https://www.kloudbean.com/blog/server-backups-guide/">the server backups guide</a>.</p>

  <h2>FAQ</h2>
  <div class="faq">
    <h3>Which cloud providers can I run on?</h3>
    <p>Seven: AWS, AWS Lightsail, Google Cloud, Linode, Vultr, DigitalOcean and UpCloud. You choose per server, so different projects in the same account can sit on different providers and in different regions.</p>

    <h3>How are applications on the same server kept apart?</h3>
    <p>Each application runs as its own Linux system user with its own filesystem permissions, its own PHP-FPM worker pool, and its own MariaDB and Redis instance. File access and worker exhaustion are contained per application rather than shared.</p>

    <h3>How many applications can one server run?</h3>
    <p>There is no cap on any plan. The limit is the server's RAM and CPU, which depends entirely on what the applications do. Watch memory before CPU, since memory is usually what runs out first, and resize or split when it gets tight.</p>

    <h3>Where does Varnish fit, and when is it bypassed?</h3>
    <p>Varnish sits behind NGINX as an HTTP accelerator. A cache hit is served by Varnish without touching PHP. A cache miss is passed to Apache, which hands execution to the application's PHP-FPM pool. That is why cached and uncached response times differ so much.</p>

    <h3>Is the database on the same server as my application?</h3>
    <p>It can be. The server stack includes MariaDB, so an application can use a database on its own server. Standalone managed databases are a separate service with their own hostname, TLS and IP allow-listing, and that is the shape we recommend for anything carrying real data. PostgreSQL, MongoDB, Elasticsearch and Memcached exist only as standalone services.</p>

    <h3>What security is on by default, and what is optional?</h3>
    <p>A Shorewall firewall, Fail2ban and free auto-renewing SSL are configured by default. BitNinja is available on every plan and included at no cost on Premium and Enterprise. Cloudflare is a paid add-on on any plan and included for Enterprise.</p>

    <h3>Where do backups go, and how isolated are they?</h3>
    <p>Off-site to Google Cloud Storage, with a separate isolated bucket per application and per database, so restoring one workload does not involve any other. On-demand backups and dashboard restores are available, and staging environments exist for WordPress and Laravel.</p>

    <h3>What is not available on a standard plan?</h3>
    <p>Kubernetes, autoscaling, private networking with VPC and VPN, the audit trail, custom architectures and Windows Server. Premium includes a limited subset of Kubernetes features; full Kubernetes and autoscaling are Enterprise. On a standard plan you scale by resizing and by adding nodes behind the load balancer yourself.</p>
  </div>

  <p class="byline">Kloudbean · Platform documentation. Verify current plan details and pricing on the <a href="https://www.kloudbean.com/pricing/">pricing page</a>.</p>
</article>

<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
{"@type":"Article","headline":"Kloudbean Hosting Architecture","description":"How Kloudbean is built: the request path from Cloudflare through NGINX, Varnish and PHP-FPM, per-application isolation, data services, security at each layer, and off-site backup to Google Cloud Storage.","author":{"@type":"Organization","name":"Kloudbean","url":"https://www.kloudbean.com/"},"publisher":{"@type":"Organization","name":"Kloudbean","logo":{"@type":"ImageObject","url":"https://www.kloudbean.com/logo.png"}},"mainEntityOfPage":"https://www.kloudbean.com/hosting-architecture/"},
{"@type":"FAQPage","mainEntity":[
{"@type":"Question","name":"Which cloud providers can I run on?","acceptedAnswer":{"@type":"Answer","text":"Seven: AWS, AWS Lightsail, Google Cloud, Linode, Vultr, DigitalOcean and UpCloud. You choose per server, so different projects in the same account can sit on different providers and in different regions."}},
{"@type":"Question","name":"How are applications on the same server kept apart?","acceptedAnswer":{"@type":"Answer","text":"Each application runs as its own Linux system user with its own filesystem permissions, its own PHP-FPM worker pool, and its own MariaDB and Redis instance. File access and worker exhaustion are contained per application rather than shared."}},
{"@type":"Question","name":"How many applications can one server run?","acceptedAnswer":{"@type":"Answer","text":"There is no cap on any plan. The limit is the server's RAM and CPU, which depends entirely on what the applications do. Watch memory before CPU, since memory is usually what runs out first, and resize or split when it gets tight."}},
{"@type":"Question","name":"Where does Varnish fit, and when is it bypassed?","acceptedAnswer":{"@type":"Answer","text":"Varnish sits behind NGINX as an HTTP accelerator. A cache hit is served by Varnish without touching PHP. A cache miss is passed to Apache, which hands execution to the application's PHP-FPM pool. That is why cached and uncached response times differ so much."}},
{"@type":"Question","name":"Is the database on the same server as my application?","acceptedAnswer":{"@type":"Answer","text":"It can be. The server stack includes MariaDB, so an application can use a database on its own server. Standalone managed databases are a separate service with their own hostname, TLS and IP allow-listing, and that is the shape we recommend for anything carrying real data. PostgreSQL, MongoDB, Elasticsearch and Memcached exist only as standalone services."}},
{"@type":"Question","name":"What security is on by default, and what is optional?","acceptedAnswer":{"@type":"Answer","text":"A Shorewall firewall, Fail2ban and free auto-renewing SSL are configured by default. BitNinja is available on every plan and included at no cost on Premium and Enterprise. Cloudflare is a paid add-on on any plan and included for Enterprise."}},
{"@type":"Question","name":"Where do backups go, and how isolated are they?","acceptedAnswer":{"@type":"Answer","text":"Off-site to Google Cloud Storage, with a separate isolated bucket per application and per database, so restoring one workload does not involve any other. On-demand backups and dashboard restores are available, and staging environments exist for WordPress and Laravel."}},
{"@type":"Question","name":"What is not available on a standard plan?","acceptedAnswer":{"@type":"Answer","text":"Kubernetes, autoscaling, private networking with VPC and VPN, the audit trail, custom architectures and Windows Server. Premium includes a limited subset of Kubernetes features; full Kubernetes and autoscaling are Enterprise. On a standard plan you scale by resizing and by adding nodes behind the load balancer yourself."}}
]}
]}
</script>
</body>
</html>
"""

html = BODY.replace("__SVG__", svg)
io.open(OUT, "w", encoding="utf-8").write(html)
print("wrote", os.path.relpath(OUT), len(html), "bytes")
