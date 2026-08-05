# Brief — Custom Domain and Free SSL for Your App

Cluster 1. Primary kw: custom domain and SSL for app. Secondary: point domain to app, free SSL Let's Encrypt, HTTPS for deployed app, DNS for web app.
Intent: how-to. A builder whose app is on a temp URL and needs its own domain + HTTPS padlock.
Angle: Practical how-to. From temp *.kloudbeansite.com to your-domain.com with HTTPS. Steps: add domain (Domain Aliases, apex + www), point DNS (A record -> server IP; CNAME www), install free Let's Encrypt SSL (auto-renew), force HTTPS. Cover DNS propagation patience, www vs apex, order matters (DNS must point before cert issues), troubleshooting (cert fails because DNS not propagated; mixed content), auto-renewal set-and-forget.
Distinct: focused domain+SSL how-to. HERO-ONLY (Domain Aliases screen not in existing console screenshot).
Slug: custom-domain-and-ssl-for-your-app. Images: hero.png only. Links: pillar, deploy-lovable, pricing.
Honesty guardrails: Linux stacks; Let's Encrypt is free + auto-renewed by platform; DNS propagation is out of anyone's hands (be honest). No blurbs.
