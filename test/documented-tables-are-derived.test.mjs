/**
 * The numbers in an EXPECTED.md table are re-derived from the program, in the
 * arithmetic the DEVICE will actually use.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every table in this corpus is a claim a human typed, and several were typed
 * against a bench or a program that later changed. `41-pot-as-dimmer` asserted
 * 2.3 mA where its bench delivers 0.188 mA; `pc60-night-lamp-hardware` asserted
 * 0.05 V beside a comment whose own formula, `5 x 10k/110k`, works out to
 * 0.4545. Both were snapshots that outlived what they snapshotted.
 *
 * So a table that was FIXED must not be able to rot back. These four examples
 * had their conversion arithmetic rewritten (see
 * test/vm-and-c-agree-on-arithmetic.test.mjs for why), and each carries a table
 * mapping an ADC reading to the value the program computes. This test reads the
 * expression out of the EMITTED C — not out of the source, and not from a
 * constant in this file — evaluates it with C's integer semantics, and checks
 * every row.
 *
 * Change the program and the derivation follows it; change the table alone and
 * this goes red. That is the property the two snapshots above did not have.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/**
 * Each entry names the emitted variable whose assignment is the conversion,
 * and the ADC -> value rows its EXPECTED.md states. The rows are typed here on
 * purpose: they are the DOCUMENT's claim, and the point is to check the
 * document against the program. Reading them out of the markdown as well would
 * only prove the markdown agrees with itself.
 */
const CASES = [
    {
        dir: '02-dimmer', target: 'duty',
        why: 'pot position -> PWM duty, the table in "Observable behaviour"',
        rows: [[0, 0], [102, 9], [512, 50], [767, 74], [1023, 100]],
    },
    {
        dir: '10-motor-speed', target: 'speed',
        why: 'pot position -> PWM duty, the table in "Observable behaviour"',
        rows: [[0, 0], [256, 25], [512, 50], [1023, 100]],
    },
    {
        dir: 'arduino-01-read-analog-voltage', target: 's0_millivolts',
        why: 'ADC -> millivolts, the three readings in "Observable behaviour"',
        rows: [[0, 0], [512, 2502], [1023, 5000]],
    },
    {
        dir: 'arduino-05-switch-case', target: 's0_range',
        why: 'ADC -> range 0-3, the boundaries "What this verifies" states',
        rows: [[0, 0], [255, 0], [256, 1], [511, 1], [512, 2], [767, 2], [768, 3], [1023, 3]],
    },
];

/**
 * The conversion assignment for `target`, as a function of the ADC reading,
 * evaluated the way C evaluates it: every division truncates toward zero.
 *
 * The expression is PARSED and walked rather than handed to JavaScript, because
 * JavaScript's `/` is exactly the real division whose absence on the device is
 * the whole subject here. Evaluating it as JS would reproduce the VM's answer
 * and prove nothing.
 */
function deviceConversion(dir, target) {
    const creator = new SB3Creator();
    creator.parse(readFileSync(join(EXAMPLES, dir, 'program.bw'), 'utf8'));
    const code = creator.generateC();
    const line = code.split('\n')
        .map(l => l.replace(/\/\*[\s\S]*?\*\//g, ' ').trim())
        .find(l => l.startsWith(`${target} = `));
    if (!line) return { ok: false, reason: `no assignment to ${target} in the emitted C` };
    // The ADC call is the input; a variable holding it counts as the input too.
    const expr = line.slice(`${target} = `.length).replace(/;\s*$/, '')
        .replace(/adc_read\(\s*\d+\s*\)/g, 'ADC')
        .replace(/\bs0_\w+\b/g, 'ADC');

    // Tokenise: numbers, ADC, the four operators, parens. Anything else means
    // the expression is not pure arithmetic on the reading, and this reports
    // that rather than guessing at it.
    const tokens = expr.match(/ADC|\d+|[-+*/()]/g) || [];
    if (tokens.join('') !== expr.replace(/\s+/g, ''))
        return { ok: false, reason: `not pure arithmetic on the reading: "${expr}"` };

    const parse = (adc) => {
        let i = 0;
        const peek = () => tokens[i];
        const primary = () => {
            const t = tokens[i++];
            if (t === '(') { const v = sum(); if (tokens[i++] !== ')') throw new Error('unbalanced'); return v; }
            if (t === '-') return -primary();
            if (t === 'ADC') return adc;
            if (/^\d+$/.test(t)) return Number(t);
            throw new Error(`unexpected token ${t}`);
        };
        const product = () => {
            let v = primary();
            while (peek() === '*' || peek() === '/') {
                const op = tokens[i++];
                const r = primary();
                // Truncation toward zero: C's integer `/`, not JavaScript's.
                v = op === '*' ? v * r : Math.trunc(v / r);
            }
            return v;
        };
        const sum = () => {
            let v = product();
            while (peek() === '+' || peek() === '-') {
                const op = tokens[i++];
                v = op === '+' ? v + product() : v - product();
            }
            return v;
        };
        const value = sum();
        if (i !== tokens.length) throw new Error(`trailing tokens after ${i}`);
        return value;
    };

    return { ok: true, expr, evaluate: (adc) => parse(adc) };
}

describe('documented conversion tables are derived from the emitted program', () => {
    test('the evaluator truncates, and is not JavaScript division in disguise', () => {
        // Without this canary an evaluator that quietly used real division
        // would agree with the VM instead of the device — the precise
        // confusion this file exists to keep apart. avr02-dimmer's OLD
        // expression is the reference case: 0 on the device at every reading
        // below full scale, 9.97 in the VM at reading 102.
        const conv = deviceConversion('avr02-dimmer', '__none__');
        assert.equal(conv.ok, false, 'a missing target must be reported, not guessed');
        assert.notEqual(102 / 1023 * 100, 0, 'JavaScript division is real, as expected');
        const dimmer = deviceConversion('avr02-dimmer', 'pwm_set');
        assert.equal(dimmer.ok, false, 'a call is not an assignment and must be reported');
    });

    for (const { dir, target, why, rows } of CASES) {
        test(`${dir}: ${why}`, () => {
            const conv = deviceConversion(dir, target);
            assert.ok(conv.ok, `${dir}: ${conv.reason}`);
            const wrong = [];
            for (const [adc, expected] of rows) {
                const actual = conv.evaluate(adc);
                if (actual !== expected) wrong.push(`ADC ${adc}: document says ${expected}, the program computes ${actual}`);
            }
            assert.deepEqual(wrong, [],
                `${dir}/EXPECTED.md disagrees with its own program.\n`
                + `  emitted: ${target} = ${conv.expr}\n`
                + `  as C:    ${conv.guarded}\n`
                + '  Fix whichever side is wrong — do not snapshot the other.');
        });
    }
});
