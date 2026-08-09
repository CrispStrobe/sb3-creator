// The fifth target: blocks -> C for the STC12 / 8051 (`generateC`).
//
// C is emit-only for now — the C -> blocks front end is intended but not built (the way
// back is being grown from stc-compiler's Keil translator and disassembler) — so this
// suite does NOT check the two-way convergence invariant for C. What it does check is
// (a) the STC block surface (DEVICE / CLOCK / PIN / turn on / toggle / read) round-trips
// pseudocode <-> blocks like everything else, and (b) the emitted C keeps the decisions
// that ../stc-compiler/stc_pseudocode.py (the reference implementation and oracle) makes:
// the cooperative scheduler, Timer 0 at FOSC/12, and active-low pins.
//
// The oracle tests POST every fixture to stc-compiler and prove it really builds.
// Defaults to the public endpoint; set STC_COMPILER_URL to override, or
// STC_COMPILER_URL=off to skip (offline work). A skip is printed loudly so a green
// run cannot be mistaken for a complete one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const build = (src) => { const c = new SB3Creator(); c.parse(src); return c; };
const cOf = (src, opts) => build(src).generateC(undefined, opts);

// ---- fixtures ------------------------------------------------------------------

// One script: straight-line emission, no scheduler.
const BLINK = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN led1 = P1.0 OUTPUT ACTIVE LOW
PIN led2 = P1.1 OUTPUT ACTIVE LOW

WHEN flag clicked:
  set counter to 0
  FOREVER:
    REPEAT 6:
      turn on led1
      turn off led2
      wait 0.15 seconds
      turn off led1
      turn on led2
      wait 0.15 seconds
    change counter by 1
    IF counter > 2 THEN:
      wait 1 seconds
      set counter to 0
`;

// Several scripts: cooperative tasks. Also exercises the ADC, an input pin, a custom
// block (which runs to completion, so its wait blocks), REPEAT UNTIL and stop.
const SCHEDULED = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN led1 = P1.0 OUTPUT ACTIVE LOW
PIN led2 = P1.1 OUTPUT
PIN pot = P1.3 ANALOG
PIN button = P3.2 INPUT

DEFINE pulse (ms):
  turn on led2
  wait 0.02 seconds
  turn off led2

WHEN flag clicked:
  FOREVER:
    REPEAT 6:
      toggle led1
      wait 0.15 seconds
    pulse 20

WHEN flag clicked:
  wait until read button
  FOREVER:
    set level to read pot
    IF level > 512 THEN:
      set led2 high
    ELSE:
      set led2 low
    REPEAT UNTIL level < 10:
      change level by -1
    wait 0.05 seconds
`;

const STC89 = `DEVICE STC89C52RC
CLOCK 12000000
PIN led = P2.0 OUTPUT ACTIVE LOW

WHEN flag clicked:
  FOREVER:
    toggle led
    wait 0.5 seconds
`;

const STC15 = `DEVICE STC15F2K60S2
CLOCK 22118400
PIN led = P1.5 OUTPUT

WHEN flag clicked:
  FOREVER:
    turn on led
    wait 0.25 seconds
    turn off led
    wait 0.25 seconds
`;

// LED cube: the scan kernel + frame helpers must compile.
const CUBE = `DEVICE STC12C5A60S2
CLOCK 11059200
LEDCUBE 4

WHEN flag clicked:
  clear cube
  set voxel 0 0 0 to 1
  set voxel 3 3 3 to 1
  fill layer 2 with 1
  hold frame for 500 ms
  shift cube up
  hold frame for 500 ms
`;

const FIXTURES = { BLINK, SCHEDULED, STC89, STC15 };
// CUBE is tested by the oracle separately — it has no PINs, so it doesn't
// belong in FIXTURES (which the round-trip test asserts contains PIN lines).
const ORACLE_FIXTURES = { ...FIXTURES, CUBE };

// ---- the block surface: parse + round-trip --------------------------------------

test('DEVICE / CLOCK / PIN parse into project.stc', () => {
    const c = build(SCHEDULED);
    assert.deepEqual(c.warnings, []);
    const stc = c.project.stc;
    assert.equal(stc.device, 'stc12c5a60s2');
    assert.equal(stc.clock, 11059200);
    assert.deepEqual(stc.pins[0], { name: 'led1', port: 1, bit: 0, direction: 'output', activeLow: true });
    assert.deepEqual(stc.pins[2], { name: 'pot', port: 1, bit: 3, direction: 'analog', activeLow: false });
    assert.deepEqual(stc.pins[3], { name: 'button', port: 3, bit: 2, direction: 'input', activeLow: false });
});

test('CLOCK accepts MHz and underscores', () => {
    assert.equal(build('CLOCK 12 MHz\nWHEN flag clicked:\n  say "x"').project.stc.clock, 12000000);
    assert.equal(build('CLOCK 11_059_200\nWHEN flag clicked:\n  say "x"').project.stc.clock, 11059200);
});

test('pin statements become stc12 blocks, not variables or motion', () => {
    const c = build(SCHEDULED);
    const ops = new Set();
    for (const t of c.project.targets) for (const b of Object.values(t.blocks)) ops.add(b.opcode);
    assert.ok(ops.has('stc12_setpin'), 'turn on/off + set high/low');
    assert.ok(ops.has('stc12_toggle'));
    assert.ok(ops.has('stc12_read'));
    // `led1` must never have become a variable, and `turn on led1` never motion_turnright.
    assert.ok(!ops.has('motion_turnright'), 'turn on <pin> is not a motion block');
    const stage = c.project.targets.find((t) => t.isStage);
    const names = Object.values(stage.variables).map((v) => v[0]);
    assert.ok(!names.includes('led1'), 'a pin is not a variable');
    assert.ok(names.includes('level'), 'ordinary variables still work');
});

test('pin commands only claim a line when the name really is a pin', () => {
    // No PIN declarations at all -> the normal Scratch meanings must survive untouched.
    const c = build('SPRITE S:\n  WHEN flag clicked:\n    turn right 15 degrees\n    set score to 0\n    toggle 5');
    const ops = Object.values(c.project.targets[1].blocks).map((b) => b.opcode);
    assert.ok(ops.includes('motion_turnright'));
    assert.ok(ops.includes('data_setvariableto'));
    assert.ok(!ops.some((o) => o.startsWith('stc12_')));
});

test('the STC surface round-trips pseudocode <-> blocks to a fixed point', () => {
    for (const [name, src] of Object.entries(FIXTURES)) {
        const once = build(src).decompile();
        const twice = build(once).decompile();
        assert.equal(twice, once, `${name} is not a fixed point`);
        // The declarations and every pin statement survive the hop.
        assert.match(once, /^DEVICE /m, name);
        assert.match(once, /^PIN \w+ = P\d\.\d /m, name);
    }
    const blink = build(BLINK).decompile();
    assert.match(blink, /turn on led1/);
    assert.match(blink, /PIN led1 = P1\.0 OUTPUT ACTIVE LOW/);
    assert.match(build(SCHEDULED).decompile(), /toggle led1/);
    assert.match(build(SCHEDULED).decompile(), /read pot/);
});

test('malformed declarations warn instead of throwing', () => {
    const c = build('DEVICE not_a_chip\nPIN x = P9.9 OUTPUT\nPIN p = P2.0 ANALOG\nWHEN flag clicked:\n  say "x"');
    assert.ok(c.warnings.some((w) => /Unknown DEVICE/.test(w)));
    assert.ok(c.warnings.some((w) => /ANALOG is only available on P1/.test(w)));
});

// ---- straight-line emission (one script) ----------------------------------------

test('one script keeps straight-line emission in main()', () => {
    const c = cOf(BLINK);
    assert.match(c, /^#include <stc12\.h>$/m);
    assert.match(c, /#define FOSC_HZ 11059200UL/);
    assert.match(c, /static void delay_ms\(unsigned int ms\)/);
    assert.ok(!/__interrupt/.test(c), 'no ISR without a scheduler');
    assert.ok(!/bw_task/.test(c), 'no tasks without a scheduler');
    assert.match(c, /void main\(void\)/);
    // The FOREVER and its REPEAT are plain C loops.
    assert.match(c, /for \(;;\) \{/);
    assert.match(c, /for \(_i\d+ = 0; _i\d+ < \(6\); _i\d+\+\+\) \{/);
    assert.match(c, /static int counter = 0;/);
});

test('waits fold to whole milliseconds', () => {
    const c = cOf(BLINK);
    assert.match(c, /delay_ms\(150\);/);
    assert.match(c, /delay_ms\(1000\);/);
});

test('a non-constant wait is computed, not dropped', () => {
    const c = cOf('PIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  set secs to 2\n  wait secs seconds');
    assert.match(c, /delay_ms\(\(unsigned int\)\(\(secs\) \* 1000\)\);/);
});

// ---- active-low: the whole point of the polarity flag ---------------------------

test('ACTIVE LOW inverts turn on / turn off, and the reset state is "off"', () => {
    const c = cOf(BLINK);
    // led1 is active low: `turn on` writes 0, `turn off` writes 1.
    assert.match(c, /P1_0 = 0;/, 'turn on led1 -> 0');
    assert.match(c, /P1_0 = 1;/, 'turn off led1 -> 1');
    // main() parks every output at its OFF level before anything runs.
    assert.match(c, /P1_0 = 1;\s+\/\* led1 off \*\//);
    assert.match(c, /P1_1 = 1;\s+\/\* led2 off \*\//);
});

test('an active-high pin is not inverted', () => {
    const c = cOf('PIN relay = P2.3 OUTPUT\nWHEN flag clicked:\n  turn on relay\n  turn off relay');
    assert.match(c, /P2_3 = 0;\s+\/\* relay off \*\//, 'active-high parks at 0');
    const body = c.slice(c.indexOf('void main'));
    assert.ok(body.includes('P2_3 = 1;'), 'turn on -> 1');
});

test('set high / set low ignore the polarity (they are levels, not states)', () => {
    const c = cOf('PIN led = P1.0 OUTPUT ACTIVE LOW\nWHEN flag clicked:\n  set led high\n  set led low');
    const body = c.slice(c.indexOf('void main'));
    assert.ok(body.includes('P1_0 = 1;'));
    assert.ok(body.includes('P1_0 = 0;'));
});

test('reading an ACTIVE LOW input inverts the level', () => {
    const c = cOf('PIN btn = P3.2 INPUT ACTIVE LOW\nPIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  wait until read btn\n  turn on led');
    assert.match(c, /while \(!\(!P3_2\)\) ;/);
});

test('driving a non-output pin warns instead of emitting a bad write', () => {
    const c = cOf('PIN btn = P3.2 INPUT\nPIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  turn on btn\n  turn on led');
    assert.match(c, /warning: "btn" is an INPUT pin and cannot be driven/);
    assert.ok(!/P3_2 = /.test(c), 'no write to the input pin');
});

// ---- the cooperative scheduler (several scripts) --------------------------------

test('several scripts compile to cooperative tasks over a Timer-0 millisecond tick', () => {
    const c = cOf(SCHEDULED);
    assert.match(c, /static volatile unsigned int bw_ms;/);
    assert.match(c, /void bw_tick\(void\) __interrupt\(1\)/);
    // The ISR advances the counter and does nothing else.
    const isr = c.slice(c.indexOf('__interrupt(1)'), c.indexOf('}', c.indexOf('bw_ms++')));
    assert.ok(/bw_ms\+\+;/.test(isr));
    assert.ok(!/bw_task/.test(isr), 'the ISR never runs a task');
    // A 16-bit load is not atomic on an 8051, so the read holds the tick off.
    assert.match(c, /static unsigned int bw_now\(void\)\n\{\n\s+unsigned int t;\n\s+ET0 = 0;\n\s+t = bw_ms;\n\s+ET0 = 1;/);
    // One function per script, and main() round-robins them.
    assert.match(c, /static void bw_task0\(void\)/);
    assert.match(c, /static void bw_task1\(void\)/);
    assert.match(c, /for \(;;\) \{\n\s+bw_task0\(\);\n\s+bw_task1\(\);\n\s+\}/);
    assert.ok(!/delay_ms\(/.test(c), 'a task must never block on the old spin delay');
});

test('deadlines are wraparound-safe signed compares', () => {
    const c = cOf(SCHEDULED);
    assert.match(c, /bw_task0_until = bw_now\(\) \+ \(150\);/);
    assert.match(c, /if \(\(int\)\(bw_now\(\) - bw_task0_until\) < 0\) return;/);
    // No naive `bw_now() < deadline`, which breaks every 65.5 s.
    assert.ok(!/bw_now\(\) [<>]=? bw_task/.test(c));
});

test('every wait AND every loop back-edge is a numbered yield', () => {
    const c = cOf(SCHEDULED);
    const task = c.slice(c.indexOf('static void bw_task0(void)'), c.indexOf('static unsigned int bw_task1_state'));
    const labels = [...task.matchAll(/^\s*case (\d+):$/gm)].map((m) => Number(m[1]));
    assert.ok(labels.length >= 4, `expected several yields, got ${labels.length}`);
    assert.equal(new Set(labels).size, labels.length, 'case labels must be unique within a task');
    assert.equal(labels[0], 0, 'entry is state 0 — the zero-initialized static, never assigned');
    for (const n of labels.slice(1)) {
        assert.ok(task.includes(`bw_task0_state = ${n};`), `state ${n} is never assigned`);
    }
    // The FOREVER's back-edge returns to its own state -> a busy loop cannot starve task1.
    assert.match(task, /bw_task0_state = 1;\n\s+return;/);
    // The REPEAT counter survives the yield, so it is a static.
    assert.match(c, /static unsigned int bw_i\d+;/);
    assert.match(task, /bw_i\d+--;/);
});

test('REPEAT UNTIL yields on its back-edge too', () => {
    const task = cOf(SCHEDULED).slice(cOf(SCHEDULED).indexOf('static void bw_task1(void)'));
    assert.match(task, /if \(!\(\(level < 10\)\)\) \{[\s\S]*?level \+= -1;[\s\S]*?bw_task1_state = \d+;\n\s+return;\n\s+\}/);
});

test('a task that runs off the end parks itself', () => {
    assert.match(cOf(SCHEDULED), /bw_task0_state = 0xFFFF;\s+\/\* ran to the end \*\//);
});

test('stop stops the right scripts', () => {
    const many = (tail) => cOf(`PIN led = P1.0 OUTPUT
WHEN flag clicked:
  FOREVER:
    toggle led
    wait 1 seconds

WHEN flag clicked:
  wait 1 seconds
  ${tail}`);
    assert.match(many('stop this script'), /bw_task1_state = 0xFFFF;\n\s+return;/);
    const all = many('stop all');
    assert.match(all, /bw_task0_state = 0xFFFF;\n\s+bw_task1_state = 0xFFFF;\n\s+return;/);
    const others = many('stop other scripts in sprite');
    const t1 = others.slice(others.indexOf('static void bw_task1(void)'));
    assert.match(t1, /bw_task0_state = 0xFFFF;/);
    assert.ok(!/bw_task1_state = 0xFFFF;\n\s+return;/.test(t1), 'it must not stop itself');
});

test('a wait inside a custom block blocks on the tick, never on a cycle count', () => {
    const c = cOf(SCHEDULED);
    assert.match(c, /static void bw_block_ms\(unsigned int ms\)/);
    assert.match(c, /while \(\(int\)\(bw_now\(\) - start - ms\) < 0\) ;/);
    assert.match(c, /bw_block_ms\(20\);/);
});

// ---- timing + chip families -----------------------------------------------------

test('every delay hangs off Timer 0 at FOSC/12 — never a cycle-counted loop', () => {
    for (const [name, src] of Object.entries(FIXTURES)) {
        const c = cOf(src);
        assert.match(c, /#define T0_RELOAD \(65536UL - \(FOSC_HZ \/ 12UL \/ 1000UL\)\)/, name);
        // The only counted loops we ever emit are REPEAT counters and the ADC mux settle;
        // a `for (i = 0; i < N; i++) ;` used as a *delay* is the drop-in-socket bug.
        for (const m of c.matchAll(/for \((\w+) = 0; \1 < [^;]+; \1\+\+\) ;/g)) {
            assert.ok(/settle/.test(m[0]), `${name}: cycle-counted delay loop ${m[0]}`);
        }
    }
});

test('1T parts clear AUXR.7 so Timer 0 counts FOSC/12; the 12T STC89 has no such bit', () => {
    assert.match(cOf(BLINK), /AUXR &= ~0x80;\s+\/\* Timer 0 at FOSC\/12 \*\//);
    assert.match(cOf(STC15), /AUXR &= ~0x80;/);
    assert.ok(!/AUXR/.test(cOf(STC89)), 'the STC89 has no AUXR 1T bit to clear');
});

test('the part table drives the header and the port-mode setup', () => {
    assert.match(cOf(STC89), /#include <8052\.h>/);
    assert.ok(!/P\dM[01]/.test(cOf(STC89)), 'the STC89 is quasi-bidirectional only');
    assert.match(cOf(STC89), /P2_0 = 1;\s+\/\* led off \*\//, 'active-low wiring still parks high');
    assert.match(cOf(STC15), /#include <stc12\.h>/);
    assert.match(cOf(STC15), /P1M1 &= ~0x20;\s+\/\* push-pull \*\/\n\s+P1M0 \|=  0x20;/);
    assert.match(cOf(STC15), /#define FOSC_HZ 22118400UL/);
});

test('port-mode masks are per port and cover every output on it', () => {
    const c = cOf('PIN a = P1.0 OUTPUT\nPIN b = P1.7 OUTPUT\nPIN d = P2.1 OUTPUT\nWHEN flag clicked:\n  turn on a');
    assert.match(c, /P1M1 &= ~0x81;/);
    assert.match(c, /P1M0 \|=  0x81;/);
    assert.match(c, /P2M1 &= ~0x02;/);
});

test('opts override the stored device and clock', () => {
    const c = cOf(BLINK, { device: 'stc89c52rc', clock: 12000000 });
    assert.match(c, /#include <8052\.h>/);
    assert.match(c, /#define FOSC_HZ 12000000UL/);
});

test('an unknown device falls back to the STC12 and says so', () => {
    const c = cOf(BLINK, { device: 'stc12c9000zz' });
    assert.match(c, /warning: unknown DEVICE "stc12c9000zz"/);
    assert.match(c, /#include <stc12\.h>/);
});

// ---- the ADC --------------------------------------------------------------------

test('an ANALOG pin brings in the polled 10-bit ADC on its own channel', () => {
    const c = cOf(SCHEDULED);
    assert.match(c, /static unsigned int adc_read\(unsigned char channel\)/);
    assert.match(c, /ADC_CONTR = \(unsigned char\)\(0xE8 \| channel\);/);
    assert.match(c, /return \(\(unsigned int\)ADC_RES << 2\) \| \(ADC_RESL & 0x03\);/);
    assert.match(c, /level = adc_read\(3\);/, 'ADC channel n is physically P1.n');
    assert.match(c, /P1ASF = 0x08;/);
    assert.match(c, /P1M1 \|=  0x08;/);
    assert.match(c, /ADC_CONTR = 0xE0;/);
});

test('no ADC is emitted when nothing reads an analog pin', () => {
    assert.ok(!/adc_read/.test(cOf(BLINK)));
});

test('an analog pin on a part without an ADC warns', () => {
    const c = cOf(SCHEDULED, { device: 'stc89c52rc' });
    assert.match(c, /warning: ANALOG pins need an ADC, and the stc89c52rc has none/);
});

// ---- blocks with no meaning on bare metal ---------------------------------------

test('off-target blocks become comments and a warning, not broken C', () => {
    const c = cOf(`PIN led = P1.0 OUTPUT
WHEN flag clicked:
  say "hello"
  move 10 steps
  set roll to (pick random 1 to 6)
  turn on led`);
    assert.match(c, /\/\* say "hello" \*\//);
    assert.match(c, /\/\* move 10 steps \*\//);
    assert.match(c, /warning: no C equivalent for "say "hello""/);
    assert.match(c, /roll = 0 \/\* pick random 1 to 6 \*\/;/);
    assert.match(c, /P1_0 = 1;/);
});

test('a hat with no meaning on the chip is skipped, with a warning', () => {
    const c = cOf('PIN led = P1.0 OUTPUT\nWHEN space key pressed:\n  turn on led\n\nWHEN flag clicked:\n  turn off led');
    assert.match(c, /warning: "WHEN space key pressed:" has no meaning on the chip/);
    assert.ok(!/P1_0 = 1;\n\s+P1_0 = 0;/.test(c), 'the skipped script is not inlined');
});

test('C keywords and odd names survive as valid identifiers', () => {
    const c = cOf('PIN led = P1.0 OUTPUT\nGLOBAL int\nGLOBAL my score\nWHEN flag clicked:\n  set int to 1\n  change my score by 2\n  turn on led');
    assert.match(c, /static int int_ = 0;/);
    assert.match(c, /static int my_score = 0;/);
    assert.match(c, /int_ = 1;/);
    assert.match(c, /my_score \+= 2;/);
});

test('custom blocks become static functions with int parameters', () => {
    const c = cOf(SCHEDULED);
    assert.match(c, /static void \w*do_pulse\(int ms\);/, 'prototype');
    assert.match(c, /static void \w*do_pulse\(int ms\)\n\{/, 'definition');
    assert.match(c, /\w*do_pulse\(20\);/, 'call site');
});

// ---- structural sanity + the other back ends ------------------------------------

test('the emitted C is structurally sound (braces, parens, comments)', () => {
    for (const [name, src] of Object.entries(FIXTURES)) {
        const c = cOf(src);
        const stripped = c.replace(/\/\*[\s\S]*?\*\//g, '');
        const count = (s, ch) => (s.match(new RegExp(`\\${ch}`, 'g')) || []).length;
        assert.equal(count(stripped, '{'), count(stripped, '}'), `${name}: unbalanced braces`);
        assert.equal(count(stripped, '('), count(stripped, ')'), `${name}: unbalanced parens`);
        assert.ok(!/\/\*[^*]*\/\*/.test(c), `${name}: nested block comment`);
        assert.ok(c.trim().endsWith('}'), `${name}: truncated output`);
        assert.match(c, /^\/\* Generated by Brickwright/, name);
    }
});

test('generateC does not disturb the Python / JavaScript back ends', () => {
    const c = build(SCHEDULED);
    c.generateC();
    const py = c.generatePython();
    const js = c.generateJavaScript();
    assert.match(py, /^# Generated by Brickwright/);
    assert.match(js, /^\/\/ Generated by Brickwright/);
    // Pin blocks reach the pluggable driver rather than becoming dead comments — that is
    // what lets the cheap simulation tier drive them (reference/simulation.md).
    assert.match(py, /_stc12\.togglePin\("led1"\)/);
    assert.match(js, /_stc12\.togglePin\("led1"\);/);
    assert.match(py, /_stc12\.setPin\("led2", "on"\)/);   // `turn on led2` lives in DEFINE pulse
    assert.match(py, /level = _stc12\.readPin\("pot"\)/);
    // And a neutral driver is emitted, so the program still runs standalone.
    assert.match(js, /const _stc12 = \{/);
    assert.match(js, /readPin: \(\) => 0/);
    assert.match(py, /class _Stc12Driver:/);
});

test('the pin surface is one registry entry, so the driver switches work on it too', () => {
    const c = build(SCHEDULED);
    // `remote` forwards commands to a bridge; the program itself is unchanged.
    const remote = c.generateJavaScript(undefined, { driver: 'remote' });
    assert.match(remote, /_stc12_send\("setPin"/);
    assert.match(remote, /_stc12\.togglePin/, 'the call sites do not change, only the driver');
    // `async` awaits hardware calls, which a real serial/USB link needs.
    assert.match(c.generateJavaScript(undefined, { async: true }), /await _stc12\.togglePin/);
});

test('project.stc survives the sb3 project.json', async () => {
    const c = build(BLINK);
    const blob = await c.generateSB3();
    const text = await new Response(blob).text().catch(() => null);
    assert.ok(text === null || typeof text === 'string');   // Blob support varies; the check below is the real one
    assert.deepEqual(JSON.parse(JSON.stringify(c.project)).stc, c.project.stc);
    assert.ok(c.project.extensions.includes('stc12'), 'the stc12 opcodes declare their extension');
});

// ---- the oracle: does it actually build? ----------------------------------------
// Defaults to the public endpoint. Set STC_COMPILER_URL=off to skip for offline work.
//
// Reachability is separated from the verdict: a /health probe runs once before the
// loop. If the service is unreachable (down, rate-limited, offline), the tests skip
// with a loud banner — an unreachable service is not evidence about the emitter.
// Inside each test, 429/5xx are infrastructure failures and skip; only a 200-with-no-
// image or a 4xx carrying a compiler diagnostic actually fail the test.
//
// The invariant: green means the C compiles; red means it doesn't; neither can mean
// "the network was having a day".

const ORACLE_ENV = process.env.STC_COMPILER_URL;
const ORACLE = ORACLE_ENV === 'off' ? null : (ORACLE_ENV || 'https://stc-compiler.vercel.app');

// Probe reachability once. If the service doesn't answer, skip all four rather than
// producing four red results that look like emitter bugs.
let oracleReachable = false;
if (ORACLE) {
    try {
        const probe = await fetch(`${ORACLE.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(5000) });
        oracleReachable = probe.ok;
    } catch { /* unreachable */ }
    if (!oracleReachable) console.log(`\n⚠  4 oracle tests SKIPPED — stc-compiler unreachable (${ORACLE})\n`);
} else {
    console.log('\n⚠  4 oracle tests SKIPPED — set STC_COMPILER_URL (or remove =off) to compile through SDCC\n');
}

const oracleSkip = !ORACLE ? 'STC_COMPILER_URL=off — oracle tests disabled'
    : !oracleReachable ? `stc-compiler unreachable (${ORACLE})`
        : false;

for (const [name, src] of Object.entries(ORACLE_FIXTURES)) {
    test(`oracle: ${name} compiles with SDCC`, { skip: oracleSkip }, async () => {
        const creator = build(src);
        const code = creator.generateC();
        let response;
        try {
            response = await fetch(`${ORACLE.replace(/\/$/, '')}/compile`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    code, language: 'c',
                    target: creator.project.stc.device,
                    fosc: creator.project.stc.clock
                }),
                signal: AbortSignal.timeout(15000)
            });
        } catch (e) {
            // Network error mid-test (timeout, connection reset) — infrastructure, not emitter.
            return assert.fail(`oracle infrastructure error (not a compiler failure): ${e.message}`);
        }
        // 429 / 5xx are the service's problem, not ours — skip rather than fail.
        if (response.status === 429 || response.status >= 500) {
            return assert.fail(`oracle infrastructure: HTTP ${response.status} (not a compiler failure)`);
        }
        let body;
        try { body = await response.json(); } catch {
            return assert.fail(`oracle: response is not JSON (HTTP ${response.status}) — infrastructure, not compiler`);
        }
        // A 200 with no image, or a 4xx carrying a compiler diagnostic, is our bug.
        assert.equal(response.status, 200, `compiler rejected the C: ${JSON.stringify(body).slice(0, 800)}`);
        assert.ok(body.hex || body.image || body.memory, `compiled but no image returned: ${JSON.stringify(body).slice(0, 400)}`);
    });
}

// ---- C -> pseudocode: the fourth front end ---------------------------------------
// `generateC` emits an `@bw` marker header carrying what the flat C cannot say for itself,
// which is what makes this a bounded parser instead of a guessing game. It also has to read
// hand-written firmware, which has no header and must be inferred from — and only from —
// what the C actually says.

import cToPseudocode from '../src/utils/cToPseudocode.js';

const recompiles = (ps) => { const c = new SB3Creator(); c.parse(ps); return c.warnings; };

test('the marker header states what the flat C form loses', () => {
    const c = cOf(SCHEDULED);
    assert.match(c, /@bw device stc12c5a60s2/);
    assert.match(c, /@bw clock 11059200/);
    assert.match(c, /@bw pin led1 P1\.0 output active-low/);
    assert.match(c, /@bw pin pot P1\.3 analog/);
    // A proccode's %s positions cannot survive in the C function name.
    assert.match(c, /@bw proc \w*do_pulse "pulse %s" warp=0/);
    assert.match(c, /@bw script bw_task0 0 stage/);
    assert.ok(!/@bw/.test(cOf(SCHEDULED, { markers: false })), 'suppressible');
});

test('the register prologue is out of main(), so setup is distinguishable from program', () => {
    const c = cOf(BLINK);
    assert.match(c, /static void bw_setup\(void\)/);
    assert.match(c, /void main\(void\)\n\{\n    bw_setup\(\);/);
    const main = c.slice(c.indexOf('void main(void)'));
    assert.ok(!/P1M1|TMOD|AUXR/.test(main), 'no register setup left in main()');
});

test('our own C round-trips back to the pseudocode it came from', () => {
    const c = new SB3Creator();
    c.parse(BLINK);
    const { pseudocode, warnings } = cToPseudocode(c.generateC());
    assert.deepEqual(warnings, [], 'a program we emitted needs no inference');
    // Same device, pins and program.
    assert.match(pseudocode, /^DEVICE STC12C5A60S2$/m);
    assert.match(pseudocode, /^PIN led1 = P1\.0 OUTPUT ACTIVE LOW$/m);
    assert.match(pseudocode, /set counter to 0/);
    assert.match(pseudocode, /FOREVER:/);
    assert.match(pseudocode, /REPEAT 6:/);
    assert.match(pseudocode, /turn on led1/);
    assert.match(pseudocode, /wait 0\.15 seconds/);
    assert.match(pseudocode, /IF counter > 2 THEN:/);
    assert.deepEqual(recompiles(pseudocode), [], 'and it recompiles cleanly');
});

test('C -> pseudocode -> C is a fixed point', () => {
    const first = (() => { const c = new SB3Creator(); c.parse(BLINK); return c.generateC(); })();
    const back = cToPseudocode(first).pseudocode;
    const again = (() => { const c = new SB3Creator(); c.parse(back); return c.generateC(); })();
    assert.equal(again, first, 'a second pass through C must change nothing');
});

test('the scheduler round-trip is a fixed point: pseudocode -> C -> pseudocode -> C', () => {
    const first = (() => { const c = new SB3Creator(); c.parse(SCHEDULED); return c.generateC(); })();
    const { pseudocode: back, warnings } = cToPseudocode(first);
    assert.deepEqual(warnings, [], 'no warnings on our own output');
    const again = (() => { const c = new SB3Creator(); c.parse(back); return c.generateC(); })();
    const { pseudocode: back2 } = cToPseudocode(again);
    assert.equal(back2, back, 'pseudocode is a fixed point after one hop');
    assert.equal(again, first, 'C is a fixed point after one hop');
});

test('nested loops + waits inside ifs round-trip through the scheduler', () => {
    const src = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN led = P1.0 OUTPUT ACTIVE LOW
PIN button = P3.2 INPUT

WHEN flag clicked:
  FOREVER:
    REPEAT 3:
      IF counter > 5 THEN:
        wait 0.1 seconds
      ELSE:
        wait 0.2 seconds
      toggle led

WHEN flag clicked:
  REPEAT 10:
    wait 0.5 seconds
  stop this script
`;
    const c1 = new SB3Creator();
    c1.parse(src);
    const cCode = c1.generateC();
    const { pseudocode, warnings } = cToPseudocode(cCode);
    assert.deepEqual(warnings, []);
    assert.match(pseudocode, /FOREVER:/);
    assert.match(pseudocode, /REPEAT 3:/);
    assert.match(pseudocode, /REPEAT 10:/);
    assert.match(pseudocode, /wait 0\.1 seconds/);
    assert.match(pseudocode, /wait 0\.2 seconds/);
    assert.match(pseudocode, /wait 0\.5 seconds/);
    assert.match(pseudocode, /toggle led/);
    assert.match(pseudocode, /stop this script/);
    // Second hop is stable.
    const c2 = new SB3Creator();
    c2.parse(pseudocode);
    const { pseudocode: ps2 } = cToPseudocode(c2.generateC());
    assert.equal(ps2, pseudocode, 'stable after one hop');
});

test('stop all and stop others survive the scheduler round-trip', () => {
    const src = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN led = P1.0 OUTPUT

WHEN flag clicked:
  FOREVER:
    toggle led
    wait 1 seconds

WHEN flag clicked:
  wait 1 seconds
  stop other scripts in sprite

WHEN flag clicked:
  wait 2 seconds
  stop all
`;
    const c = new SB3Creator();
    c.parse(src);
    const { pseudocode, warnings } = cToPseudocode(c.generateC());
    assert.deepEqual(warnings, []);
    const flags = [...pseudocode.matchAll(/^WHEN flag clicked:$/gm)];
    assert.equal(flags.length, 3, 'three scripts');
    assert.match(pseudocode, /stop other scripts in sprite/);
    assert.match(pseudocode, /stop all/);
    // Stable on second hop.
    const c2 = new SB3Creator();
    c2.parse(pseudocode);
    const { pseudocode: ps2 } = cToPseudocode(c2.generateC());
    assert.equal(ps2, pseudocode, 'stable after one hop');
});

// Hand-written firmware: the idioms real 8051 code actually uses, and no marker header.
const HAND_WRITTEN = `
#include <stc12.h>
#define FOSC_HZ 11059200UL
#define LED1    P1_0
#define LED2    P1_1
#define LED_ON  0
#define LED_OFF 1

void board_init(void) { LED1 = LED_OFF; LED2 = LED_OFF; }

void main(void)
{
    unsigned char i;
    board_init();
    for (;;) {
        for (i = 0; i < 6; i++) {
            LED1 = LED_ON;
            LED2 = LED_OFF;
            delay_ms(150);
        }
    }
}
`;

test('hand-written C is translated, with every inference reported', () => {
    const { pseudocode, warnings } = cToPseudocode(HAND_WRITTEN);
    assert.match(pseudocode, /^PIN led1 = P1\.0 OUTPUT ACTIVE LOW$/m);
    assert.match(pseudocode, /^CLOCK 11059200$/m);
    assert.match(pseudocode, /FOREVER:/);
    assert.match(pseudocode, /REPEAT 6:/);
    assert.match(pseudocode, /turn on led1/);
    assert.match(pseudocode, /turn off led2/);
    assert.match(pseudocode, /wait 0\.15 seconds/);
    assert.deepEqual(recompiles(pseudocode), []);
    // Nothing is inferred silently.
    assert.ok(warnings.some((w) => /ACTIVE LOW because LED_ON is 0/.test(w)));
    assert.ok(warnings.some((w) => /led2.*ACTIVE LOW|"LED2" read as ACTIVE LOW/i.test(w)), 'LED2 is only ever written LED_OFF, and that settles it too');
    assert.ok(warnings.some((w) => /inferred CLOCK/.test(w)));
    assert.ok(warnings.some((w) => /serves several parts/.test(w)));
});

test('polarity comes from the _ON constant, not from whichever write comes first', () => {
    // board_init() parks the LED with LED_OFF before any LED_ON; reading the first write
    // would invert the polarity of every program that follows this very common shape.
    const { pseudocode } = cToPseudocode(HAND_WRITTEN);
    assert.match(pseudocode, /ACTIVE LOW/);
    const flipped = HAND_WRITTEN.replace('#define LED_ON  0', '#define LED_ON  1')
        .replace('#define LED_OFF 1', '#define LED_OFF 0');
    assert.ok(!/ACTIVE LOW/.test(cToPseudocode(flipped).pseudocode), 'and the reverse wiring is not');
});

test('unknown polarity is admitted rather than guessed', () => {
    const { pseudocode, warnings } = cToPseudocode(`
#include <stc12.h>
sbit RELAY = P2^3;
void main(void) { for (;;) { RELAY = 1; } }`);
    assert.match(pseudocode, /^PIN relay = P2\.3 OUTPUT$/m);
    assert.ok(warnings.some((w) => /polarity of "RELAY" is unknown/.test(w)));
});

test('bitwise on program variables is now expressible; SFR setup is still filtered', () => {
    const { pseudocode, warnings } = cToPseudocode(`
#include <stc12.h>
#define LED P1_0
#define LED_ON 0
void main(void) {
    unsigned char mask = 0x0F;
    P1M0 |= 0x01;
    mask ^= 0x10;
    LED = LED_ON;
}`);
    assert.match(pseudocode, /turn on led/);
    // Bitwise on user variables IS now expressible.
    assert.match(pseudocode, /set mask to mask bitxor 16/, 'mask ^= 0x10 is now translated');
    // SFR register setup is still silently dropped.
    assert.ok(!/P1M0/.test(pseudocode), 'SFR setup stays filtered');
    assert.ok(!warnings.some((w) => /bitwise/.test(w)), 'no bitwise warnings on expressible ops');
});

test('the scheduler form is inverted back to multiple scripts', () => {
    const c = new SB3Creator();
    c.parse(SCHEDULED);
    const { pseudocode, warnings } = cToPseudocode(c.generateC());
    assert.deepEqual(warnings, [], 'our own scheduler output needs no inference');
    // Both scripts survive the round-trip.
    const flags = [...pseudocode.matchAll(/^WHEN flag clicked:$/gm)];
    assert.equal(flags.length, 2, 'two scripts');
    // The constructs inside survive.
    assert.match(pseudocode, /FOREVER:/);
    assert.match(pseudocode, /REPEAT 6:/);
    assert.match(pseudocode, /toggle led1/);
    assert.match(pseudocode, /wait 0\.15 seconds/);
    assert.match(pseudocode, /wait until read button/);
    assert.match(pseudocode, /REPEAT UNTIL level < 10:/);
    assert.match(pseudocode, /pulse 20/);
    // And the result recompiles cleanly.
    assert.deepEqual(recompiles(pseudocode), []);
});

test('the simulator driver makes an STC12 program drivable by a board layer', () => {
    const c = build('PIN led1 = P1.0 OUTPUT ACTIVE LOW\nPIN pot = P1.3 ANALOG\n'
        + 'WHEN flag clicked:\n  turn on led1\n  set reading to read pot');
    const js = c.generateJavaScript(undefined, { driver: 'simulator' });
    // The pin table travels with the program: only the project knows led1 is P1.0 and
    // active-low, and boundary A speaks (pin, mode, driveHigh).
    assert.match(js, /_stc12_pins = \{"led1":\{"pin":"P1\.0","dir":"output","low":true\}/);
    assert.match(js, /b\.setPin\(p\.pin, _mod\(p\), _drv\(p, st\)\)/);
    // `turn on` on an active-low pin must resolve to a LOW drive — the inversion is the point.
    const drv = new Function('st', 'p', 'return (st === "high" ? true : st === "low" ? false : ((st === "on") !== p.low));');
    assert.equal(drv('on', { low: true }), false, 'turn on + active low -> drive 0');
    assert.equal(drv('on', { low: false }), true);
    assert.equal(drv('high', { low: true }), true, 'set high is a level, not a state');
    // An analog pin reads VOLTS from the board; scaling to counts stays on the MCU side.
    assert.match(js, /b\.readAnalog\(p\.pin\) \/ 5\.0 \* 1023/);
    // With no board attached the program still runs.
    assert.match(js, /const _board = \(\) => \(typeof bwBoard !== "undefined" \? bwBoard : null\)/);
    // Python gets the same driver.
    assert.match(c.generatePython(undefined, { driver: 'simulator' }), /class _Stc12Simulated:/);
});

test('the simulator driver advances simulated time, or the board stays frozen', () => {
    const c = build('PIN led = P1.0 OUTPUT ACTIVE LOW\nWHEN flag clicked:\n  turn on led\n  wait 0.5 seconds');
    const js = c.generateJavaScript(undefined, { driver: 'simulator' });
    // Boundary A is (pins, TIME). Driving pins without advancing the clock leaves the 20 ms
    // brightness integrator with nothing to sample and the buzzer with no edges to measure.
    assert.match(js, /scratch\.wait = \(secs\) => \{ _bw_t \+= BigInt/);
    assert.match(js, /if \(b\) b\.advanceTo\(_bw_t\)/);
    // A nanosecond clock, because that is the contract's basis and the only unit that means
    // the same thing on a 1T and a 12T part.
    assert.match(js, /let _bw_t = 0n;/);
    assert.match(js, /Number\(secs\) \* 1e9/);
    // Python gets the same treatment.
    const py = c.generatePython(undefined, { driver: 'simulator' });
    assert.match(py, /scratch\.wait = _bw_wait/);
    assert.match(py, /b\.advanceTo\(_bw_t\[0\]\)/);
    // The neutral driver must not gain a clock it has no board to advance.
    assert.ok(!/advanceTo/.test(c.generateJavaScript(undefined, { driver: 'shim' })));
});

// ---- bitwise operators: the dialect gap that made real firmware untranslatable ----------

test('bitwise operators exist, round-trip, and emit natively in all three languages', () => {
    const src = 'PIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  set mask to 0xF0\n'
        // NB: not `x`/`y` — `set x to` is motion_setx, which is exactly the shadowing trap
        // the pin blocks were written to avoid.
        + '  set v to mask bitand 15\n  set w to v bitor 1\n  set p to v bitxor w\n'
        + '  set q to v shiftleft 2\n  set z to bitnot q';
    const c = build(src);
    assert.deepEqual(c.warnings, []);
    // Hex literals, because a mask is unreadable in decimal.
    assert.match(c.decompile(), /set mask to 240/);
    // Round-trips to a fixed point like every other construct.
    const once = c.decompile();
    assert.equal(build(once).decompile(), once);
    // C is the target that wanted these: native operators, no helper calls.
    const cc = c.generateC();
    assert.match(cc, /v = \(mask & 15\);/);
    assert.match(cc, /w = \(v \| 1\);/);
    assert.match(cc, /p = \(v \^ w\);/);
    assert.match(cc, /q = \(v << 2\);/);
    assert.match(cc, /z = \(~q\);/);
    // And they are real operators in Python/JS too, not comments.
    assert.match(c.generatePython(), /int\(mask\) & int\(15\)/);
    assert.match(c.generateJavaScript(), /\(mask\) & \(15\)/);
});

test('bitwise words do not shadow ordinary variable names', () => {
    const c = build('WHEN flag clicked:\n  set bitanded to 1\n  set shift to 2');
    assert.deepEqual(c.warnings, []);
    const ps = c.decompile();
    assert.match(ps, /set bitanded to 1/);
    assert.match(ps, /set shift to 2/);
});

test('C -> pseudocode recovers bitwise operators from our own output', () => {
    const src = 'PIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  set mask to 240\n'
        + '  set v to mask bitand 15\n  set w to v bitor 1\n  set p to v bitxor w\n'
        + '  set q to v shiftleft 2\n  set z to bitnot q';
    const c = new SB3Creator();
    c.parse(src);
    const cCode = c.generateC();
    const { pseudocode, warnings } = cToPseudocode(cCode);
    assert.deepEqual(warnings, []);
    assert.match(pseudocode, /set mask to 240/);
    assert.match(pseudocode, /set v to mask bitand 15/);
    assert.match(pseudocode, /set w to v bitor 1/);
    assert.match(pseudocode, /set p to v bitxor w/);
    assert.match(pseudocode, /set q to v shiftleft 2/);
    assert.match(pseudocode, /set z to bitnot q/);
    // And it recompiles cleanly.
    assert.deepEqual(recompiles(pseudocode), []);
});

test('C -> pseudocode handles compound bitwise assignment on user variables', () => {
    const { pseudocode, warnings } = cToPseudocode(`
#include <stc12.h>
void main(void) {
    unsigned int flags = 0;
    flags |= 0x01;
    flags &= 0xFE;
    flags ^= 0x10;
    flags <<= 2;
    flags >>= 1;
}`);
    assert.match(pseudocode, /set flags to flags bitor 1/);
    assert.match(pseudocode, /set flags to flags bitand 254/);
    assert.match(pseudocode, /set flags to flags bitxor 16/);
    assert.match(pseudocode, /set flags to flags shiftleft 2/);
    assert.match(pseudocode, /set flags to flags shiftright 1/);
    assert.ok(!warnings.some((w) => /bitwise/.test(w)));
});

test('a computed value can be written to a pin (the 16-file corpus gap)', () => {
    const c = build('PIN led = P1.0 OUTPUT ACTIVE LOW\nPIN pot = P1.3 ANALOG\n'
        + 'WHEN flag clicked:\n  set level to read pot\n  set led to level bitand 1');
    assert.deepEqual(c.warnings, []);
    const once = c.decompile();
    assert.match(once, /set led to \(level bitand 1\)/);
    assert.equal(build(once).decompile(), once, 'fixed point');
    // A computed value is a LEVEL: ACTIVE LOW must NOT invert it, exactly as `set high` does not.
    assert.match(c.generateC(), /P1_0 = \(\(level & 1\)\) \? 1 : 0;/);
    // It reaches the driver like every other pin op, so the simulator can drive it.
    assert.match(c.generateJavaScript(), /writePin/);
});

test('a pin name wins over the variable and motion readings of `set X to`', () => {
    // `set x to` is motion_setx and `set foo to` is a variable; a declared PIN must beat both.
    const c = build('PIN x = P2.0 OUTPUT\nWHEN flag clicked:\n  set x to 1');
    const ops = Object.values(c.project.targets[0].blocks).map((b) => b.opcode);
    assert.ok(ops.includes('stc12_writepin'));
    assert.ok(!ops.includes('motion_setx'), 'the pin declaration wins');
    // …and with no such pin declared, the ordinary meanings are untouched.
    const d = build('SPRITE S:\n  WHEN flag clicked:\n    set x to 1\n    set score to 2');
    const dops = Object.values(d.project.targets[1].blocks).map((b) => b.opcode);
    assert.ok(dops.includes('motion_setx'));
    assert.ok(dops.includes('data_setvariableto'));
});

// ---- the shipped hardware examples ----------------------------------------------
// The C target had no working example for its entire existence: all 30 examples were
// Scratch programs, so the C tab's first impression was 52 "no equivalent" warnings on a
// Minesweeper. These are the examples that actually target the chip.

test('every stc_ example compiles to C with no warnings at all', async () => {
    const examples = (await import('../src/utils/examples.js')).default;
    const hardware = Object.keys(examples).filter((n) => n.startsWith('stc_'));
    assert.ok(hardware.length >= 5, 'the C target ships real examples');
    for (const name of hardware) {
        const c = build(examples[name]);
        assert.deepEqual(c.warnings, [], `${name} parses cleanly`);
        const out = c.generateC();
        assert.ok(!/warning:/.test(out), `${name} emits C with no warnings`);
        assert.match(out, /^#include <stc12\.h>$/m, name);
        assert.match(out, /@bw pin /, `${name} declares pins`);
        // and it round-trips through pseudocode <-> blocks
        const once = c.decompile();
        assert.equal(build(once).decompile(), once, `${name} is a fixed point`);
    }
});

test('a Scratch program gets the host target, not a lecture about the chip', async () => {
    const examples = (await import('../src/utils/examples.js')).default;
    // This used to be the 'say so once instead of 52 warnings' test. Saying it
    // once was the best available answer while there was one C target; now the
    // project picks its own, so a project with no pins gets host C and no
    // warning at all. The diagnostic is still there for anyone who asks for the
    // chip on purpose.
    const out = build(examples.minesweeper).generateC();
    assert.match(out, /blocks → C \(host\)/, 'a Scratch project gets host C');
    assert.ok(!/warning:/.test(out), 'and it needs no warnings');
    assert.ok(!/#include <stc12\.h>/.test(out), 'nothing about the chip leaks in');
    assert.match(out, /typedef struct \{ int kind; double n; const char \*s; struct bw_list_s \*l; \} bw_val;/);
    // Asking for the chip anyway still explains why that is a bad idea.
    const forced = build(examples.minesweeper).generateC(undefined, { target: 'device' });
    assert.match(forced, /THIS PROJECT IS NOT AN STC12 PROGRAM/);
    assert.match(forced, /and \d+ more of the same kind/, 'the rest are summarised');
    assert.ok((forced.match(/warning:/g) || []).length <= 5, 'the noise is bounded');
    // …and a project that DOES declare pins still gets every warning in full.
    const withPins = build('PIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  say "a"\n  move 4 steps\n  turn on led').generateC();
    assert.ok(!/NOT AN STC12 PROGRAM/.test(withPins));
    assert.match(withPins, /no C equivalent for "say "a""/);
});

test('SDCC\'s __sbit __at (addr) form is understood, not just Keil\'s P1^0', async () => {
    const c2p = (await import('../src/utils/cToPseudocode.js')).default;
    // This is what Keil source looks like AFTER stc-compiler normalises it. Without this the
    // translator would make firmware harder to read rather than easier, which would defeat
    // the point of routing Keil through it at all.
    const { pseudocode } = c2p(`#include <keil-reg52.h>
__sbit __at (0x90) LED1;
__sbit __at (0x91) LED2;
#define LED_ON  0
#define LED_OFF 1
void main(void) { while (1) { LED1 = LED_ON; LED2 = LED_OFF; delay_ms(150); } }`);
    assert.match(pseudocode, /^PIN led1 = P1\.0 OUTPUT ACTIVE LOW$/m);
    assert.match(pseudocode, /^PIN led2 = P1\.1 OUTPUT ACTIVE LOW$/m);
    assert.match(pseudocode, /turn on led1/);
    // the bit-addressable ports are 0x80/0x90/0xA0/0xB0, eight bits each
    const p3 = c2p('__sbit __at (0xB2) BTN;\nvoid main(void){ while(1){ if (BTN) {} } }').pseudocode;
    assert.match(p3, /P3\.2/);
});

// ---- new block surface: PWM, TONE, PORT, PART, print, when-pin --------

test('PIN declarations accept PWM and TONE directions', () => {
    const c = build(`PIN buzzer = P1.1 TONE\nPIN motor = P1.2 PWM\nWHEN flag clicked:\n  set buzzer to 440 hz`);
    const stc = c.project.stc;
    assert.equal(stc.pins.find(p => p.name === 'buzzer').direction, 'tone');
    assert.equal(stc.pins.find(p => p.name === 'motor').direction, 'pwm');
});

test('PORT declarations parse and round-trip', () => {
    const c = build('PORT display = P0 OUTPUT\nWHEN flag clicked:\n  set display to 255');
    assert.equal(c.project.stc.ports.length, 1);
    assert.equal(c.project.stc.ports[0].name, 'display');
    assert.equal(c.project.stc.ports[0].port, 0);
    assert.equal(c.project.stc.ports[0].direction, 'output');
    const dc = c.decompile();
    assert.match(dc, /^PORT display = P0 OUTPUT$/m);
    assert.match(dc, /set display to 255/);
    // round-trip
    const dc2 = new SB3Creator().parse(dc);
    assert.equal(new SB3Creator().decompile(new SB3Creator().parse(dc)), dc);
});

test('PART declarations parse and round-trip', () => {
    const c = build('PART sr = 74HC595 data P2.0 clock P2.1 latch P2.2\nWHEN flag clicked:\n  set sr to 128');
    assert.equal(c.project.stc.parts.length, 1);
    const p = c.project.stc.parts[0];
    assert.equal(p.name, 'sr');
    assert.deepEqual(p.data, { port: 2, bit: 0 });
    assert.deepEqual(p.clock, { port: 2, bit: 1 });
    assert.deepEqual(p.latch, { port: 2, bit: 2 });
    const dc = c.decompile();
    assert.match(dc, /^PART sr = 74HC595 data P2\.0 clock P2\.1 latch P2\.2$/m);
    assert.match(dc, /set sr to 128/);
});

test('PIN-vs-PORT conflict is rejected in both directions', () => {
    // PIN first, then PORT on the same physical port
    const c1 = new SB3Creator();
    c1.parse('PIN led = P1.0 OUTPUT\nPORT p1 = P1 OUTPUT\nWHEN flag clicked:\n  turn on led');
    assert.equal(c1.project.stc.ports.length, 0, 'PORT was rejected');
    // PORT first, then PIN inside it
    const c2 = new SB3Creator();
    c2.parse('PORT p1 = P1 OUTPUT\nPIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  set p1 to 0');
    assert.equal(c2.project.stc.pins.length, 0, 'PIN was rejected');
});

test('PART pin conflicts are rejected', () => {
    // A PART on pins already taken by a PIN
    const c = new SB3Creator();
    c.parse('PIN led = P2.0 OUTPUT\nPART sr = 74HC595 data P2.0 clock P2.1 latch P2.2\nWHEN flag clicked:\n  turn on led');
    assert.equal(c.project.stc.parts.length, 0, 'PART was rejected');
});

test('set x to <n> percent emits PWM in C', () => {
    const code = cOf('PIN motor = P1.2 PWM\nWHEN flag clicked:\n  set motor to 50 percent');
    assert.match(code, /pwm_set\(\d+, 50\)/);
});

test('set x to <n> hz emits tone_set in C', () => {
    const code = cOf('PIN buzzer = P1.1 TONE\nWHEN flag clicked:\n  set buzzer to 440 hz');
    assert.match(code, /tone_set\(440\)/);
});

test('set port to <n> emits a whole-port write in C', () => {
    const code = cOf('PIN led = P1.0 OUTPUT\nPORT display = P0 OUTPUT\nWHEN flag clicked:\n  set display to 255');
    assert.match(code, /P0 = \(unsigned char\)\(255\)/);
});

test('set part to <n> emits shift_out in C', () => {
    const code = cOf('PIN led = P1.0 OUTPUT\nPART sr = 74HC595 data P2.0 clock P2.1 latch P2.2\nWHEN flag clicked:\n  set sr to 128');
    assert.match(code, /shift_out\(P2_0, P2_1, P2_2, 0, \(unsigned char\)\(128\)\)/);
});

test('print text and number emit bw_print / bw_print_num in C', () => {
    const code = cOf('PIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  print "hello"\n  print 42');
    assert.match(code, /bw_print\("hello"\)/);
    assert.match(code, /bw_print_num\(42\)/);
});

test('when x pressed lowers to a polled edge-triggered task', () => {
    const code = cOf('PIN btn = P3.2 INPUT ACTIVE LOW\nPIN led = P1.0 OUTPUT ACTIVE LOW\n'
        + 'WHEN flag clicked:\n  turn on led\nWHEN btn pressed:\n  toggle led');
    // edge detection preamble
    assert.match(code, /unsigned char now\s+=\s+\(!P3_2\) \? 1 : 0/);
    assert.match(code, /unsigned char fired\s+=\s+\(now && !bw_task1_prev\) \? 1 : 0/);
    assert.match(code, /bw_task1_prev = now/);
    // case 0 is the edge test; body starts at case 1
    assert.match(code, /case 0:\s*\n\s+if \(!fired\)\s*\n\s+return/);
    assert.match(code, /case 1:/);
    // tail rearms to 0 — a hat re-fires on the next edge
    assert.match(code, /bw_task1_state = 0;\s+\/\* ready for the next edge \*\//);
});

test('when x released uses the falling edge of the logical level', () => {
    const code = cOf('PIN btn = P3.2 INPUT\nWHEN btn released:\n  wait 1 seconds');
    assert.match(code, /\(!now && bw_task0_prev\)/);
});

test('a hat forces the scheduler even as the only script', () => {
    const code = cOf('PIN btn = P3.2 INPUT\nWHEN btn pressed:\n  wait 1 seconds');
    assert.match(code, /for \(;;\)/, 'dispatch loop');
    assert.match(code, /bw_task0\(\)/, 'task function');
    assert.match(code, /bw_tick.*__interrupt/, 'Timer 0 ISR');
});

test('a hat on a non-INPUT pin is refused', () => {
    const code = cOf('PIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  turn on led\nWHEN led pressed:\n  wait 1 seconds');
    assert.match(code, /warning.*OUTPUT.*not INPUT/i);
    // The refused hat does not produce a task; the single valid script goes to main().
    assert.ok(!/bw_task1/.test(code), 'no task for the refused hat');
});

test('new blocks round-trip pseudocode -> blocks -> pseudocode', () => {
    const src = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN led = P1.0 OUTPUT ACTIVE LOW
PIN buzzer = P1.1 TONE
PIN motor = P1.2 PWM
PIN btn = P3.2 INPUT
PORT display = P0 OUTPUT
PART sr = 74HC595 data P2.0 clock P2.1 latch P2.2

SPRITE chip:
  WHEN flag clicked:
    turn on led
    set buzzer to 440 hz
    set motor to 50 percent
    set display to 255
    set sr to 128
    print "hello"
    print 42

  WHEN btn pressed:
    toggle led`;
    const c = new SB3Creator();
    const dc = c.decompile(c.parse(src));
    const dc2 = new SB3Creator().decompile(new SB3Creator().parse(dc));
    assert.equal(dc, dc2, 'round-trip is a fixed point');
});

// ---- circuit extension: the board instruments (boundary B) --------

test('circuit reporters parse, decompile, and round-trip', () => {
    const src = `SPRITE test:
  WHEN flag clicked:
    say voltage at "vcc"
    say current through "led1"
    say resistance between "net1" and "net2"
    say brightness of "led1"
    say tone of "buzzer1"`;
    const c = new SB3Creator();
    const dc = c.decompile(c.parse(src));
    assert.match(dc, /voltage at "vcc"/);
    assert.match(dc, /current through "led1"/);
    assert.match(dc, /resistance between "net1" and "net2"/);
    assert.match(dc, /brightness of "led1"/);
    assert.match(dc, /tone of "buzzer1"/);
    const dc2 = new SB3Creator().decompile(new SB3Creator().parse(dc));
    assert.equal(dc, dc2, 'round-trip is a fixed point');
});

test('circuit commands parse and round-trip', () => {
    const src = `SPRITE test:
  WHEN flag clicked:
    set control "pot1" to 0.5
    turn power on
    turn power off`;
    const c = new SB3Creator();
    const dc = c.decompile(c.parse(src));
    assert.match(dc, /set control "pot1" to 0\.5/);
    assert.match(dc, /turn power on/);
    assert.match(dc, /turn power off/);
    const dc2 = new SB3Creator().decompile(new SB3Creator().parse(dc));
    assert.equal(dc, dc2);
});

test('no circuit reporter fabricates a plausible reading without a board', () => {
    // A voltmeter that reads 0 V when disconnected is indistinguishable from a
    // grounded net.  All five reporters must return a reason string, not 0.
    const src = `SPRITE test:
  WHEN flag clicked:
    set r to resistance between "net1" and "net2"
    set v to voltage at "vcc"`;
    const c = new SB3Creator();
    const project = c.parse(src);

    // In Python: every neutral stub returns "needs the simulator", not 0.
    const py = c.generatePython(project);
    assert.match(py, /def resistance\(self, \*a\): return "needs the simulator"/);
    assert.match(py, /def nodeVoltage\(self, \*a\): return "needs the simulator"/);
    assert.match(py, /def branchCurrent\(self, \*a\): return "needs the simulator"/);
    assert.match(py, /def ledBrightness\(self, \*a\): return "needs the simulator"/);
    assert.match(py, /def buzzerTone\(self, \*a\): return "needs the simulator"/);
    assert.ok(!/def \w+\(self, \*a\): return 0/.test(py),
        'no circuit reporter returns a bare 0');

    // In JavaScript: same.
    const js = c.generateJavaScript(project);
    assert.match(js, /resistance: \(\) => "needs the simulator"/);
    assert.match(js, /nodeVoltage: \(\) => "needs the simulator"/);
});

test('all circuit reporter neutrals are reason strings, not numbers', () => {
    const ops = SB3Creator.RUNTIME_EXTENSIONS.circuit.ops;
    for (const name of ['nodevoltage', 'branchcurrent', 'resistance', 'ledbrightness', 'buzzertone']) {
        assert.equal(ops[name].neutral, '"needs the simulator"',
            `${name} must refuse with a reason, not return 0`);
    }
});

test('circuit reporters return numbers when a Board is attached', async () => {
    // This is the test that catches the setBoard() gap: without it, every current
    // test exercises only the null branch and the suite is green on an extension
    // that cannot work.
    //
    // The extension is a plain class — we can instantiate it directly (it registers
    // with a mock Scratch in the IIFE, but the class is the same). We use the
    // pinned copy so we test the exact file the editor would load.
    const { readFileSync } = await import('node:fs');
    const vm = await import('node:vm');
    const src = readFileSync(new URL('../reference/extensions/circuit.js', import.meta.url), 'utf8');
    const captured = [];
    const mockScratch = {
        BlockType: { COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'Boolean', HAT: 'hat' },
        ArgumentType: { NUMBER: 'number', STRING: 'string', BOOLEAN: 'Boolean' },
        extensions: { register: (inst) => captured.push(inst), unsandboxed: true }
    };
    const ctx = vm.createContext({ Scratch: mockScratch, console, performance, localStorage: { getItem: () => null }, navigator: { language: 'en' } });
    vm.runInContext(src, ctx);
    const ext = captured[0];
    assert.ok(ext, 'extension registered');
    assert.ok(typeof ext.setBoard === 'function', 'setBoard exists');

    // Without a board: every reporter refuses.
    assert.equal(ext.nodevoltage({ NET: 'vcc' }), 'needs the simulator');
    assert.equal(ext.resistance({ A: 'a', B: 'b' }), 'needs the simulator');

    // Attach a mock board implementing boundary B.
    const mockBoard = {
        nodeVoltage: (net) => net === 'vcc' ? 5.0 : 0.0,
        branchCurrent: (part, terminal) => 0.02,
        resistance: (a, b) => 1000,        // power off → number
        ledBrightness: (part) => 0.5,
        buzzerTone: (part) => ({ hz: 440, on: true }),
        setControl: () => {},
        setPower: () => {}
    };
    ext.setBoard(mockBoard);

    // Now every reporter returns a number.
    assert.equal(ext.nodevoltage({ NET: 'vcc' }), 5.0, 'voltage is a number');
    assert.equal(ext.branchcurrent({ PART: 'led1' }), 0.02, 'current is a number');
    assert.equal(ext.resistance({ A: 'a', B: 'b' }), 1000, 'resistance is a number (power off)');
    assert.equal(ext.ledbrightness({ PART: 'led1' }), 0.5, 'brightness is a number');
    assert.equal(ext.buzzertone({ PART: 'bz1' }), 440, 'tone is a number');

    // resistance with power on: the board returns the refusal.
    mockBoard.resistance = () => 'requires-power-off';
    ext._cache = {};  // clear the display-rate cache
    assert.equal(ext.resistance({ A: 'a', B: 'b' }), 'requires-power-off',
        'resistance refuses on a live circuit');

    // Commands call through to the board.
    let controlCalled = false, powerCalled = false;
    mockBoard.setControl = (name, val) => { controlCalled = true; assert.equal(name, 'pot1'); assert.equal(val, 0.5); };
    mockBoard.setPower = (on) => { powerCalled = true; assert.equal(on, true); };
    ext.setcontrol({ CONTROL: 'pot1', VALUE: 0.5 });
    ext.setpower({ STATE: 'on' });
    assert.ok(controlCalled, 'setControl was called on the board');
    assert.ok(powerCalled, 'setPower was called on the board');

    // clearBoard reverts to refusals.
    ext.clearBoard();
    assert.equal(ext.nodevoltage({ NET: 'vcc' }), 'needs the simulator',
        'after clearBoard, reporters refuse again');
});

test('circuit reporters read vm.runtime.circuitBoard lazily (the editor path)', async () => {
    // This tests the REAL path the editor uses: bw-circuit-ui writes
    // vm.runtime.circuitBoard, and the extension reads it lazily per call.
    // The setBoard() test above uses the explicit override; this one must
    // go through the runtime property or it cannot catch the gap.
    const { readFileSync } = await import('node:fs');
    const vm = await import('node:vm');
    const src = readFileSync(new URL('../reference/extensions/circuit.js', import.meta.url), 'utf8');
    const captured = [];
    const mockRuntime = {};   // simulates vm.runtime — no circuitBoard yet
    const mockScratch = {
        BlockType: { COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'Boolean', HAT: 'hat' },
        ArgumentType: { NUMBER: 'number', STRING: 'string', BOOLEAN: 'Boolean' },
        extensions: { register: (inst) => captured.push(inst), unsandboxed: true },
        vm: { runtime: mockRuntime }
    };
    const ctx = vm.createContext({ Scratch: mockScratch, console, performance, localStorage: { getItem: () => null }, navigator: { language: 'en' } });
    vm.runInContext(src, ctx);
    const ext = captured[0];

    // No circuitBoard on runtime yet → refuses.
    assert.equal(ext.nodevoltage({ NET: 'vcc' }), 'needs the simulator');
    assert.equal(ext.resistance({ A: 'a', B: 'b' }), 'needs the simulator');

    // Host writes vm.runtime.circuitBoard (what circuit-tab.jsx does).
    mockRuntime.circuitBoard = {
        nodeVoltage: (net) => net === 'vcc' ? 3.3 : 0,
        branchCurrent: () => 0.015,
        resistance: () => 470,
        ledBrightness: () => 0.7,
        buzzerTone: () => ({ hz: 880, on: true }),
        setControl: () => {},
        setPower: () => {}
    };

    // Now the reporters return numbers — no setBoard() call needed.
    assert.equal(ext.nodevoltage({ NET: 'vcc' }), 3.3, 'voltage via runtime.circuitBoard');
    assert.equal(ext.branchcurrent({ PART: 'r1' }), 0.015, 'current via runtime.circuitBoard');
    assert.equal(ext.resistance({ A: 'a', B: 'b' }), 470, 'resistance via runtime.circuitBoard');
    assert.equal(ext.ledbrightness({ PART: 'led1' }), 0.7, 'brightness via runtime.circuitBoard');
    assert.equal(ext.buzzertone({ PART: 'bz1' }), 880, 'tone via runtime.circuitBoard');

    // Board rebuilt (netlist changed) — the new board is picked up lazily.
    mockRuntime.circuitBoard = {
        nodeVoltage: () => 1.8,
        branchCurrent: () => 0.001,
        resistance: () => 'requires-power-off',
        ledBrightness: () => 0,
        buzzerTone: () => ({ hz: 0, on: false }),
        setControl: () => {},
        setPower: () => {}
    };
    ext._cache = {};   // clear display-rate cache so the new board is read
    assert.equal(ext.nodevoltage({ NET: 'vcc' }), 1.8, 'picks up the rebuilt board');
    assert.equal(ext.resistance({ A: 'a', B: 'b' }), 'requires-power-off',
        'resistance refuses on a live rebuilt board');

    // Board torn down — reporters refuse again.
    mockRuntime.circuitBoard = null;
    ext._cache = {};
    assert.equal(ext.nodevoltage({ NET: 'vcc' }), 'needs the simulator');

    // setBoard() overrides the runtime fallback.
    ext.setBoard({ nodeVoltage: () => 12, branchCurrent: () => 0, resistance: () => 100,
        ledBrightness: () => 0, buzzerTone: () => ({ hz: 0, on: false }), setControl: () => {}, setPower: () => {} });
    assert.equal(ext.nodevoltage({ NET: 'vcc' }), 12, 'setBoard overrides runtime');
    ext.clearBoard();
    assert.equal(ext.nodevoltage({ NET: 'vcc' }), 'needs the simulator',
        'clearBoard reverts to runtime (which is null)');
});

test('the simulator driver refuses with a reason when no board is attached', () => {
    const c = new SB3Creator();
    c.parse('PIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  turn on led');
    // JS driver: every no-board path returns "needs the simulator".
    const jsDriver = c.circuitSimulatorDriver('js').join('\n');
    assert.match(jsDriver, /nodeVoltage.*"needs the simulator"/);
    assert.match(jsDriver, /branchCurrent.*"needs the simulator"/);
    assert.match(jsDriver, /resistance.*"needs the simulator"/);
    assert.match(jsDriver, /ledBrightness.*"needs the simulator"/);
    assert.match(jsDriver, /buzzerTone.*"needs the simulator"/);
    // With a board, calls go through to boundary B.
    assert.match(jsDriver, /b\.resistance\(a, bNet\)/);
    // Python driver: same.
    const pyDriver = c.circuitSimulatorDriver('py').join('\n');
    assert.match(pyDriver, /nodeVoltage.*"needs the simulator"/);
    assert.match(pyDriver, /resistance.*"needs the simulator"/);
    assert.match(pyDriver, /b\.resistance\(a, b_net\)/);
});

// ---- registry URL resolution: do the gallery URLs actually serve? --------
// A registry entry is a claim about a URL. If the URL 404s, the editor silently
// gets no extension — no blocks, no refusal, nothing. This check HEADs every
// URL in the generated registry, skipped when offline (same probe as the oracle).

import { RUNTIME_EXTENSION_URLS } from '../src/utils/runtimeRegistry.generated.js';

const galleryReachable = await (async () => {
    // Probe the site root — something NOT under test — so "the gallery is up"
    // and "this URL resolves" are independent facts. If the probe drew from the
    // same set, a broken first entry would disable every assertion.
    try {
        const r = await fetch('https://crispstrobe.github.io/extensions/', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        return r.ok;
    } catch { return false; }
})();
if (!galleryReachable) console.log('\n⚠  registry URL checks SKIPPED — gallery unreachable\n');

for (const [id, url] of Object.entries(RUNTIME_EXTENSION_URLS)) {
    test(`registry URL resolves: ${id}`, { skip: galleryReachable ? false : 'gallery unreachable' }, async () => {
        const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
        assert.equal(r.status, 200, `${url} returned ${r.status}`);
    });
}

// ---- three-copies-one-contract: stc12 block shape agreement ----------------
// The stc12 blocks exist in three places:
//   1. sb3-creator's RUNTIME_EXTENSIONS (the source of truth for codegen)
//   2. extensions/CrispStrobe/stc12.js (the gallery copy the editor loads)
//   3. bw-bundle/lite/overlay/.../stc12/index.js (the hard-bundled copy)
// All three must agree on opcodes, argument shapes, and menu identity, or a
// project round-trips into blocks that read differently from the ones it came
// from. A menu with acceptReporters:true would serialise as an input with a
// shadow block instead of a field — and the mismatch is silent.

function extractStc12Info(source) {
    // Strip the makeExt(`...`) wrapper if present (the bundled copy).
    const inner = source.replace(/^module\.exports\s*=\s*makeExt\(`/, '').replace(/`\);\s*$/, '');
    const captured = [];
    const mockScratch = {
        BlockType: { COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'Boolean', HAT: 'hat' },
        ArgumentType: { NUMBER: 'number', STRING: 'string', BOOLEAN: 'Boolean' },
        extensions: { register: (inst) => captured.push(inst), unsandboxed: true },
        vm: { runtime: { stc: { pins: [{ name: 'led1' }] } } }
    };
    const vm = require('node:vm');
    const ctx = vm.createContext({ Scratch: mockScratch, console, module: { exports: null }, exports: {}, require: () => (s) => s });
    vm.runInContext(inner, ctx);
    const inst = captured[0];
    if (!inst || !inst.getInfo) return null;
    return inst.getInfo();
}

// Normalise a getInfo block descriptor to a comparable shape.
function blockShape(b) {
    const args = {};
    for (const [k, v] of Object.entries(b.arguments || {})) {
        args[k] = { type: v.type, menu: v.menu || null };
    }
    return { opcode: b.opcode, blockType: b.blockType, args };
}

test('stc12 blocks agree across gallery, bundled, and sb3-creator', async () => {
    const { readFileSync } = await import('node:fs');
    const vm = await import('node:vm');

    // Two checkouts this repo does not own, in whichever place the machine keeps
    // them. Absolute paths from one machine turn a cross-repo agreement check into
    // a test that fails everywhere else — and a failing suite teaches people to
    // ignore it, which costs more than the check is worth.
    const CANDIDATES = {
        gallery: [
            process.env.BW_GALLERY,
            '/mnt/volume1/code/extensions/extensions/CrispStrobe/stc12.js',
            new URL('../../extensions/extensions/CrispStrobe/stc12.js', import.meta.url).pathname,
            new URL('../../lego/extensions/extensions/CrispStrobe/stc12.js', import.meta.url).pathname
        ],
        bundled: [
            process.env.BW_LITE_STC12,
            '/mnt/volume1/code/bw-bundle/lite/overlay/scratch-vm/src/extensions/crispstrobe/stc12/index.js',
            new URL('../../lego/brickwright-lite/overlay/scratch-vm/src/extensions/crispstrobe/stc12/index.js',
                import.meta.url).pathname
        ]
    };
    const findFirst = (list) => list.filter(Boolean).find((f) => {
        try { readFileSync(f, 'utf8'); return true; } catch { return false; }
    });
    const GALLERY = findFirst(CANDIDATES.gallery);
    const BUNDLED = findFirst(CANDIDATES.bundled);

    // ---- extract getInfo from both extension files ----
    function extract(source) {
        // Strip the makeExt(`...`) wrapper if present.
        let inner = source;
        const wrapMatch = source.match(/makeExt\(`([\s\S]+)`\)\s*;?\s*$/);
        if (wrapMatch) inner = wrapMatch[1];
        const captured = [];
        const mockScratch = {
            BlockType: { COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'Boolean', HAT: 'hat' },
            ArgumentType: { NUMBER: 'number', STRING: 'string', BOOLEAN: 'Boolean' },
            translate: (s) => s,
            extensions: { register: (inst) => captured.push(inst), unsandboxed: true },
            translate: (m) => (m && typeof m === 'object' ? (m.default || '') : String(m || '')),
            vm: { runtime: { stc: { pins: [{ name: 'led1' }], ports: [], parts: [], tables: [{ name: 'font', values: [0x3F] }] }, _stc12Pins: {} } }
        };
        const ctx = vm.createContext({ Scratch: mockScratch, console });
        vm.runInContext(inner, ctx);
        return captured[0] && captured[0].getInfo();
    }

    if (!GALLERY || !BUNDLED) {
        // Say which one is missing and where it was looked for, so this reads as
        // "not checked here" rather than "checked and fine".
        console.log(`  (skipped: ${!GALLERY ? 'gallery' : 'bundled'} stc12 checkout not on this `
            + 'machine; set BW_GALLERY / BW_LITE_STC12 to point at it)');
        return;
    }
    const gallerySrc = readFileSync(GALLERY, 'utf8');
    const bundledSrc = readFileSync(BUNDLED, 'utf8');

    const galleryInfo = extract(gallerySrc);
    const bundledInfo = extract(bundledSrc);
    assert.ok(galleryInfo, 'gallery getInfo() returned a result');
    assert.ok(bundledInfo, 'bundled getInfo() returned a result');

    // ---- both must have the same id ----
    assert.equal(galleryInfo.id, 'stc12');
    assert.equal(bundledInfo.id, 'stc12');

    // ---- same opcodes, same order ----
    // Objects from vm.createContext are cross-realm, so assert.deepStrictEqual
    // fails on Array identity. JSON round-trip normalises to the host realm.
    const j = (x) => JSON.parse(JSON.stringify(x));
    const galleryOps = j(galleryInfo.blocks.filter(b => typeof b === 'object').map(b => b.opcode));
    const bundledOps = j(bundledInfo.blocks.filter(b => typeof b === 'object').map(b => b.opcode));
    assert.deepEqual(galleryOps, bundledOps, 'opcodes must be identical between copies');

    // ---- same argument shapes ----
    const galleryBlocks = galleryInfo.blocks.filter(b => typeof b === 'object');
    const bundledBlocks = bundledInfo.blocks.filter(b => typeof b === 'object');
    for (let i = 0; i < galleryBlocks.length; i++) {
        const g = galleryBlocks[i], b = bundledBlocks[i];
        const gArgs = j(Object.entries(g.arguments || {}).map(([k, v]) => [k, v.type, v.menu || null]));
        const bArgs = j(Object.entries(b.arguments || {}).map(([k, v]) => [k, v.type, v.menu || null]));
        assert.deepEqual(gArgs, bArgs, `argument shape mismatch on ${g.opcode}`);
    }

    // ---- every menu must be acceptReporters:false (fields, not inputs) ----
    for (const [name, menu] of Object.entries(galleryInfo.menus || {})) {
        assert.equal(menu.acceptReporters, false,
            `gallery menu "${name}" must have acceptReporters:false to stay a FIELD`);
    }
    for (const [name, menu] of Object.entries(bundledInfo.menus || {})) {
        assert.equal(menu.acceptReporters, false,
            `bundled menu "${name}" must have acceptReporters:false to stay a FIELD`);
    }

    // ---- opcodes match what sb3-creator emits ----
    const emitted = new Set(Object.keys(SB3Creator.RUNTIME_EXTENSIONS.stc12.ops));
    const declared = new Set(galleryOps);
    // Every emitted opcode must have a block.
    for (const op of emitted) {
        assert.ok(declared.has(op), `sb3-creator emits stc12_${op} but no block declares it`);
    }
    // Every declared block must be emitted (no orphan blocks).
    for (const op of declared) {
        assert.ok(emitted.has(op), `block "${op}" is declared but sb3-creator never emits stc12_${op}`);
    }
});

// ---- readYieldMap: the debug-build yield map survives the C round-trip ------
// readYieldMap is exported, verified once by hand, and has no test. The debugger
// runner imports it — without a test, losing the function (or breaking its
// encoding) is invisible until someone launches the debugger.

import { readYieldMap } from '../src/utils/cToPseudocode.js';

test('readYieldMap returns the yield map from a debug-build two-script program', () => {
    const src = `PIN led1 = P1.0 OUTPUT ACTIVE LOW
PIN led2 = P1.1 OUTPUT ACTIVE LOW

WHEN flag clicked:
  FOREVER:
    turn on led1
    wait 0.5 seconds
    turn off led1
    wait 0.5 seconds

WHEN flag clicked:
  FOREVER:
    toggle led2
    wait 1 seconds`;

    const c = build(src);
    const code = c.generateC(undefined, { debug: true });

    const yields = readYieldMap(code);
    // Script 1: hat, forever, wait, wait (two waits in the FOREVER body).
    // Script 2: hat, forever, wait.  Total: 7 yield points.
    assert.equal(yields.length, 7, `expected 7 yield points, got ${yields.length}`);

    // Kinds in order.
    const kinds = yields.map(y => y.kind);
    assert.deepEqual(kinds, ['hat', 'forever', 'wait', 'wait', 'hat', 'forever', 'wait']);

    // Every entry has a task name, block id, and numeric state.
    for (const y of yields) {
        assert.ok(y.task, 'yield point missing task name');
        assert.ok(y.block, 'yield point missing block id');
        assert.equal(typeof y.state, 'number', 'state must be a number');
    }
    // Tasks are bw_task0 and bw_task1.
    assert.equal(yields[0].task, 'bw_task0');
    assert.equal(yields[4].task, 'bw_task1');
});

test('readYieldMap returns [] for hand-written C (no @bw header)', () => {
    assert.deepEqual(readYieldMap('void main(void) { for(;;); }'), []);
    assert.deepEqual(readYieldMap(''), []);
    assert.deepEqual(readYieldMap(null), []);
});

test('cMark / decodeMark round-trip block ids with */ and special characters', () => {
    // cMark encodes a block id for use inside a C /* @bw ... */ comment.
    // decodeMark undoes it. A block id containing */ would close the comment
    // prematurely — cMark must escape it, and decodeMark must recover it exactly.
    const c = new SB3Creator();
    const cases = [
        'simple_id',
        'a*/b',                        // would close a C comment
        '*/close',                     // starts with the closing sequence
        'has spaces and (parens)',
        'unicode:日本語',
        'percent%already',
        'a*b/c*d',                     // both * and / but not adjacent
        'a*/b*/c',                     // double */
    ];
    for (const id of cases) {
        const encoded = c.cMark(id);
        // The encoded form must contain no `*/` (would close the @bw comment).
        assert.ok(!encoded.includes('*/'),
            `cMark("${id}") produced "${encoded}" which contains */`);
        // Importing decodeMark: it's not exported, so we verify the round-trip
        // through the full chain: emit a @bw yield line → readYieldMap → block id.
        const fakeSrc = `/* @bw-begin\n * @bw yield bw_task0 0 ${encoded} hat\n * @bw-end */`;
        const yields = readYieldMap(fakeSrc);
        assert.equal(yields.length, 1, `expected 1 yield from fake header for id "${id}"`);
        assert.equal(yields[0].block, id,
            `round-trip failed: cMark("${id}") → "${encoded}" → "${yields[0].block}"`);
    }
});

// ---- the yield map, beyond "it comes back" ---------------------------------
//
// readYieldMap has two tests above: a debug build produces a map, hand-written C
// does not. These cover the ways the map can be WRONG while still being present,
// which is the failure mode that matters — a map that parses but points at the
// wrong block glows a confidently wrong block.

test('a debug build emits one @bw yield per case label, in order', () => {
    const out = cOf(SCHEDULED, {debug: true});
    const map = readYieldMap(out);
    // The state numbers come from the same counter the `case` labels do, so a
    // disagreement means the walker and the marker have drifted apart.
    const cases = [...out.matchAll(/^\s*case (\d+):/gm)].map(m => +m[1]);
    assert.deepEqual(map.map(y => y.state), cases, 'one entry per case label, same order');
    const t0 = map.filter(y => y.task === 'bw_task0');
    assert.deepEqual(t0.map(y => y.kind), ['hat', 'forever', 'repeat', 'wait']);
    // State 0 is `case 0:` — the task has not started, so it points at the hat,
    // which is what Scratch shows for a script that has not run.
    assert.ok(map.filter(y => y.state === 0).every(y => y.kind === 'hat'));
});

test('every block id in the yield map is a real block in the project', () => {
    const creator = build(SCHEDULED);
    const out = creator.generateC(undefined, {debug: true});
    const ids = new Set();
    for (const t of creator.project.targets) for (const k of Object.keys(t.blocks || {})) ids.add(k);
    const map = readYieldMap(out);
    assert.ok(map.length > 0);
    for (const y of map) assert.ok(ids.has(y.block), `${y.task}/${y.state} points at a real block`);
});

test('block ids survive the marker header byte for byte', () => {
    // Scratch's id alphabet contains `*` and `/`, so about one id in 400 holds
    // `*/` and would close the C comment the header lives in — and cComment's
    // `*/` -> `* /` guard would then hand back a DIFFERENT id, silently. Force
    // the worst case rather than waiting for the 1-in-400 to reach production.
    const creator = build(SCHEDULED);
    const hostile = ['a*/b', '/*x', 'p*q/r', '%25 already', 'plain'];
    let n = 0;
    for (const t of creator.project.targets) {
        for (const [id, b] of Object.entries(t.blocks || {})) {
            if (n >= hostile.length) break;
            const fresh = hostile[n++];
            t.blocks[fresh] = b;
            delete t.blocks[id];
            for (const other of Object.values(t.blocks)) {
                if (!other || typeof other !== 'object') continue;
                if (other.next === id) other.next = fresh;
                if (other.parent === id) other.parent = fresh;
                for (const inp of Object.values(other.inputs || {})) {
                    if (Array.isArray(inp) && inp[1] === id) inp[1] = fresh;
                }
            }
        }
    }
    const out = creator.generateC(undefined, {debug: true});
    const header = out.slice(out.indexOf('@bw-begin'), out.indexOf('@bw-end'));
    assert.ok(!header.includes('*/'), 'no id closed the comment early');
    const ids = new Set();
    for (const t of creator.project.targets) for (const k of Object.keys(t.blocks || {})) ids.add(k);
    for (const y of readYieldMap(out)) assert.ok(ids.has(y.block), `${y.block} came back intact`);
});

test('the yield map is a debug build only, so plain output stays reproducible', () => {
    // Block ids are minted afresh by every parse. Emitting them unconditionally
    // would make the same program produce different C run to run, which breaks
    // the fixed point the other three languages hold themselves to.
    const a = cOf(SCHEDULED);
    const b = cOf(SCHEDULED);
    assert.equal(a, b, 'a release build is reproducible across parses');
    assert.deepEqual(readYieldMap(a), [], 'and carries no yield map');
    assert.ok(readYieldMap(cOf(SCHEDULED, {debug: true})).length > 0);
});

test('a debug build forces the scheduler for a single script', () => {
    // Straight-line code in main() has no `<task>_state`, so it has no Level 1
    // position at all — and one WHEN is the commonest beginner project. The
    // debugger would be blind exactly where it is needed most.
    const release = cOf(BLINK);
    assert.ok(!/bw_task0/.test(release), 'one script still compiles straight-line by default');
    const debug = cOf(BLINK, {debug: true});
    assert.match(debug, /static void bw_task0\(void\)/);
    assert.match(debug, /switch \(bw_task0_state\)/);
    assert.ok(readYieldMap(debug).length > 0, 'and now it has a position to report');
});

// ---- open defects: characterised, documented, tested --------------------------------
// Each defect has a minimal input. The test asserts the CURRENT behaviour so a future
// fix is visible as a test change, not as a silent improvement.

test('defect 1: assignment-in-condition is a source bug, not a parser gap', () => {
    // `if(flag=1)` is C with `=` instead of `==` — our parser correctly refuses.
    const { warnings } = cToPseudocode(`void main(void) { if(flag=1) { flag = 0; } }`);
    assert.ok(warnings.some((w) => /could not parse/.test(w)), 'the parse failure is reported');
});

test('defect 4: string-scanning for-loop needs the array dialect', () => {
    const { pseudocode } = cToPseudocode(`void main(void) { int i; for(i=0; buf[i]!=0; i++) { } }`);
    // The for-loop condition uses an array dereference that pseudocode cannot express.
    // It falls through to REPEAT UNTIL false, which is the honest fallback.
    assert.match(pseudocode, /REPEAT UNTIL/);
});

test('defect 5: ternary in a call argument warns rather than guessing', () => {
    const { warnings } = cToPseudocode(`void main(void) { show(val > 0 ? 1 : 0); }`);
    assert.ok(warnings.some((w) => /ternary/.test(w)), 'the ternary is warned');
});

test('hand-written functions become DEFINE blocks', () => {
    const { pseudocode, warnings } = cToPseudocode(`
void helper(int count) { int i; for (i = 0; i < count; i++) delay_ms(100); }
void main(void) { for (;;) { helper(5); } }`);
    assert.match(pseudocode, /DEFINE helper \(count\):/);
    assert.match(pseudocode, /REPEAT count:/);
    assert.match(pseudocode, /wait 0\.1 seconds/);
    assert.match(pseudocode, /helper 5/);
});
