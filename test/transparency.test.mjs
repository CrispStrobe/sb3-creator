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
const CYCLE = ['js', 'py', 'pseudocode'];

// Chain the project through blocks<->{js,py,pseudocode} and snapshot the generated
// JS at each hop. The last hops must be identical (a stable fixed point).
function transparencySnapshots (name, steps) {
    let proj = blocksFrom(examples[name]);
    const snaps = [jsOf(proj)];
    for (let s = 0; s < steps; s++) {
        const lang = CYCLE[s % CYCLE.length];
        const ps = lang === 'js' ? javascriptToPseudocode(jsOf(proj)).pseudocode
            : lang === 'py' ? pythonToPseudocode(pyOf(proj)).pseudocode
                : psOf(proj);
        proj = blocksFrom(ps);
        snaps.push(jsOf(proj));
    }
    return snaps;
}

for (const name of Object.keys(examples)) {
    test(`transparency: ${name} converges to a fixed point across languages`, () => {
        const snaps = transparencySnapshots(name, 9);
        const n = snaps.length;
        assert.equal(snaps[n - 1], snaps[n - 2], `${name} must be stable at the end (no per-round-trip drift)`);
        assert.equal(snaps[n - 2], snaps[n - 3], `${name} must have converged, not oscillate`);
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
