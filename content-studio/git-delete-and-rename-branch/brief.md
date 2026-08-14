# Brief: git-delete-and-rename-branch

## Angle (knowledge-first reference)
The one page that gets the whole branch family right: delete AND rename, local AND remote, with
exact commands and the gotchas nobody bundles together. Most ranking pages answer a single case
(delete a local branch) and never mention the remote, the rename, upstream tracking, pruning, or
the effect on teammates. This assembles all of it around one mental model: the word "branch" means
three different objects (local branch, remote branch, remote-tracking ref), and every command makes
sense once you see them as separate.

## Target keyword
- **Primary:** git delete branch
- **Secondary (merged into ONE page, not split):** delete remote branch, git rename branch,
  rename local branch, git change branch name, git delete local branch, delete branch on GitHub.

Deliberately ONE article covering delete + rename, local + remote. Splitting these into thin
per-noun pages would cannibalise and each would answer less than the forum thread it competes with.

Volumes not asserted. No SEMrush/DataForSEO figure was supplied for this exact family in-repo, so
this is owner-directed + intent-grounded. No invented volumes. (These are perennial high-demand
Git queries; if precise volume/KD is needed later, pull it before asserting a number.)

## Intent
Informational / reference. Reader has a specific branch task and wants the exact command plus enough
"why" to not break something shared. Payoff is understanding and a copy-paste command, not a signup.

## Information gain (one sentence)
It unifies the entire delete/rename family (local + remote) under the three-objects mental model,
including the parts single-answer pages skip: there is no direct remote rename (push-new then
delete-old), how to reset upstream tracking after a rename, pruning stale remote-tracking refs, and
what a delete or force-push does to teammates.

## Knowledge it delivers (all checkable git behaviour)
- Local branch vs remote branch vs remote-tracking ref (origin/x is a cache refreshed by fetch).
- Delete local: git branch -d (merged-only, safe) vs -D (force); cannot delete the checked-out
  branch; reflog can often recover a mistaken delete.
- Delete remote: git push origin --delete name (and the older colon refspec form); it is a push,
  so it needs write access and affects everyone.
- Rename local: git branch -m new (current) or -m old new; instant, local, breaks upstream link.
- Rename remote: no direct command; four steps (rename local, push -u new, delete old remote,
  prune); change the default branch in host settings first if renaming the default.
- Fix upstream: git branch -vv to inspect; git push -u / git branch --set-upstream-to to relink.
- Prune: git fetch --prune; fetch.prune config; git branch --merged for cleanup candidates.
- Teammate impact: shared delete/rename and the force-push hazard; --force-with-lease over --force.

## Product mention (deliberately minimal, grounded)
Kloudbean appears once, lightly, in the final "Branches, CI/CD, and your deploys" section plus the
CTA. Grounded ONLY in kloudbean-facts.md: managed CI/CD connects a Git repo and builds/deploys on
every push, with deployment history + live build logs. No invented features. No private-networking,
no SLA, no "no limits", no superlatives. CTA feature line uses true defaults only (Managed CI/CD,
Deploy on every push, Live build logs, Free migration, Free trial).

## Cannibalisation check
- No existing page owns the git branch delete/rename family (checked the deployment-fundamentals
  cluster). ci-cd-auto-deploy-from-github owns the pipeline setup, deploy-node-app-to-managed-cloud
  owns the deploy, ssh-key-authentication owns git remote auth, environment-variables-done-right
  owns config. This page links to all four instead of duplicating them; it owns the branch commands.

## Internal links used (4, all verified to exist)
ci-cd-auto-deploy-from-github, deploy-node-app-to-managed-cloud, ssh-key-authentication,
environment-variables-done-right. (CTA links to kloudbean.com and /pricing/.)

## Format
Knowledge-first reference, ~2000 words. .tldr answer box; 11 H2 sections; two tables (branch -d vs
-D, and a full task -> command reference); one teaching SVG (local branch vs remote branch vs
remote-tracking ref, with git push / git fetch arrows, brand colours); real copy-paste git commands
in code blocks; light CI/CD tie-in + CTA; 9-question FAQ mirrored into FAQPage JSON-LD.
Byline: "Local, remote, and the copy in between." Near-zero em-dashes.
