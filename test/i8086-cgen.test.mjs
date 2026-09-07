// blocks -> C for the 8086, through an attached 8255 PPI (generateC's
// `this._core === 'i8086'` branch).
//
// The 8086 board has numbered pins on an 8255, not 8051 SFRs, so `pin` gets its
// own emission: a shadow byte per port, read-modify-write then OUT to set, IN to
// read, and the mode-0 control word written once at init. Port access goes
// through two port-I/O primitives, bw_outb(port, value) and bw_inb(port) — the
// consuming project (brickwright-lite) supplies their asm bodies, because the
// 8255 is I/O-mapped and the C compiler (SmallerC) has no inline asm. This test
// pins the EMITTED C: the port addresses, the control word written once, the
// shadow discipline, and the refusal for every verb that is not yet a pin.
//
// P1/P2/P3 map onto the 8255's ports A/B/C at I/O 0x60/0x61/0x62, control 0x63 —
// the IBM-XT addresses. The same PIN declarations reseat between an 8051 and an
// 8086 board (STC_PARTS.i8086), which is why the pin surface is shared.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import SB3Creator from '../src/utils/sb3Creator.js';

const build = (src) => { const c = new SB3Creator(); c.parse(src); return c; };
const cOf = (src) => build(src).generateC();

const OUT_PINS = `DEVICE i8086
PIN led = P1.0 OUTPUT
PIN buzz = P2.3 OUTPUT

WHEN flag clicked:
  turn on led
  turn on buzz
  turn off buzz
`;

test('i8086 pin: the emitter declares the port-I/O API and a shadow byte per port', () => {
    const c = cOf(OUT_PINS);
    assert.match(c, /extern void bw_outb\(unsigned port, unsigned value\);/, 'bw_outb is not declared');
    assert.match(c, /extern unsigned bw_inb\(unsigned port\);/, 'bw_inb is not declared');
    assert.match(c, /static unsigned char bw_port_a = 0;/, 'no shadow byte for port A');
    assert.match(c, /static unsigned char bw_port_b = 0;/, 'no shadow byte for port B');
});

test('i8086 pin: set high/low is a shadow read-modify-write then OUT to the port', () => {
    const c = cOf(OUT_PINS);
    // P1.0 high: OR the mask into the port A shadow, then OUT to 0x60.
    assert.match(c, /bw_port_a \|= 0x1u; bw_outb\(0x60u, bw_port_a\);/, 'set-high is not shadow-OR then OUT to port A');
    // P2.3 low (turn off): AND the inverted mask (0xf7) into the port B shadow.
    assert.match(c, /bw_port_b &= 0xf7u; bw_outb\(0x61u, bw_port_b\);/, 'set-low is not shadow-AND then OUT to port B');
});

test('i8086 pin: toggle XORs the 8255 shadow then writes it, including active-low pins', () => {
    const c = cOf(`DEVICE i8086
PIN led = P1.0 OUTPUT ACTIVE LOW
PIN relay = P2.3 OUTPUT
PIN lamp = P3.7 OUTPUT

WHEN flag clicked:
  toggle led
  toggle relay
  toggle lamp
`);
    assert.match(c, /bw_port_a \^= 0x1u; bw_outb\(0x60u, bw_port_a\);/,
        'toggle is not shadow-XOR then OUT to port A');
    assert.match(c, /bw_port_b \^= 0x8u; bw_outb\(0x61u, bw_port_b\);/,
        'toggle hard-coded the port-A address or P1.0 mask instead of mapping port B');
    assert.match(c, /bw_port_c \^= 0x80u; bw_outb\(0x62u, bw_port_c\);/,
        'toggle hard-coded the port-A address or P1.0 mask instead of mapping port C');
    assert.doesNotMatch(c, /BW_I8255:/,
        'the non-lvalue sentinel escaped because the i8086 toggle branch was skipped');
});

const TOGGLE_GOLDENS = Object.freeze({
    '6502': ['EATER6502', 'PA0', '63c561bdbaa8e48b0a6f8b49f2f26fa073535aa889822a2cad472e82ad633900'],
    '8051': ['STC12C5A60S2', 'P1.0', 'ce69b29a216c4bde14ca670d3074d9ac9477cd262165d8cbdddcf93694e1e66b'],
    avr: ['ARDUINO-UNO', 'D13', '704419a1e1f7c9b7dfd416620f23e8344e3a27018982140c35d378b0565b8591'],
    arm: ['PICO', 'GP25', '962878552628d5390ec2748beea458d2e07d5fad58301b1cdf35d1281f0366a4']
});
for (const [family, [device, pin, golden]] of Object.entries(TOGGLE_GOLDENS)) {
    test(`i8086 toggle branch preserves the pre-change ${family} C bytes`, () => {
        const code = cOf(`DEVICE ${device}\nPIN led = ${pin} OUTPUT ACTIVE LOW\nWHEN flag clicked:\n  toggle led\n`);
        assert.equal(createHash('sha256').update(code).digest('hex'), golden,
            `${family} toggle emission moved while adding the i8086-only branch`);
    });
}

test('i8086 pin: the 8255 control word is written exactly once, at init', () => {
    const c = cOf(OUT_PINS);
    const writes = (c.match(/bw_outb\(0x63u,/g) || []).length;
    assert.equal(writes, 1, `the control word (port 0x63) is written ${writes} times; it must be once (a mode word clears the latches)`);
    // all-output here: base 0x80, no input bits.
    assert.match(c, /bw_outb\(0x63u, 0x80u\);/, 'the all-output control word should be 0x80');
});

test('i8086 pin: an INPUT pin sets its port-C direction bit in the control word, and reads via IN', () => {
    const c = cOf(`DEVICE i8086
PIN led = P1.0 OUTPUT
PIN btn = P3.0 INPUT

WHEN flag clicked:
  turn on led
  set state to read btn
`);
    // P3.0 INPUT -> port C lower nibble input: 0x80 | 0x01 = 0x81.
    assert.match(c, /bw_outb\(0x63u, 0x81u\);/, 'a P3.0 INPUT pin should make the control word 0x81');
    // the read is an IN from port C (0x62), bit 0.
    assert.match(c, /\(bw_inb\(0x62u\) >> 0\) & 1\)/, 'reading P3.0 should IN from port C address 0x62');
});

test('i8086 pin: a pin outside the 8255 ports (P0, or P4/P5) is refused by name', () => {
    const c = build(`DEVICE i8086
PIN bad = P0.0 OUTPUT

WHEN flag clicked:
  turn on bad
`);
    assert.ok(c.warnings.some((w) => /8255 port pin/.test(w)) || /8255 port pin/.test(c.generateC()),
        'P0 (not an 8255 port) should be refused by name, never emitted as a port write');
});

test('i8086: wait is the one non-pin verb admitted by N2c and uses no 8051 timer code', () => {
    const c = cOf(`DEVICE i8086
PIN led = P1.0 OUTPUT

WHEN flag clicked:
  turn on led
  wait 1 seconds
  turn off led
`);
    assert.doesNotMatch(c, /No C emitted/, 'N2c wait still hits the i8086 verb choke');
    assert.match(c, /bw_delay_ms\(1000\)/, 'wait does not cross the C-route helper boundary');
    assert.doesNotMatch(c, /TL0|TH0|TF0|TR0/, '8051 Timer 0 code leaked into the i8086 output');
});

test('i8086 pin-only programs still emit (the choke point does not over-refuse)', () => {
    const c = cOf(OUT_PINS);
    assert.doesNotMatch(c, /No C emitted/, 'a pin-only i8086 program must emit C, not be refused');
    assert.match(c, /int main\(void\)/, 'the emitted program should have a main');
});

// P2: shift_out is the SECOND verb the 8086 column implements (after pin). Its
// protocol body is shared with avr/6502/arm/8051 (test/shiftout-golden.test.mjs
// pins those byte-for-byte); here only the i8086 BUS — the 8255 shadows driven
// through bw_outb — is asserted.
const SHIFT_SRC = `DEVICE i8086
PIN led = P1.0 OUTPUT
PART sr = 74HC595 data P2.0 clock P2.1 latch P2.2

WHEN flag clicked:
  set sr to 128
`;

test('i8086 shift_out: emitted, not refused (it is an implemented verb now)', () => {
    const c = cOf(SHIFT_SRC);
    assert.doesNotMatch(c, /No C emitted/, 'shift_out on i8086 must emit — the choke exempts it');
    assert.match(c, /static void shift_out\(unsigned char \*dsh, unsigned dport, unsigned dm,/,
        'the i8086 shift_out helper takes (shadow*, port, mask) per pin');
});

test('i8086 shift_out: pins drive their 8255 port shadow through bw_outb', () => {
    const c = cOf(SHIFT_SRC);
    // data/clock/latch are P2.0/2.1/2.2 -> port B (0x61), masks 0x1/0x2/0x4.
    assert.match(c, /shift_out\(&bw_port_b, 0x61u, 0x1u, &bw_port_b, 0x61u, 0x2u, &bw_port_b, 0x61u, 0x4u, 0, \(unsigned char\)\(128\)\);/,
        'the call site passes each PART pin as its port-B shadow, I/O address and bit mask');
    // The bus drives a pin by read-modify-write of the shadow, then OUT.
    assert.match(c, /\*csh \|= cm; bw_outb\(cport, \*csh\);/, 'clock-high is a shadow-OR then bw_outb');
    assert.match(c, /\*lsh &= \(unsigned char\)~lm; bw_outb\(lport, \*lsh\);/, 'latch-low is a shadow-AND-NOT then bw_outb');
});

test('i8086 shift_out: no byte-width parameters (they would force an 80386 MOVZX)', () => {
    // SmallerC zero-extends a byte parameter read with MOVZX, which the 8086
    // assembler rejects; the scalar params are `unsigned` for that reason.
    const c = cOf(SHIFT_SRC);
    const sig = c.slice(c.indexOf('static void shift_out'), c.indexOf('{', c.indexOf('static void shift_out')));
    assert.doesNotMatch(sig, /unsigned char (dport|dm|cport|cm|lport|lm|activeLow|value)\b/,
        'no scalar shift_out parameter may be unsigned char — only the shadow pointers are byte-wide');
});

test('i8086 shift_out: the 8255 control word is still written exactly once', () => {
    const c = cOf(SHIFT_SRC);
    const writes = (c.match(/bw_outb\(0x63u,/g) || []).length;
    assert.equal(writes, 1, `control word written ${writes} times; must be once`);
});
