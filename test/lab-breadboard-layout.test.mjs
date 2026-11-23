/**
 * The `lab-*` benches look like a breadboard a learner could build.
 *
 * Found in a live browser check (2026-11-23): electrically the lab benches were
 * right, but many did not look buildable. Twenty-three had seated parts joined
 * only by part-to-part wires, which the canvas does not draw for seated parts,
 * so the board looked unwired; sixty-six left chips, capacitors, LEDs or
 * buzzers off the board as generic boxes on long wires; one had a button drawn
 * over a capacitor. Three gates, over every examples/lab-* /circuit.json:
 *
 *   (a) every part is seated on a breadboard, unless it is a bench instrument
 *       or supply (OFF_BOARD_KINDS, scripts/lib/bench-layout.mjs) or its kind
 *       has no breadboard footprint at all. Checked after a HEADLESS load,
 *       because Circuit.fromJSON drops a seat whose footprint it cannot find —
 *       a seat that only the browser honours is a part on no net here;
 *   (b) no part-to-part wire joins two seated parts: seated parts connect by
 *       sharing a strip, by jumpers (holeWires) and by rail taps;
 *   (c) no two part bodies overlap, a potentiometer's knob counted as body,
 *       seated or not, measured with bw-circuit-ui's own partBounds and
 *       resolveSeatedParts as test/generated-bench-layout.test.mjs does.
 *
 * Fixing a failure: scripts/seat-lab-benches.mjs (hand-authored benches) or the
 * owning generator (scripts/lib/lab-bench-owners.mjs) lays the bench out again
 * with its nets unchanged; scripts/prove-lab-nets.mjs proves that.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine, registerSidecars } from '../scripts/lib/engine-surface.mjs';
import { OFF_BOARD_KINDS } from '../scripts/lib/bench-layout.mjs';
import { LAYOUT_PENDING } from '../scripts/lib/lab-bench-owners.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab breadboard layout');

const ROOT = path.resolve(import.meta.dirname, '..');
const labFiles = () => fs.readdirSync(path.join(ROOT, 'examples'))
    .filter(d => d.startsWith('lab-'))
    .map(d => path.join('examples', d, 'circuit.json'))
    .filter(f => fs.existsSync(path.join(ROOT, f)))
    .sort();

// Benches a parallel pass owned when these gates landed: see LAYOUT_PENDING.
const pending = (file) => LAYOUT_PENDING.has(path.basename(path.dirname(file)));

let E = null;
if (!gate.skip) {
    E = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] });
}

/** Kinds with no breadboard footprint anywhere: not builtin, not in any sidecar. */
async function footprintless() {
    const cui = gate.paths['bw-circuit-ui'];
    const { FOOTPRINTS } = await import(new URL('src/model/footprints.js', E.cuiURL).href);
    const builtin = new Set(Object.keys(FOOTPRINTS));
    const withSidecarFootprint = new Set();
    for (const f of fs.readdirSync(path.join(cui, 'src/parts-data'))) {
        if (!f.endsWith('.json')) continue;
        try {
            const sc = JSON.parse(fs.readFileSync(path.join(cui, 'src/parts-data', f), 'utf8'));
            if (sc.kind && sc.footprint) withSidecarFootprint.add(sc.kind);
        } catch { /* bw-circuit-ui's gate */ }
    }
    return (kind, loadedKind) => ![kind, loadedKind].some(k => builtin.has(k) || withSidecarFootprint.has(k));
}

const endpoint = (w, side) => {
    const v = w[side];
    if (v && typeof v === 'object') return v.board ? null : v.part;
    return v;
};

test('(a) every lab part that is not an instrument or supply is seated, and stays seated on load',
    { skip: gate.skip }, async (t) => {
    const noFootprint = await footprintless();
    const failures = [];
    const exempt = new Set();
    let parts = 0;
    for (const file of labFiles()) {
        if (pending(file)) continue;
        const json = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
        const loaded = E.Circuit.fromJSON(JSON.parse(JSON.stringify(json)));
        const after = new Map(loaded.parts.map(p => [p.id, p]));
        for (const p of json.parts) {
            if (p.kind === 'breadboard' || OFF_BOARD_KINDS.includes(p.kind)) continue;
            parts++;
            const l = after.get(p.id);
            if (noFootprint(p.kind, l?.kind)) { exempt.add(p.kind); continue; }
            if (!p.seat) failures.push(`${file}: ${p.id} (${p.kind}) is off the board`);
            else if (!l?.seat) failures.push(`${file}: ${p.id} (${p.kind}) loses its seat on a headless load — its footprint is sidecar-only; add the kind to SIDECAR_FOOTPRINT_KINDS`);
        }
    }
    // MEASURED 2026-11-23 (bw-circuit-ui 8404334): parts > 500 -> observed 1012; expected ~1000 non-instrument lab parts.
    assert.ok(parts > 500, `only ${parts} lab parts checked — the file list or kind filter is stale`);
    // The kinds that may stay off the board for want of any footprint, said out loud.
    t.diagnostic(`footprintless kinds left off the board: ${[...exempt].sort().join(', ') || 'none'}`);
    assert.deepEqual(failures, []);
});

test('(b) no lab bench joins two seated parts with a part-to-part wire',
    { skip: gate.skip }, () => {
    const failures = [];
    for (const file of labFiles()) {
        if (pending(file)) continue;
        const json = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
        const seated = new Set(json.parts.filter(p => p.seat).map(p => p.id));
        for (const w of json.wires || []) {
            const a = endpoint(w, 'from'), b = endpoint(w, 'to');
            if (a && b && seated.has(a) && seated.has(b)) {
                const ta = typeof w.from === 'object' ? w.from.terminal : w.fromTerminal;
                const tb = typeof w.to === 'object' ? w.to.terminal : w.toTerminal;
                failures.push(`${file}: ${a}.${ta} -> ${b}.${tb} is an invisible wire between seated parts`);
            }
        }
    }
    assert.deepEqual(failures, []);
});

test('(c) no two part bodies in a lab bench overlap, potentiometer knobs included',
    { skip: gate.skip }, async () => {
    await registerSidecars(gate.paths['bw-circuit-ui']);
    const url = (p) => new URL(p, E.cuiURL).href;
    const { resolveSeatedParts } = await import(url('src/interaction/seat-geometry.js'));
    const { partBounds } = await import(url('src/interaction/hittest.js'));
    const cover = (p) => {
        const boxes = [partBounds(p)];
        const a = p._seatTerminals?.a, b = p._seatTerminals?.b;
        if (p.kind === 'potentiometer' && p.seat && a && b) {
            const s = Math.min(Math.abs(b.x - a.x) / 40, 1.4);
            boxes.push({ minX: p.x - 30 * s, maxX: p.x + 30 * s, minY: a.y - 60 * s, maxY: a.y });
        }
        return boxes;
    };
    const failures = [];
    for (const file of labFiles()) {
        if (pending(file)) continue;
        const json = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
        const parts = resolveSeatedParts(json.parts || []).filter(p => p.kind !== 'breadboard');
        const boxes = parts.map(cover);
        for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
            for (const A of boxes[i]) for (const B of boxes[j]) {
                const ox = Math.min(A.maxX, B.maxX) - Math.max(A.minX, B.minX);
                const oy = Math.min(A.maxY, B.maxY) - Math.max(A.minY, B.minY);
                if (ox > 1 && oy > 1) {
                    failures.push(`${file}: ${parts[i].id} (${parts[i].kind}) overlaps ${parts[j].id} (${parts[j].kind}) by ${ox.toFixed(1)}x${oy.toFixed(1)}`);
                }
            }
        }
    }
    assert.deepEqual([...new Set(failures)], []);
});
