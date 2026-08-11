# Brief: fix-digital-envelope-routines-unsupported-node

## Role
Cluster 2 (Node.js and deployment). Pillar + money best-managed-nodejs-hosting-2026. High-GEO error page.

## Keyword grounding (honest)
Primary: **digital envelope routines unsupported** / error:0308010C. Secondary: ERR_OSSL_EVP_UNSUPPORTED,
openssl-legacy-provider, react-scripts digital envelope, Node 17 webpack error, npm start OpenSSL error.

## Cannibalisation (content-grep confirmed UNOWNED)
"digital envelope" and "ERR_OSSL" = 0 hits. node-version-management does NOT cover it (grep confirmed).
Distinct: node-version-management is the CONCEPT (version cadence/pinning); this is the specific error.
Bidirectional link with node-version-management (added reverse link there).

## Grounding (verified general Node knowledge)
- Node 17+ bundles OpenSSL 3.0, which disables the legacy MD4-based hash old Webpack 4 / react-scripts <5
  used for non-security identifiers. Real fix: upgrade build tooling. Bridge: NODE_OPTIONS=--openssl-legacy-provider.
  AVOID: downgrading to Node 16 (EOL). Honest: the popular flag is a band-aid, not the cure.
- KB angle: set Node version in console (Sep 2025 changelog) + Git deploys + build logs = runtime is not a surprise.

## Information gain
1. "Your code didn't change, the runtime did" - names the version bump as the true cause.
2. Real-fix-vs-workaround-vs-avoid framing (upgrade > flag-bridge > NOT downgrade-to-EOL).
3. Ties the error to version drift across machines (why one dev sees it, another doesn't).

## Format
fix-page: answer-first TL;DR, what-it-means, why-after-version-change, real-fix, workaround-is-temporary,
avoid-downgrade, honest KB fit, 8 FAQ. em-dash 0/0.
