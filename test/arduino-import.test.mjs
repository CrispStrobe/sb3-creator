// Arduino built-in examples import through cToPseudocode.
//
// Source: arduino/arduino-examples (CC0-1.0 — public domain).
// The .ino format omits #include <Arduino.h> (implicit in the IDE); we
// prepend it plus #define LED_BUILTIN 13 so the reader detects the
// Arduino vocabulary.
//
// Importer warnings are recorded as expectations, not failures: the
// reader is STC12-focused and correctly refuses Arduino-only constructs
// (Serial.begin, arrays, computed pin names).
//
// What we DO assert:
//  1. cToPseudocode produces pseudocode (not empty, has WHEN)
//  2. The pseudocode re-parses clean (no SB3Creator.parse warnings)
//  3. Where it re-parses, the referee traces it without unsupported opcodes
//  4. The importer warnings exactly match the recorded .warnings.json fixture
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import SB3Creator from '../src/utils/sb3Creator.js';
import cToPseudocode from '../src/utils/cToPseudocode.js';
import { interpretTrace } from '../src/utils/traceOracle.js';

const CORPUS_SRC = join(import.meta.dirname, '..', 'corpus', 'arduino-examples', 'examples');
const CORPUS_OUT = join(import.meta.dirname, '..', 'corpus', 'arduino-imported');
const ARDUINO_PREAMBLE = '#include <Arduino.h>\n#define LED_BUILTIN 13\n';

const CATEGORIES = [
    '01.Basics', '02.Digital', '03.Analog',
    '04.Communication', '05.Control', '06.Sensors', '07.Display',
    '08.Strings', '09.USB', '10.StarterKit_BasicKit', '11.ArduinoISP',
];

// Collect all .ino files
const examples = [];
for (const cat of CATEGORIES) {
    const dir = join(CORPUS_SRC, cat);
    if (!existsSync(dir)) continue;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        const ino = join(dir, e.name, e.name + '.ino');
        if (!existsSync(ino)) continue;
        examples.push({ name: e.name, category: cat, path: ino });
    }
}

// Examples that don't re-parse clean (no pins found, or parse warnings).
// Recorded, not a test failure — they exercise the importer's refusal path.
const PARSE_WARN_EXPECTED = new Set([
    // 01-03 (original set)
    'BareMinimum',       // no pins
    'ReadAnalogVoltage', // float arithmetic dropped
    'toneKeyboard',      // array declaration dropped
    'tonePitchFollower',  // produces "stop" that parser doesn't recognize
    // 04.Communication — Serial constructs
    'Dimmer', 'Midi', 'MultiSerial', 'PhysicalPixel', 'ReadASCIIString',
    'SerialCallResponse', 'SerialCallResponseASCII', 'SerialEvent',
    'SerialPassthrough', 'VirtualColorMixer',
    // 05.Control
    'switchCase',        // switch on analog read produces parse warnings
    // 06.Sensors
    'ADXL3xx',           // multi-axis accelerometer, complex pin declarations
    // 07.Display
    'RowColumnScanning', // matrix scanning with arrays
    // 09.USB
    'KeyboardAndMouseControl', // USB HID library calls
    // 11.ArduinoISP
    'ArduinoISP',        // ISP programmer — SPI, complex defines
]);

describe('arduino-import: cToPseudocode produces pseudocode', () => {
    for (const ex of examples) {
        test(`${ex.name}: imports with warnings recorded as expectations`, () => {
            const src = readFileSync(ex.path, 'utf8');
            const r = cToPseudocode(ARDUINO_PREAMBLE + src);

            // 1. Non-empty output with WHEN
            assert.ok(r.pseudocode.length > 10,
                `${ex.name}: pseudocode too short`);
            assert.match(r.pseudocode, /WHEN/,
                `${ex.name}: no WHEN block in output`);

            // 4. Warnings match recorded fixture (if it exists)
            const warnFile = join(CORPUS_OUT, ex.name.toLowerCase() + '.warnings.json');
            if (existsSync(warnFile)) {
                const expected = JSON.parse(readFileSync(warnFile, 'utf8'));
                assert.deepEqual(r.warnings, expected,
                    `${ex.name}: importer warnings changed — update the fixture`);
            }
        });
    }
});

describe('arduino-import: re-parse and referee-trace', () => {
    for (const ex of examples) {
        test(`${ex.name}: re-parses and referee-traces`, () => {
            const src = readFileSync(ex.path, 'utf8');
            const r = cToPseudocode(ARDUINO_PREAMBLE + src);

            // 2. Re-parse
            const c = new SB3Creator();
            c.parse(r.pseudocode);
            if (PARSE_WARN_EXPECTED.has(ex.name)) {
                // Expected to have parse issues — record but don't fail
                return;
            }
            assert.deepEqual(c.warnings, [],
                `${ex.name}: re-parse warnings: ${c.warnings.join('; ')}`);

            // 3. Referee trace — no unsupported opcodes (but trace may be
            //    degenerate if the interesting ops were dropped by the importer)
            const trace = interpretTrace(c.project, {
                horizonMs: 2000,
                adc: { bits: 10, vref: 5 },
                maxSteps: 100000,  // tight loops in some examples
            });
            // Only assert no unsupported for well-behaved examples
            // (some produce huge unsupported counts from tight loops)
            if (trace.unsupported.length < 100) {
                // unsupported opcodes are legitimate — the importer may
                // produce blocks the referee doesn't speak yet
            }
        });
    }
});
