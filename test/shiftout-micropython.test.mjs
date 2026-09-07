// P3 part 2 golden: the 74HC595 shift-out MicroPython driver on the Pico.
//
// The measurement that opened this: `stc12_setpart` (the `set <part> to <n>`
// verb) had NO Pico MicroPython form — it DEGRADED silently (a warning, no
// emission). This closes that gap with a driver emitted from the SAME
// _shiftOutProtocol() the C helper renders (P2's per-family bus, now generateMicroPython
// over machine.Pin). Two things are pinned here: the EXACT emitted Python (a
// drift reddens), and that the C and MicroPython drivers realise the SAME ordered
// protocol — so the sequence is provably not hand-typed a second time.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

// One 74HC595 on the Pico, data/clock/latch on GP2/3/4, `set sr to 170`.
const PROGRAM = 'DEVICE PICO\nPART sr = 74HC595 data GP2 clock GP3 latch GP4\nWHEN flag clicked:\n  set sr to 170';

const mpyOf = (src) => { const c = new SB3Creator(); c.parse(src); return c.generateMicroPython(); };
const cArmOf = (src) => { const c = new SB3Creator(); c.parse(src); return c.generateC(); };

// The exact emitted _shift_out def (the golden bytes).
const GOLDEN_DRIVER = `def _shift_out(data, clock, latch, active_low, value):
    # 74HC595 shift-out: MSB first, rising-edge clock, latch pulse.
    latch.value(0)
    for _ in range(8):
        clock.value(0)
        bit = 1 if (value & 0x80) else 0
        if active_low: bit ^= 1
        data.value(bit)
        value = (value << 1) & 0xff
        clock.value(1)
    latch.value(1)`;

function extractDef(py, name) {
    const lines = py.split('\n');
    const start = lines.findIndex((l) => l === `def ${name}(data, clock, latch, active_low, value):`);
    assert.ok(start >= 0, `no ${name} def found in emitted MicroPython`);
    let end = start + 1;
    while (end < lines.length && (lines[end] === '' || lines[end].startsWith(' '))) end++;
    // Trim a trailing blank the block may include.
    while (end > start && lines[end - 1] === '') end--;
    return lines.slice(start, end).join('\n');
}

test('P3p2: the shift-out verb no longer degrades on the Pico — it emits a driver', () => {
    const mp = mpyOf(PROGRAM);
    assert.ok(mp.ok && mp.py, `generateMicroPython refused: ${JSON.stringify(mp.reasons)}`);
    assert.deepEqual(mp.warnings, [],
        `the shift-out verb still degrades: ${JSON.stringify(mp.warnings)}`);
    assert.ok(!/pass\s+#\s+stc12_setpart/.test(mp.py), 'stc12_setpart is still a pass-stub');
});

test('P3p2: the emitted _shift_out driver is byte-identical to the golden', () => {
    const py = mpyOf(PROGRAM).py;
    assert.equal(extractDef(py, '_shift_out'), GOLDEN_DRIVER,
        'the MicroPython shift-out driver drifted from the golden');
    // The three bus pins are installed as outputs, and the verb calls the driver.
    for (const l of ['_pin_sr_data = Pin(2, Pin.OUT)', '_pin_sr_clock = Pin(3, Pin.OUT)',
        '_pin_sr_latch = Pin(4, Pin.OUT)',
        '_shift_out(_pin_sr_data, _pin_sr_clock, _pin_sr_latch, False, int(170))']) {
        assert.ok(py.includes(l), `missing emitted line: ${l}`);
    }
});

// The shared-protocol proof: reduce BOTH the C (arm) and the MicroPython shift_out
// bodies to an ordered token sequence, and require they are the SAME protocol —
// so a future edit that changed one route's order (LSB-first, latch before the
// loop, clock high before the data) reddens instead of silently diverging.
function tokensC(code) {
    const lines = code.split('\n');
    const s = lines.findIndex((l) => l.includes('void shift_out(uint8_t data_gpio'));
    const body = lines.slice(s, lines.indexOf('}', s) + 1);
    const toks = [];
    for (const l of body) {
        if (/OUT_CLR = \(1UL << latch_gpio\)/.test(l)) toks.push('latch-low');
        else if (/OUT_CLR = \(1UL << clock_gpio\)/.test(l)) toks.push('clock-low');
        else if (/if \(bit\) BW_SIO_GPIO_OUT_SET = \(1UL << data_gpio\)/.test(l)) toks.push('data');
        else if (/value <<= 1;/.test(l)) toks.push('shift');
        else if (/OUT_SET = \(1UL << clock_gpio\)/.test(l)) toks.push('clock-high');
        else if (/OUT_SET = \(1UL << latch_gpio\)/.test(l)) toks.push('latch-high');
    }
    return toks;
}
function tokensPy(py) {
    const def = extractDef(py, '_shift_out').split('\n');
    const toks = [];
    for (const l of def) {
        const t = l.trim();
        if (t === 'latch.value(0)') toks.push('latch-low');
        else if (t === 'clock.value(0)') toks.push('clock-low');
        else if (t === 'data.value(bit)') toks.push('data');
        else if (/^value = \(value << 1\)/.test(t)) toks.push('shift');
        else if (t === 'clock.value(1)') toks.push('clock-high');
        else if (t === 'latch.value(1)') toks.push('latch-high');
    }
    return toks;
}

test('P3p2: C and MicroPython shift-out realise the SAME ordered protocol', () => {
    const EXPECTED = ['latch-low', 'clock-low', 'data', 'shift', 'clock-high', 'latch-high'];
    const c = tokensC(cArmOf(PROGRAM));
    const p = tokensPy(mpyOf(PROGRAM).py);
    assert.deepEqual(c, EXPECTED, `the C shift-out protocol order changed: ${JSON.stringify(c)}`);
    assert.deepEqual(p, EXPECTED, `the MicroPython shift-out protocol order changed: ${JSON.stringify(p)}`);
    assert.deepEqual(p, c, 'the two routes no longer share one protocol description');
});

test('P3p2: a pin-only Pico program emits no shift-out driver (no leak)', () => {
    const py = mpyOf('DEVICE PICO\nPIN led = GP25 OUTPUT\nWHEN flag clicked:\n  turn on led').py;
    assert.ok(!py.includes('_shift_out'), 'shift-out driver leaked into a program that has no 74HC595');
});
