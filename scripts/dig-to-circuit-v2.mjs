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
    // Sub-circuit ROM modules — emit as rom parts with contents as params
    'ROM.dig': { kind: 'rom', labels: { A0: 'a0', A1: 'a1', A2: 'a2', A3: 'a3', A4: 'a4', A5: 'a5', A6: 'a6', A7: 'a7', A8: 'a8', A9: 'a9', A10: 'a10', CE: 'ce', D0: 'd0', D1: 'd1', D2: 'd2', D3: 'd3', D4: 'd4', D5: 'd5', D6: 'd6', D7: 'd7' } },
    'ROM-Out.dig': { kind: 'rom_7seg', labels: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e', F: 'f', G: 'g', DP: 'dp', MODE: 'mode' } },
    // 8bitsim sub-circuit modules — treated as opaque parts in Main.dig
    'ALU.dig': { kind: 'alu', labels: { SU: 'su', '~EO': 'eo', DBG: 'dbg', CF: 'cf', '~FI': 'fi', CLR: 'clr', B_7: 'b_7', B_6: 'b_6', B_5: 'b_5', B_4: 'b_4', B_3: 'b_3', B_2: 'b_2', B_1: 'b_1', B_0: 'b_0', A_7: 'a_7', A_6: 'a_6', A_5: 'a_5', A_4: 'a_4', A_3: 'a_3', ZF: 'zf', BUS_0: 'bus_0', BUS_1: 'bus_1', BUS_2: 'bus_2', BUS_3: 'bus_3', BUS_4: 'bus_4', BUS_5: 'bus_5', BUS_6: 'bus_6', BUS_7: 'bus_7', A_2: 'a_2', A_1: 'a_1', A_0: 'a_0' } },
    'MAR.dig': { kind: 'mar', labels: { A_0: 'a_0', A_1: 'a_1', A_2: 'a_2', A_3: 'a_3', BUS_3: 'bus_3', BUS_2: 'bus_2', BUS_1: 'bus_1', BUS_0: 'bus_0', '~MI': 'mi', CLR: 'clr', PA_0: 'pa_0', PA_1: 'pa_1', PA_2: 'pa_2', PA_3: 'pa_3', '~PROG': 'prog', DBG: 'dbg' } },
    'RAM.dig': { kind: 'ram', labels: { A3: 'a3', A2: 'a2', A1: 'a1', A0: 'a0', DBG: 'dbg', BUS_7: 'bus_7', BUS_6: 'bus_6', BUS_5: 'bus_5', BUS_4: 'bus_4', BUS_3: 'bus_3', BUS_2: 'bus_2', BUS_1: 'bus_1', BUS_0: 'bus_0', '~PROG': 'prog', '~RO': 'ro', RI: 'ri', PDATA: 'pdata', '~PULSE': 'pulse' } },
    'PC.dig': { kind: 'pc', labels: { '~CLR': 'clr', CE: 'ce', '~J': 'j', '~CO': 'co', BUS_3: 'bus_3', BUS_2: 'bus_2', BUS_1: 'bus_1', BUS_0: 'bus_0', DBG: 'dbg' } },
    'Ctrl.dig': { kind: 'ctrl', labels: { HLT: 'hlt', '~MI': 'mi', RI: 'ri', '~RO': 'ro', '~IO': 'io', '~II': 'ii', '~AI': 'ai', '~AO': 'ao', '~EO': 'eo', SU: 'su', '~BI': 'bi', OI: 'oi', CE: 'ce', '~CO': 'co', '~J': 'j', '~FI': 'fi', RESET: 'reset', CLR: 'clr', '~CLR': 'clr', DBGC: 'dbgc', IR_4: 'ir_4', IR_5: 'ir_5', IR_6: 'ir_6', IR_7: 'ir_7', CF: 'cf', ZF: 'zf', DBGS: 'dbgs' } },
    'Clock.dig': { kind: 'clock_module', labels: { CLK: 'clk', '~CLK': 'clk_inv', HLT: 'hlt', DBG: 'dbg', '~RUN': 'run', STEP: 'step' } },
    'LED7-Driver.dig': { kind: 'led7_driver', labels: { 'LA-D': 'la_d', '~SEL': 'sel', 'A-P_in': 'a_p_in', 'LE-P': 'le_p' } },
    'Out-Register.dig': { kind: 'out_register', labels: { BUS_0: 'bus_0', BUS_1: 'bus_1', BUS_2: 'bus_2', BUS_3: 'bus_3', BUS_4: 'bus_4', BUS_5: 'bus_5', BUS_6: 'bus_6', BUS_7: 'bus_7', '~SEL': 'sel', MODE: 'mode', '~CLR': 'clr', OI: 'oi', 'A-P': 'a_p' } },
    'A-Register.dig': { kind: 'a_register', labels: { BUS_0: 'bus_0', BUS_1: 'bus_1', BUS_2: 'bus_2', BUS_3: 'bus_3', BUS_4: 'bus_4', BUS_5: 'bus_5', BUS_6: 'bus_6', BUS_7: 'bus_7', '~AI': 'ai', '~AO': 'ao', CLR: 'clr', DBG: 'dbg', A_7: 'a_7', A_6: 'a_6', A_5: 'a_5', A_4: 'a_4', A_3: 'a_3', A_2: 'a_2', A_1: 'a_1', A_0: 'a_0' } },
    'B-Register.dig': { kind: 'b_register', labels: { BUS_0: 'bus_0', BUS_1: 'bus_1', BUS_2: 'bus_2', BUS_3: 'bus_3', BUS_4: 'bus_4', BUS_5: 'bus_5', BUS_6: 'bus_6', BUS_7: 'bus_7', '~BI': 'bi', '~BO': 'bo', CLK: 'clk', CLR: 'clr', DBG: 'dbg', B_7: 'b_7', B_6: 'b_6', B_5: 'b_5', B_4: 'b_4', B_3: 'b_3', B_2: 'b_2', B_1: 'b_1', B_0: 'b_0' } },
    'I-Register.dig': { kind: 'i_register', labels: { BUS_0: 'bus_0', BUS_1: 'bus_1', BUS_2: 'bus_2', BUS_3: 'bus_3', BUS_4: 'bus_4', BUS_5: 'bus_5', BUS_6: 'bus_6', BUS_7: 'bus_7', '~IO': 'io', '~II': 'ii', IR_4: 'ir_4', IR_5: 'ir_5', IR_6: 'ir_6', IR_7: 'ir_7', DBG: 'dbg', CLR: 'clr' } },
    'Instr-Display.dig': { kind: 'instr_display', labels: { INST: 'inst', DISP: 'disp' } },
    'Programmer.dig': { kind: 'programmer', labels: { '~PULSE': 'pulse', PDATA: 'pdata', SDATA: 'sdata', SADDR: 'saddr', '~SPULSE': 'spulse', '~SPROG': 'sprog', '~PROG': 'prog', PADDR: 'paddr', '~LOAD': 'load' } },
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
//
// Use the chip-name text (e.g. "74173" rendered at text-anchor="middle"
// at the bottom of each chip body in the SVG) as the chip center for
// distance calculations. This solves stacked-chip mis-assignment: two
// 74173s at (820,140) and (820,480) have anchors close together, but
// their chip-name texts at (870,417) and (870,757) are well-separated.
const snap = (v) => Math.round(v / 20) * 20;

// Extract chip-name text positions from the SVG as chip centers
const chipCenters = {};  // chipEl.i → {cx, cy}
const chipBaseName = (name) => name.replace('.dig', '');
const chipNameTexts = [...svg.matchAll(/<text text-anchor="middle" x="([\d.\-]+)" y="([\d.\-]+)"[^>]*>(\d+)<\/text>/g)]
    .map((m) => ({ x: Number(m[1]), y: Number(m[2]), name: m[3] }));
for (const e of chipEls) {
    const base = chipBaseName(e.name);
    // Find the closest chip-name text matching this chip type
    let bestCenter = null, bestD = Infinity;
    for (const ct of chipNameTexts) {
        if (ct.name !== base) continue;
        const d = Math.hypot(ct.x - e.x, ct.y - e.y);
        if (d < bestD) { bestD = d; bestCenter = ct; }
    }
    if (bestCenter) {
        chipCenters[e.i] = { cx: bestCenter.x, cy: bestCenter.y };
        // Remove used center so stacked chips don't share
        chipNameTexts.splice(chipNameTexts.indexOf(bestCenter), 1);
    } else {
        chipCenters[e.i] = { cx: e.x, cy: e.y };  // fallback to anchor
    }
}

// Greedy bipartite: collect all (label, chip, distance-to-center)
// candidates, sort by distance, assign each label to its closest chip
// — skip if that chip already owns the terminal from a closer label.
const candidates = [];
for (const pt of pinTexts) {
    for (const e of chipEls) {
        if (!(pt.text in CHIPS[e.name].labels)) continue;
        const c = chipCenters[e.i];
        const d = Math.hypot(pt.x - c.cx, pt.y - c.cy);
        if (d < 400) candidates.push({ pt, e, d });
    }
}
candidates.sort((a, b) => a.d - b.d);
const pinAt = {};   // `${chipIdx}:${terminal}` → {x, y, d}
const labelUsed = new Set();
for (const { pt, e, d } of candidates) {
    const labelKey = `${pt.x},${pt.y},${pt.text}`;
    if (labelUsed.has(labelKey)) continue;
    const term = CHIPS[e.name].labels[pt.text];
    const key = `${e.i}:${term}`;
    if (key in pinAt) continue;
    const px = snap(pt.anchor === 'start' ? pt.x - 4 : pt.x + 4);
    const py = snap(pt.y - 6.75);
    pinAt[key] = { x: px, y: py, d };
    labelUsed.add(labelKey);
}

// ── 3. Nets: union-find with point-on-segment ──
const parent = new Map();
const find = (k) => { let r = k; while (parent.get(r) !== r) r = parent.get(r); parent.set(k, r); return r; };
const uni = (a, b) => { for (const k of [a, b]) if (!parent.has(k)) parent.set(k, k); parent.set(find(a), find(b)); };
const P = (x, y) => `${x},${y}`;
const onSeg = (x, y, [x1, y1, x2, y2]) =>
    (x1 === x2 && x === x1 && Math.min(y1, y2) <= y && y <= Math.max(y1, y2)) ||
    (y1 === y2 && y === y1 && Math.min(x1, x2) <= x && x <= Math.max(x1, x2));
// ── SPLITTERS ──────────────────────────────────────────────────────
// Digital's splitter fans a multi-bit bus into individual bits. Model
// each splitter as N per-bit net junctions: bit i on the individual
// side unions with bit i on the bus side of every bus-connected peer.
// Bus-side wires carry ALL bits and must be EXCISED from the normal
// union-find to avoid shorting all bits together.

// 1. Extract splitter pin labels from SVG (font-size:12px, gray)
const splitterLabels12 = [
    // Non-rotated (no transform)
    ...[...svg.matchAll(/<text text-anchor="(start|end)" x="([\d.\-]+)" y="([\d.\-]+)" fill="#808080" style="font-size:12px">([^<]+)<\/text>/g)]
        .filter(m => !m[0].includes('transform'))
        .map(m => ({
            anchor: m[1], text: m[4],
            px: snap(m[1] === 'start' ? Number(m[2]) - 2 : Number(m[2]) + 2),
            py: snap(Number(m[3]) - 12),
        })),
    // Rotated (has transform="rotate(-90,cx,cy)") — use rotation center
    ...[...svg.matchAll(/<text text-anchor="(start|end)" x="[\d.\-]+" y="[\d.\-]+" fill="#808080" style="font-size:12px" transform="rotate\(-90,([\d.\-]+),([\d.\-]+)\)"\s*>([^<]+)<\/text>/g)]
        .map(m => ({
            anchor: m[1], text: m[4],
            px: snap(Number(m[2])),
            py: snap(Number(m[3])),
        })),
];

// 2. Parse Splitter elements from .dig XML
const splitterEls = elements.filter(e => e.name === 'Splitter').map(e => {
    // Re-extract full element XML for attributes
    const allEls = [...xml.matchAll(/<visualElement>([\s\S]*?)<\/visualElement>/g)];
    const elXml = allEls[e.i][1];
    const getSplitAttr = (name) => {
        const re = new RegExp(name.replace(/\s/g, '\\s') + '<\\/string>\\s*<string>([^<]+)<');
        return re.exec(elXml)?.[1];
    };
    const inputSplit = getSplitAttr('Input Splitting');
    const outputSplit = getSplitAttr('Output Splitting');
    return { ...e, inputSplit, outputSplit };
});

// 3. Cluster 12px labels to nearest splitter using greedy bipartite matching
//    (same strategy as chip pin clustering — sort by distance, assign each
//    label to its closest splitter that doesn't already own that bit/range).
for (const sp of splitterEls) {
    sp.indivPins = [];  // {bit, px, py}
    sp.busPins = [];    // {lo, hi, px, py}
}
const splCandidates = [];
for (const lbl of splitterLabels12) {
    const isRange = /^\d+-\d+$/.test(lbl.text);
    const isSingleBit = /^\d+$/.test(lbl.text);
    if (!isRange && !isSingleBit) continue;
    for (const sp of splitterEls) {
        const d = Math.hypot(lbl.px - sp.x, lbl.py - sp.y);
        if (d < 600) splCandidates.push({ lbl, sp, d });
    }
}
splCandidates.sort((a, b) => a.d - b.d);
const splLabelUsed = new Set();
for (const { lbl, sp, d } of splCandidates) {
    const labelKey = `${lbl.px},${lbl.py},${lbl.text}`;
    if (splLabelUsed.has(labelKey)) continue;
    const isRange = /^\d+-\d+$/.test(lbl.text);
    if (isRange) {
        const [lo, hi] = lbl.text.split('-').map(Number);
        // Skip if this splitter already has a bus pin with this range
        if (sp.busPins.some(bp => bp.lo === Math.min(lo,hi) && bp.hi === Math.max(lo,hi))) continue;
        sp.busPins.push({ lo: Math.min(lo, hi), hi: Math.max(lo, hi), px: lbl.px, py: lbl.py });
    } else {
        const bit = Number(lbl.text);
        // Skip if this splitter already has this bit
        if (sp.indivPins.some(ip => ip.bit === bit)) continue;
        sp.indivPins.push({ bit, px: lbl.px, py: lbl.py });
    }
    splLabelUsed.add(labelKey);
}

// For splitters where the individual pins use bit-range notation
// (e.g. InputSplit='7-7,6-6,...,0-0'), they render as "7", "6", etc.
// which are already captured as individual pins above. But if a
// splitter has no output splitting specified, it has an implicit bus.

// 4. Collect all bus-pin grid positions
const busPositions = new Set();
for (const sp of splitterEls) {
    for (const bp of sp.busPins) busPositions.add(P(bp.px, bp.py));
}
// Also: if a splitter has individual pins but no bus pins from labels,
// check if the element position itself is the bus endpoint
for (const sp of splitterEls) {
    if (sp.indivPins.length > 0 && sp.busPins.length === 0) {
        // The element pos is typically the bus pin for simple splitters
        // Find wires touching the element position
        busPositions.add(P(sp.x, sp.y));
        sp.busPins.push({ lo: 0, hi: sp.indivPins.length - 1, px: sp.x, py: sp.y });
    }
}

// 5. Two-pass approach:
//    (a) Build bus connectivity using ALL wires (to find which bus pins connect)
//    (b) In the main UF, skip only wires directly touching bus pins (narrow excision)
//
// Pass A: full wire UF for bus connectivity discovery
const tmpP = new Map();
const tmpFind = (k) => { let r = k; while (tmpP.get(r) !== r) r = tmpP.get(r); tmpP.set(k, r); return r; };
const tmpUni = (a, b) => { for (const k of [a, b]) if (!tmpP.has(k)) tmpP.set(k, k); tmpP.set(tmpFind(a), tmpFind(b)); };
for (const [x1, y1, x2, y2] of wires) tmpUni(P(x1, y1), P(x2, y2));
// T-junctions: endpoint of one wire on another wire's middle
for (const wa of wires) {
    for (const wb of wires) {
        if (wa === wb) continue;
        if (onSeg(wa[0], wa[1], wb)) tmpUni(P(wa[0], wa[1]), P(wb[0], wb[1]));
        if (onSeg(wa[2], wa[3], wb)) tmpUni(P(wa[2], wa[3]), P(wb[0], wb[1]));
    }
}
// Attach bus pins to wires via point-on-segment
for (const bp of busPositions) {
    const [bx, by] = bp.split(',').map(Number);
    for (const w of wires) {
        if (onSeg(bx, by, w)) { tmpUni(bp, P(w[0], w[1])); break; }
    }
}
const busFind2 = tmpFind;

// Pass B: main UF — skip wires directly touching bus pin positions
const normalWires = [];
for (const w of wires) {
    const [x1, y1, x2, y2] = w;
    let isBus = busPositions.has(P(x1, y1)) || busPositions.has(P(x2, y2));
    if (!isBus) {
        for (const bp of busPositions) {
            const [bx, by] = bp.split(',').map(Number);
            if (onSeg(bx, by, w)) { isBus = true; break; }
        }
    }
    if (!isBus) normalWires.push(w);
}
for (const [x1, y1, x2, y2] of normalWires) uni(P(x1, y1), P(x2, y2));

// Group splitters by bus connectivity
const splitterBusGroups = new Map(); // busRoot → [splitter, ...]
for (const sp of splitterEls) {
    if (sp.busPins.length === 0) continue;
    const bp = sp.busPins[0];
    if (!tmpP.has(P(bp.px, bp.py))) continue;
    const root = busFind2(P(bp.px, bp.py));
    if (!splitterBusGroups.has(root)) splitterBusGroups.set(root, []);
    splitterBusGroups.get(root).push(sp);
}

// 7. For each group of bus-connected splitters, union individual-bit
//    pins by bit index — this creates the per-bit data-path connections.
let splitterBridges = 0;
for (const group of splitterBusGroups.values()) {
    if (group.length < 2) continue;
    // Build bit → [pin positions] across all splitters in the group
    const bitPins = new Map(); // bit index → [P(x,y), ...]
    for (const sp of group) {
        for (const ip of sp.indivPins) {
            if (!bitPins.has(ip.bit)) bitPins.set(ip.bit, []);
            bitPins.get(ip.bit).push(P(ip.px, ip.py));
        }
    }
    // Union all pin positions sharing the same bit index
    for (const [, pins] of bitPins) {
        // Ensure each pin is in the union-find and attached to its wire
        for (const p of pins) {
            const [px, py] = p.split(',').map(Number);
            if (!parent.has(p)) parent.set(p, p);
            // Attach to any normal wire touching this point
            for (const w of normalWires) {
                if (onSeg(px, py, w)) { uni(p, P(w[0], w[1])); break; }
            }
        }
        for (let i = 1; i < pins.length; i++) {
            uni(pins[0], pins[i]);
            splitterBridges++;
        }
    }
}
if (splitterEls.length) console.log(`  splitters: ${splitterEls.length} elements, ${busPositions.size} bus pins excised, ${splitterBusGroups.size} bus groups, ${splitterBridges} bit bridges`);
// attach: join a point to the normal union-find via any non-bus wire it sits on
const attach = (x, y) => {
    for (const w of normalWires) if (onSeg(x, y, w)) { uni(P(x, y), P(w[0], w[1])); return true; }
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
    // ── Logic gate primitives ──────────────────────────────────────
    // Digital gate geometry (SIZE=20):
    //   2-input: in_a at (0,0), in_b at (0,40), out at (outW,20)
    //     outW = 60 for AND/NAND/XOR, 80 for OR/NOR (wider curved body)
    //   1-input (Not): in at (0,0), out at (40,0)
    // Rotation transforms offsets: rot 0→(dx,dy), 1→(dy,-dx), 2→(-dx,-dy), 3→(-dy,dx)
    const GATE_MAP = { XOr: 'gate_xor', And: 'gate_and', NOr: 'gate_nor', NAnd: 'gate_nand', Not: 'gate_not', Or: 'gate_or' };
    if (GATE_MAP[e.name]) {
        const kind = GATE_MAP[e.name];
        const id = e.label || `${kind}_${e.i}`;
        addPart(kind, id);
        // Extract rotation from element attributes
        const allEls = [...xml.matchAll(/<visualElement>([\s\S]*?)<\/visualElement>/g)];
        const elXml = allEls[e.i][1];
        const rot = Number(/rotation="(\d+)"/.exec(elXml)?.[1] || 0);
        const rotOff = (dx, dy) => {
            if (rot === 1) return [dy, -dx];
            if (rot === 2) return [-dx, -dy];
            if (rot === 3) return [-dy, dx];
            return [dx, dy];
        };
        if (e.name === 'Not') {
            const [odx, ody] = rotOff(40, 0);
            nodes.push({ partId: id, terminal: 'in', x: e.x, y: e.y });
            nodes.push({ partId: id, terminal: 'out', x: e.x + odx, y: e.y + ody });
        } else {
            const outW = (e.name === 'NOr' || e.name === 'Or') ? 80 : 60;
            const [bdx, bdy] = rotOff(0, 40);
            const [odx, ody] = rotOff(outW, 20);
            nodes.push({ partId: id, terminal: 'in_a', x: e.x, y: e.y });
            nodes.push({ partId: id, terminal: 'in_b', x: e.x + bdx, y: e.y + bdy });
            nodes.push({ partId: id, terminal: 'out', x: e.x + odx, y: e.y + ody });
        }
    }
    if (e.name === 'PolarityAwareLED') {
        const id = `pled_${e.label || e.i}`;
        addPart('led', id, { color: 'red' });
        nodes.push({ partId: id, terminal: 'anode', x: e.x, y: e.y });
    }
    // ── PullUp: single-terminal VCC tie ──
    if (e.name === 'PullUp') {
        const id = `pullup_${e.i}`;
        addPart('vcc', id, { volts: 5 });
        nodes.push({ partId: id, terminal: 'vcc', x: e.x, y: e.y });
    }
    // ── Inline ROM element ──
    // Digital ROM: addr "A" at (x,y), data "D" at (x+60,y+20), sel at (x,y+40)
    if (e.name === 'ROM') {
        const allEls = [...xml.matchAll(/<visualElement>([\s\S]*?)<\/visualElement>/g)];
        const elXml = allEls[e.i][1];
        const addrBits = Number(/AddrBits<\/string>\s*<int>(\d+)/.exec(elXml)?.[1] || 8);
        const dataBits = Number(/Bits<\/string>\s*<int>(\d+)/.exec(elXml)?.[1] || 8);
        const dataStr = /<data>([^<]+)</.exec(elXml)?.[1] || '';
        const id = e.label || `rom_${e.i}`;
        addPart('rom', id, { addrBits, dataBits, data: dataStr });
        nodes.push({ partId: id, terminal: 'addr', x: e.x, y: e.y });
        nodes.push({ partId: id, terminal: 'data', x: e.x + 60, y: e.y + 20 });
        nodes.push({ partId: id, terminal: 'sel', x: e.x, y: e.y + 40 });
    }
    // ── Counter (Digital built-in) ──
    // Pins: C at (x,y), en at (x,y+20), clr at (x,y+40), out at (x+60,y), ovf at (x+60,y+20)
    if (e.name === 'Counter') {
        const allEls = [...xml.matchAll(/<visualElement>([\s\S]*?)<\/visualElement>/g)];
        const elXml = allEls[e.i][1];
        const bits = Number(/Bits<\/string>\s*<int>(\d+)/.exec(elXml)?.[1] || 4);
        const id = e.label || `counter_${e.i}`;
        addPart('counter', id, { bits });
        nodes.push({ partId: id, terminal: 'clk', x: e.x, y: e.y });
        nodes.push({ partId: id, terminal: 'en', x: e.x, y: e.y + 20 });
        nodes.push({ partId: id, terminal: 'clr', x: e.x, y: e.y + 40 });
        nodes.push({ partId: id, terminal: 'out', x: e.x + 60, y: e.y });
        nodes.push({ partId: id, terminal: 'ovf', x: e.x + 60, y: e.y + 20 });
    }
    // ── RS flip-flop ──
    // Pins: S at (x,y), C at (x,y+20), R at (x,y+40), Q at (x+60,y), ~Q at (x+60,y+20)
    if (e.name === 'RS_FF') {
        const id = e.label || `rsff_${e.i}`;
        addPart('rs_ff', id);
        nodes.push({ partId: id, terminal: 's', x: e.x, y: e.y });
        nodes.push({ partId: id, terminal: 'clk', x: e.x, y: e.y + 20 });
        nodes.push({ partId: id, terminal: 'r', x: e.x, y: e.y + 40 });
        nodes.push({ partId: id, terminal: 'q', x: e.x + 60, y: e.y });
        nodes.push({ partId: id, terminal: 'qb', x: e.x + 60, y: e.y + 20 });
    }
    // ── Const element — fixed logic level ──
    if (e.name === 'Const') {
        const allEls = [...xml.matchAll(/<visualElement>([\s\S]*?)<\/visualElement>/g)];
        const elXml = allEls[e.i][1];
        const val = Number(/Value<\/string>\s*<long>(\d+)/.exec(elXml)?.[1] || 0);
        const id = val ? addPart('vcc', `const_${e.i}`, { volts: 5 }) : addPart('gnd', `const_${e.i}`);
        nodes.push({ partId: id, terminal: val ? 'vcc' : 'gnd', x: e.x, y: e.y });
    }
    // ── Button / DipSwitch — like In, single pin at element position ──
    if (e.name === 'Button' || e.name === 'DipSwitch') {
        const id = `${e.name.toLowerCase()}_${e.i}`;
        addPart('gnd', id);  // default off
        nodes.push({ partId: id, terminal: 'gnd', x: e.x, y: e.y });
    }
    // ── LED (Digital's native LED) — single pin at element position ──
    if (e.name === 'LED') {
        const id = `led_${e.i}`;
        addPart('led', id, { color: 'red', label: e.label });
        nodes.push({ partId: id, terminal: 'anode', x: e.x, y: e.y });
    }
    // ── Seven-Seg display — 8 pins (A-G + DP) ──
    if (e.name === 'Seven-Seg') {
        const id = e.label || `7seg_${e.i}`;
        addPart('seven_seg', id);
        for (let p = 0; p < 8; p++) {
            nodes.push({ partId: id, terminal: ['a','b','c','d','e','f','g','dp'][p], x: e.x, y: e.y + p * 20 });
        }
    }
    // ── Seven-Seg-Hex — 4-bit hex input ──
    if (e.name === 'Seven-Seg-Hex') {
        const id = e.label || `7seghex_${e.i}`;
        addPart('seven_seg_hex', id);
        nodes.push({ partId: id, terminal: 'data', x: e.x, y: e.y });
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

// ── Soundness checks ──
// 1. No pin may appear in two nets
const pinNets = new Map(); // `partId.terminal` → net root
let dupeCount = 0;
for (const node of nodes) {
    const key = `${node.partId}.${node.terminal}`;
    const pk = P(node.x, node.y);
    if (!parent.has(pk)) continue;
    const root = find(pk);
    if (pinNets.has(key) && pinNets.get(key) !== root) {
        console.error(`  SOUNDNESS: pin ${key} in two nets (${pinNets.get(key)} and ${root})`);
        dupeCount++;
    }
    pinNets.set(key, root);
}
// 2. No two pins of one part may share the same coordinate
const partCoords = new Map(); // partId → Map<coord, terminal>
for (const node of nodes) {
    if (!partCoords.has(node.partId)) partCoords.set(node.partId, new Map());
    const coords = partCoords.get(node.partId);
    const coord = P(node.x, node.y);
    if (coords.has(coord) && coords.get(coord) !== node.terminal) {
        console.error(`  SOUNDNESS: part ${node.partId} has pins ${coords.get(coord)} and ${node.terminal} at same coord ${coord}`);
        dupeCount++;
    }
    coords.set(coord, node.terminal);
}
if (dupeCount) { console.error(`  ${dupeCount} soundness violations — output may be incorrect`); process.exitCode = 1; }

const allWires = [...outWires, ...extraWires];
writeFileSync(output, JSON.stringify({ vcc: 5, parts, wires: allWires }, null, 2));
console.log(`${parts.length} parts, ${outWires.length} wires (${byNet.size} nets); pins attached ${attached}/${nodes.length}` +
    (floating.length ? `; floating: ${floating.slice(0, 8).join(' ')}` : ''));

// ── Environment note ──
// Requires: Java runtime + Digital.jar (hneemann/Digital, GPL, run-local).
// Set DIGITAL_JAR=/path/to/Digital.jar or place at ~/code/digital-sim/Digital/Digital.jar.
// Download from: https://github.com/hneemann/Digital/releases
