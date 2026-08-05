# Brief — Cloud SLA / Uptime Explained (cost-breakdown, nines table)

Cluster 10. Primary kw: ec2 sla (140) / cloud sla / what does 99.9% uptime mean / uptime sla. Intent: informational.
FORMAT: Cost-breakdown but of THE NUMBERS — the "nines" table (downtime/yr + /mo per SLA level). Distinct from listicle/Q&A/decision. Opener = marketing "99.9%!" vs what it actually allows → do the math.
Flow: what an SLA is (promise + penalty) / nines table (99, 99.9, 99.95, 99.99, 99.999 → downtime yr+mo, table.cmp) / reading it (99.9% = ~8.77h/yr "allowed") / the catch (what counts as downtime; scheduled maintenance often excluded; how measured) / the penalty = service credit (small % of bill, NOT your lost revenue) / single-number vs architecture (one server's SLA ≠ your app uptime; redundancy via load balancing raises it) → flb screenshot / EC2 SLA real example (hedge "as AWS commonly documents ~99.99% region-level") / honest boundary.
SCREENSHOT: flb-load-balancer.png (redundancy across servers = how you actually raise real uptime).
Nines table (standard figures): 99%=~3.65d/yr ~7.3h/mo; 99.9%=~8.77h/yr ~43.8m/mo; 99.95%=~4.38h/yr ~21.9m/mo; 99.99%=~52.6m/yr ~4.4m/mo; 99.999%=~5.26m/yr ~26s/mo.
Honesty woven: host SLA covers infra availability, not your app's bugs/bad deploys; real uptime = provider SLA + your redundancy + your code; credits ≠ compensation for lost revenue; numbers illustrative, read the actual SLA doc.
Byline: "Kloudbean · What the nines really promise."
Slug: cloud-sla-explained. Links: autoscaling-explained (C9), cloud-load-balancer-explained (C9), enterprise-wordpress-hosting.
