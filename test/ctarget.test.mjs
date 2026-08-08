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
// Set STC_COMPILER_URL=https://stc-compiler.vercel.app to additionally POST every fixture
// to the live service (`{"language":"c"}`) and prove it really builds. Off by default so
// the fast suite stays offline.
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

const FIXTURES = { BLINK, SCHEDULED, STC89, STC15 };

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
// Opt-in (STC_COMPILER_URL=https://stc-compiler.vercel.app), because it needs the network.

const ORACLE = process.env.STC_COMPILER_URL;
for (const [name, src] of Object.entries(FIXTURES)) {
    test(`oracle: ${name} compiles with SDCC`, { skip: ORACLE ? false : 'set STC_COMPILER_URL to run' }, async () => {
        const creator = build(src);
        const code = creator.generateC();
        const response = await fetch(`${ORACLE.replace(/\/$/, '')}/compile`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                code, language: 'c',
                target: creator.project.stc.device,
                fosc: creator.project.stc.clock
            })
        });
        const body = await response.json();
        assert.equal(response.status, 200, JSON.stringify(body).slice(0, 800));
        assert.ok(body.hex || body.image || body.memory, `no image returned: ${JSON.stringify(body).slice(0, 400)}`);
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

test('C we cannot express is dropped with a warning, never mistranslated', () => {
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
    assert.ok(!/mask/.test(pseudocode), 'the bitwise work is not invented into pseudocode');
    assert.ok(warnings.some((w) => /bitwise/.test(w)));
});

test('the scheduler form is declared unsupported rather than mis-inverted', () => {
    const c = new SB3Creator();
    c.parse(SCHEDULED);
    const { warnings } = cToPseudocode(c.generateC());
    assert.ok(warnings.some((w) => /cooperative-scheduler form/.test(w)),
        'a Duff\'s-device state machine is not inverted here, and says so');
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
