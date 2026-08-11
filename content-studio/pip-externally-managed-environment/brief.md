# Brief: pip-externally-managed-environment

## Role
Cluster 2 (Python and deployment). Pillar deploy-flask-app. Money managed-vs-unmanaged-hosting.
High-GEO production error page (paste-into-ChatGPT).

## Keyword grounding (honest, no fabricated volume)
Primary: **externally-managed-environment** (pip error). Secondary: error externally-managed-environment,
pip install Debian 12, PEP 668, break-system-packages, pip venv, pipx, Ubuntu pip error.

## Cannibalisation (content-grep confirmed UNOWNED)
grep across library: "externally-managed-environment" and "PEP 668" = 0 hits. Distinct from
fix-modulenotfounderror-python (import errors, different problem). Reverse-linked from
fix-modulenotfounderror-python.

## Grounding (facts + verified general knowledge)
- GROUNDED: Kloudbean moved to Debian 12 (changelog 2026 Mar), where PEP 668 applies. Real for their users.
- Fixes: venv (right fix), pipx (CLI tools), apt python3-<pkg>, --break-system-packages (last resort,
  risk explained). --user does NOT bypass; deleting the marker = bad. Honest boundary: platform keeps
  OS Python patched; your app's venv + requirements are yours.

## Information gain
1. Decision table (venv/pipx/apt/override) - the whole choice in one quotable block.
2. Reframe: it's not a bug, pip is protecting the system Python. Why Debian did it.
3. Anti-patterns named (sudo pip, delete marker, --user) so readers skip dead ends.

## Format
fix-page pattern: answer-first TL;DR, what-it-means, right-fix, pipx, override-risk, dead-ends,
honest KB fit, 8 FAQ. em-dash 0/0.
