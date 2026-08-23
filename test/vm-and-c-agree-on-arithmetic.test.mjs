/**
 * An expression must mean the same thing in the VM and on the device.
 *
 * THE DEFECT CLASS
 * ----------------
 * Brickwright arithmetic is Scratch arithmetic: `/` is real division and a
 * literal keeps its fractional part. The C emitter is integer-only — there is
 * no FPU on an 8051 — and it lowers `/` to C's truncating `/` and renders
 * every literal through `Math.trunc`. Neither is wrong on its own; together,
 * and silently, they let an example be CORRECT IN THE SIMULATOR AND DEAD ON
 * HARDWARE. Nothing warned, `bw check` passed, and the VM-execution gate is
 * satisfied because in the VM the arithmetic really does work.
 *
 * Five shipped that way, all found by this detector and all fixed:
 *
 *   arduino-01-read-analog-voltage  sensorValue * (5.0 / 1023)   -> * 0
 *   arduino-sk-p03-love-o-meter     sensorVal * (5.0 / 1024)     -> * 0,
 *                                   and (voltage - 0.5) truncated the offset
 *   avr02-dimmer                    read pot1 / 1023 * 100       -> 0% duty
 *                                   below full scale
 *   arduino-02-tone-pitch-follower  (1380 / 600)  -> 2, not 2.3
 *   arduino-05-switch-case          (reading / 1024) * 3         -> 0
 *
 * Executed rather than argued: compiled against gcc, the first four print or
 * drive 0 at every input but full scale, and the fifth is worse — its VM value
 * is a FRACTION (0.2988 at reading 102) matching none of the four `range = N`
 * branches, so it printed nothing in either target.
 *
 * THE RULE
 * --------
 * Two shapes, both narrow enough to be actionable and both purely mechanical:
 *
 *   1. A quotient that is then scaled — `(a / b) * c`. Integer division throws
 *      away the remainder BEFORE the multiply restores the scale, so the answer
 *      collapses. This is essentially never intended; writing the multiply
 *      first is always available and always equivalent in the VM.
 *   2. A fractional literal, which `Math.trunc` silently rounds. 0.5 becomes 0.
 *
 * A `wait <n> seconds` is exempt: it is lowered to whole milliseconds by a
 * different path and 0.05 s is a legitimate, faithfully emitted 50 ms.
 *
 * The two checks read different things, and that is not an accident.
 *
 * Shape 1 is read in the EMITTED C, because the source is where the intent
 * lives and the C is where the meaning changes: `5.0 / 1023` looks fine until
 * you see `(5 / 1023)`.
 *
 * Shape 2 has to be read in the SOURCE, and finding that out cost a mutation.
 * Reintroducing `(sensorVal - 0.5) * 100` left an emitted-C check GREEN — of
 * course it did: cNum had already turned the 0.5 into 0, so by the time the
 * value reaches the C there is nothing fractional left to find. A detector
 * looking for the evidence downstream of the thing that destroys it can never
 * fire.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const dirs = readdirSync(EXAMPLES)
    .filter(d => d !== 'AUDIT' && statSync(join(EXAMPLES, d)).isDirectory())
    .filter(d => existsSync(join(EXAMPLES, d, 'program.bw')))
    .sort();

/** The device C this example emits, or null if it does not target a device. */
function deviceC(dir) {
    const src = readFileSync(join(EXAMPLES, dir, 'program.bw'), 'utf8');
    const creator = new SB3Creator();
    let code;
    try { creator.parse(src); code = creator.generateC(); } catch { return null; }
    // No @bw marker means host C, which is a different reader and a different
    // arithmetic model; this gate is about the device targets.
    return /@bw-begin/.test(code) ? code : null;
}

/**
 * Statement lines of emitted C, with every comment removed — INCLUDING trailing
 * ones. A `/* 20 ms at 0.5 us ticks *\/` beside a statement is prose, and
 * counting its 0.5 as a truncated literal is a false red that would push a real
 * finding off the list.
 */
function statements(code) {
    return code.split('\n')
        .map(l => l.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/, '').trim())
        .filter(l => l && !l.startsWith('*') && !l.startsWith('/*'));
}

const QUOTIENT_THEN_SCALED = [
    /\)\s*\/\s*[0-9]+\s*\)\s*\*/,        // (… / 1024) *
    /\/\s*[0-9]+\s*\)\s*\*\s*[0-9(]/,    // … / 1023) * 100
    /\*\s*\(\s*[^()]*\/\s*[0-9]+\s*\)/,  // * (5 / 1023)
];
const FRACTIONAL_LITERAL = /(?<![\w.])\d+\.\d*[1-9]/;

/**
 * RATCHET: emitted lines whose divergence is understood and accepted, each
 * with the verdict. May only SHRINK. Empty — all five instances were rewritten
 * into integer-safe form rather than recorded here.
 */
const KNOWN_DIVERGENT = new Map([]);

describe('the VM and the emitted C agree on arithmetic', () => {
    const emitted = new Map(dirs.map(d => [d, deviceC(d)]));

    test('the instrument compiled a real corpus', () => {
        const targets = [...emitted.values()].filter(Boolean).length;
        assert.ok(dirs.length >= 250, `only ${dirs.length} programs found`);
        assert.ok(targets >= 100, `only ${targets} programs emit device C — generateC is not running`);
        // The detector must fire on a known-bad expression, or its regexes have
        // rotted and every assertion below is vacuous.
        const canary = new SB3Creator();
        canary.parse([
            'DEVICE ARDUINO-UNO', 'CLOCK 16000000', 'PIN pot = A0 ANALOG', '',
            'WHEN flag clicked:', '  set v to (read pot * (5.0 / 1023))', '  print v',
        ].join('\n'));
        const bad = statements(canary.generateC())
            .filter(l => QUOTIENT_THEN_SCALED.some(re => re.test(l)));
        assert.ok(bad.length, 'the quotient-then-scaled detector did not fire on a known-bad expression');
        assert.ok(FRACTIONAL_LITERAL.test('set temperature to ((v - 0.5) * 100)'),
            'the fractional-literal detector did not fire on a known-bad line');
        assert.ok(!FRACTIONAL_LITERAL.test('set millivolts to ((sensorValue * 5000) / 1023)'),
            'the fractional-literal detector fires on an integer-only line');
    });

    test('no emitted expression divides an integer and then scales the quotient', () => {
        const found = [];
        for (const [dir, code] of emitted) {
            if (!code) continue;
            for (const line of statements(code)) {
                if (!QUOTIENT_THEN_SCALED.some(re => re.test(line))) continue;
                if (KNOWN_DIVERGENT.get(dir)?.includes(line)) continue;
                found.push(`${dir}: ${line}`);
            }
        }
        assert.deepEqual(found.sort(), [],
            'Integer division discards the remainder before the multiply restores the scale, '
            + 'so the result collapses to 0 on the device while the VM, dividing in floating '
            + 'point, shows the right answer. Multiply first — it is equivalent in the VM and '
            + 'correct in C.');
    });

    test('no fractional literal is written where the emitter will truncate it', () => {
        const found = [];
        for (const [dir, code] of emitted) {
            if (!code) continue;   // not a device target; the VM keeps the fraction
            const src = readFileSync(join(EXAMPLES, dir, 'program.bw'), 'utf8');
            src.split('\n').forEach((raw, i) => {
                const line = raw.trim();
                if (!line || line.startsWith('#')) return;
                // `wait <n> seconds` is lowered to whole milliseconds by a
                // different path: 0.05 s is a faithfully emitted 50 ms.
                if (/^wait\s+[\d.]+\s+seconds?$/i.test(line)) return;
                if (!FRACTIONAL_LITERAL.test(line)) return;
                if (KNOWN_DIVERGENT.get(dir)?.includes(line)) return;
                found.push(`${dir}:${i + 1}: ${line}`);
            });
        }
        assert.deepEqual(found.sort(), [],
            'cNum renders every literal through Math.trunc, so a fractional constant is '
            + 'silently 0 or rounded down on the device while the VM keeps it. Scale the '
            + 'expression to whole units instead (millivolts, hundredths of a degree).');
    });

    test('KNOWN_DIVERGENT carries nothing that no longer reproduces', () => {
        const stale = [];
        for (const [dir, lines] of KNOWN_DIVERGENT) {
            const code = emitted.get(dir);
            if (!code) { stale.push(`${dir}: no longer emits device C`); continue; }
            const src = readFileSync(join(EXAMPLES, dir, 'program.bw'), 'utf8');
            const present = new Set([...statements(code), ...src.split('\n').map(l => l.trim())]);
            for (const l of lines) if (!present.has(l)) stale.push(`${dir}: "${l}" is gone`);
        }
        assert.deepEqual(stale, [], 'RATCHET: remove KNOWN_DIVERGENT entries that no longer reproduce.');
    });
});
