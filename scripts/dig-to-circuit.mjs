#!/usr/bin/env node
/**
 * .dig XML → circuit.json translator (with wire emission).
 *
 * Reads a Digital logic simulator .dig file (ngdrascal/8bitsim, MIT)
 * and produces our circuit.json format (parts + wires).
 *
 * Wire resolution: computed pin positions (anchor ox=0, oy=20, spacing=20)
 * matched against wire endpoints using point-on-segment. Two pins on the
 * same wire net get a circuit wire between them.
 *
 * Own transform code — the .dig files are MIT-licensed XML data.
 * Pin formulas are facts from Digital's source (GPL, read run-local).
 *
 * Usage: node scripts/dig-to-circuit.mjs <input.dig> [output.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Anchor parameters (resolved empirically across 9 modules) ──
const SPACING = 20;
const OX = 0, OY = 20;

// ── Pin counts per chip (DIP package) ──
const PIN_COUNTS = {
    '74173.dig': 16, '74245.dig': 20, '74283.dig': 16,
    '74161.dig': 16, '74157.dig': 16, '74374.dig': 20,
    '74189.dig': 16, '74138.dig': 16, '74139.dig': 16,
    '7476.dig': 16, '74154.dig': 24,
};
const DEFAULT_N = 16;
const DEFAULT_WIDTH = 6; // Digital's default Width attribute

// ── Kind mapping ──
const KIND_MAP = {
    '74173.dig': '74hc173', '74245.dig': '74hc245', '74283.dig': '74hc283',
    '74374.dig': '74hc374', '74138.dig': '74hc138', '74139.dig': '74hc139',
    '74157.dig': '74hc157', '74161.dig': '74hc161', '74189.dig': '74hc189',
    '7476.dig': '7476', '74154.dig': '74hc154',
    'And': 'gate_and', 'NAnd': 'gate_nand', 'NOr': 'gate_nor',
    'Not': 'gate_not', 'XOr': 'gate_xor',
    'LED': 'led', 'PolarityAwareLED': 'led',
    'Button': 'button', 'DipSwitch': 'dip_switch',
    'Clock': 'timer_555', 'Ground': 'gnd', 'VDD': 'vcc',
    'ROM': 'rom', 'Counter': 'decade_counter',
    'Seven-Seg': 'seven_segment', 'Seven-Seg-Hex': 'seven_segment',
    'RS_FF': 'dff', 'PullUp': 'resistor',
    'In': '_input', 'Out': '_output',
    'Tunnel': null, 'Splitter': null, 'Text': null,
};

// ── Pin label templates (standard 74xx) ──
// These are the pin NAMES in order 1..N for common DIL packages.
const PIN_LABELS = {
    '74hc245': ['dir','a0','a1','a2','a3','a4','a5','a6','a7','gnd',
                'b7','b6','b5','b4','b3','b2','b1','b0','oeb','vcc'],
    '74hc173': ['oeb','q0','q1','q2','q3','clk','clr','m','n',
                'd3','d2','d1','d0','ieb','gnd','vcc'].slice(0,16),
    '74hc161': ['clr','clk','a','b','c','d','enp','gnd',
                'load','ent','qd','qc','qb','qa','rco','vcc'],
    '74hc283': ['s1','a1','b1','a2','b2','s2','s3','gnd',
                'c4','a3','b3','s4','a4','b4','c0','vcc'],
};

// ── Parse .dig XML ──
function parseDig(xml) {
    const elements = [];
    const wires = [];

    const veMatch = xml.match(/<visualElements>([\s\S]*?)<\/visualElements>/);
    if (veMatch) {
        const elemRegex = /<visualElement>([\s\S]*?)<\/visualElement>/g;
        let m;
        while ((m = elemRegex.exec(veMatch[1])) !== null) {
            const block = m[1];
            const name = block.match(/<elementName>(.*?)<\/elementName>/)?.[1] || '';
            const posM = block.match(/<pos x="(-?\d+)" y="(-?\d+)"\/>/);
            const x = posM ? parseInt(posM[1]) : 0;
            const y = posM ? parseInt(posM[2]) : 0;
            const label = block.match(/<string>Label<\/string>\s*<string>(.*?)<\/string>/)?.[1] || '';
            elements.push({ name, x, y, label });
        }
    }

    const wMatch = xml.match(/<wires>([\s\S]*?)<\/wires>/);
    if (wMatch) {
        const wireRegex = /<wire>\s*<p1 x="(-?\d+)" y="(-?\d+)"\/>\s*<p2 x="(-?\d+)" y="(-?\d+)"\/>\s*<\/wire>/g;
        let m;
        while ((m = wireRegex.exec(wMatch[1])) !== null) {
            wires.push([parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), parseInt(m[4])]);
        }
    }

    return { elements, wires };
}

// ── Compute pin positions for a DIL element ──
function pinPositions(el) {
    const N = PIN_COUNTS[el.name] || DEFAULT_N;
    const width = DEFAULT_WIDTH;
    const pins = [];
    for (let n = 1; n <= N; n++) {
        const [px, py] = n <= N / 2
            ? [el.x + OX, el.y + OY + (n - 1) * SPACING]
            : [el.x + OX + width * 20, el.y + OY + (N - n) * SPACING];
        pins.push({ n, x: px, y: py });
    }
    return pins;
}

// ── Point-on-segment test ──
function pointOnWire(x, y, wires) {
    return wires.some(([x1, y1, x2, y2]) =>
        (x1 === x2 && x1 === x && Math.min(y1, y2) <= y && y <= Math.max(y1, y2)) ||
        (y1 === y2 && y1 === y && Math.min(x1, x2) <= x && x <= Math.max(x1, x2)));
}

// ── Build wire nets (union-find by point) ──
function buildNets(digWires) {
    const pointToNet = new Map();
    let netId = 0;
    const parent = [];
    const find = (i) => { while (parent[i] !== i) i = parent[i] = parent[parent[i]]; return i; };
    const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };

    for (const [x1, y1, x2, y2] of digWires) {
        const k1 = `${x1},${y1}`, k2 = `${x2},${y2}`;
        if (!pointToNet.has(k1)) { pointToNet.set(k1, netId); parent.push(netId); netId++; }
        if (!pointToNet.has(k2)) { pointToNet.set(k2, netId); parent.push(netId); netId++; }
        union(pointToNet.get(k1), pointToNet.get(k2));
    }

    // Also merge points that share coordinates (T-junctions via point-on-segment)
    const allPoints = [...pointToNet.entries()];
    for (const [key, id] of allPoints) {
        const [x, y] = key.split(',').map(Number);
        for (const [x1, y1, x2, y2] of digWires) {
            if ((x1 === x2 && x1 === x && Math.min(y1, y2) <= y && y <= Math.max(y1, y2)) ||
                (y1 === y2 && y1 === y && Math.min(x1, x2) <= x && x <= Math.max(x1, x2))) {
                const k1 = `${x1},${y1}`, k2 = `${x2},${y2}`;
                if (pointToNet.has(k1)) union(id, pointToNet.get(k1));
                if (pointToNet.has(k2)) union(id, pointToNet.get(k2));
            }
        }
    }

    return { pointToNet, find };
}

// ── Main ──
const input = process.argv[2];
if (!input) { console.error('Usage: node dig-to-circuit.mjs <input.dig> [output.json]'); process.exit(1); }

const xml = readFileSync(resolve(input), 'utf8');
const { elements, wires: digWires } = parseDig(xml);
const { pointToNet, find } = buildNets(digWires);

// Map elements to parts + compute pin nets
const parts = [];
const pinToNet = []; // [{partId, terminal, netRoot}]
let idSeq = 0;

for (const el of elements) {
    const kind = KIND_MAP[el.name];
    if (kind === null) continue; // structural, skip
    if (kind === undefined) continue; // unknown

    const id = el.label
        ? el.label.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
        : `${(kind || el.name).replace(/[^a-z0-9]/g, '')}_${idSeq++}`;

    if (kind === '_input' || kind === '_output') {
        // IO ports: single pin at element position
        const netKey = `${el.x},${el.y}`;
        if (pointToNet.has(netKey)) {
            pinToNet.push({ partId: id, terminal: kind === '_input' ? 'out' : 'in', netRoot: find(pointToNet.get(netKey)), ioLabel: el.label });
        }
        // Don't add as a physical part (module boundary)
        continue;
    }

    parts.push({ id, kind, x: el.x, y: el.y, declName: el.label || undefined });

    // For DIL chips: compute pin positions and find their nets
    if (el.name.endsWith('.dig')) {
        const pins = pinPositions(el);
        const labels = PIN_LABELS[kind] || pins.map(p => `pin${p.n}`);
        for (const pin of pins) {
            const netKey = `${pin.x},${pin.y}`;
            // Check point directly or point-on-wire
            let netRoot = null;
            if (pointToNet.has(netKey)) {
                netRoot = find(pointToNet.get(netKey));
            } else if (pointOnWire(pin.x, pin.y, digWires)) {
                // Find which wire it's on
                for (const [x1, y1, x2, y2] of digWires) {
                    if ((x1 === x2 && x1 === pin.x && Math.min(y1, y2) <= pin.y && pin.y <= Math.max(y1, y2)) ||
                        (y1 === y2 && y1 === pin.y && Math.min(x1, x2) <= pin.x && pin.x <= Math.max(x1, x2))) {
                        const k = `${x1},${y1}`;
                        if (pointToNet.has(k)) { netRoot = find(pointToNet.get(k)); break; }
                    }
                }
            }
            if (netRoot !== null) {
                const terminal = labels[pin.n - 1] || `pin${pin.n}`;
                pinToNet.push({ partId: id, terminal, netRoot });
            }
        }
    } else {
        // Non-DIL: single-pin at element position (gates, LEDs, etc.)
        const netKey = `${el.x},${el.y}`;
        if (pointToNet.has(netKey)) {
            pinToNet.push({ partId: id, terminal: 'a', netRoot: find(pointToNet.get(netKey)) });
        }
    }
}

// ── Emit wires: for each net, connect all pins pairwise (star topology from first) ──
const circuitWires = [];
const netGroups = new Map();
for (const p of pinToNet) {
    if (!netGroups.has(p.netRoot)) netGroups.set(p.netRoot, []);
    netGroups.get(p.netRoot).push(p);
}
for (const [, group] of netGroups) {
    if (group.length < 2) continue;
    const hub = group[0];
    for (let i = 1; i < group.length; i++) {
        circuitWires.push({
            from: hub.partId, fromTerminal: hub.terminal,
            to: group[i].partId, toTerminal: group[i].terminal
        });
    }
}

const circuit = { vcc: 5, parts, wires: circuitWires };
const output = process.argv[3] || input.replace('.dig', '.circuit.json');
writeFileSync(output, JSON.stringify(circuit, null, 2) + '\n');
console.log(`translated ${input}:`);
console.log(`  ${elements.length} elements → ${parts.length} parts, ${circuitWires.length} wires`);
