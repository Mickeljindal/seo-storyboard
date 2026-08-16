#!/usr/bin/env node
// Find articles with no inbound internal links, and propose candidate parents.
// Read-only. Usage: node scripts/find-orphan-articles.mjs
// Find articles nobody links to, and propose the most natural parent for each.
import fs from "node:fs";
import path from "node:path";

const CS = "content-studio";
const read = (s) => {
  const f = path.join(CS, s, `${s}.html`);
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
};
const slugs = fs.readdirSync(CS).filter((s) => read(s));

const meta = new Map();
for (const s of slugs) {
  const h = read(s);
  const title = (h.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
  const desc = (h.match(/<meta name="description" content="([^"]*)"/i)?.[1] || "").trim();
  const h2s = [...h.matchAll(/<h2>([\s\S]*?)<\/h2>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
  const outbound = new Set();
  for (const m of h.matchAll(/kloudbean\.com\/blog\/([a-z0-9_-]+)\//g)) if (m[1] !== s) outbound.add(m[1]);
  const words = (h.replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length;
  meta.set(s, { title, desc, h2s, outbound, words });
}

const inbound = new Map(slugs.map((s) => [s, 0]));
for (const [, m] of meta) for (const t of m.outbound) if (inbound.has(t)) inbound.set(t, inbound.get(t) + 1);

const orphans = slugs.filter((s) => inbound.get(s) === 0);

// Topical similarity on slug + title + description tokens.
const STOP = new Set("the a an and or for to of in on with your you how what why is are be do does can it its as at by from more most best guide vs use using into when where which that this than then".split(" "));
const tok = (s) => new Set((s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w)));
const profile = (s) => tok(`${s.replace(/-/g, " ")} ${meta.get(s).title} ${meta.get(s).desc}`);
const prof = new Map(slugs.map((s) => [s, profile(s)]));
const sim = (a, b) => {
  const A = prof.get(a), B = prof.get(b);
  let i = 0;
  for (const t of A) if (B.has(t)) i++;
  return i / Math.sqrt(A.size * B.size || 1);
};

const live = new Set(JSON.parse(fs.readFileSync(path.join(CS, "_published.json"), "utf8")).published.map((p) => p.slug));

console.log(`orphans (no inbound links): ${orphans.length}\n`);
const out = [];
for (const o of orphans) {
  const cands = slugs
    .filter((s) => s !== o && !meta.get(s).outbound.has(o))
    .map((s) => ({ s, score: sim(o, s), live: live.has(s), inb: inbound.get(s) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  out.push({ orphan: o, title: meta.get(o).title, candidates: cands });
  console.log(`${o}`);
  console.log(`   "${meta.get(o).title.slice(0, 80)}"`);
  for (const c of cands) {
    console.log(`     ${c.score.toFixed(2)}  ${c.live ? "LIVE " : "     "} ${c.s}  (inbound ${c.inb})`);
  }
}
fs.writeFileSync("/tmp/orphans.json", JSON.stringify(out, null, 2));
console.log(`\nwrote /tmp/orphans.json`);
