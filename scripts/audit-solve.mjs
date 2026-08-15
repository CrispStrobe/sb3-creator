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
const parts = doc.parts.map((p) => KIND_ALIASES[p.kind] ? { ...p, kind: KIND_ALIASES[p.kind] } : p);

const parent = new Map();
const key = (p, t) => `${p} ${t}`;
const find = (k) => { while (parent.get(k) !== k) { parent.set(k, parent.get(parent.get(k))); k = parent.get(k); } return k; };
const add = (k) => { if (!parent.has(k)) parent.set(k, k); };
for (const w of doc.wires || []) {
    const a = key(w.from, w.fromTerminal), b = key(w.to, w.toTerminal);
    add(a); add(b); parent.set(find(a), find(b));
}
const groups = new Map();
for (const k of parent.keys()) {
    const r = find(k);
    if (!groups.has(r)) groups.set(r, []);
    const [part, terminal] = k.split(' ');
    groups.get(r).push({ part, terminal });
}
const nets = [...groups.values()].map((terminals, i) => ({ id: `n${i}`, terminals }));

const fromNets = new Map();
for (const n of nets) for (const ref of n.terminals) {
    if (!fromNets.has(ref.part)) fromNets.set(ref.part, new Set());
    fromNets.get(ref.part).add(ref.terminal);
}
const normalized = parts.map((p) => p.terminals ? p : ({
    ...p, params: p.params || {},
    terminals: BoardImpl.getTerminalsForKind(p.kind) || [...(fromNets.get(p.id) || [])],
}));

const board = new BoardImpl(5.0);
board.setNetlist(normalized, nets);
let prevNs = 0n;
for (const ms of times) {
    const ns = BigInt(Math.round(ms * 1e6));
    board.advanceTo(ns > prevNs ? ns : prevNs + 1n);
    prevNs = ns;
    console.log(`── t = ${ms} ms`);
    // Name nets by their most descriptive terminal for readability.
    for (const n of nets) {
        const label = n.terminals.map((t) => `${t.part}.${t.terminal}`).join(',');
        console.log(`  ${(board.nodeVoltages.get(n.id) ?? 0).toFixed(4).padStart(9)} V  ${label}`);
    }
    const warnings = board.getWarnings ? board.getWarnings() : [];
    for (const w of warnings) console.log(`  DRC: ${w.message || w}`);
}
