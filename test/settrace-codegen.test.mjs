// settrace debug codegen ({trace:true} on generateMicroPython) — the
// line-level debugger for the settrace-enabled MicroPython firmware.
// No injected markers: sys.settrace reports REAL line numbers and the
// returned lineMap {pythonLine: blockId} maps them back to blocks.
// The marker debugger ({debug:true}) is a separate opt-in and must be
// byte-for-byte unaffected.
//
// Until the firmware exists, CPython IS the settrace oracle: the live
// tests below execute the emitted program under python3 with a stubbed
// `microbit` module and assert the actual \x1eL / \x1eV / \x1eK stream.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const SRC = `DEVICE MICROBIT:
  PIN led1 = P0 OUTPUT

  WHEN started:
    set count to 0
    FOREVER:
      change count by 1
      IF count > 5 THEN:
        turn on led1
      wait 500 ms
`;

const build = () => { const c = new SB3Creator(); c.parse(SRC); return c; };
const gen = (opts) => { const c = build(); return c.generateMicroPython(c.project, opts); };

const hasPython = spawnSync('python3', ['--version']).status === 0;

test('trace build: settrace harness present, protocol strings exact', () => {
    const r = gen({ trace: true });
    assert.equal(r.ok, true);
    assert.match(r.py, /sys\.settrace\(_bw_tr\)/);
    assert.match(r.py, /if event == 'line':/);
    assert.match(r.py, /print\('\\x1eL' \+ str\(n\)\)/);
    assert.match(r.py, /frame\.f_locals/);
    // json-free: the settrace firmware ships no `json` module (measured
    // 2026-08-19), so the dumps serialize via the emitted _bw_json.
    assert.match(r.py, /print\('\\x1eV' \+ _bw_json\(v\)\)/);
    assert.match(r.py, /f = f\.f_back/);
    assert.match(r.py, /print\('\\x1eK' \+ _bw_json\(_bw_stack\(frame\)\)\)/);
    assert.ok(!/import json/.test(r.py), 'no json dependency in the trace harness');
    // dead-yield generators are fragile under the settrace firmware when a
    // Python call happens in the trace hook — trace builds use the
    // non-foldable guard instead.
    assert.match(r.py, /_bw_false = False/);
    // no marker instrumentation leaked in
    assert.ok(!/_bw_pos\(/.test(r.py), 'no _bw_pos markers in a trace build');
    assert.ok(!/@bw:/.test(r.py), 'sentinels are stripped');
});

test('lineMap: every entry points at a real statement and a real block', () => {
    const c = build();
    const r = c.generateMicroPython(c.project, { trace: true });
    const entries = Object.entries(r.lineMap);
    assert.ok(entries.length >= 6, `expected >= 6 mapped statements, got ${entries.length}`);
    const lines = r.py.split('\n');
    const allBlocks = new Set();
    for (const t of c.project.targets || []) for (const id of Object.keys(t.blocks || {})) allBlocks.add(id);
    for (const [n, id] of entries) {
        const text = lines[n - 1];
        assert.ok(text && text.trim().length, `line ${n} is empty`);
        assert.ok(!/^\s*#/.test(text), `line ${n} is a comment: ${text}`);
        assert.ok(allBlocks.has(id), `line ${n} maps to unknown block ${id}`);
    }
    // the device-side filter carries exactly the mapped lines
    const m = r.py.match(/_bw_lines = set\(\(([\d, ]+),\)\)/);
    assert.ok(m, '_bw_lines substituted with the mapped set');
    assert.deepEqual(m[1].split(',').map((x) => x.trim()).filter(Boolean).sort(),
        Object.keys(r.lineMap).sort());
});

test('breakpoints: block ids resolve to line numbers in _bw_bl', () => {
    // Block ids are minted per parse — the debug host parses ONCE, reads
    // lineMap from a probe build, then regenerates with breakpoints on the
    // SAME project (exactly how the marker debugger's host works).
    const c = build();
    const probe = c.generateMicroPython(c.project, { trace: true });
    const [someLine, someBlock] = Object.entries(probe.lineMap)[2];
    const r = c.generateMicroPython(c.project, { trace: true, breakpoints: [someBlock] });
    assert.match(r.py, new RegExp(`_bw_bl = set\\(\\(${someLine},\\)\\)`));
});

test('marker debugger is untouched; plain build carries neither', () => {
    const d = gen({ debug: true });
    assert.match(d.py, /_bw_pos\(/);
    assert.ok(!/settrace/.test(d.py), 'no settrace in a marker build');
    assert.ok(Array.isArray(d.positions) && d.positions.length >= 6);
    const p = gen({});
    assert.ok(!/_bw_pos\(|settrace/.test(p.py), 'plain build is uninstrumented');
    const both = gen({ trace: true, debug: true });
    assert.match((both.warnings || []).join('; '), /trace wins/);
    assert.ok(!/_bw_pos\(/.test(both.py));
});

test('emitted Python is AST-valid', { skip: !hasPython }, () => {
    const r = gen({ trace: true });
    const dir = mkdtempSync(join(tmpdir(), 'bw-settrace-'));
    const f = join(dir, 'prog.py');
    writeFileSync(f, r.py);
    const res = spawnSync('python3', ['-c', `import ast; ast.parse(open(${JSON.stringify(f)}).read())`]);
    assert.equal(res.status, 0, String(res.stderr));
});

// ---- live: CPython as the settrace oracle ---------------------------------
// A stub `microbit` module goes into sys.modules, then the program runs via
// exec(compile(src, ...)) so its frames keep the UNSHIFTED line numbers the
// lineMap (and the baked _bw_lines/_bw_bl sets) were computed for.
const RUNNER = `
import sys, types, time as _t
mb = types.ModuleType('microbit')
class _Pin:
    def write_digital(self, v): pass
    def read_digital(self): return 0
for _i in range(21): setattr(mb, 'pin%d' % _i, _Pin())
_start = _t.time()
mb.running_time = lambda: int((_t.time() - _start) * 200000)
mb.sleep = lambda ms: None
class _Btn:
    def is_pressed(self): return False
mb.button_a = _Btn(); mb.button_b = _Btn()
sys.modules['microbit'] = mb
src = open(sys.argv[1]).read()
exec(compile(src, '<bw>', 'exec'), {'__name__': '__main__'})
`;

function runTraced(py, stdinText) {
    const dir = mkdtempSync(join(tmpdir(), 'bw-settrace-live-'));
    writeFileSync(join(dir, 'runner.py'), RUNNER);
    writeFileSync(join(dir, 'prog.py'), py);
    const res = spawnSync('python3', ['-u', join(dir, 'runner.py'), join(dir, 'prog.py')],
        { input: stdinText, timeout: 5000, encoding: 'utf8' });
    return String(res.stdout || '');
}

test('live: line events stream with mapped numbers', { skip: !hasPython }, () => {
    const r = gen({ trace: true });
    const out = runTraced(r.py, '');
    const seen = [...out.matchAll(/\x1eL(\d+)/g)].map((m) => m[1]);
    assert.ok(seen.length >= 3, `expected line events, got: ${JSON.stringify(out.slice(0, 200))}`);
    for (const n of new Set(seen)) {
        assert.ok(r.lineMap[n], `reported line ${n} is not in lineMap`);
    }
});

test('live: breakpoint halts with real locals and call stack, resumes on c', { skip: !hasPython }, () => {
    const c = build();
    const probe = c.generateMicroPython(c.project, { trace: true });
    // break on the `change count by 1` statement (third mapped entry);
    // same instance — ids are minted per parse (see the test above).
    const [bpLine, bpBlock] = Object.entries(probe.lineMap)[2];
    const r = c.generateMicroPython(c.project, { trace: true, breakpoints: [bpBlock] });
    const out = runTraced(r.py, 'c\n'.repeat(50));
    assert.ok(out.includes(`\x1eL${bpLine}`), 'breakpoint line reported');
    const vDump = out.match(/\x1eV(\{.*\})/);
    assert.ok(vDump, 'locals dump present at halt');
    const locals_ = JSON.parse(vDump[1]);
    assert.ok('count' in locals_, `f_locals carries the task variable: ${vDump[1]}`);
    const kDump = out.match(/\x1eK(\[.*\])/);
    assert.ok(kDump, 'call-stack dump present at halt');
    const stack = JSON.parse(kDump[1]);
    assert.ok(stack.length >= 2, `stack walks f_back: ${kDump[1]}`);
    // resumed: more line events follow the first halt
    const firstHalt = out.indexOf('\x1eV');
    assert.ok(/\x1eL\d+/.test(out.slice(firstHalt + vDump[1].length)), 'program resumed after c');
});
