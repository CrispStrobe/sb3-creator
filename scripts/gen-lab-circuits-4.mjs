#!/usr/bin/env node
/**
 * Generate the lab-* discrete/analog benches (transistor switches, op-amp
 * stages, bridges) as SEATED breadboard circuits.
 *
 * Each bench is written as a NETLIST here — parts plus the list of terminals
 * on each node — and the seating is derived, not hand-placed:
 *
 *   - every seatable part gets its own run of columns (top block row a, or
 *     bottom block row f; DIPs and buttons straddle the gutter), so no two
 *     leads ever share a strip by accident;
 *   - the supply nets go to the rails (t+/t- and b+/b-, bridged at the left
 *     end), one jumper per strip;
 *   - every other net is a chain of jumpers between the strips of its leads;
 *   - sources and bench instruments stay off the board and reach it with tap
 *     wires.
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
import { injectEngine } from './lib/engine-surface.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import { refuseToRevertRepairs, forced } from './lib/generator-guard.mjs';

const { Circuit, resetIds, cuiURL, paths } = await injectEngine();
const { FOOTPRINTS, computeLeadMap } = await import(new URL('src/model/footprints.js', cuiURL).href);
// Kinds the engine has no terminal table for (transformer) take their
// terminal list from the parts catalogue's sidecar. Footprints are NOT taken
// from the sidecars: the gates load circuits without them, and a chip seated
// by a sidecar-only footprint would lose its nets there. Such parts stay off
// the board and reach it with tap wires, as in the earlier sets.
{
    const { registerSidecar } = await import(new URL('src/model/parts-registry.js', cuiURL).href);
    const dir = join(paths['bw-circuit-ui'], 'src', 'parts-data');
    for (const f of readdirSync(dir)) {
        if (!f.endsWith('.json')) continue;
        const sc = JSON.parse(readFileSync(join(dir, f), 'utf8'));
        if (!sc.kind || FOOTPRINTS[sc.kind]) continue;
        delete sc.footprint;
        registerSidecar(sc);
    }
}
const { resolveSeatedParts } = await import(new URL('src/interaction/seat-geometry.js', cuiURL).href);
const { partBounds } = await import(new URL('src/interaction/hittest.js', cuiURL).href);
const EXAMPLES = join(dirname(fileURLToPath(import.meta.url)), '..', 'examples');

// Sources and bench instruments never sit in the board.
const OFFBOARD = new Set(['vsource', 'battery_9v', 'battery', 'vcc', 'gnd',
    'voltmeter', 'ammeter', 'analog_meter']);
const COLS = 63;

/**
 * spec = {
 *   vcc, parts: {name: [kind, params]}, nets: [['name.term', …], …],
 *   supply: {pos: 'name.term', neg: 'name.term'},   // nets that use the rails
 *   open: ['name.term', …],                          // leads left open on purpose
 * }
 */
/**
 * A seated potentiometer is drawn with a knob that reaches past its holes: a
 * box 60·scale wide centred on the part and 60·scale tall above its `a` lead
 * (scale = min(|b.x − a.x| / 40, 1.4); bw-circuit-ui draws it, Lite's corpus
 * gate and test/generated-bench-layout.test.mjs check it). Returns the names
 * of the pots whose knob covers another non-structural part.
 */
function coveringPots(c, ids) {
    const parts = resolveSeatedParts(c.toJSON().parts || []);
    const nameOf = new Map(Object.entries(ids).map(([n, id]) => [id, n]));
    const covering = new Set();
    for (const pot of parts.filter(p => p.kind === 'potentiometer')) {
        const a = pot._seatTerminals?.a, b = pot._seatTerminals?.b;
        if (!pot.seat || !a || !b) continue;
        const s = Math.min(Math.abs(b.x - a.x) / 40, 1.4);
        const knob = { minX: pot.x - 30 * s, maxX: pot.x + 30 * s, minY: a.y - 60 * s, maxY: a.y };
        for (const o of parts) {
            if (o === pot || ['breadboard', 'vcc', 'gnd'].includes(o.kind)) continue;
            const ob = partBounds(o);
            if (Math.min(knob.maxX, ob.maxX) - Math.max(knob.minX, ob.minX) > 1 &&
                Math.min(knob.maxY, ob.maxY) - Math.max(knob.minY, ob.minY) > 1) covering.add(nameOf.get(pot.id));
        }
    }
    return covering;
}

/**
 * Seat and wire a bench. A potentiometer whose knob would cover a neighbour
 * is re-seated in the TOP block row with a spare column on each side, where
 * its knob rises over the rails and nothing else; benches without such a
 * collision keep exactly the layout they always had.
 */
export function buildBench(spec) {
    const clear = new Set();
    for (;;) {
        const built = seatBench(spec, clear);
        const covering = [...coveringPots(built.c, built.ids)].filter(n => !clear.has(n));
        if (!covering.length) {
            const left = coveringPots(built.c, built.ids);
            if (left.size) throw new Error(`potentiometer knob still covers a neighbour: ${[...left].join(', ')}`);
            return built;
        }
        for (const n of covering) clear.add(n);
    }
}

function seatBench(spec, clear) {
    resetIds();
    const c = new Circuit(spec.vcc ?? 9);
    // Boards are added on demand: a bench that does not fit one full-size
    // board continues on a second one below it.
    const boards = [];
    const addBoard = () => {
        const bb = c.addPart('breadboard', {}, 520, 360 + boards.length * 300);
        const b = { id: bb.id, model: c.breadboards.get(bb.id), top: 2, bot: 2 };
        boards.push(b);
        return b;
    };
    addBoard();
    const ids = {};
    let ox = 80;
    const kinds = {};
    for (const [name, [kind, params]] of Object.entries(spec.parts)) {
        const off = OFFBOARD.has(kind) || !FOOTPRINTS[kind];
        const p = c.addPart(kind, params || {}, off ? ox : 0, off ? 70 : 0);
        if (off) ox += 130;
        ids[name] = p.id;
        kinds[name] = kind;
    }
    const term = (s) => {
        const [n, t] = s.split('.');
        if (!ids[n]) throw new Error(`unknown part ${n}`);
        return [ids[n], t];
    };

    // ---- seat ----
    const leadHole = new Map();   // "id.term" -> {board, hole}
    const place = (b, fp, knob) => {
        const span = Math.max(...Object.values(fp.leads).map(o => o.dCol));
        if (knob) {
            // top row only, one spare column either side of the knob's pot
            if (b.top + 1 + span > COLS) return null;
            const r = `a${b.top + 1}`; b.top += span + 4; return r;
        }
        if (fp.straddlesGutter) {
            const col = Math.max(b.top, b.bot);
            if (col + span > COLS) return null;
            b.top = b.bot = col + span + 2;
            return `e${col}`;
        }
        if (b.top + span <= COLS && (b.top <= b.bot || b.bot + span > COLS)) { const r = `a${b.top}`; b.top += span + 2; return r; }
        if (b.bot + span <= COLS) { const r = `f${b.bot}`; b.bot += span + 2; return r; }
        return null;
    };
    for (const [name, kind] of Object.entries(kinds)) {
        const fp = FOOTPRINTS[kind];
        if (OFFBOARD.has(kind) || !fp) continue;
        let b = boards.at(-1);
        const knob = clear.has(name);
        let ref = place(b, fp, knob);
        if (!ref) { b = addBoard(); ref = place(b, fp, knob); }
        const lm = computeLeadMap(fp, ref);
        if (!c.seatPart(ids[name], b.id, lm)) throw new Error(`seat failed: ${name} at ${ref}`);
        for (const [t, h] of Object.entries(lm)) leadHole.set(`${ids[name]}.${t}`, { b, hole: h });
    }

    // ---- wire ----
    const freeIn = ({ b, hole: h }) => {
        const rows = 'abcde'.includes(h[0]) ? 'abcde' : 'fghij';
        for (const r of rows) if (!b.model.occupantOf(r + h.slice(1))) return r + h.slice(1);
        throw new Error(`strip of ${h} is full`);
    };
    const railHole = (b, sign, top, col) => {
        const rail = (top ? 't' : 'b') + sign;
        for (let k = 0; k < COLS; k++) {
            const n = ((col - 1 + k) % COLS) + 1;
            if (!b.model.occupantOf(rail + n)) return rail + n;
        }
        throw new Error(`rail ${rail} is full`);
    };
    const jump = (b, x, y, color) => {
        if (!c.addHoleWire(b.id, x, y, color)) throw new Error(`jumper ${x} -> ${y} refused`);
    };
    const tap = (id, t, b, hole) => {
        if (!c.addTapWire(id, t, b.id, hole)) throw new Error(`tap ${id}.${t} -> ${hole} refused`);
    };
    for (const b of boards) { jump(b, 't+1', 'b+1', 'red'); jump(b, 't-2', 'b-2', 'black'); }
    for (const net of spec.nets) {
        const members = net.map(term);
        const seated = members.filter(([id, t]) => leadHole.has(`${id}.${t}`));
        const loose = members.filter(([id, t]) => !leadHole.has(`${id}.${t}`));
        const pos = spec.supply && net.includes(spec.supply.pos);
        const neg = spec.supply && net.includes(spec.supply.neg);
        if (pos || neg) {
            const sign = pos ? '+' : '-';
            for (const [id, t] of seated) {
                const L = leadHole.get(`${id}.${t}`);
                jump(L.b, freeIn(L), railHole(L.b, sign, 'abcde'.includes(L.hole[0]), Number(L.hole.slice(1))), pos ? 'red' : 'black');
            }
            for (const [id, t] of loose) for (const b of boards) tap(id, t, b, railHole(b, sign, true, pos ? 58 : 61));
            continue;
        }
        // Chain the strips board by board; separate boards are joined by a wire.
        const groups = boards.map(b => seated.filter(([id, t]) => leadHole.get(`${id}.${t}`).b === b)).filter(g => g.length);
        for (const g of groups) {
            for (let i = 1; i < g.length; i++) {
                const A = leadHole.get(g[i - 1].join('.')), B = leadHole.get(g[i].join('.'));
                jump(A.b, freeIn(A), freeIn(B), 'blue');
            }
        }
        for (let i = 1; i < groups.length; i++) c.addWire(...groups[i - 1][0], ...groups[i][0]);
        if (seated.length) {
            const L = leadHole.get(seated[0].join('.'));
            for (const [id, t] of loose) tap(id, t, L.b, freeIn(L));
        } else for (let i = 1; i < loose.length; i++) c.addWire(...loose[0], ...loose[i]);
    }

    // ---- refuse floating leads (unless declared open) ----
    const open = new Set((spec.open || []).map(s => term(s).join('.')));
    const onNet = new Map();
    for (const n of c.board.nets) for (const t of n.terminals) onNet.set(`${t.part}.${t.terminal}`, n.terminals.length);
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
    return { c, ids };
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
        const { c } = buildBench(spec);
        const json = c.toJSON();
        resetIds();
        Circuit.fromJSON(JSON.parse(JSON.stringify(json)));
        const dir = join(EXAMPLES, id);
        mkdirSync(dir, { recursive: true });
        refuseToRevertRepairs(join(dir, 'circuit.json'), { force: forced() });
        writeFileSync(join(dir, 'circuit.json'), JSON.stringify(json, null, 2) + '\n');
        if (!existsSync(join(dir, 'program.bw'))) writeFileSync(join(dir, 'program.bw'), '# Pure circuit — no MCU\n');
        console.log(`  ✓ ${id}: ${c.parts.length - 1} parts`);
        ok++;
    } catch (e) {
        console.log(`  ✗ ${id}: ${e.message}`);
        fail++;
    }
}
console.log(`\n${ok} written, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
