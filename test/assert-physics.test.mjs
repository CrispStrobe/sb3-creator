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
    // Register EVERY device model. Hand-listing four of them is how this test
    // spent months reporting "no circuit file" for circuits that were present
    // and fine: a 555, a 74HC00 or an SSD1306 failed netlist validation as
    // "unknown kind", the board came back empty, and the assertions on it were
    // skipped. src/register-all.js exists precisely for this and its own header
    // documents the same bug found in the designer UI on 2026-08-10.
    const { registerAllDevices } = await import(new URL('src/register-all.js', BOARD_URL).href);
    registerAllDevices();
    // getDevice MUST be injected: without it bw-circuit-ui's terminalsForKind
    // cannot consult the engine and falls back to sidecar -> switch -> ['a','b'],
    // so a battery_aa arrives at validateNetlist claiming terminals a/b against
    // an engine that has pos/neg, and the whole netlist is rejected. Injecting
    // only the three original keys is documented there as "exactly the old
    // resolution order" — which is the order that produces empty boards.
    const { getDevice } = await import(new URL('src/devices.js', BOARD_URL).href);
    setEngine({ BoardImpl, inferNetlist, checkWiring, getDevice });
}

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
// Only truly visual-only parts — breadboard is a connection fabric that
// Circuit.fromJSON needs to resolve seats and holeWires.
const VISUAL_ONLY = new Set(['label', 'wire_jumper']);

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

// Index-based circuit file lookup (same contract as gallery-e2e)
const _idx = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
const _byDir = new Map(_idx.map(e => [e.files?.program?.split('/')[0] ?? e.id, e]));
function findCircuitFile(name) {
    // 1. Direct circuit.json
    const direct = join(EXAMPLES, name, 'circuit.json');
    if (existsSync(direct)) return direct;
    // 2. Index-referenced authored circuit
    const entry = _byDir.get(name);
    if (entry?.files?.circuit) return join(EXAMPLES, entry.files.circuit);
    return null;
}

/**
 * Solve a circuit, or explain precisely why it cannot be solved.
 * Returns {ok:true, ...} or {ok:false, reason}. The old contract returned
 * bare null for THREE different causes and the caller printed "no circuit
 * file" for all of them, which hid a registry bug for months.
 */
function solveCircuit(name, atMs = 1) {
    const circuitPath = findCircuitFile(name);
    if (!circuitPath) return { ok: false, reason: `no circuit file for "${name}"` };
    const data = JSON.parse(readFileSync(circuitPath, 'utf8'));

    // Filter visual-only
    const visualIds = new Set(data.parts.filter(p => VISUAL_ONLY.has(p.kind)).map(p => p.id));
    data.parts = data.parts.filter(p => !VISUAL_ONLY.has(p.kind));
    data.wires = (data.wires || []).filter(w =>
        !(typeof w.from === 'string' && visualIds.has(w.from)) &&
        !(typeof w.to === 'string' && visualIds.has(w.to)));

    const circuit = Circuit.fromJSON(data);
    const board = circuit.board;
    // If the board rejected the netlist (missing devices, breadboard fabric
    // the CUI can't resolve), getNets() returns empty — treat as unsolvable.
    const nets = board.getNets?.() || [];
    if (nets.length === 0) {
        return { ok: false, reason: `netlist REJECTED (board empty) for ${circuitPath.slice(circuitPath.indexOf('examples/'))} `
            + `- ${data.parts.length} parts, 0 nets. Usually an unregistered part kind.` };
    }
    board.advanceTo(BigInt(Math.round(atMs * 1_000_000)));

    // Build net label map: for each net, create labels from part.terminal
    // Also register common aliases (vcc1.pos → vcc1.vcc, src.pos → src.vcc, etc.)
    const netLabels = new Map();
    const TERMINAL_ALIASES = {
        'pos': ['vcc', 'pos'],   // vsource uses pos, vcc uses vcc
        'vcc': ['vcc', 'pos'],
        'neg': ['gnd', 'neg'],
        'gnd': ['gnd', 'neg'],
    };
    for (const net of circuit.nets || board.getNets?.() || []) {
        const id = net.id || net.name;
        for (const t of net.terminals || []) {
            const label = `${t.part}.${t.terminal}`;
            netLabels.set(label, id);
            // Register aliases: if terminal is 'vcc', also register 'part.pos'
            const aliases = TERMINAL_ALIASES[t.terminal];
            if (aliases) {
                for (const alt of aliases) {
                    const altLabel = `${t.part}.${alt}`;
                    if (!netLabels.has(altLabel)) netLabels.set(altLabel, id);
                }
            }
            // Also store by just part id if it's a simple part
            if (!netLabels.has(t.part)) netLabels.set(t.part, id);
        }
    }

    return { ok: true, board, circuit, netLabels, circuitPath };
}

// ---- known defects (RATCHET: only ever shrinks) ----

/**
 * Assertions that are CHECKED and FAIL. Each entry names which side is wrong
 * and why, because "the check went red" is not a finding on its own.
 *
 * These are not tolerated failures — they are unfixed defects with a verdict
 * recorded. Deliberately NOT fixed by editing the claim to match the engine:
 * that would turn a test into a tautology. The claim stays as authored until
 * someone fixes the side that is actually wrong.
 *
 * Key: `${example}::${raw assertion line}`.
 */
const KNOWN_DEFECTS = new Map([
    // --- CLAIM is wrong: a Pi Pico's rail is 3.3 V, not 5 V. ------------------
    // The corpus refutes these three itself: pico02-pot-print, pico03-two-tasks
    // and pico04-button carry `net vcc1.vcc V 3.30` on the same part and pass.
    // Same rail, same kind, contradictory claims. Fix = correct the claim to
    // 3.30 (a real fix, not a snapshot — 3.3 V is what a Pico's 3V3 pin is).
    ['70-calculator::net vcc1.vcc V 5.00 +-0.01',
        'CLAIM wrong: pi_pico rail is 3.3 V; engine reads 3.3000'],
    ['70-calculator-simple::net vcc1.vcc V 5.00 +-0.01',
        'CLAIM wrong: pi_pico rail is 3.3 V; engine reads 3.3000'],
    ['72-pico-oled-hello::net vcc1.vcc V 5.00 +-0.01',
        'CLAIM wrong: pi_pico rail is 3.3 V; engine reads 3.3000'],

    // --- CLAIM is wrong: assumes a midpoint pot the circuit does not declare.
    // contrast has params.position = 0.15 across a 5 V rail -> 0.75 V, which is
    // exactly what the engine reads, and 0.15 is deliberate: an HD44780 contrast
    // pot belongs near the bottom of its range. The claim assumed position 0.5.
    ['eater6502-full-build::net contrast.wiper V 2.50 +-0.05',
        'CLAIM wrong: pot position=0.15 -> 0.75 V; claim assumes a midpoint pot'],
    // vsrc1 has params.position = 0.6 -> 3.0 V unloaded, 2.83 V once rv1 loads
    // the wiper. The claim of 2.5 V matches neither, and contradicts the
    // circuit's own declared position.
    ['76-multimeter::net vsrc1.wiper V 2.50 +-0.05',
        'CLAIM wrong: pot position=0.6 -> 2.83 V loaded; claim assumes position 0.5'],

    // --- CIRCUIT is wrong, and here the claim is the correct side. -----------
    // wire_9 (vcc_1.vcc -> resistor_6.a) carries netId "net_8", and a batch of
    // scripted wire_fix_* wires later attached gnd_2.gnd to that SAME net. The
    // supply rail is therefore shorted to ground and reads 0 V, while vcc_1.vcc
    // also appears in net_5. Fix = re-net wire_9, do not touch the claim.
    // Corpus-wide scan: this is the only VCC/GND short in 274 examples.
    ['pc84-led-herz::net vcc_1.pos V 5.00 +-0.01',
        'CIRCUIT wrong: wire_fix_* pass merged the VCC net into ground; rail reads 0 V'],
]);

/** Keys actually encountered this run — guards against a stale entry. */
const DEFECTS_SEEN = new Set();

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
            try { solved = solveCircuit(name); }
            catch (e) { solved = { ok: false, reason: `threw: ${e.message?.split('\n')[0] || String(e)}` }; }

            // A circuit that will not solve is a DEFECT, not an absence. An
            // ```assert net ...``` line is a claim its author made about a
            // circuit they believed exists; if we cannot solve it, the claim
            // is unverified and must say so in red.
            const circuitFail = solved.ok ? null : `circuit ${name} not solvable: ${solved.reason}`;

            for (const a of assertions) {
                if (a.kind === 'unknown') {
                    test(`SKIP unknown assertion: ${a.raw}`, { skip: `unknown assertion kind: "${a.raw}"` }, () => {});
                    continue;
                }

                if (a.kind === 'net') {
                    const defectKey = `${name}::${a.raw}`;
                    const defect = KNOWN_DEFECTS.get(defectKey);
                    if (defect) DEFECTS_SEEN.add(defectKey);
                    test(`net ${a.label} = ${a.expected} ${a.unit} +-${a.tolerance}`
                        + (defect ? `  [KNOWN DEFECT: ${defect}]` : ''), () => {
                        const check = () => {
                            assert.ok(!circuitFail, circuitFail);
                            const netId = solved.netLabels.get(a.label);
                            assert.ok(netId !== undefined, `net label "${a.label}" not found in circuit`);
                            const measured = solved.board.nodeVoltages.get(netId) ?? NaN;
                            assert.ok(!isNaN(measured), `no voltage for net ${netId}`);
                            const diff = Math.abs(measured - a.expected);
                            assert.ok(diff <= a.tolerance,
                                `${name}: net ${a.label} = ${measured.toFixed(4)} V, ` +
                                `expected ${a.expected} +-${a.tolerance} V (off by ${diff.toFixed(4)})`);
                        };
                        if (!defect) return check();
                        // Ratchet: a known defect must STILL be broken. If it
                        // passes, the defect was fixed and the entry must go —
                        // otherwise the list rots into a permanent excuse.
                        let threw = false;
                        try { check(); } catch { threw = true; }
                        assert.ok(threw,
                            `${defectKey}\n  now PASSES — remove it from KNOWN_DEFECTS in the same commit that fixed it.`);
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

// A KNOWN_DEFECTS key that no assertion matched is a stale entry: the example
// was renamed or the claim reworded, and the ratchet silently stopped guarding
// anything. That is the same failure shape as the path typo in GATE-AUDIT.
describe('known-defect ratchet integrity', { skip: ENGINE_SKIP }, () => {
    test('every KNOWN_DEFECTS entry matched a real assertion', () => {
        const stale = [...KNOWN_DEFECTS.keys()].filter(k => !DEFECTS_SEEN.has(k));
        assert.deepEqual(stale, [],
            `stale KNOWN_DEFECTS entries (nothing in the corpus matches them):\n  ${stale.join('\n  ')}`);
    });
});

// Export parser for other tests to use
export { parseAssertions };
