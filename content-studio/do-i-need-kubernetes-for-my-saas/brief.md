# Brief: do-i-need-kubernetes-for-my-saas

## Angle (knowledge-first decision guide)
The honest answer to a question forums and AI assistants tend to over-answer. When a founder asks
"how do I run/scale my SaaS," the reflexive advice is often "Kubernetes," which quietly assumes a
fleet and a platform team the reader does not have. This page counters that default for the reader
it hurts most: a solo founder or small team. Position: a new or small SaaS almost never needs
Kubernetes; it needs a server, a database, backups, and SSL, and it grows into orchestration only
when real signals appear. Fair to Kubernetes (a real "when you genuinely need it" section, and a
plain explanation of what it does). No metrics anywhere.

## Target keyword
- **Primary:** do I need Kubernetes for my SaaS
- **Secondary:** do I need k8s, is Kubernetes overkill, Kubernetes for a small SaaS, when do you
  need Kubernetes, Kubernetes alternatives for startups.

Volumes not asserted (owner-directed; intent-grounded decision query). No invented numbers anywhere
per owner rule (no counts, no percentages, no benchmarks, no costs).

## Intent
Informational / decision. A beginner or small team deciding whether to adopt Kubernetes. Payoff is
a clear decision, not a signup.

## Information gain (one sentence)
It explains plainly what Kubernetes actually does (orchestrating many containers across many
machines: self-healing, rollouts, service discovery, fleet scaling), shows why a one-app SaaS has
almost nothing for it to coordinate, names the real cost (a full-time skill and a complexity
budget), gives an honest "when you do need it," the concrete signals you have grown into it, and a
decision framework by team size and scale, which the generic "just use Kubernetes" answers never do.

## Honesty / fairness
Kubernetes is treated fairly: a clear "what it does" section, a genuine "when you genuinely do need
Kubernetes," and the reversibility point (containerise now, adopt later with a team behind you).
Never claims Kloudbean "wins" and never implies Kloudbean hands every account Kubernetes (k8s and
autoscaling are Enterprise-only per kloudbean-facts.md).

## Product mention (one light touch + CTA, grounded in kloudbean-facts.md)
One paragraph near the end: a managed server, or a few app servers behind the built-in Flexible
Load Balancer (built in on every account), across several clouds, with managed databases, automatic
backups, and SSL, from one dashboard, covers most SaaS without orchestration. Kubernetes scoped
correctly as an Enterprise capability, not a default. No autoscaling-for-all, no invented pricing.

## Cannibalisation check
Sibling do-i-need-aws-to-launch-a-saas owns the "raw AWS vs managed platform" launch decision;
kubernetes-vs-docker owns the container-vs-orchestrator concept; autoscaling-explained owns scaling
mechanics; high-availability-explained owns staying-up; host-multiple-apps-one-server owns cheap
multi-app hosting. This page owns the distinct "do I need Kubernetes for my SaaS" decision and links
to those rather than repeating them.

## Internal links used (4, all verified to exist)
kubernetes-vs-docker, autoscaling-explained, high-availability-explained, host-multiple-apps-one-server.
(CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first decision guide, ~2000 words. .tldr answer-first, 8 content H2s plus FAQ, a core
comparison table (Kubernetes vs single managed server) and a decision-by-team-size table, one
teaching SVG (a one-server SaaS vs a Kubernetes cluster of nodes and pods), light CTA, 9-question
FAQ mirrored to FAQPage JSON-LD, plus the clean Organization entity block. Near-zero em-dashes.
No metrics.
Byline: "Kubernetes solves a problem you might not have yet." Cluster: 8 - Infra Concepts.
