#!/usr/bin/env node
/**
 * Generate the lab-* discrete/analog benches (transistor switches, op-amp
 * stages, bridges) as SEATED breadboard circuits.
 *
 * Each bench is written as a NETLIST here — parts plus the list of terminals
 * on each node — and the seating is derived, not hand-placed:
 *
 *   - the seating and routing are scripts/lib/bench-layout.mjs, shared with
 *     every other lab bench: each seatable part (chips included) gets its own
 *     strips, ICs straddle the gutter, the supply nets go to the rails, every
 *     other net is a chain of jumpers, and only instruments and sources stay
 *     off the board, on tap wires;
 *   - the layout refuses to return a file whose engine nets differ from the
 *     netlist here.
 *
 * `build` refuses to write a bench with a lead alone on its net unless the
 * bench declares that lead open on purpose (`open`), and every written file is
 * read back through Circuit.fromJSON. The behaviour each bench is meant to show
 * is checked by test/lab-circuits-4.test.mjs against the committed files, not
 * here.
 *
 * Usage: BW_BOARD=… BW_CIRCUIT_UI=… node scripts/gen-lab-circuits-4.mjs [--set=N] [id …] [--force]
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { refuseToRevertRepairs, forced } from './lib/generator-guard.mjs';
import { loadLayoutEngine, layoutBench } from './lib/bench-layout.mjs';
import { benchIds } from './lib/lab-benches-4.mjs';

const E = await loadLayoutEngine();
const { Circuit, resetIds } = E;
const EXAMPLES = join(dirname(fileURLToPath(import.meta.url)), '..', 'examples');

/**
 * spec = {
 *   vcc, parts: {name: [kind, params]}, nets: [['name.term', …], …],
 *   supply: {pos: 'name.term', neg: 'name.term'},   // nets that use the rails
 *   open: ['name.term', …],                          // leads left open on purpose
 *   layoutOrder: ['name', …],                        // optional: parts seated first
 * }
 * The written ids are benchIds(spec): `${kind}_${n}` in listing order after
 * breadboard_1, which is what EXPECTED.md and the scenario tests name.
 */
export function buildBench(spec) {
    const ids = benchIds(spec);
    const ref = (s) => {
        const [n, ...t] = s.split('.');
        if (!ids[n]) throw new Error(`unknown part ${n}`);
        return `${ids[n]}.${t.join('.')}`;
    };
    const json = layoutBench(E, {
        vcc: spec.vcc ?? 9,
        parts: Object.entries(spec.parts).map(([name, [kind, params]]) =>
            ({ id: ids[name], kind, params: { ...(params || {}) }, x: 0, y: 0, rotation: 0 })),
        nets: spec.nets.map(n => n.map(ref)),
        supply: spec.supply && { pos: ref(spec.supply.pos), neg: ref(spec.supply.neg) },
        boardId: 'breadboard_1',
        order: (spec.layoutOrder || []).map(n => ids[n]),
    });

    // ---- refuse floating leads (unless declared open); record terminals ----
    resetIds();
    const c = Circuit.fromJSON(JSON.parse(JSON.stringify(json)));
    const open = new Set((spec.open || []).map(ref));
    const onNet = new Map();
    for (const n of c.board.getNets()) for (const t of n.terminals) onNet.set(`${t.part}.${t.terminal}`, n.terminals.length);
    const bad = [];
    for (const p of c.parts) {
        if (p.kind === 'breadboard') continue;
        for (const t of p.terminals || []) {
            const k = `${p.id}.${t}`;
            if (open.has(k)) continue;
            const size = onNet.get(k);
            if (size === undefined || size < 2) bad.push(k);
        }
    }
    if (bad.length) throw new Error(`floating leads: ${bad.join(', ')}`);
    const loaded = new Map(c.parts.map(p => [p.id, p]));
    for (const p of json.parts) if (p.kind !== 'breadboard') p.terminals = [...(loaded.get(p.id)?.terminals || [])];
    return { json, ids };
}

// ---------------------------------------------------------------------------
// The benches. Names are local to each netlist; the written ids are the
// engine's (`npn_4` …), which is what EXPECTED.md asserts against.
// ---------------------------------------------------------------------------
// `--set=N` picks scripts/lib/lab-benches-N.mjs (default 4), so later bench
// sets reuse this seating instead of copying it.
const SET = (process.argv.find(a => a.startsWith('--set=')) || '--set=4').slice(6);
const { BENCHES } = await import(`./lib/lab-benches-${SET}.mjs`);

// ---- main ----
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const only = args.length ? new Set(args) : null;
let ok = 0, fail = 0;
for (const [id, spec] of Object.entries(BENCHES)) {
    if (only && !only.has(id)) continue;
    try {
        const { json } = buildBench(spec);
        resetIds();
        Circuit.fromJSON(JSON.parse(JSON.stringify(json)));
        const dir = join(EXAMPLES, id);
        mkdirSync(dir, { recursive: true });
        refuseToRevertRepairs(join(dir, 'circuit.json'), { force: forced() });
        writeFileSync(join(dir, 'circuit.json'), JSON.stringify(json, null, 2) + '\n');
        if (!existsSync(join(dir, 'program.bw'))) writeFileSync(join(dir, 'program.bw'), '# Pure circuit — no MCU\n');
        console.log(`  ✓ ${id}: ${json.parts.filter(p => p.seat).length} seated, ${json.holeWires.length} jumpers`);
        ok++;
    } catch (e) {
        console.log(`  ✗ ${id}: ${e.message}`);
        fail++;
    }
}
console.log(`\n${ok} written, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
