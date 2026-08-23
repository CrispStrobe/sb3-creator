#!/usr/bin/env node
/**
 * Regenerate test/fixtures/example-enrolment.json — the record of which gates
 * enrol which example. Run with --write after a DELIBERATE change in coverage;
 * see test/example-gate-enrolment.test.mjs for why the record exists.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEnrolment, ENROLMENT } from './lib/example-enrolment.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLES = join(ROOT, 'examples');
const OUT = join(ROOT, 'test', 'fixtures', 'example-enrolment.json');

const { map, counts } = buildEnrolment(EXAMPLES);
const stamp = process.argv.find(a => a.startsWith('--on='))?.slice(5) || '2026-08-23';
const next = {
    note: 'Which gates enrol which example, computed from scripts/lib/example-enrolment.mjs. '
        + 'A diff here is a change in COVERAGE — read it before regenerating.',
    measuredOn: stamp,
    examples: Object.keys(map).length,
    gates: counts,
    map,
};
const text = JSON.stringify(next, null, 2) + '\n';
if (process.argv.includes('--write')) {
    writeFileSync(OUT, text);
    console.log(`wrote ${OUT}: ${next.examples} examples, ${ENROLMENT.length} gates`);
} else {
    const current = (() => { try { return readFileSync(OUT, 'utf8'); } catch { return null; } })();
    console.log(current === text ? 'up to date' : 'DRIFT — pass --write to update');
    for (const [g, n] of Object.entries(counts)) console.log(`  ${String(n).padStart(4)}  ${g}`);
    if (current !== text) process.exitCode = 1;
}
