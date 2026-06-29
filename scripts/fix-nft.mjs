#!/usr/bin/env node
/**
 * PRE-BUILD FIX for the Nitro deploy on Kloudbean.
 *
 * The platform installs Nitro (v3) in a SEPARATE `npm install` step that runs
 * after our own install and does NOT honour our package.json `overrides`. That
 * step pulls an incompatible @vercel/nft, so Nitro's tracer (nf3) fails with:
 *   "The requested module '@vercel/nft' does not provide an export named 'nodeFileTrace'"
 * which aborts the build and leaves no .output/server/index.mjs.
 *
 * This script runs as the FIRST step of `npm run build` (after every install),
 * so it's the right place to guarantee the correct version:
 *   1. Remove any NESTED @vercel/nft copies so everything resolves to the root.
 *   2. Ensure the root @vercel/nft is exactly the version nf3 expects (1.10.2).
 * It never throws into the build — worst case it logs and continues.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const TARGET = "1.10.2";
const root = process.cwd();
const rootNm = path.join(root, "node_modules");
const rootNft = path.join(rootNm, "@vercel", "nft");

function versionAt(nftDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(nftDir, "package.json"), "utf8")).version;
  } catch {
    return null;
  }
}

/** Recursively find every nested @vercel/nft directory under node_modules. */
function findNftDirs(nmDir, found = []) {
  let entries;
  try {
    entries = fs.readdirSync(nmDir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const p = path.join(nmDir, e.name);
    if (e.name === "@vercel") {
      const nft = path.join(p, "nft");
      if (fs.existsSync(path.join(nft, "package.json"))) found.push(nft);
      // also recurse into other @vercel/* nested node_modules
      continue;
    }
    if (e.name.startsWith("@")) {
      // scope dir: recurse into each scoped package's node_modules
      let subs;
      try {
        subs = fs.readdirSync(p, { withFileTypes: true });
      } catch {
        subs = [];
      }
      for (const s of subs) {
        if (s.isDirectory()) {
          const nested = path.join(p, s.name, "node_modules");
          if (fs.existsSync(nested)) findNftDirs(nested, found);
        }
      }
      continue;
    }
    const nested = path.join(p, "node_modules");
    if (fs.existsSync(nested)) findNftDirs(nested, found);
  }
  return found;
}

try {
  const all = findNftDirs(rootNm);
  let removed = 0;
  for (const dir of all) {
    const isRoot = path.resolve(dir) === path.resolve(rootNft);
    const v = versionAt(dir);
    if (!isRoot && v !== TARGET) {
      // Remove nested/incompatible copy so it resolves up to the root version.
      fs.rmSync(dir, { recursive: true, force: true });
      removed++;
      console.log(`[fix-nft] removed nested @vercel/nft@${v} at ${path.relative(root, dir)}`);
    }
  }

  let rootV = versionAt(rootNft);
  if (rootV !== TARGET) {
    console.log(`[fix-nft] root @vercel/nft is ${rootV ?? "missing"} — installing ${TARGET}`);
    execSync(`npm install @vercel/nft@${TARGET} --no-save --no-audit --no-fund`, {
      stdio: "inherit",
      cwd: root,
    });
    rootV = versionAt(rootNft);
  }

  console.log(`[fix-nft] done · root @vercel/nft=${rootV} · removed ${removed} nested copy(ies)`);
} catch (e) {
  console.warn(`[fix-nft] non-fatal: ${String(e?.message ?? e)}`);
}
