# Brief: why-ai-app-breaks-after-custom-domain

## Target
- **Primary keyword:** app breaks after adding custom domain
- **Secondary / long-tail:** custom domain CORS error, mixed content https, redirect loop custom domain, hardcoded preview URL, OAuth redirect URI mismatch, cookies not working custom domain, API calls fail after domain. Plus the real questions people paste: why did my app break after adding a custom domain, why did login stop working after adding a domain, do I need to rebuild after changing the domain, should my API be on the same domain as my frontend.
- **Volume / difficulty:** no live SEMrush/DataForSEO export was supplied for this exact term in-session, so no fabricated figures are recorded. Treat as a mid-tail troubleshooting query in the AI-deploy cluster (post-launch failure intent). Re-pull real Volume + KD before scaling the sub-cluster. Grounding here is intent-based, per the SEO OS (relevance over raw volume).

## Reader + business outcome
- **Reader:** someone who built an app with an AI builder (Lovable, Bolt, Cursor, v0, Replit) or by hand, had it working on the default preview URL, then added a custom domain and something broke (CORS, login, API calls, OAuth, HTTPS).
- **Business outcome:** capture high-frustration, post-launch intent in the "Deploy AI / Vibe-Coded Apps" cluster and route to Kloudbean's custom domain + auto free SSL + dashboard env vars + Git-deploy rebuild, landing on the honest managed boundary.

## Intent + format
- **Intent:** informational troubleshooting, with a commercial tail (where hosting makes the domain + SSL + rebuild easy).
- **Format:** troubleshooting field guide. Organizing idea: nothing about the app changed except its address, so everything that breaks is something pinned to the old address. Symptom-to-cause table as the index, then one section per break, one bespoke SVG (pieces still pointing at the old URL), one firm opinion, one honest anti-pattern. Shape deliberately varied from the reference (host-ai-chatbot) which is an architecture walkthrough.

## Cannibalisation check (mandatory)
- `custom-domain-and-ssl-for-your-app` owns the SETUP of adding a domain + SSL (DNS records, propagation, issuing the cert, why a cert won't issue). THIS page owns the AFTER-it-breaks diagnosis (things pinned to the old origin). Links to it for setup, does not repeat it.
- `fix-cors-error-node-production` owns the deep CORS fix (preflight, credentials). This page introduces the origin-change CORS symptom and links out for the full fix.
- `fix-ssl-certificate-errors` owns SSL cert error causes. This page only distinguishes "still provisioning" from "misconfigured" and links out.
- `environment-variables-done-right` owns env config (build-time vs runtime). Linked for the hardcoded-URL fix.
- `why-my-ai-app-works-locally-but-not-in-production` owns the general never-worked-in-prod gap. This page is the opposite starting state (it DID work on the preview URL). Linked as the sibling, distinct intent.
- `last-mile-of-vibe-coding` is the pillar/UP link (REQUIRED). `why-ai-apps-fail-in-production` is the config-not-code sibling.
- Decision: distinct intent (post-domain-change breakage), build it.

## Information gain (one sentence)
One place that reframes every post-custom-domain failure as "something was pinned to the old preview URL", with a symptom-to-cause table and the specific fix for CORS, hardcoded build URLs (rebuild not restart), mixed content and redirect loops, cookie domain/SameSite, OAuth redirect URIs, and telling a still-provisioning cert from a misconfigured one.

## Kloudbean grounding (facts only)
Custom domain + free SSL auto-provisioned; environment variables set in the dashboard (so the app can know its own domain); Git deploy so a rebuild after a URL change is one push. Honest boundary: managed = server/stack/SSL/backups/patching; the app's code, CORS rules, cookie settings, and third-party OAuth registrations stay the customer's. No invented numbers, uptime, benchmarks, customers, or "certified". No private-networking-by-default claim. Price omitted (not useful here).

## Internal links used (7, all resolve)
Up: last-mile-of-vibe-coding. Across: why-my-ai-app-works-locally-but-not-in-production, fix-cors-error-node-production, environment-variables-done-right, fix-ssl-certificate-errors, custom-domain-and-ssl-for-your-app, why-ai-apps-fail-in-production. Money: kloudbean.com + /pricing/.

## Validation
`node _val.mjs why-ai-app-breaks-after-custom-domain` must print [OK]: em-dash html=0, em-dash md=0, FAQ parity (9), blurbs=0, internal links resolve, words >= 1400. (hero.png + H2-count warnings acceptable.)
