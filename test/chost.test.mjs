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

// The Arrays & Vectors extension and Planète Maths' digit-sum have no host-C
// form yet. Named rather than hidden: if anything else joins them, that is a
// regression and this number moves.
const KNOWN_GAPS = new Set(['arrays', 'planetemaths']);

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

// ---- the way back --------------------------------------------------------
// blocks → host C → pseudocode → blocks has to land on the same project.
// Measured rather than asserted per example: 26 of the 30 come back identical
// today. The four that do not are named, because a floor that can only rise is
// worth more than a suite that passes while quietly losing ground.
//
// Two of the four are the extension gaps the emit test already names (the
// Arrays registry and Planète Maths' digit sum — the C cannot carry what was
// never emitted). The other two are custom-block DEFINE reconstruction in the
// two largest examples, which is a reader bug and not a lossy emission.
const ROUNDTRIP_FLOOR = 26;
const KNOWN_LOSSY = new Set(['arrays', 'planetemaths', 'tetris', 'sokoban']);

test('host C reads back as the same project', async () => {
    const examples = (await import('../src/utils/examples.js')).default;
    let identical = 0;
    const differ = [];
    for (const [name, ex] of Object.entries(examples)) {
        const a = build(ex.code ?? ex);
        if (a.project.stc && a.project.stc.pins && a.project.stc.pins.length) continue;
        const want = a.decompile();
        const got = build(cHostToPseudocode(a.generateC())).decompile();
        if (got === want) identical++; else differ.push(name);
    }
    assert.ok(identical >= ROUNDTRIP_FLOOR,
        `round trip fell to ${identical} (floor ${ROUNDTRIP_FLOOR}); differing: ${differ.join(', ')}`);
    assert.deepEqual(differ.filter((n) => !KNOWN_LOSSY.has(n)), [],
        'a new example stopped round-tripping');
});
