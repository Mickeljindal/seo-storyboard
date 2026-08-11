# Brief: node-version-management

## Role
Cluster 2 (Node.js and deployment). Pillar: best-managed-nodejs-hosting-2026. Money page:
best-managed-nodejs-hosting-2026. Node.js capability gap-fill (user ask: "node js capacity").

## Keyword grounding (honest, no fabricated volume)
Real intent: node version management, which node version to use in production, node lts vs current,
node even vs odd versions, .nvmrc / engines field, "was compiled against a different Node.js version",
node native module error, node end of life. Primary: **node version management**. Secondary: which
Node version to run, even vs odd LTS, pin Node version, native-module ABI break, upgrade Node safely.

## Cannibalisation (checked, grep-first vs live library)
Distinct from: best-managed-nodejs-hosting-2026 (WHERE to host), deploy-node-app-to-managed-cloud
(HOW to deploy), pm2-process-manager-guide (keeping the process alive), fix-cannot-find-module-node
(module-not-found errors, one native-module cause overlaps but that page is about resolution/paths).
THIS owns: choosing + pinning + upgrading the Node major version, and the native-module/ABI rebuild
trap. Links to all four as siblings/up.

## Grounding (kloudbean-facts)
- Node runtime config in the UI (changelog Sep 2025): "set the Node version for your app in the
  console." PM2 multi-process (Jun 2025). Git-based deploys. Managed, patched stack.
- Honest boundary: platform lets you SET/run a version + patches the stack; choosing the right
  version, keeping engines honest, rebuilding native modules on a bump, upgrading before EOL stay
  the customer's app hygiene. No host can pick your version or rebuild a module you didn't reinstall.
- Node facts verified as general runtime knowledge (NOT product claims): even majors -> LTS ~30mo;
  odd majors ~8mo, never LTS; historically new major every 6mo Apr/Oct; moving toward ANNUAL majors.
  TAUGHT THE RULE + signature (unpatchable advisories, deps dropping support), NO invented EOL dates.

## Information gain
1. Even/odd LTS rule learned once = version choice becomes trivial (decision cue).
2. The native-module ABI trap: a Node major bump invalidates compiled deps; bump + clean reinstall
   belong together. Real error signature ("compiled against a different Node.js version").
3. Pin in 3 places (engines, .nvmrc, prod runtime) so "which Node?" has one answer everywhere.
4. Teach the rule not the date (cadence is changing to annual), so the page doesn't rot.

## Format
Explainer/field-guide shape, NOT a step listicle. Why-it-matters (3 guarantees) -> the LTS rule ->
pinning -> native-module trap -> upgrading -> honest Kloudbean fit. 8 FAQ (PAA-style version Qs).
