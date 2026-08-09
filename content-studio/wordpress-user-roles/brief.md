# Brief: wordpress-user-roles

## Keyword grounding (SEMrush gap export, 2026-07-23)

| Keyword | Vol | KD |
|---|---|---|
| **wordpress user roles** (primary) | **1,000** | **30** |
| how to modify/adjust roles and permissions in wordpress | 480 | **8** |
| wp user role | 320 | 28 |

Family roughly 1,800. The KD 8 entry is the softest target found anywhere in this export, and it is a
how-to phrasing, which is why the article includes real code and real WP-CLI commands rather than staying
descriptive. Kinsta holds all three.

**Secondary terms woven in:** wordpress roles and capabilities, wordpress administrator vs editor,
author vs contributor, contributor cannot upload images, upload_files capability, unfiltered_html,
DISALLOW_FILE_EDIT, wp_user_roles, wp cap list, wp user set-role, multisite super admin, least privilege.

## Placement
Primary keyword in H1, title, meta description, first sentence of the lead, TL;DR question, and the FAQ
opener. An H2 is phrased as the capability question people actually search.

## Scope justification (why a CMS topic is in scope here)
WordPress operational how-tos are already established precedent in this library: `wordpress-cli-guide`,
`how-to-clear-wordpress-cache`, `speed-up-wordpress`, `wordpress-staging-environment`. WordPress is a
confirmed one-click application, so this is a product we host rather than topical drift. That is the
distinction that made Git basics a reject and makes this acceptable.

## Cannibalisation check (two near neighbours, both resolved)
- `agency-wordpress-hosting` has "Job 3: Hand out scoped access, not the master key". Read it before
  writing: it is entirely about the HOSTING layer (subusers, UAC, Basic Auth gate, IP access control)
  across a client fleet. It does not discuss WordPress roles. Different layer, so this article links to
  it and the final H2 makes the two-layer distinction explicit rather than blurring it.
- `joomla-vs-wordpress` says WordPress has "five broad roles out of the box" in one comparison line and
  argues Joomla's core ACL as a genuine advantage. Consistent with this article, which confirms five
  single-site roles. Linked at the end for readers whose requirement really is granular ACL, which
  reinforces that article instead of contradicting it.

## Structure choice
Model-first explainer. Refuses the five-tiers framing in the lead and replaces it with capabilities as
the primitive, because that single reframe answers the three most-searched confusions at once. Then
sharp edges, then the security argument, then the layer distinction. Not a listicle of roles.

## Original value competitors do not have
- **Leads with the reframe that makes the rest trivial**: WordPress checks capabilities, never role
  names, so a role is just a named bundle stored in the database. Consequence stated immediately: "Editor
  is not enough but Administrator is too much" is almost never a new role, it is one capability.
- **A can-do / cannot-do table** rather than a feature list, so the boundaries are visible.
- **Names the two boundaries that differ in KIND, not degree.** Author to Editor is a trust decision about
  editorial judgement. Editor to Administrator is content to configuration and code. "Those are not
  adjacent steps on one ladder, and treating them as though they are is how sites end up with nine
  Administrators."
- **THE SECURITY ARGUMENT, stated as an argument rather than a tip**: an Administrator can install
  plugins, installing a plugin means running arbitrary PHP, therefore every Administrator account is a
  route to code execution on your server. "Compromising an Editor gets someone your content.
  Compromising an Administrator gets someone your server." That reframing is the article's centrepiece
  and it is not on the competing pages.
- **`unfiltered_html` given its own section**, because it is the capability nobody realises they granted.
  Editors hold it on single-site installs, so a role handed out as "just content" can inject JavaScript
  that runs for every visitor. The supporting evidence is elegant: multisite strips it from everyone but
  Super Admins, which shows how the project itself rates the risk. Includes the `remove_cap` snippet.
- **ROLES LIVE IN YOUR DATABASE, NOT YOUR CODE** (`wp_options`, key ending `user_roles`). Genuinely
  under-known, and it explains a whole class of confusion: removing a plugin does not necessarily remove
  the capabilities or custom roles it created, so permissions outlive the code that justified them. Plus
  two practical consequences nobody writes down, that `add_cap()` on every page load is a database write
  per request, and that a database restore can silently revert last week's permission change.
- **Multisite framed by its support symptom** ("the plugins menu disappeared") and then defended as
  correct design: a network exists so individual site owners cannot install arbitrary code on shared
  infrastructure.
- **The Contributor upload trap answered with both options**, promote or grant one capability, with real
  code and a `has_cap` guard so it is not writing on every request.
- **A named audit command with a claim attached**: `wp user list --role=administrator`. "On most sites
  that have existed for a few years and been touched by more than one person, the Administrator list
  contains at least one account nobody remembers creating." True, checkable by the reader, and the most
  actionable line in the piece.
- **`DISALLOW_FILE_EDIT` explained by its consequence**, that the dashboard file editor turns a stolen
  session into code execution with no upload step.
- **THE TWO-LAYER DISTINCTION, with the mistake shown running both ways**: someone gets WordPress
  Administrator when Editor plus one capability would do, or a contractor gets the hosting login that
  reaches every site. That is a point only a hosting company is positioned to make, and it is where the
  product enters naturally rather than as an advert.

## Facts accuracy
WordPress specifics asserted: five single-site roles; Super Admin on multisite; multisite moves plugin
installation and theme editing to network level; Contributor lacks `upload_files`; Author lacks page
capabilities and holds `delete_published_posts`; Editors cannot manage users; `unfiltered_html` held by
Administrators and Editors on single site and restricted to Super Admins on multisite; roles stored in
`wp_options` under a `user_roles` key. All standard documented WordPress behaviour. No capability count
asserted, since that number moves between versions.

Kloudbean claims used: subusers with granular per-resource and per-action User Access Control; Basic Auth
gate in front of an application; IP access control by address or CIDR; audit trail on enterprise as an
immutable searchable account-wide log with CSV export; staging; automatic backups; free SSL; Shorewall
and Fail2ban by default; 7 clouds; one-click WordPress; from $8/mo; free migration assistance. All
confirmed in kloudbean-facts.md, with the audit trail correctly marked enterprise.

MFA is recommended generically for WordPress dashboard accounts, which is standard security advice and
not framed as a Kloudbean WordPress feature.

## Validator note
An early draft contained "a two-minute job", which is on the banned-blurb list and would have failed the
zero-blurb gate. Caught pre-validation and rephrased to "a quick job". Second time this list has snagged
an innocent phrase, so it stays worth checking on every article.

## Internal links (8, all verified to exist)
wordpress-multisite-hosting (x2), secure-wordpress-hosting (x2), wordpress-cli-guide (x2),
wordpress-staging-environment (x2), agency-wordpress-hosting (x2), server-hardening-checklist,
server-backups-guide, joomla-vs-wordpress
