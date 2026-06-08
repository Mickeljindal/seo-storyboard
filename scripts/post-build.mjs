#!/usr/bin/env node
/**
 * Post-build: copy PGlite binary files to the production output directory.
 * PGlite needs pglite.data + pglite.wasm + initdb.wasm at runtime.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Source: where PGlite binaries live in node_modules
const pgliteSrc = path.join(root, "node_modules/@electric-sql/pglite/dist");

// Possible destinations the production server might look for them
const destinations = [
  path.join(root, "dist/server"),
  path.join(root, "dist/server/_libs"),
  path.join(root, ".output/server"),
  path.join(root, ".output/server/_libs"),
];

const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];

let copied = 0;
for (const dest of destinations) {
  fs.mkdirSync(dest, { recursive: true });
  for (const file of files) {
    const src = path.join(pgliteSrc, file);
    const target = path.join(dest, file);
    if (fs.existsSync(src) && !fs.existsSync(target)) {
      fs.copyFileSync(src, target);
      copied++;
      console.log(`✓ Copied ${file} → ${path.relative(root, target)}`);
    }
  }
}

// Also copy to the node_modules location in dist (some bundlers resolve from there)
const distNodeModules = path.join(root, "dist/server/node_modules/@electric-sql/pglite/dist");
fs.mkdirSync(distNodeModules, { recursive: true });
for (const file of files) {
  const src = path.join(pgliteSrc, file);
  const target = path.join(distNodeModules, file);
  if (fs.existsSync(src) && !fs.existsSync(target)) {
    fs.copyFileSync(src, target);
    copied++;
    console.log(`✓ Copied ${file} → ${path.relative(root, target)}`);
  }
}

if (copied === 0) {
  console.log("PGlite binaries already in place (or source not found).");
} else {
  console.log(`\n✓ ${copied} PGlite binary files copied for production.`);
}
