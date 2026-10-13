// `show number` with a minus sign, compiled and run on the Prechin A2's
// 7-segment wiring (Lite task B14, brickwright-lite docs/OPEN-TASKS-2026-09-29.md).
//
// The C's bw_<part>_show_number right-aligns the number in the frame buffer the
// timer ISR scans onto the display (segments P0, 74HC138 select P2.2-P2.4). Until
// 2026-10 it put the minus one digit too far left: MEASURED on this chain,
// `show number -42` scanned '-' onto digit 4, nothing onto digit 5, '4' onto 6
// and '2' onto 7 -- "    - 42". It is now "     -42", as in
// CrispStrobe/stc-compiler (the reference emitter) and the stc12 block
// (CrispStrobe/extensions).
//
// What the display shows is decoded from the firmware's own pin writes: for
// each select address, the segment byte it HOLDS (persistence of vision; the
// ISR blanks P0 for a few microseconds around each switch, then holds the
// digit for a millisecond). bw-board's sevenseg8 is not read here: it latches
// the segments present at the moment the select settles, which in this ISR's
// order (blank, select, segments) is the blank -- a separate gap, named in
// Lite's B14 receipt.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { chainSkip, runOn } from './helpers/mcu-chain.mjs';

const FONT = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f];
const glyph = (b) => (b === 0 ? ' ' : b === 0x40 ? '-' : FONT.includes(b) ? String(FONT.indexOf(b)) : '?');

/** The eight digits the scan holds in [fromMs, toMs), from the pin writes. */
function scanned(events, fromMs, toMs) {
    const lv = {};
    const frame = new Array(8).fill(null);
    let t0 = null;
    const state = () => {
        let seg = 0;
        for (let i = 0; i < 8; i++) seg |= (lv[`p0.${i}`] ? 1 : 0) << i;
        const sel = (lv['p2.2'] ? 1 : 0) | (lv['p2.3'] ? 2 : 0) | (lv['p2.4'] ? 4 : 0);
        return { seg, sel };
    };
    for (const e of [...events].sort((a, b) => a.tNs - b.tNs)) {
        if (t0 !== null && e.tNs !== t0) {
            // The state held from t0 to this write; 200 us is a fifth of a digit.
            if (e.tNs - t0 >= 200_000 && t0 >= fromMs * 1e6 && e.tNs <= toMs * 1e6) {
                const { seg, sel } = state();
                frame[sel] = seg;
            }
        }
        lv[e.pin] = e.high;
        t0 = e.tNs;
    }
    return frame.map((b) => (b === null ? '_' : glyph(b))).join('');
}

const src = (n) => `DEVICE STC89C52RC:
  CLOCK 11059200
  PART display = SEVENSEG8 SEGMENTS P0 SELECT P2.2 P2.3 P2.4

  WHEN started:
    show number ${n} on display
`;

const CASES = [
    [-42, '     -42'],
    [42, '      42'],
    [-7, '      -7'],
    [-32768, '  -32768'],
    [0, '       0'],
];

describe('chain SEVENSEG8: show number with a minus, on the A2 wiring', () => {
    for (const device of ['stc89c52rc', 'stc12c5a60s2', 'stc15f2k60s2']) {
        test(device, { skip: chainSkip(device) || false, timeout: 300000 }, async () => {
            for (const [n, want] of CASES) {
                const r = await runOn(src(n), device);
                r.run(60);
                // MEASURED 2026-10-13: 226-523 pin writes in 60 ms on the three parts
                // (0 fewest, -32768 most); 100 only says the 1 ms ISR is scanning.
                assert.ok(r.events.length > 100, `${device} ${n}: the ISR scans (${r.events.length} pin writes)`);
                assert.equal(scanned(r.events, 20, 60), want, `${device}: show number ${n}`);
            }
        });
    }
});
