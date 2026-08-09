// The host C target: blocks → a C99 program that runs the project.
//
// `generateC` used to have one target, bare metal for the 8051, so 30 of the 35
// examples produced nothing but "no C equivalent" warnings — about 390 of them.
// That was the wrong target for a project that moves a sprite, not a missing
// feature, so the project now picks: declared pins mean the chip, anything else
// means the host.
//
// What this suite holds:
//   1. every example emits, with no warnings beyond a known extension gap;
//   2. what it emits is C — checked by a compiler, under -Wall -Wextra -Werror,
//      not by reading it;
//   3. the host target and the Python target AGREE, checked by running both and
//      diffing stdout. That is the oracle that catches one back end drifting
//      from the other, which is exactly how the two implementations of this
//      dialect got out of step before.
//
// (2) and (3) need `cc` and `python3`; they skip cleanly where those are absent.

import { test, skip } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';
import cHostToPseudocode from '../src/utils/cHostToPseudocode.js';

const build = (src) => { const c = new SB3Creator(); c.parse(src); return c; };
const has = (cmd) => spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0;
const HAS_CC = has('cc');
const HAS_PY = has('python3');

// Nothing warns any more: the Arrays & Vectors registry and Planète Maths'
// digit sum both have host-C forms now. The set stays as the place to name a
// gap if one reappears, rather than letting warnings drift back in unnoticed.
const KNOWN_GAPS = new Set([]);

test('every example emits host C, and only the known extension gaps warn', async () => {
    const examples = (await import('../src/utils/examples.js')).default;
    const warned = [];
    for (const [name, ex] of Object.entries(examples)) {
        const c = build(ex.code ?? ex);
        const isDevice = !!(c.project.stc && c.project.stc.pins && c.project.stc.pins.length);
        if (isDevice) continue;                       // the chip target has its own suite
        const out = c.generateC();
        assert.match(out, /blocks → C \(host\)/, `${name} takes the host target`);
        if ((c._hcWarnings || []).length) warned.push(name);
    }
    assert.deepEqual(warned.sort(), [...KNOWN_GAPS].sort(),
        'only the known extension gaps have no host-C form');
});

test('the emitted C compiles, warnings and all', { skip: !HAS_CC }, async () => {
    const examples = (await import('../src/utils/examples.js')).default;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-hostc-'));
    let compiled = 0;
    for (const [name, ex] of Object.entries(examples)) {
        const c = build(ex.code ?? ex);
        if (c.project.stc && c.project.stc.pins && c.project.stc.pins.length) continue;
        const file = path.join(dir, name.replace(/[^\w-]/g, '_') + '.c');
        fs.writeFileSync(file, c.generateC());
        const r = spawnSync('cc', ['-std=c99', '-Wall', '-Wextra', '-Werror',
            '-c', '-o', path.join(dir, 'o.o'), file], { encoding: 'utf8' });
        assert.equal(r.status, 0, `${name} does not compile:\n${r.stderr}`);
        compiled++;
    }
    fs.rmSync(dir, { recursive: true, force: true });
    assert.ok(compiled >= 25, `expected the whole example set, compiled ${compiled}`);
});

// Variables, a counting loop, if/else, and the operators whose C and Python
// forms are least alike (letter of, length of, mod, round, comparison).
const CROSS = `WHEN flag clicked:
  set total to 0
  set n to 1
  REPEAT 5:
    set total to total + n
    change n by 1
  say total
  IF total > 10 THEN:
    say "big"
  ELSE:
    say "small"
  say letter 2 of "scratch"
  say length of "scratch"
  say total mod 4
  say round 3.6
`;

test('the arrays extension agrees with Python, not just in spelling',
    { skip: !(HAS_CC && HAS_PY) }, async () => {
        const examples = (await import('../src/utils/examples.js')).default;
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-arr-'));
        const py = path.join(dir, 'a.py'), cs = path.join(dir, 'a.c'), bin = path.join(dir, 'a');
        const src = examples.arrays.code ?? examples.arrays;
        fs.writeFileSync(py, build(src).generatePython());
        fs.writeFileSync(cs, build(src).generateC());
        const cc = spawnSync('cc', ['-std=c99', '-Wall', '-Wextra', '-Werror', '-o', bin, cs, '-lm'],
            { encoding: 'utf8' });
        assert.equal(cc.status, 0, cc.stderr);
        const fromPy = execFileSync('python3', [py], { encoding: 'utf8' });
        const fromC = execFileSync(bin, [], { encoding: 'utf8' });
        fs.rmSync(dir, { recursive: true, force: true });
        // A registry that merely compiled would pass a spelling test and still
        // print zeros; this is the one that catches that.
        assert.equal(fromC, fromPy);
        assert.match(fromPy, /^sum = 29$/m);
        assert.match(fromPy, /^after set: \[5, 99, 8, 1, 12\]$/m);
    });

test('host C and Python produce the same output for the same project',
    { skip: !(HAS_CC && HAS_PY) }, () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-cross-'));
        const py = path.join(dir, 'p.py'), cs = path.join(dir, 'p.c'), bin = path.join(dir, 'p');
        fs.writeFileSync(py, build(CROSS).generatePython());
        fs.writeFileSync(cs, build(CROSS).generateC());
        const cc = spawnSync('cc', ['-std=c99', '-Wall', '-Wextra', '-Werror', '-o', bin, cs, '-lm'],
            { encoding: 'utf8' });
        assert.equal(cc.status, 0, cc.stderr);
        const fromPy = execFileSync('python3', [py], { encoding: 'utf8' });
        const fromC = execFileSync(bin, [], { encoding: 'utf8' });
        fs.rmSync(dir, { recursive: true, force: true });
        assert.equal(fromC, fromPy, 'the two back ends disagree about what this project does');
        assert.match(fromPy, /^15$/m, 'and both actually ran the loop');
    });

void skip;


// Every block the Arrays & Vectors extension has, including the three that take
// a lambda as text and the ones that hand back a list. Python eval()s those
// lambdas; C cannot, so it parses them — which is exactly the kind of
// reimplementation that passes a spelling test and then disagrees on the
// numbers, so this compares the numbers.
const ARRAYS_ALL = `SPRITE Bot:
  WHEN flag clicked:
    new array "v" = [3, 1, 2]
    say (reverse of array "v")
    say (sort of array "v" ascending)
    say (sort of array "v" descending)
    say (slice of array "v" from 1 to 3)
    new 2D array "g" = [[1, 2], [3, 4]]
    say (item row 1 col 0 of array "g")
    say (transpose of array "g")
    say (flatten of array "g")
    say (reshape array "g" to [4])
    say (map "(x) => x * 2" over array "v")
    say (filter array "v" by "(x) => x > 1")
    say (reduce array "v" with "(a, b) => a + b" from 0)
`;

test('the whole arrays surface agrees with Python, lambdas included',
    { skip: !(HAS_CC && HAS_PY) }, () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-arr2-'));
        const py = path.join(dir, 'a.py'), cs = path.join(dir, 'a.c'), bin = path.join(dir, 'a');
        const creator = build(ARRAYS_ALL);
        assert.deepEqual(creator._hcWarnings || [], [], 'no block is left without a C form');
        fs.writeFileSync(py, build(ARRAYS_ALL).generatePython());
        fs.writeFileSync(cs, creator.generateC());
        const cc = spawnSync('cc', ['-std=c99', '-Wall', '-Wextra', '-Werror', '-o', bin, cs, '-lm'],
            { encoding: 'utf8' });
        assert.equal(cc.status, 0, cc.stderr);
        const fromPy = execFileSync('python3', [py], { encoding: 'utf8' });
        const fromC = execFileSync(bin, [], { encoding: 'utf8' });
        fs.rmSync(dir, { recursive: true, force: true });
        assert.equal(fromC, fromPy);
        assert.match(fromPy, /^\[\[1, 3\], \[2, 4\]\]$/m, 'transpose really ran');
        assert.match(fromPy, /^\[6, 2, 4\]$/m, 'and so did the lambda');
    });

test('and it survives the way back', () => {
    const a = build(ARRAYS_ALL);
    const viaC = build(cHostToPseudocode(a.generateC())).decompile();
    assert.equal(viaC, build(a.decompile()).decompile());
});

// ---- the way back --------------------------------------------------------
// blocks → host C → pseudocode → blocks has to land on the same project.
//
// The comparison is against what the DIALECT's own round trip preserves, not
// against the original decompile, and that distinction earned itself: `tetris`
// loses a comment through pseudocode → blocks → pseudocode with no C involved
// at all. Measuring against the original would have blamed the C target for a
// pre-existing asymmetry in the parser, and "fixing" it in the reader would
// have meant making the C round trip better than the language it round-trips
// through — a bug dressed as an improvement.
//
// So: the C is allowed to lose whatever the dialect already loses, and nothing
// more. All 30 clear that bar, and since the parser stopped mis-attaching a
// comment above a control block, all 30 are byte-identical outright too — the
// weaker test below is kept anyway, so a regression says which bar it fell
// below rather than only that something moved.
const FIDELITY_FLOOR = 30;
const KNOWN_LOSSY = new Set([]);

test('host C loses nothing the dialect does not already lose', async () => {
    const examples = (await import('../src/utils/examples.js')).default;
    let asFaithful = 0;
    const worse = [];
    for (const [name, ex] of Object.entries(examples)) {
        const a = build(ex.code ?? ex);
        if (a.project.stc && a.project.stc.pins && a.project.stc.pins.length) continue;
        const direct = a.decompile();
        const viaPseudocode = build(direct).decompile();          // the dialect's own ceiling
        const viaC = build(cHostToPseudocode(a.generateC())).decompile();
        if (viaC === viaPseudocode) asFaithful++; else worse.push(name);
    }
    assert.ok(asFaithful >= FIDELITY_FLOOR,
        `fidelity fell to ${asFaithful} (floor ${FIDELITY_FLOOR}); worse: ${worse.join(', ')}`);
    assert.deepEqual(worse.filter((n) => !KNOWN_LOSSY.has(n)), [],
        'a new example started losing information through C');
});

// The stricter statement, kept separate so a regression says which bar it fell
// below: most projects come back byte-identical to the original, not merely as
// good as the dialect.
test('and all of them come back byte-identical', async () => {
    const examples = (await import('../src/utils/examples.js')).default;
    let identical = 0;
    for (const [name, ex] of Object.entries(examples)) {
        void name;
        const a = build(ex.code ?? ex);
        if (a.project.stc && a.project.stc.pins && a.project.stc.pins.length) continue;
        if (build(cHostToPseudocode(a.generateC())).decompile() === a.decompile()) identical++;
    }
    assert.ok(identical >= 30, `only ${identical} of 30 are byte-identical`);
});
