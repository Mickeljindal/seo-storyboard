# Brief: subuser-and-uac-guide

## Role in the cluster

Silo 6 (Agency & multi-app) planned spoke. Pillar: `hosting-for-agencies-playbook` (live). This is the
foundational access-control how-to the rest of the cluster leans on (onboarding, offboarding, and
client billing all assume scoped access exists).

## Keyword grounding (honest)

No fabricated volume. This is a **topical-authority + support spoke**, not a volume play, which the
operating system explicitly allows (relevance over volume; recurring customer question). Real intent
phrases people use: user access control hosting, subuser hosting, give client access without password,
agency team permissions, per-resource permissions, scoped access hosting, add a developer to my server
without root. If a volume check is wanted later, mine "user access control" / "team permissions
hosting"; until then this page's value is completing the cluster and feeding the pillar, stated plainly.

Primary: **subusers and user access control (UAC)**. Secondary: give a client access without sharing
the password, agency team permissions, per-resource per-action permissions, scoped hosting access,
add a contractor without root.

## Cannibalisation check (done, task 1)

The only overlap is one section in `reseller-hosting-vs-managed-cloud` titled "The agency-specific win:
scoped access for clients and teammates", which argues WHY managed cloud gives scoped access. This page
is the HOW: the mechanics of subusers, the per-resource-per-action permission model, role design, and a
revocation drill. It links to the reseller page for the why rather than repeating it. Distinct intent.

## Information gain (the approval question)

The one idea most access guides miss: **permission is two-dimensional, not a single on/off.** UAC is
per-resource AND per-action, so "access to the store" is not one switch, it is a grid of (which app,
which database, which bucket) times (view, deploy, restart, delete, manage billing). The article makes
that grid explicit and turns it into ready-to-use role recipes for the four people an agency actually
adds: a developer, a client, a billing contact, and a short-term contractor. Then a revocation drill,
because the real test of an access model is how fast you can cut someone off, not how you grant them.

Angles: the-failure-is-invisible (a shared root password leaks silently and you never know who did
what), the-fix-is-structural (roles retire the whole "who has the password" problem), name-the-tradeoff
(more granular means more to manage; match the grain to the risk).

## Verified product facts used (only from kloudbean-facts.md)

- Subusers + User Access Control (UAC): granular per-resource, per-action permissions. CONFIRMED.
- Social login (Google/GitHub/LinkedIn). CONFIRMED.
- HttpOnly cookie sessions (XSS/CSRF hardening). CONFIRMED.
- Audit Trail: immutable, searchable, account-wide activity log with CSV export — ENTERPRISE only.
  Framed explicitly as an enterprise capability, so a reader on a normal plan is not misled.
- Do NOT assert: a self-serve MFA toggle (not in facts); white-label client branding (unconfirmed).
  2FA is referenced only via the social-login provider's own account security, not as a Kloudbean
  feature, and the dedicated two-factor spoke will handle that topic.

## Format

Operational how-to. The problem with one shared login, what a subuser is, the two-dimensional
permission grid (a real table), four role recipes, the client-visibility case, sign-in and session
hardening, a revocation drill, then the honest boundary. Not a feature list.
