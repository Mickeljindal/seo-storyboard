#!/usr/bin/env node
/**
 * PRE-BUILD FIX for the Nitro deploy on Kloudbean.
 *
 * Nitro's dependency tracer `nf3` does:
 *     import { nodeFileTrace } from "@vercel/nft";
 * but @vercel/nft is a CommonJS module. A NAMED import of a CJS module only
 * works when Node's cjs lexer can statically detect the export — which it does
 * not reliably across versions, so the build aborts with:
 *     "[nitro:externals] The requested module '@vercel/nft' does not provide an
 *      export named 'nodeFileTrace'"
 * and no .output/server/index.mjs is produced (the app then crash-loops).
 *
 * Pinning the @vercel/nft version didn't help because the platform's separate
 * nitro-install step keeps swapping it. The ROBUST fix is to stop relying on the
 * named export at all: rewrite that import to a namespace import + property
 * read, which is valid for ANY @vercel/nft version on ANY Node version.
 *
 * This runs as the FIRST step of `npm run build` (after every install), so the
 * patch is applied right before Vite/Nitro build. It never throws into the build.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const rootNm = path.join(root, "node_modules");

// Matches: import { nodeFileTrace } from "@vercel/nft";  (any quotes/spacing)
const IMPORT_RE = /import\s*\{\s*nodeFileTrace\s*\}\s*from\s*(["'])@vercel\/nft\1;?/g;
// CJS/ESM-safe replacement: namespace import never fails at link time, then we
// read nodeFileTrace from the namespace or the CJS default export.
const REPLACEMENT =
  'import * as __kb_nft from "@vercel/nft"; ' +
  "const nodeFileTrace = __kb_nft.nodeFileTrace ?? (__kb_nft.default && __kb_nft.default.nodeFileTrace) ?? __kb_nft.default;";

let patched = 0;

function patchFile(file) {
  let src;
  try {
    src = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  if (!src.includes("@vercel/nft") || !src.includes("nodeFileTrace")) return;
  if (src.includes("__kb_nft")) return; // already patched — idempotent
  IMPORT_RE.lastIndex = 0;
  if (!IMPORT_RE.test(src)) return;
  IMPORT_RE.lastIndex = 0;
  const out = src.replace(IMPORT_RE, REPLACEMENT);
  if (out !== src) {
    fs.writeFileSync(file, out);
    patched++;
    console.log(`[fix-nft] patched @vercel/nft import in ${path.relative(root, file)}`);
  }
}

/** Walk node_modules; patch the broken import in any nf3/nitro source file. */
function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(p);
    } else if (
      /\.(mjs|cjs|js)$/.test(e.name) &&
      (p.includes(`${path.sep}nf3${path.sep}`) || p.includes(`${path.sep}nitro${path.sep}`))
    ) {
      patchFile(p);
    }
  }
}

try {
  walk(rootNm);
  console.log(`[fix-nft] done · patched ${patched} file(s) to use a CJS-safe @vercel/nft import`);
} catch (e) {
  console.warn(`[fix-nft] non-fatal: ${String(e?.message ?? e)}`);
}
