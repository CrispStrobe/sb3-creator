/**
 * Gates that are not checking.
 *
 * A gate that never runs, fails wholesale, or reads a field that no longer
 * exists is indistinguishable from a gate that is passing — and worse than
 * having none, because it consumes the alarm a real defect would raise. Five
 * of those were found in one sweep (2026-08-19/20):
 *
 *   - Circuit.netlistError removed -> assertions compared undefined to null
 *   - Circuit.resolvedNets removed -> 819 benches reported total failure,
 *     3288 "violations" that were one bug, in the very file written to catch
 *     "every peripheral unreachable"
 *   - multimeter-chain's EMU_JS path had one `..` too many -> "skipped 2",
 *     forever, which reads as a missing toolchain rather than a typo
 *   - bench-invariants globbed only circuit.<device>.json, never the primary
 *     circuit.json a user actually opens
 *   - and one false positive from applying an MCU invariant to benches that
 *     deliberately have no MCU
 *
 * This file guards the two mechanical halves of that class.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
const available = existsSync(join(CUI, 'src', 'model', 'circuit.js'))
  && existsSync(join(BWB, 'src', 'index.js'));

// ---------------------------------------------------------------------------
// 1. Sibling checkouts live ONE level up. Always runs — no checkout needed.
// ---------------------------------------------------------------------------
describe('gate integrity: a suite cannot skip itself into silence', () => {
    test('no test resolves a sibling checkout two levels up', () => {
        // ../../<name> from this repo is the parent of the whole code tree.
        // Every sibling (bw-board, bw-circuit-ui, emu8051-stc, ucsim-stc) sits
        // beside sb3-creator, so a second `..` silently points at nothing —
        // `available` goes false and the suite reports "skipped", which reads
        // as a deliberate exclusion instead of a broken path.
        const offenders = [];
        for (const f of readdirSync(join(SB3, 'test'))) {
            if (!f.endsWith('.mjs')) continue;
            const src = readFileSync(join(SB3, 'test', f), 'utf8');
            for (const m of src.matchAll(/join\(\s*\w+\s*,\s*'\.\.'\s*,\s*'\.\.'\s*,\s*'([\w-]+)'/g)) {
                offenders.push(`${f}: ../../${m[1]}`);
            }
        }
        assert.deepEqual(offenders, [], `sibling checkouts are one level up, not two:\n  ${offenders.join('\n  ')}`);
    });

    test('every skip guard names a path that exists, or a checkout that does not', () => {
        // A guard may legitimately point at an absent sibling — that is a real
        // "not checked out" skip. What must NOT happen is a guard pointing
        // INSIDE a checkout that IS present, at a file that is not there:
        // that is a wrong path wearing a skip's clothing.
        const problems = [];
        for (const f of readdirSync(join(SB3, 'test'))) {
            if (!f.endsWith('.mjs')) continue;
            const src = readFileSync(join(SB3, 'test', f), 'utf8');
            for (const m of src.matchAll(/existsSync\(join\((CUI|BWB),\s*([^)]+)\)\)/g)) {
                const root = m[1] === 'CUI' ? CUI : BWB;
                if (!existsSync(root)) continue;            // genuinely not checked out
                const parts = m[2].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
                const p = join(root, ...parts);
                if (!existsSync(p)) problems.push(`${f}: ${p}`);
            }
        }
        assert.deepEqual(problems, [], `checkout present but the guarded path is missing:\n  ${problems.join('\n  ')}`);
    });
});

// ---------------------------------------------------------------------------
// 2. The cross-repo surface our tests read. One clear failure, not 819.
// ---------------------------------------------------------------------------
describe('gate integrity: the bw-circuit-ui/bw-board surface we depend on',
    { skip: available ? false : 'needs bw-circuit-ui/bw-board checkouts' }, () => {
        let circ;
        test('load a known-good bench', async () => {
            const { setEngine } = await import(join(CUI, 'src/engine.js'));
            const eng = await import(join(BWB, 'src/index.js'));
            (await import(join(BWB, 'src/register-all.js'))).registerAllDevices();
            setEngine({ BoardImpl: eng.BoardImpl, inferNetlist: eng.inferNetlist, checkWiring: eng.checkWiring });
            const { registerSidecar } = await import(join(CUI, 'src/model/parts-registry.js'));
            for (const f of readdirSync(join(CUI, 'src/parts-data'))) {
                if (!f.endsWith('.json')) continue;
                try {
                    const sc = JSON.parse(readFileSync(join(CUI, 'src/parts-data', f), 'utf8'));
                    if (sc.kind) registerSidecar(sc);
                } catch { /* bw-parts' problem */ }
            }
            const { Circuit } = await import(join(CUI, 'src/model/circuit.js'));
            circ = Circuit.fromJSON(JSON.parse(
                readFileSync(join(SB3, 'examples/01-blink/circuit.stc12c5a60s2.json'), 'utf8')));
            assert.ok(circ, 'Circuit.fromJSON returned something');
        });

        // Removing any of these upstream should fail HERE, by name, once —
        // not as a wall of unrelated assertions in the suites that use them.
        for (const prop of ['parts', 'wires', 'board', 'vcc']) {
            test(`Circuit.${prop} still exists`, () => {
                assert.notEqual(circ[prop], undefined,
                    `Circuit.${prop} is gone; the tests reading it will fail for the wrong reason`);
            });
        }
        for (const prop of ['parts', 'nets', 'setPin', 'nodeVoltages', 'getDeviceState', 'advanceTo']) {
            test(`board.${prop} still exists`, () => {
                assert.notEqual(circ.board[prop], undefined,
                    `board.${prop} is gone; bench-invariants and the chain tests read it`);
            });
        }

        test('board.nets keeps the {id, terminals:[{part, terminal}]} shape', () => {
            // bench-invariants walks exactly this shape to build reachability.
            const n = circ.board.nets[0];
            assert.ok(n && typeof n.id === 'string', 'net has a string id');
            assert.ok(Array.isArray(n.terminals) && n.terminals.length, 'net has terminals');
            assert.ok(typeof n.terminals[0].part === 'string'
                && typeof n.terminals[0].terminal === 'string',
            'terminal is {part, terminal}');
        });

        test('a bench the engine accepts leaves a NON-empty board', () => {
            // The load failure is silent: Circuit._syncNetlist swallows engine
            // rejection, so a refused bench still yields a healthy-looking
            // Circuit on an empty board. 01-blink is known-good, so an empty
            // board here means the swallow is hiding something new.
            assert.ok(circ.board.parts.length > 0 && circ.board.nets.length > 0,
                'known-good bench produced an empty board — the engine is rejecting it silently');
        });
    });
