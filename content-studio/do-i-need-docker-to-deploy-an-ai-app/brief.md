# Brief: do-i-need-docker-to-deploy-an-ai-app

## Angle (knowledge-first decision guide)
The honest answer to "do I need Docker to deploy an app" is no, not to ship. This is the
"do I even need it" decision, deliberately DISTINCT from how to host containers. It teaches
what Docker actually solves, what it costs a solo/non-expert builder, that many managed
platforms deploy a normal Node or Python app straight from Git with no Dockerfile, and the
concrete cases where Docker genuinely earns its place. Lands on a fair verdict: use Docker
if X, skip it if Y. Not a promo.

## Target keyword
- **Primary:** do I need Docker to deploy an app
- **Secondary / merge:** do I need Docker for my SaaS, is Docker necessary, Docker for AI apps,
  deploy without Docker, when should I use Docker.

Volumes: not asserted. This is an owner-directed decision-intent topic in the "Deploy AI /
Vibe-Coded Apps" cluster. No SEMrush volume was supplied for this exact query, so no figure is
invented here (owner rule: never fabricate volumes/metrics). Primary keyword placed in H1,
title, meta description, first 100 words, and an H2 ("So, do I need Docker to deploy an app?").

## Intent
Informational / decision. A solo or non-expert builder (Cursor / Lovable / Bolt output) trying
to decide whether to containerize before deploying. Payoff is a confident yes/no plus the
reasoning, not a signup.

## Information gain (one sentence)
It answers the yes/no decision directly and fairly, separating "deploying" from "packaging with
Docker", naming the real costs tutorials skip (Dockerfile upkeep, image builds, a new debug
surface) and the real cases where Docker pays off, which scattered tool docs and forum threads
rarely assemble in one honest place.

## Cannibalisation check (done against real neighbours' H2 sets)
- docker-container-hosting owns "what a container is / Dockerfile in plain terms / how to HOST
  containers from one to many". It has a brief "do you actually need Docker?" section, but the
  page is about hosting containers. This page is the pure DECISION and links to it for the "if
  you decide yes, here's how to run them" path, rather than duplicating the how-to.
- kubernetes-vs-docker owns the orchestration decision (do you need an orchestrator on top).
  Linked as the next layer up, not duplicated.
- why-my-ai-app-works-locally-but-not-in-production owns the config-not-Docker failure modes.
  Linked where the article notes local-vs-prod is usually config, not Docker.
- deploy-ai-built-app-to-production owns the end-to-end ship walkthrough. Linked, not duplicated.
Distinct intent confirmed: this targets the yes/no query, links to neighbours instead of competing.

## Product mention (deliberately minimal)
Kloudbean appears once, in the closing CTA only: connect a Git repo and it builds and deploys a
Node or Python app on every push (grounded in kloudbean-facts.md managed CI/CD). Docker is kept
strictly as a general concept. Per task + facts, NO claim that Kloudbean builds/runs Docker
images for you (Docker on standard plan is unconfirmed as self-serve). No SLA, no superlatives,
no invented features or numbers.

## Internal links used (5, all verified to exist)
ci-cd-auto-deploy-from-github, docker-container-hosting, kubernetes-vs-docker,
why-my-ai-app-works-locally-but-not-in-production, deploy-ai-built-app-to-production.
CTA links to kloudbean.com and /pricing/.

## Format
Decision guide, no fixed template. .tldr answer-first box (~57 words), question-style H2s, two
table.cmp blocks (Git-vs-Docker comparison + a situation-to-decision matrix), one teaching inline
SVG (two paths to production: plain Git deploy vs Docker image build/run, brand navy/purple/green),
two code blocks (git push + package.json, and a minimal Dockerfile), light CTA, 9-question FAQ.
Byline tagline: "Most apps ship just fine without it." Near-zero em-dashes, humanized voice.
