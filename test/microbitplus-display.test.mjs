/**
 * micro:bit+ DISPLAY group → MicroPython — the reference lowering the other
 * microbitPlus groups mirror. Encodes the oracle table (D1–D3 of
 * docs/microbitplus/DUAL-LOWERING-ORACLE.md) as executable assertions on the
 * dialect→MicroPython path.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

function mp(body) {
    const c = new SB3Creator();
    c.parse(`DEVICE MICROBIT:\n  WHEN started:\n    ${body}\n`);
    const r = c.generateMicroPython();
    assert.ok(r.ok, `MicroPython gen failed: ${JSON.stringify(r.reasons || r.warnings)}`);
    return r.py;
}

const CASES = [
    ['D1 show pattern → Image', 'show pattern 09900:09900:09900:00000:00000',
        "display.show(Image('09900:09900:09900:00000:00000'))"],
    ['D2 show text → scroll',   'show text "Hello"',            "display.scroll('Hello')"],
    ['D3 clear display',        'clear display',                 'display.clear()'],
    ['scroll text + delay',     'scroll text "hi" delay 100 ms', "display.scroll('hi', delay=int(100))"],
    ['plot on',                 'plot x 2 y 3 on',               'display.set_pixel(int(2), int(3), 9)'],
    ['plot off',                'plot x 0 y 4 off',              'display.set_pixel(int(0), int(4), 0)'],
];

for (const [name, dialect, expected] of CASES) {
    test(`display lowering: ${name}`, () => {
        const py = mp(dialect);
        assert.ok(py.includes(expected), `expected \`${expected}\` in:\n${py}`);
    });
}

test('every micro:bit program imports the microbit module', () => {
    assert.match(mp('clear display'), /from microbit import \*/);
});

test('`scroll text "x" delay N ms` is NOT grabbed by the stock scroll rule', () => {
    // Regression: the microbitplus parse must precede the generic scroll rule,
    // else `scroll text ...` compiles to a stock display.scroll of the literal
    // "text \"x\" delay N ms".
    const py = mp('scroll text "wave" delay 80 ms');
    assert.ok(py.includes("display.scroll('wave', delay=int(80))"), py);
    assert.ok(!py.includes('text \\"wave\\"'), 'stock scroll hijacked the line');
});
