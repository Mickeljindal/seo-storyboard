# Brief — Permission denied (publickey): How to Fix SSH Key Rejection

Slug: `fix-permission-denied-publickey`. Cluster: SSH / error field guide. Intent: informational, urgent (reader is locked out). Format: diagnosis-first troubleshooting field guide, not a setup tutorial.

## Angle (the information gain)
"The server rejected your key, so find out which key it actually offered." Every competing page lists fixes; this one makes the reader run `ssh -vvv` first and read the `Offering public key:` line, then maps observed log output to cause and fix in a table. Three things most pages get wrong or skip: `-i` without `IdentitiesOnly=yes` still sprays agent keys and can burn `MaxAuthTries`; sshd silently ignores keys on loose permissions (including a group-writable home) and only says so in the server auth log; OpenSSH 8.8 disabled `ssh-rsa` (SHA-1) by default, which breaks old keys on upgrade with the same message.

## Cannibalisation check (done)
- `ssh-key-authentication` owns the concept plus setup (H2s: why passwords lose, keys vs passwords, set up key-only login, team access and rotating keys, managed server fit). Distinct intent: "how do I set this up".
- `what-is-an-ssh-tunnel` owns port forwarding (-L/-R/-D, tunnel vs VPN vs VPC). No overlap.
- This page owns the error string only and links to both instead of re-explaining key auth.

## Keywords
Primary: **permission denied (publickey)** — in H1, `<title>`, meta description, first 100 words, and H2 "Step one: run ssh -vvv and read the offer" plus H2 "What Permission denied (publickey) really means".
Variants woven in: SSH permission denied publickey, ssh key not working, git permission denied publickey, permission denied publickey password, ssh authorized_keys permissions, no mutual signature algorithm, ssh -T git@github.com.
No volume/KD data was supplied for this term, so none is asserted here. High, durable support-question demand (paste-the-error query).
FAQ (9) mirrors PAA-style questions into FAQPage JSON-LD, exact parity with visible h3s.

## Shape (deliberately not the house template)
Lead -> tldr (names `ssh -vvv`) -> what the error means (policy decision, not network) -> read the -vvv offer -> symptom/cause/fix table -> five numbered causes as their own H2s (agent, authorized_keys, permissions + required-modes table, wrong user, disabled key type) -> what this error is NOT (host key vs publickey,password) -> the Git case -> opinion + anti-pattern -> related reading -> CTA -> FAQ.

## Security accuracy (hard constraints honoured)
Never `chmod 777` (called out explicitly as making it worse). Never permanently disable host key checking; verify the new fingerprint out of band. Password auth framed as a weaker temporary fallback. Root login not recommended; `sudo` from a normal account. Permissions stated correctly: `~` 755 and not group-writable, `~/.ssh` 700, `authorized_keys` 600, private key 600, owned by the login user. `sshd -t` before `systemctl reload ssh`, and test in a second terminal.

## Opinion + anti-pattern
Opinion: the safest recovery is the one set up in advance, so keep a second way in (tested console, second authorized key, teammate's key) before touching SSH config. Anti-patterns: editing `sshd_config` and restarting while that session is your only access; pasting a public key with a line break so it silently never matches.

## Kloudbean (one mention, grounded)
Exactly one body sentence, in the "second way in" section: managing servers and SSH keys from the dashboard, cron jobs from the UI without SSH, subusers with scoped access. All confirmed in kloudbean-facts.md. No claim that the product prevents this error. One short CTA at the end, $8/mo entry with a nudge to verify pricing.

## Internal links (6, all verified folders exist)
ssh-key-authentication (x2), what-is-an-ssh-tunnel, run-a-cron-job-without-ssh, git-delete-and-rename-branch, secrets-management, server-hardening-checklist.

## Assets
Hero `images/hero.png` (to render). 3 `.img-slot` spacers: annotated -vvv output, sshd auth log refusal line, Git host SSH keys page. No console screenshots used (none of the existing ones show key management).

## Gate
`node _val.mjs fix-permission-denied-publickey` = [OK]. 0 em-dashes both files, 0 blurbs, Article + Organization + FAQPage JSON-LD, FAQ parity 9/9, HTML code escaped (`&lt;` `&gt;` `&amp;`), md/html in sync. Banned-claim grep clean.

## Freshness triggers
OpenSSH default algorithm changes (the 8.8 `ssh-rsa` note), `MaxAuthTries` default, distro default usernames, Kloudbean dashboard capabilities and entry price.
