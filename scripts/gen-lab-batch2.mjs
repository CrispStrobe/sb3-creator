#!/usr/bin/env node
/**
 * Generate the second batch of `lab-*` pure-circuit benches.
 *
 *   node scripts/gen-lab-batch2.mjs            # write every bench
 *   node scripts/gen-lab-batch2.mjs lab-foo    # write only the named ones
 *
 * Each bench is described as PARTS plus NETS (lists of `part.terminal`), and
 * this script turns that into a circuit.json. Two layouts:
 *
 *   seated     every part that has a breadboard footprint goes on one
 *              breadboard, each lead in a strip of its own (two-lead parts
 *              stand across the centre gutter, one column each), and the
 *              connections are drawn as ordinary wires between terminals.
 *   schematic  for benches with parts the breadboard cannot hold (LM358,
 *              555, meters, sensor modules): parts at the grid positions the
 *              bench gives.
 *
 * What is CHECKED before a file is written, not hoped for:
 *   - the engine accepts the netlist (a rejected netlist leaves an empty board);
 *   - every terminal shares its net with at least one other terminal;
 *   - the engine's net partition is exactly the declared one, so a lead seated
 *     in the wrong strip (an accidental short) refuses the write;
 *   - the JSON survives Circuit.fromJSON -> toJSON -> fromJSON.
 *
 * EXPECTED.md, intro.md and intro.de.md are hand-written and never touched.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectEngine } from './lib/engine-surface.mjs';
import { refuseToRevertRepairs, forced } from './lib/generator-guard.mjs';

const { Circuit, resetIds, cuiURL } = await injectEngine();
const { FOOTPRINTS, computeLeadMap, rotateFootprint } =
    await import(new URL('src/model/footprints.js', cuiURL).href);

const HERE = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = join(HERE, '..', 'examples');

// ---------------------------------------------------------------------------
// layout helpers

const BB = { id: 'bb1', x: 470, y: 330 };
const UNSEATED = new Set(['vcc', 'gnd', 'vsource', 'breadboard']);
// The DIP switch has no footprint entry; it straddles the gutter like the
// one in pc93-nand-is-universal (pole N: Na in row e, Nb in row f).
const EXTRA_FOOTPRINTS = {
    dip_switch_spst: { refTerminal: '1a', straddlesGutter: true, leads: {
        '1a': { dRow: 0, dCol: 0 }, '2a': { dRow: 0, dCol: 1 }, '3a': { dRow: 0, dCol: 2 }, '4a': { dRow: 0, dCol: 3 },
        '1b': { dRow: 5, dCol: 0 }, '2b': { dRow: 5, dCol: 1 }, '3b': { dRow: 5, dCol: 2 }, '4b': { dRow: 5, dCol: 3 } } },
};
const footprintOf = (kind) => EXTRA_FOOTPRINTS[kind] || FOOTPRINTS[kind];
// The hole names of a full-size board, taken from the board model itself.
const { BreadboardModel } = await import(new URL('src/model/breadboard.js', cuiURL).href);
const FULL_BOARD = new BreadboardModel({});
const FULL_BOARD_HOLES = new Set([...'abcdefghij'].flatMap(r =>
    Array.from({ length: FULL_BOARD.cols }, (_, i) => `${r}${i + 1}`)));

/** Seat parts left to right; every lead gets a strip nobody else uses. */
function seatAll(parts) {
    let col = 2;
    for (const p of parts) {
        if (UNSEATED.has(p.kind)) continue;
        const fp = footprintOf(p.kind);
        if (!fp) throw new Error(`${p.id} (${p.kind}) has no footprint — this bench cannot be seated`);
        const leads = Object.values(fp.leads);
        const span = Math.max(...leads.map(o => o.dCol));
        let leadMap, rot;
        if (leads.length === 2 && !fp.straddlesGutter) {
            // Stand it across the gutter: first lead in the top block, second
            // in row f, one column — two strips, no shared strip with anyone.
            const k = span;
            const refRow = 'abcde'[5 - k];
            leadMap = computeLeadMap(rotateFootprint(fp, 1), `${refRow}${col}`);
            rot = 1;
            col += 2;
        } else if (fp.straddlesGutter) {
            leadMap = computeLeadMap(fp, `e${col}`);
            col += span + 2;
        } else {
            leadMap = computeLeadMap(fp, `c${col}`);
            col += span + 2;
        }
        // Every hole a lead was given must exist; computeLeadMap does not check
        // the column range, so ask whether the far lead ran off the board.
        if (!Object.values(leadMap).every(h => FULL_BOARD_HOLES.has(h))) {
            throw new Error(`bench does not fit one breadboard (${p.id} would sit at column ${col})`);
        }
        p.seat = { boardId: BB.id, leadMap, ...(rot ? { rot } : {}) };
        const cols = Object.values(leadMap).map(h => Number(h.slice(1)));
        p.x = BB.x - 380 + 15 * Math.min(...cols);
        p.y = BB.y;
    }
}

function toJSON(spec) {
    const parts = spec.parts.map((p, i) => ({
        id: p.id, kind: p.kind, params: { ...(p.params || {}) },
        x: p.at ? p.at[0] : 80 + (i % 8) * 110,
        y: p.at ? p.at[1] : 80 + Math.floor(i / 8) * 120,
        rotation: 0,
        ...(p.label ? { label: p.label } : {}),
    }));
    if (spec.seat) {
        seatAll(parts);
        parts.unshift({ id: BB.id, kind: 'breadboard', params: {}, terminals: [], x: BB.x, y: BB.y, rotation: 0 });
    }
    const wires = [];
    for (const net of spec.nets) {
        const ends = net.map(s => { const i = s.indexOf('.'); return { part: s.slice(0, i), terminal: s.slice(i + 1) }; });
        for (let i = 1; i < ends.length; i++) {
            wires.push({ from: ends[i - 1].part, fromTerminal: ends[i - 1].terminal, to: ends[i].part, toTerminal: ends[i].terminal });
        }
    }
    return { vcc: spec.vcc, parts, wires };
}

function verify(id, spec, json) {
    resetIds();
    const c = Circuit.fromJSON(JSON.parse(JSON.stringify(json)));
    const nets = c.nets || c.board.getNets();
    if (!nets.length) throw new Error('engine rejected the netlist (board is empty)');
    const netOf = new Map();
    for (const n of nets) for (const t of n.terminals) netOf.set(`${t.part}.${t.terminal}`, n.id || n.name);
    const size = new Map();
    for (const v of netOf.values()) size.set(v, (size.get(v) || 0) + 1);
    const bad = [];
    for (const p of c.parts) {
        if (p.kind === 'breadboard') continue;
        for (const t of p.terminals || []) {
            const n = netOf.get(`${p.id}.${t}`);
            if ((spec.open || []).includes(`${p.id}.${t}`)) continue;  // declared unused output
            if (n === undefined) bad.push(`${p.id}.${t} is on no net`);
            else if (size.get(n) < 2) bad.push(`${p.id}.${t} is alone on its net`);
        }
    }
    // Declared partition == engine partition.
    const seen = new Map();
    spec.nets.forEach((net, i) => {
        const ids = new Set(net.map(s => netOf.get(s)));
        if (ids.size !== 1) bad.push(`declared net ${i} (${net.join(',')}) is split by the engine`);
        const id0 = [...ids][0];
        if (seen.has(id0)) bad.push(`declared nets ${seen.get(id0)} and ${i} are shorted together`);
        seen.set(id0, i);
    });
    if (bad.length) throw new Error(`${id}: ${bad.join(' | ')}`);
    c.board.advanceTo(2_000_000n);
    const again = c.toJSON();
    resetIds();
    Circuit.fromJSON(again);
}

// ---------------------------------------------------------------------------
// the benches

const B = {};
const at = (col, row) => [80 + col * 110, 70 + row * 95];

// lab-nand-code-lock: four switches, seven NAND gates, one relay.
// Code 1-0-1-1: open = S1 · /S2 · S3 · S4.
B['lab-nand-code-lock'] = () => ({
    vcc: 5, seat: true, open: ['u2.4y'],
    parts: [
        { id: 'vcc1', kind: 'vcc', at: [80, 60] },
        { id: 'gnd1', kind: 'gnd', at: [80, 620] },
        { id: 'sw', kind: 'dip_switch_spst', params: { switches: 0 }, label: 'Code S1-S4' },
        { id: 'rp1', kind: 'resistor', params: { ohms: 10000 }, label: 'R1 pull-down' },
        { id: 'rp2', kind: 'resistor', params: { ohms: 10000 }, label: 'R2 pull-down' },
        { id: 'rp3', kind: 'resistor', params: { ohms: 10000 }, label: 'R3 pull-down' },
        { id: 'rp4', kind: 'resistor', params: { ohms: 10000 }, label: 'R4 pull-down' },
        { id: 'u1', kind: '74hc00', label: 'U1 NAND' },
        { id: 'u2', kind: '74hc00', label: 'U2 NAND' },
        { id: 'rb', kind: 'resistor', params: { ohms: 4700 }, label: 'R5 base' },
        { id: 'q1', kind: 'npn', params: { beta: 100 }, label: 'Q1 driver' },
        { id: 'k1', kind: 'relay', params: {}, label: 'K1 door' },
        { id: 'd1', kind: 'diode', params: {}, label: 'D1 flyback' },
        { id: 'rg', kind: 'resistor', params: { ohms: 330 }, label: 'R6' },
        { id: 'led_open', kind: 'led', params: { vf: 2, color: 'green' }, label: 'OPEN' },
        { id: 'rr', kind: 'resistor', params: { ohms: 330 }, label: 'R7' },
        { id: 'led_locked', kind: 'led', params: { vf: 2, color: 'red' }, label: 'LOCKED' },
    ],
    nets: [
        ['vcc1.vcc', 'sw.1a', 'sw.2a', 'sw.3a', 'sw.4a', 'u1.vcc', 'u2.vcc', 'k1.coil_a', 'd1.cathode', 'k1.com'],
        ['sw.1b', 'rp1.a', 'u1.2a'],
        ['sw.2b', 'rp2.a', 'u1.1a', 'u1.1b'],
        ['sw.3b', 'rp3.a', 'u1.3a'],
        ['sw.4b', 'rp4.a', 'u1.3b'],
        ['u1.1y', 'u1.2b'],                       // /S2
        ['u1.2y', 'u1.4a', 'u1.4b'],              // /(S1·/S2)
        ['u1.3y', 'u2.1a', 'u2.1b'],              // /(S3·S4)
        ['u1.4y', 'u2.2a'],                       // S1·/S2
        ['u2.1y', 'u2.2b'],                       // S3·S4
        ['u2.2y', 'u2.3a', 'u2.3b'],              // /OPEN
        ['u2.3y', 'rb.a'],                        // OPEN
        ['rb.b', 'q1.base'],
        ['q1.collector', 'k1.coil_b', 'd1.anode'],
        ['k1.no', 'rg.a'], ['rg.b', 'led_open.anode'],
        ['k1.nc', 'rr.a'], ['rr.b', 'led_locked.anode'],
        ['gnd1.gnd', 'rp1.b', 'rp2.b', 'rp3.b', 'rp4.b', 'u1.gnd', 'u2.gnd', 'u2.4a', 'u2.4b',
            'q1.emitter', 'led_open.cathode', 'led_locked.cathode'],
    ],
});

// lab-first-press-wins: two lockout transistors, one per player. Holding a
// button feeds that player's LED; the voltage across that LED drives the
// transistor that short-circuits the OTHER player's LED node.
B['lab-first-press-wins'] = () => ({
    vcc: 5, seat: true,
    parts: [
        { id: 'vcc1', kind: 'vcc', at: [80, 60] },
        { id: 'gnd1', kind: 'gnd', at: [80, 620] },
        { id: 'btn_a', kind: 'button', label: 'Player A' },
        { id: 'r_a', kind: 'resistor', params: { ohms: 470 }, label: 'R1' },
        { id: 'led_a', kind: 'led', params: { vf: 2, color: 'red' }, label: 'A first' },
        { id: 'rx_a', kind: 'resistor', params: { ohms: 10000 }, label: 'R3' },
        { id: 'q_a', kind: 'npn', params: { beta: 100 }, label: 'Q1 blocks B' },
        { id: 'c_a', kind: 'capacitor', params: { farads: 1e-6 }, label: 'C1' },
        { id: 'btn_b', kind: 'button', label: 'Player B' },
        { id: 'r_b', kind: 'resistor', params: { ohms: 470 }, label: 'R2' },
        { id: 'led_b', kind: 'led', params: { vf: 2, color: 'green' }, label: 'B first' },
        { id: 'rx_b', kind: 'resistor', params: { ohms: 10000 }, label: 'R4' },
        { id: 'q_b', kind: 'npn', params: { beta: 100 }, label: 'Q2 blocks A' },
        { id: 'c_b', kind: 'capacitor', params: { farads: 1e-6 }, label: 'C2' },
    ],
    nets: [
        ['vcc1.vcc', 'btn_a.a', 'btn_b.a'],
        ['btn_a.b', 'r_a.a'],
        ['r_a.b', 'led_a.anode', 'q_b.collector', 'rx_a.a'],
        ['rx_a.b', 'q_a.base', 'c_a.a'],
        ['btn_b.b', 'r_b.a'],
        ['r_b.b', 'led_b.anode', 'q_a.collector', 'rx_b.a'],
        ['rx_b.b', 'q_b.base', 'c_b.a'],
        ['gnd1.gnd', 'led_a.cathode', 'led_b.cathode', 'q_a.emitter', 'q_b.emitter', 'c_a.b', 'c_b.b'],
    ],
});

// lab-mosfet-memory: charge on an insulated gate keeps the LED lit.
B['lab-mosfet-memory'] = () => ({
    vcc: 5, seat: true,
    parts: [
        { id: 'vcc1', kind: 'vcc', at: [80, 60] },
        { id: 'gnd1', kind: 'gnd', at: [80, 620] },
        { id: 'btn_1', kind: 'button', label: 'Write 1' },
        { id: 'r_1', kind: 'resistor', params: { ohms: 47000 }, label: 'R1' },
        { id: 'btn_0', kind: 'button', label: 'Write 0' },
        { id: 'r_0', kind: 'resistor', params: { ohms: 47000 }, label: 'R2' },
        { id: 'c_g', kind: 'capacitor', params: { farads: 10e-6 }, label: 'C1 gate store' },
        { id: 'r_leak', kind: 'resistor', params: { ohms: 1500000 }, label: 'R3 leak' },
        { id: 'm1', kind: 'nmos', params: { vth: 1.5, k: 0.004 }, label: 'T1' },
        { id: 'r_led', kind: 'resistor', params: { ohms: 220 }, label: 'R4' },
        { id: 'led1', kind: 'led', params: { vf: 2, color: 'yellow' }, label: 'LED' },
    ],
    nets: [
        ['vcc1.vcc', 'btn_1.a', 'r_led.a'],
        ['btn_1.b', 'r_1.a'],
        ['r_1.b', 'r_0.a', 'c_g.a', 'r_leak.a', 'm1.gate'],
        ['r_0.b', 'btn_0.a'],
        ['r_led.b', 'led1.anode'],
        ['led1.cathode', 'm1.drain'],
        ['gnd1.gnd', 'btn_0.b', 'c_g.b', 'r_leak.b', 'm1.source'],
    ],
});

// lab-lamp-monitor: a 1 ohm shunt under the lamp; the comparator pulls the
// warning LED's cathode low when the lamp is switched on but draws nothing.
B['lab-lamp-monitor'] = () => ({
    vcc: 9,
    open: ['socket.b', 'light_sw.b', 'u1.2_out'],
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'light_sw', kind: 'slide_switch', params: { position: 0 }, label: 'Light switch', at: at(1, 0) },
        { id: 'socket', kind: 'slide_switch', params: { position: 0 }, label: 'Bulb socket', at: at(2, 1) },
        { id: 'lamp', kind: 'light_bulb', params: { ohms: 90, vRated: 9 }, label: 'Tail lamp', at: at(2, 2) },
        { id: 'r_sense', kind: 'resistor', params: { ohms: 10 }, label: 'R1 shunt', at: at(2, 4) },
        { id: 'r_top', kind: 'resistor', params: { ohms: 18000 }, label: 'R2', at: at(3, 1) },
        { id: 'r_bot', kind: 'resistor', params: { ohms: 1000 }, label: 'R3', at: at(3, 4) },
        { id: 'u1', kind: 'lm358', label: 'U1 comparator', at: at(4, 3) },
        { id: 'r_led', kind: 'resistor', params: { ohms: 470 }, label: 'R4', at: at(5, 1) },
        { id: 'led_warn', kind: 'led', params: { vf: 2, color: 'red' }, label: 'Lamp fault', at: at(5, 2) },
    ],
    nets: [
        ['vcc1.vcc', 'light_sw.com', 'u1.vcc'],
        ['light_sw.a', 'socket.com', 'r_top.a', 'r_led.a'],
        ['socket.a', 'lamp.a'],
        ['lamp.b', 'r_sense.a', 'u1.1_pos'],
        ['r_top.b', 'r_bot.a', 'u1.1_neg'],
        ['r_led.b', 'led_warn.anode'],
        ['led_warn.cathode', 'u1.1_out'],
        ['gnd1.gnd', 'r_sense.b', 'r_bot.b', 'u1.gnd', 'u1.2_pos', 'u1.2_neg'],
    ],
});

// A moving-coil movement is a coil (here 1 kOhm) that deflects fully at
// 100 uA. The analog_meter across the coil reads the coil's own voltage, so
// its needle IS the coil current: 100 uA x 1 kOhm = 0.1 V full scale.
const movement = (id, label, col, row) => [
    { id: `${id}_coil`, kind: 'resistor', params: { ohms: 1000 }, label: `${label} coil 1k`, at: at(col, row) },
    { id: `${id}_needle`, kind: 'analog_meter', params: { fullScale: 0.1 }, label: `${label} (100 uA full scale)`, at: at(col + 1, row) },
];

// lab-meter-multiplier: the movement as a voltmeter, two ranges, measuring
// the middle of a 10k/10k divider so the meter's own load is visible.
B['lab-meter-multiplier'] = () => ({
    vcc: 9,
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'r_up', kind: 'resistor', params: { ohms: 10000 }, label: 'R1', at: at(1, 1) },
        { id: 'r_dn', kind: 'resistor', params: { ohms: 10000 }, label: 'R2', at: at(1, 4) },
        { id: 'dvm', kind: 'voltmeter', label: 'Reference voltmeter', at: at(0, 3) },
        { id: 'r_5v', kind: 'resistor', params: { ohms: 49000 }, label: 'Multiplier 5 V (49k)', at: at(2, 2) },
        { id: 'r_10v', kind: 'resistor', params: { ohms: 99000 }, label: 'Multiplier 10 V (99k)', at: at(2, 3) },
        { id: 'range', kind: 'slide_switch', params: { position: 0 }, label: 'Range 5 V / 10 V', at: at(3, 2) },
        ...movement('m', 'Meter', 4, 3),
    ],
    nets: [
        ['vcc1.vcc', 'r_up.a'],
        ['r_up.b', 'r_dn.a', 'dvm.a', 'r_5v.a', 'r_10v.a'],
        ['r_5v.b', 'range.a'],
        ['r_10v.b', 'range.b'],
        ['range.com', 'm_coil.a', 'm_needle.a'],
        ['gnd1.gnd', 'r_dn.b', 'dvm.b', 'm_coil.b', 'm_needle.b'],
    ],
});

// lab-meter-shunt: three movements turned into 10 mA meters by a 10.1 ohm
// shunt each, reading the total and the two branch currents of a network.
// The total meter's shunt can be switched out to show the needle pegging.
B['lab-meter-shunt'] = () => ({
    vcc: 5,
    open: ['shunt_sw.b'],
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 7) },
        { id: 'r_feed', kind: 'resistor', params: { ohms: 100 }, label: 'R1 100', at: at(1, 0) },
        { id: 'shunt_t', kind: 'resistor', params: { ohms: 10 }, label: 'Shunt total 10 (+0.1 contact)', at: at(2, 0) },
        { id: 'shunt_sw', kind: 'slide_switch', params: { position: 0 }, label: 'Shunt in / out', at: at(2, 1) },
        ...movement('mt', 'Total', 3, 1),
        { id: 'r_a', kind: 'resistor', params: { ohms: 1000 }, label: 'R2 1k', at: at(1, 3) },
        { id: 'shunt_a', kind: 'resistor', params: { ohms: 10.1 }, label: 'Shunt A 10.1', at: at(2, 3) },
        ...movement('ma', 'Branch A', 3, 3),
        { id: 'r_b', kind: 'resistor', params: { ohms: 2200 }, label: 'R3 2k2', at: at(1, 5) },
        { id: 'shunt_b', kind: 'resistor', params: { ohms: 10.1 }, label: 'Shunt B 10.1', at: at(2, 5) },
        ...movement('mb', 'Branch B', 3, 5),
    ],
    nets: [
        ['vcc1.vcc', 'r_feed.a'],
        ['r_feed.b', 'shunt_sw.com', 'mt_coil.a', 'mt_needle.a'],
        ['shunt_sw.a', 'shunt_t.a'],
        ['shunt_t.b', 'mt_coil.b', 'mt_needle.b', 'r_a.a', 'r_b.a'],
        ['r_a.b', 'shunt_a.a', 'ma_coil.a', 'ma_needle.a'],
        ['r_b.b', 'shunt_b.a', 'mb_coil.a', 'mb_needle.a'],
        ['gnd1.gnd', 'shunt_a.b', 'ma_coil.b', 'ma_needle.b', 'shunt_b.b', 'mb_coil.b', 'mb_needle.b'],
    ],
});

// lab-led-threshold: a buffered variable voltage feeds four LEDs side by
// side, each through its own 470 ohm. The LEDs are exponential junctions.
const jled = (vf, color) => ({ vf, color, model: 'shockley' });
B['lab-led-threshold'] = () => ({
    vcc: 9,
    open: ['u1.2_out'],
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'r_top', kind: 'resistor', params: { ohms: 10000 }, label: 'R5 10k', at: at(1, 1) },
        { id: 'pot', kind: 'potentiometer', params: { ohms: 10000, position: 0.5 }, label: 'Voltage knob', at: at(1, 2) },
        { id: 'u1', kind: 'lm358', label: 'U1 follower', at: at(2, 2) },
        { id: 'r_red', kind: 'resistor', params: { ohms: 470 }, label: 'R1', at: at(3, 1) },
        { id: 'am', kind: 'ammeter', label: 'I red', at: at(4, 1) },
        { id: 'led_red', kind: 'led', params: jled(1.8, 'red'), label: 'red', at: at(5, 2) },
        { id: 'vm', kind: 'voltmeter', label: 'V red', at: at(6, 2) },
        { id: 'r_yel', kind: 'resistor', params: { ohms: 470 }, label: 'R2', at: at(3, 3) },
        { id: 'led_yel', kind: 'led', params: jled(2.0, 'yellow'), label: 'yellow', at: at(4, 3) },
        { id: 'r_grn', kind: 'resistor', params: { ohms: 470 }, label: 'R3', at: at(3, 4) },
        { id: 'led_grn', kind: 'led', params: jled(2.2, 'green'), label: 'green', at: at(4, 4) },
        { id: 'r_blu', kind: 'resistor', params: { ohms: 470 }, label: 'R4', at: at(3, 5) },
        { id: 'led_blu', kind: 'led', params: jled(3.0, 'blue'), label: 'blue', at: at(4, 5) },
    ],
    nets: [
        ['vcc1.vcc', 'r_top.a', 'u1.vcc'],
        ['r_top.b', 'pot.a'],
        ['pot.wiper', 'u1.1_pos'],
        ['u1.1_out', 'u1.1_neg', 'r_red.a', 'r_yel.a', 'r_grn.a', 'r_blu.a'],
        ['r_red.b', 'am.a'],
        ['am.b', 'led_red.anode', 'vm.a'],
        ['r_yel.b', 'led_yel.anode'],
        ['r_grn.b', 'led_grn.anode'],
        ['r_blu.b', 'led_blu.anode'],
        ['gnd1.gnd', 'pot.b', 'u1.gnd', 'u1.2_pos', 'u1.2_neg', 'led_red.cathode', 'vm.b',
            'led_yel.cathode', 'led_grn.cathode', 'led_blu.cathode'],
    ],
});

// 555 astable/monostable pieces shared below.
const timer = (id, label, col, row) => ({ id, kind: 'timer_555', label, at: at(col, row) });

// lab-colour-pitch: the LED under test sits in the 555's charging path, so
// its forward voltage is taken off the voltage that charges the capacitor.
// DIP switch: 1 = wire link, 2 = red, 3 = green, 4 = blue (one at a time).
B['lab-colour-pitch'] = () => ({
    vcc: 9,
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'link', kind: 'resistor', params: { ohms: 1 }, label: 'wire link', at: at(1, 1) },
        { id: 'led_red', kind: 'led', params: { vf: 1.8, color: 'red' }, label: 'red', at: at(1, 2) },
        { id: 'led_grn', kind: 'led', params: { vf: 2.2, color: 'green' }, label: 'green', at: at(1, 3) },
        { id: 'led_blu', kind: 'led', params: { vf: 3.0, color: 'blue' }, label: 'blue', at: at(1, 4) },
        { id: 'sel', kind: 'dip_switch_spst', params: { switches: 2 }, label: 'Socket: 1 link 2 red 3 green 4 blue', at: at(2, 2) },
        { id: 'r1', kind: 'resistor', params: { ohms: 10000 }, label: 'R1 10k', at: at(3, 1) },
        { id: 'r2', kind: 'resistor', params: { ohms: 1000 }, label: 'R2 1k', at: at(3, 3) },
        { id: 'c_t', kind: 'capacitor', params: { farads: 100e-9 }, label: 'C1 100n', at: at(3, 5) },
        timer('u1', 'U1 555', 4, 3),
        { id: 'c_ctl', kind: 'capacitor', params: { farads: 10e-9 }, label: 'C2 10n', at: at(5, 5) },
        { id: 'pz', kind: 'piezo', label: 'Piezo', at: at(6, 3) },
    ],
    nets: [
        ['vcc1.vcc', 'link.a', 'led_red.anode', 'led_grn.anode', 'led_blu.anode', 'u1.vcc', 'u1.reset'],
        ['link.b', 'sel.1a'], ['led_red.cathode', 'sel.2a'], ['led_grn.cathode', 'sel.3a'], ['led_blu.cathode', 'sel.4a'],
        ['sel.1b', 'sel.2b', 'sel.3b', 'sel.4b', 'r1.a'],
        ['r1.b', 'u1.discharge', 'r2.a'],
        ['r2.b', 'u1.threshold', 'u1.trigger', 'c_t.a'],
        ['u1.control', 'c_ctl.a'],
        ['u1.output', 'pz.a'],
        ['gnd1.gnd', 'c_t.b', 'c_ctl.b', 'u1.gnd', 'pz.b'],
    ],
});

// lab-light-tone: a phototransistor in parallel with the 555's R1 adds a
// light-dependent charging current; R1 keeps a low tone in the dark.
B['lab-light-tone'] = () => ({
    vcc: 9,
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'pt', kind: 'phototransistor', params: { light: 0.5, iMax: 0.0005 }, label: 'Phototransistor', at: at(1, 1) },
        { id: 'r1', kind: 'resistor', params: { ohms: 47000 }, label: 'R1 47k', at: at(2, 1) },
        { id: 'r2', kind: 'resistor', params: { ohms: 1000 }, label: 'R2 1k', at: at(2, 3) },
        { id: 'c_t', kind: 'capacitor', params: { farads: 100e-9 }, label: 'C1 100n', at: at(2, 5) },
        timer('u1', 'U1 555', 3, 3),
        { id: 'c_ctl', kind: 'capacitor', params: { farads: 10e-9 }, label: 'C2 10n', at: at(4, 5) },
        { id: 'pz', kind: 'piezo', label: 'Piezo', at: at(5, 3) },
    ],
    nets: [
        ['vcc1.vcc', 'pt.collector', 'r1.a', 'u1.vcc', 'u1.reset'],
        ['pt.emitter', 'r1.b', 'u1.discharge', 'r2.a'],
        ['r2.b', 'u1.threshold', 'u1.trigger', 'c_t.a'],
        ['u1.control', 'c_ctl.a'],
        ['u1.output', 'pz.a'],
        ['gnd1.gnd', 'c_t.b', 'c_ctl.b', 'u1.gnd', 'pz.b'],
    ],
});

// lab-exposure-timer: a 555 monostable whose timing capacitor is charged by
// a phototransistor; R1 alone sets the longest (dark) time.
B['lab-exposure-timer'] = () => ({
    vcc: 9,
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'pt', kind: 'phototransistor', params: { light: 0.5, iMax: 0.0005 }, label: 'Phototransistor', at: at(1, 1) },
        { id: 'r1', kind: 'resistor', params: { ohms: 1000000 }, label: 'R1 1M', at: at(2, 1) },
        { id: 'c_t', kind: 'capacitor', params: { farads: 22e-6 }, label: 'C1 22u', at: at(2, 5) },
        { id: 'r_trig', kind: 'resistor', params: { ohms: 10000 }, label: 'R2 10k', at: at(3, 1) },
        { id: 'start', kind: 'button', label: 'Start', at: at(3, 5) },
        timer('u1', 'U1 555', 4, 3),
        { id: 'c_ctl', kind: 'capacitor', params: { farads: 10e-9 }, label: 'C2 10n', at: at(5, 5) },
        { id: 'r_led', kind: 'resistor', params: { ohms: 470 }, label: 'R3 470', at: at(5, 2) },
        { id: 'lamp', kind: 'led', params: { vf: 2, color: 'white' }, label: 'Exposure lamp', at: at(6, 3) },
    ],
    nets: [
        ['vcc1.vcc', 'pt.collector', 'r1.a', 'r_trig.a', 'u1.vcc', 'u1.reset'],
        ['pt.emitter', 'r1.b', 'u1.threshold', 'u1.discharge', 'c_t.a'],
        ['r_trig.b', 'u1.trigger', 'start.a'],
        ['u1.control', 'c_ctl.a'],
        ['u1.output', 'r_led.a'],
        ['r_led.b', 'lamp.anode'],
        ['gnd1.gnd', 'c_t.b', 'start.b', 'c_ctl.b', 'u1.gnd', 'lamp.cathode'],
    ],
});

// lab-hearing-sweep: a 555 astable from about 2.8 kHz to 20 kHz on the pot;
// the range switch adds 10 nF for a low range.
B['lab-hearing-sweep'] = () => ({
    vcc: 9,
    open: ['range.a'],
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'r1', kind: 'resistor', params: { ohms: 2200 }, label: 'R1 2k2', at: at(1, 1) },
        { id: 'r2', kind: 'resistor', params: { ohms: 15000 }, label: 'R2 15k', at: at(1, 3) },
        { id: 'pot', kind: 'potentiometer', params: { ohms: 100000, position: 0.5 }, label: 'Pitch 100k', at: at(2, 3) },
        { id: 'c_t', kind: 'capacitor', params: { farads: 2.2e-9 }, label: 'C1 2n2', at: at(2, 5) },
        { id: 'range', kind: 'slide_switch', params: { position: 0 }, label: 'Range high / low', at: at(3, 5) },
        { id: 'c_low', kind: 'capacitor', params: { farads: 10e-9 }, label: 'C3 10n', at: at(4, 5) },
        timer('u1', 'U1 555', 4, 3),
        { id: 'c_ctl', kind: 'capacitor', params: { farads: 10e-9 }, label: 'C2 10n', at: at(5, 5) },
        { id: 'pz', kind: 'piezo', label: 'Piezo', at: at(6, 3) },
    ],
    nets: [
        ['vcc1.vcc', 'r1.a', 'u1.vcc', 'u1.reset'],
        ['r1.b', 'u1.discharge', 'r2.a'],
        ['r2.b', 'pot.a'],
        ['pot.wiper', 'pot.b', 'u1.threshold', 'u1.trigger', 'c_t.a', 'range.com'],
        ['range.b', 'c_low.a'],
        ['u1.control', 'c_ctl.a'],
        ['u1.output', 'pz.a'],
        ['gnd1.gnd', 'c_t.b', 'c_low.b', 'c_ctl.b', 'u1.gnd', 'pz.b'],
    ],
});

// lab-flicker-fusion: 555 clock -> 74HC74 toggle (D = /Q) -> LED.
B['lab-flicker-fusion'] = () => ({
    vcc: 5,
    open: ['ff.2q', 'ff.2q_bar'],
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'r1', kind: 'resistor', params: { ohms: 1000 }, label: 'R1 1k', at: at(1, 1) },
        { id: 'r2', kind: 'resistor', params: { ohms: 1000 }, label: 'R2 1k', at: at(1, 3) },
        { id: 'pot', kind: 'potentiometer', params: { ohms: 10000, position: 0.5 }, label: 'Rate 10k', at: at(2, 3) },
        { id: 'c_t', kind: 'capacitor', params: { farads: 1e-6 }, label: 'C1 1u', at: at(2, 5) },
        timer('u1', 'U1 555', 3, 3),
        { id: 'c_ctl', kind: 'capacitor', params: { farads: 10e-9 }, label: 'C2 10n', at: at(3, 5) },
        { id: 'ff', kind: '74hc74', label: 'U2 divide by 2', at: at(4, 3) },
        { id: 'r_led', kind: 'resistor', params: { ohms: 330 }, label: 'R3 330', at: at(5, 2) },
        { id: 'led1', kind: 'led', params: { vf: 2, color: 'red' }, label: 'Test LED', at: at(6, 3) },
    ],
    nets: [
        ['vcc1.vcc', 'r1.a', 'u1.vcc', 'u1.reset', 'ff.vcc', 'ff.1pre', 'ff.1clr', 'ff.2pre', 'ff.2clr'],
        ['r1.b', 'u1.discharge', 'r2.a'],
        ['r2.b', 'pot.a'],
        ['pot.wiper', 'pot.b', 'u1.threshold', 'u1.trigger', 'c_t.a'],
        ['u1.control', 'c_ctl.a'],
        ['u1.output', 'ff.1clk'],
        ['ff.1d', 'ff.1q_bar'],
        ['ff.1q', 'r_led.a'],
        ['r_led.b', 'led1.anode'],
        ['gnd1.gnd', 'c_t.b', 'c_ctl.b', 'u1.gnd', 'ff.gnd', 'ff.2d', 'ff.2clk', 'led1.cathode'],
    ],
});

// lab-level-crossing: reed A sets a NAND latch, reed B resets it, the latch
// enables a 555 flasher whose output alternates two red lamps.
B['lab-level-crossing'] = () => ({
    vcc: 5,
    open: ['u1.3y', 'u1.4y'],
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'reed_a', kind: 'reed_switch', params: { magnet: false }, label: 'Contact A (train coming)', at: at(1, 2) },
        { id: 'reed_b', kind: 'reed_switch', params: { magnet: false }, label: 'Contact B (train gone)', at: at(1, 4) },
        { id: 'r_s', kind: 'resistor', params: { ohms: 10000 }, label: 'R1 10k', at: at(1, 1) },
        { id: 'r_r', kind: 'resistor', params: { ohms: 10000 }, label: 'R2 10k', at: at(2, 1) },
        { id: 'c_por', kind: 'capacitor', params: { farads: 10e-6 }, label: 'C1 power-on reset', at: at(2, 5) },
        { id: 'u1', kind: '74hc00', label: 'U1 NAND latch', at: at(3, 3) },
        { id: 'r_a', kind: 'resistor', params: { ohms: 10000 }, label: 'R3 10k', at: at(4, 1) },
        { id: 'r_b', kind: 'resistor', params: { ohms: 47000 }, label: 'R4 47k', at: at(4, 2) },
        { id: 'c_t', kind: 'capacitor', params: { farads: 10e-6 }, label: 'C2 10u', at: at(4, 5) },
        timer('u2', 'U2 555 flasher', 5, 3),
        { id: 'c_ctl', kind: 'capacitor', params: { farads: 10e-9 }, label: 'C3 10n', at: at(5, 5) },
        { id: 'r_l1', kind: 'resistor', params: { ohms: 330 }, label: 'R5', at: at(6, 2) },
        { id: 'lamp_1', kind: 'led', params: { vf: 2, color: 'red' }, label: 'Lamp left', at: at(7, 2) },
        { id: 'r_l2', kind: 'resistor', params: { ohms: 330 }, label: 'R6', at: at(6, 4) },
        { id: 'lamp_2', kind: 'led', params: { vf: 2, color: 'red' }, label: 'Lamp right', at: at(7, 4) },
    ],
    nets: [
        ['vcc1.vcc', 'r_s.a', 'r_r.a', 'u1.vcc', 'r_a.a', 'u2.vcc'],
        ['r_s.b', 'reed_a.a', 'u1.1a'],               // /SET
        ['r_r.b', 'reed_b.a', 'c_por.a', 'u1.2b'],    // /RESET, held low at power-on
        ['u1.1y', 'u1.2a', 'u2.reset', 'r_l2.a'],     // Q: enables the flasher, feeds lamp 2
        ['u1.2y', 'u1.1b'],                           // /Q
        ['r_a.b', 'u2.discharge', 'r_b.a'],
        ['r_b.b', 'u2.threshold', 'u2.trigger', 'c_t.a'],
        ['u2.control', 'c_ctl.a'],
        ['u2.output', 'r_l1.a', 'lamp_2.cathode'],
        ['r_l1.b', 'lamp_1.anode'],
        ['r_l2.b', 'lamp_2.anode'],
        ['gnd1.gnd', 'reed_a.b', 'reed_b.b', 'c_por.b', 'u1.gnd', 'u1.3a', 'u1.3b', 'u1.4a', 'u1.4b',
            'c_t.b', 'c_ctl.b', 'u2.gnd', 'lamp_1.cathode'],
    ],
});

// lab-led-light-sensor: photocurrent into a transimpedance amplifier
// (1 MOhm feedback), then a comparator against a threshold knob that lights
// a lamp LED when it gets dark. The photodiode is set to a weak 5 uA at full
// light, the order of what a clear LED delivers when used backwards.
B['lab-led-light-sensor'] = () => ({
    vcc: 9,
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'pd', kind: 'photodiode', params: { light: 0.8, iMax: 5e-6 }, label: 'Sensor (LED used backwards)', at: at(1, 3) },
        { id: 'r_f', kind: 'resistor', params: { ohms: 1000000 }, label: 'R1 1M feedback', at: at(2, 1) },
        { id: 'u1', kind: 'lm358', label: 'U1', at: at(3, 3) },
        { id: 'meter', kind: 'analog_meter', params: { fullScale: 5 }, label: 'Light meter 0-5 V', at: at(4, 1) },
        { id: 'pot', kind: 'potentiometer', params: { ohms: 10000, position: 0.5 }, label: 'Switch-on level', at: at(4, 5) },
        { id: 'r_top', kind: 'resistor', params: { ohms: 8200 }, label: 'R2 8k2', at: at(4, 4) },
        { id: 'r_led', kind: 'resistor', params: { ohms: 680 }, label: 'R3 680', at: at(5, 2) },
        { id: 'lamp', kind: 'led', params: { vf: 2, color: 'yellow' }, label: 'Night lamp', at: at(6, 3) },
    ],
    nets: [
        ['vcc1.vcc', 'u1.vcc', 'r_top.a'],
        ['pd.cathode', 'r_f.a', 'u1.1_neg'],
        ['u1.1_out', 'r_f.b', 'meter.a', 'u1.2_neg'],
        ['r_top.b', 'pot.a'],
        ['pot.wiper', 'u1.2_pos'],
        ['u1.2_out', 'r_led.a'],
        ['r_led.b', 'lamp.anode'],
        ['gnd1.gnd', 'pd.anode', 'u1.1_pos', 'u1.gnd', 'meter.b', 'pot.b', 'lamp.cathode'],
    ],
});

// lab-log-amp: an exponential diode in the feedback path of an inverting
// stage (split +-9 V supply), then x10 so a decade of input is ~0.6 V.
B['lab-log-amp'] = () => ({
    vcc: 9,
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'neg9', kind: 'vsource', params: { volts: 9 }, label: '-9 V supply', at: at(0, 4) },
        { id: 'pot', kind: 'potentiometer', params: { ohms: 10000, position: 0.5 }, label: 'Input 0-9 V', at: at(1, 2) },
        { id: 'vin', kind: 'voltmeter', label: 'V in', at: at(1, 4) },
        { id: 'r_in', kind: 'resistor', params: { ohms: 100000 }, label: 'R1 100k', at: at(2, 2) },
        { id: 'd_log', kind: 'diode', params: { model: 'shockley', is: 1e-14, n: 1, rs: 0 }, label: 'D1 log element', at: at(3, 1) },
        { id: 'u1', kind: 'lm358', label: 'U1', at: at(3, 3) },
        { id: 'r_g1', kind: 'resistor', params: { ohms: 10000 }, label: 'R2 10k', at: at(4, 2) },
        { id: 'r_g2', kind: 'resistor', params: { ohms: 100000 }, label: 'R3 100k', at: at(5, 1) },
        { id: 'meter', kind: 'analog_meter', params: { fullScale: 7 }, label: 'Log output', at: at(6, 3) },
    ],
    nets: [
        ['vcc1.vcc', 'pot.a', 'u1.vcc'],
        ['pot.wiper', 'r_in.a', 'vin.a'],
        ['r_in.b', 'd_log.anode', 'u1.1_neg'],
        ['d_log.cathode', 'u1.1_out', 'r_g1.a'],
        ['r_g1.b', 'r_g2.a', 'u1.2_neg'],
        ['r_g2.b', 'u1.2_out', 'meter.a'],
        ['neg9.neg', 'u1.gnd'],
        ['gnd1.gnd', 'neg9.pos', 'pot.b', 'vin.b', 'u1.1_pos', 'u1.2_pos', 'meter.b'],
    ],
});

// lab-hall-poles: a Hall sensor's output sits at mid-supply with no field;
// two comparators either side of it tell north from south, and a meter
// against a mid-supply reference shows the field's size and sign.
B['lab-hall-poles'] = () => ({
    vcc: 5,
    open: ['hall.do'],
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'hall', kind: 'hall_analog', params: { field: 0.5 }, label: 'Hall sensor', at: at(1, 3) },
        { id: 'r_t', kind: 'resistor', params: { ohms: 20000 }, label: 'R1 20k', at: at(2, 1) },
        { id: 'r_m', kind: 'resistor', params: { ohms: 10000 }, label: 'R2 10k', at: at(2, 3) },
        { id: 'r_b', kind: 'resistor', params: { ohms: 20000 }, label: 'R3 20k', at: at(2, 5) },
        { id: 'u1', kind: 'lm358', label: 'U1 window', at: at(3, 3) },
        { id: 'r_n', kind: 'resistor', params: { ohms: 220 }, label: 'R4', at: at(4, 2) },
        { id: 'led_n', kind: 'led', params: { vf: 2, color: 'red' }, label: 'North', at: at(5, 2) },
        { id: 'r_s', kind: 'resistor', params: { ohms: 220 }, label: 'R5', at: at(4, 4) },
        { id: 'led_s', kind: 'led', params: { vf: 2, color: 'green' }, label: 'South', at: at(5, 4) },
        { id: 'r_z1', kind: 'resistor', params: { ohms: 10000 }, label: 'R6 10k', at: at(6, 1) },
        { id: 'r_z2', kind: 'resistor', params: { ohms: 10000 }, label: 'R7 10k', at: at(6, 5) },
        { id: 'meter', kind: 'analog_meter', params: { fullScale: 2 }, label: 'Field (centre zero)', at: at(7, 3) },
    ],
    nets: [
        ['vcc1.vcc', 'hall.vcc', 'r_t.a', 'u1.vcc', 'r_z1.a'],
        ['r_t.b', 'r_m.a', 'u1.1_neg'],                 // 3.0 V
        ['r_m.b', 'r_b.a', 'u1.2_pos'],                 // 2.0 V
        ['hall.ao', 'u1.1_pos', 'u1.2_neg', 'meter.a'],
        ['u1.1_out', 'r_n.a'], ['r_n.b', 'led_n.anode'],
        ['u1.2_out', 'r_s.a'], ['r_s.b', 'led_s.anode'],
        ['r_z1.b', 'r_z2.a', 'meter.b'],                // 2.5 V zero reference
        ['gnd1.gnd', 'hall.gnd', 'r_b.b', 'u1.gnd', 'led_n.cathode', 'led_s.cathode', 'r_z2.b'],
    ],
});

// lab-listening-amp: a few millivolts from a speaker used as microphone
// (here a 1 kHz source standing in for it), a volume divider, and a
// non-inverting x101 stage biased at half supply.
B['lab-listening-amp'] = () => ({
    vcc: 9,
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'mic', kind: 'vsource', params: { wave: 'sine', freq: 1000, amplitude: 0.01, offset: 0 }, label: 'Speaker as microphone (10 mV)', at: at(1, 4) },
        { id: 'c_in', kind: 'capacitor', params: { farads: 1e-6 }, label: 'C1 1u', at: at(1, 2) },
        { id: 'pot', kind: 'potentiometer', params: { ohms: 10000, position: 0.5 }, label: 'Sensitivity', at: at(2, 3) },
        { id: 'c_c', kind: 'capacitor', params: { farads: 1e-6 }, label: 'C2 1u', at: at(3, 2) },
        { id: 'r_h1', kind: 'resistor', params: { ohms: 10000 }, label: 'R1 10k', at: at(3, 0) },
        { id: 'r_h2', kind: 'resistor', params: { ohms: 10000 }, label: 'R2 10k', at: at(3, 5) },
        { id: 'r_bias', kind: 'resistor', params: { ohms: 100000 }, label: 'R3 100k bias', at: at(4, 1) },
        { id: 'u1', kind: 'opamp', label: 'U1 x101 (rails 0-9 V)', at: at(4, 3) },
        { id: 'r_fb', kind: 'resistor', params: { ohms: 100000 }, label: 'R4 100k', at: at(5, 1) },
        { id: 'r_g', kind: 'resistor', params: { ohms: 1000 }, label: 'R5 1k', at: at(5, 4) },
        { id: 'c_g', kind: 'capacitor', params: { farads: 2.2e-6 }, label: 'C3 2u2', at: at(5, 5) },
        { id: 'c_out', kind: 'capacitor', params: { farads: 10e-6 }, label: 'C4 10u', at: at(6, 2) },
        { id: 'ear', kind: 'piezo', label: 'Earpiece', at: at(7, 3) },
    ],
    nets: [
        ['vcc1.vcc', 'r_h1.a'],
        ['mic.pos', 'c_in.a'],
        ['c_in.b', 'pot.a'],
        ['pot.wiper', 'c_c.a'],
        ['r_h1.b', 'r_h2.a', 'r_bias.a'],               // 4.5 V half-supply reference
        ['c_c.b', 'r_bias.b', 'u1.inp'],
        ['u1.inn', 'r_fb.a', 'r_g.a'],
        ['r_g.b', 'c_g.a'],
        ['u1.out', 'r_fb.b', 'c_out.a'],
        ['c_out.b', 'ear.a'],
        ['gnd1.gnd', 'mic.neg', 'pot.b', 'r_h2.b', 'c_g.b', 'ear.b'],
    ],
});

// lab-lc-ringing: the switch charges C from the supply, then throws it
// across the coil; 10 ohms stands for the winding's resistance.
B['lab-lc-ringing'] = () => ({
    vcc: 5,
    open: ['c_sw.a'],
    parts: [
        { id: 'vcc1', kind: 'vcc', at: at(0, 0) },
        { id: 'gnd1', kind: 'gnd', at: at(0, 6) },
        { id: 'r_ch', kind: 'resistor', params: { ohms: 100 }, label: 'R1 100 charge', at: at(1, 1) },
        { id: 'sw', kind: 'slide_switch', params: { position: 0 }, label: 'Charge / ring', at: at(2, 1) },
        { id: 'c1', kind: 'capacitor', params: { farads: 1e-6 }, label: 'C1 1u', at: at(3, 3) },
        { id: 'c_sw', kind: 'slide_switch', params: { position: 0 }, label: 'Add 3 uF', at: at(4, 2) },
        { id: 'c2', kind: 'capacitor', params: { farads: 3e-6 }, label: 'C2 3u', at: at(4, 4) },
        { id: 'r_coil', kind: 'resistor', params: { ohms: 10 }, label: 'R2 coil loss 10', at: at(2, 3) },
        { id: 'l1', kind: 'inductor', params: { henrys: 0.1 }, label: 'L1 100 mH', at: at(2, 5) },
    ],
    nets: [
        ['vcc1.vcc', 'r_ch.a'],
        ['r_ch.b', 'sw.a'],
        ['sw.com', 'c1.a', 'c_sw.com'],
        ['c_sw.b', 'c2.a'],
        ['sw.b', 'r_coil.a'],
        ['r_coil.b', 'l1.a'],
        ['gnd1.gnd', 'c1.b', 'c2.b', 'l1.b'],
    ],
});

// ---------------------------------------------------------------------------

const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
let ok = 0, fail = 0;
for (const [id, make] of Object.entries(B)) {
    if (only.length && !only.includes(id)) continue;
    try {
        const spec = make();
        const json = toJSON(spec);
        verify(id, spec, json);
        const dir = join(EXAMPLES, id);
        mkdirSync(dir, { recursive: true });
        const file = join(dir, 'circuit.json');
        refuseToRevertRepairs(file, { force: forced() });
        writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
        console.log(`  ok ${id}`);
        ok++;
    } catch (e) {
        console.log(`  FAIL ${id}: ${e.message.slice(0, 400)}`);
        fail++;
    }
}
console.log(`${ok} written, ${fail} failed`);
if (fail) process.exitCode = 1;
