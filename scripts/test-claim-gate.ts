/**
 * Unit test for the claim-integrity gate in src/lib/content-scorecard.ts.
 *
 *   npx tsx scripts/test-claim-gate.ts
 *   npm run test:claims
 *
 * No database, no network, no dev server. Pure function test, so it is safe to
 * run any time.
 *
 * WHY THIS EXISTS
 * The claim gate is the last thing standing between a plausible-sounding
 * fabrication and a published page. It is regex-driven, so it has two ways to
 * fail silently: a pattern that stops matching after an edit (a violation ships)
 * and a pattern that matches ordinary technical prose (everyone learns to ignore
 * the gate). This test covers both directions:
 *
 *   1. Every violation shape blocks AND produces a mandatory fix instruction.
 *   2. Real technical prose that merely looks similar does NOT block.
 *
 * Case group 2 is the important one. Two candidate patterns were dropped during
 * development because they only ever produced false positives on real articles:
 * "unmatched" (nginx and router terminology) and "unbeatable" (used in
 * legitimate rhetoric). Those exact strings are now regression cases below.
 */
import { scoreContent, buildRevisionInstructions } from "../src/lib/content-scorecard";

const KEYWORD = "managed node.js hosting";

/** Minimal valid article body. Score will be low; we only assert on blocking. */
const BASE = `# Managed Node.js Hosting on Kloudbean

**TL;DR:** Kloudbean runs managed Node.js apps across seven clouds with free SSL.

Managed Node.js hosting means the server, stack, and TLS are handled for you.

## What you get

Kloudbean gives you managed servers with a firewall configured by default.
`;

type Case = { label: string; md: string; shouldBlock: boolean };

const cases: Case[] = [
  // --- Must NOT block: the clean baseline ---
  { label: "clean baseline", md: BASE, shouldBlock: false },

  // --- Must block: one case per claim-integrity pattern ---
  {
    label: "self superlative",
    md: `${BASE}\nKloudbean is the fastest managed host you can buy.\n`,
    shouldBlock: true,
  },
  {
    label: "marketing absolute",
    md: `${BASE}\nOur industry-leading platform handles the rest.\n`,
    shouldBlock: true,
  },
  {
    label: "market-wide claim",
    md: `${BASE}\nNo other host gives you this.\n`,
    shouldBlock: true,
  },
  {
    label: "borrowed authority",
    md: `${BASE}\nWe are an official partner of every major cloud.\n`,
    shouldBlock: true,
  },
  {
    label: "fabricated evidence",
    md: `${BASE}\nOur benchmarks show a large gain here.\n`,
    shouldBlock: true,
  },
  {
    label: "attributed metric",
    md: `${BASE}\nKloudbean customers see 40% faster deploys on average.\n`,
    shouldBlock: true,
  },
  {
    label: "unresolved VERIFY marker",
    md: `${BASE}\nThe plan includes [VERIFY WITH PRODUCT TEAM] storage.\n`,
    shouldBlock: true,
  },

  // --- Must NOT block: regression cases for false positives we removed ---
  {
    label: 'FP: nginx "unmatched requests"',
    md: `${BASE}\nA catch-all server block quietly changes which site answers unmatched requests.\n`,
    shouldBlock: false,
  },
  {
    label: 'FP: router "unmatched routes"',
    md: `${BASE}\nRedirect all unmatched routes to /index.html with a 200 status.\n`,
    shouldBlock: false,
  },
  {
    label: 'FP: rhetorical "unbeatable"',
    md: `${BASE}\nA raw server for a few dollars looks unbeatable until you count the evenings.\n`,
    shouldBlock: false,
  },
  {
    label: "FP: criticising a rival's metric",
    md: `${BASE}\nAnyone selling you a host on "it's 3x faster" without publishing methodology is guessing.\n`,
    shouldBlock: false,
  },
  {
    label: "FP: explaining SLA maths",
    md: `${BASE}\nMoving up to 99.99% cuts the yearly allowance to under an hour.\n`,
    shouldBlock: false,
  },
  {
    label: "FP: true Redis latency in a diagram",
    md: `${BASE}\nApp sends GET key to Redis. A hit returns in under 1 ms.\n`,
    shouldBlock: false,
  },

  // --- Must block: the over-promise patterns still have to fire -------------
  // Guarding against negation and topic vocabulary must not defang the gate,
  // so every over-promise shape gets an explicit first-party assertion here.
  {
    label: "OP: claims SOC 2 certification",
    md: `${BASE}\nKloudbean is SOC 2 certified, so your auditor is satisfied.\n`,
    shouldBlock: true,
  },
  {
    label: "OP: claims full compliance",
    md: `${BASE}\nOur platform is fully compliant, so you inherit that status.\n`,
    shouldBlock: true,
  },
  {
    label: "OP: absolute uptime guarantee",
    md: `${BASE}\nEvery plan ships with 100% uptime for production traffic.\n`,
    shouldBlock: true,
  },
  {
    label: "OP: reliability absolute",
    md: `${BASE}\nOur platform never goes down, even during a region incident.\n`,
    shouldBlock: true,
  },
  {
    label: "OP: guaranteed rankings",
    md: `${BASE}\nPublishing here gets you guaranteed rankings inside a month.\n`,
    shouldBlock: true,
  },
  {
    label: "OP: hosting makes you compliant",
    md: `${BASE}\nMoving to Kloudbean makes you HIPAA compliant on day one.\n`,
    shouldBlock: true,
  },

  // --- Must NOT block: the 13 real hits found across the 288 published pages -
  // Every one of these is a VERBATIM sentence from a shipped article that the
  // old document-wide gate flagged. They are the honest half of the compliance
  // cluster: denials, FAQ questions answered "no", neutral descriptions of a
  // published framework, and internal link anchors. If the gate ever flags
  // these again, the auto-revise loop will rewrite correct copy into something
  // less accurate, which is the worst failure mode this gate has.
  {
    label: "FP: real, denies GDPR by location",
    md: `${BASE}\nStoring EU data in an EU region does not make you GDPR-compliant on its own.\n`,
    shouldBlock: false,
  },
  {
    label: "FP: real, no honest host can",
    md: `${BASE}\nWhat it won't do, because no honest host can, is make you PCI compliant on its own.\n`,
    shouldBlock: false,
  },
  {
    label: "FP: real, FAQ question answered no",
    md: `${BASE}\nIs Kloudbean GDPR, PCI, or SOC 2 certified?\nKloudbean provides the infrastructure controls that support those frameworks.\n`,
    shouldBlock: false,
  },
  {
    label: "FP: real, generic host question",
    md: `${BASE}\nDoes the host being SOC 2 aligned make my WordPress site compliant?\nNo. A SOC 2 report describes the platform's controls.\n`,
    shouldBlock: false,
  },
  {
    label: "FP: real, sibling link anchors",
    md: `${BASE}\nSibling reads if you are mapping your whole obligation: SOC 2 compliant hosting and PCI compliant hosting.\n`,
    shouldBlock: false,
  },
  {
    label: "FP: real, target keyword in H1",
    md: `# SOC 2 Compliant Hosting: 80% Process, 20% Infrastructure\n${BASE}\nIt usually arrives as one email from a security team.\n`,
    shouldBlock: false,
  },
  {
    label: "FP: real, describes NCA framework rule",
    md: `${BASE}\nThe framework is explicit that continuous ECC compliance is required in order to be fully compliant with CSCC.\n`,
    shouldBlock: false,
  },
  {
    label: "FP: real, migrations rarely fail on build",
    md: `${BASE}\nThe migrations we see go sideways almost never fail on the build.\n`,
    shouldBlock: false,
  },
  {
    label: "FP: real, cross-link in a sentence",
    md: `${BASE}\nThe full split, including how GDPR, PCI, and SOC 2 map to it, is in the secure, compliant hosting guide.\n`,
    shouldBlock: false,
  },
  {
    // "We" here is authorial voice pointing at another article, which is why the
    // gate needs a first-party ASSERTION (subject + linking verb), not a bare
    // mention of "we" somewhere in the sentence.
    label: "FP: real, authorial we + link anchor",
    md: `${BASE}\nWe go deeper in SOC 2 compliant hosting.\n`,
    shouldBlock: false,
  },
  {
    // Frontmatter keyword lists have no sentence-ending punctuation, so the
    // whole block arrives as one "sentence" and a window that crossed newlines
    // read the keyword list as a claim.
    label: "FP: real, keyword list in frontmatter",
    md: `target keyword: PCI compliant hosting\nsecondary keywords:\n    PCI DSS hosting\n    is my hosting PCI compliant\n    PCI compliant server\n${BASE}\nYou want to take card payments.\n`,
    shouldBlock: false,
  },

  // --- Unsupported-provider check: comparison pages name rivals by design ----
  {
    // The subject alternation had no word boundaries, so "we" matched inside
    // "lowest" and a legitimate comparison page was flagged.
    label: "FP: real, rival named on a vs page",
    md: `# Hetzner vs Kloudbean\n${BASE}\nWant the lowest bill and enjoy the ops? Hetzner is the honest answer there.\n`,
    shouldBlock: false,
  },
  {
    label: "OP: rival presented as our offering",
    md: `${BASE}\nYou can launch a Hetzner server on Kloudbean from the same dashboard.\n`,
    shouldBlock: true,
  },
];

let passed = 0;
const failures: string[] = [];

for (const c of cases) {
  const input = { markdown: c.md, targetKeyword: KEYWORD, geo: "us", wordCountTarget: 100 };
  const r = scoreContent(input);

  if (r.blocking !== c.shouldBlock) {
    failures.push(
      `${c.label}: expected blocking=${c.shouldBlock}, got ${r.blocking}` +
        (r.bannedClaims.length ? ` (claims: ${r.bannedClaims.join(" | ")})` : ""),
    );
    continue;
  }

  // A blocking result is useless if the auto-revise loop is not told what to fix.
  if (c.shouldBlock) {
    const instructions = buildRevisionInstructions(r, input);
    if (!/FIX \(mandatory\)/.test(instructions)) {
      failures.push(`${c.label}: blocked but produced no mandatory fix instruction`);
      continue;
    }
  }

  passed++;
  const note = c.shouldBlock ? `blocked: ${r.bannedClaims[r.bannedClaims.length - 1]?.slice(0, 60)}…` : "allowed";
  console.log(`  ok  ${c.label.padEnd(34)} ${note}`);
}

console.log(`\n${passed}/${cases.length} passed`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("Claim-integrity gate is behaving correctly.");
