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
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
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
    assert.match(c, /static long counter = 0;/);  // long: 16-bit int overflowed real ADC math
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
    assert.match(c, /while \(!\(\(!P3_2 > 0\)\)\) ;/);
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
    assert.match(c, /static long adc_read\(unsigned char channel\)/);  // long return promotes `raw * 5000`
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
    assert.match(c, /static long int_ = 0;/);
    assert.match(c, /static long my_score = 0;/);
    assert.match(c, /int_ = 1;/);
    assert.match(c, /my_score \+= 2;/);
});

test('custom blocks become static functions with long parameters', () => {
    const c = cOf(SCHEDULED);
    assert.match(c, /static void \w*do_pulse\(long ms\);/, 'prototype');
    assert.match(c, /static void \w*do_pulse\(long ms\)\n\{/, 'definition');
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
        const probe = await fetch(`${ORACLE.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(10000) });
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
    // `q` marks the 8051 family: its INPUT pins really are quasi
    // (weak pull-up); board-class inputs get their PROGRAMMED pull
    // instead (the 70-calculator every-key-reads-9 defect).
    assert.match(js, /_stc12_pins = \{"led1":\{"pin":"P1\.0","dir":"output","low":true,"q":true\}/);
    assert.match(js, /p\.q \? "quasi" : \(p\.low \? "input-pullup" : "input-pulldown"\)/);
    assert.match(js, /b\.setPin\(p\.pin, _mod\(p\), _drv\(p, st\)\)/);
    // `turn on` on an active-low pin must resolve to a LOW drive — the inversion is the point.
    const drv = new Function('st', 'p', 'return (st === "high" ? true : st === "low" ? false : ((st === "on") !== p.low));');
    assert.equal(drv('on', { low: true }), false, 'turn on + active low -> drive 0');
    assert.equal(drv('on', { low: false }), true);
    assert.equal(drv('high', { low: true }), true, 'set high is a level, not a state');
    // An analog pin reads VOLTS from the board; scaling to counts stays on the MCU side.
    assert.match(js, /b\.readAnalog\(p\.pin\) \/ 5\.0 \* 1023/);
    // With no board attached the program still runs; when one appears,
    // its INPUT pins are armed (pulls stamped) once per board instance.
    assert.match(js, /const _board = \(\) => \{ const b = \(typeof bwBoard !== "undefined" \? bwBoard : null\); _bw_arm\(b\); return b; \}/);
    assert.match(js, /if \(p\.dir !== "output"\) b\.setPin\(p\.pin, _mod\(p\), false\)/);
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

test('set part to <n> emits shift_out in C (8051)', () => {
    const code = cOf('PIN led = P1.0 OUTPUT\nPART sr = 74HC595 data P2.0 clock P2.1 latch P2.2\nWHEN flag clicked:\n  set sr to 128');
    assert.match(code, /shift_out\(P2_0, P2_1, P2_2, 0, \(unsigned char\)\(128\)\)/);
    // Helper function body must be emitted
    assert.match(code, /static void shift_out\(__sbit data_pin/);
    // PART pins set up as push-pull outputs
    assert.match(code, /P2_0 = 0;/, '8051 PART data pin starts LOW');
    assert.match(code, /P2_1 = 0;/, '8051 PART clock pin starts LOW');
    assert.match(code, /P2_2 = 0;/, '8051 PART latch pin starts LOW');
});

test('set part to <n> emits shift_out in C (AVR)', () => {
    const code = cOf('DEVICE ARDUINO-UNO\nPIN led = D13 OUTPUT\nPART sr = 74HC595 data D2 clock D4 latch D7\nWHEN flag clicked:\n  set sr to 128');
    // Call site: pointer + bit for each pin
    assert.match(code, /shift_out\(&PORTD, 2, &PORTD, 4, &PORTD, 7, 0, \(unsigned char\)\(128\)\)/);
    // Helper function body
    assert.match(code, /static void shift_out\(volatile uint8_t \*dp/);
    // PART pin direction setup: DDR + initial level
    assert.match(code, /DDRD  \|= \(1 << 2\);/, 'AVR PART data DDR');
    assert.match(code, /DDRD  \|= \(1 << 4\);/, 'AVR PART clock DDR');
    assert.match(code, /DDRD  \|= \(1 << 7\);/, 'AVR PART latch DDR');
});

test('set part to <n> emits shift_out in C (ARM/Pico)', () => {
    const code = cOf('DEVICE PICO\nPIN led = GP25 OUTPUT\nPART sr = 74HC595 data GP10 clock GP11 latch GP12\nWHEN flag clicked:\n  set sr to 128');
    // Call site: GPIO numbers
    assert.match(code, /shift_out\(10, 11, 12, 0, \(unsigned char\)\(128\)\)/);
    // Helper function body
    assert.match(code, /static void shift_out\(uint8_t data_gpio/);
    // PART pin direction setup: funcsel + OE
    assert.match(code, /BW_SIO_GPIO_OE_SET = \(1UL << 10\);/, 'ARM PART data OE');
    assert.match(code, /BW_SIO_GPIO_OE_SET = \(1UL << 11\);/, 'ARM PART clock OE');
    assert.match(code, /BW_SIO_GPIO_OE_SET = \(1UL << 12\);/, 'ARM PART latch OE');
});

test('set part to <n> emits shift_out in C (6502)', () => {
    const code = cOf('DEVICE EATER6502\nPIN led = PA0 OUTPUT\nPART sr = 74HC595 data PA1 clock PA2 latch PA3\nWHEN flag clicked:\n  set sr to 128');
    // Call site: VIA port pointer + bit
    assert.match(code, /shift_out\(&BW_VIA_ORA, 1, &BW_VIA_ORA, 2, &BW_VIA_ORA, 3, 0, \(unsigned char\)\(128\)\)/);
    // Helper function body (same as AVR: pointer+bit)
    assert.match(code, /static void shift_out\(volatile uint8_t \*dp/);
    // PART pin direction setup: DDR
    assert.match(code, /BW_VIA_DDRA \|= \(uint8_t\)\(1 << 1\);/, '6502 PART data DDR');
    assert.match(code, /BW_VIA_DDRA \|= \(uint8_t\)\(1 << 2\);/, '6502 PART clock DDR');
    assert.match(code, /BW_VIA_DDRA \|= \(uint8_t\)\(1 << 3\);/, '6502 PART latch DDR');
});

test('8051 shift_out emission is byte-identical to golden', () => {
    // The 8051 call site must not change — goldens depend on it.
    const code = cOf('PIN led = P1.0 OUTPUT\nPART sr = 74HC595 data P2.0 clock P2.1 latch P2.2\nWHEN flag clicked:\n  set sr to 128');
    // Exact golden call site (no leading spaces, no trailing whitespace variation)
    const callLine = code.split('\n').find((l) => l.includes('shift_out(P2_0'));
    assert.ok(callLine, 'shift_out call site must exist');
    assert.match(callLine.trim(), /^shift_out\(P2_0, P2_1, P2_2, 0, \(unsigned char\)\(128\)\);$/);
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

    // In Python: every neutral stub returns float("nan"), not 0.
    const py = c.generatePython(project);
    assert.match(py, /float\("nan"\)/,
        'Python driver must return float("nan") for no-board reporters');
    assert.ok(!/def \w+\(self, \*a\): return 0/.test(py),
        'no circuit reporter returns a bare 0');

    // In JavaScript: same — NaN, not a string.
    const js = c.generateJavaScript(project);
    assert.match(js, /nodeVoltage.*NaN/);
    assert.match(js, /resistance.*NaN/);
});

test('all circuit reporter neutrals are NaN, not a plausible number', () => {
    // NaN is the stopgap — greying out unavailable blocks is the real fix.
    const ops = SB3Creator.RUNTIME_EXTENSIONS.circuit.ops;
    for (const name of ['nodevoltage', 'branchcurrent', 'resistance', 'ledbrightness', 'buzzertone']) {
        assert.equal(ops[name].neutral, 'NaN',
            `${name} must refuse with NaN, not return 0`);
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
    assert.ok(Number.isNaN(ext.nodevoltage({ NET: 'vcc' })));
    assert.ok(Number.isNaN(ext.resistance({ A: 'a', B: 'b' })));

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
    assert.ok(Number.isNaN(ext.nodevoltage({ NET: 'vcc' })),
        'after clearBoard, reporters refuse again');
});

test('circuit blocks are greyed on hardware and available on simulator', async () => {
    const { readFileSync } = await import('node:fs');
    const vm = await import('node:vm');
    const src = readFileSync(new URL('../reference/extensions/circuit.js', import.meta.url), 'utf8');

    function loadWith(runtimeProps) {
        const captured = [];
        const mockScratch = {
            BlockType: { COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'Boolean', HAT: 'hat' },
            ArgumentType: { NUMBER: 'number', STRING: 'string', BOOLEAN: 'Boolean' },
            extensions: { register: (inst) => captured.push(inst), unsandboxed: true },
            translate: (m) => (m && typeof m === 'object' ? (m.default || '') : String(m || '')),
            vm: { runtime: { ...runtimeProps } }
        };
        const ctx = vm.createContext({ Scratch: mockScratch, console, performance,
            localStorage: { getItem: () => null }, navigator: { language: 'en' } });
        vm.runInContext(src, ctx);
        return captured[0];
    }

    const SIM_ONLY = ['nodevoltage', 'branchcurrent', 'resistance', 'ledbrightness', 'buzzertone', 'setcontrol'];

    // Simulator target: no stc12liveCapabilities → blocks are available.
    const simExt = loadWith({});
    const simInfo = simExt.getInfo();
    const simBlocks = simInfo.blocks.filter(b => typeof b === 'object');
    for (const op of SIM_ONLY) {
        const block = simBlocks.find(b => b.opcode === op);
        assert.ok(block, `${op} must exist on simulator`);
        assert.ok(!block.hideFromPalette, `${op} must NOT be hidden on simulator`);
    }

    // Hardware target: stc12liveCapabilities present → blocks are greyed.
    const hwExt = loadWith({ stc12liveCapabilities: { version: 1 } });
    const hwInfo = hwExt.getInfo();
    const hwBlocks = hwInfo.blocks.filter(b => typeof b === 'object');
    for (const op of SIM_ONLY) {
        const block = hwBlocks.find(b => b.opcode === op);
        assert.ok(block, `${op} must exist on hardware (greyed, not removed)`);
        assert.ok(block.hideFromPalette, `${op} must be hidden on hardware target`);
        assert.ok(block.text.includes('needs the simulator') || block.text.includes('simulator'),
            `${op} must say why it is greyed`);
    }

    // setpower should remain available on both (DTR trick).
    const simPower = simBlocks.find(b => b.opcode === 'setpower');
    const hwPower = hwBlocks.find(b => b.opcode === 'setpower');
    assert.ok(!simPower.hideFromPalette, 'setpower available on simulator');
    assert.ok(!hwPower.hideFromPalette, 'setpower available on hardware');
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
    assert.ok(Number.isNaN(ext.nodevoltage({ NET: 'vcc' })));
    assert.ok(Number.isNaN(ext.resistance({ A: 'a', B: 'b' })));

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
    assert.ok(Number.isNaN(ext.nodevoltage({ NET: 'vcc' })));

    // setBoard() overrides the runtime fallback.
    ext.setBoard({ nodeVoltage: () => 12, branchCurrent: () => 0, resistance: () => 100,
        ledBrightness: () => 0, buzzerTone: () => ({ hz: 0, on: false }), setControl: () => {}, setPower: () => {} });
    assert.equal(ext.nodevoltage({ NET: 'vcc' }), 12, 'setBoard overrides runtime');
    ext.clearBoard();
    assert.ok(Number.isNaN(ext.nodevoltage({ NET: 'vcc' })),
        'clearBoard reverts to runtime (which is null)');
});

test('the simulator driver refuses with a reason when no board is attached', () => {
    const c = new SB3Creator();
    c.parse('PIN led = P1.0 OUTPUT\nWHEN flag clicked:\n  turn on led');
    // JS driver: every no-board path returns NaN, not a string or 0.
    const jsDriver = c.circuitSimulatorDriver('js').join('\n');
    assert.match(jsDriver, /nodeVoltage.*NaN/);
    assert.match(jsDriver, /branchCurrent.*NaN/);
    assert.match(jsDriver, /resistance.*NaN/);
    assert.match(jsDriver, /ledBrightness.*NaN/);
    assert.match(jsDriver, /buzzerTone.*NaN/);
    // With a board, calls go through to boundary B.
    assert.match(jsDriver, /b\.resistance\(a, bNet\)/);
    // Python driver: same — float("nan").
    const pyDriver = c.circuitSimulatorDriver('py').join('\n');
    assert.match(pyDriver, /float\("nan"\)/);
    assert.match(pyDriver, /b\.resistance\(a, b_net\)/);
});

test('the circuit driver is self-contained — no dependency on the stc12 driver', () => {
    // Regression: circuitSimulatorDriver used to call `_board()`, which only
    // stc12SimulatorDriver defines. A project with circuit blocks and NO stc12 pin
    // block emitted JS that threw ReferenceError on the first reporter (NameError in
    // Python). The driver must define its own lookup, under a name that cannot
    // collide when both drivers are emitted side by side.
    const c = new SB3Creator();
    const jsDriver = c.circuitSimulatorDriver('js').join('\n');
    assert.match(jsDriver, /const _circuit_board = /);
    assert.ok(!/\b_board\(/.test(jsDriver), 'circuit JS driver must not call the stc12 helper');
    // Prove it by running it: no bwBoard in scope, reporters answer NaN instead of throwing.
    const probe = new Function(`${jsDriver}\nreturn _circuit.nodeVoltage("vcc");`);
    assert.ok(Number.isNaN(probe()), 'no board -> NaN, and above all: no ReferenceError');
    // Both drivers together must not redeclare anything (const collision would throw at parse).
    c.parse('PIN led = P1.0 OUTPUT ACTIVE LOW\nWHEN flag clicked:\n  turn on led');
    const both = `${c.stc12SimulatorDriver('js', [{ name: 'led', port: 1, bit: 0, direction: 'output', activeLow: true }]).join('\n')}\n${jsDriver}`;
    assert.doesNotThrow(() => new Function(`const scratch = { wait: () => {} };\n${both}`)());
    // Python: same self-containment.
    const pyDriver = c.circuitSimulatorDriver('py').join('\n');
    assert.match(pyDriver, /def _circuit_board\(\)/);
    assert.ok(!/\b_board\(\)/.test(pyDriver), 'circuit Python driver must not call the stc12 helper');
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
            new URL('../../extensions/extensions/CrispStrobe/stc12.js', import.meta.url).pathname,
            new URL('../../lego/extensions/extensions/CrispStrobe/stc12.js', import.meta.url).pathname
        ],
        bundled: [
            process.env.BW_LITE_STC12,
            new URL('../../lego/brickwright-lite/overlay/scratch-vm/src/extensions/crispstrobe/stc12/index.js',
                import.meta.url).pathname,
            // The bundle layout, resolved the same relative way -- it used to be
            // spelled as one machine's absolute path, which is what this whole
            // convention exists to avoid.
            new URL('../../bw-bundle/lite/overlay/scratch-vm/src/extensions/crispstrobe/stc12/index.js',
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

// ---- debug builds: {debug: true} forces the scheduler for single scripts -----------

test('a debug build of a multi-script project round-trips exactly like release', () => {
    const c = new SB3Creator();
    c.parse(SCHEDULED);
    const release = c.generateC();
    const debug = c.generateC(undefined, { debug: true });
    const { pseudocode: psR, warnings: wR } = cToPseudocode(release);
    const { pseudocode: psD, warnings: wD } = cToPseudocode(debug);
    assert.deepEqual(wR, [], 'release has no warnings');
    assert.deepEqual(wD, [], 'debug has no warnings');
    assert.equal(psR, psD, 'same pseudocode regardless of debug flag');
});

test('a debug build of a single-script project round-trips despite forced scheduler', () => {
    const c = new SB3Creator();
    c.parse(BLINK);
    const debug = c.generateC(undefined, { debug: true });
    assert.match(debug, /bw_task0_state/, 'single script is now a scheduler task');
    assert.match(debug, /@bw yield/, 'yield map present');
    const { pseudocode, warnings } = cToPseudocode(debug);
    assert.deepEqual(warnings, [], 'no warnings — the scheduler inverter handles it');
    assert.match(pseudocode, /FOREVER:/);
    assert.match(pseudocode, /turn on led1/);
    assert.match(pseudocode, /wait 0\.15 seconds/);
    // And it recompiles cleanly.
    assert.deepEqual(recompiles(pseudocode), []);
});

test('the yield map is readable from a debug build', () => {
    const c = new SB3Creator();
    c.parse(BLINK);
    const debug = c.generateC(undefined, { debug: true });
    const yields = readYieldMap(debug);
    assert.ok(yields.length > 0, 'at least one yield entry');
    for (const y of yields) {
        assert.equal(typeof y.task, 'string');
        assert.equal(typeof y.state, 'number');
        assert.equal(typeof y.block, 'string');
        assert.ok(y.block.length > 0, 'block id is not empty');
    }
    // Release builds have no yield map.
    assert.deepEqual(readYieldMap(c.generateC()), []);
});

// ---- BW_STUB markers: the reader drops them (decision 2026-08-10) -----------
// Stub-ness is a property of the TARGET's current implementation, not of the
// program. The pseudocode is valid; the C side re-adds the marker on regeneration.

test('BW_STUB markers are dropped: device calls read back as normal blocks', () => {
    const c = new SB3Creator();
    c.parse('DEVICE STC12C5A60S2\nCLOCK 11059200\nPIN led = P1.0 OUTPUT\n\n'
        + 'WHEN flag clicked:\n  set myservo angle to 90\n  set mymotor speed to 50');
    const code = c.generateC();
    // The C contains BW_STUB markers
    assert.match(code, /BW_STUB/, 'emitter writes BW_STUB markers');
    // The reader drops them — the pseudocode is clean
    const { pseudocode, warnings } = cToPseudocode(code);
    assert.ok(!/BW_STUB/.test(pseudocode), 'no BW_STUB in pseudocode');
    assert.ok(!/stub/i.test(pseudocode), 'no stub mention in pseudocode');
    assert.deepEqual(warnings, [], 'zero warnings — stubs are not a reader concern');
    assert.match(pseudocode, /set myservo angle to 90/);
    assert.match(pseudocode, /set mymotor speed to 50/);
    // And it round-trips
    const c2 = new SB3Creator(); c2.parse(pseudocode);
    const code2 = c2.generateC();
    assert.match(code2, /BW_STUB/, 'regenerated C re-adds the markers');
    const { pseudocode: ps2 } = cToPseudocode(code2);
    assert.equal(ps2, pseudocode, 'fixed point — the marker is target metadata, not program state');
});

// ---- silent dropping is data loss: every decline must warn -------------------

test('a hand-added function warns when dropped', () => {
    const { warnings } = cToPseudocode(`
/* @bw-begin
 * @bw device stc12c5a60s2
 * @bw clock 11059200
 * @bw script main 0 stage
 * @bw-end */
#include <stc12.h>
static void my_helper(void) { delay_ms(100); }
void main(void) { my_helper(); delay_ms(500); }`);
    assert.ok(warnings.some(w => /my_helper.*dropped/.test(w)),
        'a function the reader cannot emit must warn, not silently vanish');
});

test('a struct declaration warns when dropped', () => {
    const { warnings } = cToPseudocode(`
/* @bw-begin
 * @bw device stc12c5a60s2
 * @bw clock 11059200
 * @bw script main 0 stage
 * @bw-end */
#include <stc12.h>
void main(void) { struct point { int a; }; }`);
    assert.ok(warnings.some(w => /declaration dropped.*struct/.test(w)),
        'struct has no block equivalent and must say so');
});

test('an array subscript assignment becomes replace-item', () => {
    const { pseudocode } = cToPseudocode(`
/* @bw-begin
 * @bw device stc12c5a60s2
 * @bw clock 11059200
 * @bw script main 0 stage
 * @bw-end */
#include <stc12.h>
void main(void) { unsigned char buf[4]; buf[0] = 1; }`);
    assert.ok(/replace item 0 of buf with 1/.test(pseudocode),
        'array subscript assignment should emit replace-item');
});

test('our own generated C does NOT trigger spurious drop warnings', () => {
    const c = new SB3Creator();
    c.parse(BLINK);
    const { warnings } = cToPseudocode(c.generateC());
    assert.ok(!warnings.some(w => /dropped/.test(w)),
        'no drop warnings on code we generated ourselves');
});

// ---- regression tests for reader fixes that shipped without tests -----------

test('tone_set(freq) round-trips as set <pin> to freq hz', () => {
    const c = new SB3Creator();
    c.parse('DEVICE STC12C5A60S2\nCLOCK 11059200\nPIN buzzer = P1.5 TONE\n\nWHEN flag clicked:\n  set buzzer to 440 hz\n  set buzzer to 880 hz');
    const { pseudocode, warnings } = cToPseudocode(c.generateC());
    assert.deepEqual(warnings, []);
    assert.match(pseudocode, /set buzzer to 440 hz/);
    assert.match(pseudocode, /set buzzer to 880 hz/);
    assert.deepEqual(recompiles(pseudocode), []);
});

test('pin = (expr) ? 1 : 0 round-trips as set <pin> to expr', () => {
    const c = new SB3Creator();
    c.parse('DEVICE STC12C5A60S2\nCLOCK 11059200\nPIN led = P1.0 OUTPUT ACTIVE LOW\n\nWHEN flag clicked:\n  set led to 0\n  set led to 1\n  set led to duty');
    const { pseudocode, warnings } = cToPseudocode(c.generateC());
    assert.deepEqual(warnings, []);
    assert.match(pseudocode, /set led to 0/);
    assert.match(pseudocode, /set led to 1/);
    assert.match(pseudocode, /set led to duty/);
});

test('device C round-trip is 5/5 on the example fixtures', async () => {
    const examples = (await import('../src/utils/examples.js')).default;
    let pass = 0, total = 0;
    for (const [name, src] of Object.entries(examples)) {
        const c1 = new SB3Creator(); c1.parse(src);
        if (!c1.project.stc?.pins?.length && !c1.project.stc?.ledcube) continue;
        total++;
        const ps0 = c1.decompile();
        const c0b = new SB3Creator(); c0b.parse(ps0);
        const dialectFP = c0b.decompile();
        const { pseudocode: psC, warnings } = cToPseudocode(c1.generateC());
        const cBack = new SB3Creator(); cBack.parse(psC);
        const cFP = cBack.decompile();
        if (cFP === dialectFP && warnings.length === 0) pass++;
        else assert.fail(`${name}: device C round-trip failed`);
    }
    assert.equal(pass, total, `${pass}/${total}`);
});

// ---- wire protocol agreement: stc12live vs bw-board's serial-debug ---------
// Two independent implementations of live-proto.h framing. Both must produce
// and parse the same bytes, or a runtime driver and a debug target silently
// disagree about what they sent.

// Cross-repo guard. This was the worst shape found in the 2026-08-23 sweep: the
// bw-board import sat in a try/catch whose catch console.log'd "skipping" and
// RETURNED — so with bw-board absent the test reported a clean PASS, not even a
// skip. A wire-protocol agreement test that silently agrees with nothing is worse
// than no test. See test/CROSS-REPO-GATE-AUDIT.md.
const codecGate = requireSiblings('bw-board');
siblingGuardTest(codecGate, 'the stc12live/bw-board wire protocol');
test('stc12live and bw-board frame codecs agree byte for byte',
    { skip: codecGate.skip }, async () => {
    const { readFileSync } = await import('node:fs');
    const vm = await import('node:vm');

    // Load stc12live's buildFrame and Decoder.
    const liveSrc = readFileSync(new URL('../reference/extensions/stc12live.js', import.meta.url), 'utf8');
    const liveCapture = {};
    const liveMock = {
        BlockType: { COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'Boolean', HAT: 'hat' },
        ArgumentType: { NUMBER: 'number', STRING: 'string', BOOLEAN: 'Boolean' },
        extensions: { register: () => {} },
        translate: (m) => (m && typeof m === 'object' ? (m.default || '') : String(m || '')),
        vm: { runtime: {} }
    };
    // Extract buildFrame and Decoder from the IIFE scope by patching the source.
    const patchedLive = liveSrc.replace(
        'Scratch.extensions.register(new STC12Live());',
        'Scratch._bwCapture = { buildFrame, Decoder }; Scratch.extensions.register(new STC12Live());'
    );
    const liveCtx = vm.createContext({ Scratch: liveMock, console, navigator: { language: 'en' }, localStorage: { getItem: () => null }, performance });
    vm.runInContext(patchedLive, liveCtx);
    const { buildFrame: liveBuild, Decoder: LiveDecoder } = liveMock._bwCapture;
    assert.ok(liveBuild, 'stc12live buildFrame extracted');
    assert.ok(LiveDecoder, 'stc12live Decoder extracted');

    // Load bw-board's buildFrame and FrameReceiver.
    // Resolved through the shared guard rather than a hardcoded `../../`: the guard
    // honours BW_BOARD, knows the pinned revision, and is what CI supplies. An
    // import failure here is now a real failure — the sibling's presence was
    // already decided above.
    const boardPath = join(codecGate.paths['bw-board'], 'src', 'serial-debug.js');
    const boardMod = await import(pathToFileURL(boardPath).href);
    const boardBuild = boardMod.buildFrame;
    const BoardReceiver = boardMod.FrameReceiver;
    assert.ok(boardBuild, 'bw-board buildFrame loaded');
    assert.ok(BoardReceiver, 'bw-board FrameReceiver loaded');

    // Test vectors: command + payload pairs covering the protocol space.
    const vectors = [
        { cmd: 0x01, payload: [] },                           // HELLO, empty payload
        { cmd: 0x02, payload: [4, 0x00, 0x90, 1] },           // READ bit space P1.0
        { cmd: 0x03, payload: [4, 0x00, 0x90, 1] },           // WRITE bit space
        { cmd: 0x81, payload: [1, 64, 4, 2, 0x1F, 0x1F, 7, 4, 0x19] },  // HELLO reply (cap blob)
        { cmd: 0x0A, payload: [0, 2, 0x00, 0x00, 0x00, 0x00] },  // POS
        { cmd: 0xFF, payload: [0x01, 0x03] },                  // NAK
        { cmd: 0xF0, payload: [1, 0, 2, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00] },  // EVT_HALT
        { cmd: 0x03, payload: Array.from({ length: 64 }, (_, i) => i) },  // max payload
    ];

    for (const { cmd, payload } of vectors) {
        const liveFrame = liveBuild(cmd, payload);
        const boardFrame = boardBuild(cmd, payload);

        // Byte-for-byte equality.
        assert.equal(liveFrame.length, boardFrame.length,
            `frame length differs for cmd 0x${cmd.toString(16)}`);
        for (let i = 0; i < liveFrame.length; i++) {
            assert.equal(liveFrame[i], boardFrame[i],
                `byte ${i} differs for cmd 0x${cmd.toString(16)}: live=${liveFrame[i]} board=${boardFrame[i]}`);
        }

        // Round-trip: bw-board's receiver can parse stc12live's frames.
        const rx = new BoardReceiver();
        rx.feed(liveFrame);
        assert.equal(rx.frames.length, 1,
            `bw-board did not parse stc12live's frame for cmd 0x${cmd.toString(16)}`);
        assert.equal(rx.frames[0].cmd, cmd);

        // Round-trip: stc12live's decoder can parse bw-board's frames.
        const dec = new LiveDecoder();
        let parsed = null;
        dec.onFrame = (c, p) => { parsed = { cmd: c, payload: p }; };
        for (const b of boardFrame) dec.feed(b);
        assert.ok(parsed, `stc12live did not parse bw-board's frame for cmd 0x${cmd.toString(16)}`);
        assert.equal(parsed.cmd, cmd);
    }
});

// ---- Arduino sketches -> pseudocode ----------------------------------------
// The 8051 reader finds pins in declarations: `sbit LED = P1^0` names a pin and
// says where it is. An Arduino sketch has neither. A pin is a NUMBER, it is
// never declared, and the only evidence that D13 is an output is that something
// called pinMode or digitalWrite on it. So the pins are discovered from the
// calls, which is why this needed a front end rather than another lookup entry.

const sketch = (body) => cToPseudocode(`#include <Arduino.h>\n${body}`);

test('an Arduino pin is discovered from the calls that use it', () => {
    const { pseudocode, warnings } = sketch(`
#define LED 13
const int button = 2;
const int pot = A0;
void setup() {
  pinMode(LED, OUTPUT);
  pinMode(button, INPUT_PULLUP);
}
void loop() {
  if (digitalRead(button)) { digitalWrite(LED, HIGH); } else { digitalWrite(LED, LOW); }
  delay(analogRead(pot));
}
`);
    assert.match(pseudocode, /^DEVICE ARDUINO-UNO$/m);
    assert.match(pseudocode, /^CLOCK 16000000$/m, 'not an 8051 crystal');
    // The author's own name for the number, not "d13".
    assert.match(pseudocode, /^PIN led = D13 OUTPUT$/m);
    // INPUT_PULLUP is a button to ground: pressed reads 0. That is ACTIVE LOW
    // stated by the sketch, and it is the one polarity an Arduino source
    // actually declares rather than implying.
    assert.match(pseudocode, /^PIN button = D2 INPUT ACTIVE LOW$/m);
    assert.match(pseudocode, /^PIN pot = A0 ANALOG$/m, 'analogRead settles the direction');
    // HIGH/LOW come from the toolchain, not the sketch: without them a write
    // lands as the non-sentence `set led to HIGH`.
    assert.match(pseudocode, /turn on led/);
    assert.match(pseudocode, /turn off led/);
    // A pin in argument position has already been through readName, so
    // digitalRead(button) arrives as the text "read button".
    assert.match(pseudocode, /IF not read button THEN:/);
    assert.match(pseudocode, /wait read pot ms/);
    assert.ok(!warnings.some((w) => /does not read|no pins found/.test(w)),
        `nothing refused: ${JSON.stringify(warnings)}`);
});

test('setup() and loop() reassemble into one script with a FOREVER', () => {
    const { pseudocode } = sketch(`
void setup() { pinMode(13, OUTPUT); }
void loop() { digitalWrite(13, HIGH); delay(500); digitalWrite(13, LOW); delay(500); }
`);
    const lines = pseudocode.split('\n');
    assert.equal(lines.filter((l) => /^WHEN /.test(l)).length, 1, 'one script, not two');
    assert.match(pseudocode, /WHEN flag clicked:\n {2}FOREVER:/,
        'setup() held only pinMode, so the script is the loop');
    // setup() and loop() are the script, not procedures it calls.
    assert.ok(!/DEFINE/.test(pseudocode), 'no DEFINE blocks for setup/loop');
    // A pin nothing named still gets declared, under the board's own spelling.
    assert.match(pseudocode, /^PIN d13 = D13 OUTPUT$/m);
});

test('setup() work that is not pinMode survives into the script', () => {
    const { pseudocode } = sketch(`
int n;
void setup() { pinMode(9, OUTPUT); n = 5; }
void loop() { analogWrite(9, 128); delay(n); }
`);
    const body = pseudocode.slice(pseudocode.indexOf('WHEN'));
    assert.match(body, /set n to 5[\s\S]*FOREVER:/, 'setup runs once, before the FOREVER');
    // analogWrite is 0-255 of duty and the dialect speaks percent.
    assert.match(pseudocode, /set d9 to 50 percent/);
    assert.match(pseudocode, /^PIN d9 = D9 PWM$/m);
});

test('a duty that is not a literal is flagged rather than silently rescaled', () => {
    const { pseudocode, warnings } = sketch(`
int v;
void setup() { pinMode(9, OUTPUT); }
void loop() { analogWrite(9, v); }
`);
    assert.match(pseudocode, /set d9 to v percent/);
    assert.ok(warnings.some((w) => /0-255 and the pseudocode is percent/.test(w)),
        `expected a scale warning, got ${JSON.stringify(warnings)}`);
});

test("the Nano's A6/A7 are analog-only, and a sketch that drives one is told so", () => {
    // The board cannot be inferred from <Arduino.h> -- an Uno and a Nano
    // include the same header -- so the marker header is how a Nano says it
    // is a Nano. Its pins are still discovered, because naming the board must
    // not switch pin discovery off.
    const { pseudocode, warnings } = cToPseudocode(`#include <Arduino.h>
// @bw-begin
// @bw device arduino-nano
// @bw-end
void setup() { pinMode(A6, OUTPUT); }
void loop() { digitalWrite(A6, HIGH); }
`);
    assert.match(pseudocode, /^DEVICE ARDUINO-NANO$/m);
    assert.match(pseudocode, /^PIN a6 = A6 OUTPUT$/m, 'still discovered from the calls');
    assert.ok(warnings.some((w) => /A6 is analog-input only on the Nano/.test(w)
        && /does nothing on the board/.test(w)),
    `expected the package warning, got ${JSON.stringify(warnings)}`);
});

test('a pin computed at run time is refused by name, not guessed at', () => {
    const { warnings } = sketch(`
int pins[3];
void setup() { for (int i = 0; i < 3; i = i + 1) { pinMode(pins[i], OUTPUT); } }
void loop() { }
`);
    assert.ok(warnings.some((w) => /computed at run time/.test(w)),
        `expected a run-time-pin warning, got ${JSON.stringify(warnings)}`);
});

test('a core call with no equivalent still warns rather than vanishing', () => {
    const { warnings } = sketch(`
void setup() { pinMode(13, OUTPUT); }
void loop() { shiftOut(13, 12, 0, 255); digitalWrite(13, HIGH); }
`);
    assert.ok(warnings.some((w) => /shiftOut/.test(w)),
        `an untranslated call must stay visible: ${JSON.stringify(warnings)}`);
});

test('delayMicroseconds is below the dialect floor and says so', () => {
    const { pseudocode, warnings } = sketch(`
void setup() { pinMode(13, OUTPUT); }
void loop() { digitalWrite(13, HIGH); delayMicroseconds(100); digitalWrite(13, LOW); }
`);
    assert.ok(warnings.some((w) => /delayMicroseconds\(100\).*1 ms/.test(w)));
    assert.ok(!/wait 0 ms/.test(pseudocode), 'rounding it to 0 would delete the delay silently');
});

test('an 8051 source is unaffected by the Arduino vocabulary', () => {
    const { pseudocode } = cToPseudocode(`#include <stc12.h>
sbit LED1 = P1^0;
#define LED_ON 0
void main(void) { while (1) { LED1 = LED_ON; delay_ms(500); } }
`);
    assert.match(pseudocode, /^DEVICE STC12C5A60S2$/m);
    assert.match(pseudocode, /^PIN led1 = P1\.0 OUTPUT ACTIVE LOW$/m,
        'the {port, bit} spelling is untouched');
});

// ---- the far end: an Arduino project parses, and refuses to become 8051 C ----
// The reader above produces correct pseudocode. Until this, sb3-creator could
// not read it back: five STC parts and one pin syntax, so `PIN led = D13
// OUTPUT` was "a line not associated with a script" and the whole import
// dead-ended. What follows is the small half of closing that — the project
// path — and the loud refusal that has to come with it.

test('an Arduino board and its numbered pins parse into a project', () => {
    const c = new SB3Creator();
    c.parse(`DEVICE ARDUINO-UNO
CLOCK 16000000
PIN led = D13 OUTPUT
PIN button = D2 INPUT ACTIVE LOW
PIN pot = A0 ANALOG

WHEN flag clicked:
  FOREVER:
    turn on led
    wait read pot ms
`);
    assert.deepEqual(c.warnings, [], 'nothing about this is unknown any more');
    const cfg = c.project.stc;
    assert.equal(cfg.device, 'arduino-uno');
    assert.deepEqual(cfg.pins.map((p) => [p.name, p.where, p.direction, p.activeLow]), [
        ['led', 'D13', 'output', false],
        ['button', 'D2', 'input', true],
        ['pot', 'A0', 'analog', false]
    ]);
    // No port and no bit: an Arduino pin is not in that coordinate system, and
    // inventing a 0 for it would read as P0.0 downstream.
    assert.ok(cfg.pins.every((p) => p.port === undefined && p.bit === undefined));
});

test('the two pin vocabularies do not cross', () => {
    const stc = new SB3Creator();
    stc.parse('DEVICE STC12C5A60S2\nPIN led = D13 OUTPUT\n');
    assert.ok(stc.warnings.some((w) => /"D13" is not how stc12c5a60s2 names a pin; it uses P<port>\.<bit>/.test(w)),
        `expected a vocabulary warning, got ${JSON.stringify(stc.warnings)}`);

    const ard = new SB3Creator();
    ard.parse('DEVICE ARDUINO-UNO\nPIN pot = D3 ANALOG\n');
    assert.ok(ard.warnings.some((w) => /ANALOG needs an analog input \(A0 and up\)/.test(w)),
        `expected an ADC warning, got ${JSON.stringify(ard.warnings)}`);
});

test('generateC emits AVR bare metal for an Arduino board — the back end landed', () => {
    // This test used to assert the refusal ("until the Arduino back end
    // lands"). It landed 2026-08-12; the guard flips to asserting the AVR
    // emission is real AND that no 8051 register leaks across the core split.
    const c = new SB3Creator();
    c.parse('DEVICE ARDUINO-UNO\nPIN led = D13 OUTPUT\nPIN pot = A0 ANALOG\n\nWHEN flag clicked:\n  FOREVER:\n    turn on led\n    wait 0.5 seconds\n    turn off led\n    wait 0.5 seconds\n');
    const out = c.generateC(c.project, { debug: true });
    assert.match(out, /#include <avr\/io\.h>/);
    assert.match(out, /#include <avr\/interrupt\.h>/);
    assert.match(out, /ISR\(TIMER0_COMPA_vect\)/, 'the millisecond tick is a real AVR ISR');
    assert.match(out, /DDRB \|= \(1 << 5\)/, 'D13 = PB5 as an output');
    assert.match(out, /PORTB \|= \(1 << 5\)/, 'turn on drives PB5 high (active-high default)');
    assert.match(out, /BW_OCR0A/, 'CTC reload derived from F_CPU');
    assert.match(out, /#define F_CPU 16000000UL/, 'the clock followed the DEVICE');
    assert.match(out, /@bw-begin/, 'the debug yield map survives the core switch');
    assert.match(out, /static volatile unsigned int bw_task0_state;/,
        'the scheduler state is volatile on AVR: the debugger reads it from outside '
        + 'the program, and the qualifier is also what keeps gcc dead-store '
        + 'elimination from pruning an empty task wholesale (SDCC never prunes, '
        + 'so the 8051 flavor stays unqualified and its goldens byte-identical)');
    assert.ok(!/P1M1|TMOD|AUXR|__sbit|P1_0|__interrupt|T0_RELOAD/.test(out),
        'no 8051 register or SDCC keyword leaked across the core split');
    assert.deepEqual(c._cWarnings, [], `clean emission: ${JSON.stringify(c._cWarnings)}`);
});

test('motor is real on both gcc cores: PWM speed + H-bridge direction', () => {
    const SRC = (dev) => `DEVICE ${dev}\nPIN led1 = ${dev === 'PICO' ? 'GP25' : 'D13'} OUTPUT\n\nWHEN flag clicked:\n  set 1 speed to 60\n  set 1 direction reverse\n`;
    const pico = new SB3Creator();
    pico.parse(SRC('PICO'));
    const pc = pico.generateC(pico.project, { debug: true });
    assert.match(pc, /bw_motor_speed\(1, 60\);/);
    assert.match(pc, /bw_motor_dir\(1, 1\);/, 'reverse encodes as 1');
    assert.match(pc, /pwm_set\(18, \(unsigned int\)speed\);/, 'GP18 carries speed');
    assert.match(pc, /1UL << 19\) \| \(1UL << 20/, 'GP19/GP20 are the H-bridge pins');
    assert.ok(!/P3_4|CCAP1H|CCAPM/.test(pc), 'no 8051 registers leaked (comments may NAME the PCA)');
    const avr = new SB3Creator();
    avr.parse(SRC('ARDUINO-NANO'));
    const ac = avr.generateC(avr.project, { debug: true });
    assert.match(ac, /pwm_set\(3, \(unsigned int\)speed\);/, 'OC2B (D3) carries speed');
    assert.match(ac, /DDRD \|= \(1 << 3\);/, 'pwm_set owns its pin direction — a convention pin was never declared');
    assert.match(ac, /DDRD \|= \(1 << 7\);[\s\S]*DDRB \|= \(1 << 0\);/, 'D7/D8 are the H-bridge pins');
    assert.ok(!avr._cWarnings.some((w) => /not yet ported/.test(w)), 'the stub warning is gone');
});

test('servo is real on both gcc cores: 50 Hz frames, microsecond pulses', () => {
    // Pico: slice 0, TOP 19999 at 1 MHz — CC is the pulse in microseconds.
    const pico = new SB3Creator();
    pico.parse('DEVICE PICO\nPIN led1 = GP25 OUTPUT\n\nWHEN flag clicked:\n  set 1 angle to 90\n');
    const pc = pico.generateC(pico.project, { debug: true });
    assert.match(pc, /bw_servo_set\(1, 90\);/);
    assert.match(pc, /BW_PWM_TOP\(0\) = 19999u;/, 'the 20 ms servo frame on slice 0');
    assert.match(pc, /15u \+ \(uint32_t\)servo/, 'servo 1 = GP16, servo 2 = GP17');
    assert.ok(!/P1_3|CCON|__interrupt/.test(pc), 'no 8051 PCA leaked onto the Pico');

    // AVR: Timer 1 mode 14, ICR1 TOP, 0.5 µs ticks — and Timer 1 then
    // belongs to the servos, so dimming on D9/D10 is warned about.
    const avr = new SB3Creator();
    avr.parse('DEVICE ARDUINO-NANO\nPIN led1 = D13 OUTPUT\nPIN dim = D3 OUTPUT\n\nWHEN flag clicked:\n  set 1 angle to 90\n  set dim to 30 percent\n');
    const ac = avr.generateC(avr.project, { debug: true });
    assert.match(ac, /ICR1 = 39999;/, 'the 20 ms frame at 0.5 us ticks');
    assert.match(ac, /TCCR1B = \(1 << WGM13\) \| \(1 << WGM12\) \| \(1 << CS11\);/, 'mode 14, F_CPU/8');
    assert.match(ac, /OCR1A = us \* 2u;/, 'OC1A carries servo 1');
    assert.ok(!/CCAP0|bw_pca_isr/.test(ac), 'no 8051 PCA leaked onto the AVR');
    assert.ok(avr._cWarnings.some((w) => /Timer 1.*D9\/D10/.test(w)),
        'servo + dimmer: the Timer 1 takeover is stated');
    // D3 dimming still works alongside the servo (Timer 2 is untouched).
    assert.match(ac, /pwm_set\(3, /);
});

test('the Mega axis: ports A-L, MUX5 channels, Timer-1/2 routing', () => {
    const c = new SB3Creator();
    c.parse('DEVICE ARDUINO-MEGA\nPIN led1 = D13 OUTPUT\nPIN led2 = D22 OUTPUT\nPIN led3 = D30 OUTPUT\nPIN led4 = D42 OUTPUT\nPIN pot9 = A9 ANALOG\nPIN dim = D9 PWM\n\nWHEN flag clicked:\n  set dim to 40 percent\n  set 1 angle to 90\n  FOREVER:\n    toggle led1\n    print read pot9\n    wait 0.5 seconds\n');
    assert.deepEqual(c.warnings, []);
    const out = c.generateC(c.project, { debug: true });
    // Official Mega mapping: D13=PB7; D22 opens port A ascending; D30 opens
    // port C DESCENDING (PC7); D42 opens port L descending (PL7).
    assert.match(out, /DDRB \|= \(1 << 7\);\s+\/\* led1 = D13 output \*\//);
    assert.match(out, /DDRA \|= \(1 << 0\);/);
    assert.match(out, /DDRC \|= \(1 << 7\);/);
    assert.match(out, /DDRL \|= \(1 << 7\);/);
    // A9 is ADC channel 9: MUX5 in ADCSRB on top of ADMUX.
    assert.match(out, /adc_read\(9\)/);
    assert.match(out, /MUX5/);
    // Servo rides Timer 1 on D11/D12 here; the dimmer's D9 is Timer 2 (OC2B).
    assert.match(out, /D11 \(OC1A\/PB5\)/);
    assert.match(out, /case 9:   \/\* OC2B = PH6 \*\//);
    // The 8051 PCA collision matrix stays silent on this core.
    assert.ok(!c._cWarnings.some((w) => /BW_COLLISION/.test(w)),
        `PCA collisions are 8051 facts: ${JSON.stringify(c._cWarnings)}`);
    // Servo+dimmer conflict wording is Mega-aware (Timer 1 = D11/D12 here).
    assert.ok(c._cWarnings.some((w) => /D11\/D12 will not dim/.test(w)));
});

test('the Mega axis: D3 has no Timer-1/2 PWM here and is refused with the map', () => {
    const c = new SB3Creator();
    c.parse('DEVICE ARDUINO-MEGA\nPIN dim = D3 PWM\n\nWHEN flag clicked:\n  set dim to 40 percent\n');
    c.generateC(c.project, { debug: true });
    assert.ok(c._cWarnings.some((w) => /D9-D12 on the Mega/.test(w)),
        JSON.stringify(c._cWarnings));
});

test('the 168P axis: a 328 with half the flash — same emission, own device', () => {
    const c = new SB3Creator();
    c.parse('DEVICE ATMEGA168P\nPIN led1 = D13 OUTPUT\n\nWHEN flag clicked:\n  FOREVER:\n    turn on led1\n    wait 0.5 seconds\n    turn off led1\n    wait 0.5 seconds\n');
    assert.deepEqual(c.warnings, []);
    const out = c.generateC(c.project, { debug: true });
    assert.match(out, /@bw device atmega168p/);
    assert.match(out, /DDRB \|= \(1 << 5\);/, 'D13 = PB5, the 328 map');
    assert.deepEqual(c._cWarnings, []);
});

test('retarget reaches the new devices', () => {
    const src = 'DEVICE PICO\nPIN led1 = GP25 OUTPUT\nPIN pot1 = GP26 ANALOG\n\nWHEN flag clicked:\n  FOREVER:\n    turn on led1\n    wait read pot1 milliseconds\n    turn off led1\n';
    for (const dev of ['arduino-mega', 'atmega168p']) {
        const r = SB3Creator.retargetPseudocode(src, dev);
        assert.equal(r.ok, true, `${dev}: ${r.reasons.join('; ')}`);
        const c = new SB3Creator();
        c.parse(r.pseudocode);
        assert.deepEqual(c.warnings, [], `${dev} re-parses clean`);
    }
});

test('ARM flavor: DEVICE PICO emits freestanding Cortex-M0 bare metal', () => {
    const c = new SB3Creator();
    c.parse('DEVICE PICO\nPIN led1 = GP25 OUTPUT\nPIN pot1 = GP26 ANALOG\n\nWHEN flag clicked:\n  FOREVER:\n    turn on led1\n    wait 0.5 seconds\n    turn off led1\n    wait 0.5 seconds\n\nWHEN flag clicked:\n  FOREVER:\n    print read pot1\n    wait 1 seconds\n');
    assert.deepEqual(c.warnings, []);
    const out = c.generateC(c.project, { debug: true });
    // The SIO idioms: set/clr registers, single-writer atomic, no RMW.
    assert.match(out, /BW_SIO_GPIO_OUT_SET = \(1UL << 25\);/);
    assert.match(out, /BW_SIO_GPIO_OUT_CLR = \(1UL << 25\);/);
    // funcsel before level before OE — the boot discipline, ARM spelling.
    assert.match(out, /BW_IOBANK0_CTRL\(25\) = 5u;[\s\S]*BW_SIO_GPIO_OE_SET = \(1UL << 25\);/);
    // The ISR-free timebase: a 64-bit latched read, never a tick ISR.
    assert.match(out, /BW_TIMER_TIMELR/);
    assert.match(out, /\(uint32_t\)\(\(\(\(\(uint64_t\)hi\) << 32\) \| lo\) \/ 1000u\)/);
    assert.ok(!/ISR\(|__interrupt|sei\(\)|TMOD|TCCR0A/.test(out), 'no ISR and no other core\'s timer');
    // GP26 is ADC channel 0; the datasheet's two-phase start sequence.
    assert.match(out, /adc_read\(0\)/);
    assert.match(out, /EN \| AINSEL[\s\S]*START_ONCE/);
    // Scheduler variables are volatile (gcc dead-store elimination, as on AVR).
    assert.match(out, /static volatile unsigned int bw_task0_state;/);
    // Freestanding: int main, watchdog tick enabled for real silicon.
    assert.match(out, /int main\(void\)/);
    assert.match(out, /BW_WATCHDOG_TICK = \(1u << 9\) \| 12u;/);
    // print brings UART0 up on GP0 with computed divisors.
    assert.match(out, /BW_IOBANK0_CTRL\(0\) = 2u;/);
    assert.match(out, /BW_UART0_IBRD/);
    // No leaks from the other two cores.
    assert.ok(!/PORTB|PINB|DDRB|avr\/io\.h|P1M1|AUXR|__sbit|P1_0|T0_RELOAD/.test(out),
        'no AVR or 8051 register leaked across the core split');
    assert.deepEqual(c._cWarnings, [], `clean emission: ${JSON.stringify(c._cWarnings)}`);
    // Marker header carries the device and the GP spelling.
    assert.match(out, /@bw device pico/);
    assert.match(out, /@bw pin led1 GP25 output/);
});

test('ARM flavor: toggle idiom, active-low, and the stated PWM refusal', () => {
    const c = new SB3Creator();
    c.parse('DEVICE PICO\nPIN led = GP15 OUTPUT ACTIVE LOW\n\nWHEN flag clicked:\n  turn on led\n  toggle led\n  set led to 40 percent\n');
    const out = c.generateC(c.project, { debug: true });
    assert.match(out, /BW_SIO_GPIO_OUT_CLR = \(1UL << 15\);/, 'turn ON an ACTIVE LOW pin drives it LOW');
    assert.match(out, /BW_SIO_GPIO_OUT_XOR = \(1UL << 15\);/, 'toggle uses the hardware XOR register');
    assert.match(out, /BW_SIO_GPIO_OUT_SET = \(1UL << 15\);\s+\/\* led: start OFF \*\//,
        'boot level set BEFORE output enable');
    // Real hardware PWM: GP15 is slice 7 channel B; 40% at TOP 999 is
    // duty (40*1000+50)/100 = 400, packed into the CC high half.
    assert.match(out, /pwm_set\(15, /, 'the call site passes the GPIO number');
    assert.match(out, /BW_PWM_TOP\(slice\) = 999u;/);
    assert.match(out, /BW_IOBANK0_CTRL\(gpio\) = 4u;/, 'funcsel moves to PWM');
    assert.match(out, /duty << 16/, 'odd GPIOs land in the CC high half (channel B)');
});

test('ARM flavor: ANALOG means GP26-GP28, said plainly otherwise', () => {
    const c = new SB3Creator();
    c.parse('DEVICE PICO\nPIN pot = GP5 ANALOG\n');
    assert.ok(c.warnings.some((w) => /ANALOG on the Pico means GP26, GP27 or GP28/.test(w)),
        `expected the channel warning, got ${JSON.stringify(c.warnings)}`);
});

test('AVR flavor: active-low, analog channels, toggle, and stated PWM refusal', () => {
    const c = new SB3Creator();
    c.parse('DEVICE ARDUINO-NANO\nPIN led = D8 OUTPUT ACTIVE LOW\nPIN pot = A6 ANALOG\nPIN dim = D9 OUTPUT\n\nWHEN flag clicked:\n  turn on led\n  toggle led\n  set dim to 40 percent\n  set led to 40 percent\n  print read pot\n');
    const out = c.generateC(c.project, { debug: true });
    assert.match(out, /PORTB &= \(uint8_t\)~\(1 << 0\);/, 'turn ON an ACTIVE LOW pin drives it LOW');
    assert.match(out, /PORTB \|= \(1 << 0\);\s+\/\* led: start OFF \*\//, 'boot level set BEFORE direction');
    assert.match(out, /PINB = \(1 << 0\);/, 'toggle uses the hardware PINx-write idiom');
    assert.match(out, /adc_read\(6\)/, 'A6 is ADC channel 6 (the Nano pad)');
    assert.match(out, /ADCSRA = \(1 << ADEN\)/, 'ADC enabled in setup');
    assert.match(out, /UBRR0/, 'print brings the UART up');
    // Real hardware PWM now: D9 = OC1A, Timer 1 fast PWM, and the
    // 40% -> OCR arithmetic is (40*255+50)/100 = 102 inside pwm_set.
    assert.match(out, /pwm_set\(9, /, 'D9 dispatches to the OC1A case');
    assert.match(out, /TCCR1B = \(1 << WGM12\) \| \(1 << CS11\) \| \(1 << CS10\);/, 'Timer 1 base in setup');
    assert.match(out, /OCR1A = v;/, 'the OC1A compare path exists');
    assert.ok(!/COM0A1|COM0B1|OCR0B/.test(out), 'Timer 0 compare units never drive pins — it is the tick');
    // D8 has no OC unit: refused with the reason, not silently dropped.
    assert.match(out, /no PWM on D8/i);
    assert.ok(c._cWarnings.some((w) => /D3\/D9\/D10\/D11/.test(w)), 'the refusal names the real PWM pins');
});

test('a sketch survives the whole chain: C -> pseudocode -> project -> pseudocode', () => {
    const sketchSrc = `#include <Arduino.h>
#define LED 13
const int pot = A0;
void setup() { pinMode(LED, OUTPUT); }
void loop() { digitalWrite(LED, HIGH); delay(analogRead(pot)); digitalWrite(LED, LOW); delay(100); }
`;
    const ps = cToPseudocode(sketchSrc).pseudocode;
    const hop = (t) => { const c = new SB3Creator(); c.parse(t); return { text: c.decompile(), warns: c.warnings }; };
    const a = hop(ps), b = hop(a.text);
    assert.deepEqual(a.warns, [], `the imported sketch parses clean: ${JSON.stringify(a.warns)}`);
    // Not equal to `ps` -- decompile emits the canonical form (STAGE:, explicit
    // parens, seconds). Equal to ITSELF after another hop is the real property.
    assert.equal(b.text, a.text, 'a fixed point after one hop');
    assert.match(a.text, /^PIN led = D13 OUTPUT$/m, 'the board spelling round-trips');
    assert.match(a.text, /^PIN pot = A0 ANALOG$/m);
});

test('the 8051 pin syntax is untouched by any of it', () => {
    const c = new SB3Creator();
    c.parse('DEVICE STC12C5A60S2\nPIN led = P1.0 OUTPUT ACTIVE LOW\nPIN pot = P1.3 ANALOG\n\nWHEN flag clicked:\n  turn on led\n');
    assert.deepEqual(c.warnings, []);
    assert.deepEqual(c.project.stc.pins.map((p) => [p.name, p.port, p.bit]),
        [['led', 1, 0], ['pot', 1, 3]]);
    assert.match(c.decompile(), /^PIN led = P1\.0 OUTPUT ACTIVE LOW$/m);
    // And ANALOG off P1 is still refused for the reason it always was.
    const bad = new SB3Creator();
    bad.parse('DEVICE STC12C5A60S2\nPIN pot = P2.3 ANALOG\n');
    assert.ok(bad.warnings.some((w) => /ANALOG is only available on P1\.0-P1\.7/.test(w)));
});

// ---- MicroPython -> pseudocode: the fifth front end -------------------------
// micro:bit and Pico both emit MicroPython and nothing read it back. They share
// a language and almost no vocabulary: `pin0.write_digital(1)` against
// `_pin15.value(1)`, and only one of the two declares a pin at all. So the
// import line picks the dialect, exactly as the C reader splits 8051 from
// Arduino.
//
// The interesting part is what the writer leaves behind. `pin0.write_digital(0)
// # led off` is three facts in one line: the pin is called led, it is an
// output, and 0 is its OFF level — which IS the ACTIVE LOW, and is the one
// thing no amount of reading the loop body could recover, because a program
// that only ever turns a lamp on looks identical either way.

import micropythonToPseudocode from '../src/utils/micropythonToPseudocode.js';

const MICROBIT_SRC = `from microbit import *

_level = {'led': 0}

# WHEN started:
def bw_script():
    while True:
        if button_a.is_pressed():
            _level['led'] = 1 - _level['led']
            pin0.write_digital(_level['led'])
        sleep(200)
        print(pin1.read_analog())

pin0.write_digital(1)  # led off

bw_script()
`;

const PICO_SRC = `from machine import Pin, ADC, PWM
import time

def bw_script():
    while True:
        if (not _pin14.value()):
            _pin15.value(0)
        _pwm16.duty_u16((60) * 65535 // 100)
        _hz = 440
        if _hz:
            _pwm17.freq(_hz)
            _pwm17.duty_u16(32768)
        else:
            _pwm17.duty_u16(0)
        time.sleep_ms(250)

_pin15 = Pin(15, Pin.OUT)
_pin14 = Pin(14, Pin.IN, Pin.PULL_UP)
_adc26 = ADC(26)
_pwm16 = PWM(Pin(16))
_pwm16.freq(1000)
_pwm17 = PWM(Pin(17))

_pin15.value(1)  # led off

bw_script()
`;

test('a micro:bit program reads back, polarity and all', () => {
    const { pseudocode, warnings } = micropythonToPseudocode(MICROBIT_SRC);
    assert.match(pseudocode, /^DEVICE MICROBIT$/m);
    // The name and the ACTIVE LOW both come from `pin0.write_digital(1) # led off`.
    assert.match(pseudocode, /^PIN led = P0 OUTPUT ACTIVE LOW$/m);
    assert.match(pseudocode, /^PIN button_a = BUTTON_A INPUT$/m);
    assert.match(pseudocode, /^PIN p1 = P1 ANALOG$/m);
    assert.match(pseudocode, /FOREVER:/);
    assert.match(pseudocode, /IF read button_a THEN:/);
    // Two statements are one act: the dictionary write is bookkeeping.
    assert.match(pseudocode, /toggle led/);
    assert.ok(!/_level/.test(pseudocode), 'the bookkeeping does not survive');
    assert.match(pseudocode, /wait 200 ms/);
    assert.deepEqual(warnings, []);
});

test('a Pico program reads back, including the tone idiom', () => {
    const { pseudocode, warnings } = micropythonToPseudocode(PICO_SRC);
    assert.match(pseudocode, /^DEVICE PICO$/m);
    assert.match(pseudocode, /^PIN led = GP15 OUTPUT ACTIVE LOW$/m);
    // PULL_UP is a button to ground: pressed reads 0. Stated, not guessed.
    assert.match(pseudocode, /^PIN gp14 = GP14 INPUT ACTIVE LOW$/m);
    assert.match(pseudocode, /^PIN gp26 = GP26 ANALOG$/m);
    assert.match(pseudocode, /^PIN gp16 = GP16 PWM$/m);
    // Only ever given a frequency, never a computed duty — that is a tone.
    assert.match(pseudocode, /^PIN gp17 = GP17 TONE$/m);
    // A tone is four statements and one act; emitting the `if _hz:` as a
    // branch would invent control flow the author never wrote.
    assert.match(pseudocode, /set gp17 to 440 hz/);
    assert.ok(!/IF _hz/.test(pseudocode), 'the zero-guard is not a branch');
    // The writer scales a percentage to the hardware; leaving that in would
    // say a duty of 65535 where the author wrote 60.
    assert.match(pseudocode, /set gp16 to 60 percent/);
    assert.match(pseudocode, /wait 250 ms/);
    assert.deepEqual(warnings, []);
});

test('the Pico ADC comes back on the same scale as every other board', () => {
    const { pseudocode } = micropythonToPseudocode(`from machine import Pin, ADC
import time
def bw_script():
    while True:
        print(_adc26.read_u16() >> 6)
        time.sleep_ms(10)
_adc26 = ADC(26)
bw_script()
`);
    // read_u16() >> 6 is the writer making a 16-bit ADC report 0-1023 like the
    // others. It is an artefact of one board and has no business in portable text.
    assert.match(pseudocode, /print read gp26/);
    assert.ok(!/read_u16|>> 6/.test(pseudocode));
});

test('MicroPython round-trips through sb3-creator to a fixed point', () => {
    for (const src of [MICROBIT_SRC, PICO_SRC]) {
        const ps = micropythonToPseudocode(src).pseudocode;
        const hop = (t) => { const c = new SB3Creator(); c.parse(t); return { text: c.decompile(), warns: c.warnings }; };
        const a = hop(ps), b = hop(a.text);
        assert.deepEqual(a.warns, [], `parses clean: ${JSON.stringify(a.warns)}`);
        assert.equal(b.text, a.text, 'a fixed point after one hop');
    }
});

test('a board that runs MicroPython has no C to emit, by definition', () => {
    const c = new SB3Creator();
    c.parse('DEVICE MICROBIT\nPIN led = P0 OUTPUT\n\nWHEN flag clicked:\n  turn on led\n');
    assert.deepEqual(c.warnings, []);
    const out = c.generateC();
    assert.match(out, /No C emitted for DEVICE MICROBIT/);
    assert.ok(c._cWarnings.some((w) => /the program IS the artefact/.test(w)),
        'not "not yet" — there is nothing to compile at all');
});

test('each board is held to its own pin spelling', () => {
    const cases = [
        ['MICROBIT', 'GP15', /P0-P20, BUTTON_A or BUTTON_B/],
        ['PICO', 'P0', /GP0-GP28/],
        ['ARDUINO-UNO', 'GP15', /D0-D13 or A0-A5/],
        ['MICROBIT', 'P21', /microbit has no P21; it goes up to P20/],
        ['PICO', 'GP29', /pico has no GP29; it goes up to GP28/],
        // The compiler refuses this; sb3-creator disagreeing would mean a
        // project that builds in one place and not the other.
        ['ARDUINO-NANO', 'A6', /analog-input only on the Nano/],
        ['STC12C5A60S2', 'P0', /P<port>\.<bit>/]
    ];
    for (const [device, where, want] of cases) {
        const c = new SB3Creator();
        c.parse(`DEVICE ${device}\nPIN x = ${where} OUTPUT\n`);
        assert.ok(c.warnings.some((w) => want.test(w)),
            `${device} + ${where}: expected ${want}, got ${JSON.stringify(c.warnings)}`);
    }
    // A button is an input and nothing else, on the board that has buttons.
    const b = new SB3Creator();
    b.parse('DEVICE MICROBIT\nPIN a = BUTTON_A OUTPUT\n');
    assert.ok(b.warnings.some((w) => /BUTTON_A is a button and can only be an INPUT/.test(w)));
});

test('a Python file that is not for a board says so instead of guessing', () => {
    const { pseudocode, warnings } = micropythonToPseudocode('import os\nprint(os.getcwd())\n');
    assert.equal(pseudocode, '');
    assert.ok(warnings.some((w) => /not MicroPython for a board this reads/.test(w)));
});

test('a stated pin name beats an inferred one', () => {
    // Only an OUTPUT gets a parking line, so only an output's name survives in
    // the code. An input or an ADC is named nowhere at all -- `_adc26` is what
    // the machine needs and `pot` is what the author wrote -- so the writer
    // states it in an @bw header and the reader takes that over its own
    // inference. This is the same header convention generateC already uses.
    const withHeader = `from machine import Pin, ADC, PWM
import time
# @bw-begin
# @bw device pico
# @bw pin led GP15 output active-low
# @bw pin btn GP14 input active-low
# @bw pin pot GP26 analog
# @bw-end
def bw_script():
    while True:
        if (not _pin14.value()):
            _pin15.value(0)
        print(_adc26.read_u16() >> 6)
        time.sleep_ms(10)
_pin15 = Pin(15, Pin.OUT)
_pin14 = Pin(14, Pin.IN, Pin.PULL_UP)
_adc26 = ADC(26)
_pin15.value(1)  # led off
bw_script()
`;
    const { pseudocode, warnings } = micropythonToPseudocode(withHeader);
    assert.deepEqual(warnings, []);
    assert.match(pseudocode, /^PIN led = GP15 OUTPUT ACTIVE LOW$/m);
    // These two are the whole point: without the header they come back as
    // gp14 and gp26.
    assert.match(pseudocode, /^PIN btn = GP14 INPUT ACTIVE LOW$/m);
    assert.match(pseudocode, /^PIN pot = GP26 ANALOG$/m);
    assert.match(pseudocode, /print read pot/);
    assert.match(pseudocode, /IF not read btn THEN:/);
    // And the header is not left behind as a comment in the output.
    assert.ok(!/@bw/.test(pseudocode));
});

test('a pin declared in the header but unused still exists', () => {
    const { pseudocode } = micropythonToPseudocode(`from microbit import *
# @bw-begin
# @bw device microbit
# @bw pin spare P2 output
# @bw-end
def bw_script():
    while True:
        sleep(10)
bw_script()
`);
    // Dropping it would silently shrink the board: the program has that pin
    // whether or not this particular script touches it.
    assert.match(pseudocode, /^PIN spare = P2 OUTPUT$/m);
});

test('one Python entry point takes both kinds of Python', async () => {
    // A user pasting a file into the importer's Python tab should not have to
    // know whether it is Scratch-runtime Python or MicroPython for a board.
    // Parsing a micro:bit program as the algorithmic subset would succeed
    // syntactically and mean nothing, which is the failure worth routing away
    // from -- the same reason cToPseudocode splits 8051 from Arduino.
    const pythonToPseudocode = (await import('../src/utils/pythonToPseudocode.js')).default;

    const board = pythonToPseudocode(`from microbit import *
# @bw-begin
# @bw device microbit
# @bw pin led P0 output active-low
# @bw-end
def bw_script():
    while True:
        pin0.write_digital(0)
        sleep(50)
bw_script()
`);
    assert.match(board.pseudocode, /^DEVICE MICROBIT$/m);
    assert.match(board.pseudocode, /^PIN led = P0 OUTPUT ACTIVE LOW$/m);
    assert.match(board.pseudocode, /turn on led/, 'ACTIVE LOW: writing 0 turns it ON');

    // And the algorithmic subset is untouched — no DEVICE, a sprite instead.
    const plain = pythonToPseudocode('x = 1\nprint(x + 2)\n');
    assert.ok(!/DEVICE|PIN /.test(plain.pseudocode), 'plain Python is not a board program');
    assert.match(plain.pseudocode, /SPRITE Main:/);
});

// ---- the sixth axis: DEVICE EATER6502 (the composable 6502 machine) --------

const M6502 = `DEVICE EATER6502
PIN led1 = PA0 OUTPUT
PIN btn = PB0 INPUT

WHEN flag clicked:
  FOREVER:
    toggle led1
    wait 0.5 seconds

WHEN flag clicked:
  FOREVER:
    IF (read btn = 1) THEN:
      print 42
    wait 1 seconds
`;

test('6502: VIA registers, T1 timebase, DDR setup, poll-harvested bw_now', () => {
    const c = cOf(M6502, {});
    assert.match(c, /#define F_CPU 1000000UL/, 'DEVICE line takes the 1 MHz default');
    assert.match(c, /#define BW_T1_LATCH \(\(uint16_t\)\(F_CPU \/ 1000UL - 2UL\)\)/,
        'free-run period is LATCH+2, so the latch is clock/1000 - 2');
    assert.match(c, /BW_VIA_ORA &= \(uint8_t\)~\(1 << 0\);\s+\/\* led1: start OFF \*\//,
        'active-high LED starts OFF (low) before DDR flips');
    assert.match(c, /BW_VIA_DDRA \|= \(uint8_t\)\(1 << 0\)/, 'DDR set after level');
    assert.match(c, /BW_VIA_ACR = 0x40/, 'T1 free-run');
    assert.match(c, /BW_VIA_ORA \^= \(uint8_t\)\(1 << 0\)/, 'toggle is an XOR on ORA');
    assert.match(c, /\(\(BW_VIA_IRB >> 0\) & 1\)/, 'button reads IRB');
    assert.match(c, /bw_t1_sink = BW_VIA_T1CL;\s+\/\* reading T1C-L clears IFR6/,
        'bw_now harvests the rollover flag through a volatile sink (cc65 -O drops (void)-cast volatile reads)');
    assert.ok(!/ISR\(|__interrupt/.test(c), 'no interrupt handler anywhere in the build');
});

test('6502: print paces the ACIA on the clock, never polls the buggy TDRE', () => {
    const c = cOf(M6502, {});
    assert.match(c, /BW_ACIA_CTRL = 0x1e/, '9600 8N1');
    assert.match(c, /BW_ACIA_DATA = \(uint8_t\)c;/);
    assert.match(c, /while \(\(int32_t\)\(bw_now\(\) - start - 2\) < 0\)/,
        '2 ms/byte pacing on the millisecond clock');
    assert.ok(!/BW_ACIA_STATUS & /.test(c), 'TDRE is never polled (the WDC silicon bug)');
});

test('6502: PWM, tone, servo, motor and analog all refuse with reasons', () => {
    const c = build(`DEVICE EATER6502
PIN led1 = PA0 OUTPUT
PIN buz = PA2 TONE
PIN pot1 = PA1 ANALOG

WHEN flag clicked:
  set led1 to 50 percent
  set buz to 440 hz
  print read pot1
`);
    const out = c.generateC(undefined, {});
    assert.match(out, /\/\* no PWM on/);
    assert.match(out, /\/\* no tone on this machine \*\//);
    assert.match(out, /0 \/\* no ADC:/);
    // The reasons ride in the C itself as warning comments. (The PWM
    // refusal was generalized to `no PWM on the <core> machine` when the
    // Z80 core joined and shared the path — 818221d.)
    assert.match(out, /warning: no PWM on the 6502 machine/);
    assert.match(out, /cannot be analog: the 6502 machine has no ADC/);
});

test('6502: PB7 is accepted — plain I/O while ACR7 stays 0', () => {
    // W65C22 §2.5: PB7 is ordinary port I/O unless ACR bit 7 enables the
    // Timer-1 output; our runtime writes ACR=0x40 and never claims it.
    // The old refusal broke Ben Eater's own walking-light demo
    // (eater6502-blink uses all eight PB LEDs).
    const c = build(`DEVICE EATER6502
PIN led1 = PB7 OUTPUT

WHEN flag clicked:
  turn on led1
`);
    assert.deepEqual(c.warnings || [], [],
        `PB7 must parse clean, got: ${JSON.stringify(c.warnings)}`);
});

test('6502: retarget accepts digital examples, refuses analog and PART', () => {
    const blink = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN led1 = P1.0 OUTPUT ACTIVE LOW

WHEN flag clicked:
  FOREVER:
    toggle led1
    wait 0.5 seconds
`;
    const r = SB3Creator.retargetPseudocode(blink, 'eater6502');
    assert.ok(r.ok, r.reasons.join('; '));
    assert.match(r.pseudocode, /^DEVICE EATER6502$/m);
    assert.match(r.pseudocode, /^CLOCK 1000000$/m, 'the machine clock travels with the device');
    assert.match(r.pseudocode, /^PIN led1 = PA0 OUTPUT$/m, 'active-high: no ACTIVE LOW suffix');

    const pot = blink.replace('PIN led1 = P1.0 OUTPUT ACTIVE LOW', 'PIN led1 = P1.3 ANALOG')
        .replace(/toggle led1/, 'print read led1');
    const r2 = SB3Creator.retargetPseudocode(pot, 'eater6502');
    assert.equal(r2.ok, false);
    assert.ok(r2.reasons.some((x) => /no ADC/.test(x)));
});

test('PART programs retarget to all cores, rewriting pin coordinates', () => {
    const chaser = `DEVICE STC12C5A60S2
CLOCK 11059200
PART leds = 74HC595 data P1.0 clock P1.1 latch P1.2

WHEN flag clicked:
  FOREVER:
    set leds to 1
    wait 0.1 seconds
`;
    // Arduino Uno: PART pins should become D<n> from the digital pool
    const uno = SB3Creator.retargetPseudocode(chaser, 'arduino-uno');
    assert.ok(uno.ok, 'Uno: ' + uno.reasons.join('; '));
    assert.match(uno.pseudocode, /^PART leds = 74HC595 data D\d+ clock D\d+ latch D\d+$/m,
        'Uno PART pins rewritten to D<n>');

    // Pico: PART pins should become GP<n>
    const pico = SB3Creator.retargetPseudocode(chaser, 'pico');
    assert.ok(pico.ok, 'Pico: ' + pico.reasons.join('; '));
    assert.match(pico.pseudocode, /^PART leds = 74HC595 data GP\d+ clock GP\d+ latch GP\d+$/m,
        'Pico PART pins rewritten to GP<n>');

    // 6502: PART pins should become PA<n> or PB<n>
    const eater = SB3Creator.retargetPseudocode(chaser, 'eater6502');
    assert.ok(eater.ok, 'eater6502: ' + eater.reasons.join('; '));
    assert.match(eater.pseudocode, /^PART leds = 74HC595 data P[AB]\d clock P[AB]\d latch P[AB]\d$/m,
        '6502 PART pins rewritten to VIA pins');

    // 8051 to 8051: PART pins should stay P<p>.<b>
    const home = SB3Creator.retargetPseudocode(chaser, 'stc89c52rc');
    assert.ok(home.ok, '8051: ' + home.reasons.join('; '));
    assert.match(home.pseudocode, /^PART leds = 74HC595 data P\d\.\d clock P\d\.\d latch P\d\.\d$/m,
        '8051 PART pins stay P<p>.<b>');
});

test('MAP/CHIP: the declared 6502 machine parses, moves the bases, round-trips', async () => {
    const src = `DEVICE EATER6502
MAP RAM $0000-$3FFF
MAP ROM $8000-$FFFF
CHIP tva = W65C22 AT $7000
CHIP ser = W65C51 AT $4400
PIN led1 = PA0 OUTPUT

WHEN flag clicked:
  FOREVER:
    toggle led1
    wait 0.5 seconds
    print 1
`;
    const c = build(src);
    assert.deepEqual(c.warnings || [], []);
    assert.equal(c.project.stc.machine.chips.length, 2);
    const out = c.generateC(undefined, {});
    assert.match(out, /#define BW_VIA\(a\)  \(\*\(volatile uint8_t \*\)\(0x7000u \+ \(a\)\)\)/,
        'VIA base moves with the declaration');
    assert.match(out, /#define BW_ACIA_DATA   \(\*\(volatile uint8_t \*\)0x4400u\)/,
        'ACIA base moves with the declaration');
    // The machine survives C -> pseudocode.
    const cToPseudocode = (await import('../src/utils/cToPseudocode.js')).default;
    const back = cToPseudocode(out).pseudocode;
    assert.match(back, /^MAP RAM \$0000-\$3FFF$/m);
    assert.match(back, /^CHIP tva = W65C22 AT \$7000$/m);
    assert.match(back, /^CHIP ser = W65C51 AT \$4400$/m);
    // And decompile() emits the same declarations from the project.
    assert.match(c.decompile(), /^CHIP tva = W65C22 AT \$7000$/m);
});

test('CHIP vdp = TMS9918: parses, names its ports, round-trips', async () => {
    const src = `DEVICE EATER6502
MAP RAM $0000-$3FFF
MAP ROM $C000-$FFFF
CHIP vdp = TMS9918 AT $9000
PIN led1 = PA0 OUTPUT

WHEN flag clicked:
  FOREVER:
    toggle led1
    wait 0.5 seconds
`;
    const c = build(src);
    assert.deepEqual(c.warnings || [], []);
    const chip = c.project.stc.machine.chips.find((ch) => ch.kind === 'vdp');
    assert.ok(chip, 'vdp chip stored on the machine');
    assert.equal(chip.at, 0x9000);
    const out = c.generateC(undefined, {});
    assert.match(out, /#define BW_VDP_DATA \(\*\(volatile uint8_t \*\)0x9000u\)/);
    assert.match(out, /#define BW_VDP_CTRL \(\*\(volatile uint8_t \*\)0x9001u\)/);
    const cToPseudocode = (await import('../src/utils/cToPseudocode.js')).default;
    const back = cToPseudocode(out).pseudocode;
    assert.match(back, /^CHIP vdp = TMS9918 AT \$9000$/m);
    assert.match(c.decompile(), /^CHIP vdp = TMS9918 AT \$9000$/m);
});

test('CHIP TMS9918 refusals: duplicate vdp, overlap with a chip window', () => {
    const warnsOf = (src) => { const c = build(src); return (c.warnings || []).join('\n'); };
    assert.match(warnsOf('DEVICE EATER6502\nCHIP a = TMS9918 AT $9000\nCHIP b = TMS9918 AT $9800\n'),
        /already declared/);
    // The VDP's 2-byte window collides with the VIA's 16-byte one
    assert.match(warnsOf('DEVICE EATER6502\nCHIP a = W65C22 AT $6000\nCHIP b = TMS9918 AT $600e\n'),
        /overlaps/);
});

test('MAP/CHIP refusals: wrong device, overlap, second VIA, chip inside RAM', () => {
    const warnsOf = (src) => { const c = build(src); return (c.warnings || []).join('\n'); };
    assert.match(warnsOf('DEVICE PICO\nMAP RAM $0000-$3FFF\n'), /fixed memory map/);
    assert.match(warnsOf('DEVICE EATER6502\nMAP RAM $0000-$3FFF\nMAP ROM $2000-$5FFF\n'), /overlaps the RAM/);
    assert.match(warnsOf('DEVICE EATER6502\nCHIP a = W65C22 AT $6000\nCHIP b = W65C22 AT $7000\n'), /already declared/);
    assert.match(warnsOf('DEVICE EATER6502\nMAP RAM $0000-$3FFF\nCHIP a = W65C22 AT $2000\n'), /inside the RAM/);
});

test('a declared machine without a VIA warns about the missing timebase', () => {
    const c = build(`DEVICE EATER6502
MAP RAM $0000-$3FFF
MAP ROM $8000-$FFFF
CHIP ser = W65C51 AT $4400
PIN led1 = PA0 OUTPUT

WHEN flag clicked:
  FOREVER:
    toggle led1
    wait 0.5 seconds
`);
    const out = c.generateC(undefined, {});
    assert.match(out, /has no W65C22 — Timer 1 is the timebase/);
});

test('ld65 cfg generation: declared shapes, preset agreement, refusals', () => {
    // The preset (machine = null) must agree with the checked-in eater.cfg
    // numbers — one truth, two spellings.
    const preset = SB3Creator.generate6502LinkerCfg(null);
    assert.ok(preset.ok);
    assert.match(preset.cfg, /RAM: start = \$0200, size = \$3E00/);
    assert.match(preset.cfg, /ROM: start = \$8000, size = \$7FFA/);
    assert.match(preset.cfg, /__STACKSTART__: type = weak, value = \$4000/);

    // A declared 16K ROM at $C000 with 8K RAM.
    const small = SB3Creator.generate6502LinkerCfg({ regions: [
        { kind: 'ram', start: 0x0000, end: 0x1fff },
        { kind: 'rom', start: 0xc000, end: 0xffff },
    ] });
    assert.ok(small.ok);
    assert.match(small.cfg, /RAM: start = \$0200, size = \$1E00/);
    assert.match(small.cfg, /ROM: start = \$C000, size = \$3FFA/);
    assert.match(small.cfg, /__STACKSTART__: type = weak, value = \$2000/);

    // Refusals carry the 6502's own reasons.
    const noVec = SB3Creator.generate6502LinkerCfg({ regions: [
        { kind: 'ram', start: 0x0000, end: 0x3fff },
        { kind: 'rom', start: 0x8000, end: 0xbfff },
    ] });
    assert.equal(noVec.ok, false);
    assert.match(noVec.reasons.join(';'), /vectors at \$FFFA/);

    const highRam = SB3Creator.generate6502LinkerCfg({ regions: [
        { kind: 'ram', start: 0x2000, end: 0x3fff },
        { kind: 'rom', start: 0x8000, end: 0xffff },
    ] });
    assert.equal(highRam.ok, false);
    assert.match(highRam.reasons.join(';'), /zero page and the hardware stack/);

    const tinyRam = SB3Creator.generate6502LinkerCfg({ regions: [
        { kind: 'ram', start: 0x0000, end: 0x00ff },
        { kind: 'rom', start: 0x8000, end: 0xffff },
    ] });
    assert.equal(tinyRam.ok, false);
    assert.match(tinyRam.reasons.join(';'), /at least \$02FF/);
});

// ---- the seventh target: generateBASIC ------------------------------------

const BAS_SRC = `DEVICE EATER6502
PIN led1 = PA0 OUTPUT
PIN btn = PB0 INPUT

DEFINE blink_times (n):
  REPEAT n:
    toggle led1
    wait 0.2 seconds

WHEN flag clicked:
  set count to 0
  REPEAT 3:
    change count by 1
    print count
  IF (read btn = 1) THEN:
    blink_times 2
  ELSE:
    print 99
  FOREVER:
    toggle led1
    wait 0.5 seconds
`;

test('generateBASIC (bbc): numbered lines, pokes, PROC, keyword-safe names', () => {
    const c = build(BAS_SRC);
    const r = c.generateBASIC(undefined, {});
    assert.ok(r.ok, r.reasons.join('; '));
    const b = r.basic;
    assert.match(b, /^10 REM generated by Brickwright \(BBC BASIC profile\)$/m);
    assert.match(b, /\?&6003=1$/m, 'DDRA poke from the machine config');
    assert.match(b, /countx=0$/m, 'COUNT is a BBC keyword (BeebEater uppercases input) — exact collision suffixed');
    assert.match(b, /\?&6001=\?&6001 EOR 1$/m, 'toggle is EOR');
    assert.match(b, /REPEAT UNTIL TIME>=time_target/, 'waits ride TIME (centiseconds)');
    assert.match(b, /\(\(\?&6000 AND 1\) DIV 1\)=1/, 'button read peeks IRB');
    assert.match(b, /DEF PROCdo_blink_times\(n\)/, 'chapter-16 procedure with parameter');
    assert.match(b, /PROCdo_blink_times\(2\)/);
    assert.match(b, /^\d+ END$/m, 'END before the PROC definitions');
    assert.match(b, /ENDPROC/);
    // Every GOTO resolves to a real line number.
    for (const mm of b.matchAll(/GOTO (\d+)/g)) {
        assert.match(b, new RegExp(`^${mm[1]} `, 'm'), `GOTO ${mm[1]} targets a line`);
    }
});

test('generateBASIC (ms): pokes and delay loops; procedures refuse', () => {
    const c = build(BAS_SRC);
    const r = c.generateBASIC(undefined, { profile: 'ms' });
    assert.equal(r.ok, false);
    assert.ok(r.reasons.some((x) => /MS BASIC 1.1 has no named procedures/.test(x)));

    const plain = build(BAS_SRC.replace(/DEFINE[\s\S]*?wait 0.2 seconds\n\n/, '')
        .replace(/    blink_times 2\n/, '    print 1\n'));
    const r2 = plain.generateBASIC(undefined, { profile: 'ms' });
    assert.ok(r2.ok, r2.reasons.join('; '));
    assert.match(r2.basic, /POKE 24579,1/, 'DDRA poke in decimal');
    assert.match(r2.basic, /PEEK\(24577\)/, 'toggle via PEEK arithmetic');
    assert.match(r2.basic, /FOR TD=1 TO .*DC:NEXT TD/, 'delay loop with calibration constant');
    assert.match(r2.basic, /REM V\w = /, 'two-significant-char names carry a REM legend');
});

test('generateBASIC serializes multi-WHEN with a warning', () => {
    const c = build(`DEVICE EATER6502
PIN led1 = PA0 OUTPUT

WHEN flag clicked:
  toggle led1

WHEN flag clicked:
  print 1
`);
    const r = c.generateBASIC(undefined, {});
    assert.ok(r.ok, 'multi-WHEN now serializes instead of refusing');
    assert.ok(r.warnings.some((x) => /serial/i.test(x)), JSON.stringify(r.warnings));
});

test('generateBASIC without line numbers: structured chapter-9/12 form', () => {
    const c = build(BAS_SRC);
    const r = c.generateBASIC(undefined, { lineNumbers: false });
    assert.ok(r.ok, r.reasons.join('; '));
    const b = r.basic;
    assert.ok(!/^\d/m.test(b), 'no line starts with a number');
    assert.ok(!/GOTO/.test(b), 'no GOTO anywhere — labels are a numbered-mode artifact');
    assert.match(b, /^IF \(\(\?&6000 AND 1\) DIV 1\)=1 THEN$/m, 'multi-line IF (ch. 9)');
    assert.match(b, /^ELSE$/m);
    assert.match(b, /^ENDIF$/m);
    assert.match(b, /^REPEAT$/m);
    assert.match(b, /^UNTIL FALSE$/m, 'forever is REPEAT/UNTIL FALSE (ch. 12)');
    assert.match(b, /^  countx=countx\+1$/m, 'bodies indent');
    assert.match(b, /DEF PROCdo_blink_times\(n\)/, 'PROC unchanged across modes');

    // MS BASIC cannot drop numbers — forced back with a warning.
    const plain = build(BAS_SRC.replace(/DEFINE[\s\S]*?wait 0.2 seconds\n\n/, '')
        .replace(/    blink_times 2\n/, '    print 1\n'));
    const r2 = plain.generateBASIC(undefined, { profile: 'ms', lineNumbers: false });
    assert.ok(r2.ok);
    assert.match(r2.basic, /^10 /m, 'numbered despite the request');
    assert.ok(r2.warnings.some((w) => /requires line numbers/.test(w)));
});

// ---- basicToPseudocode: the way back ---------------------------------------

test('BASIC round trip: structured emit -> read -> emit is a byte fixed point', async () => {
    const basicToPseudocode = (await import('../src/utils/basicToPseudocode.js')).default;
    const c1 = build(BAS_SRC);
    const b1 = c1.generateBASIC(undefined, { lineNumbers: false }).basic;
    const r = basicToPseudocode(b1);
    assert.deepEqual(r.warnings, [], 'our own emissions read back clean');
    const c2 = build(r.pseudocode);
    assert.deepEqual(c2.warnings || [], [], 'reconstructed pseudocode re-parses clean');
    const b2 = c2.generateBASIC(undefined, { lineNumbers: false }).basic;
    assert.equal(b2, b1, 'byte-identical through the loop');
});

test('basicToPseudocode: FN macro-expands (ch. 17), unmapped lines are NAMED', async () => {
    const basicToPseudocode = (await import('../src/utils/basicToPseudocode.js')).default;
    const r = basicToPseudocode([
        'DEF FNdouble(x)=x*2',
        'a=FNdouble(21)',
        'MODE 4',
        'PRINT a',
    ].join('\n'));
    assert.match(r.pseudocode, /set a to \(\(21\)\*2\)/, 'FN inlined with the argument substituted');
    // MODE is now mapped (emitted as REM comment, not warned).
    assert.match(r.pseudocode, /# BASIC: MODE 4/, 'graphics statement kept as a named comment');
});

test('basicToPseudocode: BBC REPEAT/UNTIL keeps do-while semantics honestly', async () => {
    const basicToPseudocode = (await import('../src/utils/basicToPseudocode.js')).default;
    const r = basicToPseudocode([
        '10 n=0',
        '20 REPEAT',
        '30 n=n+1',
        '40 UNTIL n>=3',
    ].join('\n'));
    assert.match(r.pseudocode, /first pass \(BASIC REPEAT tests after the body\)/);
    // The first pass precedes the loop; the loop keeps the same body.
    const first = r.pseudocode.indexOf('change n by 1');
    const second = r.pseudocode.indexOf('change n by 1', first + 1);
    assert.ok(first >= 0 && second > first, 'body duplicated, not silently reinterpreted');
});

test('basicToPseudocode: the CC0 corpus reads without crashing, nothing silent', async () => {
    const basicToPseudocode = (await import('../src/utils/basicToPseudocode.js')).default;
    const { readFileSync, readdirSync } = await import('node:fs');
    const dir = new URL('./fixtures/bbc-basic/', import.meta.url);
    let files = 0;
    for (const f of readdirSync(dir)) {
        if (!/\.BAS$/i.test(f)) continue;
        files++;
        const r = basicToPseudocode(readFileSync(new URL(f, dir), 'utf8'));
        assert.ok(r.stats.mapped > 0, `${f}: something mapped`);
        // Every unmapped statement is accounted for: a comment + a warning,
        // so mapped + named-comment count covers the file.
        const namedComments = (r.pseudocode.match(/# BASIC: /g) || []).length;
        assert.ok(r.stats.mapped + namedComments >= r.stats.lines * 0.95,
            `${f}: ${r.stats.mapped} mapped + ${namedComments} named of ${r.stats.lines} — nothing may vanish silently`);
    }
    assert.equal(files, 3, 'all three fixtures exercised');
});

test('BASIC round trip: the NUMBERED mode is a fixed point too (GOTO shapes recovered)', async () => {
    const basicToPseudocode = (await import('../src/utils/basicToPseudocode.js')).default;
    const src = BAS_SRC.replace('  REPEAT 3:', '  REPEAT UNTIL count = 3:')
        .replace('  FOREVER:', '  wait until read btn = 0\n  FOREVER:');
    const c1 = build(src);
    const b1 = c1.generateBASIC(undefined, {}).basic;
    const r = basicToPseudocode(b1);
    const c2 = build(r.pseudocode);
    const b2 = c2.generateBASIC(undefined, {}).basic;
    assert.equal(b2, b1, 'if/else, repeat-until, wait-until and forever all come back from their GOTO shapes');
});

test('basicToPseudocode: CASE (ch. 10) becomes an IF/ELSE chain; DIM maps to the arrays extension 0-based', async () => {
    const basicToPseudocode = (await import('../src/utils/basicToPseudocode.js')).default;
    const r = basicToPseudocode([
        '10 DIM scores(3)',
        '20 scores(0)=7',
        '30 x=scores(0)+1',
        '40 CASE x OF',
        '50 WHEN 8: PRINT "eight"',
        '60 WHEN 1,2: PRINT "small"',
        '70 OTHERWISE',
        '80 PRINT x',
        '90 ENDCASE',
    ].join('\n'));
    assert.match(r.pseudocode, /new array "scores" = \[0,0,0,0\]/, 'DIM a(3) is FOUR zeros (0..3 inclusive)');
    assert.match(r.pseudocode, /set item 0 of array "scores" to 7/, '0-based, NO index shift — the arrays extension matches BBC');
    assert.match(r.pseudocode, /\(item 0 of array "scores"\)\+1/);
    assert.match(r.pseudocode, /IF \(x = 8\) THEN:/);
    assert.match(r.pseudocode, /IF \(x = 1 or x = 2\) THEN:/, 'WHEN with a value list ORs');
    const c = build(r.pseudocode);
    assert.deepEqual(c.warnings || [], [], 'the reconstruction re-parses clean');
});

test('generateBASIC: non-6502 devices emit REM stubs with a warning', () => {
    const { readFileSync } = process.getBuiltinModule('node:fs');
    const blink = readFileSync(new URL('../examples/01-blink/program.bw', import.meta.url), 'utf8');
    const c = build(blink);
    const r = c.generateBASIC(undefined, {});
    assert.ok(r.ok, 'non-6502 pin ops now degrade to REM stubs instead of refusing');
    assert.ok(r.warnings.some((w) => /stub/i.test(w)), 'warned about stubs');
    assert.ok(r.basic.includes('REM turn'), 'pin ops emitted as REM');
    // And the retargeted form emits clean BASIC with real pokes.
    const rt = SB3Creator.retargetPseudocode(blink, 'eater6502');
    const c2 = build(rt.pseudocode);
    const r2 = c2.generateBASIC(undefined, {});
    assert.ok(r2.ok, r2.reasons.join('; '));
    assert.match(r2.basic, /REM @bw pin led1 PA0 output/);
    assert.ok(!/undefined/.test(r2.basic), 'no undefined leaks into the header');
});

test('CHIP vga = SIMPLEVGA: address-free card parses and round-trips', async () => {
    const src = `DEVICE EATER6502
MAP RAM $0000-$3FFF
MAP ROM $C000-$FFFF
CHIP vga = SIMPLEVGA
PIN led1 = PA0 OUTPUT

WHEN flag clicked:
  FOREVER:
    toggle led1
    wait 0.5 seconds
`;
    const c = build(src);
    assert.deepEqual(c.warnings || [], []);
    const chip = c.project.stc.machine.chips.find((ch) => ch.kind === 'simplevga');
    assert.ok(chip, 'simplevga stored on the machine');
    const out = c.generateC(undefined, {});
    const cToPseudocode = (await import('../src/utils/cToPseudocode.js')).default;
    const back = cToPseudocode(out).pseudocode;
    assert.match(back, /^CHIP vga = SIMPLEVGA$/m);
    assert.match(c.decompile(), /^CHIP vga = SIMPLEVGA$/m);
    // one card per machine
    const dup = build(`DEVICE EATER6502\nCHIP a = SIMPLEVGA\nCHIP b = SIMPLEVGA\n`);
    assert.match((dup.warnings || []).join('\n'), /already declared/);
});

// ---- milestone tests: new device flavors round-trip C → pseudocode → C ----
// These are regression tests for delivered milestones. If one of these breaks,
// a device that was working stopped working — escalate immediately.

test('ATtiny88 blink round-trips C → pseudocode → C with zero warnings', async () => {
    const cToPseudocode = (await import('../src/utils/cToPseudocode.js')).default;
    const src = `DEVICE ATTINY88\nCLOCK 8000000\nPIN col0 = PB0 OUTPUT\nPIN row0 = PD0 OUTPUT\n\nWHEN flag clicked:\n  FOREVER:\n    turn on col0\n    turn on row0\n    wait 0.2 seconds\n    turn off col0\n    turn off row0\n    wait 0.2 seconds\n`;
    const c1 = build(src);
    assert.deepEqual(c1.warnings, [], 'parse warnings');
    const code = c1.generateC();
    assert.match(code, /TIMER1_COMPA_vect/, 'ATtiny88 must use Timer1 (Timer0 has no CTC)');
    assert.match(code, /BW_OCR1A/, 'ATtiny88 tick constant is OCR1A');
    const { pseudocode: ps1, warnings: w1 } = cToPseudocode(code);
    assert.deepEqual(w1.filter(w => !/output pins/.test(w)), [], 'round-trip warnings');
    assert.match(ps1, /DEVICE ATTINY88/, 'device survives');
    assert.match(ps1, /PIN col0 = PB0 OUTPUT/, 'PB0 pin survives');
    assert.match(ps1, /PIN row0 = PD0 OUTPUT/, 'PD0 pin survives');
    assert.match(ps1, /turn on col0/, 'port-register write reverse-mapped to pin');
    const c2 = build(ps1);
    const { pseudocode: ps2 } = cToPseudocode(c2.generateC());
    assert.equal(ps2, ps1, 'second hop is stable');
});

test('STC15F2K60S2 multi-task round-trips with zero warnings', async () => {
    const cToPseudocode = (await import('../src/utils/cToPseudocode.js')).default;
    const src = `DEVICE STC15F2K60S2\nCLOCK 11059200\nPIN led1 = P1.0 OUTPUT ACTIVE LOW\nPIN led2 = P1.1 OUTPUT ACTIVE LOW\n\nWHEN flag clicked:\n  FOREVER:\n    turn on led1\n    wait 0.5 seconds\n    turn off led1\n    wait 0.5 seconds\n\nWHEN flag clicked:\n  FOREVER:\n    turn on led2\n    wait 0.3 seconds\n    turn off led2\n    wait 0.3 seconds\n`;
    const c1 = build(src);
    const code = c1.generateC();
    const { pseudocode: ps1, warnings: w1 } = cToPseudocode(code);
    assert.deepEqual(w1, [], 'STC15 round-trip warnings');
    assert.match(ps1, /DEVICE STC15F2K60S2/, 'device survives');
    assert.match(ps1, /WHEN flag clicked:[\s\S]*WHEN flag clicked:/, 'both scripts survive');
    const c2 = build(ps1);
    const { pseudocode: ps2 } = cToPseudocode(c2.generateC());
    assert.equal(ps2, ps1, 'second hop is stable');
});

test('EATER6502 blink round-trips with VIA pin declarations intact', async () => {
    const cToPseudocode = (await import('../src/utils/cToPseudocode.js')).default;
    const src = `DEVICE EATER6502\nCLOCK 1000000\nPIN led = PA0 OUTPUT\n\nWHEN flag clicked:\n  FOREVER:\n    turn on led\n    wait 0.5 seconds\n    turn off led\n    wait 0.5 seconds\n`;
    const c1 = build(src);
    const code = c1.generateC();
    const { pseudocode: ps1, warnings: w1 } = cToPseudocode(code);
    assert.deepEqual(w1, [], 'eater6502 round-trip warnings');
    assert.match(ps1, /DEVICE EATER6502/, 'device survives');
    assert.match(ps1, /PIN led = PA0 OUTPUT/, 'VIA pin survives');
    const c2 = build(ps1);
    const { pseudocode: ps2 } = cToPseudocode(c2.generateC());
    assert.equal(ps2, ps1, 'second hop is stable');
});
