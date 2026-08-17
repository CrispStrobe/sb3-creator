/**
 * Absolute-physics assertions: machine-checkable values in EXPECTED.md.
 *
 * An EXPECTED.md can carry a fenced block:
 *
 *     ```assert
 *     net <label> V <expected> +-<tolerance>
 *     pin <name> duty <expected> +-<tolerance>
 *     current <partId> mA <expected> +-<tolerance>
 *     ```
 *
 * This test parses every such block and checks the assertion against a
 * headless engine solve. Unknown assertion kinds are explicitly skipped
 * with a note — never a silent pass.
 *
 * Run: BW_BOARD=/path/to/bw-board node --test test/assert-physics.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

// ---- engine setup (same pattern as gallery-e2e) ----
const findRepo = (envVar, probe, ...rels) => {
    for (const base of [process.env[envVar], ...rels]) {
        if (!base) continue;
        const url = base.startsWith('file:') ? new URL(base)
            : pathToFileURL(base.endsWith('/') ? base : base + '/');
        if (existsSync(new URL(probe, url))) return url;
    }
    return null;
};
const sib = (name) => new URL(`../../${name}/`, import.meta.url).href;
const nest = (name) => new URL(`../../../${name}/`, import.meta.url).href;
const BOARD_URL = findRepo('BW_BOARD', 'src/board.js', sib('bw-board'), nest('bw-board'));
const CUI_URL = findRepo('BW_CIRCUIT_UI', 'src/engine.js', sib('bw-circuit-ui'), nest('bw-circuit-ui'));

const ENGINE_SKIP = BOARD_URL && CUI_URL ? false
    : `needs bw-board + bw-circuit-ui (set BW_BOARD / BW_CIRCUIT_UI)`;

let BoardImpl, Circuit, setEngine;
if (!ENGINE_SKIP) {
    ({ BoardImpl } = await import(new URL('src/board.js', BOARD_URL).href));
    const { inferNetlist, checkWiring } = await import(new URL('src/infer-netlist.js', BOARD_URL).href);
    ({ Circuit } = await import(new URL('src/model/circuit.js', CUI_URL).href));
    ({ setEngine } = await import(new URL('src/engine.js', CUI_URL).href));
    // Register device models
    for (const [file, fn] of [['relay.js', 'registerRelay'], ['dc-motor.js', 'registerDCMotor'],
        ['servo.js', 'registerServo'], ['analog-ics.js', 'registerAnalogICs']]) {
        try { const mod = await import(new URL(`src/devices/${file}`, BOARD_URL).href); mod[fn]?.(); } catch {}
    }
    setEngine({ BoardImpl, inferNetlist, checkWiring });
}

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const VISUAL_ONLY = new Set(['breadboard', 'label', 'wire_jumper']);

// ---- assertion parser ----

/**
 * Parse ```assert blocks from EXPECTED.md.
 * Returns [{kind, args, raw}] where kind is 'net'|'pin'|'current'|unknown.
 */
function parseAssertions(mdText) {
    const assertions = [];
    const re = /```assert\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(mdText)) !== null) {
        for (const line of m[1].split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // net <label> V <value> +-<tol>
            const netMatch = trimmed.match(/^net\s+(\S+)\s+[Vv]\s+([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (netMatch) {
                assertions.push({
                    kind: 'net', label: netMatch[1],
                    unit: 'V', expected: parseFloat(netMatch[2]),
                    tolerance: parseFloat(netMatch[3]), raw: trimmed
                });
                continue;
            }

            // net <label> mV <value> +-<tol>
            const netMvMatch = trimmed.match(/^net\s+(\S+)\s+mV\s+([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (netMvMatch) {
                assertions.push({
                    kind: 'net', label: netMvMatch[1],
                    unit: 'V', expected: parseFloat(netMvMatch[2]) / 1000,
                    tolerance: parseFloat(netMvMatch[3]) / 1000, raw: trimmed
                });
                continue;
            }

            // pin <name> duty <value> +-<tol>
            const pinMatch = trimmed.match(/^pin\s+(\S+)\s+duty\s+~?([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (pinMatch) {
                assertions.push({
                    kind: 'pin-duty', pin: pinMatch[1],
                    expected: parseFloat(pinMatch[2]),
                    tolerance: parseFloat(pinMatch[3]), raw: trimmed
                });
                continue;
            }

            // current <partId> mA <value> +-<tol>
            const curMatch = trimmed.match(/^current\s+(\S+)\s+mA\s+([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (curMatch) {
                assertions.push({
                    kind: 'current', partId: curMatch[1],
                    expected: parseFloat(curMatch[2]),
                    tolerance: parseFloat(curMatch[3]), raw: trimmed
                });
                continue;
            }

            // frequency <label> Hz <value> +-<tol>
            const freqMatch = trimmed.match(/^frequency\s+(\S+)\s+Hz\s+([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (freqMatch) {
                assertions.push({
                    kind: 'frequency', label: freqMatch[1],
                    expected: parseFloat(freqMatch[2]),
                    tolerance: parseFloat(freqMatch[3]), raw: trimmed
                });
                continue;
            }

            // Unknown assertion kind — explicit skip
            assertions.push({ kind: 'unknown', raw: trimmed });
        }
    }
    return assertions;
}

// ---- circuit solver ----

function solveCircuit(name, atMs = 1) {
    const circuitPath = join(EXAMPLES, name, 'circuit.json');
    if (!existsSync(circuitPath)) return null;
    const data = JSON.parse(readFileSync(circuitPath, 'utf8'));

    // Filter visual-only
    const visualIds = new Set(data.parts.filter(p => VISUAL_ONLY.has(p.kind)).map(p => p.id));
    data.parts = data.parts.filter(p => !VISUAL_ONLY.has(p.kind));
    data.wires = (data.wires || []).filter(w =>
        !(typeof w.from === 'string' && visualIds.has(w.from)) &&
        !(typeof w.to === 'string' && visualIds.has(w.to)));

    const circuit = Circuit.fromJSON(data);
    const board = circuit.board;
    board.advanceTo(BigInt(Math.round(atMs * 1_000_000)));

    // Build net label map: for each net, create labels from part.terminal
    const netLabels = new Map();
    for (const net of circuit.nets || board.getNets?.() || []) {
        const id = net.id || net.name;
        for (const t of net.terminals || []) {
            const label = `${t.part}.${t.terminal}`;
            netLabels.set(label, id);
            // Also store by just part id if it's a simple part (vcc, gnd, etc.)
            if (!netLabels.has(t.part)) netLabels.set(t.part, id);
        }
    }

    return { board, circuit, netLabels };
}

// ---- collect examples with assert blocks ----

const allExamples = readdirSync(EXAMPLES).filter(d => {
    if (d === 'AUDIT') return false;
    try { return statSync(join(EXAMPLES, d)).isDirectory(); } catch { return false; }
}).sort();

const examplesWithAssertions = [];
for (const name of allExamples) {
    const expPath = join(EXAMPLES, name, 'EXPECTED.md');
    if (!existsSync(expPath)) continue;
    const text = readFileSync(expPath, 'utf8');
    const assertions = parseAssertions(text);
    if (assertions.length > 0) {
        examplesWithAssertions.push({ name, assertions });
    }
}

// ---- tests ----

describe('absolute-physics assertions', { skip: ENGINE_SKIP }, () => {
    if (examplesWithAssertions.length === 0) {
        test('no assert blocks found yet (seed examples needed)', () => {
            // Not a failure — just no assertions to check yet
        });
        return;
    }

    for (const { name, assertions } of examplesWithAssertions) {
        describe(`${name}`, () => {
            let solved;
            try { solved = solveCircuit(name); } catch {}

            for (const a of assertions) {
                if (a.kind === 'unknown') {
                    test(`SKIP unknown assertion: ${a.raw}`, { skip: `unknown assertion kind: "${a.raw}"` }, () => {});
                    continue;
                }

                if (a.kind === 'net') {
                    test(`net ${a.label} = ${a.expected} ${a.unit} +-${a.tolerance}`, () => {
                        assert.ok(solved, `circuit ${name} failed to solve`);
                        const netId = solved.netLabels.get(a.label);
                        assert.ok(netId !== undefined, `net label "${a.label}" not found in circuit`);
                        const measured = solved.board.nodeVoltages.get(netId) ?? NaN;
                        assert.ok(!isNaN(measured), `no voltage for net ${netId}`);
                        const diff = Math.abs(measured - a.expected);
                        assert.ok(diff <= a.tolerance,
                            `${name}: net ${a.label} = ${measured.toFixed(4)} V, ` +
                            `expected ${a.expected} +-${a.tolerance} V (off by ${diff.toFixed(4)})`);
                    });
                    continue;
                }

                if (a.kind === 'current') {
                    test(`current ${a.partId} = ${a.expected} mA +-${a.tolerance}`, { skip: 'current readback not yet wired' }, () => {});
                    continue;
                }

                if (a.kind === 'pin-duty') {
                    test(`pin ${a.pin} duty = ${a.expected} +-${a.tolerance}`, { skip: 'duty cycle requires multi-step sim' }, () => {});
                    continue;
                }

                if (a.kind === 'frequency') {
                    test(`frequency ${a.label} = ${a.expected} Hz +-${a.tolerance}`, { skip: 'frequency requires oscillation measurement' }, () => {});
                    continue;
                }
            }
        });
    }
});

// Export parser for other tests to use
export { parseAssertions };
