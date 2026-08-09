# Brief: kubernetes-vs-docker

## Keyword grounding (SEMrush gap export, 2026-07-23)

| Keyword | Vol | KD |
|---|---|---|
| **kubernetes vs docker** (primary) | **5,400** | **36** |
| docker vs kubernetes | 2,400 | 38 |
| difference between docker and kubernetes | 880 | 35 |
| kubernetes vs docker compose | 590 | 33 |
| docker swarm vs kubernetes | 480 | 37 |

KD 36 is the hardest target taken in recent batches and it is justified by intent: this is a real
architecture decision with budget behind it, and the SERP is dominated by vendor pages that all answer
it the same shallow way ("Docker packages, Kubernetes orchestrates, use both") without ever telling the
reader whether they need either.

**Secondary terms woven in:** kubernetes deprecated docker, dockershim removed, containerd vs docker,
do I need kubernetes, is docker compose enough for production, kubernetes for small apps, kubernetes
learning curve, container orchestration, OCI image, crictl.

## Placement
Primary keyword in H1, title, meta description, first sentence of the lead, TL;DR question, and the
first FAQ. An H2 is phrased as the misconception people search ("Kubernetes deprecated Docker").

## Structure choice
Myth-correction opening into a decision guide. Deliberately NOT the step-by-step or feature-table shape.
The article's spine is that the comparison is malformed, so it reframes the question twice: first into
"do you need orchestration", then into the four different questions people are actually asking when they
type this. Tables and a diagram support the argument rather than being the payload.

## Original value competitors do not have
- **States the title's claim and then defends it**: you probably need neither. Every competitor page
  concludes "use both". This one says most readers should use neither, which is the more useful answer
  and the one a vendor selling clusters cannot write.
- **An original two-panel diagram** built on the actual distinction: Docker's unit of concern is a
  container on a host, Kubernetes' unit of concern is a fleet. Includes the consequence in the artwork
  (if the Compose host dies, everything dies; if a node dies, containers reschedule).
- **Decomposes the query into four different questions** with four different answers, including the one
  nobody writes down: "should I learn Kubernetes for my career" is a different question from "does my app
  need it", and plenty of adoption is a good career decision and a poor architecture decision at once.
- **The dockershim correction, done properly.** Kubernetes 1.24 removed dockershim, clusters use
  containerd or CRI-O, and containerd is what Docker uses underneath anyway. Images are OCI artefacts so
  `docker build` output runs unchanged. Names the one real consequence (`docker ps` on a node no longer
  shows cluster containers, use `crictl`), which is the concrete detail that proves the point rather than
  asserting it.
- **Three rungs instead of two options** (Docker, Compose, Kubernetes) with a real Compose file, and the
  honest limitation named in one line: it is one machine.
- **A fair, specific account of what Kubernetes actually gives you** (rescheduling across machines,
  declarative reconciliation, health-gated rolling updates, bin packing, a shared substrate for many
  teams) followed by the observation that ties the article together: every one of those pays off in
  proportion to machine count and team count, so one of each means full cost for a sliver of benefit.
- **The operational tax itemised**, which is the section vendor pages omit: control plane, CNI, ingress
  controller, storage classes, RBAC, secrets being base64 rather than encrypted by default, upgrade
  cadence with API deprecations, and observability. Framed as the honest cost of a system that does this
  job, not as criticism.
- **Founder position stated as opinion** (explicitly endorsed by the playbook): most small and mid-sized
  apps do not need Kubernetes, early adoption is a common way to slow down while feeling productive, and
  you trade application complexity you understand for platform complexity you do not. With a concrete
  tell: four engineers running a cluster for one Rails app and a Postgres database.
- **A situation-to-answer table where most rows resolve to a load balancer**, then names that pattern
  out loud: HA and horizontal scaling are the two usual justifications for Kubernetes and both are
  reachable with a load balancer in front of a few servers.
- **An adoption ORDER rather than a yes/no**, because the real failure mode is adopting Kubernetes before
  the prerequisites: containerise properly, use a managed control plane, keep databases out initially,
  write real health checks before manifests, and name who owns upgrades and cluster on-call before the
  migration. The database point is the one most likely to save a reader a bad quarter.
- **"A probe returning 200 unconditionally is worse than none"** because it defeats the exact mechanism
  the reader adopted Kubernetes for.

## Facts discipline (two hard constraints, both respected)
**Docker build/run support is UNCONFIRMED** in kloudbean-facts.md and on the do-not-assert list. The
article therefore explains Docker and Compose purely as industry concepts and makes NO claim that
Kloudbean builds or runs Dockerfiles. The Compose YAML is illustrative of the tool, not of a Kloudbean
workflow. Checked: no sentence connects Docker to the platform.

**Kubernetes and autoscaling are enterprise-only** and confirmed as such. The article says exactly that,
in the words the facts file supports: available through enterprise engagements alongside autoscaling and
custom architectures, designed and operated with the customer, not a self-serve toggle. It adds the line
"saying otherwise would be exactly the overselling this article is arguing against", which turns the
constraint into a credibility move instead of a hedge.

Also handled carefully: the autoscaling FAQ answer says Kubernetes scales only if configured and cannot
scale past a bottleneck outside the app. That keeps it a Kubernetes fact and avoids implying self-serve
Kloudbean autoscaling, which the facts file forbids.

## Kloudbean claims used (all confirmed)
7 clouds with provider and region choice; managed MySQL, MariaDB, PostgreSQL, Redis, Elasticsearch,
MongoDB as one-click standalone databases; Flexible Load Balancer available on any account to enable;
automatic backups; free SSL; Shorewall firewall and Fail2ban by default; managed CI/CD building and
deploying on every push with live build logs; one dashboard; from $8/mo; free migration assistance;
Kubernetes, autoscaling, and custom architectures as enterprise.

## Internal links (8, all verified to exist)
nodejs-health-checks (x2), vertical-vs-horizontal-scaling (x2), cloud-load-balancer-explained (x2),
autoscaling-explained (x2), environment-variables-done-right, graceful-shutdown-nodejs,
zero-downtime-deployments, how-to-deploy-any-app, self-host-gitlab

The self-host-gitlab link is doing real work rather than padding: it is offered as a calibration of what
running heavy platform software actually costs, which is the same argument this article makes about
clusters.

## Version detail hedged
Kubernetes 1.24 for the dockershim removal is stated because it is a fixed historical fact. No current
version numbers, no performance figures, no cost comparisons invented.
