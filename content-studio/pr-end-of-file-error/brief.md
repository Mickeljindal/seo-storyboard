# Brief: pr-end-of-file-error

## Keyword grounding (SEMrush gap export + competitor position exports, 2026-08-01)

Mined with `python3 /tmp/kwlook.py "pr_end_of_file|pr end of file" "pr_connect_reset"` and cross-checked
against the position exports.

**Family total roughly 4,450 combined volume at KD 20 to 26.** Every ranking URL in the export belongs
to one competitor's knowledge base, so the terms are held by a single player rather than contested.

| Keyword | Volume | KD |
|---|---|---|
| pr_end_of_file_error | 1,900 | 25 |
| pr_connect_reset_error | 1,900 | 20 |
| error code: pr_connect_reset_error | 390 | 21 |
| pr_connect_reset_error firefox | 260 | 26 |

Primary kw: **pr_end_of_file_error**. In H1, title, meta description, first 100 words, and an H2.
Secondary: pr_connect_reset_error, pr_connect_reset_error firefox, firefox secure connection failed,
firefox tls error, works in chrome not firefox.

## Cannibalisation check

Verified with a full-library grep: **zero mentions** of `pr_end_of_file`, `pr_connect_reset`, or NSPR
anywhere in the 290 articles. Genuinely uncovered.

One hard boundary. `err-ssl-protocol-error` mentions `SSL_ERROR_RX_RECORD_TOO_LONG` in five places and
has a dedicated H2, "Cause three: HTTPS against a plain HTTP port". So this page must **link** for that
code rather than explain it. A separate `ssl-error-rx-record-too-long` page was considered and rejected
for the same reason, despite a 4,110 family at KD 13 to 19.

Also respected: `fix-ssl-certificate-errors` owns the `NET::ERR_CERT_*` family including
`ERR_CERT_AUTHORITY_INVALID`, and `err-connection-reset` owns the Chrome-side reset with the MTU branch.
This page is the Firefox-side sibling and cross-links both.

## Distinct angle (the spine)

**Neither of these is a TLS error code.** They come from NSPR, the portable runtime layer underneath
Firefox's networking, whose error list is general-purpose I/O. Mozilla's own NSPR reference defines
`PR_CONNECT_RESET_ERROR` as the TCP connection having been reset by the peer, and
`PR_END_OF_FILE_ERROR` as unexpectedly encountering end of file. Neither definition mentions TLS,
certificates, or ciphers. That is exactly why the names are so unhelpful and why searching them returns
file-handling noise. No competing article explains this, and it reframes the whole diagnosis: you are
being told the stream ended, not that anything is wrong with your certificate.

**Second original point, and the practically useful one: Firefox ships its own root certificate store.**
It does not read the operating system store by default. That is the real reason for the "works in Chrome,
fails in Firefox" pattern that brings people to these searches. Verified against Mozilla sources:
the pref is `security.enterprise_roots.enabled`, the enterprise policy is `ImportEnterpriseRoots`, and
there is a UI equivalent in Privacy & Security worded as allowing Firefox to automatically trust
third-party root certificates you install. Mozilla's own security blog documents that this preference
exists specifically to resolve antivirus-caused TLS failures on Windows and macOS.

**Third: the two codes fail at different moments.** A reset is an active kill. An end of file is a quiet
hang-up. That distinction routes the investigation, the same way refused versus timed out does one layer
down.

## Grounding + accuracy

- NSPR definitions taken verbatim in meaning from Mozilla's Firefox source docs NSPR error reference,
  which is cited in the article. No article in the library links it yet.
- Do NOT pin a Firefox version number to the TLS 1.2 floor. Teach the rule and the signature instead,
  per the drafting constraint about moving targets. The checkable artefact is the
  `security.tls.version.min` pref, not a release date.
- The NSPR reference annotates `PR_END_OF_FILE_ERROR` as a Mac OS file error. Do not over-read that into
  a claim that the browser error is Mac-only, because Firefox surfaces it on every platform. State what
  the docs define and what it means in practice, and stop there.
- Real commands only: `openssl s_client` with `-servername` and an explicit TLS version, `-showcerts`
  piped to grep for subject and issuer.
- No invented percentages, no "most users" statistics.

## Honest positioning

Kloudbean facts used: free SSL issued and renewed, managed TLS configuration on managed servers,
Shorewall and Fail2ban configured by default, seven cloud providers, one dashboard, free migration
assistance. Two concessions that belong here and are true:

- A visitor's antivirus, VPN, or corporate proxy causes a large share of these errors and no host can
  reach it. Say so instead of implying a hosting fix.
- Fail2ban, which we configure by default, can itself send the reset that produces
  `PR_CONNECT_RESET_ERROR` for one visitor while everyone else is fine.

## Structure

Field guide, not a numbered how-to. Opens by reframing what the codes actually are. Inline SVG showing
where each code kills the handshake. Discriminator table (Chrome versus Firefox). One section per code.
A site-owner section. 8 FAQs mirrored to FAQPage JSON-LD. No double quotes in any FAQ question, since
the schema cannot carry them.

Byline: "By Kloudbean Engineering · Firefox trusts its own list, not your operating system's."
Unique, not "Faster Than Ever".

## Links out

err-ssl-protocol-error, fix-ssl-certificate-errors, err-connection-reset, ssl-tls-explained,
this-site-cant-be-reached, what-is-sni, cloudflare-error-525-ssl-handshake-failed.
