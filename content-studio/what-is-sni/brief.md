# Brief: what-is-sni

## Keyword grounding (SEMrush gap export, 2026-07-23)

| Keyword | Vol | KD |
|---|---|---|
| **sni** (primary) | **12,100** | **28** |
| server name indication | 2,900 | 40 |
| sni ssl | 260 | 32 |
| what is sni | 260 | 32 |
| server name indication ssl | 210 | 37 |
| sni in ssl | 210 | 25 |
| sni for ssl | 170 | 23 |
| sni meaning | 170 | 32 |
| ssl server name indication | 170 | 34 |
| what is server name indication | 170 | 27 |

Family 17,200 across 16 keywords. Pressable holds the SERP with a single explainer. This is the
strongest remaining on-brand target in the whole export: the head term is 12,100 at KD 28, the intent
is informational, and the topic is load-bearing infrastructure for any hosting company.

**Secondary terms woven in:** sni meaning, encrypted client hello, ech, esni, dedicated ip for ssl,
one ip multiple ssl certificates, openssl s_client servername, wrong certificate served, virtual
hosting https, sni not supported.

## Placement
Primary keyword in H1, title, meta description, the first sentence of the lead, the TL;DR question
("What is SNI in SSL?"), and two H2s. First FAQ mirrors the primary query verbatim.

## Cannibalisation check (SNI was already touched twice, deliberately kept apart)
- `err-ssl-protocol-error` has "Cause five: SNI, when one address hosts several sites". That is SNI as
  one cause in a handshake-failure triage.
- `cloudflare-error-525-ssl-handshake-failed` uses the `-servername` diagnostic trap for edge-to-origin
  TLS.
- `ssl-tls-explained` covers the handshake, termination, certificates, and expiry, and does NOT define SNI.

Resolution: this article owns the DEFINITIONAL and ARCHITECTURAL ground (why the ordering problem exists,
why one IP can serve many certificates, the plaintext privacy consequence, ECH) and routes every
troubleshooting branch outward by name. The failures table explicitly sends handshake collapses to
err-ssl-protocol-error and edge failures to Cloudflare 525. Same split discipline as
gitlab-vs-github pointing at self-host-gitlab.

## Structure choice
Explainer built on a single mechanism (protocol ordering) rather than a definition-then-features list.
The sequence diagram is the spine: once a reader sees that the Host header arrives four steps after the
certificate was needed, every other section follows without further argument.

## Original value competitors do not have
- **Frames it as an ORDERING problem, not a feature.** The `Host` header would have worked fine, it just
  arrives too late. That single observation makes the rest self-evident and it is the thing most
  explainers skip in favour of restating the definition.
- **Names the two pre-SNI workarounds** (one IP per site, or every hostname piled onto one certificate as
  SANs) so the reader understands what SNI replaced, and why hosts used to sell dedicated IPs for SSL.
- **Original six-step sequence diagram** with the two facts encoded in the artwork: the SNI field at step
  2 sits OUTSIDE the encryption, the Host header at step 6 sits inside it.
- **Derives both consequences from the same diagram** rather than treating them separately: many
  certificates per IP is possible, and the hostname is exposed. Same cause.
- **"You never enable SNI"** with an nginx config that never mentions it. The config proves the point that
  SNI is implied by having more than one `server_name` with its own certificate.
- **The privacy section is written in both directions**, which is rare: SNI is how corporate firewalls do
  per-domain policy WITHOUT decrypting traffic, which is the less invasive option, and it is also how
  individual sites get blocked on shared infrastructure. Then scopes the leak honestly and points out
  that fixing SNI without encrypted DNS achieves little, which is why the two efforts moved together.
- **ECH explained through its bootstrapping problem** rather than as an announcement: you need the
  server's key to encrypt the hostname, but you have not connected yet, so the key is published in DNS.
  Plus why ESNI was superseded (encrypting one field while leaving other identifying fields visible) and
  why ECH works best behind a large shared frontend. Ends with the honest note that this is not an
  origin-server setting today, so do not chase it.
- **The `-servername` trap as the article's operational payload**, explicitly flagged as the takeaway for
  skimmers. The failure is quiet: the command returns a valid certificate for the wrong site, so the
  output looks healthy and you go debug the wrong layer. Includes the one-liner that prints subject and
  SANs, and the rule of thumb (command line says fine, browsers disagree, check for `-servername`).
- **The curl counterpart nobody mentions**: curl takes SNI from the URL, so replacing the hostname with an
  IP sends no SNI at all, and `--resolve` is what preserves it.
- **Explains WHY a wrong certificate is served rather than an error.** When SNI names a host no virtual
  host claims, the server answers with the default block. That is deliberate behaviour, and it produces
  the confusing "valid certificate, wrong name" symptom.
- **Kills the dedicated-IP-for-SSL upsell directly**, and notes the upsell outlived its justification by
  about a decade. Then lists the reasons a dedicated address is still legitimate (partner allowlisting,
  a required fixed address, email sending reputation) so the section is useful rather than merely
  contrarian.
- **Turns the legacy-client question into a data-quality warning**: if your analytics show a real
  population of non-SNI clients, verify it, because that signature also looks like bot traffic.

## Facts check
Kloudbean claims used: free SSL issued and renewed automatically; multiple applications per server each
with its own domain and certificate; 7 clouds; managed databases; automatic backups; one dashboard; from
$8/mo; free migration assistance; Cloudflare as a paid add-on and free for enterprise. All confirmed in
kloudbean-facts.md.

Deliberately NOT claimed: dedicated IP addresses as a Kloudbean feature. The facts file does not mention
them, so the article discusses dedicated IPs purely as a general cloud-provider concept and never offers
one. That matters because the section argues against needing one for SSL, and it would be careless to
imply a product we cannot confirm.

No SLA figure, no uptime claim, no assertion about any third party's certificate authority.

## Internal links (6, all verified to exist)
ssl-tls-explained, fix-ssl-certificate-errors, err-ssl-protocol-error (x2),
cloudflare-error-525-ssl-handshake-failed (x2), fix-slow-dns-lookup, err-too-many-redirects
