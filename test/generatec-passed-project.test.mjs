// generateC(project) must equal generateC() — the passed-project calling
// convention is the ONLY one the app uses (the debug runner rebuilds the
// project from the VM and passes it explicitly).
//
// Eleven sites inside generateC read `this.project` instead of the
// `project` parameter, so a passed project fell back to the creator's
// default for pins/tables/parts/ledcube resolution. Found 2026-08-17 via
// the Pocket Calculator: the pico I2C pin lookup saw no sda/scl and
// SILENTLY emitted `#define I2C_SDA_HI() ((void)0)` — the firmware ran,
// scanned keys, computed sums, and bit-banged nothing; the in-app OLED
// stayed black while every headless test (calling generateC() bare)
// shipped real SIO writes and lit the panel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join } from 'path';
import SB3Creator from '../src/utils/sb3Creator.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

const CASES = [
    ['70-calculator', /0xd0000010/, 'pico SIO I2C macros'],
    ['74-ammeter', /BW_BIT\(PORT/, 'AVR I2C macros'],
];

for (const [name, marker, what] of CASES) {
    test(`${name}: generateC(project) emits ${what}, same as generateC()`, () => {
        const src = readFileSync(join(EXAMPLES, name, 'program.bw'), 'utf8');
        const c = new SB3Creator();
        c.parse(src);
        const bare = c.generateC(undefined, { debug: true });
        // The app's convention: a serialized copy, passed explicitly.
        const passed = c.generateC(JSON.parse(JSON.stringify(c.project)), { debug: true });
        assert.match(bare, marker, `bare call carries ${what}`);
        assert.match(passed, marker, `passed-project call carries ${what}`);
        assert.ok(!passed.includes('#define I2C_SDA_HI() ((void)0)'),
            'no silent I2C stub with a passed project');
        assert.equal(passed, bare, 'the two calling conventions emit identical C');
    });
}
