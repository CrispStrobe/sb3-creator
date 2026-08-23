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
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
// Cross-repo guard: skip locally, FAIL in CI. CI checks both siblings out at the
// revisions pinned in test/fixtures/siblings.json, so an absent sibling there means
// the checkout step broke and this gate just went silent — see
// test/CROSS-REPO-GATE-AUDIT.md and test/helpers/siblings.mjs.
const gate = requireSiblings('bw-circuit-ui', 'bw-board');
siblingGuardTest(gate, 'gate integrity');

// ---------------------------------------------------------------------------
// 1. Sibling checkouts live ONE level up. Always runs — no checkout needed.
// ---------------------------------------------------------------------------
// Files that MENTION a sibling but do not gate on one. Each needs a reason, so
// the list is an argument rather than a place to hide a gate that skips.
const NOT_A_CROSS_REPO_GATE = new Map([
    ['gate-integrity.test.mjs',
     'this file — its own prose names the siblings, and its cross-repo half already uses the guard'],
    ['wire-endpoint-adoption.test.mjs',
     'a GREP over this repo\'s own files for hand-rolled wire-endpoint dialect readers. ' +
     'It names bw-circuit-ui because that is where the one canonical reader lives, but it ' +
     'imports nothing and reads no sibling: gating it would silence the check that keeps ' +
     'the siblings\' single reader single'],
    ['device-coverage.test.mjs',
     'reads bw-board\'s kinds when present and otherwise falls back to a committed snapshot, ' +
     'putting "(snapshot)" in the TEST NAME so a green run cannot be mistaken for the real check ' +
     '— an honest in-repo answer to the same problem, and it always runs'],
    ['flat-variants-manifest.test.mjs',
     'the other honest answer: a manifest generated beside the siblings and committed, so the ' +
     'check runs with no checkout at all. It records the engine repo it came from']
]);

describe('gate integrity: a suite cannot skip itself into silence', () => {
    // ---------------------------------------------------------------------
    // The pins CI checks out must be the pins the tests expect. These live in
    // two files that nothing else forces to agree, and if they drift the gates
    // run against a revision no one recorded — which is the vendoring-staleness
    // failure in a different costume.
    // ---------------------------------------------------------------------
    // ---------------------------------------------------------------------
    // Every cross-repo gate must route its skip decision through the shared
    // guard. Before 2026-08-23 each file rolled its own `existsSync(...)` and
    // handed the result to `skip:`, and all fifteen skipped in CI forever. A new
    // file that reintroduces that shape is the regression this catches.
    // ---------------------------------------------------------------------
    test('every cross-repo test routes its skip through the shared sibling guard', () => {
        const offenders = [];
        let scanned = 0, crossRepo = 0;
        for (const f of readdirSync(join(SB3, 'test'))) {
            if (!f.endsWith('.test.mjs')) continue;
            const src = readFileSync(join(SB3, 'test', f), 'utf8');
            scanned++;
            // Does this file depend on a sibling checkout at all?
            if (!/BW_BOARD|BW_CIRCUIT_UI|bw-circuit-ui|bw-board/.test(src)) continue;
            crossRepo++;
            if (NOT_A_CROSS_REPO_GATE.has(f)) continue;
            if (!/siblingGuardTest\s*\(/.test(src)) {
                offenders.push(f);
            }
        }
        // The instrument before the verdict. An empty offender list means either
        // "everything is guarded" or "the walk found nothing", and those look
        // identical. This is also the one place a NUL byte would matter: GNU grep
        // classifies a NUL-bearing file as binary and silently searches nothing, so
        // an absence established by grep can flip from true to permanently-false
        // when an unrelated commit introduces a separator byte — which is exactly
        // what a bw-board vendor bump did to another repo's sweep today. This scan
        // uses readFileSync, which has no such blind spot; the yield assertion is
        // what makes that checkable rather than merely claimed.
        assert.ok(scanned >= 40,
            `only ${scanned} test files scanned — the walk is broken and this assertion is vacuous`);
        assert.ok(crossRepo >= 12,
            `only ${crossRepo} files matched as cross-repo, expected at least 12 — either the ` +
            `detector's pattern stopped matching or the gates were deleted; both make an empty ` +
            `offender list meaningless`);
        assert.deepEqual(offenders, [],
            'these tests depend on a sibling checkout but do not call siblingGuardTest(), so ' +
            'they will skip in CI and the skip will read as a pass:\n  ' + offenders.join('\n  ') +
            '\nSee test/helpers/siblings.mjs and test/CROSS-REPO-GATE-AUDIT.md.');
    });

    test('CI checks out the sibling revisions test/fixtures/siblings.json pins', () => {
        const workflow = readFileSync(join(SB3, '.github', 'workflows', 'ci.yml'), 'utf8');
        const pins = JSON.parse(readFileSync(join(SB3, 'test', 'fixtures', 'siblings.json'), 'utf8')).siblings;

        for (const [name, pin] of Object.entries(pins)) {
            // Find the checkout step for this sibling and read the ref it uses.
            const step = new RegExp(
                `repository:\\s*${pin.repo.replace('/', '\\/')}\\s*\\n\\s*ref:\\s*(\\S+)`);
            const m = workflow.match(step);
            assert.ok(m,
                `ci.yml has no pinned checkout step for ${name} (${pin.repo}). Fifteen ` +
                `cross-repo gates depend on it being checked out; without the step they fail ` +
                `in CI by design, but the point is for them to RUN.`);
            assert.equal(m[1], pin.rev,
                `ci.yml checks out ${name} at ${m[1]} but test/fixtures/siblings.json pins ` +
                `${pin.rev}. Update both together, in one commit, with the suite green.`);
        }
    });

    test('every sibling this repo pins is one we are allowed to vendor or clone', () => {
        const pins = JSON.parse(readFileSync(join(SB3, 'test', 'fixtures', 'siblings.json'), 'utf8')).siblings;
        // The engine-backend licence rule: ngspice/KLU/CSparse-family code may not
        // be used OR read, so a gate that depended on one could never be made
        // CI-runnable and would have to stay developer-only. Neither sibling is in
        // that family — both are ours — but assert it rather than remember it, so
        // adding a pin to something copyleft has to be a deliberate argument.
        const FORBIDDEN = /ngspice|klu|csparse|suitesparse/i;
        const ALLOWED = new Set(['MIT', 'MPL-2.0', 'Apache-2.0', 'BSD-3-Clause', 'ISC']);
        for (const [name, pin] of Object.entries(pins)) {
            assert.ok(!FORBIDDEN.test(pin.repo),
                `${name} names a forbidden engine family; such a gate must stay developer-only`);
            assert.ok(ALLOWED.has(pin.licence),
                `${name} is recorded as ${pin.licence}, which is not on the permissive list. ` +
                `CI clones this repo — check the licence permits that before pinning it.`);
        }
    });

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
    { skip: gate.skip }, () => {
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
