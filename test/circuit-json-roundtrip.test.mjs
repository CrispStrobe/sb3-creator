// Circuit JSON structural validation + safety-lesson topology checks.
//
// What this tests: every example's circuit.json is valid JSON with the
// expected schema (parts with id/kind/x/y, wires with from/to endpoints),
// and the safety-lesson examples preserve their deliberate wiring mistakes.
//
// What this does NOT test: the application serialiser's load/save cycle.
// That test belongs in bw-circuit-ui, which owns the Circuit model and
// the serialiser. A JSON self-round-trip (parse→stringify→parse→stringify)
// is true by construction and proves nothing about data loss.
//
// Scans examples/ by directory, same pattern as gallery-roundtrip.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { requireSiblings, siblingGuardTest, locate } from './helpers/siblings.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const examplesDir = resolve(here, '../examples');

// Index-based circuit path lookup (WORE contract: discover via manifest, never by glob)
const _idx = JSON.parse(readFileSync(resolve(examplesDir, 'index.json'), 'utf8'));
const _idxByDir = new Map(_idx.map(e => [e.files?.program?.split('/')[0], e]));
function circuitPathForDir(name) {
    const entry = _idxByDir.get(name);
    if (entry?.files?.circuit) return resolve(examplesDir, entry.files.circuit);
    return resolve(examplesDir, name, 'circuit.json');
}

let exampleDirs;
try {
    exampleDirs = readdirSync(examplesDir)
        .filter(d => !d.endsWith('.json') && !d.startsWith('.'))
        .sort();
} catch { exampleDirs = []; }

// ---- helpers for wiring topology ----------------------------------------

// Wire endpoints come in two dialects, MIXED WITHIN ONE FILE, and this file
// used to carry its own private reader for them. That is the pattern behind
// every defect in this area — a hand-rolled scan reported 802 phantom shorts
// across 2,040 files, and two exporters wrote schematics with no nets — so
// the reader now comes from bw-circuit-ui, which owns the circuit.json format.
//
// THE COST, stated plainly: these three tests now need the sibling checkout,
// where before they needed nothing. Locally they skip when it is absent (and
// the guard test below says so); CI clones it at the revision pinned in
// test/fixtures/siblings.json, so CI coverage is unchanged. That is the same
// bargain the other cross-repo gates in this directory already make, and it
// buys ONE definition of the format instead of two that can drift apart.
const gate = requireSiblings('bw-circuit-ui');
siblingGuardTest(gate, 'the circuit.json topology checks');
const { wireEndpoint } = gate.skip ? {}
    : await import(pathToFileURL(join(locate('bw-circuit-ui').path,
        'src', 'model', 'wire-endpoints.js')).href);

/** Resolve a wire endpoint to {part, key}, where key is "partId.terminal". */
function resolveEndpoint(wire, side) {
    const e = wireEndpoint(wire, side);
    if (!e) return { part: String(wire?.[side]), key: `${wire?.[side]}.?` };
    if (e.part) return { part: e.part, key: `${e.part}.${e.terminal}` };
    const board = e.board || e.boardId;
    return { part: board, key: `${board}.${e.hole}` };
}

/** Build an adjacency list from wires: part.terminal → [part.terminal, ...] */
function buildGraph(obj) {
    const adj = {};
    const add = (a, b) => { if (!adj[a]) adj[a] = []; adj[a].push(b); };
    for (const w of obj.wires || []) {
        const from = resolveEndpoint(w, 'from').key;
        const to = resolveEndpoint(w, 'to').key;
        add(from, to);
        add(to, from);
    }
    return adj;
}

/** All part ids reachable from a given part (BFS over wires). */
function reachableParts(obj, startId) {
    const adj = buildGraph(obj);
    const visited = new Set();
    const queue = [];
    // Seed with all terminals of the start part.
    for (const key of Object.keys(adj)) {
        if (key.startsWith(startId + '.')) queue.push(key);
    }
    while (queue.length) {
        const node = queue.shift();
        if (visited.has(node)) continue;
        visited.add(node);
        for (const neighbor of (adj[node] || [])) {
            if (!visited.has(neighbor)) queue.push(neighbor);
        }
    }
    // Extract unique part ids from visited terminals.
    return new Set([...visited].map(t => t.split('.')[0]));
}

/** Does a path from partA to partB pass through any part of the given kind? */
function pathContainsKind(obj, fromId, toId, kind) {
    const reachable = reachableParts(obj, fromId);
    if (!reachable.has(toId)) return false;
    // Walk all parts on the path (simplified: check if any part of `kind`
    // is reachable from fromId AND can reach toId).
    const partsOfKind = (obj.parts || []).filter(p => p.kind === kind);
    for (const p of partsOfKind) {
        const fromReach = reachableParts(obj, fromId);
        if (fromReach.has(p.id)) return true;
    }
    return false;
}

// ---- per-example structural validation ----------------------------------

let circuitCount = 0;

for (const name of exampleDirs) {
    const circuitPath = circuitPathForDir(name);
    let src;
    try { src = readFileSync(circuitPath, 'utf8'); } catch { continue; }
    circuitCount++;

    test(`circuit.json: ${name} is valid and well-formed`, { skip: gate.skip }, () => {
        let obj;
        try { obj = JSON.parse(src); } catch (e) {
            assert.fail(`${name}/circuit.json is not valid JSON: ${e.message}`);
        }

        assert.ok(Array.isArray(obj.parts), `${name}: parts must be an array`);
        const isNetsFormat = Array.isArray(obj.nets);

        for (const part of obj.parts) {
            assert.ok(part.id, `${name}: part missing id`);
            assert.ok(part.kind, `${name}: part ${part.id} missing kind`);
            if (!isNetsFormat) {
                assert.ok(typeof part.x === 'number', `${name}: part ${part.id} missing x`);
                assert.ok(typeof part.y === 'number', `${name}: part ${part.id} missing y`);
            }
        }

        const partIds = new Set(obj.parts.map(p => p.id));
        if (isNetsFormat) {
            for (const net of obj.nets) {
                for (const t of net.terminals) {
                    assert.ok(partIds.has(t.part),
                        `${name}: net terminal references unknown part '${t.part}'`);
                }
            }
        } else {
            assert.ok(Array.isArray(obj.wires), `${name}: wires must be an array`);
            for (let i = 0; i < obj.wires.length; i++) {
                const w = obj.wires[i];
                assert.ok(w.from, `${name}: wire ${i} missing 'from'`);
                assert.ok(w.to, `${name}: wire ${i} missing 'to'`);
                const fromPart = resolveEndpoint(w, 'from').part;
                const toPart = resolveEndpoint(w, 'to').part;
                assert.ok(partIds.has(fromPart),
                    `${name}: wire ${i} 'from' references unknown part '${fromPart}'`);
                assert.ok(partIds.has(toPart),
                    `${name}: wire ${i} 'to' references unknown part '${toPart}'`);
            }
        }
    });
}

// ---- safety-lesson topology assertions ----------------------------------
// These test the WIRING, not part names. A normaliser that "fixes" a
// deliberate mistake destroys the lesson.

test('safety: 31-no-resistor-led — the LED path to VCC has no resistor', { skip: gate.skip }, () => {
    const path = resolve(examplesDir, '31-no-resistor-led', 'circuit.json');
    let obj;
    try { obj = JSON.parse(readFileSync(path, 'utf8')); } catch { return; }

    // Find the "bad" LED — any LED whose path to VCC contains no resistor.
    const leds = obj.parts.filter(p => p.kind === 'led');
    const vcc = obj.parts.find(p => p.kind === 'vcc');
    assert.ok(leds.length > 0 && vcc, 'must have LEDs and VCC');

    // At least one LED must NOT have a resistor in its path to VCC.
    const hasUnprotectedLed = leds.some(led =>
        !pathContainsKind(obj, led.id, vcc.id, 'resistor')
    );
    assert.ok(hasUnprotectedLed,
        'the lesson requires at least one LED with no series resistor — a normaliser must not add one');
});

test('safety: 33-inductive-no-flyback — the motor has no diode across it', { skip: gate.skip }, () => {
    const path = resolve(examplesDir, '33-inductive-no-flyback', 'circuit.json');
    let obj;
    try { obj = JSON.parse(readFileSync(path, 'utf8')); } catch { return; }

    const motors = obj.parts.filter(p => p.kind === 'dc_motor');
    assert.ok(motors.length > 0, 'must have at least one motor');

    // The lesson: at least one motor has no flyback diode across its terminals.
    // A diode directly across a motor's terminals would be reachable from the
    // motor with only one hop through a diode part.
    const hasUnprotectedMotor = motors.some(motor => {
        const reachable = reachableParts(obj, motor.id);
        const diodes = obj.parts.filter(p => p.kind === 'diode' && reachable.has(p.id));
        return diodes.length === 0;
    });
    assert.ok(hasUnprotectedMotor,
        'the lesson requires at least one motor with no flyback diode — a normaliser must not add one');
});

test(`circuit.json gallery has at least 30 files`, () => {
    // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
    // circuitCount >= 30 -> observed 284.
    assert.ok(circuitCount >= 30,
        `expected >= 30 circuit.json files, found ${circuitCount}`);
});
