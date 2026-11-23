#!/usr/bin/env node
/**
 * Re-seat hand-authored lab benches on the breadboard, nets unchanged.
 *
 * For each named example (default: every `lab-*` that no generator owns and
 * that is not LAYOUT_PENDING, scripts/lib/lab-bench-owners.mjs) this
 * reads the COMMITTED circuit.json, takes its netlist from the engine, and lays
 * the bench out again with scripts/lib/bench-layout.mjs: every part with a
 * headless footprint seated, every connection between seated parts a jumper or
 * a rail tap, instruments above the board on tap wires. Part ids, kinds,
 * params, labels and terminal lists are kept as they were, so EXPECTED.md and
 * any program.bw read the same circuit.
 *
 * Before writing, the engine's net partition of the new file is compared with
 * the old one's and the write is refused on any difference. The proof over the
 * whole gallery against a git revision is scripts/prove-lab-nets.mjs.
 *
 *   BW_BOARD=… BW_CIRCUIT_UI=… node scripts/seat-lab-benches.mjs [--dry] [lab-id …]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLayoutEngine, layoutBench, netlistOf, netPartition, partitionDiff } from './lib/bench-layout.mjs';
import { GENERATED_LAB_BENCHES, LAYOUT_PENDING } from './lib/lab-bench-owners.mjs';

const EXAMPLES = join(dirname(fileURLToPath(import.meta.url)), '..', 'examples');
const E = await loadLayoutEngine();

const args = process.argv.slice(2);
const dry = args.includes('--dry');
let ids = args.filter(a => !a.startsWith('--'));
if (!ids.length) {
    ids = readdirSync(EXAMPLES).filter(d => d.startsWith('lab-') && !GENERATED_LAB_BENCHES.has(d) && !LAYOUT_PENDING.has(d)).sort();
}

/** Turn a committed circuit into a layout spec: same parts, the engine's nets. */
export function specOf(json) {
    const { vcc, parts, wires, holeWires, ...extra } = json;
    const boards = parts.filter(p => p.kind === 'breadboard');
    return {
        vcc,
        parts: parts.filter(p => p.kind !== 'breadboard').map(p => {
            const { seat, ...rest } = p;
            return rest;
        }),
        nets: netlistOf(E, json),
        boardId: boards[0]?.id || 'bb1',
        extra,
    };
}

let ok = 0, fail = 0;
for (const id of ids) {
    const file = join(EXAMPLES, id, 'circuit.json');
    try {
        const before = JSON.parse(readFileSync(file, 'utf8'));
        const after = layoutBench(E, specOf(before));
        const diff = partitionDiff(netPartition(E, before), netPartition(E, after));
        if (diff.length) throw new Error(`nets changed:\n    ${diff.join('\n    ')}`);
        if (!dry) writeFileSync(file, JSON.stringify(after, null, 1) + '\n');
        const seated = after.parts.filter(p => p.seat).length;
        const off = after.parts.filter(p => !p.seat && p.kind !== 'breadboard').map(p => p.kind);
        const nb = after.parts.filter(p => p.kind === 'breadboard').length;
        console.log(`  ok ${id}: ${seated} seated, ${after.holeWires.length} jumpers, ${nb} board(s); off: ${off.join(' ') || '-'}`);
        ok++;
    } catch (e) {
        console.log(`  FAIL ${id}: ${e.message}`);
        fail++;
    }
}
console.log(`${ok} ${dry ? 'laid out (dry run)' : 'written'}, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
