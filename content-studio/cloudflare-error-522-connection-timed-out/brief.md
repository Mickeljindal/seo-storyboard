# Brief: cloudflare-error-522-connection-timed-out

## Keyword grounding (competitor organic.Positions exports, 2026-08-01 mine)

Mined with `python3 /tmp/posmine.py 400 46 10 "timed out"`.

| Keyword | Volume | KD | Competitor position |
|---|---|---|---|
| connection timed out error code 522 | 4,400 | 21 | cloudways 10 |

Primary kw: **connection timed out error code 522**. In H1, title, meta description, first 100 words,
and an H2. Secondary: cloudflare error 522, error 522 connection timed out, cloudflare 522 fix,
522 error cloudflare, how to fix error 522, cloudflare origin timeout.

KD 21 with a competitor only at position 10 is the useful part. Nobody has locked this down.

## Cannibalisation check

Fits the established hub-and-spoke shape rather than competing with it. `cloudflare-5xx-error-codes`
is the hub and already carries a summary row for 522 plus a 521-versus-522 FAQ, exactly as it does for
520, 521 and 525, each of which already has its own deep spoke page. There is no 522 spoke. This is it.

Boundaries to respect:

- `cloudflare-error-521-web-server-is-down` owns "is Cloudflare allowed through your firewall?" and
  "the Fail2ban trap". Reference both in one line each, do not re-teach them.
- `err-connection-reset` owns MTU and the refused-versus-timed-out distinction at the browser layer.
- `fix-504-gateway-timeout` owns the slow-response case. 522 is a connection failure, 524 and 504 are
  slow-response failures. Say so once, then link.

## Grounding + accuracy (verified against the primary source)

All numbers below come from Cloudflare's own Error 522 support page, not from recall or a blog:

- **Two different timeouts both produce 522.** Before the TCP connection exists, Cloudflare gives up if
  no SYN+ACK arrives within **19 seconds** of its SYN. After the connection is established, it gives up
  if the request is not acknowledged within **90 seconds**.
- **SYN retry backoff intervals are 1, 1, 1, 1, 1, 2, 4, and 8 seconds.** They sum to 19, which is
  where the 19-second figure comes from.
- **Correction worth recording:** I was about to write 15 seconds from memory, and community posts still
  repeat it. The current official documentation says 19. Verified before drafting.
- Cloudflare names blocked or rate-limited Cloudflare IP ranges in `.htaccess`, iptables, or a firewall
  as the **most common cause**, in its own words.
- Other documented causes: an overloaded or offline origin dropping requests, keepalives disabled at the
  origin, the origin IP in Cloudflare DNS no longer matching the provisioned IP, and dropped packets.
- Platform-specific causes, all documented and rarely covered elsewhere: a Worker with a Custom Domain
  fetching its own hostname returns 522, fixable with a Route, a different hostname, or the
  `global_fetch_strictly_public` compatibility flag; Cloudflare Pages needs a custom domain with the
  CNAME pointed at the custom Pages domain; an Origin Rule whose resulting hostname resolves to a
  reserved address such as `100::` or `192.0.2.0` returns 522.
- Cloudflare's own engineering blog states the cause is most often the origin being slow, offline, or
  losing packets, and less often Cloudflare itself. Useful because it is their own attribution, not ours.

## Distinct angle (the organising principle)

**Two clocks, one error code.** Every competing article treats 522 as a single failure and tells you to
check your firewall. It is actually two different failures that print the same number, and which clock
expired tells you which half of the stack to investigate: the 19-second clock means packets never came
back, so look at filtering and capacity; the 90-second clock means the connection succeeded and the
application never answered, which is a completely different investigation.

Second original cue: **constant or intermittent.** Constant 522 is configuration, a firewall rule or a
wrong IP. Intermittent 522 is capacity, an exhausted listen backlog or a full connection-tracking table.
That single question routes the whole page.

Third: **why it is 522 and not 521.** A firewall rule using DROP produces 522 because nothing is sent
back. The same rule using REJECT produces 521 because a refusal is returned. Same intent, different
error code, and it is checkable in one line of iptables output.

## Honest positioning

The relevant Kloudbean facts: Shorewall and Fail2ban configured by default, server health metrics in the
dashboard, IP access control, managed servers across seven clouds, free migration assistance. The honest
concession that belongs here: a cloud provider security group sits above the host firewall, so a rule
there drops Cloudflare silently and no host-level configuration can override it. Also worth conceding
that Fail2ban, which we configure by default, can itself be the thing banning Cloudflare addresses.
No uptime guarantees, no invented percentages.

## Structure

Not a numbered how-to. Diagnostic field guide organised by which clock expired, then by constant versus
intermittent. Inline SVG of the handshake with both timeout windows marked. Comparison tables for the
two clocks and for 521/522/523/524. Real commands: `ss -ltn`, conntrack count, `curl --resolve`,
iptables check for DROP versus REJECT. 8 FAQs mirrored to FAQPage JSON-LD.

Byline: "By Kloudbean Engineering · Two different timeouts print the same number."
Unique, not "Faster Than Ever".

## Links out

cloudflare-5xx-error-codes, cloudflare-error-521-web-server-is-down, cloudflare-error-520,
cloudflare-error-525-ssl-handshake-failed, fix-504-gateway-timeout, err-connection-reset,
this-site-cant-be-reached, fix-502-bad-gateway-node-nginx.
