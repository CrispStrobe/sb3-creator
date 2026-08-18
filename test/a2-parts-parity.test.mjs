// SEVENSEG8 + LEDBANK8 parity with the reference dialect (stc-compiler
// 05744c9; that side's test_a2_parts pins the same C). The ISR digit
// advance, the shadow push, the helper bodies and the canonical verb forms
// are asserted against the reference's exact lines — the two emitters must
// not drift. Deliberate divergence (recorded in DIVERGENCES.md): the
// reference keeps a single WHEN straight-line with the ISR alongside;
// sb3-creator forces the cooperative-scheduler path (the matrix precedent —
// its ISR only exists there). Same ISR bytes, different main() shell.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import cToPseudocode from '../src/utils/cToPseudocode.js';

const SRC = `DEVICE STC89C52RC:
  CLOCK 11059200

  PART display = SEVENSEG8 SEGMENTS P0 SELECT P2.2 P2.3 P2.4
  PART leds = LEDBANK8 ON P2 ACTIVE LOW

  WHEN started:
    show number 42 on display
    show digit 2 = value 11 on display
    set digit 0 to segments 0x40 on display
    clear display
    turn on led 3 on leds
    turn off led 3 on leds
    set leds to 0xF0 on leds
    light only led 7 on leds
    FOREVER:
      wait 100 ms
`;

const build = (src) => { const c = new SB3Creator(); c.parse(src); return c; };

test('SEVENSEG8: ISR digit advance matches the reference line for line', () => {
    const c = build(SRC);
    // the shared-port warning is expected — the A2 wires P2 to both
    assert.equal((c.warnings || []).filter((w) => !/shares a port/.test(w)).length, 0,
        JSON.stringify(c.warnings));
    const cc = c.generateC();
    for (const l of [
        '/* display: advance one digit */',
        '    P0 = 0x00;           /* blank during switch */',
        '    P2_2 = bw_display_cur & 0x01 ? 1 : 0;',
        '    P2_3 = bw_display_cur & 0x02 ? 1 : 0;',
        '    P2_4 = bw_display_cur & 0x04 ? 1 : 0;',
        '    P0 = bw_display_fb[bw_display_cur];',
        '    bw_display_cur = (bw_display_cur + 1) & 0x07;',
        '    P2 = (unsigned char)~bw_leds_shadow;  /* LEDs active low */',
    ]) assert.ok(cc.includes(l), 'missing ISR line: ' + l);
    // font + state statics, reference bytes
    assert.match(cc, /static const __code unsigned char bw_7seg_font\[16\] = \{/);
    assert.match(cc, /0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07,/);
    assert.match(cc, /static unsigned char bw_display_fb\[8\];/);
    assert.match(cc, /static unsigned char bw_leds_shadow;/);
});

test('helpers and verb calls match the reference', () => {
    const cc = build(SRC).generateC();
    for (const l of [
        'static void bw_display_show_number(int n)',
        '        bw_display_fb[i] = bw_7seg_font[u % 10];',
        "        bw_display_fb[i - 1] = 0x40;  /* minus = segment g */",
        'static void bw_display_show_digit(unsigned char d, unsigned char v)',
        '    bw_display_fb[d] = bw_7seg_font[v & 0x0F];',
        'static void bw_leds_only(unsigned char n)',
        '    bw_leds_shadow = (n > 7) ? 0 : (unsigned char)(1 << n);',
        'bw_display_show_number(42);',
        'bw_leds_on((unsigned char)(3));',
        'bw_leds_set((unsigned char)(240));',
    ]) assert.ok(cc.includes(l), 'missing: ' + l);
});

test('common anode inverts the segment write', () => {
    const cc = build(SRC.replace('SELECT P2.2 P2.3 P2.4',
        'SELECT P2.2 P2.3 P2.4 COMMON ANODE')).generateC();
    assert.match(cc, /P0 = \(unsigned char\)~bw_display_fb\[bw_display_cur\];/);
});

test('C round-trips to the canonical verbs as a fixed point', () => {
    const c = build(SRC);
    const cc = c.generateC();
    assert.match(cc, /@bw part display sevenseg8 P0 P2\.2 P2\.3 P2\.4/);
    assert.match(cc, /@bw part leds ledbank8 P2 active-low/);
    const back = cToPseudocode(cc);
    const bw = String(back.pseudocode ?? back);
    assert.match(bw, /PART display = SEVENSEG8 SEGMENTS P0 SELECT P2\.2 P2\.3 P2\.4/);
    assert.match(bw, /PART leds = LEDBANK8 ON P2 ACTIVE LOW/);
    assert.match(bw, /show number 42 on display/);
    assert.match(bw, /show digit 2 = value 11 on display/);
    assert.match(bw, /set digit 0 to segments 64 on display/);
    assert.match(bw, /turn on led 3 on leds/);
    assert.match(bw, /light only led 7 on leds/);
    const c2 = build(bw);
    assert.equal(c2.generateC(), cc, 'pseudocode → C → pseudocode → C is a fixed point');
});

test('shared select/LED port warns; direct set refused; non-8051 gated', () => {
    const c = build(SRC);
    assert.match((c.warnings || []).join('; '), /shares a port with display's select pins/);
    const c2 = build(SRC.replace('    clear display\n',
        '    set display to 5\n    set leds to 3\n'));
    const w = (c2.warnings || []).join('; ');
    assert.match(w, /is an 8-digit display/);
    assert.match(w, /is an LED bank/);
    const c3 = build(SRC.replace('DEVICE STC89C52RC:', 'DEVICE ARDUINO-UNO:'));
    assert.match((c3.warnings || []).join('; '), /SEVENSEG8 is not available/);
});
