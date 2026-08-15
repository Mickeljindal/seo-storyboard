# Brief: do-i-need-cicd

## Angle (knowledge-first decision guide)
The honest answer to a question solo devs and small teams ask constantly, where the usual advice
is polarised and unhelpful ("build a full pipeline day one" vs "CI/CD is enterprise overkill").
The unlock is a distinction most posts skip: CI and CD are two different jobs sharing a slash.
Position: some form of automated deploy (CD, push-to-deploy) is worth it almost immediately, even
solo, because manual deploys are error-prone and "deploy equals git push" removes a whole class of
mistakes and makes rollbacks sane. But you do NOT need a heavy enterprise pipeline early; a full
test matrix and multi-stage gates matter once you have real tests and a team. So: adopt push-to-
deploy now, add automated testing (CI) as the codebase and team grow. Fair verdict, no metrics.

## Target keyword
- **Primary:** do I need CI/CD
- **Secondary:** is CI/CD necessary, do I need CI/CD for a small project, CI/CD for a solo developer,
  when do I need CI/CD, is CI/CD worth it.

Volumes not asserted (owner-directed; intent-grounded decision query). No invented numbers anywhere
(no percentages, no timings, no counts, no dollar figures). Primary keyword placed in H1, title,
meta description, first 100 words, and an H2 ("When do I need CI/CD? A quick way to decide").

## Intent
Informational / decision. A solo dev or small team deciding whether CI/CD is worth setting up, and
which parts. Payoff is a clear decision and an order of operations, not a signup.

## Information gain (one sentence)
It splits CI (build and test on every push) from CD (deploy on every push, incl. delivery vs
deployment), argues the deploy half is the near-immediate win while the testing half scales with
tests/team/cadence, and hands over a three-question decision framework, which the generic
"just set up CI/CD" answers never do.

## Honesty / fairness
Two-sided: names the cost of skipping automated deploy AND the cost of over-building CI too early
(anti-pattern: a multi-stage pipeline gating an empty test folder). Founder opinion stated (a single
smoke test beats a ten-stage pipeline with no tests). Never claims Kloudbean "wins"; frames managed
CI/CD as one way to get the push-to-deploy half. No metrics invented.

## Product mention (one light touch + CTA, grounded in kloudbean-facts.md)
Single light mention in "Where this leaves Kloudbean": managed CI/CD connects a Git repo and builds
and deploys on every push, with deployment history and live build logs in the console. Plus the CTA
line. No autoscaling-for-all, no VPC-as-default, no invented pricing, no "wins".

## Cannibalisation check
ci-cd-auto-deploy-from-github owns the HOW-TO (auto-deploy from GitHub, step by step). This page owns
the DECISION ("do I need it, and which half, when"), explicitly links to the how-to instead of
repeating any steps. zero-downtime-deployments owns deploy-without-outage mechanics;
deploy-ai-built-app-to-production owns the AI-app deploy walkthrough; git-delete-and-rename-branch
owns branch hygiene. This links to those rather than duplicating.

## Internal links used (4, all verified with ls to exist)
ci-cd-auto-deploy-from-github, deploy-ai-built-app-to-production, zero-downtime-deployments,
git-delete-and-rename-branch. (CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first decision guide, ~2000 words. .tldr answer-first, 8 content H2s + FAQ, one three-way
decision table (manual vs push-to-deploy vs full pipeline), one teaching SVG (manual deploy steps vs
push-to-deploy flow with a dashed "add CI later" gate; navy #000f27 / purple #4F1AF3 / green #40b75f),
light CTA, 9-question FAQ mirrored to FAQPage JSON-LD, plus the clean Organization entity block.
Near-zero em-dashes. No metrics. Cluster: 2 - Deployment Fundamentals.
Byline: "Automate the deploy first, the test matrix later."
