#!/usr/bin/env node
/**
 * Every literal in a gate or in CI config that BOUNDS something — and whether
 * anyone ever measured it.
 *
 * WHY THIS EXISTS
 * ---------------
 * The CI blackout of 2026-08-23 (docs/GATE-INVENTORY.md, finding 1) taught
 * something larger than itself: **a threshold tuned while its gate was not
 * running is a number with no evidence behind it.** Three surfaced by accident
 * on the day the gates came back:
 *
 *   - `gallery-e2e`'s 420 s `--test-timeout`, never once tested against the file
 *     it bounds because that file skipped whenever the pins were broken. Actual
 *     run: 242 s. The bound was a guess that happened to hold.
 *   - eslint's implicit "lint everything from the root", which had only ever run
 *     on a tree with no siblings in it.
 *   - `circuit-corpus-invariants`' corpus pin of 1034, correct until a vendor
 *     added 58 circuits.
 *
 * Those three were found by tripping over them. This finds the rest.
 *
 * WHAT IT COLLECTS. A **bounding literal** is a number written into a gate or a
 * CI config that decides a verdict: a floor under a corpus, a ceiling over a
 * waiver list, a timeout, a numeric tolerance, a retry count, a size cap, a
 * concurrency limit. Not every number — `i < arr.length` bounds a loop, not a
 * verdict, and including those drowns the sweep the way tables drowned the
 * vacuity screen before it learned to tell a corpus from a table.
 *
 * WHAT IT CANNOT DECIDE. Whether a threshold is CORRECT. It reports whether a
 * measurement is *recorded next to it* — a date, an "expected ~N", the word
 * MEASURED — which is a claim about the comment, not about the world. Re-measuring
 * is a separate step and its results are written back into the source, next to the
 * number, so the next reader does not have to repeat it.
 *
 * INSTRUMENT DISCIPLINE. acorn, not grep (GNU grep stops silently at a NUL byte).
 * No symlink is followed out of the tree. The scan asserts its own yield, because
 * an empty result is what every broken scanner returns by default.
 *
 *   node scripts/threshold-inventory.mjs             # table
 *   node scripts/threshold-inventory.mjs --json
 *   node scripts/threshold-inventory.mjs --unevidenced
 */

import { readFileSync, readdirSync, existsSync, lstatSync, realpathSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ walking */

const SKIP_KEYS = new Set(['loc', 'start', 'end', 'range']);

function walk (node, visit, parents = []) {
    if (!node || typeof node.type !== 'string') return;
    visit(node, parents);
    const chain = parents.concat(node);
    for (const key of Object.keys(node)) {
        if (SKIP_KEYS.has(key)) continue;
        const v = node[key];
        if (Array.isArray(v)) {
            for (const c of v) if (c && typeof c.type === 'string') walk(c, visit, chain);
        } else if (v && typeof v.type === 'string') {
            walk(v, visit, chain);
        }
    }
}

const src = (t, n) => t.slice(n.start, n.end);
const oneLine = (s, max = 96) => {
    const t = String(s).replace(/\s+/g, ' ').trim();
    return t.length > max ? t.slice(0, max - 1) + '…' : t;
};
const lineOf = (t, i) => t.slice(0, i).split('\n').length;

function dotted (node) {
    if (!node) return null;
    if (node.type === 'Identifier') return node.name;
    if (node.type === 'MemberExpression' && !node.computed) {
        const o = dotted(node.object);
        return o && node.property.type === 'Identifier' ? o + '.' + node.property.name : null;
    }
    return null;
}

/* -------------------------------------------------------------- the evidence */

/**
 * Is a measurement RECORDED next to this line?
 *
 * Looks at the comment block immediately above (and the line itself) for the
 * shape of an actual observation: a date, "MEASURED", "expected ~N", "observed",
 * "counted", "actual:". A number alone is not evidence — restating the threshold
 * in prose is what an unevidenced threshold usually looks like.
 */
const EVIDENCE = /\bMEASURED\b|\b20\d\d-\d{2}-\d{2}\b|expected\s*[~≈]\s*[\d,]|\bobserved\b|\bcounted\b|\bactual\b\s*[:=]|\bmeasured\b/i;

function evidenceFor (lines, lineNo, ownText = '') {
    // Three places a measurement legitimately lives, and all three count:
    //
    //   1. the contiguous comment block ABOVE the line;
    //   2. the assertion's own failure MESSAGE — `expected ~37` in the string a
    //      reader sees when it fires is evidence in the place it is most useful;
    //   3. a comment block above the enclosing statement, reached by stepping
    //      over the statement's own continuation lines.
    //
    // (2) is why `ownText` is passed. Without it, kcl-residual's
    // `netsChecked >= 30` read as unevidenced while its message says
    // "(expected ~37)" two lines down — a false accusation, and a sweep that
    // accuses correct code is a sweep people stop reading.
    const window = [lines[lineNo - 1] || '', ownText];
    let i = lineNo - 2;
    // Step over continuation lines of the same statement (a `+`-joined message,
    // a closing paren) before looking for the comment block.
    while (i >= 0 && /^\s*([)\]}]|['"`+]|\.\w)/.test(lines[i])) i--;
    for (; i >= 0 && i > lineNo - 40; i--) {
        const l = lines[i];
        if (/^\s*(\/\/|\*|\/\*)/.test(l) || /^\s*#/.test(l) || l.trim() === '') {
            window.unshift(l);
            if (l.trim() === '' && window.length > 3) break;
        } else break;
    }
    const text = window.join('\n');
    const m = text.match(EVIDENCE);
    if (!m) return { evidenced: false, quote: null };
    const hit = text.split('\n').find((l) => EVIDENCE.test(l));
    return { evidenced: true, quote: oneLine(hit || m[0], 90) };
}

/* ------------------------------------------------------------------- sources */

/** Option keys whose numeric value is a bound on time, size or parallelism. */
const OPTION_BOUNDS = new Map([
    ['timeout', 'timeout-ms'],
    ['test-timeout', 'timeout-ms'],
    ['maxBuffer', 'size-cap'],
    ['concurrency', 'concurrency'],
    ['testConcurrency', 'concurrency'],
    ['retries', 'retry'],
    ['tolerance', 'tolerance'],
    ['limit', 'size-cap'],
    ['maxWarnings', 'ceiling']
]);

/** Assertion callees — a comparison inside one of these decides a verdict. */
function isVerdictCall (node) {
    if (node.type !== 'CallExpression') return null;
    const d = dotted(node.callee);
    if (!d) return null;
    if (d === 'assert' || /^assert(\.strict)?\./.test(d)) return 'assert';
    if (d === 'corpusFloor') return 'corpusFloor';
    return null;
}

function classifyComparison (op, numOnRight) {
    // `count > 5`  -> floor.   `count < 5` -> ceiling.  Mirrored when the literal
    // is on the left: `5 < count` is a floor.
    if (numOnRight) return ['>', '>='].includes(op) ? 'floor' : 'ceiling';
    return ['<', '<='].includes(op) ? 'floor' : 'ceiling';
}

export function scanSource (path, repoRoot) {
    const text = readFileSync(path, 'utf8');
    const lines = text.split('\n');
    const rel = relative(repoRoot, path).split(sep).join('/');
    const out = [];
    let ast;
    try {
        ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module' });
    } catch {
        try { ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'script' }); } catch (e) {
            return { file: rel, parseError: String(e.message), thresholds: [] };
        }
    }

    /** The enclosing assert/corpusFloor call, whose message may carry the evidence. */
    const enclosingCallText = (parents) => {
        for (let i = parents.length - 1; i >= 0; i--) {
            if (isVerdictCall(parents[i])) return src(text, parents[i]);
        }
        return '';
    };

    const add = (node, kind, value, what, parents = []) => {
        const line = lineOf(text, node.start);
        out.push({
            file: rel, line, kind, value, what: oneLine(what, 96),
            ...evidenceFor(lines, line, enclosingCallText(parents))
        });
    };

    walk(ast, (n, parents) => {
        // --- a numeric comparison inside an assertion or an if-throw guard
        if (n.type === 'BinaryExpression' && ['>', '>=', '<', '<='].includes(n.operator)) {
            const rightNum = n.right.type === 'Literal' && typeof n.right.value === 'number';
            const leftNum = n.left.type === 'Literal' && typeof n.left.value === 'number';
            if (!rightNum && !leftNum) return;
            const num = rightNum ? n.right : n.left;
            // Only when it decides a verdict: inside an assert, or an if that throws.
            //
            // AND THE TWO HAVE OPPOSITE POLARITY, which cost a wrong answer before
            // it was noticed. `assert.ok(x < 80)` says x must STAY BELOW 80 — a
            // ceiling. `if (x < 80) throw` says x must STAY ABOVE 80 — a floor,
            // spelled as its own negation. Classifying by the operator alone read
            // device-coverage's `if (engineKinds.length < 80) throw` as a ceiling,
            // and scripts/threshold-probe.mjs then dropped it to -1, where the
            // throw can never fire, and reported CANNOT-FIRE. The probe was right
            // that something was broken; it was the classifier.
            let decisive = false;
            let negated = false;
            for (let i = parents.length - 1; i >= 0 && !decisive; i--) {
                const p = parents[i];
                if (isVerdictCall(p)) decisive = true;
                if (p.type === 'IfStatement' && p.test === (parents[i + 1] || n)) {
                    const b = p.consequent;
                    if (b && (b.type === 'ThrowStatement' ||
                        (b.type === 'BlockStatement' && b.body.some((x) => x.type === 'ThrowStatement')))) {
                        decisive = true;
                        negated = true;      // the condition describes the FAILURE
                    }
                }
                if (p.type === 'FunctionDeclaration' || p.type === 'ForStatement') break;
            }
            if (!decisive) return;
            const isFloat = !Number.isInteger(num.value);
            let kind = classifyComparison(n.operator, rightNum);
            if (negated) kind = kind === 'floor' ? 'ceiling' : 'floor';
            add(n, isFloat ? 'tolerance' : kind, num.value, src(text, n), parents);
            return;
        }

        // --- corpusFloor('what', () => n, FLOOR, 'note')
        if (n.type === 'CallExpression' && dotted(n.callee) === 'corpusFloor') {
            const a0 = n.arguments[0];
            const a2 = n.arguments[2];
            if (a2 && a2.type === 'Literal' && typeof a2.value === 'number') {
                add(n, 'floor', a2.value,
                    'corpusFloor(' + (a0 && a0.type === 'Literal' ? JSON.stringify(a0.value) : '…') + ')',
                    parents.concat(n));
            }
            return;
        }

        // --- option-object bounds: { timeout: N }, { maxBuffer: N }
        if (n.type === 'Property' && !n.computed) {
            const key = n.key.name || n.key.value;
            if (!OPTION_BOUNDS.has(key)) return;
            let v = n.value;
            // `15 * 60 * 1000` and `Number(env || 900000)` both carry a literal.
            const lit = (function first (x, d = 0) {
                if (!x || d > 5) return null;
                if (x.type === 'Literal' && typeof x.value === 'number') return x;
                for (const k of ['left', 'right', 'argument', 'consequent', 'alternate']) {
                    const r = first(x[k], d + 1);
                    if (r) return r;
                }
                if (x.type === 'CallExpression') for (const a of x.arguments) {
                    const r = first(a, d + 1);
                    if (r) return r;
                }
                if (x.type === 'LogicalExpression') return first(x.right, d + 1) || first(x.left, d + 1);
                return null;
            })(v);
            if (!lit) return;
            // Report the evaluated value where it is a plain product of literals.
            let value = lit.value;
            if (v.type === 'BinaryExpression') {
                try {
                    const f = new Function('return (' + src(text, v).replace(/[^0-9*+\-/(). ]/g, '') + ')');
                    const r = f();
                    if (Number.isFinite(r)) value = r;
                } catch { /* keep the literal */ }
            }
            add(n, OPTION_BOUNDS.get(key), value, src(text, n), parents);
            return;
        }

        // --- Math.abs(a - b) < TOL, already covered by the comparison branch.
        // --- a bare `.size <= N` ceiling on a waiver Set is covered too.
    });

    return { file: rel, thresholds: out };
}

/* ------------------------------------------------------------------ CI/YAML */

/** Bounding literals in workflow YAML and package.json scripts. */
const YAML_BOUNDS = [
    [/^\s*timeout-minutes:\s*(\d+)\s*$/gm, 'timeout-min', 'job/step timeout'],
    [/--test-timeout[= ](\d+)/g, 'timeout-ms', '--test-timeout'],
    [/--test-concurrency[= ](\d+)/g, 'concurrency', '--test-concurrency'],
    [/--max-warnings[= ](\d+)/g, 'ceiling', 'eslint --max-warnings'],
    [/^\s*fetch-depth:\s*(\d+)\s*$/gm, 'size-cap', 'checkout fetch-depth'],
    [/^\s*node-version:\s*(\d+)\s*$/gm, 'pin', 'node-version'],
    [/max-old-space-size=(\d+)/g, 'size-cap', 'node heap cap'],
    [/ceilings\s*=\s*\{([^}]*)\}/g, 'ceiling', 'waiver-list ceilings']
];

export function scanConfig (path, repoRoot) {
    const text = readFileSync(path, 'utf8');
    const lines = text.split('\n');
    const rel = relative(repoRoot, path).split(sep).join('/');
    const out = [];
    for (const [re, kind, what] of YAML_BOUNDS) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text)) !== null) {
            const line = lineOf(text, m.index);
            if (kind === 'ceiling' && what === 'waiver-list ceilings') {
                for (const p of m[1].split(',')) {
                    const kv = p.match(/(\w+)\s*:\s*(\d+)/);
                    if (kv) {
                        out.push({
                            file: rel, line, kind, value: Number(kv[2]),
                            what: 'ceiling ' + kv[1], ...evidenceFor(lines, line)
                        });
                    }
                }
                continue;
            }
            out.push({
                file: rel, line, kind, value: Number(m[1]), what,
                ...evidenceFor(lines, line)
            });
        }
    }
    return { file: rel, thresholds: out };
}

/* -------------------------------------------------------------- collection */

function filesUnder (dir, match, out = []) {
    if (!existsSync(dir)) return out;
    const real = realpathSync(dir);
    for (const name of readdirSync(dir).sort()) {
        const p = join(dir, name);
        if (lstatSync(p).isSymbolicLink()) continue;
        if (!realpathSync(p).startsWith(real)) continue;
        if (statSync(p).isDirectory()) continue;
        if (match.test(name)) out.push(p);
    }
    return out;
}

export function inventory (repoRoot, label) {
    const rows = [];
    for (const f of filesUnder(join(repoRoot, 'test'), /\.test\.mjs$/)) {
        rows.push({ ...scanSource(f, repoRoot), repo: label, sort: 'gate' });
    }
    for (const f of filesUnder(join(repoRoot, 'test', 'helpers'), /\.mjs$/)) {
        rows.push({ ...scanSource(f, repoRoot), repo: label, sort: 'helper' });
    }
    for (const f of filesUnder(join(repoRoot, 'scripts'), /\.mjs$/)) {
        rows.push({ ...scanSource(f, repoRoot), repo: label, sort: 'script' });
    }
    for (const f of filesUnder(join(repoRoot, '.github', 'workflows'), /\.ya?ml$/)) {
        rows.push({ ...scanConfig(f, repoRoot), repo: label, sort: 'ci' });
    }
    const pkg = join(repoRoot, 'package.json');
    if (existsSync(pkg)) rows.push({ ...scanConfig(pkg, repoRoot), repo: label, sort: 'ci' });
    const esl = join(repoRoot, 'eslint.config.js');
    if (existsSync(esl)) rows.push({ ...scanConfig(esl, repoRoot), repo: label, sort: 'ci' });
    return { repo: label, root: repoRoot, rows };
}

export const allThresholds = (inv) => inv.rows.flatMap((r) => (r.thresholds || []).map((t) => ({ ...t, sort: r.sort })));

/* --------------------------------------------------------------------- main */

const invokedDirectly = process.argv[1] &&
    realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));

if (invokedDirectly) {
    const LITE = process.env.BW_LITE || resolve(ROOT, '..', 'lego', 'brickwright-lite');
    const invs = [inventory(ROOT, 'sb3-creator')];
    if (existsSync(join(LITE, 'test'))) invs.push(inventory(LITE, 'brickwright-lite'));
    else console.error('NOTE: brickwright-lite not found at ' + LITE + ' — set BW_LITE');

    if (process.argv.includes('--markdown')) {
        const esc = (t) => String(t).replace(/\|/g, '\\|').replace(/`/g, '\u0060');
        for (const inv of invs) {
            const t = allThresholds(inv);
            console.log('\n### `' + inv.repo + '` — ' + t.length + ' bounding literals\n');
            const byKind = {};
            for (const x of t) (byKind[x.kind] = byKind[x.kind] || []).push(x);
            console.log('| kind | count | with a recorded measurement |');
            console.log('|---|---|---|');
            for (const [k, xs] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) {
                console.log('| ' + k + ' | ' + xs.length + ' | ' + xs.filter((x) => x.evidenced).length + ' |');
            }
            console.log('\n| where | kind | value | bounds | measurement |');
            console.log('|---|---|---|---|---|');
            for (const x of t) {
                console.log('| `' + x.file + ':' + x.line + '` | ' + x.kind + ' | `' + x.value + '` | `' +
                    esc(x.what) + '` | ' + (x.evidenced ? esc(x.quote) : '**not recorded**') + ' |');
            }
        }
    } else if (process.argv.includes('--json')) {
        console.log(JSON.stringify(invs.map((i) => ({
            repo: i.repo, thresholds: allThresholds(i),
            parseErrors: i.rows.filter((r) => r.parseError).map((r) => r.file + ': ' + r.parseError)
        })), null, 2));
    } else {
        const only = process.argv.includes('--unevidenced');
        for (const inv of invs) {
            const t = allThresholds(inv);
            const shown = only ? t.filter((x) => !x.evidenced) : t;
            console.log('\n=== ' + inv.repo + ' — ' + t.length + ' bounding literals in ' +
                new Set(t.map((x) => x.file)).size + ' files ===');
            let last = null;
            for (const x of shown) {
                if (x.file !== last) { console.log('\n  ' + x.file); last = x.file; }
                console.log('    ' + String(x.line).padStart(5) + '  ' +
                    x.kind.padEnd(12) + String(x.value).padStart(10) + '  ' +
                    (x.evidenced ? '  ' : 'UNEVIDENCED ') + x.what);
            }
            const bad = t.filter((x) => !x.evidenced);
            console.log('\n  ' + (t.length - bad.length) + '/' + t.length +
                ' carry a recorded measurement; ' + bad.length + ' do not.');
            const errs = inv.rows.filter((r) => r.parseError);
            if (errs.length) console.log('  PARSE ERRORS: ' + errs.map((r) => r.file).join(', '));
        }
    }
}
