/**
 * No shipped circuit may short its supply rail to ground.
 *
 * A rail short is not a wiring style question: every node collapses to 0 V, the
 * example reads dead, and nothing in the corpus catches it. `validateNetlist`
 * does not check it (a short is a legal graph), and the physics assertions only
 * catch it where an EXPECTED.md happens to claim a voltage on the shorted net —
 * which is how the one instance in the corpus was found, by
 * `assert-physics.test.mjs` on 2026-08-23, and not before.
 *
 * WHY THIS USES THE ENGINE and not a hand-rolled union-find over `wires`:
 * a first attempt did exactly that and reported 802 shorts in 2,040 files. Two
 * reasons it was wrong, both worth knowing before anyone "simplifies" this:
 *
 *   1. Endpoints come in two dialects, MIXED WITHIN ONE FILE — the flat
 *      {from:'ID', fromTerminal:'t'} and the nested {to:{board,hole}}. Keying
 *      only on part/terminal turns every breadboard endpoint into the same
 *      node, and then every supply meets every ground.
 *   2. Breadboard topology is real. Holes on one rail are one node and holes in
 *      one column are another; that resolution lives in the engine, not in the
 *      wire list.
 *
 * So the check asks the same Circuit the app uses, and compares NET IDENTITY:
 * the net carrying a vcc-ish terminal must not be the net carrying a ground.
 *
 * Run: BW_CIRCUIT_UI=... BW_BOARD=... node --test test/rail-short.test.mjs
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
// Cross-repo guard: local skip, CI failure. See test/helpers/siblings.mjs
// and test/CROSS-REPO-GATE-AUDIT.md.
const gate = requireSiblings('bw-circuit-ui', 'bw-board');
siblingGuardTest(gate, 'the rail-short corpus gate');
const available = !gate.skip;

/**
 * Known shorts, with the wire that causes each. This list may only SHRINK.
 * Adding an entry means shipping a dead circuit on purpose; fix it instead.
 */
const KNOWN_SHORTS = new Map([
    ['pc84-led-herz/circuit.json',
     'wire_9 puts vcc_1.vcc on net_8; scripted wire_fix_1049/1053/1063 then ' +
     'attach gnd_2.gnd to that same net. The rail reads 0 V.'],
]);

// Only single-terminal RAIL symbols. A battery is deliberately excluded: its
// negative terminal is SUPPOSED to meet ground, and counting it flagged all 14
// variants of 75-battery-tester as shorted when they are wired correctly.
const isSupply = (kind) => /^(vcc|vdd|v\+|supply)$/i.test(String(kind || ''));
const isGround = (kind) => /^(gnd|ground|vss|v-)$/i.test(String(kind || ''));

describe('no shipped circuit shorts its rail to ground',
    { skip: gate.skip }, () => {
        let Circuit;
        const files = [];

        test('engine + sidecars load, and the circuits are found', async () => {
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
                } catch { /* bw-parts' problem */ }
            }
            ({ Circuit } = await import(join(CUI, 'src/model/circuit.js')));

            for (const d of readdirSync(EXAMPLES, { withFileTypes: true })) {
                if (!d.isDirectory()) continue;
                for (const fn of readdirSync(join(EXAMPLES, d.name))) {
                    if (/^circuit.*\.json$/.test(fn)) files.push(d.name + '/' + fn);
                }
            }
            // Vacuity guard: this must fail rather than pass over an empty list.
            assert.ok(files.length > 1500,
                `only ${files.length} circuit files found — expected the whole corpus`);
            assert.ok(Circuit, 'Circuit failed to load');
        });

        test('every supply net is distinct from every ground net', () => {
            assert.ok(files.length > 1500, 'the discovery test did not run');
            assert.ok(Circuit, 'the discovery test did not run');

            const found = [];
            for (const rel of files) {
                let c;
                try {
                    c = Circuit.fromJSON(JSON.parse(readFileSync(join(EXAMPLES, rel), 'utf8')));
                } catch { continue; }          // unparseable is another gate's job
                const nets = c.resolvedNets || [];
                if (!nets.length) continue;
                const byId = new Map((c.parts || []).map(p => [p.id, p.kind]));

                const netOf = new Map();       // netIndex -> {supply, ground}
                nets.forEach((net, i) => {
                    for (const t of (net.terminals || net.members || net)) {
                        const pid = typeof t === 'string' ? t.split(':')[0] : (t && (t.part || t.partId));
                        const kind = byId.get(pid);
                        if (!kind) continue;
                        const e = netOf.get(i) || { supply: null, ground: null };
                        if (isSupply(kind)) e.supply = pid;
                        if (isGround(kind)) e.ground = pid;
                        netOf.set(i, e);
                    }
                });
                for (const [, e] of netOf) {
                    if (e.supply && e.ground) { found.push(`${rel}: ${e.supply} shares a net with ${e.ground}`); break; }
                }
            }

            const unexpected = found.filter(f => !KNOWN_SHORTS.has(f.split(':')[0]));
            assert.deepEqual(unexpected, [],
                `${unexpected.length} circuit(s) short the rail to ground. A shorted rail reads ` +
                `0 V everywhere and the example is dead. Fix the wiring; do not add it to ` +
                `KNOWN_SHORTS, which may only shrink.`);

            // The ratchet: a KNOWN_SHORT that stops reproducing must be removed.
            for (const [rel, why] of KNOWN_SHORTS) {
                assert.ok(found.some(f => f.startsWith(rel + ':')),
                    `${rel} no longer shorts (${why}) — delete it from KNOWN_SHORTS.`);
            }
        });
    });
