# Brief: office-365-smtp-settings

## Target keyword and real search data

Source: `kloudgraph-semrush-export` competitor position exports plus the gap export, clustered by
`scripts/build-topic-queue.py`. Six queue families, one intent.

| Family | Volume | Min KD |
|---|---|---|
| `http-365` (office 365 smtp settings) | 6,930 | 21 |
| `mail smtp` (wp mail smtp) | 1,920 | 35 |
| `o365 settings smtp` | 1,600 | 28 |
| `outlook settings smtp` | 880 | 28 |
| `office365 settings smtp` | 880 | 31 |
| `mail plugin smtp` | 720 | 34 |

**Combined roughly 12,930.** All flagged with no nearest neighbour.

| Keyword | Volume | KD |
|---|---|---|
| office 365 smtp settings | 1,900 | 35 |
| o365 smtp settings | 1,600 | 28 |
| wp mail smtp | 1,600 | 35 |
| smtp configuration for office 365 | 880 | 28 |
| outlook smtp settings | 880 | 28 |
| office365 smtp settings | 880 | 31 |
| smtp settings for office 365 | 720 | 28 |
| wp mail smtp plugin in wordpress | 720 | 34 |
| office 365 smtp | 480 | 24 |
| setup office 365 smtp | 480 | 23 |
| office 365 smtp server | 480 | 25 |
| smtp office 365 settings | 320 | 21 |
| microsoft 365 smtp settings | 320 | 38 |

Primary: **Office 365 SMTP settings**. Secondary: microsoft 365 smtp settings, o365 smtp settings,
smtp.office365.com port 587, wp mail smtp, SMTP AUTH disabled, Microsoft 365 SMTP relay, OAuth SMTP.

## Audience note, and an honest correction to the brief I was given

The requested audiences were enterprise, government, solo developers, one-person companies and
vibecoders. So I mined the gap export for those labels: `solo developer`, `one person company`,
`solopreneur`, `indie hacker`, `freelance developer`. **Result: one keyword, volume 30.**

Nobody searches for themselves by job title. Writing pages aimed at the label would be writing for no
traffic. The way to own those audiences is to answer the problems they actually have, and "my app or
site cannot send email" is one of the purest examples: a solo developer, a one-person company running
its own invoicing, and a WordPress owner whose contact form goes nowhere all hit this, and all three
type a settings query into Google. Hence this topic.

## Cannibalisation check (mandatory, done against real H2 sets)

| Existing slug | Owns | Verdict |
|---|---|---|
| `port-25-blocked-smtp-ports` | "Why the block exists", "Which port does what", "The right architecture: send through a relay", "The three records that decide whether mail arrives" (SPF, DKIM, DMARC), "Should you ever run your own mail server?" | Owns the **architecture and deliverability**. This page must NOT re-teach ports, SPF, DKIM, DMARC or relay theory. Link instead. |

Only one neighbour, and the split is clean. That article answers *why won't my server send mail and
what shape should this take*. This one answers *what exactly do I put in the box, and why is Microsoft
rejecting it*. Applying the usual test: `port-25-blocked-smtp-ports` cannot be optimised to serve
"office 365 smtp settings" without becoming a configuration reference, which is not what it is.

## Information gain: the reason this article is worth writing today

**Every page currently ranking for these terms is very likely wrong, because the method they recommend
has been switched off.**

Verified against Microsoft's own sources:

- Microsoft's Exchange team announced Exchange Online will **permanently remove support for Basic
  authentication with Client Submission (SMTP AUTH)**, with rejections starting for a small percentage
  of submissions on **1 March 2026** and reaching **100% rejection on 30 April 2026**. That timeline
  was itself a revision of an earlier September 2025 date.
- So the username-and-password SMTP configuration that every legacy tutorial hands you is at or past
  end of life, and the app password workaround went with it, because app passwords are Basic auth.
- Separately and independently: Microsoft **recommends disabling SMTP AUTH tenant-wide** and enabling
  it only per mailbox, and **if security defaults are enabled, SMTP AUTH is already disabled**. That is
  the single most common reason correct-looking settings fail, and it is checkable in one place.

That combination is the article. It is timely, verifiable, and it changes what the reader should do
rather than restating a host and port number.

Second gain item: a decision table across the three Microsoft-supported sending methods (SMTP AUTH
with OAuth, Microsoft 365 SMTP relay, direct send) plus the fourth pragmatic option, a dedicated
sending service, with the constraint that actually decides it, which is whether your app or plugin can
speak OAuth at all. Most WordPress plugins and small scripts cannot.

## Verified technical claims and how they are phrased

- `smtp.office365.com`, TCP **587**, STARTTLS. Microsoft's documentation states SMTP AUTH is used for
  client submissions "typically on TCP port 587".
- SMTP AUTH supports OAuth in addition to Basic auth. OAuth is the surviving path.
- Tenant-wide and per-mailbox SMTP AUTH switches exist; the tenant setting is in the Exchange admin
  centre under mail flow, and there is a per-mailbox override.
- Security defaults being enabled means SMTP AUTH is already off.
- Basic auth was already fully disabled for other Exchange Online protocols; SMTP AUTH was the last
  holdout, which is why it still worked when everything else stopped.
- **Moving-target discipline:** Microsoft has already moved this deadline once. So the article gives
  the published timeline attributed to Microsoft, and then teaches the **failure signature** so the
  reader can tell what is true for their tenant today rather than trusting a date in an article. No
  claim that it is definitely already blocked for a given reader.

## Product claims

Only what is in `kloudbean-facts.md`: managed servers across seven clouds, application and server logs
in one dashboard, cron jobs from the UI, free SSL, free migration assistance. **No email relay or
email-sending product is claimed, because none is in the product facts.** Outbound port 25 being
blocked is described as general hosting reality, consistent with the existing port-25 article, not as
a Kloudbean-specific policy.

## Format

Configuration reference that opens with the thing that has changed, because a reader who copies the
settings table without reading the first section will be back tomorrow. Settings table, then the
"why correct settings still fail" checklist, then the decision table across methods, then WordPress
specifically, then a short honest recommendation.
