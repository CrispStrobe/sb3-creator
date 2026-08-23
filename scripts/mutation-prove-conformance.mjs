#!/usr/bin/env node
// Mutation proof for the stc12 conformance gate.
//
// A gate nobody has seen fail is a gate nobody should trust. This re-introduces,
// one at a time, each defect the gate claims to catch, runs the gate, and requires
// it to go RED — then restores the tree and checks it is green again.
//
// It also proves the INSTRUMENT, which is where this project has been burned:
// a mutation applied through a symlink edits the sibling repo instead of the
// snapshot and reads as "the gate caught it" when nothing was tested here at all.
// So every file this touches is checked with lstat for being a real file first,
// and the sibling-visibility of the run is reported rather than assumed.
//
// THE RULE THIS SCRIPT LEARNED THE HARD WAY
// ----------------------------------------
// A mutation is only evidence if the thing it mutates is LOAD-BEARING IN THE
// ENVIRONMENT THE MUTATION RUNS IN. Otherwise it is an unproven claim wearing a
// pass, and it is indistinguishable from robustness.
//
// This script scored 20/20 in a worktree with no sibling checkouts and 17/20 in a
// rig that had them. The three that differed were the env-mutations: locate() fell
// through to `../<name>` when BW_BOARD did not resolve, so `BW_BOARD=/nowhere`
// changed nothing on a machine that happened to have the sibling beside it. A
// prover whose score depends on its environment is not measuring what it claims,
// and the discrepancy — not either number — was the finding.
//
// The general source is REDUNDANCY: when two paths can supply the same fact, no
// single-step mutation is decisive, so redundant bootstrap steps must be mutated in
// combination. (bw-cui2 hit the same rule from the other side, where two
// registration paths each masked the other's absence and no one-step mutation could
// falsify the guard at all.)
//
// The repair, in both cases, is to assert that the mutated FACT actually changed —
// not merely that the mutation was applied. Here that is `expectVisibility` on every
// env-mutation, and the no-op check on every file mutation.
//
//   node scripts/mutation-prove-conformance.mjs

import { readFileSync, writeFileSync, existsSync, lstatSync, rmSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, dirname, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GATES = [
    join(ROOT, 'test', 'stc12-conformance.test.mjs'),
    join(ROOT, 'test', 'extension-coverage.test.mjs'),
    join(ROOT, 'test', 'a2-sampler-behavior.test.mjs'),
    // The cross-repo guard and the two files that police it. Added 2026-08-23 with
    // the fifteen-plus gates that skipped in CI — see test/CROSS-REPO-GATE-AUDIT.md.
    join(ROOT, 'test', 'gate-integrity.test.mjs'),
    // Wave 2 (docs/GATE-INVENTORY.md): the corpus floors, and the CI-fetchability
    // check that would have caught the blackout of 2026-08-23.
    join(ROOT, 'test', 'device-coverage.test.mjs')
];

/**
 * Gates whose property is "my corpus is still there". Proven by STARVING —
 * emptying the corpus and requiring red — because the defect is a corpus that
 * arrives empty, and an edit to the gate would prove the edit instead.
 */
const CORPUS_GATES = [
    'test/transparency.test.mjs', 'test/roundtrip.test.mjs', 'test/exec.test.mjs'
].map((p) => join(ROOT, p));

// Cross-repo gates, proven separately: their property is about what happens when
// the SIBLINGS are absent, so they are exercised by changing the environment
// rather than by editing a file. Editing them would prove the edit, not the guard.
const CROSS_REPO_GATES = [
    'test/bench-invariants.test.mjs', 'test/gate-canary.test.mjs',
    'test/example-corpus-contract.test.mjs', 'test/js-driver-oled-chain.test.mjs',
    'test/gallery-e2e.test.mjs', 'test/assert-physics.test.mjs',
    'test/generated-bench-layout.test.mjs', 'test/rail-short.test.mjs',
    'test/flat-variants.test.mjs', 'test/pico-oled-chain.test.mjs',
    'test/multimeter-chain.test.mjs', 'test/ctarget.test.mjs'
].map((p) => join(ROOT, p));
const DOWN = join(ROOT, 'test', 'fixtures', 'downstream');
const MANIFEST = join(DOWN, 'MANIFEST.json');
const sha256 = (t) => createHash('sha256').update(t, 'utf8').digest('hex');

/** Refuse to mutate anything that is not a real, in-repo file. */
function assertRealFile (path) {
    if (!existsSync(path)) throw new Error(`instrument check: ${path} does not exist`);
    const st = lstatSync(path);
    if (st.isSymbolicLink()) {
        throw new Error(
            `instrument check: ${path} is a SYMLINK. Mutating it would edit whatever it points ` +
            `at — most likely a sibling repo — and the gate's verdict would say nothing about ` +
            `this checkout. Refusing.`);
    }
    if (!st.isFile()) throw new Error(`instrument check: ${path} is not a regular file`);

    // Containment is decided on the REAL path, not the spelling. `resolve()` does
    // not follow symlinks, so with /tmp/lego -> /mnt/volume1/code/lego on this box
    // the same file has two legitimate spellings and a literal string check gets it
    // wrong in both directions: it would reject a path through /tmp that lands
    // inside this very checkout, and accept one that resolves into a different
    // tree entirely. (Refinement from bw-lessons, who mutation-proved both cases:
    // a symlinked path back into your own worktree must PASS.)
    const realRoot = realpathSync(ROOT);
    const realPath = realpathSync(path);
    if (realPath !== realRoot && !realPath.startsWith(realRoot + sep)) {
        throw new Error(
            `instrument check: ${path} resolves to ${realPath}, which is outside this checkout ` +
            `(${realRoot}). Mutating it would edit another tree and the verdict would say ` +
            `nothing about this one. Refusing.`);
    }
}

// A HANG IS NOT A VERDICT. Without a ceiling here, one gate that never returns
// turns the whole proof into a CI job that times out with nothing to say about
// whether any mutation was caught — and a timeout is silence, which is the state
// this entire campaign is about not accepting. Observed 2026-08-23: on a loaded
// box the twelve cross-repo gates took over ten minutes for one mutation, and
// there was no way to tell "slow" from "stuck" from the outside.
//
// A timeout is reported as its own outcome, never scored as caught: killing a gate
// and calling that RED would be the same lie in the other direction.
const GATE_TIMEOUT_MS = Number(process.env.BW_GATE_TIMEOUT_MS || 15 * 60 * 1000);

function runGate (files = GATES, env = {}) {
    try {
        execFileSync(process.execPath, ['--test', ...files], {
            cwd: ROOT, encoding: 'utf8', stdio: 'pipe',
            timeout: GATE_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024,
            env: { ...process.env, ...env }
        });
        return { red: false, out: '' };
    } catch (e) {
        if (e.killed || e.signal === 'SIGTERM') {
            return {
                red: false, timedOut: true,
                out: `gate run exceeded ${GATE_TIMEOUT_MS} ms and was killed — no verdict`
            };
        }
        return { red: true, out: `${e.stdout || ''}${e.stderr || ''}` };
    }
}

// A path that cannot exist, for proving the absent-sibling case without touching
// whatever this machine happens to have beside the repo.
const NOWHERE = join(ROOT, 'test', 'fixtures', '__no_such_sibling__');

/**
 * Ask siblings.mjs, in a subprocess under the given env, which siblings it can
 * see — and require the answer the mutation depends on. Without this an env
 * mutation can quietly change nothing and score as caught.
 */
function assertVisibility (env, expected, label) {
    // Absolute file: URL, not './…': a relative specifier here resolves against the
    // cwd of the subprocess rather than this script, which is both fragile and
    // unreadable to static import checks.
    const helper = pathToFileURL(join(ROOT, 'test', 'helpers', 'siblings.mjs')).href;
    const out = execFileSync(process.execPath, ['-e',
        `import(${JSON.stringify(helper)}).then(m=>{` +
        'const p=Object.keys(m.PINS.siblings).filter(n=>m.locate(n).path);' +
        "console.log(p.length===0?'none':p.join(','))})"],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ...env } }).trim();
    if (out !== expected) {
        throw new Error(
            `instrument check: mutation "${label}" expected sibling visibility "${expected}" ` +
            `but the environment yields "${out}". The mutation is a no-op here, so its verdict ` +
            `would mean nothing. (This is what made the prover report 20/20 without siblings ` +
            `and 17/20 with them.)`);
    }
}

/** Snapshot every file a mutation may touch, so restore is exact. */
const backups = new Map();
const save = (p) => { assertRealFile(p); backups.set(p, readFileSync(p, 'utf8')); };
const restoreAll = () => { for (const [p, t] of backups) writeFileSync(p, t); backups.clear(); };

const MUTATIONS = [
    {
        name: 'the original defect: an opcode the emitter emits is absent from the shipped copy',
        why: 'this is 2026-08-18..23 exactly — lite dropped 8 opcodes and CI stayed green',
        apply () {
            const f = join(DOWN, 'lite-stc12.js');
            save(f); save(MANIFEST);
            // Remove matrix_clear from the snapshot, and re-record its hash so the
            // integrity check is not what fires: the CONFORMANCE assertion must.
            // (It has to be an opcode the snapshot HAS — dropping one of the eight
            // it is already missing would be a no-op, which the guard below catches.)
            const text = readFileSync(f, 'utf8').replace(/\{\n\s*opcode: "matrix_clear",[\s\S]*?\n\s{10}\},\n/, '');
            if (text === readFileSync(f, 'utf8')) throw new Error('mutation was a no-op — the pattern did not match');
            writeFileSync(f, text);
            const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
            m.snapshots['lite-stc12'].sha256 = sha256(text);
            writeFileSync(MANIFEST, `${JSON.stringify(m, null, 2)}\n`);
        },
        expect: /does not define the opcodes|matrix_clear/
    },
    {
        name: 'a recorded gap is fixed upstream but the snapshot was never re-vendored',
        why: 'stops an exemption outliving its cause — the way allowlists normally rot',
        apply () {
            save(MANIFEST);
            const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
            m.snapshots['lite-stc12'].expectedMissing.push('a_gap_that_is_no_longer_there');
            writeFileSync(MANIFEST, `${JSON.stringify(m, null, 2)}\n`);
        },
        expect: /recorded gap is closed|does not define the opcodes/
    },
    {
        name: 'a gap is recorded anonymously, with no branch that closes it',
        why: 'an exemption with no owner is a permanent exemption',
        apply () {
            save(MANIFEST);
            const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
            delete m.snapshots['lite-stc12'].pendingFix;
            writeFileSync(MANIFEST, `${JSON.stringify(m, null, 2)}\n`);
        },
        expect: /pendingFix/
    },
    {
        name: 'a vendored snapshot is deleted (the CI-has-no-sibling case)',
        why: 'the whole bug: an absent input must fail, never skip',
        apply () {
            const f = join(DOWN, 'gallery-stc12.js');
            save(f); rmSync(f);
        },
        expect: /is missing from test\/fixtures\/downstream|fails rather than skips/,
        restore () { writeFileSync(join(DOWN, 'gallery-stc12.js'), backups.get(join(DOWN, 'gallery-stc12.js'))); }
    },
    {
        name: 'the manifest is deleted',
        why: 'no manifest means no comparison; that must be loud',
        apply () { save(MANIFEST); rmSync(MANIFEST); },
        expect: /MANIFEST\.json is missing/
    },
    {
        name: 'a snapshot is hand-edited instead of re-vendored',
        why: 'a snapshot that no longer matches its hash stands for nothing that ships',
        apply () {
            const f = join(DOWN, 'lite-stc12.js');
            save(f);
            writeFileSync(f, `${readFileSync(f, 'utf8')}\n// hand-edited\n`);
        },
        expect: /does not match the sha256/
    },
    {
        name: 'the opcode deriver stops matching (the instrument itself breaks)',
        why: 'a deriver that finds nothing makes every conformance assertion vacuous',
        apply () {
            const f = join(ROOT, 'src', 'utils', 'sb3Creator.js');
            save(f);
            writeFileSync(f, readFileSync(f, 'utf8').replace(/createBlock\('stc12_/g, "createBlock('stc12X_"));
        },
        expect: /deriver has stopped matching|found 0|vacuous/
    },
    {
        name: 'the emitter gains an opcode no copy defines',
        why: 'the forward direction: new emitter work must not outrun the extensions',
        apply () {
            const f = join(ROOT, 'src', 'utils', 'sb3Creator.js');
            save(f);
            const text = readFileSync(f, 'utf8');
            const anchor = "createBlock('stc12_toggle'";
            const at = text.indexOf(anchor);
            if (at < 0) throw new Error('mutation anchor not found');
            writeFileSync(f, `${text.slice(0, at)}createBlock('stc12_brandnew', {}); b.fields.PART = 1;\n        ${text.slice(at)}`);
        },
        expect: /brandnew/
    },
    {
        name: 'CI runs a cross-repo gate with no sibling checkout',
        why: 'THE defect: fifteen-plus gates skipped in CI for weeks and the skip read as a pass',
        env: { CI: 'true', BW_BOARD: NOWHERE, BW_CIRCUIT_UI: NOWHERE, BW_ALLOW_MISSING_SIBLINGS: '' },
        expectVisibility: 'none',
        run: () => runGate(CROSS_REPO_GATES,
            { CI: 'true', BW_BOARD: NOWHERE, BW_CIRCUIT_UI: NOWHERE, BW_ALLOW_MISSING_SIBLINGS: '' }),
        expect: /cannot run:.*is not beside this repo|FAILURE rather than a skip/
    },
    {
        name: 'the same run on a developer box (CI unset) skips instead of failing',
        why: 'the other half of the contract — a local checkout without siblings must not be red',
        env: { CI: '', GITHUB_ACTIONS: '', BW_BOARD: NOWHERE, BW_CIRCUIT_UI: NOWHERE },
        expectVisibility: 'none',
        invert: true,   // this one must stay GREEN
        run: () => runGate(CROSS_REPO_GATES,
            { CI: '', GITHUB_ACTIONS: '', BW_BOARD: NOWHERE, BW_CIRCUIT_UI: NOWHERE }),
        expect: /.*/
    },
    {
        name: 'the BW_ALLOW_MISSING_SIBLINGS opt-out still works in CI',
        why: 'an escape hatch nobody can use is not an escape hatch; it must be deliberate, not silent',
        env: { CI: 'true', BW_BOARD: NOWHERE, BW_CIRCUIT_UI: NOWHERE, BW_ALLOW_MISSING_SIBLINGS: '1' },
        expectVisibility: 'none',
        invert: true,
        run: () => runGate(CROSS_REPO_GATES,
            { CI: 'true', BW_BOARD: NOWHERE, BW_CIRCUIT_UI: NOWHERE, BW_ALLOW_MISSING_SIBLINGS: '1' }),
        expect: /.*/
    },
    {
        name: 'ci.yml stops checking out a sibling',
        why: 'the checkout step is what makes the gates run; losing it must be caught here',
        apply () {
            const f = join(ROOT, '.github', 'workflows', 'ci.yml');
            save(f);
            const text = readFileSync(f, 'utf8')
                .replace(/      - name: Check out bw-circuit-ui \(pinned\)\n(?:.*\n)*?          path: siblings\/bw-circuit-ui\n/, '');
            if (text === readFileSync(f, 'utf8')) throw new Error('mutation was a no-op');
            writeFileSync(f, text);
        },
        expect: /no pinned checkout step for bw-circuit-ui/
    },
    {
        name: 'ci.yml pins a different revision than test/fixtures/siblings.json',
        why: 'a drifted pin runs the gates against a revision nobody recorded',
        apply () {
            const f = join(ROOT, '.github', 'workflows', 'ci.yml');
            save(f);
            const text = readFileSync(f, 'utf8').replace('ref: 50c3bf7', 'ref: deadbee');
            if (text === readFileSync(f, 'utf8')) throw new Error('mutation was a no-op');
            writeFileSync(f, text);
        },
        expect: /but test\/fixtures\/siblings\.json pins/
    },
    {
        name: 'a cross-repo gate drops the shared guard and rolls its own skip',
        why: 'exactly how all fifteen got that way; a new file must not be able to repeat it',
        apply () {
            const f = join(ROOT, 'test', 'rail-short.test.mjs');
            save(f);
            const text = readFileSync(f, 'utf8')
                .replace("siblingGuardTest(gate, 'the rail-short corpus gate');", '');
            if (text === readFileSync(f, 'utf8')) throw new Error('mutation was a no-op');
            writeFileSync(f, text);
        },
        expect: /do not call siblingGuardTest/
    },
    {
        name: 'a sibling is pinned to a forbidden or non-permissive licence',
        why: 'CI clones these; an ngspice/KLU-family or copyleft pin must be argued, not slipped in',
        apply () {
            const f = join(ROOT, 'test', 'fixtures', 'siblings.json');
            save(f);
            const m = JSON.parse(readFileSync(f, 'utf8'));
            m.siblings['bw-board'].licence = 'GPL-2.0';
            writeFileSync(f, `${JSON.stringify(m, null, 2)}\n`);
        },
        expect: /not on the permissive list/
    },
    {
        name: 'a sibling root gains a second ".." (the multimeter-chain defect)',
        why: 'one extra .. points past the code tree, so the drift check skips everywhere, forever',
        apply () {
            const f = join(ROOT, 'scripts', 'vendor-downstream-extensions.mjs');
            save(f);
            const text = readFileSync(f, 'utf8').replace("'../lego/brickwright-lite'", "'../../lego/brickwright-lite'");
            if (text === readFileSync(f, 'utf8')) throw new Error('mutation was a no-op');
            writeFileSync(f, text);
        },
        expect: /points past the code tree|one level up from the repo root/
    },
    {
        name: 'the whenkey hat is declared a COMMAND instead of a HAT',
        why: 'the static gate cannot see this - same opcode, same arguments, same menus - '
            + 'but the script would load and never fire, which is the defect all over again',
        apply () {
            const f = join(ROOT, 'reference', 'extensions', 'stc12.js');
            save(f);
            const text = readFileSync(f, 'utf8').replace(
                /opcode: "whenkey",\n(\s*)blockType: Scratch\.BlockType\.HAT,/,
                'opcode: "whenkey",\n$1blockType: Scratch.BlockType.COMMAND,');
            if (text === readFileSync(f, 'utf8')) throw new Error('mutation was a no-op');
            writeFileSync(f, text);
        },
        expect: /must register as a hat|must be a HAT|did not fire/
    },
    {
        name: 'a shipped example authors an opcode no copy defines',
        why: 'the gallery side of the same bug: content outrunning the extensions',
        apply () {
            const f = join(ROOT, 'examples', '79-a2-sampler', 'program.bw');
            save(f);
            // `clear display X` lowers to seg_clear; point it at a verb nothing has.
            const text = readFileSync(f, 'utf8').replace('clear display', 'scroll display');
            if (text === readFileSync(f, 'utf8')) throw new Error('mutation was a no-op');
            writeFileSync(f, text);
        },
        expect: /authors exactly the A2 board verbs|does not define opcodes that|stc12_/
    },
    {
        name: 'the example-corpus walk stops finding opcodes (instrument breaks)',
        why: 'a walk that compiles nothing makes every coverage assertion vacuous',
        apply () {
            const f = join(ROOT, 'test', 'extension-coverage.test.mjs');
            save(f);
            writeFileSync(f, readFileSync(f, 'utf8')
                .replace("const program = join(EXAMPLES, id, 'program.bw');",
                    "const program = join(EXAMPLES, id, 'program.NOPE');"));
        },
        expect: /corpus walk is broken|examples compiled/
    },
    {
        name: 'ci.yml pins a sibling by abbreviated SHA (the 2026-08-23 blackout)',
        why: 'this exact edit took every CI run on main down at step two for seven commits; ' +
             'the old check compared the two pins to each other and both were unfetchable',
        apply () {
            const f = join(ROOT, '.github', 'workflows', 'ci.yml');
            const pins = join(ROOT, 'test', 'fixtures', 'siblings.json');
            save(f); save(pins);
            const full = '50c3bf7c2a7e0fb11cf6baaf4cc532a1b4443314';
            const before = readFileSync(f, 'utf8');
            const text = before.replace(`ref: ${full}`, `ref: ${full.slice(0, 7)}`);
            if (text === before) throw new Error('mutation was a no-op — the full ref was not found');
            writeFileSync(f, text);
            // Abbreviate the JSON pin to match, so the "the two agree" test is NOT
            // what fires. The point is that agreement is not fetchability, and only
            // the new check can tell the difference.
            const j = JSON.parse(readFileSync(pins, 'utf8'));
            j.siblings['bw-board'].rev = full.slice(0, 7);
            delete j.siblings['bw-board'].revShort;
            writeFileSync(pins, `${JSON.stringify(j, null, 2)}\n`);
        },
        expect: /actions\/checkout resolves a commit only at the full 40|not a full 40-character SHA/
    },
    {
        name: 'CI reads the committed device snapshot instead of the checked-out engine',
        why: 'device-coverage did exactly this on every CI run it ever had — 36 of 118 ' +
             'engine kinds were never checked, and the gate reported green',
        env: { CI: 'true', BW_BOARD: NOWHERE, BW_CIRCUIT_UI: NOWHERE, BW_ALLOW_MISSING_SIBLINGS: '1' },
        expectVisibility: 'none',
        run: () => runGate([join(ROOT, 'test', 'device-coverage.test.mjs')],
            { CI: 'true', BW_BOARD: NOWHERE, BW_CIRCUIT_UI: NOWHERE, BW_ALLOW_MISSING_SIBLINGS: '1' }),
        expect: /CI read the snapshot device list|is not looking at the engine/
    },
    {
        name: 'a gate loses the floor under its corpus (the screen catches it)',
        why: 'the floors are the whole wave-2 repair; without the detector they can be ' +
             'deleted one at a time and every gate stays green over nothing',
        apply () {
            // transparency.test.mjs, because its corpusFloor is its ONLY floor.
            // See the mutation below for why that qualifier is load-bearing.
            const f = join(ROOT, 'test', 'transparency.test.mjs');
            save(f);
            const before = readFileSync(f, 'utf8');
            const text = before.replace(/^corpusFloor\([\s\S]*?\);$/m, '');
            if (text === before) throw new Error('mutation was a no-op — no corpusFloor call matched');
            writeFileSync(f, text);
        },
        run: () => runGate([join(ROOT, 'test', 'gate-integrity.test.mjs')]),
        expect: /asserts no minimum on it|opens a corpus without a measured floor/
    },
    {
        name: 'a gate loses the floor under its corpus but keeps an unrelated one ' +
              '(only the starve catches it)',
        why: 'THE SCREEN CANNOT SEE THIS, and pretending otherwise is the whole failure ' +
             'mode. exec.test.mjs also asserts logs.filter(…).length === 2 in an unrelated ' +
             'test, so the file stays "floored" while its corpus is not. This mutation ' +
             'exists to keep that division of labour honest: it must be MISSED by ' +
             'gate-integrity and CAUGHT by starve-gate, and if either half ever changes, ' +
             'the claim in docs/GATE-INVENTORY.md is stale and this goes red.',
        apply () {
            const f = join(ROOT, 'test', 'exec.test.mjs');
            save(f);
            const before = readFileSync(f, 'utf8');
            const text = before.replace(/^corpusFloor\([\s\S]*?\);$/m, '');
            if (text === before) throw new Error('mutation was a no-op — no corpusFloor call matched');
            writeFileSync(f, text);
        },
        run: async () => {
            const screen = runGate([join(ROOT, 'test', 'gate-integrity.test.mjs')]);
            if (screen.red) {
                return { red: false, out: 'the screen caught it — docs/GATE-INVENTORY.md claims it cannot; update the claim' };
            }
            // Now the authority, on the same mutated tree.
            const { starve } = await import(pathToFileURL(join(ROOT, 'scripts', 'starve-gate.mjs')).href);
            const r = starve({
                gate: 'test/exec.test.mjs',
                why: 'proving the starve covers what the screen misses',
                mechanism: 'module',
                target: 'src/utils/examples.js',
                stub: 'export default {};\n'
            });
            return {
                red: r.verdict === 'RED',
                out: `screen: GREEN (expected) | starve: ${r.verdict} ` +
                     `(${r.before.tests} tests -> ${r.after.tests} tests)`
            };
        },
        expect: /starve: RED/
    },
    {
        name: 'a corpus waiver outlives the file it names',
        why: 'an exemption with nothing behind it is how allowlists rot; the same rule ' +
             'the manifest gaps already carry',
        apply () {
            const f = join(ROOT, 'test', 'gate-integrity.test.mjs');
            save(f);
            const before = readFileSync(f, 'utf8');
            const text = before.replace(
                "        const WAIVED = new Map([\n",
                "        const WAIVED = new Map([\n            ['test/a-gate-that-does-not-exist.test.mjs', 'stale'],\n");
            if (text === before) throw new Error('mutation was a no-op — the WAIVED map was not found');
            writeFileSync(f, text);
        },
        run: () => runGate([join(ROOT, 'test', 'gate-integrity.test.mjs')]),
        expect: /waivers name files that are gone|no longer corpus-driven/
    },
    {
        name: 'the vacuity screen itself stops recognising corpus-driven gates',
        why: 'an instrument that finds nothing returns the same answer as a clean tree; ' +
             'this is the yield assertion, and it is why the screen may be believed',
        apply () {
            const f = join(ROOT, 'scripts', 'gate-inventory.mjs');
            save(f);
            const before = readFileSync(f, 'utf8');
            // Make every loop look like a literal table, so nothing is corpus-driven.
            const text = before.replace(
                '        if (expr.type === \'ArrayExpression\') return null;               // inline literal',
                '        return null;');
            if (text === before) throw new Error('mutation was a no-op — the guard line was not found');
            writeFileSync(f, text);
        },
        run: () => runGate([join(ROOT, 'test', 'gate-integrity.test.mjs')]),
        expect: /corpus-driven files recognised|the classifier stopped seeing them/
    },
    {
        name: 'the examples corpus arrives empty (import-path swap, not an edit)',
        why: 'three of the four invariants this project names — exec, roundtrip, ' +
             'transparency — were satisfiable by an empty map',
        run: () => {
            // Swapping the SPECIFIER is unambiguous about which module loaded;
            // editing examples.js would be an edit to a file that may be reached
            // through a symlink. See scripts/starve-gate.mjs.
            const stub = join(ROOT, 'test', 'fixtures', '__starve_empty_examples.mjs');
            writeFileSync(stub, 'export default {};\n');
            try {
                const cfg = JSON.stringify({ from: join(ROOT, 'src', 'utils', 'examples.js'), to: stub });
                const hook = join(ROOT, 'scripts', 'helpers', 'starve-hook.mjs');
                try {
                    execFileSync(process.execPath, ['--import', hook, '--test', ...CORPUS_GATES],
                        { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, BW_STARVE: cfg } });
                    return { red: false, out: '' };
                } catch (e) {
                    const out = `${e.stdout || ''}${e.stderr || ''}`;
                    // Instrument check: the swap must have HAPPENED. A red run that
                    // did not load the stub proves something else entirely.
                    if (!/BW_STARVE: swapped/.test(out)) {
                        throw new Error('instrument check: the import swap never fired, so this red says nothing');
                    }
                    return { red: true, out };
                }
            } finally { rmSync(stub, { force: true }); }
        },
        expect: /corpus floor: examples/
    },
    {
        name: 'an affected example is left with no pendingFix naming the fix',
        why: 'the cost of an open gap must stay attached to an owner',
        apply () {
            save(MANIFEST);
            const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
            delete m.snapshots['gallery-stc12'].pendingFix;
            writeFileSync(MANIFEST, `${JSON.stringify(m, null, 2)}\n`);
        },
        expect: /pendingFix/
    }
];

console.log('Instrument check');
for (const f of [...GATES, MANIFEST, join(DOWN, 'lite-stc12.js'), join(DOWN, 'gallery-stc12.js'),
    join(ROOT, 'src', 'utils', 'sb3Creator.js')]) {
    assertRealFile(f);
    console.log(`  ok   real file, in-repo, not a symlink: ${f.slice(ROOT.length + 1)}`);
}
// Say plainly whether this run can see the siblings, so a green/red is never
// misread as covering more (or less) than it did.
const { SOURCES, locateLive } = await import('./vendor-downstream-extensions.mjs');
for (const s of SOURCES) console.log(`  --   sibling ${s.name}: ${locateLive(s) || 'not present (drift check will skip; conformance still runs)'}`);
const { describeSiblings, partialVisibility } = await import('../test/helpers/siblings.mjs');
console.log(describeSiblings());
const partial = partialVisibility();
if (partial) console.log(`  !!   ${partial.message}`);

const base = runGate();
if (base.red) { console.error('\nFAIL: the gate is already red before any mutation.'); process.exit(1); }
console.log('\nBaseline: gate is GREEN\n');

// `--only <substring>` runs a subset. Added because a full pass is 26 mutations,
// each a full run of five gates, and on a contended box that is hours — long
// enough that people stop running it, which is how a prover quietly stops being
// evidence. CI still runs the whole set; this is for proving one repair.
const ONLY = (() => {
    const i = process.argv.indexOf('--only');
    return i >= 0 ? process.argv[i + 1] : null;
})();
const SELECTED = ONLY ? MUTATIONS.filter((m) => m.name.includes(ONLY)) : MUTATIONS;
if (ONLY && !SELECTED.length) {
    console.error(`--only ${ONLY} matched none of the ${MUTATIONS.length} mutations`);
    process.exit(2);
}
if (ONLY) console.log(`--only ${ONLY}: ${SELECTED.length} of ${MUTATIONS.length} mutations\n`);

let failures = 0;
for (const m of SELECTED) {
    let result;
    try {
        if (m.apply) m.apply();
        // An env-mutation changes the inputs rather than the tree, which is the
        // right instrument for a guard whose whole subject is "what if the inputs
        // are absent". Editing the file would prove the edit, not the guard.
        //
        // But an env-mutation can be a no-op just as a bad replace() can, and
        // silently — `BW_BOARD=/nowhere` did nothing on a machine that had the
        // sibling beside the repo, so three mutations scored as passes while
        // changing nothing. A mutation that fails to bite is an UNPROVEN CLAIM,
        // not evidence of robustness. So verify the environment really produced
        // the state the mutation is about before believing the verdict.
        if (m.expectVisibility) assertVisibility(m.env, m.expectVisibility, m.name);
        result = m.run ? await m.run() : runGate();
    } finally {
        if (m.restore) m.restore();
        restoreAll();
    }
    // `invert` marks a mutation that must leave the gate GREEN — the developer-box
    // and opt-out cases. A guard that failed everywhere would "catch" everything
    // and be useless, so both directions are proven.
    const caught = !result.timedOut && (m.invert
        ? !result.red
        : (result.red && m.expect.test(result.out)));
    if (!caught) failures++;
    const label = result.timedOut ? 'HUNG ' : caught ? (m.invert ? 'GREEN' : 'RED  ') : 'MISS ';
    console.log(`${label} ${m.name}`);
    console.log(`       ${m.why}`);
    if (result.timedOut) console.log(`       ${result.out} — this is not a verdict, it is silence`);
    else if (!caught) console.log(`       expected ${m.expect} in output; red=${result.red}`);
}

const after = runGate();
if (after.red) { console.error('\nFAIL: the tree was not restored — the gate is red after the run.'); process.exit(1); }
console.log(`\nRestored: gate is GREEN again`);
console.log(`${SELECTED.length - failures}/${SELECTED.length} mutations caught` +
    (ONLY ? ` (--only ${ONLY}; ${MUTATIONS.length} exist)` : ''));
process.exit(failures === 0 ? 0 : 1);
