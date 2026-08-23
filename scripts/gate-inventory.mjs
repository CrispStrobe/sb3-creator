#!/usr/bin/env node
/**
 * Gate inventory: what every test file in this repo (and, when it is reachable,
 * brickwright-lite) actually promises.
 *
 * WHY THIS EXISTS
 * ---------------
 * `test/CROSS-REPO-GATE-AUDIT.md` closed the "gate never runs" class and its
 * final recommendation named the class it could not see:
 *
 *   > Neither the skip-sweep nor the static detector can see a test that
 *   > iterates a discovered list which is empty — it neither skips nor fails, it
 *   > passes having checked nothing. [...] the shape to assert is *every test
 *   > that iterates a discovered list asserts that list is non-empty*.
 *
 * That is what this walks for. It reads BYTES and parses with acorn rather than
 * grepping, for the reason recorded in that audit: GNU grep stops silently at a
 * NUL byte, and an absence is the answer every broken instrument returns by
 * default. It also refuses to follow symlinks out of the tree it was pointed at,
 * because a scan that resolves through `/tmp/lego` reports another session's
 * coverage as this one's.
 *
 * FOUR FACTS PER FILE, which is the whole point:
 *   runs      — does it run in CI? (and in `npm run test:fast`, which is what
 *               people actually run while iterating, and which skips most files)
 *   skips     — does it skip, and on what condition?
 *   asserts   — does it assert anything that could be false?
 *   vacuity   — does it open a corpus without a floor under it?
 *
 * WHAT A FLAG HERE IS AND IS NOT. This is a static screen, so it produces
 * SUSPECTS, not findings. A suspect is promoted to a finding only by starving
 * the gate — emptying the corpus it opens — and observing that it still passes.
 * `scripts/starve-gate.mjs` does that, and nothing in docs/GATE-INVENTORY.md is
 * called vacuous without a starve run behind it.
 *
 *   node scripts/gate-inventory.mjs            # human-readable table
 *   node scripts/gate-inventory.mjs --json     # machine-readable
 */

import { readFileSync, readdirSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ walking */

const SKIP_KEYS = new Set(['loc', 'start', 'end', 'range', 'leadingComments', 'trailingComments']);

/** Depth-first walk with a parent chain, so a node can ask what encloses it. */
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

const src = (text, n) => text.slice(n.start, n.end);
const oneLine = (s, max = 90) => {
    const t = String(s).replace(/\s+/g, ' ').trim();
    return t.length > max ? t.slice(0, max - 1) + '…' : t;
};
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

/** `a.b.c` -> "a.b.c"; anything else -> null. */
function dotted (node) {
    if (!node) return null;
    if (node.type === 'Identifier') return node.name;
    if (node.type === 'MemberExpression' && !node.computed) {
        const o = dotted(node.object);
        return o && node.property.type === 'Identifier' ? o + '.' + node.property.name : null;
    }
    return null;
}

/* --------------------------------------------------------------- vocabulary */

/** Calls that DISCOVER a set of inputs from the filesystem. */
const DISCOVERY = new Set(['readdirSync', 'readdir', 'globSync', 'glob', 'opendirSync']);

/** node:test entry points. */
const TEST_FNS = new Set(['test', 'it', 'describe', 'suite']);

const ASSERT_NAMES = new Set([
    'ok', 'equal', 'strictEqual', 'deepEqual', 'deepStrictEqual', 'notEqual',
    'notStrictEqual', 'notDeepEqual', 'notDeepStrictEqual', 'match', 'doesNotMatch',
    'throws', 'rejects', 'doesNotThrow', 'doesNotReject', 'fail', 'ifError', 'partialDeepStrictEqual'
]);

function isAssertCall (node) {
    if (node.type !== 'CallExpression') return false;
    const d = dotted(node.callee);
    if (!d) return false;
    if (d === 'assert') return true; // assert(x)
    const parts = d.split('.');
    if (parts[0] !== 'assert') return false;
    return ASSERT_NAMES.has(parts[parts.length - 1]);
}

/** A literal that is unconditionally truthy: assert.ok(true), assert.ok(1). */
function isAlwaysTrue (node) {
    if (!node) return false;
    if (node.type === 'Literal') return Boolean(node.value);
    if (node.type === 'UnaryExpression' && node.operator === '!') {
        return node.argument.type === 'Literal' && !node.argument.value;
    }
    return false;
}

/**
 * A FLOOR is an assertion that a discovered quantity is non-zero. Recognised:
 *   assert.ok(n > 0) / n >= 1 / n.length > 0 / 0 < n
 *   assert.ok(list.length)      assert.ok(count)
 *   assert.notEqual(x.length, 0)   assert.equal(x.length, 12)
 * The numeric side must be a LITERAL, because a floor compared against another
 * runtime value can go to zero with it and prove nothing.
 */
function floorFrom (node, text) {
    if (!isAssertCall(node)) return null;
    const d = dotted(node.callee);
    const name = d.split('.').pop();
    const a0 = node.arguments[0];
    const a1 = node.arguments[1];

    if (name === 'ok' || d === 'assert') {
        if (!a0) return null;
        if (a0.type === 'BinaryExpression' && ['>', '>=', '<', '<='].includes(a0.operator)) {
            const rightIsNum = a0.right.type === 'Literal' && typeof a0.right.value === 'number';
            const leftIsNum = a0.left.type === 'Literal' && typeof a0.left.value === 'number';
            if (!rightIsNum && !leftIsNum) return null;
            const num = rightIsNum ? a0.right : a0.left;
            const other = rightIsNum ? a0.left : a0.right;
            const flooring = rightIsNum
                ? ['>', '>='].includes(a0.operator)   // count > 0
                : ['<', '<='].includes(a0.operator);  // 0 < count
            if (!flooring) return null;
            if (num.value < 0) return null;
            if (num.value === 0 && a0.operator === '>=') return null; // `n >= 0` is vacuous
            if (num.value === 0 && a0.operator === '<=') return null;
            return {
                expr: oneLine(src(text, a0)),
                threshold: num.value,
                subject: oneLine(src(text, other), 44)
            };
        }
        if (a0.type === 'MemberExpression' && /\.(length|size)$/.test(src(text, a0))) {
            return { expr: oneLine(src(text, a0)), threshold: 1, subject: oneLine(src(text, a0), 44) };
        }
        return null;
    }
    if (/^not(Equal|StrictEqual|DeepEqual|DeepStrictEqual)$/.test(name)) {
        if (a1 && a1.type === 'Literal' && a1.value === 0) {
            return { expr: oneLine(src(text, node), 70), threshold: 1, subject: oneLine(src(text, a0), 44) };
        }
        return null;
    }
    if (/^(equal|strictEqual|deepEqual|deepStrictEqual)$/.test(name)) {
        if (a0 && a1 && a1.type === 'Literal' && typeof a1.value === 'number' && a1.value > 0 &&
            /\.(length|size)$/.test(src(text, a0))) {
            return { expr: oneLine(src(text, node), 70), threshold: a1.value, subject: oneLine(src(text, a0), 44) };
        }
        return null;
    }
    return null;
}

/* ------------------------------------------------------------------ analyse */

export function analyseFile (path, repoRoot) {
    const text = readFileSync(path, 'utf8');
    const rel = relative(repoRoot, path).split(sep).join('/');
    let ast;
    try {
        ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module' });
    } catch (e) {
        return { file: rel, parseError: String(e.message), tests: [], skipConditions: [], assertions: 0, tautological: [], discovery: [], floors: [], earlyReturns: [], envGates: [] };
    }

    const out = {
        file: rel,
        bytes: text.length,
        hasNul: text.includes(String.fromCharCode(0)),
        tests: [],
        skipConditions: [],
        assertions: 0,
        tautological: [],
        discovery: [],
        floors: [],
        earlyReturns: [],
        usesSiblingGuard: /requireSiblings|siblingGuardTest/.test(text),
        mentionsSibling: /bw-board|bw-circuit-ui|brickwright-lite/.test(text),
        usesGlobSync: /globSync/.test(text),
        network: /fetch\s*\(/.test(text) && /https?:\/\//.test(text),
        envGates: [],
        // Corpus-driven: test()/it() called from inside a loop, or assertions
        // driven by one. If the collection is empty, such a file emits ZERO
        // subtests and node:test reports it as a clean pass. That is the shape
        // this whole sweep exists to find, and readdirSync is only one way in —
        // most corpora here arrive as an imported map (EXAMPLES, a manifest).
        loopDrivenTests: [],
        loopDrivenAsserts: 0,
        iterationSources: []
    };

    /* ---- where a name comes from, which is what decides corpus vs table ----
     *
     * `for (const c of CASES)` is only a vacuity risk when CASES can arrive
     * EMPTY without anyone editing this file. A `const CASES = [ … ]` literal
     * three lines up cannot: emptying it is the same edit as deleting the test,
     * and it is visible in the diff. An imported map, a readdirSync, or a parsed
     * manifest can — silently, from another file or another repo. Only the
     * second kind is flagged, or the sweep drowns in tables.
     */
    //
    // Scope is deliberately FLATTENED: every `const X = …` in the file, at any
    // depth, lands in one map. A function-local `const FRAGMENTS = [ … ]` is as
    // unable to arrive empty by surprise as a top-level one, and treating only
    // module scope reported four such tables as suspects. The cost is that two
    // same-named consts in different scopes collapse; for a screen whose output
    // is checked by starving the gate, that is the right trade.
    const bindings = new Map();   // name -> {origin, at}
    walk(ast, (node) => {
        if (node.type === 'ImportDeclaration') {
            const from = node.source.value;
            for (const sp of node.specifiers) {
                bindings.set(sp.local.name, { origin: 'imported', from, at: lineOf(text, node.start) });
            }
        } else if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.init) {
            const origin = originOf(node.init);
            const prev = bindings.get(node.id.name);
            // A name bound twice keeps the LESS reassuring answer, so a shadowing
            // literal cannot vouch for an external one.
            if (!prev || (prev.origin === 'literal' && origin !== 'literal')) {
                bindings.set(node.id.name, { origin, at: lineOf(text, node.start) });
            }
        }
    });

    /** Classify an initialiser: 'literal' (a table) or 'external' (a corpus). */
    function originOf (init, depth = 0) {
        if (!init || depth > 6) return 'unknown';
        switch (init.type) {
        case 'ArrayExpression':
        case 'ObjectExpression':
        case 'Literal':
        case 'TemplateLiteral':
            return 'literal';
        case 'NewExpression': {
            const c = dotted(init.callee);
            if ((c === 'Map' || c === 'Set') && (!init.arguments[0] || init.arguments[0].type === 'ArrayExpression')) {
                return 'literal';
            }
            return 'unknown';
        }
        case 'Identifier':
            return bindings.has(init.name) ? bindings.get(init.name).origin : 'unknown';
        case 'MemberExpression':
            return originOf(init.object, depth + 1);
        case 'CallExpression': {
            const c = dotted(init.callee) || '';
            const last = c.split('.').pop();
            if (DISCOVERY.has(last)) return 'external';
            if (last === 'readFileSync' || last === 'parse' || last === 'require') return 'external';
            // Object.keys(X) / X.filter(...) / X.map(...) inherit X's origin.
            if (/^Object\.(keys|values|entries|fromEntries)$/.test(c)) return originOf(init.arguments[0], depth + 1);
            if (init.callee.type === 'MemberExpression') return originOf(init.callee.object, depth + 1);
            return 'unknown';
        }
        default:
            return 'unknown';
        }
    }

    /** Root identifier of an expression, for looking a subject up in `bindings`. */
    function rootName (node, depth = 0) {
        if (!node || depth > 8) return null;
        if (node.type === 'Identifier') return node.name;
        if (node.type === 'MemberExpression') return rootName(node.object, depth + 1);
        if (node.type === 'CallExpression') {
            const c = dotted(node.callee) || '';
            if (/^Object\.(keys|values|entries|fromEntries)$/.test(c)) return rootName(node.arguments[0], depth + 1);
            return rootName(node.callee.type === 'MemberExpression' ? node.callee.object : node.callee, depth + 1);
        }
        if (node.type === 'AwaitExpression') return rootName(node.argument, depth + 1);
        return null;
    }

    const noteSource = (s) => {
        if (!out.iterationSources.some((x) => x.text === s.text)) out.iterationSources.push(s);
    };

    /** The nearest enclosing iteration, if any: for-of/for-in/forEach/map/flatMap. */
    const enclosingLoop = (parents) => {
        for (let i = parents.length - 1; i >= 0; i--) {
            const p = parents[i];
            if (p.type === 'ForOfStatement' || p.type === 'ForInStatement' || p.type === 'ForStatement') return p;
            if (p.type === 'CallExpression') {
                const c = dotted(p.callee);
                if (c && /\.(forEach|map|flatMap|filter)$/.test(c)) return p;
                // A test callback is a boundary: assertions inside one test are
                // not "loop-driven" just because the test was declared in a loop.
                const base = c ? c.split('.')[0] : null;
                if (base && TEST_FNS.has(base)) return null;
            }
        }
        return null;
    };

    /**
     * What a loop iterates, IF that thing is a corpus rather than a table
     * written in this file. Returns null for a table — see `originOf`.
     */
    const loopSubject = (loop) => {
        if (!loop) return null;
        let expr = null;
        if (loop.type === 'ForOfStatement' || loop.type === 'ForInStatement') expr = loop.right;
        else if (loop.type === 'CallExpression' && loop.callee.type === 'MemberExpression') expr = loop.callee.object;
        if (!expr) return null;
        if (expr.type === 'ArrayExpression') return null;               // inline literal
        const root = rootName(expr);
        const b = root && bindings.get(root);
        if (b && b.origin === 'literal') return null;                   // a table, not a corpus
        if (!b && root && !/^[A-Z_]/.test(root)) {
            // A local (loop- or function-scoped) name we did not resolve. Keep it,
            // but say so, because an unresolved name is exactly where a wrong
            // "clean" answer hides.
            return { text: oneLine(src(text, expr), 70), origin: 'unresolved' };
        }
        return { text: oneLine(src(text, expr), 70), origin: b ? b.origin : 'unresolved' };
    };

    walk(ast, (n, parents) => {
        if (n.type === 'CallExpression') {
            const callee = dotted(n.callee);
            const base = callee ? callee.split('.')[0] : null;

            // --- test declarations and their skip: option
            if (callee && (TEST_FNS.has(callee) ||
                (base && TEST_FNS.has(base) && /\.(skip|todo|only)$/.test(callee)))) {
                const nameArg = n.arguments[0];
                const title = nameArg && nameArg.type === 'Literal' ? String(nameArg.value)
                    : nameArg ? oneLine(src(text, nameArg), 60) : '(anonymous)';
                const entry = { kind: callee, title, line: lineOf(text, n.start), skip: null };
                if (/\.skip$/.test(callee)) entry.skip = 'unconditional ' + callee + '()';
                for (const arg of n.arguments) {
                    if (arg.type !== 'ObjectExpression') continue;
                    for (const p of arg.properties) {
                        if (p.type !== 'Property') continue;
                        const key = p.key.name || p.key.value;
                        if (key === 'skip' || key === 'todo') entry.skip = oneLine(src(text, p.value), 120);
                    }
                }
                out.tests.push(entry);
                if (entry.skip) out.skipConditions.push({ line: entry.line, test: title, cond: entry.skip });

                const subject = loopSubject(enclosingLoop(parents));
                if (subject) {
                    out.loopDrivenTests.push({ line: entry.line, title, over: subject.text, origin: subject.origin });
                    noteSource(subject);
                }
            }

            // --- t.skip() inside a body
            if (callee && /^(t|ctx|context|tc)\.skip$/.test(callee)) {
                out.skipConditions.push({
                    line: lineOf(text, n.start), test: '(in body)', cond: oneLine(src(text, n), 120)
                });
            }

            // --- discovery
            if (callee && DISCOVERY.has(callee.split('.').pop())) {
                out.discovery.push({ line: lineOf(text, n.start), call: oneLine(src(text, n), 100) });
            }

            // --- the shared floor helper counts as a floor. It IS one: it
            // registers an always-running test asserting a measured minimum.
            if (callee === 'corpusFloor') {
                const a2 = n.arguments[2];
                out.floors.push({
                    line: lineOf(text, n.start),
                    expr: oneLine(src(text, n), 80),
                    threshold: a2 && a2.type === 'Literal' ? a2.value : 1,
                    subject: n.arguments[0] && n.arguments[0].type === 'Literal'
                        ? String(n.arguments[0].value) : 'corpusFloor()',
                    via: 'helper'
                });
            }

            // --- assertions
            if (isAssertCall(n)) {
                out.assertions++;
                const aSubject = loopSubject(enclosingLoop(parents));
                if (aSubject) {
                    out.loopDrivenAsserts++;
                    noteSource(aSubject);
                }
                if (isAlwaysTrue(n.arguments[0])) {
                    out.tautological.push({ line: lineOf(text, n.start), expr: oneLine(src(text, n), 120) });
                }
                const f = floorFrom(n, text);
                if (f) out.floors.push({ line: lineOf(text, n.start), ...f });
            }
        }

        // --- `if (x.length < N) throw ...` is a floor written as a guard rather
        // than as an assertion. device-coverage.test.mjs uses exactly that shape
        // at module scope, where node:test's assert would have nowhere to land.
        if (n.type === 'IfStatement' && n.test.type === 'BinaryExpression' &&
            ['<', '<=', '===', '==', '!'].includes(n.test.operator)) {
            const throws = (b) => b && (b.type === 'ThrowStatement' ||
                (b.type === 'BlockStatement' && b.body.some((x) => x.type === 'ThrowStatement')));
            const lit = n.test.right && n.test.right.type === 'Literal' ? n.test.right : null;
            if (throws(n.consequent) && lit && typeof lit.value === 'number' && lit.value >= 0 &&
                /\.(length|size)$/.test(src(text, n.test.left))) {
                out.floors.push({
                    line: lineOf(text, n.start),
                    expr: oneLine(src(text, n.test), 70),
                    threshold: lit.value,
                    subject: oneLine(src(text, n.test.left), 44),
                    via: 'throw-guard'
                });
            }
        }

        // --- env gating
        if (n.type === 'MemberExpression' && dotted(n.object) === 'process.env') {
            const name = n.property.name || n.property.value;
            if (name && !out.envGates.includes(name)) out.envGates.push(name);
        }

        // --- a bare `return` directly inside a test callback: skip-as-pass
        if (n.type === 'ReturnStatement' && !n.argument) {
            for (let i = parents.length - 1; i >= 0; i--) {
                const p = parents[i];
                if (p.type === 'FunctionDeclaration') break;
                if (p.type === 'FunctionExpression' || p.type === 'ArrowFunctionExpression') {
                    const owner = parents[i - 1];
                    if (owner && owner.type === 'CallExpression') {
                        const c = dotted(owner.callee);
                        if (c && TEST_FNS.has(c.split('.')[0])) out.earlyReturns.push({ line: lineOf(text, n.start) });
                    }
                    break;
                }
            }
        }
    });

    return out;
}

/* -------------------------------------------------------------- collection */

/** List *.test.mjs directly under `dir`, refusing to leave the tree via a symlink. */
export function testFiles (dir) {
    if (!existsSync(dir)) return [];
    const real = realpathSync(dir);
    const out = [];
    for (const name of readdirSync(dir).sort()) {
        if (!/\.test\.(mjs|js)$/.test(name)) continue;
        const p = join(dir, name);
        if (lstatSync(p).isSymbolicLink()) continue;      // never scan out of the tree
        if (!realpathSync(p).startsWith(real)) continue;
        out.push(p);
    }
    return out;
}

export function fastSet (repoRoot) {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
    const s = pkg.scripts && pkg.scripts['test:fast'];
    if (!s) return null;
    return new Set(s.match(/test\/[\w.-]+\.test\.mjs/g) || []);
}

export function inventory (repoRoot, label) {
    const dir = join(repoRoot, 'test');
    const fast = fastSet(repoRoot);
    const rows = testFiles(dir).map((p) => {
        const r = analyseFile(p, repoRoot);
        r.repo = label;
        r.inFast = fast ? fast.has(r.file) : null;
        return r;
    });
    return { repo: label, root: repoRoot, fastSet: fast, rows };
}

/* ------------------------------------------------------------------ verdict */

/**
 * A file is a VACUITY SUSPECT when it discovers its inputs from the filesystem
 * and nothing in it asserts a non-zero floor on what it found. That is exactly
 * the shape that passes over an empty corpus.
 */
export function classify (r) {
    const flags = [];
    if (r.parseError) return ['PARSE-ERROR'];
    if (r.hasNul) flags.push('NUL-BYTE');
    const corpusDriven = r.discovery.length > 0 || r.loopDrivenTests.length > 0 || r.loopDrivenAsserts > 0;
    if (corpusDriven && !r.floors.length) {
        // Distinguish the two ways in, because the remedies differ: a gate that
        // discovers from disk needs a measured floor on what it found; a gate
        // driven by an imported map needs a floor on the map.
        flags.push(r.discovery.length ? 'VACUITY-SUSPECT(fs)' : 'VACUITY-SUSPECT(corpus)');
    }
    if (r.assertions === 0) flags.push('NO-ASSERTIONS');
    if (r.tautological.length && r.tautological.length >= r.assertions) flags.push('ALL-TAUTOLOGICAL');
    else if (r.tautological.length) flags.push('TAUTOLOGY:' + r.tautological.length);
    if (r.earlyReturns.length) flags.push('EARLY-RETURN:' + r.earlyReturns.length);
    if (r.mentionsSibling && !r.usesSiblingGuard && r.skipConditions.length) flags.push('UNGUARDED-SIBLING-SKIP');
    if (r.usesGlobSync) flags.push('NEEDS-NODE22');
    return flags;
}

/* --------------------------------------------------------------------- main */

const invokedDirectly = process.argv[1] &&
    realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));

if (invokedDirectly) {
    const LITE = process.env.BW_LITE || resolve(ROOT, '..', 'lego', 'brickwright-lite');
    const repos = [inventory(ROOT, 'sb3-creator')];
    if (existsSync(join(LITE, 'test'))) repos.push(inventory(LITE, 'brickwright-lite'));
    else console.error('NOTE: brickwright-lite not found at ' + LITE + ' — set BW_LITE');

    if (process.argv.includes('--markdown')) {
        const esc = (t) => String(t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
        for (const repo of repos) {
            console.log('\n### `' + repo.repo + '` — ' + repo.rows.length + ' test files\n');
            console.log('| file | runs | skips | asserts | corpus / floor |');
            console.log('|---|---|---|---|---|');
            for (const r of repo.rows) {
                const runs = repo.fastSet
                    ? (r.inFast ? 'CI + `test:fast`' : 'CI only')
                    : 'CI (`npm test`)';
                const skips = r.skipConditions.length
                    ? r.skipConditions.map((s) => '`' + esc(s.cond).slice(0, 64) + '`').slice(0, 2).join('<br>') +
                      (r.skipConditions.length > 2 ? '<br>+' + (r.skipConditions.length - 2) + ' more' : '')
                    : '—';
                const taut = r.tautological.length ? ' (' + r.tautological.length + ' tautological)' : '';
                const asserts = r.assertions + taut +
                    (r.envGates.length ? '<br>env: `' + r.envGates.join('`, `') + '`' : '');
                const corpusDriven = r.discovery.length || r.loopDrivenTests.length || r.loopDrivenAsserts;
                const corpus = !corpusDriven
                    ? '—'
                    : (r.floors.length
                        ? 'floored (' + r.floors.length + ')'
                        : '**NO FLOOR** — ' + esc(
                            r.iterationSources.map((x) => x.text)
                                .concat(r.discovery.map((d) => d.call)).join('; ')).slice(0, 70));
                console.log('| `' + r.file.replace(/^test\//, '') + '` | ' + runs + ' | ' +
                    skips + ' | ' + asserts + ' | ' + corpus + ' |');
            }
            const corpusDriven = repo.rows.filter(
                (r) => r.discovery.length || r.loopDrivenTests.length || r.loopDrivenAsserts);
            const noFloor = corpusDriven.filter((r) => !r.floors.length);
            console.log('\n' + repo.rows.length + ' files; ' + corpusDriven.length +
                ' corpus-driven, ' + (corpusDriven.length - noFloor.length) + ' floored, ' +
                noFloor.length + ' without a floor.');
        }
    } else if (process.argv.includes('--json')) {
        console.log(JSON.stringify(repos.map((r) => ({
            repo: r.repo,
            root: r.root,
            rows: r.rows.map((x) => ({ ...x, flags: classify(x) }))
        })), null, 2));
    } else {
        for (const repo of repos) {
            console.log('\n=== ' + repo.repo + ' — ' + repo.rows.length + ' test files ===');
            console.log('  file'.padEnd(48) + 'tests asrt disc loop floor skip fast  flags');
            for (const r of repo.rows) {
                console.log([
                    '  ' + r.file.replace(/^test\//, '').padEnd(44),
                    String(r.tests.length).padStart(5),
                    String(r.assertions).padStart(4),
                    String(r.discovery.length).padStart(4),
                    String(r.loopDrivenTests.length + r.loopDrivenAsserts).padStart(4),
                    String(r.floors.length).padStart(5),
                    String(r.skipConditions.length).padStart(4),
                    (r.inFast === null ? '   -' : r.inFast ? 'FAST' : '    '),
                    ' ' + classify(r).join(' ')
                ].join(' '));
            }
            const susp = repo.rows.filter((r) => classify(r).some((f) => f.startsWith('VACUITY-SUSPECT')));
            console.log('  --- vacuity suspects: ' + susp.length + '/' + repo.rows.length + ' ---');
        }
    }
}
