#!/usr/bin/env node
/**
 * Starve a gate of its corpus and require it to notice.
 *
 * `scripts/gate-inventory.mjs` is a static screen and produces SUSPECTS. This is
 * the instrument that promotes a suspect to a finding, or clears it: it takes the
 * corpus a gate opens, empties it, runs the gate, and reads the verdict.
 *
 *   RED   the gate has a floor under it and said so.       -> healthy
 *   GREEN the gate passed over nothing at all.              -> VACUOUS
 *
 * THE INSTRUMENT CHECK, which is the whole reason this is a script and not a
 * shell one-liner. A green result has two possible causes and only one of them is
 * a finding:
 *
 *   (a) the gate is vacuous — it passed over an empty corpus;
 *   (b) THE STARVE NEVER APPLIED — the import did not resolve to the stub, the
 *       directory rename landed somewhere else, a second path supplied the same
 *       fact. The gate then ran normally and passed normally.
 *
 * (b) has burned this project three times (test/CROSS-REPO-GATE-AUDIT.md, "the
 * prover disagreed with itself"). So every starve here is required to CHANGE AN
 * OBSERVABLE: the gate's subtest count must drop, or the run is reported as
 * INSTRUMENT-FAILED and no claim is made either way. A mutation is only evidence
 * if the thing it mutates is load-bearing in the environment it runs in.
 *
 * TWO STARVE MECHANISMS
 *   module  — an import-path swap via a module.register() resolve hook. Chosen
 *             over editing the corpus file because editing a file that may be
 *             reached through a symlink writes into a sibling repo; swapping the
 *             specifier is unambiguous about which module actually loaded.
 *   dir     — rename the corpus directory aside and put an empty one in its
 *             place, restoring in a finally. Used where the corpus is the
 *             filesystem itself and there is no specifier to swap.
 *
 *   node scripts/starve-gate.mjs                  # every configured starve
 *   node scripts/starve-gate.mjs transparency     # one, by substring
 *   node scripts/starve-gate.mjs --json
 */

import { execFileSync } from 'node:child_process';
import {
    existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync, lstatSync, realpathSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOOK = join(ROOT, 'scripts', 'helpers', 'starve-hook.mjs');

/* ------------------------------------------------------------------ the set */

/**
 * Each entry names a gate, the corpus it opens, and how to empty it.
 *
 * `expectRed: false` is not a waiver — it is a gate for which starving is
 * meaningless (the corpus is a table in the file, or the gate is a cross-repo
 * guard whose property is about absence). Those are not listed at all.
 */
export const STARVES = [
    {
        gate: 'test/transparency.test.mjs',
        why: 'the round-trip convergence invariant — one of the four the project names',
        mechanism: 'module',
        target: 'src/utils/examples.js',
        stub: 'export default {};\n'
    },
    {
        gate: 'test/extensions.test.mjs',
        why: 'extension blocks transpile to runnable code — a named invariant',
        mechanism: 'module',
        target: 'src/utils/examples.js',
        stub: 'export default {};\n'
    },
    {
        gate: 'test/roundtrip.test.mjs',
        why: 'all examples transpile and recompile — a named invariant',
        mechanism: 'module',
        target: 'src/utils/examples.js',
        stub: 'export default {};\n'
    },
    {
        gate: 'test/exec.test.mjs',
        why: 'every example EXECUTES with no runtime error — a named invariant',
        mechanism: 'module',
        target: 'src/utils/examples.js',
        stub: 'export default {};\n'
    },
    {
        gate: 'test/comments.test.mjs',
        why: '# comments survive as native Scratch block comments — a named invariant',
        mechanism: 'module',
        target: 'src/utils/examples.js',
        stub: 'export default {};\n'
    },
    {
        gate: 'test/device-coverage.test.mjs',
        why: 'every device opcode has a lowering; the opcode list is derived, not written',
        mechanism: 'module',
        target: 'src/utils/examples.js',
        stub: 'export default {};\n'
    },
    {
        gate: 'test/gallery-roundtrip.test.mjs',
        why: 'the shipped gallery round-trips; its corpus is discovered from examples/',
        mechanism: 'dir',
        target: 'examples'
    },
    {
        gate: 'test/gallery.test.mjs',
        why: 'the gallery contract, over a discovered examples/ tree',
        mechanism: 'dir',
        target: 'examples'
    },
    {
        gate: 'test/example-corpus-contract.test.mjs',
        why: 'the corpus contract itself, over a discovered examples/ tree',
        mechanism: 'dir',
        target: 'examples'
    },
    {
        gate: 'test/circuit-json-roundtrip.test.mjs',
        why: 'circuit.json round-trips, over a discovered examples/ tree',
        mechanism: 'dir',
        target: 'examples'
    }
];

/* -------------------------------------------------------------------- runner */

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const filters = argv.filter((a) => !a.startsWith('--'));

/** Count `ok N` / `not ok N` top-level subtest lines, which is the observable. */
function summarise (out) {
    const num = (re) => {
        const m = out.match(re);
        return m ? Number(m[1]) : null;
    };
    return {
        tests: num(/^# tests (\d+)$/m),
        pass: num(/^# pass (\d+)$/m),
        fail: num(/^# fail (\d+)$/m),
        skipped: num(/^# skipped (\d+)$/m)
    };
}

function runGate (gate, { env = {}, hookArg = null } = {}) {
    const args = [];
    if (hookArg) args.push('--import', hookArg);
    args.push('--test', '--test-timeout', '420000', gate);
    try {
        const out = execFileSync(process.execPath, args, {
            cwd: ROOT, encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024,
            env: { ...process.env, ...env }
        });
        return { code: 0, out, ...summarise(out) };
    } catch (e) {
        const out = String(e.stdout || '') + String(e.stderr || '');
        return { code: e.status === undefined ? -1 : e.status, out, ...summarise(out) };
    }
}

/** Refuse to touch anything that is not a real, in-repo path. */
function assertInRepo (p) {
    const real = realpathSync(existsSync(p) ? p : dirname(p));
    if (!real.startsWith(realpathSync(ROOT) + sep)) {
        throw new Error(`instrument check: ${p} resolves to ${real}, outside this checkout. Refusing.`);
    }
    if (existsSync(p) && lstatSync(p).isSymbolicLink()) {
        throw new Error(`instrument check: ${p} is a SYMLINK — starving it would empty whatever it points at. Refusing.`);
    }
}

function withStarve (entry, fn) {
    if (entry.mechanism === 'module') {
        const target = join(ROOT, entry.target);
        assertInRepo(target);
        const tmp = mkdtempSync(join(tmpdir(), 'bw-starve-'));
        const stubPath = join(tmp, 'stub.mjs');
        writeFileSync(stubPath, entry.stub);
        // The hook maps the RESOLVED path of `target` to the stub. Reported by
        // the hook on stderr so a run can be checked to have actually swapped.
        const cfg = JSON.stringify({ from: target, to: stubPath });
        try {
            return fn({ env: { BW_STARVE: cfg }, hookArg: HOOK });
        } finally {
            rmSync(tmp, { recursive: true, force: true });
        }
    }
    if (entry.mechanism === 'dir') {
        const dir = join(ROOT, entry.target);
        assertInRepo(dir);
        if (!existsSync(dir)) throw new Error(`instrument check: ${dir} does not exist`);
        const aside = dir + '.starved-aside';
        if (existsSync(aside)) throw new Error(`instrument check: ${aside} already exists — a previous run did not restore. Refusing.`);
        renameSync(dir, aside);
        mkdirSync(dir);
        try {
            return fn({});
        } finally {
            rmSync(dir, { recursive: true, force: true });
            renameSync(aside, dir);
            if (!existsSync(dir)) throw new Error(`RESTORE FAILED: ${dir} is gone. Recover from ${aside}.`);
        }
    }
    throw new Error('unknown mechanism ' + entry.mechanism);
}

export function starve (entry) {
    const before = runGate(entry.gate);
    const after = withStarve(entry, (opts) => runGate(entry.gate, opts));

    const applied = after.tests !== null && before.tests !== null && after.tests < before.tests;
    const hookSaid = /BW_STARVE: swapped/.test(after.out);

    let verdict;
    if (after.code !== 0) verdict = 'RED';                       // the gate noticed
    else if (!applied && !hookSaid) verdict = 'INSTRUMENT-FAILED';
    else verdict = 'GREEN-ON-EMPTY';                             // the finding

    return {
        gate: entry.gate,
        why: entry.why,
        mechanism: entry.mechanism,
        target: entry.target,
        verdict,
        before: { tests: before.tests, pass: before.pass, fail: before.fail, code: before.code },
        after: { tests: after.tests, pass: after.pass, fail: after.fail, code: after.code },
        evidence: verdict === 'RED'
            ? (after.out.match(/^ *(?:not ok \d+ - .*|# fail \d+|.*Error.*)$/gm) || []).slice(0, 6).join('\n')
            : after.out.slice(-600)
    };
}

/* --------------------------------------------------------------------- main */

const invokedDirectly = process.argv[1] &&
    realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));

if (invokedDirectly) {
    const set = filters.length
        ? STARVES.filter((s) => filters.some((f) => s.gate.includes(f)))
        : STARVES;
    if (!set.length) {
        console.error('no starve matches ' + filters.join(' '));
        process.exit(2);
    }
    const results = [];
    for (const entry of set) {
        process.stderr.write('starving ' + entry.gate + ' … ');
        let r;
        try {
            r = starve(entry);
        } catch (e) {
            r = { gate: entry.gate, verdict: 'INSTRUMENT-FAILED', evidence: String(e.message) };
        }
        process.stderr.write(r.verdict + '\n');
        results.push(r);
    }
    if (asJson) {
        console.log(JSON.stringify(results, null, 2));
    } else {
        console.log('\n' + '='.repeat(78));
        for (const r of results) {
            console.log(`${r.verdict.padEnd(18)} ${r.gate}`);
            if (r.before) {
                console.log(`   corpus present: ${r.before.tests} tests, exit ${r.before.code}`);
                console.log(`   corpus EMPTY  : ${r.after.tests} tests, exit ${r.after.code}`);
            }
            if (r.verdict !== 'RED') console.log('   ' + String(r.evidence).replace(/\n/g, '\n   '));
        }
        const bad = results.filter((r) => r.verdict !== 'RED');
        console.log('='.repeat(78));
        console.log(`${results.length - bad.length}/${results.length} gates go RED when starved`);
        for (const r of bad) console.log('  ' + r.verdict + ': ' + r.gate);
    }
    process.exit(results.some((r) => r.verdict === 'INSTRUMENT-FAILED') ? 3 : 0);
}
