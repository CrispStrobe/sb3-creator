// Round-trip transparency (PLAN §22): converting a project through the languages
// repeatedly must CONVERGE to a fixed point (the algorithmic core is preserved; only
// the first pass strips graphics, which live in the blocks). A construct that mutates
// every round-trip (like the `delete item N of list` "item" bug) fails this.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import pythonToPseudocode from '../src/utils/pythonToPseudocode.js';
import javascriptToPseudocode from '../src/utils/javascriptToPseudocode.js';
import examples from '../src/utils/examples.js';

const jsOf = (p) => new SB3Creator().generateJavaScript(p);
const pyOf = (p) => new SB3Creator().generatePython(p);
const psOf = (p) => new SB3Creator().decompile(p);
const blocksFrom = (ps) => { const c = new SB3Creator(); c.parse(ps); return c.project; };
const hop = (proj, lang) => blocksFrom(
    lang === 'js' ? javascriptToPseudocode(jsOf(proj)).pseudocode
        : lang === 'py' ? pythonToPseudocode(pyOf(proj)).pseudocode
            : psOf(proj));

// Chain the project through blocks<->{js,py,pseudocode} following `order` (cycled),
// snapshotting the generated JS at each hop. The last hops must be identical (stable).
function transparencySnapshots (name, order, steps) {
    let proj = blocksFrom(examples[name]);
    const snaps = [jsOf(proj)];
    for (let s = 0; s < steps; s++) { proj = hop(proj, order[s % order.length]); snaps.push(jsOf(proj)); }
    return snaps;
}

// A few different permutation orders — the round-trip must converge regardless of the
// path taken through the languages (pseudocode↔blocks↔python↔js in any interleaving).
const ORDERS = [
    ['js', 'py', 'pseudocode'],
    ['py', 'js', 'pseudocode'],
    ['pseudocode', 'js', 'py', 'js'],
    ['js', 'js', 'py', 'py', 'pseudocode'],
    ['py', 'pseudocode', 'js', 'pseudocode', 'py']
];

for (const name of Object.keys(examples)) {
    test(`transparency: ${name} converges under every permutation order`, () => {
        for (const order of ORDERS) {
            const snaps = transparencySnapshots(name, order, 10);
            const n = snaps.length;
            assert.equal(snaps[n - 1], snaps[n - 2], `${name} [${order}] must be stable at the end`);
            assert.equal(snaps[n - 2], snaps[n - 3], `${name} [${order}] must converge, not oscillate`);
        }
    });
}

// Regression for the g2048 bug: `delete <index> of <list>` must NOT gain the word
// "item" (which the compiler would swallow as a string index).
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
