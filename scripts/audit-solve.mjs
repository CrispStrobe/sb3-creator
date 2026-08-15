#!/usr/bin/env node
// audit-solve <example-id> [--at ms[,ms...]] — the shared solving
// harness the audit doctrine requires: loads examples/<id>/circuit.json,
// converts wires→nets (the app's union-find), normalizes terminals from
// the engine kind table, solves on the sibling bw-board engine, prints
// node voltages at each requested time (default 1ms). One tool for
// every auditor instead of a hand-copied ritual per audit — the copy
// WAS the fidelity risk (pilot friction note #2).
//
// Observation conditions (friction note #1): --at accepts multiple
// sample times; transient phenomena need sub-millisecond samples
// (e.g. --at 0.001,0.01,1 for a flyback spike).
//
// Breadboard fabric: parts seated on a breadboard have terminals mapped
// to holes via seat.leadMap. Holes in the same row strip (a-e or f-j,
// same row number) are implicitly connected. Wires to breadboard holes
// are resolved into the same connectivity. The engine never sees the
// breadboard — it is a connection fabric only.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const BOARD = process.env.BW_BOARD_DIR || join(homedir(), 'code', 'bw-board');
const id = process.argv[2];
if (!id) { console.error('usage: audit-solve <example-id> [--at ms,...]'); process.exit(2); }
const atIdx = process.argv.indexOf('--at');
const times = atIdx !== -1 ? process.argv[atIdx + 1].split(',').map(Number) : [1];

const { BoardImpl } = await import(join(BOARD, 'src', 'board.js'));
const { registerAllDevices } = await import(join(BOARD, 'src', 'register-all.js'));
registerAllDevices();

const doc = JSON.parse(readFileSync(join(HERE, '..', 'examples', id, 'circuit.json'), 'utf8'));
const KIND_ALIASES = { '74hc595': 'shift_register', pot: 'potentiometer' };
const LAYOUT_ONLY = new Set(['breadboard', 'label', 'wire_junction']);

// --- Breadboard fabric resolution ---
// A standard breadboard has rows 1..N. Columns a-e are one strip, f-j
// are another. Holes in the same strip are implicitly connected.
// Power rails (+/-) run the full length and are their own strips.
function bbStripKey(boardId, hole) {
    const m = hole.match(/^([a-jA-J])(\d+)$/);
    if (!m) {
        // power rail: +1, -1, +2, -2 etc — each rail is its own strip
        return `${boardId}:rail:${hole}`;
    }
    const col = m[1].toLowerCase();
    const row = m[2];
    const side = ('abcde'.indexOf(col) >= 0) ? 'L' : 'R';
    return `${boardId}:${side}:${row}`;
}

// Collect all breadboard parts and build seat-based implicit connections
const breadboards = new Map();
for (const p of doc.parts) {
    if (p.kind === 'breadboard') breadboards.set(p.id, p);
}

// Build virtual wires from seats: each seated terminal becomes a
// connection between (partId, terminal) and the breadboard strip.
// We represent strips as virtual nodes in the union-find.
const seatEdges = []; // [{a: {part, terminal}, b: {part, terminal}}]
const stripNodes = new Map(); // stripKey → canonical virtual node id

function getStripNode(stripKey) {
    if (!stripNodes.has(stripKey)) {
        stripNodes.set(stripKey, `__strip__${stripNodes.size}`);
    }
    return stripNodes.get(stripKey);
}

for (const p of doc.parts) {
    if (!p.seat) continue;
    const leadMap = p.seat.leadMap;
    for (const [terminal, hole] of Object.entries(leadMap)) {
        const sk = bbStripKey(p.seat.boardId, hole);
        seatEdges.push({
            from: p.id, fromTerminal: terminal,
            to: getStripNode(sk), toTerminal: '__strip__',
        });
    }
}

// Also resolve wires that go TO a breadboard hole
const wireEdgesExtra = [];
for (const w of doc.wires || []) {
    if (breadboards.has(w.to)) {
        const sk = bbStripKey(w.to, w.toTerminal);
        wireEdgesExtra.push({
            from: w.from, fromTerminal: w.fromTerminal,
            to: getStripNode(sk), toTerminal: '__strip__',
        });
    } else if (breadboards.has(w.from)) {
        const sk = bbStripKey(w.from, w.fromTerminal);
        wireEdgesExtra.push({
            from: w.to, fromTerminal: w.toTerminal,
            to: getStripNode(sk), toTerminal: '__strip__',
        });
    }
}

// holeWires: breadboard-internal jumper wires connecting two holes
for (const hw of doc.holeWires || []) {
    const bid = hw.boardId;
    if (!bid) continue;
    const skA = bbStripKey(bid, hw.a);
    const skB = bbStripKey(bid, hw.b);
    wireEdgesExtra.push({
        from: getStripNode(skA), fromTerminal: '__strip__',
        to: getStripNode(skB), toTerminal: '__strip__',
    });
}

const layoutIds = new Set(doc.parts.filter((p) => LAYOUT_ONLY.has(p.kind)).map((p) => p.id));
const parts = doc.parts.filter((p) => !LAYOUT_ONLY.has(p.kind)).map((p) => KIND_ALIASES[p.kind] ? { ...p, kind: KIND_ALIASES[p.kind] } : p);

// --- Union-find over all connections ---
const parent = new Map();
const key = (p, t) => `${p} ${t}`;
const find = (k) => { while (parent.get(k) !== k) { parent.set(k, parent.get(parent.get(k))); k = parent.get(k); } return k; };
const add = (k) => { if (!parent.has(k)) parent.set(k, k); };
const union = (a, b) => { add(a); add(b); parent.set(find(a), find(b)); };

// Regular wires (skip breadboard-to-breadboard)
for (const w of doc.wires || []) {
    if (breadboards.has(w.from) || breadboards.has(w.to)) continue;
    union(key(w.from, w.fromTerminal), key(w.to, w.toTerminal));
}

// Breadboard-resolved wires
for (const e of wireEdgesExtra) {
    union(key(e.from, e.fromTerminal), key(e.to, e.toTerminal));
}

// Seat connections
for (const e of seatEdges) {
    union(key(e.from, e.fromTerminal), key(e.to, e.toTerminal));
}

// --- Build nets (filter out virtual strip nodes and layout parts) ---
const groups = new Map();
for (const k of parent.keys()) {
    const r = find(k);
    if (!groups.has(r)) groups.set(r, []);
    const [part, terminal] = k.split(' ');
    if (!layoutIds.has(part) && !part.startsWith('__strip__')) {
        groups.get(r).push({ part, terminal });
    }
}
const nets = [...groups.values()].filter((t) => t.length > 0).map((terminals, i) => ({ id: `n${i}`, terminals }));

const fromNets = new Map();
for (const n of nets) for (const ref of n.terminals) {
    if (!fromNets.has(ref.part)) fromNets.set(ref.part, new Set());
    fromNets.get(ref.part).add(ref.terminal);
}
const normalized = parts.map((p) => {
    const existing = p.terminals;
    const fromKind = BoardImpl.getTerminalsForKind(p.kind);
    const fromNet = [...(fromNets.get(p.id) || [])];
    return {
        ...p,
        params: p.params || {},
        terminals: (existing && existing.length > 0) ? existing : (fromKind || fromNet),
    };
});

// Use vcc from doc if specified
const vcc = doc.vcc ?? 5.0;
const board = new BoardImpl(vcc);
board.setNetlist(normalized, nets);
let prevNs = 0n;
for (const ms of times) {
    const ns = BigInt(Math.round(ms * 1e6));
    board.advanceTo(ns > prevNs ? ns : prevNs + 1n);
    prevNs = ns;
    console.log(`── t = ${ms} ms`);
    for (const n of nets) {
        const label = n.terminals.map((t) => `${t.part}.${t.terminal}`).join(',');
        console.log(`  ${(board.nodeVoltages.get(n.id) ?? 0).toFixed(4).padStart(9)} V  ${label}`);
    }
    const warnings = board.getWarnings ? board.getWarnings() : [];
    for (const w of warnings) console.log(`  DRC: ${w.message || w}`);
}

// Print LED states
const ledParts = parts.filter((p) => ['led', 'rgb_led'].includes(p.kind));
if (ledParts.length > 0) {
    console.log('── LEDs');
    for (const lp of ledParts) {
        const state = board.getPartState ? board.getPartState(lp.id) : null;
        if (state) {
            console.log(`  ${lp.id}: brightness=${state.brightness?.toFixed(4) ?? '?'}, current=${state.current?.toFixed(4) ?? '?'} A`);
        } else {
            console.log(`  ${lp.id}: no state`);
        }
    }
}
