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
 *      Tunnel elements provide invisible named connections.
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
// SVG pin labels come from Digital's own rendering — they differ from
// the datasheet numbering (D0 not 1D, Q0 not 1Q, A1 not 1A, etc.).
// Terminal names are our engine sidecar names.
const CHIPS = {
    '74245.dig': { kind: '74hc245', labels: { DIR: 'dir', VCC: 'vcc', GND: 'gnd', A1: 'a0', A2: 'a1', A3: 'a2', A4: 'a3', A5: 'a4', A6: 'a5', A7: 'a6', A8: 'a7', B1: 'b0', B2: 'b1', B3: 'b2', B4: 'b3', B5: 'b4', B6: 'b5', B7: 'b6', B8: 'b7', '~OE': 'oeb', OE: 'oeb' } },
    '74161.dig': { kind: '74ls161', labels: { '~CLR': 'clrb', CLK: 'clk', A: 'd0', B: 'd1', C: 'd2', D: 'd3', ENP: 'enp', GND: 'gnd', '~LD': 'loadb', ENT: 'ent', QD: 'q3', QC: 'q2', QB: 'q1', QA: 'q0', RCO: 'rco', VCC: 'vcc' } },
    '74173.dig': { kind: '74ls173', labels: { OE1: 'm', OE2: 'n', Q0: 'q1', Q1: 'q2', Q2: 'q3', Q3: 'q4', CLK: 'clk', RES: 'clr', D0: 'd1', D1: 'd2', D2: 'd3', D3: 'd4', DE2: 'g2b', DE1: 'g1b', VCC: 'vcc', GND: 'gnd' } },
    '74157.dig': { kind: '74ls157', labels: { G: 'gb', '~G': 'gb', S: 'sel', VCC: 'vcc', GND: 'gnd', A1: 'a1', B1: 'b1', Y1: 'y1', A2: 'a2', B2: 'b2', Y2: 'y2', A3: 'a3', B3: 'b3', Y3: 'y3', A4: 'a4', B4: 'b4', Y4: 'y4' } },
    '74283.dig': { kind: '74ls283', labels: { A1: 'a1', A2: 'a2', A3: 'a3', A4: 'a4', B1: 'b1', B2: 'b2', B3: 'b3', B4: 'b4', C0: 'c0', C4: 'c4', S1: 's1', S2: 's2', S3: 's3', S4: 's4', VCC: 'vcc', GND: 'gnd' } },
    '74138.dig': { kind: '74ls138', labels: { A: 'a', B: 'b', C: 'c', '~GA': 'gab', '~GB': 'gbb', G: 'g', GA: 'gab', GB: 'gbb', VCC: 'vcc', GND: 'gnd', '~Y0': 'y0b', '~Y1': 'y1b', '~Y2': 'y2b', '~Y3': 'y3b', '~Y4': 'y4b', '~Y5': 'y5b', '~Y6': 'y6b', '~Y7': 'y7b', Y0: 'y0b', Y1: 'y1b', Y2: 'y2b', Y3: 'y3b', Y4: 'y4b', Y5: 'y5b', Y6: 'y6b', Y7: 'y7b' } },
    '74139.dig': { kind: '74ls139', labels: { '~1G': 'g1b', '~2G': 'g2b', '1G': 'g1b', '2G': 'g2b', '1A': 'a1', '1B': 'b1', '2A': 'a2', '2B': 'b2', '~1Y0': 'y10b', '~1Y1': 'y11b', '~1Y2': 'y12b', '~1Y3': 'y13b', '~2Y0': 'y20b', '~2Y1': 'y21b', '~2Y2': 'y22b', '~2Y3': 'y23b', '1Y0': 'y10b', '1Y1': 'y11b', '1Y2': 'y12b', '1Y3': 'y13b', '2Y0': 'y20b', '2Y1': 'y21b', '2Y2': 'y22b', '2Y3': 'y23b', VCC: 'vcc', GND: 'gnd' } },
    '74154.dig': { kind: '74ls154', labels: { A: 'a', B: 'b', C: 'c', D: 'd', G1: 'g1', G2: 'g2', VCC: 'vcc', GND: 'gnd', Y0: 'y0', Y1: 'y1', Y2: 'y2', Y3: 'y3', Y4: 'y4', Y5: 'y5', Y6: 'y6', Y7: 'y7', Y8: 'y8', Y9: 'y9', Y10: 'y10', Y11: 'y11', Y12: 'y12', Y13: 'y13', Y14: 'y14', Y15: 'y15' } },
    '74189.dig': { kind: '74ls189', labels: { A0: 'a0', A1: 'a1', A2: 'a2', A3: 'a3', D0: 'd0', D1: 'd1', D2: 'd2', D3: 'd3', Q0: 'q0', Q1: 'q1', Q2: 'q2', Q3: 'q3', '~CS': 'csb', '~WE': 'web', CS: 'csb', WE: 'web', VCC: 'vcc', GND: 'gnd' } },
    '74374.dig': { kind: '74ls374', labels: { CLK: 'clk', '~OC': 'ocb', OC: 'ocb', D0: 'd0', D1: 'd1', D2: 'd2', D3: 'd3', D4: 'd4', D5: 'd5', D6: 'd6', D7: 'd7', Q0: 'q0', Q1: 'q1', Q2: 'q2', Q3: 'q3', Q4: 'q4', Q5: 'q5', Q6: 'q6', Q7: 'q7', VCC: 'vcc', GND: 'gnd' } },
    '7476.dig': { kind: '7476', labels: { '1J': 'j1', '1K': 'k1', '1Q': 'q1', '2J': 'j2', '2K': 'k2', '2Q': 'q2', VCC: 'vcc', GND: 'gnd' } },
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
const setOverrides = {};
for (const a of process.argv.slice(4)) {
    const m = /^--set$/.test(a) ? null : /^([^=]+)=([01])$/.exec(a);
    if (m) setOverrides[m[1]] = Number(m[2]);
}
const inDefault = (idx) => {
    const t = /<visualElement>([\s\S]*?)<\/visualElement>/g;
    let i = 0, m;
    while ((m = t.exec(xml))) {
        if (i++ !== idx) continue;
        const d = /InDefault<\/string>\s*<value v="(\d+)"/.exec(m[1])
            || /Default<\/string>\s*<(?:int|long)>(\d+)</.exec(m[1]);
        return d ? Number(d[1]) : 0;
    }
    return 0;
};
const wires = [...xml.matchAll(/<wire>\s*<p1 x="(-?\d+)" y="(-?\d+)"\/>\s*<p2 x="(-?\d+)" y="(-?\d+)"\/>\s*<\/wire>/g)]
    .map((m) => m.slice(1).map(Number));

// ── 2. SVG pin oracle ──
const work = mkdtempSync(join(tmpdir(), 'dig2c-'));
cpSync(dirname(input), work, { recursive: true });   // siblings for subcircuit refs
const svgPath = join(work, 'oracle.svg');
execFileSync('java', ['-cp', JAR, 'CLI', 'svg', '-dig', join(work, basename(input)), '-svg', svgPath], { stdio: 'pipe' });
const svg = readFileSync(svgPath, 'utf8');

const chipEls = elements.filter((e) => CHIPS[e.name]);
// Two label renderings: plain text, and ACTIVE-LOW pins as an
// overlined <tspan> (Digital draws the bar over CLR/LD/OE; the '~'
// prefix is ours). Missing the second form left clrb/loadb/oeb out of
// the oracle — the ties never wired, the floating clrb read low, and
// the counter sat in async clear with a perfectly ticking clock.
const pinTexts = [
    ...[...svg.matchAll(/<text text-anchor="(start|end|middle)" x="([\d.\-]+)" y="([\d.\-]+)" fill="#808080" style="font-size:18px">([^<]+)<\/text>/g)]
        .map((m) => ({ anchor: m[1], x: Number(m[2]), y: Number(m[3]), text: m[4] })),
    ...[...svg.matchAll(/<text text-anchor="(start|end|middle)" x="([\d.\-]+)" y="([\d.\-]+)" fill="#808080" style="font-size:18px"><tspan style="text-decoration:overline;">([^<]+)<\/tspan><\/text>/g)]
        .map((m) => ({ anchor: m[1], x: Number(m[2]), y: Number(m[3]), text: '~' + m[4] })),
];

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
// ── SPLITTERS ──────────────────────────────────────────────────────
// Digital's splitter fans a multi-bit bus into individual bits. In our
// flat single-bit netlist, individual-bit wires route independently
// through the splitter area without sharing endpoints, so the
// union-find naturally keeps them separate. No excision needed —
// earlier attempts to excise wires near the splitter position broke
// net connectivity (wrong geometry assumptions for rotated splitters).
for (const [x1, y1, x2, y2] of wires) uni(P(x1, y1), P(x2, y2));
const onSeg = (x, y, [x1, y1, x2, y2]) =>
    (x1 === x2 && x === x1 && Math.min(y1, y2) <= y && y <= Math.max(y1, y2)) ||
    (y1 === y2 && y === y1 && Math.min(x1, x2) <= x && x <= Math.max(x1, x2));
const attach = (x, y) => {
    for (const w of wires) if (onSeg(x, y, w)) { uni(P(x, y), P(w[0], w[1])); return true; }
    return false;
};

// ── TUNNEL BRIDGING ──────────────────────────────────────────────
// Digital's Tunnel elements are invisible named connections: all
// tunnel instances with the same NetName label are electrically
// connected. Attach each tunnel position to any wire it sits on,
// then union all instances sharing the same name.
const tunnelsByName = new Map();
for (const e of elements.filter((el) => el.name === 'Tunnel')) {
    const idx = xml.indexOf(`<pos x="${e.x}" y="${e.y}"/>`);
    const elXml = xml.slice(Math.max(0, idx - 500), idx + 200);
    const m = /NetName<\/string>\s*<string>([^<]+)</.exec(elXml);
    if (!m) continue;
    if (!tunnelsByName.has(m[1])) tunnelsByName.set(m[1], []);
    tunnelsByName.get(m[1]).push(P(e.x, e.y));
}
for (const [, keys] of tunnelsByName) {
    for (const k of keys) {
        const [tx, ty] = k.split(',').map(Number);
        attach(tx, ty);
    }
    for (let i = 1; i < keys.length; i++) uni(keys[0], keys[i]);
}
if (tunnelsByName.size) console.log(`  tunnels: ${tunnelsByName.size} named, ${[...tunnelsByName.values()].reduce((s, v) => s + v.length - 1, 0)} bridges`);

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
    if (e.name === 'In') {
        // Digital's In carries a default level; the ORIGINAL sim needs a
        // click for anything else (8bitsim's CE defaults 0: even upstream
        // the counter waits for the user). Realize defaults as rail ties;
        // --set LABEL=0/1 overrides (the acceptance enables CE that way).
        const label = e.label || `in_${e.i}`;
        const dflt = inDefault(e.i);
        const override = setOverrides[label];
        const level = override != null ? override : dflt;
        const id = level ? addPart('vcc', label, { volts: 5 }) : addPart('gnd', label);
        nodes.push({ partId: id, terminal: level ? 'vcc' : 'gnd', x: e.x, y: e.y });
    }
    if (e.name === 'Clock') {
        const id = addPart('timer_555', e.label || `clk_${e.i}`);
        nodes.push({ partId: id, terminal: 'output', x: e.x, y: e.y });
        // Astable realization — the PROVEN two-resistor classic from
        // ttl-clock-module (the single-R 50%-duty trick, with discharge
        // tied straight to threshold, never oscillates under our 555
        // model: verified by fine-grained sampling, output pinned low).
        // VCC → R1 → discharge → R2 → threshold(=trigger) → C → GND.
        const r1Id = addPart('resistor', `${id}_r1`, { ohms: 4700 });
        const r2Id = addPart('resistor', `${id}_r2`, { ohms: 10000 });
        const cId = addPart('capacitor', `${id}_c`, { farads: 1e-6 });
        const c2Id = addPart('capacitor', `${id}_cctl`, { farads: 1e-7 });
        const vId = addPart('vcc', `${id}_vcc`, { volts: 5 });
        const gId = addPart('gnd', `${id}_gnd`);
        extraWires.push(
            { from: vId, fromTerminal: 'vcc', to: r1Id, toTerminal: 'a' },
            { from: r1Id, fromTerminal: 'b', to: id, toTerminal: 'discharge' },
            { from: id, fromTerminal: 'discharge', to: r2Id, toTerminal: 'a' },
            { from: r2Id, fromTerminal: 'b', to: id, toTerminal: 'threshold' },
            { from: id, fromTerminal: 'threshold', to: id, toTerminal: 'trigger' },
            { from: id, fromTerminal: 'trigger', to: cId, toTerminal: 'a' },
            { from: cId, fromTerminal: 'b', to: gId, toTerminal: 'gnd' },
            { from: c2Id, fromTerminal: 'a', to: id, toTerminal: 'control' },
            { from: c2Id, fromTerminal: 'b', to: gId, toTerminal: 'gnd' },
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
