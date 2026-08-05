# Brief — User Access Control Explained (Silo 9 · Security spoke)

**Slug:** user-access-control-explained
**Silo:** 9 (Security + compliance). Role: spoke. Links UP to the pillar (secure-compliant-hosting) and ACROSS to a sibling (soc2-compliant-hosting), bridges to agency/team pages (S5/S6) and backups (S3), one money-page (kloudbean-vs-cloudways).
**Intent:** Teach access-control principles to teams that share one login (startups, agencies, small product teams, anyone answering to auditors), then ground Kloudbean's real subusers + UAC. Teach-first, honest, opinionated. Answers "who can do what, and can we prove it."

## Keywords (volumes hedged; no exact figures fabricated)
- **Primary:** "user access control" (moderate informational volume, security/IT intent). Placed in H1, `<title>`, meta description, first 100 words, and the H2 "What user access control actually means".
- **Also targeting:** "role-based access control" / "RBAC" (solid informational volume), "team permissions for hosting" (long-tail, lower volume, commercial-adjacent).
- **Secondary / weave:** least privilege access, principle of least privilege, subusers, team access hosting, per-resource permissions, separation of duties, offboarding access, shared login risk, audit trail, "who did what", access review, blast radius, authentication vs authorization.
- **Long-tail / PAA-style (answered in body + FAQ):** what is user access control, what is role-based access control (RBAC), why is a shared admin login risky, what is the principle of least privilege, what are subusers, how do I offboard someone safely, what is an audit trail and do I need one, does Kloudbean support team permissions and RBAC, what is separation of duties, how often should I review who has access.

> Volumes are directional only. No specific search-volume or difficulty numbers were available for this topic at write time; if a keyword export lands later, record the figures here. Do not fabricate precise numbers.

## Byline (unique, NOT "Faster Than Ever")
By Kloudbean Security · Least Privilege, By Default. One identity per person, only the access the job needs, and a record of who did what.

## Shape (no fixed template)
Problem-first / principles explainer, not a numbered how-to and deliberately different from the sibling pillar's defense-in-depth stack. Opens on the shared-admin-login incident, quantifies the three real failure modes (no accountability, no least privilege, painful offboarding), then teaches the principles with the WHY behind each, a dedicated RBAC section with a worked permissions matrix and the "everyone is admin" anti-pattern, an offboarding + access-review section, then maps it all to Kloudbean's real controls, then a checklist. CTA before the FAQ.

## Bespoke SVG concept
Two-panel contrast (unique to this article): LEFT "One shared admin login" (navy) with five user dots all funnelling into a single purple ADMIN credential + three failure-mode notes; RIGHT "Scoped subusers + UAC" (green) with three users each wired to their own scoped permission badge + three upside notes. Reinforces RBAC/least-privilege visually. Brand colors navy #000f27, purple #4F1AF3, green #40b75f. Distinct from secure-compliant-hosting's vertical layer stack.

## Console screenshots (real, ../assets/console/)
subusers-uac.png (subusers + granular per-resource/per-action permissions), user-2fa-security.png (account security screen; 2FA framed as general best practice). Plus 3 img-slots (quarterly access-review table, single subuser's permission set close-up, Enterprise audit-trail activity log with CSV export).

## Internal links (7; all target folders verified LIVE)
UP to pillar: secure-compliant-hosting. Sibling S9: soc2-compliant-hosting (audit-trail -> compliance evidence). Bridges: white-label-hosting-for-agencies + agency-wordpress-hosting (S5/S6, onboarding/offboarding at scale), server-backups-guide (S3, recoverability half of "survive a bad day"), what-is-a-managed-server (S8, what "managed" covers). Money-page: kloudbean-vs-cloudways.

## Honesty notes (hard guardrails applied)
- **Audit Trail = Enterprise only.** Stated explicitly as "an Enterprise feature" (immutable, searchable, account-wide, CSV export). Never implied for normal users.
- **2FA kept general.** Framed as a general best practice: "turn on two-factor authentication from your account security settings." user-2fa-security.png captioned as the account security screen. No detailed 2FA mechanics asserted as a specific product claim beyond account security settings (2FA is not listed as a feature in kloudbean-facts.md).
- **Grounded product facts only:** subusers + UAC (granular per-resource, per-action); social login (Google/GitHub/LinkedIn); HttpOnly cookie sessions (XSS/CSRF hardening); IP Access Control (allow/deny, CIDR); Basic Auth gate for apps; one dashboard for the whole stack. All present in kloudbean-facts.md.
- **No invented metrics, no "certified".** No customer/CSAT/geo numbers, no SLA %, no fabricated benchmarks. The "2am dropped database" and "five people, one login" are illustrative patterns, not claimed customer stories.
- **[CONFIRM] facts omitted:** customer-count figure; any SLA %; BitNinja (not relevant here, left out rather than headlined). Enterprise pricing not quoted (custom / contact sales).
- Linux-stack context unchanged; no autoscaling/k8s implied for normal users; comparisons limited to one measured money-page link.
