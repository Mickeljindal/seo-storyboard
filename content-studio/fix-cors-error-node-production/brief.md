# Brief — CORS Errors in Node.js Production: Why It Works Locally but Fails Live

Cluster: error field-guide / GEO (task #2). Very high AI-citation intent ("cors error node production", "no access-control-allow-origin", "cors works locally not production", "express cors credentials"). Standard CORS/Express knowledge + a security-correct stance. Light managed-config landing (honest: CORS is app-level). NOT interactive.

## Grounding + accuracy (pure technical, verifiable + secure-by-default)
- CORS = browser same-origin enforcement; server declares allowed origins via Access-Control-Allow-Origin. Enforced client-side, configured server-side. Real error string used.
- works-local-fails-prod = same-origin/dev-proxy locally vs different domains in prod + hardcoded localhost. Fix: env-driven allowlist (cors package). Wildcard+credentials = HARD browser rule (can't combine); SECURITY: reflect only trusted origins (aligns with content_safety/secure defaults, no "just use *"). Preflight OPTIONS (cors middleware auto-handles). Duplicate header app+proxy = invalid. Protocol/trailing-slash/subdomain/error-response gotchas. All correct.
- Kloudbean grounded + HONEST: explicitly states CORS is the app's responsibility, no host fixes it; platform only helps with per-environment env vars (real feature) so prod doesn't fall back to localhost. No overclaim, no invented "managed CORS/WAF" feature.

## Keywords
Primary: **cors error node production** / **cors works locally but not production** / **no access-control-allow-origin node**. In H1/title/meta/first 100 words/H2. Secondary: express cors setup, cors credentials wildcard, cors preflight options, access-control-allow-origin node, cors duplicate header nginx, cors allowed origins env.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (error field guide, secure-by-default)
Lead -> tldr -> what CORS is (browser-enforced, server-configured) -> why local vs prod -> fix in Express (env-driven allowlist code) -> wildcard+credentials trap (security + reflect-trusted code) -> preflight OPTIONS -> double headers app vs proxy -> gotchas checklist -> symptom->cause->fix table -> where managed config helps/doesn't (honest) -> env-vars screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist)
security-headers-guide, environment-variables-done-right, deploy-express-app, nginx-reverse-proxy-for-node, custom-domain-and-ssl-for-your-app.

## Console screenshots
../assets/console/env-vars.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (wildcard question -> "to a wildcard" wording, no raw * issue; no < >); code has no angle brackets; images resolve; 0 blurbs; html/md in sync.
