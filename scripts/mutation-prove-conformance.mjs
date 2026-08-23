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
//   node scripts/mutation-prove-conformance.mjs

import { readFileSync, writeFileSync, existsSync, lstatSync, rmSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GATES = [
    join(ROOT, 'test', 'stc12-conformance.test.mjs'),
    join(ROOT, 'test', 'extension-coverage.test.mjs')
];
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
    if (!resolve(path).startsWith(ROOT + '/')) throw new Error(`instrument check: ${path} is outside the repo`);
}

function runGate () {
    try {
        execFileSync(process.execPath, ['--test', ...GATES], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
        return { red: false, out: '' };
    } catch (e) { return { red: true, out: `${e.stdout || ''}${e.stderr || ''}` }; }
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

const base = runGate();
if (base.red) { console.error('\nFAIL: the gate is already red before any mutation.'); process.exit(1); }
console.log('\nBaseline: gate is GREEN\n');

let failures = 0;
for (const m of MUTATIONS) {
    let result;
    try {
        m.apply();
        result = runGate();
    } finally {
        if (m.restore) m.restore();
        restoreAll();
    }
    const caught = result.red && m.expect.test(result.out);
    if (!caught) failures++;
    console.log(`${caught ? 'RED  ' : 'MISS '} ${m.name}`);
    console.log(`       ${m.why}`);
    if (!caught) console.log(`       expected ${m.expect} in output; red=${result.red}`);
}

const after = runGate();
if (after.red) { console.error('\nFAIL: the tree was not restored — the gate is red after the run.'); process.exit(1); }
console.log(`\nRestored: gate is GREEN again`);
console.log(`${MUTATIONS.length - failures}/${MUTATIONS.length} mutations caught`);
process.exit(failures === 0 ? 0 : 1);
