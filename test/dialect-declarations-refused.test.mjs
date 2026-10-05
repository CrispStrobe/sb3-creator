/**
 * A declaration the device cannot take is refused, never warned about and
 * skipped (task D6, found by D5).
 *
 * THE DEFECT. parseStcDeclaration had 78 places that said why a DEVICE / PIN /
 * PORT / PART / TABLE / LEDCUBE / MAP / CHIP line could not be taken — a pin in
 * another board's spelling, a clash with a pin a PART owns, a second LCD, a
 * TABLE byte over 255 — and every one of them WARNED and skipped the line. The
 * pin, part or table was then simply not declared: the statements that used it
 * were refused (D5) for a name that "does not exist", or, where nothing used it
 * (a clashing PORT, `DEVICE STC12`), the program built for something else with
 * only a warning to say so. `device-idle-coverage` had passed for three rows
 * (`DEVICE STC12` / `STC89` / `STC15`) that silently tested the default chip.
 * SHAPE / COSTUME / BACKDROP lines that could not be applied did the same.
 *
 * THE FIX. Each site calls refuseDeclaration(), which records the line as
 * unreadable with its reason — the same UnparsedLinesError
 * (DIALECT_UNPARSED_LINES) path every other unreadable line takes — and a
 * declaration keyword no declaration form reads says so. The one warning left
 * in parseStcDeclaration keeps its line (LEDBANK8 sharing a port with a
 * SEVENSEG8's select pins builds, and says the two cannot both hold a pattern).
 *
 * THE WHOLE SET. The table below drives every refuseDeclaration() call site,
 * and the last test proves it: it records which source line each refusal came
 * from and compares that set with the call sites enumerated from the source,
 * so a new refusal without a row here fails.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import SB3Creator from '../src/utils/sb3Creator.js';

const P8051 = '';   // the default device is the STC12C5A60S2 (8051)
const KEY8051 = 'PART keys = KEYPAD4X4 ROWS P1.7 P1.6 P1.5 P1.4 COLS P1.3 P1.2 P1.1 P1.0';
const LCD = 'PART lcd = LCD1602 DATA P0.4 P0.5 P0.6 P0.7 RS P2.0 EN P2.1 WRITE ONLY';
const MATRIX = 'PART screen = MATRIX8X8 ROWS 74HC595 DATA P3.4 CLOCK P3.6 LATCH P3.5 COLUMNS P0';
const SEG = 'PART display = SEVENSEG8 SEGMENTS P0 SELECT P2.2 P2.3 P2.4';
const PICO_KEYS = 'PART keys = KEYPAD4X4 ROWS GP0 GP1 GP2 GP3 COLS GP4 GP5 GP6 GP7';

// [declarations (the LAST line is the refused one), reason]
const CASES = [
    // DEVICE
    ['DEVICE NOPE', /Unknown DEVICE "NOPE"/],
    // MAP / CHIP (the 6502 machine)
    ['DEVICE PICO\nMAP RAM $0000-$3FFF', /fixed memory map/],
    ['DEVICE EATER6502\nMAP RAM $4000-$3FFF', /start must be below end/],
    ['DEVICE EATER6502\nMAP RAM $0000-$3FFF\nMAP ROM $2000-$5FFF', /overlaps the RAM/],
    ['DEVICE PICO\nCHIP v = SIMPLEVGA', /CHIP declarations describe the 6502 machine/],
    ['DEVICE EATER6502\nCHIP a = SIMPLEVGA\nCHIP b = SIMPLEVGA', /a SIMPLEVGA is already declared/],
    ['DEVICE PICO\nCHIP a = W65C22 AT $6000', /CHIP declarations describe the 6502 machine/],
    ['DEVICE EATER6502\nCHIP a = W65C22 AT $6000\nCHIP b = W65C22 AT $7000', /already declared — one of each/],
    ['DEVICE EATER6502\nMAP RAM $0000-$3FFF\nCHIP a = W65C22 AT $2000', /sits inside the RAM region/],
    ['DEVICE EATER6502\nCHIP a = W65C22 AT $6000\nCHIP b = TMS9918 AT $600e', /overlaps "a"/],
    // PIN, board spellings
    ['DEVICE ARDUINO-UNO\nPIN x = P9 OUTPUT', /"P9" is not how arduino-uno names a pin/],
    ['DEVICE ARDUINO-UNO\nPIN x = D14 OUTPUT', /has no D14; it goes up to D13/],
    ['DEVICE ARDUINO-UNO\nPIN x = D13 OUTPUT\nPIN x = D12 OUTPUT', /Pin "x" declared twice/],
    ['DEVICE ARDUINO-NANO\nPIN x = A6 OUTPUT', /analog-input only on the Nano/],
    ['DEVICE STM32F030\nPIN x = PA9 ANALOG', /ANALOG on the STM32F030 means PA0-PA7/],
    ['DEVICE STM32F030\nPIN x = PA0 PWM', /PWM on the STM32F030 means PA6, PA7 or PB1/],
    ['DEVICE PICO\nPIN x = GP5 ANALOG', /ANALOG on the Pico means GP26, GP27 or GP28/],
    ['DEVICE ARDUINO-UNO\nPIN x = D3 ANALOG', /ANALOG needs an analog input/],
    ['DEVICE MICROBIT\nPIN a = BUTTON_A OUTPUT', /BUTTON_A is a button and can only be an INPUT/],
    [`DEVICE PICO\n${PICO_KEYS}\nPIN led = GP0 OUTPUT`, /GP0 is already claimed by "keys"; a PART owns that pin/],
    // PIN, 8051 spelling
    [`${P8051}PIN a = P1.0 OUTPUT\nPIN a = P1.1 OUTPUT`, /Pin "a" declared twice/],
    [`${P8051}PIN p = P2.0 ANALOG`, /ANALOG is only available on P1\.0-P1\.7/],
    [`${P8051}PORT p1 = P1 OUTPUT\nPIN led = P1.0 OUTPUT`, /already declared as the whole port "p1"/],
    [`${P8051}PART sr = 74HC595 data P2.0 clock P2.1 latch P2.2\nPIN led = P2.0 OUTPUT`, /P2\.0 is already claimed by "sr"; a PART owns that pin/],
    // PORT
    [`${P8051}PIN a = P1.0 OUTPUT\nPORT a = P2 OUTPUT`, /"a" declared twice/],
    [`${P8051}PIN led = P1.0 OUTPUT\nPORT p1 = P1 OUTPUT`, /already used one bit at a time, by "led"/],
    [`${P8051}PORT a = P1 OUTPUT\nPORT b = P1 OUTPUT`, /P1 is already declared as "a"/],
    [`${P8051}PART sr = 74HC595 data P2.0 clock P2.1 latch P2.2\nPORT p2 = P2 OUTPUT`, /overlaps pins already claimed by "sr"/],
    // PART 74HC595, 8051 spelling
    [`${P8051}PIN sr = P1.0 OUTPUT\nPART sr = 74HC595 data P2.0 clock P2.1 latch P2.2`, /"sr" declared twice/],
    [`${P8051}PART sr = 74HC595 data P2.0 clock P2.0 latch P2.2`, /names the same pin twice; data, clock and latch/],
    [`${P8051}PIN led = P2.0 OUTPUT\nPART sr = 74HC595 data P2.0 clock P2.1 latch P2.2`, /P2\.0 is already declared as "led"/],
    [`${P8051}PORT p2 = P2 OUTPUT\nPART sr = 74HC595 data P2.0 clock P2.1 latch P2.2`, /inside the whole port "p2"/],
    [`${P8051}PART a = 74HC595 data P2.0 clock P2.1 latch P2.2\nPART b = 74HC595 data P2.0 clock P2.3 latch P2.4`, /P2\.0 is already claimed by "a"/],
    // PART 74HC595, board spelling
    ['DEVICE PICO\nPIN sr = GP0 OUTPUT\nPART sr = 74HC595 data GP1 clock GP2 latch GP3', /"sr" declared twice/],
    ['DEVICE PICO\nPART sr = 74HC595 data GP1 clock GP1 latch GP3', /names the same pin twice/],
    ['DEVICE PICO\nPIN led = GP1 OUTPUT\nPART sr = 74HC595 data GP1 clock GP2 latch GP3', /GP1 is already declared as "led"/],
    ['DEVICE PICO\nPART a = 74HC595 data GP1 clock GP2 latch GP3\nPART b = 74HC595 data GP1 clock GP4 latch GP5', /GP1 is already claimed by "a"/],
    // PART LCD1602
    [`DEVICE ARDUINO-UNO\n${LCD}`, /LCD1602 parallel pin syntax is currently available on the 8051 family/],
    [`${P8051}PIN lcd = P1.0 OUTPUT\n${LCD}`, /"lcd" declared twice/],
    [`${P8051}${LCD.replace('P0.5', 'P0.4')}`, /names the same pin twice; LCD1602/],
    [`${P8051}PIN clash = P0.4 OUTPUT\n${LCD}`, /P0\.4 is already declared as "clash"/],
    [`${P8051}PORT p0 = P0 OUTPUT\n${LCD}`, /inside the whole port "p0"/],
    [`${P8051}PART sr = 74HC595 data P2.0 clock P3.1 latch P3.2\n${LCD}`, /P2\.0 is already claimed by "sr"/],
    [`${P8051}${LCD}\n${LCD.replace('lcd', 'lcd2').replace(/P0\.(\d)/g, 'P1.$1').replace('P2.0', 'P3.0').replace('P2.1', 'P3.1')}`, /only one parallel LCD1602/],
    // PART SERVO / MOTOR
    [`${P8051}PART a = SERVO 1\nPART b = SERVO 1`, /servo channel 1 is already declared as "a"/],
    [`${P8051}PART a = SERVO 1\nPART a = MOTOR 1`, /"a" is already a declared part/],
    // PART KEYPAD4X4, 8051 spelling
    [`DEVICE ARDUINO-UNO\n${KEY8051}`, /KEYPAD4X4 is not available on arduino-uno/],
    [`${P8051}PIN keys = P3.0 OUTPUT\n${KEY8051}`, /"keys" declared twice/],
    [`${P8051}${KEY8051.replace('COLS P1.3', 'COLS P1.7')}`, /names the same pin twice; a 4x4 keypad/],
    [`${P8051}PIN led = P1.0 OUTPUT\n${KEY8051}`, /P1\.0 is already declared as "led"/],
    [`${P8051}PORT p1 = P1 OUTPUT\n${KEY8051}`, /inside the whole port "p1"/],
    [`${P8051}PART sr = 74HC595 data P1.0 clock P3.1 latch P3.2\n${KEY8051}`, /P1\.\d is already claimed by "sr"/],
    // PART KEYPAD4X4, board spelling
    ['DEVICE ARDUINO-UNO\nPART keys = KEYPAD4X4 ROWS D2 D3 D4 D5 COLS D6 D7 D8 D9', /KEYPAD4X4 with this pin syntax is for micro:bit/],
    [`DEVICE PICO\nPIN keys = GP9 OUTPUT\n${PICO_KEYS}`, /"keys" declared twice/],
    ['DEVICE PICO\nPART keys = KEYPAD4X4 ROWS P0 P1 P2 P3 COLS P4 P5 P6 P7', /"P0" is not a valid pin for pico/],
    ['DEVICE PICO\nPART keys = KEYPAD4X4 ROWS GP0 GP1 GP2 GP0 COLS GP4 GP5 GP6 GP7', /names the same pin twice; a 4x4 keypad/],
    [`DEVICE PICO\nPIN led = GP0 OUTPUT\n${PICO_KEYS}`, /GP0 is already declared as "led"/],
    [`DEVICE PICO\n${PICO_KEYS}\n${PICO_KEYS.replace('keys', 'k2').replace('GP1 ', 'GP8 ')}`, /GP0 is already claimed by "keys"/],
    // PART MATRIX8X8
    [`DEVICE ATMEGA328P\n${MATRIX}`, /MATRIX8X8 is not available on atmega328p/],
    [`${P8051}PIN screen = P1.0 OUTPUT\n${MATRIX}`, /"screen" declared twice/],
    [`${P8051}${MATRIX.replace('CLOCK P3.6', 'CLOCK P3.4')}`, /names the same pin twice; a MATRIX8X8/],
    [`${P8051}PIN stray = P3.4 OUTPUT\n${MATRIX}`, /P3\.4 is already declared as "stray"/],
    [`${P8051}PORT other = P0 OUTPUT\n${MATRIX}`, /inside the whole port "other"/],
    [`${P8051}PART sr = 74HC595 data P3.4 clock P1.1 latch P1.2\n${MATRIX}`, /P3\.4 is already claimed by "sr"/],
    // PART SEVENSEG8
    [`DEVICE ARDUINO-UNO\n${SEG}`, /SEVENSEG8 is not available on arduino-uno/],
    [`${P8051}PIN display = P1.0 OUTPUT\n${SEG}`, /"display" declared twice/],
    [`${P8051}${SEG.replace('P2.3', 'P2.2')}`, /names the same select pin twice/],
    [`${P8051}PIN sel = P2.2 OUTPUT\n${SEG}`, /P2\.2 is already declared as "sel"/],
    [`${P8051}PART sr = 74HC595 data P2.2 clock P1.1 latch P1.2\n${SEG}`, /P2\.2 is already claimed by "sr"/],
    [`${P8051}PORT p0 = P0 OUTPUT\n${SEG}`, /P0 is already declared as port "p0"/],
    // PART LEDBANK8
    ['DEVICE ARDUINO-UNO\nPART leds = LEDBANK8 ON P1', /LEDBANK8 is not available on arduino-uno/],
    [`${P8051}PIN leds = P3.0 OUTPUT\nPART leds = LEDBANK8 ON P1`, /"leds" declared twice/],
    // TABLE / LEDCUBE
    [`${P8051}TABLE t = 1, 2\nTABLE t = 3`, /Table "t" declared twice/],
    [`${P8051}TABLE t = 1, x, 3`, /"x" is not a constant/],
    [`${P8051}TABLE t = 1, 256`, /256 is outside 0–255/],
    [`${P8051}TABLE t = ,`, /Table "t" is empty/],
    [`${P8051}LEDCUBE 9`, /LEDCUBE size must be 2–8, got 9/],
    [`${P8051}LEDCUBE 4\nLEDCUBE 4`, /LEDCUBE declared twice/],
    // Pin-role PARTs (HCSR04 / DS18B20 / DS3231 / AT24C02 / I2C, 2026-10-05)
    ['PART s = HCSR04 TRIG P1.0', /HCSR04 is written TRIG <pin> ECHO <pin>/],
    ['DEVICE MICROBIT\nPART s = HCSR04 TRIG P0 ECHO P1', /HCSR04 is not available on microbit/],
    ['PIN s = P1.0 OUTPUT\nPART s = DS18B20 ON P1.1', /"s" declared twice/],
    ['PART s = HCSR04 TRIG P1.0 ECHO P1.0', /names the same pin twice/],
    ['PART t = DS18B20 ON D7', /is not how stc12c5a60s2 names a pin; it uses P<port>\.<bit>/],
    ['DEVICE ARDUINO-UNO\nPART t = DS18B20 ON P1.0', /is not how arduino-uno names a pin/],
    ['DEVICE ARDUINO-NANO\nPART t = DS18B20 ON A6', /analog-input only on the Nano/],
    ['PIN led = P1.0 OUTPUT\nPART t = DS18B20 ON P1.0', /already declared as "led"/],
    ['PART a = DS18B20 ON P1.0\nPART b = DS18B20 ON P1.0', /already claimed by "a"/],
];

/** The refusal of `decls` + a trivial script: exactly the last declaration line. */
function refusalOf(decls) {
    const src = `${decls}\nWHEN flag clicked:\n  wait 1 seconds\n`;
    try {
        new SB3Creator().parse(src);
    } catch (e) {
        if (e.code !== 'DIALECT_UNPARSED_LINES') throw e;
        return e;
    }
    assert.fail(`parsed without a refusal:\n${src}`);
}

test('every declaration the device cannot take is refused, naming the line and why', () => {
    for (const [decls, reason] of CASES) {
        const e = refusalOf(decls);
        const last = decls.split('\n').length;
        assert.deepEqual(e.lines.map((l) => [l.line, l.text]), [[last, decls.split('\n').pop()]], decls);
        assert.match(e.lines[0].reason, reason, decls);
        // …and nothing was left behind as a warning instead.
        assert.ok(!e.warnings.some((w) => reason.test(w)), `${decls}: still a warning too`);
    }
});

test('a declaration keyword no declaration form reads is refused as such', () => {
    for (const [decls, word] of [['PIN x = Q5 OUTPUT', 'PIN'], ['PORT p = P9 OUTPUT', 'PORT'],
        ['PART x = FLUXCAPACITOR', 'PART'], ['DEVICE', 'DEVICE'], ['CLOCK fast', 'CLOCK'],
        ['MAP RAM somewhere', 'MAP'], ['CHIP x = Z80PIO AT $10', 'CHIP']]) {
        const e = refusalOf(decls);
        assert.equal(e.lines[0].text, decls);
        assert.equal(e.lines[0].reason, `not a ${word} declaration this dialect reads`, decls);
    }
});

test('SHAPE / COSTUME / BACKDROP lines that cannot be applied are refused', () => {
    const sprite = (line) => `SPRITE Bird:\n  ${line}\n\nWHEN flag clicked:\n  say "hi"\n`;
    for (const [src, text, reason] of [
        [sprite('SHAPE hexagon 18'), 'SHAPE hexagon 18', /Unknown SHAPE "hexagon"/],
        ['STAGE:\n  SHAPE circle 10\nWHEN flag clicked:\n  say "hi"\n', 'SHAPE circle 10', /no effect on the Stage/],
    ]) {
        const e = refusalOf(src.replace(/\nWHEN flag clicked:\n {2}say "hi"\n$/, ''));
        assert.deepEqual(e.lines.map((l) => l.text), [text]);
        assert.match(e.lines[0].reason, reason);
    }
    // Unknown art is refused when the host registered art (the name is a typo);
    // with none registered the parse is headless and it stays a warning.
    SB3Creator.registerVectorArt({'demo/bird': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'});
    try {
        for (const line of ['SHAPE art nope/nope', 'COSTUME wing art nope/nope']) {
            const e = refusalOf(`SPRITE Bird:\n  ${line}`);
            assert.deepEqual(e.lines.map((l) => l.text), [line]);
            assert.match(e.lines[0].reason, /Unknown vector art "nope\/nope" \(1 registered\)/);
        }
        const e = refusalOf('BACKDROP sky art nope/nope');
        assert.deepEqual(e.lines.map((l) => l.text), ['BACKDROP sky art nope/nope']);
    } finally {
        SB3Creator.clearVectorArt();
    }
    const c = new SB3Creator();
    c.parse(sprite('SHAPE art demo/bird'));
    assert.match(c.warnings.join('\n'), /no art is registered/);
});

test('the advisory that keeps its line is still a warning, and the program builds', () => {
    const c = new SB3Creator();
    c.parse(`${SEG}\nPART leds = LEDBANK8 ON P2\nWHEN flag clicked:\n  wait 1 seconds\n`);
    assert.match(c.warnings.join('\n'), /shares a port with display's select pins/);
    assert.equal(c.project.stc.parts.length, 2);
});

test('the table drives every refuseDeclaration() call site (the whole set, from the source)', () => {
    const file = new URL('../src/utils/sb3Creator.js', import.meta.url);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const sites = new Set(lines.map((l, i) => (/\bthis\.refuseDeclaration\(lineIndex, trimmed,/.test(l) ? i + 1 : 0)).filter(Boolean));
    // counted 2026-09-30: 78 warn-and-skip sites in parseStcDeclaration became refusals.
    assert.ok(sites.size >= 78, `only ${sites.size} refuseDeclaration sites (counted 78 on 2026-09-30)`);
    const start = lines.findIndex((l) => /^ {4}parseStcDeclaration\(trimmed, lineIndex\) \{$/.test(l));
    let end = start;
    while (lines[end] !== '    }') end++;
    const body = lines.slice(start, end);
    // No warn-and-skip survives: the one warning left is the LEDBANK8 advisory.
    const warns = body.filter((l) => /this\.warn\(/.test(l));
    assert.equal(warns.length, 1, warns.join('\n'));
    assert.match(warns[0], /shares a port with/);
    const hit = new Set();
    const orig = SB3Creator.prototype.refuseDeclaration;
    SB3Creator.prototype.refuseDeclaration = function (...args) {
        const at = /sb3Creator\.js:(\d+):/.exec(new Error().stack.split('\n')[2]);
        if (at) hit.add(Number(at[1]));
        return orig.apply(this, args);
    };
    try {
        for (const [decls] of CASES) {
            try { refusalOf(decls); } catch { /* asserted above */ }
        }
    } finally {
        SB3Creator.prototype.refuseDeclaration = orig;
    }
    const missed = [...sites].filter((l) => !hit.has(l)).map((l) => `${l}: ${lines[l - 1].trim().slice(0, 140)}`);
    assert.deepEqual(missed, [], 'refuseDeclaration sites no CASES row drives');
});

test('the 8086 answers to the names Lite gives it', () => {
    // `DEVICE 8086` was an unknown device that silently parsed as the default
    // STC12; refused since D6, and Lite's export gate wrote it. It is the
    // 8086 (and the 8088, the same instruction set), by name.
    for (const name of ['8086', '8088', 'I8088', 'i8086']) {
        const c = new SB3Creator();
        c.parse(`DEVICE ${name}\nWHEN flag clicked:\n  say "ALPHA"\n`);
        assert.equal(c.project.stc.device, 'i8086', name);
    }
    assert.throws(() => new SB3Creator().parse('DEVICE 80286\nWHEN flag clicked:\n  say "x"\n'),
        (e) => e.code === 'DIALECT_UNPARSED_LINES' && /Unknown DEVICE "80286"/.test(e.lines[0].reason));
});
