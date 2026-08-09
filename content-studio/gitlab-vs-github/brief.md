# Brief: gitlab-vs-github

## Keyword grounding (SEMrush gap export, 2026-07-23)

| Keyword | Vol | KD |
|---|---|---|
| **gitlab vs github** (primary) | **4,400** | **32** |
| github vs gitlab | 1,600 | 35 |
| gitlab vs github ci/cd | 260 | 30 |
| gitlab or github | 170 | 33 |

Family roughly 6,800 across the close variants. Zero Kloudbean coverage. Intent is
commercial-investigation with a genuine decision behind it, which is why it converts better than the
Git-basics keywords sitting next to it in the export.

**Why this one and not the bigger Git terms.** The Git family in this export is 223,290 across 536
keywords, but the head terms are either very hard ("what is github" KD 62, "github.io" KD 92) or
topical drift for a hosting blog. "git delete branch" is 6,600 at KD 31 and a competitor ranks it as a
content-farm play; writing Git tutorials would dilute the deployment authority this library has built.
The defensible Git intersection is anything touching DEPLOYMENT, because managed CI/CD from a Git
repository is a confirmed Kloudbean product. Platform choice qualifies. "How to rename a branch" does not.

**Secondary terms woven in:** gitlab vs github ci/cd, self-hosted git, gitlab self-managed, github
enterprise server, gitlab ci vs github actions, migrate gitlab to github, gitlab vs github for open
source, self-hosted runners, git mirror push.

## Placement
Primary keyword in H1, title, meta description, first sentence of the TL;DR, and an H2 is phrased as
the reader's question in the decision path. 8 FAQ entries mirroring the real PAA set (which is better,
main difference, can I self-host GitHub, GitLab CI vs Actions, migration difficulty, open source,
using both, and the Kloudbean-specific one).

## Cannibalisation check (important, one near-miss)
`self-host-gitlab` ALREADY EXISTS in the library. Checked its H2 set before writing: why self-host,
what is inside GitLab, the RAM floor, sizing by team size, CI runners, the setup, what is managed,
moving from GitLab.com, cost, verdict. That article answers "how do I run GitLab myself". This one
answers "which platform should I choose". Different intent, different SERP. Resolved by making
self-host-gitlab the explicit deeper link on the self-hosting branch, so the two reinforce rather than
compete. Linked twice on purpose.

Also considered and REJECTED for this batch: `npm error code ENOENT` (2,400 / KD 22). Looked
attractive until reading `fix-cannot-find-module-node`, which already owns "File not found: paths,
case, and ESM extensions" plus "The build-output trap". An ENOENT article would have re-covered the
case-sensitivity and missing-file ground on a near-identical query set. Swapped for kubernetes-vs-docker.

## Structure choice
Decision guide, deliberately NOT the feature-grid shape every competitor uses. The opening move is to
say the feature grid is useless because the products converged, then replace it with three questions
and a stop-at-the-first-match path. Comparison tables still appear, but subordinate to the questions
rather than as the payload.

## Original value competitors do not have
- **Refuses the premise in the lead.** Says outright that counting checkboxes leads to "they are nearly
  identical", which is true and unhelpful. Most comparisons on this query are the checkbox exercise.
- **A three-question table at the top** that resolves the decision before the reader scrolls, including
  an explicit "none of the above: either, use what your team knows" row, defended rather than hedged:
  familiarity is a real technical advantage and retraining cost is real.
- **Names self-hosting as the single decisive gap** rather than treating it as one row of twenty. That
  is the honest answer and it is what actually wins GitLab deals.
- **Founder position, stated as opinion:** self-host when you have a requirement, not a preference.
  "We want control" is a preference until somebody names the specific thing that goes wrong without it.
- **Costs of self-hosting stated where the comparison usually stops at "it is free"**: the licence is
  the least of it; you own a web app, database, workers, registry, separate runners, upgrades, backups,
  and the restore test.
- **Open source advantage explained as a network effect, not a feature**, with the concrete mechanism
  (contributors already have accounts and know the flow, tooling assumes a GitHub URL, friction in the
  contribution path costs contributions) and the corollary that the same organisation using GitLab
  internally and GitHub for public code is sensible rather than contradictory.
- **Deflates the CI comparison on purpose.** Says plainly that choosing on CI capability optimises a
  difference the team stops noticing after a fortnight, then redirects to the two things that do matter
  (metered hosted minutes, and self-hosted runners being a deployment credential worth protecting).
- **Lowers the stakes with a real command.** `git clone --mirror` plus `git push --mirror` moves every
  ref, so the code is portable by definition. Then names precisely what does NOT migrate cleanly
  (issues, review history, CI config, secrets, webhooks, permissions) and which of those arrives most
  incomplete. Conclusion: picking wrong costs days, not a rewrite, so do not spend three weeks deciding.
- **An integration override in the decision path**: if you depend on a specific integration, check which
  platform has a maintained one and let that beat every other consideration.

## The GitLab honesty problem, and how it is handled
kloudbean-facts.md names GitHub explicitly for the managed CI/CD repository integration and for OAuth
sign-in. GitLab is not named either way, so the file supports no claim in either direction.

The article therefore states exactly what is documented (repository connect, build and deploy on push,
deployment history, live build logs, GitHub as the documented provider for that integration and OAuth),
then tells GitLab readers what they can do instead: the `adm` deployment utility, or a GitLab pipeline
deploying to a Kloudbean server the way it would to any server they control. It explicitly does NOT say
GitLab is unsupported and does NOT say it is supported. The sentence "I would rather say so than let you
discover it after choosing" carries the credibility, and the same point is repeated in the FAQ because
that is the question a GitLab reader arrives with.

This is the same move as conceding port 25 in `port-25-blocked-smtp-ports`: name the limit first, then
claim the narrower thing that is true.

## Internal links (7, all verified to exist)
self-host-gitlab (x2, the self-hosting branch), ci-cd-auto-deploy-from-github (x2, the deploy branch),
zero-downtime-deployments, environment-variables-done-right, fix-node-app-crashing-on-deploy,
fix-503-after-deploying-your-app, how-to-deploy-any-app

## Facts check
Kloudbean claims used: managed CI/CD connecting a Git repo, build and deploy on every push, deployment
history, live build logs, GitHub as documented integration and OAuth provider, `adm` deployment utility,
7 clouds with region choice, managed MySQL/MariaDB/PostgreSQL/Redis/Elasticsearch/MongoDB, free SSL,
automatic backups, one dashboard, from $8/mo, free migration assistance. All confirmed in
kloudbean-facts.md.

No claim about GitLab support in either direction. No competitor pricing asserted for GitHub Enterprise
Server or GitLab paid tiers, only that one is sold as an enterprise product and the other has a free
self-managed edition, which is durable and checkable. No market-share or user-count figures invented.
