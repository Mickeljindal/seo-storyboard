# Brief: ftp-vs-sftp

## Keyword grounding (SEMrush gap export, 2026-07-23)

| Keyword | Vol | KD |
|---|---|---|
| **ftp vs sftp** (primary) | **590** | **29** |
| sftp or ftps | 480 | 24 |
| ftp/sftp | 390 | 33 |
| secure ftp vs sftp | 390 | 22 |
| sftp vs ftp | 390 | 29 |

Family 2,240 across 5 keywords, all held by a single Kinsta comparison. Lower volume than previous
batches, which is an honest reflection of the export being mined out rather than a change in standards.
Chosen on RELEVANCE plus winnability: KD 22-29 is the softest band left, and file transfer is something
every hosting customer does in week one.

**Secondary terms woven in:** what port does sftp use, sftp port 22, ftps implicit vs explicit, ftps
port 990, passive mode ftp firewall, sftp without shell access, internal-sftp chroot, ssh key
authentication, rsync over ssh, scp.

## Placement
Primary keyword in H1, title, meta description, the first sentence of the lead, the TL;DR question, and
the first H2 comparison table. First FAQ mirrors the primary query verbatim.

## Cannibalisation check
No existing article mentions FTP, SFTP, or file transfer. The only adjacent slug is
`store-user-uploads-in-object-storage`, which is about where files live rather than how they get there,
so it is linked as the structural fix in the "wrong tool" section rather than competing. Verified before
writing: zero prior coverage.

`server-hardening-checklist` and `fail2ban-shorewall-hardening` cover SSH hardening generally, so this
article links to them rather than re-explaining port 22 protection.

## Structure choice
Correction-first comparison. The lead refuses the standard framing ("SFTP is the secure one") because it
is true and useless, then replaces it with the fact that actually predicts behaviour: SFTP is not FTP at
all. Every subsequent section derives from that.

## Original value competitors do not have
- **Names the real taxonomy error.** Most pages compare two things; there are three, and the two that
  get confused are FTPS and SFTP. The article states plainly that SFTP shares no protocol, no ports, and
  no code with FTP, and that FTPS is the one that genuinely is FTP with TLS.
- **"Secure FTP" identified as the phrase that causes the damage**, with the practical instruction: ask
  which port and whether they mean TLS or SSH. That single question is worth the read for anyone
  onboarding a partner integration.
- **THE COUNTERINTUITIVE CENTREPIECE: adding TLS to FTP makes the firewall problem worse.** Network
  devices used to inspect the plaintext control channel to learn the incoming data port and open it
  automatically. Encrypt that channel and the helper cannot read it, so you hand-configure a passive
  range instead. No competitor page in this SERP explains this, and it is the reason FTPS deployments
  fail in ways FTP did not.
- **Original two-panel port diagram** with the active/passive explanation written into the artwork, plus
  the payoff line: SFTP has none of this because there is no second channel to negotiate.
- **Implicit vs explicit FTPS named as a distinct failure cause** (990 versus AUTH TLS on 21), since a
  client set for one silently fails against a server expecting the other.
- **Key authentication argued as the bigger deal than encryption**, which is the inversion most
  comparisons miss. FTP and FTPS have no key equivalent, and for automation a stored password is a
  credential granting interactive access while a key can be constrained.
- **Answers the one legitimate objection to SFTP** rather than ignoring it: "SSH means shell access". Gives
  the real `Match Group` / `ForceCommand internal-sftp` / `ChrootDirectory` block, and flags the
  requirement that catches everyone, that the chroot directory must be root-owned and not
  user-writable, so the writable folder goes inside it. Also explains WHY `AllowTcpForwarding no`
  matters: without it a restricted account can still reach other machines on your network.
- **Founder position stated as opinion**: running an FTP or FTPS service at all is usually maintaining
  something you did not need, because SFTP arrives with the SSH server you already patch. "Work you
  volunteered for."
- **A section arguing the reader may be asking the wrong question entirely.** A lot of file-transfer
  questions are deployment questions in disguise, so it routes to Git deploys, names `rsync -avz
  --delete` for repeated syncs, and points at object storage when the real problem is a filling disk.
  Teach-first, and it costs us nothing to say.
- **Nuanced answer on speed** instead of the usual "encryption is negligible": FTP can appear faster with
  very many tiny files because SFTP acknowledges operations in its single channel, and the real fix is
  rsync or archiving before sending rather than changing protocol.

## Facts discipline (one careful judgement recorded)
kloudbean-facts.md mentions SSH exactly once, at line 67, and only in passing ("cron jobs from the UI (no
SSH)"), which confirms cron needs no SSH but does not document SSH or SFTP as a named feature. So the
article does NOT claim a Kloudbean SFTP feature. It says SFTP is a property of any managed Linux server
because it ships with the SSH server, and explicitly adds that "it is not a feature anyone should be
selling you". That framing is accurate, and it is also consistent with the existing published
`wordpress-cli-guide`, which already describes connecting over SSH.

The Kloudbean claims are then restricted to confirmed items: Shorewall firewall and Fail2ban by default
(directly relevant, since port 22 attracts constant password guessing), free SSL, 7 clouds with region
choice, automatic backups, subusers with granular per-resource and per-action UAC, IP access control by
address or CIDR, from $8/mo, free migration assistance. The enterprise sentence (VPN, direct SSH from the
internet blocked, dedicated bastion) comes from the enterprise capability file and is framed as the
enterprise-engagement pattern, not a self-serve toggle.

No dedicated-IP claim, no SFTP-jail-as-a-feature claim, no SLA figure.

## Internal links (8, all verified to exist)
server-hardening-checklist (x2), fail2ban-shorewall-hardening (x2), ci-cd-auto-deploy-from-github (x2),
zero-downtime-deployments (x2), store-user-uploads-in-object-storage (x2), s3-compatible-object-storage,
ssl-tls-explained, server-backups-guide
