#!/usr/bin/env node
/**
 * .dig XML → circuit.json translator.
 *
 * Reads a Digital logic simulator .dig file (ngdrascal/8bitsim, MIT)
 * and produces our circuit.json format (parts + wires).
 *
 * Own transform code — the .dig files are MIT-licensed XML data.
 *
 * Usage: node scripts/dig-to-circuit.mjs <input.dig> [output.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Kind mapping: Digital element names → our engine part kinds ──
const KIND_MAP = {
    // TTL chips (Digital uses plain numbers, we use 74hc prefix)
    '74173.dig': '74hc173',   // quad D register
    '74245.dig': '74hc245',   // octal bus transceiver
    '74283.dig': '74hc283',   // 4-bit adder
    '74374.dig': '74hc374',   // octal D flip-flop
    '74138.dig': '74hc138',   // 3-to-8 decoder
    '74139.dig': '74hc139',   // dual 2-to-4 decoder
    '74157.dig': '74hc157',   // quad 2:1 mux
    '74161.dig': '74hc161',   // 4-bit counter
    '74189.dig': '74hc189',   // 64-bit RAM
    '7476.dig': '7476',       // dual JK flip-flop
    '74154.dig': '74hc154',   // 4-to-16 decoder

    // Basic gates → 74HC quad gate packages
    'And': 'gate_and',
    'NAnd': 'gate_nand',
    'NOr': 'gate_nor',
    'Not': 'gate_not',
    'XOr': 'gate_xor',

    // Passive/IO
    'LED': 'led',
    'PolarityAwareLED': 'led',
    'Button': 'button',
    'DipSwitch': 'dip_switch',
    'Clock': '555',           // their digital clock → our 555 (we simulate the real one)
    'Ground': 'gnd',
    'VDD': 'vcc',
    'ROM': 'rom',
    'Counter': 'decade_counter',
    'Seven-Seg': 'seven_segment',
    'Seven-Seg-Hex': 'seven_segment',
    'RS_FF': 'dff',
    'PullUp': 'resistor',

    // Structural (not physical parts — skip or annotate)
    'In': null,               // module input port
    'Out': null,              // module output port
    'Tunnel': null,           // named net (internal wire label)
    'Splitter': null,         // bus splitter (not a physical part)
    'Text': null,             // annotation
};

// ── Simple XML parser (no dependency) ──
function parseXML(xml) {
    const elements = [];
    const wires = [];

    // Extract visualElements
    const veMatch = xml.match(/<visualElements>([\s\S]*?)<\/visualElements>/);
    if (veMatch) {
        const veXml = veMatch[1];
        const elemRegex = /<visualElement>([\s\S]*?)<\/visualElement>/g;
        let m;
        while ((m = elemRegex.exec(veXml)) !== null) {
            const block = m[1];
            const name = block.match(/<elementName>(.*?)<\/elementName>/)?.[1] || '';
            const posM = block.match(/<pos x="(-?\d+)" y="(-?\d+)"\/>/);
            const x = posM ? parseInt(posM[1]) : 0;
            const y = posM ? parseInt(posM[2]) : 0;
            const label = block.match(/<string>Label<\/string>\s*<string>(.*?)<\/string>/)?.[1] || '';
            elements.push({ name, x, y, label });
        }
    }

    // Extract wires
    const wMatch = xml.match(/<wires>([\s\S]*?)<\/wires>/);
    if (wMatch) {
        const wXml = wMatch[1];
        const wireRegex = /<wire>\s*<p1 x="(-?\d+)" y="(-?\d+)"\/>\s*<p2 x="(-?\d+)" y="(-?\d+)"\/>\s*<\/wire>/g;
        let m;
        while ((m = wireRegex.exec(wXml)) !== null) {
            wires.push({
                x1: parseInt(m[1]), y1: parseInt(m[2]),
                x2: parseInt(m[3]), y2: parseInt(m[4])
            });
        }
    }

    return { elements, wires };
}

// ── Main ──
const input = process.argv[2];
if (!input) { console.error('Usage: node dig-to-circuit.mjs <input.dig> [output.json]'); process.exit(1); }

const xml = readFileSync(resolve(input), 'utf8');
const { elements, wires } = parseXML(xml);

// Map elements to parts
const parts = [];
const skipped = [];
let idSeq = 0;
for (const el of elements) {
    const kind = KIND_MAP[el.name];
    if (kind === null) { skipped.push(el.name + (el.label ? ` (${el.label})` : '')); continue; }
    if (kind === undefined) { skipped.push(`UNKNOWN: ${el.name}`); continue; }
    const id = el.label ? el.label.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() : `${kind}_${idSeq++}`;
    parts.push({ id, kind, x: el.x, y: el.y, declName: el.label || undefined });
}

const circuit = { vcc: 5, parts, wires: [] };
// Note: wire resolution (position-based pin matching) requires pin geometry
// from the sidecar data — for now output parts only, wires need manual polish.

const output = process.argv[3] || input.replace('.dig', '.circuit.json');
writeFileSync(output, JSON.stringify(circuit, null, 2) + '\n');
console.log(`translated ${input}:`);
console.log(`  ${elements.length} elements → ${parts.length} parts`);
console.log(`  ${wires.length} point-to-point wires (need pin resolution)`);
if (skipped.length) console.log(`  skipped: ${[...new Set(skipped)].join(', ')}`);
