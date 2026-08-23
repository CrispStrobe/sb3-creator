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
        const stripComments = (src) => src
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .split('\n').map((l) => l.replace(/(^|[^:"'`\\])\/\/.*$/, '$1')).join('\n');
        const offenders = [];
        let scanned = 0, crossRepo = 0;
        for (const f of readdirSync(join(SB3, 'test'))) {
            if (!f.endsWith('.test.mjs')) continue;
            const src = readFileSync(join(SB3, 'test', f), 'utf8');
            scanned++;
            // Does this file depend on a sibling checkout at all? Ask the CODE,
            // not the prose. Matching raw source made a file that merely MENTIONS
            // the siblings in a header comment read as depending on them:
            // index-metadata-matches-disk.test.mjs names "sb3-creator, bw-board,
            // bw-circuit-ui or lite's app" while importing nothing outside this
            // repo and reading no sibling path. Demanding a sibling guard there
            // would have added a skip to a gate that has no reason to skip — the
            // opposite of what this check is for.
            const code = stripComments(src);
            if (!/BW_BOARD|BW_CIRCUIT_UI|bw-circuit-ui|bw-board/.test(code)) continue;
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

    test('every pinned checkout ref is a ref actions/checkout can actually fetch', () => {
        // THE GATE THAT WOULD HAVE CAUGHT THE BLACKOUT.
        //
        // The test above asserts the two pins AGREE. Both can agree and both be
        // unfetchable, which is what happened: 90391a6 pinned `50c3bf7` and
        // `d754cfc` in both places, they matched, and every CI run on main from
        // 2026-08-23 12:00 failed at the checkout step. actions/checkout treats a
        // ref as a commit ONLY at full 40-hex length; anything shorter goes down
        // the branch/tag path and it runs
        //
        //   git fetch --depth=1 origin +refs/heads/50c3bf7*:refs/remotes/origin/50c3bf7*
        //
        // which matches nothing and exits 1. Three retries, then the job dies at
        // step two — so lint, the entire suite, the mutation prover and the build
        // produced no verdict at all for seven consecutive commits on main.
        //
        // Agreement is not fetchability. This asserts the property that actually
        // has to hold, on the file CI reads.
        const workflow = readFileSync(join(SB3, '.github', 'workflows', 'ci.yml'), 'utf8');
        const pins = JSON.parse(readFileSync(join(SB3, 'test', 'fixtures', 'siblings.json'), 'utf8')).siblings;
        const FULL_SHA = /^[0-9a-f]{40}$/;

        const refs = [...workflow.matchAll(/repository:\s*(\S+)\s*\n\s*ref:\s*(\S+)/g)]
            .map((m) => ({ repo: m[1], ref: m[2] }));
        // Assert the walk's own yield: an empty list must never read as "all clean".
        assert.ok(refs.length >= Object.keys(pins).length,
            `found ${refs.length} pinned checkout steps in ci.yml but siblings.json pins ` +
            `${Object.keys(pins).length}. Either a step was removed or this scan stopped ` +
            'matching, and either way the check below would report a clean sweep over nothing.');

        for (const { repo, ref } of refs) {
            assert.match(ref, FULL_SHA,
                `ci.yml checks out ${repo} at ref "${ref}" (${ref.length} chars). ` +
                'actions/checkout resolves a commit only at the full 40 hex characters; ' +
                'anything shorter it fetches as `+refs/heads/<ref>*`, which matches no ' +
                'branch and fails the job before npm ci. Use the full SHA — `git rev-parse ' +
                `${ref}` + '` gives it — and keep test/fixtures/siblings.json equal to it.');
        }
        for (const [name, pin] of Object.entries(pins)) {
            assert.match(pin.rev, FULL_SHA,
                `test/fixtures/siblings.json pins ${name} at "${pin.rev}", which is not a ` +
                'full 40-character SHA. ci.yml copies this value verbatim and cannot fetch it.');
            if (pin.revShort) {
                assert.ok(pin.rev.startsWith(pin.revShort),
                    `${name}: revShort ${pin.revShort} is not a prefix of rev ${pin.rev}`);
            }
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
        //
        // TWO SPELLINGS, AND THE BASE DECIDES. This detector matched only the
        // `join(x, '..', '..', 'name')` ARRAY form, so device-coverage's
        // `resolve(here, '../../bw-board/src/board.js')` was invisible to it. The
        // audit records the same escape once before, in string form, in
        // scripts/vendor-downstream-extensions.mjs. A detector that knows one
        // spelling of a defect reports clean on the other.
        //
        // But the dot count alone is not the defect, and saying so would make this
        // cry wolf: `../..` is WRONG from the repo root and RIGHT from `test/`.
        // Several files legitimately write `resolve(here, '../../stc-compiler/…')`
        // and land exactly where they mean to. What is being asserted is the
        // resolved location — one level above this repo — so the base is read
        // together with the dots, and a base of `here`/`import.meta.dirname`/
        // `__dirname` (which is `test/`) makes `../..` correct.
        //
        // Prose is excluded before matching. The lite build guard learned this the
        // hard way counting waiver entries: an apostrophe in a comment read as a
        // quoted string and it reported an entry in a list with none. A guard that
        // miscounts is worse than no guard, so it does not get to read comments.
        const SIBLINGS = /^(bw-board|bw-circuit-ui|emu8051-stc|ucsim-stc|stc-compiler|brickwright-lite|bw-parts)$/;
        const TEST_DIR_BASE = /^(here|__dirname|import\.meta\.dirname)$/;
        const stripComments = (src) => src
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .split('\n').map((l) => l.replace(/(^|[^:"'`\\])\/\/.*$/, '$1')).join('\n');

        // One pass over every `join|resolve(BASE, …up…, 'sibling')`, in both the
        // array spelling and the string spelling, counting the `..` hops and
        // judging them against what BASE means. `test/` needs two; the repo root
        // needs one. Anything else lands somewhere nobody intended.
        const EXPECTED_HOPS = (base) => (TEST_DIR_BASE.test(base) ? 2 : 1);
        const PATH_CALL = /\b(?:join|resolve)\(\s*([\w.]+)\s*,\s*((?:(?:'\.\.'|"\.\.")\s*,\s*)+)['"`]([\w-]+)/g;
        const PATH_STRING = /\b(?:join|resolve)\(\s*([\w.]+)\s*,\s*['"`]((?:\.\.\/)+)([\w-]+)/g;

        const offenders = [];
        let scanned = 0;
        let siblingPathsSeen = 0;
        const judge = (f, base, hops, name, shown) => {
            if (!SIBLINGS.test(name)) return;
            siblingPathsSeen++;
            const want = EXPECTED_HOPS(base);
            if (hops === want) return;
            offenders.push(
                `${f}: ${shown} — ${hops} level(s) up from ${base}; ` +
                `${TEST_DIR_BASE.test(base) ? 'test/' : 'the repo root'} needs ${want}`);
        };
        for (const f of readdirSync(join(SB3, 'test'))) {
            if (!f.endsWith('.mjs')) continue;
            scanned++;
            const code = stripComments(readFileSync(join(SB3, 'test', f), 'utf8'));
            for (const m of code.matchAll(PATH_CALL)) {
                judge(f, m[1], (m[2].match(/\.\./g) || []).length, m[3],
                    `join(${m[1]}, ${m[2].trim().replace(/,\s*$/, '')}, '${m[3]}')`);
            }
            for (const m of code.matchAll(PATH_STRING)) {
                judge(f, m[1], (m[2].match(/\.\./g) || []).length, m[3],
                    `(${m[1]}, '${m[2]}${m[3]}…')`);
            }
        }
        // Assert the walk's own yield, both halves. An empty offender list must
        // mean "looked and found none", never "found no files" or "every pattern
        // stopped matching". MEASURED 2026-08-23: 90 files, 24 sibling paths.
        assert.ok(scanned >= 40,
            `only ${scanned} test files scanned (expected >= 90) — the walk, not the ` +
            'tree, is what changed, and an empty offender list below would be a fiction');
        assert.ok(siblingPathsSeen >= 15,
            `the scan recognised only ${siblingPathsSeen} sibling path expressions ` +
            '(expected ~24). Every pattern here may have stopped matching, in which ' +
            'case a clean result says nothing.');
        assert.deepEqual(offenders, [],
            'a sibling checkout sits one level above this REPO, which is two levels ' +
            `above test/ — these resolve somewhere else:\n  ${offenders.join('\n  ')}`);
    });

    test('no gate opens a corpus without a measured floor under it', async () => {
        // THE CLASS THE PREVIOUS SWEEPS COULD NOT SEE.
        //
        // test/CROSS-REPO-GATE-AUDIT.md closed "the gate never runs in CI" and
        // ended by naming what neither the skip-sweep nor the static cross-repo
        // detector can find: a gate that iterates a DISCOVERED list which is
        // empty. It does not skip and it does not fail — it emits zero subtests
        // and reports a clean pass. `all 0 benches: engine accepts, peripherals
        // reachable from the MCU` was green in this repo, over nothing.
        //
        // A file is corpus-driven when it discovers inputs from disk, or declares
        // its tests inside a loop over something that is not a literal written in
        // the file. It needs a floor: any assertion of a non-zero minimum on what
        // it found, or a corpusFloor() call (test/helpers/corpus-floor.mjs).
        //
        // WHAT THIS IS NOT. It is a static screen, so it produces SUSPECTS. The
        // authority is `node scripts/starve-gate.mjs`, which empties the corpus
        // and reads the verdict — and which refuses to call a gate vacuous unless
        // the starve demonstrably changed the gate's subtest count first.
        // Everything waived below was starved or read; none is waived for being
        // inconvenient.
        const { inventory, classify } = await import('../scripts/gate-inventory.mjs');
        const inv = inventory(SB3, 'sb3-creator');

        // Assert the instrument's own yield before believing its silence. An
        // acorn parse failure, a renamed directory or a broken pattern all return
        // "no offenders", which is the answer a broken instrument gives by
        // default. MEASURED 2026-08-23: 88 files, 47 of them corpus-driven.
        assert.ok(inv.rows.length >= 80,
            `the walk found only ${inv.rows.length} test files (expected ~88)`);
        const unparsed = inv.rows.filter((r) => r.parseError);
        assert.deepEqual(unparsed.map((r) => `${r.file}: ${r.parseError}`), [],
            'a file this screen could not parse is a file it silently did not check');
        const corpusDriven = inv.rows.filter(
            (r) => r.discovery.length || r.loopDrivenTests.length || r.loopDrivenAsserts);
        assert.ok(corpusDriven.length >= 40,
            `only ${corpusDriven.length} corpus-driven files recognised (expected ~47) — ` +
            'the classifier stopped seeing them, so an empty offender list means nothing');

        // Waived, each with the reason it is not the shape above. A waiver here
        // must say why an EMPTY corpus would still be caught, not merely that the
        // corpus is unlikely to empty.
        const WAIVED = new Map([
            ['test/authored-transform.test.mjs',
                'iterates bench.parts, but every case first asserts census[kind] === 1 on ' +
                'both the authored and transformed bench — an empty parts array fails there ' +
                'before the loop is reached.'],
            ['test/block-lowering.test.mjs',
                'iterates DEVICES_NO_C, a WAIVER set. Its assertion is "nothing in this gap ' +
                'list already has a C lowering", so an empty set is the goal state, not a ' +
                'blind spot. A floor here would forbid finishing the work.']
        ]);

        const offenders = [];
        for (const r of corpusDriven) {
            if (!classify(r).some((f) => f.startsWith('VACUITY-SUSPECT'))) continue;
            if (WAIVED.has(r.file)) continue;
            offenders.push(`${r.file} — opens [${
                r.iterationSources.map((x) => x.text).concat(r.discovery.map((d) => d.call)).join(', ')
            }] and asserts no minimum on it`);
        }
        assert.deepEqual(offenders, [],
            'these gates iterate a corpus with nothing asserting the corpus is non-empty, so ' +
            'they pass over an empty one:\n  ' + offenders.join('\n  ') +
            '\nAdd a MEASURED floor (test/helpers/corpus-floor.mjs), or waive it in this test ' +
            'with the reason an empty corpus would still be caught.');

        // A waiver for a file that no longer exists, or that no longer has the
        // shape, is an exemption outliving its cause — how allowlists rot.
        const stale = [...WAIVED.keys()].filter(
            (f) => !corpusDriven.some((r) => r.file === f));
        assert.deepEqual(stale, [],
            `these waivers name files that are gone or no longer corpus-driven: ${stale.join(', ')}`);
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
