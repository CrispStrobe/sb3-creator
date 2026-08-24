#!/usr/bin/env node
/**
 * The scan behind docs/PROVENANCE-AUDIT.md §2 — committed so its numbers can be
 * re-derived rather than taken on trust.
 *
 *   node scripts/audit-universal-gate-names.mjs test
 *   git archive <sha> test | tar -x -C /tmp/base --strip-components=1 -f - \
 *     && node scripts/audit-universal-gate-names.mjs /tmp/base   # a past commit
 *
 * For every test whose NAME is a universal claim ("every X", "no Y"), it reports
 * constructs that narrow the set actually examined, and whether the body carries
 * a floor assertion.
 *
 * IT IS A SHORTLIST, NOT A VERDICT, and the audit says so: of the 7 gates it
 * flagged as consulting an exemption table, 4 were false positives on inspection
 * (an EMPTY Map attributed from elsewhere in the same file; a licence CRITERION
 * read as an exemption; a gate whose name already says "unlisted"). `continue` is
 * usually innocent, and a floor expressed in an unusual shape reads as absent.
 * Use it to pick what to read, never as a finding count.
 *
 * Deliberately NOT wired into CI: a heuristic that fails the build would be a
 * gate whose name over-claims, which is the defect this file exists to find.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const TEST = process.argv[2];
const UNIVERSAL = /^\s*(every|all |each |no |never)/i;

// Narrowing constructs. Each is a way a body can examine less than its name says.
const NARROW = [
  [/\.slice\s*\(/,               'slice() — truncates the set'],
  [/\bSAMPLE|sample\b/,          'sampling'],
  [/\bKNOWN_|EXPECTED_|ALLOW|EXEMPT|SKIP_|IGNORE|WAIVE/,'allowlist/exemption table'],
  [/\bcontinue\s*;/,             'continue — skips members'],
  [/\bif\s*\(\s*!?existsSync/,   'existsSync — silently skips absent inputs'],
  [/\bskip\s*:/,                 'node:test skip:'],
  [/\breturn\s*;/,               'early return — may abandon the walk'],
  [/(?:const|let)\s+\w+\s*=\s*\[[^\]]{20,}\]/s, 'hardcoded literal list as the universe'],
];
// Yield assertions: the honest defence — asserting the walk found something.
const YIELD = /assert\.(ok|equal|notEqual)\s*\(\s*\w[\w.]*(?:\.length)?\s*(?:>=|>|!==|!=)/;

const rows = [];
for (const f of readdirSync(TEST).filter(x => x.endsWith('.test.mjs'))) {
  const src = readFileSync(join(TEST, f), 'utf8');
  const re = /(?:^|\n)(\s*)(?:test|it)\s*\(\s*(['"`])([\s\S]*?)\2/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[3].replace(/\s+/g, ' ').trim();
    if (!UNIVERSAL.test(name)) continue;
    // body = from match end to the next test( at same-or-less indent, or EOF
    const start = m.index + m[0].length;
    const next = src.slice(start).search(/\n\s*(?:test|it|describe)\s*\(/);
    const body = src.slice(start, next === -1 ? src.length : start + next);
    const flags = NARROW.filter(([re]) => re.test(body)).map(([, l]) => l);
    rows.push({ file: f, name, flags, yieldAssert: YIELD.test(body), lines: body.split('\n').length });
  }
}
rows.sort((a, b) => b.flags.length - a.flags.length);
console.log(`universal-named tests: ${rows.length}`);
console.log(`  with >=1 narrowing construct: ${rows.filter(r => r.flags.length).length}`);
console.log(`  narrowing AND no yield assertion: ${rows.filter(r => r.flags.length && !r.yieldAssert).length}\n`);
for (const r of rows) {
  if (!r.flags.length) continue;
  console.log(`${r.yieldAssert ? 'Y' : ' '} ${r.file}\n   "${r.name}"\n   ${r.flags.join('; ')}`);
}
