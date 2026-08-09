# Brief: http-error-406-not-acceptable

## Keyword grounding (SEMrush gap export, 2026-07-23)

Family totals **19,330 across 11 keywords**, KD 21 to 38. Zero prior coverage.

| Keyword | Vol | KD |
|---|---|---|
| **http error 406** (primary) | **5,400** | **22** |
| 406 error | 3,600 | 32 |
| error 606 | 2,400 | 21 |
| 406 error code | 1,600 | 38 |
| 406 not acceptable | 1,600 | 27 |
| 406 not acceptable error | 1,300 | 22 |

Kinsta holds the SERP. Primary set to "http error 406" at KD 22 rather than the head-ish "406 error"
at KD 32.

**On "error 606" (2,400 / KD 21).** There is no HTTP 606, and no 6xx range at all. Rather than
ignoring a 2,400-volume keyword or pretending it is real, the article gives it a short dedicated
section stating plainly that it does not exist, that searchers have almost certainly misread a 406,
and redirecting them to the actual diagnosis. Same honesty pattern used for "your client does not
have permission to get url" in the 403 article, where accuracy about the true source IS the value.

**Secondary terms woven in:** not acceptable, content negotiation, Accept header, q values, media
type, mod_security, modsec_audit.log, SecRuleRemoveById, WAF false positive, wordpress 406 saving
post, vnd vendor media type, application/json.

## Placement
Primary keyword in H1, title, meta, lead, TL;DR. 8 FAQ entries.

## Original value competitors do not have
- **THE REFRAME: the spec definition is not why you are here.** By specification 406 is a content
  negotiation failure. In the real world, on Apache and cPanel-style hosting, it is usually
  mod_security configured to answer 406 instead of 403. Two unrelated problems sharing a status code,
  and the article sorts the reader before advising. Competing articles explain content negotiation
  and leave the majority of readers no better off.
- **THE `Accept: */*` TEST as the splitter.** One command: if asking for anything at all still returns
  406, negotiation is definitionally not the problem, so stop editing headers. Simple, decisive, and
  absent from competing coverage.
- **THE SECURITY-RULE SIGNATURE described concretely**: site works normally, one action fails every
  time, and it is usually saving content containing a code sample, an apostrophe, angle brackets, or
  a SQL keyword. That is exactly the pattern people describe in support tickets and never connect to
  a firewall.
- **Real audit log paths** including the cPanel location, plus the instruction to find the rule `id`
  and `msg` rather than describing the symptom.
- **THREE FIXES IN ORDER OF PREFERENCE**, with the correct one first: change the content if the rule
  is right, then disable that specific rule for that specific path (`SecRuleRemoveById` inside
  `LocationMatch`), then ask the host with the rule ID in hand.
- **"DISABLE THE RULE, NOT THE RULESET"** with the smoke alarm analogy, because turning mod_security
  off entirely is the most common and worst response.
- **AN OPINION ON API DESIGN**: returning 406 to a client that asked for XML from a JSON-only API is
  technically correct and practically unhelpful, because that client is a misconfigured library
  rather than something that needs XML. Two better options given, plus the note that a bare 406 with
  an empty body is the least useful response in the range.
- **"Do not use 406 as a general-purpose rejection the way some firewall configurations do"** —
  turning the article's own diagnosis into advice for API authors.
- Cross-links the identical false-positive pattern to the 403 article, noting the status differs only
  by how the module was configured.

## Honesty handled carefully in the hosting section
This was the risky section and it is deliberately restrained. It states that Kloudbean runs nginx
with Shorewall and Fail2ban (confirmed facts), so the specific shared-mod_security 406 failure mode
is not the shape of problem you meet here. Then explicitly refuses to overclaim: it does NOT say
requests are never blocked, and it states outright that Kloudbean does not ship a managed WAF, since
that is on the unconfirmed list. Notes that enabling Cloudflare rules means those rules can block,
with the diagnosis moving to edge logs. The genuine differentiator claimed is narrow and true: you
are not sharing a ruleset tuned for thousands of unrelated sites, and you have SSH access and your
own logs.

## Internal links (7, verified)
403-forbidden-error, 400-bad-request, http-error-401-unauthorized, 409-conflict-error,
429-too-many-requests, 304-not-modified, secure-wordpress-hosting, security-headers-guide

## Facts check
Kloudbean claims used: managed nginx servers, Shorewall and Fail2ban configured, SSH access, free
SSL, Cloudflare paid add-on and free for enterprise, one dashboard, flat from $8/mo, free migration
assistance. All in kloudbean-facts.md. NO managed-WAF claim, stated explicitly as a non-claim.
mod_security discussed as third-party software the reader may be running, not as a Kloudbean feature.
