#!/usr/bin/env node
/**
 * Write the measurement back next to the number.
 *
 * This campaign's stated unit of work is not the threshold's VALUE, it is
 * whether anyone can tell where the value came from. `docs/MEASURED-THRESHOLDS.md`
 * says it in the definition of the two instruments: *"that number goes back into
 * the source, next to the threshold, so nobody has to run this again."* Phase 1
 * did that by hand, for one literal. Phase 2 measured a hundred and twenty in a
 * single sweep, and a hundred and twenty hand edits is where a campaign quietly
 * stops.
 *
 * So this takes `scripts/threshold-observe.mjs --json` and stamps each observed
 * bound with what was observed, in the shape `threshold-inventory.mjs` already
 * recognises as evidence — a date and the word `observed`.
 *
 * WHAT IT REFUSES TO DO, because a stamping tool is one careless run away from
 * being a rubber stamp generator, which is the exact failure this whole campaign
 * exists to prevent:
 *
 *   - it stamps ONLY a value that was actually observed in a run whose gate
 *     stayed GREEN. A `NOT REACHED` bound gets no comment, because "nobody has
 *     measured this" is the true state and a comment saying otherwise is worse
 *     than silence;
 *   - it never touches a literal that already carries evidence;
 *   - it records a RANGE when the bound was reached with different values, since
 *     collapsing 1…36 to a single number invents a stability that was not seen;
 *   - every file it edits is `node --check`ed afterwards and reverted whole if
 *     the parse broke, so an insertion landing inside an expression cannot ship;
 *   - and it prints what it changed. A stamp nobody reviews is a stamp.
 *
 *   node scripts/threshold-observe.mjs --file test/a.test.mjs --json > obs.json
 *   node scripts/threshold-stamp.mjs --from obs.json [--apply]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { classify, OWES_EVIDENCE } from './threshold-inventory.mjs';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TODAY = new Date().toISOString().slice(0, 10);

/** The sentence that goes above the number. Kept short; the doc carries the story. */
export function stampFor (obs, note) {
    const seen = obs.map((o) => {
        const v = typeof o.observed === 'object'
            ? `${o.observed.min}…${o.observed.max} over ${o.times} reaches`
            : String(o.observed);
        return `${o.what.replace(/\s+/g, ' ')} -> observed ${v}`;
    });
    return `MEASURED ${TODAY} (scripts/threshold-observe.mjs${note ? ', ' + note : ''}): ` + seen.join('; ') + '.';
}

/** Wrap a comment to a width, at the given indent, as `// ` lines. */
function commentBlock (text, indent, width = 96) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
        if (cur && (indent.length + 3 + cur.length + 1 + w.length) > width) { lines.push(cur); cur = w; }
        else cur = cur ? cur + ' ' + w : w;
    }
    if (cur) lines.push(cur);
    return lines.map((l) => `${indent}// ${l}`);
}

export function stampFile (rel, observations, { note = '', apply = false } = {}) {
    const path = join(ROOT, rel);
    const before = readFileSync(path, 'utf8');
    const lines = before.split('\n');

    // Group by line: one comment per line, however many bounds sit on it.
    const byLine = new Map();
    for (const o of observations) {
        if (o.evidenced) continue;                 // already carries its measurement
        if (o.observed === null || o.observed === undefined) continue;   // NOT REACHED
        // Only the dispositions that OWE a measurement get one. Stamping
        // `list.length > 0` with "observed 963" would be the rubber stamp this
        // campaign exists to prevent: the bound is fixed by the type, the
        // observation is irrelevant to it, and 77 such comments would teach every
        // future reader that a MEASURED line means nothing.
        const klass = o.klass || classify(o);
        if (!OWES_EVIDENCE.has(klass)) continue;
        if (!byLine.has(o.line)) byLine.set(o.line, []);
        byLine.get(o.line).push(o);
    }
    if (!byLine.size) return { file: rel, stamped: 0 };

    // Back to front, so earlier line numbers stay valid as the file grows.
    const targets = [...byLine.keys()].sort((a, b) => b - a);
    let out = lines.slice();
    const done = [];
    for (const line of targets) {
        const idx = line - 1;
        const src = out[idx];
        if (src === undefined) continue;
        const indent = (src.match(/^\s*/) || [''])[0];
        // An insertion in the middle of a multi-line expression would be a syntax
        // error; the node --check below is the backstop, but skipping the obvious
        // continuation lines keeps the backstop from having to fire.
        if (/^\s*([)\]}]|['"`+]|\.\w|&&|\|\|)/.test(src)) continue;
        const block = commentBlock(stampFor(byLine.get(line), note), indent);
        out = out.slice(0, idx).concat(block, out.slice(idx));
        done.push({ line, text: block.join('\n') });
    }
    const after = out.join('\n');
    if (after === before) return { file: rel, stamped: 0 };

    if (!apply) return { file: rel, stamped: done.length, preview: done };
    writeFileSync(path, after);
    try {
        execFileSync(process.execPath, ['--check', path], { stdio: 'pipe' });
    } catch (e) {
        writeFileSync(path, before);
        return { file: rel, stamped: 0, reverted: true, error: String(e.stderr || e.message).slice(0, 300) };
    }
    return { file: rel, stamped: done.length, preview: done };
}

/* --------------------------------------------------------------------- main */

const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const from = arg('--from');
if (!from) { console.error('usage: --from <observe --json output> [--note "..."] [--apply]'); process.exit(2); }
const apply = process.argv.includes('--apply');
const note = arg('--note') || '';
const runs = JSON.parse(readFileSync(from, 'utf8'));

let total = 0;
let skipped = 0;
for (const run of runs) {
    if (run.red || run.hung) {
        console.log(`SKIP ${run.file}: the instrumented run was ${run.red ? 'RED' : 'HUNG'} — ` +
            'its observations describe a different program.');
        skipped++;
        continue;
    }
    const r = stampFile(run.file, run.observations || [], { note, apply });
    if (r.reverted) { console.log(`REVERTED ${r.file}: ${r.error}`); skipped++; continue; }
    if (!r.stamped) continue;
    total += r.stamped;
    console.log(`${apply ? 'stamped' : 'would stamp'} ${r.stamped} line(s) in ${r.file}`);
    for (const d of r.preview) console.log(d.text.split('\n').map((l) => '    ' + l.trim()).join('\n'));
}
console.log(`\n${apply ? 'stamped' : 'would stamp'} ${total} line(s); ${skipped} file(s) skipped.`);
