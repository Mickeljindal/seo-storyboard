# Brief — Error: Cannot Find Module in Node.js: How to Fix It

Cluster: error field-guide / GEO (task #2). Very high AI-citation intent ("cannot find module node", "error cannot find module express", "works locally fails on server", "cannot find module dist/index.js"). Standard Node knowledge, light Kloudbean CI/CD landing. NOT interactive.

## Grounding + accuracy (pure technical, verifiable)
- Two families: bare specifier (package, node_modules) vs relative './...' (file). Causes: not installed, devDependencies-skipped-in-prod, wrong path/typo, CASE SENSITIVITY (macOS/Windows insensitive vs Linux sensitive) = the "works local fails on server" bug, missing ESM .js extension, missing build output (tsc/dist), don't commit node_modules.
- Real commands: npm ls, npm ci --omit=dev, rm -rf node_modules + npm install, tsc/build before start. package.json main/scripts alignment. All correct.
- Kloudbean grounded + honest: managed CI/CD runs install+build on server every push, Linux env, LIVE BUILD LOGS (owner-confirmed feature, Aug 2025). Surfaces case/build traps in the log. Explicitly said "you still have to write the correct import" (no overclaim). No invented features.

## Keywords
Primary: **cannot find module node.js** / **error cannot find module** / **how to fix cannot find module**. In H1/title/meta/first 100 words/H2. Secondary: cannot find module express, cannot find module relative path, works locally fails on server node, cannot find module dist/index.js, node esm cannot find module, devDependencies production, case sensitivity linux node.
6 FAQ mirror PAA -> FAQPage JSON-LD.

## Shape (error field guide, split-into-two-families)
Lead -> tldr -> what it means (resolver) -> package or file? (the key split) -> package trap (devDeps in prod, npm ci --omit=dev) -> file trap (case sensitivity + ESM extension, code) -> build-output trap (tsc/dist/main) -> fix checklist -> variant->cause->fix table -> managed CI/CD catches it (Kloudbean, honest) -> git-deployment screenshot -> related reading -> CTA -> 6 FAQ.

## Internal links (verified exist)
ci-cd-auto-deploy-from-github, environment-variables-done-right, deploy-express-app, deploy-nestjs-app, fix-econnrefused-node (same batch), fix-eaddrinuse-port-already-in-use-node.

## Console screenshots
../assets/console/git-deployment.png. Hero images/hero.png (empty).

## Gate
0 em-dashes; >=1400w; JSON-LD Article+FAQPage valid (no raw < > in JSON-LD; used "npm ls with the package name"); HTML code escaped (&lt;name&gt;); .md raw <name> in backticks; images resolve; 0 blurbs; html/md in sync.
