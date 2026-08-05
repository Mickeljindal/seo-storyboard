# Brief — Cloud Load Balancer Explained (Q&A explainer)

Cluster 9. Primary kw: cloud load balancer / what is a load balancer / load balancer pricing. Intent: informational. Signal: cloud load balancer pricing 70.
FORMAT: Q&A explainer (H2s = real questions). Not adjacent to other Q&A. Opener = definition/scenario.
Questions: what is a load balancer? / why need one (redundancy + scale)? / how does it route traffic (round-robin, health checks)? / do I need one for a small site (usually no)? / what about sessions (sticky sessions / shared session store)? / what does it cost? / load balancer vs CDN? SCREENSHOT flb-load-balancer.png.
Real: cloud load balancer pricing 70.
Honesty woven: Linux; managed LB handles health checks+routing; you own the app nodes; small sites don't need one; needs shared session/state across nodes.
Byline: "Kloudbean · Spread the traffic, share the load."
Slug: cloud-load-balancer-explained. Links: autoscaling-explained, scalable-wordpress-hosting (C6), database-read-replicas-scaling (C7).
