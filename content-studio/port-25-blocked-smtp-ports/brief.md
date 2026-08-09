# Brief: port-25-blocked-smtp-ports

## Keyword grounding (SEMrush gap export, 2026-07-23)

The email and SMTP space totals **71,910 across 235 keywords**, though most of the head volume is
provider-specific setup ("gmail smtp server" 2,400 / KD 66, "office 365 smtp settings" 1,900 / KD 35)
which is not our ground. This article takes the subset that genuinely is a hosting question.

| Keyword | Vol | KD |
|---|---|---|
| **port 25** (primary) | **2,900** | **28** |
| smtp ports | 1,600 | 34 |
| 554 5.7.5 permanent error evaluating dmarc policy | 1,000 | 19 |

Roughly **5,500 combined** for the hosting-relevant terms. Smaller than recent batches, chosen on
relevance rather than volume: outbound port 25 blocking is one of the most common genuine support
questions for anyone deploying an application on a cloud server, and Kloudbean runs servers on seven
clouds that all apply it.

Deliberately NOT targeted: gmail/o365 credential walkthroughs, free SMTP server listicles. Those are
provider documentation topics with no defensible angle from a hosting platform.

**Secondary terms woven in:** port 25 blocked, outbound smtp blocked, smtp port 587, 587 vs 465,
starttls, implicit tls, port 2525, smtp relay, transactional email, spf, dkim, dmarc, p=none,
p=reject, wp_mail not sending, nodemailer requireTLS, dig txt dmarc.

## Placement
Primary keyword in title, meta, lead, TL;DR, and the port table. 8 FAQ entries.

## Original value competitors do not have
- **REFRAMES THE QUESTION.** People search "how do I unblock port 25". The article answers the question
  they should be asking instead, and explains why: even if you succeed, you have taken on a mail server
  whose deliverability depends on the behaviour of everyone who previously held your IP address.
- **THE TIMEOUT-VERSUS-REFUSAL TELL.** The block manifests as a silent upstream drop, so you get a
  timeout rather than a refusal, which means a refusal would point at your own firewall instead. That
  is the same diagnostic distinction used across the error silo (521 vs 522) applied to a new context,
  and it is genuinely useful because it tells you whether to look locally at all.
- **WHY THE BLOCK EXISTS, explained from the provider's incentive** rather than as an arbitrary rule:
  port 25 is unauthenticated by design, receivers blocklist by IP range, so one compromised instance
  degrades deliverability for neighbours. Ends with the point that the block is in your interest.
- **A FIVE-ROW PORT TABLE** including 2525 and the read ports, so the "which port" question is answered
  completely rather than just for 587.
- **THE 587 vs 465 QUESTION SETTLED AND DEFLATED**: both end encrypted, 465 was deprecated then
  effectively reinstated, the practical difference is small, use what your provider documents.
- **`secure: false` WITH `requireTLS: true` EXPLAINED**, because that combination looks wrong and is
  correct, and the consequence of omitting requireTLS is real: a failed upgrade can silently send
  credentials in plain text. Concrete, security-relevant, and widely got wrong.
- **THE THREE DNS RECORDS AS THE REAL DELIVERY GATE**, with the framing that connecting on 587 only
  means the message left. Plus two named mistakes: two SPF records invalidate both (easy when a second
  sending service is added by a different person), and jumping to `p=reject` before reading reports
  bounces legitimate mail from senders you forgot about, such as a CRM or invoicing tool.
- **`dig` VERIFICATION of what is actually published** rather than what you intended, for all three records.
- **A CLEAR FOUNDER POSITION ON SELF-HOSTING MAIL**, split correctly between sending and receiving:
  sending is a reputation problem not a configuration problem, so no; receiving is more reasonable but
  still usually the wrong use of attention. Names the narrow legitimate cases (compliance about storage
  location, enormous volume, mail handling is the product).
- **THE WORDPRESS CONNECTION MADE EXPLICIT**: "WordPress is not sending email" is usually this exact
  problem wearing a different hat, because default `wp_mail` tries to send directly.
- **THE STAGING WARNING**: a staging system mailing real customers is a memorable way to learn about
  environment separation.

## Honesty handled carefully in the hosting section
This is the article where overclaiming would be most tempting and most obviously false, so it opens by
conceding the point: the port 25 block is the underlying cloud provider's policy, and since Kloudbean
runs servers on AWS, Lightsail, GCP, Linode, Vultr, DigitalOcean, and UpCloud, a management layer does
not override it. It then adds the line that a host claiming otherwise is either running its own data
centre or being imprecise, which is both true and a credibility marker. Only genuine adjacent value is
claimed: Shorewall configured so 587 works without hand-built rules, per-application environment
variables, and SSH access so the diagnostics are actually runnable.

## Internal links (6, verified)
environment-variables-done-right, dns-explained, cloudflare-error-521-web-server-is-down,
nodejs-background-jobs-bullmq, fix-504-gateway-timeout, managed-wordpress-hosting

## Facts check
Kloudbean claims used: 7 clouds named exactly as in kloudbean-facts.md, Shorewall configured,
per-application environment variables, SSH access, free SSL, flat from $8/mo, free migration
assistance. No email-sending or relay feature is claimed, because none is listed in the facts file.
No deliverability promise. Honest boundary stated twice (nobody can unblock 25 for you; no host can
repair sender reputation).
