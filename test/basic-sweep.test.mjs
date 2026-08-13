/**
 * BASIC sweep: every gallery example + Scratch sample emits ok:true
 * from generateBASIC, or carries named degradations (warnings).
 *
 * The sweep also verifies that the emitted BASIC round-trips through
 * basicToPseudocode without errors (the reader may warn, but must not throw).
 *
 * Run: node --test test/basic-sweep.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import examples from '../src/utils/examples.js';
import basicToPseudocode from '../src/utils/basicToPseudocode.js';

const build = (src) => { const c = new SB3Creator(); c.parse(src); return c; };

const EXAMPLE_KEYS = Object.keys(examples);

describe('BASIC sweep: all gallery examples emit ok:true', () => {
    for (const key of EXAMPLE_KEYS) {
        test(`${key}: generateBASIC(structured) emits ok:true`, () => {
            const c = build(examples[key]);
            const r = c.generateBASIC(undefined, { lineNumbers: false });
            assert.ok(r.ok, `${key} failed: ${(r.reasons || []).join('; ')}`);
            assert.ok(r.basic.length > 0, 'non-empty output');
        });

        test(`${key}: generateBASIC(numbered) emits ok:true`, () => {
            const c = build(examples[key]);
            const r = c.generateBASIC(undefined, { lineNumbers: true });
            assert.ok(r.ok, `${key} failed: ${(r.reasons || []).join('; ')}`);
            assert.ok(r.basic.length > 0, 'non-empty output');
            // Numbered mode: every line starts with a number.
            for (const line of r.basic.trim().split('\n')) {
                assert.match(line, /^\d+\s/, `line should be numbered: ${line.slice(0, 60)}`);
            }
        });
    }
});

describe('BASIC sweep: structured output round-trips through basicToPseudocode', () => {
    for (const key of EXAMPLE_KEYS) {
        test(`${key}: BASIC → pseudocode does not throw`, () => {
            const c = build(examples[key]);
            const r = c.generateBASIC(undefined, { lineNumbers: false });
            if (!r.ok) return; // skip if generation itself failed
            const rb = basicToPseudocode(r.basic);
            assert.ok(rb.pseudocode.length > 0, 'non-empty pseudocode');
        });
    }
});

describe('BASIC sweep: numbered output round-trips through basicToPseudocode', () => {
    for (const key of EXAMPLE_KEYS) {
        test(`${key}: numbered BASIC → pseudocode does not throw`, () => {
            const c = build(examples[key]);
            const r = c.generateBASIC(undefined, { lineNumbers: true });
            if (!r.ok) return;
            const rb = basicToPseudocode(r.basic);
            assert.ok(rb.pseudocode.length > 0, 'non-empty pseudocode');
        });
    }
});

describe('BASIC sweep: degradations are named, not silent', () => {
    for (const key of EXAMPLE_KEYS) {
        test(`${key}: warnings describe what degraded`, () => {
            const c = build(examples[key]);
            const r = c.generateBASIC(undefined, { lineNumbers: false });
            if (!r.ok) return;
            // Every warning should be a string describing the degradation.
            for (const w of r.warnings) {
                assert.ok(typeof w === 'string' && w.length > 0, `warning should be a non-empty string: ${w}`);
            }
        });
    }
});

// ---- specific acceptance tests ----

describe('BASIC: say/think/ask emit PRINT/INPUT', () => {
    test('say emits PRINT', () => {
        const c = build('WHEN flag clicked:\n  say "hello"');
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('PRINT "hello"'));
    });

    test('ask emits PRINT + INPUT', () => {
        const c = build('WHEN flag clicked:\n  ask "name?" and wait\n  say answer');
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('PRINT "name?"'));
        assert.ok(r.basic.includes('INPUT answer$'));
    });
});

describe('BASIC: operator coverage', () => {
    test('join emits concatenation', () => {
        const c = build('WHEN flag clicked:\n  say "a" join "b"');
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('+'));
    });

    test('length emits LEN', () => {
        const c = build('WHEN flag clicked:\n  say length of "hello"');
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('LEN('));
    });

    test('letter of emits MID$', () => {
        const c = build('WHEN flag clicked:\n  say letter 1 of "hello"');
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('MID$('));
    });

    test('round emits INT+0.5', () => {
        const c = build('WHEN flag clicked:\n  set x to round 3.7');
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('INT('));
    });

    test('timer emits TIME/100', () => {
        const c = build('WHEN flag clicked:\n  set x to timer');
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('TIME/100'));
    });
});

describe('BASIC: pen blocks emit VDU path', () => {
    test('pen down/up emits bw_pen%', () => {
        const c = build('WHEN flag clicked:\n  pen down\n  pen up');
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('bw_pen%=TRUE'));
        assert.ok(r.basic.includes('bw_pen%=FALSE'));
    });

    test('clear emits CLG', () => {
        const c = build('WHEN flag clicked:\n  clear');
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('CLG'));
    });
});

describe('BASIC: motion blocks track x/y', () => {
    test('go to emits bw_x%/bw_y% + DRAW/MOVE', () => {
        const c = build('WHEN flag clicked:\n  go to x: 100 y: 50');
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('bw_x%=100'));
        assert.ok(r.basic.includes('bw_y%=50'));
        assert.ok(r.basic.includes('DRAW') || r.basic.includes('MOVE'));
    });
});

describe('BASIC: multi-WHEN serializes with warning', () => {
    test('two when-flag scripts serialize', () => {
        const src = 'WHEN flag clicked:\n  say "one"\n\nWHEN flag clicked:\n  say "two"';
        const c = build(src);
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('PRINT "one"'));
        assert.ok(r.basic.includes('PRINT "two"'));
        assert.ok(r.warnings.some((w) => /serial/i.test(w)));
    });
});

describe('BASIC: non-w65c02 pin ops soften to stubs', () => {
    test('STC12 pin ops become REM stubs', () => {
        const src = 'DEVICE STC12C5A60S2\nPIN led = P1.0 OUTPUT\n\nWHEN flag clicked:\n  turn on led';
        const c = build(src);
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        assert.ok(r.basic.includes('REM turn'));
        assert.ok(r.warnings.some((w) => /stub/i.test(w)));
    });
});

describe('BASIC: control_stop emits END/ENDPROC', () => {
    test('stop all emits END', () => {
        const c = build('WHEN flag clicked:\n  stop all');
        const r = c.generateBASIC(undefined, { lineNumbers: false });
        assert.ok(r.ok);
        // The basic should contain END (possibly multiple for the final one).
        assert.ok(r.basic.includes('END'));
    });
});
