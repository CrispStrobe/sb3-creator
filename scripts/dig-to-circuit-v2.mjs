#!/usr/bin/env node
/**
 * dig-to-circuit v2 — Digital .dig → circuit.json with REAL WIRES,
 * using Digital itself as the pin oracle.
 *
 * v1 landed elements but punted wire resolution ("need pin
 * resolution"); brute-forcing the shape geometry was ambiguous because
 * embedded chips render with the GENERIC shape, label-ordered, and can
 * be mirrored (8bitsim's 74161 is). The deterministic answer: ask
 * Digital. Its CLI SVG export draws every pin LABEL at its exact
 * coordinate, orientation and mirroring already applied:
 *
 *     java -cp Digital.jar CLI svg -dig module.dig -svg out.svg
 *
 * Pipeline:
 *   1. XML: visualElements (chips, In/Out/Clock, VDD/Ground) + wire
 *      segments.
 *   2. SVG: gray pin-label texts, clustered to the nearest chip
 *      instance → {chip, label} → (x, y) pin coordinates.
 *   3. label → our terminal name via the label map extracted from
 *      Digital's own library circuits (pinNumber attrs → DIP order →
 *      sidecar terminal order).
 *   4. Nets: union-find over wire endpoints WITH point-on-segment
 *      merging (Digital connects a pin touching a wire's middle).
 *   5. Emit parts + wires (one wire per net edge to a hub terminal);
 *      In → button (active-low to GND w/ pull-up left to the DRC),
 *      Clock → timer_555 output node placeholder, Out → led + resistor
 *      to GND, VDD/Ground → vcc/gnd symbols.
 *
 * Requires: java + the Digital release (GPL, run-local, never
 * vendored) at ~/code/digital-sim/Digital/Digital.jar or $DIGITAL_JAR.
 *
 * Usage: node scripts/dig-to-circuit-v2.mjs <module.dig> [out.json]
 */
import { readFileSync, writeFileSync, mkdtempSync, cpSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { tmpdir, homedir } from 'node:os';

const JAR = process.env.DIGITAL_JAR
    || join(homedir(), 'code', 'digital-sim', 'Digital', 'Digital.jar');
const input = process.argv[2];
const output = process.argv[3] || input.replace(/\.dig$/, '.circuit.json');

// ── Digital-label → our-part mapping for the chips 8bitsim uses ──
// Label lists in the LIBRARY's declaration order (matches the generic
// shape's pin stacking); terminal names are our sidecars'.
const CHIPS = {
    '74245.dig': { kind: '74hc245', labels: { DIR: 'dir', VCC: 'vcc', GND: 'gnd', A1: 'a1', A2: 'a2', A3: 'a3', A4: 'a4', A5: 'a5', A6: 'a6', A7: 'a7', A8: 'a8', B1: 'b1', B2: 'b2', B3: 'b3', B4: 'b4', B5: 'b5', B6: 'b6', B7: 'b7', B8: 'b8', '~OE': 'oeb', OE: 'oeb' } },
    '74161.dig': { kind: '74hc161', labels: { '~CLR': 'clrb', CLK: 'clk', A: 'a', B: 'b', C: 'c', D: 'd', ENP: 'enp', GND: 'gnd', '~LD': 'ldb', ENT: 'ent', QD: 'qd', QC: 'qc', QB: 'qb', QA: 'qa', RCO: 'rco', VCC: 'vcc' } },
    '74173.dig': { kind: '74hc173', labels: { M: 'm', N: 'n', '1Q': 'q1', '2Q': 'q2', '3Q': 'q3', '4Q': 'q4', CLK: 'clk', CLR: 'clr', '1D': 'd1', '2D': 'd2', '3D': 'd3', '4D': 'd4', '~G2': 'g2b', '~G1': 'g1b', VCC: 'vcc', GND: 'gnd' } },
    '74157.dig': { kind: '74hc157', labels: { '~G': 'gb', 'A/~B': 'sel', S: 'sel', VCC: 'vcc', GND: 'gnd', '1A': 'a1', '1B': 'b1', '1Y': 'y1', '2A': 'a2', '2B': 'b2', '2Y': 'y2', '3A': 'a3', '3B': 'b3', '3Y': 'y3', '4A': 'a4', '4B': 'b4', '4Y': 'y4' } },
};

// ── 1. Parse the .dig XML ──
const xml = readFileSync(input, 'utf8');
const elements = [...xml.matchAll(/<visualElement>([\s\S]*?)<\/visualElement>/g)].map((m, i) => {
    const t = m[1];
    const get = (re) => re.exec(t)?.[1];
    return {
        i,
        name: get(/<elementName>([^<]+)<\/elementName>/),
        label: get(/Label<\/string>\s*<string>([^<]+)<\/string>/),
        x: Number(get(/<pos x="(-?\d+)"/)),
        y: Number(/<pos x="-?\d+" y="(-?\d+)"/.exec(t)?.[1]),
    };
});
const wires = [...xml.matchAll(/<wire>\s*<p1 x="(-?\d+)" y="(-?\d+)"\/>\s*<p2 x="(-?\d+)" y="(-?\d+)"\/>\s*<\/wire>/g)]
    .map((m) => m.slice(1).map(Number));

// ── 2. SVG pin oracle ──
const work = mkdtempSync(join(tmpdir(), 'dig2c-'));
cpSync(dirname(input), work, { recursive: true });   // siblings for subcircuit refs
const svgPath = join(work, 'oracle.svg');
execFileSync('java', ['-cp', JAR, 'CLI', 'svg', '-dig', join(work, basename(input)), '-svg', svgPath], { stdio: 'pipe' });
const svg = readFileSync(svgPath, 'utf8');

const chipEls = elements.filter((e) => CHIPS[e.name]);
const pinTexts = [...svg.matchAll(/<text text-anchor="(start|end|middle)" x="([\d.\-]+)" y="([\d.\-]+)" fill="#808080" style="font-size:18px">([^<]+)<\/text>/g)]
    .map((m) => ({ anchor: m[1], x: Number(m[2]), y: Number(m[3]), text: m[4] }));

// Cluster pin labels to the nearest chip instance; label x sits ±4-6
// from the pin, baseline ~6.75 below — snap to the 20-grid.
const snap = (v) => Math.round(v / 20) * 20;
const pinAt = {};   // `${chipIdx}:${terminal}` → {x, y}
for (const pt of pinTexts) {
    let best = null, bestD = Infinity;
    for (const e of chipEls) {
        if (!(pt.text in CHIPS[e.name].labels)) continue;
        const d = Math.hypot(pt.x - e.x, pt.y - e.y);
        if (d < bestD && d < 400) { bestD = d; best = e; }
    }
    if (!best) continue;
    const term = CHIPS[best.name].labels[pt.text];
    const px = snap(pt.anchor === 'start' ? pt.x - 4 : pt.x + 4);
    const py = snap(pt.y - 6.75);
    const key = `${best.i}:${term}`;
    if (!(key in pinAt) || bestD < pinAt[key].d) pinAt[key] = { x: px, y: py, d: bestD };
}

// ── 3. Nets: union-find with point-on-segment ──
const parent = new Map();
const find = (k) => { let r = k; while (parent.get(r) !== r) r = parent.get(r); parent.set(k, r); return r; };
const uni = (a, b) => { for (const k of [a, b]) if (!parent.has(k)) parent.set(k, k); parent.set(find(a), find(b)); };
const P = (x, y) => `${x},${y}`;
for (const [x1, y1, x2, y2] of wires) uni(P(x1, y1), P(x2, y2));
const onSeg = (x, y, [x1, y1, x2, y2]) =>
    (x1 === x2 && x === x1 && Math.min(y1, y2) <= y && y <= Math.max(y1, y2)) ||
    (y1 === y2 && y === y1 && Math.min(x1, x2) <= x && x <= Math.max(x1, x2));
const attach = (x, y) => {
    for (const w of wires) if (onSeg(x, y, w)) { uni(P(x, y), P(w[0], w[1])); return true; }
    return false;
};

// Terminals that join the net graph: chip pins (from the oracle) and
// single-point elements (In/Out/Clock at pos; VDD/Ground at pos).
const nodes = [];  // {partId, terminal, x, y}
const parts = [];
let n = 0;
const addPart = (kind, id, params = {}) => { parts.push({ id, kind, params, x: 100 + (n++ % 8) * 120, y: 60 + Math.floor(n / 8) * 90, rotation: 0 }); return id; };
const extraWires = [];

for (const e of chipEls) {
    const id = e.label || `${CHIPS[e.name].kind}_${e.i}`;
    addPart(CHIPS[e.name].kind, id);
    for (const [key, p] of Object.entries(pinAt)) {
        const [idx, term] = key.split(':');
        if (Number(idx) !== e.i) continue;
        nodes.push({ partId: id, terminal: term, x: p.x, y: p.y });
    }
}
for (const e of elements) {
    if (e.name === 'VDD') { const id = addPart('vcc', `vcc_${e.i}`, { volts: 5 }); nodes.push({ partId: id, terminal: 'vcc', x: e.x, y: e.y }); }
    if (e.name === 'Ground') { const id = addPart('gnd', `gnd_${e.i}`); nodes.push({ partId: id, terminal: 'gnd', x: e.x, y: e.y }); }
    if (e.name === 'In') { const id = addPart('button', e.label || `in_${e.i}`); nodes.push({ partId: id, terminal: 'a', x: e.x, y: e.y }); }
    if (e.name === 'Clock') {
        const id = addPart('timer_555', e.label || `clk_${e.i}`);
        nodes.push({ partId: id, terminal: 'output', x: e.x, y: e.y });
        // Astable realization: R + C so the 555 oscillates under the engine
        const rId = addPart('resistor', `${id}_r`, { ohms: 10000 });
        const cId = addPart('capacitor', `${id}_c`, { farads: 1e-6 });
        const vId = addPart('vcc', `${id}_vcc`, { volts: 5 });
        const gId = addPart('gnd', `${id}_gnd`);
        extraWires.push(
            { from: vId, fromTerminal: 'vcc', to: rId, toTerminal: 'a' },
            { from: rId, fromTerminal: 'b', to: id, toTerminal: 'discharge' },
            { from: rId, fromTerminal: 'b', to: id, toTerminal: 'threshold' },
            { from: id, fromTerminal: 'threshold', to: id, toTerminal: 'trigger' },
            { from: id, fromTerminal: 'trigger', to: cId, toTerminal: 'a' },
            { from: cId, fromTerminal: 'b', to: gId, toTerminal: 'gnd' },
            { from: vId, fromTerminal: 'vcc', to: id, toTerminal: 'reset' },
            { from: vId, fromTerminal: 'vcc', to: id, toTerminal: 'vcc' },
            { from: gId, fromTerminal: 'gnd', to: id, toTerminal: 'gnd' }
        );
    }
    if (e.name === 'Out') {
        const ledId = addPart('led', e.label || `out_${e.i}`, { color: 'red' });
        const rId = addPart('resistor', `${ledId}_r`, { ohms: 220 });
        const gId = addPart('gnd', `${ledId}_gnd`);
        nodes.push({ partId: ledId, terminal: 'anode', x: e.x, y: e.y });
        extraWires.push(
            { from: ledId, fromTerminal: 'cathode', to: rId, toTerminal: 'a' },
            { from: rId, fromTerminal: 'b', to: gId, toTerminal: 'gnd' }
        );
    }
}

let attached = 0, floating = [];
for (const node of nodes) (attach(node.x, node.y) ? attached++ : floating.push(`${node.partId}.${node.terminal}`));

// ── 4. Emit wires: hub-and-spoke per net ──
const byNet = new Map();
for (const node of nodes) {
    if (!parent.has(P(node.x, node.y))) continue;
    const root = find(P(node.x, node.y));
    if (!byNet.has(root)) byNet.set(root, []);
    byNet.get(root).push(node);
}
const outWires = [];
for (const members of byNet.values()) {
    const hub = members[0];
    for (const m of members.slice(1)) {
        outWires.push({ from: hub.partId, fromTerminal: hub.terminal, to: m.partId, toTerminal: m.terminal });
    }
}

const allWires = [...outWires, ...extraWires];
writeFileSync(output, JSON.stringify({ vcc: 5, parts, wires: allWires }, null, 2));
console.log(`${parts.length} parts, ${outWires.length} wires (${byNet.size} nets); pins attached ${attached}/${nodes.length}` +
    (floating.length ? `; floating: ${floating.slice(0, 8).join(' ')}` : ''));

// ── Environment note ──
// Requires: Java runtime + Digital.jar (hneemann/Digital, GPL, run-local).
// Set DIGITAL_JAR=/path/to/Digital.jar or place at ~/code/digital-sim/Digital/Digital.jar.
// Download from: https://github.com/hneemann/Digital/releases
