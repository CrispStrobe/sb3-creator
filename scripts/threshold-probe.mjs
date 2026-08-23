#!/usr/bin/env node
/**
 * Can this threshold fire, and how much room is left before it does?
 *
 * `scripts/threshold-inventory.mjs` finds every bounding literal and reports
 * whether a measurement is written next to it. That is a claim about the comment.
 * This asks the world.
 *
 * TWO QUESTIONS, and they are different:
 *
 *   CAN IT FIRE?   Replace the literal with a value that must trip — a floor
 *                  raised to an absurd number, a ceiling dropped to -1 — and
 *                  require the gate to go RED. A threshold that stays green
 *                  under that is not a threshold; it is decoration, and it
 *                  usually means the code path never runs.
 *
 *   WHAT IS THE MARGIN?  Walk the literal towards the observed value until the
 *                  gate flips. The flip point IS the measurement: a floor of 30
 *                  that first goes red at 37 tells you the corpus has 36. That
 *                  number goes back into the source, next to the threshold, so
 *                  nobody has to run this again.
 *
 * INSTRUMENT DISCIPLINE, in the tradition this repo has paid for twice:
 *
 *   - the rewrite is asserted to have CHANGED the file (a no-op edit that scores
 *     as a pass is how a prover's number goes up while its coverage goes down);
 *   - it refuses to touch a symlink or anything resolving outside this checkout;
 *   - the original is restored in a `finally`, and the restore is verified;
 *   - a gate that is ALREADY red before the probe is reported as UNTESTABLE
 *     rather than scored, because a red that was already there proves nothing;
 *   - a run that exceeds its budget is HUNG, never "caught". Killing a gate and
 *     calling that RED is a lie facing the other way.
 *
 *   node scripts/threshold-probe.mjs --file test/ctarget.test.mjs --line 972
 *   node scripts/threshold-probe.mjs --kind ceiling          # every ceiling
 *   node scripts/threshold-probe.mjs --kind timeout-ms --margin
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, lstatSync, realpathSync, existsSync } from 'node:fs';
import { resolve, dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventory, allThresholds } from './threshold-inventory.mjs';
import { locate, PINS, describeSiblings } from '../test/helpers/siblings.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUDGET_MS = Number(process.env.BW_PROBE_TIMEOUT_MS || 10 * 60 * 1000);

/* ---------------------------------------------------------------- guardrails */

/**
 * The rig must be the rig CI uses, or nothing measured here transfers.
 *
 * PAID FOR ON 2026-08-23. This probe reported `gallery.test.mjs` and
 * `gallery-e2e.test.mjs` as UNTESTABLE — "already red before the probe" — and
 * both were green on `main`. The pins had moved (`d754cfc` -> `b5761ad`) in a
 * merge and the probe was still pointed at detached worktrees on the old ones,
 * where `wireEndpoint is not a function`. Two findings retracted, and they were
 * findings about my checkout, not about the repo.
 *
 * That is the "a result that reverses may mean the SUBJECT moved" rule from
 * test/CROSS-REPO-GATE-AUDIT.md, arriving through the front door. A probe whose
 * verdict depends on which revision happens to be beside it must say so before
 * it says anything else.
 */
function assertRigMatchesPins () {
    const problems = [];
    const notes = [];
    for (const name of Object.keys(PINS.siblings)) {
        const s = locate(name);
        if (!s.path) { problems.push(`${name}: not reachable (set ${name === 'bw-board' ? 'BW_BOARD' : 'BW_CIRCUIT_UI'})`); continue; }
        if (!s.matchesPin) problems.push(`${name}: rig is at ${s.sha}, test/fixtures/siblings.json pins ${s.pinned.slice(0, 7)}`);
        if (!s.dirty) continue;
        // "Dirty" is not one thing, and collapsing it to a boolean makes this
        // check either too loud to keep or too quiet to trust. NAME the paths.
        //
        // The case that forced this: bw-board TRACKS `node_modules` as a symlink
        // to an absolute macOS path (mode 120000, blob content
        // `/Users/.../bw-board/node_modules`), so it dangles in every Linux
        // clone and `avr8js` resolves from nowhere. Replacing it with a real
        // directory is the only way to run the gates here — and it makes the
        // worktree permanently "dirty" in a way that says nothing about the
        // source under test. PLAN.md §27 carries the fix, which belongs upstream.
        let paths = [];
        try {
            paths = execFileSync('git', ['-C', s.path, 'status', '--porcelain'],
                { encoding: 'utf8', stdio: 'pipe' })
                .split('\n').filter(Boolean).map((l) => l.slice(3).trim());
        } catch { paths = ['(could not read git status)']; }
        const source = paths.filter((f) => !/^node_modules(\/|$)/.test(f));
        if (source.length) {
            problems.push(`${name}: SOURCE is modified (${source.slice(0, 5).join(', ')}` +
                `${source.length > 5 ? `, +${source.length - 5} more` : ''}) — this run is not reproducible`);
        } else {
            notes.push(`${name}: dirty only in node_modules (${paths.join(', ')}), which is not ` +
                'source; bw-board tracks a node_modules symlink that dangles on Linux. Proceeding.');
        }
    }
    for (const n of notes) console.error('  NOTE  ' + n);
    if (!problems.length) return;
    console.error('\nRIG DOES NOT MATCH THE PINS — refusing to report:\n  ' + problems.join('\n  '));
    console.error('\n' + describeSiblings());
    console.error('\nEvery cross-repo verdict below would be about this checkout rather than about ' +
        'the repo. Point BW_BOARD / BW_CIRCUIT_UI at the pinned revisions, or pass ' +
        '--allow-rig-drift if you genuinely mean to measure something else.');
    process.exit(4);
}

function assertProbeable (rel) {
    const p = join(ROOT, rel);
    if (!existsSync(p)) throw new Error(`instrument check: ${rel} does not exist`);
    const st = lstatSync(p);
    if (st.isSymbolicLink()) {
        throw new Error(`instrument check: ${rel} is a SYMLINK — editing it would change ` +
            'another tree and the verdict would say nothing about this one. Refusing.');
    }
    const realRoot = realpathSync(ROOT);
    const real = realpathSync(p);
    if (!real.startsWith(realRoot + sep)) {
        throw new Error(`instrument check: ${rel} resolves to ${real}, outside this checkout. Refusing.`);
    }
    return p;
}

/** Replace the Nth number on one line. Asserts the edit changed the file. */
function rewriteLiteral (path, line, from, to) {
    const before = readFileSync(path, 'utf8');
    const lines = before.split('\n');
    const idx = line - 1;
    if (idx < 0 || idx >= lines.length) throw new Error(`line ${line} is outside ${path}`);
    // Match the literal as a whole number token, so 5 does not match inside 4500.
    const token = new RegExp(`(?<![\\w.])${String(from).replace('.', '\\.')}(?![\\w.])`);
    if (!token.test(lines[idx])) {
        throw new Error(
            `instrument check: literal ${from} not found on ${path}:${line} — the line reads ` +
            `"${lines[idx].trim()}". A probe that edits nothing scores as robustness.`);
    }
    lines[idx] = lines[idx].replace(token, String(to));
    const after = lines.join('\n');
    if (after === before) throw new Error('instrument check: rewrite was a no-op');
    writeFileSync(path, after);
    return () => {
        writeFileSync(path, before);
        if (readFileSync(path, 'utf8') !== before) throw new Error(`RESTORE FAILED for ${path}`);
    };
}

/** Which test file owns a threshold. A helper or script is probed via its gate. */
function owningGate (rel) {
    if (/^test\/[\w.-]+\.test\.mjs$/.test(rel)) return rel;
    return null;   // helpers, scripts and CI config need an explicit --gate
}

/**
 * Extra environment for the gate run. Needed because a threshold can sit behind
 * an environment condition — `device-coverage.test.mjs`'s CI-only floor lives
 * inside `if (!IN_CI) … return;`, so on a developer box it is never reached and
 * the probe reports CANNOT-FIRE for a threshold that is perfectly sound. That is
 * a statement about the environment, not about the number, and the fix is to
 * reproduce the environment rather than to weaken the verdict:
 *
 *     node scripts/threshold-probe.mjs --file test/device-coverage.test.mjs --env CI=true
 */
const EXTRA_ENV = {};

function runGate (gate) {
    try {
        execFileSync(process.execPath, ['--test', join(ROOT, gate)], {
            cwd: ROOT, encoding: 'utf8', stdio: 'pipe',
            timeout: BUDGET_MS, maxBuffer: 64 * 1024 * 1024,
            env: { ...process.env, ...EXTRA_ENV }
        });
        return { red: false, out: '' };
    } catch (e) {
        if (e.killed || e.signal === 'SIGTERM') return { red: false, hung: true, out: 'exceeded ' + BUDGET_MS + ' ms' };
        return { red: true, out: `${e.stdout || ''}${e.stderr || ''}` };
    }
}

/**
 * Did any test in this file actually EXECUTE?
 *
 * A green run over an all-skipped file is not evidence about a threshold inside
 * it. `ttl-module-acceptance.test.mjs` is the case: every test skips without
 * `BW_TTL_ORACLE=1` plus Java, Digital.jar and a cloned 8bitsim, so moving its
 * 30 s subprocess timeout to 1 ms changes nothing and the naive verdict is
 * CANNOT-FIRE — which reads as "this bound is decoration" when the truth is
 * "this bound was never reached". Wave 1 spent a whole audit on the difference
 * between a skip and a pass; repeating the confusion inside the instrument built
 * to find it would be poor form.
 *
 * A run WITHOUT `--test-only` output cannot be attributed per-threshold, so this
 * is decided at file granularity, which is honest and sufficient: if nothing in
 * the file ran, nothing in the file was measured.
 */
function executedAnything (gate) {
    try {
        const out = execFileSync(process.execPath, ['--test', join(ROOT, gate)], {
            cwd: ROOT, encoding: 'utf8', stdio: 'pipe',
            timeout: BUDGET_MS, maxBuffer: 64 * 1024 * 1024,
            env: { ...process.env, ...EXTRA_ENV }
        });
        const n = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
        const pass = n(/^# pass (\d+)$/m);
        const skipped = n(/^# skipped (\d+)$/m);
        const tests = n(/^# tests (\d+)$/m);
        return { ran: !(pass !== null && skipped !== null && pass <= skipped && skipped === tests), pass, skipped, tests };
    } catch {
        return { ran: true };   // it failed, so something ran
    }
}

/* -------------------------------------------------------------------- probes */

/** A value that must trip this kind of bound. */
export function trippingValue (kind, value) {
    switch (kind) {
    case 'floor':       return Math.max(value * 10, value + 1_000_000);
    case 'ceiling':     return -1;
    case 'tolerance':   return 0;              // no slack at all
    case 'timeout-ms':
    case 'timeout-min': return 1;              // nothing finishes in 1
    case 'concurrency': return 1;
    default:            return null;           // pins and size caps: no safe trip
    }
}

export function probe (t, { gate = owningGate(t.file), margin = false } = {}) {
    const base = { ...t, gate };
    if (!gate) return { ...base, verdict: 'NO-GATE' };
    const path = assertProbeable(t.file);

    const pre = runGate(gate);
    if (pre.hung) return { ...base, verdict: 'HUNG', detail: pre.out };
    if (pre.red) return { ...base, verdict: 'UNTESTABLE', detail: 'gate is already red before the probe' };

    const trip = trippingValue(t.kind, t.value);
    if (trip === null) return { ...base, verdict: 'NOT-PROBEABLE', detail: 'no safe tripping value for ' + t.kind };

    let restore = null;
    let result;
    try {
        restore = rewriteLiteral(path, t.line, t.value, trip);
        result = runGate(gate);
    } finally {
        if (restore) restore();
    }
    if (result.hung) return { ...base, trip, verdict: 'HUNG', detail: result.out };
    if (!result.red) {
        // Before calling a bound decoration, ask whether anything in the file ran.
        const ex = executedAnything(gate);
        if (!ex.ran) {
            return {
                ...base, trip, verdict: 'NOT-REACHED',
                detail: `every test in ${gate} skipped (${ex.skipped}/${ex.tests}), so this ` +
                        'bound was never exercised. That is a fact about the environment, not ' +
                        'about the number — supply what the file needs, or --env, and re-probe.'
            };
        }
        return {
            ...base, trip, verdict: 'CANNOT-FIRE',
            detail: `${t.kind} moved ${t.value} -> ${trip} and the gate stayed green ` +
                    `(${ex.pass} ran, ${ex.skipped} skipped of ${ex.tests}). Either the code ` +
                    'path this bounds does not execute, or the tests that use it are among ' +
                    'the skipped ones — check the skip reasons before calling it decoration.'
        };
    }

    const out = { ...base, trip, verdict: 'CAN-FIRE' };
    if (margin) out.margin = findMargin(t, path, gate);
    return out;
}

/**
 * Binary-search the flip point: the tightest value at which the gate is still
 * green. `observed` is then that value (for a floor) — the real measurement.
 */
function findMargin (t, path, gate) {
    let lo = t.value;                                   // known green
    let hi = trippingValue(t.kind, t.value);            // known red
    if (t.kind !== 'floor' && t.kind !== 'ceiling') return null;
    for (let i = 0; i < 24 && Math.abs(hi - lo) > 1; i++) {
        const mid = Math.round((lo + hi) / 2);
        if (mid === lo || mid === hi) break;
        let restore = null;
        let r;
        try {
            restore = rewriteLiteral(path, t.line, t.value, mid);
            r = runGate(gate);
        } finally { if (restore) restore(); }
        if (r.hung) return { error: 'a probe run hung; margin unknown' };
        if (r.red) hi = mid; else lo = mid;
    }
    // `lo` is the tightest value at which the gate is still green, and for BOTH
    // kinds that equals the observed quantity: `x >= F` is green iff F <= x, so
    // the tightest green F is x; `x <= C` is green iff C >= x, so the tightest
    // green C is x too. (An earlier draft returned `hi` for a ceiling and was off
    // by one — it read the ctarget warning count as 3 where both this search and
    // a direct count say 4.)
    return {
        greenUpTo: lo,
        redFrom: hi,
        observed: lo,
        headroomPct: t.value ? Math.round((Math.abs(lo - t.value) / Math.abs(t.value || 1)) * 100) : null
    };
}

/* --------------------------------------------------------------------- main */

const invokedDirectly = process.argv[1] &&
    realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));

if (invokedDirectly) {
    const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
    const wantFile = arg('--file');
    const wantLine = arg('--line') ? Number(arg('--line')) : null;
    const wantKind = arg('--kind');
    const gateArg = arg('--gate');
    const margin = process.argv.includes('--margin');
    for (let i = 0; i < process.argv.length; i++) {
        if (process.argv[i] !== '--env') continue;
        const [k, ...v] = String(process.argv[i + 1] || '').split('=');
        if (k) EXTRA_ENV[k] = v.join('=');
    }
    if (Object.keys(EXTRA_ENV).length) {
        console.log('gate environment: ' + Object.entries(EXTRA_ENV).map(([k, v]) => k + '=' + v).join(' '));
    }

    let ts = allThresholds(inventory(ROOT, 'sb3-creator'));
    if (wantFile) ts = ts.filter((t) => t.file === wantFile);
    if (wantLine) ts = ts.filter((t) => t.line === wantLine);
    if (wantKind) ts = ts.filter((t) => t.kind === wantKind);
    ts = ts.filter((t) => gateArg || owningGate(t.file));
    if (!ts.length) { console.error('no threshold matched'); process.exit(2); }

    if (!process.argv.includes('--allow-rig-drift')) assertRigMatchesPins();
    console.log(describeSiblings());
    console.log(`\nprobing ${ts.length} threshold(s)\n`);
    const results = [];
    for (const t of ts) {
        process.stderr.write(`  ${t.file}:${t.line} ${t.kind}=${t.value} … `);
        let r;
        try { r = probe(t, { gate: gateArg || owningGate(t.file), margin }); }
        catch (e) { r = { ...t, verdict: 'INSTRUMENT-FAILED', detail: e.message }; }
        process.stderr.write(r.verdict + '\n');
        results.push(r);
    }
    console.log();
    for (const r of results) {
        console.log(`${r.verdict.padEnd(17)} ${r.file}:${r.line}  ${r.kind}=${r.value}  ${r.what || ''}`);
        if (r.detail) console.log('     ' + r.detail);
        if (r.margin) {
            console.log(`     margin: green up to ${r.margin.greenUpTo}, red from ${r.margin.redFrom} ` +
                `-> observed ${r.margin.observed}, headroom ${r.margin.headroomPct}%`);
        }
    }
    const can = results.filter((r) => r.verdict === 'CAN-FIRE').length;
    console.log(`\n${can}/${results.length} thresholds demonstrably can fire`);
    for (const r of results.filter((x) => x.verdict !== 'CAN-FIRE')) {
        console.log('  ' + r.verdict + ': ' + r.file + ':' + r.line);
    }
    process.exit(results.some((r) => r.verdict === 'INSTRUMENT-FAILED') ? 3 : 0);
}
