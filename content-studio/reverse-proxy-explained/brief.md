# Brief — Reverse Proxy Explained (concept explainer)

Silo 8 (Cloud fundamentals). SPOKE off the pillar how-cloud-hosting-works.
Primary kw: **reverse proxy explained** (informational; concept/definition intent).
Placed in H1, <title>, meta description, first 100 words, and the recap H2 ("Reverse proxy explained: what to actually remember").

## Keywords woven (grounded, hedge any volumes; no fabricated numbers)
- what is a reverse proxy (H2 "What is a reverse proxy?")
- how does a reverse proxy work (H2 "How does a reverse proxy work, one request at a time?")
- reverse proxy vs forward proxy (H2 + cmp table)
- reverse proxy vs load balancer (H2 + cmp table; the key differentiation vs the sibling article)
- nginx reverse proxy (H2 "Nginx reverse proxy: reading a real config" + real config)
- long-tail / PAA answered in FAQ: 502 bad gateway cause, does a reverse proxy handle SSL, do I configure it myself, does it make my site faster.

## Shape (NOT the pillar's request-walk, NOT the LB Q&A)
Concept explainer that builds to a debugging payoff: "a 502 is the reverse proxy talking to you." Definition -> how it works -> what it does -> vs forward proxy -> vs load balancer -> real Nginx config -> the 502 payoff + founder note -> how it fits on Kloudbean -> memorable recap -> CTA -> FAQ.

## DIFFERENTIATION from cloud-load-balancer-explained (sibling)
A reverse proxy is NOT the same as a load balancer, though they overlap. Framing used: a load balancer is a reverse proxy specialized for distributing across many backends (pool + health checks); a reverse proxy in front of ONE app is still useful (TLS, routing, static files, hiding the backend). Explicit "reverse proxy vs load balancer" H2 + table + link across to the LB article.

## SVG (bespoke, unique)
Two panels: REVERSE PROXY (clients -> proxy [TLS/routing/buffering] -> hidden app nodes A/B on 127.0.0.1) contrasted below with FORWARD PROXY (one client -> forward proxy -> open internet). Brand navy #000f27 / purple #4F1AF3 / green #40b75f; forward panel muted gray to signal the flip. Caption: hides servers vs hides the client, opposite directions.

## Screenshots (../assets/console/) + slots
Real: flb-load-balancer (LB = specialized reverse proxy), add-application (platform wires proxy to your port), dashboard (whole stack, one login). 3 img-slots: Server: nginx response header; SSL cert terminating at the proxy; app runtime HTTP port/bind setting.

## Internal links (6, all folders exist)
UP: how-cloud-hosting-works (pillar). ACROSS: cloud-load-balancer-explained, fix-503-after-deploying-your-app, deploy-node-app-to-managed-cloud, what-is-a-vpc. MONEY: best-managed-cloud-hosting.

## Fact grounding (kloudbean-facts.md)
- Reverse proxy / Nginx concepts kept general and accurate.
- Kloudbean runs the web server / reverse proxy (Nginx or Apache) in front of your app; free auto-renewing SSL terminates there; you don't hand-roll nginx.conf for a normal app.
- 502/503 = proxy can't reach the app; fix = bind 0.0.0.0 + correct PORT from env.
- Built-in Flexible Load Balancer on every account, off by default (the specialized reverse proxy).
- One dashboard for the whole stack; IP allow-listing / VPC; Linux stacks (Node/PHP/Python/Ruby/Java).
- Pricing: from $8/mo; Enterprise custom. Free migration + free trial approved.
- NOT claimed: any specific proxy product/config surface the platform exposes beyond the above; no customer/geo counts; no certification.

## Founder note
On a managed host you usually don't hand-configure the proxy; knowing it's there is what lets you debug a 502 fast (look at bind address + port, not the proxy).

## Byline (unique; NOT "Faster Than Ever")
By Kloudbean Infrastructure · The quiet server in front of your app, and the reason a 502 is it talking to you.

## Length target
2000-2600 words. Answer-first .tldr (51 words).
