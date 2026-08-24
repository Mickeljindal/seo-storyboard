# -*- coding: utf-8 -*-
"""Build a self-contained HTML fragment for a WordPress Elementor HTML widget.

Usage:
    python3 content-studio/hosting-architecture/build-elementor-fragment.py

The output deliberately has no html, head, or body elements. Paste the complete contents
of elementor-hosting-architecture.html into one Elementor HTML widget.
"""
import io
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DIAGRAM = os.path.join(HERE, "..", "assets", "diagrams", "kloudbean-architecture.html")
OUT = os.path.join(HERE, "elementor-hosting-architecture.html")

source = io.open(DIAGRAM, encoding="utf-8").read()
svg = source[source.index('<svg id="kbsvg"'):source.index("</svg>") + len("</svg>")]
svg = svg.replace('id="kbsvg"', 'id="kb-elementor-architecture"', 1)
svg = svg.replace('width="100%"', 'width="100%" style="display:block;height:auto"', 1)

FRAGMENT = r'''<!--
  Kloudbean Hosting Architecture: Elementor HTML widget fragment
  Paste this whole file into one Elementor HTML widget.
  It is self-contained: scoped CSS + inline SVG, with no theme stylesheet required.
  Regenerate after diagram changes with:
  python3 content-studio/hosting-architecture/build-elementor-fragment.py
-->
<style>
  #kb-architecture-doc,
  #kb-architecture-doc * { box-sizing: border-box; }
  #kb-architecture-doc {
    --kb-ink: #000f27;
    --kb-purple: #4f1af3;
    --kb-green: #40b75f;
    --kb-blue: #1676bb;
    --kb-line: #dce1ea;
    --kb-surface: #f6f8fc;
    color: var(--kb-ink);
    font-family: Poppins, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 16px;
    line-height: 1.7;
  }
  #kb-architecture-doc .kb-doc-shell { max-width: 1180px; margin: 0 auto; padding: 28px 22px 64px; }
  #kb-architecture-doc .kb-kicker { margin: 0 0 10px; color: var(--kb-purple); font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  #kb-architecture-doc h1,
  #kb-architecture-doc h2,
  #kb-architecture-doc h3 { color: var(--kb-ink); line-height: 1.2; }
  #kb-architecture-doc h1 { max-width: 790px; margin: 0; font-size: clamp(34px, 5vw, 56px); letter-spacing: -.045em; }
  #kb-architecture-doc h2 { margin: 56px 0 16px; font-size: clamp(25px, 3vw, 34px); letter-spacing: -.03em; }
  #kb-architecture-doc h3 { margin: 0 0 7px; font-size: 17px; }
  #kb-architecture-doc p { max-width: 790px; margin: 0 0 16px; }
  #kb-architecture-doc .kb-intro { max-width: 820px; margin-top: 22px; font-size: 19px; line-height: 1.65; }
  #kb-architecture-doc .kb-answer { display: grid; grid-template-columns: 5px 1fr; gap: 18px; max-width: 880px; margin: 30px 0 42px; padding: 20px 22px; background: #f0ecff; border-radius: 12px; }
  #kb-architecture-doc .kb-answer::before { content: ""; background: var(--kb-purple); border-radius: 99px; }
  #kb-architecture-doc .kb-answer p { margin: 0; font-size: 16px; }
  #kb-architecture-doc .kb-flow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; max-width: 980px; margin: 24px 0 8px; }
  #kb-architecture-doc .kb-flow-item { position: relative; min-height: 104px; padding: 17px; border: 1px solid var(--kb-line); border-radius: 12px; background: #fff; }
  #kb-architecture-doc .kb-flow-item:not(:last-child)::after { content: "→"; position: absolute; right: -20px; top: 37px; z-index: 1; color: var(--kb-purple); font-size: 22px; font-weight: 700; }
  #kb-architecture-doc .kb-flow-step { display: block; margin-bottom: 5px; color: var(--kb-purple); font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  #kb-architecture-doc .kb-flow-item p { margin: 0; font-size: 13px; line-height: 1.55; }
  #kb-architecture-doc .kb-diagram { margin: 27px 0 0; padding: 12px; overflow: hidden; border: 1px solid var(--kb-line); border-radius: 18px; background: var(--kb-surface); }
  #kb-architecture-doc .kb-diagram svg { display: block; width: 100%; height: auto; }
  #kb-architecture-doc .kb-diagram-caption { max-width: 900px; margin: 13px auto 0; color: #596579; font-size: 13px; text-align: center; }
  #kb-architecture-doc .kb-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; max-width: 980px; margin-top: 24px; }
  #kb-architecture-doc .kb-card { padding: 22px; border: 1px solid var(--kb-line); border-radius: 14px; background: #fff; }
  #kb-architecture-doc .kb-card p { margin: 0; font-size: 14px; }
  #kb-architecture-doc .kb-note { max-width: 880px; margin-top: 22px; padding: 17px 20px; border: 1px solid #bfe7cb; border-radius: 12px; background: #f0fbf4; }
  #kb-architecture-doc .kb-note p { margin: 0; font-size: 15px; }
  #kb-architecture-doc .kb-ownership { max-width: 980px; margin-top: 24px; overflow: hidden; border: 1px solid var(--kb-line); border-radius: 14px; }
  #kb-architecture-doc .kb-ownership > div { display: grid; grid-template-columns: 210px 1fr; border-bottom: 1px solid var(--kb-line); }
  #kb-architecture-doc .kb-ownership > div:last-child { border-bottom: 0; }
  #kb-architecture-doc .kb-ownership strong { padding: 15px 18px; background: var(--kb-surface); }
  #kb-architecture-doc .kb-ownership span { padding: 15px 18px; }
  #kb-architecture-doc .kb-reading { max-width: 980px; margin-top: 24px; padding: 21px 24px; border-radius: 14px; background: var(--kb-ink); color: #fff; }
  #kb-architecture-doc .kb-reading h2 { margin: 0 0 9px; color: #fff; font-size: 23px; }
  #kb-architecture-doc .kb-reading p { margin: 0; max-width: none; color: #d7ddeb; }
  #kb-architecture-doc a { color: var(--kb-purple); font-weight: 600; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
  #kb-architecture-doc .kb-reading a { color: #fff; }
  @media (max-width: 760px) {
    #kb-architecture-doc .kb-doc-shell { padding: 18px 14px 46px; }
    #kb-architecture-doc .kb-flow { grid-template-columns: 1fr 1fr; }
    #kb-architecture-doc .kb-flow-item:nth-child(2)::after { display: none; }
    #kb-architecture-doc .kb-grid { grid-template-columns: 1fr; }
    #kb-architecture-doc .kb-ownership > div { grid-template-columns: 1fr; }
    #kb-architecture-doc .kb-ownership strong { padding-bottom: 6px; }
    #kb-architecture-doc .kb-ownership span { padding-top: 7px; }
  }
  @media (max-width: 440px) {
    #kb-architecture-doc .kb-flow { grid-template-columns: 1fr; }
    #kb-architecture-doc .kb-flow-item:not(:last-child)::after { display: none; }
    #kb-architecture-doc .kb-diagram { padding: 4px; border-radius: 10px; }
  }
</style>

<section id="kb-architecture-doc" aria-labelledby="kb-architecture-title">
  <div class="kb-doc-shell">
    <p class="kb-kicker">Platform documentation</p>
    <h1 id="kb-architecture-title">Kloudbean hosting architecture</h1>
    <p class="kb-intro">This page maps a typical Kloudbean application path from an incoming HTTPS request through the web stack, application runtime, data services, and off-site backups. It is a technical reference, so the point is to show where each layer sits and what it does.</p>

    <aside class="kb-answer" aria-label="Short answer">
      <p><strong>In brief:</strong> Kloudbean runs applications on a server you choose from AWS, AWS Lightsail, Google Cloud, Linode, Vultr, DigitalOcean, or UpCloud. Requests pass through the edge and web layers before reaching an application. Backups leave the compute environment for isolated off-site Google Cloud Storage buckets.</p>
    </aside>

    <h2>The request path</h2>
    <p>The HTTP path matters when you are debugging. A request can be served from cache before application code runs, or it can move through the web stack to the runtime. Those are different execution paths, with different places to investigate when something is slow or failing.</p>
    <div class="kb-flow" aria-label="Request path summary">
      <div class="kb-flow-item"><span class="kb-flow-step">01 Edge</span><h3>Cloudflare</h3><p>DNS, CDN, and DDoS protection when the service is enabled.</p></div>
      <div class="kb-flow-item"><span class="kb-flow-step">02 Web</span><h3>NGINX and Varnish</h3><p>NGINX receives HTTPS traffic. Varnish can return a cached response.</p></div>
      <div class="kb-flow-item"><span class="kb-flow-step">03 Runtime</span><h3>Application</h3><p>A cache miss reaches the application stack and its runtime processes.</p></div>
      <div class="kb-flow-item"><span class="kb-flow-step">04 Data</span><h3>Data and backup</h3><p>The application reads its services; backup data is written off-site.</p></div>
    </div>

    <h2>The architecture, in one view</h2>
    <p>The diagram uses a PHP request path to make the web layers visible. Node, Python, Ruby, Java, and other supported workloads use their own runtime in place of the PHP-specific components. The compute box contains the application layer and the associated MariaDB and Redis services shown for each application.</p>
    <figure class="kb-diagram">
__SVG__
    </figure>
    <p class="kb-diagram-caption">A technical map of the request path, application boundaries, associated data services, and off-site backup destinations.</p>

    <h2>What is inside the compute environment?</h2>
    <p>An application is more than a web root. It needs an execution context, a deployment configuration, file permissions, and data services. Keeping those responsibilities visible helps explain why one app’s configuration should not become another app’s dependency.</p>
    <div class="kb-grid">
      <section class="kb-card"><h3>Application boundary</h3><p>Applications have their own system user, filesystem permissions, deployment settings, and runtime configuration. A repository, branch, build command, environment variables, and cron jobs belong to the application that uses them.</p></section>
      <section class="kb-card"><h3>Associated data services</h3><p>The diagram shows MariaDB and Redis alongside each application rather than a single shared pair. For workloads that need an independent data tier, Kloudbean also provides standalone managed MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, and MongoDB.</p></section>
      <section class="kb-card"><h3>Cache hit and cache miss</h3><p>Varnish can return a stored HTTP response without invoking the application runtime. On a miss, Apache and PHP-FPM handle the PHP path. This distinction is useful when cache behaviour does not match an application change.</p></section>
      <section class="kb-card"><h3>Capacity is operational</h3><p>There is no plan rule limiting the number of applications on a server. The practical constraint is the CPU, memory, disk, and workload behaviour of the applications you choose to place there.</p></section>
    </div>

    <h2>Backups are outside the compute environment</h2>
    <p>The backup arrows deliberately leave the compute box. Application data and database dumps are stored off-site in Google Cloud Storage, with an isolated bucket shown for each application and database path. This keeps a restore scoped to the affected workload rather than a shared archive.</p>
    <aside class="kb-note"><p><strong>Operational note:</strong> Automatic backups help only if a restore is usable. Take an on-demand backup before a risky change, and test recovery in staging where that is available for your stack.</p></aside>

    <h2>Security and responsibility</h2>
    <p>Hosting controls are layered. The platform manages server hardening and the core stack; application code and the data model still remain the customer’s responsibility.</p>
    <div class="kb-ownership" role="table" aria-label="Shared responsibility summary">
      <div role="row"><strong role="rowheader">Platform layer</strong><span role="cell">Server provisioning, stack management, Shorewall firewall, Fail2ban, SSL, automatic backups, and patching.</span></div>
      <div role="row"><strong role="rowheader">Application layer</strong><span role="cell">Application code, dependencies, secrets, database schema, data handling, and application-specific security decisions.</span></div>
      <div role="row"><strong role="rowheader">Enterprise engagements</strong><span role="cell">Custom architectures can include Kubernetes, autoscaling, VPC, VPN, audit trail, and managed infrastructure work. Scope depends on the engagement.</span></div>
    </div>

    <section class="kb-reading" aria-labelledby="kb-read-next">
      <h2 id="kb-read-next">Related technical documentation</h2>
      <p>For implementation details, see the guides on <a href="https://www.kloudbean.com/blog/ci-cd-auto-deploy-from-github/">Git-based deployment</a>, <a href="https://www.kloudbean.com/blog/environment-variables-done-right/">environment variables</a>, <a href="https://www.kloudbean.com/blog/managed-redis-hosting/">managed Redis</a>, and <a href="https://www.kloudbean.com/blog/server-backups-guide/">server backups</a>.</p>
    </section>
  </div>
</section>
'''

html = FRAGMENT.replace("__SVG__", svg)
io.open(OUT, "w", encoding="utf-8").write(html)
print("wrote", os.path.relpath(OUT), len(html), "bytes")
