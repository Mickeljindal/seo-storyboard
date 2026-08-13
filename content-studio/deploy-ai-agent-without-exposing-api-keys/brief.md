# Brief — Deploy an AI Agent Without Exposing Your API Keys

Cluster 9 (Security, Scaling & Load Balancing). Intent: informational + high-intent security (people
who just shipped an AI agent and are scared, or already got a surprise bill). Format: security field
guide with one strong opinion and one anti-pattern. NOT the fixed intro/why/steps/CTA template.

## Keyword grounding
- Primary keyword: `deploy AI agent without exposing API keys` (H1, title, meta, first 100 words, one H2).
- Secondary / long-tail woven through body + FAQ:
  - api key security, hide api key from frontend, backend proxy for api key,
  - openai api key exposed / leaked, store api key in environment variables,
  - rotate api key, rate limit ai api, spend cap / usage cap, per-user quota,
  - NEXT_PUBLIC / VITE env var leak, is it safe to call openai from the browser.
- No fabricated volumes. These are grounded in the real search shape around AI-key leaks (DevTools
  network tab, GitHub secret scanning, surprise provider bills). Re-mine against SEMrush/DataForSEO
  before any refresh; volumes not asserted in copy.

## Angle / information gain
The #1 mistake AI builders make: shipping the provider key to the browser or committing it to Git.
Teach: (1) if the client can read it, it's already public; (2) the fix is a thin backend proxy
(browser -> your backend holds the key -> provider); (3) key in a server-side env var, never code;
(4) rotate on leak; (5) a proxy with no auth is just a slower leak, so add per-user auth + quotas +
rate limits + a provider spend cap; (6) log who called the model. One concrete leaked path
(NEXT_PUBLIC_/VITE_ prefix inlines the key into the shipped JS bundle) and exactly how to close it.

## Cannot-copy / originality
- Founder-grade opinion: a key in the browser is not a smaller risk than a key in Git, it's the same
  risk. Client-side keys are never safe, obfuscation included.
- Anti-pattern beat: a proxy with no auth in front of it (open relay for your own bill).
- Real, checkable detail: NEXT_PUBLIC_ / VITE_ prefixes bake the value into the client bundle;
  DevTools Network tab shows the Authorization: Bearer header; providers scan public commits and can
  auto-revoke a leaked key.

## Visual
Bespoke inline SVG: blocked path (Browser carrying the key -> provider, crossed out in red) vs safe
path (Browser -> Your backend holding the key in an env var -> provider), brand navy/purple/green.
Real console screenshots: env-vars.png (set the key in the dashboard), firewall.png (lock the backend).

## Kloudbean (honest, near the END)
Real facts only: env vars set in the dashboard UI; server-side runtime for Node/Python; IP Access
Control = whitelist the app server's IP; Shorewall + Fail2ban baseline; free SSL; managed =
server/stack/SSL/backups/patching, you own code + data. Private networking/VPC is Enterprise-only,
NOT default. Account-level Audit Trail is Enterprise; app-level "who called the model" logging is the
reader's own code. No invented numbers/customers/uptime, no "certified", no "100% secure", no hype.

## Links (real slugs only)
UP: last-mile-of-vibe-coding. Across: secrets-management, environment-variables-done-right,
ai-built-app-security-checklist, add-managed-database-to-your-app. Money: kloudbean.com + /pricing/.

Byline: "Kloudbean · Keep the key on the server."
Slug: deploy-ai-agent-without-exposing-api-keys.
