import fs from 'fs';
import path from 'path';

const slug = process.argv[2];
if (!slug) { console.error('usage: node _val.mjs <slug>'); process.exit(1); }
const dir = path.join('content-studio', slug);
const html = fs.readFileSync(path.join(dir, slug + '.html'), 'utf8');
const md = fs.readFileSync(path.join(dir, slug + '.md'), 'utf8');

let fail = 0, warn = 0;
const bad = (m) => { console.log('  FAIL ' + m); fail++; };
const wrn = (m) => { console.log('  warn ' + m); warn++; };

// word count (html body text)
const bodyText = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
const words = bodyText.split(/\s+/).filter(Boolean).length;
if (words < 1400) bad('word count ' + words + ' < 1400'); else console.log('  ok words=' + words);

// em-dashes
const emH = (html.replace(/<script[\s\S]*?<\/script>/g, '').match(/—/g) || []).length;
const emM = (md.match(/—/g) || []).length;
if (emH) bad('em-dash in html body = ' + emH); else console.log('  ok em-dash html=0');
if (emM) bad('em-dash in md = ' + emM); else console.log('  ok em-dash md=0');

// JSON-LD
const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!ld.length) bad('no JSON-LD');
let types = [];
for (const block of ld) {
  try {
    const j = JSON.parse(block);
    const graph = j['@graph'] || [j];
    for (const n of graph) types.push(n['@type']);
  } catch (e) { bad('JSON-LD parse error: ' + e.message); }
}
types = types.flat();
if (!types.includes('Article')) bad('no Article schema'); else console.log('  ok Article schema');
if (!types.includes('FAQPage')) bad('no FAQPage schema'); else console.log('  ok FAQPage schema');

// FAQ parity: visible h3 in div.faq vs ld questions
const faqBlock = (html.match(/<div class="faq">([\s\S]*?)<\/div>\s*<p class="byline"/) || [,''])[1];
const visQ = [...faqBlock.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map(m => m[1].trim());
let ldQ = [];
for (const block of ld) {
  try {
    const j = JSON.parse(block);
    const graph = j['@graph'] || [j];
    for (const n of graph) if (n['@type'] === 'FAQPage') ldQ = (n.mainEntity || []).map(q => q.name.trim());
  } catch (e) {}
}
if (visQ.length !== ldQ.length) bad('FAQ count vis=' + visQ.length + ' ld=' + ldQ.length);
else {
  let mism = 0;
  for (let i = 0; i < visQ.length; i++) if (visQ[i] !== ldQ[i]) mism++;
  if (mism) bad('FAQ text mismatch on ' + mism); else console.log('  ok FAQ parity (' + visQ.length + ')');
}
// double quotes in faq question names break schema
for (const q of ldQ) if (/"/.test(q)) bad('FAQ ld question has double-quote: ' + q);

// H2 parity html vs md
const h2h = [...html.matchAll(/<h2>([\s\S]*?)<\/h2>/g)].map(m => m[1].replace(/<[^>]+>/g,'').trim());
const h2m = [...md.matchAll(/^## (.+)$/gm)].map(m => m[1].trim());
if (h2h.length !== h2m.length) wrn('H2 count html=' + h2h.length + ' md=' + h2m.length);
else console.log('  ok H2 count=' + h2h.length);

// css linked
if (!/assets\/article\.css/.test(html)) bad('article.css not linked'); else console.log('  ok css');

// blurbs
const blurbRe = /1,000\+|30\+ countries|two-minute|~2-min|24\/7 human/gi;
const bl = ((html.match(blurbRe) || []).length) + ((md.match(blurbRe) || []).length);
if (bl) bad('blurb count = ' + bl); else console.log('  ok blurbs=0');

// placeholders
const ph = /\[VERIFY WITH PRODUCT TEAM\]|\[CONFIRM\]|\[TODO\]|lorem ipsum/i;
if (ph.test(html) || ph.test(md)) bad('placeholder present'); else console.log('  ok no placeholders');

// internal links resolve to content-studio folders
const links = [...html.matchAll(/https:\/\/www\.kloudbean\.com\/blog\/([a-z0-9-]+)\//g)].map(m => m[1]);
const uniq = [...new Set(links)];
let missing = [];
for (const l of uniq) if (!fs.existsSync(path.join('content-studio', l))) missing.push(l);
if (missing.length) bad('internal links missing folders: ' + missing.join(', ')); else console.log('  ok internal links (' + uniq.length + ' unique) resolve');

// hero
if (!fs.existsSync(path.join(dir, 'images', 'hero.png'))) wrn('hero.png absent (render later)');

console.log(fail ? ('[FAIL] ' + slug + ' (' + fail + ' errors, ' + warn + ' warn)') : ('[OK] ' + slug + (warn ? ' (' + warn + ' warn)' : '')));
process.exit(fail ? 1 : 0);
