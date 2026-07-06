// Round-trip transparency (PLAN §22). The real invariant the earlier version MISSED:
// converting a project through the languages in ANY order must preserve the *project
// itself* (sprites, costumes, local/global vars, every block) — not merely converge to
// some stable-but-degraded fixed point. "Everything collapsed into one Main sprite" is a
// stable fixed point too; this test rejects it by comparing each hop against the ORIGINAL.
//
// hop(proj, lang): blocks -> {pseudocode | python | javascript} -> pseudocode -> blocks.
// The canonical signature is the decompiled pseudocode minus comments (comments live in
// the blocks and don't survive a code hop — that's the one documented exception).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import pythonToPseudocode from '../src/utils/pythonToPseudocode.js';
import javascriptToPseudocode from '../src/utils/javascriptToPseudocode.js';
import examples from '../src/utils/examples.js';

const blocksFrom = (ps) => { const c = new SB3Creator(); c.parse(ps); return c.project; };
const jsOf = (p) => new SB3Creator().generateJavaScript(p);
const pyOf = (p) => new SB3Creator().generatePython(p);
const psOf = (p) => new SB3Creator().decompile(p);

const hop = (proj, lang) => blocksFrom(
    lang === 'js' ? javascriptToPseudocode(jsOf(proj)).pseudocode
        : lang === 'py' ? pythonToPseudocode(pyOf(proj)).pseudocode
            : psOf(proj));

// Canonical, comment-free signature of a project (order-preserving decompile).
const sig = (proj) => psOf(proj)
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .join('\n');

// Orders interleave every language so a project is pushed blocks<->js<->py<->pseudocode
// along many different paths. If any hop loses/mutates structure, the signature drifts.
const ORDERS = [
    ['js', 'py', 'pseudocode'],
    ['py', 'js', 'pseudocode'],
    ['js', 'pseudocode', 'py'],
    ['pseudocode', 'js', 'py', 'js'],
    ['js', 'js', 'py', 'py', 'pseudocode'],
    ['py', 'pseudocode', 'js', 'pseudocode', 'py'],
    ['js', 'py', 'js', 'py', 'js', 'py']
];

// Planète Maths is the one converge-only case: `n is multiple of 2` decompiles to standard
// `(n mod 2) = 0` (behaviour-identical, but the extension block isn't reconstructed). Every
// other example — including the Arrays & Vectors registry, which now maps to a reversible
// `_arrays.<method>()` surface — is preserved byte-for-byte through code hops.
const CONVERGE_ONLY = new Set(['planetemaths']);

for (const name of Object.keys(examples)) {
    const strict = !CONVERGE_ONLY.has(name);
    test(`transparency: ${name} ${strict ? 'is preserved exactly' : 'converges'} under every permutation order`, () => {
        const base = sig(blocksFrom(examples[name]));
        for (const order of ORDERS) {
            let proj = blocksFrom(examples[name]);
            const seen = [];
            for (let s = 0; s < 12; s++) {
                proj = hop(proj, order[s % order.length]);
                const cur = sig(proj);
                if (strict) {
                    assert.equal(cur, base, `${name} [${order.join('>')}] hop ${s} (${order[s % order.length]}) must equal the original project`);
                }
                seen.push(cur);
            }
            // Always converge (no accumulating corruption), strict or not.
            const n = seen.length;
            assert.equal(seen[n - 1], seen[n - 2], `${name} [${order.join('>')}] must be stable at the end`);
            assert.equal(seen[n - 2], seen[n - 3], `${name} [${order.join('>')}] must converge, not oscillate`);
        }
    });
}

// Regression for the g2048 bug: `delete <index> of <list>` must NOT gain the word "item"
// (which the compiler would swallow as a string index that grows every round-trip).
test('transparency: `delete N of list` round-trips without corrupting the index', () => {
    const src = 'SPRITE T:\n  LIST xs\n  GLOBAL p\n  WHEN flag clicked:\n    delete (p + 1) of xs\n';
    let c = new SB3Creator();
    c.parse(src);
    for (let i = 0; i < 4; i++) {
        const js = c.generateJavaScript();
        assert.match(js, /xs\.splice\(Number\(\(p \+ 1\)\) - 1, 1\)/, 'index stays (p + 1), never a string');
        c = new SB3Creator();
        c.parse(javascriptToPseudocode(js).pseudocode);
    }
});

// The specific failure the user hit: a multi-sprite game with tile costumes must survive a
// Python (and JavaScript) round-trip with its sprites, costumes and collision intact.
test('transparency: multi-sprite games keep sprites + costumes + sensing through code', () => {
    for (const name of ['snake', 'sokoban', 'breakout']) {
        const base = blocksFrom(examples[name]);
        const nSprites = base.targets.filter((t) => !t.isStage).length;
        const nCostumes = base.targets.reduce((s, t) => s + (t.costumes || []).length, 0);
        for (const lang of ['py', 'js']) {
            const rt = hop(base, lang);
            assert.equal(rt.targets.filter((t) => !t.isStage).length, nSprites, `${name}/${lang}: sprite count preserved`);
            assert.equal(rt.targets.reduce((s, t) => s + (t.costumes || []).length, 0), nCostumes, `${name}/${lang}: costumes preserved`);
            assert.equal(sig(rt), sig(base), `${name}/${lang}: whole project preserved`);
        }
    }
});
