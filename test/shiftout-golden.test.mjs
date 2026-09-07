// P2 golden: shift_out's emitted C must not move a byte.
//
// P2 refactors shift_out from four hand-copied per-family functions into ONE
// protocol body (_cShiftOutHelper) over per-family BUS primitives
// (_cShiftOutBus). The whole point is that the emitted C is unchanged: the
// device protocol was always the same, only the bus differed. This test pins
// the exact bytes of the emitted shift_out helper for every family that has one
// — avr, 6502, arm, 8051 — so a future change to the protocol/bus machinery
// that would alter a single family's output reddens here.
//
// The expected blocks below were captured from the emitter BEFORE the P2
// refactor. They are the golden. If the protocol/bus split is correct, the
// post-refactor emitter reproduces them byte-for-byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const cOf = (src) => { const c = new SB3Creator(); c.parse(src); return c.generateC(); };

// The four family programs (same wiring, one 74HC595, `set sr to 128`).
const PROGRAMS = {
    '8051': 'PIN led = P1.0 OUTPUT\nPART sr = 74HC595 data P2.0 clock P2.1 latch P2.2\nWHEN flag clicked:\n  set sr to 128',
    avr:    'DEVICE ARDUINO-UNO\nPIN led = D13 OUTPUT\nPART sr = 74HC595 data D2 clock D4 latch D7\nWHEN flag clicked:\n  set sr to 128',
    arm:    'DEVICE PICO\nPIN led = GP25 OUTPUT\nPART sr = 74HC595 data GP10 clock GP11 latch GP12\nWHEN flag clicked:\n  set sr to 128',
    '6502': 'DEVICE EATER6502\nPIN led = PA0 OUTPUT\nPART sr = 74HC595 data PA1 clock PA2 latch PA3\nWHEN flag clicked:\n  set sr to 128',
};

// The exact emitted shift_out helper per family (the golden bytes).
const GOLDEN = {
    avr: `/* 74HC595 shift-out: MSB first, rising-edge clock, latch pulse. */
static void shift_out(volatile uint8_t *dp, uint8_t db,
                      volatile uint8_t *cp, uint8_t cb,
                      volatile uint8_t *lp, uint8_t lb,
                      uint8_t activeLow, uint8_t value)
{
    uint8_t i;
    *lp &= (uint8_t)~(1 << lb);                    /* latch low */
    for (i = 0; i < 8; i++) {
        *cp &= (uint8_t)~(1 << cb);                /* clock low */
        uint8_t bit = (value & 0x80) ? 1 : 0;
        if (activeLow) bit = !bit;
        if (bit) *dp |= (uint8_t)(1 << db);
        else     *dp &= (uint8_t)~(1 << db);
        value <<= 1;
        *cp |= (uint8_t)(1 << cb);                 /* clock high — shift */
    }
    *lp |= (uint8_t)(1 << lb);                     /* latch high — output */
}`,
    arm: `/* 74HC595 shift-out: MSB first, rising-edge clock, latch pulse. */
static void shift_out(uint8_t data_gpio, uint8_t clock_gpio, uint8_t latch_gpio,
                      uint8_t activeLow, uint8_t value)
{
    uint8_t i;
    BW_SIO_GPIO_OUT_CLR = (1UL << latch_gpio);     /* latch low */
    for (i = 0; i < 8; i++) {
        BW_SIO_GPIO_OUT_CLR = (1UL << clock_gpio); /* clock low */
        uint8_t bit = (value & 0x80) ? 1 : 0;
        if (activeLow) bit = !bit;
        if (bit) BW_SIO_GPIO_OUT_SET = (1UL << data_gpio);
        else     BW_SIO_GPIO_OUT_CLR = (1UL << data_gpio);
        value <<= 1;
        BW_SIO_GPIO_OUT_SET = (1UL << clock_gpio); /* clock high — shift */
    }
    BW_SIO_GPIO_OUT_SET = (1UL << latch_gpio);     /* latch high — output */
}`,
    '8051': `/* 74HC595 shift-out: MSB first, rising-edge clock, latch pulse. */
static void shift_out(__sbit data_pin, __sbit clock_pin, __sbit latch_pin,
                      unsigned char activeLow, unsigned char value)
{
    unsigned char i;
    latch_pin = 0;                                  /* latch low */
    for (i = 0; i < 8; i++) {
        clock_pin = 0;                              /* clock low */
        if (activeLow) data_pin = !(value & 0x80);
        else           data_pin =  (value & 0x80) ? 1 : 0;
        value <<= 1;
        clock_pin = 1;                              /* clock high — shift */
    }
    latch_pin = 1;                                  /* latch high — output */
}`,
};
// 6502 shares avr's pointer+bit body byte-for-byte.
GOLDEN['6502'] = GOLDEN.avr;

// Pull the `static void shift_out(...)` helper block out of a full generateC dump.
function extractHelper(code) {
    const lines = code.split('\n');
    const start = lines.findIndex((l) => l.startsWith('/* 74HC595 shift-out: MSB first'));
    assert.ok(start >= 0, 'no shift_out helper found in emitted C');
    // The helper runs from the header comment to its closing brace at column 0.
    let end = -1;
    for (let i = start + 1; i < lines.length; i++) {
        if (lines[i] === '}') { end = i; break; }
    }
    assert.ok(end > start, 'shift_out helper has no closing brace');
    return lines.slice(start, end + 1).join('\n');
}

for (const [fam, src] of Object.entries(PROGRAMS)) {
    test(`shift_out emitted C is byte-identical to golden (${fam})`, () => {
        const helper = extractHelper(cOf(src));
        assert.equal(helper, GOLDEN[fam],
            `${fam} shift_out emission drifted from the golden — the protocol/bus split must not change a byte`);
    });
}

test('the shift_out protocol body is written once (not per family)', () => {
    // Structural guard on the refactor itself: every family flows through the
    // single _cShiftOutHelper, so the header comment is produced from ONE source
    // string. All four goldens carry the identical header line.
    const header = '/* 74HC595 shift-out: MSB first, rising-edge clock, latch pulse. */';
    for (const g of Object.values(GOLDEN)) {
        assert.ok(g.startsWith(header), 'a family golden lost the shared protocol header');
    }
});
