# Brief — Autoscaling Explained (decision-guide)

Cluster 9. Primary kw: autoscaling / do i need autoscaling / auto scaling explained. Intent: informational/decision.
FORMAT: Decision-guide (branch by situation). Not adjacent to other decision-guide. Opener = definition + the real question.
Sections: what autoscaling is (add/remove servers automatically on load) / USE IF (spiky/unpredictable traffic, big day-night variance, viral risk) / DON'T NEED IF (steady traffic, small/predictable → just size once) / prerequisites (STATELESS app, shared session+storage, load balancer, health checks — SCREENSHOT flb-load-balancer.png) / autoscaling vs just scale-up (start simple) / honest caveats (databases don't autoscale like web tier; new-node warmup; cost surprises) / decision summary.
Honesty woven: Linux; needs stateless app + shared state; managed provides LB+scaling; you own app readiness; most don't need it yet.
Byline: "Kloudbean · Scale on the traffic, not the panic."
Slug: autoscaling-explained. Links: cloud-load-balancer-explained, scalable-wordpress-hosting (C6), database-read-replicas-scaling (C7).
