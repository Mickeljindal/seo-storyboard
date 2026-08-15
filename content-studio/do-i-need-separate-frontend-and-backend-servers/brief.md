# Brief: do-i-need-separate-frontend-and-backend-servers

## Angle (knowledge-first decision guide)
Answers a question beginners and small teams ask constantly, and that box diagrams answer wrongly:
"the drawing has two boxes, so I need two servers." The page separates the logical split (front end
vs back end responsibilities) from the deployment split (how many servers/origins). Honest position:
usually no, especially early. Most apps run fine as a single full-stack app or a static front end
plus an API on one server. Splitting is a real, useful move, but it carries CORS, cross-origin auth,
and a second deploy, so make it when a concrete reason appears, not because a diagram said so. Fair
"when splitting genuinely helps" section + a one-minute decision framework. No metrics, no invented
numbers.

## Target keyword
- **Primary:** do I need separate frontend and backend servers
- **Secondary:** should frontend and backend be on the same server, separate frontend and backend
  hosting, when to split frontend and backend, frontend and backend on one server, monorepo deploy.

Volumes not asserted (owner-directed; intent-grounded decision query). No invented volumes/numbers
anywhere per owner rule (no customer counts, no percentages, no dollar figures, no benchmarks).

## Intent
Informational / decision. A solo builder or small team deciding whether to run one server or split
front end from back end. Payoff is a clear decision, not a signup.

## Information gain (one sentence)
It names the three real deployment shapes (one full-stack app; static front end + API on one server;
fully separate hosts), untangles "separate servers" from "separate origins" and "separate repos,"
lists the genuine reasons to split, and prices the split honestly (CORS, cross-origin cookies/auth,
two coordinated deploys), which the generic "front end and back end are separate, so use two servers"
answers never do.

## Honesty / fairness
Explicit "when splitting genuinely helps" (CDN-delivered static front end, independent scaling,
separate teams/cadences, clearly different stacks). States starting together is reversible (split a
part later when it earns it). Names the day-one-split anti-pattern. Never claims Kloudbean "wins";
frames it as the shape that fits "keep them together for now."

## Product mention (one light touch + CTA, grounded in kloudbean-facts.md)
One managed server can run a full-stack app or serve a static front end + an API together (same
origin, no CORS); add another server/application from the same dashboard when a part genuinely needs
its own home; backups, free SSL, Git deploys are confirmed defaults. No autoscaling-for-all, no
VPC/private-networking-as-default, no invented pricing. Kloudbean appears once near the end plus the
CTA. CTA feature framing uses true defaults only (no "private networking" perk).

## Cannibalisation check (read neighbours' H2 sets)
- host-app-api-and-database-on-one-server (cluster 1) owns the one-server MECHANICS and the app+API+DB
  colocation/ops win, including an H2 on front-end-or-API-as-one-or-two-processes. This page owns the
  DECISION of whether to split front end from back end, and links to it for the how-to rather than
  repeating it.
- do-i-need-microservices-for-my-saas (cluster 8) owns the BACKEND monolith-vs-microservices split.
  Different question (splitting one back end into many services vs splitting front end from back end).
  Linked, not competed with.
- deploy-fullstack-react-app-to-production and deploy-nextjs-app-to-your-own-server own the build/deploy
  steps for shapes one and two; linked as the how-to.
- fix-cors-error-node-production owns the CORS fix; linked as the cost of splitting.
Distinct decision intent, no overlap.

## Internal links used (5, all verified with ls to exist)
host-app-api-and-database-on-one-server, deploy-fullstack-react-app-to-production,
deploy-nextjs-app-to-your-own-server, fix-cors-error-node-production,
do-i-need-microservices-for-my-saas. (CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first decision guide, ~2000 words. .tldr answer-first, 9 H2s (incl. FAQ), one table.cmp
(three-shape decision matrix), one teaching SVG (the three deployment shapes, with the CORS boundary
on the split shape; navy #000f27 / purple #4F1AF3 / green #40b75f), light CTA, 9-question FAQ mirrored
exactly to FAQPage JSON-LD, plus the clean Organization entity block. Near-zero em-dashes. No metrics.
Cluster: 2 - Deployment Fundamentals. Byline: "Split when there's a reason, not because a diagram
said so."
