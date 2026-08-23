/**
 * Every solved node must obey Kirchhoff's current law.
 *
 * A solver can return a self-consistent-looking answer that no circuit could
 * produce. bw-board's tier-1 closed-form walker did exactly that on a loaded
 * potentiometer: it returned the UNLOADED midpoint while the load chain drew
 * its full current from that midpoint as if it were an ideal source.
 * 41-pot-as-dimmer reported a wiper at exactly 2.5000 V while sourcing
 * 2.174 mA through 2.5k of Thevenin impedance - arithmetically impossible, and
 * invisible to every gate that existed. Its EXPECTED.md had the artifact
 * written down as the expectation, and so did bw-board's own solver-agreement
 * test, which asserted the ideal-midpoint answer as correct.
 *
 * This check needs no engine knowledge - only the solved node voltages and the
 * topology the user drew - which is exactly why it can be trusted to disagree
 * with the engine that produced them.
 *
 * WHAT IT CHECKS, and deliberately not more: a net is examined only when EVERY
 * terminal on it belongs to an element whose branch current follows from node
 * voltages alone. Resistors and potentiometer halves qualify. A net touching a
 * diode, transistor, source, capacitor or MCU pin is SKIPPED and counted,
 * because guessing at its branch current would turn a physical law into a
 * fitted one. Skipped is reported, never silently passed.
 *
 * COVERAGE, stated plainly because it is small: 37 nets of 25,274 across 2,098
 * solved circuits, about 0.15%. Almost every net in this corpus touches a
 * source, a junction or an MCU pin, and none of those branch currents follow
 * from node voltages. A wider gate would have to model devices, at which point
 * it stops being an independent check and starts agreeing with the engine by
 * construction.
 *
 * It earns its place anyway, because those 37 are exactly the divider-shaped
 * nodes where a closed-form shortcut is tempting, and it demonstrably catches
 * the real defect: against bw-board c7efb5c it reports
 *
 *   41-pot-as-dimmer/circuit.json net bb1:n-col-t5 (2.5000 V):
 *     residual -2.1739 mA across [pot1.wiper r1.a]
 *
 * and against 40db90f, which routes a loaded wiper to MNA, it is silent. Red on
 * the engine that had the bug, green on the one that fixed it, naming the node
 * and the current.
 *
 * Run: BW_BOARD=... BW_CIRCUIT_UI=... node --test test/kcl-residual.test.mjs
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
const EXAMPLES = join(SB3, 'examples');

// Cross-repo guard: local skip, CI failure. Routed through the shared helper
// rather than a local existsSync, because a gate that decides on its own when
// to go quiet is how fifteen of them went quiet at once. gate-integrity
// enforces this and caught the first draft of this file doing it by hand.
const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the KCL residual check');
const available = !gate.skip &&
    existsSync(join(CUI, 'src/model/circuit.js')) && existsSync(join(BWB, 'src/board.js'));

/** 1 uA: far below any teaching current, far above solver noise. */
const TOLERANCE_A = 1e-6;

/** Kinds whose branch current is a function of node voltages alone. */
const LINEAR = new Set(['resistor', 'potentiometer']);

const tkey = (part, terminal) => part + ' ' + terminal;

describe('every solved node obeys KCL',
    { skip: available ? false : 'needs bw-circuit-ui/bw-board checkouts' }, () => {
        let Circuit;
        const files = [];

        test('engine loads and the corpus is found', async () => {
            const { setEngine } = await import(join(CUI, 'src/engine.js'));
            const { BoardImpl } = await import(join(BWB, 'src/board.js'));
            const { inferNetlist, checkWiring } = await import(join(BWB, 'src/infer-netlist.js'));
            const { hasDevice, getDevice } = await import(join(BWB, 'src/devices.js'));
            (await import(join(BWB, 'src/register-all.js'))).registerAllDevices();
            setEngine({ BoardImpl, inferNetlist, checkWiring, hasDevice, getDevice });
            const { registerSidecar } = await import(join(CUI, 'src/model/parts-registry.js'));
            for (const f of readdirSync(join(CUI, 'src/parts-data'))) {
                if (!f.endsWith('.json')) continue;
                try {
                    const sc = JSON.parse(readFileSync(join(CUI, 'src/parts-data', f), 'utf8'));
                    if (sc.kind) registerSidecar(sc);
                } catch { /* bw-parts owns its own sidecars */ }
            }
            ({ Circuit } = await import(join(CUI, 'src/model/circuit.js')));

            for (const d of readdirSync(EXAMPLES, { withFileTypes: true })) {
                if (!d.isDirectory()) continue;
                for (const fn of readdirSync(join(EXAMPLES, d.name))) {
                    if (/^circuit.*\.json$/.test(fn)) files.push(d.name + '/' + fn);
                }
            }
            assert.ok(files.length > 1500,
                'only ' + files.length + ' circuits found - expected the whole corpus');
            assert.ok(Circuit, 'Circuit failed to load');
        });

        test('no net sources or sinks current it cannot account for', () => {
            assert.ok(files.length > 1500 && Circuit, 'the discovery test did not run');

            const violations = [];
            let netsChecked = 0, netsSkipped = 0, circuitsSolved = 0;

            for (const rel of files) {
                let c;
                try { c = Circuit.fromJSON(JSON.parse(readFileSync(join(EXAMPLES, rel), 'utf8'))); }
                catch { continue; }
                const board = c.board;
                let nets;
                try { board.advanceTo(1000000n); nets = board.getNets?.() || []; }
                catch { continue; }
                if (!nets.length) continue;
                circuitsSolved++;

                const V = (netId) => board.nodeVoltages.get(netId);
                const partOf = new Map((c.parts || []).map(p => [p.id, p]));
                const netOfTerminal = new Map();
                for (const n of nets) {
                    for (const t of (n.terminals || [])) netOfTerminal.set(tkey(t.part, t.terminal), n.id);
                }

                for (const net of nets) {
                    const v = V(net.id);
                    if (v === undefined) continue;
                    const terms = net.terminals || [];
                    // Ground is the reference: it absorbs by definition.
                    if (terms.some(t => /^(gnd|ground|vss)$/i.test(String(partOf.get(t.part)?.kind || '')))) continue;

                    let sum = 0, checkable = true;
                    for (const t of terms) {
                        const p = partOf.get(t.part);
                        const kind = String(p?.kind || '').toLowerCase();
                        if (!LINEAR.has(kind)) { checkable = false; break; }

                        if (kind === 'resistor') {
                            const other = t.terminal === 'a' ? 'b' : 'a';
                            const on = netOfTerminal.get(tkey(t.part, other));
                            const ov = on === undefined ? undefined : V(on);
                            const R = Number(p.params?.ohms);
                            if (ov === undefined || !(R > 0)) { checkable = false; break; }
                            sum += (ov - v) / R;              // current INTO this net
                        } else {
                            // board.js: R_a_wiper = total * (1 - position),
                            //           R_wiper_b = total * position
                            const total = Number(p.params?.ohms);
                            const pos = Number.isFinite(p.params?.position) ? p.params.position : 0.5;
                            if (!(total > 0)) { checkable = false; break; }
                            const rAW = Math.max(1, total * (1 - pos));
                            const rWB = Math.max(1, total * pos);
                            const legs = t.terminal === 'wiper'
                                ? [['a', rAW], ['b', rWB]]
                                : [['wiper', t.terminal === 'a' ? rAW : rWB]];
                            for (const leg of legs) {
                                const on = netOfTerminal.get(tkey(t.part, leg[0]));
                                const ov = on === undefined ? undefined : V(on);
                                if (ov === undefined) { checkable = false; break; }
                                sum += (ov - v) / leg[1];
                            }
                            if (!checkable) break;
                        }
                    }

                    if (!checkable) { netsSkipped++; continue; }
                    netsChecked++;
                    if (Math.abs(sum) > TOLERANCE_A) {
                        violations.push(rel + ' net ' + net.id + ' (' + v.toFixed(4) + ' V): residual ' +
                            (sum * 1000).toFixed(4) + ' mA across [' +
                            terms.map(t => t.part + '.' + t.terminal).join(' ') + ']');
                    }
                }
            }

            // Vacuity guards: this must fail loudly rather than report a clean
            // run over a corpus it never opened, or over no checkable nets.
            // Floors are MEASURED, not invented. On 2026-08-23 this corpus gives
            // 2098 solved circuits and 37 checkable nets out of 25,274. The first
            // draft guessed "> 200" and failed on a healthy run, which is the
            // right failure: a threshold nobody measured is a threshold that
            // fires at the wrong time.
            assert.ok(circuitsSolved > 1900,
                'only ' + circuitsSolved + ' circuits solved (expected ~2098)');
            assert.ok(netsChecked >= 30,
                'only ' + netsChecked + ' nets were checkable (expected ~37) - either the ' +
                'corpus lost its resistor-only nets or the topology shape changed, and ' +
                'either way this gate is no longer looking at what it was built to look at');
            console.log('    KCL: ' + netsChecked + ' nets checked, ' + netsSkipped +
                ' skipped (non-linear branch), across ' + circuitsSolved + ' circuits');

            assert.deepEqual(violations.slice(0, 20), [],
                violations.length + ' net(s) violate KCL by more than 1 uA. A node that sources ' +
                'current it cannot account for is not a circuit any bench could build.');
        });
    });
