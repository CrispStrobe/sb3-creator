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
// FABRIC PATH (added 2026-08-15, pc01–pc12 audit). Breadboard examples
// cannot be solved by the union-find above at all: a seated part is
// connected through the board's strips, not through `wires`, so the
// flat path sees it floating — and `breadboard` is not even an engine
// kind, so the harness threw before it could mislead anyone. Any
// circuit containing a `breadboard` part is therefore routed through
// bw-circuit-ui's `Circuit.fromJSON`, which IS the app's real loader
// (hole occupancy → strip nets → mergeNets → setNetlist). Same output
// format either way; the header line says which path ran.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const BOARD = process.env.BW_BOARD_DIR || join(homedir(), 'code', 'bw-board');
const UI = process.env.BW_UI_DIR || join(homedir(), 'code', 'bw-circuit-ui');
const id = process.argv[2];
if (!id) { console.error('usage: audit-solve <example-id> [--at ms,...]'); process.exit(2); }
const atIdx = process.argv.indexOf('--at');
const times = atIdx !== -1 ? process.argv[atIdx + 1].split(',').map(Number) : [1];

// CONTROLS (added 2026-08-15, pc37–pc48 audit). Half the pure-circuit
// gallery is switch-, button-, pot- or LDR-driven: solved at their reset
// state they show nothing, and "shows nothing" is indistinguishable from
// "is broken". `--set id=v[,id=v]` calls board.setControl before the run
// (switch/button 1 = closed, pot/ldr 0…1), `--set@ms:id=v` schedules one
// for a later sample time, and `--power off|on` drives setPower — which
// is the only way to audit a discharge path. Values are printed in the
// header so the ledger can quote the conditions it measured under.
const setsAtStart = [];
const setsScheduled = []; // { ms, id, value }
let powerAt = null;       // { ms, on }
for (let i = 3; i < process.argv.length; i++) {
    const a = process.argv[i];
    const m = /^--set(?:@([\d.]+))?$/.exec(a);
    if (m) {
        for (const pair of process.argv[++i].split(',')) {
            const [pid, v] = pair.split('=');
            const entry = { id: pid, value: Number(v) };
            if (m[1] === undefined) setsAtStart.push(entry);
            else setsScheduled.push({ ms: Number(m[1]), ...entry });
        }
    } else if (a === '--power') {
        const v = process.argv[++i];
        const [msPart, onPart] = v.includes(':') ? v.split(':') : [null, v];
        powerAt = { ms: msPart === null ? 0 : Number(msPart), on: onPart !== 'off' && onPart !== '0' };
    }
}

const { BoardImpl } = await import(join(BOARD, 'src', 'board.js'));
const { registerAllDevices } = await import(join(BOARD, 'src', 'register-all.js'));
registerAllDevices();

const doc = JSON.parse(readFileSync(join(HERE, '..', 'examples', id, 'circuit.json'), 'utf8'));
const isFabric = (doc.parts || []).some((p) => p.kind === 'breadboard');

/** Apply --set / --power entries that are due at or before `ms`. */
function applyStimuli(board, ms) {
    for (const s of setsScheduled) {
        if (s.applied || s.ms > ms) continue;
        s.applied = true;
        board.setControl(s.id, s.value);
        console.log(`  [set ${s.id} = ${s.value}]`);
    }
    if (powerAt && !powerAt.applied && powerAt.ms <= ms) {
        powerAt.applied = true;
        board.setPower(powerAt.on);
        console.log(`  [power ${powerAt.on ? 'on' : 'off'}]`);
    }
}

/** Print one time-slice: node voltages, LED brightness, DRC warnings. */
function report(board, nets, ms) {
    console.log(`── t = ${ms} ms`);
    for (const n of nets) {
        const label = n.terminals.map((t) => `${t.part}.${t.terminal}`).join(',');
        console.log(`  ${(board.nodeVoltages.get(n.id) ?? 0).toFixed(4).padStart(9)} V  ${label}`);
    }
    for (const p of board.parts || []) {
        if (p.kind !== 'led' && p.kind !== 'rgb_led') continue;
        const b = board.ledBrightness ? board.ledBrightness(p.id) : null;
        const i = board.branchCurrent ? board.branchCurrent(p.id, 'anode') : null;
        console.log(`  LED ${p.id}: brightness ${b === null ? '?' : b.toFixed(4)}`
            + (i === null ? '' : `, I = ${(i * 1000).toFixed(3)} mA`));
    }
    const warnings = board.getWarnings ? board.getWarnings() : [];
    for (const w of warnings) console.log(`  DRC: ${w.message || w}`);
}

if (isFabric) {
    // The app's own loader. Engine injection + sidecar registration mirror
    // bw-circuit-ui/test/_setup.js — that file is a test helper, not an
    // export, so the two steps are done here rather than imported.
    const { setEngine } = await import(join(UI, 'src', 'engine.js'));
    const { inferNetlist, checkWiring } = await import(join(BOARD, 'src', 'infer-netlist.js'));
    const { getMaxCurrent, PORT_LIMITS } = await import(join(BOARD, 'src', 'current-ratings.js'));
    setEngine({ BoardImpl, inferNetlist, checkWiring, getMaxCurrent, PORT_LIMITS });
    const { registerSidecar } = await import(join(UI, 'src', 'model', 'parts-registry.js'));
    for (const dir of [join(UI, 'src', 'parts-data'), join(homedir(), 'code', 'bw-parts', 'parts')]) {
        if (!existsSync(dir)) continue;
        for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
            try {
                const sc = JSON.parse(readFileSync(join(dir, f), 'utf8'));
                if (sc.kind && sc.terminals) registerSidecar(sc);
            } catch { /* skip malformed */ }
        }
        break;
    }
    const { Circuit } = await import(join(UI, 'src', 'model', 'circuit.js'));
    const circuit = Circuit.fromJSON(doc);
    const board = circuit.board;
    console.log(`[fabric path: Circuit.fromJSON — ${circuit.parts.length} parts, ${board.nets.length} nets, vcc ${circuit.vcc}]`);
    for (const s of setsAtStart) { board.setControl(s.id, s.value); console.log(`[set ${s.id} = ${s.value}]`); }
    let prevNs = 0n;
    for (const ms of times) {
        applyStimuli(board, ms);
        const ns = BigInt(Math.round(ms * 1e6));
        circuit.advanceTo(ns > prevNs ? ns : prevNs + 1n);
        prevNs = ns > prevNs ? ns : prevNs + 1n;
        report(board, board.nets, ms);
    }
} else {
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

    // doc.vcc, not a hardcoded 5: `Circuit.fromJSON` passes it (circuit.js:844)
    // and models that default a rail off the board vcc (opamp railHigh, `vcc`
    // parts) read it. The 9 V examples were being solved on a 5 V board.
    const board = new BoardImpl(doc.vcc ?? 5.0);
    board.setNetlist(normalized, nets);
    console.log(`[flat path: wire union-find — ${normalized.length} parts, ${nets.length} nets, vcc ${doc.vcc ?? 5}]`);
    for (const s of setsAtStart) { board.setControl(s.id, s.value); console.log(`[set ${s.id} = ${s.value}]`); }
    let prevNs = 0n;
    for (const ms of times) {
        applyStimuli(board, ms);
        const ns = BigInt(Math.round(ms * 1e6));
        board.advanceTo(ns > prevNs ? ns : prevNs + 1n);
        prevNs = ns > prevNs ? ns : prevNs + 1n;
        report(board, nets, ms);
    }
}
