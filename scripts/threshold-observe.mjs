#!/usr/bin/env node
/**
 * What number does this gate ACTUALLY see? Every bound in a file, from one run.
 *
 * THE PROBLEM THIS SOLVES. `scripts/threshold-probe.mjs` answers *can it fire*
 * and *where is the flip point*, and it answers them one literal at a time by
 * rewriting the number and re-running the gate. That is the right instrument for
 * a bound whose quantity nobody can compute — but it costs a whole gate run per
 * question, and phase 2 of this campaign opened with 126 literals owing a
 * measurement. At a minute a run that is not a sweep, it is a career.
 *
 * The observation that collapses it: the flip point of `files.length > 1500` is
 * not a search result, it is `files.length`. The gate already computes the
 * number. It just never says it out loud.
 *
 * So this does not move the threshold at all. It rewrites each decisive
 * comparison
 *
 *     files.length > 1500
 *
 * into one that reports the quantity on its way past, and is otherwise the same
 * expression:
 *
 *     ((__v) => (globalThis.__thrObserve('test/f.test.mjs:101', __v), __v > 1500))(files.length)
 *
 * One run of the file then yields the observed value of EVERY bound in it, with
 * the verdict unchanged — a gate that was green stays green, which is itself the
 * check that the rewrite was faithful.
 *
 * INSTRUMENT DISCIPLINE, in this repo's tradition:
 *
 *   - the bounded expression is evaluated EXACTLY ONCE. An earlier shape,
 *     `(report(files.length), files.length > 1500)`, evaluates it twice, and
 *     `readYieldMap(cOf(SCHEDULED, {debug: true})).length > 0` is a compile. The
 *     arrow parameter is not cosmetic;
 *   - the rewrite is asserted to have changed the file, and the file is restored
 *     in a `finally` AND from a signal handler, because a killed process has no
 *     `finally` — paid for on 2026-08-29 by a probe that left a bisection
 *     midpoint on disk;
 *   - it refuses symlinks and anything resolving outside this checkout;
 *   - **an observation is only trusted when the file stayed GREEN.** If the
 *     rewrite reddened the gate, the numbers it printed describe a program this
 *     repo does not have, and they are discarded rather than reported;
 *   - it reports how many of the file's bounds it actually saw. A comparison
 *     inside a branch that did not execute yields nothing, and *not observed* is
 *     a different answer from *observed to be zero*.
 *
 *   node scripts/threshold-observe.mjs --file test/kcl-residual.test.mjs
 *   node scripts/threshold-observe.mjs --file test/gallery.test.mjs --json
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, lstatSync, realpathSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, dirname, join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { scanSource } from './threshold-inventory.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUDGET_MS = Number(process.env.BW_OBSERVE_TIMEOUT_MS || 15 * 60 * 1000);

const PENDING = new Set();
const restoreAll = (why) => {
    for (const r of Array.from(PENDING)) {
        try { r(); } catch (e) { console.error('  RESTORE FAILED during ' + why + ': ' + e.message); }
    }
};
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(sig, () => { restoreAll(sig); process.exit(130); });
}
process.on('exit', () => restoreAll('exit'));

function assertEditable (rel) {
    const p = join(ROOT, rel);
    if (!existsSync(p)) throw new Error(`instrument check: ${rel} does not exist`);
    if (lstatSync(p).isSymbolicLink()) {
        throw new Error(`instrument check: ${rel} is a SYMLINK — editing it would change another tree.`);
    }
    if (!realpathSync(p).startsWith(realpathSync(ROOT) + sep)) {
        throw new Error(`instrument check: ${rel} resolves outside this checkout. Refusing.`);
    }
    return p;
}

/**
 * Rewrite every decisive comparison in one file to report its bounded quantity.
 * Returns {restore, sites} where `sites` is keyed by the id embedded in the source.
 */
export function instrument (rel, sink) {
    const path = assertEditable(rel);
    const before = readFileSync(path, 'utf8');
    const found = scanSource(path, ROOT).thresholds.filter((t) => Array.isArray(t.span));
    if (!found.length) return { restore: () => {}, sites: [], path };

    // Back to front, so every span stays valid as the text grows.
    const ordered = [...found].sort((a, b) => b.span[0] - a.span[0]);
    let text = before;
    const sites = [];
    for (const t of ordered) {
        const id = `${t.file}:${t.line}:${t.span[0]}`;
        const original = text.slice(t.span[0], t.span[1]);
        // The literal may legitimately appear twice (`Math.abs(a - 300) <= 300`),
        // so the replacement is positional, never a string search.
        const lit = String(t.value);
        const rebuilt = t.numOnRight
            ? `__thrV ${t.operator} ${lit}`
            : `${lit} ${t.operator} __thrV`;
        text = text.slice(0, t.span[0]) +
            `((__thrV) => (globalThis.__thrObserve(${JSON.stringify(id)}, __thrV), ${rebuilt}))(${t.otherSrc})` +
            text.slice(t.span[1]);
        sites.push({ ...t, id, original });
    }
    if (text === before) throw new Error('instrument check: rewrite was a no-op');
    writeFileSync(path, text);
    const restore = () => {
        PENDING.delete(restore);
        writeFileSync(path, before);
        if (readFileSync(path, 'utf8') !== before) throw new Error(`RESTORE FAILED for ${path}`);
    };
    PENDING.add(restore);
    void sink;
    return { restore, sites, path };
}

/** Run one instrumented gate and collect what it saw. */
export function observe (rel) {
    const dir = mkdtempSync(join(tmpdir(), 'thr-observe-'));
    const out = join(dir, 'observed.ndjson');
    const preload = join(dir, 'preload.mjs');
    // A module preloaded with --import installs the sink before the gate loads.
    // Appending one line per observation keeps it robust to a crash mid-run: a
    // partial file is still a set of real observations.
    writeFileSync(preload, `import { appendFileSync } from 'node:fs';\n` +
        `globalThis.__thrObserve = (id, v) => {\n` +
        `  try { appendFileSync(${JSON.stringify(out)}, JSON.stringify({ id, v: typeof v === 'number' ? v : String(v) }) + '\\n'); }\n` +
        `  catch { /* an observation lost is better than a gate broken */ }\n` +
        `};\n`);

    let sites = [];
    let restore = null;
    let red = false;
    let hung = false;
    let stdout = '';
    try {
        const inst = instrument(rel);
        sites = inst.sites;
        restore = inst.restore;
        if (!sites.length) return { file: rel, sites: [], observations: [], red: false, note: 'no decisive comparison in this file' };
        try {
            stdout = execFileSync(process.execPath, ['--import', preload, '--test', join(ROOT, rel)], {
                cwd: ROOT, encoding: 'utf8', stdio: 'pipe',
                timeout: BUDGET_MS, maxBuffer: 64 * 1024 * 1024
            });
        } catch (e) {
            if (e.killed || e.signal === 'SIGTERM') hung = true;
            else { red = true; stdout = `${e.stdout || ''}${e.stderr || ''}`; }
        }
    } finally {
        if (restore) restore();
    }

    const seen = new Map();
    if (existsSync(out)) {
        for (const line of readFileSync(out, 'utf8').split('\n')) {
            if (!line.trim()) continue;
            let rec;
            try { rec = JSON.parse(line); } catch { continue; }
            const cur = seen.get(rec.id) || { values: new Set(), n: 0 };
            cur.values.add(rec.v);
            cur.n++;
            seen.set(rec.id, cur);
        }
    }
    rmSync(dir, { recursive: true, force: true });

    const observations = sites.map((s) => {
        const hit = seen.get(s.id);
        if (!hit) return { ...s, observed: null, times: 0 };
        const nums = [...hit.values].filter((v) => typeof v === 'number');
        return {
            ...s,
            observed: nums.length ? (nums.length === 1 ? nums[0] : { min: Math.min(...nums), max: Math.max(...nums) }) : [...hit.values][0],
            distinct: hit.values.size,
            times: hit.n
        };
    });
    return { file: rel, sites, observations, red, hung, stdout };
}

/* --------------------------------------------------------------------- main */

const invokedDirectly = process.argv[1] &&
    realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));

if (invokedDirectly) {
    const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
    const files = [];
    for (let i = 0; i < process.argv.length; i++) if (process.argv[i] === '--file') files.push(process.argv[i + 1]);
    if (!files.length) { console.error('usage: --file <test/x.test.mjs> [--file …] [--json]'); process.exit(2); }
    void arg;

    const all = [];
    for (const f of files) {
        const r = observe(f);
        all.push(r);
        if (process.argv.includes('--json')) continue;
        const state = r.hung ? 'HUNG' : r.red ? 'RED under instrumentation' : 'green';
        console.log(`\n${f} — ${state}, ${r.observations.filter((o) => o.times).length}/${r.sites.length} bounds observed`);
        if (r.red) {
            // The whole value of this instrument rests on the rewrite being
            // faithful. If the gate reddened, it was not, and printing the numbers
            // anyway would be reporting measurements of a program we do not have.
            console.log('  DISCARDED: the rewrite changed the verdict, so these observations describe ' +
                'a different program. Re-run threshold-probe on this file instead.');
            continue;
        }
        for (const o of r.observations) {
            const v = o.observed === null ? 'NOT REACHED' :
                (typeof o.observed === 'object' ? `${o.observed.min}…${o.observed.max}` : String(o.observed));
            console.log(`  ${String(o.line).padStart(5)}  ${o.kind.padEnd(9)} bound=${String(o.value).padEnd(8)} ` +
                `observed=${v.padEnd(14)} ${o.times ? `(${o.times}x, ${o.distinct} distinct)` : ''}  ${o.what}`);
        }
    }
    if (process.argv.includes('--json')) console.log(JSON.stringify(all, null, 2));
    process.exit(0);
}
