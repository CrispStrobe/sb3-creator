#!/usr/bin/env node
/**
 * Seated art and net identity over the whole gallery.
 *
 * For every examples/<id>/circuit*.json this
 *
 *   1. counts the seated parts the canvas would draw as a BOX instead of their
 *      art: an art-face kind (bw-circuit-ui ART_FACE_KINDS) whose saved seat
 *      puts its legs where the art cannot honestly reach them —
 *      `seatedArtClean(artFaceLayout(sidecar, holes))` false, which is the
 *      canvas's own test (BoardCanvas.jsx artFace()). A DIP saved under the
 *      pre-2026-11-24 footprints (pins 1..N/2 in the row above the gutter: the
 *      chip seen from underneath) is the case this exists for;
 *   2. compares the engine's net partition of the file with the same file at
 *      a git revision (default origin/main): every multi-terminal net, as a
 *      sorted set of part.terminal names. Part ids, kinds and params must
 *      not change either.
 *
 * Two loads, because the gates and the app honour different seats:
 *
 *   --load=headless  (default) injectEngine only, as every gate loads a circuit
 *   --load=app       every bw-circuit-ui sidecar registered, as the app does;
 *                    this is also the load the box count is taken under
 *
 *   BW_BOARD=… BW_CIRCUIT_UI=… node scripts/check-seated-art.mjs [--load=app]
 *        [--base=REV] [--no-nets] [--list] [--json=out.json] [id …]
 *
 * Exits non-zero on any net difference, or (with --strict) on any box.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectEngine, registerSidecars } from './lib/engine-surface.mjs';
import { netPartition, partitionDiff } from './lib/bench-layout.mjs';
import { loadSeatedArt } from './lib/seated-art.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => (args.find(a => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const load = opt('load', 'headless');
const base = opt('base', 'origin/main');
const jsonOut = opt('json', '');
const nets = !args.includes('--no-nets');
const list = args.includes('--list');
const strict = args.includes('--strict');
const only = new Set(args.filter(a => !a.startsWith('--')));

const E = await injectEngine();
if (load === 'app') await registerSidecars(E.paths['bw-circuit-ui']);
else if (load !== 'headless') throw new Error(`--load=${load}: headless | app`);
const { seatedFaces } = await loadSeatedArt(E);

const files = [];
for (const d of readdirSync(join(ROOT, 'examples'), { withFileTypes: true })) {
    if (!d.isDirectory() || (only.size && !only.has(d.name))) continue;
    for (const f of readdirSync(join(ROOT, 'examples', d.name))) {
        if (/^circuit.*\.json$/.test(f)) files.push(`examples/${d.name}/${f}`);
    }
}
files.sort();

const identity = (json) => JSON.stringify((json.parts || []).filter(p => p.kind !== 'breadboard')
    .map(p => [p.id, p.kind, p.params || {}]).sort((a, b) => a[0] < b[0] ? -1 : 1));
const atBase = (rel) => {
    try {
        return JSON.parse(execFileSync('git', ['show', `${base}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }));
    } catch { return null; }
};

const tally = { files: 0, circuits: 0, seated: 0, art: 0, box: 0, legs: 0, other: 0, unchanged: 0, moved: 0, fresh: 0, failed: 0, errors: 0 };
const boxByKind = {}, legsByKind = {}, boxFiles = [], failures = [];
for (const rel of files) {
    tally.files++;
    let now;
    try { now = JSON.parse(readFileSync(join(ROOT, rel), 'utf8')); } catch (e) { tally.errors++; console.log(`  PARSE ${rel}: ${e.message}`); continue; }
    if (!Array.isArray(now.parts)) continue;
    tally.circuits++;
    let faces;
    try { faces = seatedFaces(now); } catch (e) { tally.errors++; console.log(`  LOAD ${rel}: ${e.message}`); continue; }
    const boxes = faces.filter(f => f.face === 'box');
    tally.seated += faces.length;
    for (const f of faces) tally[f.face]++;
    for (const b of boxes) boxByKind[b.kind] = (boxByKind[b.kind] || 0) + 1;
    for (const f of faces) if (f.face === 'legs') legsByKind[f.kind] = (legsByKind[f.kind] || 0) + 1;
    if (boxes.length) boxFiles.push({ file: rel, parts: boxes.map(b => `${b.id}:${b.kind}`) });
    if (list && boxes.length) console.log(`  box  ${rel}  ${boxes.map(b => `${b.id}(${b.kind})`).join(' ')}`);
    if (!nets) continue;
    const old = atBase(rel);
    if (!old) { tally.fresh++; continue; }
    if (JSON.stringify(old) === JSON.stringify(now)) { tally.unchanged++; continue; }
    let problems;
    try {
        problems = partitionDiff(netPartition(E, old), netPartition(E, now));
    } catch (e) { problems = [`load failed: ${e.message}`]; }
    if (identity(old) !== identity(now)) problems.push('part ids, kinds or params differ');
    if (problems.length) {
        tally.failed++;
        failures.push({ file: rel, problems });
        console.log(`  FAIL ${rel}:\n    ${problems.slice(0, 12).join('\n    ')}`);
    } else tally.moved++;
}

console.log(`\nload=${load}  bw-circuit-ui=${E.paths['bw-circuit-ui']}  bw-board=${E.paths['bw-board']}`);
console.log(`${tally.circuits} circuits in ${tally.files} files; ${tally.seated} seated parts: ${tally.art} art, ${tally.box} BOX, ${tally.legs} art kind with other terminals, ${tally.other} not an art kind`);
if (tally.box) console.log(`box by kind: ${Object.entries(boxByKind).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}  (${boxFiles.length} files)`);
if (tally.legs) console.log(`art kind, other terminals: ${Object.entries(legsByKind).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}`);
if (nets) console.log(`nets vs ${base}: ${tally.moved} changed with identical nets, ${tally.unchanged} byte-identical, ${tally.fresh} new, ${tally.failed} FAILED`);
if (tally.errors) console.log(`${tally.errors} files could not be read or loaded`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ load, base, tally, boxByKind, legsByKind, boxFiles, failures }, null, 1) + '\n');
process.exitCode = (tally.failed || tally.errors || (strict && tally.box)) ? 1 : 0;
